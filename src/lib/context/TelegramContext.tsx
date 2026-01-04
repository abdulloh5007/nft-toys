'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getTelegramWebApp, IWebApp } from '@/lib/utils/telegram';
import { auth } from '@/lib/firebase/config';
import { signInWithCustomToken, User, onAuthStateChanged } from 'firebase/auth';

const USER_CACHE_KEY = 'user_profile_cache';

// Helper to check if CloudStorage is available (requires TG WebApp 6.9+)
const isCloudStorageAvailable = (app: IWebApp | null): boolean => {
    if (!app) return false;
    // CloudStorage requires version 6.9 or higher
    const version = parseFloat(app.version || '0');
    return version >= 6.9 && !!app.CloudStorage;
};

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

    // State for extended user info (including wallet and photo_url)
    const [extendedUser, setExtendedUser] = useState<any>(null);

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
            // Only redirect if we're not already on the activate page and haven't processed this yet
            const startParam = app.initDataUnsafe?.start_param;
            if (startParam && startParam.startsWith('activate_')) {
                const token = startParam.replace('activate_', '');
                const targetPath = `/activate/${token}`; // Don't encode - token is already URL-safe

                // Use sessionStorage flag to prevent infinite redirect loops
                const redirectKey = `startapp_processed_${token.substring(0, 20)}`;
                const alreadyProcessed = sessionStorage.getItem(redirectKey);
                const alreadyOnPage = window.location.pathname.includes('/activate/');

                if (!alreadyProcessed && !alreadyOnPage) {
                    // Mark as processed before redirecting
                    sessionStorage.setItem(redirectKey, 'true');
                    console.log('🔗 Redirecting to activate page:', targetPath);
                    window.location.replace(targetPath); // Use replace to avoid history issues
                } else {
                    console.log('✅ Already on activate page or already processed');
                }
            }

            // Load cached user data from CloudStorage for instant profile display
            // Only works in Telegram WebApp 6.9+, silently skip in older versions or browser
            if (isCloudStorageAvailable(app)) {
                try {
                    app.CloudStorage.getItem(USER_CACHE_KEY, (error, value) => {
                        if (!error && value) {
                            try {
                                const cachedUser = JSON.parse(value);
                                // Only use cache if we don't have extended user yet
                                setExtendedUser((prev: any) => prev || cachedUser);
                                console.log('📦 Loaded cached user profile');
                            } catch (e) {
                                console.warn('Failed to parse cached user data');
                            }
                        }
                    });
                } catch (e) {
                    // CloudStorage not supported in this version, silently ignore
                    console.log('ℹ️ CloudStorage not available, skipping cache load');
                }
            }
        }
    }, []);

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

                    // Build extended user info with wallet and photo_url
                    const userInfo = {
                        ...webApp.initDataUnsafe?.user,
                        walletAddress: data.user.walletAddress,
                        walletFriendly: data.user.walletFriendly,
                        photo_url: data.user.photoUrl || webApp.initDataUnsafe?.user?.photo_url,
                    };

                    setExtendedUser(userInfo);

                    // Cache user data to CloudStorage for faster loading on next open
                    // Only works in Telegram WebApp 6.9+, silently skip in older versions or browser
                    if (isCloudStorageAvailable(webApp)) {
                        try {
                            webApp.CloudStorage.setItem(
                                USER_CACHE_KEY,
                                JSON.stringify(userInfo),
                                (error) => {
                                    if (error) {
                                        console.warn('Failed to cache user profile:', error);
                                    } else {
                                        console.log('💾 Cached user profile to CloudStorage');
                                    }
                                }
                            );
                        } catch (e) {
                            // CloudStorage not supported, silently ignore
                            console.log('ℹ️ CloudStorage not available, skipping cache save');
                        }
                    }

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
