"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Clock, Globe, Calendar, ChevronLeft, ChevronRight,
  Shield, Trash2, Plus, RefreshCw, Ban, CheckCircle2,
  AlertCircle, Check, UserCheck
} from "lucide-react";
import SeniorAvailabilityService, { SeniorAvailabilityConfig } from "@/lib/api/seniorAvailability.service";

interface SeniorMentorAvailabilityPageProps {
  mentorData?: any;
}

interface MonthlyDaySlot {
  startTime: string;
  endTime: string;
  status: "available" | "booked" | "blocked" | "past";
  isBooked: boolean;
  isBlocked: boolean;
}

interface MonthlyDayData {
  date: string;
  isDateBlocked: boolean;
  totalSlots: number;
  availableSlots: number;
  bookedSlots: number;
  blockedSlots: number;
  slots: MonthlyDaySlot[];
}

interface TimeRange {
  startTime: string;
  endTime: string;
}

interface DaySchedule {
  day: string;
  enabled: boolean;
  timeRanges: TimeRange[];
}

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DEFAULT_WEEK_SCHEDULE: DaySchedule[] = ALL_DAYS.map((day) => ({
  day,
  enabled: ["Saturday", "Sunday"].indexOf(day) === -1,
  timeRanges: [{ startTime: "09:00", endTime: "17:00" }],
}));

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const DAY_ABBREV = ["S", "M", "T", "W", "T", "F", "S"];

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

