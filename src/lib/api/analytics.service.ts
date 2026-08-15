// lib/api/analytics.service.ts - WITH TRACKING METHODS
import { api } from './auth.service';

class AnalyticsService {
    // ==================== TRACKING METHODS (NEW) ====================

    /**
     * 🔍 Record Search Appearance (When user appears in search)
     * This is called when someone searches and this user shows in results
     */
    
    static async recordSearchAppearance(
        searchedUserId: string,
        searchQuery: string,
        wasClicked: boolean = false,
        position?: number
    ): Promise<any> {
        try {
            const { data } = await api.post('/profile/analytics/record-search', {
                searchedUserId,
                searchQuery,
                wasClicked,
                position
            });
            return data;
        } catch (error: any) {
            console.error('❌ [ANALYTICS] Failed to record search appearance:', error);
            return null;
        }
    }

    /**
     * 👁️ Record Profile View (When someone views a profile)
     */
    static async recordProfileView(
        profileOwnerId: string,
        viewerData?: {
            viewerId?: string;
            viewerName?: string;
            viewerHeadline?: string;
            viewerPhotoUrl?: string;
        }
    ): Promise<any> {
        try {
            const { data } = await api.post('/profile/analytics/record-profile-view', {
                profileOwnerId,
                ...viewerData
            });
            return data;
        } catch (error: any) {
            console.error('❌ [ANALYTICS] Failed to record profile view:', error);
            return null;
        }
    }

    // ==================== EXISTING GET METHODS ====================

    static async togglePrivacy(isPrivate: boolean): Promise<any> {
        try {
            const { data } = await api.put('/profile/analytics/privacy', { isPrivate });
            return data;
        } catch (error: any) {
            console.error('❌ [ANALYTICS] Toggle privacy failed:', error);
            throw error;
        }
    }

    static async getProfileViewsCount(dateRange: number = 90): Promise<any> {
        try {
            const { data } = await api.get('/profile/analytics/profile-views/count', {
                params: { dateRange }
            });
            return data;
        } catch (error: any) {
            console.error('❌ [ANALYTICS] Failed to fetch profile views:', error);
            throw error;
        }
    }

    static async getProfileViewsDetail(
        isPremium: boolean = false,
        page: number = 1,
        limit: number = 10
    ): Promise<any> {
        try {
            const { data } = await api.get('/profile/analytics/profile-views/detail', {
                params: { isPremium, page, limit }
            });
            return data;
        } catch (error: any) {
            console.error('❌ [ANALYTICS] Failed to fetch profile views detail:', error);
            throw error;
        }
    }

    static async getProfileViewsTrend(days: number = 30, groupBy: 'day' | 'week' | 'month' = 'day'): Promise<any> {
        try {
            const { data } = await api.get('/profile/analytics/profile-views/trend', {
                params: { days, groupBy }
            });
            return data;
        } catch (error: any) {
            console.error('❌ [ANALYTICS] Failed to fetch profile views trend:', error);
            throw error;
        }
    }

    static async getProfileViewsChange(days: number = 30): Promise<any> {
        try {
            const { data } = await api.get('/profile/analytics/profile-views/change', {
                params: { days }
            });
            return data;
        } catch (error: any) {
            console.error('❌ [ANALYTICS] Failed to fetch profile views change:', error);
            throw error;
        }
    }

    static async getPostImpressionsChange(days: number = 30): Promise<any> {
        try {
            const { data } = await api.get('/profile/analytics/post-impressions/change', {
                params: { days }
            });
            return data;
        } catch (error: any) {
            console.error('❌ [ANALYTICS] Failed to fetch post impressions change:', error);
            throw error;
        }
    }

    static async getSearchAppearancesChange(days: number = 30): Promise<any> {
        try {
            const { data } = await api.get('/profile/analytics/search-appearances/change', {
                params: { days }
            });
            return data;
        } catch (error: any) {
            console.error('❌ [ANALYTICS] Failed to fetch search appearances change:', error);
            throw error;
        }
    }

    static async getPostImpressionsCount(limit: number = 20): Promise<any> {
        try {
            const { data } = await api.get('/profile/analytics/post-impressions/count', {
                params: { limit }
            });
            return data;
        } catch (error: any) {
            console.error('❌ [ANALYTICS] Failed to fetch post impressions:', error);
            throw error;
        }
    }

