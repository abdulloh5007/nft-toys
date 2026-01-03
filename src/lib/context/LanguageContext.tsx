'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { translations, Locale, TranslationKey } from '@/lib/i18n';
import { useTelegram } from './TelegramContext';

export type { Locale };

const STORAGE_KEY = 'user_locale';

interface LanguageContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: TranslationKey) => string;
    isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
    locale: 'en',
    setLocale: () => { },
    t: (key) => key,
    isLoading: true,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children, initialLocale = 'en' }: { children: React.ReactNode; initialLocale?: Locale }) => {
    const { webApp, user } = useTelegram();
    const [locale, setLocalState] = useState<Locale>(initialLocale);
    const [isLoading, setIsLoading] = useState(true);

    // Load saved language from Telegram CloudStorage on mount
    useEffect(() => {
        const loadSavedLocale = () => {
            // Only use CloudStorage if we're in real Telegram (has initData)
            const isRealTelegram = webApp?.initData && webApp.initData.length > 0;

            if (!isRealTelegram || !webApp?.CloudStorage) {
                // Not in Telegram or no CloudStorage - use localStorage only
                try {
                    const saved = localStorage.getItem(STORAGE_KEY);
                    if (saved && ['en', 'ru', 'uz'].includes(saved)) {
                        setLocalState(saved as Locale);
                    } else if (user?.language_code) {
                        const tgLang = user.language_code.toLowerCase();
                        if (['en', 'ru', 'uz'].includes(tgLang)) {
                            setLocalState(tgLang as Locale);
                        }
                    }
                } catch {
                    // localStorage might not be available
                }
                setIsLoading(false);
                return;
            }

            // Use Telegram CloudStorage (only in real Telegram)
            webApp.CloudStorage.getItem(STORAGE_KEY, (error, value) => {
                if (error) {
                    console.warn('CloudStorage getItem error:', error);
                    setIsLoading(false);
                    return;
                }

                if (value && ['en', 'ru', 'uz'].includes(value)) {
                    setLocalState(value as Locale);
                } else if (user?.language_code) {
                    // First time: auto-detect from Telegram user language
                    const tgLang = user.language_code.toLowerCase();
                    if (['en', 'ru', 'uz'].includes(tgLang)) {
                        setLocalState(tgLang as Locale);
                        // Save the detected language
                        webApp.CloudStorage.setItem(STORAGE_KEY, tgLang);
                    }
                }
                setIsLoading(false);
            });
        };

        loadSavedLocale();
    }, [webApp, user]);

    // Save language to CloudStorage when changed
    const setLocale = useCallback((newLocale: Locale) => {
        setLocalState(newLocale);

        // Save to Telegram CloudStorage (only in real Telegram)
        const isRealTelegram = webApp?.initData && webApp.initData.length > 0;
        if (isRealTelegram && webApp?.CloudStorage) {
            webApp.CloudStorage.setItem(STORAGE_KEY, newLocale, (error) => {
                if (error) {
                    console.warn('CloudStorage setItem error:', error);
                }
            });
        }

        // Also save to localStorage as fallback
        try {
            localStorage.setItem(STORAGE_KEY, newLocale);
        } catch {
            // localStorage might not be available
        }
    }, [webApp]);

    const t = useCallback((key: TranslationKey) => {
        return translations[locale][key] || translations['en'][key] || key;
    }, [locale]);

    return (
        <LanguageContext.Provider value={{ locale, setLocale, t, isLoading }}>
            {children}
        </LanguageContext.Provider>
    );
};
