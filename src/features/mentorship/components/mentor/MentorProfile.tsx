//src/features/mentorship/components/mentor/MentorProfile.tsx
"use client";

import React, { useEffect, useState } from "react";
import { C } from "../../types/data";
import type { BookingStep, Service, CalendarData, FormData as BookingFormData } from "../../types/types";
import MentorSidebar from "./MentorSidebar";
import ServicesSection from "./ServicesSection";
import ReviewsSection from "./ReviewsSection";
import { ArrowLeft } from "lucide-react";

import CalendarStep from "./CalendarStep";
import QueryStep from "./QueryStep";
import DetailsStep from "./DetailsStep";
import PaymentStep from "./PaymentStep";
import ConfirmationStep from "./ConfirmationStep";
import UpdateProfileModal from "../modal/Updateprofilemodal";

import MentorService from "@/lib/api/mentorship.service";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";

type LocalBookingStep = BookingStep | "query";

interface MentorProfileProps {
    mentorId: string;
}

const MentorProfile: React.FC<MentorProfileProps> = ({
    mentorId
}) => {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const deepLinkServiceId = searchParams.get("serviceId") || undefined;

    const [bookingStep, setBookingStep] = useState<LocalBookingStep>(null);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
    const [formData, setFormData] = useState<BookingFormData | null>(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [mentorData, setMentorData] = useState<any>(null);
    const [bookedSessionIds, setBookedSessionIds] = useState<string[]>([]);
    const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);

    const fetchMentor = () => {
        MentorService.getAllMentors()
            .then((res) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const found = res?.data?.find((m: any) => m.mentorId === mentorId) ?? null;
                setMentorData(found);
            })
            .catch(() => setMentorData(null));
    };

    useEffect(() => {
        fetchMentor();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mentorId]);

    useEffect(() => {
        if (mentorData && mentorData.userId) {
            if (user?.userId === mentorData.userId) {
                return;
            }
            MentorService.getMentorByUserId(mentorData.userId, true).catch(() => {});
        }
    }, [mentorData, user?.userId]);

    const handleServiceClick = (service: Service): void => {
        setSelectedService(service);
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
    if (bookingStep === "calendar") {
        return (
            <CalendarStep
                mentorId={mentorData?.mentorId || mentorId || ""}
                selectedService={selectedService}
                onBack={() => setBookingStep(null)}
                onContinue={(d) => { setCalendarData(d); setBookingStep("details"); }}
            />
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

    return (
        <div style={{ minHeight: "100vh", background: C.bg }}>
            {bookingSuccessMsg && (
                <div style={{
                    position: "fixed", top: 20, right: 20, zIndex: 3000, padding: "14px 20px",
                    borderRadius: "12px", fontSize: "14px", fontWeight: 600, color: "#15803d",
                    background: "#dcfce7", border: "1px solid #86efac", boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                }}>
                    {bookingSuccessMsg}
                </div>
            )}
            <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "88px 16px 24px" }}>
                <div style={{ marginBottom: "16px" }}>
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
                        <ArrowLeft size={18} /> Back
                    </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "24px", alignItems: "start" }}>
                    <MentorSidebar
                        mentorData={mentorData}
                        currentUserId={user?.userId}
                        onEditClick={() => setEditModalOpen(true)}
                    />
                    <div>
                        <ServicesSection
                            onServiceClick={handleServiceClick}
                            mentorId={mentorData?.mentorId || ""}
                            bookedSessionIds={bookedSessionIds}
                            currentUserId={user?.userId || ""}
                            mentorName={`${mentorData?.user?.firstName ?? ""} ${mentorData?.user?.lastName ?? ""}`.trim()}
                            deepLinkSessionId={deepLinkServiceId}
                        />
                        <ReviewsSection mentorId={mentorData?.mentorId || ""} />
                    </div>
                </div>
            </div>

            <UpdateProfileModal
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                mentorData={mentorData}
                mentorId={mentorData?.mentorId || ""}
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