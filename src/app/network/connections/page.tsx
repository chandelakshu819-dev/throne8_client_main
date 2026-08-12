'use client';

import React, { Suspense } from 'react';
import ConnectionsPageClient from '@/features/networks/components/connections/ConnectionsPageClient';

export default function ConnectionsPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#faf6f2] to-[#f0e6dc]">
                    <div className="w-10 h-10 border-4 border-[#4a3728]/20 border-t-[#4a3728] rounded-full animate-spin" />
                </div>
            }
        >
            <ConnectionsPageClient />
        </Suspense>
    );
}