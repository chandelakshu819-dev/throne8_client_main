import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  User,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Linkedin,
  AlertCircle,
  Camera,
  Loader2,
  Pencil,
  X,
  Check,
  Plus,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import type { SeniorMentorApplication } from "@/lib/api/seniorMentorApplication.service";
import { useAppSelector } from "@/core/store/store.hooks";
import { useNavbarData, useNavbarProfileImage } from "@/features/profile/components/home/NavbarProvider";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { useAuth } from "@/features/auth/hooks/useAuth";
import SeniorMentorApplicationService from "@/lib/api/seniorMentorApplication.service";

// ============================================================================
// Constants & Option Lists (Mirrored from original Senior Mentor Application)
// ============================================================================

export const EXPERIENCE_LEVEL_OPTIONS = [
  { value: "junior", label: "Junior Level (0-2 yrs)" },
  { value: "mid", label: "Mid Level (2-5 yrs)" },
  { value: "senior", label: "Senior Level (5-8 yrs)" },
  { value: "lead", label: "Lead Level (8-12 yrs)" },
  { value: "principal", label: "Principal Level (12+ yrs)" },
  { value: "architect", label: "Architect Level" },
];

export const DOMAIN_OPTIONS = [
  { value: "web_development", label: "Web Development" },
  { value: "mobile_development", label: "Mobile Development" },
  { value: "data_science", label: "Data Science" },
  { value: "machine_learning", label: "Machine Learning / AI" },
  { value: "devops", label: "DevOps & SRE" },
  { value: "cloud_computing", label: "Cloud Computing" },
  { value: "cybersecurity", label: "Cybersecurity" },
  { value: "blockchain", label: "Blockchain & Web3" },
  { value: "ui_ux_design", label: "UI / UX Design" },
  { value: "product_management", label: "Product Management" },
  { value: "digital_marketing", label: "Digital Marketing" },
  { value: "business_analytics", label: "Business Analytics" },
  { value: "career_guidance", label: "Career Guidance" },
  { value: "interview_prep", label: "Interview Preparation" },
  { value: "leadership", label: "Engineering Leadership" },
];

export const HELP_AREA_OPTIONS = [
  { value: "dsa_problem_solving", label: "DSA & Problem Solving" },
  { value: "development_coding", label: "Development & Coding" },
  { value: "project_guidance", label: "Project Guidance" },
  { value: "resume_linkedin", label: "Resume & LinkedIn Review" },
  { value: "interview_preparation", label: "Interview Preparation" },
  { value: "placement_preparation", label: "Placement Preparation" },
  { value: "career_guidance", label: "Career Guidance" },
];

export const POPULAR_TECH_SUGGESTIONS = [
  "React",
  "Node.js",
  "TypeScript",
  "Next.js",
  "Python",
  "Java",
  "Go",
  "AWS",
  "Docker",
  "Kubernetes",
  "PostgreSQL",
  "MongoDB",
  "GraphQL",
  "Tailwind CSS",
  "Redis",
  "System Design",
  "Microservices",
];

export const POPULAR_SKILLS_SUGGESTIONS = [
  "System Design",
  "Architecture",
  "Code Review",
  "Agile / Scrum",
  "API Design",
  "Performance Optimization",
  "Mentoring",
  "CI / CD",
  "Data Structures",
  "Algorithms",
];

interface SeniorProfilePageProps {
  seniorData: SeniorMentorApplication | null;
  onUpdateApplication?: (updated: SeniorMentorApplication) => void;
}

const EmptyValue = () => <span className="italic text-sm text-[#b0a090]">Not set</span>;

// ============================================================================
// Tag Input Helper Component
// ============================================================================
function TagInput({
  tags,
  onChange,
  suggestions = [],
  max = 30,
  placeholder = "Type and press Enter...",
}: {
  tags: string[];
  onChange: (newTags: string[]) => void;
  suggestions?: string[];
  max?: number;
  placeholder?: string;
}) {
  const [inputVal, setInputVal] = useState("");

  const addTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (!trimmed) return;
    if (tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) return;
    if (tags.length >= max) return;
    onChange([...tags, trimmed]);
    setInputVal("");
  };

  const removeTag = (indexToRemove: number) => {
    onChange(tags.filter((_, i) => i !== indexToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputVal);
    }
  };

  const availableSuggestions = suggestions.filter(
    (s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase())
  );

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-2 p-2.5 bg-white border border-[#e0d8cf] rounded-xl focus-within:ring-2 focus-within:ring-[#4a3728] focus-within:border-transparent transition-all">
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#f4ece1] text-[#4a3728] border border-[#e2d5c8] rounded-full text-xs font-bold"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(idx)}
              className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-[#e6d8c8] text-[#7a5c3e] transition"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {tags.length < max && (
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => inputVal.trim() && addTag(inputVal)}
            placeholder={tags.length === 0 ? placeholder : "Add more..."}
            className="flex-1 min-w-[130px] bg-transparent outline-none text-xs font-medium text-[#4a3728] placeholder-[#a08070] py-1"
          />
        )}
      </div>

      {availableSuggestions.length > 0 && tags.length < max && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-[#a08070]">Suggestions:</span>
          {availableSuggestions.slice(0, 6).map((sugg) => (
            <button
              key={sugg}
              type="button"
              onClick={() => addTag(sugg)}
              className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fbf7f3] border border-[#e0d8cf] text-[#7a5c3e] hover:bg-[#f4ece1] hover:text-[#4a3728] transition"
            >
              + {sugg}
            </button>
          ))}
        </div>
      )}
      <p className="text-[11px] font-medium text-[#a08070] text-right">
        {tags.length} / {max} items
      </p>
    </div>
  );
}

