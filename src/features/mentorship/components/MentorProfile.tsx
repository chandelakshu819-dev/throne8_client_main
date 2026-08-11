// components/mentor-profile/MentorProfile.tsx
"use client";

import React, { useEffect, useState } from "react";
import { C } from "../types/data";
import type { BookingStep, Service, CalendarData, FormData as BookingFormData } from "../types/types";
import MentorSidebar from "./MentorSidebar";
import ServicesSection from "./ServicesSection";
import ReviewsSection from "./ReviewsSection";
import CalendarStep from "./CalendarStep";
import DetailsStep from "./DetailsStep";
import PaymentStep from "./PaymentStep";
import ConfirmationStep from "./ConfirmationStep";
import MentorService from "@/lib/api/mentorship.service";
import { useAuth } from "@/features/auth/hooks/useAuth";

interface MentorProfileProps {
    mentorId: string;
}

const MentorProfile: React.FC<MentorProfileProps> = ({
    mentorId
}) => {
    const { user } = useAuth();
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

    const handleServiceClick = (service: Service): void => {
        setSelectedService(service);
        setBookingStep(service.type === "Resource" || service.price === "Free" ? "confirmation" : "calendar");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const resetBooking = (): void => {
        setBookingStep(null); setSelectedService(null);
        setCalendarData(null); setFormData(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

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
            <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px 16px", display: "grid", gridTemplateColumns: "340px 1fr", gap: "24px", alignItems: "start" }}>
                <MentorSidebar mentorData={mentorData} />
                <div>
                    <ServicesSection
                        onServiceClick={handleServiceClick}
                        mentorId={mentorData?.mentorId || ""}
                        bookedSessionIds={bookedSessionIds}
                        currentUserId={user?.userId || ""}
                    />

                    <ReviewsSection />
                </div>
            </div>
        </div>
    );
};

export default MentorProfile;