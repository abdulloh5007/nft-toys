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

    // Sync with Telegram User ONLY if no specific preference was provided/persisted (simplification)
    // Actually, to respect "Previously Selected", we should trust initialLocale if it came from a cookie.
    // If initialLocale is default 'en' AND we have no cookie, then we might want to use Telegram.
    // But for now, let's prioritize the explicit setLocale.

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
