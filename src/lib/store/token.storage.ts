// // lib/store/token.storage.ts
// //
// // 🍪 Cookie-session version.
// // The access/refresh tokens now live ONLY in httpOnly cookies set by the backend —
// // JavaScript can never read them, so nothing sensitive is kept in localStorage anymore.
// // This class only keeps NON-SENSITIVE data:
// //   - the basic user info (userId / email / role) for the UI
// //   - a "logged in" flag cookie (throne8_auth=1) that the Next.js proxy/middleware
// //     (src/proxy.ts) can read on the Edge runtime

// interface UserData {
//   userId: string;
//   email: string;
//   role: string;
// }

// // ✅ Naam jo proxy.ts mein bhi use hota hai — dono jagah EXACT match hona chahiye
// const AUTH_COOKIE_NAME = "throne8_auth";

// // Flag cookie lifetime = refresh cookie lifetime (30 days)
// const AUTH_FLAG_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

// // Keys used by the old localStorage-token implementation
// const LEGACY_ACCESS_TOKEN_KEY = "throne8_access_token";
// const LEGACY_REFRESH_TOKEN_KEY = "throne8_refresh_token";
// const LEGACY_TOKEN_EXPIRY_KEY = "throne8_token_expiry";

// class TokenStorage {
//   private static readonly USER_DATA_KEY = "throne8_user_data";

//   // ==================== FLAG COOKIE (for proxy.ts) ====================

//   private static setAuthCookie(): void {
//     if (typeof document === "undefined") return;
//     document.cookie = `${AUTH_COOKIE_NAME}=1; path=/; max-age=${AUTH_FLAG_MAX_AGE_SECONDS}; SameSite=Lax`;
//   }

//   private static clearAuthCookie(): void {
//     if (typeof document === "undefined") return;
//     document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
//   }

//   private static hasAuthCookie(): boolean {
//     if (typeof document === "undefined") return false;
//     return document.cookie
//       .split(";")
//       .some((c) => c.trim() === `${AUTH_COOKIE_NAME}=1`);
//   }

//   // ==================== SESSION ====================

//   /**
//    * 💾 Remember the logged-in user (tokens are NOT stored — the backend set them as cookies)
//    */
//   static setAuthData(user: UserData): void {
//     try {
//       if (typeof window === "undefined") {
//         console.warn("⚠️ Not in browser environment, skipping storage");
//         return;
//       }

//       localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(user));
//       this.setAuthCookie();
//       this.purgeLegacyTokens();
//     } catch (error) {
//       console.error("❌ [TokenStorage] Failed to store auth data:", error);
//       throw new Error("Failed to store authentication data");
//     }
//   }

//   /**
//    * 🔄 A refresh just succeeded, so the session is alive — keep the flag cookie alive too
//    */
//   static markSessionActive(): void {
//     this.setAuthCookie();
//   }

//   /**
//    * 👤 Get user data
//    */
//   static getUserData(): UserData | null {
//     if (typeof window === "undefined") return null;

//     try {
//       const userData = localStorage.getItem(this.USER_DATA_KEY);
//       if (!userData) return null;
//       return JSON.parse(userData) as UserData;
//     } catch (error) {
//       console.error("❌ [TokenStorage] Error parsing user data:", error);
//       return null;
//     }
//   }

//   /**
//    * 👤 Update stored user data (e.g. after a profile photo change) without touching the session
//    */
//   static updateUserData(userData: UserData): void {
//     if (typeof window === "undefined") return;
//     try {
//       localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
//     } catch (error) {
//       console.error("❌ [TokenStorage] Error updating user data:", error);
//     }
//   }

//   /**
//    * ✅ Does the browser believe it has a session?
//    * (The real check is the backend cookie — if it is gone, the next API call returns 401,
//    *  the interceptor tries one refresh, and on failure logs the user out.)
//    */
//   static isAuthenticated(): boolean {
//     if (typeof window === "undefined") return false;
//     return this.hasAuthCookie() && !!this.getUserData();
//   }

//   /**
//    * 🗑️ Clear the local session state (the backend clears its own cookies on /auth/logout)
//    */
//   static clearAuthData(): void {
//     if (typeof window === "undefined") return;

