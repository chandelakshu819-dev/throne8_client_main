/**
 * src/lib/referral.ts
 * Remembers the referral code from a share link (/signup?ref=CODE) until the
 * person finishes signing up. localStorage is used (not sessionStorage) so the
 * code survives the Google sign-in detour and a closed tab.
 */
const STORAGE_KEY = 'throne8_referral_code';
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Letters and digits only, so nothing odd can be stored or sent to the server
const CODE_PATTERN = /^[A-Za-z0-9]{4,32}$/;

interface StoredReferral {
    code: string;
    expiresAt: number;
}

const canUseStorage = (): boolean => typeof window !== 'undefined';

/** Save a code from the URL. Invalid codes are ignored. */
export const captureReferralCode = (raw: string | null | undefined): void => {
    if (!canUseStorage() || !raw) return;
    const code = raw.trim();
    if (!CODE_PATTERN.test(code)) return;

    try {
        const value: StoredReferral = { code: code.toUpperCase(), expiresAt: Date.now() + TTL_MS };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
        // Storage can be blocked (private mode): signup still works, just without the bonus
    }
};

/** The saved code, or undefined when there is none or it has expired. */
export const getStoredReferralCode = (): string | undefined => {
    if (!canUseStorage()) return undefined;

    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (!stored) return undefined;

        const parsed = JSON.parse(stored) as Partial<StoredReferral>;
        if (
            typeof parsed.code !== 'string' ||
            typeof parsed.expiresAt !== 'number' ||
            parsed.expiresAt < Date.now() ||
            !CODE_PATTERN.test(parsed.code)
        ) {
            window.localStorage.removeItem(STORAGE_KEY);
            return undefined;
        }
        return parsed.code;
    } catch {
        return undefined;
    }
};

/** Call after a successful registration so the code is never reused. */
export const clearReferralCode = (): void => {
    if (!canUseStorage()) return;
    try {
        window.localStorage.removeItem(STORAGE_KEY);
    } catch {
        // nothing to do
    }
};
