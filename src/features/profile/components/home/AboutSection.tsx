// src/profile/components/AboutSection.tsx
'use client';
import AuthService from '@/lib/api/auth.service';
import ProfileService from '@/lib/api/profile.service';
import React, { useEffect, useState } from 'react';

interface AboutSectionProps {
    aboutData?: any;
    isLoading?: boolean;
    onAboutCreated?: () => void;
    aboutId?: string;
    videoUrl?: string;
    onVideoUpload?: (file: File) => Promise<void>;
    isUploadingVideo?: boolean;
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
    isUploadingVideo = false,
    isOwnProfile = true, // ✅ default true, purana behavior nahi tootega
}) => {
    const [isEditMode, setIsEditMode] = useState(false);
    const [aboutText, setAboutText] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAboutExpanded, setIsAboutExpanded] = useState(false); // ✅ NAYA STATE for read more/less

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
                                    <div className="relative min-w-0">
                                        <video
                                            className="w-full h-40 rounded-xl object-cover"
                                            controls
                                            src={videoUrl}
                                        >
                                            Your browser does not support video playback.
                                        </video>

                                        {isOwnProfile && (
                                            <label className="absolute top-2 right-2 bg-[#4a3728]/80 text-white px-3 py-1 text-xs rounded-md hover:bg-[#4a3728] transition cursor-pointer">
                                                {isUploadingVideo ? 'Uploading...' : '🔄 Replace'}
                                                <input
                                                    type="file"
                                                    accept="video/mp4,video/webm,video/quicktime"
                                                    onChange={handleVideoUpload}
                                                    disabled={isUploadingVideo}
                                                    className="hidden"
                                                />
                                            </label>
                                        )}
                                    </div>
                                ) : isOwnProfile ? (
                                    <div className="rounded-xl bg-[#4a3728]/10 border border-[#4a3728]/30 w-full h-40 flex flex-col items-center justify-center gap-2 min-w-0">
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
        </>
    );
};

export default AboutSection;