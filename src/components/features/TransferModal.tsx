'use client';

import React, { useState } from 'react';
import { X, Send, CheckCircle2, User, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TgsPlayer } from '@/components/ui/TgsPlayer';
import { useTelegram } from '@/lib/context/TelegramContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import { api } from '@/lib/api';
import styles from './TransferModal.module.css';

interface NFTItem {
    tokenId: string;
    modelName: string;
    serialNumber: number;
    rarity: string;
    tgsUrl: string;
}

interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    nft: NFTItem | null;
    onSuccess?: () => void;
}

export const TransferModal = ({ isOpen, onClose, nft, onSuccess }: TransferModalProps) => {
    const { firebaseUser, haptic, webApp, user } = useTelegram();
    const { t } = useLanguage();
    const [step, setStep] = useState<'input' | 'confirm' | 'loading' | 'success' | 'error'>('input');
    const [recipient, setRecipient] = useState('');
    const [recipientType, setRecipientType] = useState<'username' | 'wallet'>('username');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen || !nft) return null;

    const handleClose = () => {
        setStep('input');
        setRecipient('');
        setError('');
        onClose();
    };

    const handleContinue = () => {
        if (!recipient.trim()) {
            setError(t('recipient_required') || 'Recipient is required');
            return;
        }
        haptic.impact('light');
        setStep('confirm');
    };

    const handleTransfer = async () => {
        if (!firebaseUser?.uid) return;

        haptic.impact('heavy');
        setLoading(true);
        setStep('loading');
        setError('');

        try {
            const transferData: any = {
                tokenId: nft.tokenId,
                fromUserId: firebaseUser.uid,
                initData: webApp?.initData,
            };

            if (recipient.startsWith('@') || recipientType === 'username') {
                transferData.toUsername = recipient.replace('@', '');
            } else {
                transferData.toAddress = recipient;
            }

            await api.nft.transfer(transferData);

            haptic.success();
            setStep('success');
            onSuccess?.();

        } catch (err: any) {
            haptic.error();
            setError(err.message || 'Transfer failed');
            setStep('error');
        } finally {
            setLoading(false);
        }
    };

    const getRarityClass = (rarity: string) => {
        const r = rarity.toLowerCase();
        if (r === 'legendary') return styles['rarity-legendary'];
        if (r === 'rare') return styles['rarity-rare'];
        return styles['rarity-common'];
    };

    const displayRecipient = recipientType === 'username'
        ? `@${recipient.replace('@', '')}`
        : recipient;

    return (
        <div className={styles.overlay} onClick={handleClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={handleClose}>
                    <X size={18} />
                </button>

                {/* Step 1: Input */}
                {step === 'input' && (
                    <>

                        {/* NFT Preview with Animation */}
                        <div className={styles.nftPreview}>
                            <div className={styles.nftAnimation}>
                                <TgsPlayer
                                    src={nft.tgsUrl}
                                    style={{ width: 100, height: 100 }}
                                    autoplay
                                    loop
                                    unstyled
                                />
                            </div>
                            <div className={styles.nftInfo}>
                                <span className={styles.nftName}>{nft.modelName}</span>
                                <span className={styles.nftSerial}>#{nft.serialNumber}</span>
                            </div>
                        </div>

                        {/* Recipient Input */}
                        <div className={styles.inputSection}>
                            <div className={styles.tabs}>
                                <button
                                    className={`${styles.tab} ${recipientType === 'username' ? styles.active : ''}`}
                                    onClick={() => setRecipientType('username')}
                                >
                                    @username
                                </button>
                                <button
                                    className={`${styles.tab} ${recipientType === 'wallet' ? styles.active : ''}`}
                                    onClick={() => setRecipientType('wallet')}
                                >
                                    {t('wallet')}
                                </button>
                            </div>

                            <div className={styles.inputWrapper}>
                                {recipientType === 'username' && (
                                    <span className={styles.inputPrefix}>@</span>
                                )}
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder={recipientType === 'username' ? 'username' : 'UZ-XXXX-XXXX'}
                                    value={recipient}
                                    onChange={(e) => {
                                        setRecipient(e.target.value);
                                        setError('');
                                    }}
                                />
                            </div>

                            {error && <p className={styles.error}>{error}</p>}
                        </div>

                        <Button
                            fullWidth
                            disabled={!recipient.trim()}
                            onClick={handleContinue}
                        >
                            {t('continue') || 'Continue'}
                        </Button>
                    </>
                )}

                {/* Step 2: Confirm */}
                {step === 'confirm' && (
                    <div className={styles.confirmSection}>
                        <h2 className={styles.title}>{t('confirm_transfer') || 'Confirm Transfer'}</h2>

                        {/* NFT Animation Small */}
                        <div className={styles.nftPreview}>
                            <div className={styles.nftAnimation}>
                                <TgsPlayer
                                    src={nft.tgsUrl}
                                    style={{ width: 80, height: 80 }}
                                    autoplay
                                    loop
                                    unstyled
                                />
                            </div>
                            <div className={styles.nftInfo}>
                                <span className={styles.nftName}>{nft.modelName}</span>
                                <span className={styles.nftSerial}>#{nft.serialNumber}</span>
                            </div>
                        </div>

                        {/* Transfer Summary */}
                        <div className={styles.transferSummary}>
                            <div className={styles.fromTo}>
                                <span className={styles.fromToLabel}>From</span>
                                <span className={styles.fromToValue}>
                                    @{user?.username || 'you'}
                                </span>
                            </div>
                            <ArrowRight size={20} className={styles.arrow} />
                            <div className={styles.fromTo}>
                                <span className={styles.fromToLabel}>To</span>
                                <span className={styles.fromToValue}>{displayRecipient}</span>
                            </div>
                        </div>

                        <p className={styles.disclaimer}>
                            ⚠️ {t('transfer_warning') || 'This action is irreversible. The NFT will be transferred immediately.'}
                        </p>

                        <div className={styles.actions}>
                            <Button variant="secondary" onClick={() => setStep('input')}>
                                {t('back') || 'Back'}
                            </Button>
                            <Button fullWidth onClick={handleTransfer}>
                                <Send size={18} />
                                {t('send') || 'Send'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Loading */}
                {step === 'loading' && (
                    <div className={styles.loadingState}>
                        <Loader2 size={48} className={styles.spinner} />
                        <p className={styles.loadingText}>{t('transferring') || 'Transferring...'}</p>
                    </div>
                )}

                {/* Step 4: Success */}
                {step === 'success' && (
                    <div className={styles.successState}>
                        <div className={styles.successIcon}>
                            <CheckCircle2 size={40} />
                        </div>
                        <h2 className={styles.successTitle}>{t('transfer_success') || 'Sent Successfully!'}</h2>
                        <p className={styles.successDesc}>
                            <b>{nft.modelName} #{nft.serialNumber}</b> {t('sent_to') || 'has been sent to'}{' '}
                            <b>{displayRecipient}</b>
                        </p>
                        <Button fullWidth onClick={handleClose}>{t('done') || 'Done'}</Button>
                    </div>
                )}

                {/* Step 5: Error */}
                {step === 'error' && (
                    <div className={styles.errorState}>
                        <div className={styles.errorIcon}>
                            <AlertTriangle size={36} />
                        </div>
                        <h2 className={styles.errorTitle}>{t('error_occurred')}</h2>
                        <p className={styles.errorDesc}>{error}</p>
                        <Button fullWidth onClick={() => setStep('input')}>
                            {t('try_again') || 'Try Again'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
