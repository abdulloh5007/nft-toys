import { NextRequest, NextResponse } from 'next/server';
import { generateWalletAddress, toFriendlyAddress } from '@/lib/utils/crypto';
import { db } from '@/lib/firebase/config';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { authLimit } from '@/lib/middleware/rateLimit';

export async function POST(request: NextRequest) {
    // Rate limiting
    const rateLimitResponse = authLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json(
                { error: 'userId is required', code: 'VALIDATION_ERROR' },
                { status: 400 }
            );
        }

        // Check if user already has a wallet
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists() && userDoc.data().walletAddress) {
            // Return existing wallet
            const data = userDoc.data();
            return NextResponse.json({
                success: true,
                wallet: {
                    address: data.walletAddress,
                    friendlyAddress: toFriendlyAddress(data.walletAddress),
                },
                existing: true,
            });
        }

        // Generate new wallet
        const wallet = generateWalletAddress();
        const friendlyAddress = toFriendlyAddress(wallet.address);

        // Save wallet to wallets collection
        const walletRef = doc(db, 'wallets', wallet.address);
        await setDoc(walletRef, {
            address: wallet.address,
            friendlyAddress,
            userId,
            addressHash: wallet.addressHash, // For verification only
            createdAt: serverTimestamp(),
            nfts: [],
            balance: 0,
        });

        // Update user with wallet address
        await setDoc(userRef, {
            walletAddress: wallet.address,
            walletFriendly: friendlyAddress,
        }, { merge: true });

        return NextResponse.json({
            success: true,
            wallet: {
                address: wallet.address,
                friendlyAddress,
            },
            existing: false,
        });

    } catch (error) {
        console.error('Wallet creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create wallet', code: 'WALLET_ERROR' },
            { status: 500 }
        );
    }
}
