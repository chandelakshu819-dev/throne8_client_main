// mentorDashboard/components/AvailabilityPage.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import {
  Clock, Globe, Calendar, ChevronLeft, ChevronRight,
  Trash2, Plus, X, BarChart2, RefreshCw, Pencil, Check, Lock, Ban
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
      const parsed = Number(mentorData.availability.slotDuration);
      if (!isNaN(parsed) && parsed > 0) {
        setSlotDuration(parsed);
      }
    }
  }, [mentorData?.availability?.slotDuration]);

  // ✅ FIX: Parent (jo mentorData hold karta hai) backend-sync ke baad
  // mentorData ko refetch nahi karta, isliye upar wala useEffect kabhi
  // fire nahi hota. ServicesPage se aane wale custom event ko sunkar
  // slotDuration ko turant, live update karo — bina page refresh ke.
  useEffect(() => {
    const handler = (e: Event) => {
      const parsed = Number((e as CustomEvent).detail);
      if (!isNaN(parsed) && parsed > 0) {
        setSlotDuration(parsed);
      }
    };
    window.addEventListener("mentorSlotDurationUpdated", handler);
    return () => window.removeEventListener("mentorSlotDurationUpdated", handler);
  }, []);
  const [bufferTime, setBufferTime] = useState(0);
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [freeTrialEnabled, setFreeTrialEnabled] = useState(false);


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
      // ✅ NEW: ab har din ek single time-range ki jagah timeRanges[] rakhta
      // hai, taaki "+" button se ek din me multiple slot-blocks (subah +
      // shaam) add kiye ja sakein.
      const DEFAULT_WEEK_SCHEDULE = ALL_DAYS.map(day => ({
        day,
        enabled: ["Saturday", "Sunday"].indexOf(day) === -1,
        // ✅ NEW: har range ab apni khud ki `duration` rakhta hai
        // (15/30/45/60 min) — ek hi global slotDuration sabhi
        // din/ranges par force nahi hoga.
        timeRanges: [{ startTime: "09:00", endTime: "17:00", duration: slotDuration }],
      }));

      // ✅ FIX: purane localStorage data me sirf startTime/endTime hota
      // tha (naya format timeRanges[] use karta hai) — isse purana saved
      // data load karte waqt crash na ho, auto-migrate karo.
      const normalizeWeekSchedule = (data: any[]) =>
        (data || []).map((d: any) => ({
          day: d.day,
          enabled: d.enabled,
          timeRanges: (Array.isArray(d.timeRanges) && d.timeRanges.length > 0
            ? d.timeRanges
            : [{ startTime: d.startTime || "09:00", endTime: d.endTime || "17:00" }]
          // ✅ FIX: purane saved records me `duration` field nahi hogi —
          // global slotDuration se fallback bana do taaki crash na ho.
          ).map((r: any) => ({ ...r, duration: r.duration || slotDuration })),
        }));
   
           // ✅ FIX: ab backend ka poora `weeklySchedule` (per-day, multi-range)
      // priority se use hota hai — pehle sirf simple daysAvailable[] +
      // ek single preferredHours use hota tha, jisme multi-day custom
      // time ya ek din ke multiple ranges store hi nahi ho sakte the.
      // Purane mentors ke liye (jinke paas abhi weeklySchedule nahi hai)
      // simple format se fallback banaya jaata hai, taaki backward-compat
      // bana rahe.
      const buildScheduleFromBackend = () => {
        const backendSchedule = mentorData?.availability?.weeklySchedule;
        if (Array.isArray(backendSchedule) && backendSchedule.length > 0) {
          return normalizeWeekSchedule(backendSchedule);
        }

        const daysAvailable: string[] | undefined = mentorData?.availability?.daysAvailable;
        if (!daysAvailable || daysAvailable.length === 0) return null;
        const start = mentorData?.availability?.preferredHours?.start || "09:00";
        const end = mentorData?.availability?.preferredHours?.end || "17:00";
        return ALL_DAYS.map(day => ({
          day,
          enabled: daysAvailable.includes(day.toLowerCase()),
          timeRanges: [{ startTime: start, endTime: end }],
        }));
      };
   
      const [weekSchedule, setWeekSchedule] = useState(() => {
        const fromBackend = buildScheduleFromBackend();
        if (fromBackend) return fromBackend;
        if (typeof window === "undefined") return DEFAULT_WEEK_SCHEDULE;
        try {
          const saved = localStorage.getItem("mentor_weekSchedule");
          return saved ? normalizeWeekSchedule(JSON.parse(saved)) : DEFAULT_WEEK_SCHEDULE;
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
        const baseRange = base?.timeRanges?.[0] || { startTime: "09:00", endTime: "17:00" };
  
        import("@/lib/api/mentorship.service").then(({ default: MentorService }) => {
          MentorService.updateMentorAvailability(mentorData.mentorId, {
            timezone,
            daysAvailable: enabledDays,
            preferredHours: { start: baseRange.startTime, end: baseRange.endTime },
            bufferBetweenSessions: bufferTime,
            // ✅ NEW: poora per-day/multi-range data backend me save ho
            // raha hai ab — daysAvailable/preferredHours sirf legacy/
            // backward-compat ke liye bhej rahe hain, asli data ye hai.
            weeklySchedule: weekSchedule,
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
    // ✅ FIX: ab poore timeRanges[] (multiple blocks bhi) copy hote hain,
    // sirf ek startTime/endTime nahi — deep clone taaki reference shared na ho.
    setWeekSchedule(prev => prev.map(d => ({
      ...d,
      timeRanges: mon.timeRanges.map((r: any) => ({ ...r })),
    })));
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

    // ✅ NEW: jo date calendar se select hui hai, uska existing availability
    // record (agar DB me pehle se hai) yahan nikal lete hain — isi se pata
    // chalega ki button "naya banayega" ya "purane ko edit karega".
    const existingRecordForSelectedDate = useMemo(() => {
      if (selectedDate === null) return null;
      const y = currentDate.getFullYear();
      const m = String(currentDate.getMonth() + 1).padStart(2, "0");
      const dd = String(selectedDate).padStart(2, "0");
      return (
        existingAvailability.find(
          (rec) => rec.date.substring(0, 10) === `${y}-${m}-${dd}`
        ) || null
      );
    }, [selectedDate, currentDate, existingAvailability]);


        // ✅ REMOVED: busySlotsForSelectedDate ab kahin use nahi ho raha
    // (mode badge hata diya gaya), isliye ye memo bhi hata diya.




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
      // ✅ FIX: toMin ab function ke top-level pe hai — pehle sirf single-date
      // (if) branch ke andar define tha, isliye "Save Month" (bulk/else branch)
      // click karte hi "toMin is not defined" error se silently fail ho jaata
      // tha jab koi calendar date select nahi ki gayi hoti thi.
      const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
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
          const invalidRange = (daySched.timeRanges || []).find((r: any) => toMin(r.endTime) <= toMin(r.startTime));
        if (invalidRange) {
          setSaveMessage({
            type: "error",
            text: `Invalid range ${invalidRange.startTime}-${invalidRange.endTime} on ${dayName}: end time must be after start time on the same day (overnight ranges aren't supported).`,
          });
          return;
        }
        const slots = (daySched.timeRanges || []).flatMap((r: any) =>
          generateSlots(r.startTime, r.endTime, toMin(r.endTime) - toMin(r.startTime), bufferTime)
        );
        if (slots.length === 0) {
          setSaveMessage({
            type: "error",
            text: `No slots generated for ${dayName}. Duration=${slotDuration}min, range=${(daySched.timeRanges||[]).map((r:any)=>`${r.startTime}-${r.endTime}`).join(', ')}.`,
          });
          return;
        }

        const y = currentDate.getFullYear();
        const m = String(currentDate.getMonth() + 1).padStart(2, "0");
        const dd = String(selectedDate).padStart(2, "0");

        // ✅ FIX: pehle ye hamesha createAvailability() call karta tha —
        // agar us date ke liye availability PEHLE SE DB me thi (jaisa
        // Tuesday 22 September ke saath ho raha tha, jisme purane 18
        // slots the), to backend ConflictError deta tha aur Weekly
        // Schedule me set kiya gaya naya time kabhi save hi nahi hota
        // tha — Saved Availability list purana data hi dikhati rehti thi.
        // Ab pehle check karte hain ki us date ka record existingAvailability
        // me already hai ya nahi:
        //   - hai → updateAvailability(availabilityId, { slots }) — replace
        //   - nahi → createAvailability(...) — naya banao
        const existingRecord = existingAvailability.find(
          (rec) => rec.date.substring(0, 10) === `${y}-${m}-${dd}`
        );

        if (existingRecord) {
          await AvailabilityService.updateAvailability(existingRecord.availabilityId, { slots });
          setSaveMessage({ type: "success", text: `Updated for ${date.toDateString()} (${slots.length} slots)` });
        } else {
          await AvailabilityService.createAvailability({
            mentorId: mentorData.mentorId,
            date: `${y}-${m}-${dd}`,
            slots, timezone, isRecurring: false,
          });
          setSaveMessage({ type: "success", text: `Created for ${date.toDateString()} (${slots.length} slots)` });
        }
      } else {
        const enabledDaySchedules = weekSchedule.filter(d => d.enabled);
        if (enabledDaySchedules.length === 0) {
          setSaveMessage({ type: "error", text: "Enable at least one day." });
          return;
        }
        const y = currentDate.getFullYear();
        const m = String(currentDate.getMonth() + 1).padStart(2, "0");
        const lastDay = new Date(y, currentDate.getMonth() + 1, 0).getDate();

                // ✅ FIX: purana bulkCreateAvailability API sirf 1 time-range/day
        // support karta tha, isliye ek din ke multiple ranges (subah +
        // shaam) "Save Full Month" me kabhi save hi nahi hote the — sirf
        // pehla range jaata tha. Ab poore mahine ki har date ke liye us
        // din ke SAARE ranges se slots generate karke alag-alag
        // create/update call hoti hai (single-day mode ki tarah).
        //
        // ✅ FIX #2: agar us date ke liye availability PEHLE SE DB me hai
        // (jaise purane 09:00-17:00 wale records), to backend ka
        // createAvailability() ConflictError deta hai aur silently fail ho
        // jaata tha — Weekly Schedule me jo naya time set kiya wo kabhi
        // save hi nahi hota tha. Ab pehle check karte hain ki us date ka
        // record already existingAvailability me hai ya nahi:
        //   - hai → updateAvailability(availabilityId, { slots }) — replace
        //   - nahi → createAvailability(...) — naya banao
        const dayNameToSchedule = new Map(enabledDaySchedules.map((d: any) => [d.day, d]));

        // date (day-of-month) -> existing record, taaki O(1) me pata chale
        // ki us din ka data already DB me hai ya nahi
        const existingRecordByDay = new Map<number, AvailabilityRecord>();
        existingAvailability.forEach((rec) => {
          const day = parseInt(rec.date.substring(8, 10), 10);
          existingRecordByDay.set(day, rec);
        });

        const tasks: Promise<any>[] = [];
        let datesQueued = 0;

        for (let day = 1; day <= lastDay; day++) {
          const dateObj = new Date(y, currentDate.getMonth(), day);
          const weekday = dateObj.toLocaleDateString("en-US", { weekday: "long" });
          const sched: any = dayNameToSchedule.get(weekday);
          if (!sched) continue;

          const slots = (sched.timeRanges || []).flatMap((r: any) =>
            generateSlots(r.startTime, r.endTime, toMin(r.endTime) - toMin(r.startTime), bufferTime)
          );


          if (slots.length === 0) continue;

          datesQueued++;
          const existingRecord = existingRecordByDay.get(day);

          if (existingRecord) {
            // Date already saved — replace its slots instead of creating.
            tasks.push(
              AvailabilityService.updateAvailability(existingRecord.availabilityId, { slots })
                .catch((err: any) => ({ __failed: true, message: err.message }))
            );
          } else {
            const dd = String(day).padStart(2, "0");
            tasks.push(
              AvailabilityService.createAvailability({
                mentorId: mentorData.mentorId,
                date: `${y}-${m}-${dd}`,
                slots, timezone, isRecurring: false,
              }).catch((err: any) => ({ __failed: true, message: err.message }))
            );
          }
        }

        const results = await Promise.all(tasks);
        const failed = results.filter((r: any) => r?.__failed).length;
        setSaveMessage({
          type: failed > 0 ? "error" : "success",
          text: `Bulk: ${datesQueued - failed} saved, ${failed} failed`,
        });
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
    // ✅ FIX: native <select> ka OS/browser dropdown yahan bohot lamba
    // render ho raha tha aur layout todta tha (screenshot me dikha) —
    // ab apna chhota, scrollable, controlled list use karenge, isliye
    // in dono ka open/close state alag se track karna hoga.
    const [hourListOpen, setHourListOpen] = useState(false);
    const [minuteListOpen, setMinuteListOpen] = useState(false);
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

    // Whole time-popup band hote hi hour/minute ki chhoti lists bhi band kar do
    useEffect(() => {
      if (!open) {
        setHourListOpen(false);
        setMinuteListOpen(false);
      }
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
                      {/* Hour picker — custom scrollable list instead of native <select>
                (native select rendered a huge unstyled OS dropdown that broke
                the layout). Fixed-height panel with its own scrollbar. */}
            <div className="relative">
              <button
                type="button"
                onClick={() => { setHourListOpen(v => !v); setMinuteListOpen(false); }}
                className="px-2 py-1.5 rounded-lg outline-none text-sm font-semibold w-12 text-center"
                style={{ border: '1px solid #e0d8cf', backgroundColor: '#fbf7f3', color: '#4a3728' }}
              >
                {String(hour12).padStart(2, "0")}
              </button>
              {hourListOpen && (
                <div
                  className="absolute z-50 mt-1 rounded-lg shadow-lg overflow-y-auto"
                  style={{ border: '1px solid #e0d8cf', backgroundColor: '#fff', maxHeight: '160px', width: '56px' }}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => { updateHour(h); setHourListOpen(false); }}
                      className="block w-full text-center px-2 py-1.5 text-sm font-semibold"
                      style={{
                        backgroundColor: h === hour12 ? '#4a3728' : 'transparent',
                        color: h === hour12 ? '#fff' : '#4a3728',
                      }}
                    >
                      {String(h).padStart(2, "0")}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className="text-sm font-bold" style={{ color: '#8a7a6a' }}>:</span>

            {/* Minute picker — same custom scrollable list, 1-min steps */}
            <div className="relative">
              <button
                type="button"
                onClick={() => { setMinuteListOpen(v => !v); setHourListOpen(false); }}
                className="px-2 py-1.5 rounded-lg outline-none text-sm font-semibold w-12 text-center"
                style={{ border: '1px solid #e0d8cf', backgroundColor: '#fbf7f3', color: '#4a3728' }}
              >
                {String(minute).padStart(2, "0")}
              </button>
              {minuteListOpen && (
                <div
                  className="absolute z-50 mt-1 rounded-lg shadow-lg overflow-y-auto"
                  style={{ border: '1px solid #e0d8cf', backgroundColor: '#fff', maxHeight: '160px', width: '56px' }}
                >
                  {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { updateMinute(m); setMinuteListOpen(false); }}
                      className="block w-full text-center px-2 py-1.5 text-sm font-semibold"
                      style={{
                        backgroundColor: m === minute ? '#4a3728' : 'transparent',
                        color: m === minute ? '#fff' : '#4a3728',
                      }}
                    >
                      {String(m).padStart(2, "0")}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
        

          {/* Weekly Schedule */}
          <div className="bg-white p-6 rounded-2xl" style={{ border: '1px solid #e0d8cf' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold" style={{ color: '#4a3728' }}>Weekly Schedule</h3>
                            {/* Mini week-pattern strip — clickable to toggle enabled/disabled,
                  AND now shows a ring highlight when its day matches the
                  currently selected calendar date. */}

                            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
              {weekSchedule.map((d, idx) => {
                  const isSelectedDay = selectedDayName === d.day;
                  return (
                    <button
                      key={d.day}
                      type="button"
                      title={`${d.day}${d.enabled ? ` · ${d.timeRanges?.[0]?.startTime}–${d.timeRanges?.[0]?.endTime}${d.timeRanges?.length > 1 ? ` +${d.timeRanges.length - 1} more` : ''}` : ' · Off'}${isSelectedDay ? ` · Selected on calendar (${selectedDate})` : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setWeekSchedule(prev =>
                          prev.map((dd, i) => (i === idx ? { ...dd, enabled: !dd.enabled } : dd))
                        );
                      }}
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

              {/* Save button — ab strip ke bilkul side mein */}
              <button
                type="button"
                onClick={handleSaveAvailability}
                // ✅ FIX: date select kiye bina button disable rahega —
                // pehle "Save Month" (bulk save) hamesha enabled tha, jisse
                // mentor galti se poore mahine ke liye save kar deti thi
                // bina specific date pe click kiye.
                disabled={isSaving || selectedDate === null}
                title={
                  selectedDate === null
                    ? "Select a date on the calendar first"
                    : `Save availability for ${selectedDate} ${monthNames[currentDate.getMonth()]}`
                }
                className="px-3.5 py-1.5 rounded-lg text-white text-xs font-bold flex items-center gap-1.5 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90"
                style={{ backgroundColor: '#4a3728' }}
              >
                                    <Check className="w-3.5 h-3.5" />
                {isSaving
                  ? "Saving..."
                  : selectedDate
                  ? `${existingRecordForSelectedDate ? "Update" : "Save"} ${selectedDate} ${monthNames[currentDate.getMonth()].slice(0, 3)}`
                  : "Select a date"}
              </button>
              </div>
            </div>
                        {/* ✅ FIX: max-h + overflow-y-auto hata diya — ab list static
                hai, page ke saath hi naturally expand hoti hai, koi
                internal scrollbar nahi. */}
            <div
              ref={scheduleListRef}
              className="space-y-2.5 pr-1"
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
                  className="p-4 rounded-xl transition-all"
                  style={{
                    border: isSelectedDay ? '2px solid #4a3728' : '1px solid #e0d8cf',
                    backgroundColor: isSelectedDay ? '#f3ece4' : item.enabled ? '#fbf7f3' : '#fafafa',
                    boxShadow: isSelectedDay ? '0 0 0 3px rgba(74,55,40,0.12)' : 'none',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold w-24" style={{ color: '#4a3728' }}>{item.day}</span>
                    <span
                      className="text-[11px] font-semibold"
                      style={{ color: item.enabled ? '#15803d' : '#a08070' }}
                    >
                      {item.enabled ? 'Available' : 'Not available'}
                    </span>
                  </div>

                  {/* ✅ NEW: ab har din multiple time-ranges rakh sakta hai —
                      "+" se naya range (e.g. subah + shaam) add karo,
                      "x" se extra range hatao (pehla range hamesha rahega,
                      wo delete nahi hota). */}
                  <div className="flex flex-col gap-2 mt-3">
                    {item.timeRanges.map((range: any, rIdx: number) => (
                      <div key={rIdx} className="flex items-center gap-2 justify-end">
                        <TimeInput
                          value={range.startTime}
                          disabled={!item.enabled}
                          onChange={(v) => setWeekSchedule(prev => prev.map((d, i) =>
                            i === idx
                              ? { ...d, timeRanges: d.timeRanges.map((r: any, ri: number) => ri === rIdx ? { ...r, startTime: v } : r) }
                              : d
                          ))}
                        />
                                               <span style={{ color: '#8a7a6a' }} className="text-xs font-semibold">to</span>
                        <TimeInput
                          value={range.endTime}
                          disabled={!item.enabled}
                          onChange={(v) => setWeekSchedule(prev => prev.map((d, i) =>
                            i === idx
                              ? { ...d, timeRanges: d.timeRanges.map((r: any, ri: number) => ri === rIdx ? { ...r, endTime: v } : r) }
                              : d
                          ))}
                        />

                      

                                               {/* Action cell: pehli row par "+", baaki rows par "x".
                                                Har row mein ye cell same jagah par rehta hai, isliye
                            saari rows seedhi line mein aati hain. */}
                        {rIdx === 0 ? (
                                                 <button
                                                 type="button"
                                                 disabled={!item.enabled}
                                                 onClick={() => setWeekSchedule(prev => prev.map((d, i) => {
                                                   if (i !== idx) return d;
                                                   const lastRange = d.timeRanges[d.timeRanges.length - 1];
                                                   const start = lastRange?.endTime || "09:00";
                                                   // ✅ FIX: end ko sirf start ke barabar nahi, balki
                                                   // kam se kam slotDuration jitna aage rakho, aur
                                                   // agar wo midnight cross kare to 23:59 pe cap karo
                                                   // (overnight ranges is calendar model me valid
                                                   // nahi hain — same-din ke andar hi range hona chahiye).
                                                   const [sh, sm] = start.split(":").map(Number);
                                                   let endMinutes = sh * 60 + sm + slotDuration;
                                                   if (endMinutes > 23 * 60 + 59) endMinutes = 23 * 60 + 59;
                                                   const end = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
                                                   return { ...d, timeRanges: [...d.timeRanges, { startTime: start, endTime: end, duration: slotDuration }] };
                                                 }))}
                            className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 hover:bg-[#f3ece4] disabled:opacity-40 transition-colors"
                            style={{ border: '1px solid #e0d8cf' }}
                            title="Add another time range for this day"
                          >
                            <Plus className="w-3.5 h-3.5" style={{ color: '#7a5c3e' }} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={!item.enabled}
                            onClick={() => setWeekSchedule(prev => prev.map((d, i) =>
                              i === idx
                                ? { ...d, timeRanges: d.timeRanges.filter((_: any, ri: number) => ri !== rIdx) }
                                : d
                            ))}
                            className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 hover:bg-[#fee2e2] disabled:opacity-40 transition-colors"
                            title="Delete this time range"
                            >
                              <Trash2 className="w-3.5 h-3.5" style={{ color: '#dc2626' }} />
                            </button>
                        )}

                        {/* Toggle cell: pehli row par ON/OFF switch, baaki rows par khaali jagah.
                            Inline styles hain, isliye Tailwind classes par depend nahi karta. */}
                        {rIdx === 0 ? (
                          <button
                            type="button"
                            role="switch"
                            aria-checked={item.enabled}
                            title={item.enabled ? 'Available — click to turn off' : 'Not available — click to turn on'}
                            onClick={(e) => {
                              e.stopPropagation();
                              setWeekSchedule(prev => prev.map((d, i) =>
                                i === idx ? { ...d, enabled: !d.enabled } : d
                              ));
                            }}
                            style={{
                              position: 'relative',
                              width: 40,
                              height: 22,
                              borderRadius: 9999,
                              border: 'none',
                              padding: 0,
                              flexShrink: 0,
                              cursor: 'pointer',
                              backgroundColor: item.enabled ? '#4a3728' : '#d8cec4',
                              transition: 'background-color 0.2s',
                            }}
                          >
                            <span
                              style={{
                                position: 'absolute',
                                top: 2,
                                left: item.enabled ? 20 : 2,
                                width: 18,
                                  height: 18,
                                borderRadius: '50%',
                                backgroundColor: '#fff',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                                transition: 'left 0.2s',
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

                                            {/* ✅ REMOVED: mode badge + busy-slot warning box hata diya gaya —
                mentor ke liye ye visually clutter/confusing tha, calendar ke
                upar dikhta tha. Selected-date info ab sirf Save button ke
                label ("Update 26 Sep" / "Save 26 Sep") se hi pata chalega. */}


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
            {!showBlockDateInput ? (
              <button
                onClick={() => setShowBlockDateInput(true)}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#4a3728' }}
              >
                <Plus className="w-4 h-4" /> Add Blocked Date
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <input
                  type="date"
                  value={newBlockDate}
                  onChange={e => setNewBlockDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg outline-none text-sm font-semibold"
                  style={{ border: '1px solid #e0d8cf', backgroundColor: '#fbf7f3', color: '#4a3728' }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={addBlockedDate}
                    disabled={!!blockActionId || !newBlockDate}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                    style={{ backgroundColor: '#4a3728' }}
                  >
                    {blockActionId ? "Blocking..." : "Confirm Block"}
                  </button>
                  <button
                    onClick={() => { setShowBlockDateInput(false); setNewBlockDate(""); }}
                    className="px-3.5 py-2 rounded-lg text-sm font-semibold"
                    style={{ backgroundColor: '#fbf7f3', color: '#7a5c3e', border: '1px solid #e0d8cf' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
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