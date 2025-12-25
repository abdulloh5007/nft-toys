'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
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
            // Simple parsing to handle full URLs if scanned
            const parts = text.split('/');
            const scannedId = parts[parts.length - 1];

            setIsLoading(true); // Show loading
            setIsScanning(false); // Stop camera

            // Small delay to show the loading state before redirect
            setTimeout(() => {
                router.push(`/scan/${scannedId}`);
            }, 500);
        }
    };

    const handleSimulateScan = () => {
        // Navigate to a mock scan result
        const mockNfcId = 'nfc_raphael'; // Use a real one from our data
        router.push(`/scan/${mockNfcId}`);
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
