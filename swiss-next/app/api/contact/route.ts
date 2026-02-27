import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIp } from '@/lib/utils/rateLimit';

const ContactSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long').trim(),
    phone: z.string().regex(/^\+?[\d\s\-()]{7,20}$/, 'Invalid phone number format'),
    email: z.string().email('Invalid email format').max(255).optional().or(z.literal('')),
    message: z.string().max(5000, 'Message too long').optional(),
    preferredDate: z.string().max(50).optional(),
    formType: z.enum(['contact', 'inquiry', 'callback']).optional().default('contact'),
});

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

        // Validate input with Zod
        const validation = ContactSchema.safeParse(body);
        if (!validation.success) {
            const errors = validation.error.issues.map(e => e.message).join(', ');
            return NextResponse.json({ error: errors }, { status: 400 });
        }

        const { name, phone, email, message, preferredDate, formType } = validation.data;

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
