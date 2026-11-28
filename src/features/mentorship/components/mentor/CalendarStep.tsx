// feature  / mentorship /components/mentor-profile/mentor/CalendarStep.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ArrowLeft } from "./Icons";
import { TIME_SLOTS, MONTHS, DAYS, C, btnPrimary, formatTimeAMPM, formatSlotRange } from "../../types/data";
import type { Service, CalendarData } from "../../types/types";
import AvailabilityService from "@/lib/api/availability.service";
import MentorService from "@/lib/api/mentorship.service";
import SeniorAvailabilityService from "@/lib/api/seniorAvailability.service";

interface CalendarStepProps {
    selectedService: Service | null;
    onBack: () => void;
    onContinue: (data: CalendarData) => void;
    mentorId: string;
    seniorBookedSlots?: { slotTime: string, dateStr: string }[];
    isSeniorService?: boolean;
}


interface BookableSlot {
    startTime: string;
    endTime: string;
    isBooked?: boolean;
    isBlocked?: boolean;
    status?: 'available' | 'booked' | 'blocked' | 'full' | 'joinable' | 'past';
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

// Continuous windows se service duration ke slots banao, aur booked/blocked ranges mark karo
const buildSlotsForDuration = (daySlots: any[], duration: number, seniorBookedSlots?: { slotTime: string, dateStr: string }[], currentSelectedDateStr?: string): BookableSlot[] => {
    if (!daySlots || daySlots.length === 0) return [];

    const sorted = [...daySlots].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));

    // Continuous availability windows across all slots for the day
    const windows: { start: number; end: number }[] = [];
    for (const s of sorted) {
        const start = toMinutes(s.startTime);
        const end = toMinutes(s.endTime);
        const last = windows[windows.length - 1];
        if (last && start <= last.end) {
            last.end = Math.max(last.end, end);
        } else {
            windows.push({ start, end });
        }
    }

    const busyRanges = daySlots
        .filter((s) => s.isBooked || s.isBlocked)
        .map((s) => ({
            start: toMinutes(s.startTime),
            end: toMinutes(s.endTime),
            isBooked: !!s.isBooked,
            isBlocked: !!s.isBlocked,
        }));

    if (seniorBookedSlots && currentSelectedDateStr) {
        seniorBookedSlots.forEach(bk => {
            if (bk.dateStr === currentSelectedDateStr && bk.slotTime) {
                const parts = bk.slotTime.split(" - ");
                if (parts.length === 2 && parts[0] && parts[1]) {
                    busyRanges.push({
                        start: toMinutes(parts[0].trim()),
                        end: toMinutes(parts[1].trim()),
                        isBooked: true,
                        isBlocked: false
                    });
                }
            }
        });
    }

    const effDuration = duration > 0 ? duration : 30;
    const result: BookableSlot[] = [];

    for (const w of windows) {
        for (let start = w.start; start + effDuration <= w.end; start += effDuration) {
            const end = start + effDuration;
            const startTimeStr = toTimeString(start);
            const endTimeStr = toTimeString(end);

            const busyMatch = busyRanges.find((b) => start < b.end && end > b.start);
            const isBooked = !!busyMatch?.isBooked;
            const isBlocked = !!busyMatch?.isBlocked;

            result.push({
                startTime: startTimeStr,
                endTime: endTimeStr,
                isBooked,
                isBlocked,
                status: isBlocked ? 'blocked' : isBooked ? 'booked' : 'available',
            });
        }
    }
    return result;
};

