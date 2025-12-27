'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
import { ToyCard } from '@/components/features/ToyCard';
import { TransferModal } from '@/components/features/TransferModal';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useTelegram } from '@/lib/context/TelegramContext';
import { mockToys, Toy } from '@/lib/mock/toys';
import { getQRCodeStats } from '@/lib/firebase/firestore';
import { Lock, User, Wallet, QrCode, Plus, CheckCircle, Clock } from 'lucide-react';
import styles from './page.module.css';

export default function ProfilePage() {
    const { t } = useLanguage();
    const { user } = useTelegram();
    const [selectedToy, setSelectedToy] = useState<Toy | null>(null);
    const [stats, setStats] = useState({ total: 0, used: 0, created: 0 });

    // Load QR stats
    useEffect(() => {
        const loadStats = async () => {
            try {
                const data = await getQRCodeStats();
                setStats(data);
            } catch (error) {
                console.error('Error loading stats:', error);
            }
        };
        loadStats();
    }, []);

    // Filter toys owned by this user (if logged in)
    const userId = user?.id;
    const myToys = userId ? mockToys.filter(toy => toy.ownerId === userId) : [];

    const handleTransfer = (toy: Toy) => {
        setSelectedToy(toy);
    };

    if (!user) {
        return (
            <div className={styles.container}>
                <Header />
                <main className={styles.main}>
                    <div className={styles.loginCard}>
                        <div className={styles.loginIcon}>
                            <Lock size={32} />
                        </div>
                        <h2 className={styles.loginTitle}>{t('login_required')}</h2>
                        <p className={styles.loginDesc}>{t('login_desc')}</p>
                        <Button
                            variant="primary"
                            fullWidth
                            onClick={() => window.open('https://t.me/PlatformAntigravityBot', '_blank')}
                        >
                            {t('login_btn')}
                        </Button>
                    </div>

                    {/* Admin Button - for testing */}
                    <div className={styles.adminBtn}>
                        <Button
                            variant="secondary"
                            fullWidth
                            onClick={() => window.location.href = '/admin'}
                        >
                            <QrCode size={18} />
                            Admin Panel
                        </Button>
                    </div>
                </main>
                <Navigation />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <Header />

            <main className={styles.main}>
                <div className={styles.profileHeader}>
                    <div className={styles.avatar}>
                        {user.photo_url ? (
                            <img
                                src={user.photo_url}
                                alt={user.first_name}
                                className={styles.avatarImage}
                            />
                        ) : (
                            user.first_name?.[0] || <User size={32} />
                        )}
                    </div>
                    <div className={styles.userInfo}>
                        <h2 className={styles.userName}>
                            {`${user.first_name} ${user.last_name || ''}`}
                        </h2>
                        <span className={styles.userId}>ID: {user.id}</span>
                    </div>
                </div>

                <div className={styles.walletSection}>
                    <div className={styles.balance}>
                        <span className={styles.label}>Balance</span>
                        <div className={styles.amountWrapper}>
                            <Wallet size={18} className={styles.walletIcon} />
                            <span className={styles.amount}>12,500,000 UZS</span>
                        </div>
                    </div>
                    <Button variant="secondary" size="sm">{t('connect')}</Button>
                </div>

                {/* Admin Panel */}
                <section className={styles.adminSection}>
                    <h3 className={styles.sectionTitle}>
                        <QrCode size={20} />
                        Admin Panel
                    </h3>

                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon} style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
                                <QrCode size={20} color="#3b82f6" />
                            </div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue}>{stats.total}</span>
                                <span className={styles.statLabel}>Jami QR</span>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon} style={{ background: 'rgba(251, 191, 36, 0.2)' }}>
                                <Clock size={20} color="#fbbf24" />
                            </div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue}>{stats.created}</span>
                                <span className={styles.statLabel}>Kutilmoqda</span>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon} style={{ background: 'rgba(34, 197, 94, 0.2)' }}>
                                <CheckCircle size={20} color="#22c55e" />
                            </div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue}>{stats.used}</span>
                                <span className={styles.statLabel}>Ishlatilgan</span>
                            </div>
                        </div>
                    </div>

                    <Button
                        variant="primary"
                        fullWidth
                        onClick={() => window.location.href = '/admin'}
                        className={styles.createBtn}
                    >
                        <Plus size={18} />
                        Yangi QR Kod yaratish
                    </Button>
                </section>

                <section className={styles.collection}>
                    <h3 className={styles.sectionTitle}>My Collection ({myToys.length})</h3>
                    {myToys.length > 0 ? (
                        <div className={styles.grid}>
                            {myToys.map(toy => (
                                <ToyCard
                                    key={toy.id}
                                    toy={toy}
                                    isOwner={true}
                                    onTransfer={handleTransfer}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className={styles.empty}>
                            <p>You don't own any toys yet.</p>
                            <Button onClick={() => window.location.href = '/'} variant="ghost">Browse Store</Button>
                        </div>
                    )}
                </section>
            </main>

            <Navigation />

            {selectedToy && (
                <TransferModal
                    isOpen={!!selectedToy}
                    onClose={() => setSelectedToy(null)}
                    toy={selectedToy}
                />
            )}


        </div>
    );
}
