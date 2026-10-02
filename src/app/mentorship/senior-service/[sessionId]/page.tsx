"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, User, Tag, Video } from "lucide-react";
import { GlobalStyles, Navigation } from "@/features/index";
import { useAuth } from "@/features/auth/hooks/useAuth";

import SeniorSessionService from "@/lib/api/seniorSession.service";
import MentorService from "@/lib/api/mentorship.service";

export default function SeniorServiceDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const sessionId = params.sessionId as string;

    const [service, setService] = useState<any>(null);
    const [mentor, setMentor] = useState<any>(null);
    
    // Status states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!sessionId) return;
        
        SeniorSessionService.getSessionById(sessionId)
            .then(res => {
                const data = res?.data || res?.session || res;
                setService(data);
                if (data?.mentorId) {
                    MentorService.getMyMentorProfile(data.mentorId)
                        .then(mRes => {
                            // MentorResponse shape: { success, message, data: { mentorId, userId, user, ... } }
                            setMentor(mRes?.data ?? mRes);
                        })
                        .catch(() => {});
                }
            })
            .catch(err => {
                setError("Senior service not found or you don't have access.");
            })
            .finally(() => {
                setLoading(false);
            });
    }, [sessionId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-full border-4 border-[#e2d5c8] border-t-[#8b7355] animate-spin" />
                    <p className="text-[#8e847c] font-medium text-sm">Loading senior service details...</p>
                </div>
            </div>
        );
    }

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

    const priceDisplay = service.pricing?.basePrice === 0 || !service.pricing?.basePrice ? "Free" : `₹${service.pricing.basePrice}`;
    const categoryTag = (service.category || service.sessionType || "CAREER PLANNING").replace(/_/g, ' ').toUpperCase();

    return (
        <div className="min-h-screen bg-[#FAF9F6] text-[#4a3728] font-sans pb-20">
            <GlobalStyles />
            <Navigation currentUserId={user?.userId} activeTimezone="IST (UTC+5:30)" />

            <main className="max-w-6xl mx-auto px-6 pt-24">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-500 hover:text-[#8b7355] transition-colors mb-8 font-medium text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left Column: Service Details */}
                    <div className="lg:col-span-8 flex flex-col gap-8">
                        <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-[#ece7e2]">
                            <div className="h-[280px] md:h-[320px] relative bg-[#f4ece1]">
                                {service.thumbnailImage || service.thumbnail ? (
                                    <img
                                        src={service.thumbnailImage || service.thumbnail}
                                        alt={service.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#f4ece1] via-[#ede0d0] to-[#e2d5c8] flex items-center justify-center">
                                        <div className="w-24 h-24 rounded-2xl bg-white/30 backdrop-blur-sm flex items-center justify-center border border-white/40">
                                            <User className="w-12 h-12 text-[#8b7355]/60" />
                                        </div>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
                                    <span className="inline-block px-3 py-1.5 bg-[#8b7355] text-white rounded-full text-[10px] font-black tracking-widest uppercase mb-4 shadow-sm">
                                        {categoryTag}
                                    </span>
                                    <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">
                                        {service.title}
                                    </h1>
                                </div>
                            </div>

                            <div className="p-8 md:p-10 space-y-8">
                                <div>
                                    <h3 className="text-xl font-bold mb-4 text-[#4a3728]">About this session</h3>
                                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                                        {service.description || "A personalized 1-to-1 session designed to help you achieve your specific career & technical goals with focused, expert guidance."}
                                    </p>
                                </div>

                                {mentor && (
                                    <div>
                                        <h3 className="text-xl font-bold mb-4 text-[#4a3728]">Your Senior Mentor</h3>
                                        <div className="flex items-center gap-4 p-5 bg-[#fdfcfb] rounded-[24px] border border-[#ece7e2]">
                                            {mentor.profilePic || mentor.user?.profilePic ? (
                                                <img
                                                    src={mentor.profilePic || mentor.user?.profilePic}
                                                    alt="Mentor"
                                                    className="w-14 h-14 rounded-full object-cover border-2 border-[#ece7e2]"
                                                />
                                            ) : (
                                                <div className="w-14 h-14 rounded-full bg-[#f4ece1] text-[#8b7355] flex items-center justify-center font-black text-xl border-2 border-[#ece7e2]">
                                                    {mentor.user?.firstName?.charAt(0) || "M"}
                                                </div>
                                            )}
                                            <div className="flex flex-col">
                                                <h4 className="text-lg font-black text-[#2d2116] leading-tight">
                                                    {mentor.user?.firstName} {mentor.user?.lastName}
                                                </h4>
                                                {(mentor.headline || mentor.experience?.currentRole) && (
                                                    <p className="text-sm font-medium text-[#8e847c] mt-1">
                                                        {mentor.headline || mentor.experience?.currentRole}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Information & CTA Widget */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white p-6 md:p-8 rounded-[32px] border border-[#ece7e2] shadow-sm sticky top-28">
                            
                            <div className="flex items-baseline justify-between mb-8 pb-6 border-b border-[#ece7e2]">
                                <span className="text-[#8e847c] font-bold uppercase tracking-wider text-xs">Total Price</span>
                                <span className="text-3xl font-black text-[#4a3728]">{priceDisplay}</span>
                            </div>

                            <div className="space-y-6 mb-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-[#f4ece1] flex items-center justify-center shrink-0">
                                        <Clock className="w-6 h-6 text-[#8b7355]" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#4a3728] text-base">{service.duration} Minutes</p>
                                        <p className="text-xs font-medium text-slate-500">Duration</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-[#f4ece1] flex items-center justify-center shrink-0">
                                        <Video className="w-6 h-6 text-[#8b7355]" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#4a3728] text-base">Online Video Call</p>
                                        <p className="text-xs font-medium text-slate-500">Format</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => router.push(`/mentorship/senior-service/${sessionId}/book`)}
                                className="w-full py-5 rounded-2xl text-sm font-black uppercase tracking-[3px] transition-all duration-300 shadow-xl flex items-center justify-center bg-[#4a3728] text-white hover:bg-[#8b7355] shadow-[#4a3728]/20 hover:-translate-y-0.5"
                            >
                                BOOK SESSION &rarr;
                            </button>
                            
                            <p className="text-center text-[10px] uppercase font-bold tracking-wider text-[#a3978f] mt-4">
                                Secure booking via existing Senior architecture
                            </p>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
