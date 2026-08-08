import { useState, useCallback } from 'react';
import AuthService from '@/lib/api/auth.service';
import ConnectionService from '@/lib/api/connection.service';
import ProfileService from '@/lib/api/profile.service';

export const useNetworkUsers = () => {
    const [networkUsers, setNetworkUsers] = useState<any[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const fetchNetworkUsers = useCallback(async (userId: string) => {
        try {
            setIsLoadingUsers(true);
            setCurrentUserId(userId);

            const [usersResponse, connectionsResponse] = await Promise.all([
                AuthService.getAllUsers({ limit: 100 }),
                ConnectionService.getUserConnections(userId).catch(() => ({ data: { data: [] } }))
            ]);

            const users = usersResponse.data.users;
            const connections = connectionsResponse.data.data || [];

            const connectedUserIds = new Set<string>();
            connections.forEach((conn: any) => {
                if (conn.fromUserId !== userId) connectedUserIds.add(conn.fromUserId);
                if (conn.toUserId !== userId) connectedUserIds.add(conn.toUserId);
            });

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

            // ✅ Fetch mutual connections for each suggested user in parallel
            const mutualsResults = await Promise.all(
                usersData.map((user: any) =>
                    ConnectionService.getMutualConnections(userId, user.userId, 3)
                        .then((res: any) => res?.data || { mutuals: [], count: 0 })
                        .catch(() => ({ mutuals: [], count: 0 }))
                )
            );

            // ✅ Collect the actual "mutual person" IDs (not connection record IDs)
            const mutualPersonIdsSet = new Set<string>();
            usersData.forEach((suggestedUser: any, index: number) => {
                const rawMutuals = mutualsResults[index]?.mutuals || [];
                rawMutuals.forEach((m: any) => {
                    const mutualPersonId = m.fromUserId === userId ? m.toUserId : m.fromUserId;
                    if (mutualPersonId && mutualPersonId !== userId && mutualPersonId !== suggestedUser.userId) {
                        mutualPersonIdsSet.add(mutualPersonId);
                    }
                });
            });

            // ✅ Bulk fetch mutual persons' basic info (name + profilePhotoId)
            let mutualPersonsMap: Record<string, { name: string; image: string | null }> = {};
            const mutualPersonIds = Array.from(mutualPersonIdsSet);
            if (mutualPersonIds.length > 0) {
                try {
                    const mutualUsersResponse = await AuthService.getUsersBulk(mutualPersonIds);
                    const mutualUsersData = mutualUsersResponse.data?.users || [];

                    // ✅ NEW: fetch their profile photos too
                    const mutualPhotoIds = mutualUsersData
                        .map((u: any) => u.profilePhotoId)
                        .filter(Boolean);

                    let mutualPhotosMap: Record<string, string> = {};
                    if (mutualPhotoIds.length > 0) {
                        try {
                            const mutualPhotosResponse = await ProfileService.getMultipleProfilePhotosByIds(mutualPhotoIds);
                            mutualPhotosMap = mutualPhotosResponse.data.photos.reduce((acc: Record<string, string>, photo: any) => {
                                acc[photo.photoId] = photo.cloudinarySecureUrl;
                                return acc;
                            }, {});
                        } catch (error) {
                            console.warn('⚠️ Failed to fetch mutual persons photos:', error);
                        }
                    }

                    mutualPersonsMap = mutualUsersData.reduce((acc: Record<string, { name: string; image: string | null }>, u: any) => {
                        acc[u.userId] = {
                            name: `${u.firstName} ${u.lastName}`.trim(),
                            image: u.profilePhotoId ? (mutualPhotosMap[u.profilePhotoId] || null) : null,
                        };
                        return acc;
                    }, {});
                } catch (error) {
                    console.warn('⚠️ Failed to fetch mutual persons info:', error);
                }
            }

            const transformedUsers = usersData.map((user: any, index: number) => {
                const profileImageUrl = user.profilePhotoId
                    ? profilePhotosMap[user.profilePhotoId] || null
                    : null;

                const headlineText = user.headlineId
                    ? headlinesMap[user.headlineId] || null
                    : null;

                // ✅ Build LinkedIn-style mutual connections text + avatar stack
                const rawMutuals = mutualsResults[index]?.mutuals || [];
                const mutualCount = mutualsResults[index]?.count || rawMutuals.length || 0;

                let mutualsText = '';
                let mutualAvatars: string[] = [];

                if (mutualCount > 0) {
                    const mutualPersonIdsForUser = rawMutuals
                        .map((m: any) => (m.fromUserId === userId ? m.toUserId : m.fromUserId))
                        .filter(Boolean);

                    const firstMutualId = mutualPersonIdsForUser[0] || null;
                    const firstMutualName = firstMutualId && mutualPersonsMap[firstMutualId]
                        ? mutualPersonsMap[firstMutualId].name
                        : 'Someone';

                    mutualsText = mutualCount === 1
                        ? `${firstMutualName} is a mutual connection`
                        : `${firstMutualName} and ${mutualCount - 1} other mutual connection${mutualCount - 1 > 1 ? 's' : ''}`;

                    // ✅ Top 3 mutual persons ke real photo URLs (fallback image agar photo nahi hai)
                    mutualAvatars = mutualPersonIdsForUser
                        .slice(0, 3)
                        .map((id: string) => mutualPersonsMap[id]?.image)
                        .filter((img): img is string => !!img);
                }

                return {
                    id: user.userId,
                    name: `${user.firstName} ${user.lastName}`.trim(),
                    title: headlineText || '',
                    mutuals: mutualsText,
                    mutualAvatars, // ✅ NEW
                    image: profileImageUrl || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdYRNQDghH1JvFXro2Yz3iWNmmFAubFZ-RGQ&s',
                    location: user.location || '',
                };
            });

            setNetworkUsers(transformedUsers);

        } catch (error: any) {
            setNetworkUsers([]);
        } finally {
            setIsLoadingUsers(false);
        }
    }, []);

    return {
        networkUsers,
        isLoadingUsers,
        fetchNetworkUsers,
    };
};