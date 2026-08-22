"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { ArrowRight, ArrowLeft, Clock, Video, User, Star, ShieldCheck, MessageCircle, Calendar, Briefcase, IndianRupee } from "lucide-react";
import SessionService from "@/lib/api/session.service";
import MentorService from "@/lib/api/mentorship.service";
import { useRouter } from "next/navigation";

interface MentorshipServicesSectionProps {
    mentorId: string;
    mentorName: string;
    mentorImage?: string;
    mentorRole?: string;
}

export default function MentorshipServicesSection({ mentorId, mentorName, mentorImage, mentorRole }: MentorshipServicesSectionProps) {
    const router = useRouter();
    const [services, setServices] = useState<any[]>([]);
    const [mentorMap, setMentorMap] = useState<Map<string, any>>(new Map());
    const [loading, setLoading] = useState(true);

    // Infinite Carousel State
    const [currentIndex, setCurrentIndex] = useState(3); // Start at index 3 (after 3 pre-clones)
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
                // Fetch Globally without limiting to 9
                const sessionRes = await SessionService.getAllSessionsFromDB({ limit: 100 });
                const allSessions = sessionRes?.data ?? [];
                const globalServices = allSessions.filter((s: any) => s.sessionType !== 'group_session');
                setServices(globalServices);

                const uniqueMentorIds = Array.from(new Set(globalServices.map((s: any) => s.mentorId))).filter(Boolean) as string[];
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
                console.error("Failed to load mentorship marketplace", error);
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
        if (isTransitioning || services.length === 0) return;
        setIsTransitioning(true);
        setCurrentIndex(prev => prev + 1);

        setTimeout(() => {
            setIsTransitioning(false);
            setCurrentIndex(prev => {
                if (prev >= 3 + services.length) return prev - services.length;
                return prev;
            });
        }, 500); // Wait for CSS transition (0.5s)
    }, [isTransitioning, services.length]);

    const prevSlide = useCallback(() => {
        if (isTransitioning || services.length === 0) return;
        setIsTransitioning(true);
        setCurrentIndex(prev => prev - 1);

        setTimeout(() => {
            setIsTransitioning(false);
            setCurrentIndex(prev => {
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
        if (isHovered || services.length <= 1) return;
        const interval = setInterval(nextSlide, 5000); // Wait 5 seconds
        return () => clearInterval(interval);
    }, [isHovered, nextSlide, services.length]);

    const handleServiceClick = (serviceId: string) => {
        router.push(`/mentorship/service/${serviceId}`);
    };

    if (loading) {
        return (
            <section className="py-16 px-6">
                <div className="max-w-[1400px] mx-auto text-center">
                    <p className="text-[#8b7355]">Loading 1-to-1 services...</p>
                </div>
            </section>
        );
    }

    if (services.length === 0) {
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
    const shouldCarousel = services.length > visibleCardsCount;

    const preClones = shouldCarousel ? getClones([...services].reverse(), 3).reverse() : [];
    const postClones = shouldCarousel ? getClones(services, 3) : [];
    const displayItems = shouldCarousel ? [...preClones, ...services, ...postClones] : services;


    return (
        <section className="pt-12 pb-4 px-4 md:px-6">
            <div className="max-w-[1400px] mx-auto bg-[#fdfbf9] rounded-[48px] border border-[#f0edea] shadow-sm overflow-hidden p-8 md:p-12">
                {/* Header Row */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                    <div className="flex-grow pr-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#f4ece1] rounded-full text-[#8b7355] text-xs font-bold uppercase tracking-wider mb-6">
                            1-TO-1 MENTORSHIP
                        </div>
                        <h2 className="text-[32px] md:text-5xl font-black tracking-tight text-[#2d2116] mb-4 xl:whitespace-nowrap">
                            Explore 1-to-1 Mentorship
                        </h2>
                        <p className="text-[#8e847c] text-[15px] sm:text-lg font-medium max-w-2xl mt-2">
                            Book focused sessions with mentors across skills, careers, and technology.
                        </p>
                    </div>
                    
                    {/* Top Right Action & Navigation */}
                    <div className="flex flex-col items-end gap-6">
                        {mentorId && (
                            <button 
                                onClick={() => router.push(`/mentorship/services`)}
                                className="flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-full border border-[#e2d5c8] text-[#5a4a3e] font-bold text-sm hover:bg-[#8b7355] hover:text-white hover:border-[#8b7355] transition-all duration-300"
                            >
                                View all services
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
                        {displayItems.map((service, index) => {
                            // Unique key requires combining index because of clones
                            const uniqueKey = `carousel-item-${service.sessionId || service._id || service.id}-${index}`;
                            
                            // Dynamic Host Resolution
                            const hostData = mentorMap.get(service.mentorId);
                            const hostName = hostData 
                                ? `${hostData.user?.firstName || ''} ${hostData.user?.lastName || ''}`.trim()
                                : "Mentor";
                            const hostRole = hostData?.experience?.currentRole || hostData?.headline || "Mentor";
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
                                        handleServiceClick(service.sessionId || service._id || service.id);
                                    }}
                                >
                                    <div className="group flex flex-col bg-white rounded-[32px] overflow-hidden border border-[#ece7e2] shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 h-full min-h-[420px] pointer-events-auto">
                                        {/* Top Image Area */}
                                        <div className="relative w-full h-[180px] bg-gradient-to-br from-[#f4ece1] to-[#e2d5c8] overflow-hidden flex-shrink-0">
                                            {service.thumbnailImage || service.thumbnail ? (
                                                <img 
                                                    src={service.thumbnailImage || service.thumbnail} 
                                                    alt={service.title || "Mentorship Service"}
                                                    draggable={false}
                                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 bg-[#f4ece1] flex items-center justify-center p-8">
                                                    <div className="w-full h-full border border-[#e2d5c8] rounded-2xl bg-gradient-to-tr from-[#f4ece1] to-white opacity-50"></div>
                                                </div>
                                            )}
                                            
                                            <div className="absolute top-4 left-4 bg-[#8b7355]/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm z-10">
                                                <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                                                    {service.category || service.sessionType?.replace(/_/g, ' ') || 'CAREER PLANNING'}
                                                </span>
                                            </div>

                                            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm z-10">
                                                <span className="text-[10px] font-bold text-white uppercase tracking-wider">{service.duration} MINS</span>
                                            </div>
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
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-[#2d2116] leading-tight">
                                                        {hostName}
                                                    </span>
                                                    {hostRole && (
                                                        <span className="text-[11px] text-[#8e847c] font-bold mt-0.5 leading-tight line-clamp-1">
                                                            {hostRole}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <h3 className="text-lg font-black text-[#2d2116] leading-tight mb-3 group-hover:text-[#8b7355] transition-colors line-clamp-2">
                                                {service.title}
                                            </h3>
                                            
                                            <p className="text-sm text-[#8e847c] line-clamp-2 mb-6">
                                                {service.description || "A personalized 1-to-1 session designed to help you achieve your specific goals."}
                                            </p>

                                            <div className="flex items-center justify-between mb-5 mt-auto">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4 text-[#8b7355]" />
                                                    <span className="text-xs font-bold text-[#2d2116]">{service.duration} mins</span>
                                                </div>
                                                <span className="text-sm font-black text-[#2d2116]">
                                                    {service.pricing?.basePrice === 0 ? "Free" : `₹${service.pricing?.basePrice}`}
                                                </span>
                                            </div>

                                            <div className="mt-auto border-t border-[#ece7e2] pt-5">
                                                <div className="w-full px-5 py-2.5 bg-transparent border border-[#ece7e2] hover:bg-[#f9f5f0] text-[#8b7355] text-xs font-bold rounded-xl transition-colors duration-300 flex items-center justify-center gap-2">
                                                    Book Session
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
