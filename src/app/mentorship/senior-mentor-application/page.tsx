"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    ArrowLeft,
    Upload,
    CheckCircle2,
    X,
    Loader2,
    FileText,
    Image as ImageIcon,
    Users,
    GraduationCap,
    Award
} from "lucide-react";
import SeniorMentorApplicationService, {
    SeniorMentorApplication,
    ApplicationStatus
} from "@/lib/api/seniorMentorApplication.service";

// ============================================================================
// 1. Enums and Select Options (Mirrored from Backend)
// ============================================================================

enum ExperienceLevel {
    JUNIOR = 'junior',
    MID = 'mid',
    SENIOR = 'senior',
    LEAD = 'lead',
    PRINCIPAL = 'principal',
    ARCHITECT = 'architect',
}

enum Domain {
    WEB_DEVELOPMENT = 'web_development',
    MOBILE_DEVELOPMENT = 'mobile_development',
    DATA_SCIENCE = 'data_science',
    MACHINE_LEARNING = 'machine_learning',
    DEVOPS = 'devops',
    CLOUD_COMPUTING = 'cloud_computing',
    CYBERSECURITY = 'cybersecurity',
    BLOCKCHAIN = 'blockchain',
    UI_UX_DESIGN = 'ui_ux_design',
    PRODUCT_MANAGEMENT = 'product_management',
    DIGITAL_MARKETING = 'digital_marketing',
    BUSINESS_ANALYTICS = 'business_analytics',
    CAREER_GUIDANCE = 'career_guidance',
    INTERVIEW_PREP = 'interview_prep',
    LEADERSHIP = 'leadership',
}

enum MentorshipHelpArea {
    DSA_PROBLEM_SOLVING = 'dsa_problem_solving',
    DEVELOPMENT_CODING = 'development_coding',
    PROJECT_GUIDANCE = 'project_guidance',
    RESUME_LINKEDIN = 'resume_linkedin',
    INTERVIEW_PREPARATION = 'interview_preparation',
    PLACEMENT_PREPARATION = 'placement_preparation',
    CAREER_GUIDANCE = 'career_guidance',
}

// ============================================================================
// 2. Zod Schema
// ============================================================================

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const createSchema = z.object({
    // Step 1: Basic Profile
    mentorRole: z.enum(['senior_mentor', 'alumni'], { required_error: "Role is required" }),
    fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
    profilePhotoFile: z.any().refine((file) => file instanceof File, "Profile photo is required")
        .refine((file: File) => file && file.size <= MAX_FILE_SIZE, "Max file size is 5MB")
        .refine((file: File) => file && ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type), "Only .jpg, .jpeg, .png formats are supported"),
    college: z.string().min(1, "College/University is required").max(200),
    degree: z.string().min(1, "Degree is required").max(100),
    fieldOfStudy: z.string().min(1, "Field of study is required").max(100),
    graduationYear: z.number({ invalid_type_error: "Must be a valid year" }).min(1980).max(new Date().getFullYear() + 10),
    currentRole: z.string().min(1, "Current role is required").max(100),
    currentCompany: z.string().min(1, "Current company is required").max(100),
    shortBio: z.string().min(50, "Bio must be at least 50 characters").max(1000),

    // Step 2: Professional
    linkedinUrl: z.string().regex(/^https?:\/\/(www\.)?linkedin\.com\/.+/i, "Invalid LinkedIn URL"),
    githubUrl: z.string().regex(/^https?:\/\/(www\.)?github\.com\/.+/i, "Invalid GitHub URL").optional().or(z.literal('')),
    portfolioUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
    yearsOfExperience: z.number({ invalid_type_error: "Must be a valid number" }).min(0).max(50),
    experienceLevel: z.nativeEnum(ExperienceLevel, { errorMap: () => ({ message: "Select an experience level" }) }),
    primaryExpertise: z.nativeEnum(Domain, { errorMap: () => ({ message: "Select primary expertise" }) }),

    // Step 3: Skills & Mentorship
    otherSkills: z.array(z.string()).max(20, "Max 20 skills allowed"),
    technologies: z.array(z.string()).max(30, "Max 30 technologies allowed"),
    achievements: z.array(z.string()).max(15, "Max 15 achievements allowed"),
    certifications: z.array(z.string()).max(15, "Max 15 certifications allowed"),
    helpAreas: z.array(z.nativeEnum(MentorshipHelpArea)).min(1, "Select at least 1 help area").max(7, "Select up to 7 help areas"),

    // Step 4: Motivation
    motivation: z.string().min(30, "Please write at least 30 characters").max(1000),
    adviceToJuniorSelf: z.string().min(10, "Please write at least 10 characters").max(500),

    // Step 5: Verification
    resumeFile: z.any().refine((file) => file instanceof File, "Resume is required")
        .refine((file: File) => file && file.size <= MAX_FILE_SIZE, "Max file size is 5MB")
        .refine((file: File) => file && ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type), "Only .pdf, .doc, .docx formats supported"),
    proofDocumentFile: z.any().refine((file) => file instanceof File, "Proof of experience is required")
        .refine((file: File) => file && file.size <= MAX_FILE_SIZE, "Max file size is 5MB")
        .refine((file: File) => file && ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(file.type), "Only .pdf, .jpg, .jpeg, .png formats supported"),
});

