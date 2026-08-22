"use client";

import React, { useState, useEffect } from "react";
import {
    Navigation,
    // Section Components
    ActionCardsSection,
    HeroSection,
    MentorMarqueeSection,
    MentorDiscoverySection,
    CompanyLogosSection,
    SlotPickerSection,
    MasterclassesSection,
    UpcomingMasterclassesSection,
    OurImpactSection,
    UnstoppableAdvantageSection,
    FAQSection,
    CTASection,

    // // Shared Components
    CompareBar,
    BecomeMentorModal,
    GlobalStyles,
} from "@/features/index";
import MentorshipServicesSection from "@/features/mentorship/components/sections/MentorshipServicesSection";
import GroupSessionsSection from "@/features/mentorship/components/sections/GroupSessionsSection";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useParams, useRouter } from "next/navigation";
import { useProfile } from "@/features/profile/hooks/useProfile";
import MentorService from "@/lib/api/mentorship.service";
import FindMentorModal from "@/features/mentorship/components/sections/FindMentorModal";

export default function ThroneUltraPremium() {
    const router = useRouter();
    const [compareList, setCompareList] = useState<number[]>([]);
    const [activeTimezone, setActiveTimezone] = useState("IST (UTC+5:30)");
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [showMentorForm, setShowMentorForm] = useState(false);
    const [formStep, setFormStep] = useState(1);
    const [isMentor, setIsMentor] = useState(false);
    const params = useParams();
    const { user: currentUser } = useAuth();
    const userId = params.userid as string;
    const [findMentorOpen, setFindMentorOpen] = useState(false);
    const [findMentorMentors, setFindMentorMentors] = useState<any[]>([]);
    const [findMentorLoading, setFindMentorLoading] = useState(false);
    
    // Mentor Data for the landing page mentor
    const [pageMentorData, setPageMentorData] = useState<any>(null);

    const { profileImageUrl, loadProfile } = useProfile();

    const { user } = useAuth();

    const [showDashboard, setShowDashboard] = useState(false);


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
        if (userId) {
            MentorService.getAllMentors()
                .then((res) => {
                    const found = res?.data?.find((m: any) => m.mentorId === userId || m.userId === userId || m.user?.username === userId || m.user?.slug === userId) ?? null;
                    setPageMentorData(found);
                })
                .catch(() => setPageMentorData(null));
        }
    }, [userId]);

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


    const handleHomePage = () => {
        router.push('/dashboard');
    };

    const toggleCompare = (id: number) => {
        if (compareList.includes(id))
            setCompareList(compareList.filter((item) => item !== id));
        else if (compareList.length < 3) setCompareList([...compareList, id]);
    };

    const handleFindMentorOpen = () => {
        setFindMentorOpen(true);
        if (findMentorMentors.length === 0) {
            setFindMentorLoading(true);
            MentorService.getAllMentors({ page: 1, limit: 50 })
                .then((res) => {
                    const list = Array.isArray(res.data) ? res.data : [];
                    const mapped = list.map((m: any) => ({
                        id: m.mentorId,
                        name: `${m.user?.firstName ?? ""} ${m.user?.lastName ?? ""}`.trim(),
                        role: m.experience?.currentRole?.split(" at ")[0] ?? "Mentor",
                        company: m.experience?.currentRole?.split(" at ")[1] ?? "",
                        rating: m.stats?.averageRating || 0,
                        sessions: m.stats?.totalSessions || 0,
                        price: m.pricing?.quickCall || 0,
                        tags: m.skills?.slice(0, 2) ?? [],
                        image: m.profilePic ?? "",
                    }));
                    setFindMentorMentors(mapped);
                })
                .catch(() => setFindMentorMentors([]))
                .finally(() => setFindMentorLoading(false));
        }
    };

    return (
        <div className="min-h-screen bg-[#FAF9F6] text-[#4a3728] font-sans selection:bg-[#4a3728] selection:text-white">
            <GlobalStyles />

            {/* Navigation */}
            <Navigation
                currentUserId={user?.userId}
                activeTimezone={activeTimezone}
                isMentor={isMentor}
                mentorUserId={user?.userId}
            />

            {/* Hero Section */}
            <HeroSection />

            {/* Action Cards - Find Mentor & Become Mentor */}
            <ActionCardsSection
                onBecomeMentorClick={() => setShowMentorForm(true)}
                onFindMentorClick={handleFindMentorOpen}
                isMentor={isMentor}
                userId={user?.userId}
            />

            <FindMentorModal
                isOpen={findMentorOpen}
                onClose={() => setFindMentorOpen(false)}
                mentors={findMentorMentors}       // ADD
                loading={findMentorLoading}       // ADD
            />

            {/* Become Mentor Modal */}
            <BecomeMentorModal
                profileImage={profileImageUrl}
                currentUserId={user?.userId}
                isOpen={showMentorForm}
                onClose={() => setShowMentorForm(false)}
                formStep={formStep}
                setFormStep={setFormStep}
            />


            {/* <BecomeMentorCards
                showMentorForm={showMentorForm}
                setShowMentorForm={setShowMentorForm}
                formStep={formStep}
                setFormStep={setFormStep}
                onSubmit={() => setShowDashboard(true)}
            /> */}

            {/* Top Mentors Marquee */}
            <MentorMarqueeSection />

            {/* Main Discovery Section with Sidebar */}
            <MentorDiscoverySection
                toggleCompare={toggleCompare}
                compareList={compareList}
            />

            {/* Company Logos */}
            <CompanyLogosSection />

            {/* 1-to-1 Mentorship Services */}
            <MentorshipServicesSection 
                mentorId={pageMentorData?.mentorId || userId} 
                mentorName={pageMentorData ? `${pageMentorData.user?.firstName ?? ""} ${pageMentorData.user?.lastName ?? ""}`.trim() : ""}
                mentorImage={pageMentorData?.profilePic}
                mentorRole={pageMentorData?.experience?.currentRole?.split(" at ")[0]}
            />

            {/* Group Sessions */}
            <GroupSessionsSection 
                mentorId={pageMentorData?.mentorId || userId} 
                mentorName={pageMentorData ? `${pageMentorData.user?.firstName ?? ""} ${pageMentorData.user?.lastName ?? ""}`.trim() : ""}
                mentorImage={pageMentorData?.profilePic}
                mentorRole={pageMentorData?.experience?.currentRole?.split(" at ")[0]}
            />

            {/* Our Impact */}
            <OurImpactSection />

            {/* Unstoppable Advantage */}
            <UnstoppableAdvantageSection />

            {/* CTA Section */}
            <CTASection />

            {/* FAQs */}
            <FAQSection openFaq={openFaq} setOpenFaq={setOpenFaq} />

            {/* Floating Compare Bar */}
            <CompareBar compareList={compareList} toggleCompare={toggleCompare} />
        </div>
    );
}