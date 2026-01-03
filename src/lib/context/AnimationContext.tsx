'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTelegram } from './TelegramContext';

const ANIMATION_STORAGE_KEY = 'animations_enabled';

interface AnimationContextType {
    animationsEnabled: boolean;
    setAnimationsEnabled: (enabled: boolean) => void;
    isLoading: boolean;
}

const AnimationContext = createContext<AnimationContextType>({
    animationsEnabled: true,
    setAnimationsEnabled: () => { },
    isLoading: true,
});

export const useAnimations = () => useContext(AnimationContext);

export const AnimationProvider = ({ children }: { children: React.ReactNode }) => {
    const { webApp } = useTelegram();
    const [animationsEnabled, setAnimationsEnabledState] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    // Load from CloudStorage on mount
    useEffect(() => {
        try {
            if (webApp?.CloudStorage) {
                webApp.CloudStorage.getItem(ANIMATION_STORAGE_KEY, (err, value) => {
                    if (!err && value !== undefined && value !== null && value !== '') {
                        setAnimationsEnabledState(value === 'true');
                    }
                    setIsLoading(false);
                });
            } else {
                // No CloudStorage available (browser), use default
                setIsLoading(false);
            }
        } catch (error) {
            console.warn('CloudStorage not available:', error);
            setIsLoading(false);
        }
    }, [webApp]);

    const setAnimationsEnabled = (enabled: boolean) => {
        setAnimationsEnabledState(enabled);

        // Save to CloudStorage (if available)
        try {
            if (webApp?.CloudStorage) {
                webApp.CloudStorage.setItem(ANIMATION_STORAGE_KEY, String(enabled));
            }
        } catch (error) {
            console.warn('Failed to save to CloudStorage:', error);
        }

        // Dispatch event for immediate update of all TgsPlayers
        window.dispatchEvent(new CustomEvent('animationsToggle', { detail: enabled }));
    };

    return (
        <AnimationContext.Provider value={{ animationsEnabled, setAnimationsEnabled, isLoading }}>
            {children}
        </AnimationContext.Provider>
    );
};
