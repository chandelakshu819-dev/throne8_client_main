// src/features/mentor/components/sections/MentorDiscoverySection.tsx
"use client";

import { useAuth } from "@/features/auth/hooks/useAuth";
import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Crown,
    Users,
    Star,
    Landmark,
    FileText,
    Eye,
    Calendar,
    ArrowRight,
    Award,
} from "lucide-react";
import Sidebar from "../layout/Sidebar";
import MentorService, { PublicSeniorMentor } from "@/lib/api/mentorship.service";
import {
    parseRoleCompany,
    splitSkills,
} from "@/shared/utils/mentorFormat";

interface MentorDiscoverySectionProps {
    toggleCompare: (id: number) => void;

    compareList: number[];
}

interface MentorData {
    id: string;
    userId?: string;
    name: string;
    role: string;
    company: string;
    college?: string;
    degree?: string;
    rating?: number;
    sessions: number;
    image: string;
    tags: string[];
    expTotal: number;
    domains: string[];
    acceptsBooking: boolean;
    sessionId?: string | null;
}

const MAX_TAGS = 3;
// Total characters of skill text that fit in one row of a card (keeps tags on a single line)
const TAG_CHAR_BUDGET = 30;

// "Throne8 (Thronet Technology Private Limited)" -> "Throne8"
const shortCompany = (company: string): string =>
    company.replace(/\s*\(.*?\)\s*/g, " ").replace(/\s+/g, " ").trim() || company.trim();

