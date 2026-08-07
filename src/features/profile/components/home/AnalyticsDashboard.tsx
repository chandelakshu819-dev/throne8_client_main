

'use client';

import React, { useEffect, useState } from 'react';
import { BarChart2, Eye, TrendingUp, Users } from 'lucide-react';
import AnalyticsService from '@/lib/api/analytics.service';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface AnalyticsDashboardProps {
    userId: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ userId }) => {
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const [analytics, setAnalytics] = useState({
        profileViews: { total: 0, last7Days: 0, last30Days: 0 },
        postImpressions: { total: 0, last7Days: 0, last30Days: 0 },
        searchAppearances: { total: 0, last7Days: 0, last30Days: 0 }
    });

    // NEW: real % change values
    const [changes, setChanges] = useState({
        profileViews: 0,
        postImpressions: 0,
        searchAppearances: 0
    });

    const [isLoading, setIsLoading] = useState(true);

    // Helper: safe progress bar width (0-100), avoids divide-by-zero
    const getProgressWidth = (part: number, total: number) => {
        if (!total || total <= 0) return 0;
        const pct = (part / total) * 100;
        return Math.min(100, Math.max(0, pct));
    };

    // Helper: format change badge text with sign
    const formatChange = (value: number) => {
        const sign = value > 0 ? '+' : '';
        return `${sign}${value}%`;
    };

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setIsLoading(true);

                // Fetch counts + % change data together
                const [
                    profileViews,
                    postImpressions,
                    searchAppearances,
                    profileViewsChange,
                    postImpressionsChange,
                    searchAppearancesChange
                ] = await Promise.all([
                    AnalyticsService.getProfileViewsCount(30),
                    AnalyticsService.getPostImpressionsCount(20),
                    AnalyticsService.getSearchAppearancesCount(),
                    AnalyticsService.getProfileViewsChange(7),
                    AnalyticsService.getPostImpressionsChange(7),
                    AnalyticsService.getSearchAppearancesChange(7)
                ]);

                setAnalytics({
                    profileViews: profileViews.data || { total: 0, last7Days: 0, last30Days: 0 },
                    postImpressions: postImpressions.data || { total: 0, last7Days: 0, last30Days: 0 },
                    searchAppearances: searchAppearances.data || { total: 0, last7Days: 0, last30Days: 0 }
                });

                setChanges({
                    profileViews: profileViewsChange?.data?.change?.percentage ?? 0,
                    postImpressions: postImpressionsChange?.data?.change?.percentage ?? 0,
                    searchAppearances: searchAppearancesChange?.data?.change?.percentage ?? 0
                });
            } catch (error) {
                console.error('Failed to fetch analytics:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (userId) {
            fetchAnalytics();
        }
    }, [userId]);

    if (isLoading) {
        return (
            <div className="bg-white/60 rounded-2xl p-4 border border-[#4a3728]/20">
                <div className="animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
                    <div className="space-y-2">
                        <div className="h-16 bg-gray-200 rounded"></div>
                        <div className="h-16 bg-gray-200 rounded"></div>
                        <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/60 rounded-2xl p-4 border border-[#4a3728]/20 shadow-lg mb-4">
            <h3 className="text-lg font-bold text-[#4a3728] mb-3 flex items-center gap-2">
                <BarChart2 className="w-4 h-4" />
                Your Analytics
            </h3>

            <div className="finalAnalyticsDesignDiv grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Profile Views */}
                <div
                    onClick={() => router.push(`/profile/analytics/${currentUser?.userId}`)}
                    className="group bg-[#e0d8cf] rounded-xl p-4 shadow-md border border-[#c9bfb4] hover:shadow-[0_0_16px_#c9bfb4] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
                    <div className="flex justify-between items-start mb-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300" style={{ background: 'linear-gradient(to bottom right, #8B5E34, #6B4226)' }}>
                            <Eye className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-xs font-semibold" style={{ color: changes.profileViews >= 0 ? '#5B8C5A' : '#B85C5C' }}>
                            {formatChange(changes.profileViews)}
                        </p>
                    </div>

                    {/* Main Value */}
                    <div className="mb-1">
                        <h2 className="text-2xl font-bold text-[#4a3728]">
                            {analytics.profileViews.last7Days.toLocaleString()}
                        </h2>
                        <p className="text-xs text-[#7a5c3e] mt-0.5">
                            out of {analytics.profileViews.total.toLocaleString()} total
                        </p>
                    </div>

                    <p className="text-sm font-semibold text-[#4a3728]/80 mb-1">
                        Profile Views
                    </p>

                    {/* Progress Bar */}
                    <div className="mt-1.5">
                        <div className="w-full h-1.5 bg-[#d1c5b9] rounded-full overflow-hidden">
                            <div
                                className="h-1.5 rounded-full transition-all duration-700"
                                style={{ width: `${getProgressWidth(analytics.profileViews.last7Days, analytics.profileViews.total)}%`, background: 'linear-gradient(to bottom right, #8B5E34, #6B4226)' }}
                            ></div>
                        </div>
                    </div>

                    <p className="text-xs text-[#4a3728]/70 mt-1.5">
                        People visiting your profile.
                    </p>

                    {/* Footer */}
                    <div className="mt-2 pt-1.5 border-t border-[#c9bfb4]/60 flex justify-between items-center">
                        <span className="text-[#4a3728]/60 text-xs font-medium">
                            Last 7 days
                        </span>
                    </div>
                </div>

                {/* Post Impressions */}
                <div
                    onClick={() => router.push(`/profile/analytics/${currentUser?.userId}`)}
                    className="group bg-[#e0d8cf] rounded-xl p-4 shadow-md border border-[#c9bfb4] hover:shadow-[0_0_16px_#c9bfb4] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
                    <div className="flex justify-between items-start mb-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300" style={{ background: 'linear-gradient(to bottom right, #8B5E34, #6B4226)' }}>
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-xs font-semibold" style={{ color: changes.postImpressions >= 0 ? '#5B8C5A' : '#B85C5C' }}>
                            {formatChange(changes.postImpressions)}
                        </p>
                    </div>

                    {/* Main Value */}
                    <div className="mb-1">
                        <h2 className="text-2xl font-bold text-[#4a3728]">
                            {analytics.postImpressions.last7Days.toLocaleString()}
                        </h2>
                        <p className="text-xs text-[#7a5c3e] mt-0.5">
                            out of {analytics.postImpressions.total.toLocaleString()} total
                        </p>
                    </div>

                    <p className="text-sm font-semibold text-[#4a3728]/80 mb-1">
                        Post Impressions
                    </p>

                    {/* Progress Bar */}
                    <div className="mt-1.5">
                        <div className="w-full h-1.5 bg-[#d1c5b9] rounded-full overflow-hidden">
                            <div
                                className="h-1.5 rounded-full transition-all duration-700"
                                style={{ width: `${getProgressWidth(analytics.postImpressions.last7Days, analytics.postImpressions.total)}%`, background: 'linear-gradient(to bottom right, #8B5E34, #6B4226)' }}
                            ></div>
                        </div>
                    </div>

                    <p className="text-xs text-[#4a3728]/70 mt-1.5">
                        Engagement on your posts.
                    </p>

                    {/* Footer */}
                    <div className="mt-2 pt-1.5 border-t border-[#c9bfb4]/60 flex justify-between items-center">
                        <span className="text-[#4a3728]/60 text-xs font-medium">
                            Last 7 days
                        </span>
                    </div>
                </div>

                {/* Search Appearances */}
                <div
                    onClick={() => router.push(`/profile/analytics/${currentUser?.userId}`)}
                    className="group bg-[#e0d8cf] rounded-xl p-4 shadow-md border border-[#c9bfb4] hover:shadow-[0_0_16px_#c9bfb4] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
                    <div className="flex justify-between items-start mb-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300" style={{ background: 'linear-gradient(to bottom right, #8B5E34, #6B4226)' }}>
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-xs font-semibold" style={{ color: changes.searchAppearances >= 0 ? '#5B8C5A' : '#B85C5C' }}>
                            {formatChange(changes.searchAppearances)}
                        </p>
                    </div>

                    {/* Main Value */}
                    <div className="mb-1">
                        <h2 className="text-2xl font-bold text-[#4a3728]">
                            {analytics.searchAppearances.last7Days.toLocaleString()}
                        </h2>
                        <p className="text-xs text-[#7a5c3e] mt-0.5">
                            out of {analytics.searchAppearances.total.toLocaleString()} total
                        </p>
                    </div>

                    <p className="text-sm font-semibold text-[#4a3728]/80 mb-1">
                        Search Appearances
                    </p>

                    {/* Progress Bar */}
                    <div className="mt-1.5">
                        <div className="w-full h-1.5 bg-[#d1c5b9] rounded-full overflow-hidden">
                            <div
                                className="h-1.5 rounded-full transition-all duration-700"
                                style={{ width: `${getProgressWidth(analytics.searchAppearances.last7Days, analytics.searchAppearances.total)}%`,background: 'linear-gradient(to bottom right, #8B5E34, #6B4226)' }}
                            ></div>
                        </div>
                    </div>

                    <p className="text-xs text-[#4a3728]/70 mt-1.5">
                        Times you appeared in searches.
                    </p>

                    {/* Footer */}
                    <div className="mt-2 pt-1.5 border-t border-[#c9bfb4]/60 flex justify-between items-center">
                        <span className="text-[#4a3728]/60 text-xs font-medium">
                            Last 7 days
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
