import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';
import { getSettings } from '@/lib/actions/settings';
import { getUser } from '@/lib/actions/auth';
import { ToastProvider } from '@/components/ui/Toast';
import '@/app/globals.css';

export default async function AdminLayout({ children }: { children: ReactNode }) {
    const [user, siteConfig] = await Promise.all([
        getUser(),
        getSettings('site_config')
    ]);

    if (!user) {
        redirect('/login');
    }

    const logoUrl = (siteConfig as any)?.logo_url;

    return (
<<<<<<< Updated upstream
        <ToastProvider>
            <div className={styles.layout}>
                <AdminSidebar userEmail={user.email} />
                <main className={styles.main}>
                    <header className={styles.header}>
                        <div className={styles.headerTitle}>SwissCars Admin</div>
                        <div className={styles.userInfo}>
                            <span className={styles.userRole}>{user.email}</span>
                        </div>
                    </header>
                    <div className={styles.content}>
                        {children}
                    </div>
                </main>
            </div>
        </ToastProvider>
=======
        <html lang="ro" suppressHydrationWarning>
            <body suppressHydrationWarning>
                <ToastProvider>
                    <AdminLayoutClient userEmail={user.email} logoUrl={logoUrl}>
                        {children}
                    </AdminLayoutClient>
                </ToastProvider>
            </body>
        </html>
>>>>>>> Stashed changes
    );
}
