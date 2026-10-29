"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
    ApplicationStatus,
    MIN_HELP_AREAS,
    MAX_HELP_AREAS,
} from "@/lib/api/seniorMentorApplication.service";
import { syncProfilePhotoToAllRoles } from "@/features/mentorship/utils/syncProfilePhoto";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useProfileData } from "@/features/profile/hooks/useProfileData";
import { useEducationData } from "@/features/profile/hooks/useEducationData";
import { useExperienceData } from "@/features/profile/hooks/useExperienceData";
import { useAboutData } from "@/features/profile/hooks/useAboutData";

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
// 2. Suggestion lists (user inme se chun sakta hai ya khud kuch bhi likh sakta hai)
// ============================================================================

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
    'Frontend Developer', 'Backend Developer', 'Mobile App Developer', 'DevOps Engineer', 'Cloud Engineer',
    'Data Scientist', 'Data Analyst', 'Data Engineer', 'Machine Learning Engineer', 'AI Engineer',
    'QA Engineer', 'Security Engineer', 'UI/UX Designer', 'Product Manager', 'Project Manager',
    'Engineering Manager', 'Technical Lead', 'Solutions Architect', 'Business Analyst',
    'Digital Marketing Manager', 'HR Manager', 'Founder', 'Freelancer', 'Student',
];

const COLLEGE_SUGGESTIONS = [
    // --- Top national institutes ---
    'IIT Delhi', 'IIT Bombay', 'IIT Madras', 'IIT Kanpur', 'IIT Kharagpur', 'IIT Roorkee', 'IIT Guwahati',
    'NIT Trichy', 'NIT Warangal', 'NIT Surathkal', 'IIIT Hyderabad', 'IIIT Delhi', 'BITS Pilani',
    'Delhi University', 'Delhi Technological University', 'Netaji Subhas University of Technology',
    'VIT Vellore', 'SRM Institute of Science and Technology', 'Manipal Institute of Technology',
    'Amity University', 'Lovely Professional University', 'Chandigarh University', 'Thapar Institute',
    'Anna University', 'Jadavpur University', 'Pune University', 'Mumbai University',
    'Symbiosis International University', 'KIIT University', 'Christ University',

    // --- Bhopal: engineering colleges & universities ---
    'MANIT Bhopal (Maulana Azad National Institute of Technology)',
    'IIIT Bhopal',
    'School of Planning and Architecture (SPA) Bhopal',
    'UIT-RGPV Bhopal (University Institute of Technology, RGPV)',
    'Rajiv Gandhi Proudyogiki Vishwavidyalaya (RGPV) Bhopal',
    'VIT Bhopal University',
    'LNCT Bhopal (Lakshmi Narain College of Technology)',
    'LNCT&S Bhopal (LNCT Science)',
    'LNCT University Bhopal',
    'SISTec Bhopal (Sagar Institute of Science and Technology)',
    'SIRT Bhopal (Sagar Institute of Research and Technology)',
    'SIRTE Bhopal (Sagar Institute of Research and Technology - Excellence)',
    'Sage University Bhopal',
    'TIT Bhopal (Technocrats Institute of Technology)',
    'TIT&S Bhopal (Technocrats Institute of Technology and Science)',
    'TIT-E Bhopal (Technocrats Institute of Technology - Excellence)',
    'Oriental Institute of Science and Technology (OIST) Bhopal',
    'Oriental College of Technology (OCT) Bhopal',
    'Oriental University Indore',
    'NRI Institute of Information Science and Technology (NRI-IIST) Bhopal',
    'NRI Institute of Research and Technology (NIRT) Bhopal',
    'Truba Institute of Engineering and Information Technology Bhopal',
    'Truba College of Science and Technology Bhopal',
    'Bansal Institute of Science and Technology Bhopal',
    'Bansal College of Engineering Bhopal',
    'VNS Institute of Technology Bhopal',
    'Radharaman Institute of Technology and Science (RITS) Bhopal',
    'Patel College of Science and Technology (PCST) Bhopal',
    'Patel Institute of Technology Bhopal',
    'Millennium Institute of Technology (MIT) Bhopal',
    'Mittal Institute of Technology Bhopal',
    'Scope Global Skills University Bhopal',
    'SCOPE College of Engineering Bhopal',
    'RKDF Institute of Science and Technology Bhopal',
    'RKDF University Bhopal',
    'Corporate Institute of Science and Technology (CIST) Bhopal',
    'Bhabha Engineering Research Institute (BERI) Bhopal',
    'Bhabha University Bhopal',
    'Gargi Institute of Science and Technology (GIST) Bhopal',
    'Trinity Institute of Technology and Research (TITR) Bhopal',
    'Bhopal Institute of Technology (BIT) Bhopal',
    'Bhopal Institute of Technology and Science (BITS) Bhopal',
    'Jawaharlal Institute of Technology (JNCT) Bhopal',
    'IES College of Technology Bhopal',
    'IES University Bhopal',
    'Agnos College of Technology Bhopal',
    "People's College of Research and Technology (PCRT) Bhopal",
    "People's University Bhopal",
    'Sarvepalli Radhakrishnan University (SRK University) Bhopal',
    'Sri Satya Sai University of Technology and Medical Sciences Sehore',
    'Ravindranath Tagore University Bhopal',
    'Mansarovar Global University Sehore',
];

