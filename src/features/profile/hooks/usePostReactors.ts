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
           const { reactions = [], countsByType: counts = {} } = res.data;
            setCountsByType(counts);

            const userIds = reactions.map((r: any) => r.userId);
            if (userIds.length === 0) {
                setReactors([]);
                return;
            }

            // ✅ Bulk fetch — same pattern as useConnectionsData (one call, not N calls)
            const bulkResponse = await AuthService.getUsersBulk(userIds);
            const users = bulkResponse.data?.users || [];

            const photoIds = users.map((u: any) => u.profilePhotoId).filter(Boolean);
            let photosMap: Record<string, string> = {};
            if (photoIds.length > 0) {
                const photosResponse = await ProfileService.getMultipleProfilePhotosByIds(photoIds);
                photosMap = photosResponse.data.photos.reduce((acc: Record<string, string>, photo: any) => {
                    acc[photo.photoId] = photo.cloudinarySecureUrl;
                    return acc;
                }, {});
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
                const user = users.find((u: any) => u.userId === r.userId);
                return {
                    userId: r.userId,
                    type: r.type,
                    name: user ? `${user.firstName} ${user.lastName}`.trim() : 'Unknown User',
                    headline: user?.headlineId ? headlinesMap[user.headlineId] || '' : '',
                    avatar: user?.profilePhotoId ? photosMap[user.profilePhotoId] || null : null,
                };
            });

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