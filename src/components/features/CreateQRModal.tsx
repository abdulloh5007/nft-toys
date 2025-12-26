'use client';

import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { X, QrCode, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PEPE_MODELS } from '@/lib/data/pepe_models';
import { generateToken } from '@/lib/activation/tokenService';
import { createQRCode } from '@/lib/firebase/firestore';
import styles from './CreateQRModal.module.css';

interface CreateQRModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function CreateQRModal({ isOpen, onClose, onSuccess }: CreateQRModalProps) {
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [serialNumber, setSerialNumber] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [created, setCreated] = useState(false);
    const [qrUrl, setQrUrl] = useState<string>('');

    if (!isOpen) return null;

    const selectedModelData = PEPE_MODELS.find(m => m.name === selectedModel);

    const handleCreate = async () => {
        if (!selectedModel || !serialNumber || !selectedModelData) return;

        setIsLoading(true);
        try {
            const nfcId = `nfc_${selectedModel.toLowerCase().replace(/\s/g, '_')}_${serialNumber}`;
            const token = generateToken(nfcId);
            const url = `${window.location.origin}/activate/${encodeURIComponent(token)}`;

            await createQRCode({
                modelName: selectedModel,
                serialNumber,
                rarity: selectedModelData.rarity,
                tgsFile: selectedModelData.tgsFile,
                token,
            });

            setQrUrl(url);
            setCreated(true);
            onSuccess?.();
        } catch (error) {
            console.error('Error creating QR:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedModel('');
        setSerialNumber('');
        setCreated(false);
        setQrUrl('');
        onClose();
    };

    return (
        <div className={styles.overlay} onClick={handleClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={handleClose}>
                    <X size={20} />
                </button>

                <div className={styles.header}>
                    <QrCode size={28} className={styles.icon} />
                    <h2>{created ? 'QR Kod yaratildi!' : 'Yangi QR Kod'}</h2>
                </div>

                {created ? (
                    <div className={styles.successContent}>
                        <div className={styles.qrWrapper}>
                            <QRCode value={qrUrl} size={200} bgColor="#ffffff" fgColor="#000000" />
                        </div>
                        <div className={styles.infoRow}>
                            <span className={styles.label}>Model:</span>
                            <span className={styles.value}>{selectedModel}</span>
                        </div>
                        <div className={styles.infoRow}>
                            <span className={styles.label}>Raqam:</span>
                            <span className={styles.value}>#{serialNumber}</span>
                        </div>
                        <div className={styles.urlBox}>
                            <code>{qrUrl}</code>
                        </div>
                        <Button onClick={handleClose} variant="primary" fullWidth>
                            <Check size={18} />
                            Tayyor
                        </Button>
                    </div>
                ) : (
                    <div className={styles.form}>
                        <div className={styles.field}>
                            <label>Model</label>
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className={styles.select}
                            >
                                <option value="">Tanlang...</option>
                                {PEPE_MODELS.map((model) => (
                                    <option key={model.name} value={model.name}>
                                        {model.name} ({model.rarity})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.field}>
                            <label>Seriya raqami</label>
                            <input
                                type="number"
                                value={serialNumber}
                                onChange={(e) => setSerialNumber(e.target.value)}
                                placeholder="1"
                                className={styles.input}
                                min={1}
                            />
                        </div>

                        {selectedModelData && (
                            <div className={styles.preview}>
                                <span className={`${styles.rarity} ${styles[selectedModelData.rarity]}`}>
                                    {selectedModelData.rarity}
                                </span>
                            </div>
                        )}

                        <Button
                            onClick={handleCreate}
                            variant="primary"
                            fullWidth
                            disabled={!selectedModel || !serialNumber || isLoading}
                        >
                            {isLoading ? 'Yaratilmoqda...' : 'QR Kod yaratish'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
