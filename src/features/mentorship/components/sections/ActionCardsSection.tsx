"use client";

// features/mentorship/components/sections/ActionCardsSection.tsx
import React, { useEffect, useState } from "react";
import { Search, Users, Star, ArrowRight, Clock, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
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

// ── Helper: resolve card copy based on application status ────────────────────
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
                description: "Your application has been submitted and is awaiting review.",
                cta: "View Application",
                statusIcon: <Clock className="w-3.5 h-3.5 text-amber-300 group-hover:text-amber-300" />,
            };
        case ApplicationStatus.UNDER_REVIEW:
            return {
                title: "Senior Mentor Application",
                description: "Great news — your application is currently under review by our team.",
                cta: "View Status",
                statusIcon: <Clock className="w-3.5 h-3.5 text-blue-300" />,
            };
        case ApplicationStatus.REJECTED:
            return {
                title: "Senior Mentor Application",
                description:
                    application.rejectionReason
                        ? `Your application needs attention: ${application.rejectionReason}`
                        : "Your previous application needs attention. Please update and resubmit.",
                cta: "Update Application",
                statusIcon: <AlertCircle className="w-3.5 h-3.5 text-red-400 group-hover:text-red-300" />,
            };
        case ApplicationStatus.VERIFIED:
            return {
                title: "Senior Mentor",
                description: "Congratulations! Your application has been verified. Welcome to the Senior Mentor community.",
                cta: "View Profile",
                statusIcon: <CheckCircle className="w-3.5 h-3.5 text-emerald-500 group-hover:text-emerald-300" />,
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

// ─────────────────────────────────────────────────────────────────────────────
// Reusable ActionCard — light by default, smoothly transitions to dark on hover
// ─────────────────────────────────────────────────────────────────────────────
interface ActionCardProps {
    onClick: () => void;
    icon: React.ReactNode;
    title: React.ReactNode;
    description: React.ReactNode;
    cta: React.ReactNode;
    disabled?: boolean;
}

function ActionCard({ onClick, icon, title, description, cta, disabled }: ActionCardProps) {
    return (
        <div
            onClick={onClick}
            className={`group relative bg-white rounded-[32px] p-7 border border-[#e8ddd4] shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden hover:-translate-y-2 ${disabled ? "cursor-wait opacity-80" : "cursor-pointer"
                }`}
        >
            {/*
             * DARK GRADIENT OVERLAY — sits at z-0, fades in on hover.
             * CSS cannot transition background-image (gradients), so we use
             * an absolutely-positioned layer that transitions via opacity.
             * All content sits at z-10, above this layer.
             */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#4a3728] via-[#5c4535] to-[#3a2a1e] rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Dot-grid texture — only visible when dark overlay is on */}
            <div
                className="absolute inset-0 rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                    backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                }}
            />

            {/* Shimmer orb top-right — only on hover */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />

            {/* ── All content above the overlays ── */}
            <div className="relative z-10">

                {/* Icon badge */}
                <div className="mb-5">
                    <div className="relative w-fit">
                        {/*
                         * Icon background:
                         *   Default:  solid dark-brown (matches page theme)
                         *   Hover:    frosted glass white/15 (readable on dark overlay)
                         * We layer two divs — one for each state — and cross-fade them.
                         */}
                        <div className="relative w-16 h-16">
                            {/* Default icon bg */}
                            <div className="absolute inset-0 rounded-2xl bg-[#4a3728] shadow-lg opacity-100 group-hover:opacity-0 transition-opacity duration-500" />
                            {/* Hover icon bg */}
                            <div className="absolute inset-0 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            {/* Icon itself — cross-fades colour */}
                            <div className="absolute inset-0 flex items-center justify-center group-hover:scale-105 group-hover:rotate-3 transition-transform duration-500">
                                {icon}
                            </div>
                        </div>

                        {/* Decorative ring */}
                        <div className="absolute -inset-1.5 rounded-2xl border-2 border-[#e8ddd4] group-hover:border-white/20 transition-colors duration-500" />

                        {/* Gold sparkle badge — hidden by default, appears on hover */}
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#c4963a] rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                            <Sparkles className="w-3 h-3 text-white" />
                        </div>
                    </div>
                </div>

                {/* Title */}
                <div className="flex items-center gap-1.5 mb-1.5">
                    <h3 className="text-lg font-black text-[#4a3728] group-hover:text-white transition-colors duration-300">
                        {title}
                    </h3>
                </div>

                {/* Description */}
                <div className="text-xs text-[#8b7355] group-hover:text-white/70 font-medium mb-5 leading-relaxed transition-colors duration-300">
                    {description}
                </div>

                {/* CTA pill button */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wide transition-all duration-300
                    bg-[#f5ede3] border border-[#e8ddd4] text-[#4a3728]
                    group-hover:bg-white/10 group-hover:border-white/25 group-hover:text-white">
                    {cta}
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-300" />
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main section
// ─────────────────────────────────────────────────────────────────────────────
export default function ActionCardsSection({
    onBecomeMentorClick,
    onFindMentorClick,
    isMentor,
    userId,
}: ActionCardsSectionProps) {
    const router = useRouter();

    // ── Senior Mentor Application state ──────────────────────────────────────
    const [seniorApplication, setSeniorApplication] = useState<SeniorMentorApplication | null>(null);
    const [seniorLoading, setSeniorLoading] = useState(false);
    const [seniorError, setSeniorError] = useState(false);

    useEffect(() => {
        if (!userId) return;

        setSeniorLoading(true);
        setSeniorError(false);

        SeniorMentorApplicationService.getMyApplication()
            .then((app) => setSeniorApplication(app))
            .catch(() => {
                console.warn("⚠️ [ActionCards] Could not fetch senior mentor application status.");
                setSeniorError(true);
                setSeniorApplication(null);
            })
            .finally(() => setSeniorLoading(false));
    }, [userId]);

    // ── Resolve CTA navigation for the senior mentor card ────────────────────
    const handleSeniorMentorClick = () => {
        if (seniorLoading) return;

        if (!seniorApplication) {
            router.push("/mentorship/senior-mentor-application");
            return;
        }

        switch (seniorApplication.verificationStatus) {
            case ApplicationStatus.PENDING:
            case ApplicationStatus.UNDER_REVIEW:
            case ApplicationStatus.REJECTED:
                router.push("/mentorship/senior-mentor-application");
                break;
            case ApplicationStatus.VERIFIED:
                router.push(`/mentorship/${seniorApplication.userId}`);
                break;
            default:
                router.push("/mentorship/senior-mentor-application");
        }
    };

    const { title, description, cta, statusIcon } =
        resolveCardContent(seniorLoading ? null : seniorApplication, seniorLoading);

    const gridCols = isMentor
        ? "grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto"
        : "grid-cols-1 md:grid-cols-3";

    return (
        <>
            <section className="px-6 -mt-2 sm:-mt-4 pb-16 max-w-5xl mx-auto">
                <div className={`grid gap-6 ${gridCols}`}>

                    {/* ── Find Mentor ─────────────────────────────────────── */}
                    <ActionCard
                        onClick={onFindMentorClick}
                        icon={<Search className="w-7 h-7 text-white group-hover:text-[#c4963a] transition-colors duration-300" />}
                        title="Find Mentor"
                        description="Connect with 500+ industry experts from top tech companies. Get personalized 1:1 guidance."
                        cta="Explore Mentors"
                    />

                    {/* ── Become Mentor (hidden when already a mentor) ─────── */}
                    {!isMentor && (
                        <ActionCard
                            onClick={onBecomeMentorClick}
                            icon={<Users className="w-7 h-7 text-white group-hover:text-[#c4963a] transition-colors duration-300" />}
                            title="Become Mentor"
                            description="Share your expertise with aspiring professionals. Build your personal brand and earn."
                            cta="Apply Now"
                        />
                    )}

                    {/* ── Become Senior Mentor ─────────────────────────────── */}
                    <ActionCard
                        onClick={handleSeniorMentorClick}
                        disabled={seniorLoading}
                        icon={<Star className="w-7 h-7 text-white group-hover:text-[#c4963a] transition-colors duration-300" />}
                        title={
                            <span className="flex items-center gap-1.5">
                                {title}
                                {statusIcon}
                            </span>
                        }
                        description={
                            seniorLoading ? (
                                <div className="space-y-1.5">
                                    <div className="h-2.5 bg-[#e8ddd4] group-hover:bg-white/15 rounded animate-pulse w-full transition-colors duration-300" />
                                    <div className="h-2.5 bg-[#e8ddd4] group-hover:bg-white/15 rounded animate-pulse w-4/5 transition-colors duration-300" />
                                </div>
                            ) : (
                                seniorError
                                    ? "Share your industry experience and guide the next generation of professionals."
                                    : description
                            )
                        }
                        cta={seniorLoading ? "Loading…" : cta}
                    />

                </div>
            </section>
        </>
    );
}