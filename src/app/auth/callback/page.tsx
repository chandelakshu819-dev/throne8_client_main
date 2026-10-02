// src/app/auth/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import TokenStorage from '@/lib/store/token.storage';
import { useAppDispatch } from '@/core/store/store.hooks';
import { checkAuthStatus } from '@/hooks/auth';

function CallbackHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();

    useEffect(() => {
        const accessToken = searchParams.get('accessToken') || searchParams.get('token') || searchParams.get('access_token');
        const refreshToken = searchParams.get('refreshToken') || searchParams.get('refresh_token') || accessToken;
        const userId = searchParams.get('userId') || searchParams.get('id') || searchParams.get('user_id');
        const email = searchParams.get('email');
        const role = searchParams.get('role') || 'user';
        const error = searchParams.get('error') || searchParams.get('message');

        if (error) {
            console.error('OAuth error:', error);
            router.replace('/login?error=' + encodeURIComponent(error));
            return;
        }

        if (!accessToken || !userId || !email) {
            console.error('Missing tokens or user data in callback URL:', {
                hasAccessToken: !!accessToken,
                hasRefreshToken: !!refreshToken,
                hasUserId: !!userId,
                hasEmail: !!email,
            });
            router.replace('/login?error=missing_tokens');
            return;
        }

        try {
            TokenStorage.setAuthData(
                {
                    accessToken,
                    refreshToken: refreshToken || accessToken,
                    expiresIn: searchParams.get('expiresIn') || '15m'
                },
                {
                    userId,
                    email,
                    role
                }
            );

            // Sync with Redux state
            dispatch(checkAuthStatus());

            console.log('✅ Google OAuth success, redirecting...');

            const isNewUser = searchParams.get('isNewUser') === 'true' || searchParams.get('isNewUser') === '1';
            if (isNewUser) {
                router.replace('/onboarding/o-auth');
            } else {
                router.replace('/dashboard');
            }
        } catch (storageError) {
            console.error('Failed to store OAuth tokens:', storageError);
            router.replace('/login?error=storage_error');
        }
    }, [searchParams, router, dispatch]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4a3728] mx-auto mb-4" />
                <p className="text-gray-600">Signing in...</p>
            </div>
        </div>
    );
}

// ✅ Suspense wrap karna zaroori hai — useSearchParams ke liye Next.js require karta hai
export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4a3728]" />
            </div>
        }>
            <CallbackHandler />
        </Suspense>
    );
}