'use client';

import React, { useState } from 'react';
import { X, Send, CheckCircle2, User, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTelegram } from '@/lib/context/TelegramContext';
import { useLanguage } from '@/lib/context/LanguageContext';
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
    const { firebaseUser, haptic, webApp } = useTelegram();
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
            const body: any = {
                tokenId: nft.tokenId,
                fromUserId: firebaseUser.uid,
                initData: webApp?.initData, // For CSRF protection
            };

            // Determine if it's username or wallet address
            if (recipient.startsWith('@') || recipientType === 'username') {
                body.toUsername = recipient.replace('@', '');
            } else {
                body.toAddress = recipient;
            }

            const response = await fetch('/api/nft/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Transfer failed');
            }

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

    return (
        <div className={styles.overlay} onClick={handleClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={handleClose}>
                    <X size={20} />
                </button>

                {/* Step 1: Input */}
                {step === 'input' && (
                    <>
                        <h2 className={styles.title}>{t('transfer')}</h2>
                        <div className={styles.preview}>
                            <div className={styles.previewIcon}>🎁</div>
                            <div className={styles.previewInfo}>
                                <span className={styles.previewName}>{nft.modelName}</span>
                                <span className={styles.previewDetail}>#{nft.serialNumber}</span>
                            </div>
                        </div>

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

                        <div className={styles.inputGroup}>
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
                    <>
                        <h2 className={styles.title}>{t('confirm_transfer') || 'Confirm Transfer'}</h2>
                        <div className={styles.recipientCard}>
                            <div className={styles.avatar}>
                                <User size={24} />
                            </div>
                            <div className={styles.recipientInfo}>
                                <span className={styles.recipientLabel}>{t('sending_to') || 'Sending to'}</span>
                                <span className={styles.recipientName}>
                                    {recipientType === 'username' ? `@${recipient.replace('@', '')}` : recipient}
                                </span>
                            </div>
                        </div>

                        <p className={styles.disclaimer}>
                            {t('transfer_warning') || 'This action is irreversible. The NFT will be transferred immediately.'}
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
                    </>
                )}

                {/* Step 3: Loading */}
                {step === 'loading' && (
                    <div className={styles.center}>
                        <Loader2 size={48} className={styles.spinner} />
                        <p>{t('transferring') || 'Transferring...'}</p>
                    </div>
                )}

                {/* Step 4: Success */}
                {step === 'success' && (
                    <div className={styles.success}>
                        <div className={styles.successIcon}>
                            <CheckCircle2 size={48} />
                        </div>
                        <h2 className={styles.title}>{t('transfer_success') || 'Sent Successfully!'}</h2>
                        <p className={styles.successDesc}>
                            <b>{nft.modelName} #{nft.serialNumber}</b> {t('sent_to') || 'has been sent to'}{' '}
                            <b>{recipientType === 'username' ? `@${recipient.replace('@', '')}` : recipient}</b>
                        </p>
                        <Button fullWidth onClick={handleClose}>{t('done') || 'Done'}</Button>
                    </div>
                )}

                {/* Step 5: Error */}
                {step === 'error' && (
                    <div className={styles.center}>
                        <div className={styles.errorIcon}>
                            <AlertTriangle size={48} />
                        </div>
                        <h2 className={styles.title}>{t('error_occurred')}</h2>
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
