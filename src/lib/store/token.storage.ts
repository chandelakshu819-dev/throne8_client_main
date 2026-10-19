// src/lib/store/token.storage.ts
//
// Tokens are kept in localStorage. This class also keeps:
//   - the basic user info (userId / email / role) for the UI
//   - a "logged in" flag cookie (throne8_auth=1) that the Next.js proxy
//     (src/proxy.ts) can read on the Edge runtime

interface UserData {
    userId: string;
    email: string;
    role: string;
    emailVerified?: boolean;
}

interface TokenData {
    accessToken: string;
    refreshToken: string;
    expiresIn: string | number;
}

// proxy.ts mein bhi yahi naam hona chahiye
const AUTH_COOKIE_NAME = 'throne8_auth';

// Ye refresh token ki life se zyada nahi honi chahiye
const AUTH_COOKIE_MAX_AGE_DAYS = 30;

// JWT = 3 base64url parts. "undefined", "null", "" jaisi garbage values yahan fail hongi.
const JWT_SHAPE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

function looksLikeJwt(value: string | null | undefined): value is string {
    return typeof value === 'string' && JWT_SHAPE.test(value);
}

/**
 * expiresIn ko milliseconds mein badalta hai.
 * Number: seconds ("900" bhi seconds)
 * String: "15m", "1h", "7d", "30s" ya "900"
 */
function parseExpiresInToMs(expiresIn: string | number): number {
    const DEFAULT_MS = 15 * 60 * 1000;

    if (typeof expiresIn === 'number') {
        return expiresIn > 0 ? expiresIn * 1000 : DEFAULT_MS;
    }

    const match = String(expiresIn).trim().match(/^(\d+)\s*([smhd])?$/i);
    if (!match) return DEFAULT_MS;

    const value = parseInt(match[1], 10);
    if (!value) return DEFAULT_MS;

    switch ((match[2] || 's').toLowerCase()) {
        case 'm':
            return value * 60 * 1000;
        case 'h':
            return value * 60 * 60 * 1000;
        case 'd':
            return value * 24 * 60 * 60 * 1000;
        case 's':
        default:
            return value * 1000;
    }
}

class TokenStorage {
    private static readonly ACCESS_TOKEN_KEY = 'throne8_access_token';
    private static readonly REFRESH_TOKEN_KEY = 'throne8_refresh_token';
    private static readonly USER_DATA_KEY = 'throne8_user_data';
    private static readonly TOKEN_EXPIRY_KEY = 'throne8_token_expiry';

