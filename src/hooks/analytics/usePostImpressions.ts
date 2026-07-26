// src/hooks/analytics/usePostImpressions.ts

import { useState, useEffect, useCallback } from 'react';
import AnalyticsService from '@/lib/api/analytics.service';
import { PostImpression } from '@/types/analytics.types';

interface UsePostImpressionsOptions {
    days?: number;
    postId?: string;
    autoLoad?: boolean;
}

export const usePostImpressions = (options: UsePostImpressionsOptions = {}) => {
    const { days = 30, postId, autoLoad = true } = options;

    const [impressions, setImpressions] = useState<PostImpression[]>([]);
    const [timeline, setTimeline] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [change, setChange] = useState<any>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchImpressions = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const [detailResponse, timelineResponse, changeResponse] = await Promise.all([
                AnalyticsService.getPostImpressionsDetail(1, 50),
                AnalyticsService.getPostImpressionsTimeline(days, postId),
                AnalyticsService.getPostImpressionsChange(days)
            ]);

            setImpressions(detailResponse.data.impressions || []);
            setTimeline(timelineResponse.data);
            setChange(changeResponse.data);

            if (postId) {
                const statsResponse = await AnalyticsService.getPostImpressionStats(postId);
                setStats(statsResponse.data);
            }
        } catch (err: any) {
            console.error('❌ [usePostImpressions] Failed:', err);
            setError(err.message || 'Failed to load impressions');
        } finally {
            setIsLoading(false);
        }
    }, [days, postId]);

    const trackImpression = useCallback(async (
        trackPostId: string,
        postOwnerId: string,
        source: string
    ) => {
        try {
            await AnalyticsService.recordPostImpressionSmart(
                trackPostId,
                postOwnerId,
                source
            );
        } catch (error) {
            console.error('❌ [usePostImpressions] Track failed:', error);
        }
    }, []);

    useEffect(() => {
        if (autoLoad) {
            fetchImpressions();
        }
    }, [autoLoad, fetchImpressions]);

    // ℹ️ NOTE: socket-triggered auto-refetch ('analytics:post-impression')
    // was intentionally removed here. If you want real-time updates back,
    // debounce the handler (e.g. 5-10s) before calling fetchImpressions(),
    // otherwise frequent broadcast events will re-trigger 3 parallel API
    // calls each time and can retrigger rate-limit issues.

    return {
        impressions,
        timeline,
        stats,
        change,

        isLoading,
        error,
        fetchImpressions,
        trackImpression
    };
};