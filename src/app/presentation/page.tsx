'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Smartphone, Scan, Zap, Shield, Users, Gift } from 'lucide-react';
import { TgsPlayer } from '@/components/ui/TgsPlayer';
import styles from './page.module.css';

interface Slide {
    id: number;
    title: string;
    subtitle?: string;
    content: React.ReactNode;
    icon?: React.ReactNode;
}

export default function PresentationPage() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const slides: Slide[] = [
        {
            id: 0,
            title: "NFT Toys",
            subtitle: "Kolleksion NFT o'yinchoqlar",
            content: (
                <div className={styles.heroContent}>
                    <div className={styles.heroAnimation}>
                        <TgsPlayer src="/models/raphael.tgs" style={{ width: 200, height: 200 }} loop autoplay />
                    </div>
                    <p className={styles.tagline}>Jismoniy o'yinchoq + Raqamli NFT</p>
                </div>
            )
        },
        {
            id: 1,
            title: "Muammo",
            icon: <span className={styles.emoji}>🤔</span>,
            content: (
                <ul className={styles.bulletList}>
                    <li>Soxta kolleksion o'yinchoqlar</li>
                    <li>Haqiqiylikni tasdiqlash yo'q</li>
                    <li>Qayta sotish qiyinchiligi</li>
                    <li>Egalik tarixi yo'q</li>
                </ul>
            )
        },
        {
            id: 2,
            title: "Yechim",
            icon: <span className={styles.emoji}>💡</span>,
            content: (
                <ul className={styles.bulletList}>
                    <li><strong>NFC chip</strong> har bir o'yinchoqda</li>
                    <li><strong>NFT token</strong> egalikni tasdiqlaydi</li>
                    <li><strong>QR kod</strong> aktivlashtirish uchun</li>
                    <li><strong>Blockchain</strong> egalik tarixi</li>
                </ul>
            )
        },
        {
            id: 3,
            title: "Qanday ishlaydi",
            icon: <Scan size={48} className={styles.slideIcon} />,
            content: (
                <div className={styles.stepsWrapper}>
                    <div className={styles.stepsGrid}>
                        <div className={styles.step}>
                            <span className={styles.stepNum}>1</span>
                            <p>O'yinchoq sotib olish</p>
                        </div>
                        <div className={styles.step}>
                            <span className={styles.stepNum}>2</span>
                            <p>QR kodni skanerlash</p>
                        </div>
                        <div className={styles.step}>
                            <span className={styles.stepNum}>3</span>
                            <p>NFT ni aktivlashtirish</p>
                        </div>
                        <div className={styles.step}>
                            <span className={styles.stepNum}>4</span>
                            <p>Egalik tasdiqlandi</p>
                        </div>
                    </div>
                    <a href="/test-qr" className={styles.demoBtn} target="_blank">
                        Demo ko'rish →
                    </a>
                </div>
            )
        },
        {
            id: 4,
            title: "Xavfsizlik",
            icon: <Shield size={48} className={styles.slideIcon} />,
            content: (
                <ul className={styles.bulletList}>
                    <li><strong>Bir martalik havolalar</strong> — faqat 1 marta aktivlashtirish</li>
                    <li><strong>Shifrlangan tokenlar</strong></li>
                    <li><strong>Soxtalashtirib bo'lmaydi</strong></li>
                    <li><strong>Barcha tranzaksiyalar tarixi</strong></li>
                </ul>
            )
        },
        {
            id: 5,
            title: "Kolleksiya",
            content: (
                <div className={styles.collectionGrid}>
                    <div className={styles.collectionItem}>
                        <TgsPlayer src="/models/midas_pepe.tgs" style={{ width: 100, height: 100 }} loop autoplay />
                        <span>Legendary</span>
                    </div>
                    <div className={styles.collectionItem}>
                        <TgsPlayer src="/models/spectrum.tgs" style={{ width: 100, height: 100 }} loop autoplay />
                        <span>Rare</span>
                    </div>
                    <div className={styles.collectionItem}>
                        <TgsPlayer src="/models/ninja_mike.tgs" style={{ width: 100, height: 100 }} loop autoplay />
                        <span>Common</span>
                    </div>
                </div>
            )
        },
        {
            id: 6,
            title: "Monetizatsiya",
            icon: <span className={styles.emoji}>💰</span>,
            content: (
                <ul className={styles.bulletList}>
                    <li><strong>O'yinchoq sotish</strong> — 199K - 2.5M UZS</li>
                    <li><strong>Komissiya</strong> qayta sotishdan</li>
                    <li><strong>Cheklangan seriyalar</strong></li>
                    <li><strong>Brendlar bilan hamkorlik</strong></li>
                </ul>
            )
        },
        {
            id: 7,
            title: "Ishlab chiqarish",
            icon: <span className={styles.emoji}>📦</span>,
            content: (
                <div className={styles.calcContent}>
                    <div className={styles.calcRow}>
                        <span className={styles.calcLabel}>Modellar soni:</span>
                        <span className={styles.calcValue}>50 ta → <strong>25 ta</strong> (yarmi)</span>
                    </div>
                    <div className={styles.calcRow}>
                        <span className={styles.calcLabel}>Partiyalar:</span>
                        <span className={styles.calcValue}>25 × 4 = <strong>100 ta</strong> o'yinchoq</span>
                    </div>
                    <div className={styles.calcDivider} />
                    <div className={styles.rarityBreakdown}>
                        <div className={styles.rarityItem}>
                            <span className={styles.rarityDot} style={{ background: '#fbbf24' }} />
                            <span>Legendary: <strong>4 ta</strong></span>
                        </div>
                        <div className={styles.rarityItem}>
                            <span className={styles.rarityDot} style={{ background: '#3b82f6' }} />
                            <span>Rare: <strong>16 ta</strong></span>
                        </div>
                        <div className={styles.rarityItem}>
                            <span className={styles.rarityDot} style={{ background: '#9ca3af' }} />
                            <span>Common: <strong>80 ta</strong></span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 8,
            title: "Qadoqlash",
            content: (
                <div className={styles.packagingFlow}>
                    <div className={styles.packagingItem}>
                        <TgsPlayer src="/models/midas_pepe.tgs" style={{ width: 100, height: 100 }} loop autoplay />
                        <span>O'yinchoq</span>
                    </div>
                    <div className={styles.packagingArrow}>
                        <svg width="100" height="50" viewBox="0 0 100 50">
                            <defs>
                                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                    <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
                                </marker>
                            </defs>
                            <path
                                d="M10 40 Q 50 5, 90 25"
                                stroke="currentColor"
                                strokeWidth="3"
                                fill="none"
                                strokeLinecap="round"
                                markerEnd="url(#arrowhead)"
                            />
                        </svg>
                    </div>
                    <div className={styles.packagingItem}>
                        <TgsPlayer src="/animations/box.tgs" style={{ width: 120, height: 120 }} loop autoplay />
                        <span>Quti</span>
                    </div>
                </div>
            )
        },
        {
            id: 9,
            title: "Rahmat!",
            subtitle: "Savollar?",
            content: (
                <div className={styles.heroContent}>
                    <div className={styles.heroAnimation}>
                        <TgsPlayer src="/animations/only_up.tgs" style={{ width: 150, height: 150 }} loop autoplay />
                    </div>
                    <p className={styles.tagline}>nfttoys.uz</p>
                </div>
            )
        }
    ];

    const goToSlide = (index: number) => {
        if (isAnimating || index === currentSlide) return;
        if (index < 0 || index >= slides.length) return;

        setIsAnimating(true);
        setCurrentSlide(index);
        setTimeout(() => setIsAnimating(false), 300);
    };

    const nextSlide = () => goToSlide(currentSlide + 1);
    const prevSlide = () => goToSlide(currentSlide - 1);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                nextSlide();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prevSlide();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentSlide, isAnimating]);

    const slide = slides[currentSlide];

    return (
        <div className={styles.container}>
            {/* Progress bar */}
            <div className={styles.progressBar}>
                <div
                    className={styles.progress}
                    style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
                />
            </div>

            {/* Slide content */}
            <main
                className={`${styles.slide} ${isAnimating ? styles.animating : ''}`}
                key={slide.id}
            >
                {slide.icon && <div className={styles.iconWrapper}>{slide.icon}</div>}
                <h1 className={styles.title}>{slide.title}</h1>
                {slide.subtitle && <h2 className={styles.subtitle}>{slide.subtitle}</h2>}
                <div className={styles.content}>{slide.content}</div>
            </main>

            {/* Navigation */}
            <nav className={styles.navigation}>
                <button
                    className={styles.navBtn}
                    onClick={prevSlide}
                    disabled={currentSlide === 0}
                >
                    <ChevronLeft size={24} />
                </button>

                <div className={styles.dots}>
                    {slides.map((_, idx) => (
                        <button
                            key={idx}
                            className={`${styles.dot} ${idx === currentSlide ? styles.activeDot : ''}`}
                            onClick={() => goToSlide(idx)}
                        />
                    ))}
                </div>

                <button
                    className={styles.navBtn}
                    onClick={nextSlide}
                    disabled={currentSlide === slides.length - 1}
                >
                    <ChevronRight size={24} />
                </button>
            </nav>

            {/* Slide counter */}
            <div className={styles.counter}>
                {currentSlide + 1} / {slides.length}
            </div>
        </div>
    );
}