function MentorAvatar({ image, name }: { image: string; name: string }) {
    const [imageFailed, setImageFailed] = useState(false);
    const initials = name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "M";

    if (!image || imageFailed) {
        return (
            <div className="w-full h-full flex items-center justify-center text-[#4a3728] text-xl font-bold">
                {initials}
            </div>
        );
    }

    return (
        <img
            src={image}
            alt={name}
            onError={() => setImageFailed(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
    );
}

const formatDisplaySkill = (skill: string): string =>
    skill
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());

// Display-only role formatter: "product-manager" → "Product Manager"
const formatDisplayRole = (role: string | undefined | null): string => {
    if (!role) return "Mentor";
    return role
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
};

const GRID_CLASS = "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch";

export default function MentorDiscoverySection({ toggleCompare, compareList }: MentorDiscoverySectionProps) {
    const router = useRouter();
    const { user } = useAuth();
    const [industryMentors, setIndustryMentors] = useState<MentorData[]>([]);
    const [filteredIndustryMentors, setFilteredIndustryMentors] = useState<MentorData[]>([]);
    const [collegeMentors, setCollegeMentors] = useState<PublicSeniorMentor[]>([]);
    const [filteredCollegeMentors, setFilteredCollegeMentors] = useState<PublicSeniorMentor[]>([]);
    const [industryStatus, setIndustryStatus] = useState<"loading" | "success" | "error">("loading");
    const [collegeStatus, setCollegeStatus] = useState<"loading" | "success" | "error">("loading");
    const [industryError, setIndustryError] = useState("");
    const [collegeError, setCollegeError] = useState("");
    const [filtering, setFiltering] = useState(false);

    // Show more / pagination states for each section
    const [showAllCollegeMentors, setShowAllCollegeMentors] = useState(false);
    const [showAllIndustryMentors, setShowAllIndustryMentors] = useState(false);

    // 3-column grid → multiples of 3 so rows fill up
    const COLLEGE_LIMIT = 6;
    const INDUSTRY_LIMIT = 6;

    // Filter states
    const [companySearch, setCompanySearch] = useState("");
    const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
    const [selectedExps, setSelectedExps] = useState<string[]>([]);

    const loadIndustryMentors = useCallback(async () => {
        setIndustryStatus("loading");
        setIndustryError("");
        try {
            const response = await MentorService.getAllMentors({ page: 1, limit: 50 });
            if (!Array.isArray(response.data)) {
                throw new Error("Mentor list response was invalid.");
            }
            const rawList = response.data;
            const list = rawList.filter(
                (mentor: any, index: number, mentors: any[]) =>
                    mentors.findIndex((item) => item.mentorId === mentor.mentorId) === index
            );
            const mapped: MentorData[] = list.map((mentor: any) => {
                const rawRole = mentor.experience?.currentRole ?? "";
                const rawTitle = mentor.title ?? "";
                const totalExp = Number(mentor.experience?.total) || 0;
                const parsed = parseRoleCompany(rawRole, rawTitle, mentor.company);
                const backendCompany = typeof mentor.company === "string" ? mentor.company.trim() : "";
                const college = typeof mentor.college === "string" ? mentor.college.trim() : undefined;
                const degree = typeof mentor.degree === "string" ? mentor.degree.trim() : undefined;

                return {
                    id: String(mentor.mentorId),
                    userId: mentor.userId,
                    name: `${mentor.user?.firstName ?? ""} ${mentor.user?.lastName ?? ""}`.trim() || mentor.user?.name || "Mentor",
                    role: parsed.role,
                    company: backendCompany || parsed.company || "",
                    college: college || undefined,
                    degree: degree || undefined,
                    rating: Number(mentor.stats?.averageRating) || 0,
                    sessions: Number(mentor.stats?.totalSessions || mentor.trustScore?.metrics?.totalCompletedSessions) || 0,
                    image:
                        (mentor as any).profilePic ||
                        (mentor as any).profilePhoto ||
                        (mentor as any).profilePhotoUrl ||
                        (mentor as any).user?.profilePic ||
                        "",
                    // Sab skills rakho (comma split ke saath); card mein max 3 + "+N more" dikhega
                    tags: splitSkills(mentor.skills),
                    expTotal: totalExp,
                    domains: Array.isArray(mentor.domains) ? mentor.domains : [],
                    acceptsBooking: Boolean(mentor.pricing?.quickCall || mentor.availability?.autoAcceptBookings || mentor.availability?.daysAvailable?.length),
                };
            });
            setIndustryMentors(mapped);
            setFilteredIndustryMentors(mapped);
            setIndustryStatus("success");
        } catch (error) {
            setIndustryError(error instanceof Error ? error.message : "Failed to load industry mentors.");
            setIndustryStatus("error");
        }
    }, []);

    const loadCollegeMentors = useCallback(async () => {
        setCollegeStatus("loading");
        setCollegeError("");
        try {
            const response = await MentorService.getPublicSeniorMentors({ page: 1, limit: 50 });
            if (!Array.isArray(response.data)) {
                throw new Error("College mentor list response was invalid.");
            }
            setCollegeMentors(response.data);
            setFilteredCollegeMentors(response.data);
            setCollegeStatus("success");
        } catch (error) {
            setCollegeError(error instanceof Error ? error.message : "Failed to load college mentors.");
            setCollegeStatus("error");
        }
    }, []);

    useEffect(() => {
        void loadIndustryMentors();
        void loadCollegeMentors();
    }, [loadIndustryMentors, loadCollegeMentors]);

    // Domain mapping — sidebar labels → API domain values
    const DOMAIN_MAP: Record<string, string[]> = {
        "Tech/Engineering": ["web_development", "interview_prep", "open_source"],
        "Product/Design": ["product_management", "ui_ux_design"],
        "Marketing/Growth": ["career_guidance", "entrepreneurship"],
        "Data Science/AI": ["data_science", "machine_learning"],
    };

    // Experience mapping — sidebar labels → year ranges
    const EXP_MAP: Record<string, [number, number]> = {
        "0-3 Yrs": [0, 3],
        "3-7 Yrs": [3, 7],
        "7-12 Yrs": [7, 12],
        "12+ Yrs": [12, 999],
    };

    const handleApplyFilters = () => {
        setFiltering(true);
        // Reset show-more states when filters are re-applied
        setShowAllCollegeMentors(false);
        setShowAllIndustryMentors(false);

        setTimeout(() => {
            let industryResult = [...industryMentors];
            let collegeResult = [...collegeMentors];

            // Company search filter
            if (companySearch.trim()) {
                const searchLower = companySearch.toLowerCase();
                industryResult = industryResult.filter(m =>
                    m.company?.toLowerCase().includes(searchLower) ||
                    m.name?.toLowerCase().includes(searchLower)
                );
                collegeResult = collegeResult.filter((mentor) =>
                    mentor.displayName.toLowerCase().includes(searchLower) ||
                    mentor.college.toLowerCase().includes(searchLower)
                );
            }

            // Domain filter
            if (selectedDomains.length > 0) {
                const apiDomains = selectedDomains.flatMap(d => DOMAIN_MAP[d] ?? []);
                industryResult = industryResult.filter(m =>
                    m.domains.some((d: string) => apiDomains.includes(d))
                );
            }

            // Experience filter
            if (selectedExps.length > 0) {
                industryResult = industryResult.filter(m =>
                    selectedExps.some(exp => {
                        const [min, max] = EXP_MAP[exp];
                        return m.expTotal >= min && m.expTotal <= max;
                    })
                );
            }

            setFilteredIndustryMentors(industryResult);
            setFilteredCollegeMentors(collegeResult);
            setFiltering(false);
        }, 400);
    };

    const handleClearFilters = () => {
        setCompanySearch("");
        setSelectedDomains([]);
        setSelectedExps([]);
        setShowAllCollegeMentors(false);
        setShowAllIndustryMentors(false);
        setFilteredIndustryMentors(industryMentors);
        setFilteredCollegeMentors(collegeMentors);
    };

    const isFiltered = Boolean(companySearch || selectedDomains.length > 0 || selectedExps.length > 0);

    // Sliced lists for initial view
    const visibleCollegeMentors = showAllCollegeMentors
        ? filteredCollegeMentors
        : filteredCollegeMentors.slice(0, COLLEGE_LIMIT);

    const visibleIndustryMentors = showAllIndustryMentors
        ? filteredIndustryMentors
        : filteredIndustryMentors.slice(0, INDUSTRY_LIMIT);

        const handleNavigate = (mentor: MentorData) => {
            // Agar mentor khud apni hi profile pe click kar raha hai
            if (user?.userId && mentor.userId && user.userId === mentor.userId) {
                router.push(`/mentorship/user-dashboard/${user.userId}`);
                return;
            }
    
            const slugName = (mentor.name || "mentor").toLowerCase().replace(/\s+/g, "-");
            router.push(`/mentorship/mentor-card/${slugName}/${mentor.id}`);
        };
    
        // Card ya button, kahin bhi click ho, same page khulna chahiye
        const handleCardNavigate = (mentor: MentorData, isIndustryCard: boolean) => {
            if (!isIndustryCard) {
                router.push(`/mentorship/senior-mentor/${mentor.id}`);
                return;
            }
            handleNavigate(mentor);
        };

    // Render Industry cards from Mentor records and College cards from approved applications.
    const renderCard = (mentor: MentorData, isIndustryCard: boolean) => {
        const college = mentor.college?.trim();
        const degree = mentor.degree?.trim();
        const hasCollege = Boolean(college);
        const hasDegree = Boolean(degree);
        const hasEducation = hasCollege || hasDegree;

        // Skills: "Programming Languages: C++" -> "C++", then pick only as many as fit in ONE row
        const cleanTags = mentor.tags
            .map((t) => (isIndustryCard ? t : formatDisplaySkill(t)).replace(/^[^:]{2,40}:\s*/, "").trim())
            .filter(Boolean);
        const visibleTags: string[] = [];
        let used = 0;
        for (const tag of cleanTags) {
            const cost = tag.length + 3; // tag text + padding allowance
            if (visibleTags.length >= MAX_TAGS) break;
            if (visibleTags.length > 0 && used + cost > TAG_CHAR_BUDGET) break;
            visibleTags.push(tag);
            used += cost;
        }
        const extraTags = cleanTags.length - visibleTags.length;

        const companyLabel = mentor.company ? shortCompany(mentor.company) : "";

        const expLabel =
            mentor.expTotal > 0
                ? `${mentor.expTotal}${mentor.expTotal >= 2 ? "+" : ""} Yr${mentor.expTotal > 1 ? "s" : ""} Experience`
                : "";

        const hasRating = typeof mentor.rating === "number" && mentor.rating > 0;
        const roleLine = `${formatDisplayRole(mentor.role)}${companyLabel ? ` @ ${companyLabel}` : ""}`;

        return (
            <div
            key={mentor.id}
            role="link"
            tabIndex={0}
            onClick={() => handleCardNavigate(mentor, isIndustryCard)}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleCardNavigate(mentor, isIndustryCard);
                }
            }}
            className="h-full cursor-pointer rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 relative group bg-[#faf6f1] border border-[#e8ded5] hover:border-[#c4963a]/60 shadow-sm hover:shadow-md"
        >
                <div>
                    {/* Avatar */}
                    <div className="flex justify-center mb-2.5">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-[3px] border-[#d4a537] shadow-sm flex items-center justify-center bg-[#f5ede5]">
                            <MentorAvatar image={mentor.image} name={mentor.name} />
                        </div>
                    </div>

                    {/* Name */}
                    <h4 className="font-bold text-[15px] text-center text-[#2d2015] truncate px-1">
                        {mentor.name}
                    </h4>

                    {/* Role @ Company — fixed 2-line height so every card lines up */}
                    {isIndustryCard && (
                        <p
                            title={roleLine}
                            className="text-[10px] uppercase tracking-wide leading-[14px] text-[#8b7355] text-center font-semibold line-clamp-2 mt-1 mb-2 px-1 h-[28px]"
                        >
                            {roleLine}
                        </p>
                    )}

                    {/* Rating & Sessions — fixed height */}
                    {(isIndustryCard || hasRating || mentor.sessions > 0) && (
                        <div className="flex items-center justify-center gap-1.5 text-sm mb-2.5 h-6">
                            {hasRating ? (
                                <>
                                    <Star className="w-3.5 h-3.5 fill-[#d99b26] text-[#d99b26]" />
                                    <span className="font-bold text-[#2d2015]">{mentor.rating?.toFixed(1)}</span>
                                    <span className="text-[11px] text-[#8b7355]">
                                        ({mentor.sessions} session{mentor.sessions === 1 ? "" : "s"})
                                    </span>
                                </>
                            ) : isIndustryCard ? (
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#f1e4cf] text-[#8b5e3c]">
                                    New
                                </span>
                            ) : (
                                mentor.sessions > 0 && (
                                    <span className="text-[11px] text-[#8b7355]">
                                        {mentor.sessions} session{mentor.sessions === 1 ? "" : "s"}
                                    </span>
                                )
                            )}
                        </div>
                    )}

                    {/* Skills — ONE row only, never wraps; fixed height so all cards match */}
                    <div className="flex flex-nowrap items-center justify-center gap-1 mb-2.5 h-6 overflow-hidden">
                        {visibleTags.map((tag, idx) => (
                            <span
                                key={`${tag}-${idx}`}
                                title={tag}
                                className="min-w-0 truncate whitespace-nowrap text-[9.5px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-white text-[#6b5643] border border-[#ebdcd0]"
                            >
                                {tag}
                            </span>
                        ))}
                        {extraTags > 0 && (
                            <span className="flex-shrink-0 whitespace-nowrap text-[9.5px] font-bold px-2 py-0.5 rounded-full text-[#8b7355] border border-dashed border-[#c4963a]/50">
                                +{extraTags}
                            </span>
                        )}
                    </div>

                    {/* College & Degree Section — College Mentor cards only; hidden when no data */}
                    {!isIndustryCard && hasEducation && (
                        <div className="w-full mb-2">
                            <div className="border-t border-[#e8ded5] mb-2" />
                            <div className="flex items-stretch gap-3 text-left py-1.5">
                                {hasCollege && (
                                    <div className={`min-w-0 ${hasDegree ? "flex-1" : "w-full"}`}>
                                        <div className="flex items-center gap-1 text-[#8b7355] mb-1">
                                            <Landmark className="w-3.5 h-3.5 flex-shrink-0 text-[#8b5e3c]" />
                                            <span className="text-[10px] font-medium uppercase tracking-wider">College</span>
                                        </div>
                                        <p
                                            className="text-[13px] font-semibold text-[#2d2015] line-clamp-2 leading-snug"
                                            title={college}
                                        >
                                            {college}
                                        </p>
                                    </div>
                                )}
                                {hasCollege && hasDegree && (
                                    <div className="w-px bg-[#e8ded5] self-stretch flex-shrink-0" />
                                )}
                                {hasDegree && (
                                    <div className={`min-w-0 ${hasCollege ? "flex-1" : "w-full"}`}>
                                        <div className="flex items-center gap-1 text-[#8b7355] mb-1">
                                            <FileText className="w-3.5 h-3.5 flex-shrink-0 text-[#8b5e3c]" />
                                            <span className="text-[10px] font-medium uppercase tracking-wider">Degree</span>
                                        </div>
                                        <p
                                            className="text-[13px] font-semibold text-[#2d2015] truncate"
                                            title={degree}
                                        >
                                            {degree}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    {/* Experience footer — Industry cards */}
                    {isIndustryCard && expLabel && (
                        <div className="border-t border-[#e8ded5] pt-2.5 mb-2.5 flex items-center justify-center gap-1.5 text-[#2d2015]">
                            <Award className="w-3.5 h-3.5 text-[#c4963a]" />
                            <span className="text-[11px] font-semibold">{expLabel}</span>
                        </div>
                    )}

                    {/* Action button — same style on all cards */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleCardNavigate(mentor, isIndustryCard);
                        }}
                        className="w-full py-2 px-3 bg-[#3a2a1e] hover:bg-[#251910] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                        {isIndustryCard && !mentor.acceptsBooking ? (
                            <>
                                <Eye className="w-3.5 h-3.5" />
                                <span>View Profile</span>
                            </>
                        ) : (
                            <>
                                <Calendar className="w-3.5 h-3.5" />
                                <span>
                                    {!isIndustryCard
                                        ? mentor.sessionId
                                            ? "Book Free Session"
                                            : "View Profile"
                                        : "Book Session"}
                                </span>
                                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    };

    // Skeleton loader grid
    const renderSkeletonGrid = (count: number = 3) => (
        <div className={GRID_CLASS}>
            {Array(count).fill(0).map((_, i) => (
                <div key={i} className="h-[300px] rounded-2xl bg-[#eee5dd] animate-pulse" />
            ))}
        </div>
    );

    const renderSectionLoadState = (
        status: "loading" | "success" | "error",
        error: string,
        retry: () => void,
        empty: boolean
    ) => {
        if (filtering || status === "loading") return renderSkeletonGrid();
        if (status === "error") {
            return (
                <div className="rounded-2xl border border-red-200 bg-white p-6 text-center">
                    <p className="text-sm text-red-700">{error}</p>
                    <button
                        onClick={retry}
                        className="mt-4 rounded-xl bg-[#4a3728] px-5 py-2 text-sm font-bold text-white hover:bg-[#38291e]"
                    >
                        Retry
                    </button>
                </div>
            );
        }
        if (empty) {
            return (
                <div className="rounded-2xl border border-[#e8ded5] bg-white p-8 text-center text-sm text-slate-500">
                    {isFiltered ? "No mentors match these filters." : "No mentors yet."}
                </div>
            );
        }
        return null;
    };

    return (
        <section className="py-12 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10">
            {/* LEFT COLUMN: Sidebar (Untouched) */}
            <Sidebar
                companySearch={companySearch}
                setCompanySearch={setCompanySearch}
                selectedDomains={selectedDomains}
                setSelectedDomains={setSelectedDomains}
                selectedExps={selectedExps}
                setSelectedExps={setSelectedExps}
                onApply={handleApplyFilters}
                onClear={handleClearFilters}
            />

            {/* RIGHT COLUMN: Industry and College Mentors */}
            <div className="flex flex-col gap-10">
                {(industryStatus !== "success" || industryMentors.length > 0) && (
                    <section>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-full border border-[#4a3728]/20 bg-[#faf6f1] flex items-center justify-center text-[#4a3728] shadow-sm flex-shrink-0">
                                <Crown className="w-5 h-5 text-[#8b5e3c]" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-[#2d2015] tracking-tight">Industry Mentor</h2>
                                <p className="text-xs text-[#8b7355] mt-0.5">Learn from experienced industry professionals.</p>
                            </div>
                        </div>
                        {renderSectionLoadState(industryStatus, industryError, loadIndustryMentors, filteredIndustryMentors.length === 0) ?? (
                            <>
                                <div className={GRID_CLASS}>
                                    {visibleIndustryMentors.map((mentor) => renderCard(mentor, true))}
                                </div>
                                {filteredIndustryMentors.length > INDUSTRY_LIMIT && (
                                    <div className="mt-6">
                                        <button
                                            onClick={() => setShowAllIndustryMentors((previous) => !previous)}
                                            className="group relative w-full py-4 px-6 bg-white border border-[#ece7e2] text-[#4a3728] text-sm font-bold rounded-2xl shadow-sm hover:shadow-md hover:border-[#8b7355] transition-all flex items-center justify-center gap-2"
                                        >
                                            <span>{showAllIndustryMentors ? "Show less" : "Show more"}</span>
                                            <ArrowRight className={`w-4 h-4 ${showAllIndustryMentors ? "-rotate-90" : ""}`} />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </section>
                )}

                {(collegeStatus !== "success" || collegeMentors.length > 0) && (
                    <section>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-full border border-[#4a3728]/20 bg-[#faf6f1] flex items-center justify-center text-[#4a3728] shadow-sm flex-shrink-0">
                                <Users className="w-5 h-5 text-[#4a3728]" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-[#2d2015] tracking-tight">College Mentor</h2>
                                <p className="text-xs text-[#8b7355] mt-0.5">Connect with verified college mentors.</p>
                            </div>
                        </div>
                        {renderSectionLoadState(collegeStatus, collegeError, loadCollegeMentors, filteredCollegeMentors.length === 0) ?? (
                            <>
                                <div className={GRID_CLASS}>
                                    {visibleCollegeMentors.map((mentor) =>
                                        renderCard({
                                            id: mentor.id,
                                            name: mentor.displayName,
                                            role: "",
                                            company: "",
                                            college: mentor.college,
                                            degree: mentor.degree,
                                            sessions: mentor.sessionsCount,
                                            image:
                                                (mentor as any).profilePic ||
                                                (mentor as any).profilePhoto ||
                                                (mentor as any).profilePhotoUrl ||
                                                (mentor as any).user?.profilePic ||
                                                "",
                                            tags: splitSkills(mentor.skills),
                                            expTotal: 0,
                                            domains: [],
                                            acceptsBooking: mentor.sessionId !== null,
                                            sessionId: mentor.sessionId,
                                        }, false)
                                    )}
                                </div>
                                {filteredCollegeMentors.length > COLLEGE_LIMIT && (
                                    <div className="mt-6">
                                        <button
                                            onClick={() => setShowAllCollegeMentors((previous) => !previous)}
                                            className="group relative w-full py-4 px-6 bg-white border border-[#ece7e2] text-[#4a3728] text-sm font-bold rounded-2xl shadow-sm hover:shadow-md hover:border-[#8b7355] transition-all flex items-center justify-center gap-2"
                                        >
                                            <span>{showAllCollegeMentors ? "Show less" : "Show more"}</span>
                                            <ArrowRight className={`w-4 h-4 ${showAllCollegeMentors ? "-rotate-90" : ""}`} />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </section>
                )}
            </div>
        </section>
    );
}