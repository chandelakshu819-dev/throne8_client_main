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
const seniorKeywords = [
    "senior",
    "lead",
    "principal",
    "director",
    "head",
    "vp",
    "founder",
    "ceo",
    "cto",
];

export interface HeroSectionProps {
    onFindMentorClick?: () => void;
    onJoinClick?: () => void;
    mentorData?: any;
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

export default function HeroSection({ onFindMentorClick, onJoinClick, mentorData }: HeroSectionProps) {
    const router = useRouter();
    const { isAuthenticated } = useAuth();

    const [mentor, setMentor] = useState<DisplayMentor | null>(null);
    const [loading, setLoading] = useState(true);
    const [totalMentorsCount, setTotalMentorsCount] = useState<number>(500);

  useEffect(() => {
    let isMounted = true;

    const loadRandomSeniorMentor = async () => {
        try {
            setLoading(true);

            const res = await MentorService.getAllMentors({
                page: 1,
                limit: 100,
            });

            const list = Array.isArray(res?.data)
                ? res.data
                : Array.isArray(res)
                    ? res
                    : [];

            if (!isMounted || list.length === 0) {
                setLoading(false);
                return;
            }

            // Find only senior mentors
            const seniorMentors = list.filter((m: any) => {
                const totalExp = Number(m.experience?.total) || 0;

                const rawRole = (
                    m.experience?.currentRole ||
                    m.title ||
                    ""
                ).toLowerCase();

                const seniorKeywords = [
                    "senior",
                    "lead",
                    "principal",
                    "director",
                    "head",
                    "vp",
                    "founder",
                    "ceo",
                    "cto",
                ];

                const hasSeniorTitle = seniorKeywords.some((keyword) =>
                    rawRole.includes(keyword)
                );

                // Your existing senior logic
                return totalExp >= 5 || hasSeniorTitle;
            });

            // If no senior mentors are found, use all mentors as fallback
            const availableMentors =
                seniorMentors.length > 0 ? seniorMentors : list;

            // Random mentor on every page load / refresh
            const randomIndex = Math.floor(
                Math.random() * availableMentors.length
            );

            const selectedMentor = availableMentors[randomIndex];

            const rawRole =
                selectedMentor.experience?.currentRole || "";

            const rawTitle =
                selectedMentor.title || "";

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
                company = selectedMentor.company || "";
            } else {
                role = rawTitle || "Senior Tech Leader";
                company = selectedMentor.company || "Top Tech";
            }

            const totalExp =
                Number(selectedMentor.experience?.total) || 0;

            const tags =
                Array.isArray(selectedMentor.skills) &&
                selectedMentor.skills.length > 0
                    ? selectedMentor.skills.slice(0, 3)
                    : [
                        "System Architecture",
                        "Leadership",
                        "Career Growth",
                    ];

            const fullName =
                `${selectedMentor.user?.firstName ?? ""} ${selectedMentor.user?.lastName ?? ""}`
                    .trim() ||
                selectedMentor.user?.name ||
                selectedMentor.title ||
                "Senior Mentor";

            const textToCheck =
                `${rawRole} ${rawTitle}`.toLowerCase();

            const isSenior =
                totalExp >= 5 ||
                seniorKeywords.some((keyword) =>
                    textToCheck.includes(keyword)
                );

            if (!isMounted) return;

            setMentor({
                id:
                    selectedMentor.mentorId ||
                    selectedMentor._id ||
                    "featured",

                name: fullName,

                role:
                    role.trim() ||
                    "Senior Engineering Leader",

                company:
                    company.trim() ||
                    "Global Tech",

                image:
                    selectedMentor.profilePic || "",

                rating:
                    Number(selectedMentor.stats?.averageRating) > 0
                        ? Number(selectedMentor.stats.averageRating)
                        : 5.0,

                sessions:
                    Number(selectedMentor.stats?.totalSessions) ||
                    Number(selectedMentor.stats?.completedSessions) ||
                    0,

                tags,

                expYears: totalExp,

                isSenior,
            });

            setLoading(false);

        } catch (error) {
            console.error(
                "Failed to load senior mentor:",
                error
            );

            if (isMounted) {
                setMentor(null);
                setLoading(false);
            }
        }
    };

    loadRandomSeniorMentor();

    return () => {
        isMounted = false;
    };
}, []);

   

