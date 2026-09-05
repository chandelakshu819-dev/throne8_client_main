// src/features/profile/hooks/useProfile.ts

import { useAppDispatch, useAppSelector } from "@/core/store/store.hooks";
import RepostService from '@/lib/api/repost.service';
import { createHeadline, deleteCoverPhoto, fetchCoverPhotoUrl, fetchProfilePhotoUrl, fetchUserPosts, fetchUserProfile, setBannerUrl, setProfileImageUrl, updateCoverPhoto, updateUserProfile, uploadCoverPhoto, uploadProfileImage } from "@/hooks/profile";

import { fetchMyReposts, fetchContactInfo, saveContactWebsite } from "@/hooks/profile/thunks/profileThunks";

export const useProfile = () => {
    const dispatch = useAppDispatch();

    const {
        userProfileData,
        profileImageUrl,
        bannerUrl,
        coverPhotoId,
        aboutId,
        headlineId,
        isLoadingProfile,
        isLoadingPosts,
        profileError,
        userPosts,
        userReposts,        // ← ADD
        isLoadingReposts,
        contactData,
    } = useAppSelector((state) => state.profile);

    // ✅ Enhanced loadProfile with photo fetching
    const loadProfile = async () => {
        const result = await dispatch(fetchUserProfile()).unwrap();

        // Fetch photos if IDs exist
        if (result.profilePhotoId) {
            dispatch(fetchProfilePhotoUrl(result.profilePhotoId));
        }
        if (result.coverPhotoId) {
            dispatch(fetchCoverPhotoUrl(result.coverPhotoId));
        }
    };

    const loadPosts = () => dispatch(fetchUserPosts());

    const uploadCover = (file: File) => dispatch(uploadCoverPhoto(file));

    const updateCover = (coverId: string, file: File) =>
        dispatch(updateCoverPhoto({ coverId, file }));

    const removeCover = (coverId: string) => dispatch(deleteCoverPhoto(coverId));

    // Profile update actions
    const updateProfile = (updates: {
        firstName?: string;
        lastName?: string;
        location?: string;
        currentPosition?: string;
        company?: string;
        education?: string;
        pronouns?: string;
    }) => dispatch(updateUserProfile(updates));

    const createUserHeadline = (title: string) => dispatch(createHeadline(title));

    const uploadUserProfileImage = (file: File) => dispatch(uploadProfileImage(file));


    const updateProfileImage = (url: string) => dispatch(setProfileImageUrl(url));

    const updateBanner = (url: string) => dispatch(setBannerUrl(url));

    const loadMyReposts = () => dispatch(fetchMyReposts());

    const loadContact = () => dispatch(fetchContactInfo());

    const saveWebsite = (website: { url: string; label?: string; type?: string }) =>
        dispatch(saveContactWebsite({
            contactId: contactData?.contactId,
            url: website.url,
            label: website.label,
            type: website.type,
        }));
    const createRepost = async (entryId: string, type: 'repost' | 'quote' = 'repost', thoughtText?: string) => {
        const result = await RepostService.createRepost(entryId, type, thoughtText);
        // Refresh reposts after creating
        dispatch(fetchMyReposts());
        return result;
    };

    const removeRepost = async (repostId: string) => {
        const result = await RepostService.deleteRepost(repostId);
        dispatch(fetchMyReposts());
        return result;
    };

    const getRepostStatus = async (entryId: string) => {
        return await RepostService.getRepostStatus(entryId);
    };

    return {
        // State
        userProfileData,
        profileImageUrl,
        bannerUrl,
        coverPhotoId,
        aboutId,
        headlineId,
        isLoadingProfile,
        isLoadingPosts,
        profileError,
        userPosts,

        // Actions
        loadProfile,
        loadPosts,
        uploadCover,
        updateCover,
        removeCover,
        updateProfile,
        createUserHeadline,
        uploadUserProfileImage,
        updateProfileImage,
        updateBanner,
        
        userReposts,
        isLoadingReposts,
        loadMyReposts,
        createRepost,
        removeRepost,
        getRepostStatus,
        contactData,
        loadContact,
        saveWebsite,
    };
};