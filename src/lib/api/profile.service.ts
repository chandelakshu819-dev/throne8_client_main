import axios from "axios";
import api from "./api.intance";
import { ApiError } from "./auth.service";
import TokenStorage from "../store/token.storage";
import config from "@/config/env.config";

class ProfileService {
    
    /**
     * 📸 Upload Cover Photo
    */
    static async uploadCoverPhoto(file: File, setAsActive: boolean = true): Promise<any> {
        try {
            console.log('📸 [UPLOAD_COVER_PHOTO] Uploading cover photo...', {
                fileName: file.name,
                fileSize: file.size,
                setAsActive,
            });

            // Create FormData
            const formData = new FormData();
            formData.append('cover', file);
            formData.append('setAsActive', setAsActive.toString());

            const { data } = await api.post(`${config?.NEXT_PUBLIC_COVER_PHOTO_ENDPOINT || process.env.NEXT_PUBLIC_COVER_PHOTO_ENDPOINT}/upload-cover`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('✅ [UPLOAD_COVER_PHOTO] Cover uploaded successfully', {
                coverId: data.data?.cover?.coverId,
                coverUrl: data.data?.cover?.cloudinarySecureUrl,
            });

            return data;

        } catch (error: any) {
            console.error('❌ [UPLOAD_COVER_PHOTO] Upload failed', error);

            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.code === 'ERR_NETWORK') {
                    throw new Error('Unable to connect to server. Please check your internet connection.');
                }

                if (error.response?.status === 400) {
                    throw new Error(apiError?.message || 'Invalid image file or dimensions');
                }

                if (error.response?.status === 401) {
                    throw new Error('Session expired. Please login again.');
                }

                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
            }

            throw new Error('Failed to upload cover photo. Please try again.');
        }
    }

    /**
     * 📸 Get Cover Photo by ID
     */
    static async getCoverPhotoById(coverId: string): Promise<any> {
        try {
            console.log('📸 [GET_COVER_PHOTO] Fetching cover by ID...', { coverId });

            const { data } = await api.get(`${config?.NEXT_PUBLIC_COVER_PHOTO_ENDPOINT || process.env.NEXT_PUBLIC_COVER_PHOTO_ENDPOINT}/get-cover/${coverId}`);

            console.log('✅ [GET_COVER_PHOTO] Cover fetched successfully', {
                coverId: data.data?.cover?.coverId,
                coverUrl: data.data?.cover?.cloudinarySecureUrl,
            });

            return data;

        } catch (error: any) {
            console.error('❌ [GET_COVER_PHOTO] Failed to fetch cover', error);

            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.response?.status === 404) {
                    throw new Error('Cover photo not found');
                }

                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
            }

            throw new Error('Failed to fetch cover photo. Please try again.');
        }
    }

    /**
    * 🔄 Update Cover Photo (Replace existing)
    */
    static async updateCoverPhoto(coverId: string, file: File): Promise<any> {
        try {
            console.log('🔄 [UPDATE_COVER_PHOTO] Updating cover photo...', {
                coverId,
                fileName: file.name,
                fileSize: file.size,
            });

            // Create FormData
            const formData = new FormData();
            formData.append('cover', file);

            const { data } = await api.put(`${config?.NEXT_PUBLIC_COVER_PHOTO_ENDPOINT || process.env.NEXT_PUBLIC_COVER_PHOTO_ENDPOINT}/update-cover/${coverId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('✅ [UPDATE_COVER_PHOTO] Cover updated successfully', {
                coverId: data.data?.cover?.coverId,
                coverUrl: data.data?.cover?.cloudinarySecureUrl,
            });

            return data;

        } catch (error: any) {
            console.error('❌ [UPDATE_COVER_PHOTO] Update failed', error);

            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.code === 'ERR_NETWORK') {
                    throw new Error('Unable to connect to server. Please check your internet connection.');
                }

                if (error.response?.status === 400) {
                    throw new Error(apiError?.message || 'Invalid image file or dimensions');
                }

                if (error.response?.status === 404) {
                    throw new Error('Cover photo not found');
                }

                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
            }

            throw new Error('Failed to update cover photo. Please try again.');
        }
    }

    /**
     * 🗑️ Delete Cover Photo
    */
    static async deleteCoverPhoto(coverId: string): Promise<any> {
        try {
            console.log('🗑️ [DELETE_COVER_PHOTO] Deleting cover photo...', { coverId });

            const { data } = await api.delete(`${config?.NEXT_PUBLIC_COVER_PHOTO_ENDPOINT || process.env.NEXT_PUBLIC_COVER_PHOTO_ENDPOINT}/delete-cover/${coverId}`);

            console.log('✅ [DELETE_COVER_PHOTO] Cover deleted successfully', {
                coverId: data.data?.coverId,
            });

            return data;

        } catch (error: any) {
            console.error('❌ [DELETE_COVER_PHOTO] Delete failed', error);

            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.response?.status === 404) {
                    throw new Error('Cover photo not found');
                }

                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
            }

            throw new Error('Failed to delete cover photo. Please try again.');
        }
    }

    /**
     * 📦 Archive Cover Photo
    */
    static async archiveCoverPhoto(coverId: string): Promise<any> {
        try {
            console.log('📦 [ARCHIVE_COVER_PHOTO] Archiving cover photo...', { coverId });

            const { data } = await api.post(`${config?.NEXT_PUBLIC_COVER_PHOTO_ENDPOINT || process.env.NEXT_PUBLIC_COVER_PHOTO_ENDPOINT}/archive-cover/${coverId}`);

            console.log('✅ [ARCHIVE_COVER_PHOTO] Cover archived successfully', {
                coverId: data.data?.coverId,
            });

            return data;

        } catch (error: any) {
            console.error('❌ [ARCHIVE_COVER_PHOTO] Archive failed', error);

            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.response?.status === 404) {
                    throw new Error('Cover photo not found');
                }

                if (error.response?.status === 400 && apiError?.message?.includes('already archived')) {
                    throw new Error('Cover photo is already archived');
                }

                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
            }

            throw new Error('Failed to archive cover photo. Please try again.');
        }
    }

    /**
     * 🔄 Set Active Cover Photo
    */
    static async setActiveCoverPhoto(coverId: string): Promise<any> {
        try {
            console.log('🔄 [SET_ACTIVE_COVER] Setting cover as active...', { coverId });

            const { data } = await api.put(`${config?.NEXT_PUBLIC_COVER_PHOTO_ENDPOINT || process.env.NEXT_PUBLIC_COVER_PHOTO_ENDPOINT}/set-active-cover/${coverId}/set-active`);

            console.log('✅ [SET_ACTIVE_COVER] Cover set as active', {
                coverId: data.data?.cover?.coverId,
            });

            return data;

        } catch (error: any) {
            console.error('❌ [SET_ACTIVE_COVER] Failed', error);

            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.response?.status === 404) {
                    throw new Error('Cover photo not found');
                }

                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
            }

            throw new Error('Failed to set cover as active. Please try again.');
        }
    }

    /**
    * 📸 Upload Profile Photo
    */
    static async uploadProfilePhoto(file: File, setAsActive: boolean = true): Promise<any> {
        try {
            console.log('📸 [UPLOAD_PROFILE_PHOTO] Uploading profile photo...', {
                fileName: file.name,
                fileSize: file.size,
                setAsActive,
            });

            // Create FormData
            const formData = new FormData();
            formData.append('photo', file);
            formData.append('setAsActive', setAsActive.toString());

            const { data } = await api.post(`${config?.NEXT_PUBLIC_PROFILE_PHOTO_ENDPOINT || process.env.NEXT_PUBLIC_PROFILE_PHOTO_ENDPOINT}/upload-photo`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('✅ [UPLOAD_PROFILE_PHOTO] Photo uploaded successfully', {
                photoId: data.data?.photo?.photoId,
                photoUrl: data.data?.photo?.cloudinarySecureUrl,
            });

            return data;

        } catch (error: any) {
            console.error('❌ [UPLOAD_PROFILE_PHOTO] Upload failed', error);

            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.code === 'ERR_NETWORK') {
                    throw new Error('Unable to connect to server. Please check your internet connection.');
                }

                if (error.response?.status === 400) {
                    throw new Error(apiError?.message || 'Invalid image file or dimensions');
                }

                if (error.response?.status === 401) {
                    throw new Error('Session expired. Please login again.');
                }

                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
            }

            throw new Error('Failed to upload profile photo. Please try again.');
        }
    }

    /**
    * 📸 Get Profile Photo by ID
    */
    static async getProfilePhotoById(photoId: string): Promise<any> {
        try {
            // console.log('📸 [GET_PROFILE_PHOTO] Fetching photo by ID...', { photoId });

            const { data } = await api.get(`${config?.NEXT_PUBLIC_PROFILE_PHOTO_ENDPOINT || process.env.NEXT_PUBLIC_PROFILE_PHOTO_ENDPOINT}/get-photo/${photoId}`);

            // console.log('✅ [GET_PROFILE_PHOTO] Photo fetched successfully', {
            //     photoId: data.data?.photo?.photoId,
            //     photoUrl: data.data?.photo?.cloudinarySecureUrl,
            // });

            return data;

        } catch (error: any) {
            console.error('❌ [GET_PROFILE_PHOTO] Failed to fetch photo', error);

            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.response?.status === 404) {
                    throw new Error('Photo not found');
                }

                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
            }

            throw new Error('Failed to fetch profile photo. Please try again.');
        }
    }

    /**
     * 📸 Get Multiple Profile Photos by IDs Array
    */
    static async getMultipleProfilePhotosByIds(photoIds: string[]): Promise<any> {
        try {
            console.log('📸 [GET_MULTIPLE_PHOTOS] Fetching multiple photos...', {
                count: photoIds.length
            });

            const { data } = await api.post(`${config?.NEXT_PUBLIC_PROFILE_PHOTO_ENDPOINT || process.env.NEXT_PUBLIC_PROFILE_PHOTO_ENDPOINT}/get-multiple-photos`, {
                photoIds
            });

            console.log('✅ [GET_MULTIPLE_PHOTOS] Photos fetched successfully', data, {
                found: data.data?.photos,
                total: data.data?.total,
            });

            return data;

        } catch (error: any) {
            console.error('❌ [GET_MULTIPLE_PHOTOS] Failed to fetch photos', error);

            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.response?.status === 400) {
                    throw new Error(apiError?.message || 'Invalid photo IDs');
                }

                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
            }

            throw new Error('Failed to fetch profile photos. Please try again.');
        }
    }

    /**
     * 📰 CREATE HEADLINE
     */
    static async createHeadline(headlineData: {
        title: string;
    }): Promise<any> {
        try {
            console.log('📰 [CREATE_HEADLINE] Creating headline...', {
                titleLength: headlineData.title.length,
            });

            const { data } = await api.post(`${config?.NEXT_PUBLIC_HEADLINE_ENDPOINT || process.env.NEXT_PUBLIC_HEADLINE_ENDPOINT}/create-headline`, headlineData);

            console.log('✅ [CREATE_HEADLINE] Headline created successfully', {
                headlineId: data.data?.headline?.headlineId,
            });

            return data;

        } catch (error: any) {
            console.error('❌ [CREATE_HEADLINE] Failed to create headline', error);

            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.code === 'ERR_NETWORK') {
                    throw new Error('Unable to connect to server. Please check your internet connection.');
                }

                if (error.response?.status === 400) {
                    const errors = apiError?.errors?.map(e => e.message).join(', ');
                    throw new Error(errors || apiError?.message || 'Validation failed');
                }

                if (error.response?.status === 401) {
                    throw new Error('Session expired. Please login again.');
                }

                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
            }

            throw new Error('Failed to create headline. Please try again.');
        }
    }

    /**
     * 📖 GET HEADLINE BY ID
     */
    static async getHeadlineById(headlineId: string): Promise<any> {
        try {
            console.log('📖 [GET_HEADLINE] Fetching headline by ID...', { headlineId });

            const { data } = await api.get(`${config?.NEXT_PUBLIC_HEADLINE_ENDPOINT || process.env.NEXT_PUBLIC_HEADLINE_ENDPOINT}/get-headline-by-id/${headlineId}`);

            console.log('✅ [GET_HEADLINE] Headline fetched successfully', data.data);
            return data;

        } catch (error: any) {
            // console.error('❌ [GET_HEADLINE] Failed to fetch headline', error);

            // if (axios.isAxiosError(error)) {
            //     const apiError = error.response?.data as ApiError;

            //     if (error.response?.status === 404) {
            //         throw new Error('Headline not found');
            //     }

            //     if (apiError?.message) {
            //         throw new Error(apiError.message);
            //     }
            // }

            // throw new Error('Failed to fetch headline. Please try again.');
            return null;
        }
    }
    /**
     * 📖 GET MULTIPLE HEADLINES BY IDs (bulk)
     */
    static async getMultipleHeadlinesByIds(headlineIds: string[]): Promise<any> {
        try {
            console.log('📖 [GET_MULTIPLE_HEADLINES] Fetching multiple headlines...', { count: headlineIds.length });

            const { data } = await api.post(
                `${config?.NEXT_PUBLIC_HEADLINE_ENDPOINT || process.env.NEXT_PUBLIC_HEADLINE_ENDPOINT}/get-multiple-headlines`,
                { headlineIds }
            );

            console.log('✅ [GET_MULTIPLE_HEADLINES] Headlines fetched successfully', data.data);
            return data;

        } catch (error: any) {
            console.error('❌ [GET_MULTIPLE_HEADLINES] Failed to fetch headlines', error);
            return { data: { headlines: [] } };
        }
    }

    /**
    * 📝 CREATE ABOUT
    */
    static async createAbout(aboutData: {
        aboutText: string;
        textFormatting?: string;
    }): Promise<any> {
        try {
            console.log('📝 [CREATE_ABOUT] Creating about section...', {
                textLength: aboutData.aboutText.length,
            });

            const { data } = await api.post(`${config?.NEXT_PUBLIC_ABOUT_ENDPOINT || process.env.NEXT_PUBLIC_ABOUT_ENDPOINT}/create-about`, aboutData);

            console.log('✅ [CREATE_ABOUT] About created successfully', {
                aboutId: data.data?.about?.aboutId,
            });

            return data;

        } catch (error: any) {
            console.error('❌ [CREATE_ABOUT] Failed to create about', error);

            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.code === 'ERR_NETWORK') {
                    throw new Error('Unable to connect to server. Please check your internet connection.');
                }

                if (error.response?.status === 400) {
                    const errors = apiError?.errors?.map(e => e.message).join(', ');
                    throw new Error(errors || apiError?.message || 'Validation failed');
                }

                if (error.response?.status === 409) {
                    throw new Error('About already exists. Use update instead.');
                }

                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
            }

            throw new Error('Failed to create about. Please try again.');
        }
    }

    /**
     * 📖 GET ABOUT BY ID
     */
    static async getAboutById(aboutId: string): Promise<any> {
        try {
            console.log('📖 [GET_ABOUT] Fetching about by ID...', { aboutId });

            const { data } = await api.get(`${config?.NEXT_PUBLIC_ABOUT_ENDPOINT || process.env.NEXT_PUBLIC_ABOUT_ENDPOINT}/get-about/${aboutId}`);

            console.log('✅ [GET_ABOUT] About fetched successfully');
            return data;

        } catch (error: any) {
            console.error('❌ [GET_ABOUT] Failed to fetch about', error);

            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.response?.status === 404) {
                    throw new Error('About not found');
                }

                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
            }

            throw new Error('Failed to fetch about. Please try again.');
        }
    }

    /**
    * 🔄 UPDATE ABOUT
    */
    static async updateAbout(aboutId: string, updates: {
        aboutText?: string;
        isExpanded?: boolean;
        textFormatting?: string;
    }): Promise<any> {
        try {
            console.log('🔄 [UPDATE_ABOUT] Updating about...', {
                aboutId,
                updates: Object.keys(updates),
            });

            const { data } = await api.put(`${config?.NEXT_PUBLIC_ABOUT_ENDPOINT || process.env.NEXT_PUBLIC_ABOUT_ENDPOINT}/update-about/${aboutId}`, updates);

            console.log('✅ [UPDATE_ABOUT] About updated successfully', {
                aboutId: data.data?.about?.aboutId,
            });

            return data;

        } catch (error: any) {
            console.error('❌ [UPDATE_ABOUT] Failed to update about', error);

            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.code === 'ERR_NETWORK') {
                    throw new Error('Unable to connect to server. Please check your internet connection.');
                }

                if (error.response?.status === 400) {
                    const errors = apiError?.errors?.map(e => e.message).join(', ');
                    throw new Error(errors || apiError?.message || 'Validation failed');
                }

                if (error.response?.status === 404) {
                    throw new Error('About not found.');
                }

                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
            }

            throw new Error('Failed to update about. Please try again.');
        }
    }

    /**
    * 📹 Upload Cover Story Video
    */
    static async uploadCoverStoryVideo(aboutId: string, videoFile: File): Promise<any> {
        try {
            console.log('📹 [UPLOAD_VIDEO] Uploading cover story video...', {
                aboutId,
                fileName: videoFile.name,
                fileSize: videoFile.size,
            });

            const formData = new FormData();
            formData.append('video', videoFile);

            const { data } = await api.post(
                `${config?.NEXT_PUBLIC_ABOUT_ENDPOINT || process.env.NEXT_PUBLIC_ABOUT_ENDPOINT}/upload-video/${aboutId}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            console.log('✅ [UPLOAD_VIDEO] Video uploaded successfully', {
                videoUrl: data.data?.coverStory?.videoUrl,
            });

            return data;

        } catch (error: any) {
            console.error('❌ [UPLOAD_VIDEO] Upload failed', error);

            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.response?.status === 400) {
                    throw new Error(apiError?.message || 'Invalid video file');
                }

                if (error.response?.status === 404) {
                    throw new Error('About section not found');
                }

                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
            }

            throw new Error('Failed to upload video. Please try again.');
        }
    }

    /**
    * 🗑️ Delete Cover Story Video
    */
    static async deleteCoverStoryVideo(aboutId: string): Promise<any> {
        try {
            console.log('🗑️ [DELETE_VIDEO] Deleting cover story video...', { aboutId });

            const { data } = await api.delete(
                `${config?.NEXT_PUBLIC_ABOUT_ENDPOINT || process.env.NEXT_PUBLIC_ABOUT_ENDPOINT}/delete-video/${aboutId}`
            );

            console.log('✅ [DELETE_VIDEO] Video deleted successfully', data);
            return data;

        } catch (error: any) {
            console.error('❌ [DELETE_VIDEO] Delete failed', error);

            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.response?.status === 404) {
                    throw new Error('About section or video not found');
                }

                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
            }

            throw new Error('Failed to delete video. Please try again.');
        }
    }

    /**
    * 🎓 Create Education
    */
    static async createEducation(educationData: {
        schoolCollegeName: string;
        degree: string;
        degreeType: string;
        specialization?: string;
        startDate: string;
        endDate?: string | null;
        description?: string;
        educationType?: string;
        gradeType?: string;
        gradeValue?: string;
        location?: string;
    }): Promise<any> {
        try {
            // console.log('🎓 [CREATE_EDUCATION] Creating education...', {
            //     degree: educationData.degree,
            //     degreeType: educationData.degreeType,
            // });

            const { data } = await api.post(`${config?.NEXT_PUBLIC_EDUCATION_ENDPOINT || process.env.NEXT_PUBLIC_EDUCATION_ENDPOINT}/create-education`, educationData);

            // console.log('✅ [CREATE_EDUCATION] Education created successfully', {
            //     educationId: data.data?.education?.educationId,
            // });

            return data;

        } catch (error: any) {
            console.error('❌ [CREATE_EDUCATION] Failed to create education', error);

            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.code === 'ERR_NETWORK') {
                    throw new Error('Unable to connect to server. Please check your internet connection.');
                }

                if (error.response?.status === 400) {
                    const errors = apiError?.errors?.map(e => e.message).join(', ');
                    throw new Error(errors || apiError?.message || 'Validation failed');
                }

                if (error.response?.status === 401) {
                    throw new Error('Session expired. Please login again.');
                }

                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
            }

            throw new Error('Failed to create education. Please try again.');
        }
    }

    /**
     * 🎓 Get All Education
    */
    static async getAllEducation(includeArchived: boolean = false): Promise<any> {
        try {
            // console.log('🎓 [GET_ALL_EDUCATION] Fetching education records...');

            const { data } = await api.get(`${config?.NEXT_PUBLIC_EDUCATION_ENDPOINT || process.env.NEXT_PUBLIC_EDUCATION_ENDPOINT}/get-all-education`, {
                params: { includeArchived }
            });

            // console.log('✅ [GET_ALL_EDUCATION] Education records fetched', {
            //     total: data.data?.total,
            // });

            return data;

        } catch (error: any) {
            console.error('❌ [GET_ALL_EDUCATION] Failed to fetch education', error);

            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.response?.status === 401) {
                    throw new Error('Authentication required. Please login again.');
                }

                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
            }

            throw new Error('Failed to fetch education records. Please try again.');
        }
    }
    /**
 * 🎓 Get All Education BY USER ID (Public Profile)
 */
