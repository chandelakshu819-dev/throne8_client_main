'use client';
// src/app/network/profile-views/page.tsx
//
// Route: /network/profile-views
// Navigated to when a user clicks "See who viewed →" on a profile_viewed notification.

import React, { Suspense, useEffect } from 'react';
import ProfileViewsPageClient from '@/features/networks/components/profile-views/ProfileViewsPageClient';

export default function ProfileViewsPage() {
    useEffect(() => {
        document.title = 'Who Viewed Your Profile | Throne8';
    }, []);

    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#faf6f2] to-[#f0e6dc]">
                    <div className="w-10 h-10 border-4 border-[#4a3728]/20 border-t-[#4a3728] rounded-full animate-spin" />
                </div>
            }
        >
            <ProfileViewsPageClient />
        </Suspense>
    );
}