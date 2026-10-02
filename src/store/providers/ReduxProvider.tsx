// src/store/providers/ReduxProvider.tsx

'use client';

import { Provider } from 'react-redux';
import { store } from '../../core/store/store';
import { useEffect } from 'react';
import { checkAuthStatus } from '../../hooks/auth';
import { GoogleOAuthProvider } from '@react-oauth/google';
import config from '@/config/env.config';

const GOOGLE_CLIENT_ID = config.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '707035991312-1b9cebhvfojdp04p0f8vogmiuai42m84.apps.googleusercontent.com';

export default function ReduxProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Check auth status on app load
        store.dispatch(checkAuthStatus());
    }, []);

    return (
        <Provider store={store}>
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                {children}
            </GoogleOAuthProvider>
        </Provider>
    );
}