// src/store/features/profile/thunks/profileThunks.ts

import { createAsyncThunk } from '@reduxjs/toolkit';
import AuthService from '@/lib/api/auth.service';
import ProfileService from '@/lib/api/profile.service';
import RepostService from '@/lib/api/repost.service';

/**
 * 👤 Fetch User Profile
 */
export const fetchUserProfile = createAsyncThunk(
    'profile/fetchUserProfile',
    async (_, { rejectWithValue }) => {
        try {
            // console.log('👤 [THUNK] Fetching user profile...');
            const response = await AuthService.getUserProfile();
            return response.data;
        } catch (error: any) {
            console.error('❌ [THUNK] Profile fetch failed:', error);
            return rejectWithValue(error.message || 'Failed to fetch profile');
        }
    }
);

/**
 * 📸 Upload Cover Photo
 */
export const uploadCoverPhoto = createAsyncThunk(
    'profile/uploadCoverPhoto',
    async (file: File, { rejectWithValue }) => {
        try {
            // console.log('📸 [THUNK] Uploading cover photo...');
            const response = await ProfileService.uploadCoverPhoto(file, true);
            return response.data.cover.cloudinarySecureUrl;
        } catch (error: any) {
            console.error('❌ [THUNK] Cover upload failed:', error);
            return rejectWithValue(error.message || 'Failed to upload cover');
        }
    }
);

/**
 * 🔄 Update Cover Photo
 */
export const updateCoverPhoto = createAsyncThunk(
    'profile/updateCoverPhoto',
    async ({ coverId, file }: { coverId: string; file: File }, { rejectWithValue }) => {
        try {
            // console.log('🔄 [THUNK] Updating cover photo...');
            const response = await ProfileService.updateCoverPhoto(coverId, file);
            return response.data.cover.cloudinarySecureUrl;
        } catch (error: any) {
            console.error('❌ [THUNK] Cover update failed:', error);
            return rejectWithValue(error.message || 'Failed to update cover');
        }
    }
);

/**
 * 📝 Fetch User Posts
 */
export const fetchUserPosts = createAsyncThunk(
    'profile/fetchUserPosts',
    async (_, { rejectWithValue }) => {
        try {
            // console.log('📝 [THUNK] Fetching user posts...');
            const response = await ProfileService.getAllUserPosts();
            return response.data.posts;
        } catch (error: any) {
            console.error('❌ [THUNK] Posts fetch failed:', error);
            return rejectWithValue(error.message || 'Failed to fetch posts');
        }
    }
);

/**
 * 🔁 Fetch My Reposts
 */
export const fetchMyReposts = createAsyncThunk(
    'profile/fetchMyReposts',
    async (_, { rejectWithValue }) => {
        try {
            const response = await RepostService.getMyReposts();
            return response.data.reposts;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch reposts');
        }
    }
);
    
/**
 * 📸 Fetch Profile Photo URL
 */
export const fetchProfilePhotoUrl = createAsyncThunk(
    'profile/fetchProfilePhotoUrl',
    async (photoId: string, { rejectWithValue }) => {
        try {
            // console.log('📸 [THUNK] Fetching profile photo URL...');
            const response = await ProfileService.getProfilePhotoById(photoId);
            return response?.data?.photo?.cloudinarySecureUrl || '';
        } catch (error: any) {
            console.error('❌ [THUNK] Profile photo fetch failed:', error);
            return rejectWithValue(error.message || 'Failed to fetch photo');
        }
    }
);

export const fetchCoverPhotoUrl = createAsyncThunk(
    'profile/fetchCoverPhotoUrl',
    async (coverId: string, { rejectWithValue }) => {
        try {
            // console.log('🖼️ [THUNK] Fetching cover photo URL...');
            const response = await ProfileService.getCoverPhotoById(coverId);
            // // console.log('📸 [THUNK] Cover photo response:', response?.data?.cover?.cloudinarySecureUrl);
            return response?.data?.cover?.cloudinarySecureUrl || '';
        } catch (error: any) {
            console.error('❌ [THUNK] Cover photo fetch failed:', error);
            return rejectWithValue(error.message || 'Failed to fetch cover');
        }
    }
);

/**
 * 📇 Fetch Contact Info
 */
export const fetchContactInfo = createAsyncThunk(
    'profile/fetchContactInfo',
    async (_, { rejectWithValue }) => {
        try {
            const response = await ProfileService.getContact();
            return response?.data?.contact || null;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch contact info');
        }
    }
);

/**
 * 🔗 Save Website URL
 */
export const saveContactWebsite = createAsyncThunk(
    'profile/saveContactWebsite',
    async (
        { contactId, url, label, type }: { contactId?: string; url: string; label?: string; type?: string },
        { rejectWithValue }
    ) => {
        try {
            const websites = [{
                url,
                type: (type as any) || 'personal',
                label: label || 'Website',
            }];
            const response = contactId
                ? await ProfileService.updateContact(contactId, { websites })
                : await ProfileService.createContact({ websites });
            return response?.data?.contact;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to save website');
        }
    }
);