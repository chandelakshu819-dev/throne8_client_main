"use client";
//src/features/mentorship/components/sections/MentorshipServicesSection.tsx
import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock, Calendar } from "lucide-react";
import SessionService from "@/lib/api/session.service";
import MentorService from "@/lib/api/mentorship.service";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { buildMentorProfileUrl } from "@/shared/utils/mentor.util";
import { getRatingDisplay } from "@/shared/utils/mentorFormat";
import { cleanText, isMeaningfulText } from "@/shared/utils/textSanitize";
import { formatPrice, resolveHostInfo } from "@/features/mentorship/utils/sessionCard";
import { useInfiniteCarousel } from "@/features/mentorship/hooks/useInfiniteCarousel";
import ServiceThumbnail from "@/features/mentorship/components/shared/ServiceThumbnail";

interface MentorshipServicesSectionProps {
    mentorId?: string;
    mentorName?: string;
    mentorImage?: string;
    mentorRole?: string;
}

export default function MentorshipServicesSection({
    mentorName,
    mentorImage,
    mentorRole,
}: MentorshipServicesSectionProps) {
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
                setRawServices(globalServices);

                const uniqueMentorIds = Array.from(
                    new Set(globalServices.map((s: any) => s.mentorId))
                ).filter(Boolean) as string[];
                const map = new Map<string, any>();

                if (uniqueMentorIds.length > 0) {
                    let page = 1;
                    const limit = 50;
                    let hasMore = true;

                    // Safety limit of 5 pages
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
                console.error("Failed to load mentorship marketplace", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleServiceClick = (serviceId: string) => {
        router.push(`/mentorship/service/${serviceId}`);
    };

    const displayItems = buildDisplayItems(services);

    const header = (
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
    );

    return (
        <section className="pt-6 pb-12 px-4 md:px-6">
            <div className="max-w-[1240px] mx-auto">
                {header}

                {loading && (
                    <div className="flex items-center justify-center py-16 text-[#8e847c] text-sm font-medium">
                        Loading services...
                    </div>
                )}

                {!loading && services.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center gap-2 border border-dashed border-[#e2d5c8] rounded-[20px]">
                        <Calendar className="w-6 h-6 text-[#8b7355]" />
                        <p className="text-[#4a3728] text-sm font-bold">No 1-to-1 services available right now</p>
                        <p className="text-[#8e847c] text-xs">Check back soon for new sessions.</p>
                    </div>
                )}

                {!loading && services.length > 0 && (
                    <div className={containerClassName} {...containerProps}>
                        <div className={`flex w-full ${!shouldCarousel ? "flex-wrap" : ""}`} style={trackStyle}>
                            {displayItems.map((service, index) => {
                                const serviceId = service.sessionId || service._id || service.id;
                                const uniqueKey = `carousel-item-${serviceId}-${index}`;

                                const hostData = mentorMap.get(service.mentorId) || service.host;
                                const host = resolveHostInfo(
                                    hostData,
                                    { name: mentorName, role: mentorRole, image: mentorImage },
                                    { name: "Industry Mentor", role: "Mentor" }
                                );

                                const cardMentorId = hostData?.mentorId || service.mentorId || "";
                                const mentorProfileUrl = cardMentorId
                                    ? buildMentorProfileUrl(host.name, cardMentorId)
                                    : null;

                                const topCategory = (
                                    service.category ||
                                    service.sessionType?.replace(/_/g, " ") ||
                                    "MENTORSHIP"
                                ).toUpperCase();

                                const durationMinutes = service.duration || 60;
                                const priceDisplay = formatPrice(service.pricing?.basePrice);

                                // Tags (category + skills)
                                const tags: string[] = [];
                                const addTag = (t?: string) => {
                                    if (t && !tags.some((x) => x.toLowerCase() === t.toLowerCase())) tags.push(t);
                                };
                                addTag(service.category || service.sessionType?.replace(/_/g, " "));
                                if (Array.isArray(service.skills)) service.skills.forEach(addTag);
                                else if (service.skill) addTag(service.skill);
                                else if (service.topic) addTag(service.topic);
                                else if (Array.isArray(hostData?.skills)) hostData.skills.forEach(addTag);
                                const displayTags = tags.slice(0, 2);

                                // Rating sirf real data se (fake 5.0 default hata diya)
                                const rawRating =
                                    hostData?.stats?.averageRating ?? hostData?.rating ?? service.rating;
                                const rawSessions =
                                    hostData?.stats?.totalSessions ??
                                    hostData?.totalSessions ??
                                    service.sessionCount;
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
                                        <div className="group flex flex-col bg-white hover:bg-[#FDFBF7] rounded-[20px] sm:rounded-[22px] overflow-hidden border border-[#ece7e2] hover:border-[#8b7355]/40 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full pointer-events-auto cursor-pointer">
                                            <div className="relative w-full h-[130px] sm:h-[138px] bg-[#f4ece1] overflow-hidden flex-shrink-0">
                                                <ServiceThumbnail
                                                    src={thumbnail}
                                                    alt={service.title}
                                                    label={topCategory}
                                                    tone="brown"
                                                />

                                                <div className="absolute top-2.5 left-2.5 bg-[#4a3728]/75 backdrop-blur-md px-2.5 py-0.5 rounded-full shadow-xs z-10">
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
                                                            <div className="w-8 h-8 rounded-full bg-[#f4ece1] text-[#8b7355] flex items-center justify-center font-bold border border-[#ece7e2] text-xs">
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

                                                <h3 className="text-sm sm:text-[15px] font-bold text-[#2d2116] leading-snug mb-1.5 group-hover:text-[#4a3728] transition-colors line-clamp-2">
                                                    {cleanText(service.title, "Mentorship Session")}
                                                </h3>

                                                <p className="text-[11px] sm:text-xs text-[#8e847c] line-clamp-2 leading-relaxed mb-3">
                                                    {cleanText(
                                                        service.description,
                                                        "A personalized 1-to-1 session designed to help you achieve your specific goals."
                                                    )}
                                                </p>

                                                <div className="mt-auto pt-2.5 mb-3 flex items-center gap-2 text-[11px] sm:text-xs text-[#5a4a3e] border-t border-[#f2ede8]">
                                                    <div className="flex items-center gap-1 font-semibold text-[#5a4a3e]">
                                                        <Calendar className="w-3 h-3 text-[#8b7355]" />
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
                                                    {mentorProfileUrl ? (
                                                        <Link
                                                            href={mentorProfileUrl}
                                                            prefetch={false}
                                                            draggable={false}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (wasDragged()) e.preventDefault();
                                                            }}
                                                            className="flex-1 py-1.5 sm:py-2 px-2.5 rounded-full border border-[#dcd4cb] hover:border-[#8b7355] bg-white hover:bg-[#FAF9F6] text-[#4a3728] font-bold text-xs text-center transition-all duration-200 shadow-xs"
                                                        >
                                                            View Profile
                                                        </Link>
                                                    ) : (
                                                        <span
                                                            aria-disabled="true"
                                                            className="flex-1 py-1.5 sm:py-2 px-2.5 rounded-full border border-[#dcd4cb] bg-white text-[#4a3728] font-bold text-xs text-center shadow-xs opacity-50 cursor-not-allowed"
                                                        >
                                                            View Profile
                                                        </span>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (wasDragged()) return;
                                                            handleServiceClick(serviceId);
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
                )}
            </div>
        </section>
    );
}