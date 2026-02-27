/**
 * Sanitizes HTML content to prevent XSS attacks without relying on JSDOM.
 * JSDOM (via isomorphic-dompurify) is heavy and causes ESM/CJS issues on Vercel.
 * This function uses a restricted whitelist approach.
 */
export function sanitizeHtml(html: string): string {
    if (!html) return '';

    // Remove any scripts and their content
    let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove iframe tags and their content
    sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    sanitized = sanitized.replace(/<iframe\b[^>]*>/gi, '');

    // Remove form tags (open and close)
    sanitized = sanitized.replace(/<\/?form\b[^>]*>/gi, '');

    // Remove input tags
    sanitized = sanitized.replace(/<input\b[^>]*>/gi, '');

    // Remove event handlers (onmouseover, onclick, etc.)
    sanitized = sanitized.replace(/\s+on\w+="[^"]*"/gi, '');
    sanitized = sanitized.replace(/\s+on\w+='[^']*'/gi, '');

    // Remove javascript: links
    sanitized = sanitized.replace(/href\s*=\s*["']\s*javascript:[^"']*["']/gi, 'href="#"');

    return sanitized;
}
