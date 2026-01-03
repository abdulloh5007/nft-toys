import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
import { signTransaction, generateTxHash, isValidAddress, matchesFriendlyAddress } from '@/lib/utils/crypto';
import { strictLimit } from '@/lib/middleware/rateLimit';
import { csrfProtection } from '@/lib/middleware/csrfProtection';

const TOKEN_SECRET = process.env.TOKEN_SECRET || '';

export async function POST(request: NextRequest) {
    // Rate limiting
    const rateLimitResponse = strictLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const body = await request.json();
        const { tokenId, fromUserId, toAddress, toUsername, initData } = body;

        // CSRF Protection: validate Origin and initData
        const csrfError = csrfProtection(request, initData);
        if (csrfError) return csrfError;

        // Validate input
        if (!tokenId) {
            return NextResponse.json(
                { error: 'tokenId is required', code: 'VALIDATION_ERROR' },
                { status: 400 }
            );
        }

        if (!fromUserId) {
            return NextResponse.json(
                { error: 'fromUserId is required', code: 'VALIDATION_ERROR' },
                { status: 400 }
            );
        }

        if (!toAddress && !toUsername) {
            return NextResponse.json(
                { error: 'Either toAddress or toUsername is required', code: 'VALIDATION_ERROR' },
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

        // Verify sender owns the NFT
        if (nftData.ownerId !== fromUserId) {
            return NextResponse.json(
                { error: 'You do not own this NFT', code: 'UNAUTHORIZED' },
                { status: 403 }
            );
        }

        // Find recipient
        let recipientWallet: string | null = null;
        let recipientUserId: string | null = null;

        if (toUsername) {
            // Find by Telegram username
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('username', '==', toUsername.replace('@', '')));
            const querySnap = await getDocs(q);

            if (querySnap.empty) {
                return NextResponse.json(
                    { error: 'User not found', code: 'RECIPIENT_NOT_FOUND' },
                    { status: 404 }
                );
            }

            const recipientData = querySnap.docs[0].data();
            recipientUserId = querySnap.docs[0].id;
            recipientWallet = recipientData.walletAddress;
        } else if (toAddress) {
            // Find by wallet address
            let walletAddress = toAddress;

            // Check if friendly address format (UZ-XXXX-XXXX)
            if (toAddress.startsWith('UZ-')) {
                // Find raw address by friendly
                const walletsRef = collection(db, 'wallets');
                const q = query(walletsRef, where('friendlyAddress', '==', toAddress.toUpperCase()));
                const querySnap = await getDocs(q);

                if (querySnap.empty) {
                    return NextResponse.json(
                        { error: 'Wallet not found', code: 'RECIPIENT_NOT_FOUND' },
                        { status: 404 }
                    );
                }

                walletAddress = querySnap.docs[0].id;
            }

            // Validate address format
            if (!isValidAddress(walletAddress)) {
                return NextResponse.json(
                    { error: 'Invalid wallet address format', code: 'INVALID_ADDRESS' },
                    { status: 400 }
                );
            }

            // Get wallet
            const walletRef = doc(db, 'wallets', walletAddress);
            const walletSnap = await getDoc(walletRef);

            if (!walletSnap.exists()) {
                return NextResponse.json(
                    { error: 'Wallet not found', code: 'RECIPIENT_NOT_FOUND' },
                    { status: 404 }
                );
            }

            recipientWallet = walletAddress;
            recipientUserId = walletSnap.data().userId;
        }

        if (!recipientWallet) {
            return NextResponse.json(
                { error: 'Could not find recipient wallet', code: 'RECIPIENT_NOT_FOUND' },
                { status: 404 }
            );
        }

        // Prevent self-transfer
        if (recipientWallet === nftData.ownerWallet) {
            return NextResponse.json(
                { error: 'Cannot transfer to yourself', code: 'SELF_TRANSFER' },
                { status: 400 }
            );
        }

        const transferTimestamp = Date.now();

        // Create signed transaction
        const txData = {
            type: 'transfer' as const,
            from: nftData.ownerWallet,
            to: recipientWallet,
            tokenId,
            timestamp: transferTimestamp,
        };
        const txSignature = signTransaction(txData, TOKEN_SECRET);
        const txHash = generateTxHash('transfer', nftData.ownerWallet, recipientWallet, tokenId, transferTimestamp);

        // Update NFT owner and add to history
        await updateDoc(nftRef, {
            ownerWallet: recipientWallet,
            ownerId: recipientUserId,
            lastTransferAt: serverTimestamp(),
            ownerHistory: arrayUnion({
                wallet: recipientWallet,
                userId: recipientUserId,
                type: 'transfer',
                fromWallet: nftData.ownerWallet,
                timestamp: transferTimestamp,
            }),
        });

        // Remove from sender's wallet
        if (nftData.ownerWallet) {
            const senderWalletRef = doc(db, 'wallets', nftData.ownerWallet);
            await updateDoc(senderWalletRef, {
                nfts: arrayRemove(tokenId),
            });
        }

        // Add to recipient's wallet
        const recipientWalletRef = doc(db, 'wallets', recipientWallet);
        await updateDoc(recipientWalletRef, {
            nfts: arrayUnion(tokenId),
        });

        // Record transaction
        await addDoc(collection(db, 'transactions'), {
            txHash,
            type: 'transfer',
            from: nftData.ownerWallet,
            fromUserId,
            to: recipientWallet,
            toUserId: recipientUserId,
            tokenId,
            modelName: nftData.modelName,
            serialNumber: nftData.serialNumber,
            signature: txSignature,
            timestamp: serverTimestamp(),
            status: 'confirmed',
        });

        return NextResponse.json({
            success: true,
            transfer: {
                txHash,
                tokenId,
                from: nftData.ownerWallet,
                to: recipientWallet,
                timestamp: new Date(transferTimestamp).toISOString(),
            }
        });

    } catch (error) {
        console.error('Transfer error:', error);
        return NextResponse.json(
            { error: 'Transfer failed', code: 'TRANSFER_ERROR' },
            { status: 500 }
        );
    }
}
