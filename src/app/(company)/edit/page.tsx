'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { EditCompanyPage } from '@/features/company/components/events/EditCompanyPage';
import CompanyService from '@/lib/api/company.service';
import Link from 'next/link';

export default function EditPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { userProfileData, loadProfile } = useProfile();
  const [resolvedCompanyId, setResolvedCompanyId] = useState<string | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    async function resolveCompany() {
      // 1. Direct from profile
      const profileCompanyId = userProfileData?.companyId;
      if (profileCompanyId) {
        if (isMounted) {
          setResolvedCompanyId(profileCompanyId);
          setIsLoadingCompany(false);
        }
        return;
      }

      // 2. Fallback to existing company list if profile companyId isn't linked yet
      try {
        const compRes = await CompanyService.getAllCompanies({ page: 1, pageSize: 1 });
        const compList = compRes?.data?.companies || compRes?.data || [];
        if (compList.length > 0 && isMounted) {
          const firstId = compList[0]._id || compList[0].id || compList[0].companyId;
          setResolvedCompanyId(firstId);
        }
      } catch (err) {
        console.warn('Failed to fetch fallback company:', err);
      } finally {
        if (isMounted) {
          setIsLoadingCompany(false);
        }
      }
    }

    if (!isAuthLoading) {
      resolveCompany();
    }

    return () => {
      isMounted = false;
    };
  }, [userProfileData?.companyId, isAuthLoading]);

  // Loading skeleton matching layout
  if (isLoadingCompany || isAuthLoading) {
    return (
      <div className="max-w-[1240px] mx-auto space-y-4 pb-12 animate-pulse">
        {/* Header Skeleton */}
        <div className="bg-white border border-[#e8dfd5] rounded-xl p-4 sm:py-4.5 sm:px-5.5">
          <div className="flex flex-col sm:flex-row justify-between gap-4 pb-3.5 border-b border-[#f0e8e0]">
            <div className="space-y-1.5">
              <div className="h-6 w-48 bg-[#f0e8e0] rounded-lg" />
              <div className="h-3.5 w-80 bg-[#f0e8e0] rounded-md" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-6 w-28 bg-[#f0e8e0] rounded-lg" />
              <div className="h-[38px] w-32 bg-[#f0e8e0] rounded-xl" />
            </div>
          </div>
          <div className="pt-3 flex gap-1.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-7 w-20 bg-[#f0e8e0] rounded-lg" />
            ))}
          </div>
        </div>

        {/* Two-column skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 sm:gap-5">
          <div className="space-y-4">
            <div className="h-36 bg-white border border-[#e8dfd5] rounded-xl p-4" />
            <div className="h-80 bg-white border border-[#e8dfd5] rounded-xl p-4" />
          </div>
          <div>
            <div className="h-72 bg-white border border-[#e8dfd5] rounded-xl p-4" />
          </div>
        </div>
      </div>
    );
  }

  // If no company exists for this user
  if (!resolvedCompanyId) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white border border-[#e8dfd5] rounded-2xl text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-[#f6ede8] text-[#4a3728] flex items-center justify-center mx-auto">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[#3d2b1f]">No Company Profile Found</h2>
        <p className="text-sm text-[#4a3728]/70 max-w-md mx-auto">
          You don't have an active company associated with your account. Create your company profile to start managing your brand on Throne8.
        </p>
        <div className="pt-2">
          <Link
            href="/create-company"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#3d2b1f] text-[#f6ede8] hover:bg-[#2b1e15] transition-colors shadow-md"
          >
            Create Company Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <EditCompanyPage
      companyId={resolvedCompanyId}
      slug="throne8"
      verificationStatus="pending"
    />
  );
}