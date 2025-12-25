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
    const [toyNumber, setToyNumber] = useState<string>('1');
    const [activationUrl, setActivationUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    const getNfcId = (name: string, number: string) =>
        `nfc_${name.toLowerCase().replace(/\s/g, '_')}_${number}`;

    useEffect(() => {
        // Client-side only - generate token
        const nfcId = getNfcId(selectedToy, toyNumber);
        const token = generateToken(nfcId);
        const origin = window.location.origin;
        setActivationUrl(`${origin}/activate/${encodeURIComponent(token)}`);
        setIsLoading(false);
    }, [selectedToy, toyNumber]);

    const handleRegenerate = () => {
        setIsLoading(true);
        setTimeout(() => {
            const nfcId = getNfcId(selectedToy, toyNumber);
            const token = generateToken(nfcId);
            const origin = window.location.origin;
            setActivationUrl(`${origin}/activate/${encodeURIComponent(token)}`);
            setIsLoading(false);
        }, 300);
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

                {/* Toy Number Input */}
                <div className={styles.numberInput}>
                    <label>Номер:</label>
                    <input
                        type="number"
                        value={toyNumber}
                        onChange={(e) => setToyNumber(e.target.value)}
                        placeholder="1"
                        min={1}
                        max={9999}
                    />
                </div>

                {/* QR Card */}
                <div className={styles.qrCard}>
                    <div className={styles.qrWrapper}>
                        {isLoading ? (
                            <div className={styles.loading}>
                                <RefreshCw size={32} className={styles.spinner} />
                            </div>
                        ) : (
                            <QRCode value={activationUrl} size={220} bgColor="#ffffff" fgColor="#000000" />
                        )}
                    </div>

                    <h2 className={styles.toyName}>{selectedToy} #{toyNumber}</h2>

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
