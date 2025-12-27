/**
 * Crypto Utilities for Wallet and NFT System
 * Generates wallet addresses, token IDs, and transaction signatures
 */

import crypto from 'crypto';

// Address prefix
const ADDRESS_PREFIX = '0nt';
const NFT_PREFIX = 'NFT';

/**
 * Generate a new wallet address
 * Format: 0nt{64 hex chars}
 */
export function generateWalletAddress(): {
    address: string;
    privateKey: string;
    publicKey: string;
} {
    // Generate ECDSA keypair
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
        namedCurve: 'secp256k1',
        privateKeyEncoding: { type: 'pkcs8', format: 'der' },
        publicKeyEncoding: { type: 'spki', format: 'der' }
    });

    // Create address from public key hash
    const publicKeyHash = crypto
        .createHash('sha256')
        .update(publicKey)
        .digest('hex');

    const address = `${ADDRESS_PREFIX}${publicKeyHash}`;

    return {
        address,
        privateKey: privateKey.toString('hex'),
        publicKey: publicKey.toString('hex'),
    };
}

/**
 * Generate user-friendly address from raw address
 * Format: UZ-XXXX-XXXX (short, readable)
 */
export function toFriendlyAddress(rawAddress: string): string {
    if (!rawAddress.startsWith(ADDRESS_PREFIX)) {
        throw new Error('Invalid address format');
    }

    const hash = rawAddress.slice(ADDRESS_PREFIX.length);
    const short = hash.slice(0, 4).toUpperCase();
    const checksum = hash.slice(-4).toUpperCase();

    return `UZ-${short}-${checksum}`;
}

/**
 * Check if friendly address matches raw address
 */
export function matchesFriendlyAddress(rawAddress: string, friendlyAddress: string): boolean {
    try {
        return toFriendlyAddress(rawAddress) === friendlyAddress.toUpperCase();
    } catch {
        return false;
    }
}

/**
 * Generate unique NFT token ID
 * Format: NFT-{timestamp}-{hash}
 */
export function generateTokenId(
    modelName: string,
    serialNumber: number,
    salt?: string
): string {
    const timestamp = Date.now();
    const data = `${modelName}:${serialNumber}:${timestamp}:${salt || crypto.randomBytes(16).toString('hex')}`;

    const hash = crypto
        .createHash('sha256')
        .update(data)
        .digest('hex')
        .slice(0, 16);

    return `${NFT_PREFIX}-${timestamp}-${hash}`;
}

/**
 * Generate contract address for NFT (simulated)
 * Format: 0nt{hash}
 */
export function generateContractAddress(tokenId: string): string {
    const hash = crypto
        .createHash('sha256')
        .update(`contract:${tokenId}`)
        .digest('hex');

    return `${ADDRESS_PREFIX}${hash}`;
}

/**
 * Sign a transaction with server secret
 */
export function signTransaction(
    txData: {
        type: 'mint' | 'transfer';
        from: string | null;
        to: string;
        tokenId: string;
        timestamp: number;
    },
    secret: string
): string {
    const payload = JSON.stringify(txData);

    return crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
}

/**
 * Verify transaction signature
 */
export function verifyTransactionSignature(
    txData: {
        type: 'mint' | 'transfer';
        from: string | null;
        to: string;
        tokenId: string;
        timestamp: number;
    },
    signature: string,
    secret: string
): boolean {
    const expectedSignature = signTransaction(txData, secret);

    return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
    );
}

/**
 * Generate transaction hash
 */
export function generateTxHash(
    type: string,
    from: string | null,
    to: string,
    tokenId: string,
    timestamp: number
): string {
    const data = `${type}:${from || 'null'}:${to}:${tokenId}:${timestamp}`;

    return `0x${crypto.createHash('sha256').update(data).digest('hex')}`;
}

/**
 * Validate address format
 */
export function isValidAddress(address: string): boolean {
    if (!address.startsWith(ADDRESS_PREFIX)) return false;
    const hash = address.slice(ADDRESS_PREFIX.length);
    return /^[a-f0-9]{64}$/i.test(hash);
}

/**
 * Validate token ID format
 */
export function isValidTokenId(tokenId: string): boolean {
    return /^NFT-\d+-[a-f0-9]{16}$/i.test(tokenId);
}
