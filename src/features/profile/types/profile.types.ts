// src/store/features/profile/profile.types.ts

export interface UserProfileData {
    companyId: string | null;
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    location: string;
    currentPosition?: string;
    education?: string;
    contactInfo?: string;
    profilePhotoId?: string;
    coverPhotoId?: string;
    headlineId?: string;
    aboutId?: string;
    experienceIds?: string[];
    educationIds?: string[];
    
}
export interface ProfileData {
    companyId?: string; 
}

export interface ProfileState {
    // User Data
    userProfileData: UserProfileData | null;
    profileImageUrl: string;
    bannerUrl: string;
    coverPhotoId: string;
    aboutId: string;
    headlineId: string;

    // Loading States
    isLoadingProfile: boolean;
    isLoadingPosts: boolean;
    isLoadingAbout: boolean;
    isLoadingHeadline: boolean;
    isUploadingVideo: boolean;

    // Errors
    profileError: string | null;

    // Posts
    userReposts: any[];
    isLoadingReposts: boolean;
    companyId: string | null;
    contactData: any | null;

    // About
    aboutData: any | null;
    videoUrl: string;

    // Headline
    headlineData: any | null;
}