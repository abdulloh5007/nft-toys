'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getTelegramWebApp, IWebApp } from '@/lib/utils/telegram';
import { auth } from '@/lib/firebase/config';
import { signInWithCustomToken, User, onAuthStateChanged } from 'firebase/auth';

interface TelegramContextType {
    webApp: IWebApp | null;
    user: any;
    firebaseUser: User | null;
    ready: boolean;
    isAuthenticated: boolean;
    // Haptic feedback helpers
    haptic: {
        impact: (style?: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
        success: () => void;
        error: () => void;
        warning: () => void;
        selection: () => void;
    };
}

const noopHaptic = {
    impact: () => { },
    success: () => { },
    error: () => { },
    warning: () => { },
    selection: () => { },
};

const TelegramContext = createContext<TelegramContextType>({
    webApp: null,
    user: null,
    firebaseUser: null,
    ready: false,
    isAuthenticated: false,
    haptic: noopHaptic,
});

export const useTelegram = () => useContext(TelegramContext);

export const TelegramProvider = ({ children }: { children: React.ReactNode }) => {
    const [webApp, setWebApp] = useState<IWebApp | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
    const [ready, setReady] = useState(false);
    const [authAttempted, setAuthAttempted] = useState(false);

    // Listen to Firebase auth state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setFirebaseUser(user);
        });
        return () => unsubscribe();
    }, []);

    // Initialize Telegram WebApp
    useEffect(() => {
        const app = getTelegramWebApp();
        if (app) {
            app.ready();
            app.expand();

            // Disable swipe-to-close gesture
            if (typeof app.disableVerticalSwipes === 'function') {
                app.disableVerticalSwipes();
            }

            // Enable closing confirmation dialog
            if (typeof app.enableClosingConfirmation === 'function') {
                app.enableClosingConfirmation();
            }

            setWebApp(app);
            setReady(true);

            // Document Theme Sync
            document.documentElement.style.setProperty('--tg-theme-bg-color', app.themeParams.bg_color || '#121212');
            document.documentElement.style.setProperty('--tg-theme-text-color', app.themeParams.text_color || '#ffffff');
            document.documentElement.style.setProperty('--tg-theme-button-color', app.themeParams.button_color || '#3390ec');
            document.documentElement.style.setProperty('--tg-theme-button-text-color', app.themeParams.button_text_color || '#ffffff');
            document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', app.themeParams.secondary_bg_color || '#1E1E1E');

            // Handle startapp deeplink parameter
            const startParam = app.initDataUnsafe?.start_param;
            if (startParam && startParam.startsWith('activate_')) {
                const token = startParam.replace('activate_', '');
                window.location.href = `/activate/${encodeURIComponent(token)}`;
            }
        }
    }, []);

    // State for extended user info (including wallet)
    const [extendedUser, setExtendedUser] = useState<any>(null);

    // Authenticate with Firebase when Telegram is ready
    useEffect(() => {
        const authenticateWithFirebase = async () => {
            if (!webApp?.initData || authAttempted || firebaseUser) return;

            setAuthAttempted(true);

            try {
                const response = await fetch('/api/auth/telegram', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ initData: webApp.initData }),
                });

                if (response.ok) {
                    const data = await response.json();
                    await signInWithCustomToken(auth, data.token);

                    // Store extended user info with wallet
                    setExtendedUser({
                        ...webApp.initDataUnsafe?.user,
                        walletAddress: data.user.walletAddress,
                        walletFriendly: data.user.walletFriendly,
                    });

                    console.log('✅ Firebase auth successful');
                } else {
                    console.warn('⚠️ Auth failed:', await response.text());
                }
            } catch (error) {
                console.error('Firebase auth error:', error);
            }
        };

        authenticateWithFirebase();
    }, [webApp, authAttempted, firebaseUser]);

    // Haptic feedback helpers
    const haptic = React.useMemo(() => ({
        impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
            webApp?.HapticFeedback?.impactOccurred(style);
        },
        success: () => {
            webApp?.HapticFeedback?.notificationOccurred('success');
        },
        error: () => {
            webApp?.HapticFeedback?.notificationOccurred('error');
        },
        warning: () => {
            webApp?.HapticFeedback?.notificationOccurred('warning');
        },
        selection: () => {
            webApp?.HapticFeedback?.selectionChanged();
        },
    }), [webApp]);

    const value = {
        webApp,
        user: extendedUser || webApp?.initDataUnsafe?.user,
        firebaseUser,
        ready,
        isAuthenticated: !!firebaseUser,
        haptic,
    };

    return (
        <TelegramContext.Provider value={value}>
            {children}
        </TelegramContext.Provider>
    );
};
