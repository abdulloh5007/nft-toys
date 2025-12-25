'use client';

import React from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import styles from './QRScanner.module.css';

interface QRScannerProps {
    onScan: (text: string) => void;
    onError?: (error: unknown) => void;
}

export const QRScanner = ({ onScan, onError }: QRScannerProps) => {
    return (
        <div className={styles.scannerWrapper}>
            <Scanner
                onScan={(result) => {
                    if (result && result.length > 0) {
                        onScan(result[0].rawValue);
                    }
                }}
                onError={(error) => {
                    console.error("QR Scan Error:", error);
                    if (onError) onError(error);
                }}

                components={{
                    finder: false, // Disable red tracking rectangle
                }}
                styles={{
                    container: {
                        width: '100%',
                        height: '100%',
                    },
                    video: {
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                    },
                }}
            />
        </div>
    );
};
