"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Upload,
    CheckCircle2,
    X,
    Loader2,
    FileText,
    Image as ImageIcon,
    Users,
    GraduationCap,
    Award,
    ChevronDown
} from "lucide-react";
import SeniorMentorApplicationService, {
    SeniorMentorApplication,
    MIN_HELP_AREAS,
    MAX_HELP_AREAS,
} from "@/lib/api/seniorMentorApplication.service";
import { syncProfilePhotoToAllRoles } from "@/features/mentorship/utils/syncProfilePhoto";
import { useAuth } from "@/features/auth/hooks/useAuth";
import AuthService from "@/lib/api/auth.service";
import ProfileService from "@/lib/api/profile.service";
import CollegeAutocomplete from "@/features/auth/components/CollegeAutocomplete";
import {
    resolveEducationPrefill,
    resolveExperiencePrefill,
    IEducationItem,
    IExperienceItem,
    IAboutData,
    IProfilePhotoData,
} from "@/features/mentorship/utils/seniorMentorPrefill.util";

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

const DEGREE_SUGGESTIONS = [
    'B.Tech', 'B.E.', 'B.Sc', 'B.Com', 'B.A.', 'BBA', 'BCA', 'B.Des', 'B.Arch', 'B.Pharm', 'LLB', 'MBBS',
    'M.Tech', 'M.E.', 'M.Sc', 'M.Com', 'M.A.', 'MBA', 'MCA', 'M.Des', 'M.Arch', 'LLM', 'PGDM',
    'Diploma', 'Ph.D',
];

const FIELD_SUGGESTIONS = [
    'Computer Science', 'Information Technology', 'Electronics and Communication', 'Electrical Engineering',
    'Mechanical Engineering', 'Civil Engineering', 'Chemical Engineering', 'Artificial Intelligence',
    'Machine Learning', 'Data Science', 'Cyber Security', 'Software Engineering', 'Biotechnology',
    'Business Administration', 'Finance', 'Marketing', 'Human Resources', 'Commerce', 'Economics',
    'Mathematics', 'Physics', 'Chemistry', 'Design', 'Law',
];

const ROLE_SUGGESTIONS = [
    'Software Engineer', 'Senior Software Engineer', 'Software Developer', 'Full Stack Developer',
    'Frontend Developer', 'Backend Developer', 'DevOps Engineer', 'Cloud Engineer',
    'Data Scientist', 'Machine Learning Engineer', 'AI Engineer', 'Product Manager',
    'UI/UX Designer', 'Product Designer', 'Data Analyst', 'Business Analyst',
    'QA Engineer', 'Security Engineer', 'Solutions Architect', 'Engineering Manager',
];

