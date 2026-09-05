// src/store/features/profile/slices/profileSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ProfileState } from '@/features/profile/types/profile.types';
import {
    fetchUserProfile,
    uploadCoverPhoto,
    updateCoverPhoto,
    fetchUserPosts,
    fetchCoverPhotoUrl,
    fetchProfilePhotoUrl,
    uploadProfileImage,
    createHeadline,
    updateUserProfile,
} from '../thunks';
import { fetchContactInfo, saveContactWebsite } from '../thunks/profileThunks';
import { transformPostsData } from '@/shared/utils/profileTransformers';
import { fetchMyReposts } from '../thunks/profileThunks';

const initialState: ProfileState = {
    userProfileData: null,
    profileImageUrl: '',
    bannerUrl: '',
    coverPhotoId: '',
    aboutId: '',
    headlineId: '',

    isLoadingProfile: false,
    isLoadingPosts: false,
    isLoadingAbout: false,
    isLoadingHeadline: false,
    isUploadingVideo: false,

    profileError: null,
    userPosts: [],
    aboutData: null,
    videoUrl: '',
    headlineData: null,

    userReposts: [],
    isLoadingReposts: false,
    companyId: null,
    contactData: null,
};

const profileSlice = createSlice({
    name: 'profile',
    initialState,
    reducers: {
        // Manual updates
        setProfileImageUrl: (state, action: PayloadAction<string>) => {
            state.profileImageUrl = action.payload;
        },
        setBannerUrl: (state, action: PayloadAction<string>) => {
            state.bannerUrl = action.payload;
        },
        clearProfileError: (state) => {
            state.profileError = null;
        },
        resetProfileState: () => initialState,
    },
    extraReducers: (builder) => {
        // ==================== FETCH USER PROFILE ====================
        builder
            .addCase(fetchUserProfile.pending, (state) => {
                state.isLoadingProfile = true;
                state.profileError = null;
            })
            .addCase(fetchUserProfile.fulfilled, (state, action) => {
                state.isLoadingProfile = false;
                state.userProfileData = action.payload;

                // Extract IDs
                state.coverPhotoId = action.payload.coverPhotoId || '';
                state.aboutId = action.payload.aboutId || '';
                state.headlineId = action.payload.headlineId || '';

                // console.log('✅ [SLICE] Profile loaded');
            })
            .addCase(fetchUserProfile.rejected, (state, action) => {
                state.isLoadingProfile = false;
                state.profileError = action.payload as string;
            });

        // ==================== UPLOAD COVER PHOTO ====================
        builder
            .addCase(uploadCoverPhoto.pending, (state) => {
                state.isLoadingProfile = true;
            })
            .addCase(uploadCoverPhoto.fulfilled, (state, action) => {
                state.isLoadingProfile = false;
                state.bannerUrl = action.payload;
                // console.log('✅ [SLICE] Cover uploaded');
            })
            .addCase(uploadCoverPhoto.rejected, (state, action) => {
                state.isLoadingProfile = false;
                state.profileError = action.payload as string;
            });

        // ==================== UPDATE COVER PHOTO ====================
        builder
            .addCase(updateCoverPhoto.pending, (state) => {
                state.isLoadingProfile = true;
            })
            .addCase(updateCoverPhoto.fulfilled, (state, action) => {
                state.isLoadingProfile = false;
                state.bannerUrl = action.payload;
                // console.log('✅ [SLICE] Cover updated');
            })
            .addCase(updateCoverPhoto.rejected, (state, action) => {
                state.isLoadingProfile = false;
                state.profileError = action.payload as string;
            });

        // ==================== FETCH USER POSTS ====================
        builder
            .addCase(fetchUserPosts.pending, (state) => {
                state.isLoadingPosts = true;
            })
            .addCase(fetchUserPosts.fulfilled, (state, action) => {
                state.isLoadingPosts = false;
                state.userPosts = transformPostsData(action.payload);
            })
            .addCase(fetchUserPosts.rejected, (state) => {
                state.isLoadingPosts = false;
            });

        // ==================== FETCH PROFILE PHOTO ====================
        builder
            .addCase(fetchProfilePhotoUrl.fulfilled, (state, action) => {
                state.profileImageUrl = action.payload;
                // console.log('✅ [SLICE] Profile photo loaded');
            });

        // ==================== FETCH COVER PHOTO ====================
        builder
            .addCase(fetchCoverPhotoUrl.fulfilled, (state, action) => {
                state.bannerUrl = action.payload;
                // console.log('✅ [SLICE] Cover photo loaded');
            });

        // ==================== UPDATE USER PROFILE ====================
        builder
            .addCase(updateUserProfile.pending, (state) => {
                state.isLoadingProfile = true;
            })
            .addCase(updateUserProfile.fulfilled, (state, action) => {
                state.isLoadingProfile = false;
                // Update only changed fields
                if (state.userProfileData) {
                    state.userProfileData = { ...state.userProfileData, ...action.payload };
                }
                // console.log('✅ [SLICE] Profile updated');
            })
            .addCase(updateUserProfile.rejected, (state, action) => {
                state.isLoadingProfile = false;
                state.profileError = action.payload as string;
            });

        // ==================== CREATE HEADLINE ====================
        builder
            .addCase(createHeadline.pending, (state) => {
                state.isLoadingHeadline = true;
            })
            .addCase(createHeadline.fulfilled, (state, action) => {
                state.isLoadingHeadline = false;
                state.headlineId = action.payload.headlineId;
                state.headlineData = action.payload;
                // console.log('✅ [SLICE] Headline created');
            })
            .addCase(createHeadline.rejected, (state, action) => {
                state.isLoadingHeadline = false;
                state.profileError = action.payload as string;
            });

        // ==================== UPLOAD PROFILE IMAGE ====================
        builder
            .addCase(uploadProfileImage.pending, (state) => {
                state.isLoadingProfile = true;
            })
            .addCase(uploadProfileImage.fulfilled, (state, action) => {
                state.isLoadingProfile = false;
                state.profileImageUrl = action.payload;
                // console.log('✅ [SLICE] Profile image uploaded');
            })
            .addCase(uploadProfileImage.rejected, (state, action) => {
                state.isLoadingProfile = false;
                state.profileError = action.payload as string;
            });

             // Existing extraReducers ke andar, end mein add karo:
             builder
             .addCase(fetchMyReposts.pending, (state) => {
                 state.isLoadingReposts = true;
             })
             .addCase(fetchMyReposts.fulfilled, (state, action) => {
                 state.isLoadingReposts = false;
                 state.userReposts = action.payload || [];
             })
             .addCase(fetchMyReposts.rejected, (state) => {
                 state.isLoadingReposts = false;
             });
 
         // ==================== CONTACT INFO (Website URL) ====================
         builder
             .addCase(fetchContactInfo.fulfilled, (state, action) => {
                 state.contactData = action.payload;
             })
             .addCase(saveContactWebsite.fulfilled, (state, action) => {
                 state.contactData = action.payload;
             });
     },
 });

export const {
    setProfileImageUrl,
    setBannerUrl,
    clearProfileError,
    resetProfileState,
} = profileSlice.actions;

export default profileSlice.reducer;