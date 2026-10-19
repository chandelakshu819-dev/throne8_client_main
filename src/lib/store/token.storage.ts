// src/lib/store/token.storage.ts
//
// Dono modes support karta hai:
//   - Cookie-session: backend httpOnly cookies set karta hai, yahan sirf user data rakhte hain
//     -> TokenStorage.setAuthData(user)
//   - Token mode: tokens localStorage mein rakhte hain
//     -> TokenStorage.setAuthData(tokens, user)
// Plus ek "logged in" flag cookie (throne8_auth=1) jo src/proxy.ts padhta hai.

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

/**
 * Token ka format check nahi karte (JWT ho ya na ho), sirf garbage reject karte hain.
 */
function isUsableToken(value: unknown): value is string {
    if (typeof value !== 'string') return false;
    const v = value.trim();
    return v.length > 10 && v !== 'undefined' && v !== 'null' && v !== '[object Object]';
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

    private static clearTokens(): void {
        localStorage.removeItem(this.ACCESS_TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    }

    /**
     * Proxy cookie ko localStorage ke saath sync karo (AuthProvider app load par call karta hai).
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
     * Login ke baad session store karo.
     *   setAuthData(user)          -> cookie-session mode
     *   setAuthData(tokens, user)  -> token mode
     */
    static setAuthData(user: UserData): void;
    static setAuthData(tokens: Partial<TokenData> | null | undefined, user: UserData): void;
    static setAuthData(
        first: UserData | Partial<TokenData> | null | undefined,
        second?: UserData
    ): void {
        try {
            if (typeof window === 'undefined') return;

            const user = (second !== undefined ? second : first) as UserData | null | undefined;
            const tokens = (second !== undefined ? first : null) as Partial<TokenData> | null;

            if (!user || typeof user !== 'object') {
                throw new Error('Missing user data');
            }

            localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(user));

            if (
                tokens &&
                isUsableToken(tokens.accessToken) &&
                isUsableToken(tokens.refreshToken)
            ) {
                localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
                localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
                this.writeExpiry(tokens.expiresIn ?? 900);
            } else {
                // Cookie-session mode: backend cookies se kaam chalta hai.
                // Purane/kharab tokens hata do taaki wo server ko na jayein.
                this.clearTokens();
            }

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
            return isUsableToken(token) ? token : null;
        } catch (error) {
            console.error('[TokenStorage] Error getting access token:', error);
            return null;
        }
    }

    static updateRefreshToken(refreshToken: string): void {
        if (typeof window === 'undefined') return;
        if (!isUsableToken(refreshToken)) {
            console.error('[TokenStorage] Ignoring unusable refresh token');
            return;
        }
        localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
        this.setAuthCookie();
    }

    static getRefreshToken(): string | null {
        if (typeof window === 'undefined') return null;
        try {
            const token = localStorage.getItem(this.REFRESH_TOKEN_KEY);
            return isUsableToken(token) ? token : null;
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
     * User logged in hai ya nahi. User data hona kaafi hai (cookie-session mode mein
     * tokens JS ko dikhte hi nahi). Access token expire hone se logout nahi maana jata.
     */
    static isAuthenticated(): boolean {
        if (typeof window === 'undefined') return false;
        return !!this.getUserData();
    }

    static needsTokenRefresh(): boolean {
        if (typeof window === 'undefined') return false;
        if (!this.getRefreshToken()) return false;
        return this.isTokenExpired();
    }

    /**
     * Saara auth data hatao. Sirf user ke Sign Out par ya session
     * definitely invalid hone par call hona chahiye.
     * `reason` sirf debugging ke liye hai.
     */
    static clearAuthData(reason?: string): void {
        if (typeof window === 'undefined') return;

        console.warn(`[TokenStorage] clearAuthData reason="${reason ?? 'unspecified'}"`);
        if (process.env.NODE_ENV === 'development') {
            console.trace('[TokenStorage] clearAuthData called from:');
        }

        try {
            this.clearTokens();
            localStorage.removeItem(this.USER_DATA_KEY);
            this.clearAuthCookie();
        } catch (error) {
            console.error('[TokenStorage] Error clearing auth data:', error);
        }
    }

    static updateAccessToken(accessToken: string, expiresIn: string | number): void {
        if (typeof window === 'undefined') return;
        if (!isUsableToken(accessToken)) {
            console.error('[TokenStorage] Ignoring unusable access token');
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