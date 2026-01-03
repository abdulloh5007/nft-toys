import { NextRequest, NextResponse } from 'next/server';
import { validateTelegramInitData } from '@/lib/utils/telegramValidation';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { initData } = body;

        if (!initData) {
            return NextResponse.json(
                { valid: false, error: 'initData is required' },
                { status: 400 }
            );
        }

        const result = validateTelegramInitData(initData);

        if (!result.valid) {
            return NextResponse.json(
                { valid: false, error: result.error },
                { status: 401 }
            );
        }

        return NextResponse.json({
            valid: true,
            user: result.user,
            auth_date: result.auth_date,
        });

    } catch (error) {
        console.error('Telegram validation error:', error);
        return NextResponse.json(
            { valid: false, error: 'Server error' },
            { status: 500 }
        );
    }
}
