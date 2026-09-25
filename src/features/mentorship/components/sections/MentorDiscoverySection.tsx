// src/features/mentor/components/sections/MentorDiscoverySection.tsx
"use client";

import { useAuth } from "@/features/auth/hooks/useAuth";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Crown,
    Users,
    Star,
    Briefcase,
    Eye,
    Calendar,
    ArrowRight
} from "lucide-react";
import Sidebar from "../layout/Sidebar";
import MentorService from "@/lib/api/mentorship.service";

interface MentorDiscoverySectionProps {
    toggleCompare: (id: number) => void;
    compareList: number[];
}

interface MentorData {
    id: string | number;
     userId?: string;
    name: string;
    role: string;
    company: string;
    rating: number;
    sessions: number;
    price: number;
    image: string;
    tags: string[];
    exp: string;
    expTotal: number;
    domains: string[];
    isSenior: boolean;
    acceptsBooking: boolean;
    isDummy?: boolean;
}

export default function MentorDiscoverySection({ toggleCompare, compareList }: MentorDiscoverySectionProps) {
    const router = useRouter();
     const { user } = useAuth();
    const [allMentors, setAllMentors] = useState<MentorData[]>([]);
    const [filteredMentors, setFilteredMentors] = useState<MentorData[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtering, setFiltering] = useState(false);

    // Show more / pagination states for each section
    const [showAllSeniorMentors, setShowAllSeniorMentors] = useState(false);
    const [showAllRegularMentors, setShowAllRegularMentors] = useState(false);

    const SENIOR_LIMIT = 4;
    const REGULAR_LIMIT = 4;

    // Filter states
    const [companySearch, setCompanySearch] = useState("");
    const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
    const [selectedExps, setSelectedExps] = useState<string[]>([]);

    useEffect(() => {
        MentorService.getAllMentors({ page: 1, limit: 50 })
            .then((res) => {
                const list = Array.isArray(res.data) ? res.data : [];
                const mapped: MentorData[] = list.map((m: any) => {
                    const rawRole = m.experience?.currentRole ?? "";
                    const rawTitle = m.title ?? "";
                    const totalExp = Number(m.experience?.total) || 0;

                    // Parse role and company safely
                    let role = rawRole;
                    let company = "";
                    if (rawRole.includes(" @ ")) {
                        const parts = rawRole.split(" @ ");
                        role = parts[0];
                        company = parts[1] || "";
                    } else if (rawRole.includes(" at ")) {
                        const parts = rawRole.split(" at ");
                        role = parts[0];
                        company = parts[1] || "";
                    } else if (rawRole) {
                        role = rawRole;
                        company = m.company ?? "";
                    } else {
                        role = rawTitle || "Mentor";
                        company = m.company ?? "";
                    }

                    // TODO: Replace this heuristic with a proper verification.isVerified or SeniorMentorApplication-based check once that data is joined into the getAllMentors() API response.
                    const seniorKeywords = ["senior", "lead", "principal", "director", "head", "vp", "founder", "ceo", "cto"];
                    const textToCheck = `${rawRole} ${rawTitle}`.toLowerCase();
                    const hasSeniorKeyword = seniorKeywords.some((kw) => textToCheck.includes(kw));
                    const isSenior = totalExp >= 5 || hasSeniorKeyword;

                    return {
                        id: m.mentorId,
                        userId: m.userId,
                        name: `${m.user?.firstName ?? ""} ${m.user?.lastName ?? ""}`.trim() || m.user?.name || "Mentor",
                        role: role.trim() || "Mentor",
                        company: company.trim(),
                        rating: Number(m.stats?.averageRating) || 4.9,
                        sessions: m.stats?.totalSessions || m.trustScore?.metrics?.totalCompletedSessions || 0,
                        price: Number(m.pricing?.quickCall) || 0,
                        image: m.profilePic ?? "",
                        tags: Array.isArray(m.skills) && m.skills.length > 0 ? m.skills.slice(0, 2) : ["Mentorship", "Career"],
                        exp: `${totalExp} Yrs`,
                        expTotal: totalExp,
                        domains: Array.isArray(m.domains) ? m.domains : [],
                        isSenior,
                        acceptsBooking: Boolean(m.pricing?.quickCall || m.availability?.autoAcceptBookings || (m.availability?.daysAvailable && m.availability.daysAvailable.length > 0)),
                        isDummy: false,
                    };
                });
                setAllMentors(mapped);
                setFilteredMentors(mapped);
            })
            .catch(() => {
                setAllMentors([]);
                setFilteredMentors([]);
            })
            .finally(() => setLoading(false));
    }, []);

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
        setShowAllSeniorMentors(false);
        setShowAllRegularMentors(false);

        setTimeout(() => {
            let result = [...allMentors];

            // Company search filter
            if (companySearch.trim()) {
                const searchLower = companySearch.toLowerCase();
                result = result.filter(m =>
                    m.company?.toLowerCase().includes(searchLower) ||
                    m.name?.toLowerCase().includes(searchLower)
                );
            }

            // Domain filter
            if (selectedDomains.length > 0) {
                const apiDomains = selectedDomains.flatMap(d => DOMAIN_MAP[d] ?? []);
                result = result.filter(m =>
                    m.domains.some((d: string) => apiDomains.includes(d))
                );
            }

            // Experience filter
            if (selectedExps.length > 0) {
                result = result.filter(m =>
                    selectedExps.some(exp => {
                        const [min, max] = EXP_MAP[exp];
                        return m.expTotal >= min && m.expTotal <= max;
                    })
                );
            }

            setFilteredMentors(result);
            setFiltering(false);
        }, 400);
    };

    const handleClearFilters = () => {
        setCompanySearch("");
        setSelectedDomains([]);
        setSelectedExps([]);
        setShowAllSeniorMentors(false);
        setShowAllRegularMentors(false);
        setFilteredMentors(allMentors);
    };

    const isFiltered = Boolean(companySearch || selectedDomains.length > 0 || selectedExps.length > 0);

    // Split into Senior and Regular mentors
    const seniorMentors = filteredMentors.filter((m) => m.isSenior);
    const baseRegularMentors = filteredMentors.filter((m) => !m.isSenior);

    // 3 frontend-only dummy mentors to bring total count to 5 (2 real + 3 dummy)
    const DUMMY_REGULAR_MENTORS: MentorData[] = [
        {
            id: "dummy-1",
            name: "New Mentor",
            role: "Profile in Onboarding",
            company: "",
            rating: 0,
            sessions: 0,
            price: 0,
            image: "",
            tags: ["Mentorship"],
            exp: "0 Yrs",
            expTotal: 0,
            domains: [],
            isSenior: false,
            acceptsBooking: false,
            isDummy: true,
        },
        {
            id: "dummy-2",
            name: "New Mentor",
            role: "Profile in Onboarding",
            company: "",
            rating: 0,
            sessions: 0,
            price: 0,
            image: "",
            tags: ["Mentorship"],
            exp: "0 Yrs",
            expTotal: 0,
            domains: [],
            isSenior: false,
            acceptsBooking: false,
            isDummy: true,
        },
        {
            id: "dummy-3",
            name: "New Mentor",
            role: "Profile in Onboarding",
            company: "",
            rating: 0,
            sessions: 0,
            price: 0,
            image: "",
            tags: ["Mentorship"],
            exp: "0 Yrs",
            expTotal: 0,
            domains: [],
            isSenior: false,
            acceptsBooking: false,
            isDummy: true,
        },
    ];

    // Append dummy mentors exclusively to regularMentors
    const regularMentors = [...baseRegularMentors, ...DUMMY_REGULAR_MENTORS];

    // Sliced lists for initial view
    const visibleSeniorMentors = showAllSeniorMentors 
        ? seniorMentors 
        : seniorMentors.slice(0, SENIOR_LIMIT);

    const visibleRegularMentors = showAllRegularMentors 
        ? regularMentors 
        : regularMentors.slice(0, REGULAR_LIMIT);

    // Format experience label with proper singular/plural grammar
    const getExperienceLabel = (totalYears: number) => {
        if (!totalYears || totalYears <= 0) return "0-1 Yrs Experience";
        if (totalYears === 1) return "1 Yr Experience";
        return `${totalYears}+ Yrs Experience`;
    };

    const handleNavigate = (mentor: MentorData) => {
    if (mentor.isDummy) return;

    // Agar mentor khud apni hi profile pe click kar raha hai
    if (user?.userId && mentor.userId && user.userId === mentor.userId) {
        router.push(`/mentorship/user-dashboard/${user.userId}`);
        return;
    }

    const slugName = (mentor.name || "mentor").toLowerCase().replace(/\s+/g, "-");
    router.push(`/mentorship/mentor-card/${slugName}/${mentor.id}`);
};

    // Render individual mentor card
    const renderCard = (mentor: MentorData, isSeniorCard: boolean) => (
        <div
            key={mentor.id}
            className={`rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 relative group ${
                mentor.isDummy 
                    ? "bg-[#fcfaf7] border border-dashed border-[#dcd1c7] opacity-75 shadow-none cursor-default select-none" 
                    : "bg-white border border-[#e8ded5] hover:border-[#cfbeaf] shadow-sm hover:shadow-md"
            }`}
        >
            <div>
                {/* Card Top Row: Badge (Senior) + Online indicator */}
                <div className="flex items-center justify-between min-h-[26px] mb-2.5">
                    {isSeniorCard ? (
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#faeedd] text-[#8b5e3c] border border-[#ecd5bf] text-[10px] font-bold uppercase tracking-wider">
                            <Crown className="w-3 h-3 text-[#b47a3e]" />
                            <span>SENIOR MENTOR</span>
                        </div>
                    ) : (
                        <div />
                    )}

                    {mentor.isDummy ? (
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-stone-400 ml-auto">
                            <span className="w-2 h-2 rounded-full bg-stone-300" />
                            <span>Joining Soon</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 ml-auto">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Online</span>
                        </div>
                    )}
                </div>

                {/* Avatar */}
                <div className="flex justify-center mb-2.5">
                    <div className={`w-16 h-16 rounded-full overflow-hidden border-2 shadow-sm ring-1 ring-[#e4d8ce] flex items-center justify-center ${mentor.isDummy ? "border-dashed border-[#d5c6ba] bg-[#f3ece3]" : "border-white bg-[#f5ede5]"}`}>
                        {mentor.image ? (
                            <img
                                src={mentor.image}
                                alt={mentor.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#4a3728] text-lg font-bold">
                                {mentor.isDummy ? <Users className="w-6 h-6 text-[#b5a799]" /> : (mentor.name?.[0] ?? "M")}
                            </div>
                        )}
                    </div>
                </div>

                {/* Name */}
                <h4 className={`font-bold text-sm text-center truncate px-1 ${mentor.isDummy ? "text-[#8b7355]" : "text-[#2d2015]"}`}>
                    {mentor.name}
                </h4>

                {/* Role & Company */}
                <p className="text-[11px] text-[#8b7355] text-center font-medium truncate mb-2 px-1">
                    {mentor.role}{mentor.company ? ` @ ${mentor.company}` : ""}
                </p>

                {/* Rating & Sessions */}
                <div className="flex items-center justify-center gap-1.5 text-xs mb-2.5">
                    {mentor.isDummy ? (
                        <div className="flex items-center justify-center gap-1.5 text-[#b5a799]">
                            <Star className="w-3.5 h-3.5 text-[#d9cbbe]" />
                            <span className="font-medium text-[#a39282]">Joining Soon</span>
                        </div>
                    ) : (
                        <>
                            <Star className="w-3.5 h-3.5 fill-[#d99b26] text-[#d99b26]" />
                            <span className="font-bold text-[#2d2015]">{mentor.rating ? Number(mentor.rating).toFixed(1) : "4.9"}</span>
                            <span className="text-[#c4b5a5]">·</span>
                            <span className="text-[11px] text-[#8b7355]">{mentor.sessions || 0} sessions</span>
                        </>
                    )}
                </div>

                {/* Expertise Tags */}
                <div className="flex items-center justify-center gap-1.5 flex-wrap mb-2.5 min-h-[24px]">
                    {mentor.tags.map((tag: string, idx: number) => (
                        <span
                            key={idx}
                            className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${
                                mentor.isDummy
                                    ? "bg-[#f5ede5] text-[#a39282] border border-dashed border-[#e4d6c8]"
                                    : "bg-[#f6efe8] text-[#6b5643] border border-[#ebdcd0]"
                            }`}
                        >
                            {tag}
                        </span>
                    ))}
                </div>

                {/* Experience */}
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#786352] font-medium mb-4">
                    <Briefcase className="w-3.5 h-3.5 text-[#a67c52]" />
                    <span>{getExperienceLabel(mentor.expTotal)}</span>
                </div>
            </div>

            {/* Action Buttons */}
            <div>
                {mentor.isDummy ? (
                    <button
                        disabled
                        className="w-full py-2 px-3 bg-[#f2eae1] text-[#a39282] text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed border border-[#e5dcd3]"
                    >
                        <span>Not Available Yet</span>
                    </button>
                ) : mentor.acceptsBooking ? (
                    <button
                        onClick={() => handleNavigate(mentor)}
                        className="w-full py-2 px-3 bg-[#3a2a1e] hover:bg-[#251910] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Book Session</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                    </button>
                ) : (
                    <button
                        onClick={() => handleNavigate(mentor)}
                        className="w-full py-2 px-3 border border-[#cfc2b6] hover:border-[#8b7355] hover:bg-[#faf6f1] text-[#3a2a1e] text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Profile</span>
                    </button>
                )}
            </div>
        </div>
    );

    // Skeleton loader grid
    const renderSkeletonGrid = (count: number = 4) => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array(count).fill(0).map((_, i) => (
                <div key={i} className="h-[300px] rounded-2xl bg-[#eee5dd] animate-pulse" />
            ))}
        </div>
    );

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

            {/* RIGHT COLUMN: Senior Mentors + Mentors */}
            <div className="flex flex-col gap-10">
                {(loading || filtering) ? (
                    <div className="flex flex-col gap-10">
                        <div>
                            <div className="h-8 w-48 bg-[#eee5dd] rounded-lg animate-pulse mb-2" />
                            <div className="h-4 w-72 bg-[#eee5dd] rounded-lg animate-pulse mb-6" />
                            {renderSkeletonGrid(4)}
                        </div>
                        <div>
                            <div className="h-8 w-40 bg-[#eee5dd] rounded-lg animate-pulse mb-2" />
                            <div className="h-4 w-64 bg-[#eee5dd] rounded-lg animate-pulse mb-6" />
                            {renderSkeletonGrid(4)}
                        </div>
                    </div>
                ) : filteredMentors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-[#e8ded5] rounded-3xl p-8">
                        <p className="text-2xl font-black text-[#8b7355]">
                            {isFiltered ? "No Mentors Found" : "No Mentors Yet"}
                        </p>
                        <p className="text-slate-400 text-sm mt-2">
                            {isFiltered ? "Try different filters" : "Be the first to join as a mentor!"}
                        </p>
                        {isFiltered && (
                            <button
                                onClick={handleClearFilters}
                                className="mt-4 px-6 py-2 bg-[#4a3728] text-white rounded-2xl text-sm font-bold shadow-sm hover:bg-[#38291e] transition-colors"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* SECTION 1 — Professional Mentors (Senior) */}
                        {seniorMentors.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-10 h-10 rounded-full border border-[#4a3728]/20 bg-[#faf6f1] flex items-center justify-center text-[#4a3728] shadow-sm flex-shrink-0">
                                        <Crown className="w-5 h-5 text-[#8b5e3c]" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-[#2d2015] tracking-tight">
                                            Professional Mentor
                                        </h2>
                                        <p className="text-xs text-[#8b7355] mt-0.5">
                                            Learn from experienced industry professionals.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {visibleSeniorMentors.map((mentor) => renderCard(mentor, true))}
                                </div>

                                {seniorMentors.length > SENIOR_LIMIT && (
                                    <div className="mt-6">
                                        <button
                                            onClick={() => setShowAllSeniorMentors((prev) => !prev)}
                                            className="group relative w-full py-4 px-6 bg-white border border-[#ece7e2] text-[#4a3728] text-sm font-bold rounded-2xl shadow-sm hover:shadow-md hover:border-[#8b7355] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden"
                                        >
                                            <span className="absolute inset-0 bg-[#f4ede6] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out" />
                                            <span className="relative z-10 tracking-wide">
                                                {showAllSeniorMentors ? "Show less" : `Show more (${seniorMentors.length - SENIOR_LIMIT} more)`}
                                            </span>
                                            <ArrowRight className={`relative z-10 w-4 h-4 text-[#8b7355] transition-transform duration-300 ${showAllSeniorMentors ? "-rotate-90" : "group-hover:translate-x-1.5 group-hover:text-[#4a3728]"}`} />
                                        </button>
                                    </div>
                                )}
                            </section>
                        )}

                        {/* SECTION 2 — OUR Mentor (Regular) */}
                        {regularMentors.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-10 h-10 rounded-full border border-[#4a3728]/20 bg-[#faf6f1] flex items-center justify-center text-[#4a3728] shadow-sm flex-shrink-0">
                                        <Users className="w-5 h-5 text-[#4a3728]" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-[#2d2015] tracking-tight">
                                            OUR Mentor
                                        </h2>
                                        <p className="text-xs text-[#8b7355] mt-0.5">
                                            Connect with skilled professionals and peers.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {visibleRegularMentors.map((mentor) => renderCard(mentor, false))}
                                </div>

                                {regularMentors.length > REGULAR_LIMIT && (
                                    <div className="mt-6">
                                        <button
                                            onClick={() => setShowAllRegularMentors((prev) => !prev)}
                                            className="group relative w-full py-4 px-6 bg-white border border-[#ece7e2] text-[#4a3728] text-sm font-bold rounded-2xl shadow-sm hover:shadow-md hover:border-[#8b7355] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden"
                                        >
                                            <span className="absolute inset-0 bg-[#f4ede6] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out" />
                                            <span className="relative z-10 tracking-wide">
                                                {showAllRegularMentors ? "Show less" : `Show more (${regularMentors.length - REGULAR_LIMIT} more)`}
                                            </span>
                                            <ArrowRight className={`relative z-10 w-4 h-4 text-[#8b7355] transition-transform duration-300 ${showAllRegularMentors ? "-rotate-90" : "group-hover:translate-x-1.5 group-hover:text-[#4a3728]"}`} />
                                        </button>
                                    </div>
                                )}
                            </section>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}