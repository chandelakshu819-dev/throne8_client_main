'use client';
//src/features/profile/components/home/NavbarProvider.tsx

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useProfileData } from '@/features/profile/hooks/useProfileData';
import { useHeadlineData } from '@/features/profile/hooks/useHeadlineData';
import { transformToProfileData } from '@/shared/utils/profileTransformers';
import { formatUserDisplayName } from '@/shared/utils/format';
import ProfileNavbar from './ProfileNavbar';
import MentorService from '@/lib/api/mentorship.service';


// Jin routes pe navbar NAHI dikhana (login/signup/onboarding etc.)
const HIDDEN_PREFIXES = ['/login', '/signup', '/forgot-my-password', '/auth', '/onboarding'];

const NavbarDataContext = createContext<any>(null);

// Home/Network/etc. pages ab isse profile data lenge, apna fetch nahi karenge
export const useNavbarData = () => {
    const ctx = useContext(NavbarDataContext);
    if (!ctx) throw new Error('useNavbarData must be used within NavbarProvider');
    return ctx;
};


// Mentor dashboard photo badalne par navbar avatar turant update karne ke liye.
// Provider ke bahar safe hai (no-op), isliye throw nahi karta.
export const useNavbarProfileImage = () => {
    const ctx = useContext(NavbarDataContext);
    return (ctx?.setProfileImageOverride ?? (() => {})) as (url: string | null) => void;
};

// Sirf mentor workspace routes pe navbar mein mentor ki photo dikhegi
const MENTOR_ROUTE_PREFIX = '/mentorship/mentorProfile';

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

       // Mentor profile photo (mentor.profilePic) — account photo se alag hoti hai
       const [profileImageOverride, setProfileImageOverrideState] = useState<string | null>(null);
       const setProfileImageOverride = useCallback((url: string | null) => {
           setProfileImageOverrideState(url);
       }, []);
   
       const isMentorRoute = !!pathname?.startsWith(MENTOR_ROUTE_PREFIX);
       const currentUserId = user?.userId || user?.id || user?._id;
   
       // Reload / direct open par bhi mentor photo navbar mein dikhe
       useEffect(() => {
           if (!isMentorRoute || !currentUserId) {
// override reset nahi karte: nayi photo mentorship se bahar ke pages par bhi dikhni chahiye
               return;
           }
           let cancelled = false;
           MentorService.getMentorByUserId(currentUserId)
               .then((res: any) => {
                   if (!cancelled) setProfileImageOverrideState(res?.data?.profilePic || null);
               })
               .catch(() => { /* account photo fallback */ });
           return () => { cancelled = true; };
       }, [isMentorRoute, currentUserId]);
   
       const baseProfileData = transformToProfileData(userProfileData, profileImageUrl, headlineData);
       const profileData = profileImageOverride
           ? { ...baseProfileData, profileImage: profileImageOverride }
           : baseProfileData;
       const fullName = formatUserDisplayName(userProfileData, user);

    const hideNavbar = HIDDEN_PREFIXES.some((p) => pathname?.startsWith(p));

    return (
        <NavbarDataContext.Provider
        value={{ userProfileData, profileData, headlineData, fullName, fetchUserProfile, setProfileImageOverride }}

        >
            {!hideNavbar && (
                <ProfileNavbar
                    profileImage={profileData.profileImage}
                    userName={fullName}
                    currentUserId={user?.userId || user?.id}
                    userRole={user?.role}
                />
            )}
            {children}
        </NavbarDataContext.Provider>
    );
}