const COMPANY_SUGGESTIONS = [
    // --- Global tech ---
    'Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Netflix', 'Adobe', 'Oracle', 'Salesforce', 'Atlassian',

    // --- Indian startups / product companies ---
    'Flipkart', 'Paytm', 'Zomato', 'Swiggy', 'Razorpay', 'PhonePe', 'CRED', 'Ola', 'Meesho', 'Zoho',
    'Myntra', 'Nykaa', 'Lenskart', 'Urban Company', 'Zepto', 'Rapido', 'Ola Electric', 'BigBasket',
    'Delhivery', 'MakeMyTrip', 'Info Edge (Naukri)', 'Freshworks', 'Zerodha', 'Groww', 'Upstox',
    'Dream11', 'BharatPe', 'Juspay', 'Postman', 'BrowserStack', 'InMobi', 'Dunzo', 'ShareChat',
    'PhysicsWallah', 'Unacademy', 'upGrad', 'Pine Labs', 'Ather Energy', 'Cars24', 'PolicyBazaar',

    // --- Indian IT services ---
    'TCS', 'Infosys', 'Wipro', 'HCLTech', 'Tech Mahindra', 'Cognizant', 'Accenture', 'Capgemini',
    'LTIMindtree', 'Mphasis', 'Persistent Systems', 'Hexaware', 'Coforge', 'Zensar', 'Birlasoft',
    'KPIT Technologies', 'Tata Elxsi', 'Cyient', 'Sonata Software', 'Mindtree',

    // --- Large Indian conglomerates / core / PSU ---
    'Reliance Industries', 'Reliance Jio', 'Tata Group', 'Tata Motors', 'Tata Steel', 'Adani Group',
    'Mahindra & Mahindra', 'Larsen & Toubro (L&T)', 'Bharti Airtel', 'Maruti Suzuki', 'Hero MotoCorp',
    'Bajaj Auto', 'TVS Motor', 'Bosch India', 'Siemens India', 'ITC', 'Hindustan Unilever',
    'ISRO', 'DRDO', 'BHEL', 'ONGC', 'NTPC', 'Indian Oil', 'HAL', 'BEL', 'Coal India', 'SAIL',

    // --- Banking / finance ---
    'HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra Bank', 'Bajaj Finserv',
    'Goldman Sachs', 'Morgan Stanley',

    // --- Other global ---
    'Deloitte', 'IBM', 'Samsung', 'Intel', 'Walmart', 'Self Employed',
];

const uniq = (arr: string[]): string[] => Array.from(new Set(arr.filter(Boolean)));

