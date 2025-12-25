'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
import { ToyCard } from '@/components/features/ToyCard';
import { mockToys } from '@/lib/mock/toys';
import styles from './page.module.css';
import { useLanguage } from '@/lib/context/LanguageContext';

export default function Home() {
    const { t } = useLanguage();

    return (
        <div className={styles.container}>
            <Header />

            <main className={styles.main}>
                <div className={styles.hero}>
                    <h2 className={styles.heroTitle}>{t('welcome')}</h2>
                    <p className={styles.heroSubtitle}>Discover exclusive NFT Plush Toys</p>
                </div>

                <div className={styles.grid}>
                    {mockToys.map((toy) => (
                        <ToyCard
                            key={toy.id}
                            toy={toy}
                        // onBuy={() => console.log('Buy', toy.id)}
                        />
                    ))}
                </div>
            </main>

            <Navigation />
        </div>
    );
}
