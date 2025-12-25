'use client';

import React, { useState } from 'react';
import { X, Send, CheckCircle2, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { WalletService } from '@/lib/services/WalletService';
import { Toy } from '@/lib/mock/toys';
import styles from './TransferModal.module.css';

interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    toy: Toy;
}

export const TransferModal = ({ isOpen, onClose, toy }: TransferModalProps) => {
    const [step, setStep] = useState<'input' | 'confirm' | 'success'>('input');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleResolve = async () => {
        if (!username) return;
        setLoading(true);
        setError('');

        const user = await WalletService.resolveUsername(username);
        setLoading(false);

        if (user) {
            setStep('confirm');
        } else {
            setError('User not found');
        }
    };

    const handleTransfer = async () => {
        setLoading(true);
        await WalletService.transferToy(toy.id, toy.name, 'me', username);
        setLoading(false);
        setStep('success');
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <button className={styles.closeBtn} onClick={onClose}>
                    <X size={20} />
                </button>

                {step === 'input' && (
                    <>
                        <h2 className={styles.title}>Send Asset</h2>
                        <div className={styles.preview}>
                            <div className={styles.previewIcon}>🎁</div>
                            <div className={styles.previewInfo}>
                                <span className={styles.previewName}>{toy.name}</span>
                                <span className={styles.previewDetail}>{toy.model}</span>
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Recipient Username</label>
                            <div className={styles.inputWrapper}>
                                <span className={styles.inputPrefix}>@</span>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                            {error && <p className={styles.error}>{error}</p>}
                        </div>

                        <Button
                            fullWidth
                            disabled={!username || loading}
                            onClick={handleResolve}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'Continue'}
                        </Button>
                    </>
                )}

                {step === 'confirm' && (
                    <>
                        <h2 className={styles.title}>Confirm Transfer</h2>
                        <div className={styles.recipientCard}>
                            <div className={styles.avatar}>
                                <User size={24} />
                            </div>
                            <div className={styles.recipientInfo}>
                                <span className={styles.recipientLabel}>Sending to</span>
                                <span className={styles.recipientName}>@{username}</span>
                            </div>
                        </div>

                        <p className={styles.disclaimer}>
                            This action is irreversible. The asset will be transferred immediately.
                        </p>

                        <div className={styles.actions}>
                            <Button variant="secondary" onClick={() => setStep('input')}>Back</Button>
                            <Button fullWidth onClick={handleTransfer} disabled={loading}>
                                {loading ? <Loader2 className="animate-spin" /> : 'Confirm Send'}
                            </Button>
                        </div>
                    </>
                )}

                {step === 'success' && (
                    <div className={styles.success}>
                        <div className={styles.successIcon}>
                            <CheckCircle2 size={48} />
                        </div>
                        <h2 className={styles.title}>Sent Successfully!</h2>
                        <p className={styles.successDesc}>
                            <b>{toy.name}</b> has been sent to <b>@{username}</b>
                        </p>
                        <Button fullWidth onClick={onClose}>Done</Button>
                    </div>
                )}
            </div>
        </div>
    );
};
