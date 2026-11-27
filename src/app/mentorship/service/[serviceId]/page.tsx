// src/app/mentorship/service/[serviceId]/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
    Loader2,
} from "lucide-react";
import { GlobalStyles, Navigation } from "@/features/index";
import { useAuth } from "@/features/auth/hooks/useAuth";
import TokenStorage from "@/lib/store/token.storage";
import { buildLoginRedirectUrl } from "@/shared/utils/safeRedirect";

// Module-level cache (revisit / back navigation par instant render)
const serviceCache = new Map<string, any>();
const mentorCache = new Map<string, any>();
let similarCache: any[] | null = null;
let mentorsListCache: any[] | null = null;

// Helpers
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

const extractSessionList = (res: any): any[] => {
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.sessions)) return res.data.sessions;
    return [];
};

const extractMentorList = (res: any): any[] => {
    const list = res?.data || res?.mentors || [];
    return Array.isArray(list) ? list : [];
};

export default function ServiceDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const serviceId = params.serviceId as string;

    const [service, setService] = useState<any>(() => serviceCache.get(serviceId) ?? null);
    const [mentor, setMentor] = useState<any>(() => {
        const cachedService = serviceCache.get(serviceId);
        return cachedService?.mentorId ? mentorCache.get(cachedService.mentorId) ?? null : null;
    });
    const [allMentors, setAllMentors] = useState<any[]>(() => mentorsListCache ?? []);
    const [similarSessions, setSimilarSessions] = useState<any[]>(() => similarCache ?? []);
    const [loading, setLoading] = useState<boolean>(() => !serviceCache.has(serviceId));
    const [error, setError] = useState<string | null>(null);
    const [isNavigating, setIsNavigating] = useState(false);

    const carouselRef = useRef<HTMLDivElement>(null);

    // 1. Fetch Session Details
    useEffect(() => {
        if (!serviceId) return;

        if (!TokenStorage.isAuthenticated()) {
            router.replace(buildLoginRedirectUrl(`/mentorship/service/${serviceId}`));
            return;
        }

        let cancelled = false;
        setIsNavigating(false);
        setError(null);

        const cached = serviceCache.get(serviceId);
        if (cached) {
            setService(cached);
            setMentor(cached.mentorId ? mentorCache.get(cached.mentorId) ?? null : null);
            setLoading(false);
        } else {
            setService(null);
            setMentor(null);
            setLoading(true);
        }

        const commit = (data: any) => {
            if (cancelled) return;
            serviceCache.set(serviceId, data);
            setService(data);
            setLoading(false);
        };

        SessionService.getSessionById(serviceId)
            .then((res: any) => commit(res?.data || res?.session || res))
            .catch(() => {
                SessionService.getAllSessionsFromDB({ limit: 50 })
                    .then((res: any) => {
                        if (cancelled) return;
                        const found = (res?.data ?? []).find(
                            (s: any) => getSessionId(s) === serviceId
                        );
                        if (found) {
                            commit(found);
                        } else if (!serviceCache.has(serviceId)) {
                            setError("Service not found.");
                            setLoading(false);
                        }
                    })
                    .catch(() => {
                        if (cancelled) return;
                        if (!TokenStorage.isAuthenticated()) {
                            router.replace(
                                buildLoginRedirectUrl(`/mentorship/service/${serviceId}`)
                            );
                            return;
                        }
                        if (!serviceCache.has(serviceId)) {
                            setError("Failed to load service details.");
                            setLoading(false);
                        }
                    });
            });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serviceId]);

    // 2. Fetch Mentor Profile
    const mentorIdFromService: string | undefined = service?.mentorId;

    useEffect(() => {
        if (!mentorIdFromService) return;

        const cached = mentorCache.get(mentorIdFromService);
        if (cached) {
            setMentor(cached);
            return;
        }

        let cancelled = false;
        const commit = (data: any) => {
            if (cancelled || !data) return;
            mentorCache.set(mentorIdFromService, data);
            setMentor(data);
        };

        MentorService.getMyMentorProfile(mentorIdFromService)
            .then((res: any) => commit(res?.data || res?.mentor || res))
            .catch(() => {
                MentorService.getAllMentors({ limit: 50 })
                    .then((mRes: any) => {
                        const found = extractMentorList(mRes).find(
                            (m: any) => m.mentorId === mentorIdFromService
                        );
                        if (found) commit(found);
                    })
                    .catch(() => {});
            });

        return () => {
            cancelled = true;
        };
    }, [mentorIdFromService]);

    // 3. Similar Sessions + mentors list (service load hone ke baad)
    const hasService = !!service;

    useEffect(() => {
        if (!hasService) return;
        let cancelled = false;

        if (!similarCache) {
            SessionService.getAllSessionsFromDB({ limit: 30 })
                .then((res: any) => {
                    if (cancelled) return;
                    const list = extractSessionList(res);
                    similarCache = list;
                    setSimilarSessions(list);
                })
                .catch(() => {
                    if (!cancelled) setSimilarSessions([]);
                });
        } else {
            setSimilarSessions(similarCache);
        }

        if (!mentorsListCache) {
            MentorService.getAllMentors({ limit: 50 })
                .then((mRes: any) => {
                    if (cancelled) return;
                    const list = extractMentorList(mRes);
                    mentorsListCache = list;
                    setAllMentors(list);
                })
                .catch(() => {
                    if (!cancelled) setAllMentors([]);
                });
        } else {
            setAllMentors(mentorsListCache);
        }

        return () => {
            cancelled = true;
        };
    }, [hasService, serviceId]);

    const mentorNameMap = useMemo(() => {
        const map: Record<string, string> = {};
        allMentors.forEach((m: any) => {
            const name =
                `${m.user?.firstName || ""} ${m.user?.lastName || ""}`.trim() || m.name || "";
            if (m.mentorId && name) map[m.mentorId] = name;
        });
        return map;
    }, [allMentors]);

    const displaySimilar = useMemo(() => {
        if (!service) return [];
        const pool = similarSessions.filter(
            (s) => getSessionId(s) !== serviceId && s.sessionType !== "group_session"
        );
        const cat = service.category || service.sessionType;
        const same = pool.filter((s) => (s.category || s.sessionType) === cat);
        const rest = pool.filter((s) => (s.category || s.sessionType) !== cat);
        return [...same, ...rest].slice(0, 10);
    }, [similarSessions, service, serviceId]);

    // Booking target (mentor load hone ka wait nahi)
    const bookingMentorId: string = mentor?.mentorId || service?.mentorId || "";
    const bookingUrl = bookingMentorId
        ? `/mentorship/mentor-card/${toSlug(
              mentor?.user?.firstName,
              mentor?.user?.lastName
          )}/${bookingMentorId}?serviceId=${serviceId}&book=true`
        : "";

    useEffect(() => {
        if (bookingUrl) router.prefetch(bookingUrl);
    }, [bookingUrl, router]);

    const handleBookSession = () => {
        if (!bookingUrl || isNavigating) return;
        setIsNavigating(true);
        router.push(bookingUrl);
    };

    const handleMentorCardClick = () => {
        if (!bookingMentorId) return;
        const nameSlug = toSlug(mentor?.user?.firstName, mentor?.user?.lastName);
        router.push(`/mentorship/mentor-card/${nameSlug}/${bookingMentorId}`);
    };

    const scrollCarousel = (direction: "left" | "right") => {
        if (!carouselRef.current) return;
        carouselRef.current.scrollBy({
            left: direction === "left" ? -320 : 320,
            behavior: "smooth",
        });
    };

    // Loading Skeleton
    if (loading) {
        return (
            <div className="min-h-screen bg-[#fbf8f4] text-[#4a3426] font-sans pb-20">
                <GlobalStyles />
                <Navigation currentUserId={user?.userId} activeTimezone="IST (UTC+5:30)" />
                <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 animate-pulse">
                    <div className="w-36 h-4 bg-[#e8dfd5] rounded mb-4" />
                    <div className="w-full aspect-video max-h-[340px] bg-[#e8dfd5] rounded-3xl mb-6" />
                    <div className="w-2/3 h-8 bg-[#e8dfd5] rounded mb-3" />
                    <div className="w-1/2 h-4 bg-[#efe8df] rounded mb-8" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="w-full h-24 bg-[#e8dfd5] rounded-2xl" />
                            <div className="w-full h-32 bg-[#e8dfd5] rounded-2xl" />
                        </div>
                        <div className="w-full h-80 bg-[#e8dfd5] rounded-2xl" />
                    </div>
                </main>
            </div>
        );
    }

    // Error State
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

    // Derived Data
    const title: string = service.title || "Mentorship Session";
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

    const learningOutcomes =
        toArray(service.learning_outcomes).length > 0
            ? toArray(service.learning_outcomes)
            : toArray(service.learningOutcomes);

    const prerequisites = toArray(service.prerequisites);

    const price = getPrice(service);
    const priceDisplay = price === null ? "-" : price === 0 ? "Free" : `₹${price}`;

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

    const canBook = !!bookingUrl;

    return (
        <div className="min-h-screen bg-[#fbf8f4] text-[#2d2116] font-sans selection:bg-[#4a3426] selection:text-white pb-28 lg:pb-20">
            <GlobalStyles />
            <Navigation currentUserId={user?.userId} activeTimezone="IST (UTC+5:30)" />

            <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-24">
                {/* Back link */}
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#6e5849] hover:text-[#4a3426] mb-4 transition-colors cursor-pointer group"
                >
                    <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                    <span>Back to Mentors</span>
                </button>

                {/* Hero: image clean (no text over it), title neeche */}
                <div className="relative w-full aspect-video max-h-[340px] rounded-[24px] sm:rounded-3xl overflow-hidden shadow-sm border border-[#e6dccf] bg-gradient-to-br from-[#4a3426] to-[#8b7355]">
                    {coverImage && (
                        <>
                            {/* Blurred backdrop: image poori dikhe, side khaali na lage */}
                            <img
                                src={coverImage}
                                alt=""
                                aria-hidden="true"
                                className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-60"
                            />
                            <img
                                src={coverImage}
                                alt={title}
                                loading="eager"
                                decoding="async"
                                className="relative w-full h-full object-contain"
                            />
                        </>
                    )}

                    {category && (
                        <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 bg-black/55 backdrop-blur-md text-white text-[11px] font-bold rounded-full uppercase tracking-wider border border-white/20">
                            <Video className="w-3.5 h-3.5" />
                            {category}
                        </span>
                    )}

                    {!coverImage && (
                        <div className="absolute inset-0 flex items-center justify-center p-6">
                            <h1 className="text-2xl sm:text-4xl font-black text-white text-center leading-tight">
                                {title}
                            </h1>
                        </div>
                    )}
                </div>

                {/* Title block (image ke neeche) */}
                {coverImage && (
                    <div className="mt-5 mb-8 max-w-3xl">
                        <h1 className="text-2xl sm:text-3xl md:text-[34px] font-black text-[#2d2116] tracking-tight leading-tight mb-2 break-words">
                            {title}
                        </h1>
                        {shortDescription && (
                            <p className="text-[#6e5849] text-sm sm:text-base leading-relaxed mb-3">
                                {shortDescription}
                            </p>
                        )}
                        {tags.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                                {tags.slice(0, 8).map((tag, idx) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1 bg-[#f4ece1] text-[#4a3426] text-[11px] sm:text-xs font-semibold rounded-full border border-[#e8dfd5]"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {!coverImage && <div className="mb-8" />}

                {/* 2-Column Main Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* LEFT COLUMN */}
                    <div className="lg:col-span-2 space-y-8 min-w-0">
                        {/* Mentor Card */}
                        {!mentor ? (
                            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#ece7e2] flex items-center gap-3.5 animate-pulse">
                                <div className="w-14 h-14 rounded-full bg-[#e8dfd5]" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-40 bg-[#e8dfd5] rounded" />
                                    <div className="h-3 w-64 max-w-full bg-[#efe8df] rounded" />
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={handleMentorCardClick}
                                className="bg-white rounded-2xl p-4 sm:p-5 border border-[#ece7e2] shadow-xs flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap cursor-pointer hover:border-[#8b7355]/40 hover:shadow-md transition-all duration-200"
                            >
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
                            <section>
                                <h3 className="text-xl font-bold text-[#2d2116] mb-3">
                                    About this session
                                </h3>
                                <p className="text-[#5c6874] text-sm sm:text-[15px] leading-relaxed whitespace-pre-line break-words">
                                    {description}
                                </p>
                            </section>
                        )}

                        {/* What you'll learn */}
                        {learningOutcomes.length > 0 && (
                            <section>
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
                            </section>
                        )}

                        {/* Prerequisites */}
                        {prerequisites.length > 0 && (
                            <section>
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
                            </section>
                        )}

                        {/* Similar Sessions */}
                        {displaySimilar.length > 0 && (
                            <section className="pt-2">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-[#2d2116]">
                                        Similar Sessions You Might Like
                                    </h3>
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

                                <div className="relative">
                                    <div
                                        ref={carouselRef}
                                        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-3 pr-10"
                                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                                    >
                                        {displaySimilar.map((item: any, idx: number) => {
                                            const sId = getSessionId(item);
                                            const sTitle = item.title || "Mentorship Session";
                                            const sMentor = mentorNameMap[item.mentorId] || "";
                                            const sRatingRaw =
                                                item.rating ?? item.stats?.averageRating;
                                            const sRating =
                                                typeof sRatingRaw === "number" && sRatingRaw > 0
                                                    ? sRatingRaw
                                                    : null;
                                            const sDur = item.duration
                                                ? `${item.duration} mins`
                                                : "";
                                            const sPriceNum = getPrice(item);
                                            const sPrice =
                                                sPriceNum === null
                                                    ? ""
                                                    : sPriceNum === 0
                                                    ? "Free"
                                                    : `₹${sPriceNum}`;
                                            const initial = sTitle.charAt(0).toUpperCase();

                                            const meta = [
                                                sRating !== null ? `${sRating.toFixed(1)} rating` : "",
                                                sDur,
                                                sPrice,
                                            ].filter(Boolean);

                                            return (
                                                <div
                                                    key={sId || idx}
                                                    role="link"
                                                    tabIndex={0}
                                                    onMouseEnter={() =>
                                                        sId &&
                                                        router.prefetch(`/mentorship/service/${sId}`)
                                                    }
                                                    onClick={() =>
                                                        sId && router.push(`/mentorship/service/${sId}`)
                                                    }
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter" && sId) {
                                                            router.push(`/mentorship/service/${sId}`);
                                                        }
                                                    }}
                                                    className="w-[270px] sm:w-[290px] flex-shrink-0 snap-start bg-white rounded-2xl p-4 border border-[#ece7e2] hover:border-[#8b7355]/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex items-center gap-3.5"
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
                                    <div className="pointer-events-none absolute top-0 right-0 bottom-3 w-10 bg-gradient-to-l from-[#fbf8f4] to-transparent" />
                                </div>
                            </section>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Booking Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl p-6 border border-[#ece7e2] shadow-sm lg:sticky lg:top-24 space-y-5">
                            {duration !== null && (
                                <div className="flex items-start gap-3.5">
                                    <div className="w-9 h-9 rounded-lg bg-[#f8f5ef] flex items-center justify-center text-[#4a3426] flex-shrink-0">
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
                                <div className="w-9 h-9 rounded-lg bg-[#f8f5ef] flex items-center justify-center text-[#4a3426] flex-shrink-0">
                                    <Video className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm sm:text-[15px] font-bold text-[#2d2116] leading-tight">
                                        1-to-1 Private
                                    </p>
                                    <p className="text-xs text-[#8e847c] mt-0.5">Session format</p>
                                </div>
                            </div>

                            {category && (
                                <div className="flex items-start gap-3.5">
                                    <div className="w-9 h-9 rounded-lg bg-[#f8f5ef] flex items-center justify-center text-[#4a3426] flex-shrink-0">
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
                                onMouseEnter={() => bookingUrl && router.prefetch(bookingUrl)}
                                disabled={!canBook || isNavigating}
                                aria-busy={isNavigating}
                                className="w-full py-3.5 bg-[#4a3426] hover:bg-[#38291e] active:scale-[0.98] text-white font-bold rounded-xl text-xs uppercase tracking-[2px] transition-all duration-150 shadow-md shadow-[#4a3426]/15 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {isNavigating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Opening...</span>
                                    </>
                                ) : (
                                    <span>Book Session →</span>
                                )}
                            </button>

                            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#8e847c] pt-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-[#8e847c]" />
                                <span>Secure payments • Reschedule anytime</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Mobile sticky bottom booking bar */}
            <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-[#ece7e2] px-4 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-xl font-black text-[#2d2116] leading-none">{priceDisplay}</p>
                    {duration !== null && (
                        <p className="text-[11px] text-[#8e847c] mt-1">{duration} mins · 1-to-1</p>
                    )}
                </div>
                <button
                    onClick={handleBookSession}
                    disabled={!canBook || isNavigating}
                    aria-busy={isNavigating}
                    className="flex-1 max-w-[220px] py-3 bg-[#4a3426] active:scale-[0.98] text-white font-bold rounded-xl text-xs uppercase tracking-[2px] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isNavigating ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Opening...</span>
                        </>
                    ) : (
                        <span>Book Session →</span>
                    )}
                </button>
            </div>
        </div>
    );
}