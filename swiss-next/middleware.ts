import { type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { updateSession } from './lib/supabase/middleware';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // 1. Admin routes: check auth session
    if (pathname.startsWith('/admin')) {
        return await updateSession(request);
    }

    // 2. API/login/auth routes: no intl, no auth check needed
    if (
        pathname.startsWith('/api') ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/auth')
    ) {
        return;
    }

    // 3. Public routes: apply intl middleware only (no auth check)
    return intlMiddleware(request);
}

export const config = {
    // Match internationalized pathnames, excluding admin, api, login, and auth
    matcher: ['/((?!admin|api|login|auth|_next|_vercel|.*\\..*).*)'],
};
