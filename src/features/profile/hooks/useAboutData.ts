//throne8-entry-client/src/features/profile/hooks/useAboutData.ts
import { profileApi } from '@/lib/api/data/profile.api';
import { AboutData } from '@/types/profile.types';
import { useState, useCallback } from 'react';

export const useAboutData = (aboutId: string) => {
    const [aboutData, setAboutData] = useState<AboutData | null>(null);
    const [videoUrl, setVideoUrl] = useState<string>('');
    const [isLoadingAbout, setIsLoadingAbout] = useState(true);
    const [isUploadingVideo, setIsUploadingVideo] = useState(false);
    const [isDeletingVideo, setIsDeletingVideo] = useState(false);

    const fetchAboutData = useCallback(async () => {
        if (!aboutId) {
            setIsLoadingAbout(false);
            return;
        }

        try {
            setIsLoadingAbout(true);
            
            const data = await profileApi.fetchAbout(aboutId);

            if (data) {
                setAboutData(data);
                if (data.coverStory?.videoSecureUrl) {
                    setVideoUrl(data.coverStory.videoSecureUrl);
                } else {
                    setVideoUrl('');
                }
            } else {
                setVideoUrl('');
            }
        } catch (error: any) {
            console.error('❌ [HOOK] Failed to fetch about:', error);
            if (!error.message.includes('not found')) {
                console.warn('About section not created yet');
            }
        } finally {
            setIsLoadingAbout(false);
        }
    }, [aboutId]);

    const handleVideoUpload = async (file: File) => {
        if (!aboutId) return;

        try {
            setIsUploadingVideo(true);
            await profileApi.uploadCoverStoryVideo(aboutId, file);
            await fetchAboutData();
        } catch (error: any) {
            console.error('Video upload failed:', error);
            alert(error.message);
        } finally {
            setIsUploadingVideo(false);
        }
    };

    const handleVideoDelete = async () => {
        if (!aboutId) return;

        try {
            setIsDeletingVideo(true);
            await profileApi.deleteCoverStoryVideo(aboutId);
            setVideoUrl('');
            await fetchAboutData();
        } catch (error: any) {
            console.error('Video delete failed:', error);
            // Even if backend deletion endpoint throws, clear local video display for smooth UX
            setVideoUrl('');
        } finally {
            setIsDeletingVideo(false);
        }
    };

    return {
        aboutData,
        videoUrl,
        isLoadingAbout,
        isUploadingVideo,
        isDeletingVideo,
        fetchAboutData,
        handleVideoUpload,
        handleVideoDelete,
    };
};