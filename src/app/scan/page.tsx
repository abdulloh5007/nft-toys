'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

import { Navigation } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useTelegram } from '@/lib/context/TelegramContext';
import { Scan, Camera } from 'lucide-react';
import { QRScanner } from '@/components/features/QRScanner';
import styles from './page.module.css';

export default function ScanPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const { webApp } = useTelegram();

    const [isScanning, setIsScanning] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const [useTelegramScanner, setUseTelegramScanner] = React.useState(false);
    const [scanError, setScanError] = React.useState<string | null>(null);

    // Ref to prevent double opening of scanner
    const hasStartedRef = React.useRef(false);

    // Check if Telegram QR scanner is available (TG 6.4+)
    const hasTelegramScanner = React.useMemo(() => {
        if (!webApp) return false;
        const version = parseFloat(webApp.version || '0');
        return version >= 6.4 && typeof webApp.showScanQrPopup === 'function';
    }, [webApp]);

    const handleScan = React.useCallback((text: string) => {
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
            }, 300);
        }
    }, [isLoading, router]);

    // Start Telegram native QR scanner
    const startTelegramScanner = React.useCallback(() => {
        if (!webApp || !hasTelegramScanner) return;

        // Prevent double opening
        if (hasStartedRef.current) return;
        hasStartedRef.current = true;

        setScanError(null);
        setIsScanning(true);

        try {
            webApp.showScanQrPopup(
                { text: t('scan_hint') || 'Point camera at QR code' },
                (text: string) => {
                    if (text) {
                        handleScan(text);
                        return true; // Close scanner
                    }
                    return false; // Keep scanning
                }
            );
        } catch (error) {
            console.error('Telegram scanner error:', error);
            setScanError('Could not start scanner. Please try again.');
            setIsScanning(false);
            hasStartedRef.current = false; // Allow retry
        }
    }, [webApp, hasTelegramScanner, handleScan, t]);

    // Start custom camera scanner
    const startCustomScanner = () => {
        setScanError(null);
        setUseTelegramScanner(false);
        setIsScanning(true);
    };

    // Auto-start scanning when page loads - only once
    React.useEffect(() => {
        if (hasStartedRef.current) return;

        if (hasTelegramScanner) {
            // Use Telegram native scanner
            setUseTelegramScanner(true);
            startTelegramScanner();
        } else {
            // Fall back to custom camera scanner
            setIsScanning(true);
        }
    }, [hasTelegramScanner, startTelegramScanner]);

    return (
        <div className={styles.container}>
            <main className={styles.main}>
                <div className={styles.scanZone}>
                    {/* Camera Viewfinder UI */}
                    <div className={styles.cameraFrame}>
                        {/* Show custom scanner if not using Telegram's */}
                        {isScanning && !useTelegramScanner && (
                            <div className={styles.scannerContainer}>
                                <QRScanner
                                    onScan={handleScan}
                                    onError={(error) => {
                                        console.error('QR Scanner error:', error);
                                        setScanError('Camera error. Try Telegram scanner instead.');
                                    }}
                                />
                            </div>
                        )}

                        {/* Show message when using Telegram scanner */}
                        {useTelegramScanner && isScanning && (
                            <div className={styles.telegramScannerHint}>
                                <Camera size={48} className={styles.scanIcon} />
                                <p>{t('scanning') || 'Scanning...'}</p>
                            </div>
                        )}

                        <div className={styles.cornerTL}></div>
                        <div className={styles.cornerTR}></div>
                        <div className={styles.cornerBL}></div>
                        <div className={styles.cornerBR}></div>

                        {isScanning && !useTelegramScanner && <div className={styles.scanLine}></div>}

                        {!isScanning && (
                            <div className={styles.iconOverlay}>
                                <Scan size={48} className={styles.scanIcon} strokeWidth={1} />
                            </div>
                        )}
                    </div>

                    {/* Error message and retry buttons */}
                    {scanError && (
                        <div className={styles.errorContainer}>
                            <p className={styles.errorText}>{scanError}</p>
                            <div className={styles.buttonRow}>
                                {hasTelegramScanner && (
                                    <Button onClick={startTelegramScanner} variant="primary">
                                        Use Telegram Scanner
                                    </Button>
                                )}
                                <Button onClick={startCustomScanner} variant="secondary">
                                    Use Camera
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Navigation />
        </div>
    );
}

