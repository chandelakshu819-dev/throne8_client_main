// src/app/%28dashboard%29/dashboard/components/sidebar/Left/ProfileCard.tsx

'use client';

import { useHeadlineData } from '@/features/profile/hooks/useHeadlineData';
import { useProfileData } from '@/features/profile/hooks/useProfileData';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { transformToProfileData } from '@/shared/utils/profileTransformers';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import StatsCards from '../Right/StatsCards';
import { useProfile } from '@/store/hooks';
import { useConnectionsData } from '@/features/profile/hooks/useConnectionsData';

interface ProfileCardProps {
  currentUserId: string;
  isDarkMode: boolean;
}

const ProfileCard: React.FC<ProfileCardProps> = ({currentUserId, isDarkMode }) => {
  const { user } = useAuth();
  const router = useRouter();
  const {
    bannerUrl,
    coverPhotoId,
    aboutId,
    isLoadingProfile,
    profileError,
    userPosts,
    isLoadingPosts,
    loadProfile,
    loadPosts,
    updateProfileImage,
    updateBanner,
  } = useProfile();



  const {
    userProfileData,
    profileImageUrl,
    headlineId,
    fetchUserProfile
  } = useProfileData();

  const {
          // followingList,
          // followersList,
          totalConnections,
          isLoadingConnections,
          fetchConnectionsData,
      } = useConnectionsData();
  
      useEffect(() => {
          if (currentUserId) {
              fetchConnectionsData(currentUserId);
          }
      }, [currentUserId, fetchConnectionsData]);
      console.log('👥 [profile CARD] Total Connections:', totalConnections);
  

  const { headlineData, isLoadingHeadline, fetchHeadlineData } = useHeadlineData(headlineId);

  useEffect(() => {
    if (headlineId) {
      fetchHeadlineData();
    }
  }, [headlineId, fetchHeadlineData]);

  console.log('👤 [PROFILE_CARD] User Profile Data:', headlineData);

  useEffect(() => {
    if (user) {
      loadProfile();   // ← Redux action
      loadPosts();
      fetchUserProfile();
    }
  }, [user, fetchUserProfile]);

  const profileData = transformToProfileData(
    userProfileData,
    profileImageUrl,
    headlineData
  );

  console.log(
    '📊 userPosts in ProfileCard:',
    profileData,
  );

  const fullName = userProfileData
    ? `${userProfileData.firstName} ${userProfileData.lastName}`.trim()
    : 'Loading...';

  const handleHomePage = () => {
    router.push('/profile');
  };

  return (
    <div className={`p-8 rounded-3xl shadow-2xl backdrop-blur-xl border transition-all duration-500 hover:scale-105 hover:-translate-y-2 ${isDarkMode ? 'bg-slate-800/60 border-slate-700/50' : 'bg-[#f6ede8]/95 border-[#4a3728]/20'} relative overflow-hidden`}>
      <div className="absolute inset-0 bg-gradient-to-br from-[#6b5643]/10 via-[#8b7355]/10 to-[#4a3728]/10"></div>
      <div className="relative z-10 text-center">
        <div className="relative inline-block mb-6">
          <img
            // src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
            src={profileData.profileImage}
            alt="Profile"
            className="w-32 h-32 rounded-3xl object-cover text-black flex justify-center items-center border-4 border-[#6b5643] shadow-2xl"
          />
        </div>
        <h3 className={`text-2xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>
          {fullName}
        </h3>
        <p className="text-lg font-semibold bg-gradient-to-r from-[#6b5643] to-[#8b7355] bg-clip-text text-transparent mb-2">
          {isLoadingHeadline ? '' : profileData.headline}
        </p>
        {/* <p className={`text-sm italic ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/60'} mb-6`}>
          Building tomorrow's digital experiences
        </p> */}

        {/* Stats Grid */}
        <div className="mt-6 grid grid-cols-2 gap-4 mb-6">
          {[
            {
              label: 'Connections',
              value: totalConnections,
              color: 'from-[#6b5643] to-[#8b7355]',
              onClick: () => router.push(`/profile/network/${currentUserId}`),
            },
            {
              label: 'Posts',
              value: userPosts.length,
              color: 'from-[#8b7355] to-[#9d8466]',
              // onClick: () => router.push(`/profile/${currentUserId}?section=activity`),
              onClick: () => router.push('/profile#activity-section', { scroll: false }),
            },
          ].map((stat, idx) => (
            <button
              key={idx}
              type="button"
              onClick={stat.onClick}
              className={`p-4 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-105 text-center cursor-pointer ${isDarkMode ? 'bg-slate-700/30 border-slate-600/30' : 'bg-[#e0d8cf]/50 border-[#4a3728]/20'}`}
            >
              <p className={`text-2xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </p>
              <p className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/70'} uppercase tracking-wider`}>
                {stat.label}
              </p>
            </button>
          ))}
        </div>
        

        <StatsCards
          isDarkMode={isDarkMode}
          currentUserId={currentUserId}

        />

        <button
          onClick={handleHomePage}
          className="w-full bg-gradient-to-r from-[#4a3728] via-[#6b5643] to-[#8b7355] text-white py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
          <span className="relative z-10">View Full Profile</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileCard;
