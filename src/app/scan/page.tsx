'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

import { Navigation } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/lib/context/LanguageContext';
import { Scan } from 'lucide-react';
import { QRScanner } from '@/components/features/QRScanner';
import styles from './page.module.css';

export default function ScanPage() {
    const router = useRouter();
    const { t } = useLanguage();

    const [isScanning, setIsScanning] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);

    const handleScan = (text: string) => {
        if (text && !isLoading) {
            setIsLoading(true);
            setIsScanning(false);

            // Parse scanned URL/text
            let redirectUrl = '';

            try {
                // Check if it's a full URL
                if (text.startsWith('http://') || text.startsWith('https://')) {
                    const url = new URL(text);
                    // Use the pathname directly (e.g., /activate/token...)
                    redirectUrl = url.pathname;
                } else if (text.startsWith('/')) {
                    // Already a path
                    redirectUrl = text;
                } else {
                    // Just a token - assume it's for /activate/
                    redirectUrl = `/activate/${encodeURIComponent(text)}`;
                }
            } catch {
                // If URL parsing fails, treat as token
                const parts = text.split('/');
                const token = parts[parts.length - 1];
                redirectUrl = `/activate/${encodeURIComponent(token)}`;
            }

            // Small delay to show the loading state before redirect
            setTimeout(() => {
                router.push(redirectUrl);
            }, 500);
        }
    };

    // Auto-start scanning when page loads
    React.useEffect(() => {
        setIsScanning(true);
    }, []);

    return (
        <div className={styles.container}>
            <Header />

            <main className={styles.main}>
                <div className={styles.scanZone}>
                    {/* Camera Viewfinder UI */}
                    <div className={styles.cameraFrame}>
                        {isScanning && (
                            <div className={styles.scannerContainer}>
                                <QRScanner onScan={handleScan} />
                            </div>
                        )}

                        <div className={styles.cornerTL}></div>
                        <div className={styles.cornerTR}></div>
                        <div className={styles.cornerBL}></div>
                        <div className={styles.cornerBR}></div>

                        {isScanning && <div className={styles.scanLine}></div>}

                        {!isScanning && (
                            <div className={styles.iconOverlay}>
                                <Scan size={48} className={styles.scanIcon} strokeWidth={1} />
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Navigation />
        </div>
    );
}
