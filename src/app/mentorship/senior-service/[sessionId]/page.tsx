"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft, Clock, User, Tag, Video, Star, CheckCircle2,
    BookOpen, ShieldCheck, ChevronLeft, ChevronRight,
} from "lucide-react";
import { GlobalStyles, Navigation } from "@/features/index";
import { useAuth } from "@/features/auth/hooks/useAuth";

import SeniorSessionService from "@/lib/api/seniorSession.service";
import MentorService from "@/lib/api/mentorship.service";

// ─── Helpers ───────────────────────────────────────────────────────────────
const toArray = (value: any): string[] => {
    if (Array.isArray(value)) return value.filter(Boolean).map(String);
    if (typeof value === "string" && value.trim()) return [value.trim()];
    return [];
};

const formatRoleDisplay = (role?: string) => {
    if (!role) return "";
    return role
        .replace(/[-_]+/g, " ")
        .trim()
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
};

const splitRoleCompany = (currentRole?: string): { role: string; company: string } => {
    if (!currentRole) return { role: "", company: "" };
    const parts = currentRole.split(/\s+(?:at|@)\s+/i);
    return { role: parts[0]?.trim() || "", company: parts[1]?.trim() || "" };
};

const getInitials = (name: string) =>
    name.split(" ").filter(Boolean).slice(0, 2)
        .map((w) => w.charAt(0).toUpperCase()).join("") || "M";

const getSessionId = (s: any): string => String(s?.sessionId || s?._id || s?.id || "");

