// src/features/profile/hooks/useFollowListsData.ts
import { useState, useCallback, useRef } from 'react';
import FollowService from '@/lib/api/follow.service';
import AuthService from '@/lib/api/auth.service';
import ProfileService from '@/lib/api/profile.service';

/**
 * ✅ NEW HOOK — companion to `useFollowCounts`. That hook only gives you
 * numbers (followersCount / followingCount). This hook gives you the
 * actual LIST of users, enriched with name/headline/image, sourced from
 * the real one-directional Follow system (GET /follow/followers/:userId,
 * GET /follow/following/:userId) — NOT the Connection collection.
 *
 * Use this for the Network page's "Followers" / "Following" tabs so the
 * numbers there match the "X followers" badge shown on ProfileHeader
 * (both now come from the same Follow system). The "Connections" tab
 * should keep using `useConnectionsData` (mutual, request-based).
 */

type FollowListUser = {
    id: string;
    name: string;
    headline: string;
    image: string;
};

type FollowListsResult = {
    followersList: FollowListUser[];
    followingList: FollowListUser[];
};

const CACHE_TTL_MS = 20 * 1000; // follow lists change often (follow/unfollow) — short TTL
const resultCache = new Map<string, { data: FollowListsResult; fetchedAt: number }>();
const inFlightRequests = new Map<string, Promise<FollowListsResult>>();

export const useFollowListsData = () => {
    const [followersList, setFollowersList] = useState<FollowListUser[]>([]);
    const [followingList, setFollowingList] = useState<FollowListUser[]>([]);
    const [isLoadingFollowLists, setIsLoadingFollowLists] = useState(true);
    const lastRequestedUserId = useRef<string | null>(null);

    // Same bulk-enrichment pattern as useConnectionsData.fetchUserProfiles —
    // one bulk call for users, one for photos, one for headlines.
    const fetchUserProfiles = async (userIds: string[]): Promise<FollowListUser[]> => {
        if (userIds.length === 0) return [];

        try {
            let profiles: any[] = [];
            try {
                const bulkResponse = await AuthService.getUsersBulk(userIds);
                profiles = bulkResponse.data?.users || [];
            } catch (err) {
                console.warn('⚠️ [FOLLOW_LISTS] Failed to fetch users in bulk:', err);
                return [];
            }

            const profilePhotoIds = profiles.map((u) => u.profilePhotoId).filter(Boolean);
            let profilePhotosMap: Record<string, string> = {};
            if (profilePhotoIds.length > 0) {
                const photosResponse = await ProfileService.getMultipleProfilePhotosByIds(profilePhotoIds);
                profilePhotosMap = photosResponse.data.photos.reduce((acc: Record<string, string>, photo: any) => {
                    acc[photo.photoId] = photo.cloudinarySecureUrl;
                    return acc;
                }, {});
            }

            const headlineIds = profiles.map((u) => u.headlineId).filter(Boolean);
            let headlinesMap: Record<string, string> = {};
            if (headlineIds.length > 0) {
                try {
                    const headlinesResponse = await ProfileService.getMultipleHeadlinesByIds(headlineIds);
                    const headlines = headlinesResponse.data?.headlines || [];
                    headlinesMap = headlines.reduce((acc: Record<string, string>, h: any) => {
                        acc[h.headlineId] = h.title;
                        return acc;
                    }, {});
                } catch (err) {
                    console.warn('⚠️ [FOLLOW_LISTS] Failed to fetch headlines:', err);
                }
            }

            return profiles.map((user) => ({
                id: user.userId,
                name: `${user.firstName} ${user.lastName}`.trim(),
                headline: user.headlineId ? headlinesMap[user.headlineId] || '' : '',
                image: user.profilePhotoId
                    ? profilePhotosMap[user.profilePhotoId] || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdYRNQDghH1JvFXro2Yz3iWNmmFAubFZ-RGQ&s'
                    : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdYRNQDghH1JvFXro2Yz3iWNmmFAubFZ-RGQ&s',
            }));
        } catch (error) {
            console.error('❌ [FOLLOW_LISTS] Failed to fetch user profiles:', error);
            return [];
        }
    };

    const doFetch = async (userId: string): Promise<FollowListsResult> => {
        // limit=100 — plenty for typical follower counts; bump later or add
        // real pagination to the UI if a user ever exceeds this.
        const [followersRes, followingRes] = await Promise.all([
            FollowService.getFollowers(userId, { limit: 100 }),
            FollowService.getFollowing(userId, { limit: 100 }),
        ]);

        const followerDocs = followersRes?.data?.data || [];
        const followingDocs = followingRes?.data?.data || [];

        const followerIds = followerDocs.map((f: any) => f.followerId);
        const followingIds = followingDocs.map((f: any) => f.followingId);

        const [followersProfiles, followingProfiles] = await Promise.all([
            fetchUserProfiles(followerIds),
            fetchUserProfiles(followingIds),
        ]);

        return { followersList: followersProfiles, followingList: followingProfiles };
    };

    const fetchFollowLists = useCallback(async (userId: string) => {
        if (!userId) return;
        lastRequestedUserId.current = userId;

        try {
            setIsLoadingFollowLists(true);

            const cached = resultCache.get(userId);
            const isFresh = cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS;
            if (isFresh) {
                setFollowersList(cached!.data.followersList);
                setFollowingList(cached!.data.followingList);
                setIsLoadingFollowLists(false);
                return;
            }

            let requestPromise = inFlightRequests.get(userId);
            if (!requestPromise) {
                requestPromise = doFetch(userId);
                inFlightRequests.set(userId, requestPromise);
                requestPromise.finally(() => inFlightRequests.delete(userId));
            }

            const result = await requestPromise;
            resultCache.set(userId, { data: result, fetchedAt: Date.now() });

            if (lastRequestedUserId.current === userId) {
                setFollowersList(result.followersList);
                setFollowingList(result.followingList);
            }
        } catch (error) {
            console.error('❌ [FOLLOW_LISTS] Failed to fetch:', error);
            setFollowersList([]);
            setFollowingList([]);
        } finally {
            setIsLoadingFollowLists(false);
        }
    }, []);

    // Call after a follow/unfollow action so the list refreshes immediately
    // instead of waiting out the cache TTL.
    const invalidateFollowLists = useCallback((userId: string) => {
        resultCache.delete(userId);
    }, []);

    return {
        followersList,
        followingList,
        isLoadingFollowLists,
        fetchFollowLists,
        invalidateFollowLists,
    };
};