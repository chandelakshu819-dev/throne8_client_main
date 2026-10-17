/**
 * src/shared/utils/safeRedirect.ts
 * Validates the ?redirect= value used after login so it can never become an open redirect.
 *
 * Allowed:
 *   - a same-site PATH ("/mentorship"), but not "//host", "/\host" or the auth pages themselves
 *   - an absolute URL whose ORIGIN is the Resume Builder app, or listed in
 *     NEXT_PUBLIC_ALLOWED_REDIRECT_ORIGINS (comma separated)
 * Anything else returns null and the caller falls back to HOME_PATH.
 */
import { RESUME_APP_URL } from '@/config/resume';

const AUTH_PAGES = ['/login', '/signup'];

const originOf = (value: string): string | null => {
    try {
        return new URL(value).origin;
    } catch {
        return null;
    }
};

const allowedOrigins = (): string[] => {
    const extra = (process.env.NEXT_PUBLIC_ALLOWED_REDIRECT_ORIGINS || '')
        .split(',')
        .map((o) => originOf(o.trim()))
        .filter((o): o is string => !!o);
    const resume = originOf(RESUME_APP_URL);
    return resume ? [resume, ...extra] : extra;
};

export const resolveSafeRedirect = (raw: string | null | undefined): string | null => {
    if (!raw) return null;

    // Same-site path
    if (raw.startsWith('/')) {
        if (raw.startsWith('//') || raw.startsWith('/\\')) return null;
        const path = raw.split(/[?#]/)[0];
        if (AUTH_PAGES.some((p) => path === p || path.startsWith(`${p}/`))) return null;
        return raw;
    }

    // Absolute URL: only allowlisted origins
    try {
        const url = new URL(raw);
        if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
        return allowedOrigins().includes(url.origin) ? url.href : null;
    } catch {
        return null;
    }
};

export const isExternalUrl = (target: string): boolean => /^https?:\/\//i.test(target);
