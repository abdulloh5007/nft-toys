import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { TelegramProvider } from '@/lib/context/TelegramContext';
import { LanguageProvider } from '@/lib/context/LanguageContext';
import { Locale } from '@/lib/i18n';
import './globals.css';
import Script from 'next/script';

export const metadata: Metadata = {
    title: 'NFT Toys Platform',
    description: 'Premium NFT Toys Store on Telegram',
};

import { CookieConsent } from '@/components/layout/CookieConsent';

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const locale = (cookieStore.get('NEXT_LOCALE')?.value || 'en') as Locale;

    return (
        <html lang={locale} suppressHydrationWarning>
            <head>
                {/* Telegram Web App Script */}
                <Script
                    src="https://telegram.org/js/telegram-web-app.js"
                    strategy="beforeInteractive"
                />
            </head>
            <body suppressHydrationWarning>
                <TelegramProvider>
                    <LanguageProvider initialLocale={locale}>
                        <main className="app-container">
                            {children}
                        </main>
                        {/* <CookieConsent /> */}
                    </LanguageProvider>
                </TelegramProvider>
            </body>
        </html>
    );
}
