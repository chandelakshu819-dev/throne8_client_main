// src/profile/hooks/useProfileData.ts
import { useState, useCallback } from 'react';
import { profileApi } from '@/lib/api/data/profile.api';
import { UserProfileData } from '@/types/profile.types';

export const useProfileData = () => {
    const [userProfileData, setUserProfileData] = useState<UserProfileData | null>(null);
    const [profileImageUrl, setProfileImageUrl] = useState('');
    const [bannerUrl, setBannerUrl] = useState(
        ''
    );
    const [coverPhotoId, setCoverPhotoId] = useState<string>('');
    const [aboutId, setAboutId] = useState<string>('');
    const [headlineId, setHeadlineId] = useState<string>('');
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [profileError, setProfileError] = useState<string | null>(null);

    const fetchUserProfile = useCallback(async () => {
        try {
            setIsLoadingProfile(true);
            setProfileError(null);

            const data = await profileApi.fetchUserProfile();

            setUserProfileData(data);

            // Fetch profile photo
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

            // Fetch cover photo
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

            // Set IDs
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