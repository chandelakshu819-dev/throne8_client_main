import React from "react";
import {
  CalendarClock,
  Clock,
  Video,
  MapPin,
} from "lucide-react";

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
};

interface Props {
  sessions?: Session[];
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

export default function UserDashboardUpcomingSessionsPage({ sessions = [] }: Props) {
  const now = Date.now();

  const upcoming = sessions
    .filter((s) => {
      const t = new Date(s.startTime || s.scheduledAt || 0).getTime();
      return t >= now && s.status !== "cancelled";
    })
    .sort(
      (a, b) =>
        new Date(a.startTime || a.scheduledAt || 0).getTime() -
        new Date(b.startTime || b.scheduledAt || 0).getTime()
    );

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
            className="mt-4 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-[#8b7355] shadow-md"
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
            
            return (
              <div
                key={s.sessionId ?? s._id ?? idx}
                className="flex flex-col md:flex-row gap-5 p-5 rounded-2xl transition-colors hover:border-[#c9baa9] bg-white"
                style={{ border: `1px solid ${COLORS.hairline}` }}
              >
                {/* Mentor Info */}
                <div className="flex items-start gap-4 md:w-1/3 shrink-0">
                  {photo ? (
                    <img
                      src={photo}
                      alt={name}
                      className="w-14 h-14 rounded-full object-cover shrink-0"
                      style={{ border: `1px solid ${COLORS.hairline}` }}
                    />
                  ) : (
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 text-lg font-bold text-white"
                      style={{ backgroundColor: COLORS.ink }}
                    >
                      {initialsFrom(name)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold truncate" style={{ color: COLORS.ink }}>
                      {name}
                    </p>
                    <p className="text-sm truncate mt-0.5" style={{ color: COLORS.muted }}>
                      Mentor
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                       <span
                        className="text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide"
                        style={{ backgroundColor: COLORS.chip, color: COLORS.accent }}
                      >
                        {s.status || "Scheduled"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Session Details */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-bold" style={{ color: COLORS.ink }}>
                      {s.title || "Mentorship Session"}
                    </p>
                    <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: COLORS.muted }}>
                      <CalendarClock className="w-4 h-4 shrink-0" />
                      <span>{formatDateStr(s.startTime || s.scheduledAt)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: COLORS.muted }}>
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>
                        {formatTimeStr(s.startTime || s.scheduledAt)}
                        {s.duration ? ` (${s.duration} min)` : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: COLORS.muted }}>
                      {isOnline ? (
                        <Video className="w-4 h-4 shrink-0" />
                      ) : (
                        <MapPin className="w-4 h-4 shrink-0" />
                      )}
                      <span>{isOnline ? "Online Meeting" : "In Person"}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-row md:flex-col items-center md:items-stretch justify-center md:justify-start gap-2 shrink-0 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-5 mt-2 md:mt-0 w-full md:w-auto" style={{ borderColor: COLORS.hairline }}>
                   <button
                    className="flex-1 md:flex-none w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-[#8b7355] shadow-sm text-center"
                    style={{ backgroundColor: COLORS.ink, color: "#fff" }}
                  >
                    Join Session
                  </button>
                  <button
                    className="flex-1 md:flex-none w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:border-[#c9baa9] text-center"
                    style={{ backgroundColor: COLORS.wash, color: COLORS.accent, border: `1px solid ${COLORS.hairline}` }}
                  >
                    View Details
                  </button>
                  <div className="hidden md:flex gap-2 w-full mt-1">
                     <button
                        className="flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-gray-50 text-center"
                        style={{ color: COLORS.muted, border: `1px solid ${COLORS.hairline}` }}
                      >
                        Reschedule
                      </button>
                      <button
                        className="flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-red-50 text-center text-red-600"
                        style={{ border: `1px solid #fca5a5` }}
                      >
                        Cancel
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