//     try {
//       localStorage.removeItem(this.USER_DATA_KEY);
//       this.purgeLegacyTokens();
//       this.clearAuthCookie();
//     } catch (error) {
//       console.error("❌ [TokenStorage] Error clearing auth data:", error);
//     }
//   }

//   // ==================== MIGRATION (old localStorage sessions) ====================

//   /**
//    * Sessions created before cookie auth only have a refresh token in localStorage.
//    * The API layer sends it ONCE to /auth/refresh-token so the backend can turn it into cookies.
//    */
//   static getLegacyRefreshToken(): string | null {
//     if (typeof window === "undefined") return null;
//     try {
//       return localStorage.getItem(LEGACY_REFRESH_TOKEN_KEY);
//     } catch {
//       return null;
//     }
//   }

//   /**
//    * Remove tokens left in localStorage by the old implementation
//    */
//   static purgeLegacyTokens(): void {
//     if (typeof window === "undefined") return;
//     try {
//       localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
//       localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
//       localStorage.removeItem(LEGACY_TOKEN_EXPIRY_KEY);
//     } catch {
//       /* storage unavailable */
//     }
//   }

// <<<<<<< Updated upstream
//     /**
//      * ✅ Does the browser believe it has a session?
//      * (The real check is the backend cookie — if it is gone, the next API call returns 401,
//      *  the interceptor tries one refresh, and on failure logs the user out.)
//      */
//     static isAuthenticated(): boolean {
//         if (typeof window === 'undefined') return false;
//         return this.hasAuthCookie() && !!this.getUserData();
//     }

//     /**
//      * 🗑️ Clear the local session state (the backend clears its own cookies on /auth/logout)
//      */
//     static clearAuthData(): void {
//         if (typeof window === 'undefined') return;

//         try {
//             localStorage.removeItem(this.USER_DATA_KEY);
//             this.purgeLegacyTokens();
//             this.clearAuthCookie();
//         } catch (error) {
//             console.error('❌ [TokenStorage] Error clearing auth data:', error);
//         }
//     }

//     // ==================== MIGRATION (old localStorage sessions) ====================

//     /**
//      * Sessions created before cookie auth only have a refresh token in localStorage.
//      * The API layer sends it ONCE to /auth/refresh-token so the backend can turn it into cookies.
//      */
//     static getLegacyRefreshToken(): string | null {
//         if (typeof window === 'undefined') return null;
//         try {
//             return localStorage.getItem(LEGACY_REFRESH_TOKEN_KEY);
//         } catch {
//             return null;
//         }
//     }

//     /**
//      * Remove tokens left in localStorage by the old implementation
//      */
//     static purgeLegacyTokens(): void {
//         if (typeof window === 'undefined') return;
//         try {
//             localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
//             localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
//             localStorage.removeItem(LEGACY_TOKEN_EXPIRY_KEY);
//         } catch {
//             /* storage unavailable */
//         }
//     }

//     /**
//      * 📊 Get auth summary (for debugging)
//      */
//     static getAuthSummary() {
//         return {
//             isAuthenticated: this.isAuthenticated(),
//             userData: this.getUserData(),
//         };
//     }
// =======
//   /**
//    * 📊 Get auth summary (for debugging)
//    */
//   static getAuthSummary() {
//     return {
//       isAuthenticated: this.isAuthenticated(),
//       userData: this.getUserData(),
//     };
//   }
// >>>>>>> Stashed changes
// }

// export default TokenStorage;
// export type { UserData };

// lib/store/token.storage.ts
//
// 🍪 Cookie-session version.
// The access/refresh tokens now live ONLY in httpOnly cookies set by the backend —
// JavaScript can never read them, so nothing sensitive is kept in localStorage anymore.
// This class only keeps NON-SENSITIVE data:
//   - the basic user info (userId / email / role) for the UI
//   - a "logged in" flag cookie (throne8_auth=1) that the Next.js proxy/middleware
//     (src/proxy.ts) can read on the Edge runtime

interface UserData {
  userId: string;
  email: string;
  role: string;
}

