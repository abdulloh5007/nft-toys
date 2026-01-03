import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { toFriendlyAddress } from '@/lib/utils/crypto';
import { standardLimit } from '@/lib/middleware/rateLimit';

export async function GET(request: NextRequest) {
    // Rate limiting
    const rateLimitResponse = standardLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'userId is required', code: 'VALIDATION_ERROR' },
                { status: 400 }
            );
        }

        // Get user
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return NextResponse.json(
                { error: 'User not found', code: 'NOT_FOUND' },
                { status: 404 }
            );
        }

        const userData = userSnap.data();
        const walletAddress = userData.walletAddress;

        if (!walletAddress) {
            return NextResponse.json(
                { error: 'User has no wallet', code: 'NO_WALLET' },
                { status: 404 }
            );
        }

        // Get wallet data
        const walletRef = doc(db, 'wallets', walletAddress);
        const walletSnap = await getDoc(walletRef);

        if (!walletSnap.exists()) {
            return NextResponse.json(
                { error: 'Wallet not found', code: 'WALLET_NOT_FOUND' },
                { status: 404 }
            );
        }

        const walletData = walletSnap.data();

        return NextResponse.json({
            success: true,
            wallet: {
                address: walletAddress,
                friendlyAddress: walletData.friendlyAddress || toFriendlyAddress(walletAddress),
                nftCount: walletData.nfts?.length || 0,
                balance: walletData.balance || 0,
                createdAt: walletData.createdAt?.seconds
                    ? new Date(walletData.createdAt.seconds * 1000).toISOString()
                    : null,
            }
        });

    } catch (error) {
        console.error('Error fetching wallet:', error);
        return NextResponse.json(
            { error: 'Failed to fetch wallet', code: 'FETCH_ERROR' },
            { status: 500 }
        );
    }
}
