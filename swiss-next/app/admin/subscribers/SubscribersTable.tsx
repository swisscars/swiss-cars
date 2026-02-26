'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, ToggleLeft, ToggleRight, Mail } from 'lucide-react';
import { deleteSubscriber, toggleSubscriberStatus, type Subscriber } from '@/lib/actions/subscribers';
import { useToast } from '@/components/ui/Toast';
import { formatDistanceToNow } from 'date-fns';

type Props = {
    subscribers: Subscriber[];
};

export default function SubscribersTable({ subscribers }: Props) {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this subscriber?')) return;

        setLoading(id);
        const result = await deleteSubscriber(id);
        setLoading(null);

        if (result.success) {
            toast.success('Subscriber deleted');
            router.refresh();
        } else {
            toast.error('Failed to delete subscriber');
        }
    };

    const handleToggle = async (id: string, currentStatus: boolean) => {
        setLoading(id);
        const result = await toggleSubscriberStatus(id, !currentStatus);
        setLoading(null);

        if (result.success) {
            toast.success(currentStatus ? 'Subscriber deactivated' : 'Subscriber activated');
            router.refresh();
        } else {
            toast.error('Failed to update subscriber');
        }
    };

    if (subscribers.length === 0) {
        return (
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '60px 40px',
                textAlign: 'center',
                border: '1px dashed #ddd'
            }}>
                <Mail size={48} color="#ccc" style={{ marginBottom: '16px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>No subscribers yet</h3>
                <p style={{ color: '#666', fontSize: '14px' }}>
                    Newsletter subscribers will appear here when users sign up.
                </p>
            </div>
        );
    }

    return (
        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #eee' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ background: '#f9f9f9', borderBottom: '1px solid #eee' }}>
                        <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: '#666' }}>Email</th>
                        <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: '#666' }}>Status</th>
                        <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: '#666' }}>Subscribed</th>
                        <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: '#666' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {subscribers.map((sub) => (
                        <tr key={sub.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '16px 20px' }}>
                                <a href={`mailto:${sub.email}`} style={{ color: '#333', fontWeight: '500' }}>
                                    {sub.email}
                                </a>
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                                <span style={{
                                    display: 'inline-block',
                                    padding: '4px 10px',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    background: sub.is_active ? '#dcfce7' : '#fee2e2',
                                    color: sub.is_active ? '#16a34a' : '#dc2626'
                                }}>
                                    {sub.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td style={{ padding: '16px 20px', color: '#666', fontSize: '14px' }}>
                                {formatDistanceToNow(new Date(sub.subscribed_at), { addSuffix: true })}
                            </td>
                            <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={() => handleToggle(sub.id, sub.is_active)}
                                        disabled={loading === sub.id}
                                        title={sub.is_active ? 'Deactivate' : 'Activate'}
                                        style={{
                                            background: 'none',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px',
                                            padding: '8px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            opacity: loading === sub.id ? 0.5 : 1
                                        }}
                                    >
                                        {sub.is_active ? <ToggleRight size={16} color="#16a34a" /> : <ToggleLeft size={16} color="#999" />}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(sub.id)}
                                        disabled={loading === sub.id}
                                        title="Delete subscriber"
                                        style={{
                                            background: 'none',
                                            border: '1px solid #fecaca',
                                            borderRadius: '6px',
                                            padding: '8px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            opacity: loading === sub.id ? 0.5 : 1
                                        }}
                                    >
                                        <Trash2 size={16} color="#dc2626" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
