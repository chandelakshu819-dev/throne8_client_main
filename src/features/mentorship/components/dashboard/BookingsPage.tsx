//src/features/mentorship/components/dashboard/BookingsPage.tsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  Calendar,
  Clock,
  CheckCircle2,
  Search,
  Eye,
  Users,
  Download,
  Play,
  RotateCw,
  XCircle,
  Check,
  X,
  Loader2,
  History,
} from "lucide-react";
import SessionService from "@/lib/api/session.service";
import ProfileService from "@/lib/api/profile.service";
import AuthService from "@/lib/api/auth.service";
import { useSocket } from "@/core/realtime/useSocket";
import MenteeLink from "@/features/mentorship/components/shared/MenteeLink";
import { getSessionTiming } from "@/features/mentorship/utils/sessionJoin";

interface BookingProps {
  mentorData: any;
}

// A single accepted participant inside a grouped group-session row.
type GroupParticipant = {
  menteeId: string;
  menteeName: string;
  menteeProfilePhoto: string | null;
  attendanceStatus: "registered" | "attended" | "absent" | "cancelled" | string;
  registeredAt?: string;
};

type MentorBookingRow = {
  bookingId: string;
  sessionId: string;
  menteeId?: string;
  menteeName: string;
  menteeProfilePhoto: string | null;
  serviceName: string;
  scheduledAt: string;
  slotTime: string;
  // distinguishes a 1:1 booking row from a group-session row (both a
  // still-PENDING join request and an already-ACCEPTED, grouped session)
  isGroupSession?: boolean;
  status:
  | "pending"
  | "confirmed"
  | "rescheduled"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "open"
  | "full"
  | "missed";
  // Present only on grouped (accepted) group-session rows: one row per
  // session, carrying the full accepted-participant list instead of the
  // table spawning a duplicate row per student.
  enrolledCount?: number;
  maxParticipants?: number;
  participants?: GroupParticipant[];
  isTemplate?: boolean;
  meetingUrl?: string;
  startedAt?: string | Date;
  endedAt?: string | Date;
  duration?: number;
  durationMinutes?: number;
  actualDuration?: number;
};

type BookingTab =
  | "all"
  | "pending"
  | "upcoming"
  | "in_progress"
  | "completed"
  | "missed"
  | "history";

const tabMeta: Record<
  BookingTab,
  { label: string; icon: React.ElementType }
> = {
  all: { label: "All Active", icon: Clock },
  pending: { label: "Pending", icon: Clock },
  upcoming: { label: "Upcoming", icon: Calendar },
  in_progress: { label: "In Progress", icon: Play },
  completed: { label: "Completed", icon: CheckCircle2 },
  missed: { label: "Missed", icon: XCircle },
  history: { label: "History", icon: History },
};

const statPalette: Record<string, { bg: string; fg: string }> = {
  amber: { bg: "#fef3c7", fg: "#b45309" },
  green: { bg: "#dcfce7", fg: "#15803d" },
  blue: { bg: "#dbeafe", fg: "#1d4ed8" },
  purple: { bg: "#f3e8ff", fg: "#7c3aed" },
};

const statusBadge: Record<
  string,
  { bg: string; fg: string; label: string }
> = {
  rescheduled: { bg: "#fed7aa", fg: "#c2410c", label: "Rescheduled" },
  pending: { bg: "#fef3c7", fg: "#b45309", label: "Pending" },
  confirmed: { bg: "#dcfce7", fg: "#15803d", label: "Upcoming" },
  open: { bg: "#dcfce7", fg: "#15803d", label: "Open" },
  full: { bg: "#fef3c7", fg: "#b45309", label: "Full" },
  in_progress: { bg: "#dbeafe", fg: "#1d4ed8", label: "In Progress" },
  completed: { bg: "#f3e8ff", fg: "#7c3aed", label: "Completed" },
  cancelled: { bg: "#fee2e2", fg: "#dc2626", label: "Cancelled" },
  // DB me abhi bhi in_progress, par scheduled time nikal chuka (mentor ne End Session nahi dabaya)
  ended: { bg: "#fed7aa", fg: "#c2410c", label: "Ended" },
  // Kabhi start nahi hua aur slot ka time nikal chuka
  missed: { bg: "#f3f4f6", fg: "#6b7280", label: "Missed" },
};


const ENDED_GRACE_MINUTES = 15;
const START_LATE_LIMIT_MINUTES = 15; // server: START_LATE_LIMIT_MS
const DEFAULT_SESSION_MINUTES = 60;
const DEFAULT_GROUP_SESSION_MINUTES = 120;

const slotToMinutes = (t: string): number | null => {
  const m = t.trim().match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
  return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null;
};

// Row ka scheduled end time (ms). 1:1 rows me length slotTime ("HH:mm - HH:mm") se aati hai.
const getRowEndMs = (b: MentorBookingRow): number | null => {
  if (!b.scheduledAt) return null;
  const startMs = new Date(b.scheduledAt).getTime();
  if (Number.isNaN(startMs)) return null;

  let minutes = b.isGroupSession ? DEFAULT_GROUP_SESSION_MINUTES : DEFAULT_SESSION_MINUTES;
  const parts = String(b.slotTime || "").split("-");
  if (parts.length === 2) {
    const s = slotToMinutes(parts[0]);
    const e = slotToMinutes(parts[1]);
    if (s !== null && e !== null && e > s) minutes = e - s;
  }
  return startMs + minutes * 60000;
};

type EffectiveStatus =
  | "pending"
  | "upcoming"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "missed"
  | "ended"; // slot ka time nikal gaya, mentor ne End nahi dabaya, backend ka faisla baaki

// Ek hi jagah decide hota hai ki row asal me kis haal me hai (DB status + current time).
// Saare tabs, badges aur buttons isi se chalte hain, isliye "Ended + End Session" jaisa confusion nahi hoga.
const getEffectiveStatus = (b: MentorBookingRow, nowMs: number): EffectiveStatus => {
  if (b.status === "completed") return "completed";
  if (b.status === "cancelled") return "cancelled";
  if (b.status === "missed") return "missed";

  const endMs = b.isTemplate ? null : getRowEndMs(b);
  const startMs = b.scheduledAt ? new Date(b.scheduledAt).getTime() : NaN;
  // 1:1: mentor start+15 min ke baad Start nahi kar sakta -> missed. Group: slot end tak.
  const timeOver = b.isGroupSession
    ? endMs !== null && nowMs > endMs
    : !b.isTemplate && !Number.isNaN(startMs) && nowMs > startMs + START_LATE_LIMIT_MINUTES * 60000;



    if (b.status === "in_progress") {
      // Slot chal raha hai -> In Progress. Slot khatam par mentor ne End nahi dabaya -> Ended.
      // completed / no_show ka faisla sirf backend karta hai, frontend nahi.
      return endMs !== null && nowMs >= endMs ? "ended" : "in_progress";
    }

  // Pending request slot start par hi expire (accept sirf start time tak)
  if (b.status === "pending") {
    const pendingExpired = !b.isTemplate && !Number.isNaN(startMs) && nowMs >= startMs;
    return b.isGroupSession ? (timeOver ? "missed" : "pending") : pendingExpired ? "missed" : "pending";
  }
  // confirmed / rescheduled / open / full
  return timeOver ? "missed" : "upcoming";
};

const PAGE_SIZE = 20;

const timeOf = (b: MentorBookingRow): number => {
  const t = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
  return Number.isNaN(t) ? 0 : t;
};
const byNearestFirst = (a: MentorBookingRow, b: MentorBookingRow) => timeOf(a) - timeOf(b);
const byLatestFirst = (a: MentorBookingRow, b: MentorBookingRow) => timeOf(b) - timeOf(a);

