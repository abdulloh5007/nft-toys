'use client';

import { TelegramProvider } from '@/lib/context/TelegramContext';
import { LanguageProvider } from '@/lib/context/LanguageContext';
import { AnimationProvider } from '@/lib/context/AnimationContext';
import { TelegramGuard } from '@/components/features/TelegramGuard';
import { Locale } from '@/lib/i18n';

interface ClientProvidersProps {
    children: React.ReactNode;
    initialLocale: Locale;
}

export const ClientProviders = ({ children, initialLocale }: ClientProvidersProps) => {
    return (
        <TelegramProvider>
            <LanguageProvider initialLocale={initialLocale}>
                <AnimationProvider>
                    <TelegramGuard>
                        <main className="app-container">
                            {children}
                        </main>
                    </TelegramGuard>
                </AnimationProvider>
            </LanguageProvider>
        </TelegramProvider>
    );
};
