// src/features/dashboard/hooks/useAllUsersPosts.ts

import { useState, useCallback, useRef,useEffect} from 'react';
import { transformApiPostToFeedPost } from '@/shared/utils/postTransformers';
import ProfileService from '@/lib/api/profile.service';
import AuthService from '@/lib/api/auth.service';
import { onPostContentUpdated } from '@/shared/utils/postEvents';

export const useAllUsersPosts = () => {
    const [allPosts, setAllPosts] = useState<any[]>([]);
    const [isLoadingAllPosts, setIsLoadingAllPosts] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);

    const usersCacheRef = useRef<Record<string, any>>({});
    const photosCacheRef = useRef<Record<string, string>>({});
    const headlinesCacheRef = useRef<Record<string, string>>({});

    const transformPosts = useCallback(async (posts: any[]) => {
        const uniqueUserIds = [
            ...new Set(
                posts.flatMap((post: any) =>
                    post.feedItemType === 'repost'
                        ? [String(post.userId), String(post.originalPost?.userId)]
                        : [String(post.userId)]
                ).filter(Boolean)
            ),
        ] as string[];

        const idsToFetch = uniqueUserIds.filter((id) => !usersCacheRef.current[id]);

        if (idsToFetch.length > 0) {
            try {
                const usersResponse = await AuthService.getUsersBulk(idsToFetch);
                const users = usersResponse.data?.users || [];
                users.forEach((user: any) => {
                    usersCacheRef.current[user.userId] = user;
                });
            } catch (error) {
                console.warn('⚠️ Failed to fetch bulk users:', error);
            }
        }

        const usersData = usersCacheRef.current;

        const profilePhotoIdsToFetch = uniqueUserIds
            .map((id) => usersData[id]?.profilePhotoId)
            .filter((id): id is string => !!id && !photosCacheRef.current[id]);

        if (profilePhotoIdsToFetch.length > 0) {
            try {
                const photosResponse = await ProfileService.getMultipleProfilePhotosByIds(profilePhotoIdsToFetch);
                const photos = photosResponse.data.photos;
                photos.forEach((photo: any) => {
                    photosCacheRef.current[photo.photoId] = photo.cloudinarySecureUrl;
                });
            } catch (error) {
                console.warn('⚠️ Failed to fetch profile photos:', error);
            }
        }

        

        const headlineIdsToFetch = uniqueUserIds
            .map((id) => usersData[id]?.headlineId)
            .filter((id): id is string => !!id && !headlinesCacheRef.current[id]);

        if (headlineIdsToFetch.length > 0) {
            try {
                const headlinesResponse = await ProfileService.getMultipleHeadlinesByIds(headlineIdsToFetch);
                const headlines = headlinesResponse.data?.headlines || [];
                headlines.forEach((headline: any) => {
                    headlinesCacheRef.current[headline.headlineId] = headline.title;
                });
            } catch (error) {
                console.warn('⚠️ Failed to fetch headlines:', error);
            }
        }

        const profilePhotosMap = photosCacheRef.current;
        const headlinesMap = headlinesCacheRef.current;

        const fallbackUser = { firstName: 'Unknown', lastName: 'User', profilePhotoId: null, headlineId: null };




        return posts.map((post: any) => {
            if (post.feedItemType === 'repost') {
                const reposterData = usersData[post.userId] || fallbackUser;
                const originalUserData = usersData[post.originalPost?.userId] || fallbackUser;

                const reposterProfileImageUrl = reposterData.profilePhotoId
                    ? profilePhotosMap[reposterData.profilePhotoId] || null
                    : null;

                const originalProfileImageUrl = originalUserData.profilePhotoId
                    ? profilePhotosMap[originalUserData.profilePhotoId] || null
                    : null;

                return {
                    feedItemType: 'repost',
                    repostId: post.repostId,
                    repostType: post.repostType,
                    thoughtText: post.thoughtText,
                    createdAt: post.createdAt,
                    userId: post.userId,
                    reposterName: `${reposterData.firstName || ''} ${reposterData.lastName || ''}`.trim() || 'Unknown User',
                    reposterAvatar: reposterProfileImageUrl,
                    isLikedByCurrentUser: post.isLikedByCurrentUser || false,
                    likesCount: post.likesCount || 0,
                    commentsCount: post.commentsCount || 0,
                    likedByConnections: post.likedByConnections || [],
                    likedByConnectionsAvatars: post.likedByConnectionsAvatars || [],
                    likedByConnectionsCount: post.likedByConnectionsCount || 0,
                    likedByConnectionsFull: post.likedByConnectionsFull || [],
                    commentedByConnections: post.commentedByConnections || [],
                    commentedByConnectionsAvatars: post.commentedByConnectionsAvatars || [],
                    commentedByConnectionsCount: post.commentedByConnectionsCount || 0,
                    commentedByConnectionsFull: post.commentedByConnectionsFull || [],
                    connectionStatus: post.connectionStatus,
                    connectionDegree: post.connectionDegree,
                    originalPost: {
                        entryId: post.originalPost.entryId,
                        userId: post.originalPost.userId,
                        title: post.originalPost.title,
                        content: post.originalPost.content,
                        images: post.originalPost.images || [],
                        videos: post.originalPost.videos || [],
                        documents: post.originalPost.documents || [],
                        likesCount: post.originalPost.likesCount || 0,
                        commentsCount: post.originalPost.commentsCount || 0,
                        isLikedByCurrentUser: post.originalPost.isLikedByCurrentUser || false,
                        createdAt: post.originalPost.createdAt,
                        userAvatar: originalProfileImageUrl,
                        userName:
                            `${originalUserData.firstName || ''} ${originalUserData.lastName || ''}`.trim() ||
                            'Unknown User',
                        fullName:
                            `${originalUserData.firstName || ''} ${originalUserData.lastName || ''}`.trim() ||
                            'Unknown User',
                        connectionStatus: post.originalPost.connectionStatus || 'none',
                        connectionDegree: post.originalPost.connectionDegree ?? null,
                        // ✅ counts
                        repostsCount: post.originalPost.repostsCount || 0,
                        sendsCount: post.originalPost.sendsCount || 0,
                        shares: post.originalPost.repostsCount || post.originalPost.shares || 0,
                    },
                };
            }

            const userData = usersData[post.userId] || fallbackUser;

            const profileImageUrl = userData.profilePhotoId
                ? profilePhotosMap[userData.profilePhotoId] || null
                : null;

            const headlineText = userData.headlineId
                ? headlinesMap[userData.headlineId] || null
                : null;

            return transformApiPostToFeedPost(post, userData, profileImageUrl, headlineText);
        });
    }, []);

    const fetchAllUsersPosts = useCallback(async (pageNum: number = 1, append: boolean = false) => {
        try {
            if (append) {
                setIsLoadingMore(true);
            } else {
                setIsLoadingAllPosts(true);
            }

            const response = await ProfileService.getAllPostsForHomeFeed(pageNum, 20, false);
            const posts = response.data.posts || [];
            const pagination = response.data.pagination;

            const transformedPosts = await transformPosts(posts);

            setAllPosts((prev) => (append ? [...prev, ...transformedPosts] : transformedPosts));
            setHasMore(pagination?.hasNextPage ?? false);
            setPage(pageNum);
        } catch (error: any) {
            console.error('❌ [HOOK] Failed to fetch home feed posts:', error);
            if (!append) setAllPosts([]);
        } finally {
            setIsLoadingAllPosts(false);
            setIsLoadingMore(false);
        }
    }, [transformPosts]);

    const loadMorePosts = useCallback(() => {
        if (!isLoadingMore && !isLoadingAllPosts && hasMore) {
            fetchAllUsersPosts(page + 1, true);
        }
    }, [page, hasMore, isLoadingMore, isLoadingAllPosts, fetchAllUsersPosts]);

    const prependPost = useCallback(async (rawPost: any) => {
        if (!rawPost) return;

        try {
            const [transformed] = await transformPosts([rawPost]);
            if (!transformed) return;

            setAllPosts((prev) => {
                const getKey = (item: any) => {
                    if (item?.feedItemType === 'repost') {
                        return item.repostId;
                    }
                    return item?.entryId || item?.postId;
                };

                const key = getKey(transformed);
                const alreadyExists = prev.some((p: any) => getKey(p) === key);
                if (alreadyExists) return prev;

                return [transformed, ...prev];
            });
        } catch (error) {
            console.warn('⚠️ Failed to prepend real-time post:', error);
        }
    }, [transformPosts]);


    // ✅ FIX: caption update hone par local feed state sync karne ke liye
    // naya function — pehle ye missing tha isliye home feed stale reh jaata tha
    const updatePostInFeed = useCallback((postId: string, newContent: string) => {
        console.log('🔍 Trying to update:', postId);

        setAllPosts((prev) =>

            prev.map((item: any) => {
                console.log('🔍 Available IDs:', prev.map((p: any) => p.entryId || p.postId));

                // normal post
                if ((item.entryId || item.postId) === postId) {
                    console.log('✅ MATCH FOUND');

                    return { ...item, content: newContent, text: newContent };
                }
                // ✅ FIX: repost ka apna caption/thoughtText update (missing case tha)
                // jab user repost pe khud ka thought/caption edit karta hai,
                // us update ka id `repostId` hota hai, na ki entryId/postId
                if (item.feedItemType === 'repost' && item.repostId === postId) {
                    return { ...item, thoughtText: newContent };
                }
                // agar ye kisi repost ke andar wala original post hai
                if (item.feedItemType === 'repost' && item.originalPost?.entryId === postId) {
                    return {
                        ...item,
                        originalPost: { ...item.originalPost, content: newContent },
                    };
                }
                return item;
            })
        );
    }, []);


    useEffect(() => {
        return onPostContentUpdated(updatePostInFeed);
    }, [updatePostInFeed]);
    return {
        allPosts,
        setAllPosts,
        isLoadingAllPosts,
        isLoadingMore,
        hasMore,
        fetchAllUsersPosts,
        loadMorePosts,
        prependPost,
        updatePostInFeed,

    };
};