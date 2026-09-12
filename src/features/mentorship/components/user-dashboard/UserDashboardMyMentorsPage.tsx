import React from "react";
import { Users, CalendarClock, History } from "lucide-react";

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
};

type Session = {
  _id?: string;
  sessionId?: string;
  mentorId?: string;
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

function initialsFrom(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "M";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function formatDateStr(iso?: string) {
  if (!iso) return "N/A";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function UserDashboardMyMentorsPage({ sessions = [] }: Props) {
  const now = Date.now();

  const mentorMap = new Map<string, {
    mentorId: string;
    mentorName: string;
    mentorProfilePhoto?: string;
    totalSessions: number;
    lastSession?: string;
    nextSession?: string;
    allSessions: Session[];
  }>();

  sessions.forEach((s) => {
    const key = s.mentorId || s.mentorName;
    if (!key) return;
    
    if (!mentorMap.has(key)) {
      mentorMap.set(key, {
        mentorId: s.mentorId || "",
        mentorName: s.mentorName || "Unknown Mentor",
        mentorProfilePhoto: s.mentorProfilePhoto,
        totalSessions: 0,
        allSessions: []
      });
    }
    
    const m = mentorMap.get(key)!;
    m.allSessions.push(s);
  });

  const mentors = Array.from(mentorMap.values()).map((m) => {
    const past = m.allSessions.filter((s) => {
      const t = new Date(s.startTime || s.scheduledAt || 0).getTime();
      return (s.status === "completed" || s.status === "done") || (t < now && s.status !== "cancelled");
    }).sort((a, b) => new Date(b.startTime || b.scheduledAt || 0).getTime() - new Date(a.startTime || a.scheduledAt || 0).getTime());
    
    const upcoming = m.allSessions.filter((s) => {
      const t = new Date(s.startTime || s.scheduledAt || 0).getTime();
      return t >= now && s.status !== "cancelled";
    }).sort((a, b) => new Date(a.startTime || a.scheduledAt || 0).getTime() - new Date(b.startTime || b.scheduledAt || 0).getTime());
    
    m.lastSession = past[0]?.startTime || past[0]?.scheduledAt;
    m.nextSession = upcoming[0]?.startTime || upcoming[0]?.scheduledAt;
    m.totalSessions = past.length;

    return m;
  }).sort((a, b) => {
    if (a.nextSession && !b.nextSession) return -1;
    if (!a.nextSession && b.nextSession) return 1;
    if (a.nextSession && b.nextSession) {
      return new Date(a.nextSession).getTime() - new Date(b.nextSession).getTime();
    }
    if (a.lastSession && b.lastSession) {
      return new Date(b.lastSession).getTime() - new Date(a.lastSession).getTime();
    }
    return 0;
  });

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: COLORS.ink }}>
          My Mentors
        </h2>
        <p style={{ color: COLORS.muted }} className="text-sm mt-1">
          Mentors you have learned from or have upcoming sessions with.
        </p>
      </div>

      {mentors.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center gap-3 py-16 rounded-2xl text-center"
          style={{ backgroundColor: COLORS.softWash, border: `1px solid ${COLORS.hairline}` }}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.chip }}>
            <Users className="w-8 h-8" style={{ color: COLORS.accent }} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: COLORS.ink }}>No mentors yet</h3>
            <p className="text-sm mt-1" style={{ color: COLORS.muted }}>
              You haven't booked any mentorship sessions yet.
            </p>
          </div>
          <button
            className="mt-4 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-[#8b7355] shadow-md"
            style={{ backgroundColor: COLORS.ink, color: "#fff" }}
            onClick={() => window.location.href = '/mentorship'}
          >
            Find a Mentor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {mentors.map((m, idx) => (
            <div
              key={m.mentorId || m.mentorName || idx}
              className="flex flex-col bg-white rounded-2xl overflow-hidden transition-shadow hover:shadow-sm"
              style={{ border: `1px solid ${COLORS.hairline}` }}
            >
              <div className="p-5 flex items-start gap-4" style={{ backgroundColor: COLORS.softWash }}>
                 {m.mentorProfilePhoto ? (
                    <img
                      src={m.mentorProfilePhoto}
                      alt={m.mentorName}
                      className="w-14 h-14 rounded-full object-cover shrink-0"
                      style={{ border: `1px solid ${COLORS.hairline}` }}
                    />
                  ) : (
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 text-lg font-bold text-white"
                      style={{ backgroundColor: COLORS.ink }}
                    >
                      {initialsFrom(m.mentorName)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold truncate" style={{ color: COLORS.ink }}>
                      {m.mentorName}
                    </p>
                    <p className="text-xs truncate mt-0.5" style={{ color: COLORS.muted }}>
                      Mentor
                    </p>
                  </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between border-t" style={{ borderColor: COLORS.hairline }}>
                <div className="space-y-3 mb-5">
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: COLORS.muted }}>Total Sessions</span>
                    <span className="font-semibold" style={{ color: COLORS.ink }}>{m.totalSessions}</span>
                  </div>
                  {m.lastSession && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5" style={{ color: COLORS.muted }}>
                        <History className="w-3.5 h-3.5" /> Last
                      </span>
                      <span className="font-medium" style={{ color: COLORS.ink }}>{formatDateStr(m.lastSession)}</span>
                    </div>
                  )}
                   {m.nextSession && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5" style={{ color: COLORS.accent }}>
                        <CalendarClock className="w-3.5 h-3.5" /> Next
                      </span>
                      <span className="font-semibold" style={{ color: COLORS.ink }}>{formatDateStr(m.nextSession)}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mt-auto">
                    <button
                      className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:bg-[#8b7355] shadow-sm text-center"
                      style={{ backgroundColor: COLORS.ink, color: "#fff" }}
                    >
                      Book Again
                    </button>
                    <button
                      className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition-colors hover:border-[#c9baa9] text-center"
                      style={{ backgroundColor: COLORS.wash, color: COLORS.accent, border: `1px solid ${COLORS.hairline}` }}
                    >
                      View Profile
                    </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
