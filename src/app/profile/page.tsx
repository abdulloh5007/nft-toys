'use client';

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { TransferModal } from '@/components/features/TransferModal';
import { SettingsDrawer } from '@/components/features/SettingsDrawer';
import { Button } from '@/components/ui/Button';
import { TgsPlayer } from '@/components/ui/TgsPlayer';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useTelegram } from '@/lib/context/TelegramContext';
import { getQRCodeStats } from '@/lib/firebase/firestore';
import { Lock, User, Wallet, QrCode, Plus, CheckCircle, Clock, Copy, Check, Settings } from 'lucide-react';
import styles from './page.module.css';

interface NFTItem {
    tokenId: string;
    modelName: string;
    serialNumber: number;
    rarity: string;
    tgsFile: string;
    tgsUrl: string;
}

export default function ProfilePage() {
    const { t } = useLanguage();
    const { user, firebaseUser, haptic } = useTelegram();
    const [selectedNFT, setSelectedNFT] = useState<NFTItem | null>(null);
    const [stats, setStats] = useState({ total: 0, used: 0, created: 0 });
    const [myNFTs, setMyNFTs] = useState<NFTItem[]>([]);
    const [isLoadingNFTs, setIsLoadingNFTs] = useState(true);
    const [copied, setCopied] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

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

    // Load user's NFTs
    useEffect(() => {
        const loadNFTs = async () => {
            // Wait for firebase user before loading
            if (!firebaseUser?.uid) {
                return; // Keep showing skeleton until user is ready
            }

            try {
                const response = await fetch(`/api/nft/my?userId=${firebaseUser.uid}`);
                const data = await response.json();
                if (data.success) {
                    setMyNFTs(data.nfts || []);
                }
            } catch (error) {
                console.error('Error loading NFTs:', error);
            } finally {
                setIsLoadingNFTs(false);
            }
        };
        loadNFTs();
    }, [firebaseUser]);

    const handleTransfer = (nft: NFTItem) => {
        setSelectedNFT(nft);
    };

    if (!user) {
        return (
            <div className={styles.container}>
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
            {/* Settings button - top right */}
            <button
                className={styles.settingsBtn}
                onClick={() => {
                    haptic.impact('light');
                    setSettingsOpen(true);
                }}
            >
                <Settings size={22} />
            </button>

            <main className={styles.main}>
                {/* Profile Header - centered */}
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
                    <span className={styles.username}>
                        {user.username ? `@${user.username}` : `${user.first_name} ${user.last_name || ''}`}
                    </span>
                </div>

                <div className={styles.walletSection}>
                    <div className={styles.walletLeft}>
                        <div className={styles.walletIconBox}>
                            <Wallet size={20} />
                        </div>
                        <div className={styles.walletInfo}>
                            <span className={styles.walletLabel}>{t('wallet')}</span>
                            <span className={styles.walletAddress}>
                                {user.walletFriendly
                                    ? `${user.walletFriendly.slice(0, 8)}...${user.walletFriendly.slice(-4)}`
                                    : t('loading')}
                            </span>
                        </div>
                    </div>
                    {user.walletFriendly && (
                        <button
                            className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
                            onClick={() => {
                                navigator.clipboard.writeText(user.walletFriendly);
                                haptic.success();
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                            }}
                        >
                            {copied ? <Check size={20} /> : <Copy size={20} />}
                        </button>
                    )}
                </div>

                {/* Admin Panel */}
                <section className={styles.adminSection}>
                    <h3 className={styles.sectionTitle}>
                        <QrCode size={20} />
                        {t('admin_panel')}
                    </h3>

                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon} style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
                                <QrCode size={20} color="#3b82f6" />
                            </div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue}>{stats.total}</span>
                                <span className={styles.statLabel}>{t('total_qr')}</span>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon} style={{ background: 'rgba(251, 191, 36, 0.2)' }}>
                                <Clock size={20} color="#fbbf24" />
                            </div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue}>{stats.created}</span>
                                <span className={styles.statLabel}>{t('waiting')}</span>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon} style={{ background: 'rgba(34, 197, 94, 0.2)' }}>
                                <CheckCircle size={20} color="#22c55e" />
                            </div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue}>{stats.used}</span>
                                <span className={styles.statLabel}>{t('used')}</span>
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
                        {t('create_new_qr')}
                    </Button>
                </section>

                <section className={styles.collection}>
                    <h3 className={styles.sectionTitle}>{t('my_collection')}</h3>
                    {isLoadingNFTs ? (
                        <div className={`${styles.grid} ${styles.grid3}`}>
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`${styles.nftCard} ${styles.skeleton}`}></div>
                            ))}
                        </div>
                    ) : myNFTs.length > 0 ? (
                        <div className={`${styles.grid} ${myNFTs.length === 1 ? styles.grid1 : myNFTs.length === 2 ? styles.grid2 : styles.grid3}`}>
                            {myNFTs.map(nft => (
                                <div
                                    key={nft.tokenId}
                                    className={styles.nftCard}
                                    onClick={() => handleTransfer(nft)}
                                >
                                    <div className={styles.ribbon} data-serial={`#${nft.serialNumber}`}></div>
                                    <div className={styles.nftImage}>
                                        <TgsPlayer
                                            src={nft.tgsUrl}
                                            style={{ width: '100%', height: '100%' }}
                                            autoplay
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.empty}>
                            <p>{t('no_nft')}</p>
                            <p className={styles.emptyHint}>{t('scan_to_activate')}</p>
                        </div>
                    )}
                </section>
            </main>

            <Navigation />

            {selectedNFT && (
                <TransferModal
                    isOpen={!!selectedNFT}
                    onClose={() => setSelectedNFT(null)}
                    nft={selectedNFT}
                    onSuccess={() => {
                        setSelectedNFT(null);
                        // Reload NFTs after successful transfer
                        if (firebaseUser?.uid) {
                            fetch(`/api/nft/my?userId=${firebaseUser.uid}`)
                                .then(res => res.json())
                                .then(data => {
                                    if (data.success) setMyNFTs(data.nfts || []);
                                });
                        }
                    }}
                />
            )}

            <SettingsDrawer
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
            />
        </div>
    );
}
