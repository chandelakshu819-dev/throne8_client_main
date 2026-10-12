"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Clock, Globe, Calendar, ChevronLeft, ChevronRight,
  Shield, Trash2, Plus, X, RefreshCw, Ban, CheckCircle2,
  AlertCircle, Check, CalendarDays, Settings2, UserCheck
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

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DEFAULT_WEEK_SCHEDULE = ALL_DAYS.map((day) => ({
  day,
  enabled: ["Saturday", "Sunday"].indexOf(day) === -1,
  timeRanges: [{ startTime: "09:00", endTime: "17:00" }],
}));

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const WEEKDAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function SeniorMentorAvailabilityPage({ mentorData }: SeniorMentorAvailabilityPageProps) {
  // ── Top View Mode ─────────────────────────────────
  const [activeTab, setActiveTab] = useState<"calendar" | "settings">("calendar");

  // ── State: Config & Rules ─────────────────────────
  const [config, setConfig] = useState<SeniorAvailabilityConfig | null>(null);
  const [weekSchedule, setWeekSchedule] = useState(DEFAULT_WEEK_SCHEDULE);
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

  // ── State: Date Override / Block Modal ────────────
  const [showBlockDateInput, setShowBlockDateInput] = useState(false);
  const [newBlockDate, setNewBlockDate] = useState("");
  const [newBlockStart, setNewBlockStart] = useState("09:00");
  const [newBlockEnd, setNewBlockEnd] = useState("17:00");
  const [newBlockReason, setNewBlockReason] = useState("");

  // ── State: Monthly Calendar & Slots ───────────────
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => new Date());
  const [monthlyData, setMonthlyData] = useState<MonthlyDayData[]>([]);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });

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
        setTimezone(dbConfig.timezone || timezone);
        setSlotInterval(dbConfig.slotInterval || 30);
        setBreakDuration(dbConfig.breakDuration || 0);

        if (dbConfig.weeklySchedule && dbConfig.weeklySchedule.length > 0) {
          const merged = ALL_DAYS.map((day) => {
            const found = dbConfig.weeklySchedule.find((d) => d.day === day);
            return found || { day, enabled: false, timeRanges: [{ startTime: "09:00", endTime: "17:00" }] };
          });
          setWeekSchedule(merged);
        }
      }
    } catch (err: any) {
      console.error("Fetch availability config failed:", err?.message || err);
    } finally {
      setIsLoading(false);
    }
  }, [timezone]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // ── Fetch Monthly Availability ────────────────────
  const fetchMonthlySlots = useCallback(async () => {
    if (!effectiveMentorId) return;
    setIsCalendarLoading(true);
    try {
      const y = currentMonthDate.getFullYear();
      const m = String(currentMonthDate.getMonth() + 1).padStart(2, "0");
      const lastDay = new Date(y, currentMonthDate.getMonth() + 1, 0).getDate();
      const startDate = `${y}-${m}-01`;
      const endDate = `${y}-${m}-${String(lastDay).padStart(2, "0")}`;

      const data = await SeniorAvailabilityService.getMonthlyAvailability(
        effectiveMentorId,
        startDate,
        endDate,
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

  // ── Save Config ───────────────────────────────────
  const handleSaveConfig = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      await SeniorAvailabilityService.updateConfig({
        timezone,
        slotInterval,
        breakDuration,
        weeklySchedule: weekSchedule,
      });
      setSaveMessage({ type: "success", text: "Availability configuration saved successfully." });
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
      await SeniorAvailabilityService.addBlockedTime(newBlockDate, newBlockStart, newBlockEnd, newBlockReason);
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
      await SeniorAvailabilityService.addBlockedTime(dateStr, slotStart, slotEnd, "Blocked via Calendar Inspector");
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

  const copyMondayToAll = () => {
    const mon = weekSchedule.find((d) => d.day === "Monday");
    if (!mon) return;
    setWeekSchedule((prev) => prev.map((d) => ({ ...d, timeRanges: mon.timeRanges })));
  };

  // ── Schedule Edit Helper ──────────────────────────
  const handleTimeChange = (
    dayIndex: number,
    rangeIndex: number,
    field: "startTime" | "endTime",
    value: string
  ) => {
    const newSchedule = [...weekSchedule];
    newSchedule[dayIndex].timeRanges[rangeIndex][field] = value;
    setWeekSchedule(newSchedule);
  };

  const handleToggleDay = (dayIndex: number) => {
    const newSchedule = [...weekSchedule];
    newSchedule[dayIndex].enabled = !newSchedule[dayIndex].enabled;
    setWeekSchedule(newSchedule);
  };

  // ── Calendar Helpers ──────────────────────────────
  const year = currentMonthDate.getFullYear();
  const monthIndex = currentMonthDate.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDayWeekday = new Date(year, monthIndex, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, monthIndex - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, monthIndex + 1, 1));
  };

  const selectedDayData = useMemo(() => {
    if (!selectedDateStr) return null;
    return monthlyData.find((d) => d.date === selectedDateStr) || null;
  }, [monthlyData, selectedDateStr]);

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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#4a3728] shadow-md shadow-amber-950/10">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#4a3728]">Senior Mentor Availability</h2>
            <p className="text-slate-500 text-sm font-medium">
              Real-time slot schedule, booking visibility &amp; dynamic hours engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle Buttons */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button
              onClick={() => setActiveTab("calendar")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "calendar"
                  ? "bg-[#4a3728] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" /> Calendar &amp; Slots
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "settings"
                  ? "bg-[#4a3728] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" /> Working Hours &amp; Rules
            </button>
          </div>

          <button
            onClick={() => {
              fetchConfig();
              fetchMonthlySlots();
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors hover:bg-slate-100 border border-slate-200 text-slate-700 bg-white shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading || isCalendarLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          TAB 1: MONTHLY CALENDAR & SLOT INSPECTOR
          ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "calendar" && (
        <div className="space-y-6">
          {/* Monthly Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Slots</p>
                <p className="text-xl font-black text-slate-800">{monthlyOverviewStats.totalAvail}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Booked Sessions</p>
                <p className="text-xl font-black text-slate-800">{monthlyOverviewStats.totalBooked}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Blocked Slots</p>
                <p className="text-xl font-black text-slate-800">{monthlyOverviewStats.totalBlocked}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Calendar Grid (8 cols on lg) */}
            <div className="lg:col-span-7 xl:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-800">
                    {MONTH_NAMES[monthIndex]} {year}
                  </h3>
                  <p className="text-xs font-medium text-slate-400">
                    Click any date to view individual slots and booking statuses
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevMonth}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
                    title="Previous Month"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-700" />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
                    title="Next Month"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-700" />
                  </button>
                </div>
              </div>

              {/* Day of Week Header */}
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {WEEKDAY_HEADERS.map((h) => (
                  <div key={h} className="text-xs font-bold text-slate-400 py-1 uppercase tracking-wider">
                    {h}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Blank cells before start of month */}
                {Array.from({ length: firstDayWeekday }).map((_, i) => (
                  <div key={`blank-${i}`} className="min-h-[85px] bg-slate-50/50 rounded-xl border border-slate-100" />
                ))}

                {/* Actual Month Days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                  const dayData = monthlyData.find((d) => d.date === dateStr);
                  const isSelected = selectedDateStr === dateStr;

                  const hasAvailable = !!dayData && dayData.availableSlots > 0;
                  const hasBooked = !!dayData && dayData.bookedSlots > 0;
                  const hasBlocked = !!dayData && dayData.blockedSlots > 0;
                  const isOff = !dayData || (dayData.totalSlots === 0);

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDateStr(dateStr)}
                      className={`min-h-[85px] p-2 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-[#4a3728] ring-2 ring-[#4a3728]/20 bg-[#fdf9f6]"
                          : "border-slate-100 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm font-bold ${
                            isSelected ? "text-[#4a3728]" : isOff ? "text-slate-300" : "text-slate-800"
                          }`}
                        >
                          {dayNum}
                        </span>
                        {dayData?.isDateBlocked && (
                          <span className="w-2 h-2 rounded-full bg-rose-500" title="Day is blocked" />
                        )}
                      </div>

                      <div className="space-y-1 w-full mt-1">
                        {hasAvailable && dayData && (
                          <div className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 leading-tight truncate">
                            {dayData.availableSlots} avail
                          </div>
                        )}
                        {hasBooked && dayData && (
                          <div className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 leading-tight truncate">
                            {dayData.bookedSlots} booked
                          </div>
                        )}
                        {hasBlocked && dayData && (
                          <div className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 leading-tight truncate">
                            {dayData.blockedSlots} blocked
                          </div>
                        )}
                        {isOff && (
                          <span className="text-[10px] font-semibold text-slate-300 block text-center py-1">
                            Off
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Date Slot Inspector (4 or 5 cols on lg) */}
            <div className="lg:col-span-5 xl:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#4a3728]" />
                    {selectedDateStr}
                  </h3>
                  <button
                    onClick={() => {
                      setNewBlockDate(selectedDateStr);
                      setShowBlockDateInput(true);
                      setActiveTab("settings");
                    }}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg"
                  >
                    + Block Day
                  </button>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {selectedDayData ? (
                    <>
                      <span className="font-bold text-emerald-700">{selectedDayData.availableSlots} Available</span>{" "}
                      • <span className="font-bold text-blue-700">{selectedDayData.bookedSlots} Booked</span> •{" "}
                      <span className="font-bold text-rose-700">{selectedDayData.blockedSlots} Blocked</span>
                    </>
                  ) : (
                    "No schedule configured for this day"
                  )}
                </p>
              </div>

              {/* Slots List for this day */}
              <div className="max-h-[460px] overflow-y-auto pr-1 space-y-2">
                {selectedDayData && selectedDayData.slots.length > 0 ? (
                  selectedDayData.slots.map((slot, sIdx) => {
                    const isAvail = slot.status === "available";
                    const isBk = slot.status === "booked";
                    const isBlk = slot.status === "blocked";
                    const isPst = slot.status === "past";

                    return (
                      <div
                        key={`${slot.startTime}-${sIdx}`}
                        className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                          isAvail
                            ? "bg-emerald-50/40 border-emerald-100"
                            : isBk
                            ? "bg-blue-50/40 border-blue-100"
                            : isBlk
                            ? "bg-rose-50/40 border-rose-100"
                            : "bg-slate-50 border-slate-100"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-slate-800">
                              {slot.startTime} – {slot.endTime}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            {isAvail && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" /> Available
                              </span>
                            )}
                            {isBk && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                                <UserCheck className="w-3 h-3" /> Session Booked
                              </span>
                            )}
                            {isBlk && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                                <Ban className="w-3 h-3" /> Blocked
                              </span>
                            )}
                            {isPst && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                                Past Time
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quick Slot Actions */}
                        <div>
                          {isAvail && (
                            <button
                              onClick={() => handleQuickBlockSlot(selectedDateStr, slot.startTime, slot.endTime)}
                              className="text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 px-2.5 py-1 rounded-lg transition"
                              title="Block this individual slot"
                            >
                              Block
                            </button>
                          )}
                          {isBlk && (
                            <span className="text-[11px] font-semibold text-rose-500 italic">
                              Manually Blocked
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-slate-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-semibold">No slots on this date</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Configure your weekly working hours or remove date overrides.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          TAB 2: WORKING HOURS & SETTINGS
          ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "settings" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {/* Config cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Slot & Break */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-slate-800">
                  <Clock className="w-4 h-4 text-slate-600" /> Slot &amp; Break Duration
                </h3>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 font-semibold mb-1 block">Slot Interval</label>
                    <select
                      value={slotInterval}
                      onChange={(e) => setSlotInterval(parseInt(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg text-sm font-semibold outline-none border border-slate-200 bg-slate-50 text-slate-700"
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>60 minutes</option>
                      <option value={90}>90 minutes</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 font-semibold mb-1 block">Break Between</label>
                    <select
                      value={breakDuration}
                      onChange={(e) => setBreakDuration(parseInt(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg text-sm font-semibold outline-none border border-slate-200 bg-slate-50 text-slate-700"
                    >
                      <option value={0}>No Break</option>
                      <option value={5}>5 minutes</option>
                      <option value={10}>10 minutes</option>
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Timezone */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-slate-800">
                  <Globe className="w-4 h-4 text-slate-600" /> Timezone
                </h3>
                <label className="text-xs text-slate-500 font-semibold mb-1 block">Schedule Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm font-semibold outline-none border border-slate-200 bg-slate-50 text-slate-700"
                >
                  <option value="Asia/Kolkata">IST (GMT+5:30) Asia/Kolkata</option>
                  <option value="America/New_York">EST (GMT-5:00) America/New_York</option>
                  <option value="America/Los_Angeles">PST (GMT-8:00) America/Los_Angeles</option>
                  <option value="Europe/Paris">CET (GMT+1:00) Europe/Paris</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>

            {/* Weekly Schedule */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-black text-slate-800">Weekly Schedule</h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Configure your recurring working windows for each day of the week
                  </p>
                </div>
                <button
                  onClick={copyMondayToAll}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-opacity hover:opacity-90 bg-slate-800 text-white"
                >
                  <Calendar className="w-3.5 h-3.5" /> Copy Monday → All
                </button>
              </div>

              <div className="space-y-4 mt-6">
                {weekSchedule.map((d, dayIdx) => (
                  <div
                    key={d.day}
                    className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50"
                  >
                    <div className="w-32 flex items-center gap-3 pt-1">
                      <input
                        type="checkbox"
                        checked={d.enabled}
                        onChange={() => handleToggleDay(dayIdx)}
                        className="w-4 h-4 rounded text-slate-800 focus:ring-slate-800"
                      />
                      <span className={`font-bold text-sm ${d.enabled ? "text-slate-800" : "text-slate-400"}`}>
                        {d.day}
                      </span>
                    </div>

                    <div className="flex-1 space-y-3">
                      {d.enabled ? (
                        d.timeRanges.map((range, rangeIdx) => (
                          <div key={rangeIdx} className="flex items-center gap-3 w-full max-w-sm">
                            <input
                              type="time"
                              value={range.startTime}
                              onChange={(e) => handleTimeChange(dayIdx, rangeIdx, "startTime", e.target.value)}
                              className="flex-1 px-3 py-1.5 rounded-lg text-sm font-semibold outline-none border border-slate-200 bg-white"
                            />
                            <span className="text-slate-400 font-bold">-</span>
                            <input
                              type="time"
                              value={range.endTime}
                              onChange={(e) => handleTimeChange(dayIdx, rangeIdx, "endTime", e.target.value)}
                              className="flex-1 px-3 py-1.5 rounded-lg text-sm font-semibold outline-none border border-slate-200 bg-white"
                            />
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-400 text-sm font-medium italic pt-1 inline-block">
                          Unavailable (Day off)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
                <button
                  onClick={handleSaveConfig}
                  disabled={isSaving}
                  className="px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 bg-[#4a3728] text-white hover:bg-[#382a1f] disabled:opacity-70 transition-all shadow-md"
                >
                  {isSaving ? "Saving Config..." : "Save Configuration"}
                </button>
              </div>
            </div>
          </div>

          {/* Right Section: Blocked Dates & Overrides */}
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Ban className="w-4 h-4 text-red-500" /> Date Overrides / Block
                </h3>
                <button
                  onClick={() => setShowBlockDateInput(!showBlockDateInput)}
                  className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200"
                >
                  + Add Block
                </button>
              </div>

              {showBlockDateInput && (
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-4 space-y-3">
                  <div>
                    <label className="text-xs text-red-800 font-semibold mb-1 block">Date to Block</label>
                    <input
                      type="date"
                      value={newBlockDate}
                      onChange={(e) => setNewBlockDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm font-semibold border border-red-200 outline-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-red-800 font-semibold mb-1 block">Start Time</label>
                      <input
                        type="time"
                        value={newBlockStart}
                        onChange={(e) => setNewBlockStart(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm font-semibold border border-red-200 outline-none"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-red-800 font-semibold mb-1 block">End Time</label>
                      <input
                        type="time"
                        value={newBlockEnd}
                        onChange={(e) => setNewBlockEnd(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm font-semibold border border-red-200 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-red-800 font-semibold mb-1 block">Reason (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Doctor appointment, Vacation"
                      value={newBlockReason}
                      onChange={(e) => setNewBlockReason(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm font-semibold border border-red-200 outline-none"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleAddBlockedDate}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 rounded-lg"
                    >
                      Save Block
                    </button>
                    <button
                      onClick={() => setShowBlockDateInput(false)}
                      className="flex-1 bg-white text-slate-600 border border-slate-200 text-xs font-bold py-2 rounded-lg hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {config?.blockedTimes && config.blockedTimes.length > 0 ? (
                  config.blockedTimes.map((block) => (
                    <div
                      key={block._id}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center group"
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-800">{block.date}</p>
                        <p className="text-xs text-slate-500 font-semibold">
                          {block.startTime} - {block.endTime}
                        </p>
                        {block.reason && (
                          <p className="text-xs text-slate-400 mt-1 truncate max-w-[150px]">{block.reason}</p>
                        )}
                      </div>
                      <button
                        onClick={() => block._id && handleRemoveBlockedDate(block._id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 font-medium text-center py-6 italic">No dates blocked.</p>
                )}
              </div>
            </div>

            <div className="bg-[#f8f9fa] p-5 rounded-2xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-600" /> How this works
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Unlike standard mentor availability, Senior Mentor availability uses a <b>rules-based engine</b>.
                <br />
                <br />
                When a junior views your profile, the system dynamically calculates available times by combining your
                weekly schedule with your scheduled Senior Sessions.
                <br />
                <br />
                Booked slots are automatically removed and reflected in your Calendar view without generating thousands of
                static calendar entries.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