// ============================================================================
// 3. Zod Schema
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
    // Optional: sirf unke liye jinke paas current role / company hai
    currentRole: z.string().max(100, "Current role cannot exceed 100 characters").optional().or(z.literal('')),
    currentCompany: z.string().max(100, "Current company cannot exceed 100 characters").optional().or(z.literal('')),
    shortBio: z.string().min(50, "Bio must be at least 50 characters").max(1000),

    // Step 2: Professional
    linkedinUrl: z.string().regex(/^https?:\/\/(www\.)?linkedin\.com\/.+/i, "Invalid LinkedIn URL"),
    githubUrl: z.string().regex(/^https?:\/\/(www\.)?github\.com\/.+/i, "Invalid GitHub URL").optional().or(z.literal('')),
    portfolioUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
    // Optional: khali chhodne par undefined (register me setValueAs lagaya hai)
    yearsOfExperience: z.number({ invalid_type_error: "Must be a valid number" }).min(0, "Cannot be negative").max(50, "Cannot exceed 50").optional(),
    experienceLevel: z.nativeEnum(ExperienceLevel, { errorMap: () => ({ message: "Select an experience level" }) }),
    primaryExpertise: z.nativeEnum(Domain, { errorMap: () => ({ message: "Select primary expertise" }) }),

    // Step 3: Skills & Mentorship
    otherSkills: z.array(z.string()).max(20, "Max 20 skills allowed"),
    technologies: z.array(z.string()).max(30, "Max 30 technologies allowed"),
    achievements: z.array(z.string()).max(15, "Max 15 achievements allowed"),
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
// 4. Prefill helpers (profile data se form bharne ke liye)
// ============================================================================

// Object me se pehli non-empty string value jiska key regex se match kare (exact key naam pata na ho tab bhi chalega)
const findStringByKey = (obj: any, keyRegex: RegExp): string => {
    if (!obj || typeof obj !== 'object') return '';
    for (const [k, v] of Object.entries(obj)) {
        if (keyRegex.test(k) && typeof v === 'string' && v.trim()) return v.trim();
    }
    return '';
};

const COLLEGE_KEY = /(school|college|institut|universit)/i;
const DEGREE_KEY = /^(degree|degreeName|qualification)$/i;
const FIELD_KEY = /(fieldOfStudy|field|major|stream|special)/i;
const YEAR_KEY = /(endYear|graduationYear|yearOfCompletion|passingYear|toYear|endDate|completionDate)/i;

const getEducationYear = (edu: any): number | undefined => {
    if (!edu || typeof edu !== 'object') return undefined;
    for (const [k, v] of Object.entries(edu)) {
        if (!YEAR_KEY.test(k) || v === null || v === undefined || v === '') continue;
        if (typeof v === 'number' && v > 1900) return v;
        if (typeof v === 'string') {
            if (/^\d{4}$/.test(v.trim())) return Number(v.trim());
            const y = new Date(v).getFullYear();
            if (!Number.isNaN(y)) return y;
        }
    }
    return undefined;
};

