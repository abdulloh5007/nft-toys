'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { translations, Locale } from '@/lib/i18n';
import { useTelegram } from './TelegramContext';

interface LanguageContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: keyof typeof translations['en']) => string;
}

const LanguageContext = createContext<LanguageContextType>({
    locale: 'en',
    setLocale: () => { },
    t: (key) => key,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children, initialLocale = 'en' }: { children: React.ReactNode; initialLocale?: Locale }) => {
    const { user } = useTelegram();
    const [locale, setLocalState] = useState<Locale>(initialLocale);
    const [isInitialized, setIsInitialized] = useState(false);

    // Auto-detect language from Telegram on first load (only if no cookie is set)
    useEffect(() => {
        if (isInitialized) return;

        // Check if user already has a preference cookie
        const hasPreference = document.cookie.includes('NEXT_LOCALE=');

        if (!hasPreference && user?.language_code) {
            const tgLang = user.language_code.toLowerCase();
            // Check if Telegram language is supported
            const supportedLocales: Locale[] = ['en', 'ru', 'uz'];
            if (supportedLocales.includes(tgLang as Locale)) {
                setLocalState(tgLang as Locale);
            }
        }

        setIsInitialized(true);
    }, [user, isInitialized]);

    const setLocale = (newLocale: Locale) => {
        setLocalState(newLocale);
        // Set cookie for 1 year
        document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    };

    const t = (key: keyof typeof translations['en']) => {
        return translations[locale][key] || translations['en'][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </LanguageContext.Provider>
    );
};
