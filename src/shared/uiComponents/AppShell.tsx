'use client';
import { useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useProfileData } from '@/features/profile/hooks/useProfileData';
import { useHeadlineData } from '@/features/profile/hooks/useHeadlineData';
import { transformToProfileData } from '@/shared/utils/profileTransformers';
import ProfileNavbar from '@/features/profile/components/home/ProfileNavbar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { userProfileData, profileImageUrl, headlineId, fetchUserProfile } = useProfileData();
  const { headlineData } = useHeadlineData(headlineId);

  useEffect(() => {
    if (user) fetchUserProfile();
  }, [user, fetchUserProfile]);

  const profileData = transformToProfileData(userProfileData, profileImageUrl, headlineData);

  return (
    <>
      <ProfileNavbar
        profileImage={profileData.profileImage}
        userName={profileData.userName}
        currentUserId={user?.userId}
      />
      {/* pt-16 taaki content fixed navbar ke peeche na chhupe (navbar height = h-16) */}
      <div className="pt-16">{children}</div>
    </>
  );
}