// ============================================================================
// Main Senior Profile Page Component
// ============================================================================
export default function SeniorProfilePage({
  seniorData,
  onUpdateApplication,
}: SeniorProfilePageProps) {
  const { user } = useAuth();
  const globalProfile = useAppSelector((state) => state.login.profile);
  const { profileData: navbarProfileData } = useNavbarData();
  const setNavbarProfileImage = useNavbarProfileImage();
  const { loadProfile } = useProfile();

  const pathname = usePathname();
  const mentorId = seniorData?.userId || (seniorData as any)?._id;

  // Global Edit Mode State (default false)
  const [isGlobalEditMode, setIsGlobalEditMode] = useState<boolean>(false);

  // Profile Data State
  const [data, setData] = useState<SeniorMentorApplication | null>(seniorData);
  useEffect(() => {
    setData(seniorData);
  }, [seniorData]);

  // Ownership Check: strictly ensure both user.userId and seniorData.userId are defined
  const isOwner = Boolean(
    user?.userId &&
      seniorData?.userId &&
      user.userId === seniorData.userId
  );

  // Active section currently in edit mode: null | 'experience' | 'education' | 'expertise' | 'helpAreas' | 'technologies' | 'skills' | 'bio' | 'motivation' | 'links' | 'header'
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [sectionError, setSectionError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Exit edit mode automatically after navigating to another page or when mentorId changes
  useEffect(() => {
    setIsGlobalEditMode(false);
    setActiveSection(null);
    setSectionError(null);
  }, [pathname, mentorId]);

  // Handler for Global Edit Mode Toggle
  const handleToggleGlobalEditMode = () => {
    if (!isGlobalEditMode) {
      setIsGlobalEditMode(true);
      return;
    }

    // Edit mode is currently ON, user clicked "Done"
    if (activeSection !== null) {
      const confirmDiscard = window.confirm("You have unsaved changes. Discard them?");
      if (!confirmDiscard) {
        // User cancelled, stay in edit mode
        return;
      }
      // User confirmed: close card and exit edit mode
      setActiveSection(null);
      setSectionError(null);
      setIsGlobalEditMode(false);
    } else {
      // No card is open, just exit edit mode
      setIsGlobalEditMode(false);
    }
  };

  // Unsaved changes beforeunload handler
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activeSection !== null) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [activeSection]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // --------------------------------------------------------------------------
  // Form Draft States for Per-Section Editing
  // --------------------------------------------------------------------------
  const [draftFullName, setDraftFullName] = useState("");
  const [draftRole, setDraftRole] = useState("");
  const [draftCompany, setDraftCompany] = useState("");
  const [draftYearsExp, setDraftYearsExp] = useState<number>(0);
  const [draftExpLevel, setDraftExpLevel] = useState("senior");

  const [draftCollege, setDraftCollege] = useState("");
  const [draftDegree, setDraftDegree] = useState("");
  const [draftFieldOfStudy, setDraftFieldOfStudy] = useState("");
  const [draftGradYear, setDraftGradYear] = useState<number>(new Date().getFullYear());

  const [draftExpertise, setDraftExpertise] = useState("web_development");
  const [draftHelpAreas, setDraftHelpAreas] = useState<string[]>([]);
  const [draftTech, setDraftTech] = useState<string[]>([]);
  const [draftSkills, setDraftSkills] = useState<string[]>([]);

  const [draftBio, setDraftBio] = useState("");
  const [draftMotivation, setDraftMotivation] = useState("");
  const [draftAdvice, setDraftAdvice] = useState("");

  const [draftLinkedin, setDraftLinkedin] = useState("");
  const [draftGithub, setDraftGithub] = useState("");
  const [draftPortfolio, setDraftPortfolio] = useState("");

  // Initialize draft values when entering a section edit
  const startEditSection = (section: string) => {
    if (!data) return;
    setSectionError(null);
    setActiveSection(section);

    if (section === "experience" || section === "header") {
      setDraftFullName(data.fullName || "");
      setDraftRole(data.currentRole || "");
      setDraftCompany(data.currentCompany || "");
      setDraftYearsExp(data.yearsOfExperience || 0);
      setDraftExpLevel(data.experienceLevel || "senior");
    }
    if (section === "education") {
      setDraftCollege(data.college || "");
      setDraftDegree(data.degree || "");
      setDraftFieldOfStudy(data.fieldOfStudy || "");
      setDraftGradYear(data.graduationYear || new Date().getFullYear());
    }
    if (section === "expertise") {
      setDraftExpertise(data.primaryExpertise || "web_development");
    }
    if (section === "helpAreas") {
      setDraftHelpAreas(data.helpAreas ? [...data.helpAreas] : []);
    }
    if (section === "technologies") {
      setDraftTech(data.technologies ? [...data.technologies] : []);
    }
    if (section === "skills") {
      setDraftSkills(data.otherSkills ? [...data.otherSkills] : []);
    }
    if (section === "bio") {
      setDraftBio(data.shortBio || "");
    }
    if (section === "motivation") {
      setDraftMotivation(data.motivation || "");
      setDraftAdvice(data.adviceToJuniorSelf || "");
    }
    if (section === "links") {
      setDraftLinkedin(data.linkedinUrl || "");
      setDraftGithub(data.githubUrl || "");
      setDraftPortfolio(data.portfolioUrl || "");
    }
  };

  const cancelEdit = () => {
    setActiveSection(null);
    setSectionError(null);
  };

  // --------------------------------------------------------------------------
  // Save Section Handler
  // --------------------------------------------------------------------------
  const saveSection = async (section: string) => {
    if (!data) return;
    setSectionError(null);
    const payload: Partial<SeniorMentorApplication> = {};

    try {
      if (section === "header") {
        if (!draftFullName.trim() || draftFullName.trim().length < 2) {
          throw new Error("Full name must be at least 2 characters.");
        }
        if (!draftRole.trim()) throw new Error("Current role is required.");
        if (!draftCompany.trim()) throw new Error("Current company is required.");
        payload.fullName = draftFullName.trim();
        payload.currentRole = draftRole.trim();
        payload.currentCompany = draftCompany.trim();
      } else if (section === "experience") {
        if (!draftRole.trim()) throw new Error("Current role is required.");
        if (!draftCompany.trim()) throw new Error("Current company is required.");
        if (draftYearsExp < 0 || draftYearsExp > 60) {
          throw new Error("Years of experience must be between 0 and 60.");
        }
        payload.currentRole = draftRole.trim();
        payload.currentCompany = draftCompany.trim();
        payload.yearsOfExperience = Number(draftYearsExp);
        payload.experienceLevel = draftExpLevel;
      } else if (section === "education") {
        if (!draftCollege.trim()) throw new Error("College / University is required.");
        if (!draftDegree.trim()) throw new Error("Degree is required.");
        if (!draftFieldOfStudy.trim()) throw new Error("Field of study is required.");
        const currentYear = new Date().getFullYear();
        if (draftGradYear < 1980 || draftGradYear > currentYear + 10) {
          throw new Error(`Graduation year must be between 1980 and ${currentYear + 10}.`);
        }
        payload.college = draftCollege.trim();
        payload.degree = draftDegree.trim();
        payload.fieldOfStudy = draftFieldOfStudy.trim();
        payload.graduationYear = Number(draftGradYear);
      } else if (section === "expertise") {
        if (!draftExpertise) throw new Error("Please select a primary expertise.");
        payload.primaryExpertise = draftExpertise;
      } else if (section === "helpAreas") {
        if (draftHelpAreas.length < 3 || draftHelpAreas.length > 7) {
          throw new Error("Please select between 3 and 7 mentorship help areas.");
        }
        payload.helpAreas = draftHelpAreas;
      } else if (section === "technologies") {
        payload.technologies = draftTech;
      } else if (section === "skills") {
        payload.otherSkills = draftSkills;
      } else if (section === "bio") {
        const trimmedBio = draftBio.trim();
        if (trimmedBio.length < 50 || trimmedBio.length > 1000) {
          throw new Error("Bio must be between 50 and 1000 characters.");
        }
        payload.shortBio = trimmedBio;
      } else if (section === "motivation") {
        const trimmedMotiv = draftMotivation.trim();
        const trimmedAdvice = draftAdvice.trim();
        if (trimmedMotiv.length < 30 || trimmedMotiv.length > 1000) {
          throw new Error("Motivation must be between 30 and 1000 characters.");
        }
        if (trimmedAdvice.length < 10 || trimmedAdvice.length > 500) {
          throw new Error("Advice to junior self must be between 10 and 500 characters.");
        }
        payload.motivation = trimmedMotiv;
        payload.adviceToJuniorSelf = trimmedAdvice;
      } else if (section === "links") {
        if (
          draftLinkedin &&
          !/^https?:\/\/(www\.)?linkedin\.com\/.+/i.test(draftLinkedin.trim())
        ) {
          throw new Error("Please enter a valid LinkedIn URL (e.g. https://linkedin.com/in/...).");
        }
        if (
          draftGithub &&
          !/^https?:\/\/(www\.)?github\.com\/.+/i.test(draftGithub.trim())
        ) {
          throw new Error("Please enter a valid GitHub URL.");
        }
        payload.linkedinUrl = draftLinkedin.trim();
        payload.githubUrl = draftGithub.trim();
        payload.portfolioUrl = draftPortfolio.trim();
      }

      setSavingSection(section);
      const updated = await SeniorMentorApplicationService.updateMyApplication(payload);
      setData(updated);
      if (onUpdateApplication) onUpdateApplication(updated);
      setActiveSection(null);
      showToast("Profile section updated successfully!");
    } catch (err: any) {
      setSectionError(err?.message || "Failed to update profile section.");
    } finally {
      setSavingSection(null);
    }
  };

  // --------------------------------------------------------------------------
  // Avatar Modal State & Handlers
  // --------------------------------------------------------------------------
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imgFallbackLevel, setImgFallbackLevel] = useState(0);
  const [localPhoto, setLocalPhoto] = useState<string | null>(null);

  const onAvatarFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setAvatarError("Only JPG, PNG or WEBP images are supported.");
      return;
    }
    // 2MB limit
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("Image must be smaller than 2MB.");
      return;
    }

    setSelectedAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreviewUrl(objectUrl);
    setAvatarModalOpen(true);
    e.target.value = "";
  };

  const closeAvatarModal = () => {
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    setSelectedAvatarFile(null);
    setAvatarPreviewUrl(null);
    setAvatarError(null);
    setAvatarModalOpen(false);
  };

  const confirmAvatarUpload = async () => {
    if (!selectedAvatarFile) return;
    setUploadingAvatar(true);
    setAvatarError(null);

    try {
      const updatedApp = await SeniorMentorApplicationService.updateMyProfilePhoto(
        selectedAvatarFile
      );
      const newUrl = updatedApp?.profilePhoto;
      if (!newUrl) throw new Error("Photo upload failed. Please try again.");

      setLocalPhoto(newUrl);
      if (data) {
        const merged = { ...data, profilePhoto: newUrl };
        setData(merged);
        if (onUpdateApplication) onUpdateApplication(merged);
      }
      setNavbarProfileImage(newUrl);
      if (typeof loadProfile === "function") loadProfile();

      closeAvatarModal();
      showToast("Profile photo updated successfully!");
    } catch (err: any) {
      setAvatarError(err?.message || "Failed to update profile photo.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center h-full">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-black text-[#4a3728] mb-2">Error Loading Profile</h2>
        <p className="text-slate-600 font-medium mb-6">Could not retrieve application data.</p>
      </div>
    );
  }

  const {
    fullName,
    profilePhoto,
    college,
    degree,
    fieldOfStudy,
    graduationYear,
    currentRole,
    currentCompany,
    shortBio,
    linkedinUrl,
    portfolioUrl,
    githubUrl,
    yearsOfExperience,
    experienceLevel,
    primaryExpertise,
    otherSkills,
    technologies,
    achievements,
    certifications,
    helpAreas,
    motivation,
    adviceToJuniorSelf,
    resumeUrl,
    proofDocumentUrl,
    verificationStatus,
    isActive,
  } = data;

  const getPhotoForLevel = (level: number): string | null => {
    if (level === 0 && localPhoto) return localPhoto;
    if (level <= 1 && profilePhoto) return profilePhoto;
    const accountPhoto =
      navbarProfileData?.profileImage ||
      globalProfile?.profilePic ||
      globalProfile?.profilePhoto;
    if (level <= 2 && accountPhoto) return accountPhoto;
    return null;
  };

  const currentPhoto = getPhotoForLevel(imgFallbackLevel);
  const initials = fullName?.[0] ?? "S";
  const isApproved =
    (verificationStatus === "verified" || (verificationStatus as any) === "active") &&
    isActive;

  // --------------------------------------------------------------------------
  // Reusable Info Tile with Edit Button
  // --------------------------------------------------------------------------
  const SectionCard = ({
    sectionKey,
    label,
    isEditing,
    children,
    editContent,
    full = false,
  }: {
    sectionKey: string;
    label: string;
    isEditing: boolean;
    children: React.ReactNode;
    editContent: React.ReactNode;
    full?: boolean;
  }) => {
    const isThisSaving = savingSection === sectionKey;

    return (
      <div
        className={`p-5 rounded-2xl transition-all duration-200 relative ${
          full ? "md:col-span-2" : ""
        } ${
          isEditing
            ? "ring-2 ring-[#4a3728] shadow-md bg-white"
            : "hover:border-[#cfc4b7]"
        }`}
        style={{
          backgroundColor: isEditing ? "#ffffff" : "#fbf7f3",
          border: isEditing ? "1px solid #4a3728" : "1px solid #e0d8cf",
        }}
      >
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <p className="text-xs font-bold uppercase tracking-wider text-[#a08070]">
            {label}
          </p>

          {isOwner && isGlobalEditMode && !isEditing && (
            <button
              type="button"
              onClick={() => startEditSection(sectionKey)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#7a5c3e] hover:text-[#4a3728] hover:bg-[#f4ece1] rounded-lg transition"
              title={`Edit ${label}`}
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4 pt-1 animate-fadeIn">
            {sectionError && activeSection === sectionKey && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{sectionError}</span>
              </div>
            )}

            {editContent}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#f0e8df]">
              <button
                type="button"
                onClick={cancelEdit}
                disabled={isThisSaving}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-[#7a5c3e] hover:bg-[#f3ece4] border border-[#e0d8cf] transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => saveSection(sectionKey)}
                disabled={isThisSaving}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-[#4a3728] text-white hover:bg-[#684e3a] shadow-xs transition disabled:opacity-50"
              >
                {isThisSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#4a3728] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-sm font-bold animate-slideUp">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Info Banner */}
      <div className="flex items-center justify-between flex-wrap gap-4 px-1">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl shadow-sm flex items-center justify-center bg-[#4a3728]">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-[#4a3728]">
              Senior Mentor Application Profile
            </h2>
            <p className="text-sm font-medium mt-0.5 text-[#8a7a6a]">
              {isOwner
                ? "Manage and update your professional profile credentials and mentorship offerings."
                : "Read-only view of the mentor's profile."}
            </p>
          </div>
        </div>

        {/* Edit Mode Toggle Button (Visible ONLY to profile owner) */}
        {isOwner && (
          <button
            type="button"
            onClick={handleToggleGlobalEditMode}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all ${
              isGlobalEditMode
                ? "bg-[#4a3728] text-white hover:bg-[#684e3a]"
                : "bg-white text-[#4a3728] border border-[#e0d8cf] hover:bg-[#f4ece1]"
            }`}
          >
            {isGlobalEditMode ? (
              <>
                <Check className="w-4 h-4" />
                <span>Done</span>
              </>
            ) : (
              <>
                <Pencil className="w-4 h-4 text-[#4a3728]" />
                <span>Edit Profile</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Verification Status Banners */}
      {verificationStatus === "rejected" && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl flex items-center gap-3 shadow-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>
            This application was marked as <strong>Rejected</strong>. Reason:{" "}
            {(seniorData as any).rejectionReason || "No reason specified."}
          </span>
        </div>
      )}
      {verificationStatus === "under_review" && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-5 py-4 rounded-xl flex items-center gap-3 shadow-sm font-medium">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <span>
            Your profile is currently <strong>Under Review</strong> by the platform administrators.
          </span>
        </div>
      )}
      {verificationStatus === "pending" && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-5 py-4 rounded-xl flex items-center gap-3 shadow-sm font-medium">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <span>
            Your profile is currently <strong>Pending</strong>. Our team will review your application shortly.
          </span>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-[#e0d8cf]">
        {/* Profile Card Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-[#f0e8df]">
          <div className="flex items-center gap-5">
            {/* Avatar block */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-sm border-2 border-[#e0d8cf] bg-[#fbf7f3]">
                {currentPhoto ? (
                  <img
                    src={currentPhoto}
                    alt={fullName}
                    className="w-full h-full object-cover"
                    onError={() => setImgFallbackLevel((prev) => prev + 1)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#4a3728]">
                    <span className="text-2xl font-bold text-white">{initials}</span>
                  </div>
                )}
              </div>

              {/* Camera Icon - opens image picker */}
              {isOwner && isGlobalEditMode && (
                <label
                  className="absolute -top-1.5 -left-1.5 w-7 h-7 rounded-full flex items-center justify-center shadow-md cursor-pointer bg-white border border-[#e0d8cf] hover:bg-[#f4ece1] hover:scale-105 transition-all"
                  title="Change profile photo (JPG, PNG, WEBP max 2MB)"
                >
                  <Camera className="w-3.5 h-3.5 text-[#4a3728]" />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={onAvatarFileSelected}
                  />
                </label>
              )}

              {isApproved && (
                <div
                  className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center shadow-sm bg-[#4a3728] border-2 border-white"
                  title="Verified Senior Mentor"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            {/* Name and headline */}
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <p className="text-2xl font-black tracking-tight text-[#4a3728]">
                  {fullName || <EmptyValue />}
                </p>
                {isOwner && isGlobalEditMode && activeSection !== "header" && (
                  <button
                    type="button"
                    onClick={() => startEditSection("header")}
                    className="p-1 text-[#a08070] hover:text-[#4a3728] rounded transition"
                    title="Edit Name & Headline"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {activeSection === "header" ? (
                <div className="mt-3 space-y-3 bg-[#fbf7f3] p-4 rounded-2xl border border-[#e0d8cf] max-w-md">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-[#a08070] block mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={draftFullName}
                      onChange={(e) => setDraftFullName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-[#e0d8cf] rounded-xl text-xs font-bold text-[#4a3728] outline-none focus:ring-2 focus:ring-[#4a3728]"
                      placeholder="e.g. Nisita Chandel"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold uppercase text-[#a08070] block mb-1">
                        Current Role
                      </label>
                      <input
                        type="text"
                        value={draftRole}
                        onChange={(e) => setDraftRole(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-[#e0d8cf] rounded-xl text-xs font-medium text-[#4a3728] outline-none focus:ring-2 focus:ring-[#4a3728]"
                        placeholder="e.g. Lead Engineer"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase text-[#a08070] block mb-1">
                        Current Company
                      </label>
                      <input
                        type="text"
                        value={draftCompany}
                        onChange={(e) => setDraftCompany(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-[#e0d8cf] rounded-xl text-xs font-medium text-[#4a3728] outline-none focus:ring-2 focus:ring-[#4a3728]"
                        placeholder="e.g. Google"
                      />
                    </div>
                  </div>
                  {sectionError && (
                    <p className="text-red-500 text-xs font-medium">{sectionError}</p>
                  )}
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-3 py-1 rounded-lg text-xs font-bold border border-[#e0d8cf] text-[#7a5c3e]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => saveSection("header")}
                      disabled={savingSection === "header"}
                      className="px-3 py-1 rounded-lg text-xs font-bold bg-[#4a3728] text-white hover:bg-[#684e3a]"
                    >
                      {savingSection === "header" ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-xs ${
                      isApproved
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : verificationStatus === "rejected"
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : verificationStatus === "under_review"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-gray-50 text-gray-700 border border-gray-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isApproved
                          ? "bg-emerald-500"
                          : verificationStatus === "rejected"
                          ? "bg-red-500"
                          : verificationStatus === "under_review"
                          ? "bg-amber-500"
                          : "bg-gray-400"
                      }`}
                    />
                    {verificationStatus?.toUpperCase()?.replace("_", " ")}
                  </span>
                  <span className="text-sm font-semibold text-[#7a5c3e]">
                    {currentRole} {currentCompany ? `@ ${currentCompany}` : ""}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. PROFESSIONAL EXPERIENCE */}
          <SectionCard
            sectionKey="experience"
            label="Professional Experience"
            isEditing={activeSection === "experience"}
            editContent={
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold uppercase text-[#a08070] block mb-1">
                    Current Role
                  </label>
                  <input
                    type="text"
                    value={draftRole}
                    onChange={(e) => setDraftRole(e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full px-3.5 py-2 bg-[#fbf7f3] border border-[#e0d8cf] rounded-xl text-xs font-semibold text-[#4a3728] outline-none focus:ring-2 focus:ring-[#4a3728]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-[#a08070] block mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={draftCompany}
                    onChange={(e) => setDraftCompany(e.target.value)}
                    placeholder="e.g. Microsoft"
                    className="w-full px-3.5 py-2 bg-[#fbf7f3] border border-[#e0d8cf] rounded-xl text-xs font-semibold text-[#4a3728] outline-none focus:ring-2 focus:ring-[#4a3728]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-[#a08070] block mb-1">
                    Experience Level
                  </label>
                  <select
                    value={draftExpLevel}
                    onChange={(e) => setDraftExpLevel(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#fbf7f3] border border-[#e0d8cf] rounded-xl text-xs font-semibold text-[#4a3728] outline-none focus:ring-2 focus:ring-[#4a3728]"
                  >
                    {EXPERIENCE_LEVEL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-[#a08070] block mb-1">
                    Years of Experience (0 - 60)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    step="0.5"
                    value={draftYearsExp}
                    onChange={(e) => setDraftYearsExp(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-[#fbf7f3] border border-[#e0d8cf] rounded-xl text-xs font-semibold text-[#4a3728] outline-none focus:ring-2 focus:ring-[#4a3728]"
                  />
                </div>
              </div>
            }
          >
            <div className="flex flex-col gap-1.5">
              <p className="text-[15px] font-bold text-[#5a4535]">
                {currentRole} {currentCompany ? `at ${currentCompany}` : ""}
              </p>
              <div className="flex items-center gap-2.5 mt-0.5">
                <span className="px-2.5 py-1 bg-[#ece7e2] border border-[#e0d8cf] rounded-md text-[11px] font-black tracking-wide text-[#4a3728] shadow-xs">
                  {experienceLevel?.toUpperCase()} LEVEL
                </span>
                <span className="text-sm font-bold text-[#a08070]">
                  {yearsOfExperience} Years Exp.
                </span>
              </div>
            </div>
          </SectionCard>

          {/* 2. EDUCATION */}
          <SectionCard
            sectionKey="education"
            label="Education"
            isEditing={activeSection === "education"}
            editContent={
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold uppercase text-[#a08070] block mb-1">
                    Degree
                  </label>
                  <input
                    type="text"
                    value={draftDegree}
                    onChange={(e) => setDraftDegree(e.target.value)}
                    placeholder="e.g. B.Tech"
                    className="w-full px-3.5 py-2 bg-[#fbf7f3] border border-[#e0d8cf] rounded-xl text-xs font-semibold text-[#4a3728] outline-none focus:ring-2 focus:ring-[#4a3728]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-[#a08070] block mb-1">
                    Field of Study
                  </label>
                  <input
                    type="text"
                    value={draftFieldOfStudy}
                    onChange={(e) => setDraftFieldOfStudy(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="w-full px-3.5 py-2 bg-[#fbf7f3] border border-[#e0d8cf] rounded-xl text-xs font-semibold text-[#4a3728] outline-none focus:ring-2 focus:ring-[#4a3728]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-[#a08070] block mb-1">
                    College / University
                  </label>
                  <input
                    type="text"
                    value={draftCollege}
                    onChange={(e) => setDraftCollege(e.target.value)}
                    placeholder="e.g. Delhi Technological University"
                    className="w-full px-3.5 py-2 bg-[#fbf7f3] border border-[#e0d8cf] rounded-xl text-xs font-semibold text-[#4a3728] outline-none focus:ring-2 focus:ring-[#4a3728]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-[#a08070] block mb-1">
                    Graduation Year
                  </label>
                  <input
                    type="number"
                    min="1980"
                    max={new Date().getFullYear() + 10}
                    value={draftGradYear}
                    onChange={(e) => setDraftGradYear(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-[#fbf7f3] border border-[#e0d8cf] rounded-xl text-xs font-semibold text-[#4a3728] outline-none focus:ring-2 focus:ring-[#4a3728]"
                  />
                </div>
              </div>
            }
          >
            <p className="text-[15px] font-bold text-[#5a4535]">
              {degree} in {fieldOfStudy}
            </p>
            <p className="text-sm font-semibold text-[#a08070] mt-1.5">
              {college} <span className="text-[#c0b0a0]">({graduationYear})</span>
            </p>
          </SectionCard>

          {/* 3. PRIMARY EXPERTISE */}
          <SectionCard
            sectionKey="expertise"
            label="Primary Expertise"
            isEditing={activeSection === "expertise"}
            editContent={
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase text-[#a08070] block">
                  Select Domain
                </label>
                <select
                  value={draftExpertise}
                  onChange={(e) => setDraftExpertise(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#fbf7f3] border border-[#e0d8cf] rounded-xl text-xs font-bold text-[#4a3728] outline-none focus:ring-2 focus:ring-[#4a3728]"
                >
                  {DOMAIN_OPTIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            }
          >
            {primaryExpertise ? (
              <span className="inline-flex px-3.5 py-1.5 bg-[#4a3728] shadow-xs text-white rounded-full text-xs font-bold uppercase tracking-wide">
                {primaryExpertise.replace(/_/g, " ")}
              </span>
            ) : (
              <EmptyValue />
            )}
          </SectionCard>

          {/* 4. MENTORSHIP HELP AREAS */}
          <SectionCard
            sectionKey="helpAreas"
            label="Mentorship Help Areas"
            isEditing={activeSection === "helpAreas"}
            editContent={
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-[#a08070]">
                  Click to select between 3 and 7 areas you offer guidance on:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {HELP_AREA_OPTIONS.map((area) => {
                    const isSelected = draftHelpAreas.includes(area.value);
                    return (
                      <button
                        key={area.value}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setDraftHelpAreas(draftHelpAreas.filter((a) => a !== area.value));
                          } else {
                            if (draftHelpAreas.length < 7) {
                              setDraftHelpAreas([...draftHelpAreas, area.value]);
                            }
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                          isSelected
                            ? "bg-[#4a3728] text-white border-[#4a3728] shadow-xs"
                            : "bg-white text-[#7a5c3e] border-[#e0d8cf] hover:border-[#4a3728]"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {area.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] font-medium text-[#a08070] text-right">
                  Selected: {draftHelpAreas.length} (3 - 7 required)
                </p>
              </div>
            }
          >
            {helpAreas?.length ? (
              <div className="flex flex-wrap gap-2 mt-1">
                {helpAreas.map((h, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 text-xs font-bold border border-[#d0c4b5] rounded-full bg-white shadow-xs text-[#5a4535]"
                  >
                    {h.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                ))}
              </div>
            ) : (
              <EmptyValue />
            )}
          </SectionCard>

          {/* 5. TECHNOLOGIES */}
          <SectionCard
            sectionKey="technologies"
            label="Technologies"
            isEditing={activeSection === "technologies"}
            full
            editContent={
              <TagInput
                tags={draftTech}
                onChange={setDraftTech}
                suggestions={POPULAR_TECH_SUGGESTIONS}
                max={30}
                placeholder="Type technology (e.g. Next.js) and press Enter..."
              />
            }
          >
            {technologies?.length ? (
              <div className="flex flex-wrap gap-2">
                {technologies.map((t, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-white border border-[#e0d8cf] text-[#4a3728] rounded-full text-xs font-bold shadow-xs"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              <EmptyValue />
            )}
          </SectionCard>

          {/* 6. OTHER SKILLS */}
          <SectionCard
            sectionKey="skills"
            label="Other Skills"
            isEditing={activeSection === "skills"}
            full
            editContent={
              <TagInput
                tags={draftSkills}
                onChange={setDraftSkills}
                suggestions={POPULAR_SKILLS_SUGGESTIONS}
                max={20}
                placeholder="Type skill (e.g. System Design) and press Enter..."
              />
            }
          >
            {otherSkills?.length ? (
              <div className="flex flex-wrap gap-2">
                {otherSkills.map((s, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-white border border-[#e0d8cf] text-[#4a3728] rounded-full text-xs font-bold shadow-xs"
                  >
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <EmptyValue />
            )}
          </SectionCard>

          {/* 7. SHORT BIO */}
          <SectionCard
            sectionKey="bio"
            label="Short Bio"
            isEditing={activeSection === "bio"}
            full
            editContent={
              <div className="space-y-1.5">
                <textarea
                  rows={4}
                  value={draftBio}
                  onChange={(e) => setDraftBio(e.target.value)}
                  placeholder="Share a concise summary of your professional journey and mentoring strengths (50 - 1000 characters)..."
                  className="w-full p-3.5 bg-[#fbf7f3] border border-[#e0d8cf] rounded-xl text-xs font-medium text-[#4a3728] outline-none focus:ring-2 focus:ring-[#4a3728] leading-relaxed"
                />
                <p className="text-[11px] font-medium text-[#a08070] text-right">
                  {draftBio.length} / 1000 characters (min 50)
                </p>
              </div>
            }
          >
            <p className="text-sm leading-relaxed font-medium text-[#5a4535]">
              {shortBio || <EmptyValue />}
            </p>
          </SectionCard>

          {/* 8. MOTIVATION & ADVICE */}
          <SectionCard
            sectionKey="motivation"
            label="Motivation & Advice to Junior Self"
            isEditing={activeSection === "motivation"}
            full
            editContent={
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold uppercase text-[#a08070] block mb-1">
                    Motivation for Mentoring (30 - 1000 characters)
                  </label>
                  <textarea
                    rows={3}
                    value={draftMotivation}
                    onChange={(e) => setDraftMotivation(e.target.value)}
                    placeholder="Why do you want to mentor junior developers and students?"
                    className="w-full p-3 bg-[#fbf7f3] border border-[#e0d8cf] rounded-xl text-xs font-medium text-[#4a3728] outline-none focus:ring-2 focus:ring-[#4a3728]"
                  />
                  <p className="text-[11px] font-medium text-[#a08070] text-right">
                    {draftMotivation.length} / 1000 chars
                  </p>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-[#a08070] block mb-1">
                    Advice to Your Junior Self (10 - 500 characters)
                  </label>
                  <textarea
                    rows={3}
                    value={draftAdvice}
                    onChange={(e) => setDraftAdvice(e.target.value)}
                    placeholder="What single piece of advice would you give yourself when starting out?"
                    className="w-full p-3 bg-[#fbf7f3] border border-[#e0d8cf] rounded-xl text-xs font-medium text-[#4a3728] outline-none focus:ring-2 focus:ring-[#4a3728]"
                  />
                  <p className="text-[11px] font-medium text-[#a08070] text-right">
                    {draftAdvice.length} / 500 chars
                  </p>
                </div>
              </div>
            }
          >
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#a08070] mb-1">
                  Motivation
                </p>
                <p className="text-sm leading-relaxed font-medium text-[#5a4535]">
                  {motivation || <EmptyValue />}
                </p>
              </div>
              <div className="pt-2 border-t border-[#f0e8df]">
                <p className="text-xs font-bold uppercase tracking-wider text-[#a08070] mb-1">
                  Advice to Junior Self
                </p>
                <p className="text-sm leading-relaxed font-medium text-[#5a4535]">
                  {adviceToJuniorSelf || <EmptyValue />}
                </p>
              </div>
            </div>
          </SectionCard>

          {/* 9. ACHIEVEMENTS & CERTIFICATIONS (Display-only) */}
          <div
            className="p-5 rounded-2xl md:col-span-2"
            style={{ backgroundColor: "#fbf7f3", border: "1px solid #e0d8cf" }}
          >
            <p className="text-xs font-bold uppercase tracking-wider mb-2.5 text-[#a08070]">
              Achievements & Certifications
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-[#7a5c3e] mb-1">Achievements</p>
                {achievements?.length ? (
                  <ul className="list-disc pl-5 space-y-1 text-sm font-medium text-[#5a4535]">
                    {achievements.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                ) : (
                  <EmptyValue />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-[#7a5c3e] mb-1">Certifications</p>
                {certifications?.length ? (
                  <ul className="list-disc pl-5 space-y-1 text-sm font-medium text-[#5a4535]">
                    {certifications.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                ) : (
                  <EmptyValue />
                )}
              </div>
            </div>
          </div>

          {/* 10. PROFESSIONAL RESOURCE LINKS */}
          <SectionCard
            sectionKey="links"
            label="Professional Resource Links"
            isEditing={activeSection === "links"}
            full
            editContent={
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold uppercase text-[#a08070] block mb-1">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    value={draftLinkedin}
                    onChange={(e) => setDraftLinkedin(e.target.value)}
                    placeholder="https://www.linkedin.com/in/username"
                    className="w-full px-3.5 py-2 bg-[#fbf7f3] border border-[#e0d8cf] rounded-xl text-xs font-semibold text-[#4a3728] outline-none focus:ring-2 focus:ring-[#4a3728]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-[#a08070] block mb-1">
                    GitHub Profile URL (optional)
                  </label>
                  <input
                    type="url"
                    value={draftGithub}
                    onChange={(e) => setDraftGithub(e.target.value)}
                    placeholder="https://github.com/username"
                    className="w-full px-3.5 py-2 bg-[#fbf7f3] border border-[#e0d8cf] rounded-xl text-xs font-semibold text-[#4a3728] outline-none focus:ring-2 focus:ring-[#4a3728]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-[#a08070] block mb-1">
                    Portfolio / Website URL (optional)
                  </label>
                  <input
                    type="url"
                    value={draftPortfolio}
                    onChange={(e) => setDraftPortfolio(e.target.value)}
                    placeholder="https://yourportfolio.com"
                    className="w-full px-3.5 py-2 bg-[#fbf7f3] border border-[#e0d8cf] rounded-xl text-xs font-semibold text-[#4a3728] outline-none focus:ring-2 focus:ring-[#4a3728]"
                  />
                </div>
              </div>
            }
          >
            <div className="flex flex-wrap gap-3 mt-1.5">
              {linkedinUrl && (
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-[#d0c4b5] rounded-xl shadow-xs text-sm font-bold text-[#4a3728] hover:bg-[#f3ece4] transition-colors focus:ring-2 focus:ring-[#4a3728] outline-none"
                >
                  <Linkedin className="w-4 h-4 text-[#0077b5]" /> LinkedIn
                </a>
              )}
              {githubUrl && (
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-[#d0c4b5] rounded-xl shadow-xs text-sm font-bold text-[#4a3728] hover:bg-[#f3ece4] transition-colors focus:ring-2 focus:ring-[#4a3728] outline-none"
                >
                  GitHub
                </a>
              )}
              {portfolioUrl && (
                <a
                  href={portfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-[#d0c4b5] rounded-xl shadow-xs text-sm font-bold text-[#4a3728] hover:bg-[#f3ece4] transition-colors focus:ring-2 focus:ring-[#4a3728] outline-none"
                >
                  <ExternalLink className="w-4 h-4" /> Portfolio
                </a>
              )}
              {resumeUrl && (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-[#d0c4b5] rounded-xl shadow-xs text-sm font-bold text-[#4a3728] hover:bg-[#f3ece4] transition-colors focus:ring-2 focus:ring-[#4a3728] outline-none"
                >
                  <FileText className="w-4 h-4" /> Resume PDF
                </a>
              )}
              {proofDocumentUrl && (
                <a
                  href={proofDocumentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-[#d0c4b5] rounded-xl shadow-xs text-sm font-bold text-[#4a3728] hover:bg-[#f3ece4] transition-colors focus:ring-2 focus:ring-[#4a3728] outline-none"
                >
                  <FileText className="w-4 h-4" /> Proof Document
                </a>
              )}
            </div>
          </SectionCard>
        </div>
      </div>

      {/* ======================================================================== */}
      {/* Avatar Image Picker Preview & Confirmation Modal                         */}
      {/* ======================================================================== */}
      {avatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#e0d8cf] animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-[#f0e8df] mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#f4ece1] text-[#4a3728] flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-[#4a3728]">
                  Update Profile Photo
                </h3>
              </div>
              <button
                type="button"
                onClick={closeAvatarModal}
                disabled={uploadingAvatar}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#a08070] hover:bg-[#f4ece1] hover:text-[#4a3728] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {avatarError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{avatarError}</span>
              </div>
            )}

            <div className="flex flex-col items-center justify-center py-4">
              <div className="w-32 h-32 rounded-full overflow-hidden shadow-md border-4 border-[#e0d8cf] mb-3 relative bg-[#fbf7f3]">
                {avatarPreviewUrl ? (
                  <img
                    src={avatarPreviewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-[#a08070]">
                    {initials}
                  </div>
                )}
              </div>
              <p className="text-xs font-bold text-[#4a3728]">
                {selectedAvatarFile?.name}
              </p>
              <p className="text-[11px] font-medium text-[#a08070] mt-0.5">
                {selectedAvatarFile
                  ? `${(selectedAvatarFile.size / (1024 * 1024)).toFixed(2)} MB`
                  : ""}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#f0e8df]">
              <button
                type="button"
                onClick={closeAvatarModal}
                disabled={uploadingAvatar}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-[#e0d8cf] text-[#7a5c3e] hover:bg-[#fbf7f3] transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAvatarUpload}
                disabled={uploadingAvatar}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-[#4a3728] text-white hover:bg-[#684e3a] shadow-xs transition disabled:opacity-50"
              >
                {uploadingAvatar ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm & Upload</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
