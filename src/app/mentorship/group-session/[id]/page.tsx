"use client";
//src/app/mentorship/group-session/[id]/page.tsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import MentorService from "@/lib/api/mentorship.service";
import { ArrowLeft, Calendar, Clock, Users, Tag } from "lucide-react";
import { GlobalStyles, Navigation } from "@/features/index";
import { useAuth } from "@/features/auth/hooks/useAuth";

export default function GroupSessionDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const sessionId = params.id as string;

    const [session, setSession] = useState<any>(null);
    const [mentor, setMentor] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

    const showToast = (msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchSession = useCallback(async () => {
        if (!sessionId) return null;
        try {
            const res: any = await MentorService.getGroupSessionById(sessionId);
            const data = res?.data || res?.session || res;
            setSession(data);
            return data;
        } catch (err: any) {
            setError(err.message || "Failed to load group session details");
            return null;
        } finally {
            setLoading(false);
        }
    }, [sessionId]);

    useEffect(() => {
        fetchSession();
    }, [fetchSession]);

    useEffect(() => {
        if (session?.mentorId) {
            MentorService.getMyMentorProfile(session.mentorId)
                .then((res: any) => {
                    setMentor(res.data || res.mentor || res);
                })
                .catch(() => {
                    // Silently fail if mentor can't be loaded, UI will handle absence
                });
        }
    }, [session?.mentorId]);

    const myId = user?.userId ?? user?.id;
    const myParticipant = (session?.participants || []).find(
        (p: any) => p.menteeId === myId || p.menteeId?.toString() === myId
    );
    const myStatus = myParticipant?.requestStatus;
    const isMentorOwner = Boolean(
        myId && (mentor?.userId === myId || mentor?.id === myId || session?.mentorId === myId)
    );
    const currentParticipants = session?.currentParticipants ?? (session?.participantsCount ?? 0);
    const maxParticipants = session?.maxParticipants ?? 0;
    const isFull = session?.status === 'full' || (maxParticipants > 0 && currentParticipants >= maxParticipants);
    const isInProgress = session?.status === 'in_progress';

    const handleJoinMeet = async () => {
        setActionLoading(true);
        try {
            await MentorService.markGroupAttendance(sessionId).catch(() => {
                // Ignore failure
            });
            const freshRes: any = await MentorService.getGroupSessionById(sessionId);
            const freshSession = freshRes?.data || freshRes?.session || freshRes;
            setSession(freshSession);

            const meetUrl = freshSession?.meeting?.meetingUrl || freshSession?.meetingUrl;
            if (freshSession?.status === 'in_progress' && meetUrl) {
                window.open(meetUrl, '_blank', 'noopener,noreferrer');
            } else {
                showToast("Session has not started yet", "error");
            }
        } catch (err: any) {
            showToast(err.message || "Failed to join session", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleRequestJoin = async () => {
        setActionLoading(true);
        try {
            const res = await MentorService.requestToJoinGroupSession(sessionId);
            showToast(res?.message || "Join request sent successfully.", "success");
            await fetchSession();
        } catch (err: any) {
            showToast(err.message || "Failed to send join request.", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleTemplateRedirect = () => {
        if (!mentor) return;
        const nameSlug = [mentor.user?.firstName, mentor.user?.lastName].filter(Boolean).join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        router.push(`/mentorship/mentor-card/${nameSlug}/${mentor.mentorId}?serviceId=${sessionId}`);
    };

    const renderActionButton = () => {
        // 1. isMentorOwner, or (no scheduledAt and not template): hide the button
        if (isMentorOwner || (!session.scheduledAt && !session.isTemplate)) {
            return null;
        }

        // 2. session.isTemplate: button "Choose Date & Time" that keeps EXISTING redirect
        if (session.isTemplate) {
            return (
                <button
                    onClick={handleTemplateRedirect}
                    disabled={actionLoading}
                    className="w-full py-4 bg-[#4a3728] text-white rounded-2xl text-xs font-black uppercase tracking-[3px] hover:bg-[#8b7355] transition-all duration-300 shadow-xl shadow-[#4a3728]/20 disabled:opacity-50"
                >
                    Choose Date & Time
                </button>
            );
        }

        // 3. accepted AND in_progress: "Join Meet"
        if (myStatus === 'accepted' && isInProgress) {
            return (
                <button
                    onClick={handleJoinMeet}
                    disabled={actionLoading}
                    className="w-full py-4 bg-[#15803d] text-white rounded-2xl text-xs font-black uppercase tracking-[3px] hover:bg-[#166534] transition-all duration-300 shadow-xl shadow-green-900/20 disabled:opacity-50"
                >
                    {actionLoading ? "Joining..." : "Join Meet"}
                </button>
            );
        }

        // 4. accepted (not in_progress): disabled "Confirmed - Meet opens when mentor starts"
        if (myStatus === 'accepted' && !isInProgress) {
            return (
                <button
                    disabled
                    className="w-full py-4 bg-[#dcfce7] text-[#15803d] border border-[#86efac] rounded-2xl text-xs font-bold uppercase tracking-[2px] cursor-not-allowed opacity-90"
                >
                    Confirmed - Meet opens when mentor starts
                </button>
            );
        }

        // 5. pending: disabled "Request Pending"
        if (myStatus === 'pending') {
            return (
                <button
                    disabled
                    className="w-full py-4 bg-[#fef3c7] text-[#b45309] border border-[#fde68a] rounded-2xl text-xs font-bold uppercase tracking-[2px] cursor-not-allowed opacity-90"
                >
                    Request Pending
                </button>
            );
        }

        // 6. rejected and not full: "Request Again"
        if (myStatus === 'rejected' && !isFull) {
            return (
                <button
                    onClick={handleRequestJoin}
                    disabled={actionLoading}
                    className="w-full py-4 bg-[#4a3728] text-white rounded-2xl text-xs font-black uppercase tracking-[3px] hover:bg-[#8b7355] transition-all duration-300 shadow-xl shadow-[#4a3728]/20 disabled:opacity-50"
                >
                    {actionLoading ? "Sending Request..." : "Request Again"}
                </button>
            );
        }

        // 7. full: disabled "Session Full"
        if (isFull) {
            return (
                <button
                    disabled
                    className="w-full py-4 bg-[#e0d8cf] text-[#8a7a6a] rounded-2xl text-xs font-bold uppercase tracking-[2px] cursor-not-allowed opacity-80"
                >
                    Session Full
                </button>
            );
        }

        // 8. otherwise: "Join Session"
        return (
            <button
                onClick={handleRequestJoin}
                disabled={actionLoading}
                className="w-full py-4 bg-[#4a3728] text-white rounded-2xl text-xs font-black uppercase tracking-[3px] hover:bg-[#8b7355] transition-all duration-300 shadow-xl shadow-[#4a3728]/20 disabled:opacity-50"
            >
                {actionLoading ? "Sending Request..." : "Join Session"}
            </button>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
                <p className="text-slate-500 font-medium">Loading session details...</p>
            </div>
        );
    }

    if (error || !session) {
        return (
            <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center gap-4">
                <p className="text-red-500 font-medium">{error || "Session not found"}</p>
                <button 
                    onClick={() => router.back()}
                    className="px-6 py-2 bg-[#4a3728] text-white rounded-xl text-sm font-bold"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const scheduledDate = session.scheduledAt ? new Date(session.scheduledAt) : null;
    const formattedDate = scheduledDate && !isNaN(scheduledDate.getTime())
        ? scheduledDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
        : 'Date not set';
    const formattedTime = scheduledDate && !isNaN(scheduledDate.getTime())
        ? scheduledDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        : 'Time not set';

    return (
        <div className="min-h-screen bg-[#FAF9F6] text-[#4a3728] font-sans selection:bg-[#4a3728] selection:text-white pb-20">
            <GlobalStyles />
            <Navigation currentUserId={user?.userId} activeTimezone="IST (UTC+5:30)" />

            {toast && (
                <div
                    style={{
                        position: "fixed",
                        top: 24,
                        right: 24,
                        zIndex: 99999,
                        padding: "12px 20px",
                        borderRadius: 12,
                        fontSize: 13,
                        fontWeight: 600,
                        boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
                        background: toast.type === "success" ? "#dcfce7" : "#fee2e2",
                        color: toast.type === "success" ? "#15803d" : "#dc2626",
                        border: `1px solid ${toast.type === "success" ? "#86efac" : "#fca5a5"}`,
                    }}
                >
                    {toast.msg}
                </div>
            )}

            <main className="max-w-4xl mx-auto px-6 pt-24">
                <button 
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-500 hover:text-[#8b7355] transition-colors mb-8 font-medium text-sm"
                >
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <div className="bg-white rounded-[32px] overflow-hidden shadow-xl border border-[#ece7e2]">
                    <div className="h-[300px] md:h-[400px] relative bg-slate-100">
                        <img 
                            src={session.thumbnailImage || `https://source.unsplash.com/random/1200x800/?workshop`}
                            alt={session.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        
                        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                            <span className="inline-block px-4 py-1.5 bg-[#8b7355] text-white rounded-full text-xs font-black tracking-widest uppercase mb-4">
                                {session.topic || "Group Session"}
                            </span>
                            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-2">
                                {session.title}
                            </h1>
                        </div>
                    </div>

                    <div className="p-8 md:p-12">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                            <div className="col-span-2 space-y-8">
                                {mentor && (
                                    <div 
                                        onClick={() => {
                                            const nameSlug = [mentor.user?.firstName, mentor.user?.lastName].filter(Boolean).join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-');
                                            router.push(`/mentorship/mentor-card/${nameSlug}/${mentor.mentorId}`);
                                        }}
                                        className="flex items-center gap-4 p-5 bg-[#fdfcfb] rounded-[24px] border border-[#ece7e2] cursor-pointer hover:bg-white hover:shadow-md transition-all duration-300 group"
                                    >
                                        {mentor.profilePic || mentor.user?.profilePic ? (
                                            <img src={mentor.profilePic || mentor.user?.profilePic} alt="Mentor" className="w-12 h-12 rounded-full object-cover border-2 border-[#ece7e2] group-hover:border-[#8b7355] transition-colors" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-[#f4ece1] text-[#8b7355] flex items-center justify-center font-bold text-xl border-2 border-[#ece7e2] group-hover:border-[#8b7355] transition-colors">
                                                {mentor.user?.firstName?.charAt(0) || "M"}
                                            </div>
                                        )}
                                        <div className="flex flex-col flex-grow">
                                            <h4 className="text-lg font-black text-[#2d2116] leading-tight group-hover:text-[#8b7355] transition-colors">
                                                {mentor.user?.firstName} {mentor.user?.lastName}
                                            </h4>
                                            {(mentor.headline || mentor.title) && (
                                                <p className="text-xs font-bold text-[#8e847c] mt-0.5 leading-tight">
                                                    {mentor.headline || mentor.title}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                <div>
                                    <h3 className="text-xl font-bold mb-4 text-[#4a3728]">About this session</h3>
                                    <p className="text-slate-600 leading-relaxed">
                                        {session.description}
                                    </p>
                                </div>
                                
                                {session.agenda && (
                                    <div>
                                        <h3 className="text-xl font-bold mb-4 text-[#4a3728]">Agenda</h3>
                                        <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                                            {session.agenda}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6 bg-[#fdfcfb] p-6 rounded-2xl border border-[#ece7e2] h-fit">
                                <div className="flex items-start gap-4">
                                    <Calendar className="w-5 h-5 text-[#8b7355] mt-0.5" />
                                    <div>
                                        <p className="font-bold text-[#4a3728]">{formattedDate}</p>
                                        <p className="text-sm text-slate-500">{formattedTime}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <Clock className="w-5 h-5 text-[#8b7355] mt-0.5" />
                                    <div>
                                        <p className="font-bold text-[#4a3728]">{session.duration} Minutes</p>
                                        <p className="text-sm text-slate-500">Duration</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <Users className="w-5 h-5 text-[#8b7355] mt-0.5" />
                                    <div>
                                        <p className="font-bold text-[#4a3728]">{session.maxParticipants} Spots Total</p>
                                        {session.currentParticipants !== undefined ? (
                                            <p className={`text-sm font-bold mt-0.5 ${session.maxParticipants - session.currentParticipants > 0 ? 'text-[#8b7355]' : 'text-red-500'}`}>
                                                {session.maxParticipants - session.currentParticipants > 0 
                                                    ? `${session.maxParticipants - session.currentParticipants} spots left` 
                                                    : 'Session full'}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-slate-500 mt-0.5">Limited availability</p>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-6 mt-6 border-t border-[#ece7e2]">
                                    <div className="flex items-baseline justify-between mb-6">
                                        <span className="text-slate-500 font-medium">Price</span>
                                        <span className="text-3xl font-black text-[#4a3728]">
                                            {session.pricing?.pricePerPerson === 0 
                                                ? 'Free' 
                                                : session.pricing?.pricePerPerson 
                                                    ? `₹${session.pricing.pricePerPerson}` 
                                                    : 'Price not available'}
                                        </span>
                                    </div>
                                    
                                    {renderActionButton()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
