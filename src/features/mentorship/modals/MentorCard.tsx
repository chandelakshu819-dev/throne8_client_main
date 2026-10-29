"use client";
// src/features/mentorship/modals/MentorCard.tsx
import React from "react";
import { Star, Award } from "lucide-react";
import { Mentor } from "@/features/index";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { formatRoleCompany, getRatingDisplay } from "@/shared/utils/mentorFormat";
import CompanyLogo from "@/features/mentorship/components/CompanyLogo";

interface MentorCardProps {
    mentor: Mentor;
}

const MAX_TAGS = 3;

export default function MentorCard({ mentor }: MentorCardProps) {
    const router = useRouter();
    const { user } = useAuth();

    const handleClick = () => {
        if (mentor.isDummy) return;

        if (user?.userId && mentor.userId && user.userId === mentor.userId) {
            router.push(`/mentorship/user-dashboard/${user.userId}`);
            return;
        }

        const slugName = mentor.name.toLowerCase().replace(/\s+/g, "-");
        router.push(`/mentorship/mentor-card/${slugName}/${mentor.id}`);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
        }
    };

    const { hasRating, ratingLabel, sessionsLabel } = getRatingDisplay(
        mentor.rating,
        mentor.sessions
    );

    const completionRate = (mentor as any)?.stats?.completionRate ?? (mentor as any)?.completionRate;
    const totalSessions = Number((mentor as any)?.stats?.totalSessions ?? mentor.sessions ?? 0);
    const hasAttendance =
        typeof completionRate === "number" && !Number.isNaN(completionRate) && totalSessions > 0;

    const allTags: string[] = Array.isArray(mentor.tags) ? mentor.tags : [];
    const visibleTags = allTags.slice(0, MAX_TAGS);
    const extraCount = allTags.length - visibleTags.length;

    return (
        <div
            role={mentor.isDummy ? undefined : "link"}
            tabIndex={mentor.isDummy ? -1 : 0}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            className="flex flex-col flex-shrink-0 w-[280px] min-h-[400px] p-6 bg-[#f5f0ea] border border-[#ddd0c4] rounded-[32px] hover:border-[#3a2a1e] focus-visible:border-[#3a2a1e] focus-visible:outline-none transition-all duration-500 group shadow-lg hover:shadow-2xl hover:-translate-y-2 relative overflow-hidden cursor-pointer"
        >
            {/* Hover gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#3a2a1e]/0 to-[#3a2a1e]/8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            {/* Glow orb */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#c4963a]/15 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none" />

            <div className="relative z-10 flex flex-col flex-1">
                {/* Mentor Photo */}
                <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[#f5f0ea] shadow-lg group-hover:scale-110 group-hover:border-[#c4963a] transition-all duration-500">
                        {mentor.image ? (
                            <img
                                src={mentor.image}
                                alt={mentor.name}
                                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#d4c8be] text-[#4a3728] text-xl font-black">
                                {mentor.isDummy ? "?" : mentor.name?.[0] ?? "M"}
                            </div>
                        )}
                    </div>
                </div>

                {/* Mentor Name */}
                <h5 className="font-black text-base mb-1 text-center text-[#4a3728] group-hover:text-[#3a2a1e] transition-colors">
                    {mentor.isDummy ? "No Mentor Yet" : mentor.name}
                </h5>

                {/* Role @ Company (max 2 lines, sentence case) with CompanyLogo and truncation */}
                <div
                    title={formatRoleCompany(mentor.role, mentor.company)}
                    className="flex items-center justify-center gap-1.5 mb-3 min-h-[2.4em] px-1"
                >
                    {mentor.company && (
                        <CompanyLogo
                            src={mentor.companyLogo}
                            companyName={mentor.company}
                            size={18}
                            className="shrink-0"
                        />
                    )}
                    <p className="text-[11px] leading-snug text-[#8b7355] font-semibold text-center line-clamp-2 truncate">
                        {formatRoleCompany(mentor.role, mentor.company)}
                    </p>
                </div>

                {/* Rating */}
                <div className="flex items-center justify-center gap-1.5 mb-3 min-h-[24px]">
                    {mentor.isDummy ? (
                        <span className="text-xs text-[#8b7355] italic">Slot Available</span>
                    ) : hasRating ? (
                        <>
                            <Star className="w-4 h-4 fill-[#c4963a] text-[#c4963a]" />
                            <span className="text-sm font-black text-[#4a3728]">{ratingLabel}</span>
                            <span className="text-[13px] text-[#6b5643] font-medium">
                                ({sessionsLabel})
                            </span>
                        </>
                    ) : (
                        <>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#c4963a]/15 text-[#8b6a1f] border border-[#c4963a]/30">
                                <Star className="w-3 h-3 fill-[#c4963a] text-[#c4963a]" />
                                {ratingLabel}
                            </span>
                            {sessionsLabel && (
                                <span className="text-[13px] text-[#6b5643] font-medium">
                                    ({sessionsLabel})
                                </span>
                            )}
                        </>
                    )}
                </div>

                {/* Attendance Badge */}
                {hasAttendance && (
                    <div className="flex justify-center mb-3">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-3 py-1 rounded-full bg-[#4a3728]/10 text-[#4a3728] border border-[#4a3728]/15">
                            ✓ {completionRate}% attendance
                        </span>
                    </div>
                )}

                {/* Expertise Tags: max 3 + "+N more" */}
                {visibleTags.length > 0 && (
                    <div className="flex gap-1.5 justify-center flex-wrap mb-4">
                        {visibleTags.map((tag) => (
                            <span
                                key={tag}
                                title={tag}
                                className="max-w-[200px] truncate text-[11px] bg-[#f5ede3] px-3 py-1 rounded-full font-semibold text-[#4a3728] border border-[#e8d9cc]"
                            >
                                {tag}
                            </span>
                        ))}
                        {extraCount > 0 && (
                            <span className="text-[11px] px-3 py-1 rounded-full font-bold text-[#8b7355] border border-dashed border-[#c4963a]/50">
                                +{extraCount} more
                            </span>
                        )}
                    </div>
                )}

                {/* Experience Badge */}
                <div className="mt-auto flex items-center justify-center gap-2 pt-3 border-t border-[#ddd0c4]">
                    <Award className="w-4 h-4 text-[#c4963a]" />
                    <span className="text-xs font-bold text-[#4a3728]">
                        {mentor.exp} Experience
                    </span>
                </div>
            </div>
        </div>
    );
}