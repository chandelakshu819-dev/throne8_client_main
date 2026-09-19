"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { ArrowRight, Clock, Calendar } from "lucide-react";
import SessionService from "@/lib/api/session.service";
import MentorService from "@/lib/api/mentorship.service";
import { useRouter } from "next/navigation";

interface MentorshipServicesSectionProps {
    mentorId?: string;
    mentorName?: string;
    mentorImage?: string;
    mentorRole?: string;
}

// ── Price Formatter (e.g., ₹9,999 or Free) ──────────────────────────────────
function formatPrice(price: any): string {
    if (price === 0 || price === "0") return "Free";
    if (price === null || price === undefined || price === "") return "Free";
    const num = Number(price);
    if (isNaN(num)) return `₹${price}`;
    return `₹${num.toLocaleString("en-IN")}`;
}

const DEFAULT_1TO1_SERVICES = [
    {
        sessionId: "606399ca-4e90-48c8-8e9c-0b2158663fbe",
        mentorId: "016b0f23-3546-43b4-8743-d67061caf5f3",
        title: "The flow you should follow",
        description: "The flow you should follow, in a way Booking List Sorting Fix. Master your system design and career trajectory.",
        duration: 60,
        pricing: { basePrice: 700 },
        category: "CAREER PLANNING",
        sessionType: "career_planning",
        thumbnailImage: "https://res.cloudinary.com/dft8cyjtt/image/upload/v1787473128/session-thumbnails/session_b3571692-eaf2-43fe-9182-383f93f19061_1787473126932.jpg",
        skills: ["Career Planning", "System Design"],
        rating: 5.0,
        sessionCount: 84,
        host: {
            name: "Abhishek Meena",
            role: "Software Engineer",
            image: "https://res.cloudinary.com/dft8cyjtt/image/upload/v1787299188/mentor-profiles/mentor_b3571692-eaf2-43fe-9182-383f93f19061_1787299188031.jpg",
            isOnline: true,
        },
    },
    {
        sessionId: "fd480e19-2641-455b-ac84-be459d754501",
        mentorId: "d9822212-a284-4a13-95ea-2aaca2867738",
        title: "Technical Interview & Live Coding",
        description: "Real interview-style practice with live feedback, systems architecture, and actionable improvement checklist.",
        duration: 60,
        pricing: { basePrice: 999 },
        category: "MOCK INTERVIEW",
        sessionType: "mock_interview",
        thumbnailImage: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=600",
        skills: ["Mock Interview", "React"],
        rating: 4.9,
        sessionCount: 62,
        host: {
            name: "Sarah Jenkins",
            role: "Staff Engineer & Tech Lead",
            image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400",
            isOnline: true,
        },
    },
    {
        sessionId: "5d991275-cc7b-47be-a51f-09820f010718",
        mentorId: "3c140ebf-ae87-4acf-89b0-397e5946c151",
        title: "Technical Query & Architecture Advisory",
        description: "Direct, focused 1-on-1 advisory solving your specific technical queries and architecture roadblocks.",
        duration: 38,
        pricing: { basePrice: 835 },
        category: "QUERY SOLVING",
        sessionType: "ask_query",
        thumbnailImage: "https://res.cloudinary.com/ddwiwu2ko/image/upload/v1788949310/session-thumbnails/session_8ca13970-2a2e-4051-bed4-8e4f301096ef_1788949310028.jpg",
        skills: ["Query Solving", "Architecture"],
        rating: 5.0,
        sessionCount: 45,
        host: {
            name: "Steve Byres",
            role: "Senior Engineer",
            image: "https://res.cloudinary.com/ddwiwu2ko/image/upload/v1788940783/mentor-profiles/mentor_8ca13970-2a2e-4051-bed4-8e4f301096ef_1788940782999.jpg",
            isOnline: false,
        },
    },
];

