"use client";
// src/features/mentorship/utils/notificationRouting.ts
//
// Ek hi jagah par decide hota hai ki mentorship notification par click karne par
// user kaha jayega, aur kaun sa notification kis role (mentor / mentee) ko dikhna chahiye.
//
// Pehle har notification seedha `data.actionUrl` par jata tha, bina kisi check ke.
// Isse 4 bugs aate the:
//   1. actionUrl me userId missing (/mentorship/user-dashboard?page=...) -> landing page khulta tha
//   2. Session khatam hone ke baad bhi live room khulta tha
//   3. Booking request par click karne se mentor ko Bookings tab nahi milta tha
//   4. Mentee ke notifications mentor ki list me dikhte the (same API, same module)

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import SessionService from "@/lib/api/session.service";

export type NotificationRole = "mentee" | "mentor" | "senior-mentor";

export interface NotificationLike {
  type?: string;
  rawType?: string; // backend ka asli type (e.g. "new_booking_request")
  title?: string;
  message?: string;
  data?: Record<string, any>;
}

export interface NotificationTarget {
  url: string;
  notice?: string;
}

export type NotificationKind =
  | "booking_request" // mentee ne request bheji -> MENTOR ko
  | "booking_request_sent" // "request bhej di gayi" -> MENTEE ko
  | "booking_confirmed" // mentor ne accept kiya -> MENTEE ko
  | "session_live" // reminder / started / joined
  | "session_ended"
  | "other";

const norm = (s?: string) => String(s ?? "").toLowerCase().replace(/[_-]+/g, " ");
const haystack = (n: NotificationLike) => `${norm(n.rawType)} | ${norm(n.title)} | ${norm(n.message)}`;

// NOTE: ye regex backend ke type/title/message text par based hain. Agar backend naya type
// add kare to yaha ek line add kar dena. Best fix: backend `data.recipientRole` bhejna.
export function classifyNotification(n: NotificationLike): NotificationKind {
  const t = haystack(n);
  if (/\b(ended|completed|cancelled|canceled|no show|refunded)\b/.test(t)) return "session_ended";
  if (/\b(request sent|request submitted)\b/.test(t)) return "booking_request_sent";
  if (/\b(confirmed|accepted)\b/.test(t)) return "booking_confirmed";
  if (/(new booking request|booking request (received|from)|requested a (session|booking)|wants to book)/.test(t))
    return "booking_request";
  if (/(starts in|starting|reminder|has started|session started|joined the session|has joined|join now)/.test(t))
    return "session_live";
  return "other";
}

/** Kya ye notification is role ko dikhna chahiye? */
export function isNotificationForRole(n: NotificationLike, role: NotificationRole): boolean {
  const explicit = String(n.data?.recipientRole ?? n.data?.role ?? n.data?.audience ?? "").toLowerCase();
  if (explicit) {
    if (/(mentee|student|learner|^user$)/.test(explicit)) return role === "mentee";
    if (/mentor/.test(explicit)) return role !== "mentee";
  }

  const t = haystack(n);
  if (/\byour mentor\b/.test(t)) return role === "mentee";
  if (/\byour mentee\b|\bmentee has joined\b/.test(t)) return role !== "mentee";
  // "Start it when you are ready" -> sirf mentor session start kar sakta hai, mentee ko ye nahi dikhna chahiye
  if (/(start it when you are ready|you can start the session|start the session when)/.test(t)) return role !== "mentee";

  const kind = classifyNotification(n);
  if (role === "mentee") return kind !== "booking_request";
  return kind !== "booking_confirmed" && kind !== "booking_request_sent";
}

// ── URL helpers ──────────────────────────────────────────────────────────────
const idOf = (v: any): string => {
  if (!v) return "";
  if (typeof v === "string") return v;
  return String(v._id || v.id || v.sessionId || "");
};

