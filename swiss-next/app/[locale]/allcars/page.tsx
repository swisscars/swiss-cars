import { getCarsPaginated } from '@/lib/supabase/queries';
import CarsGridPaginated from '@/components/cars/CarsGridPaginated';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

type Props = {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;

    const titles: Record<string, string> = {
        ro: 'Mașini în Stoc | SwissCars',
        ru: 'Автомобили в Наличии | SwissCars',
        en: 'Cars in Stock | SwissCars',
    };

    return {
        title: titles[locale] || titles.ro,
        description: 'Vezi toate mașinile disponibile la SwissCars.',
    };
}

export default async function InventoryPage({ searchParams }: Props) {
    const t = await getTranslations('offers');
    const resolvedParams = await searchParams;
    const page = parseInt(resolvedParams.page || '1', 10);

    const { data: cars, totalPages, totalCount } = await getCarsPaginated({
        page,
        limit: 12,
    });

    return (
        <main style={{ paddingTop: '80px', minHeight: '80vh', background: 'var(--color-bg)' }}>
            <div className="container" style={{ marginBottom: '40px' }}>
                <h1 className="ui-title" style={{ marginTop: '20px' }}>{t('all_cars_title') || 'Inventory'}</h1>
                <p style={{ color: 'var(--color-text-muted)', marginTop: '10px' }}>
                    {totalCount} {totalCount === 1 ? 'car' : 'cars'} available
                </p>
            </div>
            <CarsGridPaginated
                cars={cars}
                currentPage={page}
                totalPages={totalPages}
            />
        </main>
    );
}
