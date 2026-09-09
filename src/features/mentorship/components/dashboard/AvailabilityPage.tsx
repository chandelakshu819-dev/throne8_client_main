// mentorDashboard/components/AvailabilityPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react"
import {
  Clock, Globe, Calendar, ChevronLeft, ChevronRight,
  Shield, Trash2, Plus, X, BarChart2, RefreshCw, Pencil, Check, Lock, Ban
} from "lucide-react"
import AvailabilityService from "@/lib/api/availability.service";

interface AvailabilityPageProps {
  mentorData?: any;
}

// ── Types ──────────────────────────────────────────────────
interface AvailabilityRecord {
  availabilityId: string;
  date: string;
  dayOfWeek: string;
  timezone: string;
  slots: Array<{
    startTime: string;
    endTime: string;
    isBooked: boolean;
    isBlocked: boolean;
  }>;
}

interface StatsData {
  totalSlots: number;
  bookedSlots: number;
  availableSlots: number;
  blockedSlots: number;
}

const statCardMeta = [
  { key: 'totalSlots', label: "Total Slots", color: '#4a3728', bg: '#f3ece4' },
  { key: 'availableSlots', label: "Available", color: '#15803d', bg: '#dcfce7' },
  { key: 'bookedSlots', label: "Booked", color: '#b45309', bg: '#fef3c7' },
  { key: 'blockedSlots', label: "Blocked", color: '#dc2626', bg: '#fee2e2' },
] as const;

