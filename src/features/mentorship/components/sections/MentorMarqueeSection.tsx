"use client";
//src/features/mentorship/components/sections/MentorMarqueeSection.tsx
import React, { useEffect, useState } from "react";
import { MentorCard } from "@/features/index";
import MentorService from "@/lib/api/mentorship.service";
import { parseRoleCompany, getExperienceLabel } from "@/shared/utils/mentorFormat";

// Isse kam mentors hon to marquee nahi chalega (1-2 mentor ho to static row)
const MIN_FOR_MARQUEE = 3;

// "HTML, CSS, JS" jaisi comma wali string ko alag-alag skills mein todta hai
// (trim + duplicate hata deta hai)
const splitSkills = (skills: unknown): string[] => {
    const list = Array.isArray(skills)
        ? skills
        : typeof skills === "string"
        ? [skills]
        : [];
    const seen = new Set<string>();
    return list
        .flatMap((s) => String(s).split(/[,;|]/))
        .map((s) => s.trim())
        .filter((s) => {
            const key = s.toLowerCase();
            if (!s || seen.has(key)) return false;
            seen.add(key);
            return true;
        });
};

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
            companyLogo:
                m.companyLogo ||
                m.experience?.previousRoles?.find((r: any) => r.isCurrent)?.companyLogo ||
                m.experience?.previousRoles?.[0]?.companyLogo ||
                "",
            rating: Number(m.stats?.averageRating) || 0,
            sessions:
                m.stats?.totalSessions ||
                m.trustScore?.metrics?.totalCompletedSessions ||
                0,
            price: m.pricing?.quickCall || 0,
            image: m.profilePic ?? "",
            tags: splitSkills(m.skills), // MentorCard max 3 dikhayega + "+N more"
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
            <p className="text-[#8a7a6a] text-sm font-medium">
                Handpicked experts from leading tech companies
            </p>
        </div>
    );

    // Bahut kam mentors (1-2): static centered row, koi repeat nahi
    if (realCards.length < MIN_FOR_MARQUEE) {
        return (
            <section className="py-14 bg-[#f7f1e6] overflow-hidden border-y border-[#f0edea]">
                {headerBlock}
                <div className="flex flex-wrap justify-center items-stretch gap-6 px-6 py-3">
                    {realCards.map((mentor) => (
                        <MentorCard key={mentor.id} mentor={mentor} />
                    ))}
                </div>
            </section>
        );
    }

    // Itne mentors hain ki marquee loop smooth chale
    // (kam hon to list ko repeat karke screen ki width se bada kar dete hain)
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
                            style={{ marginRight: "24px", flexShrink: 0, display: "flex" }}
                        >
                            <MentorCard mentor={mentor} />
                        </div>
                    ))}
                    {baseList.map((mentor, i) => (
                        <div
                            key={`duplicate-${mentor.id || "mentor"}-${i}`}
                            aria-hidden="true"
                            style={{ marginRight: "24px", flexShrink: 0, display: "flex" }}
                        >
                            <MentorCard mentor={mentor} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}