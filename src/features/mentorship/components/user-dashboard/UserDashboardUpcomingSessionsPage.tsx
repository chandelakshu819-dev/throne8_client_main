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
                        style={{ backgroundColor: COLORS.chip, color: COLORS.accent }}
                      >
                        {s.status || "Scheduled"}
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
                <div className="flex flex-col gap-2 shrink-0 w-full md:w-[150px] md:border-l md:pl-4 pt-4 md:pt-0 border-t md:border-t-0 mt-2 md:mt-0" style={{ borderColor: COLORS.hairline }}>
                   <button
                    className="w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:bg-[#8b7355] shadow-sm text-center"
                    style={{ backgroundColor: COLORS.ink, color: "#fff" }}
                  >
                    Join Session
                  </button>
                  <button
                    className="w-full px-3 py-2 rounded-xl text-xs font-semibold transition-colors hover:border-[#c9baa9] text-center"
                    style={{ backgroundColor: COLORS.wash, color: COLORS.accent, border: `1px solid ${COLORS.hairline}` }}
                  >
                    View Details
                  </button>
                  <div className="flex gap-2 w-full">
                     <button
                        className="flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-colors hover:bg-gray-50 text-center uppercase tracking-wide"
                        style={{ color: COLORS.muted, border: `1px solid ${COLORS.hairline}` }}
                      >
                        Reschedule
                      </button>
                      <button
                        className="flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-colors hover:bg-red-50 text-center text-red-600 uppercase tracking-wide"
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
