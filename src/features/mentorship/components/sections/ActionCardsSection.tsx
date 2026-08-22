"use client";

// features/mentorship/components/sections/ActionCardsSection.tsx
import React, { useEffect, useState } from "react";
import { Search, Users, Star, ArrowRight, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import SeniorMentorApplicationService, {
    ApplicationStatus,
    SeniorMentorApplication,
} from "@/lib/api/seniorMentorApplication.service";

interface ActionCardsSectionProps {
    onBecomeMentorClick: () => void;
    onFindMentorClick: () => void;
    isMentor?: boolean;
    /** Pass the authenticated userId so the card can fetch the user's existing application */
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
    statusColor: string;
} {
    if (isLoading) {
        return {
            title: "Become Senior Mentor",
            description: "Checking your application status…",
            cta: "Loading…",
            statusIcon: null,
            statusColor: "text-[#4a3728]",
        };
    }

    if (!application) {
        return {
            title: "Become Senior Mentor",
            description:
                "Share your industry experience, guide aspiring professionals, and help shape the next generation of talent.",
            cta: "Apply Now",
            statusIcon: null,
            statusColor: "text-[#4a3728]",
        };
    }

    switch (application.verificationStatus) {
        case ApplicationStatus.PENDING:
            return {
                title: "Senior Mentor Application",
                description: "Your application has been submitted and is awaiting review.",
                cta: "View Application",
                statusIcon: <Clock className="w-3.5 h-3.5 text-amber-500" />,
                statusColor: "text-amber-600",
            };

        case ApplicationStatus.UNDER_REVIEW:
            return {
                title: "Senior Mentor Application",
                description: "Great news — your application is currently under review by our team.",
                cta: "View Status",
                statusIcon: <Clock className="w-3.5 h-3.5 text-blue-500" />,
                statusColor: "text-blue-600",
            };

        case ApplicationStatus.REJECTED:
            return {
                title: "Senior Mentor Application",
                description:
                    application.rejectionReason
                        ? `Your application needs attention: ${application.rejectionReason}`
                        : "Your previous application needs attention. Please update and resubmit.",
                cta: "Update Application",
                statusIcon: <AlertCircle className="w-3.5 h-3.5 text-red-400" />,
                statusColor: "text-red-500",
            };

        case ApplicationStatus.VERIFIED:
            return {
                title: "Senior Mentor",
                description: "Congratulations! Your application has been verified. Welcome to the Senior Mentor community.",
                cta: "View Profile",
                statusIcon: <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />,
                statusColor: "text-emerald-600",
            };

        default:
            return {
                title: "Become Senior Mentor",
                description:
                    "Share your industry experience, guide aspiring professionals, and help shape the next generation of talent.",
                cta: "Apply Now",
                statusIcon: null,
                statusColor: "text-[#4a3728]",
            };
    }
}

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
        if (!userId) return; // Not logged in — skip fetch

        setSeniorLoading(true);
        setSeniorError(false);

        SeniorMentorApplicationService.getMyApplication()
            .then((app) => setSeniorApplication(app))
            .catch(() => {
                // Graceful fallback — do not crash the page
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
            // No application yet → go to the apply page
            router.push("/mentorship/senior-mentor-application");
            return;
        }

        switch (seniorApplication.verificationStatus) {
            case ApplicationStatus.PENDING:
            case ApplicationStatus.UNDER_REVIEW:
            case ApplicationStatus.REJECTED:
                // View / update existing application
                router.push("/mentorship/senior-mentor-application");
                break;
            case ApplicationStatus.VERIFIED:
                // Go to their mentor profile — use the existing user-based route
                router.push(`/mentorship/${seniorApplication.userId}`);
                break;
            default:
                router.push("/mentorship/senior-mentor-application");
        }
    };

    const { title, description, cta, statusIcon, statusColor } =
        resolveCardContent(seniorLoading ? null : seniorApplication, seniorLoading);

    // ── Grid columns: 3 when isMentor is false (all 3 cards show), else 2 ───
    const gridCols = isMentor
        ? "grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto"
        : "grid-cols-1 md:grid-cols-3";

    return (
        <>
            <section className="px-6 pb-16 max-w-5xl mx-auto">
                <div className={`grid gap-8 ${gridCols}`}>

                    {/* ── Find Mentor Card ────────────────────────────────────── */}
                    <div
                        onClick={onFindMentorClick}
                        className="group relative bg-white rounded-[32px] p-6 border border-[#ece7e2] shadow-lg hover:shadow-2xl transition-all duration-700 cursor-pointer overflow-hidden hover:-translate-y-2 animate-float-slow"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-[#4a3728]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#4a3728]/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-150" />
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-[#4a3728] rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-md">
                                <Search className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-black mb-2 group-hover:text-[#8b7355] transition-colors">
                                Find Mentor
                            </h3>
                            <p className="text-xs text-slate-500 font-medium mb-3 leading-relaxed">
                                Connect with 500+ industry experts from top tech companies. Get
                                personalized 1:1 guidance.
                            </p>
                            <div className="flex items-center gap-2 text-[#8b7355] font-bold text-xs group-hover:gap-4 transition-all">
                                Explore Mentors{" "}
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </div>

                    {/* ── Become Mentor Card (hidden when already a mentor) ───── */}
                    {!isMentor && (
                        <div
                            className="group relative bg-white rounded-[32px] p-6 border border-[#ece7e2] shadow-lg hover:shadow-2xl transition-all duration-700 cursor-pointer overflow-hidden hover:-translate-y-2 animate-float-slow-delayed"
                            onClick={onBecomeMentorClick}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-[#8b7355]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#8b7355]/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-150" />
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-[#8b7355] rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-md">
                                    <Users className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-xl font-black mb-2 group-hover:text-[#4a3728] transition-colors">
                                    Become Mentor
                                </h3>
                                <p className="text-xs text-slate-500 font-medium mb-3 leading-relaxed">
                                    Share your expertise with aspiring professionals. Build your personal
                                    brand and earn.
                                </p>
                                <div className="flex items-center gap-2 text-[#4a3728] font-bold text-xs group-hover:gap-4 transition-all">
                                    Apply Now{" "}
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Become Senior Mentor Card ───────────────────────────── */}
                    <div
                        onClick={handleSeniorMentorClick}
                        aria-label={`${title} — ${cta}`}
                        className={`group relative bg-white rounded-[32px] p-6 border border-[#ece7e2] shadow-lg hover:shadow-2xl transition-all duration-700 overflow-hidden hover:-translate-y-2 animate-float-slow ${
                            seniorLoading ? "cursor-wait opacity-80" : "cursor-pointer"
                        }`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-[#4a3728]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#4a3728]/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-150" />
                        <div className="relative z-10">

                            {/* Icon */}
                            <div className="w-12 h-12 bg-[#4a3728] rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-md">
                                <Star className="w-6 h-6 text-white" />
                            </div>

                            {/* Title + status badge */}
                            <div className="flex items-center gap-1.5 mb-2">
                                <h3 className="text-xl font-black group-hover:text-[#8b7355] transition-colors">
                                    {title}
                                </h3>
                                {statusIcon}
                            </div>

                            {/* Description — skeleton while loading */}
                            {seniorLoading ? (
                                <div className="space-y-1.5 mb-3">
                                    <div className="h-2.5 bg-slate-100 rounded animate-pulse w-full" />
                                    <div className="h-2.5 bg-slate-100 rounded animate-pulse w-4/5" />
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500 font-medium mb-3 leading-relaxed">
                                    {/* Show API error fallback gracefully */}
                                    {seniorError
                                        ? "Share your industry experience and guide the next generation of professionals."
                                        : description}
                                </p>
                            )}

                            {/* CTA */}
                            <div className={`flex items-center gap-2 font-bold text-xs group-hover:gap-4 transition-all ${statusColor}`}>
                                {seniorLoading ? (
                                    <span className="text-slate-400">Loading…</span>
                                ) : (
                                    <>
                                        {cta}{" "}
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </section>
        </>
    );
}