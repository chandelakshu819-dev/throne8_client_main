// src/features/profile/hooks/useConnectionsData.ts
import { useState, useCallback, useRef } from 'react';
import ConnectionService from '@/lib/api/connection.service';
import AuthService from '@/lib/api/auth.service';
import ProfileService from '@/lib/api/profile.service';

type ConnectionsResult = {
    followingList: any[];
    followersList: any[];
    totalConnections: number;
};

const CACHE_TTL_MS = 30 * 1000;
const resultCache = new Map<string, { data: ConnectionsResult; fetchedAt: number }>();
const inFlightRequests = new Map<string, Promise<ConnectionsResult>>();

export const useConnectionsData = () => {
    const [followingList, setFollowingList] = useState<any[]>([]);
    const [followersList, setFollowersList] = useState<any[]>([]);
    const [isLoadingConnections, setIsLoadingConnections] = useState(true);
    const [totalConnections, setTotalConnections] = useState(0);
    const lastRequestedUserId = useRef<string | null>(null);

    const fetchUserProfiles = async (userIds: string[], connectionIdMap: Record<string, string> = {}) => {
        if (userIds.length === 0) return [];

        try {
            let profiles: any[] = [];
            try {
                const bulkResponse = await AuthService.getUsersBulk(userIds);
                profiles = bulkResponse.data?.users || [];
            } catch (err) {
                console.warn('⚠️ Failed to fetch users in bulk:', err);
                return [];
            }

            const profilePhotoIds = profiles
                .map(user => user.profilePhotoId)
                .filter(Boolean);

            let profilePhotosMap: Record<string, string> = {};
            if (profilePhotoIds.length > 0) {
                const photosResponse = await ProfileService.getMultipleProfilePhotosByIds(profilePhotoIds);
                profilePhotosMap = photosResponse.data.photos.reduce((acc: Record<string, string>, photo: any) => {
                    acc[photo.photoId] = photo.cloudinarySecureUrl;
                    return acc;
                }, {});
            }

            const headlineIds = profiles
                .map(user => user.headlineId)
                .filter(Boolean);

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

            return profiles.map(user => ({
                id: user.userId,
                connectionId: connectionIdMap[user.userId] || '',
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User',
                headline: user.headlineId ? headlinesMap[user.headlineId] || '' : '',
                image: user.profilePhotoId
                    ? profilePhotosMap[user.profilePhotoId] || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdYRNQDghH1JvFXro2Yz3iWNmmFAubFZ-RGQ&s'
                    : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdYRNQDghH1JvFXro2Yz3iWNmmFAubFZ-RGQ&s',
                location: user.location || '',
                isFollowing: true,
            }));

        } catch (error) {
            console.error('❌ Failed to fetch user profiles:', error);
            return [];
        }
    };

    const doFetch = async (currentUserId: string): Promise<ConnectionsResult> => {
        const connectionsResponse = await ConnectionService.getUserConnections(currentUserId);
        const connections = connectionsResponse.data.data || [];

        const followingUserIds: string[] = [];
        const followerUserIds: string[] = [];
        const connectionIdMap: Record<string, string> = {};

        // ✅ FIX: Set of unique connected user IDs — yeh actual "kitne alag
        // logon se connection hai" batata hai. Agar backend mein duplicate
        // connection docs bane hain (same pair ke liye do docs, opposite
        // direction mein), to woh dono followingUserIds aur followerUserIds
        // mein chala jaata tha aur totalConnections galat (double) ho jaata
        // tha, jabki list mein dedupe hone ke baad sahi count dikhta tha.
        const uniqueConnectedUserIds = new Set<string>();

        let unmatchedCount = 0;
        let duplicatePairCount = 0;
        connections.forEach((conn: any) => {
            const targetId = conn.fromUserId === currentUserId ? conn.toUserId : conn.fromUserId;
            connectionIdMap[targetId] = conn.connectionId;

            if (conn.fromUserId === currentUserId) {
                followingUserIds.push(conn.toUserId);
            } else if (conn.toUserId === currentUserId) {
                followerUserIds.push(conn.fromUserId);
            } else {
                unmatchedCount += 1;
                console.warn(
                    '⚠️ [CONNECTIONS] Orphaned/mismatched connection doc — neither fromUserId nor toUserId matches currentUserId:',
                    { currentUserId, connectionId: conn.connectionId, fromUserId: conn.fromUserId, toUserId: conn.toUserId }
                );
                return;
            }

            if (uniqueConnectedUserIds.has(targetId)) {
                duplicatePairCount += 1;
                console.warn(
                    '⚠️ [CONNECTIONS] Duplicate connection doc for the same pair (both directions exist in DB):',
                    { currentUserId, otherUserId: targetId, connectionId: conn.connectionId }
                );
            }
            uniqueConnectedUserIds.add(targetId);
        });

        if (unmatchedCount > 0) {
            console.warn(
                `⚠️ [CONNECTIONS] ${unmatchedCount} of ${connections.length} connection doc(s) for user ${currentUserId} did not match either direction. Check the backend Connection collection for stale/duplicate/bad-userId docs.`
            );
        }
        if (duplicatePairCount > 0) {
            console.warn(
                `⚠️ [CONNECTIONS] ${duplicatePairCount} duplicate connection doc(s) found for user ${currentUserId} — same pair has connection docs in both directions. This is a backend data integrity issue; consider adding a unique compound index on (fromUserId, toUserId) pair (unordered) in the Connection model.`
            );
        }

        const [followingProfiles, followerProfiles] = await Promise.all([
            fetchUserProfiles(followingUserIds, connectionIdMap),
            fetchUserProfiles(followerUserIds, connectionIdMap)
        ]);

        return {
            followingList: followingProfiles,
            followersList: followerProfiles,
            // ✅ FIX: unique count, ab list ke saath hamesha match karega
            totalConnections: uniqueConnectedUserIds.size,
        };
    };

    const fetchConnectionsData = useCallback(async (currentUserId: string) => {
        if (!currentUserId) return;
        lastRequestedUserId.current = currentUserId;

        try {
            setIsLoadingConnections(true);

            const cached = resultCache.get(currentUserId);
            const isFresh = cached && (Date.now() - cached.fetchedAt < CACHE_TTL_MS);
            if (isFresh) {
                setFollowingList(cached!.data.followingList);
                setFollowersList(cached!.data.followersList);
                setTotalConnections(cached!.data.totalConnections);
                setIsLoadingConnections(false);
                return;
            }

            let requestPromise = inFlightRequests.get(currentUserId);
            if (!requestPromise) {
                requestPromise = doFetch(currentUserId);
                inFlightRequests.set(currentUserId, requestPromise);
                requestPromise.finally(() => {
                    inFlightRequests.delete(currentUserId);
                });
            }

            const result = await requestPromise;

            resultCache.set(currentUserId, { data: result, fetchedAt: Date.now() });

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