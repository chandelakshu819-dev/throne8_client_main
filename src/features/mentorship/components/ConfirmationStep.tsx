// components/mentor-profile/booking/ConfirmationStep.tsx

import React from "react";
import { MONTHS, C, btnPrimary } from "../types/data";
import type { Service, CalendarData, FormData } from "../types/types";

interface ConfirmationStepProps {
    selectedService: Service | null;
    calendarData: CalendarData | null;
    formData: FormData | null;
    onReset: () => void;
}

const ConfirmationStep: React.FC<ConfirmationStepProps> = ({ selectedService, calendarData, formData, onReset }) => {
    const isRes: boolean = selectedService?.type === "Resource";
    const month: number | undefined = calendarData?.currentMonth.getMonth();
    const year: number | undefined = calendarData?.currentMonth.getFullYear();

    const rows: [string, string][] = [
        [isRes ? "Resource:" : "Service:", selectedService?.title ?? ""],
        ...(calendarData?.selectedDate ? ([["Date:", `${calendarData.selectedDate} ${month !== undefined ? MONTHS[month] : ""} ${year}`], ["Time:", calendarData.selectedTime]] as [string, string][]) : []),
        ...(formData?.email ? ([["Email:", formData.email]] as [string, string][]) : []),
    ];

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, padding: "32px 16px" }}>
            <div style={{ maxWidth: "480px", width: "100%", borderRadius: "24px", padding: "48px 40px", background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 20px 60px rgba(74,55,40,0.15)", textAlign: "center" }}>
                <div style={{ fontSize: "64px", marginBottom: "16px" }}>{isRes ? "ðŸ“¥" : "âœ…"}</div>
                <h2 style={{ fontSize: "22px", fontWeight: "bold", color: C.dark, marginBottom: "8px" }}>{isRes ? "Download Ready! ðŸŽ‰" : "Booking Confirmed! ðŸŽ‰"}</h2>
                <p style={{ color: C.mid, marginBottom: "24px", fontSize: "14px" }}>{isRes ? "Your resource is ready to download" : "Your session has been successfully booked"}</p>

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
                        <p style={{ margin: 0, fontSize: "13px", color: "#2e7d32" }}>ðŸ“¥ Your download will begin shortly</p>
                    ) : (
                        <>
                            <p style={{ margin: "0 0 6px 0", fontSize: "13px", color: "#2e7d32" }}>ðŸ“§ A confirmation email has been sent to {formData?.email}</p>
                            <p style={{ margin: 0, fontSize: "13px", color: "#2e7d32" }}>ðŸ“… Add this session to your calendar to get reminded</p>
                        </>
                    )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <button onClick={onReset} style={{ ...btnPrimary, width: "100%", padding: "14px", borderRadius: "12px", fontSize: "15px" }}>
                        {isRes ? "Get Another Resource" : "Book This Session"}
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