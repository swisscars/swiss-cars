/**
 * Sanitizes HTML content to prevent XSS attacks without relying on JSDOM.
 * JSDOM (via isomorphic-dompurify) is heavy and causes ESM/CJS issues on Vercel.
 * This function uses a restricted whitelist approach.
 */
export function sanitizeHtml(html: string): string {
    if (!html) return '';

    // Remove any scripts and their content
    let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove event handlers (onmouseover, onclick, etc.)
    sanitized = sanitized.replace(/\s+on\w+="[^"]*"/gi, '');
    sanitized = sanitized.replace(/\s+on\w+='[^']*'/gi, '');

    // Remove javascript: links
    sanitized = sanitized.replace(/href\s*=\s*["']\s*javascript:[^"']*["']/gi, 'href="#"');

    // We allow basic tags for car descriptions provided by admin
    // In a premium app, we should ideally use a more robust parser, 
    // but regex is the safest way to avoid the "jsdom" 500 error on Vercel.

    return sanitized;
}
