"use client";
//src/features/mentorship/components/sections/HeroSection.tsx
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, Star, Crown, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import MentorService from "@/lib/api/mentorship.service";
import {
    parseRoleCompany,
    formatRoleCompany,
    getRatingDisplay,
    formatCountLabel,
} from "@/shared/utils/mentorFormat";

const SENIOR_KEYWORDS = ["senior", "lead", "principal", "director", "head", "vp", "founder", "ceo", "cto"];

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
    isSenior: boolean;
}

const isSeniorMentor = (m: any) => {
    const exp = Number(m.experience?.total) || 0;
    const text = `${m.experience?.currentRole ?? ""} ${m.title ?? ""}`.toLowerCase();
    return exp >= 5 || SENIOR_KEYWORDS.some((k) => text.includes(k));
};

export default function HeroSection(_props: HeroSectionProps) {
    const router = useRouter();
    const [mentor, setMentor] = useState<DisplayMentor | null>(null);
    const [loading, setLoading] = useState(true);
    const [mentorCount, setMentorCount] = useState(0);
    const [imageFailed, setImageFailed] = useState(false);

    useEffect(() => {
        let active = true;

        const load = async () => {
            try {
                const res: any = await MentorService.getAllMentors({ page: 1, limit: 100 });
                const raw = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
                const list = raw.filter(
                    (m: any, i: number, arr: any[]) => arr.findIndex((x) => x.mentorId === m.mentorId) === i
                );
                if (!active) return;

                const apiTotal = Number(res?.pagination?.total ?? res?.total);
                setMentorCount(Number.isFinite(apiTotal) && apiTotal > 0 ? apiTotal : list.length);

                if (list.length === 0) return;

                // Senior mentors ko prefer karo, unmein bhi jinki photo hai unhe
                const seniors = list.filter(isSeniorMentor);
                const pool = seniors.length > 0 ? seniors : list;
                const withPhoto = pool.filter((m: any) => m.profilePic);
                const finalPool = withPhoto.length > 0 ? withPhoto : pool;
                const picked = finalPool[Math.floor(Math.random() * finalPool.length)];

                const { role, company } = parseRoleCompany(
                    picked.experience?.currentRole,
                    picked.title,
                    picked.company
                );

                setMentor({
                    id: picked.mentorId || picked._id,
                    name:
                        `${picked.user?.firstName ?? ""} ${picked.user?.lastName ?? ""}`.trim() ||
                        picked.user?.name ||
                        "Mentor",
                    role,
                    company,
                    image: picked.profilePic || "",
                    rating: Number(picked.stats?.averageRating) || 0,
                    sessions:
                        Number(picked.stats?.totalSessions) ||
                        Number(picked.stats?.completedSessions) ||
                        Number(picked.trustScore?.metrics?.totalCompletedSessions) ||
                        0,
                    tags: Array.isArray(picked.skills) ? picked.skills.slice(0, 2) : [],
                    isSenior: isSeniorMentor(picked),
                });
            } catch (error) {
                console.error("Failed to load featured mentor:", error);
                if (active) setMentor(null);
            } finally {
                if (active) setLoading(false);
            }
        };

        load();
        return () => {
            active = false;
        };
    }, []);

    const scrollToTopMentors = () => {
        document.getElementById("top-mentors")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const handleViewMentorProfile = () => {
        if (!mentor?.id) {
            scrollToTopMentors();
            return;
        }
        const slug = (mentor.name || "mentor").toLowerCase().replace(/\s+/g, "-");
        router.push(`/mentorship/mentor-card/${slug}/${mentor.id}`);
    };

    const rating = mentor ? getRatingDisplay(mentor.rating, mentor.sessions) : null;
    const countLabel = formatCountLabel(mentorCount);

    return (
        <section className="relative pt-20 sm:pt-24 pb-8 sm:pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Background ambient shapes */}
            <div className="absolute top-12 left-1/4 w-[450px] h-[450px] bg-[#8b7355]/4 rounded-full blur-3xl pointer-events-none -z-10" />
            <div className="absolute top-16 right-10 w-[420px] h-[420px] bg-[#eddcd0]/40 rounded-full blur-2xl pointer-events-none -z-10" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* LEFT */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="lg:col-span-6 flex flex-col justify-center text-left"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f0e8de] border border-[#e5d9ce] w-fit mb-3.5 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8c6b4a]" />
                        <span className="text-[10.5px] font-black uppercase tracking-[2px] text-[#8c6b4a]">
                            Throne8 Mentorship Platform
                        </span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-[54px] xl:text-[58px] font-black text-[#231815] tracking-tight leading-[1.06] mb-3">
                        Level up <span className="text-[#9c7a59]">Faster.</span>
                    </h1>

                    <p className="text-sm sm:text-base text-[#705d4f] font-medium leading-relaxed max-w-lg mb-5 sm:mb-6">
                        Direct access to the world&apos;s most successful tech leaders.
                        <br className="hidden sm:inline" /> Built for serious builders.
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mb-3.5 w-full">
                        <button
                            type="button"
                            onClick={scrollToTopMentors}
                            className="w-full sm:w-auto bg-[#38281e] hover:bg-[#2a1e16] text-white px-6 py-2.5 sm:py-3 rounded-full font-bold text-sm shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Search className="w-4 h-4" />
                            <span>Explore Mentors</span>
                        </button>
                    </div>

                    {countLabel && (
                        <div className="flex items-center gap-2 text-xs text-[#736152] font-medium">
                            <CheckCircle2 className="w-4 h-4 text-[#8c6b4a] shrink-0" />
                            <span>Learn from {countLabel} industry mentors on Throne8.</span>
                        </div>
                    )}
                </motion.div>

                {/* RIGHT: featured mentor card (data na ho to hide) */}
                {(loading || mentor) && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
                        className="lg:col-span-6 relative flex flex-col items-center lg:items-end w-full pt-2 lg:pt-0 lg:-translate-x-[70px]"
                    >
                        <div className="relative w-full max-w-[420px]">
                            <div
                                role="link"
                                tabIndex={0}
                                onClick={handleViewMentorProfile}
                                onKeyDown={(e) => e.key === "Enter" && handleViewMentorProfile()}
                                className="group relative overflow-hidden bg-gradient-to-br from-[#4a3020] via-[#563824] to-[#3b2619] border border-[#7d5b3d] rounded-[22px] sm:rounded-[24px] p-4 sm:p-5 shadow-[0_20px_45px_rgba(45,27,17,0.35),0_8px_18px_rgba(45,27,17,0.20)] hover:-translate-y-1 hover:border-[#c4963a] hover:shadow-[0_26px_55px_rgba(45,27,17,0.42)] transition-all duration-500 cursor-pointer"
                            >
                                {/* Decorative */}
                                <div className="absolute -bottom-20 right-[-40px] w-48 h-48 rounded-full border border-[#c4963a]/20 pointer-events-none" />
                                <div className="absolute -bottom-20 right-[-40px] w-64 h-40 rounded-full bg-[#c4963a]/10 blur-3xl pointer-events-none" />
                                <div className="absolute left-0 top-0 bottom-0 w-[6px] bg-gradient-to-b from-[#e0b84c] via-[#c4963a] to-[#9f722d]" />

                                {/* Badge */}
                                <div className="flex items-start justify-between mb-3 min-h-[26px]">
                                    {mentor?.isSenior && (
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f4e3cc] text-[#4a3020] border border-[#e4caa8] text-[9px] font-black uppercase tracking-wider">
                                            <Crown className="w-3 h-3 text-[#b47a3e]" />
                                            <span>Senior Mentor</span>
                                        </div>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex items-center gap-3.5 mb-3">
                                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-[#c4963a] bg-[#2d1c13] shrink-0 shadow-[0_5px_15px_rgba(0,0,0,0.25)]">
                                        {loading ? (
                                            <div className="w-full h-full bg-[#5a4030] animate-pulse" />
                                        ) : mentor?.image && !imageFailed ? (
                                            <img
                                                src={mentor.image}
                                                alt={mentor.name}
                                                onError={() => setImageFailed(true)}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-black text-lg text-[#38281e] bg-[#eddcd0]">
                                                {mentor?.name?.charAt(0).toUpperCase() ?? "M"}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base sm:text-lg font-black text-[#fff8ef] truncate leading-tight">
                                            {loading ? (
                                                <span className="inline-block w-28 h-4 bg-[#6a4a35] rounded animate-pulse" />
                                            ) : (
                                                mentor?.name
                                            )}
                                        </h3>

                                        <p className="text-[14px] sm:text-[15px] font-bold text-[#f8e8d2] truncate mt-1 tracking-[0.01em]">
                                            {loading ? (
                                                <span className="inline-block w-24 h-3 bg-[#6a4a35] rounded animate-pulse" />
                                            ) : (
                                                mentor && formatRoleCompany(mentor.role, mentor.company)
                                            )}
                                        </p>

                                        {!loading && mentor && rating && (
                                            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#e2cdb2] mt-2">
                                                <span className="flex items-center gap-1 text-[15px] text-[#f1d49a] font-extrabold">
                                                    <Star
                                                        className={`w-4 h-4 ${
                                                            rating.hasRating
                                                                ? "fill-[#D4AF37] text-[#D4AF37]"
                                                                : "text-[#a98a68]"
                                                        }`}
                                                    />
                                                    {rating.ratingLabel}
                                                </span>
                                                {rating.sessionsLabel && (
                                                    <>
                                                        <span className="text-[#a98a68]">·</span>
                                                        <span>{mentor.sessions} sessions completed</span>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="h-px bg-[#a57b52]/50 mb-3" />

                                {/* Bottom row */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {(mentor?.tags ?? []).map((tag) => (
                                            <span
                                                key={tag}
                                                className="text-[10px] font-bold bg-white/5 text-[#f3dfc5] px-3 py-1 rounded-full border border-[#a98059] transition-all duration-300 group-hover:bg-[#f1dfc5] group-hover:text-[#4a3020]"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="w-8 h-8 rounded-full bg-[#f5e3ca] text-[#4a3020] flex items-center justify-center shadow-md transition-all duration-300 group-hover:scale-110 group-hover:bg-[#c4963a] group-hover:text-white ml-auto">
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </section>
    );
}