import { useState, useCallback, useRef } from 'react';
import AuthService from '@/lib/api/auth.service';
import ConnectionService from '@/lib/api/connection.service';
import ProfileService from '@/lib/api/profile.service';

export const useNetworkUsers = () => {
    const [networkUsers, setNetworkUsers] = useState<any[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // ✅ NEW — race guard. Har fetchNetworkUsers call ko ek unique id milta hai.
    // Agar koi purani (stale) call baad me complete ho (StrictMode double-invoke,
    // ya userId change hone se dobara call), uska result IGNORE ho jata hai —
    // sirf sabse LATEST call ka result state me jaata hai. Isse intermittent
    // "stuck loading" / galat data wala race condition fix hota hai.
    const latestRequestId = useRef(0);

    const fetchNetworkUsers = useCallback(async (userId: string) => {
        const requestId = ++latestRequestId.current;
        console.log(`🟢 [DEBUG #${requestId}] fetchNetworkUsers STARTED for userId:`, userId);

        try {
            setIsLoadingUsers(true);
            setCurrentUserId(userId);

            const [usersResponse, connectionsResponse, outgoingRequestsResponse] = await Promise.all([
                AuthService.getAllUsers({ limit: 100 }),
                ConnectionService.getUserConnections(userId).catch(() => ({ data: { data: [] } })),
                ConnectionService.getOutgoingRequests(userId).catch(() => ({ data: { data: [] } }))
            ]);

            // ✅ RACE CHECK — agar ismeen ek naya request start ho chuka hai
            // (dusra fetchNetworkUsers call), to yeh purana wala yahi ruk jaye
            if (requestId !== latestRequestId.current) {
                console.log(`🟡 [DEBUG #${requestId}] STALE — newer request (#${latestRequestId.current}) exists, abandoning`);
                return;
            }

            const users = usersResponse?.data?.users || usersResponse?.data || [];
            const connections = Array.isArray(connectionsResponse?.data?.data?.data)
                ? connectionsResponse.data.data.data
                : Array.isArray(connectionsResponse?.data?.data)
                    ? connectionsResponse.data.data
                    : Array.isArray(connectionsResponse?.data)
                        ? connectionsResponse.data
                        : [];
            const outgoingRequests = Array.isArray(outgoingRequestsResponse?.data?.data?.data)
                ? outgoingRequestsResponse.data.data.data
                : Array.isArray(outgoingRequestsResponse?.data?.data)
                    ? outgoingRequestsResponse.data.data
                    : Array.isArray(outgoingRequestsResponse?.data)
                        ? outgoingRequestsResponse.data
                        : [];

            const connectedUserIds = new Set<string>();
            connections.forEach((conn: any) => {
                if (conn.fromUserId !== userId) connectedUserIds.add(conn.fromUserId);
                if (conn.toUserId !== userId) connectedUserIds.add(conn.toUserId);
            });

            // Note: Keep suggested users in userIds list so they appear in suggestions,
            // but useNetworkConnections will set connectedUsers so PersonCard renders 'Pending...'
            const userIds = users
                .map((user: any) => user.userId)
                .filter((id: string) => id !== userId && !connectedUserIds.has(id));

            let usersData: any[] = [];
            if (userIds.length > 0) {
                try {
                    const bulkResponse = await AuthService.getUsersBulk(userIds);
                    usersData = bulkResponse.data?.users || [];
                } catch (err) {
                    console.warn('⚠️ Failed to fetch users in bulk:', err);
                    usersData = [];
                }
            }

            if (requestId !== latestRequestId.current) {
                console.log(`🟡 [DEBUG #${requestId}] STALE after bulk users fetch — abandoning`);
                return;
            }

            const profilePhotoIds = usersData
                .map((user: any) => user.profilePhotoId)
                .filter(Boolean);

            let profilePhotosMap: Record<string, string> = {};
            if (profilePhotoIds.length > 0) {
                try {
                    const photosResponse = await ProfileService.getMultipleProfilePhotosByIds(profilePhotoIds);
                    profilePhotosMap = photosResponse.data.photos.reduce((acc: Record<string, string>, photo: any) => {
                        acc[photo.photoId] = photo.cloudinarySecureUrl;
                        return acc;
                    }, {});
                } catch (error) {
                    console.warn('⚠️ Failed to fetch profile photos:', error);
                }
            }

            const headlineIds = usersData
                .map((user: any) => user.headlineId)
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

            if (requestId !== latestRequestId.current) {
                console.log(`🟡 [DEBUG #${requestId}] STALE after photos/headlines — abandoning`);
                return;
            }

            // ✅ Fetch mutual connections for all suggested users in ONE bulk call
            const targetUserIds = usersData.map((user: any) => user.userId);
            let mutualsResults: any[] = usersData.map(() => ({ mutuals: [], count: 0 }));

            if (targetUserIds.length > 0) {
                try {
                    console.log(`🟡 [DEBUG #${requestId}] calling getBulkMutualConnections, targets:`, targetUserIds.length);
                    const bulkRes = await ConnectionService.getBulkMutualConnections(userId, targetUserIds, 3);
                    console.log(`✅ [DEBUG #${requestId}] mutuals bulk response:`, bulkRes?.data);
                    const resultsMap = bulkRes?.data?.data || bulkRes?.data || bulkRes || {}; // { "userId-targetId": { mutuals, count } }

                    mutualsResults = usersData.map((user: any) => {
                        const key = `${userId}-${user.userId}`;
                        return resultsMap[key] || { mutuals: [], count: 0 };
                    });
                } catch (err) {
                    console.warn('⚠️ Failed to fetch bulk mutual connections:', err);
                }
            }

            if (requestId !== latestRequestId.current) {
                console.log(`🟡 [DEBUG #${requestId}] STALE after mutuals fetch — abandoning`);
                return;
            }

            // ✅ Collect the actual "mutual person" IDs (not connection record IDs)
            const mutualPersonIdsSet = new Set<string>();
            usersData.forEach((suggestedUser: any, index: number) => {
                const rawMutuals = mutualsResults[index]?.mutuals || [];
                rawMutuals.forEach((m: any) => {
                    const mutualPersonId = m.userId || (m.fromUserId === userId ? m.toUserId : m.fromUserId) || m.id;
                    if (mutualPersonId && mutualPersonId !== userId && mutualPersonId !== suggestedUser.userId) {
                        mutualPersonIdsSet.add(mutualPersonId);
                    }
                });
            });

            // ✅ Bulk fetch mutual persons' basic info (name + avatar) for display
            let mutualPersonsMap: Record<string, { name: string; avatar: string | null }> = {};
            const mutualPersonIds = Array.from(mutualPersonIdsSet);

            if (mutualPersonIds.length > 0) {
                try {
                    const mutualUsersResponse = await AuthService.getUsersBulk(mutualPersonIds);
                    const mutualUsersData = mutualUsersResponse.data?.users || [];

                    // in mutual users ke profilePhotoId collect karo
                    const mutualPhotoIds = mutualUsersData
                        .map((u: any) => u.profilePhotoId)
                        .filter(Boolean);

                    let mutualPhotosMap: Record<string, string> = {};
                    if (mutualPhotoIds.length > 0) {
                        try {
                            const mutualPhotosResponse = await ProfileService.getMultipleProfilePhotosByIds(mutualPhotoIds);
                            mutualPhotosMap = mutualPhotosResponse.data.photos.reduce(
                                (acc: Record<string, string>, photo: any) => {
                                    acc[photo.photoId] = photo.cloudinarySecureUrl;
                                    return acc;
                                },
                                {}
                            );
                        } catch (error) {
                            console.warn('⚠️ Failed to fetch mutual profile photos:', error);
                        }
                    }

                    mutualPersonsMap = mutualUsersData.reduce(
                        (acc: Record<string, { name: string; avatar: string | null }>, u: any) => {
                            acc[u.userId] = {
                                name: `${u.firstName} ${u.lastName}`.trim(),
                                avatar: u.profilePhotoId ? mutualPhotosMap[u.profilePhotoId] || null : null,
                            };
                            return acc;
                        },
                        {}
                    );
                } catch (error) {
                    console.warn('⚠️ Failed to fetch mutual persons info:', error);
                }
            }

            if (requestId !== latestRequestId.current) {
                console.log(`🟡 [DEBUG #${requestId}] STALE after mutual persons fetch — abandoning`);
                return;
            }

            const transformedUsers = usersData.map((user: any, index: number) => {
                const profileImageUrl = user.profilePhotoId
                    ? profilePhotosMap[user.profilePhotoId] || null
                    : null;

                const headlineText = user.headlineId
                    ? headlinesMap[user.headlineId] || null
                    : null;

                // ✅ Build LinkedIn-style mutual connections text
                const rawMutuals = mutualsResults[index]?.mutuals || [];
                const mutualCount = mutualsResults[index]?.count || rawMutuals.length || 0;

                let mutualsText = '';
                let mutualAvatars: string[] = [];

                if (mutualCount > 0) {
                    const firstItem = rawMutuals[0];
                    const firstMutualId = firstItem
                        ? (firstItem.userId || (firstItem.fromUserId === userId ? firstItem.toUserId : firstItem.fromUserId) || firstItem.id)
                        : null;

                    let firstMutualName = '';
                    if (firstMutualId && mutualPersonsMap[firstMutualId]?.name) {
                        firstMutualName = mutualPersonsMap[firstMutualId].name;
                    } else if (firstItem?.name && firstItem.name.trim() !== '' && firstItem.name !== 'Unknown') {
                        firstMutualName = firstItem.name.trim();
                    } else if (firstItem?.firstName) {
                        firstMutualName = `${firstItem.firstName} ${firstItem.lastName || ''}`.trim();
                    } else {
                        firstMutualName = 'A mutual connection';
                    }

                    mutualsText = mutualCount === 1
                        ? `${firstMutualName} is a mutual connection`
                        : `${firstMutualName} and ${mutualCount - 1} other mutual connection${mutualCount - 1 > 1 ? 's' : ''}`;

                    mutualAvatars = rawMutuals
                        .slice(0, 3)
                        .map((m: any) => {
                            const mutualPersonId = m.userId || (m.fromUserId === userId ? m.toUserId : m.fromUserId) || m.id;
                            return m.avatar || m.profilePhotoUrl || (mutualPersonId ? mutualPersonsMap[mutualPersonId]?.avatar : null);
                        })
                        .filter(Boolean) as string[];
                }

                return {
                    id: user.userId,
                    name: `${user.firstName} ${user.lastName}`.trim(),
                    title: headlineText || '',
                    mutuals: mutualsText,
                    mutualAvatars,
                    image: profileImageUrl || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdYRNQDghH1JvFXro2Yz3iWNmmFAubFZ-RGQ&s',
                    location: user.location || '',
                };
            });

            console.log(`✅ [DEBUG #${requestId}] COMPLETED — ${transformedUsers.length} users, applying to state`);
            setNetworkUsers(transformedUsers);

        } catch (error: any) {
            console.log(`🔴 [DEBUG #${requestId}] CRASHED:`, error);
            if (requestId === latestRequestId.current) {
                setNetworkUsers([]);
            }
        } finally {
            // ✅ Sirf sabse latest request hi loading state control kare —
            // stale/abandoned requests ka finally block state ko touch na kare
            if (requestId === latestRequestId.current) {
                console.log(`🔵 [DEBUG #${requestId}] FINALLY — setting isLoadingUsers = false (this is the winning request)`);
                setIsLoadingUsers(false);
            } else {
                console.log(`⚪ [DEBUG #${requestId}] FINALLY — skipped, stale request`);
            }
        }
    }, []);

    return {
        networkUsers,
        isLoadingUsers,
        fetchNetworkUsers,
    };
};