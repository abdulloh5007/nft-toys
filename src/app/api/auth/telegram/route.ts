import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminAuth } from '@/lib/firebase/admin';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || '';

interface TelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    photo_url?: string;
}

// Verify Telegram initData signature
function verifyTelegramData(initData: string): { valid: boolean; user?: TelegramUser } {
    try {
        const params = new URLSearchParams(initData);
        const hash = params.get('hash');

        if (!hash) return { valid: false };

        // Remove hash from params
        params.delete('hash');

        // Sort params alphabetically
        const sortedParams = Array.from(params.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        // Create secret key
        const secretKey = crypto
            .createHmac('sha256', 'WebAppData')
            .update(BOT_TOKEN)
            .digest();

        // Calculate expected hash
        const expectedHash = crypto
            .createHmac('sha256', secretKey)
            .update(sortedParams)
            .digest('hex');

        if (hash !== expectedHash) {
            return { valid: false };
        }

        // Parse user data
        const userStr = params.get('user');
        if (!userStr) return { valid: false };

        const user = JSON.parse(userStr) as TelegramUser;
        return { valid: true, user };

    } catch (error) {
        console.error('Error verifying Telegram data:', error);
        return { valid: false };
    }
}

export async function POST(request: NextRequest) {
    // Rate limiting for auth (stricter - 10/min)
    const { authLimit } = await import('@/lib/middleware/rateLimit');
    const rateLimitResponse = authLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const body = await request.json();
        const { initData } = body;

        if (!initData) {
            return NextResponse.json(
                { error: 'initData is required' },
                { status: 400 }
            );
        }

        // Verify Telegram signature
        const verification = verifyTelegramData(initData);

        if (!verification.valid || !verification.user) {
            return NextResponse.json(
                { error: 'Invalid Telegram data', code: 'INVALID_SIGNATURE' },
                { status: 401 }
            );
        }

        const user = verification.user;
        const uid = `telegram_${user.id}`;

        // Create custom token
        const customToken = await adminAuth.createCustomToken(uid, {
            telegramId: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            username: user.username,
        });

        // Save/update user in Firestore
        const { db } = await import('@/lib/firebase/config');
        const { doc, setDoc, getDoc, serverTimestamp } = await import('firebase/firestore');

        const userRef = doc(db, 'users', uid);
        const existingUser = await getDoc(userRef);

        const userData = {
            telegramId: user.id,
            firstName: user.first_name,
            lastName: user.last_name || null,
            username: user.username || null,
            photoUrl: user.photo_url || null,
            languageCode: user.language_code || null,
            lastLoginAt: serverTimestamp(),
            ...(existingUser.exists() ? {} : { createdAt: serverTimestamp() })
        };

        await setDoc(userRef, userData, { merge: true });

        return NextResponse.json({
            success: true,
            token: customToken,
            user: {
                uid,
                telegramId: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                username: user.username,
                photoUrl: user.photo_url,
            }
        });

    } catch (error) {
        console.error('Auth error:', error);
        return NextResponse.json(
            { error: 'Authentication failed' },
            { status: 500 }
        );
    }
}
