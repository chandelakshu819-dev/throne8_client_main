import { useState, useEffect } from "react";

// ── Join window rules & constants ──────────────────────────
// Booking ke time-check ke barabar: Mentor 5 min pehle se session start/join kar sakta hai
export const EARLY_JOIN_MINUTES = 5; // button becomes active 5 minutes before scheduled start time (matches booking START_JOIN_BEFORE_MS)
export const LATE_LIMIT_MINUTES = 15; // button stays active up to 15 min after scheduled start if not started (matches booking START_LATE_LIMIT_MS)
export const MIN_ACTIVE_MINUTES = 5; // button stays active at least this long after start

export type JoinState = "upcoming" | "active" | "ended" | "hidden";

export interface SessionTimeData {
  scheduledAt?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  duration?: number;
  status?: string;
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
  "no_show",
  "refunded",
  "rejected",
]);

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

  let joinClosesAt: number;
  if (session.endTime) {
    const endMs = new Date(session.endTime).getTime();
    if (!isNaN(endMs)) {
      joinClosesAt = Math.max(endMs, startMs + LATE_LIMIT_MINUTES * 60 * 1000);
    } else {
      const duration = Number(session.durationMinutes ?? session.duration ?? 60);
      joinClosesAt = startMs + Math.max(duration, LATE_LIMIT_MINUTES) * 60 * 1000;
    }
  } else {
    const duration = Number(session.durationMinutes ?? session.duration ?? 60);
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
