// components/mentor-profile/booking/ConfirmationStep.tsx

import React from "react";
import { MONTHS, C, btnPrimary, formatSlotRange } from "../../types/data";
import type { Service, CalendarData, FormData } from "../../types/types";

interface ConfirmationStepProps {
    selectedService: Service | null;
    calendarData: CalendarData | null;
    formData: FormData | null;
    bookingResponse?: any;
    onReset: () => void;
}

const ConfirmationStep: React.FC<ConfirmationStepProps> = ({ selectedService, calendarData, formData, bookingResponse, onReset }) => {
    const isRes: boolean = selectedService?.type === "Resource";
    const month: number | undefined = calendarData?.currentMonth.getMonth();
    const year: number | undefined = calendarData?.currentMonth.getFullYear();

    // Derive backend status explicitly. Fall back to implicit confirmation if no payload.
    // The backend payload might be { success: true, data: { ... bookings: [{status: "pending"...}] } }
    // Or just { status: "pending" } depending on object wrapping. It adds it to the end of bookings usually.
    let derivedStatus = "confirmed"; // traditional fallback
    if (bookingResponse) {
        // SeniorMentor returns session in data, bookings inside data.bookings
        const fetchedSession = bookingResponse.session || bookingResponse.data || bookingResponse;
        if (fetchedSession?.bookings?.length > 0) {
            const b = fetchedSession.bookings[fetchedSession.bookings.length - 1];
            derivedStatus = b.status || derivedStatus;
        } else if (bookingResponse.status) {
            derivedStatus = bookingResponse.status;
        }
    }

    const isPending = derivedStatus === "pending";

    const rows: [string, React.ReactNode][] = [
        [isRes ? "Resource:" : "Service:", selectedService?.title ?? ""],
        ...(calendarData?.selectedDate ? ([["Date:", `${calendarData.selectedDate} ${month !== undefined ? MONTHS[month] : ""} ${year}`], ["Time:", calendarData.selectedTime ? formatSlotRange(calendarData.selectedTime.split(" - ")[0]) : ""]] as [string, string][]) : []),
        ...(formData?.email ? ([["Email:", formData.email]] as [string, string][]) : []),
        ...(!isRes ? ([
            ["Status:", (
                <span style={{ 
                    background: isPending ? "#fff3e0" : "#e8f5e9", 
                    color: isPending ? "#e65100" : "#2e7d32", 
                    padding: "4px 8px", borderRadius: "12px", 
                    fontSize: "12px", fontWeight: "bold" 
                }}>
                    {isPending ? "Pending" : "Upcoming"}
                </span>
            )]
        ] as [string, React.ReactNode][]) : []),
    ];

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, padding: "32px 16px" }}>
            <div style={{ maxWidth: "480px", width: "100%", borderRadius: "24px", padding: "48px 40px", background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 20px 60px rgba(74,55,40,0.15)", textAlign: "center" }}>
                <div style={{ fontSize: "64px", marginBottom: "16px" }}>{isRes ? "📥" : "✅"}</div>
                <h2 style={{ fontSize: "22px", fontWeight: "bold", color: C.dark, marginBottom: "8px" }}>
                    {isRes ? "Download Ready! 🎉" : (isPending ? "Booking Request Sent! 🎉" : "Booking Confirmed! 🎉")}
                </h2>
                <p style={{ color: C.mid, marginBottom: "24px", fontSize: "14px" }}>
                    {isRes ? "Your resource is ready to download" : (isPending ? "Your session request has been successfully submitted." : "Your session has been successfully booked")}
                </p>

                <div style={{ borderRadius: "16px", padding: "20px", background: C.bg, border: `1px solid ${C.border}`, marginBottom: "20px", textAlign: "left" }}>
                    <h3 style={{ fontWeight: "bold", color: C.dark, marginBottom: "12px" }}>{isRes ? "Resource Details" : "Booking Details"}</h3>
                    {rows.map(([k, v]) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: C.dark, marginBottom: "5px" }}>
                            <span style={{ color: C.mid }}>{k}</span><span style={{ fontWeight: 500 }}>{v}</span>
                        </div>
                    ))}
                </div>

                <div style={{ borderRadius: "12px", padding: "14px 16px", background: "#e8f5e9", border: "1px solid #c8e6c9", marginBottom: "24px", textAlign: "left" }}>
                    {isRes ? (
                        <p style={{ margin: 0, fontSize: "13px", color: "#2e7d32" }}>📥 Your download will begin shortly</p>
                    ) : (
                        <>
                            <p style={{ margin: "0 0 6px 0", fontSize: "13px", color: "#2e7d32" }}>📧 A confirmation email has been sent to {formData?.email}</p>
                            <p style={{ margin: 0, fontSize: "13px", color: "#2e7d32" }}>📅 Add this session to your calendar to get reminded</p>
                        </>
                    )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <button onClick={onReset} style={{ ...btnPrimary, width: "100%", padding: "14px", borderRadius: "12px", fontSize: "15px" }}>
                        {isRes ? "Get Another Resource" : "View My Booking"}
                    </button>
                    <button onClick={onReset} style={{ width: "100%", padding: "14px", borderRadius: "12px", fontSize: "15px", background: C.border, border: "none", cursor: "pointer", color: C.dark, fontWeight: 500 }}>
                        Back to Profile
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationStep;