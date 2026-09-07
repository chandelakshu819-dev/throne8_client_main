'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { BrandingSection } from './BrandingSection';
import { BasicInfoSection } from './BasicInfoSection';
import { SocialLinksSection } from './SocialLinksSection';
import { VerificationSection } from './VerificationSection';
import { LivePreviewCard } from './LivePreviewCard';
import { fetchCompanyById } from '@/features/company/store/slices/companySlice';
import { CompanyFormValues, VerificationStatus } from '../../types';
import { useCompanySave } from '../../hooks/useCompanySave';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useCompanyForm } from '../../hooks/useCompanyForm';
import CompanyService from '@/lib/api/company.service';
import Toast from '@/shared/uiComponents/Toast';

interface Props {
  initialData?: Partial<CompanyFormValues>;
  slug?: string;
  companyId: string;
  verificationStatus?: VerificationStatus;
}

type TabKey = 'all' | 'branding' | 'basic-info' | 'social-links' | 'verification' | 'live-preview';

export function EditCompanyPage({
  initialData,
  slug = 'throne8',
  companyId,
  verificationStatus: defaultVerificationStatus = 'pending',
}: Props) {
  const dispatch = useAppDispatch();
  const meta = useAppSelector((s) => s.company.meta);
  const apiData = useAppSelector((s) => s.company.apiData);

  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Logo & banner upload states and preview URLs
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentVerification, setCurrentVerification] = useState<VerificationStatus>(defaultVerificationStatus);

  const {
    form,
    setField,
    setSocialField,
    errors,
    setErrors,
    isDirty,
    resetForm,
    markPristine,
  } = useCompanyForm(initialData);

  const handleSaveSuccess = useCallback(() => {
    markPristine();
    setToast({ message: '✓ Company profile saved successfully!', type: 'success' });
  }, [markPristine]);

  const { save, isSaving, isSaved, isError, errorMessage } = useCompanySave({
    companyId,
    onSuccess: handleSaveSuccess,
  });

  // Fetch company data on mount or when companyId changes
  useEffect(() => {
    if (companyId) {
      dispatch(fetchCompanyById(companyId));
    }
  }, [companyId, dispatch]);

  // Populate form when company data arrives from backend
  useEffect(() => {
    if (apiData || meta) {
      const hq = apiData?.headquarters;
      const locationStr =
        meta?.headquarters?.full ||
        (hq ? [hq.city, hq.state, hq.country].filter(Boolean).join(', ') : '') ||
        '';

      const backendLogo = apiData?.media?.logo?.url || meta?.logoUrl || null;
      const backendBanner = apiData?.media?.coverImage?.url || meta?.bannerUrl || null;

      setLogoPreviewUrl(backendLogo);
      setBannerPreviewUrl(backendBanner);

      const isVerifiedBackend = apiData?.account?.isVerified || meta?.isVerified;
      if (isVerifiedBackend) {
        setCurrentVerification('verified');
      } else if (apiData?.account?.status === 'Pending') {
        setCurrentVerification('pending');
      } else {
        setCurrentVerification(defaultVerificationStatus);
      }

      resetForm({
        name: apiData?.companyName || meta?.name || '',
        slug: apiData?.companySlug || meta?.slug || slug,
        tagline: apiData?.descriptions?.tagline || meta?.tagline || '',
        description: apiData?.descriptions?.short || apiData?.description || meta?.description || '',
        industry: apiData?.industry || meta?.industry || 'Technology',
        size: apiData?.companySize || meta?.size || '11-50',
        location: locationStr,
        founded: apiData?.foundedYear ? String(apiData.foundedYear) : meta?.founded || '',
        website: apiData?.website || meta?.website || '',
        social: {
          linkedin: apiData?.socialMedia?.linkedin || meta?.socialLinks?.linkedin || '',
          twitter: apiData?.socialMedia?.twitter || meta?.socialLinks?.twitter || '',
          facebook: apiData?.socialMedia?.facebook || meta?.socialLinks?.facebook || '',
          instagram: apiData?.socialMedia?.instagram || meta?.socialLinks?.instagram || '',
          youtube: apiData?.socialMedia?.youtube || meta?.socialLinks?.youtube || '',
          github: apiData?.socialMedia?.github || meta?.socialLinks?.github || '',
        },
        logoUrl: backendLogo,
        bannerUrl: backendBanner,
      });
    }
  }, [apiData, meta]);

  // Dynamic Profile Strength Calculation
  const profileStrength = useMemo(() => {
    let score = 0;
    if (logoPreviewUrl) score += 10;
    if (bannerPreviewUrl) score += 10;
    if (form.name?.trim()) score += 10;
    if (form.industry?.trim()) score += 10;
    if (form.location?.trim()) score += 10;
    if (form.founded?.trim()) score += 5;
    if (form.website?.trim()) score += 10;
    if (form.size?.trim()) score += 10;
    if (form.tagline?.trim()) score += 10;
    if (form.description?.trim()) score += 10;

    const hasSocial = Object.values(form.social || {}).some((val) => typeof val === 'string' && val.trim().length > 0);
    if (hasSocial) score += 5;

    return Math.min(100, score);
  }, [form, logoPreviewUrl, bannerPreviewUrl]);

  // Logo upload handler
  const handleLogoChange = async (file: File) => {
    if (!companyId) return;

    const tempUrl = URL.createObjectURL(file);
    setLogoPreviewUrl(tempUrl);
    setField('logoUrl', tempUrl);

    setIsUploadingLogo(true);
    try {
      const res = await CompanyService.uploadCompanyLogo(companyId, file);
      const uploadedUrl = res?.data?.logo?.cloudinarySecureUrl || res?.data?.logo?.url || tempUrl;
      setLogoPreviewUrl(uploadedUrl);
      setField('logoUrl', uploadedUrl);

      dispatch(fetchCompanyById(companyId));
      setToast({ message: '✓ Company logo updated successfully!', type: 'success' });
    } catch (err: any) {
      setToast({
        message: err?.message || 'Failed to upload logo. Please try again.',
        type: 'error',
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Banner upload handler
  const handleBannerChange = async (file: File) => {
    if (!companyId) return;

    const tempUrl = URL.createObjectURL(file);
    setBannerPreviewUrl(tempUrl);
    setField('bannerUrl', tempUrl);

    setIsUploadingBanner(true);
    try {
      const res = await CompanyService.uploadCompanyCover(companyId, file);
      const uploadedUrl = res?.data?.cover?.cloudinarySecureUrl || res?.data?.cover?.url || tempUrl;
      setBannerPreviewUrl(uploadedUrl);
      setField('bannerUrl', uploadedUrl);

      dispatch(fetchCompanyById(companyId));
      setToast({ message: '✓ Cover banner updated successfully!', type: 'success' });
    } catch (err: any) {
      setToast({
        message: err?.message || 'Failed to upload cover banner.',
        type: 'error',
      });
    } finally {
      setIsUploadingBanner(false);
    }
  };

  // Verification request handler
  const handleVerify = async () => {
    if (!companyId) return;
    setIsVerifying(true);
    try {
      await CompanyService.verifyCompany(companyId);
      setCurrentVerification('verified');
      dispatch(fetchCompanyById(companyId));
      setToast({ message: '✓ Verification status updated!', type: 'success' });
    } catch (err: any) {
      setToast({
        message: err?.message || 'Verification request failed. Please try again.',
        type: 'error',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Section Tab Click (Smooth scrolling)
  const handleTabClick = (tabKey: TabKey) => {
    setActiveTab(tabKey);
    if (tabKey === 'all') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const el = document.getElementById(tabKey);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const initials = (form.name?.trim() || 'TH')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-[1240px] mx-auto space-y-4 pb-12">
      {/* ─────────────────────────────────────────────
          1. COMPACT PAGE HEADER CARD
          ───────────────────────────────────────────── */}
      <div className="bg-white border border-[#e8dfd5] rounded-xl p-4 sm:py-4.5 sm:px-5.5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-[#f0e8e0]">
          {/* Title & Subtitle */}
          <div>
            <h1 className="text-xl sm:text-[22px] font-bold text-[#3d2b1f] tracking-tight leading-tight">
              Edit Company Profile
            </h1>
            <p className="text-xs text-[#4a3728]/65 mt-0.5">
              Customize your public brand identity, company details, and social links
              {isDirty && (
                <span className="ml-2 inline-flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Unsaved changes
                </span>
              )}
            </p>
          </div>

          {/* Right Side: Profile Strength + Save Button */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-5 self-start sm:self-auto">
            {/* Profile Strength */}
            <div className="flex flex-col items-start sm:items-end min-w-[110px]">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#3d2b1f] mb-1">
                <span>Profile Strength</span>
                <span className="text-[#2e7d32] font-bold">{profileStrength}%</span>
              </div>
              <div className="w-28 h-1.5 rounded-full bg-[#e8dfd5] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-[#10b981] rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${profileStrength}%` }}
                />
              </div>
            </div>

            {/* Save Changes Button */}
            <button
              type="button"
              onClick={() => save(form, setErrors)}
              disabled={!isDirty || isSaving}
              className={`inline-flex items-center justify-center gap-2 h-[38px] px-5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 shadow-sm ${
                !isDirty && !isSaving
                  ? 'bg-[#3d2b1f]/25 text-[#f6ede8]/60 cursor-not-allowed shadow-none'
                  : isSaved
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-[#3d2b1f] text-[#f6ede8] hover:bg-[#2b1e15] active:scale-[0.98]'
              }`}
            >
              {isSaving ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Saving…</span>
                </>
              ) : isSaved ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="pt-3 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {[
            { key: 'all', label: 'All Sections', icon: 'M4 6h16M4 12h16M4 18h16' },
            { key: 'branding', label: 'Branding', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
            { key: 'basic-info', label: 'Basic Info', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
            { key: 'social-links', label: 'Social Links', icon: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z' },
            { key: 'verification', label: 'Verification', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
            { key: 'live-preview', label: 'Live Preview', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
          ].map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleTabClick(item.key as TabKey)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-[#3d2b1f] text-[#f6ede8] shadow-sm'
                    : 'text-[#4a3728]/70 hover:bg-[#f3ede8] hover:text-[#3d2b1f]'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Global Error Banner if saving failed */}
      {isError && errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-center gap-3 text-xs text-red-700">
          <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          2. COMPACT TWO-COLUMN MAIN CONTENT
          Main content: 1fr | Sticky Live Preview: 340px
          ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 sm:gap-5 items-start">
        {/* Left Column: Editable Cards */}
        <div className="space-y-4">
          {/* Branding Card */}
          <BrandingSection
            companyInitials={initials}
            logoUrl={logoPreviewUrl}
            bannerUrl={bannerPreviewUrl}
            isUploadingLogo={isUploadingLogo}
            isUploadingBanner={isUploadingBanner}
            onLogoChange={handleLogoChange}
            onBannerChange={handleBannerChange}
          />

          {/* Basic Information Card */}
          <BasicInfoSection form={form} errors={errors} setField={setField} />

          {/* Social Links Card */}
          <SocialLinksSection social={form.social} setSocialField={setSocialField} />

          {/* Verification Card */}
          <VerificationSection
            status={currentVerification}
            isVerifying={isVerifying}
            onVerify={handleVerify}
          />
        </div>

        {/* Right Column: Sticky Live Preview */}
        <div id="live-preview" className="scroll-mt-24 lg:sticky lg:top-24">
          <LivePreviewCard
            form={form}
            logoUrl={logoPreviewUrl}
            bannerUrl={bannerPreviewUrl}
          />
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          avatarInitial="✓"
          onClose={() => setToast(null)}
          duration={3500}
        />
      )}
    </div>
  );
}