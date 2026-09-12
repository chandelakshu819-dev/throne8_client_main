//src/features/mentorship/components/CalendarStep.tsx
"use client";

import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "./Icons";
import { TIME_SLOTS, MONTHS, DAYS, C, btnPrimary } from "./mentor/types/data";
import type { Service, CalendarData } from "./mentor/types/types";
import AvailabilityService from "@/lib/api/availability.service";
import SessionService from "@/lib/api/session.service";


interface CalendarStepProps {
    selectedService: Service | null;
    onBack: () => void;
    onContinue: (data: CalendarData) => void;
    mentorId: string;
}

const CalendarStep: React.FC<CalendarStepProps> = ({ selectedService, onBack, onContinue, mentorId }) => {
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [selectedDate, setSelectedDate] = useState<number | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    const [availability, setAvailability] = useState<any[]>([]);
    const [daySlots, setDaySlots] = useState<any[]>([]);
    const [noAvailability, setNoAvailability] = useState(false);
    const [isDayBlocked, setIsDayBlocked] = useState(false);
    const [selectedAvailabilityId, setSelectedAvailabilityId] = useState<string>("");
    const [activeSessionCount, setActiveSessionCount] = useState(0);



    const year: number = currentMonth.getFullYear();
    const month: number = currentMonth.getMonth();
    const daysInMonth: number = new Date(year, month + 1, 0).getDate();
    const startingDay: number = new Date(year, month, 1).getDay();
    const today: Date = new Date();

    useEffect(() => {
        if (!mentorId) return;
        AvailabilityService.getMentorAvailability(mentorId)
            .then((res) => {
                const list = res?.data?.availabilities ?? res?.data ?? [];
                setAvailability(Array.isArray(list) ? list : []);
            })
            .catch(() => setAvailability([]));
    }, [mentorId]);

    // ✅ NEW: soft warning — count this mentee's existing pending/confirmed
    // sessions with this specific mentor. Booking is never blocked; this is
    // purely informational so a mentee doesn't accidentally over-book.
    useEffect(() => {
        if (!mentorId) return;
        SessionService.getUpcomingSessions({ role: "mentee", limit: 50 })
            .then((res) => {
                const list = res?.data ?? [];
                const sessions = Array.isArray(list) ? list : [];
                const count = sessions.filter((s: any) => {
                    const status = s.status;
                    return s.mentorId === mentorId && (status === "pending" || status === "confirmed");
                }).length;
                setActiveSessionCount(count);
            })
            .catch(() => setActiveSessionCount(0));
    }, [mentorId]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Har month change/availability update pe blocked dates recompute karo
    const blockedDaysInMonth = React.useMemo(() => {
        const set = new Set<number>();
        availability.forEach((a: any) => {
            if (!a.isDateBlocked) return;
            const [ay, am, ad] = a.date.substring(0, 10).split("-").map(Number);
            if (ay === year && am - 1 === month) set.add(ad);
        });
        return set;
    }, [availability, year, month]);



    useEffect(() => {
        if (!selectedDate) return;

        const selectedDateObj = new Date(year, month, selectedDate);
        const y2 = selectedDateObj.getFullYear();
        const m2 = String(selectedDateObj.getMonth() + 1).padStart(2, "0");
        const d2 = String(selectedDateObj.getDate()).padStart(2, "0");
        const dateStr = `${y2}-${m2}-${d2}`;

        const matched = availability.find((a: any) => {
            const availDate = a.date.substring(0, 10);
            return availDate === dateStr;
        });

        if (matched) {
            setDaySlots(matched.slots);
            setSelectedAvailabilityId(matched.availabilityId);
            setNoAvailability(false);
            setIsDayBlocked(!!matched.isDateBlocked);
        } else {
            setDaySlots([]);
            setSelectedAvailabilityId("");
            setNoAvailability(true);
            setIsDayBlocked(false);
        }
    }, [selectedDate, availability, year, month]);



    useEffect(() => {
        const isCurrentMonth =
            year === today.getFullYear() &&
            month === today.getMonth();

        if (isCurrentMonth) {
            setSelectedDate(today.getDate());
        } else {
            setSelectedDate(null);
        }
    }, [year, month]);

    return (
        <div style={{ minHeight: "100vh", background: C.bg, padding: "32px 16px" }}>
            <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: C.mid, display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 500, marginBottom: "24px" }}>
                ← Back to Profile
            </button>

            <div style={{ maxWidth: "1200px", margin: "0 auto", borderRadius: "24px", padding: "40px", background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 20px 60px rgba(74,55,40,0.15)" }}>
            <h2 style={{ fontSize: "22px", fontWeight: "bold", color: C.dark, marginBottom: "4px" }}>Select Date &amp; Time</h2>
                <p style={{ color: C.mid, fontSize: "13px", marginBottom: "16px" }}>Booking: {selectedService?.title}</p>

                {activeSessionCount >= 3 && (
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "12px 16px",
                        borderRadius: "10px",
                        background: "#fef3c7",
                        border: "1px solid #fde68a",
                        color: "#92400e",
                        fontSize: "13px",
                        fontWeight: 500,
                        marginBottom: "20px",
                    }}>
                        ℹ️ You already have {activeSessionCount} active sessions with this mentor. You can still book another one.
                    </div>
                )}

                

                {/* 2-Column Grid Layout */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", alignItems: "start" }}>
                    {/* LEFT COLUMN - CALENDAR */}
                    <div>
                        {/* Month Nav */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <button className="text-[#4a3728]" onClick={() => setCurrentMonth(new Date(year, month - 1))} style={{ padding: "8px", borderRadius: "8px", border: `1px solid ${C.border}`, background: C.bg, cursor: "pointer" }}><ChevronLeft /></button>
                            <span style={{ fontWeight: "bold", color: C.dark, fontSize: "17px" }}>{MONTHS[month]} {year}</span>
                            <button className="text-[#4a3728]" onClick={() => setCurrentMonth(new Date(year, month + 1))} style={{ padding: "8px", borderRadius: "8px", border: `1px solid ${C.border}`, background: C.bg, cursor: "pointer" }}><ChevronRight /></button>
                        </div>

                        {/* Day Labels */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "4px", marginBottom: "8px" }}>
                            {DAYS.map((d) => <div key={d} style={{ textAlign: "center", fontSize: "12px", fontWeight: 600, color: C.mid, padding: "4px 0" }}>{d}</div>)}
                        </div>

                        {/* Day Cells */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "4px", marginBottom: "32px" }}>
                            {Array.from({ length: startingDay }).map((_, i) => <div key={`e${i}`} />)}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day: number = i + 1;
                                const sel: boolean = selectedDate === day;
                                const isTd: boolean = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
                                const cellDate = new Date(year, month, day);
                                cellDate.setHours(0, 0, 0, 0);
                                const isPast = cellDate < todayStart;
                                const isBlocked = blockedDaysInMonth.has(day);
                                const isDisabledCell = isPast || isBlocked;
                                return (
                                    <button
                                        key={day}
                                        disabled={isDisabledCell}
                                        title={isBlocked ? "Mentor is unavailable on this date" : undefined}
                                        onClick={() => !isDisabledCell && setSelectedDate(day)}
                                        style={{
                                            aspectRatio: "1",
                                            borderRadius: "8px",
                                            fontWeight: 500,
                                            cursor: isDisabledCell ? "not-allowed" : "pointer",
                                            background: isBlocked
                                                ? "#fee2e2"
                                                : isPast
                                                    ? "#f0f0f0"
                                                    : sel
                                                        ? C.mid
                                                        : isTd
                                                            ? C.border
                                                            : C.bg,
                                            color: isBlocked
                                                ? "#dc2626"
                                                : isPast
                                                    ? "#b0b0b0"
                                                    : sel
                                                        ? "#fff"
                                                        : C.dark,
                                            border: isBlocked
                                                ? "1px solid #fca5a5"
                                                : isTd && !sel
                                                    ? `2px solid ${C.mid}`
                                                    : `1px solid ${C.border}`,
                                            opacity: isPast ? 0.6 : 1,
                                            transition: "all 0.2s",
                                        }}
                                    >
                                        {day}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* RIGHT COLUMN - TIME SLOTS & BUTTON */}
                    <div>
                        <h3 style={{ fontWeight: "bold", color: C.dark, marginBottom: "16px", fontSize: "16px" }}>Total Available Time Slots: {daySlots.filter(s => !s.isBooked && !s.isBlocked).length}</h3>
                        <p style={{ fontSize: "14px", color: C.mid, marginBottom: "24px" }}>
                            {daySlots.length > 0
                                ? `Available from ${daySlots[0].startTime} to ${daySlots[daySlots.length - 1].endTime}`
                                : "No slots available"}
                        </p>

                        {!selectedDate && (
                            <p className="text-[#4a3728] font-bold" style={{ textAlign: "center", fontSize: "18px", padding: "16px", background: C.bg, borderRadius: "8px" }}>
                                Please select a Date to see Available Slots
                            </p>
                        )}

                        {selectedDate && noAvailability && (
                            <p className="text-[#4a3728] font-bold" style={{ textAlign: "center", fontSize: "18px", padding: "16px", background: C.bg, borderRadius: "8px" }}>
                                No Availability Set for {MONTHS[month]} {selectedDate}, {year} by the Mentor.
                            </p>
                        )}

{selectedDate && !noAvailability && isDayBlocked && (
                            <p className="text-[#dc2626] font-bold" style={{ textAlign: "center", fontSize: "18px", padding: "16px", background: "#fee2e2", borderRadius: "8px" }}>
                                Mentor has blocked {MONTHS[month]} {selectedDate}, {year}. Please choose another date.
                            </p>
                        )}

                        {selectedDate && !noAvailability && !isDayBlocked && daySlots.filter(s => !s.isBooked && !s.isBlocked).length === 0 && (
                            <p className="text-[#4a3728] font-bold" style={{ textAlign: "center", fontSize: "18px", padding: "16px", background: C.bg, borderRadius: "8px" }}>
                                All Slots for {MONTHS[month]} {selectedDate}, {year} are Booked or Blocked.
                            </p>
                        )}

                        {selectedDate && !noAvailability && !isDayBlocked && daySlots.length > 0 && (


                            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "8px", marginBottom: "24px" }}>
                                {daySlots.map((slot) => {
                                    const time = `${slot.startTime} - ${slot.endTime}`;
                                    const isDisabled = slot.isBooked || slot.isBlocked;
                                    const sel = selectedTime === time;

                                    return (
                                        <button
                                            key={time}
                                            disabled={isDisabled}
                                            title={isDisabled ? "Slot is Already Booked" : ""}
                                            onClick={() => !isDisabled && setSelectedTime(time)}
                                            style={{
                                                padding: "12px 8px",
                                                borderRadius: "8px",
                                                fontSize: "13px",
                                                fontWeight: 500,
                                                border: `1px solid ${C.muted}`,
                                                background: isDisabled
                                                    ? "#e5e5e5"
                                                    : sel
                                                        ? C.mid
                                                        : C.border,
                                                color: isDisabled
                                                    ? "#9e9e9e"
                                                    : sel
                                                        ? "#fff"
                                                        : C.dark,
                                                cursor: isDisabled ? "not-allowed" : "pointer",
                                                opacity: isDisabled ? 0.6 : 1,
                                                transition: "all 0.2s",
                                            }}
                                        >
                                            {time}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {selectedDate && selectedTime && (
                            <button onClick={() => onContinue({
                                selectedDate,
                                selectedTime,
                                currentMonth,
                                availabilityId: selectedAvailabilityId,
                                slotTime: selectedTime,
                            })} style={{ ...btnPrimary, width: "100%", padding: "14px", borderRadius: "12px", fontSize: "15px" }}>
                                Continue to Details →
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarStep;