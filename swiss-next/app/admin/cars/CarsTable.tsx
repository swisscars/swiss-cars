'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Edit2, Trash2, Eye } from 'lucide-react';
import DataTable from '@/components/admin/DataTable';
import Pagination from '@/components/ui/Pagination';
import styles from './page.module.css';
import { type Car } from '@/lib/types';
import { deleteCar } from '@/lib/actions/cars';
import { formatPrice } from '@/lib/utils/format';

type Props = {
    cars: Car[];
    currentPage: number;
    totalPages: number;
};

export default function CarsTable({ cars, currentPage, totalPages }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', page.toString());
        router.push(`?${params.toString()}`);
    };

    const onDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this car?')) return;
        try {
            await deleteCar(id);
            router.refresh();
        } catch (error) {
            alert('Delete failed');
        }
    };
    const columns = [
        {
            header: 'Car',
            accessor: (car: Car) => (
                <div className={styles.carInfo}>
                    <span className={styles.carName}>{car.brand} {car.model}</span>
                    <span className={styles.carSlug}>{car.slug}</span>
                </div>
            )
        },
        { header: 'Year', accessor: (car: Car) => car.year },
        {
            header: 'Price',
            accessor: (car: Car) => `${formatPrice(car.price)} €`
        },
        {
            header: 'Status',
            accessor: (car: Car) => (
                <span className={car.is_available ? styles.badgeSuccess : styles.badgeError}>
                    {car.is_available ? 'Available' : 'Sold'}
                </span>
            )
        },
    ];

    return (
        <>
            <DataTable
                data={cars}
                columns={columns as any}
                actions={(car) => (
                    <div className={styles.actions}>
                        <Link href={`/en/cars/${car.slug}`} target="_blank" className={styles.actionBtn}>
                            <Eye size={16} />
                        </Link>
                        <Link href={`/admin/cars/${car.id}`} className={styles.actionBtn}>
                            <Edit2 size={16} />
                        </Link>
                        <button
                            className={`${styles.actionBtn} ${styles.deleteBtn}`}
                            onClick={() => onDelete(car.id!)}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
            />
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />
        </>
    );
}