static async getAllEducationByUserId(userId: string, includeArchived: boolean = false): Promise<any> {
    try {
        console.log('🎓 [GET_EDUCATION_BY_USERID] Fetching education for user...', { userId });

        const { data } = await api.get(`${config?.NEXT_PUBLIC_EDUCATION_ENDPOINT || process.env.NEXT_PUBLIC_EDUCATION_ENDPOINT}/get-all-education/${userId}`, {
            params: { includeArchived }
        });

        console.log('✅ [GET_EDUCATION_BY_USERID] Education fetched successfully', data);

        return data;

    } catch (error: any) {
        console.error('❌ [GET_EDUCATION_BY_USERID] Failed to fetch education', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch education records');
    }
}

    /**
 * 🎓 Update Education
 */
    static async updateEducation(educationId: string, updates: {
        schoolCollegeName?: string;
        degree?: string;
        degreeType?: string;
        specialization?: string;
        startDate?: string;
        endDate?: string | null;
        description?: string;
        educationType?: string;
        gradeType?: string;
        gradeValue?: string;
        location?: string;
    }): Promise<any> {
        try {
            console.log('🎓 [UPDATE_EDUCATION] Updating Education...', {
                educationId,
            });

            const { data } = await api.put(`${config?.NEXT_PUBLIC_EDUCATION_ENDPOINT || process.env.NEXT_PUBLIC_EDUCATION_ENDPOINT}/update-education/${educationId}`, updates);

            console.log('✅ [UPDATE_EDUCATION] Education updated successfully', {
                educationId: data.data?.education?.educationId,
            });

            return data;

        } catch (error: any) {
            console.error('❌ [UPDATE_EDUCATION] Failed to update education', error);

            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.response?.status === 400) {
                    const errors = apiError?.errors?.map(e => e.message).join(', ');
                    throw new Error(errors || apiError?.message || 'Validation failed');
                }

                if (error.response?.status === 401) {
                    throw new Error('Session expired. Please login again.');
                }

                if (error.response?.status === 404) {
                    throw new Error('Education not found.');
                }

                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
            }

            throw new Error('Failed to update education. Please try again.');
        }
    }

    /**
 * 🗑️ DELETE EDUCATION
 */
    static async deleteEducation(educationId: string): Promise<any> {
        try {
            console.log('🗑️ [DELETE_EDUCATION] Deleting education...', { educationId });

            const { data } = await api.delete(`${config?.NEXT_PUBLIC_EDUCATION_ENDPOINT || process.env.NEXT_PUBLIC_EDUCATION_ENDPOINT}/delete-education/${educationId}`);

            console.log('✅ [DELETE_EDUCATION] Education deleted successfully', {
                educationId: data.data?.educationId,
            });

            return data;

        } catch (error: any) {
            console.error('❌ [DELETE_EDUCATION] Delete failed', error);

            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.response?.status === 404) {
                    throw new Error('Education not found');
                }

                if (error.response?.status === 401) {
                    throw new Error('Session expired. Please login again.');
                }

                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
            }

            throw new Error('Failed to delete education. Please try again.');
        }
    }

    /**
     * 📦 ARCHIVE EDUCATION
     */
    static async archiveEducation(educationId: string): Promise<any> {
        try {
            console.log('📦 [ARCHIVE_EDUCATION] Archiving education...', { educationId });

            const { data } = await api.post(`${config?.NEXT_PUBLIC_EDUCATION_ENDPOINT || process.env.NEXT_PUBLIC_EDUCATION_ENDPOINT}/archive-education/${educationId}/archive`);

            console.log('✅ [ARCHIVE_EDUCATION] Education archived successfully', {
                educationId: data.data?.educationId,
            });

            return data;

        } catch (error: any) {
            console.error('❌ [ARCHIVE_EDUCATION] Archive failed', error);

            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.response?.status === 404) {
                    throw new Error('Education not found');
                }

                if (error.response?.status === 400 && apiError?.message?.includes('already archived')) {
                    throw new Error('Education is already archived');
                }

                if (error.response?.status === 401) {
                    throw new Error('Session expired. Please login again.');
                }

                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
            }

            throw new Error('Failed to archive education. Please try again.');
        }
    }

    /**
    * 💼 Create Experience
    */
    static async createExperience(experienceData: {
        currentPosition: string;
        companyName: string;
        description: string;
        startDate: string;
        endDate?: string;
        currentlyWorking: boolean;
        keyAchievements?: string[];
    }): Promise<any> {
        try {
            console.log('💼 [CREATE_EXPERIENCE] Creating experience...', {
                position: experienceData.currentPosition,
                company: experienceData.companyName,
            });

            const { data } = await api.post(`${config?.NEXT_PUBLIC_EXPERIENCE_ENDPOINT || process.env.NEXT_PUBLIC_EXPERIENCE_ENDPOINT}/create-experience`, experienceData);

            console.log('✅ [CREATE_EXPERIENCE] Experience created successfully', {
                experienceId: data.data?.experience?.experienceId,
            });

            return data;

        } catch (error: any) {
            console.error('❌ [CREATE_EXPERIENCE] Failed to create experience', error);

            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.code === 'ERR_NETWORK') {
                    throw new Error('Unable to connect to server. Please check your internet connection.');
                }

                if (error.response?.status === 400) {
                    const errors = apiError?.errors?.map(e => e.message).join(', ');
                    throw new Error(errors || apiError?.message || 'Validation failed');
                }

                if (error.response?.status === 401) {
                    throw new Error('Session expired. Please login again.');
                }

                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
            }

            throw new Error('Failed to create experience. Please try again.');
        }
    }

    /**
     * 💼 Get Experience by ID
     */
    static async getExperienceById(experienceId: string): Promise<any> {
        try {
            console.log('💼 [GET_EXPERIENCE] Fetching experience by ID...', { experienceId });

            const { data } = await api.get(`${config?.NEXT_PUBLIC_EXPERIENCE_ENDPOINT || process.env.NEXT_PUBLIC_EXPERIENCE_ENDPOINT}/get-experience/${experienceId}`);

            console.log('✅ [GET_EXPERIENCE] Experience fetched successfully', {
                experienceId: data.data?.experience?.experienceId,
            });

            return data;

        } catch (error: any) {
            console.error('❌ [GET_EXPERIENCE] Failed to fetch experience', error);

            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.response?.status === 401) {
                    throw new Error('Authentication required. Please login again.');
                }

                if (error.response?.status === 404) {
                    throw new Error('Experience not found');
                }

                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
            }

            throw new Error('Failed to fetch experience. Please try again.');
        }
    }

    /**
     * 💼 Get All Experiences
     */
    static async getAllExperiences(): Promise<any> {
        try {
            console.log('💼 [GET_ALL_EXPERIENCES] Fetching all experiences...');

            const { data } = await api.get(`${config?.NEXT_PUBLIC_EXPERIENCE_ENDPOINT || process.env.NEXT_PUBLIC_EXPERIENCE_ENDPOINT}/get-all-experiences`);

            console.log('✅ [GET_ALL_EXPERIENCES] Experiences fetched successfully', data);

            return data;

        } catch (error: any) {
            console.error('❌ [GET_ALL_EXPERIENCES] Failed to fetch experiences', error);
            throw new Error(error.response?.data?.message || 'Failed to fetch experiences');
        }
    }

    /**
 * 💼 Get All Experiences BY USER ID (Public Profile)
 */
