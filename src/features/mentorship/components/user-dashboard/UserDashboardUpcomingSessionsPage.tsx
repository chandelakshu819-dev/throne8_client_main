//src/features/mentorship/components/user-dashboard/UserDashboardUpcomingSessionsPage.tsx

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  Clock,
  Video,
  MapPin,
  Loader2,
} from "lucide-react";
import SessionService from "@/lib/api/session.service";

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
  mentorName?: string;
  mentorProfilePhoto?: string;
  title?: string;
  sessionType?: string;
  scheduledAt?: string;
  startTime?: string;
  status?: string;
  duration?: number;
  bookings?: Record<string, unknown>[]; // To extract bookingId if needed
};

interface Props {
  // Keeping props for compatibility if Layout still passes them,
  // but we will fetch actual upcoming sessions internally.
  sessions?: Session[]; 
  setActivePage?: (page: string) => void;
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
  if (isNaN(d.getTime())) return "Time not set";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function initialsFrom(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "S";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function UserDashboardUpcomingSessionsPage({ setActivePage }: Props) {
  const router = useRouter();

  const [upcoming, setUpcoming] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const fetchUpcoming = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Backend automatically uses the logged-in user's token and 'mentee' role
      const res = await SessionService.getUpcomingSessions({ role: "mentee", limit: 50 });
      
      const fetchedSessions = (res.data || []) as Session[];
      
      // Filter out past and cancelled locally just to be safe, though backend should handle it
      const currentNow = Date.now();
      const validUpcoming = fetchedSessions
        .filter((s) => {
          const t = new Date(s.startTime || s.scheduledAt || 0).getTime();
          return t >= currentNow && s.status !== "cancelled";
        })
        .sort(
          (a, b) =>
            new Date(a.startTime || a.scheduledAt || 0).getTime() -
            new Date(b.startTime || b.scheduledAt || 0).getTime()
        );
        
      setUpcoming(validUpcoming);
    } catch (err: unknown) {
      console.error("Failed to fetch upcoming sessions", err);
      const errorMessage = err instanceof Error ? err.message : "Unable to load upcoming sessions.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUpcoming();
  }, [fetchUpcoming]);

  const handleJoinSession = async (sessionId?: string) => {
    if (!sessionId) return;
    setJoiningId(sessionId);
    try {
      await SessionService.getSessionById(sessionId);
      router.push(`/mentorship/session-room/${sessionId}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unable to join session. Please try again.";
      alert(errorMessage);
    } finally {
      setJoiningId(null);
    }
  };

  const handleCancelSession = async (sessionId: string, bookingId?: string) => {
    const reason = window.prompt("Reason for cancellation? (Required)");
    if (!reason || !reason.trim()) return;

    try {
      setCancelingId(sessionId);
      await SessionService.cancelSession(sessionId, reason.trim(), bookingId || "");
      // Refresh list after cancel
      await fetchUpcoming();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to cancel session.";
      alert(errorMessage);
    } finally {
      setCancelingId(null);
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
    <div className="space-y-6 animate-fadeIn max-w-5xl">
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
            
            // For 1-on-1 sessions, there's usually 1 booking. We try to grab its ID for cancellation.
            const bookingId = s.bookings?.[0]?.bookingId || s.bookings?.[0]?._id;

            // 🔑 GATE: sirf mentor start kare (status === 'in_progress') tabhi
            // Join Session enabled hoga. Confirmed/pending me disabled rahega.
            const statusLower = (s.status || "").toLowerCase();
            const canJoin = statusLower === "in_progress";

            const isCanceling = cancelingId === sid;

            return (
              <div
                key={sid ?? idx}
                className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 md:p-5 rounded-2xl transition-shadow hover:shadow-sm bg-white"
                style={{ border: `1px solid ${COLORS.hairline}` }}
              >
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
                          backgroundColor: canJoin ? "#dbeafe" : COLORS.chip,
                          color: canJoin ? "#1d4ed8" : COLORS.accent,
                        }}
                      >
                        {canJoin ? "Live Now" : (s.status || "Scheduled")}
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
                      <span>{formatDateStr(s.startTime || s.scheduledAt)}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1 sm:pt-0">
                    <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: COLORS.muted }}>
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {formatTimeStr(s.startTime || s.scheduledAt)}
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
                    onClick={() => canJoin && handleJoinSession(sid)}
                    disabled={!canJoin || joiningId === sid}
                    className="w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm text-center disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    style={{
                      backgroundColor: canJoin ? COLORS.ink : "#e5e0d8",
                      color: canJoin ? "#fff" : "#9c9186",
                    }}
                  >
                    {joiningId === sid ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Joining...
                      </>
                    ) : canJoin ? (
                      "Join Session"
                    ) : (
                      "Waiting for mentor"
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
                        onClick={() => alert("Please use the 'My Bookings' section or contact support to reschedule a session.")}
                        className="flex-1 px-1.5 py-1.5 rounded-lg text-[10px] font-semibold transition-colors hover:bg-gray-50 text-center uppercase"
                        style={{ color: COLORS.muted, border: `1px solid ${COLORS.hairline}` }}
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => sid && handleCancelSession(sid, bookingId)}
                        disabled={isCanceling}
                        className="flex-1 px-1.5 py-1.5 rounded-lg text-[10px] font-semibold transition-colors hover:bg-red-50 text-center text-red-600 uppercase disabled:opacity-50"
                        style={{ border: `1px solid #fca5a5` }}
                      >
                        {isCanceling ? "..." : "Cancel"}
                      </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}