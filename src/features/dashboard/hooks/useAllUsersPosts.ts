// src/features/dashboard/hooks/useAllUsersPosts.ts

import { useState, useCallback, useRef } from 'react';
import { transformApiPostToFeedPost } from '@/shared/utils/postTransformers';
import ProfileService from '@/lib/api/profile.service';
import AuthService from '@/lib/api/auth.service';

export const useAllUsersPosts = () => {
    const [allPosts, setAllPosts] = useState<any[]>([]);
    const [isLoadingAllPosts, setIsLoadingAllPosts] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);

    // ✅ Simple in-memory cache so repeated fetches don't re-hit user/photo/headline
    // APIs for the same userIds every time (persists across calls within this hook instance)
    const usersCacheRef = useRef<Record<string, any>>({});
    const photosCacheRef = useRef<Record<string, string>>({});
    const headlinesCacheRef = useRef<Record<string, string>>({});

    const transformPosts = useCallback(async (posts: any[]) => {
        // ✅ Only fetch user data we don't already have cached
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

        // ✅ Fallback user object instead of dropping the post entirely when
        // user data is missing (network hiccup, deleted account, etc.)
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
                       userName: `${originalUserData.firstName || ''} ${originalUserData.lastName || ''}`.trim() || 'Unknown User',
                       fullName: `${originalUserData.firstName || ''} ${originalUserData.lastName || ''}`.trim() || 'Unknown User',
                       // ✅ FIX: backend ab originalPost ke andar hi ye field bhejta hai
                       connectionStatus: post.originalPost.connectionStatus || 'none',
                       connectionDegree: post.originalPost.connectionDegree ?? null,
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

    // ✅ NEW: real-time socket-pushed post/repost ko list ke top mein daalta hai.
    // `transformPosts` hi reuse karta hai (same cache, same shape guarantee) —
    // taaki naya item aur normal-fetch wale items exactly waisi hi shape ke ho,
    // aur PostCard/FeedRepostCard bina extra handling ke render kar sake.
    const prependPost = useCallback(async (rawPost: any) => {
        if (!rawPost) return;

        try {
            const [transformed] = await transformPosts([rawPost]);
            if (!transformed) return;

            setAllPosts((prev) => {
                // ✅ Duplicate-guard — agar ye item kisi wajah se already list mein hai
                // (jaise optimistic-update wale purane `feedReposts` flow se), dobara na daalein
                const key = transformed.feedItemType === 'repost'
                    ? transformed.repostId
                    : (transformed.entryId || transformed.postId);
                const alreadyExists = prev.some((p: any) => {
                    const existingKey = p.feedItemType === 'repost'
                        ? p.repostId
                        : (p.entryId || p.postId);
                    return existingKey === key;
                });
                if (alreadyExists) return prev;

                return [transformed, ...prev];
            });
        } catch (error) {
            console.warn('⚠️ Failed to prepend real-time post:', error);
        }
    }, [transformPosts]);

    return {
        allPosts,
        isLoadingAllPosts,
        isLoadingMore,
        hasMore,
        fetchAllUsersPosts,
        loadMorePosts,
        prependPost, // ✅ NEW
    };
};