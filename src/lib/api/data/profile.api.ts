// src/profile/api/profile.api.ts
import AuthService from '@/lib/api/auth.service';
import ProfileService from '../profile.service';

export const profileApi = {
    // Fetch complete user profile with photos
    async fetchUserProfile() {
        const response = await AuthService.getUserProfile();
        // console.log('📊 [API] Fetched user profile::::=>>>>>', response.data);
        return response.data;
    },  

    // Fetch profile photo
    async fetchProfilePhoto(photoId: string) {
        const response = await ProfileService.getProfilePhotoById(photoId);
        return response?.data?.photo?.cloudinarySecureUrl || null;
    },

    // Fetch cover photo
    async fetchCoverPhoto(coverId: string) {
        const response = await ProfileService.getCoverPhotoById(coverId);
        return response?.data?.cover?.cloudinarySecureUrl || null;
    },

    // Fetch about data
    async fetchAbout(aboutId: string) {
        const response = await ProfileService.getAboutById(aboutId);
        return response?.data?.about || null;
    },

    // Fetch headline data
    async fetchHeadline(headlineId: string) {
        const response = await ProfileService.getHeadlineById(headlineId);
        return response?.data?.title || null;
    },

    // Upload cover story video
    async uploadCoverStoryVideo(aboutId: string, file: File) {
        return await ProfileService.uploadCoverStoryVideo(aboutId, file);
    },

    // Delete cover story video
    async deleteCoverStoryVideo(aboutId: string) {
        return await ProfileService.deleteCoverStoryVideo(aboutId);
    }
};