'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { useParams, useRouter } from 'next/navigation';

import { Navigation } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useTelegram } from '@/lib/context/TelegramContext';
import { Zap, AlertTriangle, Home, Loader2 } from 'lucide-react';
import { TgsPlayer } from '@/components/ui/TgsPlayer';
import styles from './page.module.css';

type PageStatus = 'loading' | 'valid' | 'invalid_token' | 'already_used' | 'toy_not_found' | 'activated_success';

interface ToyData {
    id: string;
    name: string;
    model: string;
    serialNumber: string;
    rarity: 'common' | 'rare' | 'legendary';
    tgsUrl: string;
    nfcId: string;
    status: string;
    ownerId?: number;
}

export default function ActivatePage() {
    const params = useParams();
    const router = useRouter();
    const { t } = useLanguage();
    const { user, haptic, firebaseUser, webApp, isAuthenticated } = useTelegram();
    const [toy, setToy] = useState<ToyData | null>(null);
    const [status, setStatus] = useState<PageStatus>('loading');
    const [activationTime, setActivationTime] = useState<string | null>(null);
    const [activatedBy, setActivatedBy] = useState<string | null>(null);
    const [activatedByPhoto, setActivatedByPhoto] = useState<string | null>(null);
    const [activatedByFirstName, setActivatedByFirstName] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [isAuthenticating, setIsAuthenticating] = useState(true);

    useEffect(() => {
        const checkQRCode = async () => {
            const rawToken = params.token as string;
            const token = decodeURIComponent(rawToken);

            if (!token) {
                setStatus('invalid_token');
                setErrorMessage('No token provided');
                return;
            }

            // Check QR code status via API
            try {
                const response = await fetch(`/api/qr/activate?token=${encodeURIComponent(token)}`);
                const data = await response.json();

                if (!response.ok) {
                    if (data.code === 'INVALID_TOKEN') {
                        setStatus('invalid_token');
                        setErrorMessage('Invalid token');
                    } else if (data.code === 'NOT_FOUND') {
                        setStatus('toy_not_found');
                        setErrorMessage('QR code not found');
                    } else {
                        setStatus('invalid_token');
                        setErrorMessage(data.error || 'Unknown error');
                    }
                    return;
                }

                // Check if already used
                if (data.status === 'used') {
                    setStatus('already_used');
                    setActivationTime(data.usedAt
                        ? new Date(data.usedAt).toLocaleString('ru-RU')
                        : ''
                    );
                    setActivatedBy(data.usedByName || null);
                    setActivatedByPhoto(data.usedByPhoto || null);
                    setActivatedByFirstName(data.usedByFirstName || null);
                    return;
                }

                // QR is valid and available
                setToy({
                    id: data.toy.id,
                    name: data.toy.name,
                    model: 'Series 1',
                    serialNumber: `#${data.toy.serialNumber}`,
                    rarity: data.toy.rarity,
                    tgsUrl: data.toy.tgsUrl,
                    nfcId: data.toy.id,
                    status: 'available',
                });
                setStatus('valid');
            } catch (error) {
                console.error('Error checking QR:', error);
                setStatus('invalid_token');
                setErrorMessage('Error validating QR code');
            }
        };

        checkQRCode();
    }, [params.token]);

    // Track Firebase auth state - once authenticated, allow activation
    useEffect(() => {
        if (firebaseUser) {
            setIsAuthenticating(false);
            console.log('✅ Firebase auth complete, activation enabled');
        } else if (webApp && !isAuthenticated) {
            // Still waiting for auth
            const timeout = setTimeout(() => {
                // If auth takes too long (5s), still allow activation with basic user info
                console.log('⚠️ Auth timeout, allowing activation with basic info');
                setIsAuthenticating(false);
            }, 5000);
            return () => clearTimeout(timeout);
        }
    }, [firebaseUser, webApp, isAuthenticated]);

    // Handler for home button - redirects to Telegram if not authenticated
    const handleHomeClick = () => {
        haptic.impact('light');
        if (!user) {
            // User is not authenticated - redirect to Telegram bot
            const rawToken = params.token as string;
            const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || 'nfttoysbot';
            const startParam = encodeURIComponent(`activate_${rawToken}`);
            const telegramUrl = `https://t.me/${botUsername}?startapp=${startParam}`;
            window.location.href = telegramUrl;
        } else {
            router.push('/');
        }
    };

    const handleActivate = async () => {
        if (!toy) return;

        // Haptic feedback on button press
        haptic.impact('heavy');

        // Check if user is authenticated (came from Telegram)
        if (!user) {
            // User is not authenticated - redirect to Telegram bot with deeplink
            const rawToken = params.token as string;
            const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || 'nfttoysbot';
            const startParam = encodeURIComponent(`activate_${rawToken}`);
            const telegramUrl = `https://t.me/${botUsername}?startapp=${startParam}`;
            window.location.href = telegramUrl;
            return;
        }

        setStatus('loading');

        try {
            const rawToken = params.token as string;
            const token = decodeURIComponent(rawToken);

            // Activate via API
            const response = await fetch('/api/qr/activate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    userId: firebaseUser?.uid || `tg_${user?.id}` || 'anonymous',
                    username: user?.username || user?.first_name || null,
                    userPhoto: user?.photo_url || null,
                    firstName: user?.first_name || null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.code === 'ALREADY_USED') {
                    setStatus('already_used');
                    setActivationTime(data.usedAt
                        ? new Date(data.usedAt).toLocaleString('ru-RU')
                        : ''
                    );
                    return;
                }
                throw new Error(data.error);
            }

            // Update toy state
            setToy({
                ...toy,
                status: 'activated',
                ownerId: user?.id || 999,
            });

            setActivationTime(new Date(data.activatedAt).toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }));
            setStatus('activated_success');

            // Success haptic feedback
            haptic.success();
        } catch (error) {
            console.error('Activation error:', error);
            // Show error status
            setStatus('invalid_token');
            setErrorMessage('Activation failed');
        }
    };

    // Confetti celebration effect
    useEffect(() => {
        if (status === 'activated_success') {
            // Left popper
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { x: 0.1, y: 0.9 },
                angle: 60,
                colors: ['#4ade80', '#22d3ee', '#a78bfa', '#f472b6', '#fbbf24']
            });
            // Right popper
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { x: 0.9, y: 0.9 },
                angle: 120,
                colors: ['#4ade80', '#22d3ee', '#a78bfa', '#f472b6', '#fbbf24']
            });
        }
    }, [status]);

    const renderContent = () => {
        if (status === 'loading') {
            return <div className={styles.loading}>{t('scanning')}</div>;
        }

        if (status === 'invalid_token' || status === 'toy_not_found') {
            return (
                <div className={styles.errorContainer}>
                    <AlertTriangle size={64} className={styles.errorIcon} />
                    <h3 className={styles.errorTitle}>{t('not_found') || 'Invalid Link'}</h3>
                    <p className={styles.errorDesc}>{errorMessage}</p>
                    <Button onClick={() => router.push('/')} variant="secondary" fullWidth className={styles.homeBtn}>
                        <Home size={18} />
                        {t('home') || 'Home'}
                    </Button>
                </div>
            );
        }

        if (status === 'already_used') {
            return (
                <div className={styles.alreadyUsedContainer}>
                    <div className={styles.alreadyUsedIcon}>
                        <AlertTriangle size={48} />
                    </div>
                    <h3 className={styles.alreadyUsedTitle}>{t('already_activated') || 'Already Activated'}</h3>
                    <p className={styles.alreadyUsedDesc}>{t('nft_has_owner') || 'This NFT already has an owner'}</p>

                    {/* Owner Card */}
                    <div className={styles.ownerCard}>
                        <div className={styles.ownerAvatar}>
                            {activatedByPhoto ? (
                                <img src={activatedByPhoto} alt="Owner" className={styles.ownerAvatarImg} />
                            ) : (
                                <div className={styles.ownerAvatarPlaceholder}>
                                    {activatedByFirstName?.[0] || activatedBy?.[0] || '?'}
                                </div>
                            )}
                        </div>
                        <div className={styles.ownerInfo}>
                            <span className={styles.ownerName}>
                                {activatedByFirstName || (activatedBy ? `@${activatedBy}` : 'Unknown')}
                            </span>
                            {activatedBy && activatedByFirstName && (
                                <span className={styles.ownerUsername}>@{activatedBy}</span>
                            )}
                        </div>
                    </div>

                    {activationTime && (
                        <div className={styles.activationTimeBadge}>
                            <span className={styles.activationTimeLabel}>{t('activated_at') || 'Activated'}</span>
                            <span className={styles.activationTimeValue}>{activationTime}</span>
                        </div>
                    )}

                    <Button onClick={handleHomeClick} variant="secondary" fullWidth className={styles.homeBtn}>
                        <Home size={18} />
                        {t('home') || 'Home'}
                    </Button>
                </div>
            );
        }

        if (status === 'activated_success') {
            return (
                <div className={styles.successContainer}>
                    <div className={styles.successIcon}>
                        <TgsPlayer
                            src="/animations/only_up.tgs"
                            style={{ width: 120, height: 120 }}
                            loop={true}
                        />
                    </div>
                    <h3 className={styles.successTitle}>{t('activation_success') || 'Success!'}</h3>
                    <p className={styles.successDesc}>{t('activation_desc') || 'You are now the owner.'}</p>

                    <div className={styles.timeBadge}>
                        <span>{t('time') || 'Time'}: {activationTime}</span>
                    </div>

                    <Button onClick={() => {
                        haptic.impact('light');
                        router.push('/profile');
                    }} variant="primary" fullWidth className={styles.mt4}>
                        OK
                    </Button>
                </div>
            );
        }

        // Valid token - show activation UI
        if (!toy) return null;

        return (
            <div className={styles.activationContainer}>
                {/* Animation on top - no container */}
                <div className={styles.animationSection}>
                    {toy.tgsUrl && (
                        <TgsPlayer
                            src={toy.tgsUrl}
                            style={{ width: 240, height: 240 }}
                            loop={true}
                            autoplay={true}
                        />
                    )}
                </div>

                {/* Two info cards like NFT detail page */}
                <div className={styles.infoRow}>
                    <div className={styles.infoCard}>
                        <span className={styles.infoLabel}>{t('name') || 'Name'}</span>
                        <span className={styles.infoValue}>{toy.name}</span>
                    </div>
                    <div className={styles.infoCard}>
                        <span className={styles.infoLabel}>{t('number') || 'Number'}</span>
                        <span className={styles.infoValue}>{(toy as any).serialNumber || '#'}</span>
                    </div>
                </div>

                {/* Activate button */}
                <Button
                    onClick={handleActivate}
                    variant="primary"
                    fullWidth
                    className={styles.activateBtn}
                    disabled={isAuthenticating && !!user}
                >
                    {isAuthenticating && user ? (
                        <>
                            <Loader2 size={18} className={styles.spinner} />
                            {t('connecting') || 'Connecting...'}
                        </>
                    ) : (
                        <>
                            <Zap size={18} fill="white" />
                            {t('activate') || 'Activate'}
                        </>
                    )}
                </Button>
            </div>
        );
    };

    return (
        <div className={styles.container}>
            <main className={styles.main}>
                {renderContent()}
            </main>
            {user && <Navigation />}
        </div>
    );
}
