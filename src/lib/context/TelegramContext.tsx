'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getTelegramWebApp, IWebApp } from '@/lib/utils/telegram';

interface TelegramContextType {
    webApp: IWebApp | null;
    user: any;
    ready: boolean;
}

const TelegramContext = createContext<TelegramContextType>({
    webApp: null,
    user: null,
    ready: false,
});

export const useTelegram = () => useContext(TelegramContext);

export const TelegramProvider = ({ children }: { children: React.ReactNode }) => {
    const [webApp, setWebApp] = useState<IWebApp | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const app = getTelegramWebApp();
        if (app) {
            app.ready();
            app.expand();
            setWebApp(app);
            setReady(true);

            // Document Theme Sync
            document.documentElement.style.setProperty('--tg-theme-bg-color', app.themeParams.bg_color || '#121212');
            document.documentElement.style.setProperty('--tg-theme-text-color', app.themeParams.text_color || '#ffffff');
            document.documentElement.style.setProperty('--tg-theme-button-color', app.themeParams.button_color || '#3390ec');
            document.documentElement.style.setProperty('--tg-theme-button-text-color', app.themeParams.button_text_color || '#ffffff');
            document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', app.themeParams.secondary_bg_color || '#1E1E1E');
        }
    }, []);

    const value = {
        webApp,
        user: webApp?.initDataUnsafe?.user,
        ready,
    };

    return (
        <TelegramContext.Provider value={value}>
            {children}
        </TelegramContext.Provider>
    );
};