type FormValues = z.infer<typeof createSchema>;

// Helpers
const steps = [
    { id: 1, title: 'Profile', fields: ['mentorRole', 'fullName', 'profilePhotoFile', 'college', 'degree', 'fieldOfStudy', 'graduationYear', 'currentRole', 'currentCompany', 'shortBio'] },
    { id: 2, title: 'Professional', fields: ['linkedinUrl', 'githubUrl', 'portfolioUrl', 'yearsOfExperience', 'experienceLevel', 'primaryExpertise'] },
    { id: 3, title: 'Skills', fields: ['otherSkills', 'technologies', 'achievements', 'certifications', 'helpAreas'] },
    { id: 4, title: 'Motivation', fields: ['motivation', 'adviceToJuniorSelf'] },
    { id: 5, title: 'Verification', fields: ['resumeFile', 'proofDocumentFile'] },
];

export default function SeniorMentorApplicationPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [existingApplication, setExistingApplication] = useState<SeniorMentorApplication | null>(null);
    const [isLoadingInit, setIsLoadingInit] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState(false);

    const { register, handleSubmit, trigger, formState: { errors }, setValue, watch } = useForm<FormValues>({
        resolver: zodResolver(createSchema),
        defaultValues: {
            mentorRole: undefined,
            otherSkills: [],
            technologies: [],
            achievements: [],
            certifications: [],
            helpAreas: [],
        }
    });

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const app = await SeniorMentorApplicationService.getMyApplication();
                if (app) {
                    const profileUserId = app.userId;
                    router.push(`/mentorship/senior-mentor-profile/${profileUserId}`);
                    return; // Prevent state updates and skip to redirect immediately
                }
            } catch (err) {
                console.error("Error fetching application status", err);
            } finally {
                setIsLoadingInit(false);
            }
        };
        fetchStatus();
    }, [router]);

    const handleNext = async () => {
        const stepFields = steps.find(s => s.id === currentStep)?.fields as (keyof FormValues)[];
        const isValid = await trigger(stepFields);
        if (isValid) {
            setCurrentStep(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePrev = () => {
        setCurrentStep(prev => prev - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const onSubmit = async (data: FormValues) => {
        setErrorMsg('');
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('mentorRole', data.mentorRole);
            formData.append('fullName', data.fullName);
            if (data.profilePhotoFile) formData.append('profilePhoto', data.profilePhotoFile);
            formData.append('college', data.college);
            formData.append('degree', data.degree);
            formData.append('fieldOfStudy', data.fieldOfStudy);
            formData.append('graduationYear', data.graduationYear.toString());
            formData.append('currentRole', data.currentRole);
            formData.append('currentCompany', data.currentCompany);
            formData.append('shortBio', data.shortBio);
            
            formData.append('linkedinUrl', data.linkedinUrl);
            if (data.githubUrl) formData.append('githubUrl', data.githubUrl);
            if (data.portfolioUrl) formData.append('portfolioUrl', data.portfolioUrl);
            formData.append('yearsOfExperience', data.yearsOfExperience.toString());
            formData.append('experienceLevel', data.experienceLevel);
            formData.append('primaryExpertise', data.primaryExpertise);

            // Arrays
            if (data.otherSkills?.length) formData.append('otherSkills', JSON.stringify(data.otherSkills));
            if (data.technologies?.length) formData.append('technologies', JSON.stringify(data.technologies));
            if (data.achievements?.length) formData.append('achievements', JSON.stringify(data.achievements));
            if (data.certifications?.length) formData.append('certifications', JSON.stringify(data.certifications));
            if (data.helpAreas?.length) formData.append('helpAreas', JSON.stringify(data.helpAreas));

            formData.append('motivation', data.motivation);
            formData.append('adviceToJuniorSelf', data.adviceToJuniorSelf);

            if (data.resumeFile) formData.append('resume', data.resumeFile);
            if (data.proofDocumentFile) formData.append('proofDocument', data.proofDocumentFile);

            const res = await SeniorMentorApplicationService.apply(formData);
            
            const createdUserId = res?.userId;
            
            if (createdUserId) {
                router.push(`/mentorship/senior-mentor-profile/${createdUserId}`);
            } else {
                setSuccessMsg(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (error: any) {
            if (error?.response?.status === 409) {
                setErrorMsg('You already have an active Senior Mentor application.');
            } else {
                setErrorMsg(error?.response?.data?.message || 'Failed to submit application. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingInit) {
        return (
            <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#4a3728] animate-spin" />
            </div>
        );
    }



    if (successMsg) {
        return (
            <div className="min-h-screen bg-[#FAF9F6] p-6 lg:p-12">
                <div className="max-w-2xl mx-auto bg-white p-10 rounded-[40px] shadow-2xl border border-[#ece7e2] mt-20 text-center">
                    <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                    <h2 className="text-3xl font-black text-[#4a3728] mb-3">Application Submitted!</h2>
                    <p className="text-slate-600 mb-10 max-w-sm mx-auto leading-relaxed">
                        Your Senior Mentor application has been submitted successfully and is currently pending review. We&apos;ll notify you once our team processes your request.
                    </p>
                    <button onClick={() => router.back()} className="px-8 py-3 bg-[#4a3728] text-white rounded-xl font-bold shadow hover:bg-[#7a5c3e] transition">
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Dynamic Tag Input Component adapted to BecomeMentor UI
    const TagInput = ({ fieldName, label, placeholder }: { fieldName: keyof FormValues, label: string, placeholder: string }) => {
        const [inputValue, setInputValue] = useState("");
        const tags = watch(fieldName) as string[] || [];

        const addTag = () => {
            const val = inputValue.trim();
            if (val && !tags.includes(val)) {
                setValue(fieldName, [...tags, val] as any, { shouldValidate: true });
                setInputValue("");
            }
        };

        const removeTag = (tagToRemove: string) => {
            setValue(fieldName, tags.filter((t: string) => t !== tagToRemove) as any, { shouldValidate: true });
        };

        return (
            <div>
                <label className="block text-sm font-bold text-[#4a3728] mb-2">{label} <span className="text-slate-400 font-normal">(press Add)</span></label>
                <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map((tag, i) => (
                        <span key={i} className="px-3 py-1 bg-[#4a3728] text-white rounded-xl text-xs font-bold flex items-center gap-1">
                            {tag}
                            <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-300 ml-1">
                                ×
                            </button>
                        </span>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                        placeholder={placeholder}
                        className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900"
                    />
                    <button type="button" onClick={addTag} className="px-5 bg-[#4a3728] text-white rounded-2xl font-bold hover:bg-[#7a5c3e] transition text-sm">
                        Add
                    </button>
                </div>
                {errors[fieldName] && <p className="text-red-500 text-xs mt-1">{errors[fieldName]?.message as string}</p>}
            </div>
        );
    };

    // File Input Component adapted to BecomeMentor UI
    const FileInput = ({ fieldName, label, accept, helpText, icon: Icon }: { fieldName: keyof FormValues, label: string, accept: string, helpText: string, icon: any }) => {
        const file = watch(fieldName) as File;
        return (
            <div>
                <label className="block text-sm font-bold text-[#4a3728] mb-2">{label}</label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#ece7e2] rounded-2xl cursor-pointer bg-[#f8f6f4] hover:bg-[#ece7e2] transition">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-[#8a7a6a]">
                        <Icon className="w-8 h-8 mb-2" />
                        <p className="mb-1 text-sm font-medium h-5 overflow-hidden w-full text-center px-4 whitespace-nowrap text-ellipsis">
                            {file ? <span className="text-[#4a3728] font-bold">{file.name}</span> : <>Click to upload <span className="font-normal opacity-70">or drag and drop</span></>}
                        </p>
                        <p className="text-xs">{helpText}</p>
                    </div>
                    <input
                        type="file"
                        className="hidden"
                        accept={accept}
                        onChange={(e) => {
                            if (e.target.files?.[0]) setValue(fieldName, e.target.files[0] as any, { shouldValidate: true });
                        }}
                    />
                </label>
                {errors[fieldName] && <p className="text-red-500 text-xs mt-1">{errors[fieldName]?.message as string}</p>}
            </div>
        );
    }

    const profilePhotoFile = watch('profilePhotoFile') as File;
    const profilePicPreview = profilePhotoFile ? URL.createObjectURL(profilePhotoFile) : '';

    return (
        <div className="min-h-screen bg-[#FAF9F6] flex items-start justify-center p-6 animate-fade-in overflow-y-auto">
            <div className="max-w-3xl w-full my-6 relative">
                <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-[40px] shadow-2xl relative">
                    
                    {/* Close Button */}
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="absolute top-6 right-6 w-10 h-10 bg-[#f8f6f4] hover:bg-[#4a3728] text-[#4a3728] hover:text-white rounded-full flex items-center justify-center transition-all z-20"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Header */}
                    <div className="bg-gradient-to-br from-[#4a3728] to-[#7a5c3e] p-10 rounded-t-[40px] text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                                <Users className="w-8 h-8" />
                            </div>
                            <h2 className="text-3xl font-black mb-2">Become a Senior Mentor</h2>
                            <p className="text-white/80 font-medium">
                                Empower the community with your advanced industry leadership
                            </p>
                            
                            {/* Progress Bar */}
                            <div className="mt-8">
                                <div className="flex items-center gap-2 mb-3">
                                    {[1, 2, 3, 4, 5].map((step) => (
                                        <div
                                            key={step}
                                            className={`h-1.5 rounded-full flex-1 transition-all ${
                                                currentStep >= step ? "bg-white" : "bg-white/30"
                                            }`}
                                        />
                                    ))}
                                </div>
                                <p className="text-white font-bold text-sm">
                                    Step {currentStep}: <span className="opacity-90 font-medium">{steps.find(s=>s.id===currentStep)?.title}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className="p-10">
                        {existingApplication && existingApplication.verificationStatus === ApplicationStatus.REJECTED && (
                            <div className="mb-8 bg-red-50 border border-red-200 text-red-700 px-6 py-5 rounded-2xl shadow-sm">
                                <h3 className="font-bold mb-1">Your previous application was returned</h3>
                                <p className="text-sm font-medium opacity-90">{existingApplication.rejectionReason || "Please update your details and submit again."}</p>
                            </div>
                        )}

                        {errorMsg && (
                            <div className="mb-8 bg-red-50 border border-red-200 text-red-600 px-5 py-4 rounded-xl flex items-center justify-between">
                                <span className="font-medium text-sm">{errorMsg}</span>
                                <button type="button" onClick={() => setErrorMsg('')} className="p-1 hover:bg-white rounded-full transition"><X className="w-4 h-4" /></button>
                            </div>
                        )}
                        
                        {/* ──────────────── STEP 1: Basic Profile ──────────────── */}
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <h3 className="text-2xl font-black text-[#4a3728] mb-6">Profile</h3>
                                
                                <div>
                                    <label className="block text-sm font-bold text-[#4a3728] mb-3">Which path best describes you? *</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className={`relative flex flex-col p-4 border-2 rounded-2xl cursor-pointer transition-all duration-300 group overflow-hidden ${watch('mentorRole') === 'senior_mentor' ? 'border-[#4a3728] bg-gradient-to-br from-[#f8f6f4] to-white shadow-md transform -translate-y-1' : 'border-[#ece7e2] bg-white hover:border-[#8a7a6a] hover:shadow-sm'}`}>
                                            <input type="radio" value="senior_mentor" {...register('mentorRole')} className="absolute opacity-0" />
                                            {watch('mentorRole') === 'senior_mentor' && (
                                                <div className="absolute top-4 right-4 text-[#4a3728]">
                                                    <CheckCircle2 className="w-5 h-5" />
                                                </div>
                                            )}
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors duration-300 ${watch('mentorRole') === 'senior_mentor' ? 'bg-[#4a3728] text-white shadow-md' : 'bg-[#f8f6f4] text-[#8a7a6a] group-hover:bg-[#ece7e2]'}`}>
                                                <Award className="w-5 h-5" />
                                            </div>
                                            <span className={`text-base font-black tracking-tight mb-0.5 transition-colors ${watch('mentorRole') === 'senior_mentor' ? 'text-[#4a3728]' : 'text-slate-700'}`}>Senior Mentor</span>
                                            <span className="text-xs text-slate-500 leading-relaxed font-medium">Currently associated with the college as a senior or active student.</span>
                                        </label>
                                        
                                        <label className={`relative flex flex-col p-4 border-2 rounded-2xl cursor-pointer transition-all duration-300 group overflow-hidden ${watch('mentorRole') === 'alumni' ? 'border-[#4a3728] bg-gradient-to-br from-[#f8f6f4] to-white shadow-md transform -translate-y-1' : 'border-[#ece7e2] bg-white hover:border-[#8a7a6a] hover:shadow-sm'}`}>
                                            <input type="radio" value="alumni" {...register('mentorRole')} className="absolute opacity-0" />
                                            {watch('mentorRole') === 'alumni' && (
                                                <div className="absolute top-4 right-4 text-[#4a3728]">
                                                    <CheckCircle2 className="w-5 h-5" />
                                                </div>
                                            )}
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors duration-300 ${watch('mentorRole') === 'alumni' ? 'bg-[#4a3728] text-white shadow-md' : 'bg-[#f8f6f4] text-[#8a7a6a] group-hover:bg-[#ece7e2]'}`}>
                                                <GraduationCap className="w-5 h-5" />
                                            </div>
                                            <span className={`text-base font-black tracking-tight mb-0.5 transition-colors ${watch('mentorRole') === 'alumni' ? 'text-[#4a3728]' : 'text-slate-700'}`}>Alumni</span>
                                            <span className="text-xs text-slate-500 leading-relaxed font-medium">Former student or graduate contributing industry expertise.</span>
                                        </label>
                                    </div>
                                    {errors.mentorRole && <p className="text-red-500 text-xs mt-2 font-medium flex items-center gap-1"><X className="w-3 h-3"/>{errors.mentorRole?.message as string}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[#4a3728] mb-2">
                                        Profile Photo *
                                    </label>
                                    <div className="relative w-36 h-36 group cursor-pointer bg-[#ece7e2] rounded-2xl flex items-center justify-center border-4 border-white shadow-xl transition-all duration-500 group-hover:shadow-2xl group-hover:scale-105 overflow-hidden">
                                        {profilePicPreview ? (
                                            <img
                                                src={profilePicPreview}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <ImageIcon className="w-10 h-10 text-slate-400" />
                                        )}
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/jpg"
                                            className="hidden"
                                            id="profilePicInput"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setValue('profilePhotoFile', file as any, { shouldValidate: true });
                                                }
                                            }}
                                        />
                                        <label
                                            htmlFor="profilePicInput"
                                            className={
                                                profilePicPreview
                                                    ? "absolute inset-0 flex flex-col items-center justify-center gap-1 bg-white/90 cursor-pointer transition-all duration-300 opacity-0 group-hover:opacity-100"
                                                    : "absolute inset-0 flex flex-col items-center justify-center gap-1 bg-white/80 cursor-pointer transition-all duration-300"
                                            }
                                        >
                                            <p className="text-xs font-bold text-[#4a3728] text-center px-2">
                                                {profilePicPreview ? "Change photo" : "Click to upload"}
                                            </p>
                                        </label>
                                    </div>
                                    {errors.profilePhotoFile && (
                                        <p className="text-red-500 text-xs mt-1">{errors.profilePhotoFile.message as string}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">Full Name *</label>
                                        <input type="text" {...register('fullName')} className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900" />
                                        {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">Graduation Year *</label>
                                        <input type="number" {...register('graduationYear', { valueAsNumber: true })} className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900" />
                                        {errors.graduationYear && <p className="text-red-500 text-xs mt-1">{errors.graduationYear.message}</p>}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">College / University *</label>
                                        <input type="text" {...register('college')} className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900" />
                                        {errors.college && <p className="text-red-500 text-xs mt-1">{errors.college.message}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">Degree *</label>
                                        <input type="text" {...register('degree')} placeholder="e.g. B.Tech" className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900" />
                                        {errors.degree && <p className="text-red-500 text-xs mt-1">{errors.degree.message}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">Field of Study *</label>
                                        <input type="text" {...register('fieldOfStudy')} placeholder="e.g. Computer Science" className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900" />
                                        {errors.fieldOfStudy && <p className="text-red-500 text-xs mt-1">{errors.fieldOfStudy.message}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">Current Role *</label>
                                        <input type="text" {...register('currentRole')} placeholder="e.g. Software Engineer" className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900" />
                                        {errors.currentRole && <p className="text-red-500 text-xs mt-1">{errors.currentRole.message}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">Current Company *</label>
                                        <input type="text" {...register('currentCompany')} className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900" />
                                        {errors.currentCompany && <p className="text-red-500 text-xs mt-1">{errors.currentCompany.message}</p>}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#4a3728] mb-2">Short Bio * <span className="text-slate-400 font-normal ml-1">(min 50 chars)</span></label>
                                    <textarea {...register('shortBio')} rows={4} placeholder="Briefly describe your background..." className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900 resize-none"></textarea>
                                    {errors.shortBio && <p className="text-red-500 text-xs mt-1">{errors.shortBio.message}</p>}
                                </div>
                            </div>
                        )}

                        {/* ──────────────── STEP 2: Professional ──────────────── */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <h3 className="text-2xl font-black text-[#4a3728] mb-6">Professional Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">LinkedIn URL *</label>
                                        <input type="url" {...register('linkedinUrl')} placeholder="https://linkedin.com/in/..." className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900" />
                                        {errors.linkedinUrl && <p className="text-red-500 text-xs mt-1">{errors.linkedinUrl.message}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">GitHub URL <span className="text-slate-400 font-normal ml-1">(Optional)</span></label>
                                        <input type="url" {...register('githubUrl')} placeholder="https://github.com/..." className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900" />
                                        {errors.githubUrl && <p className="text-red-500 text-xs mt-1">{errors.githubUrl.message}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">Portfolio URL <span className="text-slate-400 font-normal ml-1">(Optional)</span></label>
                                        <input type="url" {...register('portfolioUrl')} placeholder="https://yourwebsite.com" className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900" />
                                        {errors.portfolioUrl && <p className="text-red-500 text-xs mt-1">{errors.portfolioUrl.message}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">Years of Experience *</label>
                                        <input type="number" {...register('yearsOfExperience', { valueAsNumber: true })} className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900" />
                                        {errors.yearsOfExperience && <p className="text-red-500 text-xs mt-1">{errors.yearsOfExperience.message}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">Experience Level *</label>
                                        <select {...register('experienceLevel')} className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900">
                                            <option value="">Select Level</option>
                                            {Object.entries(ExperienceLevel).map(([key, value]) => (
                                                <option key={key} value={value}>{key.charAt(0) + key.slice(1).toLowerCase()} Level</option>
                                            ))}
                                        </select>
                                        {errors.experienceLevel && <p className="text-red-500 text-xs mt-1">{errors.experienceLevel.message}</p>}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">Primary Expertise *</label>
                                        <select {...register('primaryExpertise')} className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900">
                                            <option value="">Select Domain</option>
                                            {Object.values(Domain).map((d) => (
                                                <option key={d} value={d}>
                                                    {d.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.primaryExpertise && <p className="text-red-500 text-xs mt-1">{errors.primaryExpertise.message}</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ──────────────── STEP 3: Skills ──────────────── */}
                        {currentStep === 3 && (
                            <div className="space-y-8">
                                <h3 className="text-2xl font-black text-[#4a3728] mb-6">Skills & Mentorship Areas</h3>
                                
                                <TagInput fieldName="technologies" label="Technologies *" placeholder="e.g. React, Node.js" />
                                <TagInput fieldName="otherSkills" label="Other Skills *" placeholder="e.g. Agile, System Design" />
                                <TagInput fieldName="achievements" label="Achievements" placeholder="e.g. Outstanding Engineer Award 2023" />
                                <TagInput fieldName="certifications" label="Certifications" placeholder="e.g. AWS Certified Solutions Architect" />

                                <div>
                                    <label className="block text-sm font-bold text-[#4a3728] mb-4">Help Areas * <span className="text-slate-400 font-normal ml-1">(Select up to 7)</span></label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {Object.values(MentorshipHelpArea).map((area) => {
                                            const label = area.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                                            const checked = watch('helpAreas')?.includes(area);
                                            return (
                                                <label key={area} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${checked ? 'border-[#4a3728] bg-[#f8f6f4]' : 'border-[#ece7e2] hover:border-[#4a3728]'} `}>
                                                    <input 
                                                        type="checkbox" 
                                                        value={area}
                                                        {...register('helpAreas')}
                                                        className="w-4 h-4 text-[#4a3728] rounded focus:ring-[#4a3728]"
                                                    />
                                                    <span className={`text-sm font-bold ${checked ? 'text-[#4a3728]' : 'text-slate-600'}`}>{label}</span>
                                                </label>
                                            )
                                        })}
                                    </div>
                                    {errors.helpAreas && <p className="text-red-500 text-xs mt-2">{errors.helpAreas.message}</p>}
                                </div>
                            </div>
                        )}

                        {/* ──────────────── STEP 4: Motivation ──────────────── */}
                        {currentStep === 4 && (
                            <div className="space-y-6">
                                <h3 className="text-2xl font-black text-[#4a3728] mb-6">Motivation</h3>
                                
                                <div>
                                    <label className="block text-sm font-bold text-[#4a3728] mb-2">Why do you want to become a Senior Mentor? *</label>
                                    <textarea {...register('motivation')} rows={6} placeholder="Share your motivation..." className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900 resize-none"></textarea>
                                    {errors.motivation && <p className="text-red-500 text-xs mt-1">{errors.motivation.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#4a3728] mb-2">What&apos;s one piece of advice you wish someone had told you? *</label>
                                    <textarea {...register('adviceToJuniorSelf')} rows={4} placeholder="Your advice to juniors..." className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900 resize-none"></textarea>
                                    {errors.adviceToJuniorSelf && <p className="text-red-500 text-xs mt-1">{errors.adviceToJuniorSelf.message}</p>}
                                </div>
                            </div>
                        )}

                        {/* ──────────────── STEP 5: Verification ──────────────── */}
                        {currentStep === 5 && (
                            <div className="space-y-6">
                                <h3 className="text-2xl font-black text-[#4a3728] mb-6">Verification Documents</h3>
                                
                                <FileInput fieldName="resumeFile" label="Resume / CV *" accept=".pdf,.doc,.docx" helpText="PDF, DOC, DOCX • Max 5MB" icon={FileText} />
                                <FileInput fieldName="proofDocumentFile" label="Proof of Experience *" accept=".pdf,.jpg,.jpeg,.png" helpText="PDF, JPG, PNG • Max 5MB" icon={FileText} />
                                
                                <div className="bg-[#f8f6f4] rounded-2xl p-5 border border-[#ece7e2] flex items-start gap-4 mt-6">
                                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center flex-shrink-0 text-[#4a3728] font-bold text-sm shadow-sm">!</div>
                                    <p className="text-xs text-[#5c4a3a] leading-relaxed font-semibold">By submitting, you agree to our mentorship guidelines. All submitted documents are strictly used for verification purposes and will be handled securely.</p>
                                </div>
                            </div>
                        )}

                        {/* Navigation Actions */}
                        <div className="mt-8 flex items-center justify-between pt-8 border-t border-[#ece7e2]">
                            {currentStep > 1 ? (
                                <button type="button" onClick={handlePrev} className="px-7 py-3 text-[#4a3728] font-bold hover:bg-[#f8f6f4] rounded-xl transition-colors">
                                    Previous
                                </button>
                            ) : <div></div>}

                            {currentStep < steps.length ? (
                                <button type="button" onClick={handleNext} className="px-8 py-3 bg-[#4a3728] text-white rounded-xl font-bold shadow hover:bg-[#7a5c3e] transition-colors flex items-center gap-2">
                                    Next Step
                                </button>
                            ) : (
                                <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-[#4a3728] text-white rounded-xl font-bold shadow hover:bg-[#7a5c3e] transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                                    {isSubmitting ? "Submitting..." : "Submit Application"}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
