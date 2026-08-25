// src/features/profile/hooks/usePostReactors.ts
import { useState, useCallback } from 'react';
import HomePostService from '@/lib/api/homePost.service';
import AuthService from '@/lib/api/auth.service';
import ProfileService from '@/lib/api/profile.service';

export interface Reactor {
    userId: string;
    type: string;
    name: string;
    headline: string;
    avatar: string | null;
}

export const usePostReactors = () => {
    const [reactors, setReactors] = useState<Reactor[]>([]);
    const [countsByType, setCountsByType] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(false);

    const fetchReactors = useCallback(async (postId: string) => {
        if (!postId) return;
        try {
            setIsLoading(true);

            const res = await HomePostService.getPostReactors(postId);
            const payload = res?.data?.reactions ? res.data : (res?.reactions ? res : res?.data?.data || {});
            const reactions = payload.reactions || [];
            const counts = payload.countsByType || {};

            const userIds = reactions.map((r: any) => r.userId);
            if (userIds.length === 0) {
                setReactors([]);
                setCountsByType({});
                return;
            }

            // ✅ Bulk fetch — same pattern as useConnectionsData (one call, not N calls)
            let users: any[] = [];
            try {
                const bulkResponse = await AuthService.getUsersBulk(userIds);
                users = bulkResponse.data?.users || bulkResponse.users || [];
            } catch (err) {
                console.warn('⚠️ Failed to fetch bulk users for reactors:', err);
            }

            const photoIds = users.map((u: any) => u.profilePhotoId).filter(Boolean);
            let photosMap: Record<string, string> = {};
            if (photoIds.length > 0) {
                try {
                    const photosResponse = await ProfileService.getMultipleProfilePhotosByIds(photoIds);
                    photosMap = photosResponse.data.photos.reduce((acc: Record<string, string>, photo: any) => {
                        acc[photo.photoId] = photo.cloudinarySecureUrl;
                        return acc;
                    }, {});
                } catch (error) {
                    console.warn('⚠️ Failed to fetch photos for reactors:', error);
                }
            }

            const headlineIds = users.map((u: any) => u.headlineId).filter(Boolean);
            let headlinesMap: Record<string, string> = {};
            if (headlineIds.length > 0) {
                try {
                    const headlinesResponse = await ProfileService.getMultipleHeadlinesByIds(headlineIds);
                    const headlines = headlinesResponse.data?.headlines || [];
                    headlinesMap = headlines.reduce((acc: Record<string, string>, h: any) => {
                        acc[h.headlineId] = h.title;
                        return acc;
                    }, {});
                } catch (error) {
                    console.warn('⚠️ Failed to fetch headlines for reactors:', error);
                }
            }

            const merged: Reactor[] = reactions.map((r: any) => {
                const user = users.find((u: any) => String(u.userId) === String(r.userId));
                const name = user
                    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'User'
                    : 'User';
                return {
                    userId: r.userId,
                    type: r.type || 'like',
                    name,
                    headline: user?.headlineId ? headlinesMap[user.headlineId] || '' : '',
                    avatar: user?.profilePhotoId ? photosMap[user.profilePhotoId] || null : null,
                };
            });

            const calculatedCounts: Record<string, number> = {};
            merged.forEach((r: Reactor) => {
                calculatedCounts[r.type] = (calculatedCounts[r.type] || 0) + 1;
            });

            const hasNonZeroCount = Object.values(counts).some((c: any) => Number(c) > 0);
            setCountsByType(hasNonZeroCount ? counts : calculatedCounts);
            setReactors(merged);

        } catch (error) {
            console.error('❌ Failed to fetch post reactors:', error);
            setReactors([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { reactors, countsByType, isLoading, fetchReactors };
};