// ── Mentee photo helpers ────────────────────────────────────
// Server kabhi full URL bhejta hai, kabhi photoId, kabhi kuch nahi.
// Teeno cases yahan handle hote hain.
const isHttpUrl = (v: unknown): v is string => typeof v === "string" && /^https?:\/\//i.test(v.trim());

// Mentee ke user/profile object se direct photo URL nikalo (mentee profile page jaisa logic)
const pickDirectPhotoUrl = (userData: any): string | null => {
  const candidates = [
    userData?.profilePhotoUrl,
    userData?.profilePic,
    userData?.profilePhoto?.cloudinarySecureUrl,
    userData?.avatar?.url,
    typeof userData?.avatar === "string" ? userData.avatar : "",
    userData?.photoUrl,
    userData?.image,
  ];
  for (const c of candidates) {
    if (isHttpUrl(c)) return c.trim();
  }
  return null;
};

const resolveMenteePhoto = async (menteeId: string, hint: string | null): Promise<string | null> => {
  // 1. Server ne seedha URL diya
  if (isHttpUrl(hint)) return hint.trim();

  // 2. Server ne photoId diya
  if (hint) {
    try {
      const res: any = await ProfileService.getProfilePhotoById(hint);
      const url = res?.data?.photo?.cloudinarySecureUrl;
      if (isHttpUrl(url)) return url;
    } catch {
      // fallback neeche
    }
  }

  // 3. Kuch nahi mila: mentee ke profile se lao
  try {
    const profileRes: any = await AuthService.getUserProfileById(menteeId);
    const rawData = profileRes?.data ?? profileRes;
    const userData = rawData?.user || rawData?.data || rawData;

    const direct = pickDirectPhotoUrl(userData);
    if (direct) return direct;

    if (userData?.profilePhotoId) {
      const photoRes: any = await ProfileService.getProfilePhotoById(userData.profilePhotoId);
      const url = photoRes?.data?.photo?.cloudinarySecureUrl;
      if (isHttpUrl(url)) return url;
    }
  } catch {
    // photo nahi mili: initials dikhte rahenge
  }
  return null;
};