export default function AvailabilityPage({ mentorData }: AvailabilityPageProps) {
  // ── Core state ─────────────────────────────────────────
  const [currentDate, setCurrentDate] = useState(new Date());
  const [slotDuration, setSlotDuration] = useState(30);
  const [bufferTime, setBufferTime] = useState(0);
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [freeTrialEnabled, setFreeTrialEnabled] = useState(false);
  const [autoBlockBooked, setAutoBlockBooked] = useState(true);
  const [autoClosePast, setAutoClosePast] = useState(true);

  // ── API data state ─────────────────────────────────────
  const [existingAvailability, setExistingAvailability] = useState<AvailabilityRecord[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  // ── Save / delete state ────────────────────────────────
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ── Inline edit state ─────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSlots, setEditSlots] = useState<Array<{ startTime: string; endTime: string }>>([]);

  // ── Weekly schedule ────────────────────────────────────
  const [weekSchedule, setWeekSchedule] = useState([
    { day: "Monday", enabled: true, startTime: "09:00", endTime: "17:00" },
    { day: "Tuesday", enabled: true, startTime: "09:00", endTime: "17:00" },
    { day: "Wednesday", enabled: true, startTime: "09:00", endTime: "17:00" },
    { day: "Thursday", enabled: true, startTime: "09:00", endTime: "17:00" },
    { day: "Friday", enabled: true, startTime: "09:00", endTime: "17:00" },
    { day: "Saturday", enabled: false, startTime: "09:00", endTime: "17:00" },
    { day: "Sunday", enabled: false, startTime: "09:00", endTime: "17:00" },
  ]);

  // ── Blocked dates ──────────────────────────────────────
  const [blockedDates, setBlockedDates] = useState<{ label: string; date: string }[]>([]);
  const [showBlockDateInput, setShowBlockDateInput] = useState(false);
  const [newBlockDate, setNewBlockDate] = useState("");
  const [newBlockLabel, setNewBlockLabel] = useState("");

  // ── Data Fetching ──────────────────────────────────────
  const fetchMonthAvailability = useCallback(async () => {
    if (!mentorData?.mentorId) return;
    setIsLoadingData(true);
    try {
      const y = currentDate.getFullYear();
      const m = String(currentDate.getMonth() + 1).padStart(2, "0");
      const lastDay = new Date(y, currentDate.getMonth() + 1, 0).getDate();
      const startDate = `${y}-${m}-01`;
      const endDate = `${y}-${m}-${String(lastDay).padStart(2, "0")}`;

      const res = await AvailabilityService.getMentorAvailability(mentorData.mentorId, { startDate, endDate });
      setExistingAvailability(res.data?.availabilities ?? []);
    } catch (err: any) {
      console.error("Fetch availability failed:", err.message);
    } finally {
      setIsLoadingData(false);
    }
  }, [mentorData?.mentorId, currentDate]);

  const fetchStats = useCallback(async () => {
    if (!mentorData?.mentorId) return;
    setStatsLoading(true);
    try {
      const res = await AvailabilityService.getAvailabilityStats(mentorData.mentorId);
      setStats(res.data);
    } catch (err: any) {
      console.error("Fetch stats failed:", err.message);
    } finally {
      setStatsLoading(false);
    }
  }, [mentorData?.mentorId]);

  useEffect(() => { fetchMonthAvailability(); }, [fetchMonthAvailability]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  useEffect(() => {
    if (!saveMessage) return;
    const t = setTimeout(() => setSaveMessage(null), 5000);
    return () => clearTimeout(t);
  }, [saveMessage]);

  // ── Helpers ────────────────────────────────────────────
  const generateSlots = (startTime: string, endTime: string, duration: number, buffer: number) => {
    const slots: { startTime: string; endTime: string }[] = [];
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    let current = sh * 60 + sm;
    const end = eh * 60 + em;
    while (current + duration <= end) {
      const slotEnd = current + duration;
      slots.push({
        startTime: `${String(Math.floor(current / 60)).padStart(2, "0")}:${String(current % 60).padStart(2, "0")}`,
        endTime: `${String(Math.floor(slotEnd / 60)).padStart(2, "0")}:${String(slotEnd % 60).padStart(2, "0")}`,
      });
      current = slotEnd + buffer;
    }
    return slots;
  };

  const copyMondayToAll = () => {
    const mon = weekSchedule.find(d => d.day === "Monday");
    if (!mon) return;
    setWeekSchedule(prev => prev.map(d => ({ ...d, startTime: mon.startTime, endTime: mon.endTime })));
  };

  const addBlockedDate = () => {
    if (!newBlockDate) return;
    setBlockedDates(prev => [...prev, { label: newBlockLabel.trim() || newBlockDate, date: newBlockDate }]);
    setNewBlockDate(""); setNewBlockLabel(""); setShowBlockDateInput(false);
  };

  const removeBlockedDate = (i: number) => setBlockedDates(prev => prev.filter((_, idx) => idx !== i));

  // NEW: map date -> slot count (used for both the dot and the small number on the calendar)
  const slotCountByDate = useMemo(() => {
    const map = new Map<number, number>();
    existingAvailability.forEach(a => {
      const day = parseInt(a.date.substring(8, 10), 10);
      map.set(day, (map.get(day) ?? 0) + a.slots.length);
    });
    return map;
  }, [existingAvailability]);

  const datesWithAvailability = new Set(slotCountByDate.keys());

  const isDateBlocked = (date: number) => {
    const s = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
    return blockedDates.some(b => b.date === s);
  };

  // ── Save Handler ───────────────────────────────────────
  const handleSaveAvailability = async () => {
    if (!mentorData?.mentorId) {
      setSaveMessage({ type: "error", text: "Mentor ID not found. Please refresh." });
      return;
    }
    setIsSaving(true);
    setSaveMessage(null);
    try {
      if (selectedDate !== null) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDate);
        const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
        const daySched = weekSchedule.find(d => d.day === dayName);
        if (!daySched?.enabled) {
          setSaveMessage({ type: "error", text: `${dayName} is not enabled in your schedule.` });
          return;
        }
        const slots = generateSlots(daySched.startTime, daySched.endTime, slotDuration, bufferTime);
        if (slots.length === 0) {
          setSaveMessage({ type: "error", text: "No slots generated. Check time range and duration." });
          return;
        }

        const y = currentDate.getFullYear();
        const m = String(currentDate.getMonth() + 1).padStart(2, "0");
        const dd = String(selectedDate).padStart(2, "0");

        await AvailabilityService.createAvailability({
          mentorId: mentorData.mentorId,
          date: `${y}-${m}-${dd}`,
          slots, timezone, isRecurring: false,
        });
        setSaveMessage({ type: "success", text: `Created for ${date.toDateString()} (${slots.length} slots)` });
      } else {
        const enabledDays = weekSchedule.filter(d => d.enabled).map(d => d.day.toLowerCase());
        if (enabledDays.length === 0) {
          setSaveMessage({ type: "error", text: "Enable at least one day." });
          return;
        }
        const y = currentDate.getFullYear();
        const m = String(currentDate.getMonth() + 1).padStart(2, "0");
        const lastDay = new Date(y, currentDate.getMonth() + 1, 0).getDate();
        const startDate = `${y}-${m}-01`;
        const endDate = `${y}-${m}-${String(lastDay).padStart(2, "0")}`;
        const base = weekSchedule.find(d => d.enabled)!;
        const result = await AvailabilityService.bulkCreateAvailability({
          mentorId: mentorData.mentorId,
          dateRange: { startDate, endDate },
          slotConfig: { startTime: base.startTime, endTime: base.endTime, slotDuration, bufferBetween: bufferTime },
          daysOfWeek: enabledDays, timezone,
        });
        setSaveMessage({ type: "success", text: `Bulk: ${result.data?.created ?? 0} created, ${result.data?.failed ?? 0} failed` });
      }
      await fetchMonthAvailability();
      await fetchStats();
      setSelectedDate(null);
    } catch (error: any) {
      setSaveMessage({ type: "error", text: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete Handler ─────────────────────────────────────
  const handleDelete = async (availabilityId: string) => {
    if (!confirm("Delete this availability?")) return;
    setDeletingId(availabilityId);
    try {
      await AvailabilityService.deleteAvailability(availabilityId);
      setSaveMessage({ type: "success", text: "Deleted successfully." });
      await fetchMonthAvailability();
      await fetchStats();
    } catch (error: any) {
      setSaveMessage({ type: "error", text: error.message });
    } finally {
      setDeletingId(null);
    }
  };

  // ── Edit Handlers ──────────────────────────────────────
  const startEdit = (record: AvailabilityRecord) => {
    setEditingId(record.availabilityId);
    setEditSlots(record.slots.map(s => ({ startTime: s.startTime, endTime: s.endTime })));
  };
  const cancelEdit = () => { setEditingId(null); setEditSlots([]); };

  const handleUpdate = async (availabilityId: string) => {
    try {
      await AvailabilityService.updateAvailability(availabilityId, { slots: editSlots });
      setSaveMessage({ type: "success", text: "Updated successfully." });
      setEditingId(null);
      await fetchMonthAvailability();
    } catch (error: any) {
      setSaveMessage({ type: "error", text: error.message });
    }
  };

  // ── Calendar helpers ───────────────────────────────────
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const getDaysInMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1).getDay();
  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const today = new Date();
  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();

  const dayAbbrev = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#4a3728' }}>
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#4a3728' }}>Availability</h2>
            <p style={{ color: '#8a7a6a' }} className="text-sm">Set your available hours</p>
          </div>
        </div>
        <button
          onClick={() => { fetchMonthAvailability(); fetchStats(); }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors hover:bg-[#f3ece4]"
          style={{ backgroundColor: '#fbf7f3', color: '#7a5c3e', border: '1px solid #e0d8cf' }}
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCardMeta.map(card => (
          <div key={card.key} className="bg-white p-5 rounded-2xl" style={{ border: '1px solid #e0d8cf' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: card.bg }}>
              <BarChart2 className="w-4.5 h-4.5" style={{ color: card.color }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: card.color }}>
              {statsLoading ? '—' : (stats?.[card.key] ?? 0)}
            </p>
            <p className="text-xs font-medium mt-0.5" style={{ color: '#8a7a6a' }}>{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left Section ──────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Config cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Slot Duration */}
            <div className="bg-white p-5 rounded-2xl" style={{ border: '1px solid #e0d8cf' }}>
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#4a3728' }}>
                <Clock className="w-4 h-4" style={{ color: '#7a5c3e' }} /> Slot Duration
              </h3>
              <div className="flex gap-2">
                {[30, 45, 60].map(min => (
                  <button
                    key={min}
                    onClick={() => setSlotDuration(min)}
                    className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors"
                    style={{
                      backgroundColor: slotDuration === min ? '#4a3728' : '#fbf7f3',
                      color: slotDuration === min ? '#fff' : '#7a5c3e',
                      border: slotDuration === min ? 'none' : '1px solid #e0d8cf',
                    }}
                  >
                    {min}m
                  </button>
                ))}
              </div>
            </div>

            {/* Break */}
            <div className="bg-white p-5 rounded-2xl" style={{ border: '1px solid #e0d8cf' }}>
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#4a3728' }}>
                <Clock className="w-4 h-4" style={{ color: '#7a5c3e' }} /> Break Between Sessions
              </h3>
              <select
                value={bufferTime}
                onChange={e => setBufferTime(parseInt(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm font-semibold outline-none"
                style={{ border: '1px solid #e0d8cf', backgroundColor: '#fbf7f3', color: '#7a5c3e' }}
              >
                <option value={0}>No Break</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
              </select>
            </div>

            {/* Timezone */}
            <div className="bg-white p-5 rounded-2xl" style={{ border: '1px solid #e0d8cf' }}>
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#4a3728' }}>
                <Globe className="w-4 h-4" style={{ color: '#7a5c3e' }} /> Timezone
              </h3>
              <select
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm font-semibold outline-none"
                style={{ border: '1px solid #e0d8cf', backgroundColor: '#fbf7f3', color: '#7a5c3e' }}
              >
                <option value="Asia/Kolkata">IST (GMT+5:30)</option>
                <option value="America/New_York">EST (GMT-5:00)</option>
                <option value="America/Los_Angeles">PST (GMT-8:00)</option>
                <option value="Europe/Paris">CET (GMT+1:00)</option>
              </select>
            </div>
          </div>

          {/* Action bar */}
          <div className="bg-white p-5 rounded-2xl" style={{ border: '1px solid #e0d8cf' }}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={copyMondayToAll}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#4a3728' }}
                >
                  <Calendar className="w-4 h-4" /> Copy Monday → All Days
                </button>
                <button
                  onClick={() => setShowBlockDateInput(v => !v)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors hover:bg-[#f3ece4]"
                  style={{ backgroundColor: '#fbf7f3', color: '#7a5c3e', border: '1px solid #e0d8cf' }}
                >
                  <Ban className="w-4 h-4" /> Block Specific Dates
                </button>
              </div>
              <label className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl cursor-pointer" style={{ backgroundColor: '#fbf7f3', border: '1px solid #e0d8cf' }}>
                <input type="checkbox" checked={freeTrialEnabled} onChange={e => setFreeTrialEnabled(e.target.checked)} className="w-4 h-4 rounded" style={{ accentColor: '#4a3728' }} />
                <span className="text-sm font-semibold" style={{ color: '#4a3728' }}>Free Trial Slot Toggle</span>
              </label>
            </div>
            {showBlockDateInput && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <input
                  type="date" value={newBlockDate} onChange={e => setNewBlockDate(e.target.value)}
                  className="px-3.5 py-2 rounded-lg outline-none text-sm font-semibold"
                  style={{ border: '1px solid #e0d8cf', backgroundColor: '#fbf7f3', color: '#4a3728' }}
                />
                <input
                  type="text" placeholder="Label (e.g. Diwali)" value={newBlockLabel} onChange={e => setNewBlockLabel(e.target.value)}
                  className="px-3.5 py-2 rounded-lg outline-none text-sm font-semibold flex-1"
                  style={{ border: '1px solid #e0d8cf', backgroundColor: '#fbf7f3', color: '#4a3728' }}
                />
                <button onClick={addBlockedDate} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: '#4a3728' }}>Add</button>
                <button onClick={() => setShowBlockDateInput(false)} className="px-3.5 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#fbf7f3', color: '#7a5c3e', border: '1px solid #e0d8cf' }}>Cancel</button>
              </div>
            )}
          </div>

          {/* Weekly Schedule */}
          <div className="bg-white p-6 rounded-2xl" style={{ border: '1px solid #e0d8cf' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold" style={{ color: '#4a3728' }}>Weekly Schedule</h3>
              {/* NEW: mini week-pattern strip — at-a-glance view of enabled days */}
              <div className="flex items-center gap-1.5">
                {weekSchedule.map(d => (
                  <div
                    key={d.day}
                    title={`${d.day}${d.enabled ? ` · ${d.startTime}–${d.endTime}` : ' · Off'}`}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold"
                    style={{
                      backgroundColor: d.enabled ? '#4a3728' : '#f3ece4',
                      color: d.enabled ? '#fff' : '#a08070',
                    }}
                  >
                    {d.day[0]}
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2.5">
              {weekSchedule.map((item, idx) => (
                <div
                  key={item.day}
                  className="flex items-center justify-between p-4 rounded-xl transition-opacity"
                  style={{ border: '1px solid #e0d8cf', backgroundColor: item.enabled ? '#fbf7f3' : '#fafafa', opacity: item.enabled ? 1 : 0.55 }}
                >
                  <span className="text-sm font-bold w-24" style={{ color: '#4a3728' }}>{item.day}</span>
                  <div className="flex items-center gap-3 flex-1 justify-end">
                    <input
                      type="time" value={item.startTime} disabled={!item.enabled}
                      onChange={e => setWeekSchedule(prev => prev.map((d, i) => i === idx ? { ...d, startTime: e.target.value } : d))}
                      className="px-3 py-1.5 rounded-lg outline-none text-sm"
                      style={{ border: '1px solid #e0d8cf', backgroundColor: '#fff', color: '#4a3728' }}
                    />
                    <span style={{ color: '#8a7a6a' }} className="text-xs font-semibold">to</span>
                    <input
                      type="time" value={item.endTime} disabled={!item.enabled}
                      onChange={e => setWeekSchedule(prev => prev.map((d, i) => i === idx ? { ...d, endTime: e.target.value } : d))}
                      className="px-3 py-1.5 rounded-lg outline-none text-sm"
                      style={{ border: '1px solid #e0d8cf', backgroundColor: '#fff', color: '#4a3728' }}
                    />
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox" checked={item.enabled}
                        onChange={e => setWeekSchedule(prev => prev.map((d, i) => i === idx ? { ...d, enabled: e.target.checked } : d))}
                        className="sr-only peer"
                      />
                      <div
                        className="w-10 h-5.5 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all"
                        style={{ backgroundColor: item.enabled ? '#4a3728' : '#d8cec4' }}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Existing Availability List */}
          <div className="bg-white p-6 rounded-2xl" style={{ border: '1px solid #e0d8cf' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold" style={{ color: '#4a3728' }}>
                Saved Availability — {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              {isLoadingData && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: '#fbf7f3', color: '#7a5c3e' }}>
                  Loading...
                </span>
              )}
            </div>

            {existingAvailability.length === 0 && !isLoadingData ? (
              <p className="text-center py-8 text-sm" style={{ color: '#8a7a6a' }}>
                No availability set for this month yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {existingAvailability.map(record => (
                  <div key={record.availabilityId} className="p-4 rounded-xl" style={{ border: '1px solid #e0d8cf', backgroundColor: '#fbf7f3' }}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-bold" style={{ color: '#4a3728' }}>
                          {(() => {
                            const dateStr = record.date.substring(0, 10);
                            const [year, month, day] = dateStr.split("-").map(Number);
                            return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
                              weekday: "long", day: "numeric", month: "long"
                            });
                          })()}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#8a7a6a' }}>
                          {record.slots.length} slots · {record.timezone}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        {editingId === record.availabilityId ? (
                          <>
                            <button
                              onClick={() => handleUpdate(record.availabilityId)}
                              className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold flex items-center gap-1"
                              style={{ backgroundColor: '#15803d' }}
                            >
                              <Check className="w-3.5 h-3.5" /> Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                              style={{ backgroundColor: '#fff', color: '#7a5c3e', border: '1px solid #e0d8cf' }}
                            >
                              <X className="w-3.5 h-3.5" /> Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(record)}
                              className="p-2 rounded-lg transition-colors hover:bg-white"
                              style={{ border: '1px solid #e0d8cf' }}
                              title="Edit slots"
                            >
                              <Pencil className="w-3.5 h-3.5" style={{ color: '#7a5c3e' }} />
                            </button>
                            <button
                              onClick={() => handleDelete(record.availabilityId)}
                              disabled={deletingId === record.availabilityId}
                              className="p-2 rounded-lg transition-colors hover:bg-white disabled:opacity-50"
                              style={{ border: '1px solid #e0d8cf' }}
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" style={{ color: '#dc2626' }} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {editingId === record.availabilityId ? (
                      <div className="space-y-2">
                        {editSlots.map((slot, si) => (
                          <div key={si} className="flex items-center gap-2.5">
                            <input
                              type="time" value={slot.startTime}
                              onChange={e => setEditSlots(prev => prev.map((s, i) => i === si ? { ...s, startTime: e.target.value } : s))}
                              className="px-3 py-1.5 rounded-lg text-sm outline-none"
                              style={{ border: '1px solid #e0d8cf', backgroundColor: '#fff' }}
                            />
                            <span className="text-sm" style={{ color: '#8a7a6a' }}>→</span>
                            <input
                              type="time" value={slot.endTime}
                              onChange={e => setEditSlots(prev => prev.map((s, i) => i === si ? { ...s, endTime: e.target.value } : s))}
                              className="px-3 py-1.5 rounded-lg text-sm outline-none"
                              style={{ border: '1px solid #e0d8cf', backgroundColor: '#fff' }}
                            />
                            <button onClick={() => setEditSlots(prev => prev.filter((_, i) => i !== si))}>
                              <X className="w-3.5 h-3.5" style={{ color: '#dc2626' }} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => setEditSlots(prev => [...prev, { startTime: "09:00", endTime: "09:30" }])}
                          className="text-xs font-semibold flex items-center gap-1 mt-1 hover:underline"
                          style={{ color: '#7a5c3e' }}
                        >
                          <Plus className="w-3 h-3" /> Add Slot
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {record.slots.map((slot, si) => (
                          <span
                            key={si}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
                            style={{
                              backgroundColor: slot.isBooked ? '#fef3c7' : slot.isBlocked ? '#fee2e2' : '#dbeafe',
                              color: slot.isBooked ? '#b45309' : slot.isBlocked ? '#dc2626' : '#1d4ed8',
                            }}
                          >
                            {slot.startTime}–{slot.endTime}
                            {slot.isBooked && <Lock className="w-3 h-3" />}
                            {slot.isBlocked && <Ban className="w-3 h-3" />}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Section ──────────────────────────────── */}
        <div className="lg:col-span-1 space-y-5">

          {/* Calendar */}
          <div className="bg-white p-5 rounded-2xl" style={{ border: '1px solid #e0d8cf' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold flex items-center gap-2" style={{ color: '#4a3728' }}>
                <Calendar className="w-4.5 h-4.5" />
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <div className="flex gap-1.5">
                <button onClick={handlePrevMonth} className="p-1.5 rounded-lg transition-colors hover:bg-[#fbf7f3]" style={{ border: '1px solid #e0d8cf' }}>
                  <ChevronLeft className="w-4 h-4" style={{ color: '#4a3728' }} />
                </button>
                <button onClick={handleNextMonth} className="p-1.5 rounded-lg transition-colors hover:bg-[#fbf7f3]" style={{ border: '1px solid #e0d8cf' }}>
                  <ChevronRight className="w-4 h-4" style={{ color: '#4a3728' }} />
                </button>
              </div>
            </div>

            {/* Mode badge */}
            <div className="mb-3 px-3 py-2 rounded-lg text-xs font-semibold text-center" style={{ backgroundColor: '#fbf7f3', color: '#7a5c3e', border: '1px solid #e0d8cf' }}>
              {selectedDate ? `Single day: ${selectedDate} ${monthNames[currentDate.getMonth()]}` : `Bulk: Full month`}
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1.5">
              {dayAbbrev.map((d, i) => (
                <div key={i} className="text-center text-[11px] font-bold py-1" style={{ color: '#a08070' }}>{d}</div>
              ))}
            </div>

            {/* Date grid — now shows a small slot count instead of just a dot */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }, (_, i) => <div key={`e-${i}`} className="aspect-square" />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const date = i + 1;
                const blocked = isDateBlocked(date);
                const slotCount = slotCountByDate.get(date) ?? 0;
                const hasAvail = slotCount > 0;
                const isToday = isCurrentMonth && date === today.getDate();
                const isSel = selectedDate === date;
                return (
                  <div
                    key={date}
                    onClick={() => setSelectedDate(date === selectedDate ? null : date)}
                    className="aspect-square flex flex-col items-center justify-center rounded-lg cursor-pointer transition-colors relative"
                    style={{
                      backgroundColor: blocked ? '#fee2e2' : isSel ? '#4a3728' : isToday ? '#f3ece4' : '#fff',
                      border: !isSel ? `1px solid ${blocked ? '#fca5a5' : isToday ? '#c9a87c' : '#e0d8cf'}` : 'none',
                    }}
                  >
                    <span
                      className="text-xs font-semibold"
                      style={{ color: blocked ? '#dc2626' : isSel ? '#fff' : isToday ? '#4a3728' : '#4a3728' }}
                    >
                      {date}
                    </span>
                    {hasAvail && !blocked && (
                      <span
                        className="text-[9px] font-bold leading-none mt-0.5"
                        style={{ color: isSel ? 'rgba(255,255,255,0.8)' : '#1d4ed8' }}
                      >
                        {slotCount}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-3 grid grid-cols-2 gap-2" style={{ borderTop: '1px solid #f0ebe4' }}>
              {[
                { color: '#f3ece4', border: '#c9a87c', label: 'Today' },
                { color: '#4a3728', label: 'Selected' },
                { color: '#fff', border: '#e0d8cf', label: 'Number = slots', textColor: '#1d4ed8' },
                { color: '#fee2e2', border: '#fca5a5', label: 'Blocked' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: item.color, border: item.border ? `1px solid ${item.border}` : 'none' }} />
                  <span style={{ color: '#8a7a6a' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Auto Block Settings */}
          <div className="bg-white p-5 rounded-2xl" style={{ border: '1px solid #e0d8cf' }}>
            <h4 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#4a3728' }}>
              <Shield className="w-4 h-4" style={{ color: '#7a5c3e' }} /> Auto Block Settings
            </h4>
            <div className="space-y-2">
              {[
                { label: 'Auto Block Booked Slots', value: autoBlockBooked, set: setAutoBlockBooked },
                { label: 'Auto Close Past Slots', value: autoClosePast, set: setAutoClosePast },
              ].map(item => (
                <label key={item.label} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer" style={{ backgroundColor: '#fbf7f3', border: '1px solid #e0d8cf' }}>
                  <input type="checkbox" checked={item.value} onChange={e => item.set(e.target.checked)} className="w-4 h-4 rounded" style={{ accentColor: '#4a3728' }} />
                  <p className="text-sm font-semibold" style={{ color: '#4a3728' }}>{item.label}</p>
                </label>
              ))}
            </div>
          </div>

          {/* Blocked Dates */}
          <div className="bg-white p-5 rounded-2xl" style={{ border: '1px solid #e0d8cf' }}>
            <h4 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#4a3728' }}>
              <Ban className="w-4 h-4" style={{ color: '#7a5c3e' }} /> Blocked Dates
            </h4>
            <div className="space-y-2 mb-3">
              {blockedDates.length === 0 ? (
                <p className="text-sm text-center py-3" style={{ color: '#8a7a6a' }}>No blocked dates yet.</p>
              ) : (
                blockedDates.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg flex items-center justify-between text-sm" style={{ backgroundColor: '#fbf7f3', border: '1px solid #e0d8cf' }}>
                    <span style={{ color: '#8a7a6a' }}>{item.date} — {item.label}</span>
                    <button onClick={() => removeBlockedDate(idx)}>
                      <Trash2 className="w-3.5 h-3.5" style={{ color: '#dc2626' }} />
                    </button>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => setShowBlockDateInput(true)}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#4a3728' }}
            >
              <Plus className="w-4 h-4" /> Add Blocked Date
            </button>
          </div>
        </div>
      </div>

      {/* Save Section */}
      <div>
        {saveMessage && (
          <div
            className="mb-3 p-3.5 rounded-xl text-sm font-semibold"
            style={{
              backgroundColor: saveMessage.type === "success" ? '#dcfce7' : '#fee2e2',
              color: saveMessage.type === "success" ? '#15803d' : '#dc2626',
              border: `1px solid ${saveMessage.type === "success" ? '#86efac' : '#fca5a5'}`,
            }}
          >
            {saveMessage.text}
          </div>
        )}
        <p className="text-sm mb-3 font-medium" style={{ color: '#8a7a6a' }}>
          {selectedDate
            ? `Single day mode — ${selectedDate} ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()} · Click date again to deselect`
            : `Bulk mode — Full month: ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()} · Click a date to switch to single day`
          }
        </p>
        <button
          onClick={handleSaveAvailability}
          disabled={isSaving}
          className="w-full py-3.5 rounded-xl text-white text-sm font-bold transition-opacity disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90"
          style={{ backgroundColor: '#4a3728' }}
        >
          {isSaving
            ? "Saving..."
            : selectedDate
              ? `Save Availability for ${selectedDate} ${monthNames[currentDate.getMonth()]}`
              : `Save Full Month (${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()})`
          }
        </button>
      </div>
    </div>
  );
}