const COMPANY_SUGGESTIONS = [
    'Google', 'Microsoft', 'Amazon', 'Apple', 'Meta', 'Netflix', 'Adobe', 'Uber', 'Salesforce',
    'Tata Consultancy Services', 'Infosys', 'Wipro', 'HCL Technologies', 'Tech Mahindra', 'Cognizant',
    'Accenture', 'Deloitte', 'PwC', 'EY', 'KPMG', 'Goldman Sachs', 'Morgan Stanley', 'JPMorgan Chase',
    'Flipkart', 'Swiggy', 'Zomato', 'Paytm', 'Razorpay', 'PhonePe', 'CRED', 'Ola', 'Byju\'s',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ============================================================================
// 2. Validation Schema (Zod)
// ============================================================================

const createSchema = z.object({
    // Step 1: Profile
    mentorRole: z.enum(['senior_mentor', 'alumni'], {
        required_error: "Please select your mentor role",
    }),
    fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
    profilePhotoFile: z.any().refine((file) => file instanceof File, "Profile photo is required")
        .refine((file: File) => file && file.size <= MAX_FILE_SIZE, "Max file size is 5MB")
        .refine((file: File) => file && ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type), "Only .jpg, .jpeg, .png formats supported"),
    college: z.string().min(2, "College/University must be at least 2 characters").max(150),
    degree: z.string().min(2, "Degree must be at least 2 characters").max(100),
    fieldOfStudy: z.string().min(2, "Field of study must be at least 2 characters").max(100),
    graduationYear: z.number({ invalid_type_error: "Graduation year is required" })
        .int()
        .min(1980, "Invalid year")
        .max(new Date().getFullYear() + 10, "Invalid year"),
    currentRole: z.string().min(2, "Current role is required").max(100),
    currentCompany: z.string().min(2, "Current company is required").max(100),
    shortBio: z.string().min(20, "Short bio must be at least 20 characters").max(600),

    // Step 2: Professional Details
    linkedinUrl: z.string().url("Valid LinkedIn URL is required").regex(/linkedin\.com/, "Must be a valid LinkedIn URL"),
    githubUrl: z.string().url("Must be a valid URL").regex(/github\.com/, "Must be a valid GitHub URL").optional().or(z.literal('')),
    portfolioUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
    yearsOfExperience: z.number({ invalid_type_error: "Years of experience is required" })
        .min(1, "Minimum 1 year of experience required")
        .max(50, "Invalid years of experience"),
    experienceLevel: z.nativeEnum(ExperienceLevel, { errorMap: () => ({ message: "Please select your experience level" }) }),
    primaryExpertise: z.nativeEnum(Domain, { errorMap: () => ({ message: "Please select your primary expertise" }) }),

    // Step 3: Skills & Domain
    otherSkills: z.array(z.string()).min(1, "Add at least 1 secondary skill").max(20, "Max 20 skills allowed"),
    technologies: z.array(z.string()).min(1, "Add at least 1 tool/technology").max(30, "Max 30 technologies allowed"),
    achievements: z.array(z.string()).max(10, "Max 10 achievements allowed"),
    certifications: z.array(z.string()).max(15, "Max 15 certifications allowed"),
    helpAreas: z
        .array(z.nativeEnum(MentorshipHelpArea))
        .min(MIN_HELP_AREAS, `Please select at least ${MIN_HELP_AREAS} help areas`)
        .max(MAX_HELP_AREAS, `Select up to ${MAX_HELP_AREAS} help areas`),

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

// ============================================================================
// 3. Themed Combobox (native <datalist> ki jagah)
//    Native datalist ka dropdown browser draw karta hai, isliye uska color
//    CSS se change nahi hota. Ye custom dropdown form ke theme me hai:
//    white bg, #ece7e2 border, #4a3728 text, #f8f6f4 hover.
// ============================================================================

const MAX_VISIBLE_OPTIONS = 50;

interface ComboboxInputProps {
    control: Control<FormValues>;
    name: 'college' | 'degree' | 'fieldOfStudy' | 'currentRole' | 'currentCompany';
    options: string[];
    placeholder?: string;
}

function ComboboxInput({ control, name, options, placeholder }: ComboboxInputProps) {
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    // Bahar click karne par dropdown band
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setActiveIndex(-1);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Keyboard se navigate karte time active option screen me rahe
    useEffect(() => {
        if (activeIndex < 0 || !listRef.current) return;
        const el = listRef.current.children[activeIndex] as HTMLElement | undefined;
        el?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex]);

    return (
        <Controller
            control={control}
            name={name}
            render={({ field, fieldState }) => {
                const value = (field.value as string) || '';
                const query = value.trim().toLowerCase();

                const filtered = (query
                    ? options.filter((o) => o.toLowerCase().includes(query))
                    : options
                ).slice(0, MAX_VISIBLE_OPTIONS);

                const selectOption = (opt: string) => {
                    field.onChange(opt);
                    setOpen(false);
                    setActiveIndex(-1);
                };

                const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        if (!open) {
                            setOpen(true);
                            return;
                        }
                        setActiveIndex((prev) => (filtered.length === 0 ? -1 : (prev + 1) % filtered.length));
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setActiveIndex((prev) =>
                            filtered.length === 0 ? -1 : prev <= 0 ? filtered.length - 1 : prev - 1
                        );
                    } else if (e.key === 'Enter') {
                        if (open && activeIndex >= 0 && filtered[activeIndex]) {
                            e.preventDefault();
                            selectOption(filtered[activeIndex]);
                        }
                    } else if (e.key === 'Escape') {
                        setOpen(false);
                        setActiveIndex(-1);
                    }
                };

                return (
                    <div ref={containerRef} className="relative">
                        <input
                            type="text"
                            ref={field.ref}
                            name={field.name}
                            value={value}
                            autoComplete="off"
                            placeholder={placeholder}
                            aria-invalid={fieldState.error ? 'true' : 'false'}
                            aria-expanded={open}
                            aria-autocomplete="list"
                            role="combobox"
                            onChange={(e) => {
                                field.onChange(e.target.value);
                                setOpen(true);
                                setActiveIndex(-1);
                            }}
                            onFocus={() => setOpen(true)}
                            onBlur={field.onBlur}
                            onKeyDown={handleKeyDown}
                            className="w-full px-4 py-3 pr-11 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900"
                        />
                        <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Toggle suggestions"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => setOpen((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8a7a6a] hover:text-[#4a3728] transition-colors"
                        >
                            <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                        </button>

                        {open && (
                            <div className="absolute left-0 right-0 z-30 mt-2 bg-white border border-[#ece7e2] rounded-2xl shadow-xl overflow-hidden">
                                {filtered.length > 0 ? (
                                    <ul ref={listRef} role="listbox" className="max-h-60 overflow-y-auto py-1.5">
                                        {filtered.map((opt, idx) => {
                                            const isActive = idx === activeIndex;
                                            return (
                                                <li
                                                    key={opt}
                                                    role="option"
                                                    aria-selected={isActive}
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        selectOption(opt);
                                                    }}
                                                    onMouseEnter={() => setActiveIndex(idx)}
                                                    className={`px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors ${isActive
                                                            ? 'bg-[#f8f6f4] text-[#4a3728]'
                                                            : 'text-slate-700 hover:bg-[#f8f6f4] hover:text-[#4a3728]'
                                                        }`}
                                                >
                                                    {opt}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                    <p className="px-4 py-3 text-xs font-medium text-[#8a7a6a]">
                                        No matching suggestions. You can keep what you typed.
                                    </p>
                                )}
                            </div>
                        )}
                        {fieldState.error && (
                            <p className="text-red-500 text-xs mt-1">{fieldState.error.message as string}</p>
                        )}
                    </div>
                );
            }}
        />
    );
}

export default function SeniorMentorApplicationPage() {
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoadingInit, setIsLoadingInit] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [photoHint, setPhotoHint] = useState<string | null>(null);

    const hasPrefilledRef = useRef(false);
    const isPrefilledPhotoRef = useRef(false);
    const isRedirectingRef = useRef(false);
    const timedOutRef = useRef(false);

    const {
        register,
        handleSubmit,
        trigger,
        formState: { errors, dirtyFields },
        setValue,
        watch,
        setError,
        clearErrors,
        control,
        getValues,
    } = useForm<FormValues>({
        resolver: zodResolver(createSchema),
        defaultValues: {
            mentorRole: undefined,
            otherSkills: [],
            technologies: [],
            achievements: [],
            certifications: [],
            helpAreas: [],
        },
    });

    const selectedHelpAreas = (watch('helpAreas') || []) as MentorshipHelpArea[];
    const isMaxHelpAreas = selectedHelpAreas.length >= MAX_HELP_AREAS;

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 5000);
        return () => clearTimeout(timer);
    }, [toast]);

    useEffect(() => {
        if (selectedHelpAreas.length >= MIN_HELP_AREAS && errors.helpAreas) {
            clearErrors('helpAreas');
        }
    }, [selectedHelpAreas.length, errors.helpAreas, clearErrors]);

    // 1. Standalone 8-second safety timer on mount (independent of auth wait)
    useEffect(() => {
        const timer = setTimeout(() => {
            timedOutRef.current = true;
            if (!isRedirectingRef.current) {
                setIsLoadingInit(false);
            }
        }, 8000);
        return () => clearTimeout(timer);
    }, []);

    // 2. Main data loading coordinator
    useEffect(() => {
        if (isAuthLoading || hasPrefilledRef.current) return;

        let isMounted = true;

        const loadAndPrefill = async () => {
            try {
                // A. Check application status first
                const app = await SeniorMentorApplicationService.getMyApplication().catch(() => null);
                if (!isMounted) return;

                // 1. Redirect must NOT depend on timeout:
                if (app) {
                    isRedirectingRef.current = true;
                    const profileUserId = app.userId;
                    router.push(`/mentorship/senior-mentor-profile/${profileUserId}`);
                    return; // Redirect without setting isLoadingInit(false)
                }

                // If timed out already, skip prefill
                if (timedOutRef.current) {
                    setIsLoadingInit(false);
                    return;
                }

                // If user is not logged in, show empty form immediately
                if (!user?.userId) {
                    if (!timedOutRef.current) setIsLoadingInit(false);
                    return;
                }

                // B. Fetch profile & education in parallel
                const [profileRes, eduRes] = await Promise.allSettled([
                    AuthService.getUserProfile(),
                    ProfileService.getAllEducation(false),
                ]);

                if (!isMounted || timedOutRef.current) return;

                const userProfile = profileRes.status === 'fulfilled' ? profileRes.value?.data : null;
                const educationList: IEducationItem[] =
                    eduRes.status === 'fulfilled' ? (eduRes.value?.data?.educationList || []) : [];

                if (!userProfile) {
                    if (!timedOutRef.current) setIsLoadingInit(false);
                    return;
                }

                // C. Fetch experiences, about, and photo URL in parallel
                const expPromises = (userProfile.experienceIds || []).map((id: string) =>
                    ProfileService.getExperienceById(id)
                        .then((res: { data?: { experience?: IExperienceItem } }) => res?.data?.experience)
                        .catch(() => null)
                );

                const aboutPromise = userProfile.aboutId
                    ? ProfileService.getAboutById(userProfile.aboutId)
                        .then((res: { data?: { about?: IAboutData } }) => res?.data?.about?.aboutText || '')
                        .catch(() => '')
                    : Promise.resolve('');

                const photoUrlPromise = userProfile.profilePhotoId
                    ? ProfileService.getProfilePhotoById(userProfile.profilePhotoId)
                        .then((res: { data?: { photo?: IProfilePhotoData } }) => res?.data?.photo?.cloudinarySecureUrl || '')
                        .catch(() => '')
                    : Promise.resolve('');

                const [expResults, aboutText, photoUrl] = await Promise.all([
                    Promise.all(expPromises),
                    aboutPromise,
                    photoUrlPromise,
                ]);

                if (!isMounted || timedOutRef.current) return;

                const experienceList: IExperienceItem[] = expResults.filter(Boolean) as IExperienceItem[];

                // D. Download photo blob with a single 4-second AbortController covering fetch + blob read
                let photoFile: File | null = null;
                if (photoUrl && !timedOutRef.current) {
                    const photoController = new AbortController();
                    const photoTimer = setTimeout(() => photoController.abort(), 4000);
                    try {
                        const res = await fetch(photoUrl, { signal: photoController.signal });
                        if (!res.ok) {
                            clearTimeout(photoTimer);
                            if (!timedOutRef.current) setPhotoHint('Could not load existing profile photo. Please upload one manually.');
                        } else {
                            const blob = await res.blob();
                            clearTimeout(photoTimer);
                            if (!isMounted || timedOutRef.current) return;
                            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
                            if (blob.size <= 5 * 1024 * 1024 && allowedTypes.includes(blob.type)) {
                                const ext = blob.type === 'image/png' ? 'png' : 'jpg';
                                photoFile = new File([blob], `profile-photo.${ext}`, { type: blob.type });
                            } else if (blob.size > 5 * 1024 * 1024) {
                                if (!timedOutRef.current) setPhotoHint('Existing profile photo exceeds 5MB. Please upload a smaller image.');
                            } else {
                                if (!timedOutRef.current) setPhotoHint('Existing photo is not JPG/PNG. Please upload a JPG or PNG.');
                            }
                        }
                    } catch {
                        clearTimeout(photoTimer);
                        if (!timedOutRef.current) setPhotoHint('Could not load existing profile photo. Please upload one manually.');
                    }
                }

                if (!isMounted || timedOutRef.current) return;

                // E. Apply Prefill (Only if user has NOT dirtied the field)
                // 1) Full Name
                const fullName = `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim();
                if (fullName && !dirtyFields.fullName) {
                    setValue('fullName', fullName, { shouldValidate: true, shouldDirty: false });
                }

                // 2) Education
                const eduPrefill = resolveEducationPrefill(
                    educationList,
                    userProfile.onboarding?.studentProfile,
                    userProfile.onboarding?.fresherProfile
                );
                if (eduPrefill.college && !dirtyFields.college) {
                    setValue('college', eduPrefill.college, { shouldValidate: true, shouldDirty: false });
                }
                if (eduPrefill.degree && !dirtyFields.degree) {
                    setValue('degree', eduPrefill.degree, { shouldValidate: true, shouldDirty: false });
                }
                if (eduPrefill.fieldOfStudy && !dirtyFields.fieldOfStudy) {
                    setValue('fieldOfStudy', eduPrefill.fieldOfStudy, { shouldValidate: true, shouldDirty: false });
                }
                if (eduPrefill.graduationYear && !dirtyFields.graduationYear) {
                    setValue('graduationYear', eduPrefill.graduationYear, { shouldValidate: true, shouldDirty: false });
                }

                // 3) Experience (Single source rule: both from Experience or both from workingProfile)
                const expPrefill = resolveExperiencePrefill(
                    experienceList,
                    userProfile.onboarding?.workingProfile
                );
                if (expPrefill.role && !dirtyFields.currentRole) {
                    setValue('currentRole', expPrefill.role, { shouldValidate: true, shouldDirty: false });
                }
                if (expPrefill.company && !dirtyFields.currentCompany) {
                    setValue('currentCompany', expPrefill.company, { shouldValidate: true, shouldDirty: false });
                }

                // 4) Short Bio (from About)
                if (aboutText && !dirtyFields.shortBio) {
                    setValue('shortBio', aboutText.trim(), { shouldValidate: true, shouldDirty: false });
                }

                // 5) Profile Photo
                if (photoFile && !dirtyFields.profilePhotoFile && !getValues('profilePhotoFile')) {
                    setValue('profilePhotoFile', photoFile as any, { shouldValidate: false, shouldDirty: false });
                    isPrefilledPhotoRef.current = true;
                }
            } catch (err) {
                console.error("Error during senior mentor form initialization", err);
            } finally {
                if (isMounted && !isRedirectingRef.current) {
                    hasPrefilledRef.current = true;
                    setIsLoadingInit(false);
                }
            }
        };

        loadAndPrefill();
        return () => {
            isMounted = false;
        };
    }, [isAuthLoading, user?.userId, router, setValue, getValues, dirtyFields]);

    const handleNext = async () => {
        if (currentStep === 3) {
            if (selectedHelpAreas.length < MIN_HELP_AREAS) {
                setError('helpAreas', {
                    type: 'manual',
                    message: `Please select at least ${MIN_HELP_AREAS} help areas (you have selected ${selectedHelpAreas.length}).`,
                });
                const el = document.getElementById('help-areas-section');
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }
        }
        const stepFields = steps.find((s) => s.id === currentStep)?.fields as (keyof FormValues)[];
        const isValid = await trigger(stepFields);
        if (isValid) {
            setCurrentStep((prev) => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            const firstInvalid = document.querySelector<HTMLElement>('[aria-invalid="true"]');
            firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const handlePrev = () => {
        setCurrentStep((prev) => prev - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const onInvalid = (formErrors: any) => {
        console.error('[SENIOR_MENTOR_APP] Validation errors on submit:', formErrors);
        const errorKeys = Object.keys(formErrors);
        if (errorKeys.length > 0) {
            const firstKey = errorKeys[0];
            const stepWithErr = steps.find((s) => (s.fields as string[]).includes(firstKey));
            if (stepWithErr) {
                setCurrentStep(stepWithErr.id);
            }
            const msg =
                formErrors[firstKey]?.message ||
                `Please check required fields in Step ${stepWithErr?.id || currentStep}.`;
            const fullErrMsg = `Application submit nahi hui: ${msg}`;
            setErrorMsg(fullErrMsg);
            setToast({ type: 'error', message: fullErrMsg });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const onSubmit = async (values: FormValues) => {
        try {
            setIsSubmitting(true);
            setErrorMsg('');
            setToast(null);

            const formData = new FormData();

            formData.append('mentorRole', values.mentorRole);
            formData.append('fullName', values.fullName);
            formData.append('college', values.college);
            formData.append('degree', values.degree);
            formData.append('fieldOfStudy', values.fieldOfStudy);
            formData.append('graduationYear', values.graduationYear.toString());
            formData.append('currentRole', values.currentRole);
            formData.append('currentCompany', values.currentCompany);
            formData.append('shortBio', values.shortBio);

            formData.append('linkedinUrl', values.linkedinUrl);
            if (values.githubUrl) formData.append('githubUrl', values.githubUrl);
            if (values.portfolioUrl) formData.append('portfolioUrl', values.portfolioUrl);
            formData.append('yearsOfExperience', values.yearsOfExperience.toString());
            formData.append('experienceLevel', values.experienceLevel);
            formData.append('primaryExpertise', values.primaryExpertise);

            formData.append('otherSkills', JSON.stringify(values.otherSkills));
            formData.append('technologies', JSON.stringify(values.technologies));
            formData.append('achievements', JSON.stringify(values.achievements));
            formData.append('certifications', JSON.stringify(values.certifications));
            formData.append('helpAreas', JSON.stringify(values.helpAreas));

            formData.append('motivation', values.motivation);
            formData.append('adviceToJuniorSelf', values.adviceToJuniorSelf);

            if (values.profilePhotoFile instanceof File) {
                formData.append('profilePhotoFile', values.profilePhotoFile);
            }
            if (values.resumeFile instanceof File) {
                formData.append('resumeFile', values.resumeFile);
            }
            if (values.proofDocumentFile instanceof File) {
                formData.append('proofDocumentFile', values.proofDocumentFile);
            }

            const resp = await SeniorMentorApplicationService.apply(formData);

            if (resp && (resp.applicationId || resp.verificationStatus)) {
                if (!isPrefilledPhotoRef.current && values.profilePhotoFile instanceof File) {
                    syncProfilePhotoToAllRoles(values.profilePhotoFile, user?.userId, { skip: ['senior'] }).catch((err) => {
                        console.error('Failed to sync profile photo to other roles:', err);
                    });
                }
                setSuccessMsg(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                throw new Error('Submission failed');
            }
        } catch (error: any) {
            console.error('[SENIOR_MENTOR_APP] Submission failed:', error);
            const resp = error?.response?.data;
            let reason = 'Please check the required fields.';
            if (Array.isArray(resp?.errors) && resp.errors.length > 0) {
                resp.errors.forEach((err: { field: string; message: string }) => {
                    if (err.field) {
                        setError(err.field as keyof FormValues, {
                            type: 'server',
                            message: err.message || 'Invalid value',
                        });
                    }
                });
                const firstErr = resp.errors[0];
                reason = firstErr.message || `${firstErr.field} is invalid`;
                const stepWithErr = steps.find((s) => (s.fields as string[]).includes(firstErr.field));
                if (stepWithErr) {
                    setCurrentStep(stepWithErr.id);
                }
            } else if (resp?.message) {
                reason = resp.message;
            } else if (resp?.error?.message) {
                reason = resp.error.message;
            } else if (error?.message) {
                reason = error.message;
            }
            const fullErrMsg = `Application submit nahi hui: ${reason}`;
            setErrorMsg(fullErrMsg);
            setToast({ type: 'error', message: fullErrMsg });
            window.scrollTo({ top: 0, behavior: 'smooth' });
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

    const TagInput = ({ fieldName, label, placeholder }: { fieldName: keyof FormValues; label: string; placeholder: string }) => {
        const [inputValue, setInputValue] = useState("");
        const tags = (watch(fieldName) as string[]) || [];

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

    const FileInput = ({ fieldName, label, accept, helpText, icon: Icon }: { fieldName: keyof FormValues; label: string; accept: string; helpText: string; icon: any }) => {
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
    };

    const profilePhotoFile = watch('profilePhotoFile') as File;
    const profilePicPreview = profilePhotoFile instanceof File ? URL.createObjectURL(profilePhotoFile) : '';

    return (
        <div className="min-h-screen bg-[#FAF9F6] flex items-start justify-center p-6 animate-fade-in overflow-y-auto">
            <div className="max-w-3xl w-full my-6 relative">
                <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="bg-white rounded-[40px] shadow-2xl relative">
                    {/* Close Button */}
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="absolute top-6 right-6 w-10 h-10 bg-[#f8f6f4] hover:bg-[#4a3728] text-[#4a3728] hover:text-white rounded-full flex items-center justify-center transition-all z-20"
                    >
                        <X className="w-5 h-5" />
                    </button>

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

                            <div className="mt-8">
                                <div className="flex items-center gap-2 mb-3">
                                    {[1, 2, 3, 4, 5].map((step) => (
                                        <div
                                            key={step}
                                            className={`h-1.5 rounded-full flex-1 transition-all ${currentStep >= step ? "bg-white" : "bg-white/30"
                                                }`}
                                        />
                                    ))}
                                </div>
                                <div className="flex justify-between text-xs font-bold text-white/60">
                                    <span>Step {currentStep} of 5</span>
                                    <span>{steps.find(s => s.id === currentStep)?.title}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-10">
                        {errorMsg && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-semibold flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                {errorMsg}
                            </div>
                        )}

                        {/* STEP 1: Profile */}
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <h3 className="text-2xl font-black text-[#4a3728] mb-6">Personal & Academic Info</h3>

                                <div>
                                    <label className="block text-sm font-bold text-[#4a3728] mb-2">Which mentor role best describes you? *</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className={`flex items-start gap-3 p-4 border rounded-2xl cursor-pointer transition ${watch('mentorRole') === 'senior_mentor' ? 'border-[#4a3728] bg-[#f8f6f4] shadow-sm' : 'border-[#ece7e2] hover:border-[#4a3728]'}`}>
                                            <input type="radio" value="senior_mentor" {...register('mentorRole')} className="mt-1 text-[#4a3728] focus:ring-[#4a3728]" />
                                            <div>
                                                <p className="text-sm font-bold text-[#4a3728] flex items-center gap-1.5">
                                                    <Award className="w-4 h-4 text-[#4a3728]" />
                                                    Senior Mentor
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1">Pre-final or Final year student with strong technical and problem-solving skills.</p>
                                            </div>
                                        </label>
                                        <label className={`flex items-start gap-3 p-4 border rounded-2xl cursor-pointer transition ${watch('mentorRole') === 'alumni' ? 'border-[#4a3728] bg-[#f8f6f4] shadow-sm' : 'border-[#ece7e2] hover:border-[#4a3728]'}`}>
                                            <input type="radio" value="alumni" {...register('mentorRole')} className="mt-1 text-[#4a3728] focus:ring-[#4a3728]" />
                                            <div>
                                                <p className="text-sm font-bold text-[#4a3728] flex items-center gap-1.5">
                                                    <GraduationCap className="w-4 h-4 text-[#4a3728]" />
                                                    Alumni
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1">Graduated professional with industry experience, guiding students on placements & career.</p>
                                            </div>
                                        </label>
                                    </div>
                                    {errors.mentorRole && <p className="text-red-500 text-xs mt-1">{errors.mentorRole.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[#4a3728] mb-2">Profile Photo *</label>
                                    <div className="flex items-center gap-6">
                                        <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#ece7e2] overflow-hidden flex items-center justify-center bg-[#f8f6f4] relative">
                                            {profilePicPreview ? (
                                                <img src={profilePicPreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="w-8 h-8 text-[#8a7a6a]" />
                                            )}
                                        </div>
                                        <label className="px-5 py-2.5 bg-[#f8f6f4] hover:bg-[#ece7e2] text-[#4a3728] font-bold rounded-xl text-sm cursor-pointer transition flex items-center gap-2">
                                            <Upload className="w-4 h-4" />
                                            Upload Photo
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/jpeg,image/png"
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) {
                                                        isPrefilledPhotoRef.current = false;
                                                        setValue('profilePhotoFile', e.target.files[0] as any, { shouldValidate: true, shouldDirty: true });
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>
                                    {photoHint && (
                                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                                            {photoHint}
                                        </p>
                                    )}
                                    {errors.profilePhotoFile && <p className="text-red-500 text-xs mt-1">{errors.profilePhotoFile.message as string}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">Full Name *</label>
                                        <input type="text" {...register('fullName')} autoComplete="name" placeholder="John Doe" className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900" />
                                        {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">Graduation Year *</label>
                                        <input type="number" {...register('graduationYear', { valueAsNumber: true })} autoComplete="off" className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900" />
                                        {errors.graduationYear && <p className="text-red-500 text-xs mt-1">{errors.graduationYear.message}</p>}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">College / University *</label>
                                        <Controller
                                            name="college"
                                            control={control}
                                            render={({ field }) => (
                                                <CollegeAutocomplete
                                                    id="college"
                                                    name={field.name}
                                                    value={field.value || ''}
                                                    onChange={(val) => field.onChange(val)}
                                                    onBlur={field.onBlur}
                                                    ariaInvalid={!!errors.college}
                                                    placeholder="Search or enter your college / university"
                                                    className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900"
                                                />
                                            )}
                                        />
                                        {errors.college && <p className="text-red-500 text-xs mt-1">{errors.college.message}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">Degree *</label>
                                        <ComboboxInput control={control} name="degree" options={DEGREE_SUGGESTIONS} placeholder="e.g. B.Tech" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">Field of Study *</label>
                                        <ComboboxInput control={control} name="fieldOfStudy" options={FIELD_SUGGESTIONS} placeholder="e.g. Computer Science" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">Current Role *</label>
                                        <ComboboxInput control={control} name="currentRole" options={ROLE_SUGGESTIONS} placeholder="e.g. Software Engineer" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">Current Company *</label>
                                        <ComboboxInput control={control} name="currentCompany" options={COMPANY_SUGGESTIONS} placeholder="e.g. Google" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[#4a3728] mb-2">Short Bio (Introduction) *</label>
                                    <textarea {...register('shortBio')} rows={4} placeholder="Briefly describe your mentorship background and how you can guide juniors..." className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900 resize-none"></textarea>
                                    {errors.shortBio && <p className="text-red-500 text-xs mt-1">{errors.shortBio.message}</p>}
                                </div>
                            </div>
                        )}

                        {/* STEP 2: Professional Details */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <h3 className="text-2xl font-black text-[#4a3728] mb-6">Professional Footprint</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">LinkedIn Profile URL *</label>
                                        <input type="url" {...register('linkedinUrl')} placeholder="https://linkedin.com/in/username" className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900" />
                                        {errors.linkedinUrl && <p className="text-red-500 text-xs mt-1">{errors.linkedinUrl.message}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">GitHub Profile URL (Optional)</label>
                                        <input type="url" {...register('githubUrl')} placeholder="https://github.com/username" className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900" />
                                        {errors.githubUrl && <p className="text-red-500 text-xs mt-1">{errors.githubUrl.message}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">Portfolio / Website (Optional)</label>
                                        <input type="url" {...register('portfolioUrl')} placeholder="https://portfolio.me" className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900" />
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
                                            {Object.values(ExperienceLevel).map((lvl) => (
                                                <option key={lvl} value={lvl}>{lvl.toUpperCase()}</option>
                                            ))}
                                        </select>
                                        {errors.experienceLevel && <p className="text-red-500 text-xs mt-1">{errors.experienceLevel.message}</p>}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">Primary Expertise Domain *</label>
                                        <select {...register('primaryExpertise')} className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900">
                                            <option value="">Select Domain</option>
                                            {Object.values(Domain).map((d) => (
                                                <option key={d} value={d}>{d.replace(/_/g, ' ').toUpperCase()}</option>
                                            ))}
                                        </select>
                                        {errors.primaryExpertise && <p className="text-red-500 text-xs mt-1">{errors.primaryExpertise.message}</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: Skills & Mentorship */}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <h3 className="text-2xl font-black text-[#4a3728] mb-6">Skills & Mentorship Capabilities</h3>

                                <TagInput fieldName="technologies" label="Tools, Frameworks & Tech Stack *" placeholder="e.g. React, Next.js, Node.js (Press Add)" />
                                <TagInput fieldName="otherSkills" label="Core Competencies & Skills *" placeholder="e.g. System Design, Data Structures (Press Add)" />
                                <TagInput fieldName="achievements" label="Key Highlights & Achievements (Optional)" placeholder="e.g. Smart India Hackathon Winner 2024" />
                                <TagInput fieldName="certifications" label="Certificates & Credentials (Optional)" placeholder="e.g. AWS Certified Solutions Architect" />

                                <div id="help-areas-section" className="pt-4 border-t border-[#ece7e2]">
                                    <label className="block text-sm font-bold text-[#4a3728] mb-1">
                                        Areas where you can guide juniors *
                                    </label>
                                    <p className="text-xs text-slate-500 mb-3">
                                        Select at least {MIN_HELP_AREAS} and up to {MAX_HELP_AREAS} areas ({selectedHelpAreas.length}/{MAX_HELP_AREAS} selected)
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {Object.values(MentorshipHelpArea).map((area) => {
                                            const checked = selectedHelpAreas.includes(area);
                                            const disabled = !checked && isMaxHelpAreas;
                                            const label = area.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                                            return (
                                                <label
                                                    key={area}
                                                    className={`flex items-center gap-3 p-3.5 border rounded-2xl transition ${disabled
                                                            ? 'opacity-40 cursor-not-allowed border-gray-200 bg-gray-50'
                                                            : checked
                                                                ? 'border-[#4a3728] bg-[#f8f6f4] cursor-pointer shadow-sm'
                                                                : 'border-[#ece7e2] hover:border-[#4a3728] cursor-pointer bg-white'
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        value={area}
                                                        disabled={disabled}
                                                        {...register('helpAreas')}
                                                        className="w-4 h-4 text-[#4a3728] rounded focus:ring-[#4a3728] disabled:cursor-not-allowed"
                                                    />
                                                    <span className={`text-sm font-bold ${checked ? 'text-[#4a3728]' : 'text-slate-600'}`}>{label}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    {errors.helpAreas && (
                                        <p className="text-red-500 text-sm font-semibold mt-3 flex items-center gap-1.5">
                                            <span>•</span>
                                            <span>{errors.helpAreas.message}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* STEP 4: Motivation */}
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

                        {/* STEP 5: Verification */}
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
                            ) : <div />}

                            {currentStep < 5 ? (
                                <button type="button" onClick={handleNext} className="px-8 py-3 bg-[#4a3728] text-white font-bold rounded-xl hover:bg-[#7a5c3e] transition-colors shadow">
                                    Next Step
                                </button>
                            ) : (
                                <button type="submit" disabled={isSubmitting} className="px-10 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg flex items-center gap-2">
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Application"}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}