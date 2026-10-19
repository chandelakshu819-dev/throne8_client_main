'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch } from '@/core/store/store.hooks';
import { checkAuthStatus } from '@/hooks/auth';
import TokenStorage from '@/lib/store/token.storage';

export default function AuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Tokens localStorage mein hain to proxy ka cookie dobara set karo
        TokenStorage.syncAuthCookie();
        dispatch(checkAuthStatus());
    }, [dispatch]);

    // Cookie kho gayi ho par session zinda ho: proxy /login par bhej deta hai,
    // yahan se wapas andar bhej do.
    useEffect(() => {
        if (!pathname?.startsWith('/login')) return;
        if (!TokenStorage.isAuthenticated()) return;

        TokenStorage.syncAuthCookie();

        const redirect = new URLSearchParams(window.location.search).get('redirect');
        const safeTarget =
            redirect && redirect.startsWith('/') && !redirect.startsWith('//')
                ? redirect
                : '/';

        router.replace(safeTarget);
    }, [pathname, router]);

    return <>{children}</>;
}