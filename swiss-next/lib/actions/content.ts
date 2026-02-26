'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function saveReview(data: any) {
    const supabase = await createClient();
    const { id, ...reviewData } = data;

    if (id) {
        const { error } = await supabase.from('reviews').update(reviewData).eq('id', id);
        if (error) throw error;
    } else {
        const { error } = await supabase.from('reviews').insert(reviewData);
        if (error) throw error;
    }

    revalidatePath('/', 'layout');
    revalidatePath('/admin/reviews');
    return { success: true };
}

export async function savePartner(data: any) {
    const supabase = await createClient();
    const { id, ...partnerData } = data;

    if (id) {
        const { error } = await supabase.from('partners').update(partnerData).eq('id', id);
        if (error) throw error;
    } else {
        const { error } = await supabase.from('partners').insert(partnerData);
        if (error) throw error;
    }

    revalidatePath('/', 'layout');
    revalidatePath('/admin/partners');
    return { success: true };
}

export async function deleteReview(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (error) throw error;
    revalidatePath('/', 'layout');
    revalidatePath('/admin/reviews');
    return { success: true };
}

export async function deletePartner(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('partners').delete().eq('id', id);
    if (error) throw error;
    revalidatePath('/', 'layout');
    revalidatePath('/admin/partners');
    return { success: true };
}

