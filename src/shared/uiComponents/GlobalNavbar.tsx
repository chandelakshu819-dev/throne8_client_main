'use client';
import React from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useProfileData } from '@/features/profile/hooks/useProfileData';
import { useHeadlineData } from '@/features/profile/hooks/useHeadlineData';
import { transformToProfileData } from '@/shared/utils/profileTransformers';
import ProfileNavbar from '@/features/profile/components/home/ProfileNavbar';

// Ye self-contained navbar hai — khud data fetch karta hai,
// isliye kisi bhi layout.tsx mein bina props ke <GlobalNavbar /> daal do
export default function GlobalNavbar() {
    const { user, isLoading } = useAuth();
    const { userProfileData, profileImageUrl, headlineId, fetchUserProfile } = useProfileData();
    const { headlineData } = useHeadlineData(headlineId);

    React.useEffect(() => {
        if (user) {
            fetchUserProfile();
        }
    }, [user, fetchUserProfile]);

    if (isLoading || !user) return null;

    const profileData = transformToProfileData(userProfileData, profileImageUrl, headlineData);
    const fullName = userProfileData
        ? `${userProfileData.firstName} ${userProfileData.lastName}`.trim()
        : userName_fallback(user);

    return (
        <ProfileNavbar
            profileImage={profileData.profileImage}
            userName={fullName}
            currentUserId={user?.userId}
        />
    );
}

function userName_fallback(user: any) {
    return user?.email?.split('@')[0] || 'User';
}