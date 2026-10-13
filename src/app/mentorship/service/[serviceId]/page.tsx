// src/app/mentorship/service/[serviceId]/page.tsx
"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import SessionService from "@/lib/api/session.service";
import MentorService from "@/lib/api/mentorship.service";
import {
    ArrowLeft,
    Clock,
    User,
    Tag,
    Video,
    Star,
    CheckCircle2,
    BookOpen,
    ShieldCheck,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { GlobalStyles, Navigation } from "@/features/index";
import { useAuth } from "@/features/auth/hooks/useAuth";

// ─── Helpers ───────────────────────────────────────────────────────────────
const toSlug = (first?: string, last?: string) =>
    [first, last]
        .filter(Boolean)
        .join("-")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "mentor";

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
    name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w.charAt(0).toUpperCase())
        .join("") || "M";

const getSessionId = (s: any): string => String(s?.sessionId || s?._id || s?.id || "");

const getPrice = (s: any): number | null => {
    const p = s?.pricing?.basePrice ?? s?.pricing?.totalAmount ?? s?.price;
    return typeof p === "number" ? p : null;
};

export default function ServiceDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const serviceId = params.serviceId as string;

    const [service, setService] = useState<any>(null);
    const [mentor, setMentor] = useState<any>(null);
    const [allMentors, setAllMentors] = useState<any[]>([]);
    const [similarSessions, setSimilarSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const carouselRef = useRef<HTMLDivElement>(null);

    // ─── 1. Fetch Session Details ──────────────────────────────────────────
    useEffect(() => {
        if (!serviceId) return;
        setLoading(true);
        SessionService.getSessionById(serviceId)
            .then((res: any) => {
                const data = res?.data || res?.session || res;
                setService(data);
                setLoading(false);
            })
            .catch(() => {
                SessionService.getAllSessionsFromDB({ limit: 50 })
                    .then((res: any) => {
                        const all = res?.data ?? [];
                        const found = all.find((s: any) => getSessionId(s) === serviceId);
                        if (found) {
                            setService(found);
                        } else {
                            setError("Service not found.");
                        }
                        setLoading(false);
                    })
                    .catch(() => {
                        setError("Failed to load service details.");
                        setLoading(false);
                    });
            });
    }, [serviceId]);

    // ─── 2. Fetch Mentor Profile ───────────────────────────────────────────
    useEffect(() => {
        if (!service?.mentorId) return;
        MentorService.getMyMentorProfile(service.mentorId)
            .then((res: any) => {
                setMentor(res?.data || res?.mentor || res);
            })
            .catch(() => {
                MentorService.getAllMentors({ limit: 50 })
                    .then((mRes: any) => {
                        const list = mRes?.data || mRes?.mentors || [];
                        const found = list.find((m: any) => m.mentorId === service.mentorId);
                        if (found) setMentor(found);
                    })
                    .catch(() => {});
            });
    }, [service?.mentorId]);

    // ─── 3. Fetch Similar Sessions + mentors (for names) ───────────────────
    useEffect(() => {
        SessionService.getAllSessionsFromDB({ limit: 30 })
            .then((res: any) => {
                const all = Array.isArray(res?.data)
                    ? res.data
                    : Array.isArray(res?.data?.sessions)
                    ? res.data.sessions
                    : [];
                setSimilarSessions(
                    all.filter(
                        (s: any) =>
                            getSessionId(s) !== serviceId && s.sessionType !== "group_session"
                    )
                );
            })
            .catch(() => setSimilarSessions([]));

        MentorService.getAllMentors({ limit: 50 })
            .then((mRes: any) => {
                const list = mRes?.data || mRes?.mentors || [];
                setAllMentors(Array.isArray(list) ? list : []);
            })
            .catch(() => setAllMentors([]));
    }, [serviceId]);

    // mentorId -> display name
    const mentorNameMap = useMemo(() => {
        const map: Record<string, string> = {};
        allMentors.forEach((m: any) => {
            const name =
                `${m.user?.firstName || ""} ${m.user?.lastName || ""}`.trim() || m.name || "";
            if (m.mentorId && name) map[m.mentorId] = name;
        });
        return map;
    }, [allMentors]);

    // Same category first, then the rest; max 10
    const displaySimilar = useMemo(() => {
        if (!service) return [];
        const cat = service.category || service.sessionType;
        const same = similarSessions.filter((s) => (s.category || s.sessionType) === cat);
        const rest = similarSessions.filter((s) => (s.category || s.sessionType) !== cat);
        return [...same, ...rest].slice(0, 10);
    }, [similarSessions, service]);

    // ─── Navigation Handlers ───────────────────────────────────────────────
    const handleBookSession = () => {
        if (!mentor) return;
        const nameSlug = toSlug(mentor.user?.firstName, mentor.user?.lastName);
        // book=true + serviceId => MentorProfile directly opens calendar step
        router.push(
            `/mentorship/mentor-card/${nameSlug}/${mentor.mentorId}?serviceId=${serviceId}&book=true`
        );
    };

    const handleMentorCardClick = () => {
        if (!mentor) return;
        const nameSlug = toSlug(mentor.user?.firstName, mentor.user?.lastName);
        router.push(`/mentorship/mentor-card/${nameSlug}/${mentor.mentorId}`);
    };

    const scrollCarousel = (direction: "left" | "right") => {
        if (!carouselRef.current) return;
        carouselRef.current.scrollBy({
            left: direction === "left" ? -320 : 320,
            behavior: "smooth",
        });
    };

    // ─── Loading Skeleton ──────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-[#fbf8f4] text-[#4a3426] font-sans pb-20">
                <GlobalStyles />
                <Navigation currentUserId={user?.userId} activeTimezone="IST (UTC+5:30)" />
                <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 animate-pulse">
                    <div className="w-36 h-4 bg-[#e8dfd5] rounded mb-4" />
                    <div className="w-full h-[220px] bg-[#e8dfd5] rounded-3xl mb-8" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="w-full h-24 bg-[#e8dfd5] rounded-2xl" />
                            <div className="w-full h-32 bg-[#e8dfd5] rounded-2xl" />
                            <div className="w-full h-44 bg-[#e8dfd5] rounded-2xl" />
                        </div>
                        <div className="w-full h-80 bg-[#e8dfd5] rounded-2xl" />
                    </div>
                </main>
            </div>
        );
    }

    // ─── Error State ───────────────────────────────────────────────────────
    if (error || !service) {
        return (
            <div className="min-h-screen bg-[#fbf8f4] flex flex-col items-center justify-center gap-4 text-[#4a3426]">
                <p className="text-red-600 font-semibold">{error || "Service not found"}</p>
                <button
                    onClick={() => router.back()}
                    className="px-6 py-2 bg-[#4a3426] text-white rounded-xl text-sm font-bold hover:bg-[#38291e] transition-colors"
                >
                    Go Back
                </button>
            </div>
        );
    }

    // ─── Derived Data (real data only, no dummy fallbacks) ─────────────────
    const title = (service.title || "Mentorship Session").toUpperCase();
    const category = (service.category || service.sessionType || "")
        .replace(/_/g, " ")
        .toUpperCase();
    const duration: number | null = service.duration ?? null;

    const description: string = service.description || "";
    const shortDescription: string =
        service.short_description || service.shortDescription || "";

    const tags = toArray(service.tags).length > 0 ? toArray(service.tags) : toArray(service.skills);

    const coverImage: string | null =
        service.cover_image_url ||
        service.coverImageUrl ||
        service.thumbnailImage ||
        service.thumbnail ||
        null;

    const learningOutcomes = toArray(service.learning_outcomes).length > 0
        ? toArray(service.learning_outcomes)
        : toArray(service.learningOutcomes);

    const prerequisites = toArray(service.prerequisites);

    const price = getPrice(service);
    const priceDisplay = price === null ? "-" : price === 0 ? "Free" : `₹${price}`;

    // Mentor details
    const mentorName =
        `${mentor?.user?.firstName || ""} ${mentor?.user?.lastName || ""}`.trim() ||
        mentor?.name ||
        "";

    const mentorPic: string | null = mentor?.profilePic || mentor?.user?.profilePic || null;

    const parsed = splitRoleCompany(mentor?.experience?.currentRole);
    const mentorRole = formatRoleDisplay(mentor?.headline || parsed.role || mentor?.role);
    const mentorCompany: string = parsed.company || mentor?.company || "";

    const ratingRaw = mentor?.stats?.averageRating ?? mentor?.rating;
    const mentorRating = typeof ratingRaw === "number" && ratingRaw > 0 ? ratingRaw : null;
    const mentorSessions: number = mentor?.stats?.totalSessions ?? mentor?.sessions ?? 0;
    const mentorExp = mentor?.experience?.total ? `${mentor.experience.total}+ Years` : "";

    const mentorSubtitle = [mentorRole, mentorCompany].filter(Boolean).join(" @ ");

    return (
        <div className="min-h-screen bg-[#fbf8f4] text-[#2d2116] font-sans selection:bg-[#4a3426] selection:text-white pb-20">
            <GlobalStyles />
            <Navigation currentUserId={user?.userId} activeTimezone="IST (UTC+5:30)" />

            <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-24">
                {/* ── Back link ─────────────────────────────────────────── */}
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#6e5849] hover:text-[#4a3426] mb-4 transition-colors cursor-pointer group"
                >
                    <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                    <span>Back to Mentors</span>
                </button>

                {/* ── Hero Section ─────────────────────────────────────── */}
                <div className="relative w-full h-[220px] sm:h-[240px] md:h-[250px] rounded-[24px] sm:rounded-3xl overflow-hidden shadow-sm border border-[#e6dccf] mb-6 bg-gradient-to-br from-[#4a3426] to-[#8b7355]">
                    {coverImage && (
                        <img
                            src={coverImage}
                            alt={title}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />

                    <div className="relative z-10 h-full p-6 sm:p-8 md:p-9 flex flex-col justify-between">
                        <div>
                            {category && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/25 backdrop-blur-md text-white text-[11px] font-bold rounded-full uppercase tracking-wider border border-white/20 shadow-xs">
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
                                <p className="text-white/90 text-xs sm:text-sm md:text-[15px] font-normal leading-snug max-w-2xl mb-3 line-clamp-2">
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

                {/* ── 2-Column Main Layout ──────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* LEFT COLUMN */}
                    <div className="lg:col-span-2 space-y-7">
                        {/* Mentor Card */}
                        {mentor && (
                            <div
                                onClick={handleMentorCardClick}
                                className="bg-white rounded-2xl p-4 sm:p-5 border border-[#ece7e2] shadow-xs flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap cursor-pointer hover:border-[#8b7355]/40 hover:shadow-md transition-all duration-200"
                            >
                                <div className="flex items-center gap-3.5 min-w-0">
                                    {mentorPic ? (
                                        <img
                                            src={mentorPic}
                                            alt={mentorName}
                                            className="w-13 h-13 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-[#f4ece1] flex-shrink-0"
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
                                            <p className="text-xs sm:text-sm text-[#8e847c] font-medium mt-1 leading-tight flex items-center gap-1.5 truncate">
                                                <span>{mentorSubtitle}</span>
                                                {mentorCompany.toLowerCase().includes("google") && (
                                                    <svg
                                                        className="w-3.5 h-3.5 inline-block flex-shrink-0"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            fill="#4285F4"
                                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                        />
                                                        <path
                                                            fill="#34A853"
                                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                        />
                                                        <path
                                                            fill="#FBBC05"
                                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                                        />
                                                        <path
                                                            fill="#EA4335"
                                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                                        />
                                                    </svg>
                                                )}
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
                                            <p className="text-[11px] sm:text-xs text-[#8e847c] font-normal">
                                                ({mentorSessions} sessions)
                                            </p>
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
                                                <p className="text-xs sm:text-sm font-bold text-[#2d2116] leading-tight">
                                                    {mentorExp}
                                                </p>
                                                <p className="text-[11px] text-[#8e847c] leading-tight">
                                                    Experience
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* About this session */}
                        {description && (
                            <div>
                                <h3 className="text-xl font-bold text-[#2d2116] mb-2.5">
                                    About this session
                                </h3>
                                <p className="text-[#5c6874] text-sm sm:text-[15px] leading-relaxed whitespace-pre-line">
                                    {description}
                                </p>
                            </div>
                        )}

                        {/* What you'll learn */}
                        {learningOutcomes.length > 0 && (
                            <div>
                                <h3 className="text-xl font-bold text-[#2d2116] mb-3">
                                    What you&apos;ll learn
                                </h3>
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
                                <h3 className="text-xl font-bold text-[#2d2116] mb-3">
                                    Prerequisites
                                </h3>
                                <div className="space-y-2">
                                    {prerequisites.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-[#f8f5ef] border border-[#e8dfd5] rounded-2xl p-4 flex items-center gap-3"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-white/80 border border-[#e8dfd5] flex items-center justify-center text-[#4a3426] flex-shrink-0">
                                                <BookOpen className="w-4 h-4" />
                                            </div>
                                            <p className="text-xs sm:text-sm text-[#4a3426] font-medium leading-snug">
                                                {item}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Similar Sessions */}
                        {displaySimilar.length > 0 && (
                            <div className="pt-2">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-[#2d2116]">
                                        Similar Sessions You Might Like
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => scrollCarousel("left")}
                                            className="w-8 h-8 rounded-full border border-[#ece7e2] bg-white hover:bg-[#f8f5ef] text-[#4a3426] flex items-center justify-center transition-colors shadow-2xs"
                                            aria-label="Scroll left"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => scrollCarousel("right")}
                                            className="w-8 h-8 rounded-full border border-[#ece7e2] bg-white hover:bg-[#f8f5ef] text-[#4a3426] flex items-center justify-center transition-colors shadow-2xs"
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
                                        const sMentor = mentorNameMap[item.mentorId] || "";
                                        const sRatingRaw = item.rating ?? item.stats?.averageRating;
                                        const sRating =
                                            typeof sRatingRaw === "number" && sRatingRaw > 0
                                                ? sRatingRaw
                                                : null;
                                        const sDur = item.duration ? `${item.duration} mins` : "";
                                        const sPriceNum = getPrice(item);
                                        const sPrice =
                                            sPriceNum === null
                                                ? ""
                                                : sPriceNum === 0
                                                ? "Free"
                                                : `₹${sPriceNum}`;
                                        const initial = sTitle.charAt(0).toUpperCase();

                                        const meta = [
                                            sRating !== null ? `${sRating.toFixed(1)} ★` : "",
                                            sDur,
                                            sPrice,
                                        ].filter(Boolean);

                                        return (
                                            <div
                                                key={sId || idx}
                                                onClick={() => router.push(`/mentorship/service/${sId}`)}
                                                className="min-w-[270px] sm:min-w-[290px] max-w-[300px] flex-shrink-0 snap-start bg-white rounded-2xl p-4 border border-[#ece7e2] hover:border-[#8b7355]/40 hover:shadow-md transition-all duration-200 cursor-pointer flex items-center gap-3.5"
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-[#f4ece1] text-[#4a3426] font-black flex items-center justify-center text-base flex-shrink-0">
                                                    {initial}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <h5 className="text-sm font-bold text-[#2d2116] leading-tight truncate">
                                                        {sTitle}
                                                    </h5>
                                                    {sMentor && (
                                                        <p className="text-xs text-[#8e847c] font-medium mt-0.5 truncate">
                                                            {sMentor}
                                                        </p>
                                                    )}
                                                    {meta.length > 0 && (
                                                        <p className="text-xs text-[#8e847c] font-medium mt-2 truncate">
                                                            {meta.join("  |  ")}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Sticky Booking Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl p-6 border border-[#ece7e2] shadow-xs sticky top-24 space-y-5">
                            {duration !== null && (
                                <div className="flex items-start gap-3.5">
                                    <div className="w-8 h-8 rounded-lg bg-[#f8f5ef] flex items-center justify-center text-[#4a3426] flex-shrink-0 mt-0.5">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm sm:text-[15px] font-bold text-[#2d2116] leading-tight">
                                            {duration} Minutes
                                        </p>
                                        <p className="text-xs text-[#8e847c] mt-0.5">
                                            Session duration
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-start gap-3.5">
                                <div className="w-8 h-8 rounded-lg bg-[#f8f5ef] flex items-center justify-center text-[#4a3426] flex-shrink-0 mt-0.5">
                                    <Video className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm sm:text-[15px] font-bold text-[#2d2116] leading-tight">
                                        1-to-1 Private
                                    </p>
                                    <p className="text-xs text-[#8e847c] mt-0.5">
                                        Session format
                                    </p>
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
                                            {priceDisplay}
                                        </span>
                                        {duration !== null && (
                                            <p className="text-xs text-[#8e847c] font-normal mt-1">
                                                {duration} mins · 1-to-1
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleBookSession}
                                disabled={!mentor}
                                className="w-full py-3.5 bg-[#4a3426] hover:bg-[#38291e] active:scale-[0.99] text-white font-bold rounded-xl text-xs uppercase tracking-[2px] transition-all duration-200 shadow-md shadow-[#4a3426]/15 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <span>{mentor ? "BOOK SESSION →" : "Loading..."}</span>
                            </button>

                            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#8e847c] pt-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-[#8e847c]" />
                                <span>Secure payments • Reschedule anytime</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}