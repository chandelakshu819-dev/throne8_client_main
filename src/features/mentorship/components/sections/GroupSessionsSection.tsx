"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { ArrowRight, ArrowLeft, Clock, Users, UserCheck, Zap, Video, Calendar } from "lucide-react";
import MentorService from "@/lib/api/mentorship.service";
import { useRouter } from "next/navigation";

interface GroupSessionsSectionProps {
    mentorId: string;
    mentorName: string;
    mentorImage?: string;
    mentorRole?: string;
}

export default function GroupSessionsSection({ mentorId, mentorName, mentorImage, mentorRole }: GroupSessionsSectionProps) {
    const router = useRouter();
    const [sessions, setSessions] = useState<any[]>([]);
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
            try {
                const sessionRes = await MentorService.getAllGroupSessions();
                const globalSessions = sessionRes.data?.sessions || sessionRes.data || sessionRes.sessions || [];
                setSessions(globalSessions);

                const uniqueMentorIds = Array.from(new Set(globalSessions.map((s: any) => s.mentorId))).filter(Boolean) as string[];
                const map = new Map<string, any>();
                
                if (uniqueMentorIds.length > 0) {
                    let page = 1;
                    const limit = 50;
                    let hasMore = true;

                    while (hasMore) {
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

    // Auto Play
    useEffect(() => {
        if (isHovered || sessions.length <= 1) return;
        const interval = setInterval(nextSlide, 5000); 
        return () => clearInterval(interval);
    }, [isHovered, nextSlide, sessions.length]);


    const handleSessionClick = (sessionId: string) => {
        router.push(`/mentorship/group-session/${sessionId}`);
    };

    if (loading) {
        return (
            <section className="py-16 px-6">
                <div className="max-w-[1400px] mx-auto text-center">
                    <p className="text-[#596396]">Loading group sessions...</p>
                </div>
            </section>
        );
    }

    if (sessions.length === 0) {
        return null; // Empty state
    }

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
    const shouldCarousel = sessions.length > visibleCardsCount;

    const preClones = shouldCarousel ? getClones([...sessions].reverse(), 3).reverse() : [];
    const postClones = shouldCarousel ? getClones(sessions, 3) : [];
    const displayItems = shouldCarousel ? [...preClones, ...sessions, ...postClones] : sessions;

    return (
        <section className="pt-4 pb-12 px-4 md:px-6">
            <div className="max-w-[1400px] mx-auto bg-[#fdfbf9] rounded-[48px] border border-[#f0edea] shadow-sm overflow-hidden p-8 md:p-12">
                {/* Header Row */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                    <div className="flex-grow pr-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#f4ece1] rounded-full text-[#8b7355] text-xs font-bold uppercase tracking-wider mb-6">
                            <Users className="w-3.5 h-3.5" />
                            Group Sessions
                        </div>
                        <h2 className="text-[32px] md:text-5xl font-black tracking-tight text-[#2d2116] mb-4 xl:whitespace-nowrap">
                            Live Group Sessions
                        </h2>
                    </div>
                    {/* Top Right Action (No Navigation Arrows) */}
                    <div className="flex flex-col items-end gap-6">
                        {mentorId && (
                            <button 
                                onClick={() => router.push(`/mentorship/group-sessions`)}
                                className="flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-full border border-[#e2d5c8] text-[#5a4a3e] font-bold text-sm hover:bg-[#8b7355] hover:text-white hover:border-[#8b7355] transition-all duration-300"
                            >
                                View all group sessions
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Infinite Carousel Window */}
                <div 
                    className={`relative w-full overflow-hidden -mx-3 px-3 pt-4 pb-8 ${shouldCarousel ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
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
                        className={`flex w-full ${!shouldCarousel ? 'flex-wrap' : ''}`}
                        style={shouldCarousel ? {
                            transform: `translateX(-${currentIndex * cardWidthPercent}%)`,
                            transition: isTransitioning ? 'transform 0.5s ease-in-out' : 'none',
                            willChange: 'transform'
                        } : {}}
                    >
                        {displayItems.map((session, index) => {
                            const uniqueKey = `carousel-group-session-${session.sessionId || session._id || session.id}-${index}`;
                            
                            // Dynamically resolve exact Host data in O(1)
                            const hostData = mentorMap.get(session.mentorId);
                            const hostName = hostData 
                                ? `${hostData.user?.firstName || ''} ${hostData.user?.lastName || ''}`.trim()
                                : "Mentor";
                            const hostPic = hostData?.profilePic || hostData?.user?.profilePic || "";

                            return (
                                <div 
                                    key={uniqueKey}
                                    style={{ width: `${cardWidthPercent}%` }}
                                    className="flex-shrink-0 px-3"
                                    onClick={(e) => {
                                        if (Math.abs(dragDistance.current) > 10) {
                                            e.stopPropagation();
                                            return;
                                        }
                                        handleSessionClick(session.sessionId || session._id || session.id);
                                    }}
                                >
                                    <div className="group flex flex-col bg-white rounded-[32px] overflow-hidden border border-[#ece7e2] shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 h-full min-h-[420px] pointer-events-auto">
                                        {/* Top Image Area */}
                                        <div className="relative w-full h-[180px] bg-gradient-to-br from-[#f4ece1] to-[#e2d5c8] overflow-hidden flex-shrink-0">
                                            {session.thumbnailImage || session.thumbnail ? (
                                                <img 
                                                    src={session.thumbnailImage || session.thumbnail} 
                                                    alt={session.title || "Group Session"}
                                                    draggable={false}
                                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 bg-[#f4ece1] flex items-center justify-center p-8">
                                                    <div className="w-full h-full border border-[#e2d5c8] rounded-2xl bg-gradient-to-tr from-[#f4ece1] to-white opacity-50"></div>
                                                </div>
                                            )}
                                            
                                            <div className="absolute top-4 left-4 bg-[#8b7355]/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
                                                <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                                                    {session.topic || session.category || 'Session'}
                                                </span>
                                            </div>
                                            
                                            {session.maxParticipants && (
                                                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
                                                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                                                        {session.maxParticipants} Seats
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Content Area */}
                                        <div className="flex flex-col p-6 flex-grow">
                                            <div className="flex items-center gap-3 mb-4">
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
                                                <span className="text-sm font-bold text-[#2d2116] leading-tight">
                                                    {hostName}
                                                </span>
                                            </div>

                                            <h3 className="text-lg font-black text-[#2d2116] leading-tight mb-3 group-hover:text-[#8b7355] transition-colors line-clamp-2">
                                                {session.title}
                                            </h3>
                                            
                                            <p className="text-sm text-[#8e847c] line-clamp-2 mb-6">
                                                {session.description || "Interactive group session led by an expert mentor."}
                                            </p>

                                            <div className="flex items-center gap-4 mb-6 mt-auto">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4 text-[#8b7355]" />
                                                    <span className="text-xs font-bold text-[#2d2116]">
                                                        {session.scheduledAt ? new Date(session.scheduledAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBA'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-4 h-4 text-[#8b7355]" />
                                                    <span className="text-xs font-bold text-[#2d2116]">
                                                        {session.duration ? `${session.duration} mins` : 'TBA'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mt-auto flex items-center justify-between border-t border-[#ece7e2] pt-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-[#2d2116]">
                                                        {session.pricing?.pricePerPerson === 0 
                                                            ? 'Free' 
                                                            : session.pricing?.pricePerPerson 
                                                                ? `₹${session.pricing.pricePerPerson}` 
                                                                : 'Price not available'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">/ person</span>
                                                </div>
                                                
                                                <div className="px-5 py-2.5 bg-transparent border border-[#ece7e2] hover:bg-[#f9f5f0] text-[#8b7355] text-xs font-bold rounded-xl transition-colors duration-300 flex items-center gap-2">
                                                    Reserve Seat
                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                </div>
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
