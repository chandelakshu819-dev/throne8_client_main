'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthService from '@/lib/api/auth.service';
import TokenStorage from '@/lib/store/token.storage';
import api from '@/lib/api/api.intance';

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

            // ✅ refreshToken check karo, accessToken nahi
            const hasRefreshToken = !!TokenStorage.getRefreshToken();
            const hasUserData = !!TokenStorage.getUserData();
            const hasSession = hasRefreshToken && hasUserData;

           if (!hasSession) {
    TokenStorage.clearAuthData(); // cookie bhi clear karega, loop tootega
    setIsChecking(false);
    router.replace('/login');
    return;
}

            // ✅ AccessToken expire hua? Ek authenticated call karo —
            // agar 401 aaya to api.instance.ts ka interceptor khud refresh
            // handle karega (shared isRefreshing lock use hoga,
            // isse duplicate refresh-token call nahi hoga)
            if (TokenStorage.needsTokenRefresh()) {
                try {
                    await api.get('/auth/profile');
                } catch {
                    // Network/auth error — session valid maano, mat redirect karo
                    // (agar refresh bhi fail hua to interceptor khud /login pe bhej dega)
                }
            }

            setIsChecking(false);
        };

        checkAuth();
    }, [router]);

    return { isChecking };
}