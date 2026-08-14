// src/hooks/home/useAllUsersPosts.ts

import { useState, useCallback } from 'react';
import { transformApiPostToFeedPost } from '@/shared/utils/postTransformers';
import ProfileService from '@/lib/api/profile.service';
import AuthService from '@/lib/api/auth.service';

export const useAllUsersPosts = () => {
    const [allPosts, setAllPosts] = useState<any[]>([]);
    const [isLoadingAllPosts, setIsLoadingAllPosts] = useState(true);

    const fetchAllUsersPosts = useCallback(async () => {
        try {
            setIsLoadingAllPosts(true);

            const response = await ProfileService.getAllPostsForHomeFeed(1, 20, false);
            const posts = response.data.posts;

            const uniqueUserIds = [...new Set(posts.map((post: any) => String(post.userId)))] as string[];

            let usersData: Record<string, any> = {};
            if (uniqueUserIds.length > 0) {
                try {
                    const usersResponse = await AuthService.getUsersBulk(uniqueUserIds);
                    const users = usersResponse.data?.users || [];
                    usersData = users.reduce((acc: Record<string, any>, user: any) => {
                        acc[user.userId] = user;
                        return acc;
                    }, {});
                } catch (error) {
                    console.warn('⚠️ Failed to fetch bulk users:', error);
                }
            }

            const profilePhotoIds = Object.values(usersData)
                .map((user: any) => user.profilePhotoId)
                .filter(Boolean);

            let profilePhotosMap: Record<string, string> = {};
            if (profilePhotoIds.length > 0) {
                try {
                    const photosResponse = await ProfileService.getMultipleProfilePhotosByIds(profilePhotoIds);
                    const photos = photosResponse.data.photos;
                    profilePhotosMap = photos.reduce((acc: Record<string, string>, photo: any) => {
                        acc[photo.photoId] = photo.cloudinarySecureUrl;
                        return acc;
                    }, {});
                } catch (error) {
                    console.warn('⚠️ Failed to fetch profile photos:', error);
                }
            }

            const headlineIds = Object.values(usersData)
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

            const transformedPosts = posts.map((post: any) => {
                const userData = usersData[post.userId];
                if (!userData) {
                    console.warn(`⚠️ No user data for post ${post.postId}`);
                    return null;
                }

                const profileImageUrl = userData.profilePhotoId
                    ? profilePhotosMap[userData.profilePhotoId] || null
                    : null;

                const headlineText = userData.headlineId
                    ? headlinesMap[userData.headlineId] || null
                    : null;

                return transformApiPostToFeedPost(post, userData, profileImageUrl, headlineText);
            }).filter((p: null) => p !== null);

            setAllPosts(transformedPosts);

        } catch (error: any) {
            console.error('❌ [HOOK] Failed to fetch home feed posts:', error);
            setAllPosts([]);
        } finally {
            setIsLoadingAllPosts(false);
        }
    }, []);

    return {
        allPosts,
        isLoadingAllPosts,
        fetchAllUsersPosts,
    };
};