const toDateStr = (y: number, mIdx: number, d: number) =>
  `${y}-${String(mIdx + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

// ── 12-hour time picker (same as the mentor availability page) ─────────────
// Native <input type="time"> follows the OS locale; on a 24-hour system there
// is no AM/PM selector, so "1:10 PM" typed as "01:10" silently saved as AM.
// This picker has an explicit AM/PM toggle and always outputs 24h "HH:MM".
const to24Hour = (hour12: number, minute: number, period: "AM" | "PM"): string => {
  let h = hour12 % 12;
  if (period === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const from24Hour = (value: string): { hour12: number; minute: number; period: "AM" | "PM" } => {
  const [hStr, mStr] = (value || "00:00").split(":");
  const h24 = parseInt(hStr, 10) || 0;
  const minute = parseInt(mStr, 10) || 0;
  const period: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
  let hour12 = h24 % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, minute, period };
};

function TimeInput({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const { hour12, minute, period } = from24Hour(value);
  const [open, setOpen] = useState(false);
  const [hourListOpen, setHourListOpen] = useState(false);
  const [minuteListOpen, setMinuteListOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setHourListOpen(false);
      setMinuteListOpen(false);
      return;
    }
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const updateHour = (h: number) => onChange(to24Hour(h, minute, period));
  const updateMinute = (m: number) => onChange(to24Hour(hour12, m, period));
  const updatePeriod = (p: "AM" | "PM") => onChange(to24Hour(hour12, minute, p));

  const displayLabel = `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${period}`;

  return (
    <div className="relative inline-block" ref={wrapperRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg outline-none text-sm font-semibold"
        style={{
          border: "1px solid #e0d8cf",
          backgroundColor: disabled ? "#f5f1ec" : "#fff",
          color: "#4a3728",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {displayLabel}
        <Clock className="w-3.5 h-3.5" style={{ color: disabled ? "#c9beb2" : "#7a5c3e" }} />
      </button>

      {open && !disabled && (
        <div
          className="absolute right-0 z-50 mt-1 flex items-center gap-1.5 p-3 rounded-xl shadow-lg"
          style={{ backgroundColor: "#fff", border: "1px solid #e0d8cf", minWidth: "220px" }}
        >
          <div className="relative">
            <button
              type="button"
              onClick={() => { setHourListOpen((v) => !v); setMinuteListOpen(false); }}
              className="px-2 py-1.5 rounded-lg outline-none text-sm font-semibold w-12 text-center"
              style={{ border: "1px solid #e0d8cf", backgroundColor: "#fbf7f3", color: "#4a3728" }}
            >
              {String(hour12).padStart(2, "0")}
            </button>
            {hourListOpen && (
              <div
                className="absolute z-50 mt-1 rounded-lg shadow-lg overflow-y-auto"
                style={{ border: "1px solid #e0d8cf", backgroundColor: "#fff", maxHeight: "160px", width: "56px" }}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => { updateHour(h); setHourListOpen(false); }}
                    className="block w-full text-center px-2 py-1.5 text-sm font-semibold"
                    style={{
                      backgroundColor: h === hour12 ? "#4a3728" : "transparent",
                      color: h === hour12 ? "#fff" : "#4a3728",
                    }}
                  >
                    {String(h).padStart(2, "0")}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="text-sm font-bold" style={{ color: "#8a7a6a" }}>:</span>

          <div className="relative">
            <button
              type="button"
              onClick={() => { setMinuteListOpen((v) => !v); setHourListOpen(false); }}
              className="px-2 py-1.5 rounded-lg outline-none text-sm font-semibold w-12 text-center"
              style={{ border: "1px solid #e0d8cf", backgroundColor: "#fbf7f3", color: "#4a3728" }}
            >
              {String(minute).padStart(2, "0")}
            </button>
            {minuteListOpen && (
              <div
                className="absolute z-50 mt-1 rounded-lg shadow-lg overflow-y-auto"
                style={{ border: "1px solid #e0d8cf", backgroundColor: "#fff", maxHeight: "160px", width: "56px" }}
              >
                {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { updateMinute(m); setMinuteListOpen(false); }}
                    className="block w-full text-center px-2 py-1.5 text-sm font-semibold"
                    style={{
                      backgroundColor: m === minute ? "#4a3728" : "transparent",
                      color: m === minute ? "#fff" : "#4a3728",
                    }}
                  >
                    {String(m).padStart(2, "0")}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid #e0d8cf" }}>
            {(["AM", "PM"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => updatePeriod(p)}
                className="px-2.5 py-1.5 text-xs font-bold transition-colors"
                style={{
                  backgroundColor: period === p ? "#4a3728" : "#fbf7f3",
                  color: period === p ? "#fff" : "#7a5c3e",
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SeniorMentorAvailabilityPage({ mentorData }: SeniorMentorAvailabilityPageProps) {
  // ── State: Config & Rules ─────────────────────────
  const [config, setConfig] = useState<SeniorAvailabilityConfig | null>(null);
  const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>(DEFAULT_WEEK_SCHEDULE);
  const [slotInterval, setSlotInterval] = useState(30);
  const [breakDuration, setBreakDuration] = useState(0);
  const [timezone, setTimezone] = useState(
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata"
      : "Asia/Kolkata"
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ── State: Block Date form ────────────────────────
  const [showBlockDateInput, setShowBlockDateInput] = useState(false);
  const [newBlockDate, setNewBlockDate] = useState("");
  const [newBlockStart, setNewBlockStart] = useState("09:00");
  const [newBlockEnd, setNewBlockEnd] = useState("17:00");
  const [newBlockReason, setNewBlockReason] = useState("");

  // ── State: Monthly Calendar & Slots ───────────────
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => new Date());
  const [monthlyData, setMonthlyData] = useState<MonthlyDayData[]>([]);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState<string>("");

  const effectiveMentorId = useMemo(() => {
    return mentorData?.userId || mentorData?.id || (config as any)?.mentorId || "";
  }, [mentorData, config]);

  // ── Fetch Config ──────────────────────────────────
  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const dbConfig = await SeniorAvailabilityService.getConfig();
      if (dbConfig) {
        setConfig(dbConfig);
        setTimezone((prev) => dbConfig.timezone || prev);
        setSlotInterval(dbConfig.slotInterval || 30);
        setBreakDuration(dbConfig.breakDuration || 0);

        if (dbConfig.weeklySchedule && dbConfig.weeklySchedule.length > 0) {
          const merged: DaySchedule[] = ALL_DAYS.map((day) => {
            const found = dbConfig.weeklySchedule.find((d) => d.day === day);
            const ranges = found?.timeRanges?.length
              ? found.timeRanges.map((r) => ({ startTime: r.startTime, endTime: r.endTime }))
              : [{ startTime: "09:00", endTime: "17:00" }];
            return { day, enabled: !!found?.enabled, timeRanges: ranges };
          });
          setWeekSchedule(merged);
        }
      }
    } catch (err: any) {
      console.error("Fetch availability config failed:", err?.message || err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // ── Fetch Monthly Availability ────────────────────
  const fetchMonthlySlots = useCallback(async () => {
    if (!effectiveMentorId) return;
    setIsCalendarLoading(true);
    try {
      const y = currentMonthDate.getFullYear();
      const mIdx = currentMonthDate.getMonth();
      const lastDay = new Date(y, mIdx + 1, 0).getDate();

      const data = await SeniorAvailabilityService.getMonthlyAvailability(
        effectiveMentorId,
        toDateStr(y, mIdx, 1),
        toDateStr(y, mIdx, lastDay),
        slotInterval || 60
      );
      setMonthlyData(Array.isArray(data) ? (data as MonthlyDayData[]) : []);
    } catch (err: any) {
      console.error("Failed to fetch monthly availability:", err?.message || err);
      setMonthlyData([]);
    } finally {
      setIsCalendarLoading(false);
    }
  }, [effectiveMentorId, currentMonthDate, slotInterval]);

  useEffect(() => {
    fetchMonthlySlots();
  }, [fetchMonthlySlots]);

  useEffect(() => {
    if (!saveMessage) return;
    const t = setTimeout(() => setSaveMessage(null), 5000);
    return () => clearTimeout(t);
  }, [saveMessage]);

  // ── Weekly schedule editing (all immutable) ───────
  const handleToggleDay = (dayIndex: number) => {
    setWeekSchedule((prev) =>
      prev.map((d, i) => (i === dayIndex ? { ...d, enabled: !d.enabled } : d))
    );
  };

  const handleTimeChange = (
    dayIndex: number,
    rangeIndex: number,
    field: "startTime" | "endTime",
    value: string
  ) => {
    setWeekSchedule((prev) =>
      prev.map((d, i) =>
        i !== dayIndex
          ? d
          : {
              ...d,
              timeRanges: d.timeRanges.map((r, ri) => (ri === rangeIndex ? { ...r, [field]: value } : r)),
            }
      )
    );
  };

  // + button: add another time range for this day (e.g. morning + evening)
  const handleAddRange = (dayIndex: number) => {
    setWeekSchedule((prev) =>
      prev.map((d, i) => {
        if (i !== dayIndex) return d;
        const last = d.timeRanges[d.timeRanges.length - 1];
        const start = last?.endTime || "09:00";
        // New range starts where the previous one ended and runs one slot long,
        // capped at 23:59 (overnight ranges are not supported).
        const endMinutes = Math.min(toMin(start) + (slotInterval || 60), 23 * 60 + 59);
        const end = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
        return { ...d, timeRanges: [...d.timeRanges, { startTime: start, endTime: end }] };
      })
    );
  };

  // trash button: remove an extra range (the first range always stays)
  const handleRemoveRange = (dayIndex: number, rangeIndex: number) => {
    setWeekSchedule((prev) =>
      prev.map((d, i) =>
        i !== dayIndex || d.timeRanges.length <= 1
          ? d
          : { ...d, timeRanges: d.timeRanges.filter((_, ri) => ri !== rangeIndex) }
      )
    );
  };

  // Deep copy so days never share the same timeRanges array reference
  const copyMondayToAll = () => {
    const mon = weekSchedule.find((d) => d.day === "Monday");
    if (!mon) return;
    setWeekSchedule((prev) =>
      prev.map((d) => ({ ...d, timeRanges: mon.timeRanges.map((r) => ({ ...r })) }))
    );
  };

  // ── Save Config ───────────────────────────────────
  const handleSaveConfig = async () => {
    // Validate before sending: end must be after start, ranges must not overlap
    for (const d of weekSchedule) {
      if (!d.enabled) continue;
      for (const r of d.timeRanges) {
        if (toMin(r.endTime) <= toMin(r.startTime)) {
          setSaveMessage({
            type: "error",
            text: `${d.day}: end time must be after start time (${r.startTime} - ${r.endTime}).`,
          });
          return;
        }
      }
      const sorted = [...d.timeRanges].sort((a, b) => toMin(a.startTime) - toMin(b.startTime));
      for (let i = 1; i < sorted.length; i++) {
        if (toMin(sorted[i].startTime) < toMin(sorted[i - 1].endTime)) {
          setSaveMessage({
            type: "error",
            text: `${d.day}: time ranges overlap (${sorted[i - 1].startTime}-${sorted[i - 1].endTime} and ${sorted[i].startTime}-${sorted[i].endTime}).`,
          });
          return;
        }
      }
    }

    setIsSaving(true);
    setSaveMessage(null);
    try {
      await SeniorAvailabilityService.updateConfig({
        timezone,
        slotInterval,
        breakDuration,
        weeklySchedule: weekSchedule,
      });
      setSaveMessage({ type: "success", text: "Availability saved successfully." });
      await fetchConfig();
      await fetchMonthlySlots();
    } catch (error: any) {
      setSaveMessage({ type: "error", text: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Block Dates Logics ────────────────────────────
  const handleAddBlockedDate = async () => {
    if (!newBlockDate) {
      setSaveMessage({ type: "error", text: "Please select a date." });
      return;
    }
    try {
      // Full-day block (no custom time / reason)
      await SeniorAvailabilityService.addBlockedTime(newBlockDate, "00:00", "23:59");
      setSaveMessage({ type: "success", text: `Blocked time added for ${newBlockDate}` });
      setNewBlockDate("");
      setNewBlockReason("");
      setShowBlockDateInput(false);
      await fetchConfig();
      await fetchMonthlySlots();
    } catch (error: any) {
      setSaveMessage({ type: "error", text: error.message });
    }
  };

  const handleQuickBlockSlot = async (dateStr: string, slotStart: string, slotEnd: string) => {
    try {
      await SeniorAvailabilityService.addBlockedTime(dateStr, slotStart, slotEnd, "Blocked via Calendar");
      setSaveMessage({ type: "success", text: `Blocked slot ${slotStart} - ${slotEnd} on ${dateStr}` });
      await fetchConfig();
      await fetchMonthlySlots();
    } catch (error: any) {
      setSaveMessage({ type: "error", text: error.message });
    }
  };

  const handleRemoveBlockedDate = async (id: string) => {
    try {
      await SeniorAvailabilityService.removeBlockedTime(id);
      setSaveMessage({ type: "success", text: "Blocked time removed." });
      await fetchConfig();
      await fetchMonthlySlots();
    } catch (error: any) {
      setSaveMessage({ type: "error", text: error.message });
    }
  };

  // ── Calendar Helpers ──────────────────────────────
  const year = currentMonthDate.getFullYear();
  const monthIndex = currentMonthDate.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDayWeekday = new Date(year, monthIndex, 1).getDay();
  const today = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const handlePrevMonth = () => setCurrentMonthDate(new Date(year, monthIndex - 1, 1));
  const handleNextMonth = () => setCurrentMonthDate(new Date(year, monthIndex + 1, 1));

  const monthlyByDate = useMemo(() => {
    const map = new Map<string, MonthlyDayData>();
    monthlyData.forEach((d) => map.set(d.date, d));
    return map;
  }, [monthlyData]);

  const selectedDayData = useMemo(() => {
    return selectedDateStr ? monthlyByDate.get(selectedDateStr) || null : null;
  }, [monthlyByDate, selectedDateStr]);

  // Weekday of the selected calendar date, used to highlight its row in Weekly Schedule
  const selectedDayName = useMemo(() => {
    if (!selectedDateStr) return null;
    const [y, m, d] = selectedDateStr.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long" });
  }, [selectedDateStr]);

  const monthlyOverviewStats = useMemo(() => {
    let totalAvail = 0;
    let totalBooked = 0;
    let totalBlocked = 0;
    for (const d of monthlyData) {
      totalAvail += d.availableSlots || 0;
      totalBooked += d.bookedSlots || 0;
      totalBlocked += d.blockedSlots || 0;
    }
    return { totalAvail, totalBooked, totalBlocked };
  }, [monthlyData]);

  const statCards = [
    { label: "Available Slots", value: monthlyOverviewStats.totalAvail, icon: CheckCircle2, color: "#15803d", bg: "#dcfce7" },
    { label: "Booked Sessions", value: monthlyOverviewStats.totalBooked, icon: UserCheck, color: "#1d4ed8", bg: "#dbeafe" },
    { label: "Blocked Slots", value: monthlyOverviewStats.totalBlocked, icon: Ban, color: "#dc2626", bg: "#fee2e2" },
  ];

  // ── Render ────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fadeIn pb-24">
      {saveMessage && (
        <div
          className="fixed top-5 right-5 z-[500] px-5 py-3.5 rounded-xl text-sm font-semibold shadow-lg max-w-sm flex items-center gap-2"
          style={{
            backgroundColor: saveMessage.type === "success" ? "#dcfce7" : "#fee2e2",
            color: saveMessage.type === "success" ? "#15803d" : "#dc2626",
            border: `1px solid ${saveMessage.type === "success" ? "#86efac" : "#fca5a5"}`,
          }}
        >
          {saveMessage.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {saveMessage.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#4a3728" }}>
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: "#4a3728" }}>Availability</h2>
            <p style={{ color: "#8a7a6a" }} className="text-sm">Set your available hours</p>
          </div>
        </div>
        <button
          onClick={() => { fetchConfig(); fetchMonthlySlots(); }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors hover:bg-[#f3ece4]"
          style={{ backgroundColor: "#fbf7f3", color: "#7a5c3e", border: "1px solid #e0d8cf" }}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading || isCalendarLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white p-5 rounded-2xl" style={{ border: "1px solid #e0d8cf" }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: card.bg }}>
                <Icon className="w-4 h-4" style={{ color: card.color }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: card.color }}>
                {isCalendarLoading ? "—" : card.value}
              </p>
              <p className="text-xs font-medium mt-0.5" style={{ color: "#8a7a6a" }}>{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:items-stretch">
        {/* ── Left Section ──────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col">
          {/* Weekly Schedule */}
          <div className="bg-white p-6 rounded-2xl flex-1" style={{ border: "1px solid #e0d8cf" }}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h3 className="text-base font-bold" style={{ color: "#4a3728" }}>Weekly Schedule</h3>

              <div className="flex items-center gap-3">
                {/* Mini week strip: click to toggle a day on/off; ring marks the weekday of the selected date */}
                <div className="flex items-center gap-1.5">
                  {weekSchedule.map((d, idx) => {
                    const isSelectedDay = selectedDayName === d.day;
                    const first = d.timeRanges[0];
                    return (
                      <button
                        key={d.day}
                        type="button"
                        title={`${d.day}${
                          d.enabled
                            ? ` · ${first?.startTime}–${first?.endTime}${d.timeRanges.length > 1 ? ` +${d.timeRanges.length - 1} more` : ""}`
                            : " · Off"
                        }`}
                        onClick={() => handleToggleDay(idx)}
                        className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold transition-all"
                        style={{
                          backgroundColor: d.enabled ? "#4a3728" : "#f3ece4",
                          color: d.enabled ? "#fff" : "#a08070",
                          boxShadow: isSelectedDay ? "0 0 0 2px #4a3728, 0 0 0 4px rgba(74,55,40,0.3)" : "none",
                        }}
                      >
                        {d.day[0]}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleSaveConfig}
                  disabled={isSaving || !selectedDateStr}
                  title={!selectedDateStr ? "Select a date on the calendar first" : "Save changes"}
                  className="px-3.5 py-1.5 rounded-lg text-white text-xs font-bold flex items-center gap-1.5 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90"
                  style={{ backgroundColor: "#4a3728" }}
                >
                  <Check className="w-3.5 h-3.5" />
                  {isSaving
  ? "Saving..."
  : selectedDateStr
  ? `Save ${Number(selectedDateStr.split("-")[2])} ${MONTH_NAMES[Number(selectedDateStr.split("-")[1]) - 1].slice(0, 3)}`
  : "Save Changes"}
                </button>
              </div>
            </div>

          
            

            <div className="space-y-2.5">

              {weekSchedule.map((item, idx) => {
                const isSelectedDay = selectedDayName === item.day;
                return (
                  <div
                    key={item.day}
                    className="p-4 rounded-xl transition-all"
                    style={{
                      border: isSelectedDay ? "2px solid #4a3728" : "1px solid #e0d8cf",
                      backgroundColor: isSelectedDay ? "#f3ece4" : item.enabled ? "#fbf7f3" : "#fafafa",
                      boxShadow: isSelectedDay ? "0 0 0 3px rgba(74,55,40,0.12)" : "none",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold w-24" style={{ color: "#4a3728" }}>{item.day}</span>
                      <span
                        className="text-[11px] font-semibold"
                        style={{ color: item.enabled ? "#15803d" : "#a08070" }}
                      >
                        {item.enabled ? "Available" : "Not available"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 mt-3">
                      {item.timeRanges.map((range, rIdx) => (
                        <div key={rIdx} className="flex items-center gap-2 justify-end">
                          <TimeInput
                            value={range.startTime}
                            disabled={!item.enabled}
                            onChange={(v) => handleTimeChange(idx, rIdx, "startTime", v)}
                          />
                          <span style={{ color: "#8a7a6a" }} className="text-xs font-semibold">to</span>
                          <TimeInput
                            value={range.endTime}
                            disabled={!item.enabled}
                            onChange={(v) => handleTimeChange(idx, rIdx, "endTime", v)}
                          />

                          {/* Action cell: "+" on the first row, trash on the others */}
                          {rIdx === 0 ? (
                            <button
                              type="button"
                              disabled={!item.enabled}
                              onClick={() => handleAddRange(idx)}
                              className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 hover:bg-[#f3ece4] disabled:opacity-40 transition-colors"
                              style={{ border: "1px solid #e0d8cf" }}
                              title="Add another time range for this day"
                            >
                              <Plus className="w-3.5 h-3.5" style={{ color: "#7a5c3e" }} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={!item.enabled}
                              onClick={() => handleRemoveRange(idx, rIdx)}
                              className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 hover:bg-[#fee2e2] disabled:opacity-40 transition-colors"
                              title="Delete this time range"
                            >
                              <Trash2 className="w-3.5 h-3.5" style={{ color: "#dc2626" }} />
                            </button>
                          )}

                          {/* Toggle cell: ON/OFF switch on the first row, spacer on the others */}
                          {rIdx === 0 ? (
                            <button
                              type="button"
                              role="switch"
                              aria-checked={item.enabled}
                              title={item.enabled ? "Available — click to turn off" : "Not available — click to turn on"}
                              onClick={() => handleToggleDay(idx)}
                              style={{
                                position: "relative",
                                width: 40,
                                height: 22,
                                borderRadius: 9999,
                                border: "none",
                                padding: 0,
                                flexShrink: 0,
                                cursor: "pointer",
                                backgroundColor: item.enabled ? "#4a3728" : "#d8cec4",
                                transition: "background-color 0.2s",
                              }}
                            >
                              <span
                                style={{
                                  position: "absolute",
                                  top: 2,
                                  left: item.enabled ? 20 : 2,
                                  width: 18,
                                  height: 18,
                                  borderRadius: "50%",
                                  backgroundColor: "#fff",
                                  boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
                                  transition: "left 0.2s",
                                }}
                              />
                            </button>
                          ) : (
                            <div style={{ width: 40, flexShrink: 0 }} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          

         
        </div>

        {/* ── Right Section ──────────────────────────────── */}
        <div className="lg:col-span-1 flex flex-col gap-5">
        {/* Calendar */}
          <div className="bg-white p-5 rounded-2xl" style={{ border: "1px solid #e0d8cf" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold flex items-center gap-2" style={{ color: "#4a3728" }}>
                <Calendar className="w-4 h-4" />
                {MONTH_NAMES[monthIndex]} {year}
              </h3>
              <div className="flex gap-1.5">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg transition-colors hover:bg-[#fbf7f3]"
                  style={{ border: "1px solid #e0d8cf" }}
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" style={{ color: "#4a3728" }} />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg transition-colors hover:bg-[#fbf7f3]"
                  style={{ border: "1px solid #e0d8cf" }}
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" style={{ color: "#4a3728" }} />
                </button>
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1.5">
              {DAY_ABBREV.map((d, i) => (
                <div key={i} className="text-center text-[11px] font-bold py-1" style={{ color: "#a08070" }}>{d}</div>
              ))}
            </div>

            {/* Date grid — shows the number of slots under each date */}
            <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayWeekday }, (_, i) => <div key={`e-${i}`} className="h-9" />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const date = i + 1;
                const dateStr = toDateStr(year, monthIndex, date);
                const dayData = monthlyByDate.get(dateStr);
                const slotCount = dayData?.totalSlots ?? 0;
                const blocked =
                !!dayData && dayData.totalSlots > 0 && dayData.blockedSlots === dayData.totalSlots;
                const isToday = dateStr === todayStr;
                const isSel = selectedDateStr === dateStr;
                return (
                  <button
                    type="button"
                    key={dateStr}
                    onClick={() => setSelectedDateStr(dateStr === selectedDateStr ? "" : dateStr)}
                    className="h-9 flex flex-col items-center justify-center rounded-lg cursor-pointer transition-colors relative"
                    style={{
                      backgroundColor: blocked ? "#fee2e2" : isSel ? "#4a3728" : isToday ? "#f3ece4" : "#fff",
                      border: !isSel ? `1px solid ${blocked ? "#fca5a5" : isToday ? "#c9a87c" : "#e0d8cf"}` : "none",
                    }}
                  >
                    <span
                      className="text-xs font-semibold"
                      style={{ color: blocked ? "#dc2626" : isSel ? "#fff" : "#4a3728" }}
                    >
                      {date}
                    </span>
                    {slotCount > 0 && !blocked && (
                      <span
                        className="text-[9px] font-bold leading-none mt-0.5"
                        style={{ color: isSel ? "rgba(255,255,255,0.8)" : "#1d4ed8" }}
                      >
                        {slotCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-3 grid grid-cols-2 gap-2" style={{ borderTop: "1px solid #f0ebe4" }}>
              {[
                { color: "#f3ece4", border: "#c9a87c", label: "Today" },
                { color: "#4a3728", label: "Selected" },
                { color: "#fff", border: "#e0d8cf", label: "Number = slots" },
                { color: "#fee2e2", border: "#fca5a5", label: "Blocked" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-3 h-3 rounded flex-shrink-0"
                    style={{ backgroundColor: item.color, border: item.border ? `1px solid ${item.border}` : "none" }}
                  />
                  <span style={{ color: "#8a7a6a" }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Selected date slots */}
          <div className="bg-white p-5 rounded-2xl" style={{ border: "1px solid #e0d8cf" }}>
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-bold flex items-center gap-2" style={{ color: "#4a3728" }}>
              <Clock className="w-4 h-4" style={{ color: "#7a5c3e" }} /> {selectedDateStr || "Select a date"}
              </h4>
              <button
                type="button"
                disabled={!selectedDateStr}
                onClick={() => {
                  setNewBlockDate(selectedDateStr);
                  setNewBlockStart("00:00");
                  setNewBlockEnd("23:59");
                  setShowBlockDateInput(true);
                }}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}
              >
                + Block Day
              </button>
            </div>
            <p className="text-xs mt-1 mb-3" style={{ color: "#8a7a6a" }}>
              {selectedDayData ? (
                <>
                  <span className="font-bold text-emerald-700">{selectedDayData.availableSlots} Available</span> •{" "}
                  <span className="font-bold text-blue-700">{selectedDayData.bookedSlots} Booked</span> •{" "}
                  <span className="font-bold text-rose-700">{selectedDayData.blockedSlots} Blocked</span>
                </>
              ) : (
                                selectedDateStr ? "No schedule configured for this day" : "Pick a date from the calendar to see its slots"
              )}
            </p>

            <div className="max-h-[170px] overflow-y-auto pr-1 space-y-2">
              {selectedDayData && selectedDayData.slots.length > 0 ? (
                selectedDayData.slots.map((slot, sIdx) => {
                  const isAvail = slot.status === "available";
                  const isBk = slot.status === "booked";
                  const isBlk = slot.status === "blocked";
                  return (
                    <div
                      key={`${slot.startTime}-${sIdx}`}
                      className="p-2.5 rounded-lg flex items-center justify-between"
                      style={{
                        backgroundColor: isAvail ? "#f0fdf4" : isBk ? "#eff6ff" : isBlk ? "#fff1f2" : "#f8fafc",
                        border: `1px solid ${isAvail ? "#dcfce7" : isBk ? "#dbeafe" : isBlk ? "#ffe4e6" : "#e2e8f0"}`,
                      }}
                    >
                      <div>
                        <p className="text-xs font-extrabold" style={{ color: "#4a3728" }}>
                          {slot.startTime} – {slot.endTime}
                        </p>
                        <p
                          className="text-[10px] font-bold uppercase tracking-wider mt-0.5"
                          style={{ color: isAvail ? "#15803d" : isBk ? "#1d4ed8" : isBlk ? "#dc2626" : "#64748b" }}
                        >
                          {isAvail ? "Available" : isBk ? "Session Booked" : isBlk ? "Blocked" : "Past"}
                        </p>
                      </div>
                      {isAvail && (
                        <button
                          type="button"
                          onClick={() => handleQuickBlockSlot(selectedDateStr, slot.startTime, slot.endTime)}
                          className="text-[11px] font-bold px-2 py-1 rounded-lg hover:bg-rose-600 hover:text-white transition"
                          style={{ color: "#dc2626", border: "1px solid #fecaca" }}
                          title="Block this individual slot"
                        >
                          Block
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-center py-5" style={{ color: "#8a7a6a" }}>No slots on this date.</p>
              )}
            </div>
          </div>

                   {/* Blocked Dates */}
                   <div className="bg-white p-5 rounded-2xl flex-1" style={{ border: "1px solid #e0d8cf" }}>
            <h4 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "#4a3728" }}>
              <Ban className="w-4 h-4" style={{ color: "#7a5c3e" }} /> Blocked Dates
            </h4>

            <div className="space-y-2 mb-3">
              {config?.blockedTimes && config.blockedTimes.length > 0 ? (
                config.blockedTimes.map((block, bIdx) => (
                  <div
                    key={block._id || `${block.date}-${block.startTime}-${bIdx}`}
                    className="p-2.5 rounded-lg flex items-center justify-between text-sm"
                    style={{ backgroundColor: "#fbf7f3", border: "1px solid #e0d8cf" }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold" style={{ color: "#4a3728" }}>{block.date}</p>
                      <p className="text-xs" style={{ color: "#8a7a6a" }}>
                      {block.startTime === "00:00" && block.endTime === "23:59"
                          ? "Full day"
                          : `${block.startTime} - ${block.endTime}`}
                        {block.reason ? ` · ${block.reason}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => block._id && handleRemoveBlockedDate(block._id)}
                      title="Unblock"
                      className="p-1.5 rounded-lg hover:bg-red-50 flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" style={{ color: "#dc2626" }} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-center py-3" style={{ color: "#8a7a6a" }}>No blocked dates yet.</p>
              )}
            </div>

            {!showBlockDateInput ? (
              <button
                type="button"
                onClick={() => {
                  setNewBlockDate(selectedDateStr);
                  setNewBlockStart("09:00");
                  setNewBlockEnd("17:00");
                  setShowBlockDateInput(true);
                }}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#4a3728" }}
              >
                <Plus className="w-4 h-4" /> Add Blocked Date
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <input
                  type="date"
                  value={newBlockDate}
                  onChange={(e) => setNewBlockDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg outline-none text-sm font-semibold"
                  style={{ border: "1px solid #e0d8cf", backgroundColor: "#fbf7f3", color: "#4a3728" }}
                />
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddBlockedDate}
                    disabled={!newBlockDate}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                    style={{ backgroundColor: "#4a3728" }}
                  >
                    Confirm Block
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowBlockDateInput(false); setNewBlockDate(""); setNewBlockReason(""); }}
                    className="px-3.5 py-2 rounded-lg text-sm font-semibold"
                    style={{ backgroundColor: "#fbf7f3", color: "#7a5c3e", border: "1px solid #e0d8cf" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}