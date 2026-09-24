//src/features/mentorship/components/user-dashboard/UserDashboardUpcomingSessionsPage.tsx

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarClock,
  Clock,
  Video,
  MapPin,
  Loader2,
  XCircle,
} from "lucide-react";
import SessionService from "@/lib/api/session.service";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { joinMentorshipSession } from "@/features/mentorship/services/sessionJoin.service";

const COLORS = {
  ink: "#4a3728",
  accent: "#7a5c3e",
  hairline: "#e0d8cf",
  wash: "#f6ede8",
  softWash: "#fbf7f3",
  chip: "#f3ece4",
  paper: "#fffdfb",
  gold: "#c9a87c",
  muted: "#8a7a6a",
  faint: "#a08070",
  danger: "#dc2626",
  dangerWash: "#fef2f2",
};

type Session = {
  _id?: string;
  sessionId?: string;
  bookingId?: string;
  mentorName?: string;
  mentorProfilePhoto?: string;
  title?: string;
  sessionType?: string;
  scheduledAt?: string;
  startTime?: string;
  date?: string;
  status?: string;
  duration?: number;
  slotTime?: string;
  startedAt?: string;
  endedAt?: string;
  bookings?: Record<string, unknown>[];
};

interface Props {
  sessions?: Session[];
  setActivePage?: (page: string) => void;
  user?: any;
}

function formatDateStr(iso?: string) {
  if (!iso) return "Date not set";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Date not set";
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "long", year: "numeric" });
}

function formatTimeStr(iso?: string) {
  if (!iso) return "Time not set";
  const d = new Date(iso);
  if (!isNaN(d.getTime())) {
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: true });
  }
  const match = iso.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = match[4]?.toUpperCase() || (hours >= 12 ? "PM" : "AM");
    if (!match[4]) {
      hours = hours % 12 || 12;
    }
    return `${hours}:${minutes} ${ampm}`;
  }
  return iso;
}

function initialsFrom(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "S";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

const getStatusDisplay = (status: string, isPast: boolean = false) => {
  if (isPast && (status.toLowerCase() === 'in_progress' || status.toLowerCase() === 'confirmed' || status.toLowerCase() === 'pending')) {
    return 'Ended';
  }
  switch (status.toLowerCase()) {
    case 'pending': return 'Pending';
    case 'confirmed': return 'Confirmed';
    case 'in_progress': return 'In Progress';
    case 'completed': return 'Completed';
    case 'cancelled': return 'Cancelled';
    case 'rescheduled': return 'Rescheduled';
    case 'no_show': return 'No Show';
    case 'refunded': return 'Refunded';
    default: return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Scheduled';
  }
};

/**
 * Calculates the session's actual start and end timestamps (in ms) using:
 * - scheduledAt / date / booking.scheduledAt
 * - startTime / slotTime
 * - duration (defaults to 60 minutes if missing or 0)
 */
export function getSessionTimeWindow(session: Session): {
  startMs: number | null;
  endMs: number | null;
  durationMinutes: number;
} {
  const booking = session.bookings?.[0] as Record<string, unknown> | undefined;

  // 1. Resolve raw date/time candidate
  const rawDateTime =
    booking?.scheduledAt ||
    session.scheduledAt ||
    session.startTime ||
    (session as any).date;

  if (!rawDateTime) {
    return { startMs: null, endMs: null, durationMinutes: 60 };
  }

  let startDate: Date;
  const parsed = new Date(rawDateTime as string | number | Date);

  if (!isNaN(parsed.getTime())) {
    startDate = new Date(parsed.getTime());

    // If startTime is a separate non-ISO string like "14:30" or "02:30 PM", adjust time:
    const timeStr = typeof session.startTime === "string" ? session.startTime.trim() : null;
    if (timeStr && !timeStr.includes("T") && !timeStr.includes("Z")) {
      const match = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/i);
      if (match) {
        let hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const ampm = match[4]?.toLowerCase();
        if (ampm === "pm" && hours < 12) hours += 12;
        if (ampm === "am" && hours === 12) hours = 0;
        startDate.setHours(hours, minutes, 0, 0);
      }
    }
  } else {
    // If not directly parseable, try combining datePart and timePart
    const datePart = (session as any).date || session.scheduledAt;
    const timePart = session.startTime || (session as any).slotTime;
    if (datePart && timePart) {
      const combined = new Date(`${datePart} ${timePart}`);
      if (!isNaN(combined.getTime())) {
        startDate = combined;
      } else {
        return { startMs: null, endMs: null, durationMinutes: 60 };
      }
    } else {
      return { startMs: null, endMs: null, durationMinutes: 60 };
    }
  }

  const startMs = startDate.getTime();

  // 2. Resolve duration (in minutes, min 5, max 480, default 60)
  let durationMinutes = 60;
  if (typeof session.duration === "number" && !isNaN(session.duration) && session.duration > 0) {
    durationMinutes = session.duration;
  } else if (typeof session.duration === "string") {
    const parsedDur = parseInt(session.duration, 10);
    if (!isNaN(parsedDur) && parsedDur > 0) {
      durationMinutes = parsedDur;
    }
  }

  const endMs = startMs + durationMinutes * 60 * 1000;
  return { startMs, endMs, durationMinutes };
}

