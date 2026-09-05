// app/(dashboard)/components/sidebar/CreatePostPrompt.tsx
'use client';

import { useHeadlineData } from '@/features/profile/hooks/useHeadlineData';
import { useProfileData } from '@/features/profile/hooks/useProfileData';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { transformToProfileData } from '@/shared/utils/profileTransformers';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

interface CreatePostPromptProps {
  isDarkMode: boolean;
  setIsPostCreatorOpen: (open: boolean) => void;
}

const CreatePostPrompt: React.FC<CreatePostPromptProps> = ({ isDarkMode, setIsPostCreatorOpen }) => {
  const { user } = useAuth();
  const router = useRouter();

  const {
    userProfileData,
    profileImageUrl,
    headlineId,
    fetchUserProfile
  } = useProfileData();

  const { headlineData, isLoadingHeadline, fetchHeadlineData } = useHeadlineData(headlineId);

  useEffect(() => {
    if (headlineId) {
      fetchHeadlineData();
    }
  }, [headlineId, fetchHeadlineData]);

  // ✅ FIX: fetchUserProfile ko user.userId pass kiya (pehle bina argument
  // ke call ho raha tha, isliye userProfileData kabhi load nahi hota tha
  // aur transformToProfileData() fallback placeholder name deta tha —
  // isi wajah se avatar mein "US" initials dikh rahe the, "honey gupta"
  // (HG) nahi).
  useEffect(() => {
    if (user?.userId) {
      fetchUserProfile(user.userId);
    }
  }, [user, fetchUserProfile]);

  const profileData = transformToProfileData(
    userProfileData,
    profileImageUrl,
    headlineData
  );

  return (
    <div
      onClick={() => setIsPostCreatorOpen(true)}
      className={`flex items-center gap-4 p-5 rounded-3xl cursor-pointer border transition-all duration-300 mb-4 ${isDarkMode
          ? 'bg-slate-700/40 border-slate-600/40 hover:bg-slate-700/60'
          : 'bg-white/40 border-[#4a3728]/30 hover:bg-white/60'
        }`}
    >
      <img
        src={profileData.profileImage && profileData.profileImage.trim() !== '' ? profileData.profileImage : `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.userName || 'User')}&background=4a3728&color=fff&size=128`}
        className="w-14 h-14 rounded-2xl object-cover border-2 border-[#6b5643] bg-[#4a3728]"
        alt="Profile"
        onError={(e) => {
          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.userName || 'User')}&background=4a3728&color=fff&size=128`;
        }}
      />
      <div className={`text-lg font-semibold ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/70'}`}>
        Create a post...
      </div>
    </div>
  );
};

export default CreatePostPrompt;