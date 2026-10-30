import { useState, useEffect } from "react";

// ── Join window rules & constants ──────────────────────────
// Booking ke time-check ke barabar: Mentor 5 min pehle se session start/join kar sakta hai
export const EARLY_JOIN_MINUTES = 5; // button becomes active 5 minutes before scheduled start time (matches booking START_JOIN_BEFORE_MS)
export const LATE_LIMIT_MINUTES = 15; // button stays active up to 15 min after scheduled start if not started (matches booking START_LATE_LIMIT_MS)
export const MIN_ACTIVE_MINUTES = 5; // button stays active at least this long after start
export const IN_PROGRESS_GRACE_MINUTES = 30; // session stays joinable up to 30 min after scheduled end if in progress

export type JoinState = "upcoming" | "active" | "ended" | "hidden";

export interface SessionTimeData {
  scheduledAt?: string | Date;
  startTime?: string | Date;
  endTime?: string | Date;
  durationMinutes?: number;
  duration?: number;
  actualDuration?: number;
  slotTime?: string;
  status?: string;
  startedAt?: string | Date;
  endedAt?: string | Date;
  completion?: {
    actualDuration?: number;
  };
  bookings?: Array<{
    scheduledAt?: string | Date;
    startTime?: string | Date;
    endTime?: string | Date;
    slotTime?: string;
    status?: string;
    duration?: number;
    actualDuration?: number;
    startedAt?: string | Date;
    endedAt?: string | Date;
    completion?: {
      actualDuration?: number;
    };
  }>;
}

export interface JoinStateResult {
  state: JoinState;
  joinOpensAt: number;
  joinClosesAt: number;
  label: string;
  subtext: string;
  canJoin: boolean;
  disabled: boolean;
}

const INACTIVE_STATUSES = new Set([
  "cancelled",
  "completed",
  "done",
  "ended",
  "no_show",
  "refunded",
  "rejected",
]);

/**
 * Calculates slot duration in minutes from slot string like "10:00 - 10:45" or "10:00 AM - 10:45 AM"
 */
