"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { ArrowRight, Clock, Users, Calendar } from "lucide-react";
import MentorService from "@/lib/api/mentorship.service";
import { useRouter } from "next/navigation";

interface GroupSessionsSectionProps {
    mentorId?: string;
    mentorName?: string;
    mentorImage?: string;
    mentorRole?: string;
}

const DEFAULT_GROUP_SESSIONS = [
    {
        _id: "6a8ab06501c4c09c134479af",
        sessionId: "b2960493-db2f-44d7-88cf-156bcb16c539",
        mentorId: "016b0f23-3546-43b4-8743-d67061caf5f3",
        title: "Live Engineering Leadership & System Design",
        description: "Interactive live cohort diving into scalable backend architecture, microservices, and system reliability.",
        thumbnailImage: "https://res.cloudinary.com/dft8cyjtt/image/upload/v1787474019/group-session-thumbnails/group_session_b3571692-eaf2-43fe-9182-383f93f19061_1787474018652.jpg",
        topic: "Architecture Design",
        duration: 60,
        maxParticipants: 10,
        pricing: { pricePerPerson: 600 },
        host: {
            name: "Abhishek Meena",
            image: "https://res.cloudinary.com/dft8cyjtt/image/upload/v1787299188/mentor-profiles/mentor_b3571692-eaf2-43fe-9182-383f93f19061_1787299188031.jpg"
        }
    },
    {
        _id: "6a8d796f39edcab27cbfc769",
        sessionId: "95fff271-c939-44c1-9913-d257e48d00bf",
        mentorId: "ae865993-66eb-4cdb-9313-a488720257df",
        title: "Production Web Applications & Cloud Architecture",
        description: "Hands-on walkthrough of production web services, CI/CD pipelines, and high availability systems.",
        thumbnailImage: "https://res.cloudinary.com/dft8cyjtt/image/upload/v1787656558/group-session-thumbnails/group_session_938a4778-e61a-4cc3-8c7c-d5df84a0a86a_1787656557573.png",
        topic: "Cloud Architecture",
        duration: 60,
        maxParticipants: 5,
        pricing: { pricePerPerson: 600 },
        host: {
            name: "Sarah Jenkins",
            image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400"
        }
    },
    {
        _id: "6aa133b08f8c14c8b6c09468",
        sessionId: "6a208f24-d0a8-4dc7-ad20-f3758e7deb99",
        mentorId: "3c140ebf-ae87-4acf-89b0-397e5946c151",
        title: "React System Design & Frontend Masterclass",
        description: "Interactive session focusing on complex state management, clean architecture, and frontend scalability.",
        thumbnailImage: "https://res.cloudinary.com/ddwiwu2ko/image/upload/v1788949424/group-session-thumbnails/group_session_8ca13970-2a2e-4051-bed4-8e4f301096ef_1788949423418.jpg",
        topic: "React System Design",
        duration: 48,
        maxParticipants: 4,
        pricing: { pricePerPerson: 692 },
        host: {
            name: "Steve Byres",
            image: "https://res.cloudinary.com/ddwiwu2ko/image/upload/v1788940783/mentor-profiles/mentor_8ca13970-2a2e-4051-bed4-8e4f301096ef_1788940782999.jpg"
        }
    }
];

