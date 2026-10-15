'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthService from '@/lib/api/auth.service';
import TokenStorage from '@/lib/store/token.storage';

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

export function useProtectedRoute() {
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            await new Promise(resolve => setTimeout(resolve, 50));

            // 🍪 Tokens are httpOnly cookies, so check the local session marker
            // (flag cookie + stored user). If the cookie session has really expired,
            // the first API call gets a 401 and api.instance.ts refreshes it once
            // (or sends the user to /login if that fails).
            if (!TokenStorage.isAuthenticated()) {
                TokenStorage.clearAuthData(); // flag cookie bhi clear karega, loop tootega
                setIsChecking(false);
                router.replace('/login');
                return;
            }

            setIsChecking(false);
        };

        checkAuth();
    }, [router]);

    return { isChecking };
}