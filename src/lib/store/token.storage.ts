// lib/store/token.storage.ts

interface UserData {
    userId: string;
    email: string;
    role: string;
}

interface TokenData {
    accessToken: string;
    refreshToken: string;
    expiresIn: string | number; // ✅ Accept both string and number
}

// ✅ Naam jo middleware.ts mein bhi use hoga — dono jagah EXACT match hona chahiye
const AUTH_COOKIE_NAME = 'throne8_auth';

class TokenStorage {
    private static readonly ACCESS_TOKEN_KEY = 'throne8_access_token';
    private static readonly REFRESH_TOKEN_KEY = 'throne8_refresh_token';
    private static readonly USER_DATA_KEY = 'throne8_user_data';
    private static readonly TOKEN_EXPIRY_KEY = 'throne8_token_expiry';

    // ==================== 🆕 COOKIE HELPERS (for middleware) ====================
    // Middleware Edge runtime par chalta hai — usko localStorage nahi dikhta.
    // Isliye ek lightweight, non-sensitive "logged in hai ya nahi" flag
    // cookie mein bhi rakhte hain. Actual tokens sirf localStorage mein hi
    // rehte hain — security posture wahi purana hai.

    private static setAuthCookie(): void {
        if (typeof document === 'undefined') return;
        // 7 din ki cookie — refresh token jitni hi lambi rakho (adjust as needed)
        const maxAgeSeconds = 7 * 24 * 60 * 60;
        document.cookie = `${AUTH_COOKIE_NAME}=1; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
    }

    private static clearAuthCookie(): void {
        if (typeof document === 'undefined') return;
        document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
    }

    /**
     * 💾 Store tokens and user data after successful login
     */
    static setAuthData(tokens: TokenData, user: UserData): void {
        try {
            if (typeof window === 'undefined') {
                console.warn('⚠️ Not in browser environment, skipping storage');
                return;
            }

            // Store tokens
            localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
            localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
            localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(user));

            // ✅ Handle both string ("15m") and number (900) formats
            let expiryMinutes: number;

            if (typeof tokens.expiresIn === 'string') {
                // String format: "15m" or "900"
                expiryMinutes = parseInt(tokens.expiresIn.replace(/\D/g, '')) || 15;
            } else {
                // Number format: 900 (seconds)
                expiryMinutes = Math.floor(tokens.expiresIn / 60) || 15;
            }

            const expiryTime = Date.now() + (expiryMinutes * 60 * 1000);
            localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());

            // 🆕 Set the middleware-visible cookie
            this.setAuthCookie();

            console.log('✅ [TokenStorage] Auth data stored successfully', {
                userId: user.userId,
                email: user.email,
                expiresIn: tokens.expiresIn,
                expiryMinutes,
                expiryTime: new Date(expiryTime).toLocaleString()
            });

        } catch (error) {
            console.error('❌ [TokenStorage] Failed to store auth data:', error);
            throw new Error('Failed to store authentication data');
        }
    }

    /**
     * 🔑 Get access token
     */
    static getAccessToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    }

    static updateRefreshToken(refreshToken: string): void {
        if (typeof window === 'undefined') return;
        localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }

    /**
     * 🔄 Get refresh token
     */
    static getRefreshToken(): string | null {
        if (typeof window === 'undefined') return null;

        try {
            const token = localStorage.getItem(this.REFRESH_TOKEN_KEY);
            if (!token) {
                console.log('ℹ️ [TokenStorage] No refresh token found');
            }
            return token;
        } catch (error) {
            console.error('❌ [TokenStorage] Error getting refresh token:', error);
            return null;
        }
    }

    /**
     * 👤 Get user data
     */
    static getUserData(): UserData | null {
        if (typeof window === 'undefined') return null;

        try {
            const userData = localStorage.getItem(this.USER_DATA_KEY);
            if (!userData) {
                console.log('ℹ️ [TokenStorage] No user data found');
                return null;
            }
            return JSON.parse(userData) as UserData;
        } catch (error) {
            console.error('❌ [TokenStorage] Error parsing user data:', error);
            return null;
        }
    }

    /**
     * ⏰ Check if access token is expired
     */
    static isTokenExpired(): boolean {
        if (typeof window === 'undefined') return true;

        try {
            const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
            if (!expiryTime) return true;

            const isExpired = Date.now() >= parseInt(expiryTime);
            if (isExpired) {
                console.warn('⚠️ [TokenStorage] Token has expired');
            }
            return isExpired;
        } catch (error) {
            console.error('❌ [TokenStorage] Error checking token expiry:', error);
            return true;
        }
    }

    /**
     * ✅ Check if user is authenticated
     */
    static isAuthenticated(): boolean {
        if (typeof window === 'undefined') return false;
        const refreshToken = this.getRefreshToken();
        const userData = this.getUserData();
        return !!(refreshToken && userData);
    }

    static needsTokenRefresh(): boolean {
        if (typeof window === 'undefined') return false;
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) return false;
        return this.isTokenExpired();
    }

    /**
     * 🗑️ Clear all authentication data
     */
    static clearAuthData(): void {
        if (typeof window === 'undefined') return;

        try {
            localStorage.removeItem(this.ACCESS_TOKEN_KEY);
            localStorage.removeItem(this.REFRESH_TOKEN_KEY);
            localStorage.removeItem(this.USER_DATA_KEY);
            localStorage.removeItem(this.TOKEN_EXPIRY_KEY);

            // 🆕 Clear the middleware-visible cookie too
            this.clearAuthCookie();

            console.log('✅ [TokenStorage] All auth data cleared');
        } catch (error) {
            console.error('❌ [TokenStorage] Error clearing auth data:', error);
        }
    }

    /**
     * 🔄 Update only access token
     */
    static updateAccessToken(accessToken: string, expiresIn: string | number): void {
        if (typeof window === 'undefined') return;

        try {
            localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);

            // Handle both formats
            let expiryMinutes: number;
            if (typeof expiresIn === 'string') {
                expiryMinutes = parseInt(expiresIn.replace(/\D/g, '')) || 15;
            } else {
                expiryMinutes = Math.floor(expiresIn / 60) || 15;
            }

            const expiryTime = Date.now() + (expiryMinutes * 60 * 1000);
            localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());

            // 🆕 Refresh worked, so user is still logged in — keep cookie alive
            this.setAuthCookie();

            console.log('✅ [TokenStorage] Access token updated');
        } catch (error) {
            console.error('❌ [TokenStorage] Error updating access token:', error);
        }
    }

    /**
     * 📊 Get auth summary
     */
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