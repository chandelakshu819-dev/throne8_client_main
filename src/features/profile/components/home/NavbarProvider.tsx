'use client';
//src/features/profile/components/home/NavbarProvider.tsx

import React, { createContext, useContext, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useProfileData } from '@/features/profile/hooks/useProfileData';
import { useHeadlineData } from '@/features/profile/hooks/useHeadlineData';
import { transformToProfileData } from '@/shared/utils/profileTransformers';
import { formatUserDisplayName } from '@/shared/utils/format';
import ProfileNavbar from './ProfileNavbar';

// Jin routes pe navbar NAHI dikhana (login/signup/onboarding etc.)
const HIDDEN_PREFIXES = ['/login', '/signup', '/forgot-my-password', '/auth', '/onboarding'];

const NavbarDataContext = createContext<any>(null);

// Home/Network/etc. pages ab isse profile data lenge, apna fetch nahi karenge
export const useNavbarData = () => {
    const ctx = useContext(NavbarDataContext);
    if (!ctx) throw new Error('useNavbarData must be used within NavbarProvider');
    return ctx;
};

export default function NavbarProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user } = useAuth();

    const { userProfileData, profileImageUrl, headlineId, fetchUserProfile } = useProfileData();
    const { headlineData, fetchHeadlineData } = useHeadlineData(headlineId);

    useEffect(() => {
        const targetUserId = user?.userId || user?.id || user?._id;
        if (targetUserId) {
            fetchUserProfile(targetUserId);
        }
    }, [user, fetchUserProfile]);

    useEffect(() => {
        if (headlineId) {
            fetchHeadlineData();
        }
    }, [headlineId, fetchHeadlineData]);

    const profileData = transformToProfileData(userProfileData, profileImageUrl, headlineData);
    const fullName = formatUserDisplayName(userProfileData, user);

    const hideNavbar = HIDDEN_PREFIXES.some((p) => pathname?.startsWith(p));

    return (
        <NavbarDataContext.Provider
            value={{ userProfileData, profileData, headlineData, fullName, fetchUserProfile }}
        >
            {!hideNavbar && (
                <ProfileNavbar
                    profileImage={profileData.profileImage}
                    userName={fullName}
                    currentUserId={user?.userId || user?.id}
                />
            )}
            {children}
        </NavbarDataContext.Provider>
    );
}