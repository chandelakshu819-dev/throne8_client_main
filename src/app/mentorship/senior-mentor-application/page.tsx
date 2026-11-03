"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
    ChevronDown,
    Trash2,
    RefreshCw,
    AlertCircle,
    Info,
    Check,
    ArrowLeft,
    ArrowRight,
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
    'Software Engineer', 'Senior Software Engineer', 'Staff Software Engineer', 'Principal Engineer',
    'Software Developer', 'Associate Software Engineer', 'Software Engineer Intern', 'SDE 1', 'SDE 2', 'SDE 3',
    'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'Mobile App Developer',
    'React Developer', 'Node.js Developer', 'Java Developer', 'Python Developer', 'Web Developer',
    'DevOps Engineer', 'Site Reliability Engineer', 'Cloud Engineer', 'Cloud Architect',
    'Data Scientist', 'Data Engineer', 'Data Analyst', 'Machine Learning Engineer', 'AI Engineer',
    'Business Analyst', 'Business Intelligence Analyst', 'Product Manager', 'Associate Product Manager',
    'Technical Program Manager', 'Project Manager', 'Scrum Master',
    'UI/UX Designer', 'Product Designer', 'Graphic Designer',
    'QA Engineer', 'SDET', 'Security Engineer', 'Cyber Security Analyst', 'Blockchain Developer',
    'Solutions Architect', 'Technical Architect', 'Engineering Manager', 'Technical Lead', 'Team Lead',
    'Director of Engineering', 'VP of Engineering', 'CTO', 'Founder', 'Co-Founder',
    'Technical Consultant', 'System Analyst', 'Database Administrator', 'Network Engineer',
    'Digital Marketing Manager', 'Content Strategist', 'HR Manager', 'Technical Recruiter',
    'Freelancer', 'Trainer / Instructor',
];

const COMPANY_SUGGESTIONS = [
    'Google', 'Microsoft', 'Amazon', 'Apple', 'Meta', 'Netflix', 'Adobe', 'Uber', 'Salesforce', 'Oracle',
    'IBM', 'Intel', 'NVIDIA', 'Cisco', 'SAP', 'VMware', 'Atlassian', 'LinkedIn', 'Twitter / X', 'Airbnb',
    'Tata Consultancy Services', 'Infosys', 'Wipro', 'HCL Technologies', 'Tech Mahindra', 'Cognizant',
    'Capgemini', 'LTIMindtree', 'Mphasis', 'Persistent Systems', 'Zensar', 'Hexaware', 'Coforge',
    'Accenture', 'Deloitte', 'PwC', 'EY', 'KPMG', 'McKinsey & Company', 'Boston Consulting Group',
    'Goldman Sachs', 'Morgan Stanley', 'JPMorgan Chase', 'Barclays', 'American Express', 'Visa', 'Mastercard',
    'Flipkart', 'Swiggy', 'Zomato', 'Paytm', 'Razorpay', 'PhonePe', 'CRED', 'Ola', 'Byju\'s',
    'Meesho', 'Myntra', 'Nykaa', 'Zerodha', 'Groww', 'Freshworks', 'Zoho', 'InMobi', 'Dream11',
    'Physics Wallah', 'Unacademy', 'upGrad', 'Scaler', 'Coding Ninjas',
    'Startup', 'Freelance / Self-employed', 'Own Business',
];

const MAX_YEARS_OPTION = 40;
const YEARS_OPTIONS: number[] = Array.from({ length: MAX_YEARS_OPTION + 1 }, (_, i) => i);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const RESUME_ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const RESUME_ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx'];

const PROOF_ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
];
const PROOF_ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'];

const PHOTO_ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
];
const PHOTO_ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png'];

const isResumeValid = (file: File): boolean => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    return RESUME_ALLOWED_MIME_TYPES.includes(file.type) || RESUME_ALLOWED_EXTENSIONS.includes(ext);
};

const isProofValid = (file: File): boolean => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    return PROOF_ALLOWED_MIME_TYPES.includes(file.type) || PROOF_ALLOWED_EXTENSIONS.includes(ext);
};

const isPhotoValid = (file: File): boolean => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    return PHOTO_ALLOWED_MIME_TYPES.includes(file.type) || PHOTO_ALLOWED_EXTENSIONS.includes(ext);
};

const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

const normalizeUrl = (url: string | undefined): string => {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (!/^https?:\/\//i.test(trimmed)) {
        return `https://${trimmed}`;
    }
    return trimmed;
};

const DRAFT_STORAGE_KEY = 'throne8_senior_mentor_application_draft';

// ============================================================================
// 2. Validation Schema (Zod)
// ============================================================================

const createSchema = z.object({
    // Step 1: Personal Information
    mentorRole: z.enum(['senior_mentor', 'alumni'], {
        required_error: "Please select your mentor role.",
    }),
    fullName: z
        .string()
        .min(2, "Full name must be at least 2 characters.")
        .max(100, "Full name cannot exceed 100 characters."),
    profilePhotoFile: z
        .any()
        .refine((file) => file instanceof File, "Profile photo is required. Please upload your photo.")
        .refine((file: File) => !file || file.size <= MAX_FILE_SIZE, "Profile photo must be 5 MB or smaller.")
        .refine(
            (file: File) => !file || isPhotoValid(file),
            "Only JPG, JPEG, and PNG formats are supported for profile photos."
        ),
    college: z
        .string()
        .min(2, "College or University name must be at least 2 characters.")
        .max(200, "College name cannot exceed 200 characters."),
    degree: z
        .string()
        .min(2, "Degree must be at least 2 characters.")
        .max(100, "Degree cannot exceed 100 characters."),
    fieldOfStudy: z
        .string()
        .min(2, "Field of study must be at least 2 characters.")
        .max(100, "Field of study cannot exceed 100 characters."),
    graduationYear: z
        .number({ invalid_type_error: "Graduation year is required." })
        .int("Graduation year must be a valid whole year.")
        .min(1980, "Graduation year must be 1980 or later.")
        .max(new Date().getFullYear() + 10, "Please enter a valid graduation year."),
    currentRole: z
        .string()
        .max(100, "Current role cannot exceed 100 characters.")
        .refine((v) => !v || v.trim().length >= 2, "Current role must be at least 2 characters.")
        .optional()
        .or(z.literal('')),
    currentCompany: z
        .string()
        .max(100, "Current company cannot exceed 100 characters.")
        .refine((v) => !v || v.trim().length >= 2, "Current company must be at least 2 characters.")
        .optional()
        .or(z.literal('')),
    shortBio: z
        .string()
        .min(50, "Short bio must be at least 50 characters.")
        .max(1000, "Short bio cannot exceed 1000 characters."),

    // Step 2: Professional Information
    linkedinUrl: z
        .string()
        .min(1, "LinkedIn profile URL is required.")
        .regex(
            /^(https?:\/\/)?(www\.)?linkedin\.com\/.+/i,
            "Please provide a valid LinkedIn profile URL (e.g. https://linkedin.com/in/username)."
        ),
    githubUrl: z
        .string()
        .regex(/^(https?:\/\/)?(www\.)?github\.com\/.+/i, "Please provide a valid GitHub profile URL.")
        .optional()
        .or(z.literal('')),
    portfolioUrl: z
        .string()
        .url("Please provide a valid URL including https://.")
        .optional()
        .or(z.literal('')),
    yearsOfExperience: z
        .number({ invalid_type_error: "Please enter a valid number of years." })
        .min(0, "Years of experience cannot be negative.")
        .max(50, "Years of experience cannot exceed 50.")
        .optional()
        .nullable(),
    experienceLevel: z.nativeEnum(ExperienceLevel, {
        errorMap: () => ({ message: "Please select your experience level." }),
    }),
    primaryExpertise: z.nativeEnum(Domain, {
        errorMap: () => ({ message: "Please select your primary expertise domain." }),
    }),

    // Step 3: Skills & Expertise
    technologies: z
        .array(z.string())
        .min(1, "Please add at least 1 technology or tool.")
        .max(30, "Maximum 30 technologies allowed."),
    otherSkills: z
        .array(z.string())
        .min(1, "Please add at least 1 secondary skill.")
        .max(20, "Maximum 20 secondary skills allowed."),
    achievements: z
        .array(z.string())
        .max(15, "Maximum 15 achievements allowed.")
        .default([]),
    certifications: z
        .array(z.string())
        .max(15, "Maximum 15 certifications allowed.")
        .default([]),
    helpAreas: z
        .array(z.nativeEnum(MentorshipHelpArea))
        .min(MIN_HELP_AREAS, `Please select at least ${MIN_HELP_AREAS} areas where you can help juniors.`)
        .max(MAX_HELP_AREAS, `You can select up to ${MAX_HELP_AREAS} help areas.`),

    // Step 4: Additional Information
    motivation: z
        .string()
        .min(30, "Please share why you want to become a Senior Mentor (at least 30 characters).")
        .max(1000, "Motivation cannot exceed 1000 characters."),
    adviceToJuniorSelf: z
        .string()
        .min(10, "Please write at least 10 characters of advice.")
        .max(500, "Advice cannot exceed 500 characters."),

    // Step 5: Verification Documents
    resumeFile: z
        .any()
        .refine((file) => file instanceof File, "Resume is required. Please upload your resume.")
        .refine((file: File) => !file || file.size <= MAX_FILE_SIZE, "Resume file size must be 5 MB or smaller.")
        .refine(
            (file: File) => !file || isResumeValid(file),
            "Invalid file format. Only PDF, DOC, and DOCX files are accepted."
        ),
    proofDocumentFile: z
        .any()
        .refine(
            (file) => file instanceof File,
            "Proof of experience is required. Please upload your verification document."
        )
        .refine((file: File) => !file || file.size <= MAX_FILE_SIZE, "Proof document file size must be 5 MB or smaller.")
        .refine(
            (file: File) => !file || isProofValid(file),
            "Invalid file format. Only PDF, JPG, and PNG files are accepted."
        ),
});

