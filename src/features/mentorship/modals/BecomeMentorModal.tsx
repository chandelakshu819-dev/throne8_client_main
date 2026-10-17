"use client";
import React, { useState, useEffect } from "react";

import { X, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { createMentorSchema } from "@/features/mentorship/validators/mentor.validation";
import MentorService from "@/lib/api/mentorship.service";
import { useScrollLock } from "@/hooks/useScrollLock";
import { DOMAINS, DOMAIN_LABELS, EXPERIENCE_OPTIONS, searchDomains } from "@/features/mentorship/constants/mentorship";
import { CreateMentorFormData } from "@/features/mentorship/types/mentorship.types";
import { useProfileData } from "@/features/profile/hooks/useProfileData";
import { useExperienceData } from "@/features/profile/hooks/useExperienceData";
import { useEducationData } from "@/features/profile/hooks/useEducationData";
import AutocompleteInput from "@/features/mentorship/components/shared/AutocompleteInput";
import { useFieldSuggestions } from "@/features/mentorship/hooks/useFieldSuggestions";


import {
    ROLE_SUGGESTIONS,
    COMPANY_SUGGESTIONS,
    COLLEGE_SUGGESTIONS,
    DEGREE_SUGGESTIONS,
    BRANCH_SUGGESTIONS,
    SKILL_SUGGESTIONS,
} from "@/features/mentorship/constants/suggestions";




const inputClass =
    "w-full px-4 py-2.5 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium";

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
    profileImage,
    setFormStep,
}: BecomeMentorModalProps) {
    const router = useRouter();
    const { user } = useAuth();

    const {
        userProfileData,
        fetchUserProfile,
        profileError: hookProfileError,
    } = useProfileData();
    const { experienceList, fetchExperienceData } = useExperienceData();
    const { educationList, fetchEducationData } = useEducationData();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [agreements, setAgreements] = useState([false, false, false]);
    const [agreementError, setAgreementError] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [domainInput, setDomainInput] = useState('');
    

    const [profilePicPreview, setProfilePicPreview] = useState<string>(profileImage);
    const [skillInput, setSkillInput] = useState('');
    const [isProfileLoading, setIsProfileLoading] = useState(true);
    const [profileLoadError, setProfileLoadError] = useState(false);

    const {
        register,
        handleSubmit,
        trigger,
        watch,
        setValue,
        getValues,
        formState: { errors },
    } = useForm<CreateMentorFormData>({
        resolver: zodResolver(createMentorSchema),
        defaultValues: {
            skills: [],
            domains: [],
            company: '',
            college: '',
            degree: '',
            branch: '',
        },
    });

    const watchedSkills = watch('skills');
    const watchedDomains = watch('domains');
    const domainOptions = searchDomains(domainInput).map((d) => DOMAIN_LABELS[d]);
    const roleOptions = useFieldSuggestions('role', watch('currentRole') || '', ROLE_SUGGESTIONS);
    const companyOptions = useFieldSuggestions('company', watch('company') || '', COMPANY_SUGGESTIONS);
    const collegeOptions = useFieldSuggestions('college', watch('college') || '', COLLEGE_SUGGESTIONS);
    const degreeOptions = useFieldSuggestions('degree', watch('degree') || '', DEGREE_SUGGESTIONS);
    const branchOptions = useFieldSuggestions('branch', watch('branch') || '', BRANCH_SUGGESTIONS);
    const skillOptions = useFieldSuggestions('skills', skillInput, SKILL_SUGGESTIONS);



    // Fetch profile + education
    useEffect(() => {
        if (user?.userId) {
            fetchUserProfile(user.userId);
            fetchEducationData();
        }
    }, [user, fetchUserProfile, fetchEducationData]);

    // Fetch experience once profile arrives
    useEffect(() => {
        if (userProfileData) {
            const experienceIds =
                (userProfileData as any)?.experienceIds ||
                (userProfileData as any)?.onboarding?.experienceIds ||
                [];

            if (experienceIds.length > 0) {
                fetchExperienceData(experienceIds);
            }
            setIsProfileLoading(false);
            setProfileLoadError(false);
        }
    }, [userProfileData, fetchExperienceData]);

    // Hook error -> stop loading immediately
    useEffect(() => {
        if (isOpen && hookProfileError) {
            console.warn('[BecomeMentorModal] Profile fetch failed:', hookProfileError);
            setIsProfileLoading(false);
            setProfileLoadError(true);
        }
    }, [isOpen, hookProfileError]);

    // Safety timeout so loading never sticks forever
    useEffect(() => {
        if (!isOpen || !isProfileLoading) return;
        const timeoutId = setTimeout(() => {
            setIsProfileLoading((prev) => {
                if (prev) {
                    console.warn('[BecomeMentorModal] Profile fetch timed out after 8s');
                    setProfileLoadError(true);
                }
                return false;
            });
        }, 8000);
        return () => clearTimeout(timeoutId);
    }, [isOpen, isProfileLoading]);

    // Convert existing profile image URL into a File for the form
    useEffect(() => {
        if (isOpen && profileImage) {
            const convertUrlToFile = async () => {
                try {
                    const response = await fetch(profileImage);
                    const blob = await response.blob();
                    const file = new File([blob], 'profile-pic.jpg', { type: blob.type || 'image/jpeg' });
                    setValue('profilePic', file, { shouldValidate: false });
                } catch (error) {
                    console.error('Failed to convert profile pic:', error);
                }
            };
            convertUrlToFile();
        }
    }, [isOpen, profileImage, setValue]);

    // Reset loading state on open
    useEffect(() => {
        if (isOpen) {
            if (userProfileData) {
                setIsProfileLoading(false);
            } else {
                setIsProfileLoading(true);
                setProfileLoadError(false);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const currentRole = experienceList?.find(exp => exp.current)?.position ||
        experienceList?.[0]?.position ||
        userProfileData?.onboarding?.workingProfile?.jobTitle ||
        '';

    const currentCompany = experienceList?.find(exp => exp.current)?.company ||
        experienceList?.[0]?.company ||
        userProfileData?.onboarding?.workingProfile?.companyName ||
        '';

    // Prefill role
    useEffect(() => {
        if (currentRole) {
            setValue('currentRole', currentRole, { shouldValidate: false });
        }
    }, [currentRole, setValue]);

    // Prefill company (only if user has not typed anything)
    useEffect(() => {
        if (currentCompany && !getValues('company')) {
            setValue('company', currentCompany, { shouldValidate: false });
        }
    }, [currentCompany, setValue, getValues]);

        // Prefill college / degree / branch:
    // 1) profile ki Education entry, 2) signup ki details (onboarding.studentProfile)
    useEffect(() => {
        const edu: any = educationList?.[0];
        const sp = userProfileData?.onboarding?.studentProfile;
        if (!edu && !sp) return;

        // signup normalize karke 'Other' bhej deta hai, use prefill mat karo
        const clean = (v: any) => (v && String(v) !== 'Other' ? String(v) : '');

        const college = clean(
            edu?.school || edu?.college || edu?.institution || edu?.schoolName || edu?.collegeName || sp?.collegeName
        );
        const degree = clean(edu?.degree || edu?.degreeName || sp?.degree);
        const branch = clean(edu?.fieldOfStudy || edu?.branch || edu?.field || edu?.major || sp?.fieldOfStudy);

        if (college && !getValues('college')) setValue('college', college, { shouldValidate: false });
        if (degree && !getValues('degree')) setValue('degree', degree, { shouldValidate: false });
        if (branch && !getValues('branch')) setValue('branch', branch, { shouldValidate: false });
    }, [educationList, userProfileData, setValue, getValues]);

    const fullName = userProfileData
        ? [userProfileData.firstName, userProfileData.lastName].filter(Boolean).join(' ').trim()
        : '';
    const email = userProfileData?.email || '';
    const location = userProfileData?.location || '';

    useScrollLock(isOpen);

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
            isValid = await trigger([
                'bio',
                'skills',
                'domains',
                'experienceTotal',
                'currentRole',
                'company',
                'college',
                'degree',
                'branch',
            ]);
        }

        if (isValid) setFormStep(formStep + 1);
    };

    const onSubmit = async (formData: CreateMentorFormData) => {
        if (!agreements.every(Boolean)) {
            setAgreementError(true);
            return;
        }
        setAgreementError(false);

        try {
            setIsSubmitting(true);
            setSubmitError(null);

            const response = await MentorService.createMentor({
                title: formData.title,
                bio: formData.bio,
                domains: formData.domains,
                skills: formData.skills,
                experienceTotal: formData.experienceTotal,
                currentRole: formData.currentRole,
                company: formData.company,
                college: formData.college,
                degree: formData.degree,
                branch: formData.branch,
                linkedinUrl: formData.linkedinUrl,
                githubUrl: formData.githubUrl,
                profilePic: formData.profilePic,
            });

            MentorService.invalidateRolesCache();
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

    return (
        <>
            {(isSubmitting || isRedirecting) && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ width: '64px', height: '64px', border: '4px solid rgba(255,255,255,0.3)', borderTop: '4px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <p style={{ color: 'white', fontWeight: 'bold', fontSize: '14px', letterSpacing: '0.05em' }}>Creating your profile...</p>
                </div>
            )}
            <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-start justify-center p-4 animate-fade-in overflow-y-auto"
                onClick={handleClose}
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        // Enter key on steps 1-2 should go to the next step, not submit
                        if (formStep < 3) {
                            handleNext();
                            return;
                        }
                        handleSubmit(onSubmit, (errs) => {
                            console.log("Validation errors:", errs);
                        })();
                    }}
                    className="bg-white rounded-[28px] max-w-2xl w-full relative shadow-2xl animate-slide-up-modal my-2"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close Button */}
                    <button
                        type="button"
                        onClick={handleClose}
                        aria-label="Close"
                        className="absolute top-6 right-6 w-10 h-10 bg-[#f8f6f4] hover:bg-[#4a3728] text-[#4a3728] hover:text-white rounded-full flex items-center justify-center transition-all z-30"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Header */}
                    <div className="bg-gradient-to-br from-[#4a3728] to-[#7a5c3e] p-6 rounded-t-[28px] text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                        <div className="relative z-10">
                        <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                        <Users className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-black mb-1">Become a Mentor</h2>
                            <p className="text-white/80 font-medium">
                                Share your expertise and inspire the next generation
                            </p>
                            <div className="mt-4 flex items-center gap-2">
                                {[1, 2, 3].map((step) => (
                                    <div
                                        key={step}
                                        className={`h-1.5 rounded-full flex-1 transition-all ${formStep >= step ? "bg-white" : "bg-white/30"}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className="p-6">
                        {/* Step 1: Personal Information */}
                        {formStep === 1 && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-black text-[#4a3728] mb-4">
                                    Personal Information
                                </h3>

                                <div>
                                    <label className="block text-sm font-bold text-[#4a3728] mb-2">
                                        Profile Photo *
                                    </label>

                                    <div className="relative w-24 h-24 group cursor-pointer">
                                        <img
                                            src={profilePicPreview || profileImage}
                                            alt="Profile"
                                            className="w-full h-full rounded-2xl border-4 border-white shadow-xl object-cover transition-all duration-500 group-hover:shadow-2xl group-hover:scale-105"
                                        />
                                        <input
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
                                        <label
                                            htmlFor="profilePicInput"
                                            className={
                                                profilePicPreview
                                                    ? "absolute inset-0 flex flex-col items-center justify-center gap-1 bg-white/90 rounded-2xl cursor-pointer transition-all duration-300 opacity-0 group-hover:opacity-100"
                                                    : "absolute inset-0 flex flex-col items-center justify-center gap-1 bg-white/90 rounded-2xl cursor-pointer transition-all duration-300"
                                            }
                                        >
                                            <p className="text-xs font-bold text-[#4a3728] text-center px-2">
                                                {profilePicPreview ? "Change photo" : "Click to upload"}
                                            </p>
                                        </label>
                                    </div>
                                    {errors.profilePic && (
                                        <p className="text-red-500 text-xs mt-1">{errors.profilePic.message as string}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">Full Name *</label>
                                        <input
                                            type="text"
                                            value={fullName}
                                            readOnly
                                            className="w-full px-4 py-3 bg-[#ece7e2] border border-[#ece7e2] rounded-2xl text-sm font-medium cursor-default opacity-75"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">Email Address *</label>
                                        <input
                                            type="email"
                                            value={email}
                                            readOnly
                                            className="w-full px-4 py-3 bg-[#ece7e2] border border-[#ece7e2] rounded-2xl text-sm font-medium cursor-not-allowed opacity-75"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">Location *</label>
                                        <input
                                            type="text"
                                            value={location}
                                            readOnly
                                            className="w-full px-4 py-3 bg-[#ece7e2] border border-[#ece7e2] rounded-2xl text-sm font-medium cursor-not-allowed opacity-75"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">LinkedIn URL *</label>
                                        <input
                                            {...register('linkedinUrl')}
                                            type="url"
                                            placeholder="https://linkedin.com/in/johndoe"
                                            className={inputClass}
                                        />
                                        {errors.linkedinUrl && (
                                            <p className="text-red-500 text-xs mt-1">{errors.linkedinUrl.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[#4a3728] mb-2">Mentor Title *</label>
                                    <input
                                        {...register('title')}
                                        type="text"
                                        placeholder="e.g. Senior Software Engineer & Tech Mentor"
                                        className={inputClass}
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
                                    {/* Current Role */}
                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">Current Role *</label>
                                        <AutocompleteInput
    value={watch('currentRole') || ''}
    onChange={(v) => setValue('currentRole', v, { shouldValidate: false })}
    onSelect={(v) => setValue('currentRole', v, { shouldValidate: true })}
    suggestions={roleOptions}
    placeholder="Senior Software Engineer"
    className={inputClass}
/>
                                        {errors.currentRole && (
                                            <p className="text-red-500 text-xs mt-1">{errors.currentRole.message as string}</p>
                                        )}
                                    </div>

                                    {/* Company */}
                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">Company *</label>
                                        <AutocompleteInput
    value={watch('company') || ''}
    onChange={(v) => setValue('company', v, { shouldValidate: false })}
    onSelect={(v) => setValue('company', v, { shouldValidate: true })}
    suggestions={companyOptions}
    placeholder="Google"
    className={inputClass}
/>
                                        {errors.company && (
                                            <p className="text-red-500 text-xs mt-1">{errors.company.message as string}</p>
                                        )}
                                    </div>

                                    {/* College */}
                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">College / University *</label>
                                        <AutocompleteInput
    value={watch('college') || ''}
    onChange={(v) => setValue('college', v, { shouldValidate: false })}
    onSelect={(v) => setValue('college', v, { shouldValidate: true })}
    suggestions={collegeOptions}
    placeholder="IIT Bombay"
    className={inputClass}
/>
                                        {errors.college && (
                                            <p className="text-red-500 text-xs mt-1">{errors.college.message as string}</p>
                                        )}
                                    </div>

                                    {/* Degree */}
                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">Degree *</label>
                                        <AutocompleteInput
    value={watch('degree') || ''}
    onChange={(v) => setValue('degree', v, { shouldValidate: false })}
    onSelect={(v) => setValue('degree', v, { shouldValidate: true })}
    suggestions={degreeOptions}
    placeholder="B.Tech"
    className={inputClass}
/>
                                        {errors.degree && (
                                            <p className="text-red-500 text-xs mt-1">{errors.degree.message as string}</p>
                                        )}
                                    </div>

                                    {/* Branch */}
                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">Branch *</label>
                                        <AutocompleteInput
    value={watch('branch') || ''}
    onChange={(v) => setValue('branch', v, { shouldValidate: false })}
    onSelect={(v) => setValue('branch', v, { shouldValidate: true })}
    suggestions={branchOptions}
    placeholder="Computer Science"
    className={inputClass}
/>
                                        {errors.branch && (
                                            <p className="text-red-500 text-xs mt-1">{errors.branch.message as string}</p>
                                        )}
                                    </div>

                                    {/* Years of Experience */}
                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">Years of Experience *</label>
                                        <select
                                            {...register('experienceTotal', { valueAsNumber: true })}
                                            className={inputClass}
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

                                                                       {/* Domains */}
                                                                       <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">
                                            Domains * <span className="text-slate-400 font-normal">(max 5, type to search e.g. react, dsa, aws)</span>
                                        </label>

                                        {watchedDomains?.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-2">
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
                                                            className="hover:text-red-300"
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <AutocompleteInput
                                            value={domainInput}
                                            onChange={setDomainInput}
                                            suggestions={domainOptions}
                                            excludeValues={(watchedDomains || []).map((d) => DOMAIN_LABELS[d])}
                                            skipFilter
                                            clearOnSelect
                                            maxResults={10}
                                            onSelect={(label) => {
                                                const domain = DOMAINS.find((d) => DOMAIN_LABELS[d] === label);
                                                if (domain && !watchedDomains?.includes(domain) && (watchedDomains?.length || 0) < 5) {
                                                    setValue('domains', [...(watchedDomains || []), domain], { shouldValidate: true });
                                                }
                                            }}
                                            onEnterFreeText={(trimmed) => {
                                                // Enter dabane par pehla matching domain add ho jaye
                                                const first = searchDomains(trimmed).find((d) => !watchedDomains?.includes(d));
                                                if (trimmed && first && (watchedDomains?.length || 0) < 5) {
                                                    setValue('domains', [...(watchedDomains || []), first], { shouldValidate: true });
                                                    setDomainInput('');
                                                }
                                            }}
                                            placeholder="Type a domain, e.g. react, dsa, aws..."
                                            className={inputClass}
                                        />

                                        {errors.domains && (
                                            <p className="text-red-500 text-xs mt-1">{errors.domains.message}</p>
                                        )}
                                    </div>
                                </div>{/* closes grid */}

                                {/* Skills */}

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

                                    <AutocompleteInput
                                        value={skillInput}
                                        onChange={setSkillInput}
                                        suggestions={skillOptions}
                                        excludeValues={watchedSkills || []}
                                        clearOnSelect
                                        onSelect={(skill) => {
                                            if ((watchedSkills?.length || 0) < 20 && !watchedSkills?.includes(skill)) {
                                                setValue('skills', [...(watchedSkills || []), skill], { shouldValidate: true });
                                            }
                                        }}
                                        onEnterFreeText={(trimmed) => {
                                            if (trimmed && !watchedSkills?.some((x) => x.toLowerCase() === trimmed.toLowerCase()) && (watchedSkills?.length || 0) < 20) {
                                                setValue('skills', [...(watchedSkills || []), trimmed], { shouldValidate: true });
                                                setSkillInput('');
                                            }
                                        }}
                                        placeholder="Type a skill and press Enter..."
                                        className={inputClass}
                                    />

                                    {errors.skills && (
                                        <p className="text-red-500 text-xs mt-1">{errors.skills.message}</p>
                                    )}
                                </div>
                                {/* Bio */}
                                <div>
                                    <label className="block text-sm font-bold text-[#4a3728] mb-2">
                                        Bio / About You *
                                        <span className="text-slate-400 font-normal ml-1">(min 50 chars)</span>
                                    </label>
                                    <textarea
                                        {...register('bio')}
                                        rows={4}
                                        placeholder="Tell us about your journey, achievements..."
                                        className={`${inputClass} resize-none`}
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
                                        className={`${inputClass} resize-none`}
                                    />
                                </div>

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

                                {agreementError && (
                                    <p className="text-red-500 text-sm font-medium">
                                        Please agree to all terms before submitting.
                                    </p>
                                )}
                            </div>
                        )}

                        {submitError && (
                            <p className="text-red-500 text-sm font-medium text-center mt-3">
                                {submitError}
                            </p>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#ece7e2]">
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
                            </div>

                            {formStep < 3 ? (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="px-8 py-3 bg-[#4a3728] text-white rounded-2xl font-bold text-sm hover:bg-[#8b7355] transition-all flex items-center gap-2"
                                >
                                    Next Step
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            ) : (
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