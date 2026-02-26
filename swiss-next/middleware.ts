import { type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { updateSession } from './lib/supabase/middleware';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
    // 1. Update Supabase session
    const response = await updateSession(request);

    // 2. If it's an admin/api/login/auth route, don't apply intl
    const pathname = request.nextUrl.pathname;
    if (
        pathname.startsWith('/admin') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/auth')
    ) {
        return response;
    }

    // 3. Apply intl middleware
    return intlMiddleware(request);
}

export const config = {
    // Match internationalized pathnames, excluding admin, api, login, and auth
    matcher: ['/', '/(ro|ru|en)/:path*', '/((?!admin|api|login|auth|_next|_vercel|.*\\..*).*)'],
};
