// src/profile/hooks/useProfileData.ts
import { useState, useCallback } from 'react';
import { profileApi } from '@/lib/api/data/profile.api';
import { UserProfileData } from '@/types/profile.types';

export const useProfileData = () => {
    const [userProfileData, setUserProfileData] = useState<UserProfileData | null>(null);
    const [profileImageUrl, setProfileImageUrl] = useState('');
    const [bannerUrl, setBannerUrl] = useState('');
    const [coverPhotoId, setCoverPhotoId] = useState<string>('');
    const [aboutId, setAboutId] = useState<string>('');
    const [headlineId, setHeadlineId] = useState<string>('');
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [profileError, setProfileError] = useState<string | null>(null);

    // ✅ CHANGED: ab userId zaroori hai — AuthService.getUserProfile() (jo
    // sirf account-level fields deta hai: email/role/status, koi
    // firstName/lastName/profilePhotoId nahi) ki jagah
    // AuthService.getUserProfileById(userId) use karte hain, jo poora
    // profile deta hai. Isi wajah se navbar hamesha "User" dikha raha tha.
    const fetchUserProfile = useCallback(async (userId: string) => {
        if (!userId) return;
        try {
            setIsLoadingProfile(true);
            setProfileError(null);

            const data = await profileApi.fetchUserProfile(userId);

            setUserProfileData(data);

            if (data?.profilePhotoId) {
                try {
                    const photoUrl = await profileApi.fetchProfilePhoto(data.profilePhotoId);
                    if (photoUrl) {
                        setProfileImageUrl(photoUrl);
                    }
                } catch (error) {
                    console.warn('⚠️ [HOOK] Failed to load profile photo');
                }
            }

            if (data?.coverPhotoId) {
                try {
                    const coverUrl = await profileApi.fetchCoverPhoto(data.coverPhotoId);
                    setCoverPhotoId(data.coverPhotoId);

                    if (coverUrl) {
                        setBannerUrl(coverUrl);
                    }
                } catch (error) {
                    console.warn('⚠️ [HOOK] Failed to load cover photo');
                }
            }

            if (data?.headlineId) {
                setHeadlineId(data.headlineId);
            }

            if (data?.aboutId) {
                setAboutId(data.aboutId);
            }

        } catch (error: any) {
            console.error('❌ [HOOK] Failed to fetch profile:', error);
            setProfileError(error.message || 'Failed to load profile data');
        } finally {
            setIsLoadingProfile(false);
        }
    }, []);

    return {
        userProfileData,
        profileImageUrl,
        bannerUrl,
        coverPhotoId,
        aboutId,
        headlineId,
        isLoadingProfile,
        profileError,
        fetchUserProfile,
        setProfileImageUrl,
        setBannerUrl,
    };
};