// src/profile/components/ProfileBanner.tsx
'use client';
import React, { useEffect, useState } from 'react';
import CoverPhotoModal from './CoverPhotoModal';

interface ProfileBannerProps {
    bannerImage: string;
    onBannerUpdate?: (newUrl: string) => void;
    onDataRefresh?: () => void;
    coverId?: string;
    isOwnProfile?: boolean;
}

const ProfileBanner: React.FC<ProfileBannerProps> = ({
    bannerImage,
    onBannerUpdate,
    onDataRefresh,
    coverId = '',
    isOwnProfile = true,
}) => {
    const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
    const [currentBannerImage, setCurrentBannerImage] = useState(
        bannerImage && bannerImage.trim() !== '' ? bannerImage : ''
    );

    // ✅ Jab bannerImage prop change ho (naye user ki profile pe navigate hone par),
    // currentBannerImage ko turant sync/reset karo — warna purana banner flash hota hai
    useEffect(() => {
        setCurrentBannerImage(bannerImage && bannerImage.trim() !== '' ? bannerImage : '');
    }, [bannerImage]);

    const hasCustomBanner = currentBannerImage && currentBannerImage.trim() !== '';

    const handleEdit = () => {
        setIsCoverModalOpen(true);
    };

    const handleCoverUpdate = (newImageUrl: string) => {
        setCurrentBannerImage(newImageUrl);

        if (onBannerUpdate) {
            onBannerUpdate(newImageUrl);
        }

        if (onDataRefresh) {
            onDataRefresh();
        }
    };

    return (
        <>
                        <div className="relative h-48 w-full overflow-hidden group bg-[#e8dfd7]">
                {hasCustomBanner ? (
                    <img
                        src={currentBannerImage}
                        alt="Banner"
                        className="w-full h-full object-contain transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                        onError={(e) => {
                            // ✅ Agar upload ki hui image bhi load fail ho jaye,
                            // to hardcoded default pe mat jao — bas hide kar do.
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                ) : (
                    // ✅ Koi banner upload nahi kiya gaya — plain placeholder, koi fixed photo nahi
                    <div className="w-full h-full bg-gradient-to-r from-[#e8dfd7] to-[#d8ccc0]" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-[#4a3728]/40 to-transparent"></div>

                <div className="absolute bottom-36 left-4 rounded-2xl border-2 text-white/80 text-xs font-medium bg-black/20 px-2 py-1 backdrop-blur-sm">
                    ✨ Professional Networker
                </div>

                {/* ✅ FIX: black/emoji edit button hataya, ab ProfileHeader ke edit
                    button jaisa hi clean white pill — SVG pencil icon + "Edit" label,
                    proper contrast + shadow, theme (#4a3728) ke saath match karta hai */}
                {isOwnProfile && (
                    <button
                        onClick={handleEdit}
                        className="absolute top-4 right-4 flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-full bg-white text-[#4a3728] border border-white/50 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                        aria-label="Edit banner"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span className="text-xs font-semibold">Edit</span>
                    </button>
                )}
            </div>

            {isOwnProfile && (
                <CoverPhotoModal
                    isOpen={isCoverModalOpen}
                    onClose={() => setIsCoverModalOpen(false)}
                    onUploadSuccess={handleCoverUpdate}
                    currentImageUrl={currentBannerImage}
                    coverId={coverId}
                />
            )}
        </>
    );
};

export default ProfileBanner;