"use client";

import React, { useEffect, useState } from "react";
import { MentorCard } from "@/features/index";
import MentorService from "@/lib/api/mentorship.service";

export default function MentorMarqueeSection() {
    const [apiMentors, setApiMentors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        MentorService.getAllMentors({ page: 1, limit: 10 })
            .then((res) => {
                const list = res.data ?? [];
                setApiMentors(list);
            })
            .catch(() => setApiMentors([]))
            .finally(() => setLoading(false));
    }, []);

    // Real mentors ko MentorCard format mein convert karo
    const realCards = apiMentors.map((m: any) => ({
        id: m.mentorId,
        userId: m.userId,
        name: `${m.user?.firstName ?? ""} ${m.user?.lastName ?? ""}`.trim(),
        role: m.experience?.currentRole?.split(" at ")[0] ?? "Mentor",
        company: m.experience?.currentRole?.split(" at ")[1] ?? "",
        rating: m.stats?.averageRating || 0,
        sessions: m.stats?.totalSessions || m.trustScore?.metrics?.totalCompletedSessions || 0,
        price: m.pricing?.quickCall || 0,
        match: 90,
        image: m.profilePic ?? "",
        tags: m.skills?.slice(0, 2) ?? [],
        exp: `${m.experience?.total ?? 0} Yrs`,
        isDummy: false,
    }));

    // Marquee ke liye smooth loop chahiye — agar real mentors kam hain
    // to unhi ko repeat karke dikhate hain, dummy data nahi.
    if (!loading && realCards.length === 0) {
        return null;
    }

    if (realCards.length === 0) {
        return null;
    }

    // Base list repeated enough times so there is never an empty gap on wide screens (min 8 cards)
    let baseList = [...realCards];
    while (baseList.length < 8) {
        baseList = [...baseList, ...realCards];
    }

    const duration = baseList.length * 5;

    return (
        <section className="py-14 bg-[#f7f1e6] overflow-hidden border-y border-[#f0edea]">
            <style>{`
                @keyframes marqueeScroll {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-50%);
                    }
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
            <div className="text-center mb-10 px-6">
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-3">
                    <span className="text-[#8b7355]">TOP</span> MENTORS
                </h2>
                <p className="text-slate-500 text-sm font-medium">
                    Handpicked experts from leading tech companies
                </p>
            </div>
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