import { useState, useCallback } from 'react';
import ConnectionService from '@/lib/api/connection.service';
import ProfileService from '@/lib/api/profile.service';

export interface CatchUpItem {
    type: 'job_change' | 'work_anniversary' | 'birthday';
    userId: string;
    firstName: string;
    lastName?: string;
    profilePhotoId?: string | null;
    companyName?: string;
    position?: string;
    years?: number;
    eventDate: string;
    image?: string;
}

const FALLBACK_AVATAR =
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdYRNQDghH1JvFXro2Yz3iWNmmFAubFZ-RGQ&s';

export const useCatchUp = () => {
    const [items, setItems] = useState<CatchUpItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCatchUp = useCallback(async (userId: string) => {
        try {
            setIsLoading(true);

            const response = await ConnectionService.getCatchUpFeed(userId);
            const rawItems: CatchUpItem[] = response.data?.items || [];

            // ✅ Bulk resolve profile photos — same pattern as useNetworkUsers.ts
            const photoIds = rawItems
                .map((item) => item.profilePhotoId)
                .filter(Boolean) as string[];

            let photosMap: Record<string, string> = {};
            if (photoIds.length > 0) {
                try {
                    const photosResponse = await ProfileService.getMultipleProfilePhotosByIds(photoIds);
                    photosMap = photosResponse.data.photos.reduce(
                        (acc: Record<string, string>, photo: any) => {
                            acc[photo.photoId] = photo.cloudinarySecureUrl;
                            return acc;
                        },
                        {}
                    );
                } catch (err) {
                    console.warn('⚠️ Failed to fetch catch-up profile photos:', err);
                }
            }

            const enriched: CatchUpItem[] = rawItems.map((item) => ({
                ...item,
                image: item.profilePhotoId
                    ? photosMap[item.profilePhotoId] || FALLBACK_AVATAR
                    : FALLBACK_AVATAR,
            }));

            setItems(enriched);
        } catch (error) {
            console.warn('⚠️ Failed to fetch catch up feed:', error);
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { items, isLoading, fetchCatchUp };
};