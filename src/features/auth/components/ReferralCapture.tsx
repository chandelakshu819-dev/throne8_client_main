'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Gift } from 'lucide-react';
import { captureReferralCode, getStoredReferralCode } from '@/lib/referral';

/**
 * Reads ?ref=CODE from the signup link, remembers it, and shows a small
 * "you were invited" note. Must be rendered inside <Suspense> (useSearchParams).
 */
export default function ReferralCapture() {
    const searchParams = useSearchParams();
    const [hasCode, setHasCode] = useState(false);

    useEffect(() => {
        captureReferralCode(searchParams.get('ref'));
        setHasCode(!!getStoredReferralCode());
    }, [searchParams]);

    if (!hasCode) return null;

    return (
        <div
            role="status"
            className="mb-4 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"
        >
            <Gift className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>
                A friend invited you. Create your account to get <strong>1 extra free AI resume credit</strong>.
            </p>
        </div>
    );
}