export default function SeniorServiceDetailsPage() {

    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const sessionId = params.sessionId as string;

    const [service, setService] = useState<any>(null);
    const [mentor, setMentor] = useState<any>(null);
    const [similarSessions, setSimilarSessions] = useState<any[]>([]);
    const carouselRef = useRef<HTMLDivElement>(null);

    // Status states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!sessionId) return;

        SeniorSessionService.getSessionById(sessionId)
            .then(res => {
                const data = res?.data || res?.session || res;
                setService(data);
                if (data?.mentorId) {
                    MentorService.getMentorByUserId(data.mentorId)
                        .then((mRes: any) => setMentor(mRes?.data ?? mRes?.mentor ?? mRes))
                        .catch(() => {
                            MentorService.getMyMentorProfile(data.mentorId)
                                .then((m2: any) => setMentor(m2?.data ?? m2?.mentor ?? m2))
                                .catch(() => {});
                        });
                }
            })
            .catch(err => {
                setError("Senior service not found or you don't have access.");
            })
            .finally(() => {
                setLoading(false);
            });
    }, [sessionId]);

    // Similar senior sessions
    useEffect(() => {
        SeniorSessionService.getAllDiscoverySessions()
            .then((res: any) => {
                const all = Array.isArray(res?.data)
                    ? res.data
                    : Array.isArray(res?.data?.sessions)
                    ? res.data.sessions
                    : [];
                setSimilarSessions(all.filter((s: any) => getSessionId(s) !== sessionId));
            })
            .catch(() => setSimilarSessions([]));
    }, [sessionId]);

    const displaySimilar = useMemo(() => {
        if (!service) return [];
        const cat = service.category || service.sessionType;
        const same = similarSessions.filter((s) => (s.category || s.sessionType) === cat);
        const rest = similarSessions.filter((s) => (s.category || s.sessionType) !== cat);
        return [...same, ...rest].slice(0, 10);
    }, [similarSessions, service]);

    const scrollCarousel = (direction: "left" | "right") => {
        carouselRef.current?.scrollBy({
            left: direction === "left" ? -320 : 320,
            behavior: "smooth",
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-full border-4 border-[#e2d5c8] border-t-[#8b7355] animate-spin" />
                    <p className="text-[#8e847c] font-medium text-sm">Loading senior service details...</p>
                </div>
            </div>
        );
    }

    if (error || !service) {
        return (
            <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center gap-4">
                <p className="text-red-500 font-medium">{error || "Service not found"}</p>
                <button
                    onClick={() => router.back()}
                    className="px-6 py-2 bg-[#4a3728] text-white rounded-xl text-sm font-bold"
                >
                    Go Back
                </button>
            </div>
        );
    }

    // ─── Derived data ──────────────────────────────────────────────────────
    const title = (service.title || "Mentorship Session").toUpperCase();
    const category = (service.category || service.sessionType || "").replace(/_/g, " ").toUpperCase();
    const duration: number | null = service.duration ?? null;
    const description: string = service.description || "";
    const shortDescription: string = service.short_description || service.shortDescription || "";

    const tags = toArray(service.tags).length > 0 ? toArray(service.tags) : toArray(service.skills);
    const coverImage: string | null =
        service.cover_image_url || service.coverImageUrl || service.thumbnailImage || service.thumbnail || null;

    const learningOutcomes =
        toArray(service.learning_outcomes).length > 0
            ? toArray(service.learning_outcomes)
            : toArray(service.learningOutcomes);
    const prerequisites = toArray(service.prerequisites);

    const mentorName =
        `${mentor?.user?.firstName || ""} ${mentor?.user?.lastName || ""}`.trim() || mentor?.name || "";
    const mentorPic: string | null = mentor?.profilePic || mentor?.user?.profilePic || null;
    const parsed = splitRoleCompany(mentor?.experience?.currentRole);
    const mentorRole = formatRoleDisplay(mentor?.headline || parsed.role || mentor?.role);
    const mentorCompany: string = parsed.company || mentor?.company || "";
    const ratingRaw = mentor?.stats?.averageRating ?? mentor?.rating;
    const mentorRating = typeof ratingRaw === "number" && ratingRaw > 0 ? ratingRaw : null;
    const mentorSessions: number = mentor?.stats?.totalSessions ?? mentor?.sessions ?? 0;
    const mentorExp = mentor?.experience?.total ? `${mentor.experience.total}+ Years` : "";
    const mentorSubtitle = [mentorRole, mentorCompany].filter(Boolean).join(" @ ");

    const handleBookSession = () => router.push(`/mentorship/senior-service/${sessionId}/book`);

    return (
        <div className="min-h-screen bg-[#fbf8f4] text-[#2d2116] font-sans selection:bg-[#4a3426] selection:text-white pb-20">
            <GlobalStyles />
            <Navigation currentUserId={user?.userId} activeTimezone="IST (UTC+5:30)" />

            <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-24">
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#6e5849] hover:text-[#4a3426] mb-4 transition-colors cursor-pointer group"
                >
                    <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                    <span>Back</span>
                </button>

                {/* Hero */}
                <div className="relative w-full h-[220px] sm:h-[240px] md:h-[250px] rounded-[24px] sm:rounded-3xl overflow-hidden shadow-sm border border-[#e6dccf] mb-6 bg-gradient-to-br from-[#4a3426] to-[#8b7355]">
                    {coverImage && (
                        <img src={coverImage} alt={title} className="absolute inset-0 w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />

                    <div className="relative z-10 h-full p-6 sm:p-8 md:p-9 flex flex-col justify-between">
                        <div>
                            {category && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[11px] font-bold rounded-full uppercase tracking-wider border border-white/20">
                                    <Video className="w-3.5 h-3.5 text-white" />
                                    {category}
                                </span>
                            )}
                        </div>

                        <div className="max-w-3xl">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-black uppercase text-white tracking-tight leading-tight mb-2">
                                {title}
                            </h1>
                            {shortDescription && (
                                <p className="text-white/90 text-xs sm:text-sm md:text-[15px] leading-snug max-w-2xl mb-3 line-clamp-2">
                                    {shortDescription}
                                </p>
                            )}
                            {tags.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2">
                                    {tags.map((tag, idx) => (
                                        <span
                                            key={idx}
                                            className="px-3 py-0.5 sm:py-1 bg-white/15 backdrop-blur-sm text-white/95 text-[11px] sm:text-xs font-medium rounded-full border border-white/10"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2-column layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* LEFT */}
                    <div className="lg:col-span-2 space-y-7">
                        {/* Mentor card */}
                        {mentor && (
                            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#ece7e2] shadow-xs flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                                <div className="flex items-center gap-3.5 min-w-0">
                                    {mentorPic ? (
                                        <img
                                            src={mentorPic}
                                            alt={mentorName}
                                            className="w-14 h-14 rounded-full object-cover border-2 border-[#f4ece1] flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 rounded-full bg-[#4a3426] text-white flex items-center justify-center font-bold text-base flex-shrink-0">
                                            {getInitials(mentorName)}
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <h4 className="text-base sm:text-lg font-bold text-[#2d2116] leading-tight truncate">
                                            {mentorName}
                                        </h4>
                                        {mentorSubtitle && (
                                            <p className="text-xs sm:text-sm text-[#8e847c] font-medium mt-1 leading-tight truncate">
                                                {mentorSubtitle}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
                                    {mentorRating !== null && (
                                        <div className="text-left sm:text-right">
                                            <div className="flex items-center gap-1 text-sm sm:text-base font-bold text-[#2d2116]">
                                                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                                <span>{mentorRating.toFixed(1)}</span>
                                            </div>
                                            <p className="text-[11px] sm:text-xs text-[#8e847c]">({mentorSessions} sessions)</p>
                                        </div>
                                    )}

                                    {mentorRating !== null && mentorExp && (
                                        <div className="hidden sm:block w-[1px] h-9 bg-[#e8ded5]" />
                                    )}

                                    {mentorExp && (
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-[#f4ece1] flex items-center justify-center text-[#4a3426]">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs sm:text-sm font-bold text-[#2d2116] leading-tight">{mentorExp}</p>
                                                <p className="text-[11px] text-[#8e847c] leading-tight">Experience</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* About */}
                        {description && (
                            <div>
                                <h3 className="text-xl font-bold text-[#2d2116] mb-2.5">About this session</h3>
                                <p className="text-[#5c6874] text-sm sm:text-[15px] leading-relaxed whitespace-pre-line">
                                    {description}
                                </p>
                            </div>
                        )}

                        {/* What you'll learn */}
                        {learningOutcomes.length > 0 && (
                            <div>
                                <h3 className="text-xl font-bold text-[#2d2116] mb-3">What you&apos;ll learn</h3>
                                <div className="bg-[#f8f5ef] border border-[#e8dfd5] rounded-2xl p-5 sm:p-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        {learningOutcomes.map((outcome, idx) => (
                                            <div key={idx} className="flex items-start gap-2.5">
                                                <CheckCircle2 className="w-4 h-4 text-[#4a3426] mt-0.5 flex-shrink-0" />
                                                <span className="text-xs sm:text-sm font-medium text-[#2d2116] leading-snug">
                                                    {outcome}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Prerequisites */}
                        {prerequisites.length > 0 && (
                            <div>
                                <h3 className="text-xl font-bold text-[#2d2116] mb-3">Prerequisites</h3>
                                <div className="space-y-2">
                                    {prerequisites.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-[#f8f5ef] border border-[#e8dfd5] rounded-2xl p-4 flex items-center gap-3"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-white/80 border border-[#e8dfd5] flex items-center justify-center text-[#4a3426] flex-shrink-0">
                                                <BookOpen className="w-4 h-4" />
                                            </div>
                                            <p className="text-xs sm:text-sm text-[#4a3426] font-medium leading-snug">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Similar sessions */}
                        {displaySimilar.length > 0 && (
                            <div className="pt-2">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-[#2d2116]">Similar Sessions You Might Like</h3>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => scrollCarousel("left")}
                                            className="w-8 h-8 rounded-full border border-[#ece7e2] bg-white hover:bg-[#f8f5ef] text-[#4a3426] flex items-center justify-center transition-colors"
                                            aria-label="Scroll left"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => scrollCarousel("right")}
                                            className="w-8 h-8 rounded-full border border-[#ece7e2] bg-white hover:bg-[#f8f5ef] text-[#4a3426] flex items-center justify-center transition-colors"
                                            aria-label="Scroll right"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div
                                    ref={carouselRef}
                                    className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-3"
                                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                                >
                                    {displaySimilar.map((item: any, idx: number) => {
                                        const sId = getSessionId(item);
                                        const sTitle = item.title || "Mentorship Session";
                                        const sMentor = item.mentorId === service.mentorId ? mentorName : "";
                                        const sDur = item.duration ? `${item.duration} mins` : "";
                                        // Senior sessions are free: no price is looked up or shown
                                        const meta = [sDur, "Free"].filter(Boolean);

                                        return (
                                            <div
                                                key={sId || idx}
                                                onClick={() => router.push(`/mentorship/senior-service/${sId}`)}
                                                className="min-w-[270px] sm:min-w-[290px] max-w-[300px] flex-shrink-0 snap-start bg-white rounded-2xl p-4 border border-[#ece7e2] hover:border-[#8b7355]/40 hover:shadow-md transition-all duration-200 cursor-pointer flex items-center gap-3.5"
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-[#f4ece1] text-[#4a3426] font-black flex items-center justify-center text-base flex-shrink-0">
                                                    {sTitle.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h5 className="text-sm font-bold text-[#2d2116] leading-tight truncate">{sTitle}</h5>
                                                    {sMentor && (
                                                        <p className="text-xs text-[#8e847c] font-medium mt-0.5 truncate">{sMentor}</p>
                                                    )}
                                                    <p className="text-xs text-[#8e847c] font-medium mt-2 truncate">
                                                        {meta.join("  |  ")}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: sticky booking sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl p-6 border border-[#ece7e2] shadow-xs sticky top-24 space-y-5">
                            {duration !== null && (
                                <div className="flex items-start gap-3.5">
                                    <div className="w-8 h-8 rounded-lg bg-[#f8f5ef] flex items-center justify-center text-[#4a3426] flex-shrink-0 mt-0.5">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm sm:text-[15px] font-bold text-[#2d2116] leading-tight">{duration} Minutes</p>
                                        <p className="text-xs text-[#8e847c] mt-0.5">Session duration</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-start gap-3.5">
                                <div className="w-8 h-8 rounded-lg bg-[#f8f5ef] flex items-center justify-center text-[#4a3426] flex-shrink-0 mt-0.5">
                                    <Video className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm sm:text-[15px] font-bold text-[#2d2116] leading-tight">1-to-1 Private</p>
                                    <p className="text-xs text-[#8e847c] mt-0.5">Session format</p>
                                </div>
                            </div>

                            {category && (
                                <div className="flex items-start gap-3.5">
                                    <div className="w-8 h-8 rounded-lg bg-[#f8f5ef] flex items-center justify-center text-[#4a3426] flex-shrink-0 mt-0.5">
                                        <Tag className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm sm:text-[15px] font-bold text-[#2d2116] leading-tight capitalize">
                                            {category.toLowerCase()}
                                        </p>
                                        <p className="text-xs text-[#8e847c] mt-0.5">Category</p>
                                    </div>
                                </div>
                            )}

                            <div className="border-t border-[#ece7e2] pt-4">
                                <div className="flex items-baseline justify-between">
                                    <span className="text-sm text-[#8e847c] font-medium">Price</span>
                                    <div className="text-right">
                                        <span className="text-3xl sm:text-[34px] font-black text-[#2d2116] leading-none">
                                            Free
                                        </span>
                                        {duration !== null && (
                                            <p className="text-xs text-[#8e847c] mt-1">{duration} mins · 1-to-1</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleBookSession}
                                className="w-full py-3.5 bg-[#4a3426] hover:bg-[#38291e] active:scale-[0.99] text-white font-bold rounded-xl text-xs uppercase tracking-[2px] transition-all duration-200 shadow-md shadow-[#4a3426]/15 hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                BOOK SESSION →
                            </button>

                            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#8e847c] pt-1">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Free session • Reschedule anytime</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}