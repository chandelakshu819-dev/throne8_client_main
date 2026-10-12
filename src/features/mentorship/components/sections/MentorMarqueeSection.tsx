"use client";
//src/features/mentorship/components/sections/MentorMarqueeSection.tsx
import React, { useEffect, useState } from "react";
import { MentorCard } from "@/features/index";
import MentorService from "@/lib/api/mentorship.service";
import { parseRoleCompany, getExperienceLabel } from "@/shared/utils/mentorFormat";

// Isse kam mentors hon to marquee nahi chalega (warna wahi chehre repeat hote hain)
const MIN_FOR_MARQUEE = 6;

export default function MentorMarqueeSection() {
    const [apiMentors, setApiMentors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        MentorService.getAllMentors({ page: 1, limit: 10 })
            .then((res) => {
                setApiMentors(Array.isArray(res.data) ? res.data : []);
            })
            .catch(() => setApiMentors([]))
            .finally(() => setLoading(false));
    }, []);

    // Duplicate mentorId hata do
    const uniqueMentors = apiMentors.filter(
        (m, idx, arr) => arr.findIndex((x) => x.mentorId === m.mentorId) === idx
    );

    const realCards = uniqueMentors.map((m: any) => {
        const { role, company } = parseRoleCompany(
            m.experience?.currentRole,
            m.title,
            m.company
        );
        return {
            id: m.mentorId,
            userId: m.userId,
            name:
                `${m.user?.firstName ?? ""} ${m.user?.lastName ?? ""}`.trim() ||
                m.user?.name ||
                "Mentor",
            role,
            company,
            rating: Number(m.stats?.averageRating) || 0,
            sessions: m.stats?.totalSessions || m.trustScore?.metrics?.totalCompletedSessions || 0,
            price: m.pricing?.quickCall || 0,
            match: 90,
            image: m.profilePic ?? "",
            tags: m.skills?.slice(0, 2) ?? [],
            exp: getExperienceLabel(m.experience?.total),
            completionRate: m.stats?.completionRate,
            isDummy: false,
        };
    });

    if (loading || realCards.length === 0) {
        return null;
    }

    const headerBlock = (
        <div className="text-center mb-10 px-6">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-3">
                <span className="text-[#8b7355]">TOP</span> MENTORS
            </h2>
            <p className="text-slate-500 text-sm font-medium">
                Handpicked experts from leading tech companies
            </p>
        </div>
    );

    // Kam mentors: static centered row, koi repeat nahi
    if (realCards.length < MIN_FOR_MARQUEE) {
        return (
            <section className="py-14 bg-[#f7f1e6] overflow-hidden border-y border-[#f0edea]">
                {headerBlock}
                <div className="flex flex-wrap justify-center gap-6 px-6 py-3">
                    {realCards.map((mentor) => (
                        <MentorCard key={mentor.id} mentor={mentor} />
                    ))}
                </div>
            </section>
        );
    }

    // Itne mentors hain ki marquee loop smooth chale
    let baseList = [...realCards];
    while (baseList.length < 8) {
        baseList = [...baseList, ...realCards];
    }

    const duration = baseList.length * 5;

    return (
        <section className="py-14 bg-[#f7f1e6] overflow-hidden border-y border-[#f0edea]">
            <style>{`
                @keyframes marqueeScroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .marquee-track {
                    display: flex;
                    flex-wrap: nowrap;
                    width: max-content;
                    will-change: transform;
                    animation: marqueeScroll ${duration}s linear infinite;
                }
                .marquee-container:hover .marquee-track {
                    animation-play-state: paused;
                }
                @media (prefers-reduced-motion: reduce) {
                    .marquee-track {
                        animation: none !important;
                        transform: none !important;
                    }
                }
            `}</style>
            {headerBlock}
            <div className="w-full overflow-hidden marquee-container py-3">
                <div className="marquee-track">
                    {baseList.map((mentor, i) => (
                        <div
                            key={`primary-${mentor.id || "mentor"}-${i}`}
                            style={{ marginRight: "24px", flexShrink: 0 }}
                        >
                            <MentorCard mentor={mentor} />
                        </div>
                    ))}
                    {baseList.map((mentor, i) => (
                        <div
                            key={`duplicate-${mentor.id || "mentor"}-${i}`}
                            aria-hidden="true"
                            style={{ marginRight: "24px", flexShrink: 0 }}
                        >
                            <MentorCard mentor={mentor} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}