//becameMentorModal.tsx

"use client";

import React, { useState, useEffect } from "react";
import { X, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuth } from '@/features/auth/hooks/useAuth';

import {
    createMentorSchema,
    step1Schema,
    step2Schema,
} from "@/features/mentorship/validators/mentor.validation";
import MentorService from "@/lib/api/mentorship.service";
import { DOMAINS, DOMAIN_LABELS, EXPERIENCE_OPTIONS } from "@/features/mentorship/constants/mentorship";
import { CreateMentorFormData } from "@/features/mentorship/types/mentorship.types";
import { useProfileData } from "@/features/profile/hooks/useProfileData";
import { useExperienceData } from "@/features/profile/hooks/useExperienceData";
import { useEducationData } from "@/features/profile/hooks/useEducationData";

interface BecomeMentorModalProps {
    isOpen: boolean;
    onClose: () => void;
    formStep: number;
    profileImage: string;
    currentUserId?: string;
    setFormStep: (step: number) => void;
}
export default function BecomeMentorModal({
    isOpen,
    onClose,
    formStep,
    currentUserId,
    profileImage,
    setFormStep,
}: BecomeMentorModalProps) {

    const router = useRouter();
    const { user } = useAuth();

    const {
        userProfileData,
        fetchUserProfile,
        isLoadingProfile: hookIsLoadingProfile,
        profileError: hookProfileError,
    } = useProfileData();    const { experienceList, fetchExperienceData } = useExperienceData();
    const { educationList, fetchEducationData } = useEducationData();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [agreements, setAgreements] = useState([false, false, false]);
    const [agreementError, setAgreementError] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [domainDropdownOpen, setDomainDropdownOpen] = useState(false);
    const [profilePicPreview, setProfilePicPreview] = useState<string>(profileImage);
    const [skillInput, setSkillInput] = useState('');

    // ✅ NEW: Profile loading state — jab tak data aa nahi jaata tab tak check nahi karte
    const [isProfileLoading, setIsProfileLoading] = useState(true);
    const [profileLoadError, setProfileLoadError] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        trigger,
        watch,
        setValue,
        formState: { errors },
    } = useForm<CreateMentorFormData>({
        resolver: zodResolver(createMentorSchema),
        defaultValues: {
            skills: [],
            domains: [],
        },
    });

    const watchedSkills = watch('skills');
    const watchedDomains = watch('domains');

    useEffect(() => {
        if (user?.userId) {
            fetchUserProfile(user.userId);   // 👈 userId ab pass ho raha hai
            fetchEducationData();
        }
    }, [user, fetchUserProfile, fetchEducationData]);

    useEffect(() => {
        if (userProfileData) {
            const experienceIds =
                (userProfileData as any)?.experienceIds ||
                (userProfileData as any)?.onboarding?.experienceIds ||
                [];

            if (experienceIds.length > 0) {
                fetchExperienceData(experienceIds);
            }

            // ✅ NEW: userProfileData aa gaya — loading khatam
            setIsProfileLoading(false);
            setProfileLoadError(false);
        }
    }, [userProfileData, fetchExperienceData]);

       // ✅ NEW: Hook ne error diya (jaise 429, 401, network fail) — turant
    // dikhao, 8 second timeout ka wait mat karo.
    useEffect(() => {
        if (isOpen && hookProfileError) {
            console.warn('⚠️ [BecomeMentorModal] Profile fetch failed:', hookProfileError);
            setIsProfileLoading(false);
            setProfileLoadError(true);
        }
    }, [isOpen, hookProfileError]);

    // ✅ NEW: Safety timeout — agar 8 seconds mein userProfileData nahi aaya,
    // to loading state ko force-stop karo, chahe hook ne kabhi resolve/reject
    // kuch bhi na kiya ho. Isse modal kabhi permanently stuck nahi rahega.
    useEffect(() => {
        if (!isOpen || !isProfileLoading) return;

        const timeoutId = setTimeout(() => {
            setIsProfileLoading((prev) => {
                if (prev) {
                    console.warn('⚠️ [BecomeMentorModal] Profile fetch timed out after 8s');
                    setProfileLoadError(true);
                }
                return false;
            });
        }, 8000);

        return () => clearTimeout(timeoutId);
    }, [isOpen, isProfileLoading]);


    useEffect(() => {
        if (isOpen && profileImage) {
            const convertUrlToFile = async () => {
                try {
                    const response = await fetch(profileImage);
                    const blob = await response.blob();
                    const file = new File([blob], 'profile-pic.jpg', { type: blob.type || 'image/jpeg' });
                    setValue('profilePic', file, { shouldValidate: false });
                } catch (error) {
                    console.error('❌ Failed to convert profile pic:', error);
                }
            };
            convertUrlToFile();
        }
    }, [isOpen, profileImage, setValue]);

      // ✅ NEW: Modal open hone par loading reset karo
      useEffect(() => {
        if (isOpen) {
            // Agar userProfileData pehle se hai to seedha false, warna wait karo
            if (userProfileData) {
                setIsProfileLoading(false);
            } else {
                setIsProfileLoading(true);
                setProfileLoadError(false);   // 👈 ADD — purana error state clear karo har fresh open par
            }
        }
    }, [isOpen]);

    const currentRole = experienceList?.find(exp => exp.current)?.position ||
        experienceList?.[0]?.position ||
        userProfileData?.onboarding?.workingProfile?.jobTitle ||
        '';

    const currentCompany = experienceList?.find(exp => exp.current)?.company ||
        experienceList?.[0]?.company ||
        userProfileData?.onboarding?.workingProfile?.companyName ||
        '';

    useEffect(() => {
        if (currentRole) {
            setValue('currentRole', currentRole, { shouldValidate: false });
        }
    }, [currentRole, setValue]);

    const fullName = userProfileData
        ? [userProfileData.firstName, userProfileData.lastName].filter(Boolean).join(' ').trim()
        : '';
    const email = userProfileData?.email || '';
    const location = userProfileData?.location || '';

    // ✅ NEW: Profile readiness check — inme se koi bhi ek missing = incomplete
    const isProfileReady = !!(
        profileImage &&     // photo hai
        fullName.trim() &&  // naam hai
        email &&            // email hai
        currentRole         // experience/role hai
    );

    if (!isOpen) return null;

    const handleClose = () => {
        onClose();
        setFormStep(1);
    };

    const handleNext = async () => {
        let isValid = false;

        if (formStep === 1) {
            isValid = await trigger(['title', 'linkedinUrl', 'profilePic']);
        } else if (formStep === 2) {
            isValid = await trigger(['bio', 'skills', 'domains', 'experienceTotal', 'currentRole']);
        }

        if (isValid) setFormStep(formStep + 1);
    };

    const onSubmit = async (formData: CreateMentorFormData) => {
        if (!agreements.every(Boolean)) {
            setAgreementError(true);
            return;
        } else {
            setAgreementError(false);
        }
        try {
            setIsSubmitting(true);
            setSubmitError(null);

            const response = await MentorService.createMentor({
                title: formData.title,
                bio: formData.bio,
                domains: formData.domains,
                skills: formData.skills,
                experienceTotal: formData.experienceTotal,
                currentRole: currentRole,
                linkedinUrl: formData.linkedinUrl,
                githubUrl: formData.githubUrl,
                profilePic: formData.profilePic,
            });

            const userId = response.data.userId;
            setIsRedirecting(true);
            router.push(`/mentorship/mentorProfile/${userId}`);
            onClose();

        } catch (error: any) {
            setSubmitError(error.message);
            setIsRedirecting(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ✅ NEW: Loading screen — data fetch ho raha hai
    if (isOpen && isProfileLoading) {
        return (
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6"
                onClick={handleClose}
            >
                <div
                    className="bg-white rounded-[32px] max-w-md w-full p-10 shadow-2xl text-center relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={handleClose}
                        className="absolute top-5 right-5 w-9 h-9 bg-[#f8f6f4] hover:bg-[#4a3728] text-[#4a3728] hover:text-white rounded-full flex items-center justify-center transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <div className="w-12 h-12 border-4 border-[#ece7e2] border-t-[#4a3728] rounded-full animate-spin mx-auto mb-5" />
                    <p className="text-sm font-bold text-[#4a3728]">Checking your profile...</p>
                </div>
            </div>
        );
    }

        // ✅ NEW: Fetch failed / timed out — retry option do, hang mat hone do
        if (isOpen && profileLoadError) {
            return (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6"
                    onClick={handleClose}
                >
                    <div
                        className="bg-white rounded-[32px] max-w-md w-full p-10 shadow-2xl text-center relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={handleClose}
                            className="absolute top-5 right-5 w-9 h-9 bg-[#f8f6f4] hover:bg-[#4a3728] text-[#4a3728] hover:text-white rounded-full flex items-center justify-center transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <p className="text-sm font-bold text-red-500 mb-4">
                            Couldn't load your profile. Please check your connection and try again.
                        </p>
                        <button
                            onClick={() => {
                                if (!user?.userId) return;
                                setProfileLoadError(false);
                                setIsProfileLoading(true);
                                fetchUserProfile(user.userId);
                            }}
                            className="px-6 py-2.5 bg-[#4a3728] text-white rounded-xl text-sm font-bold"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            );
        }
        console.log('🔍 [DEBUG] userProfileData:', userProfileData);
console.log('🔍 [DEBUG] experienceList:', experienceList);
console.log('🔍 [DEBUG] email:', email, 'currentRole:', currentRole);
    
        // ✅ NEW: Profile incomplete screen
        if (isOpen && !isProfileReady) {
        return (
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6"
                onClick={handleClose}
            >
                <div
                    className="bg-white rounded-[32px] max-w-md w-full p-10 shadow-2xl text-center relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close */}
                    <button
                        onClick={handleClose}
                        className="absolute top-5 right-5 w-9 h-9 bg-[#f8f6f4] hover:bg-[#4a3728] text-[#4a3728] hover:text-white rounded-full flex items-center justify-center transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Warning Icon */}
                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                    </div>

                    {/* Heading */}
                    <h3 className="text-xl font-black text-[#4a3728] mb-2">
                        Profile Incomplete
                    </h3>

                    {/* Red flash line */}
                    <p className="text-sm text-red-600 font-semibold mb-3">
                        ⚠️ Please complete at least 70% of your profile first.
                    </p>

                    {/* Detail message ~30 words */}
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                        Mentees choose mentors based on trust and credibility. A complete profile —
                        with your photo, work experience, and basic details — boosts your booking
                        chances by <span className="font-bold text-[#4a3728]">3x</span>.
                        Invest 2 minutes now to stand out.
                    </p>

                    {/* Missing fields — kya missing hai clearly dikhao */}
                    <div className="bg-red-50 rounded-2xl p-4 mb-6 text-left space-y-2">
                        {!profileImage && (
                            <p className="text-xs text-red-600 font-medium flex items-center gap-2">
                                <span>✗</span> Profile photo missing
                            </p>
                        )}
                        {!fullName.trim() && (
                            <p className="text-xs text-red-600 font-medium flex items-center gap-2">
                                <span>✗</span> Full name missing
                            </p>
                        )}
                        {!email && (
                            <p className="text-xs text-red-600 font-medium flex items-center gap-2">
                                <span>✗</span> Email missing
                            </p>
                        )}
                        {!currentRole && (
                            <p className="text-xs text-red-600 font-medium flex items-center gap-2">
                                <span>✗</span> Work experience / current role missing
                            </p>
                        )}
                    </div>

                    {/* CTA */}
                    <button
                        onClick={() => {
                            handleClose();
                            router.push('/profile'); // ✅ apna actual profile route daalo
                        }}
                        className="w-full py-3 bg-gradient-to-r from-[#4a3728] to-[#7a5c3e] text-white rounded-2xl font-bold text-sm hover:shadow-xl transition-all"
                    >
                        Complete My Profile →
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Global Loader — form se bahar */}
            {(isSubmitting || isRedirecting) && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ width: '64px', height: '64px', border: '4px solid rgba(255,255,255,0.3)', borderTop: '4px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <p style={{ color: 'white', fontWeight: 'bold', fontSize: '14px', letterSpacing: '0.05em' }}>Creating your profile...</p>
                </div>
            )}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-start justify-center p-6 animate-fade-in overflow-y-auto"
                onClick={handleClose}
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        // console.log("button clieknchgsadcs")
                        handleSubmit(onSubmit, (errors) => {
                            console.log("❌ Validation errors:", errors);
                        })();
                    }}
                    className="bg-white rounded-[40px] max-w-3xl w-full relative shadow-2xl animate-slide-up-modal my-6"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-6 right-6 w-10 h-10 bg-[#f8f6f4] hover:bg-[#4a3728] text-[#4a3728] hover:text-white rounded-full flex items-center justify-center transition-all z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Header */}
                    <div className="bg-gradient-to-br from-[#4a3728] to-[#7a5c3e] p-10 rounded-t-[40px] text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                        <div className="relative z-10">
                            <div
                                className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                                <Users className="w-8 h-8" />
                            </div>
                            <h2 className="text-3xl font-black mb-2">Become a Mentor</h2>
                            <p className="text-white/80 font-medium">
                                Share your expertise and inspire the next generation
                            </p>
                            {/* Progress Bar */}
                            <div className="mt-6 flex items-center gap-2">
                                {[1, 2, 3].map((step) => (
                                    <div
                                        key={step}
                                        className={`h-1.5 rounded-full flex-1 transition-all ${formStep >= step ? "bg-white" : "bg-white/30"
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className="p-10">
                        {/* Step 1: Personal Information */}
                        {formStep === 1 && (
                            <div className="space-y-6">
                                <h3 className="text-2xl font-black text-[#4a3728] mb-6">
                                    Personal Information
                                </h3>

                                <div>
                                    <label className="block text-sm font-bold text-[#4a3728] mb-2">
                                        Profile Photo *
                                    </label>

                                    <div className="relative w-36 h-36 group cursor-pointer">
                                        <img src={profileImage} alt="Profile" className="w-full h-full rounded-2xl border-4 border-white shadow-xl object-cover transition-all duration-500 group-hover:shadow-2xl group-hover:scale-105" />
                                        {/* <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="hidden"
                                        id="profilePicInput"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setValue('profilePic', file, { shouldValidate: true });
                                                setProfilePicPreview(URL.createObjectURL(file));
                                            }
                                        }}
                                    />
                                    <label htmlFor="profilePicInput" className="cursor-pointer">
                                        <p className="text-sm font-bold text-[#4a3728] mb-1">
                                            Click to upload
                                        </p>
                                        <p className="text-xs text-slate-500">PNG, JPG, WebP — max 5MB</p>
                                    </label> */}
                                    </div>
                                    {errors.profilePic && (
                                        <p className="text-red-500 text-xs mt-1">{errors.profilePic.message as string}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Full Name - Non-editable */}
                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">
                                            Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={fullName}
                                            readOnly
                                            className="w-full px-4 py-3 bg-[#ece7e2] border border-[#ece7e2] rounded-2xl text-sm font-medium cursor-not-allowed opacity-75"
                                        />
                                    </div>

                                    {/* Email - Non-editable */}
                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">
                                            Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            readOnly
                                            className="w-full px-4 py-3 bg-[#ece7e2] border border-[#ece7e2] rounded-2xl text-sm font-medium cursor-not-allowed opacity-75"
                                        />
                                    </div>

                                    {/* Location - Non-editable */}
                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">
                                            Location *
                                        </label>
                                        <input
                                            type="text"
                                            value={location}
                                            readOnly
                                            className="w-full px-4 py-3 bg-[#ece7e2] border border-[#ece7e2] rounded-2xl text-sm font-medium cursor-not-allowed opacity-75"
                                        />
                                    </div>
                                    {/* <div>
                                    <label className="block text-sm font-bold text-[#4a3728] mb-2">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[#4a3728] mb-2">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="john@example.com"
                                        className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[#4a3728] mb-2">
                                        Location *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="City, Country"
                                        className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium"
                                    />
                                </div> */}

                                    {/* <div>
                                    <label className="block text-sm font-bold text-[#4a3728] mb-2">
                                        Professional Profile *
                                    </label>
                                    <input
                                        type="url"
                                        placeholder="linkedin.com/in/johndoe"
                                        className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium"
                                    />
                                </div> */}

                                    {/* CHANGE: LinkedIn field */}
                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">
                                            LinkedIn URL *
                                        </label>
                                        <input
                                            {...register('linkedinUrl')}
                                            type="url"
                                            placeholder="https://linkedin.com/in/johndoe"
                                            className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium"
                                        />
                                        {errors.linkedinUrl && (
                                            <p className="text-red-500 text-xs mt-1">{errors.linkedinUrl.message}</p>
                                        )}
                                    </div>
                                </div>
                                {/* title area  */}
                                <div>
                                    <label className="block text-sm font-bold text-[#4a3728] mb-2">
                                        Mentor Title *
                                    </label>
                                    <input
                                        {...register('title')}
                                        type="text"
                                        placeholder="e.g. Senior Software Engineer & Tech Mentor"
                                        className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium"
                                    />
                                    {errors.title && (
                                        <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 2: Professional Details */}
                        {formStep === 2 && (
                            <div className="space-y-6">
                                <h3 className="text-2xl font-black text-[#4a3728] mb-6">
                                    Professional Details
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Current Role - Auto-filled from profile */}
                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">
                                            Current Role *
                                        </label>
                                        <input
                                            type="text"
                                            value={currentRole}
                                            readOnly
                                            placeholder="Senior Software Engineer"
                                            className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium cursor-not-allowed opacity-75"
                                        />
                                    </div>

                                    {/* Company - Auto-filled from profile */}
                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">
                                            Company *
                                        </label>
                                        <input
                                            type="text"
                                            value={currentCompany}
                                            readOnly
                                            placeholder="Google"
                                            className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium cursor-not-allowed opacity-75"
                                        />
                                    </div>

                                    {/* CHANGE: Years of Experience — select with number values */}
                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">
                                            Years of Experience *
                                        </label>
                                        <select
                                            {...register('experienceTotal', { valueAsNumber: true })}
                                            className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium"
                                        >
                                            <option value="">Select experience</option>
                                            {EXPERIENCE_OPTIONS.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.experienceTotal && (
                                            <p className="text-red-500 text-xs mt-1">{errors.experienceTotal.message}</p>
                                        )}
                                    </div>

                                    {/* CHANGE: Domains — multi-select checkboxes */}

                                    <div className="relative">
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">
                                            Domains * <span className="text-slate-400 font-normal">(max 5)</span>
                                        </label>

                                        {/* Trigger Button */}
                                        <button
                                            type="button"
                                            onClick={() => setDomainDropdownOpen(!domainDropdownOpen)}
                                            className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl text-sm font-medium text-left flex items-center justify-between"
                                        >
                                            <span className={watchedDomains?.length ? 'text-[#4a3728]' : 'text-slate-400'}>
                                                {watchedDomains?.length
                                                    ? `${watchedDomains.length} domain${watchedDomains.length > 1 ? 's' : ''} selected`
                                                    : 'Select domains'}
                                            </span>
                                            <svg
                                                className={`w-4 h-4 text-[#4a3728] transition-transform ${domainDropdownOpen ? 'rotate-180' : ''}`}
                                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>

                                        {/* Selected tags — below trigger */}
                                        {watchedDomains?.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {watchedDomains.map((domain) => (
                                                    <span
                                                        key={domain}
                                                        className="px-3 py-1 bg-[#4a3728] text-white rounded-xl text-xs font-bold flex items-center gap-1"
                                                    >
                                                        {DOMAIN_LABELS[domain]}
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setValue(
                                                                    'domains',
                                                                    watchedDomains.filter((d) => d !== domain),
                                                                    { shouldValidate: true }
                                                                )
                                                            }
                                                            className="hover:text-red-300 ml-1"
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Dropdown List */}
                                        {domainDropdownOpen && (
                                            <div className="absolute z-50 w-full mt-1 bg-white border border-[#ece7e2] rounded-2xl shadow-xl overflow-hidden">
                                                {DOMAINS.map((domain) => {
                                                    const isSelected = watchedDomains?.includes(domain);
                                                    const isDisabled = !isSelected && (watchedDomains?.length || 0) >= 5;

                                                    return (
                                                        <button
                                                            key={domain}
                                                            type="button"
                                                            disabled={isDisabled}
                                                            onClick={() => {
                                                                const current = watchedDomains || [];
                                                                const updated = isSelected
                                                                    ? current.filter((d) => d !== domain)
                                                                    : [...current, domain];
                                                                setValue('domains', updated, { shouldValidate: true });
                                                            }}
                                                            className={`w-full px-4 py-3 text-left text-sm font-medium flex items-center justify-between transition-colors
              ${isSelected ? 'bg-[#f8f6f4] text-[#4a3728]' : 'text-slate-600 hover:bg-[#f8f6f4]'}
              ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
            `}
                                                        >
                                                            <span>{DOMAIN_LABELS[domain]}</span>
                                                            {isSelected && (
                                                                <svg className="w-4 h-4 text-[#4a3728]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {errors.domains && (
                                            <p className="text-red-500 text-xs mt-1">{errors.domains.message}</p>
                                        )}
                                    </div>
                                </div>

                                {/* CHANGE: Skills — tag input */}
                                <div>
                                    <label className="block text-sm font-bold text-[#4a3728] mb-2">
                                        Skills * <span className="text-slate-400 font-normal">(press Enter to add)</span>
                                    </label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {watchedSkills?.map((skill) => (
                                            <span
                                                key={skill}
                                                className="px-3 py-1 bg-[#4a3728] text-white rounded-xl text-xs font-bold flex items-center gap-1"
                                            >
                                                {skill}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setValue(
                                                            'skills',
                                                            watchedSkills.filter((s) => s !== skill),
                                                            { shouldValidate: true }
                                                        );
                                                    }}
                                                    className="hover:text-red-300"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        value={skillInput}
                                        onChange={(e) => setSkillInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const trimmed = skillInput.trim();
                                                if (trimmed && !watchedSkills?.includes(trimmed) && (watchedSkills?.length || 0) < 20) {
                                                    setValue('skills', [...(watchedSkills || []), trimmed], { shouldValidate: true });
                                                    setSkillInput('');
                                                }
                                            }
                                        }}
                                        placeholder="Type a skill and press Enter..."
                                        className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium"
                                    />
                                    {errors.skills && (
                                        <p className="text-red-500 text-xs mt-1">{errors.skills.message}</p>
                                    )}
                                </div>

                                {/* CHANGE: Bio textarea */}
                                <div>
                                    <label className="block text-sm font-bold text-[#4a3728] mb-2">
                                        Bio / About You *
                                        <span className="text-slate-400 font-normal ml-1">(min 50 chars)</span>
                                    </label>
                                    <textarea
                                        {...register('bio')}
                                        rows={4}
                                        placeholder="Tell us about your journey, achievements..."
                                        className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium resize-none"
                                    />
                                    {errors.bio && (
                                        <p className="text-red-500 text-xs mt-1">{errors.bio.message}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Mentorship Preferences */}
                        {formStep === 3 && (
                            <div className="space-y-6">
                                <h3 className="text-2xl font-black text-[#4a3728] mb-6">
                                    Mentorship Preferences
                                </h3>

                                <div>
                                    <label className="block text-sm font-bold text-[#4a3728] mb-2">
                                        Why do you want to become a mentor?
                                    </label>
                                    <textarea
                                        rows={4}
                                        placeholder="Share your motivation and goals..."
                                        className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium resize-none"
                                    />
                                </div>

                                {/* {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl p-6"
                                >
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="accent-[#4a3728] w-5 h-5 mt-0.5"
                                        />
                                        <span className="text-xs text-slate-600 font-medium leading-relaxed">
                                            I agree to the terms and conditions and confirm that all
                                            information provided is accurate. I understand that my profile
                                            will be reviewed before being published.
                                        </span>
                                    </label>
                                </div>
                            ))} */}
                                {[
                                    "I agree to the mentorship platform's terms and conditions.",
                                    "I confirm that all information provided is accurate and truthful.",
                                    "I understand that my profile will be reviewed before being published."
                                ].map((text, i) => (
                                    <div key={i} className="bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl p-6">
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={agreements[i]}
                                                onChange={(e) => {
                                                    const updated = [...agreements];
                                                    updated[i] = e.target.checked;
                                                    setAgreements(updated);
                                                    setAgreementError(false);
                                                }}
                                                className="accent-[#4a3728] w-5 h-5 mt-0.5"
                                            />
                                            <span className="text-xs text-slate-600 font-medium leading-relaxed">
                                                {text}
                                            </span>
                                        </label>
                                    </div>
                                ))}

                                {/* Agreement error show karo */}
                                {agreementError && (
                                    <p className="text-red-500 text-sm font-medium">
                                        Please agree to all terms before submitting.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* ADD HERE — buttons div se upar */}
                        {submitError && (
                            <p className="text-red-500 text-sm font-medium text-center mt-3">
                                {submitError}
                            </p>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between mt-10 pt-6 border-t border-[#ece7e2]">
                            <div className="flex items-center gap-3">
                                {formStep > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setFormStep(formStep - 1)}
                                        className="px-6 py-3 bg-[#f8f6f4] text-[#4a3728] rounded-2xl font-bold text-sm hover:bg-[#ece7e2] transition-all"
                                    >
                                        Back
                                    </button>
                                )}

                                <button
                                    type="button"
                                    className="px-6 py-3 bg-white border-2 border-[#4a3728] text-[#4a3728] rounded-2xl font-bold text-sm hover:bg-[#f8f6f4] transition-all flex items-center gap-2">
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        />
                                    </svg>
                                    Edit
                                </button>
                            </div>

                            {formStep < 3 ? (

                                <button
                                    type="button"
                                    onClick={
                                        handleNext
                                        // () => {
                                        //     handleNext
                                        //     setFormStep(formStep + 1)
                                        // }
                                    }
                                    className="px-8 py-3 bg-[#4a3728] text-white rounded-2xl font-bold text-sm hover:bg-[#8b7355] transition-all flex items-center gap-2"
                                >
                                    Next Step
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            ) : (

                                //     <button
                                //         // onClick={() => router.push(`/mentorship/${currentUserId}/mentorProfile`)}
                                //         onClick={() => router.push(`/mentorship/mentorProfile`)}
                                //         // onClick={()=>

                                //         // }
                                //         className="px-8 py-3 bg-gradient-to-r from-[#4a3728] to-[#7a5c3e] text-white rounded-2xl font-bold text-sm hover:shadow-xl transition-all flex items-center gap-2">
                                //         Submit Application

                                //         <CheckCircle2 className="w-4 h-4" />
                                //     </button>
                                //
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-8 py-3 bg-gradient-to-r from-[#4a3728] to-[#7a5c3e] text-white rounded-2xl font-bold text-sm hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                                    <CheckCircle2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}