export default function GroupSessionsSection({ mentorId, mentorName, mentorImage, mentorRole }: GroupSessionsSectionProps) {
    const router = useRouter();
    const [sessions, setSessions] = useState<any[]>(DEFAULT_GROUP_SESSIONS);
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
                const sessionRes = await MentorService.getAllGroupSessions();
                const globalSessions = Array.isArray(sessionRes?.data)
                    ? sessionRes.data
                    : Array.isArray(sessionRes?.data?.sessions)
                    ? sessionRes.data.sessions
                    : Array.isArray(sessionRes?.sessions)
                    ? sessionRes.sessions
                    : Array.isArray(sessionRes)
                    ? sessionRes
                    : [];

                if (globalSessions.length > 0) {
                    setSessions(globalSessions);
                }

                const uniqueMentorIds = Array.from(new Set(globalSessions.map((s: any) => s.mentorId))).filter(Boolean) as string[];
                const map = new Map<string, any>();

                if (uniqueMentorIds.length > 0) {
                    let page = 1;
                    const limit = 50;
                    let hasMore = true;

                    while (hasMore && page <= 5) {
                        const mRes = await MentorService.getAllMentors({ page, limit });
                        const list = Array.isArray(mRes.data) ? mRes.data : (mRes.data?.mentors || []);

                        if (!list || list.length === 0) {
                            hasMore = false;
                        } else {
                            list.forEach((m: any) => {
                                if (m.mentorId) map.set(m.mentorId, m);
                            });
                            const allFound = uniqueMentorIds.every(id => map.has(id));
                            if (list.length < limit || allFound) {
                                hasMore = false;
                            }
                        }
                        page++;
                    }
                }

                setMentorMap(map);
            } catch (error) {
                console.error("Failed to load group sessions marketplace", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Layout configuration
    useEffect(() => {
        const updateWidth = () => {
            if (window.innerWidth < 640) setCardWidthPercent(100);
            else if (window.innerWidth < 1024) setCardWidthPercent(50);
            else setCardWidthPercent(100 / 3);
        };
        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    // Slider Controls
    const nextSlide = useCallback(() => {
        if (isTransitioning || sessions.length === 0) return;
        setIsTransitioning(true);
        setCurrentIndex(prev => prev + 1);

        setTimeout(() => {
            setIsTransitioning(false);
            setCurrentIndex(prev => {
                if (prev >= 3 + sessions.length) return prev - sessions.length;
                return prev;
            });
        }, 500);
    }, [isTransitioning, sessions.length]);

    const prevSlide = useCallback(() => {
        if (isTransitioning || sessions.length === 0) return;
        setIsTransitioning(true);
        setCurrentIndex(prev => prev - 1);

        setTimeout(() => {
            setIsTransitioning(false);
            setCurrentIndex(prev => {
                if (prev <= 2) return prev + sessions.length;
                return prev;
            });
        }, 500);
    }, [isTransitioning, sessions.length]);

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

        const threshold = 30; // Swipe threshold
        if (e.deltaX > threshold) {
            isWheelScrolling.current = true;
            nextSlide();
            setTimeout(() => { isWheelScrolling.current = false; }, 800);
        } else if (e.deltaX < -threshold) {
            isWheelScrolling.current = true;
            prevSlide();
            setTimeout(() => { isWheelScrolling.current = false; }, 800);
        }
    };

    const effectiveSessions = sessions.length > 0 ? sessions : DEFAULT_GROUP_SESSIONS;

    // Auto Play
    useEffect(() => {
        if (isHovered || effectiveSessions.length <= 1) return;
        const interval = setInterval(nextSlide, 5000);
        return () => clearInterval(interval);
    }, [isHovered, nextSlide, effectiveSessions.length]);

    const handleSessionClick = (sessionId: string) => {
        router.push(`/mentorship/group-session/${sessionId}`);
    };

    // Prepare Infinite Loop Array (Buffer 3 on left, 3 on right)
    const getClones = (arr: any[], count: number) => {
        if (arr.length === 0) return [];
        let clones: any[] = [];
        while (clones.length < count) {
            clones = [...clones, ...arr];
        }
        return clones.slice(0, count);
    };

    const visibleCardsCount = Math.round(100 / cardWidthPercent);
    const shouldCarousel = effectiveSessions.length > visibleCardsCount;

    const preClones = shouldCarousel ? getClones([...effectiveSessions].reverse(), 3).reverse() : [];
    const postClones = shouldCarousel ? getClones(effectiveSessions, 3) : [];
    const displayItems = shouldCarousel ? [...preClones, ...effectiveSessions, ...postClones] : effectiveSessions;

    return (
        /* Same wrapper as MentorshipServicesSection: pt-6 pb-12, max-w-[1240px], no outer panel */
        <section className="pt-6 pb-12 px-4 md:px-6">
            <div className="max-w-[1240px] mx-auto">
                {/* ── SECTION HEADER (same sizes as the 1-to-1 header) ───────────── */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-3.5">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-[#f4ece1] rounded-full text-[#4a3728] text-[11px] font-bold uppercase tracking-wider mb-2">
                            <Users className="w-3 h-3" />
                            Group Sessions
                        </div>
                        <h2 className="text-2xl sm:text-3xl md:text-[34px] font-black tracking-tight text-[#2d2116] leading-tight">
                            Live Group Sessions
                        </h2>
                        <p className="text-[#8e847c] text-xs sm:text-sm font-medium mt-1 max-w-2xl">
                            Join live cohorts led by expert mentors and learn alongside other members.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => router.push("/mentorship/group-sessions")}
                        className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#e2d5c8] bg-white text-[#4a3728] font-bold text-xs hover:bg-[#8b7355] hover:text-white hover:border-[#8b7355] transition-all duration-200 shadow-xs"
                    >
                        <span>View all group sessions</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* ── CAROUSEL / 3-COLUMN CARDS WINDOW ─────────────────── */}
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
                        {displayItems.map((session, index) => {
                            const sessionId = session.sessionId || session._id || session.id;
                            const uniqueKey = `carousel-group-session-${sessionId}-${index}`;

                            // Host resolution (same approach as the 1-to-1 section)
                            const hostData = mentorMap.get(session.mentorId) || (session as any).host;
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

                            const isOnline =
                                hostData?.isOnline ??
                                hostData?.isAvailable ??
                                (hostData?.status === "active");

                            // Tags (topic + skills), same idea as the 1-to-1 card
                            const tags: string[] = [];
                            const addTag = (t?: string) => {
                                if (t && !tags.some((x) => x.toLowerCase() === t.toLowerCase())) tags.push(t);
                            };
                            addTag(session.topic || session.category);
                            if (Array.isArray(session.skills)) session.skills.forEach(addTag);
                            else if (Array.isArray(hostData?.skills)) hostData.skills.forEach(addTag);
                            const displayTags = tags.slice(0, 2);

                            const priceDisplay =
                                session.pricing?.pricePerPerson === 0
                                    ? "Free"
                                    : session.pricing?.pricePerPerson
                                    ? `₹${session.pricing.pricePerPerson}`
                                    : "Price not available";

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
                                        handleSessionClick(sessionId);
                                    }}
                                >
                                    {/* ── CARD CONTAINER (same radius, shadow, hover as the 1-to-1 card) ── */}
                                    <div className="group flex flex-col bg-white hover:bg-[#FDFBF7] rounded-[20px] sm:rounded-[22px] overflow-hidden border border-[#ece7e2] hover:border-[#8b7355]/40 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full pointer-events-auto cursor-pointer">
                                        {/* ── THUMBNAIL (130 / 138px) ── */}
                                        <div className="relative w-full h-[130px] sm:h-[138px] bg-[#f4ece1] overflow-hidden flex-shrink-0">
                                            {session.thumbnailImage || session.thumbnail ? (
                                                <img
                                                    src={session.thumbnailImage || session.thumbnail}
                                                    alt={session.title || "Group Session"}
                                                    draggable={false}
                                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 bg-[#f4ece1] flex items-center justify-center p-4">
                                                    <div className="w-full h-full border border-[#e2d5c8] rounded-lg bg-gradient-to-tr from-[#f4ece1] to-white opacity-60" />
                                                </div>
                                            )}

                                            {/* Topic Badge */}
                                            <div className="absolute top-2.5 left-2.5 bg-[#4a3728]/75 backdrop-blur-md px-2.5 py-0.5 rounded-full shadow-xs z-10">
                                                <span className="text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-wider">
                                                    {session.topic || session.category || "Session"}
                                                </span>
                                            </div>

                                            {/* Seats Badge */}
                                            {session.maxParticipants && (
                                                <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full shadow-xs z-10 flex items-center gap-1">
                                                    <Users className="w-2.5 h-2.5 text-white/90" />
                                                    <span className="text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-wider">
                                                        {session.maxParticipants} Seats
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* ── CARD BODY (p-3.5 / p-4) ── */}
                                        <div className="flex flex-col p-3.5 sm:p-4 flex-grow">
                                            {/* Mentor info */}
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

                                            {/* Tags */}
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

                                            {/* Title */}
                                            <h3 className="text-sm sm:text-[15px] font-bold text-[#2d2116] leading-snug mb-1.5 group-hover:text-[#4a3728] transition-colors line-clamp-2">
                                                {session.title}
                                            </h3>

                                            {/* Description */}
                                            <p className="text-[11px] sm:text-xs text-[#8e847c] line-clamp-2 leading-relaxed mb-3">
                                                {session.description || "Interactive group session led by an expert mentor."}
                                            </p>

                                            {/* Metadata row (date | duration) */}
                                            <div className="mt-auto pt-2.5 mb-3 flex items-center gap-2 text-[11px] sm:text-xs text-[#5a4a3e] border-t border-[#f2ede8]">
                                                <div className="flex items-center gap-1 font-semibold text-[#5a4a3e]">
                                                    <Calendar className="w-3 h-3 text-[#8b7355]" />
                                                    <span>
                                                        {session.scheduledAt
                                                            ? new Date(session.scheduledAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
                                                            : "TBA"}
                                                    </span>
                                                </div>

                                                <span className="text-[#e2dcd5]">|</span>

                                                <div className="flex items-center gap-1 font-semibold text-[#5a4a3e]">
                                                    <Clock className="w-3 h-3 text-[#8b7355]" />
                                                    <span>{session.duration ? `${session.duration} mins` : "TBA"}</span>
                                                </div>
                                            </div>

                                            {/* Footer: price + reserve (same height as the 1-to-1 button row) */}
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-baseline gap-1 min-w-0">
                                                    <span className="text-sm font-black text-[#2d2116]">{priceDisplay}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">/ person</span>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (Math.abs(dragDistance.current) > 10) return;
                                                        handleSessionClick(sessionId);
                                                    }}
                                                    className="flex-shrink-0 inline-flex items-center gap-1 py-1.5 sm:py-2 px-4 rounded-full border border-[#dcd4cb] hover:border-[#8b7355] bg-white hover:bg-[#FAF9F6] text-[#8b7355] font-bold text-xs transition-all duration-200 shadow-xs"
                                                >
                                                    Reserve Seat
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