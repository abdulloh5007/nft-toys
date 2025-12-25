'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { PEPE_MODELS } from '@/lib/data/pepe_models';
import { generateToken } from '@/lib/activation/tokenService';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
import { RefreshCw } from 'lucide-react';
import styles from './page.module.css';

export default function TestQRPage() {
    const [selectedToy, setSelectedToy] = useState<string>('Raphael');
    const [activationUrl, setActivationUrl] = useState<string>('');

    const getNfcId = (name: string) => `nfc_${name.toLowerCase().replace(/\s/g, '_')}`;

    useEffect(() => {
        const nfcId = getNfcId(selectedToy);
        const token = generateToken(nfcId);
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://example.com';
        setActivationUrl(`${origin}/activate/${encodeURIComponent(token)}`);
    }, [selectedToy]);

    const handleRegenerate = () => {
        const nfcId = getNfcId(selectedToy);
        const token = generateToken(nfcId);
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://example.com';
        setActivationUrl(`${origin}/activate/${encodeURIComponent(token)}`);
    };

    return (
        <div className={styles.container}>
            <Header />

            <main className={styles.main}>
                {/* Toy Selector */}
                <div className={styles.selector}>
                    {PEPE_MODELS.slice(0, 8).map((model) => (
                        <button
                            key={model.name}
                            onClick={() => setSelectedToy(model.name)}
                            className={`${styles.toyBtn} ${selectedToy === model.name ? styles.active : ''}`}
                        >
                            {model.name}
                        </button>
                    ))}
                </div>

                {/* QR Card */}
                <div className={styles.qrCard}>
                    <div className={styles.qrWrapper}>
                        <QRCode value={activationUrl} size={220} bgColor="#ffffff" fgColor="#000000" />
                    </div>

                    <h2 className={styles.toyName}>{selectedToy}</h2>

                    {/* Full URL Display */}
                    <div className={styles.urlBox}>
                        <code className={styles.urlText}>{activationUrl}</code>
                    </div>

                    {/* Regenerate Button */}
                    <button onClick={handleRegenerate} className={styles.regenBtn}>
                        <RefreshCw size={18} />
                        New
                    </button>
                </div>
            </main>

            <Navigation />
        </div>
    );
}
