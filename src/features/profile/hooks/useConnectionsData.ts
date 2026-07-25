// src/hooks/data/useConnectionsData.ts
import { useState, useCallback, useRef } from 'react';
import ConnectionService from '@/lib/api/connection.service';
import AuthService from '@/lib/api/auth.service';
import ProfileService from '@/lib/api/profile.service';

// ✅ FIX: Multiple components (page.tsx, ProfileHeader, ActivitySection, etc.)
// each call `useConnectionsData()` independently, and each one used to fire
// its own network request for the SAME userId at the SAME time. That's one
// of the reasons the backend was getting hammered with duplicate requests
// and hitting 429 rate limits on a single page load.
//
// Fix: a tiny in-memory cache + in-flight request map, keyed by userId.
// - If a request for a userId is already in flight, new callers just await
//   the same promise instead of firing a new network call.
// - If we already have a recent result for that userId, we serve it
//   immediately instead of re-fetching.
//
// This is a lightweight stand-in for something like react-query. If you
// later add react-query/SWR, this cache can be removed entirely.

type ConnectionsResult = {
    followingList: any[];
    followersList: any[];
    totalConnections: number;
};

const CACHE_TTL_MS = 30 * 1000; // 30s — tune as needed
const resultCache = new Map<string, { data: ConnectionsResult; fetchedAt: number }>();
const inFlightRequests = new Map<string, Promise<ConnectionsResult>>();

