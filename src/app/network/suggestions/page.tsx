'use client';
// src/app/network/suggestions/page.tsx
//
// Route: /network/suggestions
// Navigated to when a user clicks "See all suggestions →" on a pymk_suggestion notification.
// Wraps SuggestionsPageClient in Suspense matching the client component pattern of /network/connections.

import React, { Suspense, useEffect } from 'react';
import SuggestionsPageClient from '@/features/networks/components/suggestions/SuggestionsPageClient';

export default function SuggestionsPage() {
    useEffect(() => {
        document.title = 'People You May Know | Throne8';
    }, []);

    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#faf6f2] to-[#f0e6dc]">
                    <div className="w-10 h-10 border-4 border-[#4a3728]/20 border-t-[#4a3728] rounded-full animate-spin" />
                </div>
            }
        >
            <SuggestionsPageClient />
        </Suspense>
    );
}
