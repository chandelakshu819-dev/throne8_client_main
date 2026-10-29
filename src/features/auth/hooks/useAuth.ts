// src/features/auth/hooks/useAuth.ts
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AuthService from '@/lib/api/auth.service';
import TokenStorage from '@/lib/store/token.storage';
import { renewSession } from '@/lib/api/api.intance';

interface UseAuthReturn {
    user: {
        [x: string]: any;
        userId: string;
        email: string;
        role: string;
    } | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    logout: () => Promise<void>;
    refreshAuth: () => void;
}

// ==================== SESSION VALIDATION ====================
// localStorage ka userData sirf "marker" hai. Asli session server ke paas hai
// (httpOnly cookies). Yahan ek authenticated call se confirm karte hain.
// api.intance.ts 401 par khud refresh try karta hai; yahan tak error tabhi
// aata hai jab refresh bhi fail ho gaya ho.

const VALIDATION_TTL_MS = 5 * 60 * 1000;

let lastValidatedAt = 0;
let inFlightValidation: Promise<boolean> | null = null;

const isAuthError = (err: any): boolean => {
    const status = err?.response?.status ?? err?.status;
    if (status === 401) return true;
    const message = String(err?.message || '');
    return /login again|authentication required|unauthori[sz]ed|session has ended/i.test(message);
};

/**
 * true  = session valid ya pata nahi (network/5xx: user ko logout nahi karte)
 * false = server ne definitely reject kiya (refresh ke baad bhi 401)
 */
const validateSession = (): Promise<boolean> => {
    if (Date.now() - lastValidatedAt < VALIDATION_TTL_MS) {
        return Promise.resolve(true);
    }
    if (inFlightValidation) return inFlightValidation;

    inFlightValidation = AuthService.getUserProfile()
        .then(() => {
            lastValidatedAt = Date.now();
            return true;
        })
        .catch((err: any) => {
            if (isAuthError(err)) return false;
            return true;
        })
        .finally(() => {
            inFlightValidation = null;
        });

    return inFlightValidation;
};

const resetSessionValidation = () => {
    lastValidatedAt = 0;
    inFlightValidation = null;
};

// ==================== useAuth ====================

export function useAuth(): UseAuthReturn {
    const router = useRouter();
    const [user, setUser] = useState<UseAuthReturn['user']>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuth = () => {
        try {
            const userData = TokenStorage.getUserData();
            const isAuth = AuthService.isAuthenticated();

            setUser(isAuth ? userData : null);

            // Light refresh in background: sync fresh role from DB if changed
            if (isAuth && userData) {
                AuthService.getUserProfile()
                    .then((profileRes) => {
                        const dbUser = profileRes?.data?.user || profileRes?.data || profileRes?.user;
                        if (dbUser?.role && dbUser.role !== userData.role) {
                            const updated = { ...userData, role: dbUser.role };
                            TokenStorage.updateUserData(updated);
                            setUser(updated);
                        }
                    })
                    .catch(() => {
                        // Background check silent fail, keep local auth state
                    });
            }
        } catch (error) {
            console.error('❌ [useAuth] Error checking auth:', error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const refreshAuth = () => {
        checkAuth();
    };

    const logout = async () => {
        try {
            await AuthService.logout();
            resetSessionValidation();
            setUser(null);
            router.push('/login');
        } catch (error) {
            console.error('❌ [useAuth] Logout error:', error);
        }
    };

    return {
        user,
        isAuthenticated: !!user,
        isLoading,
        logout,
        refreshAuth
    };
}

// ==================== useProtectedRoute ====================

export function useProtectedRoute() {
    const router = useRouter();
    const pathname = usePathname();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const goToLogin = () => {
            TokenStorage.clearAuthData('protected_route_invalid_session'); // flag cookie bhi clear, loop tootega
            resetSessionValidation();
            const target =
                pathname && pathname !== '/login'
                    ? `/login?redirect=${encodeURIComponent(pathname)}`
                    : '/login';
            router.replace(target);
        };

        const check = async () => {
            await new Promise((resolve) => setTimeout(resolve, 50));
            if (cancelled) return;

            // Step 1: local marker (instant)
            if (!TokenStorage.isAuthenticated()) {
                setIsChecking(false);
                goToLogin();
                return;
            }

            // Page turant dikhao, validation background mein chalegi
            setIsChecking(false);

            // Step 2: server se session confirm (refresh interceptor ke through)
            const valid = await validateSession();
            if (cancelled) return;

            if (!valid) {
                // If we still have a refresh token in storage, give it an explicit renewal attempt
                // before destroying the entire session!
                if (TokenStorage.getRefreshToken()) {
                    try {
                        const renewed = await renewSession();
                        if (renewed && !cancelled) {
                            const retryValid = await validateSession();
                            if (retryValid || cancelled) return;
                            goToLogin();
                            return;
                        }
                    } catch {
                        // renewSession handles forceLogout if definitely rejected
                    }
                }

                // Only clear and redirect if we still have no valid session
                if (!TokenStorage.isAuthenticated() || !TokenStorage.getRefreshToken()) {
                    goToLogin();
                }
            }
        };

        check();

        return () => {
            cancelled = true;
        };
    }, [router, pathname]);

    return { isChecking };
}