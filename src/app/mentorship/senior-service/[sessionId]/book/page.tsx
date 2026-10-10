"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { GlobalStyles, Navigation } from "@/features/index";
import { useAuth } from "@/features/auth/hooks/useAuth";

import SeniorSessionService from "@/lib/api/seniorSession.service";
import MentorService from "@/lib/api/mentorship.service";

import CalendarStep from "@/features/mentorship/components/mentor/CalendarStep";
import DetailsStep from "@/features/mentorship/components/mentor/DetailsStep";
import ConfirmationStep from "@/features/mentorship/components/mentor/ConfirmationStep";
import SeniorPaymentStep from "@/features/mentorship/components/senior/SeniorPaymentStep";
import Toast from "@/shared/uiComponents/Toast";

import type { BookingStep, Service, CalendarData, FormData as BookingFormData } from "@/features/mentorship/types/types";

export default function SeniorServiceBookingPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const sessionId = params.sessionId as string;

    const [service, setService] = useState<any>(null);
    const [mentor, setMentor] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [toastMsg, setToastMsg] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const [bookingStep, setBookingStep] = useState<BookingStep>("calendar");
    const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
    const [formData, setFormData] = useState<BookingFormData | null>(null);
    const [bookingResponse, setBookingResponse] = useState<any>(null);

    useEffect(() => {
        if (!sessionId) return;
        
        SeniorSessionService.getSessionById(sessionId)
            .then(res => {
                const data = res?.data || res?.session || res;
                setService(data);
                if (data?.mentorId) {
                    MentorService.getMentorByUserId(data.mentorId)
                        .then(mRes => {
                            // MentorResponse shape: { success, message, data: { mentorId, userId, ... } }
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
                <div className="w-10 h-10 rounded-full border-4 border-[#e2d5c8] border-t-[#8b7355] animate-spin" />
            </div>
        );
    }

    if (error || !service) {
        return (
            <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center gap-4">
                <p className="text-red-500 font-medium">{error || "Service not found"}</p>
                <button onClick={() => router.back()} className="px-6 py-2 bg-[#4a3728] text-white rounded-xl text-sm font-bold">
                    Go Back
                </button>
            </div>
        );
    }

    // Safely extract the normalized real Mentor.mentorId for Availability lookups.
    // mentor.mentorId is the correct UUID from MentorResponse.data.
    // Fallback to service.mentorId handles cases where mentor fetch failed.
    const effectiveMentorId: string = mentor?.mentorId || service?.mentorId || "";

    // Minimum Presentational Adapter for reused steps.
    // DO NOT pass the full `service` object into these generic generic steps 
    // to shield the application from architectural mismatches.
    const presentationServiceAdapter = {
        id: service.sessionId || service._id,
        title: service.title,
        price: service.pricing?.basePrice || "Free",
        type: "1:1 Call",
        duration: service.duration,
        durationMinutes: service.duration
    } as Service;

    const activeSeniorBookings = (service?.bookings || [])
        .filter((b: any) => ['pending', 'upcoming', 'confirmed', 'in_progress'].includes(b.status))
        .map((b: any) => {
            const d = new Date(b.scheduledAt);
            d.setMinutes(d.getMinutes() + 330); 
            const y = d.getUTCFullYear();
            const m = String(d.getUTCMonth() + 1).padStart(2, "0");
            const day = String(d.getUTCDate()).padStart(2, "0");
            
            return {
                slotTime: b.slotTime, 
                dateStr: `${y}-${m}-${day}`
            };
        });

    const resetBooking = (): void => {
        setBookingStep(null);
        setCalendarData(null);
        setFormData(null);
        setBookingResponse(null);
        router.push(`/mentorship/senior-service/${sessionId}`);
    };

    return (
        <div className="min-h-screen bg-[#FAF9F6] text-[#4a3728] font-sans pb-20">
            <GlobalStyles />
            <Navigation currentUserId={user?.userId} activeTimezone="IST (UTC+5:30)" />
            
            <main className="max-w-7xl mx-auto px-4 pt-16">
                
                {bookingStep === "calendar" && (
                    <CalendarStep 
                        mentorId={effectiveMentorId} 
                        selectedService={presentationServiceAdapter} 
                        seniorBookedSlots={activeSeniorBookings}
                        isSeniorService={true}
                        onBack={() => router.push(`/mentorship/senior-service/${sessionId}`)} 
                        onContinue={(d) => { setCalendarData(d); setBookingStep("details"); }} 
                    />
                )}
                
                {bookingStep === "details" && (
                    <DetailsStep 
                        selectedService={presentationServiceAdapter} 
                        calendarData={calendarData!} 
                        onBack={() => setBookingStep("calendar")} 
                        onContinue={(d: BookingFormData) => { setFormData(d); setBookingStep("payment"); }} 
                    />
                )}
                
                {bookingStep === "payment" && (
                     <SeniorPaymentStep
                         sessionId={sessionId}
                         basePrice={service.pricing?.basePrice || 0}
                         calendarData={calendarData!}
                         formData={formData!}
                         mentorId={effectiveMentorId}
                         onBack={() => setBookingStep("details")}
                         onBookingSuccess={(response) => {
                             setBookingResponse(response);
                             setToastMsg({ message: "Session request sent successfully", type: "success" });
                             setBookingStep("confirmation");
                         }}
                     />
                )}
                
                {bookingStep === "confirmation" && (
                    <ConfirmationStep 
                        selectedService={presentationServiceAdapter} 
                        calendarData={calendarData} 
                        formData={formData} 
                        bookingResponse={bookingResponse}
                        onReset={resetBooking} 
                    />
                )}

                {toastMsg && (
                    <Toast 
                        message={toastMsg.message} 
                        onClose={() => setToastMsg(null)} 
                    />
                )}
            </main>
        </div>
    );
}
