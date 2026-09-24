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
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    if (bookingStep === "query") return <QueryStep mentorId={mentorData?.mentorId || ""} selectedService={selectedService} onBack={resetBooking} onSubmitted={resetBooking} />;
    if (bookingStep === "calendar") return <CalendarStep mentorId={mentorData?.mentorId || ""} selectedService={selectedService} onBack={() => setBookingStep(null)} onContinue={(d) => { setCalendarData(d); setBookingStep("details"); }} />;
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