   const handleExploreAction = () => {
    const topMentors = document.getElementById("top-mentors");

    if (topMentors) {
        topMentors.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
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
        <section className="relative pt-20 sm:pt-24 pb-8 sm:pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Background ambient subtle shapes */}
            <div className="absolute top-12 left-1/4 w-[450px] h-[450px] bg-[#8b7355]/4 rounded-full blur-3xl pointer-events-none -z-10" />
            <div className="absolute top-16 right-10 w-[420px] h-[420px] bg-[#eddcd0]/40 rounded-full blur-2xl pointer-events-none -z-10" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">

                {/* ── LEFT SIDE ─────────────────────────────────────────────────── */}
                <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center text-left">

                    {/* 1. Eyebrow Tag */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f0e8de] border border-[#e5d9ce] w-fit mb-3.5 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8c6b4a]" />
                        <span className="text-[10.5px] font-black uppercase tracking-[2px] text-[#8c6b4a]">
                            Throne8 Mentorship Platform
                        </span>
                    </div>

                    {/* 2. Large Heading */}
                    <h1 className="text-4xl sm:text-5xl lg:text-[54px] xl:text-[58px] font-black text-[#231815] tracking-tight leading-[1.06] mb-3">
                        Level up <span className="text-[#9c7a59]">Faster.</span>
                    </h1>

                    {/* 3. Subtitle Paragraph */}
                    <p className="text-sm sm:text-base text-[#705d4f] font-medium leading-relaxed max-w-lg mb-5 sm:mb-6">
                        Direct access to the world&apos;s most successful tech leaders.<br className="hidden sm:inline" /> Built for serious builders.
                    </p>

                

                       {/* Explore Mentors - Primary CTA */}
                       {/* 4. Explore Mentors - Primary CTA */}
<div className="flex flex-wrap items-center gap-3 mb-3.5">
    <button
        onClick={handleExploreAction}
        className="bg-[#38281e] hover:bg-[#2a1e16] text-white px-6 py-2.5 sm:py-3 rounded-full font-bold text-sm shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer"
    >
        <Search className="w-4 h-4" />
        <span>Explore Mentors</span>
    </button>
</div>

                    {/* 5. Social Proof Caption */}
                    <div className="flex items-center gap-2 text-xs text-[#736152] font-medium">
                        <CheckCircle2 className="w-4 h-4 text-[#8c6b4a] shrink-0" />
                        <span>Join 500+ professionals learning from industry leaders.</span>
                    </div>
                </div>

                {/* ── RIGHT SIDE ────────────────────────────────────────────────── */}
                <div className="lg:col-span-6 xl:col-span-6 relative flex flex-col items-center lg:items-end w-full pt-2 lg:pt-0 lg:-translate-x-[70px]">
                    {/* Floating Pill: DOMAIN: Tech & AI */}
                    <div className="w-full max-w-[420px] flex justify-start mb-2.5">
                        <div className="bg-[#f0e8de] border border-[#e5d9ce] rounded-full px-3.5 py-1 flex items-center gap-2 text-xs font-bold text-[#231815]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#8c6b4a]" />
                            <span className="text-[#8c6b4a] font-semibold text-[11px] uppercase tracking-wider">DOMAIN:</span>
                            <span className="font-bold">Tech &amp; AI</span>
                        </div>
                    </div>

                    {/* Outer Collage Wrapper */}
                    <div className="relative w-full max-w-[420px]">

                      

                        {/* Dynamic Mentor Card */}
<div
    onClick={handleViewMentorProfile}
    className="
        group
        relative
        overflow-hidden
        bg-gradient-to-br
        from-[#4a3020]
        via-[#5a3b27]
        to-[#382419]
        border
        border-[#7d5b3d]
        rounded-[24px]
        sm:rounded-[28px]
        p-4
        sm:p-5
        shadow-[0_12px_30px_rgba(55,35,22,0.18)]
        hover:-translate-y-1
        hover:border-[#c4963a]
        hover:shadow-[0_18px_40px_rgba(55,35,22,0.28)]
        transition-all
        duration-500
        cursor-pointer
    "
>
    {/* Decorative background */}
    <div
        className="
            absolute
            -right-20
            -top-20
            w-48
            h-48
            rounded-full
            border
            border-[#c4963a]/20
            pointer-events-none
        "
    />

    <div
        className="
            absolute
            -bottom-20
            right-[-40px]
            w-64
            h-40
            rounded-full
            bg-[#c4963a]/10
            blur-3xl
            pointer-events-none
        "
    />

    <div className="relative z-10">

        {/* Crown badge + decorative crown */}
        <div className="flex items-start justify-between mb-3">

            <div
                className="
                    inline-flex
                    items-center
                    gap-1.5
                    px-2.5
                    py-1
                    rounded-full
                    bg-[#f4e3cc]
                    text-[#4a3020]
                    border
                    border-[#e4caa8]
                    text-[9px]
                    font-black
                    uppercase
                    tracking-wider
                "
            >
                <Crown className="w-3 h-3 text-[#b47a3e]" />

                <span>
                    Senior Mentor
                </span>
            </div>

            <Crown
                className="
                    w-8
                    h-8
                    text-[#e7c98e]
                    rotate-12
                    opacity-90
                "
            />

        </div>


        {/* Mentor Details */}
        <div className="flex items-center gap-3.5 mb-3">

            {/* Profile Image */}
            <div
                className="
                    relative
                    w-14
                    h-14
                    sm:w-16
                    sm:h-16
                    rounded-2xl
                    overflow-hidden
                    border-2
                    border-[#c4963a]
                    bg-[#2d1c13]
                    shrink-0
                    shadow-[0_5px_15px_rgba(0,0,0,0.25)]
                "
            >
                {loading ? (
                    <div className="w-full h-full bg-[#5a4030] animate-pulse" />
                ) : mentor?.image ? (
                    <img
                        src={mentor.image}
                        alt={mentor.name}
                        className="
                            w-full
                            h-full
                            object-cover
                            transition-transform
                            duration-500
                            group-hover:scale-105
                        "
                        onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";

                            const fallback =
                                e.currentTarget.nextElementSibling as HTMLElement | null;

                            if (fallback) {
                                fallback.style.display = "flex";
                            }
                        }}
                    />
                ) : null}

                <div
                    className="
                        w-full
                        h-full
                        items-center
                        justify-center
                        font-black
                        text-lg
                        text-[#38281e]
                        bg-[#eddcd0]
                    "
                    style={{
                        display:
                            !loading && !mentor?.image
                                ? "flex"
                                : "none",
                    }}
                >
                    {mentorInitial}
                </div>
            </div>


            {/* Mentor Information */}
            <div className="flex-1 min-w-0">

                <h3
                    className="
                        text-base
                        sm:text-lg
                        font-black
                        text-[#fff8ef]
                        truncate
                        leading-tight
                    "
                >
                    {loading && !mentor ? (
                        <span className="inline-block w-28 h-4 bg-[#6a4a35] rounded animate-pulse" />
                    ) : (
                        mentor?.name || "Senior Mentor"
                    )}
                </h3>


                <p
                    className="
                        text-xs
                        font-medium
                        text-[#e2cdb2]
                        truncate
                        mt-1
                    "
                >
                    {loading && !mentor ? (
                        <span className="inline-block w-24 h-3 bg-[#6a4a35] rounded animate-pulse mt-1" />
                    ) : (
                        `${mentor?.role || "Tech Leader"}${
                            mentor?.company
                                ? ` @ ${mentor.company}`
                                : ""
                        }`
                    )}
                </p>


                {/* Rating + Sessions */}
                <div
                    className="
                        flex
                        items-center
                        gap-1.5
                        text-xs
                        font-medium
                        text-[#e2cdb2]
                        mt-1.5
                    "
                >

                    <span
                        className="
                            flex
                            items-center
                            gap-0.5
                            text-[#f1d49a]
                            font-bold
                        "
                    >
                        <Star
                            className="
                                w-3.5
                                h-3.5
                                fill-[#c4963a]
                                text-[#c4963a]
                            "
                        />

                        {mentor?.rating
                            ? mentor.rating.toFixed(1)
                            : "5.0"}
                    </span>

                    <span className="text-[#a98a68]">
                        ·
                    </span>

                    <span>
                        {mentor?.sessions || 48} sessions completed
                    </span>

                </div>

            </div>
        </div>


        {/* Divider */}
        <div
            className="
                h-px
                bg-[#a57b52]/50
                mb-3
            "
        />


        {/* Bottom Row */}
        <div className="flex items-center justify-between">

            {/* Skills */}
            <div className="flex items-center gap-1.5 flex-wrap">

                {(mentor?.tags?.length
                    ? mentor.tags.slice(0, 2)
                    : ["Java"]
                ).map((tag, idx) => (

                    <span
                        key={idx}
                        className="
                            text-[10px]
                            font-bold
                            bg-white/5
                            text-[#f3dfc5]
                            px-3
                            py-1
                            rounded-full
                            border
                            border-[#a98059]
                            transition-all
                            duration-300
                            group-hover:bg-[#f1dfc5]
                            group-hover:text-[#4a3020]
                        "
                    >
                        {tag}
                    </span>

                ))}

            </div>


            {/* Arrow */}
            <div
                className="
                    w-8
                    h-8
                    rounded-full
                    bg-[#f5e3ca]
                    text-[#4a3020]
                    flex
                    items-center
                    justify-center
                    shadow-md
                    transition-all
                    duration-300
                    group-hover:scale-110
                    group-hover:bg-[#c4963a]
                    group-hover:text-white
                "
            >
                <ArrowRight className="w-4 h-4" />
            </div>

        </div>

    </div>
</div>
                   
                        

                    </div>
                </div>

            </div>
        </section>
    );
}
