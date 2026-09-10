// mentorDashboard/components/DashboardOverviewPage.tsx
import React from "react"
import {
  CalendarClock,
  ShieldCheck,
  ArrowUpRight,
  Users,
  Star,
  Award,
  Clock3,
  CalendarPlus,
  ClipboardList,
  BarChart3,
} from "lucide-react"

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
}

// ✅ FIX: These are the real fields the backend now returns (from
// sessionRepository.findAll()'s $lookup enrichment) — not "studentName"
// or "student.firstName/lastName", which were never populated.
type Session = {
  _id?: string
  sessionId?: string
  menteeName?: string
  bookedMenteeName?: string
  menteeProfilePhoto?: string
  title?: string
  sessionType?: string
  scheduledAt?: string
  startTime?: string
  status?: string
}

interface DashboardOverviewPageProps {
  mentorData?: any
  sessions?: Session[]
  setActivePage?: (page: string) => void
}

function formatWhen(iso?: string) {
  if (!iso) return "Time not set"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "Time not set"
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  if (isToday) return `Today · ${time}`
  return `${d.toLocaleDateString([], { day: "numeric", month: "short" })} · ${time}`
}

function initialsFrom(name: string) {
  const parts = name.trim().split(" ").filter(Boolean)
  if (parts.length === 0) return "S"
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase()
}

export default function DashboardOverviewPage({
  mentorData,
  sessions = [],
  setActivePage,
}: DashboardOverviewPageProps) {
  const firstName = mentorData?.user?.firstName ?? "there"
  const rating = mentorData?.stats?.averageRating ?? 0
  const totalSessions = mentorData?.stats?.totalSessions ?? sessions.length
  const trustScore = mentorData?.trustScore?.score ?? mentorData?.stats?.trustScore
  const isVerified = Boolean(mentorData?.isVerified)

  const now = Date.now()
  const upcoming = [...sessions]
    .filter((s) => {
      const t = new Date(s.startTime || s.scheduledAt || 0).getTime()
      return t >= now && s.status !== "cancelled"
    })
    .sort(
      (a, b) =>
        new Date(a.startTime || a.scheduledAt || 0).getTime() -
        new Date(b.startTime || b.scheduledAt || 0).getTime()
    )
    .slice(0, 4)

  const stats = [
    { label: "Total sessions", value: String(totalSessions), muted: false, icon: ClipboardList },
    { label: "Upcoming", value: String(upcoming.length), muted: false, icon: CalendarClock },
    { label: "Rating", value: rating ? rating.toFixed(1) : "New", muted: !rating, icon: Star },
    {
      label: "Trust score",
      value: trustScore != null ? String(trustScore) : "Building",
      muted: trustScore == null,
      icon: Award,
    },
  ]

  const quickActions = [
    { label: "Update availability", page: "availability", icon: Clock3 },
    { label: "Create a plan", page: "plans", icon: CalendarPlus },
    { label: "View analytics", page: "analytics", icon: BarChart3 },
  ]

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold" style={{ color: COLORS.ink }}>
          Welcome back, {firstName}
        </h2>
        <p style={{ color: COLORS.muted }} className="text-sm mt-1">
          Here's where things stand today
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white p-4 rounded-2xl transition-colors hover:border-[#c9baa9]"
            style={{ border: `1px solid ${COLORS.hairline}` }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
              style={{ backgroundColor: COLORS.chip }}
            >
              <stat.icon className="w-4 h-4" style={{ color: COLORS.accent }} />
            </div>
            <div
              className={stat.muted ? "text-lg font-semibold italic" : "text-2xl font-bold"}
              style={{ color: stat.muted ? COLORS.muted : COLORS.ink }}
            >
              {stat.value}
            </div>
            <div className="text-xs mt-1" style={{ color: COLORS.muted }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Verification nudge — only shown if not verified */}
      {!isVerified && (
        <button
          onClick={() => setActivePage?.("trust")}
          className="w-full flex items-center justify-between gap-4 p-5 rounded-2xl text-left transition-colors hover:border-[#c9baa9]"
          style={{ backgroundColor: COLORS.wash, border: `1px solid ${COLORS.hairline}` }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: COLORS.ink }}>
              <ShieldCheck className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: COLORS.ink }}>
                Complete verification to unlock your badge
              </p>
              <p className="text-xs mt-0.5" style={{ color: COLORS.muted }}>
                Verified mentors get 3x more booking requests
              </p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 shrink-0" style={{ color: COLORS.accent }} />
        </button>
      )}

      {/* Upcoming sessions */}
      <div className="bg-white p-6 rounded-2xl" style={{ border: `1px solid ${COLORS.hairline}` }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: COLORS.ink }}>
            <CalendarClock className="w-4 h-4" style={{ color: COLORS.accent }} />
            Upcoming sessions
          </h3>
          <button
            onClick={() => setActivePage?.("booking")}
            className="text-sm font-semibold hover:underline"
            style={{ color: COLORS.accent }}
          >
            View all
          </button>
        </div>

        {upcoming.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center gap-2 py-10 rounded-xl text-center"
            style={{ backgroundColor: COLORS.softWash, border: `1px solid ${COLORS.hairline}` }}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.chip }}>
              <CalendarClock className="w-5 h-5" style={{ color: COLORS.accent }} />
            </div>
            <p className="text-sm font-medium" style={{ color: COLORS.muted }}>
              No upcoming sessions booked yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((s, idx) => {
              // ✅ FIX: real name comes from backend as menteeName / bookedMenteeName
              // (built server-side from the mentee's actual firstName + lastName).
              // "Student" only shows now if the backend genuinely has no user record.
              const name = s.menteeName || s.bookedMenteeName || "Student"
              const photo = s.menteeProfilePhoto

              return (
                <div
                  key={s.sessionId ?? s._id ?? idx}
                  className="flex items-center justify-between gap-4 p-3.5 rounded-xl transition-colors hover:border-[#c9baa9]"
                  style={{ backgroundColor: COLORS.softWash, border: `1px solid ${COLORS.hairline}` }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {photo ? (
                      <img
                        src={photo}
                        alt={name}
                        className="w-9 h-9 rounded-full object-cover shrink-0"
                        style={{ border: `1px solid ${COLORS.hairline}` }}
                      />
                    ) : (
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
                        style={{ backgroundColor: COLORS.ink }}
                      >
                        {initialsFrom(name)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: COLORS.ink }}>
                        {name}
                      </p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: COLORS.muted }}>
                        {s.title || s.sessionType || "Session"}
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-xs font-semibold shrink-0 px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: COLORS.chip, color: COLORS.accent }}
                  >
                    {formatWhen(s.startTime || s.scheduledAt)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-sm font-bold mb-4" style={{ color: COLORS.ink }}>
          Quick actions
        </h3>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => (
            <button
              key={action.page}
              onClick={() => setActivePage?.(action.page)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-colors hover:border-[#c9baa9]"
              style={{ backgroundColor: COLORS.wash, color: COLORS.accent, border: `1px solid ${COLORS.hairline}` }}
            >
              <action.icon className="w-4 h-4" />
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}