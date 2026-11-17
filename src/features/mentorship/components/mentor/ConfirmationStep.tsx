//src/features/mentorship/components/mentor/ConfirmationStep.tsx
import React from "react";
import { CheckCircle2, Download, Mail, CalendarPlus } from "lucide-react";
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
        <div className="flex min-h-screen w-full items-center justify-center px-3 py-6 sm:px-4 sm:py-8" style={{ background: C.bg }}>
            <div
                className="w-full max-w-[480px] rounded-2xl p-5 text-center sm:rounded-3xl sm:p-10"
                style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 20px 60px rgba(74,55,40,0.15)" }}
            >
                <div className="mb-4 flex justify-center">
                    {isRes ? (
                        <Download className="h-14 w-14 sm:h-16 sm:w-16" style={{ color: C.dark }} />
                    ) : (
                        <CheckCircle2 className="h-14 w-14 sm:h-16 sm:w-16" style={{ color: "#2e7d32" }} />
                    )}
                </div>
                <h2 className="mb-2 text-xl font-bold sm:text-[22px]" style={{ color: C.dark }}>
                    {isRes ? "Download Ready!" : (isPending ? "Booking Request Sent!" : "Booking Confirmed!")}
                </h2>
                <p className="mb-6 text-sm" style={{ color: C.mid }}>
                    {isRes ? "Your resource is ready to download" : (isPending ? "Your session request has been successfully submitted." : "Your session has been successfully booked")}
                </p>

                <div className="mb-5 rounded-2xl p-4 text-left sm:p-5" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                    <h3 className="mb-3 font-bold" style={{ color: C.dark }}>{isRes ? "Resource Details" : "Booking Details"}</h3>
                    {rows.map(([k, v]) => (
                        <div key={k} className="mb-1.5 flex items-start justify-between gap-4 text-[13px]" style={{ color: C.dark }}>
                            <span className="shrink-0" style={{ color: C.mid }}>{k}</span>
                            <span className="min-w-0 break-words text-right font-medium">{v}</span>
                        </div>
                    ))}
                </div>

                <div className="mb-6 rounded-xl p-3.5 text-left sm:px-4" style={{ background: "#e8f5e9", border: "1px solid #c8e6c9" }}>
                    {isRes ? (
                        <p className="m-0 flex items-start gap-2 text-[13px]" style={{ color: "#2e7d32" }}>
                            <Download className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>Your download will begin shortly</span>
                        </p>
                    ) : (
                        <>
                            <p className="mb-1.5 flex items-start gap-2 text-[13px]" style={{ color: "#2e7d32" }}>
                                <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                                <span className="min-w-0 break-words">A confirmation email has been sent to {formData?.email}</span>
                            </p>
                            <p className="m-0 flex items-start gap-2 text-[13px]" style={{ color: "#2e7d32" }}>
                                <CalendarPlus className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>Add this session to your calendar to get reminded</span>
                            </p>
                        </>
                    )}
                </div>

                <div className="flex flex-col gap-2.5">
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