"use client";
//src/features/mentorship/components/sections/SeniorMentorshipServicesSection.tsx
import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock, Calendar } from "lucide-react";
import SeniorSessionService from "@/lib/api/seniorSession.service";
import MentorService from "@/lib/api/mentorship.service";
import { useRouter } from "next/navigation";
import { getRatingDisplay } from "@/shared/utils/mentorFormat";
import { cleanText, isMeaningfulText } from "@/shared/utils/textSanitize";
import { formatPrice, resolveHostInfo } from "@/features/mentorship/utils/sessionCard";
import { useInfiniteCarousel } from "@/features/mentorship/hooks/useInfiniteCarousel";
import ServiceThumbnail from "@/features/mentorship/components/shared/ServiceThumbnail";

export default function SeniorMentorshipServicesSection() {
    const router = useRouter();
    const [rawServices, setRawServices] = useState<any[]>([]);
    const [mentorMap, setMentorMap] = useState<Map<string, any>>(new Map());
    const [loading, setLoading] = useState(true);

    // Garbled title wali (test/junk) sessions public listing mein nahi dikhengi
    const services = useMemo(
        () => rawServices.filter((s) => isMeaningfulText(s?.title)),
        [rawServices]
    );

    const {
        cardWidthPercent,
        shouldCarousel,
        containerProps,
        containerClassName,
        trackStyle,
        buildDisplayItems,
        wasDragged,
    } = useInfiniteCarousel(services.length);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const sessionRes = await SeniorSessionService.getAllDiscoverySessions();
                const allSessions = Array.isArray(sessionRes?.data)
                    ? sessionRes.data
                    : Array.isArray(sessionRes)
                    ? sessionRes
                    : [];

                setRawServices(allSessions);

                const uniqueMentorIds = Array.from(
                    new Set(allSessions.map((s: any) => s.mentorId))
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
                            if (list.length < limit || allFound) hasMore = false;
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

    const displayItems = buildDisplayItems(services);

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

                <div className={containerClassName} {...containerProps}>
                    <div className={`flex w-full ${!shouldCarousel ? "flex-wrap" : ""}`} style={trackStyle}>
                        {displayItems.map((service, index) => {
                            const serviceId = service.sessionId || service._id || service.id;
                            const uniqueKey = `carousel-item-${serviceId}-${index}`;

                            const hostData = mentorMap.get(service.mentorId);
                            const host = resolveHostInfo(
                                hostData,
                                {},
                                { name: "Senior Mentor", role: "Senior Professional" }
                            );

                            const topCategory = (
                                service.category ||
                                service.sessionType?.replace(/_/g, " ") ||
                                "SENIOR SESSION"
                            ).toUpperCase();

                            const durationMinutes = service.duration || 60;
                            const priceDisplay = formatPrice(service.pricing?.basePrice);

                            const tags: string[] = [];
                            const addTag = (t?: string) => {
                                if (t && !tags.some((x) => x.toLowerCase() === t.toLowerCase())) tags.push(t);
                            };
                            addTag(service.category || service.sessionType?.replace(/_/g, " "));
                            if (Array.isArray(service.skills)) service.skills.forEach(addTag);
                            const displayTags = tags.slice(0, 2);

                            const rawRating =
                                hostData?.stats?.averageRating ?? hostData?.rating ?? service.rating;
                            const rawSessions =
                                hostData?.stats?.totalSessions ?? hostData?.totalSessions ?? service.sessionCount;
                            const rating = getRatingDisplay(rawRating, rawSessions);

                            const thumbnail = service.thumbnailImage || service.thumbnail;

                            return (
                                <div
                                    key={uniqueKey}
                                    style={{ width: `${cardWidthPercent}%` }}
                                    className="flex-shrink-0 px-2 sm:px-2.5"
                                    onClick={(e) => {
                                        if (wasDragged()) {
                                            e.stopPropagation();
                                            return;
                                        }
                                        handleServiceClick(serviceId);
                                    }}
                                >
                                    <div className="group flex flex-col bg-white rounded-[20px] sm:rounded-[22px] overflow-hidden border border-[#ece7e2] shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 h-full pointer-events-auto cursor-pointer">
                                        <div className="relative w-full h-[130px] sm:h-[138px] bg-[#eef1f6] overflow-hidden flex-shrink-0">
                                            <ServiceThumbnail
                                                src={thumbnail}
                                                alt={service.title}
                                                label={topCategory}
                                                tone="navy"
                                            />

                                            <div className="absolute top-2.5 left-2.5 bg-[#1b2b3a]/80 backdrop-blur-md px-2.5 py-0.5 rounded-full shadow-xs z-10">
                                                <span className="text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-wider">
                                                    {topCategory}
                                                </span>
                                            </div>

                                            <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full shadow-xs z-10 flex items-center gap-1">
                                                <Clock className="w-2.5 h-2.5 text-white/90" />
                                                <span className="text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-wider">
                                                    {durationMinutes} MINS
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col p-3.5 sm:p-4 flex-grow">
                                            <div className="flex items-center gap-2.5 mb-2.5">
                                                <div className="relative flex-shrink-0">
                                                    {host.pic ? (
                                                        <img
                                                            src={host.pic}
                                                            alt={host.name}
                                                            draggable={false}
                                                            className="w-8 h-8 rounded-full object-cover border border-[#ece7e2]"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-[#f4ece1] text-[#3a5266] flex items-center justify-center font-bold border border-[#ece7e2] text-xs">
                                                            {host.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    {host.isOnline && (
                                                        <span
                                                            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full shadow-xs"
                                                            title="Online"
                                                        />
                                                    )}
                                                </div>

                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm sm:text-[15px] font-bold text-[#2d2116] leading-tight truncate">
                                                        {host.name}
                                                    </span>
                                                    <span className="text-[11px] text-[#8e847c] font-medium leading-tight truncate mt-0.5">
                                                        {host.roleLabel}
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
                                                {cleanText(service.title, "Senior Session")}
                                            </h3>

                                            <p className="text-[11px] sm:text-xs text-[#8e847c] line-clamp-2 leading-relaxed mb-3">
                                                {cleanText(
                                                    service.description,
                                                    "A personalized 1-to-1 session designed to help you achieve your specific goals."
                                                )}
                                            </p>

                                            <div className="mt-auto pt-2.5 mb-3 flex items-center gap-2 text-[11px] sm:text-xs text-[#5a4a3e] border-t border-[#f2ede8]">
                                                <div className="flex items-center gap-1 font-semibold text-[#5a4a3e]">
                                                    <Calendar className="w-3 h-3 text-[#3a5266]" />
                                                    <span>{durationMinutes} mins</span>
                                                </div>

                                                <span className="text-[#e2dcd5]">|</span>

                                                <span className="font-bold text-[#2d2116]">{priceDisplay}</span>

                                                {rating.hasRating && (
                                                    <>
                                                        <span className="text-[#e2dcd5]">|</span>
                                                        <div className="flex items-center gap-1 font-semibold text-[#c4963a]">
                                                            <span>⭐</span>
                                                            <span>{rating.ratingLabel}</span>
                                                            {rating.sessionsLabel && (
                                                                <span className="text-[#8e847c] font-normal text-[10px]">
                                                                    ({Number(rawSessions)})
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
                                                        if (wasDragged()) return;
                                                        handleServiceClick(serviceId);
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