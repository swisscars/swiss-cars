import { getLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getCarBySlug } from '@/lib/supabase/queries';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { formatPrice } from '@/lib/utils/format';
import CarGallery from '@/components/cars/detail/CarGallery';
import CarSpecsGrid from '@/components/cars/detail/CarSpecsGrid';
import CarLeadForm from '@/components/cars/detail/CarLeadForm';
import SimilarCars from '@/components/cars/detail/SimilarCars';
import FavoriteButton from '@/components/cars/FavoriteButton';
import styles from './page.module.css';

type Props = {
    params: Promise<{
        locale: string;
        slug: string;
    }>;
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const car = await getCarBySlug(slug);
    if (!car) return {};
    const primaryImage = car.car_images?.find((img: any) => img.is_primary) || car.car_images?.[0];
    return {
        title: `${car.brand} ${car.model} ${car.year} | SwissCars.md`,
        description: `${car.brand} ${car.model} ${car.year} — ${formatPrice(car.price)} €. Import auto din Elveția.`,
        openGraph: {
            images: primaryImage?.url ? [{ url: primaryImage.url }] : [],
        },
    };
}

export default async function CarDetailPage({ params }: Props) {
    const { locale, slug } = await params;
    const car = await getCarBySlug(slug);
    const t = await getTranslations('car_detail');

    if (!car) notFound();

    const getTranslatedDescription = () => {
        if (!car.description) return '';
        if (typeof car.description === 'string') return car.description;
        const desc = car.description as any;
        return desc[locale] || desc['ro'] || '';
    };

    return (
        <>
            <main className={styles.main}>
                {/* Breadcrumb Header */}
                <div className={styles.premiumHeader}>
                    <div className="container">
                        <div className={styles.breadcrumb}>
                            <a href="/">Home</a> / <a href="/allcars">Inventory</a> / {car.brand} {car.model}
                        </div>
                    </div>
                </div>

                <div className="container">
                    <div className={styles.layout}>
                        {/* Left: Gallery + Specs */}
                        <div className={styles.content}>
                            <CarGallery images={car.car_images || []} />

                            <section className={styles.section}>
                                <h2 className={styles.sectionTitle}>{t('characteristics')}</h2>
                                <CarSpecsGrid car={car} />
                            </section>

                            {getTranslatedDescription() && (
                                <section className={styles.section}>
                                    <h2 className={styles.sectionTitle}>{t('general_info')}</h2>
                                    <div
                                        className={styles.description}
                                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(getTranslatedDescription()) }}
                                    />
                                </section>
                            )}
                        </div>

                        {/* Right: Sidebar */}
                        <aside className={styles.sidebar}>
                            <div className={styles.sticky}>
                                {/* Price Card */}
                                <div className={styles.card}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                                        <div>
                                            <h1 className={styles.title}>{car.brand} {car.model}</h1>
                                            <div className={styles.year}>{car.year}</div>
                                        </div>
                                        <FavoriteButton carId={car.id ?? ''} carSlug={car.slug} carName={`${car.brand} ${car.model}`} />
                                    </div>

                                    <div className={styles.priceWrapper}>
                                        <span className={styles.priceLabel}>{t('price')}</span>
                                        <div className={styles.price}>
                                            {formatPrice(car.price)} €
                                        </div>
                                        <div className={styles.taxes}>{t('taxes_included')}</div>
                                    </div>
                                </div>

                                {/* Lead Contact Form */}
                                <div className={styles.card} style={{ marginTop: '20px' }}>
                                    <h3 className={styles.contactTitle}>Trimite o cerere</h3>
                                    <p className={styles.contactSubtitle}>Te contactăm rapid cu detalii și disponibilitate.</p>
                                    <CarLeadForm
                                        carId={car.id ?? ''}
                                        carName={`${car.brand} ${car.model} ${car.year}`}
                                        carPrice={car.price}
                                    />
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>

            <SimilarCars
                currentCarId={car.id ?? ''}
                brand={car.brand}
                price={car.price}
            />
        </>
    );
}