/** `/mentorship/user-dashboard?page=x` jaise userId-less URLs me userId daal deta hai. */
export function fixActionUrl(url: string, userId: string): string {
  if (!url || !userId) return url;
  return url.replace(
    /^(\/mentorship\/(?:user-dashboard|mentorProfile|senior-mentor-profile))(?=$|[?#])/,
    `$1/${encodeURIComponent(userId)}`
  );
}

function homes(role: NotificationRole, userId: string) {
  const uid = encodeURIComponent(userId);
  if (role === "mentee") {
    const base = `/mentorship/user-dashboard/${uid}`;
    return {
      bookings: `${base}?page=my-bookings`,
      sessions: `${base}?page=upcoming-sessions`,
      history: `${base}?page=session-history`,
    };
  }
  if (role === "senior-mentor") {
    const base = `/mentorship/senior-mentor-profile/${uid}/bookings`;
    return { bookings: base, sessions: base, history: base };
  }
  const base = `/mentorship/mentorProfile/${uid}?tab=booking`;
  return { bookings: base, sessions: base, history: base };
}

const withParam = (url: string, key: string, value?: string) =>
  value ? `${url}${url.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(value)}` : url;

type RoomState = "ok" | "ended" | "early" | "unknown";

/** Live room kholne se pehle backend se pooch lo (room page bhi yahi 'join' intent use karta hai). */
export async function checkRoomJoinable(sessionId: string, bookingId?: string): Promise<RoomState> {
  try {
    const res: any = await SessionService.getSessionById(sessionId, "join");
    const s = res?.data ?? res;
    const OVER = ["completed", "cancelled", "canceled", "no_show", "refunded"];
    const matched = bookingId
      ? (s?.bookings || []).find((b: any) => b._id === bookingId || b.id === bookingId)
      : null;
    const status = String(matched?.status ?? s?.status ?? "").toLowerCase();
    if (OVER.includes(status)) return "ended";

    // Backend 'join' check time-window par hamesha error nahi deta (expiry sirf socket join par aati hai).
    // Isliye yaha khud time check: agar session ka scheduled end guzar chuka hai aur wo
    // abhi live (in_progress) nahi hai, to room mat kholo.
    const LIVE = ["in_progress", "in progress", "active", "ongoing", "live", "started"];
    if (!LIVE.includes(status)) {
      const startRaw = matched?.scheduledAt ?? s?.scheduledAt ?? s?.startTime;
      const durationMin = Number(matched?.duration ?? s?.duration);
      const startMs = startRaw ? new Date(startRaw).getTime() : NaN;
      if (!isNaN(startMs) && durationMin > 0) {
        const endMs = startMs + durationMin * 60_000;
        if (Date.now() > endMs) return "ended";
      }
    }
    return "ok";
  } catch (e: any) {
    const msg = String(e?.message || "").toLowerCase();
    if (/(has ended|no longer active|expired|cancelled|completed)/.test(msg)) return "ended";
    if (/(not started yet|too early)/.test(msg)) return "early";
    return "unknown";
  }
}

export function hasNotificationTarget(n: NotificationLike): boolean {
  return Boolean(n.data?.actionUrl) || classifyNotification(n) !== "other";
}

export async function resolveNotificationTarget(
  n: NotificationLike,
  ctx: { role: NotificationRole; userId: string }
): Promise<NotificationTarget | null> {
  const { role, userId } = ctx;
  if (!userId) return n.data?.actionUrl ? { url: n.data.actionUrl } : null;

  const d = n.data || {};
  const sessionId = idOf(d.sessionId ?? d.session);
  const bookingId = idOf(d.bookingId ?? d.booking);
  const kind = classifyNotification(n);
  const h = homes(role, userId);

  // 1. Session khatam -> history, kabhi live room nahi
  if (kind === "session_ended") {
    return { url: h.history, notice: "This session has ended." };
  }

  // 2. Booking request -> mentor ko Bookings tab (jaha accept/decline hota hai)
  if (kind === "booking_request") {
    return { url: withParam(h.bookings, "bookingId", bookingId) };
  }

  // 3. Booking confirmed / request sent -> mentee ke My Bookings
  if (kind === "booking_confirmed" || kind === "booking_request_sent") {
    return { url: withParam(h.bookings, "bookingId", bookingId) };
  }

  // 4. Session live / reminder
  if (kind === "session_live") {
    // Mentor/senior "Start" button Bookings page se dabate hain
    if (role !== "mentee") return { url: h.bookings };
    if (!sessionId) return { url: h.sessions };

    const state = await checkRoomJoinable(sessionId, bookingId);
    if (state === "ok") {
      return { url: withParam(`/mentorship/session-room/${encodeURIComponent(sessionId)}`, "bookingId", bookingId) };
    }
    if (state === "ended") return { url: h.history, notice: "This session has ended." };
    if (state === "early") return { url: h.sessions, notice: "The session hasn't started yet." };
    return { url: h.sessions };
  }

  // 5. Baaki sab: server ka actionUrl, lekin userId fix + live-room guard ke saath
  const raw: string = d.actionUrl || "";
  if (!raw) return null;
  const url = fixActionUrl(raw, userId);

  const room = url.match(/^\/mentorship\/session-room\/([^/?#]+)/);
  if (room) {
    const sid = decodeURIComponent(room[1]);
    const state = await checkRoomJoinable(sid, bookingId);
    if (state === "ended") return { url: h.history, notice: "This session has ended." };
    if (state === "early") return { url: h.sessions, notice: "The session hasn't started yet." };
  }
  return { url };
}

/** Pages me use karo: `const open = useNotificationNavigator({ role, userId, onNotice })` */
export function useNotificationNavigator(opts: {
  role: NotificationRole;
  userId: string;
  onNotice?: (msg: string) => void;
}) {
  const router = useRouter();
  const { role, userId, onNotice } = opts;
  return useCallback(
    async (n: NotificationLike) => {
      const target = await resolveNotificationTarget(n, { role, userId });
      if (!target) return;
      if (target.notice) onNotice?.(target.notice);
      router.push(target.url);
    },
    [role, userId, onNotice, router]
  );
}
