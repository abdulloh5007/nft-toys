import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { PEPE_MODELS } from '@/lib/data/pepe_models';
import crypto from 'crypto';

// Secret key - must match create route
const TOKEN_SECRET = process.env.TOKEN_SECRET || '';

// Verify token with strong HMAC (must match create route)
// Supports both new format (base64url_timestamp_salt_signature) and legacy format (base64.timestamp.salt.signature)
function verifyToken(token: string): { valid: boolean; nfcId?: string } {
    if (!TOKEN_SECRET) {
        console.warn('⚠️ TOKEN_SECRET not set');
    }

    // Try new format first (underscore separator, base64url)
    const newFormatResult = verifyTokenNewFormat(token);
    if (newFormatResult.valid) {
        return newFormatResult;
    }

    // Fall back to legacy format (dot separator, base64)
    return verifyTokenLegacyFormat(token);
}

// New format: base64url(nfcId)_timestamp_salt_signature
function verifyTokenNewFormat(token: string): { valid: boolean; nfcId?: string } {
    try {
        const parts = token.split('_');
        if (parts.length < 4) return { valid: false };

        const signature = parts.pop()!;
        const salt = parts.pop()!;
        const timestamp = parts.pop()!;
        const nfcIdB64 = parts.join('_');

        const nfcId = Buffer.from(nfcIdB64, 'base64url').toString('utf-8');

        const expectedSignature = crypto
            .createHmac('sha256', TOKEN_SECRET)
            .update(`${nfcId}:${timestamp}:${salt}`)
            .digest('hex')
            .substring(0, 32);

        if (signature.length !== expectedSignature.length) return { valid: false };
        if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
            return { valid: false };
        }

        return { valid: true, nfcId };
    } catch {
        return { valid: false };
    }
}

// Legacy format: base64(nfcId).timestamp.salt.signature
function verifyTokenLegacyFormat(token: string): { valid: boolean; nfcId?: string } {
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
        const { token, userId, username } = body;

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
                usedBy: qrData.usedBy,
                usedByName: qrData.usedByName || null,
                usedByPhoto: qrData.usedByPhoto || null,
                usedByFirstName: qrData.usedByFirstName || null,
            }, { status: 409 });
        }

        // Mark as used - include more user data
        await updateDoc(qrRef, {
            status: 'used',
            usedAt: serverTimestamp(),
            usedBy: userId || 'anonymous',
            usedByName: username || null,
            usedByPhoto: body.userPhoto || null,
            usedByFirstName: body.firstName || null,
        });

        // ===== MINT NFT =====
        const { generateTokenId, generateContractAddress, signTransaction, generateTxHash } =
            await import('@/lib/utils/crypto');
        const { collection, addDoc, setDoc, arrayUnion } = await import('firebase/firestore');

        // Get user's wallet
        let userWallet = null;
        if (userId) {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                userWallet = userSnap.data().walletAddress;
            }
        }

        // Generate NFT token
        const tokenId = generateTokenId(qrData.modelName, qrData.serialNumber);
        const contractAddress = generateContractAddress(tokenId);
        const mintTimestamp = Date.now();

        // Create NFT document
        const nftRef = doc(db, 'nfts', tokenId);
        await setDoc(nftRef, {
            tokenId,
            contractAddress,
            ownerWallet: userWallet,
            ownerId: userId || null,
            modelName: qrData.modelName,
            serialNumber: qrData.serialNumber,
            rarity: qrData.rarity,
            tgsFile: qrData.tgsFile,
            qrCodeId: nfcId,
            mintedAt: serverTimestamp(),
            status: 'minted',
            metadata: {
                name: `${qrData.modelName} #${qrData.serialNumber}`,
                description: `NFT Toy - ${qrData.modelName} (${qrData.rarity})`,
                image: `/models/${qrData.tgsFile}`,
            },
            // Owner history for tracking all transfers
            ownerHistory: [{
                wallet: userWallet,
                userId: userId || null,
                type: 'mint',
                timestamp: mintTimestamp,
            }],
        });

        // Create mint transaction
        const txData = {
            type: 'mint' as const,
            from: null,
            to: userWallet || 'anonymous',
            tokenId,
            timestamp: mintTimestamp,
        };
        const txSignature = signTransaction(txData, TOKEN_SECRET);
        const txHash = generateTxHash('mint', null, userWallet || 'anonymous', tokenId, mintTimestamp);

        await addDoc(collection(db, 'transactions'), {
            txHash,
            type: 'mint',
            from: null,
            to: userWallet,
            toUserId: userId || null,
            tokenId,
            modelName: qrData.modelName,
            serialNumber: qrData.serialNumber,
            signature: txSignature,
            timestamp: serverTimestamp(),
            status: 'confirmed',
        });

        // Add NFT to user's wallet
        if (userWallet) {
            const walletRef = doc(db, 'wallets', userWallet);
            await updateDoc(walletRef, {
                nfts: arrayUnion(tokenId),
            });
        }

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
            nft: {
                tokenId,
                contractAddress,
                ownerWallet: userWallet,
                txHash,
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
