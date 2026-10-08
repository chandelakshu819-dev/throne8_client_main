'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TokenStorage from '@/lib/store/token.storage';
import { useAppDispatch } from '@/core/store/store.hooks';
import { checkAuthStatus } from '@/hooks/auth';
import { HOME_PATH } from '@/config/launch';

function CallbackHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();

    useEffect(() => {
        const accessToken =
            searchParams.get('accessToken') ||
            searchParams.get('token') ||
            searchParams.get('access_token');
        const refreshToken =
            searchParams.get('refreshToken') ||
            searchParams.get('refresh_token') ||
            accessToken;
        const userId =
            searchParams.get('userId') ||
            searchParams.get('id') ||
            searchParams.get('user_id');
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
                    expiresIn: searchParams.get('expiresIn') || '15m',
                },
                {
                    userId,
                    email,
                    role,
                }
            );

            // Redux state sync
            dispatch(checkAuthStatus());

            const isNewUser =
                searchParams.get('isNewUser') === 'true' ||
                searchParams.get('isNewUser') === '1';

            router.replace(isNewUser ? '/onboarding/o-auth' : HOME_PATH);
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

// useSearchParams ke liye Suspense zaroori hai
export default function AuthCallbackPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4a3728]" />
                </div>
            }
        >
            <CallbackHandler />
        </Suspense>
    );
}