// src/features/profile/hooks/useFollowCounts.ts
import { useState, useCallback, useRef } from 'react';
import FollowService from '@/lib/api/follow.service';

/**
 * ✅ NEW HOOK — dedicated Follow-system counts (one-directional follow,
 * NOT the same as "connections"). Backend: GET /api/v1/follow/counts/:userId
 * Response shape (confirmed from followController.getFollowCounts):
 *   SuccessResponse({ followersCount, followingCount }, message)
 * i.e. api response body = { success, data: { followersCount, followingCount }, message }
 * FollowService.getFollowCounts() returns that body as-is (`data` from axios),
 * so the counts live at res.data.followersCount / res.data.followingCount.
 */

const CACHE_TTL_MS = 15 * 1000; // short TTL — follow counts change often (follow/unfollow clicks)
const resultCache = new Map<string, { followersCount: number; followingCount: number; fetchedAt: number }>();
const inFlightRequests = new Map<string, Promise<{ followersCount: number; followingCount: number }>>();

export const useFollowCounts = () => {
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [isLoadingFollowCounts, setIsLoadingFollowCounts] = useState(true);
    const lastRequestedUserId = useRef<string | null>(null);

    const doFetch = async (userId: string) => {
        const res = await FollowService.getFollowCounts(userId);
        // ✅ Defensive parsing — handles both possible wrapper shapes
        // ({ data: { followersCount } } as well as flat { followersCount })
        const followers =
            res?.data?.followersCount ??
            res?.followersCount ??
            0;
        const following =
            res?.data?.followingCount ??
            res?.followingCount ??
            0;
        return { followersCount: followers, followingCount: following };
    };

    const fetchFollowCounts = useCallback(async (userId: string) => {
        if (!userId) return;
        lastRequestedUserId.current = userId;

        try {
            setIsLoadingFollowCounts(true);

            const cached = resultCache.get(userId);
            const isFresh = cached && (Date.now() - cached.fetchedAt < CACHE_TTL_MS);
            if (isFresh) {
                setFollowersCount(cached!.followersCount);
                setFollowingCount(cached!.followingCount);
                setIsLoadingFollowCounts(false);
                return;
            }

            let requestPromise = inFlightRequests.get(userId);
            if (!requestPromise) {
                requestPromise = doFetch(userId);
                inFlightRequests.set(userId, requestPromise);
                requestPromise.finally(() => inFlightRequests.delete(userId));
            }

            const result = await requestPromise;
            resultCache.set(userId, { ...result, fetchedAt: Date.now() });

            if (lastRequestedUserId.current === userId) {
                setFollowersCount(result.followersCount);
                setFollowingCount(result.followingCount);
            }
        } catch (error) {
            console.error('❌ [FOLLOW_COUNTS] Failed to fetch:', error);
            // ✅ Do NOT silently reset to 0 on transient errors if we already
            // have a value — keeps the UI from flashing "0 followers" on a
            // brief network hiccup. Only reset if we truly have nothing yet.
            setFollowersCount((prev) => prev || 0);
            setFollowingCount((prev) => prev || 0);
        } finally {
            setIsLoadingFollowCounts(false);
        }
    }, []);

    // ✅ Call this right after a successful follow/unfollow action so the
    // count updates instantly instead of waiting for the next fetch cycle
    const invalidateFollowCounts = useCallback((userId: string) => {
        resultCache.delete(userId);
    }, []);

    return {
        followersCount,
        followingCount,
        isLoadingFollowCounts,
        fetchFollowCounts,
        invalidateFollowCounts,
    };
};