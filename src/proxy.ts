//src/proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
    HOME_PATH,
    IS_MENTORSHIP_MODE,
    isPathAllowedInLaunchMode,
} from '@/config/launch';

// Must match AUTH_COOKIE_NAME in lib/store/token.storage.ts
const AUTH_COOKIE_NAME = 'throne8_auth';

// Logged-out user ko pehle ye page dikhana hai (throne8.com kholne par)
const PUBLIC_LANDING_PATH = '/mentorship';

// Ye exact paths bina login ke khule rahenge (sub-pages protected hi rahenge)
const PUBLIC_EXACT_PATHS = [PUBLIC_LANDING_PATH];

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

function isPublicExactPath(pathname: string): boolean {
    const normalized =
        pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
    return PUBLIC_EXACT_PATHS.includes(normalized);
}

function isProtectedPath(pathname: string): boolean {
    if (isPublicExactPath(pathname)) return false;
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

    // Case -1: Root "/" -> server par hi redirect (blank navbar flash nahi aayega)
    // Logged-in -> HOME_PATH, logged-out -> Mentorship page (login nahi)
    if (pathname === '/') {
        const target = isLoggedIn ? HOME_PATH : PUBLIC_LANDING_PATH;
        return NextResponse.redirect(new URL(target, request.url));
    }

    // Case 0: Launch mode me band kiye hue pages -> redirect
    if (IS_MENTORSHIP_MODE && !isPathAllowedInLaunchMode(pathname)) {
        const target = isLoggedIn ? HOME_PATH : '/login';
        return NextResponse.redirect(new URL(target, request.url));
    }

    // Case 1: Protected route without auth cookie -> redirect to login
    if (isProtectedPath(pathname) && !isLoggedIn) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Case 2: Auth-only page (login/signup) while already logged in -> home
    if (isAuthOnlyPath(pathname) && isLoggedIn) {
        return NextResponse.redirect(new URL(HOME_PATH, request.url));
    }

    return NextResponse.next();
}

// Matcher: static files, images, fonts, json/txt/xml, API health-check skip
export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|api/health|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|json|txt|xml|mp3|mp4|woff|woff2|map)$).*)',
    ],
};