'use client';
//src/features/profile/components/home/NavbarProvider.tsx

import React, { createContext, useContext, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useProfileData } from '@/features/profile/hooks/useProfileData';
import { useHeadlineData } from '@/features/profile/hooks/useHeadlineData';
import { transformToProfileData } from '@/shared/utils/profileTransformers';
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

    // ✅ FIX: fetchUserProfile ab userId maangta hai (useProfileData.ts mein
    // `if (!userId) return;` hai). Pehle isko bina argument ke call kiya ja
    // raha tha, isliye ye turant return ho jaata tha aur userProfileData
    // kabhi set hi nahi hota — navbar mein naam hamesha "Loading..." rehta
    // aur profileData.profileImage bhi empty/undefined rehta.
    // ✅ Field ka sahi naam `user.userId` hai (useAuth.ts se confirm),
    // `user.id` NAHI — wo field exist hi nahi karta.
    useEffect(() => {
        if (user?.userId) {
            fetchUserProfile(user.userId);
        }
    }, [user, fetchUserProfile]);

    useEffect(() => {
        if (headlineId) {
            fetchHeadlineData();
        }
    }, [headlineId, fetchHeadlineData]);

    const profileData = transformToProfileData(userProfileData, profileImageUrl, headlineData);
    const fullName = userProfileData
        ? `${userProfileData.firstName} ${userProfileData.lastName}`.trim()
        : 'Loading...';

    const hideNavbar = HIDDEN_PREFIXES.some((p) => pathname?.startsWith(p));

    return (
        <NavbarDataContext.Provider
            value={{ userProfileData, profileData, headlineData, fullName, fetchUserProfile }}
        >
            {!hideNavbar && (
                <ProfileNavbar
                    profileImage={profileData.profileImage}
                    userName={fullName !== 'Loading...' && fullName ? fullName : (profileData.userName || user?.email?.split('@')[0] || 'User')}
                    currentUserId={user?.userId}
                />
            )}
            {children}
        </NavbarDataContext.Provider>
    );
}