    static async getPostImpressionsDetail(page: number = 1, limit: number = 50): Promise<any> {
        try {
            const { data } = await api.get('/profile/analytics/post-impressions/detail', {
                params: { page, limit }
            });
            return data;
        } catch (error: any) {
            console.error('❌ [ANALYTICS] Failed to fetch post impressions detail:', error);
            throw error;
        }
    }

    static async getPostImpressionsByTimeframe(days: number = 7): Promise<any> {
        try {
            const { data } = await api.get('/profile/analytics/post-impressions/timeframe', {
                params: { days }
            });
            return data;
        } catch (error: any) {
            console.error('❌ [ANALYTICS] Failed to fetch post impressions timeframe:', error);
            throw error;
        }
    }

    static async getSearchAppearancesCount(): Promise<any> {
        try {
            const { data } = await api.get('/profile/analytics/search-appearances/count');
            return data;
        } catch (error: any) {
            console.error('❌ [ANALYTICS] Failed to fetch search appearances:', error);
            throw error;
        }
    }

    static async getSearchAppearancesDetail(page: number = 1, limit: number = 50): Promise<any> {
        try {
            const { data } = await api.get('/profile/analytics/search-appearances/detail', {
                params: { page, limit }
            });
            return data;
        } catch (error: any) {
            console.error('❌ [ANALYTICS] Failed to fetch search appearances detail:', error);
            throw error;
        }
    }

    static async getAllAnalytics(dateRange: number = 30, useCache: boolean = true): Promise<any> {
        try {
            const { data } = await api.get('/profile/analytics/all', {
                params: { dateRange }
            });
            return data;
        } catch (error: any) {
            console.error('❌ [ANALYTICS] Failed to fetch all analytics:', error);
            throw error;
        }
    }

    static clearAnalyticsCache(): void {
        // no-op, backend has no cache yet
    }

    static async getWhoViewedProfile(
        isPremium: boolean = false,
        page: number = 1,
        limit: number = 20
    ): Promise<any> {
        try {
            const { data } = await api.get('/profile/analytics/who-viewed', {
                params: { isPremium, page, limit }
            });
            return data;
        } catch (error: any) {
            console.error('❌ [ANALYTICS] Failed to fetch who viewed:', error);
            throw error;
        }
    }

    static async getViewerDemographics(): Promise<any> {
        try {
            const { data } = await api.get('/profile/analytics/demographics');
            return data;
        } catch (error: any) {
            console.error('❌ [ANALYTICS] Failed to fetch demographics:', error);
            throw error;
        }
    }

    static async getSearchKeywords(limit: number = 10): Promise<any> {
        try {
            const { data } = await api.get('/profile/analytics/search-keywords', {
                params: { limit }
            });
            return data;
        } catch (error: any) {
            console.error('❌ [ANALYTICS] Failed to fetch search keywords:', error);
            throw error;
        }
    }

    static async getAnalyticsByDateRange(startDate: string, endDate: string): Promise<any> {
        try {
            const { data } = await api.get('/profile/analytics/date-range', {
                params: { startDate, endDate }
            });
            return data;
        } catch (error: any) {
            console.error('❌ [ANALYTICS] Failed to fetch analytics by date range:', error);
            throw error;
        }
    }

    static async exportAnalytics(format: 'csv' | 'excel' = 'csv'): Promise<any> {
        try {
            const { data } = await api.get('/profile/analytics/export', {
                params: { format }
            });
            return data;
        } catch (error: any) {
            console.error('❌ [ANALYTICS] Failed to export analytics:', error);
            throw error;
        }
    }

    static async getAnalyticsGraphData(days: number = 30): Promise<any> {
        try {
            const { data } = await api.get('/profile/analytics/graphs', {
                params: { days }
            });
            return data;
        } catch (error: any) {
            console.error('❌ [ANALYTICS] Failed to fetch graph data:', error);
            throw error;
        }
    }

    /**
     * 🔥 SMART POST IMPRESSION (Time-based, 10-min cooldown)
     * ✅ CHANGED: naya `viewDuration` param add hua (seconds mein) — actual
     * dwell time bhejta hai jo `usePostImpressionTracking` entry/exit se nikaalta hai
     */
    static async recordPostImpressionSmart(
        postId: string,
        postOwnerId: string,
        source: string,
        viewDuration?: number
    ) {
        try {
            const { data } = await api.post('/profile/analytics/record-post-impression-smart', {
                postId,
                postOwnerId,
                source,
                viewDuration
            });
            return data;
        } catch (error: any) {
            console.error('❌ Record post impression failed:', error);
            return null;
        }
    }

