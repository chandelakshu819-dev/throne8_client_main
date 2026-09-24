"use client";

import React, { useEffect, useState } from "react";
import { MentorCard } from "@/features/index";
import { MENTORS } from "@/features/index";
import MentorService from "@/lib/api/mentorship.service";

const TOTAL_CARDS = 8; // marquee ke liye minimum cards

export default function MentorMarqueeSection() {
    const [apiMentors, setApiMentors] = useState<any[]>([]);

    useEffect(() => {
        MentorService.getAllMentors({ page: 1, limit: 10 })
            .then((res) => {
                const list = res.data ?? [];
                setApiMentors(list);
            })
            .catch(() => setApiMentors([]));
    }, []);

    // Real mentors ko MentorCard format mein convert karo
    const realCards = apiMentors.map((m: any) => ({
        id: m.mentorId,
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

    // Remaining slots ko dummy se fill karo
    const dummyCount = Math.max(0, TOTAL_CARDS - realCards.length);
    const dummyCards = Array(dummyCount).fill(null).map((_, i) => ({
        id: `dummy-${i}`,
        name: "Coming Soon",
        role: "Mentor",
        company: "—",
        rating: 0,
        sessions: 0,
        price: 0,
        match: 0,
        image: "",
        tags: [],
        exp: "—",
        isDummy: true,
    }));

    const allCards = [...realCards, ...dummyCards];

    return (
        <section className="py-14 bg-[#f7f1e6] overflow-hidden border-y border-[#f0edea]">
            <div className="text-center mb-10 px-6">
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-3">
                    <span className="text-[#8b7355]">TOP</span> MENTORS
                </h2>
                <p className="text-slate-500 text-sm font-medium">
                    Handpicked experts from leading tech companies
                </p>
            </div>
            <div className="group/marquee">
                <div className="animate-marquee group-hover/marquee:pause-animation flex gap-6">
                    {[...allCards, ...allCards, ...allCards].map((mentor, i) => (
                        <MentorCard key={i} mentor={mentor} />
                    ))}
                </div>
            </div>
        </section>
    );
}