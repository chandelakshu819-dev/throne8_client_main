// src/profile/components/AboutSection.tsx
'use client';
import AuthService from '@/lib/api/auth.service';
import ProfileService from '@/lib/api/profile.service';
import React, { useEffect, useState, useRef } from 'react';

interface AboutSectionProps {
    aboutData?: any;
    isLoading?: boolean;
    onAboutCreated?: () => void;
    aboutId?: string;
    videoUrl?: string;
    onVideoUpload?: (file: File) => Promise<void>;
    onVideoDelete?: () => Promise<void>;
    isUploadingVideo?: boolean;
    isDeletingVideo?: boolean;
    isOwnProfile?: boolean; // ✅ NAYA PROP
}

const ABOUT_TRUNCATE_LENGTH = 220;

const AboutSection: React.FC<AboutSectionProps> = ({
    aboutData,
    isLoading = false,
    onAboutCreated,
    aboutId,
    videoUrl,
    onVideoUpload,
    onVideoDelete,
    isUploadingVideo = false,
    isDeletingVideo = false,
    isOwnProfile = true, // ✅ default true, purana behavior nahi tootega
}) => {
    const [isEditMode, setIsEditMode] = useState(false);
    const [aboutText, setAboutText] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAboutExpanded, setIsAboutExpanded] = useState(false); // ✅ NAYA STATE for read more/less
    const [isVideoMenuOpen, setIsVideoMenuOpen] = useState(false);
    const [showDeleteVideoConfirm, setShowDeleteVideoConfirm] = useState(false); // ✅ NEW
    const videoMenuRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ✅ Close video dropdown menu on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (videoMenuRef.current && !videoMenuRef.current.contains(event.target as Node)) {
                setIsVideoMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (aboutData?.aboutText) {
            setAboutText(aboutData.aboutText);
        }
    }, [aboutData]);

    // ✅ Agar aboutData badal jaaye (jaise dusri profile khol li), toh expand state reset ho
    useEffect(() => {
        setIsAboutExpanded(false);
    }, [aboutData?.aboutText]);

    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isModalOpen]);

    // ✅ NEW: Delete-video confirm modal khulne par bhi background scroll lock ho
    useEffect(() => {
        if (showDeleteVideoConfirm) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [showDeleteVideoConfirm]);

    const handleOpenModal = (editMode: boolean = false) => {
        setIsEditMode(editMode);
        if (editMode && aboutData?.aboutText) {
            setAboutText(aboutData.aboutText);
        } else {
            setAboutText('');
        }
        setError('');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setAboutText('');
        setError('');
        setIsEditMode(false);
    };

    const handleSave = async () => {
        if (!aboutText.trim()) {
            setError('About text is required');
            return;
        }

        if (aboutText.trim().length < 50) {
            setError('About text must be at least 50 characters');
            return;
        }

        if (aboutText.trim().length > 2600) {
            setError('About text cannot exceed 2600 characters');
            return;
        }

        if (!/^[A-Z]/.test(aboutText.trim())) {
            setError('About text must start with a capital letter');
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            if (isEditMode && aboutId) {
                await ProfileService.updateAbout(aboutId, {
                    aboutText: aboutText.trim(),
                });
            } else {
                await ProfileService.createAbout({
                    aboutText: aboutText.trim(),
                });
            }

            if (onAboutCreated) {
                await onAboutCreated();
            }

            handleCloseModal();

        } catch (error: any) {
            console.error('❌ [ABOUT] Failed to save:', error);
            setError(error.message || 'Failed to save about text');
        } finally {
            setIsSaving(false);
        }
    };

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('video/')) {
            alert('Please upload a video file');
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            alert('Video must be less than 50MB');
            return;
        }

        if (onVideoUpload) {
            await onVideoUpload(file);
        }
    };

    // ✅ Public profile pe agar About hi nahi hai, toh poora section hi hide kar do
    if (!isOwnProfile && !aboutData?.aboutText && !videoUrl) {
        return null;
    }

    // ✅ Read more/less logic
    const fullAboutText: string = aboutData?.aboutText || '';
    const shouldTruncate = fullAboutText.length > ABOUT_TRUNCATE_LENGTH;
    const displayedAboutText =
        shouldTruncate && !isAboutExpanded
            ? fullAboutText.slice(0, ABOUT_TRUNCATE_LENGTH).trimEnd()
            : fullAboutText;

    return (
        <>
            {/* ✅ FIX: min-w-0 so this whole card can never force the page
                wider than the viewport when the about text is long */}
            <div className="bg-[#f6ede8]/80 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-[#e0d8cf]/50 mb-8 relative overflow-hidden group min-w-0">
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-4 right-8 w-20 h-20 bg-gradient-to-br from-[#4a3728]/8 to-transparent rounded-full animate-pulse"></div>
                    <div className="absolute bottom-6 left-6 w-16 h-16 bg-gradient-to-tr from-[#4a3728]/5 to-transparent rounded-full animate-pulse delay-1000"></div>
                    <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-[#4a3728]/10 rounded-full animate-bounce delay-500"></div>
                    <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-[#4a3728]/15 rounded-full animate-bounce delay-700"></div>
                    <div className="absolute inset-0 opacity-30">
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path d="M0,20 Q50,0 100,30" stroke="url(#gradient1)" strokeWidth="0.5" fill="none" className="animate-pulse" />
                            <path d="M0,60 Q30,40 100,70" stroke="url(#gradient2)" strokeWidth="0.3" fill="none" className="animate-pulse delay-300" />
                            <defs>
                                <linearGradient id="gradient1">
                                    <stop offset="0%" stopColor="#4a3728" stopOpacity="0" />
                                    <stop offset="50%" stopColor="#4a3728" stopOpacity="0.1" />
                                    <stop offset="100%" stopColor="#4a3728" stopOpacity="0" />
                                </linearGradient>
                                <linearGradient id="gradient2">
                                    <stop offset="0%" stopColor="#6b4e3d" stopOpacity="0" />
                                    <stop offset="50%" stopColor="#6b4e3d" stopOpacity="0.08" />
                                    <stop offset="100%" stopColor="#6b4e3d" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                </div>
                <div className="relative z-10 min-w-0">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#4a3728] via-[#6b4e3d] to-[#8b6f47] rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500">
                                <svg className="w-6 h-6 text-[#f6ede8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-[#4a3728] tracking-wide group-hover:text-[#6b4e3d] transition-colors duration-300">About</h3>
                        </div>
                    </div>
                    <div className="relative min-w-0">
                        <div className="relative bg-gradient-to-br from-[#e0d8cf]/80 via-[#e0d8cf]/60 to-[#e0d8cf]/40 p-6 rounded-2xl shadow-lg transition-all duration-500 border border-[#e0d8cf]/30 backdrop-blur-sm min-w-0">
                            {/* ✅ FIX: min-w-0 on the grid — grid children default to
                                min-width:auto, so a long unbroken about-text word
                                or a long video-upload label could force this
                                2-column grid (and everything above it) wider than
                                the viewport. */}
                            <div className="grid md:grid-cols-2 gap-6 min-w-0">
                                <div className="bg-gradient-to-br from-[#e0d8cf]/60 via-[#e0d8cf]/50 to-[#e0d8cf]/40 rounded-2xl border border-[#4a3728]/20 p-5 shadow-md hover:shadow-lg transition scale-[1] hover:scale-[1.02] duration-300 relative min-w-0">
                                    <h3 className="text-xl font-semibold bg-gradient-to-r from-[#4a3728] to-[#6b4e3d] bg-clip-text text-transparent mb-3">
                                        About Me
                                    </h3>

                                    {aboutData?.aboutText ? (
                                        <>
                                            {/* ✅ FIX: break-words added — whitespace-pre-wrap alone
                                                preserves line breaks but does NOT wrap a single long
                                                unbroken word/URL; break-words does. */}
                                            <p className="text-[#4a3728]/90 leading-relaxed font-medium tracking-wide text-sm whitespace-pre-wrap break-words">
                                                {displayedAboutText}
                                                {shouldTruncate && !isAboutExpanded ? '...' : ''}
                                            </p>

                                            {/* ✅ Read more / Show less toggle */}
                                            {shouldTruncate && (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsAboutExpanded((prev) => !prev)}
                                                    className="mt-2 text-[#4a3728] font-semibold text-sm hover:underline focus:outline-none"
                                                >
                                                    {isAboutExpanded ? 'Show less' : 'Read more'}
                                                </button>
                                            )}

                                            {/* ✅ Edit button sirf apni profile pe */}
                                            {isOwnProfile && (
                                                <button
                                                    onClick={() => handleOpenModal(true)}
                                                    className="absolute top-4 right-4 flex items-center gap-1.5 bg-[#4a3728]/10 text-[#4a3728] px-3 py-1.5 text-xs font-semibold rounded-full hover:bg-[#4a3728]/20 transition"
                                                >
                                                    <svg
                                                        className="w-3.5 h-3.5"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                        />
                                                    </svg>
                                                    Edit
                                                </button>
                                            )}
                                        </>
                                    ) : isOwnProfile ? (
                                        <div className="text-center py-8">
                                            <p className="text-[#4a3728]/60 mb-4 text-sm">No about text added yet</p>
                                            <button
                                                onClick={() => handleOpenModal(false)}
                                                className="px-4 py-2 bg-gradient-to-r from-[#4a3728] to-[#6a5748] text-white rounded-full text-xs font-semibold hover:shadow-lg transition-all"
                                            >
                                                + Add About
                                            </button>
                                        </div>
                                    ) : null}
                                </div>

                                {/* ✅ Video section — public profile pe sirf tab dikhega jab video already hai, upload option nahi */}
                                {videoUrl ? (
                                    <div className="relative min-w-0 h-full flex flex-col">
                                        <video
                                            className="w-full h-full rounded-xl object-cover"
                                            controls
                                            src={videoUrl}
                                        >
                                            Your browser does not support video playback.
                                        </video>

                                        {isOwnProfile && (
                                            <div className="absolute top-2 right-2 z-20" ref={videoMenuRef}>
                                                {/* 3-Dot Options Button */}
                                                <button
                                                    type="button"
                                                    onClick={() => setIsVideoMenuOpen((prev) => !prev)}
                                                    disabled={isUploadingVideo || isDeletingVideo}
                                                    className="w-8 h-8 rounded-full bg-[#4a3728]/80 text-white hover:bg-[#4a3728] transition flex items-center justify-center shadow-md focus:outline-none"
                                                    title="Options"
                                                >
                                                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                                                    </svg>
                                                </button>

                                                {/* Dropdown Menu */}
                                                {isVideoMenuOpen && (
                                                    <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-xl border border-[#e0d8cf] py-1 z-30 animate-in fade-in zoom-in-95 duration-150">
                                                                                                                {/* Replace Option */}
                                                                                                                <button
                                                            type="button"
                                                            onClick={() => {
                                                                setIsVideoMenuOpen(false);
                                                                fileInputRef.current?.click();
                                                            }}
                                                            disabled={isUploadingVideo || isDeletingVideo}
                                                            className="w-full text-left px-4 py-2 text-xs font-semibold text-[#4a3728] hover:bg-[#f6ede8] flex items-center gap-2 transition disabled:opacity-50"
                                                        >
                                                            <svg className="w-4 h-4 text-[#4a3728]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                            </svg>
                                                            {isUploadingVideo ? 'Replacing...' : 'Replace'}
                                                        </button>

                                                        {/* Delete Option */}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setIsVideoMenuOpen(false);
                                                                setShowDeleteVideoConfirm(true); // ✅ native confirm() ki jagah custom modal khulega
                                                            }}
                                                            disabled={isUploadingVideo || isDeletingVideo}
                                                            className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition disabled:opacity-50"
                                                        >
                                                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                            {isDeletingVideo ? 'Deleting...' : 'Delete'}
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Hidden File Input for Replace */}
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="video/mp4,video/webm,video/quicktime"
                                                    onChange={handleVideoUpload}
                                                    disabled={isUploadingVideo || isDeletingVideo}
                                                    className="hidden"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ) : isOwnProfile ? (
                                    <div className="rounded-xl bg-[#4a3728]/10 border border-[#4a3728]/30 w-full h-full min-h-[160px] flex flex-col items-center justify-center gap-2 min-w-0 p-4">
                                        <div className="w-10 h-10 rounded-full bg-[#4a3728]/20 border border-[#4a3728]/30 flex items-center justify-center text-[#4a3728]/70 flex-shrink-0">
                                            🎬
                                        </div>
                                        <p className="text-[#4a3728]/70 text-sm font-medium text-center px-2 break-words">
                                            {isUploadingVideo ? 'Uploading video...' : 'Upload your introduction video'}
                                        </p>

                                        {!isUploadingVideo && (
                                            <label className="mt-2 px-4 py-2 bg-gradient-to-r from-[#4a3728] to-[#6a5748] text-white text-xs rounded-full cursor-pointer hover:shadow-lg transition">
                                                Choose Video
                                                <input
                                                    type="file"
                                                    accept="video/mp4,video/webm,video/quicktime"
                                                    onChange={handleVideoUpload}
                                                    className="hidden"
                                                />
                                            </label>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-[#4a3728]/5 via-transparent to-[#6b4e3d]/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ✅ Modal sirf apni profile pe render hoga */}
            {isOwnProfile && isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={handleCloseModal}
                    ></div>

                    <div className="relative z-10 w-full max-w-2xl mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between bg-gradient-to-r from-[#4a3728] to-[#6a5748] px-6 py-5">
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    {isEditMode ? 'Edit About' : 'Add About'}
                                </h2>
                                <p className="text-white/70 text-sm mt-1">
                                    Tell people about yourself
                                </p>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                disabled={isSaving}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6">
                            {error && (
                                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-[#4a3728] mb-2">
                                    About Text <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={aboutText}
                                    onChange={(e) => {
                                        setAboutText(e.target.value);
                                        setError('');
                                    }}
                                    placeholder="Tell people about yourself... (minimum 50 characters, must start with capital letter)"
                                    rows={8}
                                    className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-colors duration-200 text-[#4a3728] resize-none ${error
                                        ? 'border-red-500 bg-red-50 focus:border-red-600'
                                        : 'border-[#e0d8cf] bg-white/50 focus:border-[#4a3728]'
                                        }`}
                                    maxLength={2600}
                                />
                                <div className="flex justify-between mt-2">
                                    <p className="text-xs text-[#4a3728]/60">
                                        Must start with capital letter, min 50 characters
                                    </p>
                                    <p className={`text-xs ${aboutText.length > 2600 ? 'text-red-500' : 'text-[#4a3728]/60'
                                        }`}>
                                        {aboutText.length} / 2600
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 px-6 pb-6">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                disabled={isSaving}
                                className="flex-1 px-6 py-3 rounded-full border-2 border-[#e0d8cf] text-[#4a3728] font-semibold hover:bg-[#f6ede8]/50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving || !aboutText.trim()}
                                className="flex-1 px-6 py-3 rounded-full bg-gradient-to-r from-[#4a3728] to-[#6a5748] text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : isEditMode ? 'Update About' : 'Add About'}
                            </button>
                        </div>
                        </div>
                </div>
            )}

            {/* ✅ NEW: Custom "Delete video?" confirm modal — native confirm() ki jagah */}
            {isOwnProfile && showDeleteVideoConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setShowDeleteVideoConfirm(false)}
                    ></div>

                    <div className="relative z-10 w-full max-w-sm mx-4 bg-[#f6ede8] rounded-2xl shadow-2xl p-6">
                        <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <button
                                onClick={() => setShowDeleteVideoConfirm(false)}
                                className="text-[#4a3728]/60 hover:text-[#4a3728] transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <h3 className="text-lg font-bold text-[#4a3728] mb-1">Delete video?</h3>
                        <p className="text-sm text-[#4a3728]/70 mb-6">
                            Are you sure you want to delete this video permanently?
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowDeleteVideoConfirm(false)}
                                disabled={isDeletingVideo}
                                className="px-5 py-2 rounded-full border-2 border-[#e0d8cf] text-[#4a3728] font-semibold text-sm hover:bg-[#e0d8cf]/50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    setShowDeleteVideoConfirm(false);
                                    if (onVideoDelete) {
                                        await onVideoDelete();
                                    }
                                }}
                                disabled={isDeletingVideo}
                                className="px-5 py-2 rounded-full bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {isDeletingVideo ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AboutSection;