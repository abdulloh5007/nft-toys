import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { PEPE_MODELS } from '@/lib/data/pepe_models';
import crypto from 'crypto';

// Secret key - must match create route
const TOKEN_SECRET = process.env.TOKEN_SECRET || '';

// Verify token with strong HMAC (must match create route)
function verifyToken(token: string): { valid: boolean; nfcId?: string } {
    if (!TOKEN_SECRET) {
        console.warn('⚠️ TOKEN_SECRET not set');
    }

    try {
        const parts = token.split('.');
        if (parts.length !== 4) return { valid: false };

        const [nfcIdB64, timestamp, salt, signature] = parts;
        const nfcId = Buffer.from(nfcIdB64, 'base64').toString('utf-8');

        const expectedSignature = crypto
            .createHmac('sha256', TOKEN_SECRET)
            .update(`${nfcId}:${timestamp}:${salt}`)
            .digest('hex')
            .substring(0, 32);

        // Timing-safe comparison to prevent timing attacks
        if (signature.length !== expectedSignature.length) return { valid: false };
        if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
            return { valid: false };
        }

        return { valid: true, nfcId };
    } catch {
        return { valid: false };
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token, userId } = body;

        // Validate input
        if (!token) {
            return NextResponse.json(
                { error: 'Token is required' },
                { status: 400 }
            );
        }

        // Verify token signature
        const verification = verifyToken(token);
        if (!verification.valid || !verification.nfcId) {
            return NextResponse.json(
                { error: 'Invalid token', code: 'INVALID_TOKEN' },
                { status: 401 }
            );
        }

        const nfcId = verification.nfcId;

        // Get QR code from Firestore
        const qrRef = doc(db, 'qrcodes', nfcId);
        const qrSnap = await getDoc(qrRef);

        if (!qrSnap.exists()) {
            // QR not in database - try to create from nfcId
            return NextResponse.json(
                { error: 'QR code not found', code: 'NOT_FOUND' },
                { status: 404 }
            );
        }

        const qrData = qrSnap.data();

        // Check if already used
        if (qrData.status === 'used') {
            return NextResponse.json({
                error: 'QR code already used',
                code: 'ALREADY_USED',
                usedAt: qrData.usedAt?.seconds
                    ? new Date(qrData.usedAt.seconds * 1000).toISOString()
                    : null,
                usedBy: qrData.usedBy
            }, { status: 409 });
        }

        // Mark as used
        await updateDoc(qrRef, {
            status: 'used',
            usedAt: serverTimestamp(),
            usedBy: userId || 'anonymous',
        });

        // Get model data
        const model = PEPE_MODELS.find(m => m.name === qrData.modelName);

        return NextResponse.json({
            success: true,
            toy: {
                id: nfcId,
                name: qrData.modelName,
                serialNumber: qrData.serialNumber,
                rarity: qrData.rarity,
                tgsFile: qrData.tgsFile,
                tgsUrl: `/models/${qrData.tgsFile}`,
            },
            activatedAt: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Error activating QR:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET - Check QR status without activating
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json(
                { error: 'Token is required' },
                { status: 400 }
            );
        }

        // Verify token
        const verification = verifyToken(token);
        if (!verification.valid || !verification.nfcId) {
            return NextResponse.json(
                { error: 'Invalid token', code: 'INVALID_TOKEN' },
                { status: 401 }
            );
        }

        const nfcId = verification.nfcId;

        // Get QR code from Firestore
        const qrRef = doc(db, 'qrcodes', nfcId);
        const qrSnap = await getDoc(qrRef);

        if (!qrSnap.exists()) {
            // Try to get toy data from nfcId
            const parts = nfcId.replace('nfc_', '').split('_');
            const serialNum = parts.pop() || '1';
            const nameSlug = parts.join('_');

            const model = PEPE_MODELS.find(m =>
                m.name.toLowerCase().replace(/\s/g, '_') === nameSlug
            );

            if (model) {
                return NextResponse.json({
                    status: 'available',
                    toy: {
                        id: nfcId,
                        name: model.name,
                        serialNumber: serialNum,
                        rarity: model.rarity,
                        tgsUrl: `/models/${model.tgsFile}`,
                    }
                });
            }

            return NextResponse.json(
                { error: 'QR code not found', code: 'NOT_FOUND' },
                { status: 404 }
            );
        }

        const qrData = qrSnap.data();

        return NextResponse.json({
            status: qrData.status,
            toy: {
                id: nfcId,
                name: qrData.modelName,
                serialNumber: qrData.serialNumber,
                rarity: qrData.rarity,
                tgsUrl: `/models/${qrData.tgsFile}`,
            },
            usedAt: qrData.usedAt?.seconds
                ? new Date(qrData.usedAt.seconds * 1000).toISOString()
                : null,
            usedBy: qrData.usedBy,
        });

    } catch (error) {
        console.error('Error checking QR:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
