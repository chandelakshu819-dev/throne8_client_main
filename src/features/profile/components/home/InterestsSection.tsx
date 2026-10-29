// src/profile/components/InterestsSection.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import FollowService from '@/lib/api/follow.service';
import CompanyLogo from "@/features/mentorship/components/CompanyLogo";

interface InterestsSectionProps {
    userId?: string;
    isOwnProfile?: boolean;
}

interface FollowedCompany {
    following: string; // companyId, ya populate hua object agar backend fix ho jaye
    followedAt: string;
    companyName?: string;
    companyLogo?: string;
    industry?: string;
    followersCount?: number;
}

type TabKey = 'companies' | 'groups' | 'newsletters' | 'schools';

const TABS: { key: TabKey; label: string; comingSoon: boolean }[] = [
    { key: 'companies', label: 'Companies', comingSoon: false },
    { key: 'groups', label: 'Groups', comingSoon: true },
    { key: 'newsletters', label: 'Newsletters', comingSoon: true },
    { key: 'schools', label: 'Schools', comingSoon: true },
];

const InterestsSection: React.FC<InterestsSectionProps> = ({ userId, isOwnProfile = true }) => {
    const [activeTab, setActiveTab] = useState<TabKey>('companies');
    const [companies, setCompanies] = useState<FollowedCompany[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFollowedCompanies = async () => {
            if (!userId) {
                setIsLoading(false);
                return;
            }
            try {
                setIsLoading(true);
                setError(null);
                const response = await FollowService.getUserFollowingCompanies?.(userId);
                const list = response?.data?.data || response?.data || [];
                setCompanies(list);
            } catch (err: any) {
                console.error('[INTERESTS_SECTION] Failed to fetch followed companies', err);
                setError('Could not load followed companies');
                setCompanies([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFollowedCompanies();
    }, [userId]);

    // Public profile pe agar kuch bhi follow nahi kiya, poora section hide
    if (!isOwnProfile && !isLoading && companies.length === 0) {
        return null;
    }

    return (
        <div className="relative bg-[#f6ede8]/95 via-[#f6ede8]/85 to-[#e0d8cf]/70 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-[#e0d8cf]/60 mb-8 overflow-hidden group">
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-gradient-radial from-[#4a3728]/10 via-[#7a5c3e]/5 to-transparent rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-gradient-conic from-[#e0d8cf]/30 via-[#4a3728]/10 to-transparent rounded-full blur-2xl group-hover:rotate-180 transition-transform duration-[3000ms]"></div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#4a3728] via-[#7a5c3e] to-[#4a3728] rounded-2xl flex items-center justify-center shadow-xl">
                                <svg className="w-8 h-8 text-[#f6ede8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-[#4a3728] tracking-tight mb-1">Interests</h3>
                        </div>
                    </div>
                    {/* ✅ Real count — hardcoded "127" hataya */}
                    <div className="bg-gradient-to-r from-[#4a3728]/10 to-[#7a5c3e]/10 px-5 py-3 rounded-2xl backdrop-blur-sm border border-[#e0d8cf]/50">
                        <div className="text-center">
                            <p className="text-lg font-bold text-[#4a3728]">
                                {isLoading ? '—' : companies.length}
                            </p>
                            <p className="text-xs text-[#4a3728]/70 font-medium">Following</p>
                        </div>
                    </div>
                </div>

                {/* ✅ Tabs — sirf Companies functional, baaki "Coming soon" */}
                <div className="mb-8">
                    <div className="bg-gradient-to-r from-[#e0d8cf]/40 via-[#e0d8cf]/30 to-[#e0d8cf]/20 backdrop-blur-sm rounded-2xl p-2 shadow-inner">
                        <div className="flex">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`relative flex-1 py-3 px-4 text-sm font-semibold rounded-xl transition-all duration-500 ${activeTab === tab.key
                                        ? 'text-[#f6ede8] bg-gradient-to-r from-[#4a3728] to-[#7a5c3e] shadow-lg transform scale-105'
                                        : 'text-[#4a3728]/60 hover:text-[#4a3728] hover:bg-[#e0d8cf]/20'
                                        }`}
                                >
                                    {tab.label}
                                    {tab.comingSoon && (
                                        <span className="ml-1 text-[10px] opacity-70">(soon)</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ✅ Companies tab — real data */}
                {activeTab === 'companies' && (
                    <>
                        {isLoading && (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-[#4a3728]" />
                                <p className="ml-3 text-[#4a3728]">Loading companies...</p>
                            </div>
                        )}

                        {!isLoading && error && (
                            <p className="text-center text-red-600 py-8">{error}</p>
                        )}

                        {!isLoading && !error && companies.length === 0 && (
                            <p className="text-center text-[#4a3728]/60 py-8">
                                {isOwnProfile
                                    ? "You aren't following any companies yet."
                                    : "This user isn't following any companies yet."}
                            </p>
                        )}

                        {!isLoading && !error && companies.length > 0 && (
                            <div className="space-y-6">
                                {companies.map((item, idx) => (
                                    <div
                                        key={item.following || idx}
                                        className="group/card relative bg-gradient-to-r from-[#e0d8cf]/50 via-[#e0d8cf]/30 to-transparent backdrop-blur-sm rounded-3xl p-6 border border-[#e0d8cf]/40 hover:border-[#4a3728]/30 shadow-lg hover:shadow-2xl transform transition-all duration-500 overflow-hidden"
                                    >
                                        <div className="flex items-center gap-5 relative z-10">
                                            <div className="relative">
                                                <CompanyLogo
                                                    src={item.companyLogo}
                                                    companyName={item.companyName || item.following || 'Company'}
                                                    size={64}
                                                    className="rounded-2xl border-3 border-[#e0d8cf] shadow-xl bg-white"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-lg font-bold text-[#4a3728] group-hover/card:text-[#7a5c3e] transition-colors duration-300">
                                                    {/* ✅ Backend populate honay tak fallback companyId dikhega */}
                                                    {item.companyName || `Company (${item.following})`}
                                                </h4>
                                                {item.industry && (
                                                    <p className="text-sm text-[#4a3728]/70 mt-1">{item.industry}</p>
                                                )}
                                                {typeof item.followersCount === 'number' && (
                                                    <p className="text-xs text-[#4a3728]/60 font-medium mt-2">
                                                        {item.followersCount.toLocaleString()} followers
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* ✅ Coming soon tabs */}
                {activeTab !== 'companies' && (
                    <div className="text-center py-16">
                        <p className="text-[#4a3728]/60 font-medium">
                            {TABS.find(t => t.key === activeTab)?.label} — Coming soon
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InterestsSection;