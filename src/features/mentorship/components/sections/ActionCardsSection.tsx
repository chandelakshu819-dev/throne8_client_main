"use client";

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

interface ActionCardsSectionProps {
    onBecomeMentorClick: () => void;
    onFindMentorClick: () => void;
    isMentor?: boolean;
    userId?: string;
}


// ─────────────────────────────────────────────────────────────
// Senior Mentor card content based on application status
// ─────────────────────────────────────────────────────────────

function resolveCardContent(
    application: SeniorMentorApplication | null,
    isLoading: boolean
): {
    title: string;
    description: string;
    cta: string;
    statusIcon: React.ReactNode | null;
} {
    if (isLoading) {
        return {
            title: "Become Senior Mentor",
            description: "Checking your application status…",
            cta: "Loading…",
            statusIcon: null,
        };
    }

    if (!application) {
        return {
            title: "Become Senior Mentor",
            description:
                "Share your industry experience, guide aspiring professionals, and help shape the next generation of talent.",
            cta: "Apply Now",
            statusIcon: null,
        };
    }

    switch (application.verificationStatus) {
        case ApplicationStatus.PENDING:
            return {
                title: "Senior Mentor Application",
                description:
                    "Your application has been submitted and is awaiting review.",
                cta: "View Application",
                statusIcon: (
                    <Clock className="w-3.5 h-3.5 text-amber-300" />
                ),
            };

        case ApplicationStatus.UNDER_REVIEW:
            return {
                title: "Senior Mentor Application",
                description:
                    "Great news — your application is currently under review by our team.",
                cta: "View Status",
                statusIcon: (
                    <Clock className="w-3.5 h-3.5 text-blue-300" />
                ),
            };

        case ApplicationStatus.REJECTED:
            return {
                title: "Senior Mentor Application",
                description: application.rejectionReason
                    ? `Your application needs attention: ${application.rejectionReason}`
                    : "Your previous application needs attention. Please update and resubmit.",
                cta: "Update Application",
                statusIcon: (
                    <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                ),
            };

        case ApplicationStatus.VERIFIED:
            return {
                title: "Senior Mentor",
                description:
                    "Congratulations! Your application has been verified. Welcome to the Senior Mentor community.",
                cta: "View Profile",
                statusIcon: (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                ),
            };

        default:
            return {
                title: "Become Senior Mentor",
                description:
                    "Share your industry experience, guide aspiring professionals, and help shape the next generation of talent.",
                cta: "Apply Now",
                statusIcon: null,
            };
    }
}


// ─────────────────────────────────────────────────────────────
// Reusable Action Card
// ─────────────────────────────────────────────────────────────

interface ActionCardProps {
    onClick: () => void;
    icon: React.ReactNode;
    title: React.ReactNode;
    description: React.ReactNode;
    cta: React.ReactNode;
    disabled?: boolean;
}

