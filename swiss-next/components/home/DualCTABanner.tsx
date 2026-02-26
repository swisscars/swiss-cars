import { useTranslations } from 'next-intl';
import styles from './DualCTABanner.module.css';

export default function DualCTABanner() {
    const t = useTranslations('dual_cta');

    return (
        <div className={styles.wrapper}>
            <div className={`${styles.panel} ${styles.panelPrimary}`}>
                <h2 className={styles.title}>{t('left_title')}</h2>
                <p className={styles.text}>{t('left_text')}</p>
                <a href="tel:+37379330022" className={`btn btn-white ${styles.btn}`}>
                    {t('left_cta')}
                </a>
            </div>
            <div className={`${styles.panel} ${styles.panelDark}`}>
                <h2 className={styles.title}>{t('right_title')}</h2>
                <p className={styles.text}>{t('right_text')}</p>
                <a href="#offers" className={`btn btn-white ${styles.btn}`}>
                    {t('right_cta')}
                </a>
            </div>
        </div>
    );
}
