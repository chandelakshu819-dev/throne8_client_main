"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { ArrowRight, Clock, Calendar } from "lucide-react";
import SeniorSessionService from "@/lib/api/seniorSession.service";
import MentorService from "@/lib/api/mentorship.service";
import { useRouter } from "next/navigation";

// ── Price Formatter (e.g., ₹9,999 or Free) ──────────────────────────────────
function formatPrice(price: any): string {
    if (price === 0 || price === "0") return "Free";
    if (price === null || price === undefined || price === "") return "Free";
    const num = Number(price);
    if (isNaN(num)) return `₹${price}`;
    return `₹${num.toLocaleString("en-IN")}`;
}

export default function SeniorMentorshipServicesSection() {
    const router = useRouter();
    const [services, setServices] = useState<any[]>([]);
    const [mentorMap, setMentorMap] = useState<Map<string, any>>(new Map());
    const [loading, setLoading] = useState(true);

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
            console.log("SeniorMentorshipServicesSection mounted. Fetching data...");
            try {
                const sessionRes = await SeniorSessionService.getAllDiscoverySessions();
                console.log("SeniorSessionService API response:", sessionRes);
                
                const allSessions = Array.isArray(sessionRes?.data)
                    ? sessionRes.data
                    : Array.isArray(sessionRes)
                    ? sessionRes
                    : [];

                console.log("Mapped allSessions count:", allSessions.length);
                if (allSessions.length > 0) {
                    console.log("First session from backend:", JSON.stringify(allSessions[0], null, 2));
                }

                // Removed sessionType filter because older documents might be missing the field entirely.
                // Or if it evaluates to undefined because the model didn't fetch it, we don't want it silent failing.
                const globalServices = allSessions;
                
                console.log("globalServices (rendered) count:", globalServices.length);
                setServices(globalServices);

                const uniqueMentorIds = Array.from(
                    new Set(globalServices.map((s: any) => s.mentorId))
                ).filter(Boolean) as string[];
                const map = new Map<string, any>();

                if (uniqueMentorIds.length > 0) {
                    let page = 1;
                    const limit = 50;
                    let hasMore = true;

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
                console.error("Failed to load senior mentorship marketplace", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

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

    useEffect(() => {
        if (isHovered || services.length <= 1) return;
        const interval = setInterval(nextSlide, 5000);
        return () => clearInterval(interval);
    }, [isHovered, nextSlide, services.length]);

    const handleServiceClick = (serviceId: string) => {
        router.push(`/mentorship/senior-service/${serviceId}`);
    };

    if (loading) {
        return (
            <section className="py-12 px-4 md:px-6">
                <div className="max-w-[1240px] mx-auto text-center">
                    <div className="inline-block w-7 h-7 border-2 border-[#8b7355] border-t-transparent rounded-full animate-spin mb-2.5" />
                    <p className="text-xs font-medium text-[#8b7355]">Loading senior services...</p>
                </div>
            </section>
        );
    }

    if (services.length === 0) {
        return (
            <section className="pt-6 pb-12 px-4 md:px-6">
                <div className="max-w-[1240px] mx-auto text-center py-16 bg-white border border-[#ece7e2] rounded-[32px] shadow-sm flex flex-col items-center">
                    <div className="w-16 h-16 bg-[#f4ece1] text-[#8b7355] rounded-full flex items-center justify-center mb-4">
                        <Calendar className="w-7 h-7" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-[#2d2116] mb-2">Explore Senior Mentorship</h2>
                    <p className="text-[#8e847c] text-sm max-w-md mx-auto">
                        No Senior Mentor sessions available right now. Check back soon for exclusive 1-to-1 sessions with industry leaders.
                    </p>
                </div>
            </section>
        );
    }

    const getClones = (arr: any[], count: number) => {
        if (arr.length === 0) return [];
        let clones: any[] = [];
        while (clones.length < count) {
            clones = [...clones, ...arr];
        }
        return clones.slice(0, count);
    };

    const visibleCardsCount = Math.round(100 / cardWidthPercent);
    const shouldCarousel = services.length > visibleCardsCount;

    const preClones = shouldCarousel ? getClones([...services].reverse(), 3).reverse() : [];
    const postClones = shouldCarousel ? getClones(services, 3) : [];
    const displayItems = shouldCarousel ? [...preClones, ...services, ...postClones] : services;

    return (
        <section className="pt-6 pb-12 px-4 md:px-6">
            <div className="max-w-[1240px] mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-3.5">
                    <div>
                        <div className="inline-flex items-center px-3 py-0.5 bg-[#f4ece1] rounded-full text-[#4a3728] text-[11px] font-bold uppercase tracking-wider mb-2">
                            SENIOR MENTORSHIP
                        </div>
                        <h2 className="text-2xl sm:text-3xl md:text-[34px] font-black tracking-tight text-[#2d2116] leading-tight">
                            Learn from Senior Mentors
                        </h2>
                        <p className="text-[#8e847c] text-xs sm:text-sm font-medium mt-1 max-w-2xl">
                            Book focused 1-to-1 sessions with experienced professionals and industry experts.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => router.push("/mentorship/senior-services")}
                        className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#e2d5c8] bg-white text-[#4a3728] font-bold text-xs hover:bg-[#8b7355] hover:text-white hover:border-[#8b7355] transition-all duration-200 shadow-xs"
                    >
                        <span>View all services</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>

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

                            const hostData = mentorMap.get(service.mentorId);
                            const hostName = hostData
                                ? `${hostData.user?.firstName || ""} ${hostData.user?.lastName || ""}`.trim()
                                : "Senior Mentor";

                            const hostRole =
                                hostData?.experience?.currentRole ||
                                hostData?.headline ||
                                hostData?.currentRole ||
                                "Senior Professional";

                            const hostPic =
                                hostData?.profilePic ||
                                hostData?.user?.profilePic ||
                                "";

                            const isOnline =
                                hostData?.isOnline ??
                                hostData?.isAvailable ??
                                (hostData?.status === "active");

                            const topCategory = (
                                service.category ||
                                service.sessionType?.replace(/_/g, " ") ||
                                "CAREER PLANNING"
                            ).toUpperCase();

                            const durationMinutes = service.duration || 60;
                            const topDurationBadge = `${durationMinutes} MINS`;
                            const durationText = `${durationMinutes} mins`;
                            const priceDisplay = formatPrice(service.pricing?.basePrice);

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
                            }
                            const displayTags = tags.slice(0, 2);

                            const rawRating = hostData?.stats?.averageRating ?? hostData?.rating ?? service.rating;
                            const rawSessions = hostData?.stats?.totalSessions ?? hostData?.totalSessions ?? service.sessionCount;

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
                                    <div className="group flex flex-col bg-white rounded-[20px] sm:rounded-[22px] overflow-hidden border border-[#ece7e2] shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 h-full pointer-events-auto cursor-pointer">
                                        <div className="relative w-full h-[130px] sm:h-[138px] bg-[#eef1f6] overflow-hidden flex-shrink-0">
                                            {thumbnail ? (
                                                <img
                                                    src={thumbnail}
                                                    alt={service.title || "Senior Session"}
                                                    draggable={false}
                                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 bg-[#f4ece1] flex items-center justify-center p-4">
                                                    <div className="w-full h-full border border-[#d5dde2] rounded-lg bg-gradient-to-tr from-[#f4ece1] to-[#e4ebf1] opacity-60" />
                                                </div>
                                            )}

                                            <div className="absolute top-2.5 left-2.5 bg-[#1b2b3a]/80 backdrop-blur-md px-2.5 py-0.5 rounded-full shadow-xs z-10">
                                                <span className="text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-wider">
                                                    {topCategory}
                                                </span>
                                            </div>

                                            <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full shadow-xs z-10 flex items-center gap-1">
                                                <Clock className="w-2.5 h-2.5 text-white/90" />
                                                <span className="text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-wider">
                                                    {topDurationBadge}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col p-3.5 sm:p-4 flex-grow">
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
                                                        <div className="w-8 h-8 rounded-full bg-[#f4ece1] text-[#3a5266] flex items-center justify-center font-bold border border-[#ece7e2] text-xs">
                                                            {hostName ? hostName.charAt(0).toUpperCase() : "S"}
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

                                            <h3 className="text-sm sm:text-[15px] font-bold text-[#1b2b3a] leading-snug mb-1.5 group-hover:text-[#2d4766] transition-colors line-clamp-2">
                                                {service.title || "Senior Session"}
                                            </h3>

                                            <p className="text-[11px] sm:text-xs text-[#8e847c] line-clamp-2 leading-relaxed mb-3">
                                                {service.description ||
                                                    "A personalized 1-to-1 session designed to help you achieve your specific goals."}
                                            </p>

                                            <div className="mt-auto pt-2.5 mb-3 flex items-center gap-2 text-[11px] sm:text-xs text-[#5a4a3e] border-t border-[#f2ede8]">
                                                <div className="flex items-center gap-1 font-semibold text-[#5a4a3e]">
                                                    <Calendar className="w-3 h-3 text-[#3a5266]" />
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

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (Math.abs(dragDistance.current) > 10) return;
                                                        router.push(`/mentorship/senior-service/${serviceId}`);
                                                    }}
                                                    className="flex-1 py-1.5 sm:py-2 px-2.5 rounded-full bg-[#1b2b3a] hover:bg-[#111c26] text-white font-bold text-xs text-center transition-all duration-200 flex items-center justify-center gap-1 shadow-xs hover:shadow"
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
