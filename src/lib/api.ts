/**
 * API Configuration
 * Centralized API endpoint configuration
 */

// API base URL - set to server URL in production
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Make API request
 */
export async function apiFetch<T = any>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
}

/**
 * API methods
 */
export const api = {
    // Auth
    auth: {
        telegram: (initData: string) =>
            apiFetch('/auth/telegram', {
                method: 'POST',
                body: JSON.stringify({ initData }),
            }),
    },

    // QR
    qr: {
        check: (token: string) =>
            apiFetch(`/qr/activate?token=${encodeURIComponent(token)}`),

        activate: (data: { token: string; userId?: string; username?: string; userPhoto?: string; firstName?: string }) =>
            apiFetch('/qr/activate', {
                method: 'POST',
                body: JSON.stringify(data),
            }),

        create: (data: { modelName: string; serialNumber: number }) =>
            apiFetch('/qr/create', {
                method: 'POST',
                body: JSON.stringify(data),
            }),

        delete: (nfcId: string) =>
            apiFetch(`/qr/delete?nfcId=${encodeURIComponent(nfcId)}`, {
                method: 'DELETE',
            }),

        list: () => apiFetch('/qr/list'),
    },

    // NFT
    nft: {
        get: (tokenId: string) => apiFetch(`/nft/${tokenId}`),

        my: (params: { userId?: string; wallet?: string }) => {
            const query = new URLSearchParams();
            if (params.userId) query.set('userId', params.userId);
            if (params.wallet) query.set('wallet', params.wallet);
            return apiFetch(`/nft/my?${query.toString()}`);
        },

        transfer: (data: { tokenId: string; fromUserId: string; toAddress?: string; toUsername?: string; initData?: string }) =>
            apiFetch('/nft/transfer', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
    },

    // Wallet
    wallet: {
        create: (userId: string) =>
            apiFetch('/wallet/create', {
                method: 'POST',
                body: JSON.stringify({ userId }),
            }),

        info: (userId: string) =>
            apiFetch(`/wallet/info?userId=${encodeURIComponent(userId)}`),
    },

    // Telegram
    telegram: {
        validate: (initData: string) =>
            apiFetch('/telegram/validate', {
                method: 'POST',
                body: JSON.stringify({ initData }),
            }),
    },
};

export default api;
