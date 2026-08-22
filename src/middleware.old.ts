// src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ⚠️ Ye naam EXACTLY wahi hona chahiye jo lib/store/token.storage.ts
// mein AUTH_COOKIE_NAME mein set hai — dono jagah 'throne8_auth'
const AUTH_COOKIE_NAME = 'throne8_auth';

// Jo routes login ke bina access nahi hone chahiye
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

// Jo routes sirf logged-OUT users ke liye hone chahiye
// (already logged in ho to inhe dobara dekhne ki zarurat nahi)
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

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isLoggedIn = request.cookies.get(AUTH_COOKIE_NAME)?.value === '1';

    // Case 1: Protected route, no auth cookie -> login pe bhejo
    if (isProtectedPath(pathname) && !isLoggedIn) {
        const loginUrl = new URL('/login', request.url);
        // Login ke baad wapas isi page par bhejne ke liye
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Case 2: Login/signup page, but already logged in -> dashboard pe bhejo
    if (isAuthOnlyPath(pathname) && isLoggedIn) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

// Middleware kaunse routes par chalega — static files/api/_next ko skip karo
export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|api/health|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js)$).*)',
    ],
};