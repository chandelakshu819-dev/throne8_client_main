"use client";
//src/features/mentorship/components/sections/ActionCardsSection.tsx
import React, { useEffect, useState } from "react";
import {
    Search,
    Users,
    Star,
    ArrowRight,
    Clock,
    CheckCircle,
    AlertCircle,
    Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";

import SeniorMentorApplicationService, {
    ApplicationStatus,
    SeniorMentorApplication,
} from "@/lib/api/seniorMentorApplication.service";
import { formatCountLabel } from "@/shared/utils/mentorFormat";
import { useMyRoles } from "@/features/mentorship/hooks/useMentorRole";


export interface ActionCardsSectionProps {
    onBecomeMentorClick: () => void;
    onFindMentorClick: () => void;
    isMentor?: boolean;
    userId?: string;
    /** Real mentors count (page se aata hai). Na ho to number nahi dikhaya jayega. */
    mentorCount?: number;
    isLoading?: boolean;
    isLoggedIn?: boolean;
}

// Senior Mentor = college ke 3rd/4th year students jo juniors ko guide karte hain
const DEFAULT_SENIOR_DESC =
    "Guide your juniors on college life, placements and skills. Build your profile and start mentoring early.";

const SENIOR_AUDIENCE = "For 3rd and 4th year college students";

// Mentor = industry professionals
const MENTOR_AUDIENCE = "For working industry professionals";
const MENTOR_DESC =
    "Share your industry experience with students and early talent. Build your personal brand and earn.";

// Senior Mentor card content (application status ke hisaab se)
function resolveCardContent(application: SeniorMentorApplication | null, isLoading: boolean) {
    if (isLoading) {
        return {
            title: "Become College Mentor",
            audience: SENIOR_AUDIENCE,
            description: "Checking your application status...",
            cta: "Loading...",
            statusIcon: null as React.ReactNode,
        };
    }

    if (!application) {
        return {
            title: "Become College Mentor",
            audience: SENIOR_AUDIENCE,
            description: DEFAULT_SENIOR_DESC,
            cta: "Apply Now",
            statusIcon: null as React.ReactNode,
        };
    }

    switch (application.verificationStatus) {
        case ApplicationStatus.PENDING:
            return {
                title: "College Mentor Application",
                audience: "Your application",
                description: "Your application has been submitted and is awaiting review.",
                cta: "View Application",
                statusIcon: <Clock className="w-3.5 h-3.5 text-amber-300" />,
            };
        case ApplicationStatus.UNDER_REVIEW:
            return {
                title: "College Mentor Application",
                audience: "Your application",
                description: "Great news, your application is currently under review by our team.",
                cta: "View Status",
                statusIcon: <Clock className="w-3.5 h-3.5 text-blue-300" />,
            };
        case ApplicationStatus.REJECTED:
            return {
                title: "College Mentor Application",
                audience: "Your application",
                description: application.rejectionReason
                    ? `Your application needs attention: ${application.rejectionReason}`
                    : "Your previous application needs attention. Please update and resubmit.",
                cta: "Update Application",
                statusIcon: <AlertCircle className="w-3.5 h-3.5 text-red-400" />,
            };
        case ApplicationStatus.VERIFIED:
            return {
                title: "College Mentor",
                audience: "Verified",
                description:
                    "Congratulations! Your application has been verified. Welcome to the Senior Mentor community.",
                cta: "View Profile",
                statusIcon: <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />,
            };
        default:
            return {
                title: "Become College Mentor",
                audience: SENIOR_AUDIENCE,
                description: DEFAULT_SENIOR_DESC,
                cta: "Apply Now",
                statusIcon: null as React.ReactNode,
            };
    }
}

// Reusable Action Card
interface ActionCardProps {
    onClick: () => void;
    icon: React.ReactNode;
    audience?: React.ReactNode;
    title: React.ReactNode;
    description: React.ReactNode;
    cta: React.ReactNode;
    disabled?: boolean;
}

function ActionCard({ onClick, icon, audience, title, description, cta, disabled }: ActionCardProps) {
    const handle = () => {
        if (!disabled) onClick();
    };

    return (
        <div
            role="button"
            tabIndex={0}
            aria-disabled={disabled}
            onClick={handle}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handle()}
            className={`group relative h-full min-h-[250px] w-full cursor-pointer overflow-hidden rounded-[24px] border border-[#e8ddd4] bg-white p-5 shadow-[0_4px_12px_rgba(74,55,40,0.06)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(74,55,40,0.14)] ${
                disabled ? "cursor-wait opacity-80" : ""
            }`}
        >
            {/* Dark hover background */}
            <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-[#4a3728] via-[#5c4535] to-[#3a2a1e] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            {/* Dot grid on hover */}
            <div
                className="absolute inset-0 rounded-[24px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                    backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                }}
            />

            {/* Glow */}
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/5 opacity-0 blur-3xl transition-all duration-700 group-hover:scale-110 group-hover:opacity-100" />

            <div className="relative z-10 flex h-full flex-col">
                {/* Icon */}
                <div className="relative mb-3 w-fit">
                    <div className="relative h-12 w-12">
                        <div className="absolute inset-0 rounded-2xl bg-[#4a3728] shadow-md opacity-100 transition-opacity duration-500 group-hover:opacity-0" />
                        <div className="absolute inset-0 rounded-2xl border border-white/20 bg-white/15 shadow-md backdrop-blur-sm opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                        <div className="absolute inset-0 flex items-center justify-center transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3">
                            {icon}
                        </div>
                    </div>

                    <div className="absolute -inset-1 rounded-xl border border-[#e8ddd4] transition-colors duration-500 group-hover:border-white/20" />

                    <div className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#c4963a] shadow-md opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <Sparkles className="h-3 w-3 text-white" />
                    </div>
                </div>

                {/* Audience line */}
                {audience && (
                    <div className="mb-1 text-[10.5px] font-bold uppercase tracking-[1.2px] text-[#a08568] transition-colors duration-300 group-hover:text-white/60">
                        {audience}
                    </div>
                )}

                {/* Title */}
                <div className="mb-1">
                    <h3 className="text-[18px] font-black leading-tight text-[#4a3728] transition-colors duration-300 group-hover:text-white">
                        {title}
                    </h3>
                </div>

                {/* Description */}
                <div className="max-w-[350px] text-[13px] font-medium leading-[1.5] text-[#8b7355] transition-colors duration-300 group-hover:text-white/70">
                    {description}
                </div>

                {/* CTA: mt-auto + pt-4 se buttons ek line me neeche align honge */}
                <div className="mt-auto pt-4">
                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#e8ddd4] bg-[#f5ede3] px-4 py-2 text-[11px] font-black uppercase tracking-wide text-[#4a3728] transition-all duration-300 group-hover:border-white/25 group-hover:bg-white/10 group-hover:text-white">
                        {cta}
                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </div>
                </div>
            </div>
        </div>
    );
}

const ICON_CLASS = "h-6 w-6 text-white transition-colors duration-300 group-hover:text-[#c4963a]";

// Main Section
export default function ActionCardsSection({
    onBecomeMentorClick,
    onFindMentorClick,
    isMentor,
    userId,
    mentorCount,
    isLoading = false,
    isLoggedIn,
}: ActionCardsSectionProps) {
    const router = useRouter();
    const { roles, loading: rolesLoading } = useMyRoles(Boolean(userId), userId);

    const [seniorApplication, setSeniorApplication] = useState<SeniorMentorApplication | null>(null);
    const [seniorLoading, setSeniorLoading] = useState(false);
    const [seniorError, setSeniorError] = useState(false);

    useEffect(() => {
        if (!userId) return;

        let active = true;
        setSeniorLoading(true);
        setSeniorError(false);

        SeniorMentorApplicationService.getMyApplication()
            .then((app) => active && setSeniorApplication(app))
            .catch(() => {
                if (!active) return;
                console.warn("[ActionCards] Could not fetch senior mentor application status.");
                setSeniorError(true);
                setSeniorApplication(null);
            })
            .finally(() => active && setSeniorLoading(false));

        return () => {
            active = false;
        };
    }, [userId]);

    const handleSeniorMentorClick = () => {
        if (seniorLoading) return;

        if (seniorApplication?.verificationStatus === ApplicationStatus.VERIFIED) {
            router.push(`/mentorship/${seniorApplication.userId}`);
            return;
        }
        router.push("/mentorship/senior-mentor-application");
    };

    const { title, audience, description, cta, statusIcon } = resolveCardContent(
        seniorLoading ? null : seniorApplication,
        seniorLoading
    );

    const countLabel = formatCountLabel(mentorCount);
    const findMentorDescription = countLabel
        ? `Connect with ${countLabel} mentors from college and industry. Get personalized 1:1 guidance.`
        : "Connect with mentors from college and industry. Get personalized 1:1 guidance.";

    // Loading State: While auth is resolving or logged-in user roles are loading,
    // render skeleton to prevent premature flash of 3 cards or layout shift.
    const isRolesLoading = Boolean(userId) && (rolesLoading || seniorLoading);
    const isSectionLoading = isLoading || isRolesLoading;

    if (isSectionLoading) {
        return (
            <section className="w-full px-6 pb-10 min-h-[300px]">
                <div className="mx-auto w-full max-w-[1160px]">
                    <div className="mx-auto w-full max-w-md motion-reduce:animate-none animate-pulse">
                        <div className="relative min-h-[250px] w-full rounded-[24px] border border-[#e8ddd4] bg-white p-5 shadow-[0_4px_12px_rgba(74,55,40,0.06)] flex flex-col justify-between">
                            <div>
                                <div className="mb-3 h-12 w-12 rounded-2xl bg-[#f0e8de]" />
                                <div className="mb-2 h-3 w-28 rounded bg-[#f0e8de]" />
                                <div className="mb-2 h-5 w-40 rounded bg-[#f0e8de]" />
                                <div className="space-y-1.5 mt-2 max-w-[320px]">
                                    <div className="h-3 w-full rounded bg-[#f0e8de]" />
                                    <div className="h-3 w-4/5 rounded bg-[#f0e8de]" />
                                </div>
                            </div>
                            <div className="pt-4">
                                <div className="h-8 w-28 rounded-full bg-[#f0e8de]" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    // Role Verification Checks:
    // - Industry Mentor: approved/active in Mentor collection
    const isIndustryMentorApproved =
        roles?.seniorMentor === "approved" ||
        (isMentor === true && roles?.seniorMentor !== "pending" && roles?.seniorMentor !== "rejected");

    // - College Mentor: approved/verified in SeniorMentorApplication
    const isCollegeMentorApproved =
        roles?.industryMentor === "approved" ||
        ["verified", "approved", "active"].includes(
            String(seniorApplication?.verificationStatus ?? "").toLowerCase()
        );

    // Required Visibility Matrix:
    // - Find Mentor: ALWAYS visible
    // - Become Industry Mentor: Visible UNLESS user is an approved Industry Mentor
    // - Become College Mentor: Visible UNLESS user is an approved College Mentor
    const showFindMentor = true;
    const showIndustryMentor = !isIndustryMentorApproved;
    const showCollegeMentor = !isCollegeMentorApproved;

    const visibleCardCount =
        (showFindMentor ? 1 : 0) +
        (showIndustryMentor ? 1 : 0) +
        (showCollegeMentor ? 1 : 0);

    const gridCols =
        visibleCardCount >= 3
            ? "grid-cols-1 md:grid-cols-3 max-w-[1160px] mx-auto"
            : visibleCardCount === 2
            ? "grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto"
            : "grid-cols-1 max-w-md mx-auto";

    return (
        <section className="w-full px-6 pb-10 min-h-[300px]">
            <div className="mx-auto w-full max-w-[1160px]">
                <div className={`grid items-stretch gap-5 ${gridCols}`}>
                    {/* 1. FIND MENTOR - ALWAYS VISIBLE */}
                    <ActionCard
                        onClick={onFindMentorClick}
                        icon={<Search className={ICON_CLASS} />}
                        audience="For learners at every stage"
                        title="Find Mentor"
                        description={findMentorDescription}
                        cta="Get Matched"
                    />

                    {/* 2. BECOME INDUSTRY MENTOR - Visible to Normal Users & College Mentors */}
                    {showIndustryMentor && (
                        <ActionCard
                            onClick={onBecomeMentorClick}
                            icon={<Users className={ICON_CLASS} />}
                            audience={MENTOR_AUDIENCE}
                            title="Become Industry Mentor"
                            description={MENTOR_DESC}
                            cta="Apply Now"
                        />
                    )}

                    {/* 3. BECOME COLLEGE MENTOR - Visible to Normal Users & Industry Mentors */}
                    {showCollegeMentor && (
                        <ActionCard
                            onClick={handleSeniorMentorClick}
                            disabled={seniorLoading}
                            icon={<Star className={ICON_CLASS} />}
                            audience={audience}
                            title={
                                <span className="flex items-center gap-1.5">
                                    {title}
                                    {statusIcon}
                                </span>
                            }
                            description={
                                seniorLoading ? (
                                    <div className="space-y-1.5">
                                        <div className="h-2 w-full animate-pulse rounded bg-[#e8ddd4] transition-colors group-hover:bg-white/15" />
                                        <div className="h-2 w-4/5 animate-pulse rounded bg-[#e8ddd4] transition-colors group-hover:bg-white/15" />
                                    </div>
                                ) : seniorError ? (
                                    DEFAULT_SENIOR_DESC
                                ) : (
                                    description
                                )
                            }
                            cta={seniorLoading ? "Loading..." : cta}
                        />
                    )}
                </div>
            </div>
        </section>
    );
}
