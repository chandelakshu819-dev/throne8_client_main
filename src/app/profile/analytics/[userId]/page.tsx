//jab ham yaha par profile me Analytics ke section me Details button me click karenge to ham is page per redirect honge jo ki detailed analytics dikhayega user ke profile ka.
// src/app/profile/analytics/[userId]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AnalyticsService from '@/lib/api/analytics.service';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
    Loader2, ArrowLeft, TrendingUp, Eye, BarChart3,
    Search, Calendar, Users, MousePointer, Share2
} from 'lucide-react';
import PostImpressionsModal from '../../../../features/profile/components/analytics/PostImpressionsModal';
import ProfileNavbar from '../../../../features/profile/components/home/ProfileNavbar';
import { useProfileData } from '@/features/profile/hooks/useProfileData';
import { useHeadlineData } from '@/features/profile/hooks/useHeadlineData';
import { transformToProfileData } from '@/shared/utils/profileTransformers';
import SearchAppearancesModal from '../../../../features/profile/components/analytics/SearchAppearancesModal';
import ProfileViewsModal from '../../../../features/profile/components/analytics/ProfileViewsModal';
import AudienceInsights from '../../../../features/profile/components/analytics/AudienceInsights';
export default function AnalyticsDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const userId = params.userId as string;

    const { user } = useAuth();

    
    const [analytics, setAnalytics] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30);
    const [showPostModal, setShowPostModal] = useState(false);
    const [showProfileViewsModal, setShowProfileViewsModal] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);

    const [engagementData, setEngagementData] = useState<{
        clicks: number;
        shares: number;
        uniqueVisitors: number;
    }>({ clicks: 0, shares: 0, uniqueVisitors: 0 });


    const [demographics, setDemographics] = useState<any>(null);

    const {
        userProfileData,
        profileImageUrl,
        headlineId,
        fetchUserProfile
    } = useProfileData();

    const { headlineData, isLoadingHeadline, fetchHeadlineData } = useHeadlineData(headlineId);

    useEffect(() => {
        if (user) {
            fetchUserProfile();
        }
    }, [user, fetchUserProfile]);

    const profileData = transformToProfileData(
        userProfileData,
        profileImageUrl,
        headlineData
    );

    const fullName = userProfileData
        ? `${userProfileData.firstName} ${userProfileData.lastName}`.trim()
        : 'Loading...';

    useEffect(() => {
        loadDetailedAnalytics();
    }, [userId, timeRange]);

    const loadDetailedAnalytics = async () => {
        try {
            setIsLoading(true);
            const response = await AnalyticsService.getAllAnalytics(timeRange);
            setAnalytics(response.data);
            // ✅ Fetch real engagement breakdown
            const [clicksRes, sharesRes, visitorsRes,demographicsRes] = await Promise.all([
                AnalyticsService.getClicksCount(timeRange),
                AnalyticsService.getSharesCount(timeRange),
                AnalyticsService.getUniqueVisitorsCount(timeRange),
                AnalyticsService.getViewerDemographics(timeRange),

            ]);

            setEngagementData({
                clicks: clicksRes?.data?.total || 0,
                shares: sharesRes?.data?.total || 0,
                uniqueVisitors: visitorsRes?.data?.total || 0,
            });
            setDemographics(demographicsRes?.data || null);
            console.log('🔍 Demographics data:', demographicsRes?.data);

        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // ✅ Real progress bar width — relative to max (90-day) value
    const getInsightWidth = (value: number, max: number): string => {
        if (!max || max === 0) return '0%';
        const pct = Math.min((value / max) * 100, 100);
        return `${pct}%`;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#f6ede8] py-8 px-4 flex items-center justify-center">
                <div className="max-w-7xl mx-auto w-full">
                    {/* Header Skeleton */}
                    <div className="mb-8">
                        <div className="h-10 bg-[#e0d8cf] rounded-lg mb-4 animate-pulse w-32"></div>
                        <div className="flex justify-between items-center">
                            <div className="flex-1">
                                <div className="h-12 bg-[#e0d8cf] rounded-lg mb-3 animate-pulse w-3/4"></div>
                                <div className="h-6 bg-[#e0d8cf] rounded-lg animate-pulse w-1/2"></div>
                            </div>
                            <div className="flex gap-2 ml-8">
                                <div className="h-10 w-20 bg-[#e0d8cf] rounded-lg animate-pulse" style={{ animationDelay: '0s' }}></div>
                                <div className="h-10 w-20 bg-[#e0d8cf] rounded-lg animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                <div className="h-10 w-20 bg-[#e0d8cf] rounded-lg animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {[0, 1, 2].map((index) => (
                            <div key={index} className="bg-white rounded-2xl p-6 shadow-lg border border-[#e0d8cf]">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-[#e0d8cf] rounded-xl animate-pulse" style={{ animationDelay: `${index * 0.2}s` }}></div>
                                    <div className="w-5 h-5 bg-[#e0d8cf] rounded-full animate-pulse" style={{ animationDelay: `${index * 0.2 + 0.1}s` }}></div>
                                </div>
                                <div className="h-10 bg-[#e0d8cf] rounded-lg mb-2 animate-pulse" style={{ animationDelay: `${index * 0.2}s` }}></div>
                                <div className="h-4 bg-[#e0d8cf] rounded-lg mb-4 w-1/2 animate-pulse" style={{ animationDelay: `${index * 0.2 + 0.1}s` }}></div>
                                <div className="border-t border-[#e0d8cf] pt-4 mt-4">
                                    <div className="h-3 bg-[#e0d8cf] rounded-lg w-3/4 animate-pulse" style={{ animationDelay: `${index * 0.2}s` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Additional Metrics Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[0, 1].map((index) => (
                            <div key={index} className="bg-white rounded-2xl p-6 shadow-lg border border-[#e0d8cf]">
                                <div className="h-6 bg-[#e0d8cf] rounded-lg mb-6 w-1/3 animate-pulse" style={{ animationDelay: `${index * 0.2}s` }}></div>
                                <div className="space-y-4">
                                    {[0, 1, 2].map((subIndex) => (
                                        <div key={subIndex} className="flex items-center justify-between">
                                            <div className="h-5 bg-[#e0d8cf] rounded-lg w-1/4 animate-pulse" style={{ animationDelay: `${(index + subIndex) * 0.15}s` }}></div>
                                            <div className="h-5 bg-[#e0d8cf] rounded-lg w-1/6 animate-pulse" style={{ animationDelay: `${(index + subIndex) * 0.15 + 0.1}s` }}></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }



    return (
        <>
            <ProfileNavbar
                profileImage={profileData.profileImage}
                userName={profileData.userName}
                currentUserId={user?.userId}
            />
            
            <div className="min-h-screen bg-[#f6ede8] py-8 px-4">
                <div className="max-w-7xl mx-auto">

                    {/* Header */}
                    <div className="mt-12 mb-8">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-[#4a3728] hover:text-[#7a5c3e] transition-colors mb-4"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-medium">Back to Profile</span>
                        </button>

                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-4xl font-bold text-[#4a3728]">Analytics Dashboard</h1>
                                <p className="text-[#7a5c3e] mt-2">Detailed insights about your profile performance</p>
                            </div>

                            {/* Time Range Selector */}
                            <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm">
                                {[7, 30, 90].map((days) => (
                                    <button
                                        key={days}
                                        onClick={() => setTimeRange(days as 7 | 30 | 90)}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${timeRange === days
                                            ? 'bg-[#4a3728] text-white'
                                            : 'text-[#7a5c3e] hover:bg-[#e0d8cf]'
                                            }`}
                                    >
                                        {days} days
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Post Impressions Card */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-[#e0d8cf]">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <BarChart3 className="w-6 h-6 text-green-600" />
                                </div>
                                <TrendingUp className="w-5 h-5 text-green-500" />
                            </div>
                            <h3 className="text-3xl font-bold text-[#4a3728] mb-1">
                                {analytics?.postImpressions?.total || 0}
                            </h3>
                            <p className="text-sm text-[#7a5c3e]">Post Impressions</p>
                            <div className="mt-4 pt-4 border-t border-[#e0d8cf] flex items-center justify-between">
                                <p className="text-xs text-[#7a5c3e]">
                                    Last {timeRange} days: <span className="font-semibold">{analytics?.postImpressions?.[`last${timeRange}Days`] || 0}</span>
                                </p>
                                <button
                                    onClick={() => setShowPostModal(true)}
                                    className="detailsAnalytics flex items-center gap-2 px-4 py-1 bg-[#4a3728] text-[#f6ede8] rounded-lg hover:bg-[#3a2b1f] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                                    Details
                                </button>
                            </div>
                        </div>

                        {/* Profile Views Card */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-[#e0d8cf]">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <Eye className="w-6 h-6 text-blue-600" />
                                </div>
                                <TrendingUp className="w-5 h-5 text-green-500" />
                            </div>
                            <h3 className="text-3xl font-bold text-[#4a3728] mb-1">
                                {analytics?.profileViews?.total || 0}
                            </h3>
                            <p className="text-sm text-[#7a5c3e]">Profile Views</p>
                            <div className="mt-4 pt-4 border-t border-[#e0d8cf] flex items-center justify-between">
                                <p className="text-xs text-[#7a5c3e]">
                                    Last {timeRange} days: <span className="font-semibold">{analytics?.profileViews?.[`last${timeRange}Days`] || 0}</span>
                                </p>
                                <button
                                    onClick={() => setShowProfileViewsModal(true)}
                                    className="detailsAnalytics flex items-center gap-2 px-4 py-1 bg-[#4a3728] text-[#f6ede8] rounded-lg hover:bg-[#3a2b1f] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                                    Details
                                </button>
                            </div>
                        </div>

                        {/* Search Appearances Card */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-[#e0d8cf]">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <Search className="w-6 h-6 text-purple-600" />
                                </div>
                                <TrendingUp className="w-5 h-5 text-green-500" />
                            </div>
                            <h3 className="text-3xl font-bold text-[#4a3728] mb-1">
                                {analytics?.searchAppearances?.total || 0}
                            </h3>
                            <p className="text-sm text-[#7a5c3e]">Search Appearances</p>
                            <div className="mt-4 pt-4 border-t border-[#e0d8cf] flex items-center justify-between">
                                <p className="text-xs text-[#7a5c3e]">
                                    Last {timeRange} days: <span className="font-semibold">{analytics?.searchAppearances?.[`last${timeRange}Days`] || 0}</span>
                                </p>
                                <button
                                    onClick={() => setShowSearchModal(true)}
                                    className="detailsAnalytics flex items-center gap-2 px-4 py-1 bg-[#4a3728] text-[#f6ede8] rounded-lg hover:bg-[#3a2b1f] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                                    Details
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Additional Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Engagement Breakdown */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-[#e0d8cf]">
                            <h3 className="text-xl font-bold text-[#4a3728] mb-6">Engagement Breakdown</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <MousePointer className="w-5 h-5 text-[#7a5c3e]" />
                                        <span className="text-[#4a3728]">Clicks</span>
                                    </div>
                                        <span className="font-semibold text-[#4a3728]">
                                        {engagementData.clicks}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Share2 className="w-5 h-5 text-[#7a5c3e]" />
                                        <span className="text-[#4a3728]">Shares</span>
                                    </div>
                                    <span className="font-semibold text-[#4a3728]">
                                        {engagementData.shares}
                                    </span>
                                    
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Users className="w-5 h-5 text-[#7a5c3e]" />
                                        <span className="text-[#4a3728]">Unique Visitors</span>
                                    </div>

                                    <span className="font-semibold text-[#4a3728]">
                                        {engagementData.uniqueVisitors}
                                    </span>
                                </div>
                            </div>
                        </div>


                        

                        {/* Time-based Insights */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-[#e0d8cf]">
                            <h3 className="text-xl font-bold text-[#4a3728] mb-6">Time-based Insights</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-[#7a5c3e]">Last 7 days</span>
                                        <span className="text-sm font-semibold text-[#4a3728]">
                                            {analytics?.profileViews?.last7Days || 0}
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-[#e0d8cf] rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: getInsightWidth(analytics?.profileViews?.last7Days || 0, analytics?.profileViews?.last90Days || 0) }}></div>

                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-[#7a5c3e]">Last 30 days</span>
                                        <span className="text-sm font-semibold text-[#4a3728]">
                                            {analytics?.profileViews?.last30Days || 0}
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-[#e0d8cf] rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 rounded-full" style={{ width: getInsightWidth(analytics?.profileViews?.last30Days || 0, analytics?.profileViews?.last90Days || 0) }}></div>

                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-[#7a5c3e]">Last 90 days</span>
                                        <span className="text-sm font-semibold text-[#4a3728]">
                                            {analytics?.profileViews?.last90Days || 0}
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-[#e0d8cf] rounded-full overflow-hidden">
                                    <div className="h-full bg-purple-500 rounded-full" style={{ width: getInsightWidth(analytics?.profileViews?.last90Days || 0, analytics?.profileViews?.last90Days || 0) }}></div>
                                    </div>
                                </div>
                               
                            </div>
                        </div>
                         {/* ⬇️ NAYI LINE YAHAN ADD KARNI HAI */}
                         <AudienceInsights demographics={demographics} />
                    </div>
                </div>
            </div>

            {/* Post Impressions Modal */}
            <PostImpressionsModal
                isOpen={showPostModal}
                onClose={() => setShowPostModal(false)}
                analytics={analytics}
                userId={userId}

            />

            {/* Profile Views Modal */}
            <ProfileViewsModal
                isOpen={showProfileViewsModal}
                onClose={() => setShowProfileViewsModal(false)}
                analytics={analytics}
            />

            {/* Search Appearances Modal */}
            <SearchAppearancesModal
                isOpen={showSearchModal}
                onClose={() => setShowSearchModal(false)}
                analytics={analytics}
            />
        </>
    );
}