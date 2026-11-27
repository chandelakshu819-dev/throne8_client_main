//src/features/mentorship/components/mentor/MentorProfile.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { C } from "../../types/data";
import type { BookingStep, Service, CalendarData, FormData as BookingFormData } from "../../types/types";
import MentorSidebar from "./MentorSidebar";
import ServicesSection from "./ServicesSection";
import ReviewsSection from "./ReviewsSection";
import { GoalFinder, MatchInsight, ShareProfileCard, StickyBookBar } from "./MentorExtras";

import CalendarStep from "./CalendarStep";
import QueryStep from "./QueryStep";
import DetailsStep from "./DetailsStep";
import PaymentStep from "./PaymentStep";
import ConfirmationStep from "./ConfirmationStep";
import UpdateProfileModal from "../modal/Updateprofilemodal";

import MentorService from "@/lib/api/mentorship.service";
import SessionService from "@/lib/api/session.service";
import { useAuth } from "@/features/auth/hooks/useAuth";
import AuthService from "@/lib/api/auth.service";
import { buildLoginRedirectUrl } from "@/shared/utils/safeRedirect";
import { useRouter, useSearchParams } from "next/navigation";

type LocalBookingStep = BookingStep | "query";

interface MentorProfileProps {
    mentorId: string;
}

const SERVICES_SECTION_ID = "mentor-services";

// Session type ko Service.type label me map karo (ServicesSection jaisa hi)
const SESSION_TYPE_LABEL: Record<string, string> = {
    quick_call: "1:1 Call",
    mock_interview: "1:1 Call",
    resume_review: "1:1 Call",
    career_planning: "1:1 Call",
    deep_dive: "1:1 Call",
    portfolio_review: "1:1 Call",
    ask_query: "Query",
};

// One place that turns an API session into the Service shape the booking flow expects
// (used by the ?book=true deep link and by the Goal finder)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sessionToService = (session: any): Service => {
    const sessionId = session?.sessionId || session?._id || session?.id;
    const basePrice = session?.pricing?.basePrice;
    return {
        id: sessionId,
        type: SESSION_TYPE_LABEL[session?.sessionType] || "1:1 Call",
        title: session?.title,
        duration: `${session?.duration} Min`,
        originalPrice: null,
        price: basePrice === 0 ? "Free" : basePrice,
        popular: false,
    } as Service;
};