// ============================================================================
// 5. Themed Combobox (native <datalist> ki jagah)
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
                                                    className={`px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors ${
                                                        isActive
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
    const [currentStep, setCurrentStep] = useState(1);
    const [existingApplication, setExistingApplication] = useState<SeniorMentorApplication | null>(null);
    const [isLoadingInit, setIsLoadingInit] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const { register, handleSubmit, trigger, control, formState: { errors }, setValue, getValues, watch, setError, clearErrors } = useForm<FormValues>({
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

    // ---- Profile data (prefill ke liye) ----
    const { user } = useAuth();
    const { userProfileData, profileImageUrl, aboutId, fetchUserProfile } = useProfileData();
    const { educationList, fetchEducationData } = useEducationData();
    const { experienceList, fetchExperienceData } = useExperienceData();
    const { aboutData, fetchAboutData } = useAboutData(aboutId);

    const selectedHelpAreas = (watch('helpAreas') || []) as MentorshipHelpArea[];
    const isMaxHelpAreas = selectedHelpAreas.length >= MAX_HELP_AREAS;

    // User ke apne profile ke college / company suggestion list me sabse upar
    const collegeOptions = useMemo(() => {
        const own = (educationList || []).map((e: any) => findStringByKey(e, COLLEGE_KEY));
        const reg = typeof userProfileData?.education === 'string' ? [userProfileData.education] : [];
        return uniq([...own, ...reg, ...COLLEGE_SUGGESTIONS]);
    }, [educationList, userProfileData]);

    const degreeOptions = useMemo(() => {
        const own = (educationList || []).map((e: any) => findStringByKey(e, DEGREE_KEY));
        return uniq([...own, ...DEGREE_SUGGESTIONS]);
    }, [educationList]);

    const fieldOptions = useMemo(() => {
        const own = (educationList || []).map((e: any) => findStringByKey(e, FIELD_KEY));
        return uniq([...own, ...FIELD_SUGGESTIONS]);
    }, [educationList]);

    const roleOptions = useMemo(() => {
        const own = (experienceList || []).map((e: any) => e?.position as string);
        const reg = userProfileData?.currentPosition ? [userProfileData.currentPosition] : [];
        return uniq([...own, ...reg, ...ROLE_SUGGESTIONS]);
    }, [experienceList, userProfileData]);

    const companyOptions = useMemo(() => {
        const own = (experienceList || []).map((e: any) => e?.company as string);
        return uniq([...own, ...COMPANY_SUGGESTIONS]);
    }, [experienceList]);

    // Field tabhi bharo jab user ne khud kuch na likha ho
    const fillIfEmpty = useCallback((name: keyof FormValues, value: any) => {
        if (value === undefined || value === null || value === '') return;
        const current = getValues(name) as any;
        const isEmpty =
            current === undefined ||
            current === null ||
            current === '' ||
            (typeof current === 'number' && Number.isNaN(current));
        if (isEmpty) {
            setValue(name, value, { shouldDirty: true });
        }
    }, [getValues, setValue]);

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

    // ---- Prefill: profile + education fetch (application na ho tabhi) ----
    useEffect(() => {
        if (isLoadingInit || !user?.userId) return;
        fetchUserProfile(user.userId);
        fetchEducationData();
    }, [isLoadingInit, user?.userId, fetchUserProfile, fetchEducationData]);

    // Profile aane par: name, register ke time ka data, experience ids
    useEffect(() => {
        if (!userProfileData) return;
        console.log('[PREFILL] userProfileData:', userProfileData);
        const fullName = `${userProfileData.firstName || ''} ${userProfileData.lastName || ''}`.trim();
        fillIfEmpty('fullName', fullName);
        // Register ke time jo likha tha (agar education/currentPosition string me saved hai)
        if (typeof userProfileData.education === 'string') {
            fillIfEmpty('college', userProfileData.education.trim());
        }
        if (userProfileData.currentPosition) {
            fillIfEmpty('currentRole', userProfileData.currentPosition);
        }
        fetchExperienceData(userProfileData.experienceIds || []);
    }, [userProfileData, fillIfEmpty, fetchExperienceData]);

    // About fetch (bio ke liye)
    useEffect(() => {
        if (aboutId) fetchAboutData();
    }, [aboutId, fetchAboutData]);

    // Education se college / degree / field / year
    useEffect(() => {
        if (!educationList || educationList.length === 0) return;
        console.log('[PREFILL] educationList[0]:', educationList[0]);
        // Sabse latest graduation year wali education lo
        const latest = [...educationList].sort(
            (a, b) => (getEducationYear(b) ?? 0) - (getEducationYear(a) ?? 0)
        )[0];

        // Education list ka data register wale string se better hai, isliye college yahan se force set
        const college = findStringByKey(latest, COLLEGE_KEY);
        if (college) setValue('college', college, { shouldDirty: true });
        fillIfEmpty('degree', findStringByKey(latest, DEGREE_KEY));
        fillIfEmpty('fieldOfStudy', findStringByKey(latest, FIELD_KEY));
        fillIfEmpty('graduationYear', getEducationYear(latest));
    }, [educationList, fillIfEmpty, setValue]);

    // Experience se current role / company
    useEffect(() => {
        if (!experienceList || experienceList.length === 0) return;
        console.log('[PREFILL] experienceList[0]:', experienceList[0]);
        const current = experienceList.find((e: any) => e.current) || experienceList[0];
        fillIfEmpty('currentRole', current?.position);
        fillIfEmpty('currentCompany', current?.company);
    }, [experienceList, fillIfEmpty]);

    // About se short bio
    useEffect(() => {
        if (!aboutData) return;
        console.log('[PREFILL] aboutData:', aboutData);
        fillIfEmpty('shortBio', findStringByKey(aboutData, /(summary|about|bio|description|content|story)/i));
    }, [aboutData, fillIfEmpty]);

    // Profile photo (URL se File banao, best-effort)
    useEffect(() => {
        if (!profileImageUrl) return;
        if (getValues('profilePhotoFile') instanceof File) return;
        let cancelled = false;

        const loadPhoto = async () => {
            try {
                const res = await fetch(profileImageUrl);
                if (!res.ok) return;
                const blob = await res.blob();
                const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
                if (!allowed.includes(blob.type)) return; // webp etc. skip, user khud upload karega
                if (blob.size > MAX_FILE_SIZE) return;
                if (cancelled) return;
                const ext = blob.type === 'image/png' ? 'png' : 'jpg';
                const file = new File([blob], `profile-photo.${ext}`, { type: blob.type });
                if (!(getValues('profilePhotoFile') instanceof File)) {
                    setValue('profilePhotoFile', file as any, { shouldDirty: true });
                }
            } catch {
                // CORS / network fail: user manually upload karega
            }
        };
        loadPhoto();

        return () => { cancelled = true; };
    }, [profileImageUrl, getValues, setValue]);

    const handleNext = async () => {
        if (currentStep === 3) {
            if (selectedHelpAreas.length < MIN_HELP_AREAS) {
                setError('helpAreas', {
                    type: 'manual',
                    message: `Please select at least ${MIN_HELP_AREAS} help areas (you have selected ${selectedHelpAreas.length}).`
                });
                const el = document.getElementById('help-areas-section');
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }
        }
        const stepFields = steps.find(s => s.id === currentStep)?.fields as (keyof FormValues)[];
        const isValid = await trigger(stepFields);
        if (isValid) {
            setCurrentStep(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            const firstInvalid = document.querySelector<HTMLElement>('[aria-invalid="true"]');
            firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const handlePrev = () => {
        setCurrentStep(prev => prev - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const onInvalid = (formErrors: any) => {
        console.error('[SENIOR_MENTOR_APP] Validation errors on submit:', formErrors);
        const errorKeys = Object.keys(formErrors);
        if (errorKeys.length > 0) {
            const firstKey = errorKeys[0];
            const stepWithErr = steps.find(s => (s.fields as string[]).includes(firstKey));
            if (stepWithErr) {
                setCurrentStep(stepWithErr.id);
            }
            const msg = formErrors[firstKey]?.message || `Please check required fields in Step ${stepWithErr?.id || currentStep}.`;
            const fullErrMsg = `Application submit nahi hui: ${msg}`;
            setErrorMsg(fullErrMsg);
            setToast({ type: 'error', message: fullErrMsg });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
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
            // Optional: sirf tab bhejo jab user ne bhara ho
            if (data.currentRole?.trim()) formData.append('currentRole', data.currentRole.trim());
            if (data.currentCompany?.trim()) formData.append('currentCompany', data.currentCompany.trim());
            formData.append('shortBio', data.shortBio);

            formData.append('linkedinUrl', data.linkedinUrl);
            if (data.githubUrl) formData.append('githubUrl', data.githubUrl);
            if (data.portfolioUrl) formData.append('portfolioUrl', data.portfolioUrl);
            // Optional: sirf tab bhejo jab user ne bhara ho
            if (data.yearsOfExperience !== undefined && !Number.isNaN(data.yearsOfExperience)) {
                formData.append('yearsOfExperience', data.yearsOfExperience.toString());
            }
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

            console.log('Submitting senior mentor application...');
            const res = await SeniorMentorApplicationService.apply(formData);

            const createdUserId = res?.userId;
            setToast({ type: 'success', message: 'Application submitted successfully!' });

            // Senior mentor photo ko account photo me bhi save karo -> Mentee workspace/navbar me wahi photo dikhe
            if (data.profilePhotoFile instanceof File) {
                await syncProfilePhotoToAllRoles(data.profilePhotoFile, createdUserId, { skip: ['mentor', 'senior'] }).catch(() => undefined);
            }
            if (createdUserId) {
                router.push(`/mentorship/senior-mentor-profile/${createdUserId}`);
            } else {
                setSuccessMsg(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (error: any) {
            console.error('[SENIOR_MENTOR_APP] Application submit failed:', error);
            let reason = 'Failed to submit application. Please try again.';
            const resp = error?.response?.data;
            if (error?.response?.status === 409) {
                reason = 'You already have an active Senior Mentor application.';
            } else if (resp?.errors && Array.isArray(resp.errors) && resp.errors.length > 0) {
                resp.errors.forEach((err: { field?: string; message?: string }) => {
                    if (err.field && err.message) {
                        setError(err.field as any, { type: 'server', message: err.message });
                    }
                });
                const firstErr = resp.errors[0];
                reason = firstErr.message || `${firstErr.field} is invalid`;
                const stepWithErr = steps.find(s => (s.fields as string[]).includes(firstErr.field));
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
                                        <input type="number" {...register('graduationYear', { valueAsNumber: true })} placeholder="e.g. 2024" className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900" />
                                        {errors.graduationYear && <p className="text-red-500 text-xs mt-1">{errors.graduationYear.message}</p>}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">College / University *</label>
                                        <ComboboxInput
                                            control={control}
                                            name="college"
                                            options={collegeOptions}
                                            placeholder="Start typing or pick from suggestions"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">Degree *</label>
                                        <ComboboxInput
                                            control={control}
                                            name="degree"
                                            options={degreeOptions}
                                            placeholder="e.g. B.Tech"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">Field of Study *</label>
                                        <ComboboxInput
                                            control={control}
                                            name="fieldOfStudy"
                                            options={fieldOptions}
                                            placeholder="e.g. Computer Science"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">Current Role <span className="text-slate-400 font-normal ml-1">(Optional)</span></label>
                                        <ComboboxInput
                                            control={control}
                                            name="currentRole"
                                            options={roleOptions}
                                            placeholder="e.g. Software Engineer"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">Current Company <span className="text-slate-400 font-normal ml-1">(Optional)</span></label>
                                        <ComboboxInput
                                            control={control}
                                            name="currentCompany"
                                            options={companyOptions}
                                            placeholder="e.g. Google"
                                        />
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
                                        <label className="block text-sm font-bold text-[#4a3728] mb-2">Years of Experience <span className="text-slate-400 font-normal ml-1">(Optional)</span></label>
                                        <input
                                            type="number"
                                            min={0}
                                            step="any"
                                            {...register('yearsOfExperience', {
                                                setValueAs: (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
                                            })}
                                            className="w-full px-4 py-3 bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm font-medium text-slate-900"
                                        />
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

                                <div
                                    id="help-areas-section"
                                    className={`p-6 rounded-2xl border-2 transition-all ${
                                        errors.helpAreas
                                            ? 'border-red-500 bg-red-50/20 shadow-sm'
                                            : 'border-[#ece7e2] bg-[#f8f6f4]/40'
                                    }`}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                                        <div>
                                            <label className="block text-sm font-bold text-[#4a3728]">
                                                Help Areas * <span className="text-slate-500 font-normal ml-1">(Select 3 to 7)</span>
                                            </label>
                                            {isMaxHelpAreas && (
                                                <p className="text-xs font-semibold text-amber-700 mt-0.5">
                                                    Maximum 7 selected
                                                </p>
                                            )}
                                        </div>
                                        <span
                                            className={`text-xs font-bold px-3 py-1 rounded-full self-start sm:self-auto border transition-colors ${
                                                selectedHelpAreas.length >= MIN_HELP_AREAS && selectedHelpAreas.length <= MAX_HELP_AREAS
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                                    : selectedHelpAreas.length > MAX_HELP_AREAS
                                                    ? 'bg-red-50 text-red-600 border-red-300'
                                                    : 'bg-white text-[#4a3728] border-[#ece7e2]'
                                            }`}
                                        >
                                            {selectedHelpAreas.length}/{MAX_HELP_AREAS} selected
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {Object.values(MentorshipHelpArea).map((area) => {
                                            const label = area.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                                            const checked = selectedHelpAreas.includes(area);
                                            const disabled = !checked && isMaxHelpAreas;
                                            return (
                                                <label
                                                    key={area}
                                                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                                                        disabled
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
                {toast && (
                    <div
                        className={`fixed bottom-6 right-6 z-50 px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border transition-all animate-in fade-in slide-in-from-bottom-4 ${
                            toast.type === 'error'
                                ? 'bg-red-600 text-white border-red-700'
                                : 'bg-[#4a3728] text-white border-[#3d2d21]'
                        }`}
                    >
                        <span className="text-sm font-semibold">{toast.message}</span>
                        <button
                            type="button"
                            onClick={() => setToast(null)}
                            className="ml-2 p-1 hover:bg-white/20 rounded-full transition"
                            aria-label="Close notification"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}