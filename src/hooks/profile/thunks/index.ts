// src/store/features/profile/thunks/index.ts

import { archiveEducation, createEducation, deleteEducation, fetchAllEducation, updateEducation } from "./educationThunks";
import {
    fetchUserProfile,
    uploadCoverPhoto,
    updateCoverPhoto,
    fetchUserPosts,
    fetchCoverPhotoUrl,
    fetchProfilePhotoUrl,
    fetchMyReposts,
    fetchContactInfo,
    saveContactWebsite,
} from "./profileThunks";

import { createHeadline, updateUserProfile, uploadProfileImage, deleteCoverPhoto } from "./profileUpdateThunks";

export {
    fetchUserProfile,
    fetchProfilePhotoUrl,
    fetchCoverPhotoUrl,
    uploadCoverPhoto,
    updateCoverPhoto,
    fetchUserPosts,
    fetchMyReposts,
    fetchContactInfo,
    saveContactWebsite,

    updateUserProfile,
    createHeadline,
    uploadProfileImage,
    deleteCoverPhoto,

    fetchAllEducation,
    createEducation,
    updateEducation,
    deleteEducation,
    archiveEducation,
};