const MentorProfile: React.FC<MentorProfileProps> = ({
    mentorId
}) => {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const deepLinkServiceId = searchParams.get("serviceId") || undefined;
    const deepLinkBook = searchParams.get("book") === "true";

    const [bookingStep, setBookingStep] = useState<LocalBookingStep>(null);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
    const [formData, setFormData] = useState<BookingFormData | null>(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [mentorData, setMentorData] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [mentorSessions, setMentorSessions] = useState<any[]>([]);
    const [bookedSessionIds, setBookedSessionIds] = useState<string[]>([]);
    const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);

    // Service page se "Book Session" dabake aaye hain (?serviceId=...&book=true)
    // to profile flash na ho, isliye jab tak session fetch ho raha hai loader dikhao.
    const [autoBooking, setAutoBooking] = useState<boolean>(
        deepLinkBook && !!deepLinkServiceId
    );
    const [cameFromServicePage, setCameFromServicePage] = useState(false);
    const autoBookHandled = useRef(false);

    const fetchMentor = () => {
        MentorService.getMentorById(mentorId)
            .then((res) => setMentorData(res?.data ?? res ?? null))
            .catch(() => setMentorData(null));
    };

    useEffect(() => {
        fetchMentor();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mentorId]);

    // Sessions are fetched once here and shared with the Goal finder and the mobile Book bar
    useEffect(() => {
        let alive = true;
        SessionService.getMentorSessions(mentorId)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .then((res: any) => {
                const list = Array.isArray(res) ? res : res?.data ?? [];
                if (alive) setMentorSessions(Array.isArray(list) ? list : []);
            })
            .catch(() => {
                /* extras simply stay hidden if this fails */
            });
        return () => {
            alive = false;
        };
    }, [mentorId]);

    useEffect(() => {
        if (mentorData && mentorData.userId) {
            if (user?.userId === mentorData.userId) {
                return;
            }
            MentorService.getMentorByUserId(mentorData.userId, true).catch(() => {});
        }
    }, [mentorData, user?.userId]);

    // Logged-out user ko login par bhejo; login ke baad isi mentor page par wapas aayega.
    const redirectToLogin = (opts?: { serviceId?: string; autoBook?: boolean }): void => {
        const params = new URLSearchParams();
        if (opts?.serviceId) params.set("serviceId", opts.serviceId);
        if (opts?.autoBook) params.set("book", "true");
        const query = params.toString();
        const target = `${window.location.pathname}${query ? `?${query}` : ""}`;
        router.push(buildLoginRedirectUrl(target));
    };

    const handleServiceClick = (service: Service): void => {
        // Services sabko dikhti hain, par book karne ke liye login zaroori hai.
        if (!AuthService.isAuthenticated()) {
            redirectToLogin({ serviceId: String(service.id), autoBook: true });
            return;
        }
        setSelectedService(service);
        setBookingStep(
            service.type === "Query"
                ? "query"
                : service.type === "Resource"
                ? "confirmation"
                : "calendar"
        );
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // ?book=true&serviceId=<id> aane par seedha calendar step kholo
    useEffect(() => {
        if (!deepLinkBook || !deepLinkServiceId || autoBookHandled.current) return;
        autoBookHandled.current = true;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const matchesId = (s: any) =>
            String(s?.sessionId || s?._id || s?.id || "") === String(deepLinkServiceId);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const loadSession = async (): Promise<any | null> => {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const listRes: any = await SessionService.getMentorSessions(mentorId);
                const list = Array.isArray(listRes) ? listRes : listRes?.data ?? [];
                const found = Array.isArray(list) ? list.find(matchesId) : null;
                if (found) return found;
            } catch (e) {
                console.warn("[MentorProfile] getMentorSessions failed", e);
            }
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const res: any = await SessionService.getSessionById(deepLinkServiceId);
                return res?.data || res?.session || res || null;
            } catch (e) {
                console.warn("[MentorProfile] getSessionById failed", e);
                return null;
            }
        };

        loadSession()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .then((session: any) => {
                const sessionId = session?.sessionId || session?._id || session?.id;

                // Group session ko is flow se book nahi karte
                if (!session || !sessionId || session.sessionType === "group_session") {
                    console.warn("[MentorProfile] auto-book skipped: session not found or group", session);
                    setAutoBooking(false);
                    return;
                }

                setCameFromServicePage(true);
                handleServiceClick(sessionToService(session));
                setAutoBooking(false);
            })
            .catch(() => setAutoBooking(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deepLinkBook, deepLinkServiceId, mentorId]);

    const resetBooking = (): void => {
        setBookingStep(null); setSelectedService(null);
        setCalendarData(null); setFormData(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    if (autoBooking) {
        return (
            <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <style>{`@keyframes mp-spin { to { transform: rotate(360deg); } }`}</style>
                <div style={{ width: "36px", height: "36px", border: `3px solid ${C.border}`, borderTop: `3px solid ${C.dark}`, borderRadius: "50%", animation: "mp-spin 0.8s linear infinite" }} />
            </div>
        );
    }

    if (bookingStep === "query") return <QueryStep mentorId={mentorId} selectedService={selectedService} onBack={resetBooking} onSubmitted={resetBooking} />;
    if (bookingStep === "calendar") {
        return (
            <div style={{ background: C.bg, paddingTop: "72px" }}>
                <CalendarStep
                    mentorId={mentorId}
                    selectedService={selectedService}
                    onBack={() => (cameFromServicePage ? router.back() : setBookingStep(null))}
                    onContinue={(d) => { setCalendarData(d); setBookingStep("details"); }}
                />
            </div>
        );
    }
    if (bookingStep === "details") return <DetailsStep selectedService={selectedService} calendarData={calendarData!} onBack={() => setBookingStep("calendar")} onContinue={(d: BookingFormData) => { setFormData(d); setBookingStep("payment"); }} />;
    if (bookingStep === "payment") return (
        <PaymentStep
            selectedService={selectedService}
            calendarData={calendarData!}
            formData={formData!}
            mentorId={mentorId}
            onBack={() => setBookingStep("details")}
            onConfirm={() => setBookingStep("confirmation")}
            onPickAnotherSlot={() => setBookingStep("calendar")}
            onBookingSuccess={() => {
                const isGroupTemplate = selectedService?.type === "GroupSession";
                if (selectedService?.id) {
                    setBookedSessionIds(prev => [...prev, String(selectedService.id)]);
                }
                setBookingSuccessMsg(
                    isGroupTemplate
                        ? "Slot booked! Your join request has been sent to the mentor."
                        : "Session booked successfully!"
                );
                resetBooking();
                setTimeout(() => setBookingSuccessMsg(null), 4000);
            }}
        />
    );
    if (bookingStep === "confirmation") return <ConfirmationStep selectedService={selectedService} calendarData={calendarData} formData={formData} onReset={resetBooking} />;

    const mentorName = `${mentorData?.user?.firstName ?? ""} ${mentorData?.user?.lastName ?? ""}`.trim();
    const isOwnProfile = Boolean(user?.userId && mentorData?.userId && user.userId === mentorData.userId);

    return (
        // overflow-x-hidden: koi bhi child galti se bada ho to page side me scroll na ho
        <div className="w-full overflow-x-hidden" style={{ minHeight: "100vh", background: C.bg }}>
            {bookingSuccessMsg && (
                <div
                    role="status"
                    className="left-3 right-3 sm:left-auto sm:right-5"
                    style={{
                        position: "fixed", top: 20, zIndex: 3000, padding: "14px 20px",
                        borderRadius: "12px", fontSize: "14px", fontWeight: 600, color: "#15803d",
                        background: "#dcfce7", border: "1px solid #86efac", boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    }}
                >
                    {bookingSuccessMsg}
                </div>
            )}

            {/* pb-24 on mobile leaves room for the sticky Book bar */}
            <div className="mx-auto w-full max-w-[1400px] px-3 pb-24 pt-[80px] sm:px-4 sm:pt-[88px] lg:pb-6">
                <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-6">
                    <div className="min-w-0 space-y-4">
                        <MentorSidebar
                            mentorData={mentorData}
                            currentUserId={user?.userId}
                            onBack={() => router.back()}
                            onEditClick={() => setEditModalOpen(true)}
                        />
                        {mentorData && !isOwnProfile && (
                            <MatchInsight
                                mentorName={mentorName}
                                mentorSkills={mentorData?.skills}
                                user={user}
                            />
                        )}
                        {mentorData && (
                            <ShareProfileCard mentorName={mentorName || "This mentor"} skills={mentorData?.skills} />
                        )}
                    </div>
                    <div className="min-w-0 space-y-4">
                        {!isOwnProfile && (
                            <GoalFinder
                                sessions={mentorSessions}
                                onBook={(session) => handleServiceClick(sessionToService(session))}
                            />
                        )}
                        <div id={SERVICES_SECTION_ID} className="scroll-mt-24">
                            <ServicesSection
                                onServiceClick={handleServiceClick}
                                mentorId={mentorId}
                                bookedSessionIds={bookedSessionIds}
                                currentUserId={user?.userId || ""}
                                mentorName={mentorName}
                                deepLinkSessionId={deepLinkServiceId}
                                onRequireLogin={redirectToLogin}
                            />
                        </div>
                        <ReviewsSection mentorId={mentorId} />
                    </div>
                </div>
            </div>

            {!isOwnProfile && <StickyBookBar sessions={mentorSessions} targetId={SERVICES_SECTION_ID} />}

            <UpdateProfileModal
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                mentorData={mentorData}
                mentorId={mentorId}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onUpdateSuccess={(updated: any) => {
                    setMentorData(updated);
                    fetchMentor();
                }}
            />
        </div>
    );
};

export default MentorProfile;