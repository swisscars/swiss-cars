'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import Image from 'next/image';
import MobileMenu from './MobileMenu';
import FavoritesIcon from './FavoritesIcon';
import styles from './Header.module.css';

export default function Header({ logoUrl }: { logoUrl?: string }) {
    const t = useTranslations('nav');
    const locale = useLocale();
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 80);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { href: '/', label: t('home') },
        { href: '/allcars', label: t('inventory') },
        { href: '/about', label: t('about') },
        { href: '/services', label: t('services') },
        { href: '/leasing', label: 'Leasing' },
        { href: '/contact', label: t('contact') },
    ];

    const isHome = pathname === '/';

    return (
        <>
            <MobileMenu
                isOpen={isMobileOpen}
                onClose={() => setIsMobileOpen(false)}
                navLinks={navLinks}
                locale={locale}
                pathname={pathname}
            />

            <header className={`${styles.header} ${isScrolled || !isHome ? styles.scrolled : ''}`}>
                <div className={`container ${styles.inner}`}>
                    {/* Logo */}
                    <Link href="/" className={styles.logo}>
                        <Image
                            src={logoUrl && logoUrl.length > 0 ? logoUrl : '/media/general/swiss-logo-2-red.png'}
                            alt="SwissCars Logo"
                            width={150}
                            height={50}
                            priority
                            className={styles.logoImg}
                        />
                    </Link>

                    {/* Desktop Nav */}
                    <nav className={styles.nav}>
                        <ul className={styles.navList}>
                            {navLinks.map((link) => (
                                <li key={link.href}>
                                    <a
                                        href={link.href}
                                        className={`${styles.navLink} ${pathname === link.href ? styles.navActive : ''}`}
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Right side: Language switcher + favorites + mobile toggle */}
                    <div className={styles.right}>
                        <FavoritesIcon />
                        <div className={styles.langSwitcher}>
                            <Link
                                href={pathname}
                                locale="ro"
                                className={`${styles.langBtn} ${locale === 'ro' ? styles.langActive : ''}`}
                                title="Română"
                            >
                                <Image src="/media/general/romanian-flag.png" alt="RO" width={22} height={16} />
                            </Link>
                            <Link
                                href={pathname}
                                locale="ru"
                                className={`${styles.langBtn} ${locale === 'ru' ? styles.langActive : ''}`}
                                title="Русский"
                            >
                                <Image src="/media/general/russian.png" alt="RU" width={22} height={16} />
                            </Link>
                            <Link
                                href={pathname}
                                locale="en"
                                className={`${styles.langBtn} ${locale === 'en' ? styles.langActive : ''}`}
                                title="English"
                            >
                                <Image src="/media/general/uk.png" alt="EN" width={22} height={16} />
                            </Link>
                        </div>

                        {/* Mobile hamburger */}
                        <button
                            className={`${styles.hamburger} ${isMobileOpen ? styles.hamburgerOpen : ''}`}
                            onClick={() => setIsMobileOpen(true)}
                            aria-label="Open menu"
                        >
                            <span />
                            <span />
                            <span />
                        </button>
                    </div>
                </div>
            </header>
        </>
    );
}