// ✅ Naam jo proxy.ts mein bhi use hota hai — dono jagah EXACT match hona chahiye
const AUTH_COOKIE_NAME = "throne8_auth";

// Flag cookie lifetime = refresh cookie lifetime (30 days)
const AUTH_FLAG_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

// Keys used by the old localStorage-token implementation
const LEGACY_ACCESS_TOKEN_KEY = "throne8_access_token";
const LEGACY_REFRESH_TOKEN_KEY = "throne8_refresh_token";
const LEGACY_TOKEN_EXPIRY_KEY = "throne8_token_expiry";

class TokenStorage {
  private static readonly USER_DATA_KEY = "throne8_user_data";

  // ==================== FLAG COOKIE (for proxy.ts) ====================

  private static setAuthCookie(): void {
    if (typeof document === "undefined") return;
    document.cookie = `${AUTH_COOKIE_NAME}=1; path=/; max-age=${AUTH_FLAG_MAX_AGE_SECONDS}; SameSite=Lax`;
  }

  private static clearAuthCookie(): void {
    if (typeof document === "undefined") return;
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
  }

  private static hasAuthCookie(): boolean {
    if (typeof document === "undefined") return false;
    return document.cookie
      .split(";")
      .some((c) => c.trim() === `${AUTH_COOKIE_NAME}=1`);
  }

  // ==================== SESSION ====================

  /**
   * 💾 Remember the logged-in user (tokens are NOT stored — the backend set them as cookies)
   */
  static setAuthData(user: UserData): void {
    try {
      if (typeof window === "undefined") {
        console.warn("⚠️ Not in browser environment, skipping storage");
        return;
      }

      localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(user));
      this.setAuthCookie();
      this.purgeLegacyTokens();
    } catch (error) {
      console.error("❌ [TokenStorage] Failed to store auth data:", error);
      throw new Error("Failed to store authentication data");
    }
  }

  /**
   * 🔄 A refresh just succeeded, so the session is alive — keep the flag cookie alive too
   */
  static markSessionActive(): void {
    this.setAuthCookie();
  }

  /**
   * 👤 Get user data
   */
  static getUserData(): UserData | null {
    if (typeof window === "undefined") return null;

    try {
      const userData = localStorage.getItem(this.USER_DATA_KEY);
      if (!userData) return null;
      return JSON.parse(userData) as UserData;
    } catch (error) {
      console.error("❌ [TokenStorage] Error parsing user data:", error);
      return null;
    }
  }

  /**
   * 👤 Update stored user data (e.g. after a profile photo change) without touching the session
   */
  static updateUserData(userData: UserData): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error("❌ [TokenStorage] Error updating user data:", error);
    }
  }

  /**
   * ✅ Does the browser believe it has a session?
   * (The real check is the backend cookie — if it is gone, the next API call returns 401,
   *  the interceptor tries one refresh, and on failure logs the user out.)
   */
  static isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;
    return this.hasAuthCookie() && !!this.getUserData();
  }

  /**
   * 🗑️ Clear the local session state (the backend clears its own cookies on /auth/logout)
   */
  static clearAuthData(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(this.USER_DATA_KEY);
      this.purgeLegacyTokens();
      this.clearAuthCookie();
    } catch (error) {
      console.error("❌ [TokenStorage] Error clearing auth data:", error);
    }
  }

  // ==================== MIGRATION (old localStorage sessions) ====================

  /**
   * Sessions created before cookie auth only have a refresh token in localStorage.
   * The API layer sends it ONCE to /auth/refresh-token so the backend can turn it into cookies.
   */
  static getLegacyRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(LEGACY_REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Remove tokens left in localStorage by the old implementation
   */
  static purgeLegacyTokens(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
      localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
      localStorage.removeItem(LEGACY_TOKEN_EXPIRY_KEY);
    } catch {
      /* storage unavailable */
    }
  }

  /**
   * 📊 Get auth summary (for debugging)
   */
  static getAuthSummary() {
    return {
      isAuthenticated: this.isAuthenticated(),
      userData: this.getUserData(),
    };
  }
}

export default TokenStorage;
export type { UserData };
