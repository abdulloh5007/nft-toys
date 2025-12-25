// Token Generation and Validation Service
// Uses simple base64 encoding with a signature for demo purposes
// In production, use proper JWT or server-side encryption

const SECRET_KEY = 'antigravity-secret-2024'; // Demo only - use env var in production

interface TokenPayload {
    toyId: string;
    nonce: string; // Random string for uniqueness
    timestamp: number;
    signature: string;
}

interface UsedTokenRecord {
    token: string;
    usedAt: string; // ISO date string
}

/**
 * Generate a simple hash for signing (demo only)
 */
function simpleHash(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}

/**
 * Generate a random nonce
 */
function generateNonce(): string {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
}

/**
 * Get used tokens storage
 */
function getUsedTokensStorage(): UsedTokenRecord[] {
    if (typeof window === 'undefined') return [];
    try {
        return JSON.parse(localStorage.getItem('usedTokens') || '[]');
    } catch {
        return [];
    }
}

/**
 * Check if token was already used (persisted in localStorage)
 */
function isTokenUsed(token: string): boolean {
    const usedTokens = getUsedTokensStorage();
    return usedTokens.some(t => t.token === token);
}

/**
 * Get when a token was used
 */
export function getTokenUsedTime(token: string): string | null {
    const usedTokens = getUsedTokensStorage();
    const record = usedTokens.find(t => t.token === token);
    return record?.usedAt || null;
}

/**
 * Mark token as used (persist in localStorage with timestamp)
 */
function markTokenUsed(token: string): void {
    if (typeof window === 'undefined') return;
    const usedTokens = getUsedTokensStorage();
    if (!usedTokens.some(t => t.token === token)) {
        usedTokens.push({
            token,
            usedAt: new Date().toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        });
        localStorage.setItem('usedTokens', JSON.stringify(usedTokens));
    }
}

/**
 * Generate an encrypted activation token for a toy
 */
export function generateToken(toyId: string): string {
    const nonce = generateNonce();
    const timestamp = Date.now();

    // Create signature
    const dataToSign = `${toyId}:${nonce}:${timestamp}:${SECRET_KEY}`;
    const signature = simpleHash(dataToSign);

    const payload: TokenPayload = {
        toyId,
        nonce,
        timestamp,
        signature
    };

    // Encode to base64
    const token = btoa(JSON.stringify(payload));
    return token;
}

/**
 * Decode and validate a token (STATELESS - just checks signature)
 * Returns the toyId if valid, null if invalid
 */
export function validateToken(token: string): { valid: boolean; toyId?: string; error?: string; usedAt?: string } {
    try {
        // Decode from base64
        const decoded = atob(token);
        const payload: TokenPayload = JSON.parse(decoded);

        // Verify signature
        const dataToSign = `${payload.toyId}:${payload.nonce}:${payload.timestamp}:${SECRET_KEY}`;
        const expectedSignature = simpleHash(dataToSign);

        if (payload.signature !== expectedSignature) {
            return { valid: false, error: 'invalid_signature' };
        }

        // Check if already used (from localStorage)
        if (isTokenUsed(token)) {
            const usedAt = getTokenUsedTime(token);
            return { valid: false, error: 'already_used', usedAt: usedAt || undefined };
        }

        // Token is valid
        return { valid: true, toyId: payload.toyId };

    } catch (e) {
        return { valid: false, error: 'invalid_format' };
    }
}

/**
 * Consume (mark as used) a token
 */
export function consumeToken(token: string, userId?: number): boolean {
    if (isTokenUsed(token)) {
        return false;
    }
    markTokenUsed(token);
    return true;
}

/**
 * Get token info without validating
 */
export function getTokenInfo(token: string): TokenPayload | null {
    try {
        const decoded = atob(token);
        return JSON.parse(decoded) as TokenPayload;
    } catch {
        return null;
    }
}
