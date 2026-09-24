//src/features/mentorship/components/mentor/MentorProfile.tsx
"use client";

import React, { useEffect, useState } from "react";
import { C } from "../../types/data";
import type { BookingStep, Service, CalendarData, FormData as BookingFormData } from "../../types/types";
import MentorSidebar from "./MentorSidebar";
import ServicesSection from "./ServicesSection";
import ReviewsSection from "./ReviewsSection";

import CalendarStep from "./CalendarStep";
import QueryStep from "./QueryStep";
import DetailsStep from "./DetailsStep";
import PaymentStep from "./PaymentStep";
import ConfirmationStep from "./ConfirmationStep";

import MentorService from "@/lib/api/mentorship.service";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "./Icons";

interface MentorProfileProps {
    mentorId: string;
}

const MentorProfile: React.FC<MentorProfileProps> = ({
    mentorId
}) => {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    // ✅ FIX: this was never read anywhere. The "Join Session" button on
    // the group-session detail page redirects here with
    // ?serviceId=<groupSessionId>, but nothing consumed it — the mentee
    // landed on the mentor's profile with no indication of why, and had
    // to manually re-find the same group session and click it again.
    // Now it's passed down so ServicesSection can auto-open that exact
    // session's detail modal.
    const deepLinkServiceId = searchParams.get("serviceId") || undefined;

    const [bookingStep, setBookingStep] = useState<BookingStep>(null);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
    const [formData, setFormData] = useState<BookingFormData | null>(null);
    const [mentorData, setMentorData] = useState<any>(null);
    const [bookedSessionIds, setBookedSessionIds] = useState<string[]>([]);
    // ✅ NEW: group-session template join-by-slot flow state
    const [groupJoinBusy, setGroupJoinBusy] = useState(false);
    const [groupJoinError, setGroupJoinError] = useState<string | null>(null);

    useEffect(() => {
        MentorService.getAllMentors()
            .then((res) => {
                const found = res?.data?.find((m: any) => m.mentorId === mentorId) ?? null;
                setMentorData(found);
            })
            .catch(() => setMentorData(null));
    }, [mentorId]);

    // Fire-and-forget request to trigger backend 'Profile Viewed' notification logic.
    // This is strictly for the side-effect (notification tracking).
    useEffect(() => {
        if (mentorData && mentorData.userId) {
            // Guard against self-view
            if (user?.userId === mentorData.userId) {
                return;
            }
            MentorService.getMentorByUserId(mentorData.userId, true).catch(() => {});
        }
    }, [mentorData, user?.userId]);

    const handleServiceClick = (service: Service): void => {
        setSelectedService(service);
        // ✅ FIX: "Ask a Query" (type "Query") ab calendar flow me nahi
        // jaayegi — seedha query/message-writing step khulega.
        setBookingStep(
            service.type === "Query"
                ? "query"
                : service.type === "Resource" || service.price === "Free"
                    ? "confirmation"
                    : "calendar"
        );
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const resetBooking = (): void => {
        setBookingStep(null); setSelectedService(null);
        setCalendarData(null); setFormData(null);
        setGroupJoinError(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // ✅ NEW: group-session TEMPLATE ke liye slot choose hote hi seedha
    // join-by-slot API call karo — yeh 1:1 wali details/payment pipeline
    // mein NAHI jaata, kyunki group join ek "request" hai, ek paid booking
    // nahi (payment separately/mentor-approval-baad handle hota hai).
    const handleGroupSlotSelected = async (d: CalendarData) => {
        if (!selectedService) return;
        setGroupJoinBusy(true);
        setGroupJoinError(null);
        try {
            const { selectedDate, currentMonth, availabilityId, slotTime } = d;
            const year = currentMonth.getFullYear();
            const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
            const day = String(selectedDate).padStart(2, "0");
            const startTime = slotTime.split(" - ")[0]; // "10:00"

            await MentorService.joinGroupSessionBySlot(String(selectedService.id), {
                date: `${year}-${month}-${day}`,
                startTime,
                availabilityId,
            });

            if (selectedService.id) {
                setBookedSessionIds((prev) => [...prev, String(selectedService.id)]);
            }
            window.alert("Join request sent! You'll be notified once the mentor reviews it.");
            resetBooking();
        } catch (err: any) {
            setGroupJoinError(err.message || "Failed to send join request.");
        } finally {
            setGroupJoinBusy(false);
        }
    };

    if (bookingStep === "query") return <QueryStep mentorId={mentorData?.mentorId || ""} selectedService={selectedService} onBack={resetBooking} onSubmitted={resetBooking} />;
    if (bookingStep === "calendar") {
        const isGroupTemplate = selectedService?.type === "GroupSession";
        return (
            <>
                <CalendarStep
                    mentorId={mentorData?.mentorId || ""}
                    selectedService={selectedService}
                    onBack={() => setBookingStep(null)}
                    onContinue={isGroupTemplate ? handleGroupSlotSelected : (d) => { setCalendarData(d); setBookingStep("details"); }}
                />
                {isGroupTemplate && groupJoinBusy && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
                        <div style={{ background: "#fff", padding: "24px 32px", borderRadius: "16px", fontWeight: 600, color: "#4a3728" }}>
                            Sending join request...
                        </div>
                    </div>
                )}
                {isGroupTemplate && groupJoinError && (
                    <div style={{ position: "fixed", bottom: 20, right: 20, background: "#fee2e2", color: "#dc2626", padding: "12px 16px", borderRadius: "12px", fontWeight: 600, zIndex: 2000, maxWidth: "360px" }}>
                        {groupJoinError}
                    </div>
                )}
            </>
        );
    }
    if (bookingStep === "details") return <DetailsStep selectedService={selectedService} calendarData={calendarData!} onBack={() => setBookingStep("calendar")} onContinue={(d: BookingFormData) => { setFormData(d); setBookingStep("payment"); }} />;
    if (bookingStep === "payment") return (
        <PaymentStep
            selectedService={selectedService}
            calendarData={calendarData!}
            formData={formData!}
            mentorId={mentorData?.mentorId || ""}
            onBack={() => setBookingStep("details")}
            onConfirm={() => setBookingStep("confirmation")}
            onBookingSuccess={() => {
                if (selectedService?.id) {
                    setBookedSessionIds(prev => [...prev, String(selectedService.id)]);
                }
                resetBooking();
            }}
        />
    );
    if (bookingStep === "confirmation") return <ConfirmationStep selectedService={selectedService} calendarData={calendarData} formData={formData} onReset={resetBooking} />;

    return (
        <div style={{ minHeight: "100vh", background: C.bg }}>
            <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "100px 16px 24px" }}>
                <div style={{ marginBottom: "24px" }}>
                    <button
                        onClick={() => router.back()}
                        style={{
                            background: "transparent",
                            border: `1px solid ${C.border}`,
                            cursor: "pointer",
                            color: C.dark,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "14px",
                            fontWeight: 600,
                            padding: "8px 16px",
                            borderRadius: "8px",
                        }}
                    >
                        <ArrowLeft /> Back
                    </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "24px", alignItems: "start" }}>
                    <MentorSidebar mentorData={mentorData} />
                    <div>
                        <ServicesSection
                            onServiceClick={handleServiceClick}
                            mentorId={mentorData?.mentorId || ""}
                            bookedSessionIds={bookedSessionIds}
                            currentUserId={user?.userId || ""}
                            mentorName={`${mentorData?.user?.firstName ?? ""} ${mentorData?.user?.lastName ?? ""}`.trim()}
                            deepLinkSessionId={deepLinkServiceId}
                        />

                        <ReviewsSection />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MentorProfile;