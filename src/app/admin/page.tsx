'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/Button';
import { PEPE_MODELS } from '@/lib/data/pepe_models';
import { useLanguage } from '@/lib/context/LanguageContext';
import { QrCode, Plus, CheckCircle, Clock, ArrowLeft, Eye, X, AlertTriangle, Trash2, ChevronDown } from 'lucide-react';
import styles from './page.module.css';

interface CustomSelectProps {
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    error?: boolean;
}

const CustomSelect = ({ value, options, onChange, placeholder, disabled, error }: CustomSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className={styles.selectContainer} ref={containerRef}>
            <button
                className={`${styles.selectTrigger} ${isOpen ? styles.active : ''} ${disabled ? styles.disabled : ''} ${error ? styles.inputError : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
            >
                <span>{selectedOption ? selectedOption.label : placeholder}</span>
                <ChevronDown size={16} className={`${styles.chevron} ${isOpen ? styles.rotate : ''}`} />
            </button>

            {isOpen && (
                <div className={`${styles.selectDropdown} ${isOpen ? styles.open : ''}`}>
                    {options.map((option) => (
                        <button
                            key={option.value}
                            className={`${styles.selectOption} ${value === option.value ? styles.selected : ''}`}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

interface QRCodeData {
    id: string;
    nfcId: string;
    modelName: string;
    serialNumber: string;
    rarity: 'common' | 'rare' | 'legendary';
    status: 'created' | 'used';
    token: string;
    createdAt: string | null;
    usedAt: string | null;
    usedBy?: string;
}

export default function AdminPage() {
    const { t } = useLanguage();
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [selectedRarity, setSelectedRarity] = useState<string>(''); // Add rarity state
    const [serialNumber, setSerialNumber] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingList, setIsLoadingList] = useState(true);
    const [stats, setStats] = useState({ total: 0, used: 0, created: 0 });
    const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
    const [viewingQR, setViewingQR] = useState<QRCodeData | null>(null);
    const [deletingQR, setDeletingQR] = useState<QRCodeData | null>(null);
    const [error, setError] = useState<string>('');
    const [lastCreatedUrl, setLastCreatedUrl] = useState<string>('');
    const [validationErrors, setValidationErrors] = useState({ rarity: false, model: false, serial: false });

    const selectedModelData = PEPE_MODELS.find(m => m.name === selectedModel);

    const getModelRarity = (modelName: string) => {
        return PEPE_MODELS.find(m => m.name === modelName)?.rarity || 'common';
    };

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoadingList(true);
        try {
            const response = await fetch('/api/qr/list');
            const data = await response.json();

            if (data.qrCodes) {
                setQrCodes(data.qrCodes);
            }
            if (data.stats) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoadingList(false);
        }
    };

    const handleCreate = async () => {
        // Validation
        const errors = {
            rarity: !selectedRarity,
            model: !selectedModel,
            serial: !serialNumber
        };

        setValidationErrors(errors);

        if (errors.rarity || errors.model || errors.serial) {
            return;
        }

        if (!selectedModel || !serialNumber || !selectedModelData) return;

        setIsLoading(true);
        setError('');
        setLastCreatedUrl('');

        try {
            const response = await fetch('/api/qr/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    modelName: selectedModel,
                    serialNumber,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.code === 'DUPLICATE') {
                    setError(t('qr_exists'));
                } else if (data.code === 'SERIAL_EXISTS') {
                    setError(`${t('serial_exists')}: ${data.existingModel}`);
                } else {
                    setError(data.error || t('error_occurred'));
                }
                return;
            }

            // Store the activation URL
            setLastCreatedUrl(`${window.location.origin}${data.activationUrl}`);

            // Reset form and reload data
            setSelectedModel('');
            setSerialNumber('');
            setSelectedRarity('');
            setValidationErrors({ rarity: false, model: false, serial: false });
            await loadData();
        } catch (error) {
            console.error('Error creating QR:', error);
            setError(t('error_occurred'));
        } finally {
            setIsLoading(false);
        }
    };

    const getQRUrl = (qr: QRCodeData) => {
        // Use the secure token for activation URL
        return `${window.location.origin}/activate/${encodeURIComponent(qr.token)}`;
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleDelete = async (qr: QRCodeData) => {
        setDeletingQR(qr);
    };

    const confirmDelete = async () => {
        if (!deletingQR) return;

        try {
            const response = await fetch(`/api/qr/delete?nfcId=${encodeURIComponent(deletingQR.nfcId)}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setDeletingQR(null);
                await loadData();
            }
        } catch (error) {
            console.error('Error deleting QR:', error);
        }
    };

    return (
        <div className={styles.container}>
            <Header />

            <main className={styles.main}>
                <div className={styles.header}>
                    <button className={styles.backBtn} onClick={() => window.location.href = '/profile'}>
                        <ArrowLeft size={20} />
                    </button>
                    <h1>{t('admin_panel')}</h1>
                </div>

                {/* Stats */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
                            <QrCode size={20} color="#3b82f6" />
                        </div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{stats.total}</span>
                            <span className={styles.statLabel}>{t('total_qr')}</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: 'rgba(251, 191, 36, 0.2)' }}>
                            <Clock size={20} color="#fbbf24" />
                        </div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{stats.created}</span>
                            <span className={styles.statLabel}>{t('waiting')}</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: 'rgba(34, 197, 94, 0.2)' }}>
                            <CheckCircle size={20} color="#22c55e" />
                        </div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{stats.used}</span>
                            <span className={styles.statLabel}>{t('used')}</span>
                        </div>
                    </div>
                </div>

                {/* QR Creator */}
                <div className={styles.creator}>
                    <div className={styles.form}>
                        <div className={styles.formRow}>
                            {/* Rarity Select */}
                            <div className={styles.field}>
                                <label>{t('rarity')}</label>
                                <CustomSelect
                                    value={selectedRarity}
                                    options={[
                                        { value: '', label: t('all') },
                                        { value: 'common', label: t('rarity_common') },
                                        { value: 'rare', label: t('rarity_rare') },
                                        { value: 'legendary', label: t('rarity_legendary') }
                                    ]}
                                    onChange={(value) => {
                                        setSelectedRarity(value);
                                        setSelectedModel(''); // Reset model when rarity changes
                                        setValidationErrors(prev => ({ ...prev, rarity: false }));
                                    }}
                                    placeholder={t('select_rarity')}
                                    error={validationErrors.rarity}
                                />
                            </div>

                            {/* Model Select */}
                            <div className={styles.field}>
                                <label>{t('model')}</label>
                                <CustomSelect
                                    value={selectedModel}
                                    options={PEPE_MODELS
                                        .filter(m => !selectedRarity || m.rarity === selectedRarity)
                                        .map(m => ({
                                            value: m.name,
                                            label: m.name
                                        }))}
                                    onChange={(value) => {
                                        setSelectedModel(value);
                                        setValidationErrors(prev => ({ ...prev, model: false }));
                                    }}
                                    placeholder={t('select')}
                                    disabled={!selectedRarity && false} // Always active or optional logic
                                    error={validationErrors.model}
                                />
                            </div>

                            {/* Serial Number */}
                            <div className={styles.field}>
                                <label>{t('serial_number')}</label>
                                <input
                                    type="number"
                                    value={serialNumber}
                                    onChange={(e) => {
                                        setSerialNumber(e.target.value);
                                        setValidationErrors(prev => ({ ...prev, serial: false }));
                                    }}
                                    placeholder="1"
                                    className={`${styles.input} ${validationErrors.serial ? styles.inputError : ''}`}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className={styles.error}>
                                <AlertTriangle size={16} />
                                {error}
                            </div>
                        )}

                        <Button
                            onClick={handleCreate}
                            disabled={isLoading}
                        >
                            {isLoading ? t('creating') : t('create_qr')}
                        </Button>
                    </div>
                </div>

                {/* QR List */}
                <div className={styles.qrList}>
                    <h2><QrCode size={20} /> {t('created_qr')}</h2>

                    {isLoadingList ? (
                        <div className={styles.loadingSpinner}>
                            <div className={styles.spinner}></div>
                        </div>
                    ) : qrCodes.length === 0 ? (
                        <div className={styles.empty}>{t('no_qr_yet')}</div>
                    ) : (
                        <div className={styles.tableWrapper}>
                            <table className={styles.qrTable}>
                                <thead>
                                    <tr>
                                        <th>{t('model')}</th>
                                        <th>{t('number')}</th>
                                        <th>{t('status')}</th>
                                        <th>{t('rarity')}</th>
                                        <th>{t('created_at')}</th>
                                        <th className={styles.stickyCol}>{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {qrCodes.map((qr) => (
                                        <tr key={qr.id}>
                                            <td>{qr.modelName}</td>
                                            <td>#{qr.serialNumber}</td>
                                            <td>
                                                {qr.status === 'used' ? (
                                                    <CheckCircle size={18} color="#22c55e" />
                                                ) : (
                                                    <Clock size={18} color="#fbbf24" />
                                                )}
                                            </td>
                                            <td>
                                                <span className={`${styles.qrRarity} ${styles[qr.rarity]}`}>
                                                    {qr.rarity}
                                                </span>
                                            </td>
                                            <td className={styles.dateCell}>{formatDate(qr.createdAt)}</td>
                                            <td className={styles.stickyCol}>
                                                <div className={styles.actionButtons}>
                                                    <button
                                                        className={styles.viewBtn}
                                                        onClick={() => setViewingQR(qr)}
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        className={styles.deleteBtn}
                                                        onClick={() => handleDelete(qr)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main >

            <Navigation />

            {/* QR View Modal */}
            {
                viewingQR && (
                    <div className={styles.modal} onClick={() => setViewingQR(null)}>
                        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                            <button className={styles.closeBtn} onClick={() => setViewingQR(null)}>
                                <X size={20} />
                            </button>
                            <div className={styles.qrWrapper}>
                                <QRCode value={getQRUrl(viewingQR)} size={200} bgColor="#ffffff" fgColor="#000000" />
                            </div>
                            <h3>{viewingQR.modelName} #{viewingQR.serialNumber}</h3>
                            <div className={styles.modalInfo}>
                                <div className={styles.infoRow}>
                                    <span>{t('status')}:</span>
                                    <span className={`${styles.qrStatus} ${styles[viewingQR.status]}`}>
                                        {viewingQR.status === 'created' ? t('waiting') : t('used')}
                                    </span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span>{t('created_at')}:</span>
                                    <span>{formatDate(viewingQR.createdAt)}</span>
                                </div>
                                {viewingQR.usedAt && (
                                    <div className={styles.infoRow}>
                                        <span>{t('used_at')}:</span>
                                        <span>{formatDate(viewingQR.usedAt)}</span>
                                    </div>
                                )}
                            </div>
                            <div className={styles.urlBox}>
                                <code>{getQRUrl(viewingQR)}</code>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Delete Confirmation Modal */}
            {
                deletingQR && (
                    <div className={styles.modal} onClick={() => setDeletingQR(null)}>
                        <div className={styles.deleteModal} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.deleteIcon}>
                                <Trash2 size={28} />
                            </div>
                            <p>
                                <strong>{deletingQR.modelName} #{deletingQR.serialNumber}</strong> o'chirilsinmi?
                            </p>
                            <div className={styles.deleteActions}>
                                <button
                                    className={styles.cancelBtn}
                                    onClick={() => setDeletingQR(null)}
                                >
                                    Нет
                                </button>
                                <button
                                    className={styles.confirmDeleteBtn}
                                    onClick={confirmDelete}
                                >
                                    Да
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
