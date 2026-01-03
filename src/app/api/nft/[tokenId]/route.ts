import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { toFriendlyAddress } from '@/lib/utils/crypto';
import { standardLimit } from '@/lib/middleware/rateLimit';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ tokenId: string }> }
) {
    // Rate limiting
    const rateLimitResponse = standardLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const { tokenId } = await params;

        if (!tokenId) {
            return NextResponse.json(
                { error: 'tokenId is required', code: 'VALIDATION_ERROR' },
                { status: 400 }
            );
        }

        // Get NFT
        const nftRef = doc(db, 'nfts', tokenId);
        const nftSnap = await getDoc(nftRef);

        if (!nftSnap.exists()) {
            return NextResponse.json(
                { error: 'NFT not found', code: 'NOT_FOUND' },
                { status: 404 }
            );
        }

        const nftData = nftSnap.data();

        // Get owner info
        let ownerInfo = null;
        if (nftData.ownerId) {
            const userRef = doc(db, 'users', nftData.ownerId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const userData = userSnap.data();
                ownerInfo = {
                    username: userData.username,
                    firstName: userData.firstName,
                    photoUrl: userData.photoUrl,
                };
            }
        }

        // Format owner history
        const ownerHistory = (nftData.ownerHistory || []).map((entry: any) => ({
            ...entry,
            friendlyAddress: entry.wallet ? toFriendlyAddress(entry.wallet) : null,
            date: entry.timestamp ? new Date(entry.timestamp).toISOString() : null,
        }));

        return NextResponse.json({
            success: true,
            nft: {
                tokenId: nftData.tokenId,
                contractAddress: nftData.contractAddress,
                modelName: nftData.modelName,
                serialNumber: nftData.serialNumber,
                rarity: nftData.rarity,
                tgsFile: nftData.tgsFile,
                tgsUrl: `/models/${nftData.tgsFile}`,
                status: nftData.status,
                mintedAt: nftData.mintedAt?.seconds
                    ? new Date(nftData.mintedAt.seconds * 1000).toISOString()
                    : null,
                metadata: nftData.metadata,
                owner: {
                    wallet: nftData.ownerWallet,
                    friendlyAddress: nftData.ownerWallet ? toFriendlyAddress(nftData.ownerWallet) : null,
                    ...ownerInfo,
                },
                ownerHistory,
            }
        });

    } catch (error) {
        console.error('Error fetching NFT:', error);
        return NextResponse.json(
            { error: 'Failed to fetch NFT', code: 'FETCH_ERROR' },
            { status: 500 }
        );
    }
}
