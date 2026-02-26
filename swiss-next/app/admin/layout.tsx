import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { getUser } from '@/lib/actions/auth';
import { ToastProvider } from '@/components/ui/Toast';
import styles from './layout.module.css';
import '@/app/globals.css';

export default async function AdminLayout({ children }: { children: ReactNode }) {
    const user = await getUser();

    if (!user) {
        redirect('/login');
    }

    return (
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
    );
}
