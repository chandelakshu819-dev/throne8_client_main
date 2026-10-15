/**
 * src/config/resume.ts
 * Resume Builder is a separate app (Vite + React on Vercel). The navbar "Resume" item opens it.
 * It shares the login through the `.throne8.com` session cookie, so it works without another login
 * once both apps run on throne8.com subdomains.
 *
 * NEXT_PUBLIC_RESUME_APP_URL  e.g. https://resume.throne8.com  (value is inlined at build time)
 */
export const RESUME_APP_URL: string = (
    process.env.NEXT_PUBLIC_RESUME_APP_URL ||
    (process.env.NODE_ENV === 'development'
        ? 'http://localhost:5173'
        : 'https://resume.throne8.com')
).replace(/\/+$/, '');

/** Opens the Resume Builder in a new tab (Throne8 stays open). */
export const openResumeApp = (): void => {
    if (typeof window === 'undefined') return;
    window.open(RESUME_APP_URL, '_blank', 'noopener,noreferrer');
};

// Document icon (heroicons "document-text") for the navbar
export const RESUME_ICON_PATH =
    'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
