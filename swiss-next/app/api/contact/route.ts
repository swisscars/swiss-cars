import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIp } from '@/lib/utils/rateLimit';

export async function POST(req: NextRequest) {
    try {
        // Rate limiting: 10 requests per minute per IP
        const clientIp = getClientIp(req);
        const rateLimit = checkRateLimit(`contact:${clientIp}`, {
            limit: 10,
            windowMs: 60000,
        });

        if (!rateLimit.success) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
                        'X-RateLimit-Remaining': '0',
                    },
                }
            );
        }

        const body = await req.json();
        const { name, phone, email, message, preferredDate, formType } = body;

        if (!name || !phone) {
            return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
        }

        const supabase = await createClient();

        const { error } = await supabase.from('contact_messages').insert({
            name,
            phone,
            email: email || null,
            message: message || null,
            preferred_date: preferredDate || null,
            form_type: formType || 'contact',
            created_at: new Date().toISOString(),
            is_read: false,
        });

        if (error) {
            console.error('Contact form error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Contact API error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
