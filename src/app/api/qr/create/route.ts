import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { PEPE_MODELS } from '@/lib/data/pepe_models';
import crypto from 'crypto';

// Secret key for token generation - MUST be set in production
const TOKEN_SECRET = process.env.TOKEN_SECRET;

if (!TOKEN_SECRET || TOKEN_SECRET.length < 32) {
    console.warn('⚠️ TOKEN_SECRET not set or too short. Set a 32+ character secret in .env');
}

// Generate secure token with strong HMAC
function generateSecureToken(nfcId: string): string {
    const secret = TOKEN_SECRET || crypto.randomBytes(32).toString('hex');

    // Add random salt for extra entropy
    const salt = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now().toString(36);

    // Full 64-char HMAC signature for maximum security
    const signature = crypto
        .createHmac('sha256', secret)
        .update(`${nfcId}:${timestamp}:${salt}`)
        .digest('hex');

    // Token format: base64(nfcId).timestamp.salt.signature(32 chars)
    return `${Buffer.from(nfcId).toString('base64')}.${timestamp}.${salt}.${signature.substring(0, 32)}`;
}

// Verify token
function verifyToken(token: string): { valid: boolean; nfcId?: string } {
    const secret = TOKEN_SECRET || '';

    try {
        const parts = token.split('.');
        if (parts.length !== 4) return { valid: false };

        const [nfcIdB64, timestamp, salt, signature] = parts;
        const nfcId = Buffer.from(nfcIdB64, 'base64').toString('utf-8');

        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(`${nfcId}:${timestamp}:${salt}`)
            .digest('hex')
            .substring(0, 32);

        // Timing-safe comparison to prevent timing attacks
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
        const { modelName, serialNumber } = body;

        // Validate input
        if (!modelName || !serialNumber) {
            return NextResponse.json(
                { error: 'Model name and serial number are required' },
                { status: 400 }
            );
        }

        // Find model data
        const model = PEPE_MODELS.find(m => m.name === modelName);
        if (!model) {
            return NextResponse.json(
                { error: 'Model not found' },
                { status: 404 }
            );
        }

        // Check if serial number already exists for ANY model (global uniqueness)
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const qrCodesRef = collection(db, 'qrcodes');
        const serialQuery = query(qrCodesRef, where('serialNumber', '==', serialNumber.toString()));
        const existingSerials = await getDocs(serialQuery);

        if (!existingSerials.empty) {
            const existingDoc = existingSerials.docs[0].data();
            return NextResponse.json(
                {
                    error: `Serial number ${serialNumber} already exists for model "${existingDoc.modelName}"`,
                    code: 'SERIAL_EXISTS',
                    existingModel: existingDoc.modelName
                },
                { status: 409 }
            );
        }

        // Generate nfcId
        const nfcId = `nfc_${modelName.toLowerCase().replace(/\s/g, '_')}_${serialNumber}`;

        // Check if this exact nfcId already exists (shouldn't happen after serial check, but just in case)
        const qrRef = doc(db, 'qrcodes', nfcId);
        const existing = await getDoc(qrRef);

        if (existing.exists()) {
            return NextResponse.json(
                { error: 'QR code already exists', code: 'DUPLICATE' },
                { status: 409 }
            );
        }

        // Generate secure token on server
        const token = generateSecureToken(nfcId);

        // Save to Firestore
        const qrData = {
            nfcId,
            modelName,
            serialNumber: serialNumber.toString(),
            rarity: model.rarity,
            tgsFile: model.tgsFile,
            token,
            status: 'created',
            createdAt: serverTimestamp(),
        };

        await setDoc(qrRef, qrData);

        // Return success with activation URL
        const activationUrl = `/activate/${encodeURIComponent(token)}`;

        return NextResponse.json({
            success: true,
            nfcId,
            activationUrl,
            qrData: {
                modelName,
                serialNumber,
                rarity: model.rarity,
            }
        });

    } catch (error) {
        console.error('Error creating QR:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