type FormValues = z.infer<typeof createSchema>;

const steps = [
    {
        id: 1,
        title: 'Personal Information',
        shortTitle: 'Personal',
        fields: ['mentorRole', 'fullName', 'profilePhotoFile', 'college', 'degree', 'fieldOfStudy', 'graduationYear', 'currentRole', 'currentCompany', 'shortBio'],
    },
    {
        id: 2,
        title: 'Professional Information',
        shortTitle: 'Professional',
        fields: ['linkedinUrl', 'githubUrl', 'portfolioUrl', 'yearsOfExperience', 'experienceLevel', 'primaryExpertise'],
    },
    {
        id: 3,
        title: 'Skills & Expertise',
        shortTitle: 'Skills',
        fields: ['technologies', 'otherSkills', 'achievements', 'certifications', 'helpAreas'],
    },
    {
        id: 4,
        title: 'Additional Information',
        shortTitle: 'Motivation',
        fields: ['motivation', 'adviceToJuniorSelf'],
    },
    {
        id: 5,
        title: 'Verification Documents',
        shortTitle: 'Verification',
        fields: ['resumeFile', 'proofDocumentFile'],
    },
];

// ============================================================================
// 3. Themed Combobox
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

                const exactMatch = options.some((o) => o.toLowerCase() === query);
                const filtered = (query && !exactMatch
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
                            onClick={() => setOpen(true)}
                            onBlur={field.onBlur}
                            onKeyDown={handleKeyDown}
                            className={`w-full px-4 py-3 pr-11 bg-[#f8f6f4] border ${fieldState.error ? 'border-red-400 focus:ring-red-400' : 'border-[#ece7e2] focus:ring-[#4a3728]'} rounded-2xl focus:outline-none focus:ring-2 text-sm font-medium text-slate-900 transition`}
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
                                            const isSelected = opt.toLowerCase() === query;
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
                                                    className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${isSelected ? 'font-bold' : 'font-medium'} ${isActive
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
                                        No matching suggestions found. You may continue with your custom input.
                                    </p>
                                )}
                            </div>
                        )}
                        {fieldState.error && (
                            <p className="text-red-500 text-xs mt-1.5 font-medium">{fieldState.error.message as string}</p>
                        )}
                    </div>
                );
            }}
        />
    );
}

// ============================================================================
// 4. Themed Years of Experience dropdown
// ============================================================================

interface YearsSelectProps {
    control: Control<FormValues>;
    name: 'yearsOfExperience';
    options: number[];
    placeholder?: string;
}

function YearsSelect({ control, name, options, placeholder }: YearsSelectProps) {
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

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

    useEffect(() => {
        if (!open || !listRef.current) return;
        const el = listRef.current.children[activeIndex] as HTMLElement | undefined;
        el?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex, open]);

    const formatYears = (n: number) => {
        if (n === 0) return 'Less than 1 year (0 years)';
        if (n === 1) return '1 year';
        return `${n} years`;
    };

    return (
        <Controller
            control={control}
            name={name}
            render={({ field, fieldState }) => {
                const current = typeof field.value === 'number' && !Number.isNaN(field.value) ? field.value : null;

                const selectOption = (n: number | null) => {
                    field.onChange(n === null ? undefined : n);
                    setOpen(false);
                    setActiveIndex(-1);
                };

                const openList = () => {
                    setOpen(true);
                    const idx = current !== null ? options.indexOf(current) : -1;
                    setActiveIndex(idx);
                };

                const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        if (!open) {
                            openList();
                            return;
                        }
                        setActiveIndex((prev) => (prev + 1) % options.length);
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        if (!open) {
                            openList();
                            return;
                        }
                        setActiveIndex((prev) => (prev <= 0 ? options.length - 1 : prev - 1));
                    } else if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (open && activeIndex >= 0 && options[activeIndex] !== undefined) {
                            selectOption(options[activeIndex]);
                        } else {
                            openList();
                        }
                    } else if (e.key === 'Escape') {
                        setOpen(false);
                        setActiveIndex(-1);
                    }
                };

                return (
                    <div ref={containerRef} className="relative">
                        <button
                            type="button"
                            ref={field.ref}
                            name={field.name}
                            role="combobox"
                            aria-haspopup="listbox"
                            aria-expanded={open}
                            aria-invalid={fieldState.error ? 'true' : 'false'}
                            onClick={() => (open ? setOpen(false) : openList())}
                            onBlur={field.onBlur}
                            onKeyDown={handleKeyDown}
                            className={`w-full px-4 py-3 pr-11 bg-[#f8f6f4] border ${fieldState.error ? 'border-red-400 focus:ring-red-400' : 'border-[#ece7e2] focus:ring-[#4a3728]'} rounded-2xl focus:outline-none focus:ring-2 text-sm font-medium text-left transition`}
                        >
                            {current !== null ? (
                                <span className="text-slate-900 font-semibold">{formatYears(current)}</span>
                            ) : (
                                <span className="text-slate-400">{placeholder || 'Select years of experience'}</span>
                            )}
                        </button>
                        <ChevronDown
                            className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a7a6a] transition-transform ${open ? 'rotate-180' : ''}`}
                        />

                        {open && (
                            <div className="absolute left-0 right-0 z-30 mt-2 bg-white border border-[#ece7e2] rounded-2xl shadow-xl overflow-hidden">
                                <ul ref={listRef} role="listbox" className="max-h-60 overflow-y-auto py-1.5">
                                    {current !== null && (
                                        <li
                                            role="option"
                                            aria-selected={false}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                selectOption(null);
                                            }}
                                            className="px-4 py-2.5 text-sm font-medium cursor-pointer text-[#8a7a6a] hover:bg-[#f8f6f4] hover:text-[#4a3728] border-b border-[#ece7e2]"
                                        >
                                            Clear selection
                                        </li>
                                    )}
                                    {options.map((n, idx) => {
                                        const isActive = idx === activeIndex;
                                        const isSelected = n === current;
                                        return (
                                            <li
                                                key={n}
                                                role="option"
                                                aria-selected={isSelected}
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    selectOption(n);
                                                }}
                                                onMouseEnter={() => setActiveIndex(idx)}
                                                className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${isSelected ? 'font-bold' : 'font-medium'} ${isActive || isSelected
                                                    ? 'bg-[#f8f6f4] text-[#4a3728]'
                                                    : 'text-slate-700 hover:bg-[#f8f6f4] hover:text-[#4a3728]'
                                                    }`}
                                            >
                                                {formatYears(n)}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}
                        {fieldState.error && (
                            <p className="text-red-500 text-xs mt-1.5 font-medium">{fieldState.error.message as string}</p>
                        )}
                    </div>
                );
            }}
        />
    );
}