const TERMINAL_STATUSES = new Set(["cancelled", "completed", "refunded", "no_show"]);
const INCOMING_EARLY_JOIN_WINDOW_MS = 15 * 60 * 1000; // 15 mins before scheduled start

/**
 * Evaluates whether a session is currently live and whether it can be joined.
 *
 * Requirements:
 * 1. A session whose scheduled date/time and duration have completely passed (now >= endMs) must NEVER:
 *    - show "LIVE NOW"
 *    - show an enabled "Join Session" button
 *    - be considered currently joinable.
 * 2. Do NOT rely on backend `status === "in_progress"` alone to determine whether a session is live.
 * 3. The valid live window is: session start time <= current time < session end time.
 * 4. `canJoin` is true only when:
 *    - session is actually within its valid live/join window, OR
 *    - it is the current Incoming Session target and is within the allowed incoming/join window.
 * 5. A targetSessionId from Incoming Session popup must NOT make an arbitrary old/past session joinable.
 * 6. Future sessions must remain non-joinable.
 */
export function evaluateSessionLiveStatus(
  session: Session,
  isTarget: boolean,
  now: number = Date.now()
): {
  isLive: boolean;
  canJoin: boolean;
  isPast: boolean;
  isFuture: boolean;
  startMs: number | null;
  endMs: number | null;
} {
  const { startMs, endMs } = getSessionTimeWindow(session);

  const sessionStatus = (session.status || "").toLowerCase().trim();
  const bookingStatus = typeof session.bookings?.[0]?.status === "string"
    ? (session.bookings[0].status as string).toLowerCase().trim()
    : "";

  const isTerminal = TERMINAL_STATUSES.has(sessionStatus) || TERMINAL_STATUSES.has(bookingStatus);

  if (startMs === null || endMs === null || isTerminal) {
    return {
      isLive: false,
      canJoin: false,
      isPast: endMs !== null ? now >= endMs : false,
      isFuture: startMs !== null ? now < startMs : false,
      startMs,
      endMs,
    };
  }

  const isPast = now >= endMs;
  const isFuture = now < startMs;

  // Valid live window: startMs <= now < endMs
  const isLive = !isPast && !isFuture;

  // canJoin: actually live OR incoming popup target within allowed early window, but NEVER if past
  const isWithinIncomingWindow = isTarget && !isPast && now >= (startMs - INCOMING_EARLY_JOIN_WINDOW_MS);
  const canJoin = isLive || isWithinIncomingWindow;

  return {
    isLive,
    canJoin,
    isPast,
    isFuture,
    startMs,
    endMs,
  };
}