    // Middleware (Edge runtime) ko localStorage nahi dikhta, isliye
    // "logged in hai" ka ek halka flag cookie mein rakhte hain.
    private static setAuthCookie(): void {
        if (typeof document === 'undefined') return;
        const maxAgeSeconds = AUTH_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
        document.cookie = `${AUTH_COOKIE_NAME}=1; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
    }

    private static clearAuthCookie(): void {
        if (typeof document === 'undefined') return;
        document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
    }

    private static writeExpiry(expiresIn: string | number): void {
        const expiryTime = Date.now() + parseExpiresInToMs(expiresIn);
        localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
    }

    /**
     * Proxy cookie ko localStorage ke saath sync karo (AuthProvider app load par call karta hai).
     * - Session zinda hai  -> cookie dobara set
     * - Session nahi hai   -> purani/stale cookie hata do (warna proxy /login se bahar
     *   bhejta rahega aur loop ban sakta hai)
     */
    static syncAuthCookie(): void {
        if (typeof window === 'undefined') return;
        if (this.isAuthenticated()) {
            this.setAuthCookie();
        } else {
            this.clearAuthCookie();
        }
    }

    /**
     * Login ke baad tokens aur user data store karo
     */
    static setAuthData(tokens: TokenData, user: UserData): void {
        try {
            if (typeof window === 'undefined') return;

            if (!looksLikeJwt(tokens.accessToken) || !looksLikeJwt(tokens.refreshToken)) {
                throw new Error('Server returned malformed tokens');
            }

            localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
            localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
            localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(user));
            this.writeExpiry(tokens.expiresIn);
            this.setAuthCookie();
        } catch (error) {
            console.error('[TokenStorage] Failed to store auth data:', error);
            throw new Error('Failed to store authentication data');
        }
    }

    static getAccessToken(): string | null {
        if (typeof window === 'undefined') return null;
        try {
            const token = localStorage.getItem(this.ACCESS_TOKEN_KEY);
            return looksLikeJwt(token) ? token : null;
        } catch (error) {
            console.error('[TokenStorage] Error getting access token:', error);
            return null;
        }
    }

    static updateRefreshToken(refreshToken: string): void {
        if (typeof window === 'undefined') return;
        if (!looksLikeJwt(refreshToken)) {
            console.error('[TokenStorage] Ignoring malformed refresh token');
            return;
        }
        localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
        // Refresh token naya mila, matlab user abhi bhi logged in hai
        this.setAuthCookie();
    }

    static getRefreshToken(): string | null {
        if (typeof window === 'undefined') return null;
        try {
            const token = localStorage.getItem(this.REFRESH_TOKEN_KEY);
            if (!token) return null;
            if (!looksLikeJwt(token)) {
                // Garbage value (e.g. "undefined") server ko bhejne se "jwt malformed" 401 aata hai
                console.warn('[TokenStorage] Stored refresh token is malformed, ignoring it');
                return null;
            }
            return token;
        } catch (error) {
            console.error('[TokenStorage] Error getting refresh token:', error);
            return null;
        }
    }

    static getUserData(): UserData | null {
        if (typeof window === 'undefined') return null;
        try {
            const userData = localStorage.getItem(this.USER_DATA_KEY);
            if (!userData) return null;
            return JSON.parse(userData) as UserData;
        } catch (error) {
            console.error('[TokenStorage] Error parsing user data:', error);
            return null;
        }
    }

    /**
     * Update stored user data (e.g. after a profile photo change) without touching the session
     */
    static updateUserData(userData: UserData): void {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
        } catch (error) {
            console.error('[TokenStorage] Error updating user data:', error);
        }
    }

    /**
     * Access token expire hua ya nahi (30 second ka buffer ke saath)
     */
    static isTokenExpired(): boolean {
        if (typeof window === 'undefined') return true;
        try {
            const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
            if (!expiryTime) return true;
            return Date.now() >= parseInt(expiryTime, 10) - 30 * 1000;
        } catch {
            return true;
        }
    }

    /**
     * User logged in hai ya nahi. Access token expire hone se logout nahi
     * maana jata; sirf refresh token + user data dekhte hain.
     */
    static isAuthenticated(): boolean {
        if (typeof window === 'undefined') return false;
        return !!(this.getRefreshToken() && this.getUserData());
    }

    static needsTokenRefresh(): boolean {
        if (typeof window === 'undefined') return false;
        if (!this.getRefreshToken()) return false;
        return this.isTokenExpired();
    }

    /**
     * Saara auth data hatao. Sirf user ke Sign Out par ya refresh token
     * definitely invalid hone par call hona chahiye.
     * `reason` sirf debugging ke liye hai (kaun logout trigger kar raha hai).
     */
    static clearAuthData(reason?: string): void {
        if (typeof window === 'undefined') return;

        console.warn(`[TokenStorage] clearAuthData reason="${reason ?? 'unspecified'}"`);
        if (process.env.NODE_ENV === 'development') {
            console.trace('[TokenStorage] clearAuthData called from:');
        }

        try {
            localStorage.removeItem(this.ACCESS_TOKEN_KEY);
            localStorage.removeItem(this.REFRESH_TOKEN_KEY);
            localStorage.removeItem(this.USER_DATA_KEY);
            localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
            this.clearAuthCookie();
        } catch (error) {
            console.error('[TokenStorage] Error clearing auth data:', error);
        }
    }

    static updateAccessToken(accessToken: string, expiresIn: string | number): void {
        if (typeof window === 'undefined') return;
        if (!looksLikeJwt(accessToken)) {
            console.error('[TokenStorage] Ignoring malformed access token');
            return;
        }
        try {
            localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
            this.writeExpiry(expiresIn);
            this.setAuthCookie();
        } catch (error) {
            console.error('[TokenStorage] Error updating access token:', error);
        }
    }

    static getAuthSummary() {
        return {
            isAuthenticated: this.isAuthenticated(),
            hasAccessToken: !!this.getAccessToken(),
            hasRefreshToken: !!this.getRefreshToken(),
            userData: this.getUserData(),
            tokenExpired: this.isTokenExpired(),
        };
    }
}

export default TokenStorage;
export type { UserData, TokenData };