    static async recordEngagement(postId: string, postOwnerId: string, engagementType: 'like' | 'comment' | 'share' | 'save') {
        try {
            const { data } = await api.post('/profile/analytics/record-engagement', {
                postId,
                postOwnerId,
                engagementType
            });
            return data;
        } catch (error: any) {
            console.error('❌ Record engagement failed:', error);
            return null;
        }
    }

    static async recordShare(postOwnerId: string, postId: string, shareType: string = 'linkedin') {
        try {
            const { data } = await api.post('/profile/analytics/record-share', {
                postOwnerId,
                postId,
                shareType
            });
            return data;
        } catch (error: any) {
            console.error('❌ Record share failed:', error);
            return null;
        }
    }

    static async recordClick(
        targetUserId: string,
        clickType: string,
        targetUrl?: string,
        postId?: string
    ) {
        try {
            const { data } = await api.post('/profile/analytics/record-click', {
                targetUserId,
                clickType,
                targetUrl,
                postId
            });
            return data;
        } catch (error: any) {
            console.error('❌ Record click failed:', error);
            return null;
        }
    }

    static async recordUniqueVisitor(
        profileOwnerId: string,
        pageUrl?: string,
        duration?: number
    ) {
        try {
            const { data } = await api.post('/profile/analytics/record-unique-visitor', {
                profileOwnerId,
                pageUrl,
                duration
            });
            return data;
        } catch (error: any) {
            console.error('❌ Record unique visitor failed:', error);
            return null;
        }
    }

    static async getPostImpressionsTimeline(days: number = 30, postId?: string) {
        try {
            const { data } = await api.get('/profile/analytics/post-impressions/timeline', {
                params: { days, postId }
            });
            return data;
        } catch (error: any) {
            console.error('❌ Get impressions timeline failed:', error);
            throw error;
        }
    }

    static async getPostImpressionStats(postId: string) {
        try {
            const { data } = await api.get(`/profile/analytics/post/${postId}/impression-stats`);
            return data;
        } catch (error: any) {
            console.error('❌ Get post stats failed:', error);
            throw error;
        }
    }

    static async getPostAnalytics(postId: string, days: number = 30) {
        try {
            const { data } = await api.get(`/profile/analytics/post/${postId}`, {
                params: { days }
            });
            return data;
        } catch (error: any) {
            console.error('❌ Get post analytics failed:', error);
            throw error;
        }
    }

    static async getDiscoveryStats(days?: number): Promise<any> {
        try {
            const { data } = await api.get('/profile/analytics/discovery-stats', {
                params: days ? { days } : {}
            });
            return data;
        } catch (error: any) {
            console.error('❌ [ANALYTICS] Failed to fetch discovery stats:', error);
            throw error;
        }
    }

    static async getClicksCount(days?: number): Promise<any> {
        try {
            const { data } = await api.get('/profile/analytics/clicks/count', {
                params: days ? { days } : {}
            });
            return data;
        } catch (error: any) {
            console.error('❌ [ANALYTICS] Failed to fetch clicks count:', error);
            throw error;
        }
    }

    static async getSharesCount(days?: number): Promise<any> {
        try {
            const { data } = await api.get('/profile/analytics/shares/count', {
                params: days ? { days } : {}
            });
            return data;
        } catch (error: any) {
            console.error('❌ [ANALYTICS] Failed to fetch shares count:', error);
            throw error;
        }
    }

    static async getUniqueVisitorsCount(days?: number): Promise<any> {
        try {
            const { data } = await api.get('/profile/analytics/unique-visitors/count', {
                params: days ? { days } : {}
            });
            return data;
        } catch (error: any) {
            console.error('❌ [ANALYTICS] Failed to fetch unique visitors count:', error);
            throw error;
        }
    }



    static async getSearchAppearancesWithHighlights(page: number = 1, limit: number = 50): Promise<any> {
        try {
            const { data } = await api.get('/profile/analytics/search-appearances/highlighted', {  // ✅ "highlighted" — route ke saath match
                params: { page, limit }
            });
            return data;
        } catch (error: any) {
            console.error('❌ [ANALYTICS] Failed to fetch search appearances with highlights:', error);
            throw error;
        }
    }
}

export default AnalyticsService;