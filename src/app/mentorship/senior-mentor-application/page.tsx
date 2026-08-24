"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    ArrowLeft,
    Upload,
    CheckCircle2,
    X,
    Loader2,
    Check,
    Plus,
    FileText,
    Image as ImageIcon
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
    { id: 1, title: 'Profile', fields: ['fullName', 'profilePhotoFile', 'college', 'degree', 'fieldOfStudy', 'graduationYear', 'currentRole', 'currentCompany', 'shortBio'] },
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

    const { register, handleSubmit, trigger, formState: { errors }, control, setValue, watch } = useForm<FormValues>({
        resolver: zodResolver(createSchema),
        defaultValues: {
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
                if (app) setExistingApplication(app);
            } catch (err) {
                console.error("Error fetching application status", err);
            } finally {
                setIsLoadingInit(false);
            }
        };
        fetchStatus();
    }, []);

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

            await SeniorMentorApplicationService.apply(formData);
            setSuccessMsg(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
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

    if (existingApplication && !successMsg && existingApplication.verificationStatus !== ApplicationStatus.REJECTED) {
        return (
            <div className="min-h-screen bg-[#FAF9F6] p-6 lg:p-12">
                <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-100 mt-20 text-center">
                    <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-[#4a3728] mb-2">Application Status</h2>
                    <p className="text-slate-500 font-medium mb-6">
                        Your application is currently <span className="font-bold text-[#4a3728]">{existingApplication.verificationStatus.replace('_', ' ').toUpperCase()}</span>.
                    </p>
                    <button onClick={() => router.back()} className="px-6 py-2.5 bg-[#4a3728] text-white rounded-lg font-medium shadow hover:bg-[#8b7355] transition">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (successMsg) {
        return (
            <div className="min-h-screen bg-[#FAF9F6] p-6 lg:p-12">
                <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-100 mt-20 text-center">
                    <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                    <h2 className="text-3xl font-black text-[#4a3728] mb-3">Application Submitted!</h2>
                    <p className="text-slate-600 mb-8 max-w-sm mx-auto leading-relaxed">
                        Your Senior Mentor application has been submitted successfully and is currently pending review. We'll notify you once our team processes your request.
                    </p>
                    <button onClick={() => router.back()} className="px-6 py-2.5 bg-[#4a3728] text-white rounded-lg font-medium shadow hover:bg-[#8b7355] transition">
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Dynamic Tag Input Component
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
            <div className="space-y-3">
                <label className="block text-sm font-semibold text-[#4a3728]">{label}</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                        placeholder={placeholder}
                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b7355]/50 transition text-slate-900"
                    />
                    <button type="button" onClick={addTag} className="px-4 bg-[#8b7355] text-white rounded-lg hover:bg-[#735e45] transition text-sm font-medium">
                        Add
                    </button>
                </div>
                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {tags.map((tag, i) => (
                            <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-sm rounded-full text-slate-700 border border-slate-200">
                                {tag}
                                <button type="button" onClick={() => removeTag(tag)} className="text-slate-400 hover:text-red-500">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
                {errors[fieldName] && <p className="text-red-500 text-xs font-medium">{errors[fieldName]?.message as string}</p>}
            </div>
        );
    };

    // File Input Component
    const FileInput = ({ fieldName, label, accept, helpText, icon: Icon }: { fieldName: keyof FormValues, label: string, accept: string, helpText: string, icon: any }) => {
        const file = watch(fieldName) as File;
        return (
            <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#4a3728]">{label}</label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Icon className="w-8 h-8 text-slate-400 mb-2" />
                        <p className="mb-1 text-sm text-slate-600 font-medium h-5 overflow-hidden w-full text-center px-4 whitespace-nowrap text-ellipsis">
                            {file ? file.name : <><span className="font-semibold text-[#8b7355]">Click to upload</span> or drag and drop</>}
                        </p>
                        <p className="text-xs text-slate-500">{helpText}</p>
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
                {errors[fieldName] && <p className="text-red-500 text-xs font-medium">{errors[fieldName]?.message as string}</p>}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAF9F6] flex flex-col md:flex-row">
            {/* Sidebar Stepper */}
            <div className="md:w-80 bg-white border-r border-slate-200 p-6 md:p-8 flex-shrink-0 md:h-screen md:sticky md:top-0">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#4a3728] font-medium transition mb-10"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </button>
                <h1 className="text-2xl font-black text-[#4a3728] mb-8 leading-tight">Become a<br />Senior Mentor</h1>

                <div className="hidden md:flex flex-col gap-6">
                    {steps.map((s) => {
                        const isCurrent = s.id === currentStep;
                        const isPast = s.id < currentStep;
                        return (
                            <div key={s.id} className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                                    isCurrent ? 'border-[#8b7355] bg-[#8b7355] text-white' :
                                    isPast ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 text-slate-400'
                                }`}>
                                    {isPast ? <Check className="w-4 h-4" /> : s.id}
                                </div>
                                <span className={`font-semibold ${isCurrent ? 'text-[#4a3728]' : 'text-slate-400'}`}>
                                    {s.title}
                                </span>
                            </div>
                        )
                    })}
                </div>
                
                {/* Mobile Stepper */}
                <div className="md:hidden flex items-center gap-3">
                    <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                            className="bg-[#8b7355] h-full transition-all duration-300"
                            style={{ width: `${(currentStep / steps.length) * 100}%` }}
                        ></div>
                    </div>
                    <span className="text-xs font-semibold text-[#4a3728]">Step {currentStep} of {steps.length}</span>
                </div>
            </div>

            {/* Main Form Content */}
            <div className="flex-1 p-6 lg:p-12 pb-24 overflow-y-auto w-full">
                <div className="max-w-3xl mx-auto w-full">
                    {existingApplication && existingApplication.verificationStatus === ApplicationStatus.REJECTED && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl shadow-sm">
                            <h3 className="font-bold mb-1">Your previous application was returned</h3>
                            <p className="text-sm font-medium opacity-90">{existingApplication.rejectionReason || "Please update your details and submit again."}</p>
                        </div>
                    )}

                    {errorMsg && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center justify-between">
                            <span className="font-medium text-sm">{errorMsg}</span>
                            <button onClick={() => setErrorMsg('')}><X className="w-4 h-4" /></button>
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-10">
                        {/* ──────────────── STEP 1: Basic Profile ──────────────── */}
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-[#4a3728] border-b border-slate-100 pb-4 mb-2">Basic Profile</h2>
                                
                                <FileInput fieldName="profilePhotoFile" label="Profile Photo" accept="image/jpeg,image/png,image/jpg" helpText="JPG, PNG • Max 5MB" icon={ImageIcon} />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-[#4a3728]">Full Name</label>
                                        <input type="text" {...register('fullName')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b7355]/50 transition text-slate-900" />
                                        {errors.fullName && <p className="text-red-500 text-xs font-medium">{errors.fullName.message}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-[#4a3728]">Graduation Year</label>
                                        <input type="number" {...register('graduationYear', { valueAsNumber: true })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b7355]/50 transition text-slate-900" />
                                        {errors.graduationYear && <p className="text-red-500 text-xs font-medium">{errors.graduationYear.message}</p>}
                                    </div>
                                    <div className="space-y-1.5 sm:col-span-2">
                                        <label className="text-sm font-semibold text-[#4a3728]">College / University</label>
                                        <input type="text" {...register('college')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b7355]/50 transition text-slate-900" />
                                        {errors.college && <p className="text-red-500 text-xs font-medium">{errors.college.message}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-[#4a3728]">Degree</label>
                                        <input type="text" {...register('degree')} placeholder="e.g. B.Tech" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b7355]/50 transition text-slate-900" />
                                        {errors.degree && <p className="text-red-500 text-xs font-medium">{errors.degree.message}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-[#4a3728]">Field of Study</label>
                                        <input type="text" {...register('fieldOfStudy')} placeholder="e.g. Computer Science" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b7355]/50 transition text-slate-900" />
                                        {errors.fieldOfStudy && <p className="text-red-500 text-xs font-medium">{errors.fieldOfStudy.message}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-[#4a3728]">Current Role</label>
                                        <input type="text" {...register('currentRole')} placeholder="e.g. Software Engineer" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b7355]/50 transition text-slate-900" />
                                        {errors.currentRole && <p className="text-red-500 text-xs font-medium">{errors.currentRole.message}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-[#4a3728]">Current Company</label>
                                        <input type="text" {...register('currentCompany')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b7355]/50 transition text-slate-900" />
                                        {errors.currentCompany && <p className="text-red-500 text-xs font-medium">{errors.currentCompany.message}</p>}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-[#4a3728]">Short Bio</label>
                                    <textarea {...register('shortBio')} rows={4} placeholder="Briefly describe your background..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b7355]/50 transition text-slate-900 resize-none"></textarea>
                                    <div className="flex justify-between items-center text-xs text-slate-500">
                                        {errors.shortBio ? <span className="text-red-500 font-medium">{errors.shortBio.message}</span> : <span>Share a little about yourself (50-1000 chars)</span>}
                                        <span>{watch('shortBio')?.length || 0} / 1000</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ──────────────── STEP 2: Professional ──────────────── */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-[#4a3728] border-b border-slate-100 pb-4 mb-2">Professional Information</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-1.5 sm:col-span-2">
                                        <label className="text-sm font-semibold text-[#4a3728]">LinkedIn URL</label>
                                        <input type="url" {...register('linkedinUrl')} placeholder="https://linkedin.com/in/..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b7355]/50 transition text-slate-900" />
                                        {errors.linkedinUrl && <p className="text-red-500 text-xs font-medium">{errors.linkedinUrl.message}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-[#4a3728]">GitHub URL <span className="text-slate-400 font-normal">(Optional)</span></label>
                                        <input type="url" {...register('githubUrl')} placeholder="https://github.com/..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b7355]/50 transition text-slate-900" />
                                        {errors.githubUrl && <p className="text-red-500 text-xs font-medium">{errors.githubUrl.message}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-[#4a3728]">Portfolio URL <span className="text-slate-400 font-normal">(Optional)</span></label>
                                        <input type="url" {...register('portfolioUrl')} placeholder="https://yourwebsite.com" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b7355]/50 transition text-slate-900" />
                                        {errors.portfolioUrl && <p className="text-red-500 text-xs font-medium">{errors.portfolioUrl.message}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-[#4a3728]">Years of Experience</label>
                                        <input type="number" {...register('yearsOfExperience', { valueAsNumber: true })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b7355]/50 transition text-slate-900" />
                                        {errors.yearsOfExperience && <p className="text-red-500 text-xs font-medium">{errors.yearsOfExperience.message}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-[#4a3728]">Experience Level</label>
                                        <select {...register('experienceLevel')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b7355]/50 transition text-slate-900 text-slate-700">
                                            <option value="">Select Level</option>
                                            {Object.entries(ExperienceLevel).map(([key, value]) => (
                                                <option key={key} value={value}>{key.charAt(0) + key.slice(1).toLowerCase()} Level</option>
                                            ))}
                                        </select>
                                        {errors.experienceLevel && <p className="text-red-500 text-xs font-medium">{errors.experienceLevel.message}</p>}
                                    </div>
                                    <div className="space-y-1.5 sm:col-span-2">
                                        <label className="text-sm font-semibold text-[#4a3728]">Primary Expertise</label>
                                        <select {...register('primaryExpertise')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b7355]/50 transition text-slate-900 text-slate-700">
                                            <option value="">Select Domain</option>
                                            {Object.values(Domain).map((d) => (
                                                <option key={d} value={d}>
                                                    {d.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.primaryExpertise && <p className="text-red-500 text-xs font-medium">{errors.primaryExpertise.message}</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ──────────────── STEP 3: Skills ──────────────── */}
                        {currentStep === 3 && (
                            <div className="space-y-8">
                                <h2 className="text-xl font-bold text-[#4a3728] border-b border-slate-100 pb-4 mb-2">Skills & Mentorship Areas</h2>
                                
                                <TagInput fieldName="technologies" label="Technologies" placeholder="e.g. React, Node.js" />
                                <TagInput fieldName="otherSkills" label="Other Skills" placeholder="e.g. Agile, System Design" />
                                <TagInput fieldName="achievements" label="Achievements" placeholder="e.g. Outstanding Engineer Award 2023" />
                                <TagInput fieldName="certifications" label="Certifications" placeholder="e.g. AWS Certified Solutions Architect" />

                                <div className="space-y-3 pt-4 border-t border-slate-100">
                                    <label className="block text-sm font-semibold text-[#4a3728] mb-3">Help Areas (Select up to 7)</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {Object.values(MentorshipHelpArea).map((area) => {
                                            const label = area.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                                            const checked = watch('helpAreas')?.includes(area);
                                            return (
                                                <label key={area} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${checked ? 'border-[#8b7355] bg-[#8b7355]/5' : 'border-slate-200 hover:border-[#8b7355]/50'}`}>
                                                    <input 
                                                        type="checkbox" 
                                                        value={area}
                                                        {...register('helpAreas')}
                                                        className="w-4 h-4 text-[#8b7355] rounded focus:ring-[#8b7355]"
                                                    />
                                                    <span className="text-sm font-medium text-slate-700">{label}</span>
                                                </label>
                                            )
                                        })}
                                    </div>
                                    {errors.helpAreas && <p className="text-red-500 text-xs font-medium">{errors.helpAreas.message}</p>}
                                </div>
                            </div>
                        )}

                        {/* ──────────────── STEP 4: Motivation ──────────────── */}
                        {currentStep === 4 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-[#4a3728] border-b border-slate-100 pb-4 mb-2">Motivation</h2>
                                
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-[#4a3728]">Why do you want to become a Senior Mentor?</label>
                                    <textarea {...register('motivation')} rows={6} placeholder="Share your motivation..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b7355]/50 transition text-slate-900 resize-none"></textarea>
                                    <div className="flex justify-between items-center text-xs text-slate-500">
                                        {errors.motivation ? <span className="text-red-500 font-medium">{errors.motivation.message}</span> : <span>Minimum 30 characters</span>}
                                        <span>{watch('motivation')?.length || 0} / 1000</span>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-[#4a3728]">What's one piece of advice you wish someone had told you?</label>
                                    <textarea {...register('adviceToJuniorSelf')} rows={4} placeholder="Your advice to juniors..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b7355]/50 transition text-slate-900 resize-none"></textarea>
                                    <div className="flex justify-between items-center text-xs text-slate-500">
                                        {errors.adviceToJuniorSelf ? <span className="text-red-500 font-medium">{errors.adviceToJuniorSelf.message}</span> : <span>Minimum 10 characters</span>}
                                        <span>{watch('adviceToJuniorSelf')?.length || 0} / 500</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ──────────────── STEP 5: Verification ──────────────── */}
                        {currentStep === 5 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-[#4a3728] border-b border-slate-100 pb-4 mb-2">Verification Documents</h2>
                                
                                <FileInput fieldName="resumeFile" label="Resume / CV" accept=".pdf,.doc,.docx" helpText="PDF, DOC, DOCX • Max 5MB" icon={FileText} />
                                <FileInput fieldName="proofDocumentFile" label="Proof of Experience" accept=".pdf,.jpg,.jpeg,.png" helpText="PDF, JPG, PNG • Max 5MB" icon={FileText} />
                                
                                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 flex items-start gap-3 mt-4">
                                    <div className="w-5 h-5 mt-0.5 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0 text-amber-700 font-bold text-sm">!</div>
                                    <p className="text-xs text-amber-800 leading-relaxed font-medium">By submitting, you agree to our mentorship guidelines. All submitted documents are strictly used for verification purposes and will be handled securely.</p>
                                </div>
                            </div>
                        )}

                        <div className="mt-10 flex items-center justify-between pt-6 border-t border-slate-100">
                            {currentStep > 1 ? (
                                <button type="button" onClick={handlePrev} className="px-6 py-2.5 text-slate-600 font-medium hover:text-[#4a3728] hover:bg-slate-50 rounded-lg transition">
                                    Previous
                                </button>
                            ) : <div></div>}

                            {currentStep < steps.length ? (
                                <button type="button" onClick={handleNext} className="px-6 py-2.5 bg-[#4a3728] text-white rounded-lg font-medium shadow hover:bg-[#8b7355] transition flex items-center gap-2">
                                    Next Step
                                </button>
                            ) : (
                                <button type="submit" disabled={isSubmitting} className="px-8 py-2.5 bg-[#4a3728] text-white rounded-lg font-bold shadow hover:bg-[#8b7355] transition flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    {isSubmitting ? "Submitting..." : "Submit Application"}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
