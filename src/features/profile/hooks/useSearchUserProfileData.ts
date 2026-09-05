// src/hooks/data/useSearchUserProfileData.ts
import { useState, useCallback } from 'react';
import AuthService from '@/lib/api/auth.service';
import ProfileService from '@/lib/api/profile.service';
import { profileApi } from '@/lib/api/data/profile.api';
import { UserProfileData } from '@/types/profile.types';

export const useSearchUserProfileData = (userId: string) => {
    const [userProfileData, setUserProfileData] = useState<UserProfileData | null>(null);
    const [profileImageUrl, setProfileImageUrl] = useState('');
    const [bannerUrl, setBannerUrl] = useState('');
    const [coverPhotoId, setCoverPhotoId] = useState<string>('');
    const [aboutId, setAboutId] = useState<string>('');
    const [headlineId, setHeadlineId] = useState<string>('');
    const [websiteUrl, setWebsiteUrl] = useState<string>('');
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [profileError, setProfileError] = useState<string | null>(null);

    const fetchUserProfileById = useCallback(async () => {
        if (!userId) {
            setProfileError('User ID is required');
            setIsLoadingProfile(false);
            return;
        }

        try {
            setIsLoadingProfile(true);
            setProfileError(null);

            // ✅ Naye userId ke liye fetch shuru hote hi purana/stale data clear karo
            setUserProfileData(null);
            setProfileImageUrl('');
            setBannerUrl('');
            setCoverPhotoId('');
            setAboutId('');
            setHeadlineId('');
            setWebsiteUrl('');

            // ✅ getUserProfileById use karo
            const response = await AuthService.getUserProfileById(userId);
            const data = response?.data?.user || response?.data || response?.user || response;

            setUserProfileData(data);

            // Initial website extraction from user profile object & user-scoped local storage
            const localWeb = typeof window !== 'undefined' && userId
                ? localStorage.getItem(`user_website_${userId}`) || ''
                : '';

            let prefWeb = '';
            if (data?.preferences) {
                if (typeof data.preferences === 'string') {
                    try {
                        const parsed = JSON.parse(data.preferences);
                        prefWeb = parsed?.websiteUrl || parsed?.website || '';
                    } catch { }
                } else if (typeof data.preferences === 'object') {
                    prefWeb = data.preferences?.websiteUrl || data.preferences?.website || '';
                }
            }

            const initialWeb =
                data?.websiteUrl ||
                data?.website ||
                prefWeb ||
                data?.contactInfo?.website ||
                data?.contact?.websites?.[0]?.url ||
                data?.websites?.[0]?.url ||
                localWeb ||
                '';
            setWebsiteUrl(initialWeb);

            // Fetch profile photo
            if (data?.profilePhotoId) {
                try {
                    const photoUrl = await profileApi.fetchProfilePhoto(data.profilePhotoId);
                    if (photoUrl) {
                        setProfileImageUrl(photoUrl);
                    }
                } catch (error) {
                    console.warn('⚠️ [SEARCH_USER_HOOK] Failed to load profile photo');
                }
            }

            // Fetch cover photo
            if (data?.coverPhotoId) {
                try {
                    const coverUrl = await profileApi.fetchCoverPhoto(data.coverPhotoId);
                    setCoverPhotoId(data.coverPhotoId);

                    if (coverUrl) {
                        setBannerUrl(coverUrl);
                    }
                } catch (error) {
                    console.warn('⚠️ [SEARCH_USER_HOOK] Failed to load cover photo');
                }
            }

            // Fetch contact info for websiteUrl (public endpoint — kisi bhi user ke liye kaam karta hai)
            try {
                const publicContactRes = await ProfileService.getPublicContactByUserId(userId);
                const fetchedWeb =
                    publicContactRes?.data?.contact?.websites?.[0]?.url ||
                    publicContactRes?.data?.websites?.[0]?.url ||
                    publicContactRes?.websites?.[0]?.url ||
                    publicContactRes?.contact?.websites?.[0]?.url ||
                    '';
                if (fetchedWeb) {
                    setWebsiteUrl(fetchedWeb);
                }
            } catch (error) {
                console.warn('⚠️ [SEARCH_USER_HOOK] Failed to load contact info');
            }
            // Set IDs
            if (data?.headlineId) {
                setHeadlineId(data.headlineId);
            }

            if (data?.aboutId) {
                setAboutId(data.aboutId);
            }

        } catch (error: any) {
            console.error('❌ [SEARCH_USER_HOOK] Failed to fetch profile:', error);
            setProfileError(error.message || 'Failed to load profile data');
        } finally {
            setIsLoadingProfile(false);
        }
    }, [userId]);

    return {
        userProfileData,
        profileImageUrl,
        bannerUrl,
        coverPhotoId,
        aboutId,
        headlineId,
        websiteUrl,
        isLoadingProfile,
        profileError,
        fetchUserProfileById,
        setProfileImageUrl,
        setBannerUrl,
    };
};