export default function MentorshipServicesSection({
    mentorId,
    mentorName,
    mentorImage,
    mentorRole,
}: MentorshipServicesSectionProps) {
    const router = useRouter();
    const [services, setServices] = useState<any[]>(DEFAULT_1TO1_SERVICES);
    const [mentorMap, setMentorMap] = useState<Map<string, any>>(new Map());
    const [loading, setLoading] = useState(false);

    // Infinite Carousel State
    const [currentIndex, setCurrentIndex] = useState(3);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [cardWidthPercent, setCardWidthPercent] = useState(33.333333);

    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragDistance = useRef(0);
    const isWheelScrolling = useRef(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch 1-to-1 sessions with defensive array parsing
                const sessionRes = await SessionService.getAllSessionsFromDB({ limit: 100 });
                const allSessions = Array.isArray(sessionRes?.data)
                    ? sessionRes.data
                    : Array.isArray(sessionRes?.data?.sessions)
                    ? sessionRes.data.sessions
                    : Array.isArray(sessionRes)
                    ? sessionRes
                    : [];

                const globalServices = allSessions.filter(
                    (s: any) => s.sessionType !== "group_session"
                );
                setServices(globalServices);

                const uniqueMentorIds = Array.from(
                    new Set(globalServices.map((s: any) => s.mentorId))
                ).filter(Boolean) as string[];
                const map = new Map<string, any>();

                if (uniqueMentorIds.length > 0) {
                    let page = 1;
                    const limit = 50;
                    let hasMore = true;

                    // Safety limit of 5 pages to prevent infinite loops
                    while (hasMore && page <= 5) {
                        const mRes = await MentorService.getAllMentors({ page, limit });
                        const list = Array.isArray(mRes?.data)
                            ? mRes.data
                            : Array.isArray(mRes?.data?.mentors)
                            ? mRes.data.mentors
                            : [];

                        if (!list || list.length === 0) {
                            hasMore = false;
                        } else {
                            list.forEach((m: any) => {
                                if (m.mentorId) map.set(m.mentorId, m);
                            });
                            const allFound = uniqueMentorIds.every((id) => map.has(id));
                            if (list.length < limit || allFound) {
                                hasMore = false;
                            }
                        }
                        page++;
                    }
                }
                setMentorMap(map);
            } catch (error) {
                console.error("Failed to load mentorship marketplace", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Layout configuration (responsive columns)
    useEffect(() => {
        const updateWidth = () => {
            if (window.innerWidth < 640) setCardWidthPercent(100);
            else if (window.innerWidth < 1024) setCardWidthPercent(50);
            else setCardWidthPercent(100 / 3);
        };
        updateWidth();
        window.addEventListener("resize", updateWidth);
        return () => window.removeEventListener("resize", updateWidth);
    }, []);

    // Slider Controls
    const nextSlide = useCallback(() => {
        if (isTransitioning || services.length === 0) return;
        setIsTransitioning(true);
        setCurrentIndex((prev) => prev + 1);

        setTimeout(() => {
            setIsTransitioning(false);
            setCurrentIndex((prev) => {
                if (prev >= 3 + services.length) return prev - services.length;
                return prev;
            });
        }, 500);
    }, [isTransitioning, services.length]);

    const prevSlide = useCallback(() => {
        if (isTransitioning || services.length === 0) return;
        setIsTransitioning(true);
        setCurrentIndex((prev) => prev - 1);

        setTimeout(() => {
            setIsTransitioning(false);
            setCurrentIndex((prev) => {
                if (prev <= 2) return prev + services.length;
                return prev;
            });
        }, 500);
    }, [isTransitioning, services.length]);

    // Touch & Mouse handlers
    const onDragStart = (clientX: number) => {
        dragDistance.current = 0;
        setTouchStart(clientX);
        setIsDragging(true);
    };

    const onDragMove = (clientX: number) => {
        if (!isDragging || touchStart === null) return;
        dragDistance.current = touchStart - clientX;
    };

    const onDragEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);
        if (Math.abs(dragDistance.current) > 50) {
            if (dragDistance.current > 50) nextSlide();
            else prevSlide();
        }
        setTouchStart(null);
    };

    const onMouseLeaveHandler = () => {
        setIsHovered(false);
        if (isDragging) onDragEnd();
    };

    // Trackpad / Scroll handlers
    const handleWheel = (e: React.WheelEvent) => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) return;
        if (isWheelScrolling.current || isTransitioning) return;

        const threshold = 30;
        if (e.deltaX > threshold) {
            isWheelScrolling.current = true;
            nextSlide();
            setTimeout(() => {
                isWheelScrolling.current = false;
            }, 800);
        } else if (e.deltaX < -threshold) {
            isWheelScrolling.current = true;
            prevSlide();
            setTimeout(() => {
                isWheelScrolling.current = false;
            }, 800);
        }
    };

    // Auto Play
    useEffect(() => {
        if (isHovered || services.length <= 1) return;
        const interval = setInterval(nextSlide, 5000);
        return () => clearInterval(interval);
    }, [isHovered, nextSlide, services.length]);

    const handleServiceClick = (serviceId: string) => {
        router.push(`/mentorship/service/${serviceId}`);
    };

    const effectiveServices = services.length > 0 ? services : DEFAULT_1TO1_SERVICES;

    // Infinite Loop clones
    const getClones = (arr: any[], count: number) => {
        if (arr.length === 0) return [];
        let clones: any[] = [];
        while (clones.length < count) {
            clones = [...clones, ...arr];
        }
        return clones.slice(0, count);
    };

    const visibleCardsCount = Math.round(100 / cardWidthPercent);
    const shouldCarousel = effectiveServices.length > visibleCardsCount;

    const preClones = shouldCarousel ? getClones([...effectiveServices].reverse(), 3).reverse() : [];
    const postClones = shouldCarousel ? getClones(effectiveServices, 3) : [];
    const displayItems = shouldCarousel ? [...preClones, ...effectiveServices, ...postClones] : effectiveServices;

    return (
        <section className="pt-6 pb-12 px-4 md:px-6">
            <div className="max-w-[1240px] mx-auto">
                {/* ── 13. SECTION HEADER (Reduced vertical gap) ───────────── */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-3.5">
                    <div>
                        <div className="inline-flex items-center px-3 py-0.5 bg-[#f4ece1] rounded-full text-[#4a3728] text-[11px] font-bold uppercase tracking-wider mb-2">
                            1-TO-1 MENTORSHIP
                        </div>
                        <h2 className="text-2xl sm:text-3xl md:text-[34px] font-black tracking-tight text-[#2d2116] leading-tight">
                            Explore 1-to-1 Mentorship
                        </h2>
                        <p className="text-[#8e847c] text-xs sm:text-sm font-medium mt-1 max-w-2xl">
                            Book focused sessions with mentors across skills, careers, and technology.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => router.push("/mentorship/services")}
                        className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#e2d5c8] bg-white text-[#4a3728] font-bold text-xs hover:bg-[#8b7355] hover:text-white hover:border-[#8b7355] transition-all duration-200 shadow-xs"
                    >
                        <span>View all services</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* ── 1. CAROUSEL / 3-COLUMN CARDS WINDOW ─────────────────── */}
                <div
                    className={`relative w-full overflow-hidden -mx-2.5 px-2.5 pt-1 pb-4 ${
                        shouldCarousel ? (isDragging ? "cursor-grabbing" : "cursor-grab") : ""
                    }`}
                    onMouseEnter={() => shouldCarousel && setIsHovered(true)}
                    onMouseLeave={() => shouldCarousel && onMouseLeaveHandler()}
                    onTouchStart={(e) => shouldCarousel && onDragStart(e.targetTouches[0].clientX)}
                    onTouchMove={(e) => shouldCarousel && onDragMove(e.targetTouches[0].clientX)}
                    onTouchEnd={() => shouldCarousel && onDragEnd()}
                    onMouseDown={(e) => shouldCarousel && onDragStart(e.clientX)}
                    onMouseMove={(e) => shouldCarousel && onDragMove(e.clientX)}
                    onMouseUp={() => shouldCarousel && onDragEnd()}
                    onWheel={(e) => shouldCarousel && handleWheel(e)}
                >
                    <div
                        className={`flex w-full ${!shouldCarousel ? "flex-wrap" : ""}`}
                        style={
                            shouldCarousel
                                ? {
                                      transform: `translateX(-${currentIndex * cardWidthPercent}%)`,
                                      transition: isTransitioning ? "transform 0.5s ease-in-out" : "none",
                                      willChange: "transform",
                                  }
                                : {}
                        }
                    >
                        {displayItems.map((service, index) => {
                            const serviceId = service.sessionId || service._id || service.id;
                            const uniqueKey = `carousel-item-${serviceId}-${index}`;

                            // Host profile resolution
                            const hostData = mentorMap.get(service.mentorId) || (service as any).host;
                            const hostName = hostData?.name
                                ? hostData.name
                                : hostData?.user
                                ? `${hostData.user?.firstName || ""} ${hostData.user?.lastName || ""}`.trim()
                                : mentorName || "Industry Mentor";

                            const hostRole =
                                hostData?.role ||
                                hostData?.experience?.currentRole ||
                                hostData?.headline ||
                                hostData?.currentRole ||
                                mentorRole ||
                                "Senior Professional";

                            const hostPic =
                                hostData?.image ||
                                hostData?.profilePic ||
                                hostData?.user?.profilePic ||
                                mentorImage ||
                                "";

                            const hostUserId =
                                hostData?.mentorId ||
                                hostData?.userId ||
                                hostData?._id ||
                                hostData?.user?.userId ||
                                hostData?.user?.id ||
                                hostData?.user?._id ||
                                service.mentorId ||
                                service.userId;

                            const isOnline =
                                hostData?.isOnline ??
                                hostData?.isAvailable ??
                                (hostData?.status === "active");

                            // Badges & Labels
                            const topCategory = (
                                service.category ||
                                service.sessionType?.replace(/_/g, " ") ||
                                "CAREER PLANNING"
                            ).toUpperCase();

                            const durationMinutes = service.duration || 60;
                            const topDurationBadge = `${durationMinutes} MINS`;
                            const durationText = `${durationMinutes} mins`;
                            const priceDisplay = formatPrice(service.pricing?.basePrice);

                            // Dynamic Tags (Category + Topics/Skills)
                            const tags: string[] = [];
                            const categoryTag =
                                service.category || service.sessionType?.replace(/_/g, " ");
                            if (categoryTag) tags.push(categoryTag);

                            if (Array.isArray(service.skills)) {
                                service.skills.forEach((s: string) => {
                                    if (s && !tags.some((t) => t.toLowerCase() === s.toLowerCase())) {
                                        tags.push(s);
                                    }
                                });
                            } else if (service.skill && !tags.some((t) => t.toLowerCase() === service.skill.toLowerCase())) {
                                tags.push(service.skill);
                            } else if (service.topic && !tags.some((t) => t.toLowerCase() === service.topic.toLowerCase())) {
                                tags.push(service.topic);
                            } else if (Array.isArray(hostData?.skills)) {
                                hostData.skills.forEach((s: string) => {
                                    if (s && !tags.some((t) => t.toLowerCase() === s.toLowerCase())) {
                                        tags.push(s);
                                    }
                                });
                            }
                            const displayTags = tags.slice(0, 2);

                            // Rating & Sessions (from actual data only)
                            const rawRating =
                                hostData?.stats?.averageRating ??
                                hostData?.rating ??
                                service.rating ??
                                5.0;
                            const rawSessions =
                                hostData?.stats?.totalSessions ??
                                hostData?.totalSessions ??
                                service.sessionCount;

                            const hasRating = typeof rawRating === "number" && rawRating > 0;
                            const hasSessions = typeof rawSessions === "number" && rawSessions > 0;

                            const thumbnail = service.thumbnailImage || service.thumbnail;

                            return (
                                <div
                                    key={uniqueKey}
                                    style={{ width: `${cardWidthPercent}%` }}
                                    className="flex-shrink-0 px-2 sm:px-2.5"
                                    onClick={(e) => {
                                        if (Math.abs(dragDistance.current) > 10) {
                                            e.stopPropagation();
                                            return;
                                        }
                                        handleServiceClick(serviceId);
                                    }}
                                >
                                    {/* ── 3. CARD CONTAINER (20-22px radius, natural flex height, rich hover transition) ── */}
                                    <div className="group flex flex-col bg-white hover:bg-[#FDFBF7] rounded-[20px] sm:rounded-[22px] overflow-hidden border border-[#ece7e2] hover:border-[#8b7355]/40 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full pointer-events-auto cursor-pointer">
                                        {/* ── 2. COMPACT THUMBNAIL (130-138px height) ── */}
                                        <div className="relative w-full h-[130px] sm:h-[138px] bg-[#f4ece1] overflow-hidden flex-shrink-0">
                                            {thumbnail ? (
                                                <img
                                                    src={thumbnail}
                                                    alt={service.title || "Mentorship Service"}
                                                    draggable={false}
                                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 bg-[#f4ece1] flex items-center justify-center p-4">
                                                    <div className="w-full h-full border border-[#e2d5c8] rounded-lg bg-gradient-to-tr from-[#f4ece1] to-white opacity-60" />
                                                </div>
                                            )}

                                            {/* Category Badge */}
                                            <div className="absolute top-2.5 left-2.5 bg-[#4a3728]/75 backdrop-blur-md px-2.5 py-0.5 rounded-full shadow-xs z-10">
                                                <span className="text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-wider">
                                                    {topCategory}
                                                </span>
                                            </div>

                                            {/* Duration Badge */}
                                            <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full shadow-xs z-10 flex items-center gap-1">
                                                <Clock className="w-2.5 h-2.5 text-white/90" />
                                                <span className="text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-wider">
                                                    {topDurationBadge}
                                                </span>
                                            </div>
                                        </div>

                                        {/* ── 4. CARD BODY (Compact p-4 padding) ── */}
                                        <div className="flex flex-col p-3.5 sm:p-4 flex-grow">
                                            {/* ── 5. MENTOR INFO (Compact 32px avatar) ── */}
                                            <div className="flex items-center gap-2.5 mb-2.5">
                                                <div className="relative flex-shrink-0">
                                                    {hostPic ? (
                                                        <img
                                                            src={hostPic}
                                                            alt={hostName}
                                                            draggable={false}
                                                            className="w-8 h-8 rounded-full object-cover border border-[#ece7e2]"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-[#f4ece1] text-[#8b7355] flex items-center justify-center font-bold border border-[#ece7e2] text-xs">
                                                            {hostName ? hostName.charAt(0).toUpperCase() : "M"}
                                                        </div>
                                                    )}
                                                    {isOnline && (
                                                        <span
                                                            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full shadow-xs"
                                                            title="Online"
                                                        />
                                                    )}
                                                </div>

                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm sm:text-[15px] font-bold text-[#2d2116] leading-tight truncate">
                                                        {hostName}
                                                    </span>
                                                    <span className="text-[11px] text-[#8e847c] font-medium leading-tight truncate mt-0.5">
                                                        {hostRole}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* ── 6. SERVICE TAGS (Subtle compact pills) ── */}
                                            {displayTags.length > 0 && (
                                                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                                                    {displayTags.map((tag, tagIdx) => (
                                                        <span
                                                            key={tagIdx}
                                                            className="px-2 py-0.5 bg-[#FAF8F5] border border-[#ece7e2] text-[#786c62] text-[10px] font-medium rounded-full capitalize"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* ── 7. SERVICE TITLE (text-sm/15px, tight leading) ── */}
                                            <h3 className="text-sm sm:text-[15px] font-bold text-[#2d2116] leading-snug mb-1.5 group-hover:text-[#4a3728] transition-colors line-clamp-2">
                                                {service.title || "Mentorship Session"}
                                            </h3>

                                            {/* ── 8. DESCRIPTION (Tight line-clamp-2) ── */}
                                            <p className="text-[11px] sm:text-xs text-[#8e847c] line-clamp-2 leading-relaxed mb-3">
                                                {service.description ||
                                                    "A personalized 1-to-1 session designed to help you achieve your specific goals."}
                                            </p>

                                            {/* ── 9. METADATA ROW (Compact horizontal strip) ── */}
                                            <div className="mt-auto pt-2.5 mb-3 flex items-center gap-2 text-[11px] sm:text-xs text-[#5a4a3e] border-t border-[#f2ede8]">
                                                <div className="flex items-center gap-1 font-semibold text-[#5a4a3e]">
                                                    <Calendar className="w-3 h-3 text-[#8b7355]" />
                                                    <span>{durationText}</span>
                                                </div>

                                                <span className="text-[#e2dcd5]">|</span>

                                                <span className="font-bold text-[#2d2116]">
                                                    {priceDisplay}
                                                </span>

                                                {hasRating && (
                                                    <>
                                                        <span className="text-[#e2dcd5]">|</span>
                                                        <div className="flex items-center gap-1 font-semibold text-[#c4963a]">
                                                            <span>⭐</span>
                                                            <span>{rawRating.toFixed(1)}</span>
                                                            {hasSessions && (
                                                                <span className="text-[#8e847c] font-normal text-[10px]">
                                                                    ({rawSessions})
                                                                </span>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {/* ── 10. BUTTONS (Height 36-38px, compact & elegant) ── */}
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (Math.abs(dragDistance.current) > 10) return;
                                                        const targetId = hostUserId && hostUserId !== "undefined" ? hostUserId : "";
                                                        if (targetId) {
                                                            router.push(`/mentorship/${targetId}`);
                                                        } else {
                                                            router.push('/mentorship');
                                                        }
                                                    }}
                                                    className="flex-1 py-1.5 sm:py-2 px-2.5 rounded-full border border-[#dcd4cb] hover:border-[#8b7355] bg-white hover:bg-[#FAF9F6] text-[#4a3728] font-bold text-xs text-center transition-all duration-200 shadow-xs"
                                                >
                                                    View Profile
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (Math.abs(dragDistance.current) > 10) return;
                                                        router.push(`/mentorship/service/${serviceId}`);
                                                    }}
                                                    className="flex-1 py-1.5 sm:py-2 px-2.5 rounded-full bg-[#4a3728] hover:bg-[#38291e] text-white font-bold text-xs text-center transition-all duration-200 flex items-center justify-center gap-1 shadow-xs hover:shadow"
                                                >
                                                    <span>Book Session</span>
                                                    <ArrowRight className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
