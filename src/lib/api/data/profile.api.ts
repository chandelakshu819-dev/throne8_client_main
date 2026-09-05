// src/profile/api/profile.api.ts
import AuthService from '@/lib/api/auth.service';
import ProfileService from '../profile.service';

export const profileApi = {
    // ✅ CHANGED: userId lekar getUserProfileById use karo — ye poora
    // profile (firstName, lastName, profilePhotoId, headlineId) deta hai,
    // getUserProfile() sirf account-level data deta tha
    async fetchUserProfile(userId: string) {
        const response = await AuthService.getUserProfileById(userId);
        return response.data;
    },

    async fetchProfilePhoto(photoId: string) {
        const response = await ProfileService.getProfilePhotoById(photoId);
        return response?.data?.photo?.cloudinarySecureUrl || null;
    },

    async fetchCoverPhoto(coverId: string) {
        const response = await ProfileService.getCoverPhotoById(coverId);
        return response?.data?.cover?.cloudinarySecureUrl || null;
    },

    async fetchAbout(aboutId: string) {
        const response = await ProfileService.getAboutById(aboutId);
        return response?.data?.about || null;
    },

    async fetchHeadline(headlineId: string) {
        const response = await ProfileService.getHeadlineById(headlineId);
        return response?.data?.title || null;
    },

    async uploadCoverStoryVideo(aboutId: string, file: File) {
        return await ProfileService.uploadCoverStoryVideo(aboutId, file);
    },

    async deleteCoverStoryVideo(aboutId: string) {
        return await ProfileService.deleteCoverStoryVideo(aboutId);
    }
};