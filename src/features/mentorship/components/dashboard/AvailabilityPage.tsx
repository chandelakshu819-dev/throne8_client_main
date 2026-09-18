// mentorDashboard/components/AvailabilityPage.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
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
  isDateBlocked?: boolean;
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
  const [slotDuration, setSlotDuration] = useState(() => {
    // ✅ FIX: component remount hone par bhi (tab switch etc.) mentorData
    // prop se pehle localStorage me abhi saved sync-value check karo,
    // taaki latest service-Duration hi initial value ho, na ki stale 30.
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mentor_slotDuration");
      if (saved) return Number(saved);
    }
    return mentorData?.availability?.slotDuration || 30;
  });

  // ✅ NEW: Service create/update hote hi (ServicesPage.tsx se) backend ka
  // availability.slotDuration update hota hai — mentorData refresh hone par
  // yahan bhi sync kar do, taaki agla generateSlots() naye duration ke sath chale.
  useEffect(() => {
    if (mentorData?.availability?.slotDuration) {
      setSlotDuration(mentorData.availability.slotDuration);
    }
  }, [mentorData?.availability?.slotDuration]);

  // ✅ FIX: Parent (jo mentorData hold karta hai) backend-sync ke baad
  // mentorData ko refetch nahi karta, isliye upar wala useEffect kabhi
  // fire nahi hota. ServicesPage se aane wale custom event ko sunkar
  // slotDuration ko turant, live update karo — bina page refresh ke.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail === "number" && detail > 0) {
        setSlotDuration(detail);
      }
    };
    window.addEventListener("mentorSlotDurationUpdated", handler);
    return () => window.removeEventListener("mentorSlotDurationUpdated", handler);
  }, []);
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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);  
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ── Inline edit state ─────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSlots, setEditSlots] = useState<Array<{ startTime: string; endTime: string }>>([]);

      // ── Weekly schedule ────────────────────────────────────
      const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const DEFAULT_WEEK_SCHEDULE = ALL_DAYS.map(day => ({
        day,
        enabled: ["Saturday", "Sunday"].indexOf(day) === -1,
        startTime: "09:00",
        endTime: "17:00",
      }));
   
      // Backend se availability.daysAvailable aane par usi se schedule banao
      const buildScheduleFromBackend = () => {
        const daysAvailable: string[] | undefined = mentorData?.availability?.daysAvailable;
        if (!daysAvailable || daysAvailable.length === 0) return null;
        const start = mentorData?.availability?.preferredHours?.start || "09:00";
        const end = mentorData?.availability?.preferredHours?.end || "17:00";
        return ALL_DAYS.map(day => ({
          day,
          enabled: daysAvailable.includes(day.toLowerCase()),
          startTime: start,
          endTime: end,
        }));
      };
   
     const [weekSchedule, setWeekSchedule] = useState(() => {
       const fromBackend = buildScheduleFromBackend();
       if (fromBackend) return fromBackend;
       if (typeof window === "undefined") return DEFAULT_WEEK_SCHEDULE;
       try {
         const saved = localStorage.getItem("mentor_weekSchedule");
         return saved ? JSON.parse(saved) : DEFAULT_WEEK_SCHEDULE;
       } catch {
         return DEFAULT_WEEK_SCHEDULE;
       }
     });
   
     // Jab mentorData baad me (async) load ho, tab bhi backend se sync kar do
     useEffect(() => {
       const fromBackend = buildScheduleFromBackend();
       if (fromBackend) setWeekSchedule(fromBackend);
       // eslint-disable-next-line react-hooks/exhaustive-deps
     }, [mentorData?.availability]);
   
     // Jab bhi weekSchedule change ho: localStorage backup + backend me bhi save karo
     useEffect(() => {
       try {
         localStorage.setItem("mentor_weekSchedule", JSON.stringify(weekSchedule));
       } catch (err) {
         console.error("Failed to save weekSchedule:", err);
       }
   
       if (!mentorData?.mentorId) return;
   
       const timer = setTimeout(() => {
         const enabledDays = weekSchedule.filter((d: any) => d.enabled).map((d: any) => d.day.toLowerCase());
         const base = weekSchedule.find((d: any) => d.enabled) || weekSchedule[0];
   
         import("@/lib/api/mentorship.service").then(({ default: MentorService }) => {
           MentorService.updateMentorAvailability(mentorData.mentorId, {
             timezone,
             daysAvailable: enabledDays,
             preferredHours: { start: base.startTime, end: base.endTime },
             bufferBetweenSessions: bufferTime,
           }).catch((err: any) => console.error("Failed to persist weekly pattern:", err.message));
         });
       }, 800);
   
       return () => clearTimeout(timer);
       // eslint-disable-next-line react-hooks/exhaustive-deps
     }, [weekSchedule]);



    // ── Blocked dates ──────────────────────────────────────
  // NOTE: ab ye local array nahi — blocked status seedha `existingAvailability`
  // (backend se aayi records) se derive hota hai, isliye refresh ke baad bhi sahi rahega.
  const [showBlockDateInput, setShowBlockDateInput] = useState(false);
  const [newBlockDate, setNewBlockDate] = useState("");
  const [newBlockLabel, setNewBlockLabel] = useState("");
  const [blockActionId, setBlockActionId] = useState<string | null>(null);

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

  const addBlockedDate = async () => {
    if (!newBlockDate || !mentorData?.mentorId) return;
    setBlockActionId("pending");
    try {
      await AvailabilityService.blockDateByDate(
        mentorData.mentorId,
        newBlockDate,
        undefined,
        timezone
      );
      await fetchMonthAvailability();
      setSaveMessage({ type: "success", text: `Blocked: ${newBlockDate}` });
      setNewBlockDate(""); setShowBlockDateInput(false);
    } catch (err: any) {
      setSaveMessage({ type: "error", text: err.message });
    } finally {
      setBlockActionId(null);
    }
  };
  const removeBlockedDate = async (availabilityId: string) => {
    setBlockActionId(availabilityId);
    try {
      await AvailabilityService.unblockDate(availabilityId);
      await fetchMonthAvailability();
      setSaveMessage({ type: "success", text: "Date unblocked." });
    } catch (err: any) {
      setSaveMessage({ type: "error", text: err.message });
    } finally {
      setBlockActionId(null);
    }
  };

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
  
    // Ek availability record "fully blocked" tab mana jaata hai jab uske
    // saare non-booked slots isBlocked=true hon (aur kam se kam 1 slot ho)
    const blockedRecordsByDay = useMemo(() => {
      const map = new Map<number, AvailabilityRecord>();
      existingAvailability.forEach(a => {
        if (a.isDateBlocked) {
          const day = parseInt(a.date.substring(8, 10), 10);
          map.set(day, a);
        }
      });
      return map;
    }, [existingAvailability]);


    
    const blockedDateList = useMemo(() => {
      return Array.from(blockedRecordsByDay.entries())
        .map(([day, record]) => ({
          availabilityId: record.availabilityId,
          date: record.date.substring(0, 10),
          day,
        }))
        .sort((a, b) => a.day - b.day);
    }, [blockedRecordsByDay]);
  
    const isDateBlocked = (date: number) => blockedRecordsByDay.has(date);

    // ✅ NEW: which weekday name corresponds to the currently selected calendar
    // date — used to auto-highlight and scroll to that row in Weekly Schedule.
    const selectedDayName = useMemo(() => {
      if (selectedDate === null) return null;
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDate);
      return date.toLocaleDateString("en-US", { weekday: "long" });
    }, [selectedDate, currentDate]);

      // ✅ NEW: jab calendar se koi date select ho, us weekday row tak
    // sirf ANDAR WALE box (scheduleListRef) ko scroll karo — page/window
    // scroll ko bilkul touch nahi karte (scrollIntoView use nahi kiya,
    // kyunki wo ancestor page ko bhi scroll kar sakta hai).
    const dayRowRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const scheduleListRef = useRef<HTMLDivElement>(null);

     // ✅ FIX: Calendar se date select karte hi, us date ka weekday Weekly
    // Schedule me sirf highlight nahi — turant "active" (enabled: true)
    // bhi ho jana chahiye. Pehle highlight to hota tha lekin toggle OFF
    // rehta tha, isliye time inputs disabled the aur Save karne par
    // "day is not enabled" error aata tha. Ab date select karte hi
    // uska din auto-enable ho jayega — mentor seedha time set kar sakega.
    useEffect(() => {
      if (!selectedDayName) return;
      setWeekSchedule(prev =>
        prev.some(d => d.day === selectedDayName && !d.enabled)
          ? prev.map(d => d.day === selectedDayName ? { ...d, enabled: true } : d)
          : prev
      );
    }, [selectedDayName]);

    useEffect(() => {
      if (!selectedDayName) return;
      const container = scheduleListRef.current;
      const el = dayRowRefs.current[selectedDayName];
      if (!container || !el) return;

      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const offset =
        elRect.top - containerRect.top + container.scrollTop
        - (container.clientHeight / 2) + (el.clientHeight / 2);

      container.scrollTo({ top: offset, behavior: "smooth" });
    }, [selectedDayName]);

  
  
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
    setDeletingId(availabilityId);
    try {
      // 1. API call — modal button shows "Deleting..." during this
      await AvailabilityService.deleteAvailability(availabilityId);

      // 2. Close the modal first (clean visual step — deleting done, modal gone)
      setConfirmDeleteId(null);
      setDeletingId(null);

      // 3. THEN refresh the background list, so the card disappears only
      // after the modal has already closed — not before/during it.
      await fetchMonthAvailability();
      await fetchStats();

      // 4. Show the success toast immediately, no artificial delay
      setSaveMessage({ type: "success", text: "Deleted successfully." });
    } catch (error: any) {
      setSaveMessage({ type: "error", text: error.message });
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  // ── Edit Handlers ──────────────────────────────────────
  const startEdit = (record: AvailabilityRecord) => {
    setEditingId(record.availabilityId);
    setEditSlots(record.slots.map(s => ({ startTime: s.startTime, endTime: s.endTime })));
  };
  const cancelEdit = () => { setEditingId(null); setEditSlots([]); };

  const handleUpdate = async (availabilityId: string) => {
    // Client-side duplicate/overlap guard — mirrors backend's overlap check
    // so the user gets a clear, specific message here instead of a generic
    // "Failed to update availability" after hitting the API.
    const toMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    for (let i = 0; i < editSlots.length; i++) {
      for (let j = i + 1; j < editSlots.length; j++) {
        const aStart = toMinutes(editSlots[i].startTime);
        const aEnd = toMinutes(editSlots[i].endTime);
        const bStart = toMinutes(editSlots[j].startTime);
        const bEnd = toMinutes(editSlots[j].endTime);
        if (aStart < bEnd && aEnd > bStart) {
          setSaveMessage({
            type: "error",
            text: `Slots ${i + 1} (${editSlots[i].startTime}-${editSlots[i].endTime}) and ${j + 1} (${editSlots[j].startTime}-${editSlots[j].endTime}) overlap. Please fix before saving.`,
          });
          return;
        }
      }
    }

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

    // ✅ FIX (Option B — permanent): native <input type="time"> browser/OS
  // locale follow karta hai — agar system 24-hour clock pe set hai (jaisa
  // ki Windows me commonly hota hai), to time picker me koi AM/PM selector
  // hi nahi dikhta. Mentor "1:10 PM" ke liye "01:10" type kar deta tha jo
  // silently 1:10 AM save ho jaata tha — locale se bilkul independent nahi
  // tha. Ab apna khud ka 12-hour picker hai: hour (1-12) + minute + explicit
  // AM/PM toggle. Output hamesha same 24hr "HH:MM" string hai jo backend/
  // generateSlots() already expect karta hai — is component ke bahar kuch
  // badalne ki zaroorat nahi.
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

  const TimeInput = ({
    value,
    onChange,
    disabled = false,
  }: { value: string; onChange: (v: string) => void; disabled?: boolean }) => {
    const { hour12, minute, period } = from24Hour(value);
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
      if (!open) return;
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
            border: '1px solid #e0d8cf',
            backgroundColor: disabled ? '#f5f1ec' : '#fff',
            color: '#4a3728',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          {displayLabel}
          <Clock className="w-3.5 h-3.5" style={{ color: disabled ? '#c9beb2' : '#7a5c3e' }} />
        </button>

        {open && !disabled && (
          <div
            className="absolute z-50 mt-1 flex items-center gap-1.5 p-3 rounded-xl shadow-lg"
            style={{ backgroundColor: '#fff', border: '1px solid #e0d8cf', minWidth: '220px' }}
          >
            {/* Hour dropdown */}
            <select
              value={hour12}
              onChange={(e) => updateHour(Number(e.target.value))}
              className="px-2 py-1.5 rounded-lg outline-none text-sm font-semibold"
              style={{ border: '1px solid #e0d8cf', backgroundColor: '#fbf7f3', color: '#4a3728' }}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                <option key={h} value={h}>{String(h).padStart(2, "0")}</option>
              ))}
            </select>

            <span className="text-sm font-bold" style={{ color: '#8a7a6a' }}>:</span>

            {/* Minute dropdown — 5-min steps, matches typical slot granularity */}
            <select
              value={minute}
              onChange={(e) => updateMinute(Number(e.target.value))}
              className="px-2 py-1.5 rounded-lg outline-none text-sm font-semibold"
              style={{ border: '1px solid #e0d8cf', backgroundColor: '#fbf7f3', color: '#4a3728' }}
            >
              {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
              ))}
            </select>

            {/* Explicit AM/PM toggle — this is the actual fix */}
            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #e0d8cf' }}>
              {(["AM", "PM"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => updatePeriod(p)}
                  className="px-2.5 py-1.5 text-xs font-bold transition-colors"
                  style={{
                    backgroundColor: period === p ? '#4a3728' : '#fbf7f3',
                    color: period === p ? '#fff' : '#7a5c3e',
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
  };


  
  // ── Render ─────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Toast — fixed at top so it's visible regardless of scroll position.
          Previously this message rendered inline near the bottom Save button,
          so actions like Delete (triggered from the middle/top of a long
          page) required scrolling down to see the result. */}
           {saveMessage && (
        <div
          className="fixed top-5 right-5 z-[500] px-5 py-3.5 rounded-xl text-sm font-semibold shadow-lg max-w-sm"
          style={{
            backgroundColor: saveMessage.type === "success" ? '#dcfce7' : '#fee2e2',
            color: saveMessage.type === "success" ? '#15803d' : '#dc2626',
            border: `1px solid ${saveMessage.type === "success" ? '#86efac' : '#fca5a5'}`,
          }}
        >
          {saveMessage.text}
        </div>
      )}

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
          {/* ✅ FIX: Slot Duration card hata diya — ab sirf 2 cards hain,
              isliye grid ko md:grid-cols-3 se md:grid-cols-2 kar diya
              taaki khaali teesri column na dikhe. slotDuration state
              ab bhi code me hai (generateSlots/save handlers isko use
              karte hain) bas fixed default (30) pe rehta hai. */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                  className="px-3.5 py-2 rounded-lg outline-none text-sm font-semibold flex-1"
                  style={{ border: '1px solid #e0d8cf', backgroundColor: '#fbf7f3', color: '#4a3728' }}
                />

                {/* ✅ FIX: Label/reason input hata diya — ab sirf date
                    diya jaata hai, addBlockedDate() ko label ki jagah
                    undefined pass hoga (jo already optional hai). */}
<button
                  onClick={addBlockedDate}
                  disabled={!!blockActionId}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                  style={{ backgroundColor: '#4a3728' }}
                >
                  {blockActionId ? "Blocking..." : "Add"}
                </button>

                <button onClick={() => setShowBlockDateInput(false)} className="px-3.5 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#fbf7f3', color: '#7a5c3e', border: '1px solid #e0d8cf' }}>Cancel</button>
              </div>
            )}
          </div>
          {/* Weekly Schedule */}
          <div className="bg-white p-6 rounded-2xl" style={{ border: '1px solid #e0d8cf' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold" style={{ color: '#4a3728' }}>Weekly Schedule</h3>
                            {/* Mini week-pattern strip — clickable to toggle enabled/disabled,
                  AND now shows a ring highlight when its day matches the
                  currently selected calendar date. */}
              <div className="flex items-center gap-1.5">
              {weekSchedule.map((d, idx) => {
                  const isSelectedDay = selectedDayName === d.day;
                  return (
                    <button
                      key={d.day}
                      type="button"
                      title={`${d.day}${d.enabled ? ` · ${d.startTime}–${d.endTime}` : ' · Off'}${isSelectedDay ? ` · Selected on calendar (${selectedDate})` : ''}`}
                      onClick={() =>
                        setWeekSchedule(prev =>
                          prev.map((dd, i) => (i === idx ? { ...dd, enabled: !dd.enabled } : dd))
                        )
                      }
                      className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold transition-all"
                      style={{
                        // ✅ FIX: selected calendar date ka day ab solid dark
                        // block dikhega (jaisa enabled days dikhte hain),
                        // sirf halka ring nahi — chahe wo day enabled ho ya na ho.
                        backgroundColor: isSelectedDay ? '#4a3728' : d.enabled ? '#4a3728' : '#f3ece4',
                        color: isSelectedDay ? '#fff' : d.enabled ? '#fff' : '#a08070',
                        boxShadow: isSelectedDay ? '0 0 0 2px #4a3728, 0 0 0 4px rgba(74,55,40,0.3)' : 'none',
                      }}
                    >
                      {d.day[0]}
                    </button>
                  );
                })}
              </div>
            </div>
            <div
              ref={scheduleListRef}
              className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1"
            >
              {weekSchedule.map((item, idx) => {
                // ✅ FIX: calendar se jo date select hui hai uska weekday —
                // usi row ko dark-highlight karo taaki "kis din ka schedule
                // edit ho raha hai" turant clear ho jaye.
                const isSelectedDay = selectedDayName === item.day;
                return (
                  <div
                  key={item.day}
                  ref={(el) => { dayRowRefs.current[item.day] = el; }}
                  className="flex items-center justify-between p-4 rounded-xl transition-all"
                  style={{
                    border: isSelectedDay ? '2px solid #4a3728' : '1px solid #e0d8cf',
                    backgroundColor: isSelectedDay ? '#f3ece4' : item.enabled ? '#fbf7f3' : '#fafafa',
                    opacity: item.enabled ? 1 : 0.55,
                    boxShadow: isSelectedDay ? '0 0 0 3px rgba(74,55,40,0.12)' : 'none',
                  }}
                >
                                          <span className="text-sm font-bold w-24" style={{ color: '#4a3728' }}>{item.day}</span>
                  <div className="flex items-center gap-3 flex-1 justify-end">
                  <TimeInput
                      value={item.startTime}
                      disabled={!item.enabled}
                      onChange={(v) => setWeekSchedule(prev => prev.map((d, i) => i === idx ? { ...d, startTime: v } : d))}
                    />
                    <span style={{ color: '#8a7a6a' }} className="text-xs font-semibold">to</span>
                    <TimeInput
                      value={item.endTime}
                      disabled={!item.enabled}
                      onChange={(v) => setWeekSchedule(prev => prev.map((d, i) => i === idx ? { ...d, endTime: v } : d))}
                    />
                    {/* Single ON/OFF toggle — ye hi ek button hai, upar wale strip se connected */}
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
                );
              })}
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
                              onClick={() => setConfirmDeleteId(record.availabilityId)}
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
                                                     <TimeInput
                              value={slot.startTime}
                              onChange={(v) => setEditSlots(prev => prev.map((s, i) => i === si ? { ...s, startTime: v } : s))}
                            />
                            <span className="text-sm" style={{ color: '#8a7a6a' }}>→</span>
                            <TimeInput
                              value={slot.endTime}
                              onChange={(v) => setEditSlots(prev => prev.map((s, i) => i === si ? { ...s, endTime: v } : s))}
                            />
                            <button onClick={() => setEditSlots(prev => prev.filter((_, i) => i !== si))}>
                              <X className="w-3.5 h-3.5" style={{ color: '#dc2626' }} />
                            </button>
                          </div>
                        ))}
                                               <button
                          onClick={() => setEditSlots(prev => {
                            // Naya slot last slot ke endTime se shuru hota hai
                            // (fixed 09:00 se nahi) — isse accidental duplicate
                            // ya overlapping slot add hone ka chance kam ho jaata hai.
                            const toHHMM = (mins: number) =>
                              `${String(Math.floor((mins % 1440) / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
                            const last = prev[prev.length - 1];
                            if (!last) return [...prev, { startTime: "09:00", endTime: "09:30" }];
                            const [h, m] = last.endTime.split(":").map(Number);
                            const start = h * 60 + m;
                            return [...prev, { startTime: toHHMM(start), endTime: toHHMM(start + 30) }];
                          })}
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
              {blockedDateList.length === 0 ? (
                <p className="text-sm text-center py-3" style={{ color: '#8a7a6a' }}>No blocked dates yet.</p>
              ) : (
                blockedDateList.map((item) => (
                  <div key={item.availabilityId} className="p-2.5 rounded-lg flex items-center justify-between text-sm" style={{ backgroundColor: '#fbf7f3', border: '1px solid #e0d8cf' }}>
                    <span style={{ color: '#8a7a6a' }}>{item.date}</span>
                    <button
                      onClick={() => removeBlockedDate(item.availabilityId)}
                      disabled={blockActionId === item.availabilityId}
                      className="disabled:opacity-50"
                      title="Unblock this date"
                    >
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

           {/* Custom Delete Confirm Modal — Image 2 jaisa */}
           {confirmDeleteId && (
        <div
          className="fixed left-0 right-0 bottom-0 z-[300] flex items-center justify-center p-4"
          style={{ top: "-20px", backgroundColor: "rgba(74,55,40,0.45)", backdropFilter: "blur(4px)" }}
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl p-6"
            style={{ backgroundColor: "#fff", boxShadow: "0 24px 60px rgba(74,55,40,0.22)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setConfirmDeleteId(null)}
              className="absolute top-4 right-4 text-sm"
              style={{ color: "#8a7a6a" }}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#fee2e2" }}
              >
                <Trash2 className="w-5 h-5" style={{ color: "#dc2626" }} />
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: "#4a3728" }}>
                  Delete availability?
                </h3>
              </div>
            </div>

            <p className="text-sm mb-6" style={{ color: "#8a7a6a" }}>
              Are you sure you want to delete this availability permanently? This cannot be undone.
            </p>

            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: "#fbf7f3", color: "#4a3728", border: "1px solid #e0d8cf" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deletingId === confirmDeleteId}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-60"
                style={{ backgroundColor: "#dc2626" }}
              >
                {deletingId === confirmDeleteId ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}