const CalendarStep: React.FC<CalendarStepProps> = ({ selectedService, onBack, onContinue, mentorId, seniorBookedSlots, isSeniorService }) => {
    const router = useRouter();
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [selectedDate, setSelectedDate] = useState<number | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    const [availability, setAvailability] = useState<any[]>([]);
    const [daySlots, setDaySlots] = useState<any[]>([]);
    const [noAvailability, setNoAvailability] = useState(false);
    const [selectedAvailabilityId, setSelectedAvailabilityId] = useState<string>("");
    const [selectedAvailabilityTz, setSelectedAvailabilityTz] = useState<string>("");
    const [groupSlots, setGroupSlots] = useState<any[]>([]);

    const year: number = currentMonth.getFullYear();
    const month: number = currentMonth.getMonth();
    const daysInMonth: number = new Date(year, month + 1, 0).getDate();
    const startingDay: number = new Date(year, month, 1).getDay();

    const today: Date = new Date();

    const isGroupTemplate = selectedService?.type === "GroupSession";
    const serviceDuration = getServiceDuration(selectedService);

    const allGeneratedSlots = useMemo(() => {
        if (isGroupTemplate) {
            return groupSlots.map((s: any) => ({
                startTime: s.startTime,
                endTime: s.endTime,
                isBooked: s.status === 'full' || s.spotsRemaining === 0,
                isBlocked: false,
                status: s.status || (s.spotsRemaining === 0 ? 'full' : 'available'),
            }));
        }

        const y2 = year;
        const m2 = String(month + 1).padStart(2, "0");
        const d2 = String(selectedDate || 0).padStart(2, "0");
        const curDateStr = `${y2}-${m2}-${d2}`;

        const base = buildSlotsForDuration(daySlots, serviceDuration, seniorBookedSlots, curDateStr);

        // Aaj ki date par jo slot start ho chuka hai, use "PAST" mark karo
        const now = new Date();
        const isToday =
            year === now.getFullYear() &&
            month === now.getMonth() &&
            selectedDate === now.getDate();
        if (!isToday) return base;

        const nowMins = now.getHours() * 60 + now.getMinutes();
        return base.map((s) =>
            !s.isBooked && !s.isBlocked && toMinutes(s.startTime) <= nowMins
                ? { ...s, status: 'past' as const }
                : s
        );
    }, [isGroupTemplate, groupSlots, daySlots, serviceDuration, seniorBookedSlots, selectedDate, year, month]);



    const availableSlotsCount = useMemo(() => {
        return allGeneratedSlots.filter((s) => !s.isBooked && !s.isBlocked && s.status !== 'full' && s.status !== 'past').length;
    }, [allGeneratedSlots]);

    const freeWindows = useMemo(() => {
        const free = daySlots
            .filter((s) => !s.isBooked && !s.isBlocked)
            .map((s) => ({ start: toMinutes(s.startTime), end: toMinutes(s.endTime) }))
            .sort((a, b) => a.start - b.start);

        const windows: { start: number; end: number }[] = [];
        for (const s of free) {
            const last = windows[windows.length - 1];
            if (last && s.start <= last.end) {
                last.end = Math.max(last.end, s.end);
            } else {
                windows.push({ ...s });
            }
        }
        return windows;
    }, [daySlots]);

    useEffect(() => {
        // Build a date range covering the entire currently displayed month
        // to match the same query used by the working Availability dashboard.
        if (!mentorId || isGroupTemplate) return;
        const y = currentMonth.getFullYear();
        const m = String(currentMonth.getMonth() + 1).padStart(2, "0");
        const lastDay = new Date(y, currentMonth.getMonth() + 1, 0).getDate();
        const startDate = `${y}-${m}-01`;
        const endDate = `${y}-${m}-${String(lastDay).padStart(2, "0")}`;

        if (isSeniorService) {
            const serviceDuration = getServiceDuration(selectedService);
            SeniorAvailabilityService.getMonthlyAvailability(mentorId, startDate, endDate, serviceDuration)
                .then((res: any) => {
                    // Response is directly the array of monthly slot objects
                    setAvailability(res || []);
                })
                .catch(() => setAvailability([]));
        } else {
            // Use getMentorAvailability: same endpoint the Availability dashboard uses.
            // This correctly scopes results to THIS mentor and THIS month.
            AvailabilityService.getMentorAvailability(mentorId, { startDate, endDate })
                .then((res: any) => {
                    // Response shape: { data: { availabilities: [...] } }
                    const avails = res?.data?.availabilities ?? [];
                    setAvailability(avails);
                })
                .catch(() => setAvailability([]));
        }
    }, [mentorId, currentMonth, isGroupTemplate, isSeniorService, selectedService]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    useEffect(() => {
        if (!isGroupTemplate || !mentorId || !selectedDate || !selectedService?.id) {
            setGroupSlots([]);
            return;
        }
        const y = year;
        const m = String(month + 1).padStart(2, "0");
        const d = String(selectedDate).padStart(2, "0");
        const dateStr = `${y}-${m}-${d}`;

        MentorService.getGroupTemplateAvailability(String(selectedService.id), dateStr)
            .then((res: any) => {
                const slots = res?.data ?? [];
                setGroupSlots(slots);
                setNoAvailability(slots.length === 0);
            })
            .catch(() => {
                setGroupSlots([]);
                setNoAvailability(true);
            });
    }, [isGroupTemplate, mentorId, selectedService?.id, selectedDate, year, month]);

    useEffect(() => {
        setSelectedTime(null);

        if (isGroupTemplate) return;
        if (!selectedDate) return;
        const selectedDateObj = new Date(year, month, selectedDate);
        const y2 = selectedDateObj.getFullYear();
        const m2 = String(selectedDateObj.getMonth() + 1).padStart(2, "0");
        const d2 = String(selectedDateObj.getDate()).padStart(2, "0");
        const dateStr = `${y2}-${m2}-${d2}`;

        const matched = availability.find((a: any) => {
            if (!a?.date) return false;
            const d = new Date(a.date);
            if (isNaN(d.getTime())) return false;

            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            const localDateStr = `${y}-${m}-${day}`;
            const utcDateStr = typeof a.date === "string" ? a.date.substring(0, 10) : d.toISOString().substring(0, 10);

            return localDateStr === dateStr || utcDateStr === dateStr;
        });

        if (matched) {
            setDaySlots(matched.slots);
            setSelectedAvailabilityId(matched.availabilityId);
            setSelectedAvailabilityTz(matched.timezone || "");
            setNoAvailability(false);
        } else {
            setDaySlots([]);
            setSelectedAvailabilityId("");
            setSelectedAvailabilityTz("");
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
        <div className="min-h-screen w-full px-3 py-4 sm:px-4 sm:py-8" style={{ background: C.bg }}>
            <div
                className="mx-auto w-full max-w-[960px] rounded-2xl p-4 sm:rounded-3xl sm:p-8 lg:p-10"
                style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 20px 60px rgba(74,55,40,0.15)" }}
            >
                <div className="mb-4">
                    <button
                        onClick={onBack}
                        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
                        style={{ background: "transparent", border: `1px solid ${C.border}`, cursor: "pointer", color: C.dark }}
                    >
                        <ArrowLeft /> Back
                    </button>
                </div>
                <h2 className="mb-1 text-xl font-bold sm:text-[22px]" style={{ color: C.dark }}>Select Date &amp; Time</h2>
                <p className="mb-5 break-words text-[13px] sm:mb-6" style={{ color: C.mid }}>
                    Booking: {selectedService?.title}{serviceDuration > 0 ? ` (${serviceDuration} min)` : ""}
                </p>

                {/* Mobile: stack, Desktop: 2 column */}
                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(280px,350px)_1fr] lg:gap-12">
                    {/* LEFT COLUMN - CALENDAR */}
                    <div className="w-full min-w-0 lg:max-w-[350px]">
                        {/* Month Nav */}
                        <div className="mb-4 flex items-center justify-between">
                            <button
                                className="text-[#4a3728]"
                                onClick={() => setCurrentMonth(new Date(year, month - 1))}
                                aria-label="Previous month"
                                style={{ padding: "8px", borderRadius: "8px", border: `1px solid ${C.border}`, background: C.bg, cursor: "pointer" }}
                            >
                                <ChevronLeft />
                            </button>
                            <span className="text-base font-bold" style={{ color: C.dark }}>{MONTHS[month]} {year}</span>
                            <button
                                className="text-[#4a3728]"
                                onClick={() => setCurrentMonth(new Date(year, month + 1))}
                                aria-label="Next month"
                                style={{ padding: "8px", borderRadius: "8px", border: `1px solid ${C.border}`, background: C.bg, cursor: "pointer" }}
                            >
                                <ChevronRight />
                            </button>
                        </div>

                        {/* Day Labels */}
                        <div className="mb-2 grid grid-cols-7 gap-1">
                            {DAYS.map((d) => (
                                <div key={d} className="py-1 text-center text-[11px] font-semibold sm:text-xs" style={{ color: C.mid }}>{d}</div>
                            ))}
                        </div>

                        {/* Day Cells */}
                        <div className="mb-6 grid grid-cols-7 gap-1 lg:mb-8">
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
                                        className="text-sm"
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
                    <div className="min-w-0">
                        <h3 className="mb-4 text-base font-bold sm:mb-5" style={{ color: C.dark }}>
                            Total Available Time Slots: {availableSlotsCount}
                        </h3>

                        {!selectedDate && (
                            <p className="rounded-lg p-4 text-center text-base font-bold text-[#4a3728] sm:text-lg" style={{ background: C.bg }}>
                                Please select a Date to see Available Slots
                            </p>
                        )}

                        {selectedDate && noAvailability && (
                            <p className="rounded-lg p-4 text-center text-base font-bold text-[#4a3728] sm:text-lg" style={{ background: C.bg }}>
                                No Availability Set for {MONTHS[month]} {selectedDate}, {year} by the Mentor.
                            </p>
                        )}
                        {selectedDate && !noAvailability && allGeneratedSlots.length === 0 && (
                            <p className="rounded-lg p-4 text-center text-base font-bold text-[#4a3728] sm:text-lg" style={{ background: C.bg }}>
                                No {serviceDuration > 0 ? `${serviceDuration}-minute ` : ""}slots configured for {MONTHS[month]} {selectedDate}, {year}.
                            </p>
                        )}
                        {selectedDate && !noAvailability && allGeneratedSlots.length > 0 && (
                            <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                {allGeneratedSlots.map((slot) => {
                                    const time = `${slot.startTime} - ${slot.endTime}`;
                                    const isDisabled = slot.isBooked || slot.isBlocked || slot.status === 'full' || slot.status === 'booked' || slot.status === 'past';
                                    const sel = selectedTime === time;

                                    return (
                                        <button
                                            key={time}
                                            disabled={isDisabled}
                                            title={isDisabled ? (slot.status === 'past' ? "Time Has Passed" : slot.isBlocked ? "Slot is Blocked" : "Slot is Already Booked") : ""}
                                            onClick={() => !isDisabled && setSelectedTime(time)}
                                            style={{
                                                padding: "10px 8px",
                                                minHeight: "44px",
                                                borderRadius: "8px",
                                                fontSize: "13px",
                                                fontWeight: 500,
                                                border: isDisabled ? `1px solid ${C.border}` : sel ? `1px solid ${C.mid}` : `1px solid ${C.muted}`,
                                                background: isDisabled
                                                    ? "#e2dbd4"
                                                    : sel
                                                        ? C.mid
                                                        : C.border,
                                                color: isDisabled
                                                    ? "#8c7a6b"
                                                    : sel
                                                        ? "#fff"
                                                        : C.dark,
                                                cursor: isDisabled ? "not-allowed" : "pointer",
                                                opacity: isDisabled ? 0.75 : 1,
                                                transition: "all 0.2s",
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "2px",
                                            }}
                                        >
                                            <span>{formatTimeAMPM(slot.startTime)}</span>
                                            {isDisabled && (
                                                <span style={{ fontSize: "10px", fontWeight: "bold", color: "#8c7a6b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                                    {slot.status === 'past' ? '• PAST' : (slot.isBlocked || slot.status === 'blocked') ? '• UNAVAILABLE' : '• BOOKED'}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {selectedDate && selectedTime && (
                            <button
                                onClick={() => onContinue({
                                    selectedDate,
                                    selectedTime,
                                    currentMonth,
                                    availabilityId: selectedAvailabilityId,
                                    slotTime: selectedTime,
                                    slotTimezone: selectedAvailabilityTz || undefined,
                                })}
                                style={{ ...btnPrimary, width: "100%", padding: "14px", borderRadius: "12px", fontSize: "15px" }}
                            >
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