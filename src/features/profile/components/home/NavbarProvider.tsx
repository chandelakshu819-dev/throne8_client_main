'use client';
//src/features/profile/components/home/NavbarProvider.tsx

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useProfileData } from '@/features/profile/hooks/useProfileData';
import { useHeadlineData } from '@/features/profile/hooks/useHeadlineData';
import { transformToProfileData } from '@/shared/utils/profileTransformers';
import { formatUserDisplayName } from '@/shared/utils/format';
import ProfileNavbar from './ProfileNavbar';
import MentorService from '@/lib/api/mentorship.service';
import SeniorMentorApplicationService from '@/lib/api/seniorMentorApplication.service';


// Jin routes pe navbar NAHI dikhana (login/signup/onboarding etc.)
const HIDDEN_PREFIXES = ['/login', '/signup', '/forgot-my-password', '/auth', '/onboarding'];

const NavbarDataContext = createContext<any>(null);

// Home/Network/etc. pages ab isse profile data lenge, apna fetch nahi karenge
export const useNavbarData = () => {
    const ctx = useContext(NavbarDataContext);
    if (!ctx) throw new Error('useNavbarData must be used within NavbarProvider');
    return ctx;
};


// Dashboard photo badalne par navbar avatar turant update karne ke liye.
// Provider ke bahar safe hai (no-op), isliye throw nahi karta.
export const useNavbarProfileImage = () => {
    const ctx = useContext(NavbarDataContext);
    return (ctx?.setProfileImageOverride ?? (() => {})) as (url: string | null) => void;
};

// Har workspace ki apni alag photo hoti hai (route se pata chalta hai kaunsa workspace active hai)
const MENTOR_ROUTE_PREFIX = '/mentorship/mentorProfile';          // Mentor        -> Mentor.profilePic
const SENIOR_ROUTE_PREFIX = '/mentorship/senior-mentor-profile';  // Senior Mentor -> SeniorMentorApplication.profilePhoto

type PhotoSlot = 'account' | 'mentor' | 'senior';

const getPhotoSlot = (pathname?: string | null): PhotoSlot => {
    if (pathname?.startsWith(MENTOR_ROUTE_PREFIX)) return 'mentor';
    if (pathname?.startsWith(SENIOR_ROUTE_PREFIX)) return 'senior';
    return 'account'; // Mentee dashboard + baaki saare pages
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

    // Teeno roles ki alag-alag photo. 'account' = Mentee photo (dashboard se lagayi hui)
    const [roleImages, setRoleImages] = useState<Record<PhotoSlot, string | null>>({
        account: null,
        mentor: null,
        senior: null,
    });

    const photoSlot = getPhotoSlot(pathname);
    const photoSlotRef = useRef<PhotoSlot>(photoSlot);
    photoSlotRef.current = photoSlot;

    // Dashboards (upload/remove par) setNavbarProfileImage(url) call karte hain.
    // Ye usi workspace ki photo set karega jo abhi active hai (route se).
    const setProfileImageOverride = useCallback((url: string | null) => {
        const slot = photoSlotRef.current;
        setRoleImages((prev) => ({ ...prev, [slot]: url }));
    }, []);

    const currentUserId = user?.userId || user?.id || user?._id;

       // Mentor + Senior dono ki photo hamesha laao (mentee workspace me fallback ke liye bhi chahiye)
       useEffect(() => {
        if (!currentUserId) return;
        let cancelled = false;

        MentorService.getMentorByUserId(currentUserId, true)
            .then((res: any) => {
                if (!cancelled) setRoleImages((p) => ({ ...p, mentor: res?.data?.profilePic || null }));
            })
            .catch(() => { /* user industry mentor nahi hai */ });

        SeniorMentorApplicationService.getMyApplication()
            .then((app) => {
                if (!cancelled) setRoleImages((p) => ({ ...p, senior: app?.profilePhoto || null }));
            })
            .catch(() => { /* user senior mentor nahi hai */ });

        return () => { cancelled = true; };
    }, [photoSlot, currentUserId]);


    const baseProfileData = transformToProfileData(userProfileData, profileImageUrl, headlineData);
    // Mentee/account photo (dashboard se upload hui ho toh wahi, warna server wali)
    const accountImage = roleImages.account || baseProfileData.profileImage;
    // Mentee photo: upload ki hui ho to wahi; warna senior photo, phir mentor photo
    const menteeImage = accountImage || roleImages.senior || roleImages.mentor || '';
    // Mentor/Senior workspace: apni photo -> mentee photo -> doosre role ki photo
    const activeImage =
        photoSlot === 'account'
            ? menteeImage
            : photoSlot === 'mentor'
                ? (roleImages.mentor || accountImage || roleImages.senior || '')
                : (roleImages.senior || accountImage || roleImages.mentor || '');
    const profileData = { ...baseProfileData, profileImage: activeImage };
    const fullName = formatUserDisplayName(userProfileData, user);

    const hideNavbar = HIDDEN_PREFIXES.some((p) => pathname?.startsWith(p));

    return (
        <NavbarDataContext.Provider
        value={{ userProfileData, profileData, headlineData, fullName, fetchUserProfile, setProfileImageOverride, roleImages, photoSlot, menteeImage }}
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