// src/app/mentorship/service/[serviceId]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SessionService from "@/lib/api/session.service";
import MentorService from "@/lib/api/mentorship.service";
import { ArrowLeft, Clock, User, Tag, IndianRupee, Calendar, Video } from "lucide-react";
import { GlobalStyles, Navigation } from "@/features/index";
import { useAuth } from "@/features/auth/hooks/useAuth";

export default function ServiceDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const serviceId = params.serviceId as string;

    const [service, setService] = useState<any>(null);
    const [mentor, setMentor] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch the 1-to-1 service by ID
    useEffect(() => {
        if (!serviceId) return;
        SessionService.getSessionById(serviceId)
            .then((res: any) => {
                const data = res?.data || res?.session || res;
                setService(data);
                setLoading(false);
            })
            .catch((err) => {
                // Fallback: fetch all sessions and find by ID
                SessionService.getAllSessionsFromDB({ limit: 50 })
                    .then((res: any) => {
                        const all = res?.data ?? [];
                        const found = all.find(
                            (s: any) =>
                                s.sessionId === serviceId ||
                                s._id === serviceId ||
                                s.id === serviceId
                        );
                        if (found) {
                            setService(found);
                        } else {
                            setError("Service not found.");
                        }
                        setLoading(false);
                    })
                    .catch(() => {
                        setError("Failed to load service details.");
                        setLoading(false);
                    });
            });
    }, [serviceId]);

    // Fetch mentor data once service is loaded
    useEffect(() => {
        if (!service?.mentorId) return;
        MentorService.getMyMentorProfile(service.mentorId)
            .then((res: any) => {
                setMentor(res?.data || res?.mentor || res);
            })
            .catch(() => {
                // Silently fail — UI will handle absence
            });
    }, [service?.mentorId]);

    const handleBookSession = () => {
        if (!mentor) return;
        const nameSlug = [mentor.user?.firstName, mentor.user?.lastName]
            .filter(Boolean)
            .join("-")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-");
        router.push(
            `/mentorship/mentor-card/${nameSlug}/${mentor.mentorId}?serviceId=${serviceId}`
        );
    };

    // ─── Loading ──────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-full border-4 border-[#e2d5c8] border-t-[#8b7355] animate-spin" />
                    <p className="text-[#8e847c] font-medium text-sm">Loading service details...</p>
                </div>
            </div>
        );
    }

    // ─── Error ────────────────────────────────────────────────
    if (error || !service) {
        return (
            <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center gap-4">
                <p className="text-red-500 font-medium">{error || "Service not found"}</p>
                <button
                    onClick={() => router.back()}
                    className="px-6 py-2 bg-[#4a3728] text-white rounded-xl text-sm font-bold"
                >
                    Go Back
                </button>
            </div>
        );
    }

    // ─── Derived Display Values ───────────────────────────────
    const priceDisplay =
        service.pricing?.basePrice === 0 || !service.pricing
            ? "Free"
            : `₹${service.pricing?.basePrice ?? service.pricing?.totalAmount ?? ""}`;

    const sessionTypeLabel = (type: string) => {
        const map: Record<string, string> = {
            quick_call: "Quick Call",
            mock_interview: "Mock Interview",
            resume_review: "Resume Review",
            career_planning: "Career Planning",
            deep_dive: "Deep Dive",
            portfolio_review: "Portfolio Review",
        };
        return map[type] || type?.replace(/_/g, " ") || "1-to-1 Session";
    };

    return (
        <div className="min-h-screen bg-[#FAF9F6] text-[#4a3728] font-sans selection:bg-[#4a3728] selection:text-white pb-20">
            <GlobalStyles />
            <Navigation currentUserId={user?.userId} activeTimezone="IST (UTC+5:30)" />

            <main className="max-w-4xl mx-auto px-6 pt-24">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-500 hover:text-[#8b7355] transition-colors mb-8 font-medium text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                {/* Main Card */}
                <div className="bg-white rounded-[32px] overflow-hidden shadow-xl border border-[#ece7e2]">

                    {/* ─── Hero Image ─── */}
                    <div className="h-[280px] md:h-[360px] relative bg-[#f4ece1]">
                        {service.thumbnailImage || service.thumbnail ? (
                            <img
                                src={service.thumbnailImage || service.thumbnail}
                                alt={service.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            // Premium warm fallback consistent with 1-to-1 palette
                            <div className="absolute inset-0 bg-gradient-to-br from-[#f4ece1] via-[#ede0d0] to-[#e2d5c8] flex items-center justify-center">
                                <div className="w-24 h-24 rounded-2xl bg-white/30 backdrop-blur-sm flex items-center justify-center border border-white/40">
                                    <User className="w-12 h-12 text-[#8b7355]/60" />
                                </div>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                        {/* Hero Text Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                            <span className="inline-block px-4 py-1.5 bg-[#8b7355] text-white rounded-full text-xs font-black tracking-widest uppercase mb-4">
                                {service.category || sessionTypeLabel(service.sessionType)}
                            </span>
                            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">
                                {service.title}
                            </h1>
                        </div>
                    </div>

                    {/* ─── Content ─── */}
                    <div className="p-8 md:p-12">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                            {/* Left Column — Mentor + Description */}
                            <div className="col-span-2 space-y-8">

                                {/* Mentor Profile Block */}
                                {mentor && (
                                    <div
                                        onClick={() => {
                                            const nameSlug = [mentor.user?.firstName, mentor.user?.lastName]
                                                .filter(Boolean)
                                                .join("-")
                                                .toLowerCase()
                                                .replace(/[^a-z0-9]+/g, "-");
                                            router.push(`/mentorship/mentor-card/${nameSlug}/${mentor.mentorId}`);
                                        }}
                                        className="flex items-center gap-4 p-5 bg-[#fdfcfb] rounded-[24px] border border-[#ece7e2] cursor-pointer hover:bg-white hover:shadow-md transition-all duration-300 group"
                                    >
                                        {mentor.profilePic || mentor.user?.profilePic ? (
                                            <img
                                                src={mentor.profilePic || mentor.user?.profilePic}
                                                alt="Mentor"
                                                className="w-12 h-12 rounded-full object-cover border-2 border-[#ece7e2] group-hover:border-[#8b7355] transition-colors flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-[#f4ece1] text-[#8b7355] flex items-center justify-center font-black text-xl border-2 border-[#ece7e2] group-hover:border-[#8b7355] transition-colors flex-shrink-0">
                                                {mentor.user?.firstName?.charAt(0) || "M"}
                                            </div>
                                        )}
                                        <div className="flex flex-col flex-grow">
                                            <h4 className="text-lg font-black text-[#2d2116] leading-tight group-hover:text-[#8b7355] transition-colors">
                                                {mentor.user?.firstName} {mentor.user?.lastName}
                                            </h4>
                                            {(mentor.headline || mentor.experience?.currentRole) && (
                                                <p className="text-xs font-bold text-[#8e847c] mt-0.5 leading-tight">
                                                    {mentor.headline || mentor.experience?.currentRole?.split(" at ")[0]}
                                                </p>
                                            )}
                                        </div>
                                        <ArrowLeft className="w-4 h-4 text-[#8b7355] rotate-180 opacity-0 group-hover:opacity-100 transition-all duration-300 flex-shrink-0" />
                                    </div>
                                )}

                                {/* Description */}
                                <div>
                                    <h3 className="text-xl font-bold mb-4 text-[#4a3728]">About this session</h3>
                                    <p className="text-slate-600 leading-relaxed">
                                        {service.description ||
                                            "A personalized 1-to-1 session designed to help you achieve your specific goals with focused, expert guidance."}
                                    </p>
                                </div>

                                {/* Session Type */}
                                {service.sessionType && (
                                    <div>
                                        <h3 className="text-xl font-bold mb-4 text-[#4a3728]">Session Type</h3>
                                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#f4ece1] rounded-full text-[#8b7355] text-sm font-bold">
                                            <User className="w-4 h-4" />
                                            {sessionTypeLabel(service.sessionType)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Right Column — Booking Info Card */}
                            <div className="space-y-6 bg-[#fdfcfb] p-6 rounded-2xl border border-[#ece7e2] h-fit">

                                {/* Duration */}
                                <div className="flex items-start gap-4">
                                    <Clock className="w-5 h-5 text-[#8b7355] mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-bold text-[#4a3728]">{service.duration} Minutes</p>
                                        <p className="text-sm text-slate-500">Session duration</p>
                                    </div>
                                </div>

                                {/* Session Format */}
                                <div className="flex items-start gap-4">
                                    <Video className="w-5 h-5 text-[#8b7355] mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-bold text-[#4a3728]">1-to-1 Private</p>
                                        <p className="text-sm text-slate-500">Session format</p>
                                    </div>
                                </div>

                                {/* Category / Type */}
                                {(service.category || service.sessionType) && (
                                    <div className="flex items-start gap-4">
                                        <Tag className="w-5 h-5 text-[#8b7355] mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-bold text-[#4a3728]">
                                                {service.category || sessionTypeLabel(service.sessionType)}
                                            </p>
                                            <p className="text-sm text-slate-500">Category</p>
                                        </div>
                                    </div>
                                )}

                                {/* Price + CTA */}
                                <div className="pt-6 mt-2 border-t border-[#ece7e2]">
                                    <div className="flex items-baseline justify-between mb-6">
                                        <span className="text-slate-500 font-medium">Price</span>
                                        <span className="text-3xl font-black text-[#4a3728]">
                                            {priceDisplay}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-400 text-right mb-4 font-medium">
                                        {service.duration} mins · 1-to-1
                                    </div>

                                    <button
                                        onClick={handleBookSession}
                                        disabled={!mentor}
                                        className="w-full py-4 bg-[#4a3728] text-white rounded-2xl text-xs font-black uppercase tracking-[3px] hover:bg-[#8b7355] transition-all duration-300 shadow-xl shadow-[#4a3728]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {mentor ? "Book Session →" : "Loading..."}
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
