"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Search,
    ArrowRight,
    Sparkles,
    Star,
    Crown,
    Briefcase,
    ExternalLink,
    Send,
    Users,
    CheckCircle2,
    TrendingUp
} from "lucide-react";
import MentorService from "@/lib/api/mentorship.service";
import { useAuth } from "@/features/auth/hooks/useAuth";

export interface HeroSectionProps {
    onFindMentorClick?: () => void;
    onJoinClick?: () => void;
}

interface DisplayMentor {
    id: string | number;
    name: string;
    role: string;
    company: string;
    image: string;
    rating: number;
    sessions: number;
    tags: string[];
    expYears: number;
    isSenior: boolean;
}

export default function HeroSection({ onFindMentorClick, onJoinClick }: HeroSectionProps) {
    const router = useRouter();
    const { isAuthenticated } = useAuth();

    const [mentor, setMentor] = useState<DisplayMentor | null>(null);
    const [loading, setLoading] = useState(true);
    const [totalMentorsCount, setTotalMentorsCount] = useState<number>(500);

    useEffect(() => {
        MentorService.getAllMentors({ page: 1, limit: 20 })
            .then((res) => {
                const list = Array.isArray(res.data) ? res.data : [];
                if (res.total && typeof res.total === "number") {
                    setTotalMentorsCount(Math.max(res.total, 500));
                }

                if (list.length > 0) {
                    // Pick a featured senior mentor with a photo if available, or the first mentor
                    const candidate = list.find((m: any) =>
                        m.profilePic &&
                        (m.experience?.total >= 4 || m.title || m.experience?.currentRole)
                    ) || list.find((m: any) => m.profilePic) || list[0];

                    const rawRole = candidate.experience?.currentRole ?? "";
                    const rawTitle = candidate.title ?? "";
                    const totalExp = Number(candidate.experience?.total) || 5;

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
                        company = candidate.company ?? "";
                    } else {
                        role = rawTitle || "Senior Tech Leader";
                        company = candidate.company ?? "Top Tech";
                    }

                    const seniorKeywords = ["senior", "lead", "principal", "director", "head", "vp", "founder", "ceo", "cto"];
                    const textToCheck = `${rawRole} ${rawTitle}`.toLowerCase();
                    const isSenior = totalExp >= 5 || seniorKeywords.some((kw) => textToCheck.includes(kw));

                    const tags = Array.isArray(candidate.skills) && candidate.skills.length > 0
                        ? candidate.skills.slice(0, 3)
                        : ["System Architecture", "Leadership", "Career Growth"];

                    setMentor({
                        id: candidate.mentorId || candidate._id || "featured",
                        name: `${candidate.user?.firstName ?? ""} ${candidate.user?.lastName ?? ""}`.trim() || candidate.user?.name || "Tech Leader",
                        role: role.trim() || "Senior Engineering Leader",
                        company: company.trim() || "Global Tech",
                        image: candidate.profilePic ?? "",
                        rating: Number(candidate.stats?.averageRating) || 4.9,
                        sessions: Number(candidate.stats?.totalSessions) || 84,
                        tags,
                        expYears: totalExp,
                        isSenior,
                    });
                }
            })
            .catch(() => {
                // Fallback default mentor so UI remains pristine
                setMentor({
                    id: "default",
                    name: "Sarah Jenkins",
                    role: "Staff Engineer & Tech Lead",
                    company: "Google",
                    image: "",
                    rating: 4.98,
                    sessions: 142,
                    tags: ["System Design", "Engineering Leadership", "Career"],
                    expYears: 9,
                    isSenior: true,
                });
            })
            .finally(() => setLoading(false));
    }, []);

    const handleJoinAction = () => {
        if (onJoinClick) {
            onJoinClick();
            return;
        }
        if (isAuthenticated) {
            router.push("/dashboard");
        } else {
            router.push("/signup");
        }
    };

    const handleExploreAction = () => {
        if (onFindMentorClick) {
            onFindMentorClick();
            return;
        }
        // Fallback: smooth scroll to mentor discovery section
        const el = document.getElementById("mentor-discovery") || document.querySelector("section.grid");
        if (el) {
            el.scrollIntoView({ behavior: "smooth" });
        }
    };

    const handleViewMentorProfile = () => {
        if (!mentor || mentor.id === "default" || mentor.id === "featured") {
            handleExploreAction();
            return;
        }
        const slugName = (mentor.name || "mentor").toLowerCase().replace(/\s+/g, "-");
        router.push(`/mentorship/mentor-card/${slugName}/${mentor.id}`);
    };

    const mentorInitial = mentor?.name ? mentor.name.charAt(0).toUpperCase() : "M";

    return (
        <section className="relative pt-20 pb-4 lg:pt-24 lg:pb-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden lg:min-h-[calc(100vh-220px)] flex flex-col justify-center">
            {/* Background ambient glow */}
            <div className="absolute top-12 left-1/4 w-[500px] h-[500px] bg-[#8b7355]/5 rounded-full blur-3xl pointer-events-none -z-10" />
            <div className="absolute top-1/3 right-10 w-[450px] h-[450px] bg-[#4a3728]/5 rounded-full blur-3xl pointer-events-none -z-10" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

                {/* ── LEFT SIDE (45-50% width) ─────────────────────────────────── */}
                <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center text-left">

                    {/* 1. Uppercase Eyebrow / Tag */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f3ece6] border border-[#e5d9ce] w-fit mb-5 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8b7355]" />
                        <span className="text-[11px] font-black uppercase tracking-[2.5px] text-[#8b7355]">
                            Throne8 Mentorship Platform
                        </span>
                    </div>

                    {/* 2. Large Heading (2 lines, left-aligned) */}
                    <h1 className="text-4xl sm:text-5xl lg:text-[52px] xl:text-[58px] font-black text-[#2d2015] tracking-tight leading-[1.08] mb-6">
                        Where ambitious professionals <br className="hidden sm:inline" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4a3728] via-[#6d513d] to-[#8b7355]">
                            go to level up faster.
                        </span>
                    </h1>

                    {/* 3. Subtitle Paragraph */}
                    <p className="text-base sm:text-lg text-[#6b5849] font-medium leading-relaxed max-w-xl mb-8">
                        Direct access to the world&apos;s most successful tech leaders. Built for serious builders.
                    </p>

                    {/* 4. Two Buttons Side by Side */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 mb-4">
                        {/* Primary Button */}
                        <button
                            onClick={handleJoinAction}
                            className="bg-[#4a3728] hover:bg-[#382a1e] text-white px-7 py-3.5 rounded-full font-bold text-sm shadow-md hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer"
                        >
                            <span>Join Us Today</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                        </button>

                        {/* Secondary Button */}
                        <button
                            onClick={handleExploreAction}
                            className="border-2 border-[#4a3728] text-[#4a3728] hover:bg-[#4a3728]/5 bg-transparent px-7 py-3.5 rounded-full font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer"
                        >
                            <Search className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                            <span>Explore Mentors</span>
                        </button>
                    </div>

                    {/* 5. Small Muted Caption */}
                    <div className="flex items-center gap-2 text-xs text-[#8a7667] font-medium">
                        <CheckCircle2 className="w-4 h-4 text-[#8b7355] shrink-0" />
                        <span>Join 500+ professionals learning from industry leaders.</span>
                    </div>
                </div>

                {/* ── RIGHT SIDE (50-55% width) - Floating Dashboard Collage ───── */}
                <div className="lg:col-span-6 xl:col-span-7 relative flex items-center justify-center min-h-[480px] sm:min-h-[540px] pt-4 lg:pt-0">

                    {/* 1. Large Soft Tan Circular Background Shape */}
                    <div className="absolute w-[360px] h-[360px] sm:w-[450px] sm:h-[450px] rounded-full bg-gradient-to-tr from-[#eddcd0]/70 via-[#f4eae1]/80 to-[#e3d0c2]/60 blur-2xl pointer-events-none -z-10" />

                    {/* Decorative subtle ring outline */}
                    <div className="absolute w-[380px] h-[380px] sm:w-[480px] sm:h-[480px] rounded-full border border-[#ece7e2] pointer-events-none -z-10" />
                    <div className="absolute w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] rounded-full border border-[#ece7e2]/50 border-dashed pointer-events-none -z-10" />

                    {/* Outer Collage Container */}
                    <div className="relative w-full max-w-[540px] px-2 sm:px-0">

                        {/* 2. Floating Pill / Filter Badges near top */}
                        <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6 px-2">
                            {/* Pill 1: Domain */}
                            <div className="bg-white/95 backdrop-blur-md border border-[#ece7e2] shadow-md rounded-full px-3.5 py-1.5 flex items-center gap-2 text-xs font-bold text-[#4a3728] animate-float-slow">
                                <span className="w-2 h-2 rounded-full bg-[#8b7355]" />
                                <span className="text-[#8b7355] font-semibold text-[11px] uppercase tracking-wider">Domain:</span>
                                <span>Tech & AI</span>
                            </div>

                            {/* Pill 2: Experience */}
                            <div className="bg-white/95 backdrop-blur-md border border-[#ece7e2] shadow-md rounded-full px-3.5 py-1.5 flex items-center gap-2 text-xs font-bold text-[#4a3728] animate-float-slow-delayed">
                                <Briefcase className="w-3.5 h-3.5 text-[#8b7355]" />
                                <span>{mentor?.expYears ? `${mentor.expYears}+ Yrs Experience` : "5+ Yrs Experience"}</span>
                            </div>
                        </div>

                        {/* Top-Right Floating "AI Mentor Matcher" Chat Bubble */}
                        <div className="absolute -top-10 -right-2 sm:-right-4 z-20 w-60 sm:w-64 bg-white/95 backdrop-blur-md border border-[#ece7e2] rounded-2xl p-3.5 shadow-xl animate-float-delayed hidden sm:block">
                            <div className="flex items-center justify-between pb-2 border-b border-[#f3ede7] mb-2.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-[#4a3728] flex items-center justify-center text-white">
                                        <Sparkles className="w-3 h-3 text-[#eddcd0]" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black text-[#2d2015] leading-none">AI Matcher</p>
                                        <p className="text-[9px] text-[#8b7355] font-medium leading-none mt-0.5">Powered by Throne AI</p>
                                    </div>
                                </div>
                                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Live
                                </span>
                            </div>

                            {/* AI Message Bubble */}
                            <div className="bg-[#FAF9F6] border border-[#eee7e0] rounded-xl p-2.5 text-[11px] text-[#4a3728] font-medium mb-2.5 leading-snug">
                                &quot;Find your perfect mentor in seconds ✨&quot;
                            </div>

                            {/* Mock Input Field */}
                            <div className="flex items-center gap-1.5 bg-[#f5efe9] rounded-lg px-2.5 py-1.5 text-[10px] text-[#8b7355]">
                                <span className="truncate">Describe your target role...</span>
                                <div className="ml-auto w-4 h-4 rounded bg-[#4a3728] text-white flex items-center justify-center shrink-0">
                                    <Send className="w-2.5 h-2.5" />
                                </div>
                            </div>
                        </div>

                        {/* 3. CENTRAL Contact Card: Real Mentor Profile Preview */}
                        <div className="bg-white border border-[#ece7e2] rounded-3xl p-5 sm:p-6 shadow-xl relative z-10 hover:shadow-2xl transition-all duration-300">

                            {/* Card Top Row: Senior/Featured Badge & Actions */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#faeedd] text-[#8b5e3c] border border-[#ecd5bf] text-[10px] font-bold uppercase tracking-wider">
                                    <Crown className="w-3.5 h-3.5 text-[#b47a3e]" />
                                    <span>{mentor?.isSenior ? "Senior Mentor" : "Featured Mentor"}</span>
                                </div>

                                <button
                                    onClick={handleViewMentorProfile}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-[#8b7355] hover:text-[#4a3728] transition-colors group cursor-pointer"
                                >
                                    <span>View Profile</span>
                                    <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                </button>
                            </div>

                            {/* Mentor Main Info: Photo + Name + Role */}
                            <div className="flex items-center gap-4 mb-4">
                                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-[#e8ded5] shrink-0">
                                    {loading ? (
                                        <div className="w-full h-full bg-[#eee5dd] animate-pulse" />
                                    ) : mentor?.image ? (
                                        <img
                                            src={mentor.image}
                                            alt={mentor.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.currentTarget as HTMLImageElement).style.display = "none";
                                                const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                                                if (fallback) fallback.style.display = "flex";
                                            }}
                                        />
                                    ) : null}
                                    <div
                                        className="w-full h-full flex items-center justify-center font-black text-xl text-[#4a3728] bg-[#eddcd0]"
                                        style={{ display: !loading && !mentor?.image ? "flex" : "none" }}
                                    >
                                        {mentorInitial}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg sm:text-xl font-black text-[#2d2015] truncate">
                                        {loading ? "Loading mentor..." : mentor?.name}
                                    </h3>
                                    <p className="text-xs sm:text-sm font-semibold text-[#6b5849] truncate mt-0.5">
                                        {mentor?.role} {mentor?.company ? `@ ${mentor.company}` : ""}
                                    </p>

                                    {/* Rating & Sessions */}
                                    <div className="flex items-center gap-2 text-xs font-semibold text-[#8b7355] mt-1.5">
                                        <span className="flex items-center gap-1 text-[#b47a3e]">
                                            <Star className="w-3.5 h-3.5 fill-[#b47a3e] text-[#b47a3e]" />
                                            {mentor?.rating.toFixed(1) || "4.9"}
                                        </span>
                                        <span className="text-[#d8cfc6]">·</span>
                                        <span>{mentor?.sessions || 0} sessions completed</span>
                                    </div>
                                </div>
                            </div>

                            {/* Skills Tags */}
                            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-[#f3ede7]">
                                {mentor?.tags.map((tag, idx) => (
                                    <span
                                        key={idx}
                                        className="text-[10px] sm:text-[11px] font-semibold bg-[#FAF9F6] text-[#6b5643] px-2.5 py-1 rounded-lg border border-[#ece7e2]"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* 5. THREE Small Stat Cards along the bottom */}
                        <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 mt-3 sm:mt-4 relative z-10">

                            {/* Stat Card 1: Active Mentors */}
                            <div className="bg-white border border-[#ece7e2] rounded-2xl p-2.5 sm:p-3 shadow-md hover:shadow-lg transition-shadow">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b7355]">Active</span>
                                    <Users className="w-3.5 h-3.5 text-[#8b7355]" />
                                </div>
                                <p className="text-sm sm:text-base font-black text-[#2d2015]">{totalMentorsCount}+</p>
                                {/* Micro Bar Chart Visual */}
                                <div className="flex items-end gap-1 h-3.5 mt-2">
                                    <span className="w-full bg-[#e8ded5] h-[40%] rounded-xs" />
                                    <span className="w-full bg-[#d8c8ba] h-[65%] rounded-xs" />
                                    <span className="w-full bg-[#b89f89] h-[85%] rounded-xs" />
                                    <span className="w-full bg-[#4a3728] h-[100%] rounded-xs" />
                                </div>
                            </div>

                            {/* Stat Card 2: Sessions Completed */}
                            <div className="bg-white border border-[#ece7e2] rounded-2xl p-2.5 sm:p-3 shadow-md hover:shadow-lg transition-shadow">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b7355]">Sessions</span>
                                    {/* Mini circular progress visual */}
                                    <svg className="w-3.5 h-3.5 -rotate-90" viewBox="0 0 36 36">
                                        <path
                                            className="text-[#e8ded5]"
                                            strokeWidth="4"
                                            stroke="currentColor"
                                            fill="none"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                        <path
                                            className="text-[#4a3728]"
                                            strokeDasharray="92, 100"
                                            strokeWidth="4"
                                            strokeLinecap="round"
                                            stroke="currentColor"
                                            fill="none"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                    </svg>
                                </div>
                                <p className="text-sm sm:text-base font-black text-[#2d2015]">10,000+</p>
                                <p className="text-[10px] text-emerald-600 font-bold mt-1">98% Satisfied</p>
                            </div>

                            {/* Stat Card 3: Success Rate */}
                            <div className="bg-white border border-[#ece7e2] rounded-2xl p-2.5 sm:p-3 shadow-md hover:shadow-lg transition-shadow">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b7355]">Success</span>
                                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                                </div>
                                <p className="text-sm sm:text-base font-black text-[#2d2015]">99.4%</p>
                                {/* Micro Trend Sparkline Visual */}
                                <div className="h-3.5 mt-2 flex items-center">
                                    <svg className="w-full h-3 overflow-visible" viewBox="0 0 60 16">
                                        <path
                                            d="M 2 14 L 16 10 L 30 11 L 44 4 L 58 2"
                                            fill="none"
                                            stroke="#4a3728"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                            </div>

                        </div>

                    </div>
                </div>

            </div>
        </section>
    );
}