function ActionCard({
    onClick,
    icon,
    title,
    description,
    cta,
    disabled,
}: ActionCardProps) {
    return (
        <div
            onClick={onClick}
            className={`
                group
                relative
                h-[220px]
                w-full
                cursor-pointer
                overflow-hidden
                rounded-[24px]
                border
                border-[#e8ddd4]
                bg-white
                p-5
                shadow-[0_4px_12px_rgba(74,55,40,0.06)]
                transition-all
                duration-500

                hover:-translate-y-1
                hover:shadow-[0_12px_28px_rgba(74,55,40,0.14)]

                ${disabled ? "cursor-wait opacity-80" : ""}
            `}
        >

            {/* ─────────────────────────────────────────────
                Dark hover background
            ───────────────────────────────────────────── */}

            <div
                className="
                    absolute
                    inset-0
                    rounded-[24px]
                    bg-gradient-to-br
                    from-[#4a3728]
                    via-[#5c4535]
                    to-[#3a2a1e]
                    opacity-0
                    transition-opacity
                    duration-500
                    group-hover:opacity-100
                "
            />

            {/* Dot grid on hover */}

            <div
                className="
                    absolute
                    inset-0
                    rounded-[24px]
                    opacity-0
                    transition-opacity
                    duration-500
                    group-hover:opacity-100
                "
                style={{
                    backgroundImage:
                        "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                }}
            />

            {/* Glow */}

            <div
                className="
                    absolute
                    right-0
                    top-0
                    h-40
                    w-40
                    rounded-full
                    bg-white/5
                    opacity-0
                    blur-3xl
                    transition-all
                    duration-700
                    group-hover:scale-110
                    group-hover:opacity-100
                "
            />


            {/* ─────────────────────────────────────────────
                Card Content
            ───────────────────────────────────────────── */}

            <div className="relative z-10 flex h-full flex-col">


                {/* Icon */}

                <div className="relative mb-3 w-fit">

                    <div className="relative h-12 w-12">

                        {/* Normal icon background */}

                        <div
                            className="
                                absolute
                                inset-0
                                rounded-2xl
                                bg-[#4a3728]
                                shadow-md
                                opacity-100
                                transition-opacity
                                duration-500
                                group-hover:opacity-0
                            "
                        />

                        {/* Hover icon background */}

                        <div
                            className="
                                absolute
                                inset-0
                                rounded-2xl
                                border
                                border-white/20
                                bg-white/15
                                shadow-md
                                backdrop-blur-sm
                                opacity-0
                                transition-opacity
                                duration-500
                                group-hover:opacity-100
                            "
                        />

                        {/* Icon */}

                        <div
                            className="
                                absolute
                                inset-0
                                flex
                                items-center
                                justify-center
                                transition-transform
                                duration-500
                                group-hover:scale-105
                                group-hover:rotate-3
                            "
                        >
                            {icon}
                        </div>

                    </div>


                    {/* Decorative ring */}

                    <div
                        className="
                            absolute
                            -inset-1
                            rounded-xl
                            border
                            border-[#e8ddd4]
                            transition-colors
                            duration-500
                            group-hover:border-white/20
                        "
                    />

                    {/* Sparkle */}

                    <div
                        className="
                            absolute
                            -right-1.5
                            -top-1.5
                            flex
                            h-5
                            w-5
                            items-center
                            justify-center
                            rounded-full
                            bg-[#c4963a]
                            shadow-md
                            opacity-0
                            transition-opacity
                            duration-300
                            group-hover:opacity-100
                        "
                    >
                        <Sparkles className="h-3 w-3 text-white" />
                    </div>

                </div>


                {/* Title */}

                <div className="mb-1">
                    <h3
                        className="
                            text-[18px]
                            font-black
                            leading-tight
                            text-[#4a3728]
                            transition-colors
                            duration-300
                            group-hover:text-white
                        "
                    >
                        {title}
                    </h3>
                </div>


                {/* Description */}

                <div
                    className="
                        max-w-[350px]
                        text-[13px]
                        font-medium
                        leading-[1.5]
                        text-[#8b7355]
                        transition-colors
                        duration-300
                        group-hover:text-white/70
                    "
                >
                    {description}
                </div>


                {/* CTA */}

                <div
                    className="
                        mt-auto
                        inline-flex
                        w-fit
                        items-center
                        gap-2
                        rounded-full
                        border
                        border-[#e8ddd4]
                        bg-[#f5ede3]
                        px-4
                        py-2
                        text-[11px]
                        font-black
                        uppercase
                        tracking-wide
                        text-[#4a3728]
                        transition-all
                        duration-300

                        group-hover:border-white/25
                        group-hover:bg-white/10
                        group-hover:text-white
                    "
                >
                    {cta}

                    <ArrowRight
                        className="
                            h-3.5
                            w-3.5
                            transition-transform
                            duration-300
                            group-hover:translate-x-0.5
                        "
                    />
                </div>

            </div>

        </div>
    );
}


// ─────────────────────────────────────────────────────────────
// Main Section
// ─────────────────────────────────────────────────────────────

export default function ActionCardsSection({
    onBecomeMentorClick,
    onFindMentorClick,
    isMentor,
    userId,
}: ActionCardsSectionProps) {

    const router = useRouter();

    // Senior Mentor application state

    const [seniorApplication, setSeniorApplication] =
        useState<SeniorMentorApplication | null>(null);

    const [seniorLoading, setSeniorLoading] =
        useState(false);

    const [seniorError, setSeniorError] =
        useState(false);


    // ─────────────────────────────────────────────
    // Get current user's senior mentor application
    // ─────────────────────────────────────────────

    useEffect(() => {

        if (!userId) return;

        setSeniorLoading(true);
        setSeniorError(false);

        SeniorMentorApplicationService.getMyApplication()

            .then((app) => {
                setSeniorApplication(app);
            })

            .catch(() => {

                console.warn(
                    "⚠️ [ActionCards] Could not fetch senior mentor application status."
                );

                setSeniorError(true);
                setSeniorApplication(null);

            })

            .finally(() => {
                setSeniorLoading(false);
            });

    }, [userId]);


    // ─────────────────────────────────────────────
    // Senior Mentor navigation
    // ─────────────────────────────────────────────

    const handleSeniorMentorClick = () => {

        if (seniorLoading) return;

        if (!seniorApplication) {

            router.push(
                "/mentorship/senior-mentor-application"
            );

            return;
        }


        switch (seniorApplication.verificationStatus) {

            case ApplicationStatus.PENDING:

            case ApplicationStatus.UNDER_REVIEW:

            case ApplicationStatus.REJECTED:

                router.push(
                    "/mentorship/senior-mentor-application"
                );

                break;


            case ApplicationStatus.VERIFIED:

                router.push(
                    `/mentorship/${seniorApplication.userId}`
                );

                break;


            default:

                router.push(
                    "/mentorship/senior-mentor-application"
                );

        }
    };


    const {
        title,
        description,
        cta,
        statusIcon,
    } = resolveCardContent(
        seniorLoading ? null : seniorApplication,
        seniorLoading
    );


    // ─────────────────────────────────────────────
    // Grid
    // ─────────────────────────────────────────────

    const gridCols = isMentor
        ? "grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto"
        : "grid-cols-1 md:grid-cols-3";


    return (
        <section
            className="
                w-full
                px-6
                pb-10
            "
        >

            <div
                className="
                    mx-auto
                    w-full
                    max-w-[1160px]
                "
            >

                <div
                    className={`
                        grid
                        gap-5
                        ${gridCols}
                    `}
                >


                    {/* ═══════════════════════════════════════
                        FIND MENTOR
                    ═══════════════════════════════════════ */}

                    <ActionCard

                        onClick={onFindMentorClick}

                        icon={
                            <Search
                                className="
                                    h-6
                                    w-6
                                    text-white
                                    transition-colors
                                    duration-300
                                    group-hover:text-[#c4963a]
                                "
                            />
                        }

                        title="Find Mentor"

                        description="
                            Connect with 500+ industry experts from top tech companies.
                            Get personalized 1:1 guidance.
                        "

                        cta="Explore Mentors"
                    />


                    {/* ═══════════════════════════════════════
                        BECOME MENTOR
                    ═══════════════════════════════════════ */}

                    {!isMentor && (

                        <ActionCard

                            onClick={onBecomeMentorClick}

                            icon={
                                <Users
                                    className="
                                        h-6
                                        w-6
                                        text-white
                                        transition-colors
                                        duration-300
                                        group-hover:text-[#c4963a]
                                    "
                                />
                            }

                            title="Become Mentor"

                            description="
                                Share your expertise with aspiring professionals.
                                Build your personal brand and earn.
                            "

                            cta="Apply Now"
                        />

                    )}


                    {/* ═══════════════════════════════════════
                        BECOME SENIOR MENTOR
                    ═══════════════════════════════════════ */}

                    <ActionCard

                        onClick={handleSeniorMentorClick}

                        disabled={seniorLoading}

                        icon={
                            <Star
                                className="
                                    h-6
                                    w-6
                                    text-white
                                    transition-colors
                                    duration-300
                                    group-hover:text-[#c4963a]
                                "
                            />
                        }

                        title={
                            <span className="flex items-center gap-1.5">

                                {title}

                                {statusIcon}

                            </span>
                        }

                        description={
                            seniorLoading ? (

                                <div className="space-y-1.5">

                                    <div
                                        className="
                                            h-2
                                            w-full
                                            animate-pulse
                                            rounded
                                            bg-[#e8ddd4]
                                            transition-colors
                                            group-hover:bg-white/15
                                        "
                                    />

                                    <div
                                        className="
                                            h-2
                                            w-4/5
                                            animate-pulse
                                            rounded
                                            bg-[#e8ddd4]
                                            transition-colors
                                            group-hover:bg-white/15
                                        "
                                    />

                                </div>

                            ) : (

                                seniorError

                                    ? "Share your industry experience and guide the next generation of professionals."

                                    : description

                            )
                        }

                        cta={
                            seniorLoading
                                ? "Loading…"
                                : cta
                        }

                    />

                </div>

            </div>

        </section>
    );
}