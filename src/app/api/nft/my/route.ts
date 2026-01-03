import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { standardLimit } from '@/lib/middleware/rateLimit';

export async function GET(request: NextRequest) {
    // Rate limiting
    const rateLimitResponse = standardLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const walletAddress = searchParams.get('wallet');

        if (!userId && !walletAddress) {
            return NextResponse.json(
                { error: 'userId or wallet is required', code: 'VALIDATION_ERROR' },
                { status: 400 }
            );
        }

        // Query NFTs by owner
        const nftsRef = collection(db, 'nfts');
        let q;

        if (walletAddress) {
            q = query(nftsRef, where('ownerWallet', '==', walletAddress));
        } else {
            q = query(nftsRef, where('ownerId', '==', userId));
        }

        const querySnap = await getDocs(q);

        const nfts = querySnap.docs.map(doc => {
            const data = doc.data();
            return {
                tokenId: data.tokenId,
                contractAddress: data.contractAddress,
                modelName: data.modelName,
                serialNumber: data.serialNumber,
                rarity: data.rarity,
                tgsFile: data.tgsFile,
                tgsUrl: `/models/${data.tgsFile}`,
                mintedAt: data.mintedAt?.seconds
                    ? new Date(data.mintedAt.seconds * 1000).toISOString()
                    : null,
                metadata: data.metadata,
            };
        });

        // Sort by rarity (legendary first)
        const rarityOrder = { legendary: 0, rare: 1, common: 2 };
        nfts.sort((a, b) => {
            const orderA = rarityOrder[a.rarity as keyof typeof rarityOrder] ?? 3;
            const orderB = rarityOrder[b.rarity as keyof typeof rarityOrder] ?? 3;
            return orderA - orderB;
        });

        return NextResponse.json({
            success: true,
            count: nfts.length,
            nfts,
        });

    } catch (error) {
        console.error('Error fetching NFTs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch NFTs', code: 'FETCH_ERROR' },
            { status: 500 }
        );
    }
}
