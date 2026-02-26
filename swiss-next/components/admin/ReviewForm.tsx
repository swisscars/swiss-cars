'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, ArrowLeft, AlertCircle, X } from 'lucide-react';
import { saveReview } from '@/lib/actions/content';
import Link from 'next/link';
import { useForm } from 'react-hook-form';

export default function ReviewForm({ initialData }: { initialData?: any }) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { register, handleSubmit } = useForm({
        defaultValues: initialData || {
            name: '', rating: 5, is_visible: true, content_ro: '', content_ru: '', content_en: ''
        }
    });

    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        setError(null);
        try {
            await saveReview(data);
            router.push('/admin/reviews');
            router.refresh();
        } catch (e) {
            setError('Error saving review. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h2>{initialData ? 'Edit Review' : 'New Review'}</h2>
                <Link href="/admin/reviews" className="btn btn-outline" style={{ borderColor: 'var(--color-gray-2)', color: '#333' }}><ArrowLeft size={16} /> Back</Link>
            </div>

            {error && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    color: '#dc2626',
                    fontSize: '14px',
                }}>
                    <AlertCircle size={18} />
                    <span style={{ flex: 1 }}>{error}</span>
                    <button
                        type="button"
                        onClick={() => setError(null)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label>Author Name</label>
                <input {...register('name')} required style={{ padding: '10px' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label>Rating (1-5)</label>
                <input type="number" min="1" max="5" {...register('rating')} required style={{ padding: '10px' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label>Visibility</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" {...register('is_visible')} /> Show on website
                </label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label>Review (RO)</label>
                <textarea rows={3} {...register('content_ro')} style={{ padding: '10px', resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label>Review (RU)</label>
                <textarea rows={3} {...register('content_ru')} style={{ padding: '10px', resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label>Review (EN)</label>
                <textarea rows={3} {...register('content_en')} style={{ padding: '10px', resize: 'vertical' }} />
            </div>

            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                Save
            </button>
        </form>
    );
}
