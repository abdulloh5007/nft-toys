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
import { Zap } from 'lucide-react';
import { TgsPlayer } from '@/components/ui/TgsPlayer';
import styles from './page.module.css';

export default function ScanResultPage() {
    const params = useParams();
    const router = useRouter();
    const { t } = useLanguage();
    const { user } = useTelegram();
    const [toy, setToy] = useState<Toy | null>(null);
    const [status, setStatus] = useState<'loading' | 'found' | 'not_found' | 'activated_success'>('loading');
    const [activationTime, setActivationTime] = useState<string | null>(null);

    useEffect(() => {
        // Simulate API lookup
        const nfcId = params.nfcId;
        setTimeout(() => {
            const found = mockToys.find(t => t.nfcId === nfcId);
            if (found) {
                setToy(found);
                setStatus('found');
            } else {
                setStatus('not_found');
            }
        }, 1000);
    }, [params.nfcId]);

    const handleActivate = () => {
        if (!toy) return;
        // Mock API call to activate
        setStatus('loading');
        setTimeout(() => {
            // In a real app, this would mutate backend state
            setToy({
                ...toy,
                status: 'activated', // or 'sold' depending on terminology
                ownerId: user?.id || 999, // Fallback if no user
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
        if (status === 'loading') return <div className={styles.loading}>{t('scanning')}</div>;
        if (status === 'not_found' || !toy) return (
            <div className={styles.error}>
                <h3>{t('not_found')}</h3>
                <Button onClick={() => router.push('/scan')} variant="secondary">Back</Button>
            </div>
        );

        const isAlreadyActivated = toy.status !== 'available';
        const isSuccess = status === 'activated_success';

        if (isSuccess) {
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

        return (
            <div className={styles.resultContainer}>
                <ToyCard
                    toy={toy}
                    onClick={() => { }} // Disable redirect - we're already on activation page
                    actionButton={
                        !isAlreadyActivated ? (
                            <Button
                                onClick={handleActivate}
                                size="sm"
                                className={styles.buyBtn}
                                style={{ width: '100%' }}
                            >
                                <Zap size={16} fill="white" />
                                {t('activate') || 'Activate'}
                            </Button>
                        ) : undefined
                    }
                />

                <div className={styles.infoCard}>
                    {isAlreadyActivated && (
                        <div className={styles.warningMessage}>
                            <h3 className={styles.warningTitle}>{t('already_activated') || 'Already Active'}</h3>
                            <p>{t('owner')}: {toy.ownerId}</p>
                        </div>
                    )}
                </div>
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
