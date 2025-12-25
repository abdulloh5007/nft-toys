'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/Button';
import { ToyCard } from '@/components/features/ToyCard';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useTelegram } from '@/lib/context/TelegramContext';
import { mockToys, Toy } from '@/lib/mock/toys';
import { validateToken, consumeToken, getTokenInfo } from '@/lib/activation/tokenService';
import { Zap, AlertTriangle, Home } from 'lucide-react';
import { TgsPlayer } from '@/components/ui/TgsPlayer';
import styles from './page.module.css';

type PageStatus = 'loading' | 'valid' | 'invalid_token' | 'already_used' | 'toy_not_found' | 'activated_success';

export default function ActivatePage() {
    const params = useParams();
    const router = useRouter();
    const { t } = useLanguage();
    const { user } = useTelegram();
    const [toy, setToy] = useState<Toy | null>(null);
    const [status, setStatus] = useState<PageStatus>('loading');
    const [activationTime, setActivationTime] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');

    useEffect(() => {
        // Validate token from URL (decode URL encoding first)
        const rawToken = params.token as string;
        const token = decodeURIComponent(rawToken);

        if (!token) {
            setStatus('invalid_token');
            setErrorMessage('No token provided');
            return;
        }

        // Decode token to get toyId
        const tokenInfo = getTokenInfo(token);
        if (!tokenInfo) {
            setStatus('invalid_token');
            setErrorMessage('Invalid token format');
            return;
        }

        // Validate token (check signature and usage)
        const validation = validateToken(token);

        if (!validation.valid) {
            if (validation.error === 'already_used') {
                setStatus('already_used');
                setActivationTime(validation.usedAt || null);
                setErrorMessage(validation.usedAt || '');
            } else {
                setStatus('invalid_token');
                setErrorMessage(validation.error || 'Token validation failed');
            }
            return;
        }

        // Find the toy
        const toyId = validation.toyId!;
        const found = mockToys.find(t => t.nfcId === toyId || t.id === toyId);

        if (found) {
            setToy(found);
            setStatus('valid');
        } else {
            setStatus('toy_not_found');
            setErrorMessage(`Toy not found: ${toyId}`);
        }
    }, [params.token]);

    const handleActivate = () => {
        if (!toy) return;
        const token = decodeURIComponent(params.token as string);

        setStatus('loading');

        setTimeout(() => {
            // Consume the token (mark as used)
            const consumed = consumeToken(token, user?.id);

            if (!consumed) {
                setStatus('already_used');
                setErrorMessage('Token was already used');
                return;
            }

            // Update toy state
            setToy({
                ...toy,
                status: 'activated',
                ownerId: user?.id || 999,
            });

            setActivationTime(new Date().toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }));
            setStatus('activated_success');
        }, 1000);
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
                <div className={styles.errorContainer}>
                    <AlertTriangle size={64} className={styles.warningIcon} />
                    <h3 className={styles.warningTitle}>{t('already_activated') || 'Already Activated'}</h3>
                    {activationTime && (
                        <div className={styles.timeBadge}>
                            <span>{t('time') || 'Time'}: {activationTime}</span>
                        </div>
                    )}
                    <Button onClick={() => router.push('/')} variant="secondary" fullWidth className={styles.homeBtn}>
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

                    <Button onClick={() => router.push('/profile')} variant="primary" fullWidth className={styles.mt4}>
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
                        <span className={styles.infoValue}>{(toy as any).serialNumber || '#001'}</span>
                    </div>
                </div>

                {/* Activate button */}
                <Button
                    onClick={handleActivate}
                    variant="primary"
                    fullWidth
                    className={styles.activateBtn}
                >
                    <Zap size={18} fill="white" />
                    {t('activate') || 'Activate'}
                </Button>
            </div>
        );
    };

    return (
        <div className={styles.container}>
            <Header />
            <main className={styles.main}>
                {renderContent()}
            </main>
            <Navigation />
        </div>
    );
}
