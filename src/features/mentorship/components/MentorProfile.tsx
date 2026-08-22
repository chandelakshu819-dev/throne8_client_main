// components/mentor-profile/MentorProfile.tsx"use client";

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
import { useSearchParams } from "next/navigation";
import SessionService from "@/lib/api/session.service";

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

    const searchParams = useSearchParams();
    
    useEffect(() => {
        const serviceId = searchParams.get('serviceId');
        if (serviceId && !bookingStep) {
            // Fetch services and pre-select
            SessionService.getAllSessionsFromDB({ limit: 50 })
                .then((res) => {
                    const allSessions = res?.data ?? [];
                    const mentorSessions = allSessions.filter((s: any) => s.mentorId === mentorId);
                    const foundService = mentorSessions.find((s: any) => (s._id === serviceId || s.id === serviceId || s.sessionId === serviceId));
                    if (foundService) {
                        const mappedService: Service = {
                            id: foundService._id || foundService.id,
                            type: foundService.sessionType === "group_session" ? "1:1 Call" : "1:1 Call",
                            title: foundService.title,
                            duration: `${foundService.duration} mins`,
                            originalPrice: null,
                            price: foundService.pricing?.totalAmount === 0 || !foundService.pricing ? "Free" : (foundService.pricing?.totalAmount || foundService.pricing?.basePrice)
                        };
                        handleServiceClick(mappedService);
                    } else {
                        // Fallback: it might be a Group Session
                        MentorService.getGroupSessionById(serviceId)
                            .then((groupRes: any) => {
                                const groupSession = groupRes?.data || groupRes?.session || groupRes;
                                if (groupSession && groupSession.mentorId === mentorId) {
                                    const mappedGroupService: Service = {
                                        id: groupSession.sessionId || groupSession._id || serviceId,
                                        type: "Group Session",
                                        title: groupSession.title,
                                        duration: `${groupSession.duration} mins`,
                                        originalPrice: null,
                                        price: groupSession.pricing?.pricePerPerson === 0 ? "Free" : groupSession.pricing?.pricePerPerson
                                    };
                                    handleServiceClick(mappedGroupService);
                                }
                            })
                            .catch(err => console.error("Failed to fetch group session fallback", err));
                    }
                })
                .catch(err => console.error("Failed to preselect service", err));
        }
    }, [mentorId, searchParams]);

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

    return (
        <div style={{ minHeight: "100vh", background: C.bg }}>
            <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px 16px", display: "grid", gridTemplateColumns: "340px 1fr", gap: "24px", alignItems: "start" }}>
                <MentorSidebar mentorData={mentorData} />
                <div>
                    {bookingStep === "calendar" && (
                        <CalendarStep mentorId={mentorData?.mentorId || ""} selectedService={selectedService} onBack={() => setBookingStep(null)} onContinue={(d) => { setCalendarData(d); setBookingStep("details"); }} />
                    )}
                    {bookingStep === "details" && (
                        <DetailsStep selectedService={selectedService} calendarData={calendarData!} onBack={() => setBookingStep("calendar")} onContinue={(d: BookingFormData) => { setFormData(d); setBookingStep("payment"); }} />
                    )}
                    {bookingStep === "payment" && (
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
                    )}
                    {bookingStep === "confirmation" && (
                        <ConfirmationStep selectedService={selectedService} calendarData={calendarData} formData={formData} onReset={resetBooking} />
                    )}

                    {!bookingStep && (
                        <>
                            <ServicesSection
                                onServiceClick={handleServiceClick}
                                mentorId={mentorData?.mentorId || ""}
                                bookedSessionIds={bookedSessionIds}
                                currentUserId={user?.userId || ""}
                            />
                            <ReviewsSection />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MentorProfile;