export default function UserDashboardUpcomingSessionsPage({ setActivePage, user }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: authUser } = useAuth();
  const currentUserId = user?.userId || user?.id || user?._id || authUser?.userId || authUser?.id || authUser?._id;

  const targetSessionId = searchParams?.get("sessionId") || null;
  const targetBookingId = searchParams?.get("bookingId") || null;

  const [upcoming, setUpcoming] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Periodically refresh current time to update live/ended states dynamically
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Cancel Modal State
  const [cancelModal, setCancelModal] = useState<{
    isOpen: boolean;
    sessionId: string | null;
    bookingId: string | null;
    reason: string;
    isCanceling: boolean;
  }>({
    isOpen: false,
    sessionId: null,
    bookingId: null,
    reason: "",
    isCanceling: false,
  });

  // Reschedule Modal State
  const [rescheduleModal, setRescheduleModal] = useState<{
    isOpen: boolean;
    sessionId: string | null;
    bookingId: string | null;
    newDate: string;
    newTime: string;
    reason: string;
    isRescheduling: boolean;
  }>({
    isOpen: false,
    sessionId: null,
    bookingId: null,
    newDate: "",
    newTime: "",
    reason: "",
    isRescheduling: false,
  });

  const fetchUpcoming = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await SessionService.getAllSessions({ role: "mentee", limit: 100 });
      let fetchedSessions = (res.data || []) as Session[];

      // If a targetSessionId was specified by the Incoming Session flow but is not in
      // the list (e.g. status changed or pagination), fetch the real session from the backend:
      if (targetSessionId) {
        const found = fetchedSessions.some((s) => (s.sessionId || s._id) === targetSessionId);
        if (!found) {
          try {
            const singleRes = await SessionService.getSessionById(targetSessionId);
            const singleSession = singleRes?.data ?? singleRes;
            if (singleSession && (singleSession.sessionId || singleSession._id)) {
              fetchedSessions = [singleSession, ...fetchedSessions];
            }
          } catch (fetchErr) {
            console.warn("Could not load target session by id", fetchErr);
          }
        }
      }

      // Map each of THIS mentee's bookings to its own upcoming session item.
      // Uses the actual sessionId and bookingId from the backend response, identifying
      // the logged-in user's booking without using array indices or default first booking.
      const menteeSessionItems: Session[] = [];
      for (const s of fetchedSessions) {
        const sid = s.sessionId || s._id;
        const isTarget = targetSessionId ? sid === targetSessionId : false;

        const myBookings = (s.bookings || []).filter((b: any) => {
          const bId = b.bookingId || b._id;
          if (targetBookingId && bId === targetBookingId) return true;
          return Boolean(currentUserId && (b.menteeId === currentUserId || b.bookedBy === currentUserId));
        });

        if (myBookings.length > 0) {
          for (const b of myBookings) {
            const resolvedBookingId = (b.bookingId as string) || (b._id as string);
            menteeSessionItems.push({
              ...s,
              bookingId: resolvedBookingId,
              scheduledAt: (b.scheduledAt as string) || s.scheduledAt,
              startTime: (b.scheduledAt as string) || s.startTime,
              status: (b.status as string) || s.status,
              bookings: [b],
            });
          }
        } else {
          // If no bookings array matched, check if the session document directly belongs to mentee or is target
          const isUserMentee = Boolean(currentUserId && (s as any).menteeId === currentUserId);
          if (isUserMentee || isTarget) {
            menteeSessionItems.push({
              ...s,
              bookingId: targetBookingId || (s as any).bookingId,
              bookings: s.bookings || [],
            });
          }
        }
      }

      // Current local datetime
      const currentNow = Date.now();
      const excludedStatuses = new Set(["cancelled", "completed", "refunded", "no_show"]);

      const validUpcoming = menteeSessionItems
        .filter((s) => {
          const sid = s.sessionId || s._id;
          const isTarget = targetSessionId ? sid === targetSessionId : false;

          const sessionStatus = (s.status || "").toLowerCase().trim();
          const bookingStatus = typeof s.bookings?.[0]?.status === "string"
            ? (s.bookings[0].status as string).toLowerCase().trim()
            : "";

          // Exclude cancelled/completed/refunded/no_show unless specifically targeted
          if (!isTarget && (excludedStatuses.has(sessionStatus) || excludedStatuses.has(bookingStatus))) {
            return false;
          }

          const { startMs, isLive } = evaluateSessionLiveStatus(s, isTarget, currentNow);
          const sessionTime = startMs ?? 0;
          const isInProgress = sessionStatus === "in_progress" || bookingStatus === "in_progress";

          // Keep if scheduled for future, OR session is currently live, OR session status is in_progress, OR incoming target session
          return (sessionTime > currentNow) || isLive || isInProgress || isTarget;
        })
        .sort((a, b) => {
          const sidA = a.sessionId || a._id;
          const sidB = b.sessionId || b._id;

          // Target session from the Incoming popup always floats to the top
          if (targetSessionId) {
            if (sidA === targetSessionId) return -1;
            if (sidB === targetSessionId) return 1;
          }

          // Active live sessions float right after incoming target session
          const statusA = evaluateSessionLiveStatus(a, sidA === targetSessionId, currentNow);
          const statusB = evaluateSessionLiveStatus(b, sidB === targetSessionId, currentNow);
          if (statusA.isLive && !statusB.isLive) return -1;
          if (!statusA.isLive && statusB.isLive) return 1;

          const timeA = statusA.startMs ?? 0;
          const timeB = statusB.startMs ?? 0;

          return timeA - timeB;
        });

      setUpcoming(validUpcoming);
    } catch (err: unknown) {
      console.error("Failed to fetch upcoming sessions", err);
      const errorMessage = err instanceof Error ? err.message : "Unable to load upcoming sessions.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, targetSessionId, targetBookingId]);

  useEffect(() => {
    fetchUpcoming();
  }, [fetchUpcoming]);

  // UX: Automatically locate and scroll the target session card into view
  useEffect(() => {
    if (!loading && targetSessionId && upcoming.length > 0) {
      const el = document.getElementById(`session-card-${targetSessionId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [loading, targetSessionId, upcoming]);

  // Shared session join executor reusing the centralized join service
  const handleJoinSession = async (sessionId?: string, bookingId?: string) => {
    if (!sessionId) return;
    setJoiningId(sessionId);
    try {
      await joinMentorshipSession({
        sessionId,
        bookingId,
        router,
        onError: (err: Error) => {
          alert(err.message || "Unable to join session. Please try again.");
        },
      });
    } catch {
      // Error handled by onError
    } finally {
      setJoiningId(null);
    }
  };

  const openCancelModal = (sessionId: string, bookingId?: string) => {
    if (!bookingId) {
      alert("Error: Booking ID is missing. Cannot cancel session.");
      return;
    }
    setCancelModal({
      isOpen: true,
      sessionId,
      bookingId,
      reason: "",
      isCanceling: false,
    });
  };

  const confirmCancelSession = async () => {
    const { sessionId, bookingId, reason } = cancelModal;
    if (!sessionId || !bookingId) {
      alert("Missing required session or booking information.");
      return;
    }

    // Backend validation requires minimum 10 characters
    if (reason.trim().length < 10) {
      alert("Cancellation reason must be at least 10 characters.");
      return;
    }

    try {
      setCancelModal(prev => ({ ...prev, isCanceling: true }));
      await SessionService.cancelSession(sessionId, reason.trim(), bookingId);
      alert("Session cancelled successfully.");
      setCancelModal({ isOpen: false, sessionId: null, bookingId: null, reason: "", isCanceling: false });
      await fetchUpcoming();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to cancel session.";
      alert(`Cancellation failed: ${errorMessage}`);
      setCancelModal(prev => ({ ...prev, isCanceling: false }));
    }
  };

  const openRescheduleModal = (sessionId: string, bookingId?: string) => {
    if (!bookingId) {
      alert("Error: Booking ID is missing. Cannot reschedule session.");
      return;
    }
    setRescheduleModal({
      isOpen: true,
      sessionId,
      bookingId,
      newDate: "",
      newTime: "",
      reason: "",
      isRescheduling: false,
    });
  };

  const confirmRescheduleSession = async () => {
    const { sessionId, bookingId, newDate, newTime, reason } = rescheduleModal;
    if (!sessionId || !bookingId || !newDate || !newTime) {
      alert("Please provide both new date and time.");
      return;
    }

    if (reason.trim().length > 0 && reason.trim().length < 3) {
      alert("Reason must be at least 3 characters if provided.");
      return;
    }

    const newScheduledAt = new Date(`${newDate}T${newTime}`).toISOString();

    try {
      setRescheduleModal(prev => ({ ...prev, isRescheduling: true }));
      await SessionService.rescheduleSession(sessionId, newScheduledAt, reason.trim(), bookingId);
      alert("Session rescheduled successfully.");
      setRescheduleModal({ isOpen: false, sessionId: null, bookingId: null, newDate: "", newTime: "", reason: "", isRescheduling: false });
      await fetchUpcoming();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to reschedule session.";
      alert(`Reschedule failed: ${errorMessage}`);
      setRescheduleModal(prev => ({ ...prev, isRescheduling: false }));
    }
  };

  const navigateToBookings = () => {
    if (setActivePage) {
      setActivePage("my-bookings");
    } else {
      router.push("/mentorship/dashboard");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fadeIn max-w-5xl space-y-4">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: COLORS.accent }} />
        <p className="text-sm font-medium" style={{ color: COLORS.muted }}>
          Loading your upcoming sessions...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center animate-fadeIn max-w-5xl rounded-2xl"
        style={{ backgroundColor: COLORS.dangerWash, border: `1px solid #fca5a5` }}>
        <p className="text-sm font-semibold" style={{ color: COLORS.danger }}>{error}</p>
        <button
          onClick={fetchUpcoming}
          className="mt-4 px-4 py-2 text-xs font-bold rounded-lg shadow-sm bg-white hover:bg-gray-50 transition-colors"
          style={{ color: COLORS.danger, border: `1px solid #fca5a5` }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl relative">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: COLORS.ink }}>
          Upcoming Sessions
        </h2>
        <p style={{ color: COLORS.muted }} className="text-sm mt-1">
          Manage and join your scheduled mentorship sessions.
        </p>
      </div>

      {upcoming.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center gap-3 py-16 rounded-2xl text-center"
          style={{ backgroundColor: COLORS.softWash, border: `1px solid ${COLORS.hairline}` }}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.chip }}>
            <CalendarClock className="w-8 h-8" style={{ color: COLORS.accent }} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: COLORS.ink }}>No upcoming sessions</h3>
            <p className="text-sm mt-1" style={{ color: COLORS.muted }}>
              You don't have any upcoming sessions scheduled at the moment.
            </p>
          </div>
          <button
            onClick={() => router.push("/mentorship/explore")}
            className="mt-4 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 shadow-md"
            style={{ backgroundColor: COLORS.ink, color: "#fff" }}
          >
            Find a Mentor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {upcoming.map((s, idx) => {
            const name = s.mentorName || "Mentor";
            const photo = s.mentorProfilePhoto;
            const isOnline = !s.sessionType || s.sessionType.toLowerCase() === "virtual" || s.sessionType.toLowerCase() === "online";
            const sid = s.sessionId ?? s._id;

            // Getting bookingId. Use the accurately resolved bookingId, or fall back to matched booking
            const bookingId = s.bookingId || s.bookings?.[0]?.bookingId || (s.bookings?.[0] as any)?._id;

            const isTarget = Boolean(targetSessionId && sid === targetSessionId);
            const { isLive, canJoin, isPast } = evaluateSessionLiveStatus(s, isTarget, currentTime);

            return (
              <div
                id={sid ? `session-card-${sid}` : undefined}
                key={`${sid ?? idx}-${bookingId ?? idx}`}
                className={`flex flex-col p-4 md:p-5 rounded-2xl transition-all duration-300 ${
                  isTarget
                    ? "bg-[#fffdfb] shadow-xl ring-2 ring-[#7a5c3e] border-2 border-[#7a5c3e]"
                    : "bg-white hover:shadow-sm"
                }`}
                style={{ border: isTarget ? "2px solid #7a5c3e" : `1px solid ${COLORS.hairline}` }}
              >
                {/* Highlight banner when reached from Incoming Session popup */}
                {isTarget && (
                  <div
                    className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl mb-3 text-xs font-bold"
                    style={{ backgroundColor: "#f3ece4", color: "#4a3728", border: "1px solid #e0d8cf" }}
                  >
                    <span className="flex items-center gap-2">
                      {!isPast && (
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7a5c3e] opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#7a5c3e]" />
                        </span>
                      )}
                      <span>{isPast ? "Selected Past Session" : "Incoming Session Ready"}</span>
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white border border-[#e0d8cf] text-[#7a5c3e]">
                      Selected from Popup
                    </span>
                  </div>
                )}

                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                  {/* 1. Mentor Info */}
                  <div className="flex items-center gap-3 w-full md:w-[28%] shrink-0">
                    {photo ? (
                      <img
                        src={photo}
                        alt={name}
                        className="w-12 h-12 rounded-full object-cover shrink-0"
                        style={{ border: `1px solid ${COLORS.hairline}` }}
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-base font-bold text-white"
                        style={{ backgroundColor: COLORS.ink }}
                      >
                        {initialsFrom(name)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate" style={{ color: COLORS.ink }}>
                        {name}
                      </p>
                      <p className="text-xs truncate mt-0.5" style={{ color: COLORS.muted }}>
                        Mentor
                      </p>
                      <div className="mt-1.5 flex items-center">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider"
                          style={{
                            backgroundColor: isLive ? "#dbeafe" : isPast ? "#fee2e2" : COLORS.chip,
                            color: isLive ? "#1d4ed8" : isPast ? "#b91c1c" : COLORS.accent,
                          }}
                        >
                          {isLive ? "Live Now" : isPast ? (s.status?.toLowerCase() === "completed" ? "Completed" : "Ended") : getStatusDisplay(s.status || "")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Session Details */}
                  <div className="w-full md:flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 md:px-4 md:border-l" style={{ borderColor: COLORS.hairline }}>
                    <div className="space-y-1">
                      <p className="text-sm font-bold line-clamp-2" style={{ color: COLORS.ink }} title={s.title || "Mentorship Session"}>
                        {s.title || "Mentorship Session"}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: COLORS.muted }}>
                        <CalendarClock className="w-3.5 h-3.5 shrink-0" />
                        <span>{formatDateStr(s.scheduledAt || s.startTime)}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1 sm:pt-0">
                      <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: COLORS.muted }}>
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {formatTimeStr(s.scheduledAt || s.startTime)}
                          {s.duration ? ` (${s.duration} min)` : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: COLORS.muted }}>
                        {isOnline ? (
                          <Video className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>{isOnline ? "Online Meeting" : "In Person"}</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Actions */}
                  <div className="flex flex-col gap-2 shrink-0 w-full md:w-[165px] md:border-l md:pl-4 pt-4 md:pt-0 border-t md:border-t-0 mt-2 md:mt-0" style={{ borderColor: COLORS.hairline }}>
                    <button
                      onClick={() => canJoin && handleJoinSession(sid, bookingId as string)}
                      disabled={!canJoin || joiningId === sid}
                      title={
                        isPast
                          ? "This session has already ended"
                          : !canJoin
                          ? "Session hasn't started yet"
                          : "Join this session"
                      }
                      className={`w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm text-center disabled:cursor-not-allowed flex items-center justify-center gap-1.5 ${
                        isTarget && canJoin ? "animate-pulse ring-2 ring-[#7a5c3e]/40" : ""
                      }`}
                      style={{
                        backgroundColor: canJoin ? COLORS.ink : "#e5e0d8",
                        color: canJoin ? "#fff" : "#9c9186",
                      }}
                    >
                      {joiningId === sid ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Joining...
                        </>
                      ) : (
                        "Join Session"
                      )}
                    </button>
                    <button
                      onClick={navigateToBookings}
                      className="w-full px-3 py-2 rounded-xl text-xs font-semibold transition-colors hover:border-[#c9baa9] text-center"
                      style={{ backgroundColor: COLORS.wash, color: COLORS.accent, border: `1px solid ${COLORS.hairline}` }}
                    >
                      View Details
                    </button>
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={() => sid && openRescheduleModal(sid, bookingId as string)}
                        className="flex-1 px-1.5 py-1.5 rounded-lg text-[10px] font-semibold transition-colors hover:bg-gray-50 text-center uppercase"
                        style={{ color: COLORS.muted, border: `1px solid ${COLORS.hairline}` }}
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => sid && openCancelModal(sid, bookingId as string)}
                        className="flex-1 px-1.5 py-1.5 rounded-lg text-[10px] font-semibold transition-colors hover:bg-red-50 text-center text-red-600 uppercase"
                        style={{ border: `1px solid #fca5a5` }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative" style={{ border: `1px solid ${COLORS.hairline}` }}>
            <button
              onClick={() => !cancelModal.isCanceling && setCancelModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              disabled={cancelModal.isCanceling}
            >
              <XCircle className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.ink }}>Cancel Session</h3>
            <p className="text-sm mb-4" style={{ color: COLORS.muted }}>
              Are you sure you want to cancel this session? Please provide a reason to help your mentor understand (min 10 characters).
            </p>
            <textarea
              value={cancelModal.reason}
              onChange={(e) => setCancelModal(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Reason for cancellation (required, min 10 chars)..."
              className="w-full border rounded-xl p-3 text-sm mb-4 focus:outline-none focus:ring-2"
              style={{ borderColor: COLORS.hairline, outlineColor: COLORS.accent }}
              rows={3}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setCancelModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                style={{ backgroundColor: COLORS.wash, color: COLORS.accent }}
                disabled={cancelModal.isCanceling}
              >
                Keep Session
              </button>
              <button
                onClick={confirmCancelSession}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2 transition-colors disabled:opacity-50"
                style={{ backgroundColor: COLORS.danger }}
                disabled={cancelModal.isCanceling || cancelModal.reason.trim().length < 10}
              >
                {cancelModal.isCanceling ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Canceling...</>
                ) : (
                  "Confirm Cancel"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative" style={{ border: `1px solid ${COLORS.hairline}` }}>
            <button
              onClick={() => !rescheduleModal.isRescheduling && setRescheduleModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              disabled={rescheduleModal.isRescheduling}
            >
              <XCircle className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.ink }}>Reschedule Session</h3>
            <p className="text-sm mb-4" style={{ color: COLORS.muted }}>
              Select a new date and time for your session. (Note: Subject to mentor approval and 24h limit)
            </p>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: COLORS.ink }}>New Date</label>
                <input
                  type="date"
                  value={rescheduleModal.newDate}
                  onChange={(e) => setRescheduleModal(prev => ({ ...prev, newDate: e.target.value }))}
                  className="w-full border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: COLORS.hairline, outlineColor: COLORS.accent }}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: COLORS.ink }}>New Time</label>
                <input
                  type="time"
                  value={rescheduleModal.newTime}
                  onChange={(e) => setRescheduleModal(prev => ({ ...prev, newTime: e.target.value }))}
                  className="w-full border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: COLORS.hairline, outlineColor: COLORS.accent }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: COLORS.ink }}>Reason (Optional)</label>
                <textarea
                  value={rescheduleModal.reason}
                  onChange={(e) => setRescheduleModal(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Reason for rescheduling..."
                  className="w-full border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: COLORS.hairline, outlineColor: COLORS.accent }}
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRescheduleModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                style={{ backgroundColor: COLORS.wash, color: COLORS.accent }}
                disabled={rescheduleModal.isRescheduling}
              >
                Close
              </button>
              <button
                onClick={confirmRescheduleSession}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2 transition-colors disabled:opacity-50"
                style={{ backgroundColor: COLORS.ink }}
                disabled={rescheduleModal.isRescheduling || !rescheduleModal.newDate || !rescheduleModal.newTime}
              >
                {rescheduleModal.isRescheduling ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                ) : (
                  "Reschedule"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}