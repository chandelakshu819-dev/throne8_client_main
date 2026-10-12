"use client";
//src/features/mentorship/components/sections/GroupSessionsSection.tsx
import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock, Users, Calendar } from "lucide-react";
import MentorService from "@/lib/api/mentorship.service";
import { useRouter } from "next/navigation";
import { cleanText, isMeaningfulText } from "@/shared/utils/textSanitize";
import { resolveHostInfo } from "@/features/mentorship/utils/sessionCard";
import { useInfiniteCarousel } from "@/features/mentorship/hooks/useInfiniteCarousel";
import ServiceThumbnail from "@/features/mentorship/components/shared/ServiceThumbnail";

interface GroupSessionsSectionProps {
    mentorId?: string;
    mentorName?: string;
    mentorImage?: string;
    mentorRole?: string;
}

export default function GroupSessionsSection({
    mentorId,
    mentorName,
    mentorImage,
    mentorRole,
}: GroupSessionsSectionProps) {
    const router = useRouter();
    const [rawSessions, setRawSessions] = useState<any[]>([]);
    const [mentorMap, setMentorMap] = useState<Map<string, any>>(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Garbled title wali (test/junk) sessions public listing mein nahi dikhengi
    const sessions = useMemo(
        () => rawSessions.filter((s) => isMeaningfulText(s?.title)),
        [rawSessions]
    );

    const {
        cardWidthPercent,
        shouldCarousel,
        containerProps,
        containerClassName,
        trackStyle,
        buildDisplayItems,
        wasDragged,
    } = useInfiniteCarousel(sessions.length);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const params = mentorId ? { mentorId } : undefined;
                const sessionRes = await MentorService.getAllGroupSessions(params as any);
                const globalSessions = Array.isArray(sessionRes?.data)
                    ? sessionRes.data
                    : Array.isArray(sessionRes?.data?.sessions)
                    ? sessionRes.data.sessions
                    : Array.isArray(sessionRes?.sessions)
                    ? sessionRes.sessions
                    : Array.isArray(sessionRes)
                    ? sessionRes
                    : [];

                setRawSessions(globalSessions);

                const uniqueMentorIds = Array.from(
                    new Set(globalSessions.map((s: any) => s.mentorId))
                ).filter(Boolean) as string[];
                const map = new Map<string, any>();

                if (uniqueMentorIds.length > 0) {
                    let page = 1;
                    const limit = 50;
                    let hasMore = true;

                    while (hasMore && page <= 5) {
                        const mRes = await MentorService.getAllMentors({ page, limit });
                        const list = Array.isArray(mRes.data) ? mRes.data : mRes.data?.mentors || [];

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
            } catch (err: any) {
                console.error("Failed to load group sessions marketplace", err);
                setError(err?.message || "Failed to load group sessions");
                setRawSessions([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [mentorId]);

    const handleSessionClick = (sessionId: string) => {
        router.push(`/mentorship/group-session/${sessionId}`);
    };

    const displayItems = buildDisplayItems(sessions);

    return (
        <section className="pt-6 pb-12 px-4 md:px-6">
            <div className="max-w-[1240px] mx-auto">
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

                {loading && (
                    <div className="flex items-center justify-center py-16 text-[#8e847c] text-sm font-medium">
                        Loading group sessions...
                    </div>
                )}

                {!loading && error && (
                    <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
                        <p className="text-red-500 text-sm font-semibold">{error}</p>
                        <p className="text-[#8e847c] text-xs">Please try again later.</p>
                    </div>
                )}

                {!loading && !error && sessions.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center gap-2 border border-dashed border-[#e2d5c8] rounded-[20px]">
                        <Users className="w-6 h-6 text-[#8b7355]" />
                        <p className="text-[#4a3728] text-sm font-bold">No group sessions available right now</p>
                        <p className="text-[#8e847c] text-xs">Check back later for upcoming live cohorts.</p>
                    </div>
                )}

                {!loading && !error && sessions.length > 0 && (
                    <div className={containerClassName} {...containerProps}>
                        <div className={`flex w-full ${!shouldCarousel ? "flex-wrap" : ""}`} style={trackStyle}>
                            {displayItems.map((session, index) => {
                                const sessionId = session.sessionId || session._id || session.id;
                                const uniqueKey = `carousel-group-session-${sessionId}-${index}`;

                                const hostData = mentorMap.get(session.mentorId) || session.host;
                                const host = resolveHostInfo(
                                    hostData,
                                    { name: mentorName, role: mentorRole, image: mentorImage },
                                    { name: "Industry Mentor", role: "Mentor" }
                                );

                                const tags: string[] = [];
                                const addTag = (t?: string) => {
                                    if (t && !tags.some((x) => x.toLowerCase() === t.toLowerCase())) tags.push(t);
                                };
                                addTag(session.topic || session.category);
                                if (Array.isArray(session.skills)) session.skills.forEach(addTag);
                                else if (Array.isArray(hostData?.skills)) hostData.skills.forEach(addTag);
                                const displayTags = tags.slice(0, 2);

                                const pricePerPerson = session.pricing?.pricePerPerson;
                                const hasPrice = typeof pricePerPerson === "number";
                                const priceDisplay = !hasPrice
                                    ? "Price TBA"
                                    : pricePerPerson === 0
                                    ? "Free"
                                    : `₹${pricePerPerson.toLocaleString("en-IN")}`;

                                const badgeLabel = session.topic || session.category || "Session";
                                const thumbnail = session.thumbnailImage || session.thumbnail;

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
                                            handleSessionClick(sessionId);
                                        }}
                                    >
                                        <div className="group flex flex-col bg-white hover:bg-[#FDFBF7] rounded-[20px] sm:rounded-[22px] overflow-hidden border border-[#ece7e2] hover:border-[#8b7355]/40 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full pointer-events-auto cursor-pointer">
                                            <div className="relative w-full h-[130px] sm:h-[138px] bg-[#f4ece1] overflow-hidden flex-shrink-0">
                                                <ServiceThumbnail
                                                    src={thumbnail}
                                                    alt={session.title}
                                                    label={badgeLabel}
                                                    tone="brown"
                                                />

                                                <div className="absolute top-2.5 left-2.5 bg-[#4a3728]/75 backdrop-blur-md px-2.5 py-0.5 rounded-full shadow-xs z-10">
                                                    <span className="text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-wider">
                                                        {badgeLabel}
                                                    </span>
                                                </div>

                                                {session.maxParticipants && (
                                                    <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full shadow-xs z-10 flex items-center gap-1">
                                                        <Users className="w-2.5 h-2.5 text-white/90" />
                                                        <span className="text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-wider">
                                                            {session.maxParticipants} Seats
                                                        </span>
                                                    </div>
                                                )}
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
                                                    {cleanText(session.title, "Group Session")}
                                                </h3>

                                                <p className="text-[11px] sm:text-xs text-[#8e847c] line-clamp-2 leading-relaxed mb-3">
                                                    {cleanText(
                                                        session.description,
                                                        "Interactive group session led by an expert mentor."
                                                    )}
                                                </p>

                                                <div className="mt-auto pt-2.5 mb-3 flex items-center gap-2 text-[11px] sm:text-xs text-[#5a4a3e] border-t border-[#f2ede8]">
                                                    <div className="flex items-center gap-1 font-semibold text-[#5a4a3e]">
                                                        <Calendar className="w-3 h-3 text-[#8b7355]" />
                                                        <span>
                                                            {session.scheduledAt
                                                                ? new Date(session.scheduledAt).toLocaleDateString("en-IN", {
                                                                      day: "numeric",
                                                                      month: "short",
                                                                      year: "numeric",
                                                                  })
                                                                : "TBA"}
                                                        </span>
                                                    </div>

                                                    <span className="text-[#e2dcd5]">|</span>

                                                    <div className="flex items-center gap-1 font-semibold text-[#5a4a3e]">
                                                        <Clock className="w-3 h-3 text-[#8b7355]" />
                                                        <span>{session.duration ? `${session.duration} mins` : "TBA"}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-baseline gap-1 min-w-0">
                                                        <span className="text-sm font-black text-[#2d2116]">{priceDisplay}</span>
                                                        {hasPrice && pricePerPerson > 0 && (
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                                / person
                                                            </span>
                                                        )}
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (wasDragged()) return;
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
                )}
            </div>
        </section>
    );
}