export const useConnectionsData = () => {
    const [followingList, setFollowingList] = useState<any[]>([]);
    const [followersList, setFollowersList] = useState<any[]>([]);
    const [isLoadingConnections, setIsLoadingConnections] = useState(true);
    const [totalConnections, setTotalConnections] = useState(0);
    const lastRequestedUserId = useRef<string | null>(null);

    // ✅ Helper function to fetch user profiles — ab bulk mein
    const fetchUserProfiles = async (userIds: string[], connectionIdMap: Record<string, string> = {}) => {
        if (userIds.length === 0) return [];

        try {
            // ✅ SINGLE BULK CALL (pehle yahan har userId ke liye alag call hota tha)
            let profiles: any[] = [];
            try {
                const bulkResponse = await AuthService.getUsersBulk(userIds);
                profiles = bulkResponse.data?.users || [];
            } catch (err) {
                console.warn('⚠️ Failed to fetch users in bulk:', err);
                return [];
            }

            // Extract profile photo IDs
            const profilePhotoIds = profiles
                .map(user => user.profilePhotoId)
                .filter(Boolean);

            // Fetch profile photos
            let profilePhotosMap: Record<string, string> = {};
            if (profilePhotoIds.length > 0) {
                const photosResponse = await ProfileService.getMultipleProfilePhotosByIds(profilePhotoIds);
                profilePhotosMap = photosResponse.data.photos.reduce((acc: Record<string, string>, photo: any) => {
                    acc[photo.photoId] = photo.cloudinarySecureUrl;
                    return acc;
                }, {});
            }

            // Extract headline IDs
            const headlineIds = profiles
                .map(user => user.headlineId)
                .filter(Boolean);

            // ✅ SINGLE BULK CALL (pehle yahan har headline ke liye alag call hota tha)
            let headlinesMap: Record<string, string> = {};
            if (headlineIds.length > 0) {
                try {
                    const headlinesResponse = await ProfileService.getMultipleHeadlinesByIds(headlineIds);
                    const headlines = headlinesResponse.data?.headlines || [];
                    headlinesMap = headlines.reduce((acc: Record<string, string>, headline: any) => {
                        acc[headline.headlineId] = headline.title;
                        return acc;
                    }, {});
                } catch (error) {
                    console.warn('⚠️ Failed to fetch headlines:', error);
                }
            }

            // Transform to UI format
            return profiles.map(user => ({
                id: user.userId,
                connectionId: connectionIdMap[user.userId] || '',
                name: `${user.firstName} ${user.lastName}`.trim(),
                headline: user.headlineId ? headlinesMap[user.headlineId] || '' : '',
                image: user.profilePhotoId
                    ? profilePhotosMap[user.profilePhotoId] || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdYRNQDghH1JvFXro2Yz3iWNmmFAubFZ-RGQ&s'
                    : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdYRNQDghH1JvFXro2Yz3iWNmmFAubFZ-RGQ&s',
                isFollowing: true,
            }));

        } catch (error) {
            console.error('❌ Failed to fetch user profiles:', error);
            return [];
        }
    };

    // Actual network fetch — only ever called once per userId at a time,
    // thanks to the inFlightRequests map below.
    const doFetch = async (currentUserId: string): Promise<ConnectionsResult> => {
        // ✅ STEP 1: Get all connections
        const connectionsResponse = await ConnectionService.getUserConnections(currentUserId);
        const connections = connectionsResponse.data.data || [];

        // ✅ STEP 2: Separate following and followers, build connectionId map
        const followingUserIds: string[] = [];
        const followerUserIds: string[] = [];
        const connectionIdMap: Record<string, string> = {};

        connections.forEach((conn: any) => {
            const targetId = conn.fromUserId === currentUserId ? conn.toUserId : conn.fromUserId;
            connectionIdMap[targetId] = conn.connectionId;

            if (conn.fromUserId === currentUserId) {
                followingUserIds.push(conn.toUserId);
            } else if (conn.toUserId === currentUserId) {
                followerUserIds.push(conn.fromUserId);
            }
        });

        // ✅ STEP 3: Fetch user profiles for both lists
        const [followingProfiles, followerProfiles] = await Promise.all([
            fetchUserProfiles(followingUserIds, connectionIdMap),
            fetchUserProfiles(followerUserIds, connectionIdMap)
        ]);

        return {
            followingList: followingProfiles,
            followersList: followerProfiles,
            totalConnections: connections.length,
        };
    };

    const fetchConnectionsData = useCallback(async (currentUserId: string) => {
        if (!currentUserId) return;
        lastRequestedUserId.current = currentUserId;

        try {
            setIsLoadingConnections(true);

            // ✅ Serve from cache if we fetched this userId recently
            const cached = resultCache.get(currentUserId);
            const isFresh = cached && (Date.now() - cached.fetchedAt < CACHE_TTL_MS);
            if (isFresh) {
                setFollowingList(cached!.data.followingList);
                setFollowersList(cached!.data.followersList);
                setTotalConnections(cached!.data.totalConnections);
                setIsLoadingConnections(false);
                return;
            }

            // ✅ If a request for this userId is already in flight (fired by
            // another component's instance of this hook), reuse that promise
            // instead of firing a duplicate network call.
            let requestPromise = inFlightRequests.get(currentUserId);
            if (!requestPromise) {
                requestPromise = doFetch(currentUserId);
                inFlightRequests.set(currentUserId, requestPromise);
                // Clean up the in-flight marker once it settles (success or fail)
                requestPromise.finally(() => {
                    inFlightRequests.delete(currentUserId);
                });
            }

            const result = await requestPromise;

            // Cache the fresh result
            resultCache.set(currentUserId, { data: result, fetchedAt: Date.now() });

            // Only apply to state if this is still the userId we most recently
            // asked for (avoids race conditions if userId changes quickly)
            if (lastRequestedUserId.current === currentUserId) {
                setFollowingList(result.followingList);
                setFollowersList(result.followersList);
                setTotalConnections(result.totalConnections);
            }

        } catch (error: any) {
            console.error('❌ [CONNECTIONS] Failed to fetch:', error);
            setFollowingList([]);
            setFollowersList([]);
        } finally {
            setIsLoadingConnections(false);
        }
    }, []);

    return {
        followingList,
        followersList,
        totalConnections,
        isLoadingConnections,
        fetchConnectionsData,
    };
};