export default function BookingsPage({ mentorData }: BookingProps) {
  const router = useRouter();

  const [bookingTab, setBookingTab] = useState<BookingTab>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Har minute "ended" rows dobara evaluate ho (page khula rahe tab bhi)
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);
  const [allBookings, setAllBookings] = useState<MentorBookingRow[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  // Jin mentees ki photo resolve karne ki koshish ho chuki hai (dobara network call na ho)
  const attemptedPhotoIds = useRef<Set<string>>(new Set());
  const [loadingData, setLoadingData] = useState(true);
  type BookingActionType = "accept" | "reject" | "start" | "end" | "reschedule";
  const [rowActionsLoading, setRowActionsLoading] = useState<Record<string, BookingActionType>>({});

  const setRowAction = (key: string, action: BookingActionType | null) => {
    setRowActionsLoading((prev) => {
      if (!action) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: action };
    });
  };

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => setToast({ message, type });
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Search
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Cancel / Reject modal (cancelling a confirmed session, declining a
  // pending group join request, or cancelling a whole group session)
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelSessionId, setCancelSessionId] = useState<string | null>(null);
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  // Reschedule modal
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleSessionId, setRescheduleSessionId] = useState<string | null>(null);
  const [rescheduleBookingId, setRescheduleBookingId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");

  // Start Session modal
  const [showStartModal, setShowStartModal] = useState(false);
  const [startModalBooking, setStartModalBooking] = useState<MentorBookingRow | null>(null);
  const [startError, setStartError] = useState<string | null>(null);

  // Details modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsBooking, setDetailsBooking] = useState<MentorBookingRow | null>(null);

  // Participants modal: "View Participants" on a grouped group session row.
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [participantsModalTitle, setParticipantsModalTitle] = useState("");
  const [participantsModalList, setParticipantsModalList] = useState<GroupParticipant[]>([]);

  const openParticipantsModal = (booking: MentorBookingRow) => {
    setParticipantsModalTitle(booking.serviceName);
    setParticipantsModalList(booking.participants || []);
    setShowParticipantsModal(true);
  };

  // Attendance modal: shown before completing a group session so the
  // mentor can mark who actually attended, instead of everyone being
  // silently marked "attended".
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceBooking, setAttendanceBooking] = useState<MentorBookingRow | null>(null);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({});

  const openAttendanceModal = (booking: MentorBookingRow) => {
    const initial: Record<string, boolean> = {};
    (booking.participants || []).forEach((p) => {
      initial[p.menteeId] = true; // default: attended
    });
    setAttendanceMap(initial);
    setAttendanceBooking(booking);
    setShowAttendanceModal(true);
  };

  const toggleAttendance = (menteeId: string) => {
    setAttendanceMap((prev) => ({ ...prev, [menteeId]: !prev[menteeId] }));
  };

  // Receipt
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Fetch mentor sessions: 1:1 bookings + accepted group-session rows
  // (grouped, one row per session) + still-PENDING group join requests
  // (one row per request), merged into one row shape so tabs/stat cards
  // work uniformly.
  const fetchSessions = async () => {
    if (!mentorData?.mentorId) return;
    setLoadingData(true);

    return Promise.all([
      SessionService.getMentorSessions(mentorData.mentorId),
      SessionService.getMentorGroupSessionParticipants().catch((err) => {
        console.error("Failed to fetch group session bookings:", err);
        return { data: [] } as any;
      }),
      SessionService.getMentorGroupJoinRequests().catch((err) => {
        console.error("Failed to fetch group join requests:", err);
        return { data: [] } as any;
      }),
    ])
      .then(([sessionsRes, groupRes, groupRequestsRes]) => {
        const _all = sessionsRes.data as any[];
        const filtered = _all.filter((s) => (s.bookings?.length ?? 0) > 0);

        const flattened: MentorBookingRow[] = filtered.flatMap((s: any) =>
          s.bookings.map((b: any) => ({
            bookingId: b._id,
            sessionId: s.sessionId,
            menteeId: b.menteeId,
            menteeName:
              b.mentee?.fullName || s.bookedMenteeName || s.menteeName || b.bookedBy || "Student",
            // Server alag-alag field me photo bhej sakta hai (URL ya photoId), sabko check karo
            menteeProfilePhoto:
              b.mentee?.profilePic ||
              b.mentee?.profilePhotoUrl ||
              b.mentee?.profilePhotoId ||
              b.menteeProfilePhoto ||
              s.menteeProfilePhoto ||
              null,
            serviceName: s.title || s.sessionType || "Session",
            scheduledAt: b.scheduledAt || s.scheduledAt,
            slotTime: b.slotTime || s.slotTime,
            status: b.status,
            isGroupSession: false,
            startedAt: b.startedAt || s.startedAt,
            endedAt: b.endedAt || s.endedAt,
            duration: b.duration || s.duration,
            durationMinutes: s.durationMinutes,
            actualDuration: b.actualDuration || s.actualDuration,
          }))
        );

        // Accepted group-session rows come back grouped: one row per
        // session, with a `participants[]` array and
        // `enrolledCount`/`maxParticipants` instead of a flat per-mentee
        // row. No top-level menteeId/menteeName on these.
        const groupRows: MentorBookingRow[] = ((groupRes?.data as any[]) || []).map((g: any) => ({
          bookingId: g.sessionId,
          sessionId: g.sessionId,
          menteeId: undefined,
          menteeName: "",
          menteeProfilePhoto: null,
          serviceName: g.serviceName,
          scheduledAt: g.scheduledAt,
          slotTime: "",
          status: g.status,
          isGroupSession: true,
          enrolledCount: g.enrolledCount,
          maxParticipants: g.maxParticipants,
          participants: g.participants || [],
          isTemplate: !!g.isTemplate,
          meetingUrl: g.meetingUrl,
          startedAt: g.startedAt,
          endedAt: g.endedAt,
          duration: g.duration,
          durationMinutes: g.durationMinutes,
          actualDuration: g.actualDuration,
        }));

        // Still-pending group join requests stay one row per request:
        // the mentor accepts/rejects each individually.
        const groupRequestRows: MentorBookingRow[] = ((groupRequestsRes?.data as any[]) || []).map(
          (g: any) => ({
            bookingId: `${g.sessionId}-${g.menteeId}-request`,
            sessionId: g.sessionId,
            menteeId: g.menteeId,
            menteeName: g.menteeName || "Student",
            menteeProfilePhoto: g.menteeProfilePhoto || g.profilePic || null,
            serviceName: g.sessionTitle ? `${g.sessionTitle} (Group Session)` : "Group Session",
            scheduledAt: g.scheduledAt,
            slotTime: "",
            status: "pending",
            isGroupSession: true,
          })
        );

        const combined = [...flattened, ...groupRows, ...groupRequestRows];

        const sorted = combined.sort((a, b) => {
          const dateA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
          const dateB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
          return (Number.isNaN(dateB) ? 0 : dateB) - (Number.isNaN(dateA) ? 0 : dateA);
        });

        setAllBookings(sorted);
      })
      .catch((err) => {
        console.error("Failed to fetch sessions:", err);
        showToast("Failed to load bookings.", "error");
      })
      .finally(() => setLoadingData(false));
  };

  useEffect(() => {
    fetchSessions();
  }, [mentorData?.mentorId]);

  // Socket: session ended from another tab/device
  const { sessionEnded } = useSocket();
  useEffect(() => {
    if (!sessionEnded) return;
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionEnded]);

  // Mentee photos resolve karo (1:1 rows, group join requests aur grouped
  // rows ke participants[] sab ke liye).
  useEffect(() => {
    // menteeId -> server ka diya hua hint (URL / photoId / null)
    const hints = new Map<string, string | null>();

    const collect = (menteeId?: string, photo?: string | null) => {
      if (!menteeId) return;
      if (photoUrls[menteeId]) return;
      if (attemptedPhotoIds.current.has(menteeId)) return;
      const prev = hints.get(menteeId);
      hints.set(menteeId, photo || prev || null);
    };

    allBookings.forEach((b) => {
      collect(b.menteeId, b.menteeProfilePhoto);
      (b.participants || []).forEach((p) => collect(p.menteeId, p.menteeProfilePhoto));
    });

    if (hints.size === 0) return;

    // Dobara call na ho, isliye pehle hi mark kar do
    hints.forEach((_, id) => attemptedPhotoIds.current.add(id));

    let cancelled = false;

    Promise.all(
      Array.from(hints.entries()).map(async ([id, hint]) => ({
        id,
        url: await resolveMenteePhoto(id, hint),
      }))
    ).then((results) => {
      if (cancelled) return;
      setPhotoUrls((prev) => {
        const next = { ...prev };
        results.forEach(({ id, url }) => {
          if (url) next[id] = url;
        });
        return next;
      });
    });

    return () => {
      cancelled = true;
      // Effect cancel hua to attempt wapas khol do taaki agle run me retry ho
      hints.forEach((_, id) => attemptedPhotoIds.current.delete(id));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allBookings]);

  // ── Booking categories (sab getEffectiveStatus se, har minute nowMs ke saath refresh) ──
  const buckets = useMemo(() => {
    const out: Record<EffectiveStatus, MentorBookingRow[]> = {
      pending: [],
      upcoming: [],
      in_progress: [],
      completed: [],
      cancelled: [],
      missed: [],
      ended: [],
    };

    allBookings.forEach((b) => out[getEffectiveStatus(b, nowMs)].push(b));
    return out;
  }, [allBookings, nowMs]);

  const pendingBookings = [...buckets.pending].sort(byNearestFirst);
  const upcomingBookings = [...buckets.upcoming].sort(byNearestFirst);
  const inProgressBookings = buckets.in_progress;
  const completedTabBookings = buckets.completed;
  const missedBookings = buckets.missed;
  // All Active = sirf wahi jo abhi actionable hain (past kuch nahi)
  const activeBookings = [...buckets.pending, ...buckets.upcoming, ...buckets.in_progress, ...buckets.ended].sort(byNearestFirst);
  // History = poora past (completed + missed + cancelled), latest pehle
  const historyBookings = [...buckets.completed, ...buckets.missed, ...buckets.cancelled].sort(byLatestFirst);

  const currentBookings = useMemo(() => {
    const byTab: Record<BookingTab, MentorBookingRow[]> = {
      all: activeBookings,
      pending: pendingBookings,
      upcoming: upcomingBookings,
      in_progress: inProgressBookings,
      completed: completedTabBookings,
      missed: missedBookings,
      history: historyBookings,
    };
    const base = byTab[bookingTab] ?? activeBookings;
    if (!searchQuery.trim()) return base;
    const q = searchQuery.trim().toLowerCase();
    return base.filter(
      (b) =>
        b.menteeName?.toLowerCase().includes(q) ||
        b.serviceName?.toLowerCase().includes(q) ||
        (b.participants || []).some((p) => p.menteeName?.toLowerCase().includes(q))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingTab, buckets, searchQuery]);

  // Tab / search badalte hi list dobara pehle page se
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [bookingTab, searchQuery]);


  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const to12Hour = (part: string): string => {
    const match = part.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
    if (!match) return part;
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${period}`;
  };

  const formatSlotRange = (slotTime?: string | null) => {
    if (!slotTime) return "";
    const value = String(slotTime).trim();
    if (!value) return "";
    const parts = value.split("-").map((part) => part.trim());
    if (parts.length === 2 && parts[0] && parts[1]) {
      return `${to12Hour(parts[0])} - ${to12Hour(parts[1])}`;
    }
    return to12Hour(value);
  };

  const formatTime = (booking: MentorBookingRow) => {
    if (booking.slotTime) {
      const formattedSlot = formatSlotRange(booking.slotTime);
      if (formattedSlot) return formattedSlot;
    }
    if (!booking.scheduledAt) return "N/A";
    const date = new Date(booking.scheduledAt);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const handleConfirm = async (sessionId: string, bookingId?: string) => {
    const bookingRow = allBookings.find((b) => b.sessionId === sessionId && b.bookingId === bookingId);
    const rowKey = bookingId || sessionId;
    setRowAction(rowKey, "accept");

    try {
      if (bookingRow?.isGroupSession) {
        if (!bookingRow.menteeId) {
          showToast("Could not identify the join request.", "error");
          return;
        }
        await SessionService.acceptGroupJoinRequest(sessionId, bookingRow.menteeId);
        showToast("Join request accepted", "success");
        setAllBookings((prev) => prev.filter((b) => b.bookingId !== rowKey));
      } else {
        await SessionService.confirmSession(sessionId, bookingId);
        showToast("Booking confirmed successfully", "success");
        setAllBookings((prev) =>
          prev.map((b) =>
            b.bookingId === bookingId ? { ...b, status: "confirmed" } : b
          )
        );
      }

      await fetchSessions();
    } catch (err: any) {
      showToast(err?.message || "Failed to confirm booking.", "error");
    } finally {
      setRowAction(rowKey, null);
    }
  };

  const openStartModal = (booking: MentorBookingRow) => {
    setStartError(null);
    setStartModalBooking(booking);
    setShowStartModal(true);
  };

  const confirmStartSession = async () => {
    if (!startModalBooking) return;
    const { sessionId, bookingId, isGroupSession } = startModalBooking;
    const rowKey = bookingId || sessionId;

    setRowAction(rowKey, "start");
    setStartError(null);

    try {
      if (isGroupSession) {
        const res: any = await SessionService.startGroupSession(sessionId);
        const meetUrl = res?.data?.meeting?.meetingUrl || res?.data?.meetingUrl || startModalBooking.meetingUrl;
        showToast("Group session started", "success");
        setShowStartModal(false);
        setStartModalBooking(null);
        await fetchSessions();

        if (meetUrl) {
          window.open(meetUrl, '_blank', 'noopener,noreferrer');
        } else {
          showToast("Session started, but no Google Meet link found", "error");
        }
        return;
      }

      const res: any = await SessionService.startSession(sessionId, bookingId);
      const roomId = res?.data?.roomId || bookingId;

      showToast("Session started", "success");
      setShowStartModal(false);
      setStartModalBooking(null);

      router.push(
        `/mentorship/mentor-session?sessionId=${encodeURIComponent(sessionId)}&roomId=${encodeURIComponent(
          roomId
        )}&bookingId=${encodeURIComponent(bookingId)}&role=mentor`
      );
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Failed to start session.";
      setStartError(message);
      showToast(message, "error");
    } finally {
      setRowAction(rowKey, null);
    }
  };

  const openDetailsModal = (booking: MentorBookingRow) => {
    setDetailsBooking(booking);
    setShowDetailsModal(true);
  };

  const handleDownloadReceipt = async (booking: MentorBookingRow) => {
    setDownloadingId(booking.bookingId);
    try {
      const res: any = await SessionService.getSessionReceipt(booking.sessionId, booking.bookingId);
      const r = res.data;
      const amount = r.pricing?.totalAmount ?? 0;
      const currency = r.pricing?.currency || "INR";
      const paymentStatus = r.payment?.status || "N/A";
      const completedAt = r.completedAt ? formatDate(r.completedAt) : formatDate(booking.scheduledAt);

      const receiptHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Session Receipt - ${r.menteeName || "Student"}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 40px; color: #4a3728; }
  .header { border-bottom: 2px solid #4a3728; padding-bottom: 16px; margin-bottom: 24px; }
  .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0ebe4; gap: 20px; }
  .label { color: #8a7a6a; font-size: 13px; }
  .value { font-weight: 600; text-align: right; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; background: #f3e8ff; color: #7c3aed; font-size: 12px; font-weight: 600; }
  .total { margin-top: 16px; padding-top: 16px; border-top: 2px solid #4a3728; font-size: 18px; font-weight: 700; display: flex; justify-content: space-between; }
</style>
</head>
<body>
  <div class="header"><h2>Session Receipt</h2><span class="badge">Completed</span></div>
  <div class="row"><span class="label">Booking ID</span><span class="value">${r.bookingId || booking.bookingId}</span></div>
  <div class="row"><span class="label">Student</span><span class="value">${r.menteeName || booking.menteeName}</span></div>
  <div class="row"><span class="label">Mentor</span><span class="value">${r.mentorName || "Mentor"}</span></div>
  <div class="row"><span class="label">Service</span><span class="value">${r.title || booking.serviceName}</span></div>
  <div class="row"><span class="label">Date</span><span class="value">${formatDate(r.scheduledAt || booking.scheduledAt)}</span></div>
  <div class="row"><span class="label">Time</span><span class="value">${r.slotTime ? formatSlotRange(r.slotTime) : formatTime(booking)}</span></div>
  <div class="row"><span class="label">Duration</span><span class="value">${r.duration ?? "N/A"} min</span></div>
  <div class="row"><span class="label">Payment Status</span><span class="value">${paymentStatus}</span></div>
  <div class="row"><span class="label">Completed On</span><span class="value">${completedAt}</span></div>
  <div class="total"><span>Total Amount</span><span>${currency} ${amount}</span></div>
</body>
</html>`;

      const blob = new Blob([receiptHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt-${(r.menteeName || booking.menteeName || "student").replace(/\s+/g, "_")}-${r.bookingId || booking.bookingId}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast("Receipt downloaded", "success");
    } catch (err: any) {
      showToast(err?.message || "Failed to download receipt.", "error");
    } finally {
      setDownloadingId(null);
    }
  };

  // Complete a 1:1 booking OR a group session. `attendees` (menteeIds who
  // actually attended) is only meaningful for group sessions: the
  // Attendance modal supplies it before this gets called for a group row.
  const handleEnd = async (sessionId: string, bookingId?: string, attendees?: string[]) => {
    const rowKey = bookingId || sessionId;
    setRowAction(rowKey, "end");
    try {
      const bookingRow = allBookings.find((b) => b.sessionId === sessionId && b.bookingId === bookingId);

      if (bookingRow?.isGroupSession) {
        let durationMinutes: number | undefined = undefined;
        if (bookingRow.scheduledAt) {
          const elapsed = Math.round((Date.now() - new Date(bookingRow.scheduledAt).getTime()) / 60000);
          durationMinutes = Math.max(1, elapsed);
        }
        await SessionService.completeGroupSession(sessionId, {
          actualDuration: durationMinutes,
          wasSuccessful: true,
          ...(attendees ? { attendees } : {}),
        });
      } else {
        await SessionService.completeSession(sessionId, { wasSuccessful: true, bookingId });
      }

      showToast("Session completed", "success");
      setAllBookings((prev) =>
        prev.map((b) =>
          b.bookingId === rowKey ? { ...b, status: "completed" } : b
        )
      );
      await fetchSessions();
      setBookingTab("completed");
    } catch (err: any) {
      showToast(err?.message || "Failed to complete session.", "error");
    } finally {
      setRowAction(rowKey, null);
    }
  };

  // Router for the "End Session" button: group rows go through the
  // Attendance modal first; 1:1 rows complete immediately as before.
  const handleEndSessionClick = (booking: MentorBookingRow) => {
    if (booking.isGroupSession) {
      openAttendanceModal(booking);
    } else {
      handleEnd(booking.sessionId, booking.bookingId);
    }
  };

  const confirmAttendanceAndComplete = async () => {
    if (!attendanceBooking) return;
    const attendees = (attendanceBooking.participants || [])
      .filter((p) => attendanceMap[p.menteeId])
      .map((p) => p.menteeId);

    await handleEnd(attendanceBooking.sessionId, attendanceBooking.bookingId, attendees);

    setShowAttendanceModal(false);
    setAttendanceBooking(null);
  };

  const handleCancelSubmit = async () => {
    if (!cancelSessionId) {
      showToast("Something went wrong. Please try again.", "error");
      return;
    }

    const bookingRow = allBookings.find(
      (b) => b.sessionId === cancelSessionId && b.bookingId === cancelBookingId
    );

    const isPendingGroupRequest = bookingRow?.isGroupSession && bookingRow.status === "pending" && !bookingRow.participants;

    if (!isPendingGroupRequest && !cancelReason.trim()) {
      showToast("Please provide a reason.", "error");
      return;
    }

    const rowKey = cancelBookingId || cancelSessionId;
    setRowAction(rowKey, "reject");

    try {
      if (isPendingGroupRequest) {
        if (!bookingRow?.menteeId) {
          showToast("Could not identify the join request.", "error");
          return;
        }
        await SessionService.rejectGroupJoinRequest(cancelSessionId, bookingRow.menteeId);
        showToast("Join request declined", "success");
        setAllBookings((prev) => prev.filter((b) => b.bookingId !== rowKey));

      } else if (bookingRow?.isGroupSession) {
        if (cancelReason.trim().length < 10) {
          showToast("Reason must be at least 10 characters.", "error");
          return;
        }
        await SessionService.cancelGroupSession(cancelSessionId, cancelReason.trim());

        
        showToast("Session cancelled successfully", "success");
        setAllBookings((prev) =>
          prev.map((b) =>
            b.sessionId === cancelSessionId ? { ...b, status: "cancelled" } : b
          )
        );
      } else {
        if (!cancelBookingId) {
          showToast("Please provide a reason.", "error");
          return;
        }
        await SessionService.cancelSession(cancelSessionId, cancelReason, cancelBookingId);
        showToast("Session cancelled successfully", "success");
        setAllBookings((prev) =>
          prev.map((b) =>
            b.bookingId === cancelBookingId ? { ...b, status: "cancelled" } : b
          )
        );
      }

      setShowCancelModal(false);
      setCancelReason("");
      setCancelSessionId(null);
      setCancelBookingId(null);

      await fetchSessions();
    } catch (err: any) {
      showToast(err?.message || "Failed to process request.", "error");
    } finally {
      setRowAction(rowKey, null);
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!rescheduleSessionId || !rescheduleBookingId || !rescheduleDate || !rescheduleReason.trim()) {
      showToast("Please provide both new date and reason.", "error");
      return;
    }

    const rowKey = rescheduleBookingId || rescheduleSessionId;
    setRowAction(rowKey, "reschedule");

    try {
      const scheduledAtISO = new Date(`${rescheduleDate}:00+05:30`).toISOString();

      await SessionService.rescheduleSession(
        rescheduleSessionId,
        scheduledAtISO,
        rescheduleReason,
        rescheduleBookingId
      );

      showToast("Session rescheduled successfully", "success");
      setShowRescheduleModal(false);
      setRescheduleDate("");
      setRescheduleReason("");
      setRescheduleSessionId(null);
      setRescheduleBookingId(null);

      await fetchSessions();
      setBookingTab("upcoming");
    } catch (err: any) {
      showToast(err?.message || "Failed to reschedule session.", "error");
    } finally {
      setRowAction(rowKey, null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* TOAST */}
      {toast &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed top-5 right-5 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg"
            style={{
              backgroundColor: toast.type === "success" ? "#dcfce7" : "#fee2e2",
              color: toast.type === "success" ? "#15803d" : "#dc2626",
              border: toast.type === "success" ? "1px solid #86efac" : "1px solid #fca5a5",
            }}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
            ) : (
              <XCircle className="w-4.5 h-4.5 shrink-0" />
            )}
            <span className="text-sm font-semibold">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>,
          document.body
        )}

      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#4a3728" }}>
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: "#4a3728" }}>Bookings</h2>
            <p style={{ color: "#8a7a6a" }} className="text-sm">Manage your sessions</p>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          {showSearch && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: "#fbf7f3", border: "1px solid #e0d8cf" }}>
              <Search className="w-4 h-4" style={{ color: "#8a7a6a" }} />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student or service..."
                className="bg-transparent outline-none text-sm w-48"
                style={{ color: "#4a3728" }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}>
                  <X className="w-3.5 h-3.5" style={{ color: "#8a7a6a" }} />
                </button>
              )}
            </div>
          )}

          <button
            onClick={() => {
              setShowSearch((v) => !v);
              if (showSearch) setSearchQuery("");
            }}
            className="px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors hover:bg-[#f3ece4]"
            style={{ backgroundColor: showSearch ? "#f3ece4" : "#fbf7f3", color: "#7a5c3e", border: "1px solid #e0d8cf" }}
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Pending", value: pendingBookings.length, icon: Clock, palette: "amber" },
          { label: "Upcoming", value: upcomingBookings.length, icon: Calendar, palette: "green" },
          { label: "In Progress", value: inProgressBookings.length, icon: Play, palette: "blue" },
          { label: "Completed", value: completedTabBookings.length, icon: CheckCircle2, palette: "purple" },
        ].map((stat, idx) => {
          const c = statPalette[stat.palette];
          return (
            <div key={idx} className="bg-white p-5 rounded-2xl" style={{ border: "1px solid #e0d8cf" }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: c.bg }}>
                <stat.icon className="w-4.5 h-4.5" style={{ color: c.fg }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: "#4a3728" }}>{stat.value}</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: "#8a7a6a" }}>{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* TABS */}
      <div className="bg-white p-1.5 rounded-2xl overflow-x-auto" style={{ border: "1px solid #e0d8cf" }}>
        <div className="flex gap-1.5 min-w-max">
          {(["all", "pending", "upcoming", "in_progress", "completed", "missed", "history"] as const).map((tab) => {
            const count = {
              all: activeBookings.length,
              pending: pendingBookings.length,
              upcoming: upcomingBookings.length,
              in_progress: inProgressBookings.length,
              completed: completedTabBookings.length,
              missed: missedBookings.length,
              history: historyBookings.length,
            }[tab];

            const { label, icon: Icon } = tabMeta[tab];
            const isActive = bookingTab === tab;

            return (
              <button
                key={tab}
                onClick={() => setBookingTab(tab)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150"
                style={{ backgroundColor: isActive ? "#4a3728" : "transparent", color: isActive ? "#fff" : "#7a5c3e" }}
              >
                <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{label}</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "#f3ece4", color: isActive ? "#fff" : "#7a5c3e" }}
                  >
                    {count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #e0d8cf" }}>
        <div className="overflow-x-auto">
          {loadingData ? (
            <div className="flex items-center justify-center py-16" style={{ color: "#8a7a6a" }}>
              <Clock className="w-5 h-5 animate-spin mr-3" />
              <span className="text-sm font-semibold">Loading bookings...</span>
            </div>
          ) : currentBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16" style={{ color: "#8a7a6a" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: "#f3ece4" }}>
                <Calendar className="w-6 h-6" style={{ color: "#a08070" }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: "#4a3728" }}>
                {searchQuery ? "No matching bookings" : `No ${tabMeta[bookingTab].label.toLowerCase()} bookings found`}
              </p>
              <p className="text-xs mt-1">{searchQuery ? "Try a different search" : "Bookings will appear here when available"}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead style={{ backgroundColor: "#fbf7f3" }}>
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider" style={{ color: "#8a7a6a" }}>Student</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider" style={{ color: "#8a7a6a" }}>Service</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider" style={{ color: "#8a7a6a" }}>Date</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider" style={{ color: "#8a7a6a" }}>Time</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider" style={{ color: "#8a7a6a" }}>Status</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider" style={{ color: "#8a7a6a" }}>Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y" style={{ borderColor: "#f0ebe4" }}>
                {currentBookings.slice(0, visibleCount).map((booking, idx) => {
                  const resolvedPhoto = booking.menteeId ? photoUrls[booking.menteeId] : null;

                  // Row ka asli haal (status + time). Buttons aur badge dono isi se.
                  const eff = getEffectiveStatus(booking, nowMs);
                  const badgeKey = eff === "upcoming" ? booking.status : eff;
                  const sb = statusBadge[badgeKey] ?? statusBadge.pending;

                      

                  const isGroupedRow = !!booking.participants; // accepted, session-level row
                  const rowKey = booking.bookingId || booking.sessionId;
                  const currentAction = rowActionsLoading[rowKey];
                  const isRowLoading = Boolean(currentAction);

                  return (
                    <tr key={`${booking.sessionId}-${booking.bookingId}-${idx}`} className="transition-colors hover:bg-[#fbf7f3]">
                      {/* Student */}
                      <td className="px-5 py-3.5">
                        {isGroupedRow ? (
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-white"
                              style={{ backgroundColor: "#7c3aed" }}
                            >
                              <Users className="w-4 h-4" />
                            </div>
                            <span
                              className="px-2 py-1 rounded-full text-xs font-bold"
                              style={{ backgroundColor: "#f3e8ff", color: "#7c3aed" }}
                            >
                              {booking.enrolledCount}/{booking.maxParticipants} Enrolled
                            </span>
                            <button
                              onClick={() => openParticipantsModal(booking)}
                              className="p-1.5 rounded-lg transition-colors hover:bg-[#f3ece4]"
                              style={{ border: "1px solid #e0d8cf" }}
                              title="View Participants"
                            >
                              <Eye className="w-3.5 h-3.5" style={{ color: "#7a5c3e" }} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <MenteeLink
                              menteeId={booking.menteeId}
                              name={booking.menteeName}
                              avatar={resolvedPhoto}
                              avatarSize="w-9 h-9"
                            />

                            {booking.isGroupSession && (
                              <span
                                className="px-1.5 py-0.5 rounded-full text-[10px] font-bold ml-1"
                                style={{ backgroundColor: "#f3e8ff", color: "#7c3aed" }}
                              >
                                Group
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Service */}
                      <td className="px-5 py-3.5 text-sm" style={{ color: "#8a7a6a" }}>{booking.serviceName}</td>

                      {/* Date */}
                      <td className="px-5 py-3.5 text-sm" style={{ color: "#8a7a6a" }}>{formatDate(booking.scheduledAt)}</td>

                      {/* Time */}
                      <td className="px-5 py-3.5 text-sm" style={{ color: "#8a7a6a" }}>{formatTime(booking)}</td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span
                          className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: sb.bg, color: sb.fg }}
                        >
                          {sb.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex gap-1.5">
                          {/* Pending: only real pending join-request rows land here */}
                          {eff === "pending" && (
                            <>
                              <button
                                onClick={() => handleConfirm(booking.sessionId, booking.bookingId)}
                                disabled={isRowLoading}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-opacity hover:opacity-80 disabled:opacity-50 min-w-[76px]"
                                style={{ backgroundColor: "#dcfce7", color: "#15803d" }}
                              >
                                {currentAction === "accept" ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                                <span>Accept</span>
                              </button>

                              <button
                                onClick={() => {
                                  setCancelSessionId(booking.sessionId);
                                  setCancelBookingId(booking.bookingId);
                                  setShowCancelModal(true);
                                }}
                                disabled={isRowLoading}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-opacity hover:opacity-80 disabled:opacity-50 min-w-[76px]"
                                style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}
                              >
                                {currentAction === "reject" ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5" />
                                )}
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                            {/* Upcoming */}
                            {eff === "upcoming" && (
                              <>
                                {booking.isGroupSession ? (
                                  (booking.status === "open" ||
                                    booking.status === "full" ||
                                    booking.status === "confirmed") &&
                                  !(booking.isTemplate || !booking.scheduledAt) && (() => {
                                    const scheduledTime = booking.scheduledAt ? new Date(booking.scheduledAt).getTime() : 0;
                                    const now = Date.now();
                                    const isTooEarly = now < scheduledTime - 5 * 60 * 1000;
                                    const isTooLate = now > scheduledTime + 10 * 60 * 1000;
                                    const isWithinWindow = !isTooEarly && !isTooLate;

                                    return (
                                      <div className="flex flex-col items-start gap-0.5">
                                        <button
                                          onClick={() => openStartModal(booking)}
                                          disabled={isRowLoading || !isWithinWindow}
                                          className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-80 disabled:opacity-50"
                                          style={{ backgroundColor: "#dbeafe", color: "#1d4ed8" }}
                                          title={isTooEarly ? "Available 5 minutes before scheduled start" : isTooLate ? "Window passed (10 min after scheduled start)" : undefined}
                                        >
                                          {currentAction === "start" ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                          ) : (
                                            <Play className="w-3.5 h-3.5" />
                                          )}
                                          <span>Start</span>
                                        </button>
                                        {!isWithinWindow && (
                                          <span className="text-[10px] text-amber-700 whitespace-nowrap">
                                            {isTooEarly ? "Starts 5m before scheduled time" : "Start window closed (+10m)"}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })()
                                ) : (
                                  <button
                                    onClick={() => openStartModal(booking)}
                                    disabled={isRowLoading}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-80 disabled:opacity-50"
                                    style={{ backgroundColor: "#dbeafe", color: "#1d4ed8" }}
                                  >
                                    {currentAction === "start" ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Play className="w-3.5 h-3.5" />
                                    )}
                                    <span>Start</span>
                                  </button>
                                )}

                              {/* Reschedule not supported for group sessions yet */}
                              {!booking.isGroupSession && (
                                <button
                                  onClick={() => {
                                    setRescheduleSessionId(booking.sessionId);
                                    setRescheduleBookingId(booking.bookingId);
                                    setShowRescheduleModal(true);
                                  }}
                                  disabled={isRowLoading}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-80 disabled:opacity-50"
                                  style={{ backgroundColor: "#fed7aa", color: "#c2410c" }}
                                >
                                  <RotateCw className="w-3.5 h-3.5" />
                                  <span>Reschedule</span>
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setCancelSessionId(booking.sessionId);
                                  setCancelBookingId(booking.bookingId);
                                  setShowCancelModal(true);
                                }}
                                disabled={isRowLoading}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-80 disabled:opacity-50"
                                style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Cancel</span>
                              </button>
                            </>
                          )}

                            {/* In Progress */}
                            {(eff === "in_progress" || eff === "ended") && (
                              <div className="flex items-center gap-1.5">
                                {booking.isGroupSession && booking.meetingUrl && (
                                  <button
                                    onClick={() => window.open(booking.meetingUrl, '_blank', 'noopener,noreferrer')}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-80"
                                    style={{ backgroundColor: "#22c55e", color: "#ffffff" }}
                                  >
                                    <Play className="w-3.5 h-3.5" />
                                    Open Meet
                                  </button>
                                )}
                                <button
                                  onClick={() => handleEndSessionClick(booking)}
                                  disabled={isRowLoading}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-80 disabled:opacity-50 min-w-[104px]"
                                  style={{ backgroundColor: "#f3e8ff", color: "#7c3aed" }}
                                >
                                  {currentAction === "end" ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  )}
                                  <span>End Session</span>
                                </button>
                              </div>
                            )}

                               
                            {/* Completed */}

                            {eff === "completed" && (
                              <>
                                {isGroupedRow ? (
                                  <button
                                    onClick={() => openParticipantsModal(booking)}
                                    className="p-1.5 rounded-lg transition-colors hover:bg-[#f3ece4]"
                                    style={{ border: "1px solid #e0d8cf" }}
                                    title="View Participants"
                                  >
                                    <Eye className="w-3.5 h-3.5" style={{ color: "#7a5c3e" }} />
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => openDetailsModal(booking)}
                                      className="p-1.5 rounded-lg transition-colors hover:bg-[#f3ece4]"
                                      style={{ border: "1px solid #e0d8cf" }}
                                      title="View Details"
                                    >
                                      <Eye className="w-3.5 h-3.5" style={{ color: "#7a5c3e" }} />
                                    </button>

                                  <button
                                    onClick={() => handleDownloadReceipt(booking)}
                                    disabled={downloadingId === booking.bookingId}
                                    className="p-1.5 rounded-lg transition-colors hover:bg-[#f3ece4] disabled:opacity-50"
                                    style={{ border: "1px solid #e0d8cf" }}
                                    title="Download"
                                  >
                                    <Download className="w-3.5 h-3.5" style={{ color: "#7a5c3e" }} />
                                  </button>
                                </>
                              )}
                            </>
                          )}

                          {/* Missed / Cancelled: koi action nahi */}
                          {(eff === "missed" || eff === "cancelled") && (
                            <span className="text-xs" style={{ color: "#8a7a6a" }}>
                              {eff === "missed" ? "Mentee notified (refund / reschedule)" : "-"}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* LOAD MORE */}
      {!loadingData && currentBookings.length > visibleCount && (
        <div className="flex justify-center">
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors hover:bg-[#f3ece4]"
            style={{ backgroundColor: "#fbf7f3", color: "#7a5c3e", border: "1px solid #e0d8cf" }}
          >
            Load more ({currentBookings.length - visibleCount} remaining)
          </button>
        </div>
      )}

      {/* CANCEL / REJECT MODAL */}
      {showCancelModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md m-4" style={{ border: "1px solid #e0d8cf" }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: "#4a3728" }}>
                {allBookings.find((b) => b.sessionId === cancelSessionId && b.bookingId === cancelBookingId)?.status === "pending"
                  ? "Decline Join Request"
                  : "Confirm Cancellation"}
              </h3>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#8a7a6a" }}>
                  Reason (optional for join requests)
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg p-3 outline-none text-sm"
                  style={{ border: "1px solid #e0d8cf", backgroundColor: "#fbf7f3", color: "#4a3728" }}
                  placeholder="e.g. Scheduling conflict, emergency, etc."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: "#fbf7f3", color: "#7a5c3e", border: "1px solid #e0d8cf" }}
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelSessionId(null);
                    setCancelBookingId(null);
                    setCancelReason("");
                  }}
                >
                  Go Back
                </button>

                <button
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                  style={{ backgroundColor: "#dc2626" }}
                  onClick={handleCancelSubmit}
                  disabled={rowActionsLoading[cancelBookingId || cancelSessionId || ""] === "reject"}
                >
                  {rowActionsLoading[cancelBookingId || cancelSessionId || ""] === "reject" ? "Processing..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* RESCHEDULE MODAL */}
      {showRescheduleModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md m-4" style={{ border: "1px solid #e0d8cf" }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: "#4a3728" }}>Reschedule Session</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#8a7a6a" }}>New Date & Time</label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-lg p-3 outline-none text-sm"
                    style={{ border: "1px solid #e0d8cf", color: "#4a3728" }}
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#8a7a6a" }}>Reason</label>
                  <input
                    type="text"
                    className="w-full rounded-lg p-3 outline-none text-sm"
                    style={{ border: "1px solid #e0d8cf", backgroundColor: "#fbf7f3", color: "#4a3728" }}
                    placeholder="Reason for rescheduling"
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: "#fbf7f3", color: "#7a5c3e", border: "1px solid #e0d8cf" }}
                  onClick={() => {
                    setShowRescheduleModal(false);
                    setRescheduleSessionId(null);
                    setRescheduleBookingId(null);
                    setRescheduleDate("");
                    setRescheduleReason("");
                  }}
                >
                  Cancel
                </button>

                <button
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                  style={{ backgroundColor: "#4a3728" }}
                  onClick={handleRescheduleSubmit}
                  disabled={rowActionsLoading[rescheduleBookingId || rescheduleSessionId || ""] === "reschedule"}
                >
                  {rowActionsLoading[rescheduleBookingId || rescheduleSessionId || ""] === "reschedule" ? "Processing..." : "Confirm Reschedule"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* START SESSION MODAL */}
      {showStartModal &&
        startModalBooking &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md m-4" style={{ border: "1px solid #e0d8cf" }}>
              <h3 className="text-lg font-bold mb-1" style={{ color: "#4a3728" }}>Session Details</h3>
              <p className="text-xs mb-4" style={{ color: "#8a7a6a" }}>
                {startModalBooking.isGroupSession
                  ? "Review the group session before starting it."
                  : "Review the session before starting the video call."}
              </p>

              <div className="space-y-2.5 rounded-xl p-4 mb-4" style={{ backgroundColor: "#fbf7f3", border: "1px solid #e0d8cf" }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#8a7a6a" }}>Session Title</span>
                  <span style={{ color: "#4a3728" }} className="font-semibold">{startModalBooking.serviceName}</span>
                </div>

                {startModalBooking.isGroupSession ? (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "#8a7a6a" }}>Enrolled</span>
                    <span style={{ color: "#4a3728" }} className="font-semibold">
                      {startModalBooking.enrolledCount}/{startModalBooking.maxParticipants}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between text-sm items-center">
                    <span style={{ color: "#8a7a6a" }}>Mentee</span>
                    <MenteeLink
                      menteeId={startModalBooking.menteeId}
                      name={startModalBooking.menteeName}
                      showAvatar={false}
                      underlineOnHover
                    />
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span style={{ color: "#8a7a6a" }}>Date</span>
                  <span style={{ color: "#4a3728" }} className="font-semibold">{formatDate(startModalBooking.scheduledAt)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span style={{ color: "#8a7a6a" }}>Time</span>
                  <span style={{ color: "#4a3728" }} className="font-semibold">{formatTime(startModalBooking)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span style={{ color: "#8a7a6a" }}>Status</span>
                  <span style={{ color: "#4a3728" }} className="font-semibold capitalize">{startModalBooking.status.replace("_", " ")}</span>
                </div>
              </div>

              {startError && (
                <div className="text-xs font-semibold rounded-lg px-3 py-2 mb-4" style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}>
                  {startError}
                </div>
              )}

              {(() => {
                const isGroup = startModalBooking.isGroupSession;
                const isTemplate = !!startModalBooking.isTemplate || !startModalBooking.scheduledAt;
                let isWithinWindow = true;
                let windowHint = "";
                if (isGroup && startModalBooking.scheduledAt) {
                  const scheduledTime = new Date(startModalBooking.scheduledAt).getTime();
                  const now = Date.now();
                  const isTooEarly = now < scheduledTime - 5 * 60 * 1000;
                  const isTooLate = now > scheduledTime + 10 * 60 * 1000;
                  isWithinWindow = !isTooEarly && !isTooLate;
                  if (isTooEarly) windowHint = "Starts 5m before scheduled time";
                  if (isTooLate) windowHint = "Start window closed (+10m)";
                }

                const canStartSession = !isGroup || (!isTemplate && isWithinWindow);

                return (
                  <>
                    {windowHint && (
                      <div className="text-xs font-semibold rounded-lg px-3 py-2 mb-4" style={{ backgroundColor: "#fef3c7", color: "#b45309" }}>
                        {windowHint}
                      </div>
                    )}
                    <div className="flex justify-end gap-3">
                      <button
                        className="px-4 py-2 rounded-lg text-sm font-semibold"
                        style={{ backgroundColor: "#fbf7f3", color: "#7a5c3e", border: "1px solid #e0d8cf" }}
                        onClick={() => {
                          setShowStartModal(false);
                          setStartModalBooking(null);
                          setStartError(null);
                        }}
                        disabled={rowActionsLoading[startModalBooking.bookingId || startModalBooking.sessionId] === "start"}
                      >
                        Cancel
                      </button>

                      <button
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2"
                        style={{ backgroundColor: "#1d4ed8", opacity: (rowActionsLoading[startModalBooking.bookingId || startModalBooking.sessionId] === "start" || !canStartSession) ? 0.6 : 1 }}
                        onClick={confirmStartSession}
                        disabled={rowActionsLoading[startModalBooking.bookingId || startModalBooking.sessionId] === "start" || !canStartSession}
                      >
                        {rowActionsLoading[startModalBooking.bookingId || startModalBooking.sessionId] === "start" ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                        <span>{rowActionsLoading[startModalBooking.bookingId || startModalBooking.sessionId] === "start" ? "Starting..." : "Start Session"}</span>
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>,
          document.body
        )}

      {/* COMPLETED DETAILS MODAL (1:1 only) */}
      {showDetailsModal &&
        detailsBooking &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md m-4" style={{ border: "1px solid #e0d8cf" }}>
              <h3 className="text-lg font-bold mb-1" style={{ color: "#4a3728" }}>Session Details</h3>
              <p className="text-xs mb-4" style={{ color: "#8a7a6a" }}>Completed session summary.</p>

              <div className="space-y-2.5 rounded-xl p-4 mb-4" style={{ backgroundColor: "#fbf7f3", border: "1px solid #e0d8cf" }}>
                <div className="flex justify-between text-sm items-center">
                  <span style={{ color: "#8a7a6a" }}>Student</span>
                  <MenteeLink
                    menteeId={detailsBooking.menteeId}
                    name={detailsBooking.menteeName}
                    showAvatar={false}
                    underlineOnHover
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#8a7a6a" }}>Service</span>
                  <span style={{ color: "#4a3728" }} className="font-semibold">{detailsBooking.serviceName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#8a7a6a" }}>Date</span>
                  <span style={{ color: "#4a3728" }} className="font-semibold">{formatDate(detailsBooking.scheduledAt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#8a7a6a" }}>Time</span>
                  <span style={{ color: "#4a3728" }} className="font-semibold">{formatTime(detailsBooking)}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span style={{ color: "#8a7a6a" }}>Status</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#f3e8ff", color: "#7c3aed" }}>
                    Completed
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: "#fbf7f3", color: "#7a5c3e", border: "1px solid #e0d8cf" }}
                  onClick={() => {
                    setShowDetailsModal(false);
                    setDetailsBooking(null);
                  }}
                >
                  Close
                </button>

                <button
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2"
                  style={{ backgroundColor: "#4a3728" }}
                  onClick={() => handleDownloadReceipt(detailsBooking)}
                  disabled={downloadingId === detailsBooking.bookingId}
                >
                  <Download className="w-3.5 h-3.5" />
                  {downloadingId === detailsBooking.bookingId ? "Downloading..." : "Download Receipt"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* PARTICIPANTS MODAL */}
      {showParticipantsModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md m-4 max-h-[80vh] flex flex-col" style={{ border: "1px solid #e0d8cf" }}>
              <h3 className="text-lg font-bold mb-1" style={{ color: "#4a3728" }}>{participantsModalTitle}</h3>
              <p className="text-xs mb-4" style={{ color: "#8a7a6a" }}>
                {participantsModalList.length} accepted participant{participantsModalList.length === 1 ? "" : "s"}
              </p>

              <div className="space-y-2 overflow-y-auto flex-1">
                {participantsModalList.length === 0 ? (
                  <p className="text-sm" style={{ color: "#8a7a6a" }}>No accepted participants yet.</p>
                ) : (
                  participantsModalList.map((p) => {
                    const photo = photoUrls[p.menteeId];
                    return (
                      <div
                        key={p.menteeId}
                        className="flex items-center gap-3 rounded-xl p-2.5"
                        style={{ backgroundColor: "#fbf7f3", border: "1px solid #e0d8cf" }}
                      >
                        <MenteeLink
                          menteeId={p.menteeId}
                          name={p.menteeName}
                          avatar={photo}
                          avatarSize="w-8 h-8"
                          className="flex-1 min-w-0"
                        />
                        {p.attendanceStatus && p.attendanceStatus !== "registered" && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold capitalize"
                            style={{
                              backgroundColor: p.attendanceStatus === "attended" ? "#dcfce7" : "#fee2e2",
                              color: p.attendanceStatus === "attended" ? "#15803d" : "#dc2626",
                            }}
                          >
                            {p.attendanceStatus}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex justify-end mt-5">
                <button
                  className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: "#fbf7f3", color: "#7a5c3e", border: "1px solid #e0d8cf" }}
                  onClick={() => setShowParticipantsModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ATTENDANCE MODAL (End Session flow for group sessions) */}
      {showAttendanceModal &&
        attendanceBooking &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md m-4 max-h-[80vh] flex flex-col" style={{ border: "1px solid #e0d8cf" }}>
              <h3 className="text-lg font-bold mb-1" style={{ color: "#4a3728" }}>Mark Attendance</h3>
              <p className="text-xs mb-4" style={{ color: "#8a7a6a" }}>
                {attendanceBooking.serviceName} - uncheck anyone who didn't attend before completing.
              </p>

              <div className="space-y-2 overflow-y-auto flex-1">
                {(attendanceBooking.participants || []).map((p) => {
                  const photo = photoUrls[p.menteeId];
                  const checked = !!attendanceMap[p.menteeId];
                  return (
                    <label
                      key={p.menteeId}
                      className="flex items-center gap-3 rounded-xl p-2.5 cursor-pointer"
                      style={{ backgroundColor: "#fbf7f3", border: "1px solid #e0d8cf" }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAttendance(p.menteeId)}
                        className="w-4 h-4 shrink-0"
                      />

                      {photo ? (
                        <img src={photo} alt={p.menteeName} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: "#4a3728" }}
                        >
                          {p.menteeName?.[0]?.toUpperCase() ?? "?"}
                        </div>
                      )}

                      <span className="text-sm font-semibold flex-1" style={{ color: "#4a3728" }}>{p.menteeName}</span>

                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{
                          backgroundColor: checked ? "#dcfce7" : "#fee2e2",
                          color: checked ? "#15803d" : "#dc2626",
                        }}
                      >
                        {checked ? "Attended" : "Absent"}
                      </span>
                    </label>
                  );
                })}
              </div>

              <div className="flex justify-end gap-3 mt-5">
                <button
                  className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: "#fbf7f3", color: "#7a5c3e", border: "1px solid #e0d8cf" }}
                  onClick={() => {
                    setShowAttendanceModal(false);
                    setAttendanceBooking(null);
                  }}
                  disabled={rowActionsLoading[attendanceBooking.bookingId || attendanceBooking.sessionId] === "end"}
                >
                  Cancel
                </button>

                <button
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2"
                  style={{ backgroundColor: "#7c3aed" }}
                  onClick={confirmAttendanceAndComplete}
                  disabled={rowActionsLoading[attendanceBooking.bookingId || attendanceBooking.sessionId] === "end"}
                >
                  {rowActionsLoading[attendanceBooking.bookingId || attendanceBooking.sessionId] === "end" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>{rowActionsLoading[attendanceBooking.bookingId || attendanceBooking.sessionId] === "end" ? "Completing..." : "Complete Session"}</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}