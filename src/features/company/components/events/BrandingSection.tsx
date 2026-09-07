'use client';

import React, { useRef, useState } from 'react';

interface Props {
  companyInitials?: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  isUploadingLogo?: boolean;
  isUploadingBanner?: boolean;
  onLogoChange?: (file: File) => void;
  onBannerChange?: (file: File) => void;
  onLogoRemove?: () => void;
  onBannerRemove?: () => void;
}

export function BrandingSection({
  companyInitials = 'TH',
  logoUrl,
  bannerUrl,
  isUploadingLogo = false,
  isUploadingBanner = false,
  onLogoChange,
  onBannerChange,
}: Props) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [localLogoError, setLocalLogoError] = useState<string | null>(null);
  const [localBannerError, setLocalBannerError] = useState<string | null>(null);

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';
    setLocalLogoError(null);

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setLocalLogoError('Only PNG, JPG or WebP images are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setLocalLogoError('Logo image size must be under 5MB');
      return;
    }

    onLogoChange?.(file);
  };

  const handleBannerFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';
    setLocalBannerError(null);

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setLocalBannerError('Only PNG, JPG or WebP images are allowed');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setLocalBannerError('Cover image size must be under 8MB');
      return;
    }

    onBannerChange?.(file);
  };

  return (
    <section id="branding" className="bg-white border border-[#e8dfd5] rounded-xl p-4 sm:p-5 shadow-sm scroll-mt-24">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-[#d97706]">
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </span>
        <h2 className="text-sm sm:text-base font-bold text-[#3d2b1f]">Branding & Visuals</h2>
      </div>
      <p className="text-[11px] sm:text-xs text-[#4a3728]/60 mb-4">
        Upload logo and cover images to stand out on Throne8
      </p>

      {/* Grid: Logo on Left (compact), Banner on Right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
        {/* Company Logo Section (4 columns) */}
        <div className="md:col-span-4 flex flex-col items-center sm:items-start text-center sm:text-left bg-[#fcf9f6] border border-[#e8dfd5]/70 rounded-xl p-3.5 sm:p-4">
          <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-[#3d2b1f] border border-[#e0d8cf] shadow-sm mb-2 group flex items-center justify-center flex-shrink-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Company Logo"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[#f6ede8] text-xl font-bold tracking-wider">
                {companyInitials}
              </span>
            )}

            {isUploadingLogo && (
              <div className="absolute inset-0 bg-[#3d2b1f]/80 flex flex-col items-center justify-center text-white">
                <svg className="w-5 h-5 animate-spin text-white mb-0.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span className="text-[9px] font-medium">Uploading...</span>
              </div>
            )}
          </div>

          <h3 className="text-xs font-bold text-[#3d2b1f] leading-tight">Company Logo</h3>
          <p className="text-[10px] text-[#4a3728]/60 mb-2.5">Square PNG/JPG, min 400×400</p>

          <input
            ref={logoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleLogoFile}
          />

          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            disabled={isUploadingLogo}
            className="inline-flex items-center gap-1.5 h-[34px] px-3.5 rounded-lg text-xs font-semibold bg-white border border-[#d6c9bd] text-[#3d2b1f] hover:bg-[#f6ede8] transition-colors shadow-xs disabled:opacity-50 mt-auto"
          >
            <svg className="w-3.5 h-3.5 text-[#3d2b1f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {isUploadingLogo ? 'Uploading...' : logoUrl ? 'Replace Logo' : 'Upload Logo'}
          </button>

          {localLogoError && (
            <p className="text-[10px] text-red-600 mt-1.5 font-medium">{localLogoError}</p>
          )}
        </div>

        {/* Cover Banner Section (8 columns) */}
        <div className="md:col-span-8 flex flex-col justify-between bg-[#fcf9f6] border border-[#e8dfd5]/70 rounded-xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold text-[#3d2b1f]">Cover Banner</h3>
              <p className="text-[10px] text-[#4a3728]/60">Recommended ratio 4:1 (1200×300px)</p>
            </div>

            <input
              ref={bannerInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleBannerFile}
            />

            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              disabled={isUploadingBanner}
              className="inline-flex items-center gap-1.5 h-[32px] px-3 rounded-lg text-xs font-semibold bg-white border border-[#d6c9bd] text-[#3d2b1f] hover:bg-[#f6ede8] transition-colors shadow-xs disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5 text-[#3d2b1f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {isUploadingBanner ? 'Uploading...' : bannerUrl ? 'Change Banner' : 'Upload Banner'}
            </button>
          </div>

          {/* Banner Preview Box - 4:1 aspect ratio, compact height ~90-100px */}
          <div className="relative w-full h-24 sm:h-28 rounded-lg overflow-hidden border border-[#e0d8cf] bg-[#e8dfd5] flex items-center justify-center">
            {bannerUrl ? (
              <img
                src={bannerUrl}
                alt="Company Banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-[#4a3728]/40 p-2 text-center">
                <svg className="w-6 h-6 mb-0.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-[11px] font-medium">No cover image uploaded</span>
              </div>
            )}

            {isUploadingBanner && (
              <div className="absolute inset-0 bg-[#3d2b1f]/80 flex flex-col items-center justify-center text-white">
                <svg className="w-5 h-5 animate-spin text-white mb-1" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span className="text-[10px] font-medium">Uploading cover...</span>
              </div>
            )}
          </div>

          {localBannerError && (
            <p className="text-[10px] text-red-600 mt-1.5 font-medium">{localBannerError}</p>
          )}
        </div>
      </div>
    </section>
  );
}