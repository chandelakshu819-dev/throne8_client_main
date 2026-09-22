// feature  / mentorship /components/mentor-profile/mentor/CalendarStep.tsx
"use client";


import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "./Icons";
import { TIME_SLOTS, MONTHS, DAYS, C, btnPrimary, formatTimeAMPM, formatSlotRange } from "../../types/data";
import type { Service, CalendarData } from "../../types/types";
import AvailabilityService from "@/lib/api/availability.service";

interface CalendarStepProps {
    selectedService: Service | null;
    onBack: () => void;
    onContinue: (data: CalendarData) => void;
    mentorId: string;
}


interface BookableSlot {
    startTime: string;
    endTime: string;
}

const toMinutes = (t: string): number => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
};

const toTimeString = (mins: number): string =>
    `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

// Service ka duration (minutes). Field ka naam alag ho to yahan badlo.
const getServiceDuration = (service: any): number => {
    const raw = service?.duration ?? service?.durationMinutes ?? service?.slotDuration;
    const n = typeof raw === "string" ? parseInt(raw, 10) : Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 0;
};

// Free slots ko jodkar continuous windows banao, phir service duration se dobara kaato
const buildSlotsForDuration = (daySlots: any[], duration: number): BookableSlot[] => {
    const free = daySlots
        .filter((s) => !s.isBooked && !s.isBlocked)
        .map((s) => ({ start: toMinutes(s.startTime), end: toMinutes(s.endTime) }))
        .sort((a, b) => a.start - b.start);

    if (duration <= 0) {
        return free.map((s) => ({ startTime: toTimeString(s.start), endTime: toTimeString(s.end) }));
    }

    const windows: { start: number; end: number }[] = [];
    for (const s of free) {
        const last = windows[windows.length - 1];
        if (last && s.start <= last.end) {
            last.end = Math.max(last.end, s.end);
        } else {
            windows.push({ ...s });
        }
    }

    const result: BookableSlot[] = [];
    for (const w of windows) {
        for (let start = w.start; start + duration <= w.end; start += duration) {
            result.push({ startTime: toTimeString(start), endTime: toTimeString(start + duration) });
        }
    }
    return result;
};

const CalendarStep: React.FC<CalendarStepProps> = ({ selectedService, onBack, onContinue, mentorId }) => {
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [selectedDate, setSelectedDate] = useState<number | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    const [availability, setAvailability] = useState<any[]>([]);
    const [daySlots, setDaySlots] = useState<any[]>([]);
    const [noAvailability, setNoAvailability] = useState(false);
    const [selectedAvailabilityId, setSelectedAvailabilityId] = useState<string>("");

    const year: number = currentMonth.getFullYear();
    const month: number = currentMonth.getMonth();
    const daysInMonth: number = new Date(year, month + 1, 0).getDate();
    const startingDay: number = new Date(year, month, 1).getDay();
   

    const today: Date = new Date();

    // ✅ NEW: selected service ke duration ke hisaab se slots
    const serviceDuration = getServiceDuration(selectedService);
    const bookableSlots = useMemo(
        () => buildSlotsForDuration(daySlots, serviceDuration),
        [daySlots, serviceDuration]
    );



    useEffect(() => {
        if (!mentorId) return;

        // ✅ FIX: pehle admin-only getAllAvailabilityFromDB({limit:100}) use ho raha
        // tha — sab mentors ke pehle 100 records (date ascending) fetch karke
        // client-side filter karta tha. Agar DB mein (sab mentors milakar) 100 se
        // zyada records hote, to is mentor ka aage wala date (e.g. 24 Sept) un
        // pehle 100 mein hi nahi aata — mentee ko "No Availability Set" dikhta
        // tha jabki mentor ke apne dashboard par wahi date "Available" dikhta tha.
        // Ab wahi mentorId-scoped, date-range-filtered endpoint use kar rahe hain
        // jo mentor ka apna Availability page use karta hai — aur currentMonth
        // change hone par bhi refetch hota hai (pehle sirf mentorId change par
        // hota tha, month navigate karne par stale data dikhta rehta tha).
        const y = currentMonth.getFullYear();
        const m = String(currentMonth.getMonth() + 1).padStart(2, "0");
        const lastDay = new Date(y, currentMonth.getMonth() + 1, 0).getDate();
        const startDate = `${y}-${m}-01`;
        const endDate = `${y}-${m}-${String(lastDay).padStart(2, "0")}`;

        AvailabilityService.getMentorAvailability(mentorId, { startDate, endDate })
            .then((res: any) => {
                setAvailability(res?.data?.availabilities ?? []);
            })
            .catch(() => setAvailability([]));
    }, [mentorId, currentMonth]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    useEffect(() => {
        setSelectedTime(null);

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
        } else {
            setDaySlots([]);
            setSelectedAvailabilityId("");
            setNoAvailability(true);
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
                <p style={{ color: C.mid, fontSize: "13px", marginBottom: "24px" }}>Booking: {selectedService?.title}{serviceDuration > 0 ? ` (${serviceDuration} min)` : ""}</p>
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
                                return (
                                    <button
                                        key={day}
                                        disabled={isPast}
                                        onClick={() => !isPast && setSelectedDate(day)}
                                        style={{
                                            aspectRatio: "1",
                                            borderRadius: "8px",
                                            fontWeight: 500,
                                            cursor: isPast ? "not-allowed" : "pointer",
                                            background: isPast
                                                ? "#f0f0f0"
                                                : sel
                                                    ? C.mid
                                                    : isTd
                                                        ? C.border
                                                        : C.bg,
                                            color: isPast
                                                ? "#b0b0b0"
                                                : sel
                                                    ? "#fff"
                                                    : C.dark,
                                            border: isTd && !sel
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
                        <h3 style={{ fontWeight: "bold", color: C.dark, marginBottom: "16px", fontSize: "16px" }}>Total Available Time Slots: {bookableSlots.length}</h3>
                        <p style={{ fontSize: "14px", color: C.mid, marginBottom: "24px" }}>
                            {daySlots.length > 0
                                ? `Available from ${formatTimeAMPM(daySlots[0].startTime)} to ${formatTimeAMPM(daySlots[daySlots.length - 1].endTime)}`
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
                       {selectedDate && !noAvailability && bookableSlots.length === 0 && (
                            
                            <p className="text-[#4a3728] font-bold" style={{ textAlign: "center", fontSize: "18px", padding: "16px", background: C.bg, borderRadius: "8px" }}>
                              No {serviceDuration > 0 ? `${serviceDuration}-minute ` : ""}slots free for {MONTHS[month]} {selectedDate}, {year}. All slots are Booked or Blocked, or the free time is too short.
                            </p>
                        )}
                     {selectedDate && !noAvailability && bookableSlots.length > 0 && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px", marginBottom: "24px" }}>
                            {bookableSlots.map((slot) => {
                                    const time = `${slot.startTime} - ${slot.endTime}`;
                                    const displayTime = formatSlotRange(time);
                                    const isDisabled = false; // bookableSlots mein sirf free slots hi aate hain
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
                                                                                     {formatTimeAMPM(slot.startTime)}
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