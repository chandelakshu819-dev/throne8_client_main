// src/hooks/analytics/useProfileViews.ts

import { useState, useEffect, useCallback } from 'react';
import AnalyticsService from '@/lib/api/analytics.service';
import { ProfileView } from '@/types/analytics.types';
import { useSocket } from '@/core/realtime/useSocket';

interface UseProfileViewsOptions {
    days?: number;
    isPremium?: boolean;
    autoLoad?: boolean;
}

export const useProfileViews = (options: UseProfileViewsOptions = {}) => {
    const { days = 30, isPremium = false, autoLoad = true } = options;
    const { socket } = useSocket();

    const [views, setViews] = useState<ProfileView[]>([]);
    const [trend, setTrend] = useState<any>(null);
    const [change, setChange] = useState<any>(null);
    const [count, setCount] = useState({
        total: 0,
        last7Days: 0,
        last30Days: 0,
        last90Days: 0
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchViews = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            // console.log('👀 [useProfileViews] Fetching...', { days, isPremium });

            // Fetch all profile view data in parallel
            const [countResponse, detailResponse, trendResponse, changeResponse] = await Promise.all([
                AnalyticsService.getProfileViewsCount(days),
                AnalyticsService.getProfileViewsDetail(isPremium, 1, 20),
                AnalyticsService.getProfileViewsTrend(days, 'day'),
                AnalyticsService.getProfileViewsChange(days)
            ]);

            setCount(countResponse.data);
            setViews(detailResponse.data.views || []);
            setTrend(trendResponse.data);
            setChange(changeResponse.data);

            // console.log('✅ [useProfileViews] Loaded successfully');
        } catch (err: any) {
            console.error('❌ [useProfileViews] Failed:', err);
            setError(err.message || 'Failed to load profile views');
        } finally {
            setIsLoading(false);
        }
    }, [days, isPremium]);

    const trackView = useCallback(async (
        profileOwnerId: string,
        viewerData?: {
            viewerId?: string;
            viewerName?: string;
            viewerHeadline?: string;
            viewerPhotoUrl?: string;
        }
    ) => {
        try {
            await AnalyticsService.recordProfileView(profileOwnerId, viewerData);
            // console.log('✅ [useProfileViews] View tracked');
        } catch (error) {
            console.error('❌ [useProfileViews] Track failed:', error);
        }
    }, []);
    useEffect(() => {
        if (autoLoad) {
            fetchViews();
        }
    }, [autoLoad, fetchViews]);



    // 👇 NEW — real-time listener
    useEffect(() => {
        if (!socket) return;

        const handleProfileView = () => {
            fetchViews();
        };

        socket.on('analytics:profile-view', handleProfileView);

        return () => {
            socket.off('analytics:profile-view', handleProfileView);
        };
    }, [socket, fetchViews]);



    return {
        views,
        trend,
        change,
        count,
        isLoading,
        error,
        fetchViews,
        trackView
    };
};