import styles from './page.module.css';

// Static page - no providers, no hooks, just static Uzbek content
export default function NotTelegramPage() {
    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.iconWrapper}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.icon}>
                        <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
                        <path d="M12 18h.01" />
                    </svg>
                </div>

                <h1 className={styles.title}>
                    Telegram talab qilinadi
                </h1>

                <p className={styles.description}>
                    Bu ilova faqat Telegram ichida ishlaydi. Iltimos, botimiz orqali oching.
                </p>

                <a
                    href="https://t.me/nfttoysbot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.button}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                        <path d="M12 9v4" />
                        <path d="M12 17h.01" />
                    </svg>
                    @nfttoysbot ochish
                </a>

                <p className={styles.hint}>
                    Botimizni ochish uchun yuqoridagi tugmani bosing.
                </p>
            </div>
        </div>
    );
}