export function parseSlotDurationMinutes(slotTime?: string | null): number {
  if (!slotTime || typeof slotTime !== "string" || !slotTime.includes("-")) return 0;
  const [startStr, endStr] = slotTime.split("-").map((s) => s.trim());
  const parseToMinutes = (timeStr: string) => {
    const match = timeStr.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
    if (!match) return null;
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const ampm = match[3]?.toUpperCase();
    if (ampm === "PM" && h < 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return h * 60 + m;
  };
  const start = parseToMinutes(startStr);
  const end = parseToMinutes(endStr);
  if (start !== null && end !== null && end > start) {
    return end - start;
  }
  return 0;
}

/**
 * Strict fallback chain: actualDuration -> duration -> slot length, NEVER a fake 60.
 */
export function resolveSessionDuration(
  session?: SessionTimeData | null,
  booking?: SessionTimeData["bookings"] extends Array<infer U> ? U : any
): number {
  if (!session && !booking) return 0;

  // 1. actualDuration (booking takes precedence, then session)
  const actual =
    booking?.completion?.actualDuration ??
    booking?.actualDuration ??
    session?.completion?.actualDuration ??
    session?.actualDuration ??
    session?.bookings?.[0]?.completion?.actualDuration ??
    session?.bookings?.[0]?.actualDuration;
  if (typeof actual === "number" && actual > 0) return actual;

  // 2. duration (session planned duration or booking duration)
  const planned =
    (typeof session?.duration === "number" && session.duration > 0 ? session.duration : undefined) ??
    (typeof session?.durationMinutes === "number" && session.durationMinutes > 0 ? session.durationMinutes : undefined) ??
    (typeof booking?.duration === "number" && booking.duration > 0 ? booking.duration : undefined);
  if (typeof planned === "number" && planned > 0) return planned;

  // 3. slot length from slotTime
  const slotStr = booking?.slotTime || session?.slotTime || session?.bookings?.[0]?.slotTime;
  const slotMinutes = parseSlotDurationMinutes(slotStr);
  if (slotMinutes > 0) return slotMinutes;

  return 0;
}

/**
 * Comprehensive shared timing evaluator used by both mentee Overview and mentor BookingsPage.
 */
export function getSessionTiming(
  session: SessionTimeData,
  booking?: any,
  nowMs = Date.now()
) {
  const startVal = booking?.scheduledAt || booking?.startTime || session.scheduledAt || session.startTime;
  const startMs = startVal ? new Date(startVal).getTime() : NaN;
  const duration = resolveSessionDuration(session, booking);

  let endMs: number;
  const endVal = session.endTime || booking?.endTime;
  if (endVal) {
    const parsedEnd = new Date(endVal).getTime();
    endMs = !isNaN(parsedEnd) ? parsedEnd : (!isNaN(startMs) ? startMs + duration * 60000 : NaN);
  } else if (!isNaN(startMs)) {
    endMs = startMs + duration * 60000;
  } else {
    endMs = NaN;
  }

  const rawStatus = (booking?.status || session.status || "").toLowerCase();
  const isTerminal = ["cancelled", "no_show", "refunded", "rejected"].includes(rawStatus);
  const isCompleted = ["completed", "done", "ended"].includes(rawStatus);
  const isConfirmed = ["confirmed", "rescheduled", "open", "full"].includes(rawStatus);
  const isPending = rawStatus === "pending";

  const startedAtVal = booking?.startedAt || session.startedAt;
  const hasStartedAt = Boolean(startedAtVal);
  const graceMs = IN_PROGRESS_GRACE_MINUTES * 60 * 1000;

  // Stale and InProgress evaluation:
  // Treat in_progress as live only if startedAt exists and now <= endMs + 30 minutes grace.
  // Past that, mark it as stale (isStale = true) with a "Missed" or "Ended" label,
  // no Live badge, no Join button, and exclude it from Upcoming and its count.
  let isInProgress = false;
  let isStale = false;
  let staleLabel: "Missed" | "Ended" | "Expired" | null = null;

  if (rawStatus === "in_progress") {
    // status in_progress ka matlab mentor start kar chuka hai, startedAt payload me na aaye tab bhi live maano
    const isLive = !isNaN(endMs) && nowMs <= endMs + graceMs;
    if (isLive) {
      isInProgress = true;
      isStale = false;
    } else {
      isInProgress = false;
      isStale = true;
      staleLabel = "Ended";
    }
  } else if (!isTerminal && !isCompleted) {

    
    if (!isNaN(endMs) && nowMs > endMs) {
      isStale = true;
      if (isPending) {
        staleLabel = "Expired";
      } else {
        staleLabel = hasStartedAt ? "Ended" : "Missed";
      }
    }
  }

  // Upcoming:
  // Must NOT be terminal, completed, or stale.
  // Base Upcoming on session END time: nowMs <= endMs (or live in_progress)!
  const isUpcoming =
    !isTerminal &&
    !isCompleted &&
    !isStale &&
    (isInProgress || (!isNaN(endMs) ? nowMs <= endMs : (!isNaN(startMs) ? nowMs <= startMs : false)));

  // Start window:
  // Opens 5m before start; stays active while in progress (within grace)
  // or through scheduled end time (at least 15m after start)
  const windowOpensAt = !isNaN(startMs) ? startMs - EARLY_JOIN_MINUTES * 60 * 1000 : NaN;
  const windowClosesAt =
    isInProgress && !isNaN(endMs)
      ? endMs + graceMs
      : !isNaN(endMs) && endMs > startMs
        ? endMs
        : !isNaN(startMs)
          ? startMs + LATE_LIMIT_MINUTES * 60 * 1000
          : NaN;

  const isWithinStartWindow =
    !isStale &&
    (isInProgress ||
      (!isNaN(windowOpensAt) && !isNaN(windowClosesAt) && nowMs >= windowOpensAt && nowMs <= windowClosesAt));

  // Requirement: Show the Join button only for confirmed/live sessions inside start window, never stale.
  // Pending and stale bookings NEVER show Join.
  const canJoin = !isStale && (isConfirmed || isInProgress) && isWithinStartWindow;

  return {
    startMs,
    endMs,
    durationMinutes: duration,
    rawStatus,
    isTerminal,
    isCompleted,
    isInProgress,
    isConfirmed,
    isPending,
    isUpcoming,
    isWithinStartWindow,
    isStale,
    staleLabel,
    canJoin,
  };
}

/**
 * Pure helper to compute join window bounds (epoch ms)
 */
export function getJoinWindow(session: SessionTimeData): {
  joinOpensAt: number;
  joinClosesAt: number;
} {
  const startStr = session.startTime || session.scheduledAt;
  const startMs = startStr ? new Date(startStr).getTime() : NaN;
  if (isNaN(startMs)) {
    return { joinOpensAt: NaN, joinClosesAt: NaN };
  }

  const joinOpensAt = startMs - EARLY_JOIN_MINUTES * 60 * 1000;
  const duration = resolveSessionDuration(session);

  let joinClosesAt: number;
  if (session.endTime) {
    const endMs = new Date(session.endTime).getTime();
    if (!isNaN(endMs)) {
      joinClosesAt = Math.max(endMs, startMs + LATE_LIMIT_MINUTES * 60 * 1000);
    } else {
      joinClosesAt = startMs + Math.max(duration, LATE_LIMIT_MINUTES) * 60 * 1000;
    }
  } else {
    joinClosesAt = startMs + Math.max(duration, LATE_LIMIT_MINUTES) * 60 * 1000;
  }

  return { joinOpensAt, joinClosesAt };
}

/**
 * Format remaining time until start into human-friendly string:
 * "Starts in 2h 15m", "Starts in 45m", "Starts in 1d 4h", etc.
 */
export function formatStartsInCountdown(diffMs: number): string {
  if (diffMs <= 0) return "Starts now";

  const totalMinutes = Math.ceil(diffMs / 60000);
  if (totalMinutes < 1) return "Starts in <1m";
  if (totalMinutes < 60) return `Starts in ${totalMinutes}m`;

  const hours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;

  if (hours < 24) {
    return remainingMins > 0
      ? `Starts in ${hours}h ${remainingMins}m`
      : `Starts in ${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0
    ? `Starts in ${days}d ${remHours}h`
    : `Starts in ${days}d`;
}

/**
 * Pure helper to evaluate session join state at a given reference time.
 * @param session - Session with start/end time and status
 * @param nowMs - Current time in ms (or Date)
 * @param serverOffsetMs - Clock skew offset: Date.parse(serverNow) - Date.now()
 */
export function getJoinState(
  session: SessionTimeData,
  nowMs: number | Date = Date.now(),
  serverOffsetMs = 0
): JoinStateResult {
  const status = (session.status || "").toLowerCase();
  if (INACTIVE_STATUSES.has(status)) {
    return {
      state: "hidden",
      joinOpensAt: NaN,
      joinClosesAt: NaN,
      label: "Ended",
      subtext: "Session inactive",
      canJoin: false,
      disabled: true,
    };
  }

  const currentMs =
    (typeof nowMs === "number" ? nowMs : nowMs.getTime()) + serverOffsetMs;

  const { joinOpensAt, joinClosesAt } = getJoinWindow(session);
  if (isNaN(joinOpensAt) || isNaN(joinClosesAt)) {
    return {
      state: "upcoming",
      joinOpensAt: NaN,
      joinClosesAt: NaN,
      label: "Join",
      subtext: "Time not set",
      canJoin: false,
      disabled: true,
    };
  }

  const startStr = session.startTime || session.scheduledAt;
  const startMs = startStr ? new Date(startStr).getTime() : NaN;

  // 1. Session is currently live / in progress or in 5m window
  if (status === "in_progress" || (currentMs >= joinOpensAt && currentMs <= joinClosesAt)) {
    const isEarlyWindow = !isNaN(startMs) && currentMs < startMs;
    return {
      state: "active",
      joinOpensAt,
      joinClosesAt,
      label: "Join",
      subtext: isEarlyWindow ? "Starts soon" : "Live now",
      canJoin: true,
      disabled: false,
    };
  }

  // 2. Upcoming (not yet started / before 5m window)
  if (currentMs < joinOpensAt) {
    const countdownTarget = !isNaN(startMs) ? startMs : joinOpensAt;
    const diffMs = countdownTarget - currentMs;
    return {
      state: "upcoming",
      joinOpensAt,
      joinClosesAt,
      label: "Join",
      subtext: formatStartsInCountdown(diffMs),
      canJoin: false,
      disabled: true,
    };
  }

  // 3. Ended (time window closed)
  return {
    state: "ended",
    joinOpensAt,
    joinClosesAt,
    label: "Ended",
    subtext: "Session ended",
    canJoin: false,
    disabled: true,
  };
}

/**
 * Shared ticking hook that updates timestamp every intervalMs.
 * Cleans up interval on unmount.
 */
export function useNow(intervalMs = 15000): number {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