static async getAllExperiencesByUserId(userId: string): Promise<any> {
    try {
        console.log('💼 [GET_EXPERIENCES_BY_USERID] Fetching experiences for user...', { userId });

        const { data } = await api.get(`${config?.NEXT_PUBLIC_EXPERIENCE_ENDPOINT || process.env.NEXT_PUBLIC_EXPERIENCE_ENDPOINT}/get-all-experiences/${userId}`);

        console.log('✅ [GET_EXPERIENCES_BY_USERID] Experiences fetched successfully', data);

        return data;

    } catch (error: any) {
        console.error('❌ [GET_EXPERIENCES_BY_USERID] Failed to fetch experiences', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch experiences');
    }
}

    /**
    * 💼 Update Experience
    */
    static async updateExperience(experienceId: string, updates: {
        currentPosition?: string;
        companyName?: string;
        description?: string;
        startDate?: string;
        endDate?: string;
        currentlyWorking?: boolean;
        keyAchievements?: string[];
    }): Promise<any> {
        try {
            console.log('💼 [UPDATE_EXPERIENCE] Updating experience...', {
                experienceId,
                updates: Object.keys(updates),
            });

            const { data } = await api.put(`${config?.NEXT_PUBLIC_EXPERIENCE_ENDPOINT || process.env.NEXT_PUBLIC_EXPERIENCE_ENDPOINT}/update-experience/${experienceId}`, updates);

            console.log('✅ [UPDATE_EXPERIENCE] Experience updated successfully', {
                experienceId: data.data?.experience?.experienceId,
            });

            return data;

        } catch (error: any) {
            console.error('❌ [UPDATE_EXPERIENCE] Failed to update experience', error);

            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.code === 'ERR_NETWORK') {
                    throw new Error('Unable to connect to server. Please check your internet connection.');
                }

                if (error.response?.status === 400) {
                    const errors = apiError?.errors?.map(e => e.message).join(', ');
                    throw new Error(errors || apiError?.message || 'Validation failed');
                }

                if (error.response?.status === 401) {
                    throw new Error('Session expired. Please login again.');
                }

                if (error.response?.status === 404) {
                    throw new Error('Experience not found.');
                }

                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
            }

            throw new Error('Failed to update experience. Please try again.');
        }
    }

    /**
    * 📦 ARCHIVE EXPERIENCE
    */
    static async archiveExperience(experienceId: string): Promise<any> {
        try {
            console.log('📦 [ARCHIVE_EXPERIENCE] Archiving experience...', { experienceId });

            const { data } = await api.post(
                `${config?.NEXT_PUBLIC_EXPERIENCE_ENDPOINT || process.env.NEXT_PUBLIC_EXPERIENCE_ENDPOINT}/${experienceId}/archive`
            );

            console.log('✅ [ARCHIVE_EXPERIENCE] Experience archived successfully', {
                experienceId: data.data?.experienceId,
            });

            return data;
        } catch (error: any) {
            console.error('❌ [ARCHIVE_EXPERIENCE] Archive failed', error);

            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.response?.status === 404) {
                    throw new Error('Experience not found');
                }

                if (error.response?.status === 400 && apiError?.message?.includes('already archived')) {
                    throw new Error('Experience is already archived');
                }

                if (error.response?.status === 401) {
                    throw new Error('Session expired. Please login again.');
                }

                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
            }

            throw new Error('Failed to archive experience. Please try again.');
        }
    }

    /**
     * 🗑️ DELETE EXPERIENCE (Permanent)
     */
    static async deleteExperience(experienceId: string): Promise<any> {
        try {
            console.log('🗑️ [DELETE_EXPERIENCE] Deleting experience...', { experienceId });

            const { data } = await api.delete(
                `${config?.NEXT_PUBLIC_EXPERIENCE_ENDPOINT || process.env.NEXT_PUBLIC_EXPERIENCE_ENDPOINT}/delete-experience/${experienceId}`
            );

            console.log('✅ [DELETE_EXPERIENCE] Experience deleted successfully', {
                experienceId: data.data?.experienceId,
            });

            return data;
        } catch (error: any) {
            console.error('❌ [DELETE_EXPERIENCE] Delete failed', error);

            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.response?.status === 404) {
                    throw new Error('Experience not found');
                }

                if (error.response?.status === 401) {
                    throw new Error('Session expired. Please login again.');
                }

                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
            }

            throw new Error('Failed to delete experience. Please try again.');
        }
    }

    /**
    * 📝 CREATE POST
    */
    static async createPost(postData: {
        title: string;
        content: string;
        images?: File[];
        videos?: File[];
        documents?: File[];
    }): Promise<any> {
        try {
            console.log('📝 [CREATE_POST] Creating new post...');

            const formData = new FormData();
            formData.append('title', postData.title);
            formData.append('content', postData.content);

            // Append files
            if (postData.images) {
                postData.images.forEach(image => formData.append('images', image));
            }
            if (postData.videos) {
                postData.videos.forEach(video => formData.append('videos', video));
            }
            if (postData.documents) {
                postData.documents.forEach(doc => formData.append('documents', doc));
            }

            const { data } = await api.post(`${config?.NEXT_PUBLIC_ACTIVITY_ENDPOINT || process.env.NEXT_PUBLIC_ACTIVITY_ENDPOINT}/create-posts`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('✅ [CREATE_POST] Post created:', data.data.post.postId);
            return data;

        } catch (error: any) {
            console.error('❌ [CREATE_POST] Failed:', error);
            throw new Error(error.response?.data?.message || 'Failed to create post');
        }
    }

    /**
     * 📖 GET POST BY ID
     */
    static async getPostById(postId: string): Promise<any> {
        try {
            console.log('📖 [GET_POST] Fetching post:', postId);

            const { data } = await api.get(`${config?.NEXT_PUBLIC_ACTIVITY_ENDPOINT || process.env.NEXT_PUBLIC_ACTIVITY_ENDPOINT}/get-post/${postId}`);

            console.log('✅ [GET_POST] Post fetched successfully');
            return data;

        } catch (error: any) {
            console.error('❌ [GET_POST] Failed:', error);
            throw new Error(error.response?.data?.message || 'Failed to fetch post');
        }
    }

    /**
     * 📋 GET ALL USER POSTS (authenticated user's own posts)
     */
    static async getAllUserPosts(includeArchived: boolean = false): Promise<any> {
        try {
            console.log('📋 [GET_ALL_POSTS] Fetching all posts...');

            const { data } = await api.get(`${config?.NEXT_PUBLIC_ACTIVITY_ENDPOINT || process.env.NEXT_PUBLIC_ACTIVITY_ENDPOINT}/get-all/posts`, {
                params: { includeArchived }
            });

            // console.log('✅ [GET_ALL_POSTS] Posts fetched:', data.data);
            return data;

        } catch (error: any) {
            console.error('❌ [GET_ALL_POSTS] Failed:', error);
            throw new Error(error.response?.data?.message || 'Failed to fetch posts');
        }
    }

    /**
     * 📋 GET POSTS BY USER ID (viewing someone else's profile)
     * Route: GET {NEXT_PUBLIC_ACTIVITY_ENDPOINT}/posts/user/:userId
     */
    static async getAllUserPostsByUserId(userId: string, includeArchived: boolean = false): Promise<any> {
        try {
            console.log('📋 [GET_POSTS_BY_USERID] Fetching posts for user...', { userId });

            const { data } = await api.get(
                `${config?.NEXT_PUBLIC_ACTIVITY_ENDPOINT || process.env.NEXT_PUBLIC_ACTIVITY_ENDPOINT}/posts/user/${userId}`,
                { params: { includeArchived } }
            );

            console.log('✅ [GET_POSTS_BY_USERID] Posts fetched:', data.data?.total ?? data.data?.posts?.length);
            return data;

        } catch (error: any) {
            console.error('❌ [GET_POSTS_BY_USERID] Failed:', error);
            throw new Error(error.response?.data?.message || 'Failed to fetch user posts');
        }
    }

    // lib/api/auth.service.ts

    // ✅ ADD THIS METHOD after getAllUserPosts method:

   /**
     * 🌐 GET ALL POSTS FOR HOME FEED (paginated)
     */
    static async getAllPostsForHomeFeed(
        page: number = 1,
        limit: number = 20,
        includeArchived: boolean = false
    ): Promise<any> {
        try {
            console.log('🌐 [GET_ALL_POSTS_HOME] Fetching home feed...', { page, limit });

            const baseEndpoint = config?.NEXT_PUBLIC_FEED_ENDPOINT || process.env.NEXT_PUBLIC_FEED_ENDPOINT || '/profile/home-post';
            const endpoint = baseEndpoint.endsWith('/feed') ? baseEndpoint : `${baseEndpoint}/feed`;

            const { data } = await api.get(endpoint, {
                params: { page, limit, includeArchived }
            });

            return data;

        } catch (error: any) {
            console.error('❌ [GET_ALL_POSTS_HOME] Failed:', error);
            throw new Error(error.response?.data?.message || 'Failed to fetch home feed posts');
        }
    }

    /**
     * 🔄 UPDATE POST
    */
    static async updatePost(postId: string, updates: { title?: string; content?: string }): Promise<any> {
        try {
            console.log('🔄 [UPDATE_POST] Updating post:', postId);

            const { data } = await api.put(`${config?.NEXT_PUBLIC_ACTIVITY_ENDPOINT || process.env.NEXT_PUBLIC_ACTIVITY_ENDPOINT}/update-post/${postId}`, updates);

            console.log('✅ [UPDATE_POST] Post updated successfully');
            return data;

        } catch (error: any) {
            console.error('❌ [UPDATE_POST] Failed:', error);
            throw new Error(error.response?.data?.message || 'Failed to update post');
        }
    }

    /**
     * 🗑️ DELETE POST
     */
    static async deletePost(postId: string, permanent: boolean = false): Promise<any> {
        try {
            console.log('🗑️ [DELETE_POST] Deleting post:', postId, { permanent });

            const { data } = await api.delete(`${config?.NEXT_PUBLIC_ACTIVITY_ENDPOINT || process.env.NEXT_PUBLIC_ACTIVITY_ENDPOINT}/delete-post/${postId}`, {
                params: { permanent }
            });

            console.log('✅ [DELETE_POST] Post deleted successfully');
            return data;

        } catch (error: any) {
            console.error('❌ [DELETE_POST] Failed:', error);
            throw new Error(error.response?.data?.message || 'Failed to delete post');
        }
    }

    /**
     * 📦 ARCHIVE POST
     */
    static async archivePost(postId: string): Promise<any> {
        try {
            console.log('📦 [ARCHIVE_POST] Archiving post:', postId);

            const { data } = await api.post(`${config?.NEXT_PUBLIC_ACTIVITY_ENDPOINT || process.env.NEXT_PUBLIC_ACTIVITY_ENDPOINT}/posts/${postId}/archive`);

            console.log('✅ [ARCHIVE_POST] Post archived successfully');
            return data;

        } catch (error: any) {
            console.error('❌ [ARCHIVE_POST] Failed:', error);
            throw new Error(error.response?.data?.message || 'Failed to archive post');
        }
    }

    /**
     * 📌 PIN/UNPIN POST
     */
    static async pinPost(postId: string, isPinned: boolean): Promise<any> {
        try {
            console.log('📌 [PIN_POST] Pin/Unpin post:', postId, { isPinned });

            const { data } = await api.put(`${config?.NEXT_PUBLIC_ACTIVITY_ENDPOINT || process.env.NEXT_PUBLIC_ACTIVITY_ENDPOINT}/posts/${postId}/pin`, { isPinned });

            console.log('✅ [PIN_POST] Post pin status updated');
            return data;

        } catch (error: any) {
            console.error('❌ [PIN_POST] Failed:', error);
            throw new Error(error.response?.data?.message || 'Failed to pin post');
        }
    }

   /**
     * 💾 SAVE/UNSAVE POST
     */
   static async savePost(postId: string, isSaved: boolean): Promise<any> {
    try {
        console.log('💾 [SAVE_POST] Save/Unsave post:', postId, { isSaved });

        const { data } = await api.put(`${config?.NEXT_PUBLIC_ACTIVITY_ENDPOINT || process.env.NEXT_PUBLIC_ACTIVITY_ENDPOINT}/posts/${postId}/save`, { isSaved });

        console.log('✅ [SAVE_POST] Post save status updated');
        return data;

    } catch (error: any) {
        console.error('❌ [SAVE_POST] Failed:', error);
        throw new Error(error.response?.data?.message || 'Failed to save post');
    }
}

/**
 * 📑 GET SAVED POSTS (current logged-in user ke)
 */
static async getSavedPosts(): Promise<any> {
    try {
        console.log('📑 [GET_SAVED_POSTS] Fetching saved posts...');

        const { data } = await api.get(`${config?.NEXT_PUBLIC_ACTIVITY_ENDPOINT || process.env.NEXT_PUBLIC_ACTIVITY_ENDPOINT}/posts/saved`);

        console.log('✅ [GET_SAVED_POSTS] Saved posts fetched:', data.data?.total);
        return data;

    } catch (error: any) {
        console.error('❌ [GET_SAVED_POSTS] Failed:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch saved posts');
    }
}

    /**
 * ❤️ LIKE POST
 */
    static async likePost(postId: string): Promise<any> {
        try {
            console.log('❤️ [LIKE_POST] Liking post:', postId);

            const { data } = await api.post(`${config?.NEXT_PUBLIC_ACTIVITY_ENDPOINT || process.env.NEXT_PUBLIC_ACTIVITY_ENDPOINT}/posts/${postId}/like`);

            console.log('✅ [LIKE_POST] Post liked successfully');
            return data;

        } catch (error: any) {
            console.error('❌ [LIKE_POST] Failed:', error);
            throw new Error(error.response?.data?.message || 'Failed to like post');
        }
    }

    /**
     * 💔 UNLIKE POST
     */
    static async unlikePost(postId: string): Promise<any> {
        try {
            console.log('💔 [UNLIKE_POST] Unliking post:', postId);

            const { data } = await api.delete(`${config?.NEXT_PUBLIC_ACTIVITY_ENDPOINT || process.env.NEXT_PUBLIC_ACTIVITY_ENDPOINT}/posts/${postId}/like`);

            console.log('✅ [UNLIKE_POST] Post unliked successfully');
            return data;

        } catch (error: any) {
            console.error('❌ [UNLIKE_POST] Failed:', error);
            throw new Error(error.response?.data?.message || 'Failed to unlike post');
        }
    }

    /**
     * ✅ REACT TO POST (like/celebrate/support/love/insightful/funny)
     */
    static async reactToPost(postId: string, type: string): Promise<any> {
        try {
            console.log('👍 [REACT_POST] Reacting to post:', postId, { type });

            const { data } = await api.post(
                `${config?.NEXT_PUBLIC_ACTIVITY_ENDPOINT || process.env.NEXT_PUBLIC_ACTIVITY_ENDPOINT}/posts/${postId}/react`,
                { type }
            );

            console.log('✅ [REACT_POST] Reaction added successfully');
            return data;

        } catch (error: any) {
            console.error('❌ [REACT_POST] Failed:', error);
            throw new Error(error.response?.data?.message || 'Failed to react to post');
        }
    }

    /**
     * ✅ REMOVE REACTION FROM POST
     */
    static async removeReaction(postId: string): Promise<any> {
        try {
            console.log('👍 [REMOVE_REACTION] Removing reaction:', postId);

            const { data } = await api.delete(
                `${config?.NEXT_PUBLIC_ACTIVITY_ENDPOINT || process.env.NEXT_PUBLIC_ACTIVITY_ENDPOINT}/posts/${postId}/react`
            );

            console.log('✅ [REMOVE_REACTION] Reaction removed successfully');
            return data;

        } catch (error: any) {
            console.error('❌ [REMOVE_REACTION] Failed:', error);
            throw new Error(error.response?.data?.message || 'Failed to remove reaction');
        }
    }

    /**
     * ✅ GET USER REACTIONS (posts a specific user has reacted to — Reactions tab)
     */
    static async getUserReactions(userId: string): Promise<any> {
        try {
            console.log('👍 [GET_USER_REACTIONS] Fetching reactions for user:', userId);

            const { data } = await api.get(
                `${config?.NEXT_PUBLIC_ACTIVITY_ENDPOINT || process.env.NEXT_PUBLIC_ACTIVITY_ENDPOINT}/reactions/user/${userId}`
            );

            console.log('✅ [GET_USER_REACTIONS] Reactions fetched:', data.data?.total);
            return data;

        } catch (error: any) {
            console.error('❌ [GET_USER_REACTIONS] Failed:', error);
            throw new Error(error.response?.data?.message || 'Failed to fetch reactions');
        }
    }

    /**
 * 💡 CREATE SKILL
 */
    static async createSkill(skillData: {
        skillName: string;
        skillStrength: 'beginner' | 'intermediate' | 'advanced' | 'expert';
        yearsOfExperience: number;
    }): Promise<any> {
        try {
            console.log('💡 [CREATE_SKILL] Creating skill...', {
                skillName: skillData.skillName,
            });

            const { data } = await api.post(`${config?.NEXT_PUBLIC_SKILLS_ENDPOINT || process.env.NEXT_PUBLIC_SKILLS_ENDPOINT}/create-skill`, skillData);

            console.log('✅ [CREATE_SKILL] Skill created successfully', {
                skillId: data.data?.skill?.skillId,
            });

            return data;

        } catch (error: any) {
            console.error('❌ [CREATE_SKILL] Failed to create skill', error);

            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.code === 'ERR_NETWORK') {
                    throw new Error('Unable to connect to server. Please check your internet connection.');
                }

                if (error.response?.status === 400) {
                    const errors = apiError?.errors?.map(e => e.message).join(', ');
                    throw new Error(errors || apiError?.message || 'Validation failed');
                }

                if (error.response?.status === 401) {
                    throw new Error('Session expired. Please login again.');
                }

                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
            }

            throw new Error('Failed to create skill. Please try again.');
        }
    }

    /**
 * 🔄 UPDATE SKILL
 */
    static async updateSkill(skillId: string, updates: {
        skillName?: string;
        skillStrength?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
        yearsOfExperience?: number;
    }): Promise<any> {
        try {
            console.log('🔄 [UPDATE_SKILL] Updating skill...', {
                skillId,
                updates: Object.keys(updates),
            });

            const { data } = await api.put(`${config?.NEXT_PUBLIC_SKILLS_ENDPOINT || process.env.NEXT_PUBLIC_SKILLS_ENDPOINT}/update-skill/${skillId}`, updates);

            console.log('✅ [UPDATE_SKILL] Skill updated successfully', {
                skillId: data.data?.skill?.skillId,
            });

            return data;

        } catch (error: any) {
            console.error('❌ [UPDATE_SKILL] Failed to update skill', error);

            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.code === 'ERR_NETWORK') {
                    throw new Error('Unable to connect to server. Please check your internet connection.');
                }

                if (error.response?.status === 400) {
                    const errors = apiError?.errors?.map(e => e.message).join(', ');
                    throw new Error(errors || apiError?.message || 'Validation failed');
                }

                if (error.response?.status === 401) {
                    throw new Error('Session expired. Please login again.');
                }

                if (error.response?.status === 404) {
                    throw new Error('Skill not found.');
                }

                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
            }

            throw new Error('Failed to update skill. Please try again.');
        }
    }

    /**
 * 📌 PIN SKILL
 */
    static async pinSkill(skillId: string, pinnedOrder: number): Promise<any> {
        try {
            console.log('📌 [PIN_SKILL] Pinning skill...', { skillId, pinnedOrder });

            const { data } = await api.post(
                `${config?.NEXT_PUBLIC_SKILLS_ENDPOINT || process.env.NEXT_PUBLIC_SKILLS_ENDPOINT}/pin-skill/${skillId}/pin`,
                { pinnedOrder }
            );

            console.log('✅ [PIN_SKILL] Skill pinned successfully', {
                skillId: data.data?.skill?.skillId,
            });

            return data;

        } catch (error: any) {
            console.error('❌ [PIN_SKILL] Failed to pin skill', error);

            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.code === 'ERR_NETWORK') {
                    throw new Error('Unable to connect to server. Please check your internet connection.');
                }

                if (error.response?.status === 400) {
                    throw new Error(apiError?.message || 'Cannot pin more than 2 skills');
                }

                if (error.response?.status === 401) {
                    throw new Error('Session expired. Please login again.');
                }

                if (error.response?.status === 404) {
                    throw new Error('Skill not found.');
                }

                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
            }

            throw new Error('Failed to pin skill. Please try again.');
        }
    }

    /**
     * 📌 UNPIN SKILL
     */
    static async unpinSkill(skillId: string): Promise<any> {
        try {
            console.log('📌 [UNPIN_SKILL] Unpinning skill...', { skillId });

            const { data } = await api.post(
                `${config?.NEXT_PUBLIC_SKILLS_ENDPOINT || process.env.NEXT_PUBLIC_SKILLS_ENDPOINT}/unpin-skill/${skillId}/unpin`,
                { pinnedOrder: 1 } // Required by backend
            );

            console.log('✅ [UNPIN_SKILL] Skill unpinned successfully', {
                skillId: data.data?.skill?.skillId,
            });

            return data;

        } catch (error: any) {
            console.error('❌ [UNPIN_SKILL] Failed to unpin skill', error);

            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.code === 'ERR_NETWORK') {
                    throw new Error('Unable to connect to server. Please check your internet connection.');
                }

                if (error.response?.status === 401) {
                    throw new Error('Session expired. Please login again.');
                }

                if (error.response?.status === 404) {
                    throw new Error('Skill not found.');
                }

                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
            }

            throw new Error('Failed to unpin skill. Please try again.');
        }
    }

    /**
 * 📦 ARCHIVE SKILL
 */
    static async archiveSkill(skillId: string): Promise<any> {
        try {
            console.log('📦 [ARCHIVE_SKILL] Archiving skill...', { skillId });

            const { data } = await api.post(
                `${config?.NEXT_PUBLIC_SKILLS_ENDPOINT || process.env.NEXT_PUBLIC_SKILLS_ENDPOINT}/archive-skill/${skillId}/archive`
            );

            console.log('✅ [ARCHIVE_SKILL] Skill archived successfully', {
                skillId: data.data?.skill?.skillId,
            });

            return data;

        } catch (error: any) {
            console.error('❌ [ARCHIVE_SKILL] Failed to archive skill', error);

            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.code === 'ERR_NETWORK') {
                    throw new Error('Unable to connect to server. Please check your internet connection.');
                }

                if (error.response?.status === 400) {
                    throw new Error(apiError?.message || 'Skill is already archived');
                }

                if (error.response?.status === 401) {
                    throw new Error('Session expired. Please login again.');
                }

                if (error.response?.status === 404) {
                    throw new Error('Skill not found.');
                }

                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
            }

            throw new Error('Failed to archive skill. Please try again.');
        }
    }

    /**
     * 🗑️ DELETE SKILL (Permanent)
     */
    static async deleteSkill(skillId: string): Promise<any> {
        try {
            console.log('🗑️ [DELETE_SKILL] Deleting skill permanently...', { skillId });

            const { data } = await api.delete(
                `${config?.NEXT_PUBLIC_SKILLS_ENDPOINT || process.env.NEXT_PUBLIC_SKILLS_ENDPOINT}/delete-skill/${skillId}`
            );

            console.log('✅ [DELETE_SKILL] Skill deleted successfully', {
                skillId: data.data?.skillId,
            });

            return data;

        } catch (error: any) {
            console.error('❌ [DELETE_SKILL] Failed to delete skill', error);

            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.code === 'ERR_NETWORK') {
                    throw new Error('Unable to connect to server. Please check your internet connection.');
                }

                if (error.response?.status === 401) {
                    throw new Error('Session expired. Please login again.');
                }

                if (error.response?.status === 404) {
                    throw new Error('Skill not found.');
                }

                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
            }

            throw new Error('Failed to delete skill. Please try again.');
        }
    }

    /**
     * 📋 GET ALL SKILLS
     */
    static async getAllSkills(includeArchived: boolean = false): Promise<any> {
        try {
            console.log('📋 [GET_ALL_SKILLS] Fetching all skills...');

            const { data } = await api.get(`${config?.NEXT_PUBLIC_SKILLS_ENDPOINT || process.env.NEXT_PUBLIC_SKILLS_ENDPOINT}/get-all-skills`, {
                params: { includeArchived }
            });

            console.log('✅ [GET_ALL_SKILLS] Skills fetched:', data.data);
            return data;

        } catch (error: any) {
            console.error('❌ [GET_ALL_SKILLS] Failed to fetch skills', error);

            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.response?.status === 401) {
                    throw new Error('Authentication required. Please login again.');
                }

                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
            }

            throw new Error('Failed to fetch skills. Please try again.');
        }
    }
    /**
     * Get All Skills BY USER ID (Public Profile)
     */
    static async getSkillsByUserId(userId: string): Promise<any> {
        try {
            const { data } = await api.get(`${config?.NEXT_PUBLIC_SKILLS_ENDPOINT || process.env.NEXT_PUBLIC_SKILLS_ENDPOINT}/get-all-skills/${userId}`);
            return data;
        } catch (error: any) {
            console.error('[GET_SKILLS_BY_USERID] Failed to fetch skills', error);
            throw new Error(error.response?.data?.message || 'Failed to fetch skills');
        }
    }


    // ============================================================
    // auth.service.ts me YE METHODS ADD KARO (unlikePost ke baad)
    // ============================================================

    // ✅ 1. CREATE COMMENT
    static async createComment(postId: string, content: string): Promise<any> {
        try {
            const { data } = await api.post(`${config?.NEXT_PUBLIC_ACTIVITY_ENDPOINT || process.env.NEXT_PUBLIC_ACTIVITY_ENDPOINT}/create-comment/comments`, { postId, content });
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to create comment');
        }
    }

    // ✅ 2. CREATE REPLY
    // Route: POST {NEXT_PUBLIC_ACTIVITY_ENDPOINT}/comments/:commentId/reply
    static async createReply(commentId: string, content: string): Promise<any> {
        try {
            const { data } = await api.post(`${config?.NEXT_PUBLIC_ACTIVITY_ENDPOINT || process.env.NEXT_PUBLIC_ACTIVITY_ENDPOINT}/comments/${commentId}/reply`, { content });
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to create reply');
        }
    }

    // ✅ 3. GET COMMENTS BY POST ID
    // Route: GET {NEXT_PUBLIC_ACTIVITY_ENDPOINT}/posts/:postId/comments
    static async getCommentsByPostId(postId: string): Promise<any> {
        try {
            const { data } = await api.get(`${config?.NEXT_PUBLIC_ACTIVITY_ENDPOINT || process.env.NEXT_PUBLIC_ACTIVITY_ENDPOINT}/posts/${postId}/comments`);
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch comments');
        }
    }