// ============================================================================
// 5. Document Upload Field (Resume & Proof of Experience)
// ============================================================================

interface DocumentUploadFieldProps {
    fieldName: 'resumeFile' | 'proofDocumentFile';
    label: string;
    accept: string;
    allowedExtensions: string[];
    allowedMimeTypes: string[];
    maxSizeBytes?: number;
    helperText: string;
    value: File | undefined | null;
    error?: string;
    onChange: (file: File | null) => void;
}

function DocumentUploadField({
    label,
    accept,
    allowedExtensions,
    allowedMimeTypes,
    maxSizeBytes = MAX_FILE_SIZE,
    helperText,
    value,
    error,
    onChange,
}: DocumentUploadFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const validateAndSetFile = (file: File) => {
        setLocalError(null);

        // Check size
        if (file.size > maxSizeBytes) {
            const sizeMsg = `File size exceeds ${maxSizeBytes / (1024 * 1024)} MB limit (${formatFileSize(file.size)}). Please choose a smaller file.`;
            setLocalError(sizeMsg);
            return;
        }

        // Check format
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const isTypeMatch = allowedMimeTypes.includes(file.type) || allowedExtensions.includes(ext);

        if (!isTypeMatch) {
            const typeMsg = `Unsupported file format. Please upload one of the following formats: ${allowedExtensions.map((e) => e.toUpperCase()).join(', ')}.`;
            setLocalError(typeMsg);
            return;
        }

        onChange(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            validateAndSetFile(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            validateAndSetFile(file);
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        setLocalError(null);
        onChange(null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    const handleReplaceClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        inputRef.current?.click();
    };

    const displayedError = localError || error;

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-[#4a3728]">
                    {label} <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-slate-500 font-medium">Max 5 MB</span>
            </div>

            <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept={accept}
                onChange={handleFileChange}
            />

            {value && value instanceof File ? (
                <div className="bg-[#f8f6f4] border-2 border-[#4a3728]/20 rounded-2xl p-4 transition-all hover:border-[#4a3728]/40">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-[#4a3728] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-[#4a3728] truncate" title={value.name}>
                                    {value.name}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-slate-500 font-medium">
                                        {formatFileSize(value.size)}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Ready to upload
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                                type="button"
                                onClick={handleReplaceClick}
                                className="px-3.5 py-2 text-xs font-bold text-[#4a3728] bg-white border border-[#ece7e2] hover:bg-[#ece7e2] rounded-xl transition flex items-center gap-1.5 shadow-sm"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Replace
                            </button>
                            <button
                                type="button"
                                onClick={handleRemove}
                                aria-label="Remove uploaded file"
                                className="px-3.5 py-2 text-xs font-bold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    className={`flex flex-col items-center justify-center w-full min-h-[140px] p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${isDragging
                        ? 'border-[#4a3728] bg-[#f0e8de]'
                        : displayedError
                            ? 'border-red-300 bg-red-50/30 hover:bg-red-50/50'
                            : 'border-[#ece7e2] bg-[#f8f6f4] hover:bg-[#f0e8de]/60 hover:border-[#4a3728]/40'
                        }`}
                >
                    <div className="w-12 h-12 rounded-2xl bg-white border border-[#ece7e2] flex items-center justify-center mb-2.5 text-[#4a3728] shadow-sm">
                        <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-bold text-[#4a3728] mb-1 text-center">
                        Click to upload <span className="font-normal text-slate-500">or drag and drop</span>
                    </p>
                    <p className="text-xs text-[#8a7a6a] text-center font-medium">
                        {helperText}
                    </p>
                </div>
            )}

            {displayedError && (
                <div className="flex items-center gap-1.5 text-red-500 text-xs mt-2 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{displayedError}</span>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// 6. Main Senior Mentor Application Component
// ============================================================================

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
        reset,
    } = useForm<FormValues>({
        resolver: zodResolver(createSchema),
        defaultValues: {
            mentorRole: undefined,
            fullName: '',
            college: '',
            degree: '',
            fieldOfStudy: '',
            currentRole: '',
            currentCompany: '',
            shortBio: '',
            linkedinUrl: '',
            githubUrl: '',
            portfolioUrl: '',
            yearsOfExperience: undefined,
            experienceLevel: undefined,
            primaryExpertise: undefined,
            otherSkills: [],
            technologies: [],
            achievements: [],
            certifications: [],
            helpAreas: [],
            motivation: '',
            adviceToJuniorSelf: '',
        },
    });

    const selectedHelpAreas = (watch('helpAreas') || []) as MentorshipHelpArea[];
    const isMaxHelpAreas = selectedHelpAreas.length >= MAX_HELP_AREAS;

    const shortBioValue = watch('shortBio') || '';
    const motivationValue = watch('motivation') || '';
    const adviceValue = watch('adviceToJuniorSelf') || '';

    // Auto-dismiss toast after 5s
    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 5000);
        return () => clearTimeout(timer);
    }, [toast]);

    // Clear helpAreas validation error if count threshold is satisfied
    useEffect(() => {
        if (selectedHelpAreas.length >= MIN_HELP_AREAS && errors.helpAreas) {
            clearErrors('helpAreas');
        }
    }, [selectedHelpAreas.length, errors.helpAreas, clearErrors]);

    // Standalone 8-second safety timer on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            timedOutRef.current = true;
            if (!isRedirectingRef.current) {
                setIsLoadingInit(false);
            }
        }, 8000);
        return () => clearTimeout(timer);
    }, []);

    // Save draft to localStorage whenever non-file form values change
    const saveDraft = useCallback(() => {
        if (typeof window === 'undefined') return;
        const values = getValues();
        const serializableDraft: Record<string, any> = {
            mentorRole: values.mentorRole,
            fullName: values.fullName,
            college: values.college,
            degree: values.degree,
            fieldOfStudy: values.fieldOfStudy,
            graduationYear: values.graduationYear,
            currentRole: values.currentRole,
            currentCompany: values.currentCompany,
            shortBio: values.shortBio,
            linkedinUrl: values.linkedinUrl,
            githubUrl: values.githubUrl,
            portfolioUrl: values.portfolioUrl,
            yearsOfExperience: values.yearsOfExperience,
            experienceLevel: values.experienceLevel,
            primaryExpertise: values.primaryExpertise,
            technologies: values.technologies,
            otherSkills: values.otherSkills,
            achievements: values.achievements,
            certifications: values.certifications,
            helpAreas: values.helpAreas,
            motivation: values.motivation,
            adviceToJuniorSelf: values.adviceToJuniorSelf,
            savedStep: currentStep,
        };
        try {
            localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(serializableDraft));
        } catch {
            // Ignore quota or private-browsing errors
        }
    }, [getValues, currentStep]);

    // Main data loading coordinator
    useEffect(() => {
        if (isAuthLoading || hasPrefilledRef.current) return;

        let isMounted = true;

        const loadAndPrefill = async () => {
            try {
                // Check existing application status first
                const app = await SeniorMentorApplicationService.getMyApplication().catch(() => null);
                if (!isMounted) return;

                if (app) {
                    isRedirectingRef.current = true;
                    router.push(`/mentorship/senior-mentor-profile/${app.userId}`);
                    return;
                }

                if (timedOutRef.current) {
                    setIsLoadingInit(false);
                    return;
                }

                // Check localStorage draft
                let savedDraft: Record<string, any> | null = null;
                try {
                    const localData = localStorage.getItem(DRAFT_STORAGE_KEY);
                    if (localData) {
                        savedDraft = JSON.parse(localData);
                    }
                } catch {
                    savedDraft = null;
                }

                // Fetch profile & education in parallel if user logged in
                if (user?.userId) {
                    const [profileRes, eduRes] = await Promise.allSettled([
                        AuthService.getUserProfile(),
                        ProfileService.getAllEducation(false),
                    ]);

                    if (!isMounted || timedOutRef.current) return;

                    const userProfile = profileRes.status === 'fulfilled' ? profileRes.value?.data : null;
                    const educationList: IEducationItem[] =
                        eduRes.status === 'fulfilled' ? (eduRes.value?.data?.educationList || []) : [];

                    if (userProfile) {
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

                        // Profile photo download
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
                                        if (!timedOutRef.current) setPhotoHint('Existing profile photo exceeds 5 MB. Please upload a smaller image.');
                                    } else {
                                        if (!timedOutRef.current) setPhotoHint('Existing profile photo is not in JPG/PNG format. Please upload a JPG or PNG image.');
                                    }
                                }
                            } catch {
                                clearTimeout(photoTimer);
                                if (!timedOutRef.current) setPhotoHint('Could not load existing profile photo. Please upload one manually.');
                            }
                        }

                        if (!isMounted || timedOutRef.current) return;

                        // Apply prefill
                        const fullName = `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim();
                        if (fullName && !dirtyFields.fullName) {
                            setValue('fullName', fullName, { shouldValidate: true, shouldDirty: false });
                        }

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

                        if (aboutText && !dirtyFields.shortBio) {
                            setValue('shortBio', aboutText.trim(), { shouldValidate: true, shouldDirty: false });
                        }

                        if (photoFile && !dirtyFields.profilePhotoFile && !getValues('profilePhotoFile')) {
                            setValue('profilePhotoFile', photoFile as any, { shouldValidate: false, shouldDirty: false });
                            isPrefilledPhotoRef.current = true;
                        }
                    }
                }

                // If user had previous draft in localStorage, overwrite matching fields with saved user edits
                if (savedDraft) {
                    if (savedDraft.mentorRole) setValue('mentorRole', savedDraft.mentorRole);
                    if (savedDraft.fullName) setValue('fullName', savedDraft.fullName);
                    if (savedDraft.college) setValue('college', savedDraft.college);
                    if (savedDraft.degree) setValue('degree', savedDraft.degree);
                    if (savedDraft.fieldOfStudy) setValue('fieldOfStudy', savedDraft.fieldOfStudy);
                    if (savedDraft.graduationYear) setValue('graduationYear', Number(savedDraft.graduationYear));
                    if (savedDraft.currentRole) setValue('currentRole', savedDraft.currentRole);
                    if (savedDraft.currentCompany) setValue('currentCompany', savedDraft.currentCompany);
                    if (savedDraft.shortBio) setValue('shortBio', savedDraft.shortBio);

                    if (savedDraft.linkedinUrl) setValue('linkedinUrl', savedDraft.linkedinUrl);
                    if (savedDraft.githubUrl) setValue('githubUrl', savedDraft.githubUrl);
                    if (savedDraft.portfolioUrl) setValue('portfolioUrl', savedDraft.portfolioUrl);
                    if (typeof savedDraft.yearsOfExperience === 'number') setValue('yearsOfExperience', savedDraft.yearsOfExperience);
                    if (savedDraft.experienceLevel) setValue('experienceLevel', savedDraft.experienceLevel);
                    if (savedDraft.primaryExpertise) setValue('primaryExpertise', savedDraft.primaryExpertise);

                    if (Array.isArray(savedDraft.technologies)) setValue('technologies', savedDraft.technologies);
                    if (Array.isArray(savedDraft.otherSkills)) setValue('otherSkills', savedDraft.otherSkills);
                    if (Array.isArray(savedDraft.achievements)) setValue('achievements', savedDraft.achievements);
                    if (Array.isArray(savedDraft.certifications)) setValue('certifications', savedDraft.certifications);
                    if (Array.isArray(savedDraft.helpAreas)) setValue('helpAreas', savedDraft.helpAreas);

                    if (savedDraft.motivation) setValue('motivation', savedDraft.motivation);
                    if (savedDraft.adviceToJuniorSelf) setValue('adviceToJuniorSelf', savedDraft.adviceToJuniorSelf);

                    if (typeof savedDraft.savedStep === 'number' && savedDraft.savedStep >= 1 && savedDraft.savedStep <= 5) {
                        setCurrentStep(savedDraft.savedStep);
                    }
                }
            } catch (err) {
                console.error("Error during application initialization:", err);
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

    // Handle next step with validation
    const handleNext = async () => {
        if (currentStep === 3) {
            if (selectedHelpAreas.length < MIN_HELP_AREAS) {
                setError('helpAreas', {
                    type: 'manual',
                    message: `Please select at least ${MIN_HELP_AREAS} help areas (${selectedHelpAreas.length} selected).`,
                });
                const el = document.getElementById('help-areas-section');
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }
        }

        const stepFields = steps.find((s) => s.id === currentStep)?.fields as (keyof FormValues)[];
        const isValid = await trigger(stepFields);

        if (isValid) {
            setErrorMsg('');
            setCurrentStep((prev) => {
                const nextStep = Math.min(5, prev + 1);
                return nextStep;
            });
            saveDraft();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            const firstInvalid = document.querySelector<HTMLElement>('[aria-invalid="true"]');
            firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const handlePrev = () => {
        setErrorMsg('');
        setCurrentStep((prev) => Math.max(1, prev - 1));
        saveDraft();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const onInvalid = (formErrors: any) => {
        console.error('[SENIOR_MENTOR_APP] Form validation errors:', formErrors);
        const errorKeys = Object.keys(formErrors);
        if (errorKeys.length > 0) {
            const firstKey = errorKeys[0];
            const stepWithErr = steps.find((s) => (s.fields as string[]).includes(firstKey));
            if (stepWithErr) {
                setCurrentStep(stepWithErr.id);
            }
            const msg =
                formErrors[firstKey]?.message ||
                `Please review and complete the required fields in Step ${stepWithErr?.id || currentStep}.`;
            const fullErrMsg = `Unable to submit your application. ${msg}`;
            setErrorMsg(fullErrMsg);
            setToast({ type: 'error', message: fullErrMsg });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const onSubmit = async (values: FormValues) => {
        if (isSubmitting) return;

        try {
            setIsSubmitting(true);
            setErrorMsg('');
            setToast(null);

            const formData = new FormData();

            // Step 1: Personal Information
            formData.append('mentorRole', values.mentorRole);
            formData.append('fullName', values.fullName.trim());
            formData.append('college', values.college.trim());
            formData.append('degree', values.degree.trim());
            formData.append('fieldOfStudy', values.fieldOfStudy.trim());
            formData.append('graduationYear', values.graduationYear.toString());
            if (values.currentRole?.trim()) formData.append('currentRole', values.currentRole.trim());
            if (values.currentCompany?.trim()) formData.append('currentCompany', values.currentCompany.trim());
            formData.append('shortBio', values.shortBio.trim());

            // Step 2: Professional Information
            formData.append('linkedinUrl', normalizeUrl(values.linkedinUrl));
            if (values.githubUrl?.trim()) formData.append('githubUrl', normalizeUrl(values.githubUrl));
            if (values.portfolioUrl?.trim()) formData.append('portfolioUrl', normalizeUrl(values.portfolioUrl));
            if (typeof values.yearsOfExperience === 'number') {
                formData.append('yearsOfExperience', values.yearsOfExperience.toString());
            }
            formData.append('experienceLevel', values.experienceLevel);
            formData.append('primaryExpertise', values.primaryExpertise);

            // Step 3: Skills & Expertise
            formData.append('otherSkills', JSON.stringify(values.otherSkills));
            formData.append('technologies', JSON.stringify(values.technologies));
            formData.append('achievements', JSON.stringify(values.achievements || []));
            formData.append('certifications', JSON.stringify(values.certifications || []));
            formData.append('helpAreas', JSON.stringify(values.helpAreas));

            // Step 4: Additional Information
            formData.append('motivation', values.motivation.trim());
            formData.append('adviceToJuniorSelf', values.adviceToJuniorSelf.trim());

            // Step 5: Verification Documents & Photo
            // Append both field names for maximum compatibility with server multer
            if (values.profilePhotoFile instanceof File) {
                formData.append('profilePhoto', values.profilePhotoFile);
                formData.append('profilePhotoFile', values.profilePhotoFile);
            }
            if (values.resumeFile instanceof File) {
                formData.append('resume', values.resumeFile);
                formData.append('resumeFile', values.resumeFile);
            }
            if (values.proofDocumentFile instanceof File) {
                formData.append('proofDocument', values.proofDocumentFile);
                formData.append('proofDocumentFile', values.proofDocumentFile);
            }

            const resp = await SeniorMentorApplicationService.apply(formData);

            if (resp && (resp.applicationId || resp.verificationStatus)) {
                // Sync profile photo to other roles if newly uploaded
                if (!isPrefilledPhotoRef.current && values.profilePhotoFile instanceof File) {
                    syncProfilePhotoToAllRoles(values.profilePhotoFile, user?.userId, { skip: ['senior'] }).catch((err) => {
                        console.error('Failed to sync profile photo to other roles:', err);
                    });
                }

                // Clear saved draft on successful submission
                try {
                    localStorage.removeItem(DRAFT_STORAGE_KEY);
                } catch {
                    // Ignore
                }

                setSuccessMsg(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                throw new Error('Application submission could not be verified.');
            }
        } catch (error: any) {
            console.error('[SENIOR_MENTOR_APP] Submission failed:', error);
            const resp = error?.response?.data;
            let reason = 'Please review the highlighted fields and try again.';

            if (Array.isArray(resp?.errors) && resp.errors.length > 0) {
                resp.errors.forEach((err: { field: string; message: string }) => {
                    if (err.field) {
                        const targetField =
                            err.field === 'resume'
                                ? 'resumeFile'
                                : err.field === 'proofDocument'
                                    ? 'proofDocumentFile'
                                    : err.field === 'profilePhoto'
                                        ? 'profilePhotoFile'
                                        : (err.field as keyof FormValues);

                        setError(targetField, {
                            type: 'server',
                            message: err.message || 'Invalid value',
                        });
                    }
                });

                const firstErr = resp.errors[0];
                reason = firstErr.message || `${firstErr.field} is invalid.`;
                const stepWithErr = steps.find((s) =>
                    (s.fields as string[]).includes(firstErr.field) ||
                    (firstErr.field === 'resume' && s.id === 5) ||
                    (firstErr.field === 'proofDocument' && s.id === 5) ||
                    (firstErr.field === 'profilePhoto' && s.id === 1)
                );
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

            const fullErrMsg = `Unable to submit your application. ${reason}`;
            setErrorMsg(fullErrMsg);
            setToast({ type: 'error', message: fullErrMsg });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingInit) {
        return (
            <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4 text-center">
                    <Loader2 className="w-10 h-10 text-[#4a3728] animate-spin" />
                    <p className="text-sm font-semibold text-[#4a3728]">Loading your application details...</p>
                </div>
            </div>
        );
    }

    if (successMsg) {
        return (
            <div className="min-h-screen bg-[#FAF9F6] p-6 lg:p-12 flex items-center justify-center">
                <div className="max-w-2xl w-full bg-white p-10 rounded-[40px] shadow-2xl border border-[#ece7e2] text-center animate-fade-in">
                    <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <h2 className="text-3xl font-black text-[#4a3728] mb-3">Application Submitted!</h2>
                    <p className="text-slate-600 mb-8 max-w-md mx-auto leading-relaxed text-sm">
                        Thank you for applying to become a Senior Mentor. Your application has been received and is currently under review by our team. We will notify you once your verification is complete.
                    </p>
                    <div className="p-4 bg-[#f8f6f4] rounded-2xl border border-[#ece7e2] text-xs text-slate-600 mb-8 text-left max-w-md mx-auto space-y-2">
                        <div className="flex items-center gap-2 font-bold text-[#4a3728]">
                            <Info className="w-4 h-4 text-[#4a3728]" />
                            <span>What happens next?</span>
                        </div>
                        <p>1. Our team reviews your academic and experience verification documents.</p>
                        <p>2. You will receive an email and platform notification with the status update.</p>
                        <p>3. Once approved, you can set your availability and begin mentoring students.</p>
                    </div>
                    <button
                        onClick={() => router.push('/mentorship')}
                        className="px-8 py-3.5 bg-[#4a3728] text-white rounded-xl font-bold shadow hover:bg-[#7a5c3e] transition text-sm inline-flex items-center gap-2"
                    >
                        Back to Mentorship
                    </button>
                </div>
            </div>
        );
    }

    const TagInput = ({
        fieldName,
        label,
        placeholder,
        maxTags = 20,
        required = false,
    }: {
        fieldName: keyof FormValues;
        label: string;
        placeholder: string;
        maxTags?: number;
        required?: boolean;
    }) => {
        const [inputValue, setInputValue] = useState("");
        const tags = (watch(fieldName) as string[]) || [];

        const addTag = () => {
            const val = inputValue.trim();
            if (val && !tags.includes(val) && tags.length < maxTags) {
                setValue(fieldName, [...tags, val] as any, { shouldValidate: true, shouldDirty: true });
                setInputValue("");
                saveDraft();
            }
        };

        const removeTag = (tagToRemove: string) => {
            setValue(fieldName, tags.filter((t: string) => t !== tagToRemove) as any, { shouldValidate: true, shouldDirty: true });
            saveDraft();
        };

        return (
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-[#4a3728]">
                        {label} {required && <span className="text-red-500">*</span>}
                    </label>
                    <span className="text-xs text-slate-500 font-medium">
                        {tags.length}/{maxTags} added
                    </span>
                </div>

                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {tags.map((tag, i) => (
                            <span
                                key={i}
                                className="px-3 py-1 bg-[#4a3728] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                            >
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => removeTag(tag)}
                                    aria-label={`Remove ${tag}`}
                                    className="hover:text-red-300 ml-1 text-sm leading-none"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        disabled={tags.length >= maxTags}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                addTag();
                            }
                        }}
                        placeholder={tags.length >= maxTags ? "Maximum reached" : placeholder}
                        className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900 disabled:opacity-50"
                    />
                    <button
                        type="button"
                        onClick={addTag}
                        disabled={!inputValue.trim() || tags.length >= maxTags}
                        className="px-5 bg-[#4a3728] text-white rounded-2xl font-bold hover:bg-[#7a5c3e] transition text-sm disabled:opacity-40"
                    >
                        Add
                    </button>
                </div>
                {errors[fieldName] && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium">{errors[fieldName]?.message as string}</p>
                )}
            </div>
        );
    };

    const profilePhotoFile = watch('profilePhotoFile') as File | undefined;
    const profilePicPreview = profilePhotoFile instanceof File ? URL.createObjectURL(profilePhotoFile) : '';

    return (
        <div className="min-h-screen bg-[#FAF9F6] flex items-start justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {toast && (
                <div
                    className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-semibold transition-all ${toast.type === 'error'
                        ? 'bg-red-50 text-red-800 border-red-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                >
                    {toast.type === 'error' ? (
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    ) : (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    )}
                    <span>{toast.message}</span>
                    <button
                        type="button"
                        onClick={() => setToast(null)}
                        className="ml-2 hover:opacity-70 text-slate-400 hover:text-slate-700"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="max-w-3xl w-full my-6 relative">
                <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="bg-white rounded-[40px] shadow-2xl relative border border-[#ece7e2]">
                    {/* Close / Return Button */}
                    <button
                        type="button"
                        onClick={() => router.back()}
                        aria-label="Close application form"
                        className="absolute top-6 right-6 w-10 h-10 bg-[#f8f6f4] hover:bg-[#4a3728] text-[#4a3728] hover:text-white rounded-full flex items-center justify-center transition-all z-20 shadow-sm"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Form Header */}
                    <div className="bg-gradient-to-br from-[#4a3728] via-[#5c4535] to-[#7a5c3e] p-8 sm:p-10 rounded-t-[40px] text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                        <div className="relative z-10">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                                <Users className="w-7 h-7 text-white" />
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black mb-2 tracking-tight">
                                Senior Mentor Application
                            </h1>
                            <p className="text-white/80 font-medium text-sm sm:text-base max-w-xl">
                                Share your academic achievements and industry expertise to guide fellow students and juniors.
                            </p>

                            {/* Multi-step progress tracker */}
                            <div className="mt-8">
                                <div className="flex items-center gap-2 mb-3">
                                    {[1, 2, 3, 4, 5].map((step) => (
                                        <button
                                            key={step}
                                            type="button"
                                            disabled={step > currentStep}
                                            onClick={() => {
                                                if (step < currentStep) {
                                                    setCurrentStep(step);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }
                                            }}
                                            className={`h-2 rounded-full flex-1 transition-all ${currentStep >= step
                                                ? 'bg-white'
                                                : 'bg-white/25'
                                                } ${step < currentStep ? 'cursor-pointer hover:bg-white/80' : 'cursor-default'}`}
                                            title={`Go to Step ${step}`}
                                        />
                                    ))}
                                </div>
                                <div className="flex justify-between text-xs font-bold text-white/80">
                                    <span>Step {currentStep} of 5</span>
                                    <span>{steps.find((s) => s.id === currentStep)?.title}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step Body */}
                    <div className="p-6 sm:p-10">
                        {errorMsg && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-semibold flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        {/* STEP 1: Personal Information */}
                        {currentStep === 1 && (
                            <div className="space-y-6 animate-fade-in">
                                <div>
                                    <h2 className="text-2xl font-black text-[#4a3728] tracking-tight">
                                        Personal Information
                                    </h2>
                                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                        Tell us about your background, education, and current academic or professional profile.
                                    </p>
                                </div>

                                {/* Mentor Role Selection */}
                                <div>
                                    <label className="block text-sm font-bold text-[#4a3728] mb-2.5">
                                        Which mentor role best describes you? <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label
                                            className={`flex items-start gap-3.5 p-4 border rounded-2xl cursor-pointer transition ${watch('mentorRole') === 'senior_mentor'
                                                ? 'border-[#4a3728] bg-[#f8f6f4] shadow-sm ring-1 ring-[#4a3728]'
                                                : 'border-[#ece7e2] hover:border-[#4a3728]/50 bg-white'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                value="senior_mentor"
                                                {...register('mentorRole')}
                                                onChange={(e) => {
                                                    register('mentorRole').onChange(e);
                                                    saveDraft();
                                                }}
                                                className="mt-1 text-[#4a3728] focus:ring-[#4a3728]"
                                            />
                                            <div>
                                                <p className="text-sm font-bold text-[#4a3728] flex items-center gap-1.5">
                                                    <Award className="w-4 h-4 text-[#4a3728]" />
                                                    Senior Mentor
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                                    Pre-final or Final year student with proven technical expertise, ready to mentor junior students.
                                                </p>
                                            </div>
                                        </label>

                                        <label
                                            className={`flex items-start gap-3.5 p-4 border rounded-2xl cursor-pointer transition ${watch('mentorRole') === 'alumni'
                                                ? 'border-[#4a3728] bg-[#f8f6f4] shadow-sm ring-1 ring-[#4a3728]'
                                                : 'border-[#ece7e2] hover:border-[#4a3728]/50 bg-white'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                value="alumni"
                                                {...register('mentorRole')}
                                                onChange={(e) => {
                                                    register('mentorRole').onChange(e);
                                                    saveDraft();
                                                }}
                                                className="mt-1 text-[#4a3728] focus:ring-[#4a3728]"
                                            />
                                            <div>
                                                <p className="text-sm font-bold text-[#4a3728] flex items-center gap-1.5">
                                                    <GraduationCap className="w-4 h-4 text-[#4a3728]" />
                                                    Alumni Mentor
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                                    Graduated professional guiding college students on placements, interviews, and early career growth.
                                                </p>
                                            </div>
                                        </label>
                                    </div>
                                    {errors.mentorRole && (
                                        <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.mentorRole.message}</p>
                                    )}
                                </div>

                                {/* Profile Photo Upload */}
                                <div>
                                    <label className="block text-sm font-bold text-[#4a3728] mb-2">
                                        Profile Photo <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                                        <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#ece7e2] overflow-hidden flex items-center justify-center bg-[#f8f6f4] relative flex-shrink-0 shadow-inner">
                                            {profilePicPreview ? (
                                                <img src={profilePicPreview} alt="Profile Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="w-8 h-8 text-[#8a7a6a]" />
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <label className="px-5 py-2.5 bg-[#f8f6f4] hover:bg-[#ece7e2] text-[#4a3728] font-bold rounded-xl text-sm cursor-pointer transition flex items-center gap-2 border border-[#ece7e2] shadow-sm">
                                                    <Upload className="w-4 h-4" />
                                                    {profilePicPreview ? 'Change Photo' : 'Upload Photo'}
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/jpeg,image/png"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                if (file.size > MAX_FILE_SIZE) {
                                                                    setError('profilePhotoFile', {
                                                                        type: 'manual',
                                                                        message: 'Profile photo size exceeds 5 MB. Please upload a smaller image.',
                                                                    });
                                                                    return;
                                                                }
                                                                if (!isPhotoValid(file)) {
                                                                    setError('profilePhotoFile', {
                                                                        type: 'manual',
                                                                        message: 'Unsupported format. Please upload a JPG or PNG image.',
                                                                    });
                                                                    return;
                                                                }
                                                                clearErrors('profilePhotoFile');
                                                                isPrefilledPhotoRef.current = false;
                                                                setValue('profilePhotoFile', file as any, { shouldValidate: true, shouldDirty: true });
                                                            }
                                                        }}
                                                    />
                                                </label>
                                                {profilePicPreview && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setValue('profilePhotoFile', null as any, { shouldValidate: true, shouldDirty: true });
                                                        }}
                                                        className="px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition border border-red-200"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium">
                                                JPG or PNG format • Maximum size 5 MB
                                            </p>
                                        </div>
                                    </div>
                                    {photoHint && (
                                        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-2 font-medium">
                                            {photoHint}
                                        </p>
                                    )}
                                    {errors.profilePhotoFile && (
                                        <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.profilePhotoFile.message as string}</p>
                                    )}
                                </div>

                                {/* Personal & Academic Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            {...register('fullName')}
                                            onChange={(e) => {
                                                register('fullName').onChange(e);
                                                saveDraft();
                                            }}
                                            autoComplete="name"
                                            placeholder="Enter your full name"
                                            className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900"
                                        />
                                        {errors.fullName && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.fullName.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">
                                            Graduation Year <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            {...register('graduationYear', { valueAsNumber: true })}
                                            onChange={(e) => {
                                                register('graduationYear', { valueAsNumber: true }).onChange(e);
                                                saveDraft();
                                            }}
                                            placeholder="e.g. 2025"
                                            className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900"
                                        />
                                        {errors.graduationYear && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.graduationYear.message}</p>}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">
                                            College / University <span className="text-red-500">*</span>
                                        </label>
                                        <Controller
                                            name="college"
                                            control={control}
                                            render={({ field }) => (
                                                <CollegeAutocomplete
                                                    id="college"
                                                    name={field.name}
                                                    value={field.value || ''}
                                                    onChange={(val) => {
                                                        field.onChange(val);
                                                        saveDraft();
                                                    }}
                                                    onBlur={field.onBlur}
                                                    ariaInvalid={!!errors.college}
                                                    placeholder="Search or enter your college / university name"
                                                    className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900"
                                                />
                                            )}
                                        />
                                        {errors.college && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.college.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">
                                            Degree <span className="text-red-500">*</span>
                                        </label>
                                        <ComboboxInput control={control} name="degree" options={DEGREE_SUGGESTIONS} placeholder="e.g. B.Tech, MCA, MBA" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">
                                            Field of Study <span className="text-red-500">*</span>
                                        </label>
                                        <ComboboxInput control={control} name="fieldOfStudy" options={FIELD_SUGGESTIONS} placeholder="e.g. Computer Science" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">
                                            Current Role <span className="text-slate-400 font-normal">(Optional)</span>
                                        </label>
                                        <ComboboxInput control={control} name="currentRole" options={ROLE_SUGGESTIONS} placeholder="e.g. Software Engineer, SDE Intern" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">
                                            Current Company <span className="text-slate-400 font-normal">(Optional)</span>
                                        </label>
                                        <ComboboxInput control={control} name="currentCompany" options={COMPANY_SUGGESTIONS} placeholder="e.g. Google, Microsoft, Startup" />
                                    </div>
                                </div>

                                {/* Short Bio with Live Character Counter */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-bold text-[#4a3728]">
                                            Short Bio / Introduction <span className="text-red-500">*</span>
                                        </label>
                                        <span className={`text-xs font-semibold ${shortBioValue.length < 50 ? 'text-amber-600' : 'text-slate-500'}`}>
                                            {shortBioValue.length} / 1000 characters (minimum 50 required)
                                        </span>
                                    </div>
                                    <textarea
                                        {...register('shortBio')}
                                        onChange={(e) => {
                                            register('shortBio').onChange(e);
                                            saveDraft();
                                        }}
                                        rows={4}
                                        placeholder="Briefly introduce yourself, your academic background, and how you plan to support juniors..."
                                        className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900 resize-none"
                                    />
                                    {errors.shortBio && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.shortBio.message}</p>}
                                </div>
                            </div>
                        )}

                        {/* STEP 2: Professional Information */}
                        {currentStep === 2 && (
                            <div className="space-y-6 animate-fade-in">
                                <div>
                                    <h2 className="text-2xl font-black text-[#4a3728] tracking-tight">
                                        Professional Information
                                    </h2>
                                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                        Provide your professional profiles, industry experience level, and domain expertise.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">
                                            LinkedIn Profile URL <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            {...register('linkedinUrl')}
                                            onChange={(e) => {
                                                register('linkedinUrl').onChange(e);
                                                saveDraft();
                                            }}
                                            placeholder="https://linkedin.com/in/username"
                                            className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900"
                                        />
                                        {errors.linkedinUrl && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.linkedinUrl.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">
                                            GitHub Profile URL <span className="text-slate-400 font-normal">(Optional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            {...register('githubUrl')}
                                            onChange={(e) => {
                                                register('githubUrl').onChange(e);
                                                saveDraft();
                                            }}
                                            placeholder="https://github.com/username"
                                            className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900"
                                        />
                                        {errors.githubUrl && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.githubUrl.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">
                                            Portfolio / Website URL <span className="text-slate-400 font-normal">(Optional)</span>
                                        </label>
                                        <input
                                            type="url"
                                            {...register('portfolioUrl')}
                                            onChange={(e) => {
                                                register('portfolioUrl').onChange(e);
                                                saveDraft();
                                            }}
                                            placeholder="https://yourportfolio.me"
                                            className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900"
                                        />
                                        {errors.portfolioUrl && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.portfolioUrl.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">
                                            Years of Experience <span className="text-slate-400 font-normal">(Optional)</span>
                                        </label>
                                        <YearsSelect control={control} name="yearsOfExperience" options={YEARS_OPTIONS} placeholder="Select experience" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">
                                            Experience Level <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            {...register('experienceLevel')}
                                            onChange={(e) => {
                                                register('experienceLevel').onChange(e);
                                                saveDraft();
                                            }}
                                            className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900"
                                        >
                                            <option value="">Select Level</option>
                                            {Object.values(ExperienceLevel).map((lvl) => (
                                                <option key={lvl} value={lvl}>
                                                    {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.experienceLevel && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.experienceLevel.message}</p>}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">
                                            Primary Expertise Domain <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            {...register('primaryExpertise')}
                                            onChange={(e) => {
                                                register('primaryExpertise').onChange(e);
                                                saveDraft();
                                            }}
                                            className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900"
                                        >
                                            <option value="">Select Domain</option>
                                            {Object.values(Domain).map((d) => (
                                                <option key={d} value={d}>
                                                    {d.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.primaryExpertise && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.primaryExpertise.message}</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: Skills & Expertise */}
                        {currentStep === 3 && (
                            <div className="space-y-6 animate-fade-in">
                                <div>
                                    <h2 className="text-2xl font-black text-[#4a3728] tracking-tight">
                                        Skills & Expertise
                                    </h2>
                                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                        Highlight the technical tools and subjects where you can provide high-value mentorship.
                                    </p>
                                </div>

                                <TagInput
                                    fieldName="technologies"
                                    label="Tools, Frameworks & Tech Stack"
                                    placeholder="e.g. React, Python, Docker, Node.js"
                                    maxTags={30}
                                    required
                                />

                                <TagInput
                                    fieldName="otherSkills"
                                    label="Core Competencies & Skills"
                                    placeholder="e.g. Data Structures, System Design, Git"
                                    maxTags={20}
                                    required
                                />

                                <TagInput
                                    fieldName="achievements"
                                    label="Key Highlights & Achievements (Optional)"
                                    placeholder="e.g. Hackathon Winner, Dean's List, Research Publication"
                                    maxTags={15}
                                />

                                <TagInput
                                    fieldName="certifications"
                                    label="Certifications & Credentials (Optional)"
                                    placeholder="e.g. AWS Certified Developer, Google Cloud Associate"
                                    maxTags={15}
                                />

                                <div id="help-areas-section" className="pt-4 border-t border-[#ece7e2]">
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-sm font-bold text-[#4a3728]">
                                            Areas where you can guide juniors <span className="text-red-500">*</span>
                                        </label>
                                        <span className="text-xs font-bold text-[#4a3728]">
                                            {selectedHelpAreas.length}/{MAX_HELP_AREAS} selected (minimum {MIN_HELP_AREAS} required)
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-4">
                                        Select at least {MIN_HELP_AREAS} and up to {MAX_HELP_AREAS} areas of guidance.
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
                                                            ? 'border-[#4a3728] bg-[#f8f6f4] cursor-pointer shadow-sm ring-1 ring-[#4a3728]'
                                                            : 'border-[#ece7e2] hover:border-[#4a3728] cursor-pointer bg-white'
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        value={area}
                                                        disabled={disabled}
                                                        {...register('helpAreas')}
                                                        onChange={(e) => {
                                                            register('helpAreas').onChange(e);
                                                            saveDraft();
                                                        }}
                                                        className="w-4 h-4 text-[#4a3728] rounded focus:ring-[#4a3728] disabled:cursor-not-allowed"
                                                    />
                                                    <span className={`text-sm font-bold ${checked ? 'text-[#4a3728]' : 'text-slate-700'}`}>
                                                        {label}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    {errors.helpAreas && (
                                        <p className="text-red-500 text-xs font-medium mt-2 flex items-center gap-1.5">
                                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                            <span>{errors.helpAreas.message}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* STEP 4: Additional Information */}
                        {currentStep === 4 && (
                            <div className="space-y-6 animate-fade-in">
                                <div>
                                    <h2 className="text-2xl font-black text-[#4a3728] tracking-tight">
                                        Additional Information & Motivation
                                    </h2>
                                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                        Help our review committee understand your motivation and commitment to guiding juniors.
                                    </p>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-bold text-[#4a3728]">
                                            Why do you want to become a Senior Mentor? <span className="text-red-500">*</span>
                                        </label>
                                        <span className={`text-xs font-semibold ${motivationValue.length < 30 ? 'text-amber-600' : 'text-slate-500'}`}>
                                            {motivationValue.length} / 1000 characters (minimum 30 required)
                                        </span>
                                    </div>
                                    <textarea
                                        {...register('motivation')}
                                        onChange={(e) => {
                                            register('motivation').onChange(e);
                                            saveDraft();
                                        }}
                                        rows={5}
                                        placeholder="Describe what motivates you to share knowledge and empower other learners..."
                                        className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900 resize-none"
                                    />
                                    {errors.motivation && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.motivation.message}</p>}
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-bold text-[#4a3728]">
                                            What is one piece of advice you wish someone had told you? <span className="text-red-500">*</span>
                                        </label>
                                        <span className={`text-xs font-semibold ${adviceValue.length < 10 ? 'text-amber-600' : 'text-slate-500'}`}>
                                            {adviceValue.length} / 500 characters (minimum 10 required)
                                        </span>
                                    </div>
                                    <textarea
                                        {...register('adviceToJuniorSelf')}
                                        onChange={(e) => {
                                            register('adviceToJuniorSelf').onChange(e);
                                            saveDraft();
                                        }}
                                        rows={4}
                                        placeholder="Share one valuable insight you learned that would benefit junior students..."
                                        className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900 resize-none"
                                    />
                                    {errors.adviceToJuniorSelf && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.adviceToJuniorSelf.message}</p>}
                                </div>
                            </div>
                        )}

                        {/* STEP 5: Verification Documents */}
                        {currentStep === 5 && (
                            <div className="space-y-6 animate-fade-in">
                                <div>
                                    <h2 className="text-2xl font-black text-[#4a3728] tracking-tight">
                                        Verification Documents
                                    </h2>
                                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                        Please provide valid documentation for identity and credential verification.
                                    </p>
                                </div>

                                <Controller
                                    control={control}
                                    name="resumeFile"
                                    render={({ field, fieldState }) => (
                                        <DocumentUploadField
                                            fieldName="resumeFile"
                                            label="Resume / Curriculum Vitae"
                                            accept=".pdf,.doc,.docx"
                                            allowedExtensions={RESUME_ALLOWED_EXTENSIONS}
                                            allowedMimeTypes={RESUME_ALLOWED_MIME_TYPES}
                                            helperText="Accepted formats: PDF, DOC, DOCX • Maximum file size: 5 MB"
                                            value={field.value as File | undefined}
                                            error={fieldState.error?.message}
                                            onChange={(file) => {
                                                field.onChange(file);
                                                if (file) clearErrors('resumeFile');
                                            }}
                                        />
                                    )}
                                />

                                <Controller
                                    control={control}
                                    name="proofDocumentFile"
                                    render={({ field, fieldState }) => (
                                        <DocumentUploadField
                                            fieldName="proofDocumentFile"
                                            label="Proof of Experience / Academic Standing"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            allowedExtensions={PROOF_ALLOWED_EXTENSIONS}
                                            allowedMimeTypes={PROOF_ALLOWED_MIME_TYPES}
                                            helperText="Accepted formats: PDF, JPG, PNG • Maximum file size: 5 MB"
                                            value={field.value as File | undefined}
                                            error={fieldState.error?.message}
                                            onChange={(file) => {
                                                field.onChange(file);
                                                if (file) clearErrors('proofDocumentFile');
                                            }}
                                        />
                                    )}
                                />

                                <div className="bg-[#f8f6f4] rounded-2xl p-5 border border-[#ece7e2] flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 text-[#4a3728] font-bold text-sm shadow-sm border border-[#ece7e2]">
                                        <Info className="w-4 h-4 text-[#4a3728]" />
                                    </div>
                                    <p className="text-xs text-[#5c4a3a] leading-relaxed font-semibold">
                                        By submitting this application, you agree to our mentorship guidelines. All submitted documents are strictly used for verification purposes and handled in accordance with privacy and data protection standards.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Navigation Actions */}
                        <div className="mt-10 flex items-center justify-between pt-6 border-t border-[#ece7e2]">
                            {currentStep > 1 ? (
                                <button
                                    type="button"
                                    onClick={handlePrev}
                                    disabled={isSubmitting}
                                    className="px-6 py-3 text-[#4a3728] font-bold hover:bg-[#f8f6f4] rounded-xl transition-colors flex items-center gap-2 text-sm disabled:opacity-40"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Previous
                                </button>
                            ) : (
                                <div />
                            )}

                            {currentStep < 5 ? (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="px-8 py-3.5 bg-[#4a3728] text-white font-bold rounded-xl hover:bg-[#5c4535] transition-all shadow flex items-center gap-2 text-sm"
                                >
                                    Next Step
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-10 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg flex items-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Submitting Application...
                                        </>
                                    ) : (
                                        "Submit Application"
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
