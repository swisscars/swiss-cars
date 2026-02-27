'use server';

import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/utils/rateLimit';
import { revalidatePath } from 'next/cache';
import { sendTelegramNotification, sendEmailNotification } from '@/lib/utils/notifications';
import { getSettings } from './settings';

export type LeadInquiry = {
    car_id: string;
    car_name: string;
    name: string;
    phone: string;
    email?: string;
    message?: string;
};

export async function submitLeadInquiry(data: LeadInquiry) {
    // Rate limiting: 5 submissions per minute per phone number
    const identifier = `lead:${data.phone.replace(/\D/g, '')}`;
    const rateCheck = checkRateLimit(identifier, { limit: 5, windowMs: 60000 });

    if (!rateCheck.success) {
        return {
            success: false,
            error: 'Too many submissions. Please wait a minute and try again.',
            rateLimited: true
        };
    }

    const supabase = await createClient();

    const { error } = await supabase.from('leads_inquiries').insert({
        car_id: data.car_id,
        car_name: data.car_name,
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        message: data.message || null,
        created_at: new Date().toISOString(),
    });

    if (error) {
        console.error('Lead submission error:', error);
        return { success: false, error: error.message };
    }

    // Trigger notifications in background
    try {
        const settings = await getSettings('site_config');
        if (settings) {
            // Telegram
            if (settings.telegram_bot_token && settings.telegram_chat_id) {
                void sendTelegramNotification(
                    settings.telegram_bot_token,
                    settings.telegram_chat_id,
                    data
                );
            }
            // Email
            if (settings.notification_email) {
                void sendEmailNotification(
                    settings.notification_email,
                    data
                );
            }
        }
    } catch (notifyError) {
        console.error('Notification trigger error:', notifyError);
    }

    return { success: true };
}

export async function markLeadRead(id: string, is_read: boolean) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('leads_inquiries')
        .update({ is_read })
        .eq('id', id);

    if (error) {
        console.error('markLeadRead error:', error);
        return { success: false };
    }
    revalidatePath('/admin/leads');
    return { success: true };
}

export async function markLeadImportant(id: string, is_important: boolean) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('leads_inquiries')
        .update({ is_important })
        .eq('id', id);

    if (error) {
        console.error('markLeadImportant error:', error);
        return { success: false };
    }
    revalidatePath('/admin/leads');
    return { success: true };
}

export async function deleteLead(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('leads_inquiries')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('deleteLead error:', error);
        return { success: false };
    }
    revalidatePath('/admin/leads');
    return { success: true };
}

export async function markAllLeadsRead() {
    const supabase = await createClient();
    const { error } = await supabase
        .from('leads_inquiries')
        .update({ is_read: true })
        .eq('is_read', false);

    if (error) {
        console.error('markAllLeadsRead error:', error);
        return { success: false };
    }
    revalidatePath('/admin/leads');
    return { success: true };
}