// profile.service.ts me class ke andar, getCommentsByPostId ke baad add karo:

static async getCommentsByUserId(userId: string): Promise<any> {
    try {
        const { data } = await api.get(`${config?.NEXT_PUBLIC_ACTIVITY_ENDPOINT || process.env.NEXT_PUBLIC_ACTIVITY_ENDPOINT}/comments/user/${userId}`);
        return data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to fetch user comments');
    }
}

    // ✅ 4. GET MY COMMENTS
    // Route: GET {NEXT_PUBLIC_ACTIVITY_ENDPOINT}/comments/my-comments
    static async getMyComments(): Promise<any> {
        try {
            const { data } = await api.get(`${config?.NEXT_PUBLIC_ACTIVITY_ENDPOINT || process.env.NEXT_PUBLIC_ACTIVITY_ENDPOINT}/comments/my-comments`);
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch my comments');
        }
    }

    // ✅ 5. GET COMMENT BY ID
    // Route: GET {NEXT_PUBLIC_ACTIVITY_ENDPOINT}/comments/:commentId
    static async getCommentById(commentId: string): Promise<any> {
        try {
            const { data } = await api.get(`${config?.NEXT_PUBLIC_ACTIVITY_ENDPOINT || process.env.NEXT_PUBLIC_ACTIVITY_ENDPOINT}/comments/${commentId}`);
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch comment');
        }
    }

    // ✅ 6. UPDATE COMMENT
    // Route: PUT {NEXT_PUBLIC_ACTIVITY_ENDPOINT}/comments/:commentId
    static async updateComment(commentId: string, content: string): Promise<any> {
        try {
            const { data } = await api.put(`${config?.NEXT_PUBLIC_ACTIVITY_ENDPOINT || process.env.NEXT_PUBLIC_ACTIVITY_ENDPOINT}/comments/${commentId}`, { content });
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update comment');
        }
    }

    // ✅ 7. DELETE COMMENT
    // Route: DELETE {NEXT_PUBLIC_ACTIVITY_ENDPOINT}/comments/:commentId
    static async deleteComment(commentId: string, permanent: boolean = false): Promise<any> {
        try {
            const { data } = await api.delete(`${config?.NEXT_PUBLIC_ACTIVITY_ENDPOINT || process.env.NEXT_PUBLIC_ACTIVITY_ENDPOINT}/comments/${commentId}`, {
                params: { permanent }
            });
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to delete comment');
        }
    }

    // ✅ 8. LIKE COMMENT
    // Route: POST {NEXT_PUBLIC_ACTIVITY_ENDPOINT}/comments/:commentId/like
    static async likeComment(commentId: string): Promise<any> {
        try {
            const { data } = await api.post(`${config?.NEXT_PUBLIC_ACTIVITY_ENDPOINT || process.env.NEXT_PUBLIC_ACTIVITY_ENDPOINT}/comments/${commentId}/like`);
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to like comment');
        }
    }

    // ✅ 9. UNLIKE COMMENT
    // Route: DELETE {NEXT_PUBLIC_ACTIVITY_ENDPOINT}/comments/:commentId/like
    static async unlikeComment(commentId: string): Promise<any> {
        try {
            const { data } = await api.delete(`${config?.NEXT_PUBLIC_ACTIVITY_ENDPOINT || process.env.NEXT_PUBLIC_ACTIVITY_ENDPOINT}/comments/${commentId}/like`);
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to unlike comment');
        }
    }
    // ✅ 10. REPORT COMMENT
    static async reportComment(commentId: string, reason?: string): Promise<any> {
        try {
            const { data } = await api.post(
                `${config?.NEXT_PUBLIC_ACTIVITY_ENDPOINT || process.env.NEXT_PUBLIC_ACTIVITY_ENDPOINT}/comments/${commentId}/report`,
                { reason }
            );
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to report comment');
        }
    }

    // ✅ 11. MUTE THREAD (post-level notifications off, derived from a commentId)
    static async muteThread(commentId: string): Promise<any> {
        try {
            const { data } = await api.post(
                `${config?.NEXT_PUBLIC_ACTIVITY_ENDPOINT || process.env.NEXT_PUBLIC_ACTIVITY_ENDPOINT}/comments/${commentId}/mute-thread`
            );
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to mute thread');
        }
    }
}


export default ProfileService;