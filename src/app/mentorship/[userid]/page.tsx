"use client";
//src/app/mentorship/[userid]/page.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
    Navigation,
    // Section Components
    ActionCardsSection,
    HeroSection,
    MentorMarqueeSection,
    MentorDiscoverySection,
    CompanyLogosSection,
    OurImpactSection,
    UnstoppableAdvantageSection,
    FAQSection,
    CTASection,

    // Shared Components
    CompareBar,
    BecomeMentorModal,
    GlobalStyles,
} from "@/features/index";
import MentorshipServicesSection from "@/features/mentorship/components/sections/MentorshipServicesSection";
import SeniorMentorshipServicesSection from "@/features/mentorship/components/sections/SeniorMentorshipServicesSection";
import GroupSessionsSection from "@/features/mentorship/components/sections/GroupSessionsSection";
import MentorshipFooter from "@/features/mentorship/components/layout/MentorshipFooter";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useParams, useSearchParams, usePathname } from "next/navigation";
import { useProfile } from "@/features/profile/hooks/useProfile";
import MentorService from "@/lib/api/mentorship.service";
import FindMentorModal from "@/features/mentorship/components/sections/FindMentorModal";
import { parseRoleCompany } from "@/shared/utils/mentorFormat";

export default function ThroneUltraPremium() {
    const [compareList, setCompareList] = useState<number[]>([]);
    const [activeTimezone] = useState("IST (UTC+5:30)");
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [showMentorForm, setShowMentorForm] = useState(false);
    const [formStep, setFormStep] = useState(1);
    const [isMentor, setIsMentor] = useState(false);

    const params = useParams();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const rawUserId = (params?.userid || (params as any)?.userId) as string;
    const userId = rawUserId && rawUserId !== "undefined" ? rawUserId : "";
    const [findMentorOpen, setFindMentorOpen] = useState(false);

    // Auto-open BecomeMentorModal when navigated here from ProfileDropdown
    // "Apply to unlock" link (?openMentorForm=true)
    useEffect(() => {
        if (searchParams?.get("openMentorForm") === "true") {
            setShowMentorForm(true);
        }
    }, [searchParams]);

    // Mentor Data for the landing page mentor
    const [pageMentorData, setPageMentorData] = useState<any>(null);

    // Ek hi baar mentors fetch: Find Mentor modal aur Our Impact stats dono isse chalte hain
    const [mentorsRaw, setMentorsRaw] = useState<any[]>([]);
    const [mentorsTotal, setMentorsTotal] = useState(0);
    const [mentorsLoading, setMentorsLoading] = useState(true);

    const { profileImageUrl, loadProfile } = useProfile();
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            loadProfile();
        }
    }, [user]);

    useEffect(() => {
        if (user?.userId) {
            MentorService.getMentorByUserId(user.userId)
                .then(() => setIsMentor(true))
                .catch(() => setIsMentor(false));
        }
    }, [user]);

    useEffect(() => {
        let active = true;
        MentorService.getAllMentors({ page: 1, limit: 50 })
            .then((res: any) => {
                if (!active) return;
                const list = Array.isArray(res?.data) ? res.data : [];
                // Duplicate mentorId hata do
                const unique = list.filter(
                    (m: any, idx: number, arr: any[]) =>
                        arr.findIndex((x) => x.mentorId === m.mentorId) === idx
                );
                setMentorsRaw(unique);

                // Agar API total bhejti hai (limit 50 se zyada mentors) to wo use hoga.
                // Field ka naam alag ho to yahan adjust kar lena.
                const apiTotal = Number(res?.pagination?.total ?? res?.total);
                setMentorsTotal(Number.isFinite(apiTotal) && apiTotal > 0 ? apiTotal : unique.length);
            })
            .catch(() => {
                if (!active) return;
                setMentorsRaw([]);
                setMentorsTotal(0);
            })
            .finally(() => active && setMentorsLoading(false));
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (userId && userId !== "undefined") {
            MentorService.getAllMentors()
                .then((res) => {
                    const found =
                        res?.data?.find(
                            (m: any) =>
                                m.mentorId === userId ||
                                m.userId === userId ||
                                m.user?.username === userId ||
                                m.user?.slug === userId
                        ) ?? null;
                    setPageMentorData(found);
                })
                .catch(() => setPageMentorData(null));
        }
    }, [userId]);

    // Fire-and-forget request to trigger backend 'Profile Viewed' notification logic.
    // This is strictly for the side-effect (notification tracking) and decoupled from page rendering data.
    // We intentionally do not use this response to setPageMentorData.
    useEffect(() => {
        if (userId && userId !== "undefined") {
            // Skip the request if the visitor is the mentor viewing their own profile (self-view)
            if (user?.userId === userId) {
                return;
            }
            MentorService.getMentorByUserId(userId, true).catch(() => {});
        }
    }, [userId, user?.userId]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(
                    (e) => e.isIntersecting && e.target.classList.add("reveal-active")
                );
            },
            { threshold: 0.1 }
        );
        document
            .querySelectorAll(".reveal-on-scroll")
            .forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    const toggleCompare = (id: number) => {
        if (compareList.includes(id))
            setCompareList(compareList.filter((item) => item !== id));
        else if (compareList.length < 3) setCompareList([...compareList, id]);
    };

    // Find Mentor modal ke liye mentors (role/company ab " @ " aur " at " dono se parse hote hain)
    const findMentorMentors = useMemo(
        () =>
            mentorsRaw.map((m: any) => {
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
                    rating: m.stats?.averageRating || 0,
                    sessions:
                        m.stats?.totalSessions ||
                        m.trustScore?.metrics?.totalCompletedSessions ||
                        0,
                    price: m.pricing?.quickCall || 0,
                    tags: m.skills?.slice(0, 2) ?? [],
                    image: m.profilePic ?? "",
                };
            }),
        [mentorsRaw]
    );

    // Our Impact ke real numbers (hardcoded 3000+/350K+/70+ ki jagah)
    const impactStats = useMemo(() => {
        const sessions = mentorsRaw.reduce(
            (sum, m) =>
                sum +
                (Number(m.stats?.totalSessions) ||
                    Number(m.trustScore?.metrics?.totalCompletedSessions) ||
                    0),
            0
        );
        const domainSet = new Set<string>();
        mentorsRaw.forEach((m) => {
            if (Array.isArray(m.domains)) m.domains.forEach((d: string) => d && domainSet.add(d));
        });
        return { mentors: mentorsTotal, sessions, domains: domainSet.size };
    }, [mentorsRaw, mentorsTotal]);

    const pageMentorName = pageMentorData
        ? `${pageMentorData.user?.firstName ?? ""} ${pageMentorData.user?.lastName ?? ""}`.trim()
        : "";
    const pageMentorRole = pageMentorData
        ? parseRoleCompany(
              pageMentorData.experience?.currentRole,
              pageMentorData.title,
              pageMentorData.company
          ).role
        : undefined;

    return (
        <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#f7f1e6] text-[#4a3728] font-sans selection:bg-[#4a3728] selection:text-white">
            <GlobalStyles />

            {/* Navigation */}
            <Navigation
                currentUserId={user?.userId}
                activeTimezone={activeTimezone}
                isMentor={isMentor}
                mentorUserId={user?.userId}
            />

            {/* Hero Section */}
            <HeroSection mentorData={pageMentorData} />

            <ActionCardsSection
                onBecomeMentorClick={() => setShowMentorForm(true)}
                onFindMentorClick={() => setFindMentorOpen(true)}
                isMentor={isMentor}
                userId={user?.userId}
                mentorCount={mentorsLoading ? undefined : impactStats.mentors}
            />

            <FindMentorModal
                isOpen={findMentorOpen}
                onClose={() => setFindMentorOpen(false)}
                mentors={findMentorMentors}
                loading={mentorsLoading}
            />

            {/* Become Mentor Modal */}
            <BecomeMentorModal
                profileImage={profileImageUrl}
                currentUserId={user?.userId}
                isOpen={showMentorForm}
                onClose={() => {
                    setShowMentorForm(false);
                    // clear ?openMentorForm so the next "Apply to unlock" click re-triggers the effect
                    if (searchParams?.get("openMentorForm") && pathname) {
                        window.history.replaceState(null, "", pathname);
                    }
                }}
                formStep={formStep}
                setFormStep={setFormStep}
            />

            {/* Top Mentors Marquee */}
            <div id="top-mentors">
                <MentorMarqueeSection />
            </div>

            {/* Main Discovery Section with Sidebar */}
            <MentorDiscoverySection
                toggleCompare={toggleCompare}
                compareList={compareList}
            />
                        {/* Company Logos (real mentors' companies) */}
                        <CompanyLogosSection mentors={mentorsRaw} />

            {/* 1-to-1 Mentorship Services */}
            <MentorshipServicesSection
                mentorId={pageMentorData?.mentorId || userId}
                mentorName={pageMentorName}
                mentorImage={pageMentorData?.profilePic}
                mentorRole={pageMentorRole}
            />

            {/* Senior 1-to-1 Mentorship Services */}
            <SeniorMentorshipServicesSection />

            {/* Group Sessions */}
            <GroupSessionsSection
                mentorId={pageMentorData?.mentorId || userId}
                mentorName={pageMentorName}
                mentorImage={pageMentorData?.profilePic}
                mentorRole={pageMentorRole}
            />

            {/* Our Impact (real numbers) */}
            <OurImpactSection stats={mentorsLoading ? undefined : impactStats} />

            {/* Unstoppable Advantage */}
            <UnstoppableAdvantageSection />

            {/* CTA Section */}
            <CTASection stats={mentorsLoading ? undefined : impactStats} />

            {/* FAQs */}
            <FAQSection openFaq={openFaq} setOpenFaq={setOpenFaq} />

            {/* Footer */}
            <MentorshipFooter />

            {/* Floating Compare Bar */}
            <CompareBar compareList={compareList} toggleCompare={toggleCompare} />
        </div>
    );
}