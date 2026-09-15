import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ⚠️ Must match AUTH_COOKIE_NAME in lib/store/token.storage.ts
const AUTH_COOKIE_NAME = 'throne8_auth';

// Routes that require authentication
const PROTECTED_PREFIXES = [
    '/dashboard',
    '/profile',
    '/network',
    '/messaging',
    '/message',
    '/notifications',
    '/mentorship',
    '/job',
    '/study',
    '/student-dashboard',
    '/create-company',
    '/user-company',
];

// Routes only for logged-OUT users (redirect away if already logged in)
const AUTH_ONLY_PREFIXES = [
    '/login',
    '/signup',
    '/forgot-my-password',
];

function isProtectedPath(pathname: string): boolean {
    return PROTECTED_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
}

function isAuthOnlyPath(pathname: string): boolean {
    return AUTH_ONLY_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
}

// Next.js 16+ uses "proxy" as the named export instead of "middleware"
export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isLoggedIn = request.cookies.get(AUTH_COOKIE_NAME)?.value === '1';

    // Case 1: Protected route without auth cookie → redirect to login
    if (isProtectedPath(pathname) && !isLoggedIn) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Case 2: Auth-only page (login/signup) while already logged in → redirect to dashboard
    if (isAuthOnlyPath(pathname) && isLoggedIn) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

// Matcher: skip static files, images, API health-check
export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|api/health|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js)$).*)',
    ],
};