// src/store/features/profile/thunks/profileUpdateThunks.ts

import { createAsyncThunk } from '@reduxjs/toolkit';
import AuthService from '@/lib/api/auth.service';
import ProfileService from '@/lib/api/profile.service';

/**
 * 📝 Update User Profile (First Name, Last Name, Location)
 */
export const updateUserProfile = createAsyncThunk(
    'profile/updateUserProfile',
    async (updates: {
        firstName?: string;
        lastName?: string;
        location?: string;
    }, { rejectWithValue }) => {
        try {
            // console.log('📝 [THUNK] Updating user profile...');
            const response = await AuthService.updateUserProfile(updates);
            return response.data;
        } catch (error: any) {
            console.error('❌ [THUNK] Profile update failed:', error);
            return rejectWithValue(error.message || 'Failed to update profile');
        }
    }
);

/**
 * 📰 Create Headline
 */
export const createHeadline = createAsyncThunk(
    'profile/createHeadline',
    async (title: string, { rejectWithValue }) => {
        try {
            // console.log('📰 [THUNK] Creating headline...');
            const response = await ProfileService.createHeadline({ title });
            return response.data.headline;
        } catch (error: any) {
            console.error('❌ [THUNK] Headline creation failed:', error);
            return rejectWithValue(error.message || 'Failed to create headline');
        }
    }
);

/**
 * 🗑️ Delete Cover Photo (Remove Cover)
 */
export const deleteCoverPhoto = createAsyncThunk(
    'profile/deleteCoverPhoto',
    async (coverId: string, { rejectWithValue }) => {
        try {
            await ProfileService.deleteCoverPhoto(coverId);
            return '';
        } catch (error: any) {
            console.error('❌ [THUNK] Cover delete failed:', error);
            return rejectWithValue(error.message || 'Failed to delete cover photo');
        }
    }
);

/**
 * 📸 Upload Profile Image
 */
export const uploadProfileImage = createAsyncThunk(
    'profile/uploadProfileImage',
    async (file: File, { rejectWithValue }) => {
        try {
            // console.log('📸 [THUNK] Uploading profile image...');
            const response = await ProfileService.uploadProfilePhoto(file, true);
            return response.data.photo.cloudinarySecureUrl;
        } catch (error: any) {
            console.error('❌ [THUNK] Profile image upload failed:', error);
            return rejectWithValue(error.message || 'Failed to upload image');
        }
    }
);