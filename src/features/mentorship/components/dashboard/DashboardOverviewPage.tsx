// mentorDashboard/components/DashboardOverviewPage.tsx
import React from "react"
import { CalendarClock, ShieldCheck, ArrowUpRight } from "lucide-react"

const COLORS = {
  ink: "#4a3728",
  accent: "#7a5c3e",
  hairline: "#e0d8cf",
  wash: "#f6ede8",
  paper: "#fffdfb",
  gold: "#c9a87c",
  muted: "#8a7a6a",
}

type Session = {
  _id?: string
  studentName?: string
  student?: { firstName?: string; lastName?: string }
  serviceName?: string
  startTime?: string
  scheduledAt?: string
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
    { label: "Total sessions", value: String(totalSessions), muted: false },
    { label: "Upcoming", value: String(upcoming.length), muted: false },
    { label: "Rating", value: rating ? rating.toFixed(1) : "New", muted: !rating },
    {
      label: "Trust score",
      value: trustScore != null ? String(trustScore) : "Building",
      muted: trustScore == null,
    },
  ]

  return (
    <div className="space-y-10 max-w-3xl">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold" style={{ color: COLORS.ink }}>
          Welcome back, {firstName}
        </h2>
        <p style={{ color: COLORS.muted }} className="text-sm mt-1">
          Here's where things stand today
        </p>
      </div>

      {/* Stat strip — matches Reviews page treatment */}
      <div
        className="flex flex-wrap"
        style={{ borderTop: `1px solid ${COLORS.hairline}`, borderBottom: `1px solid ${COLORS.hairline}` }}
      >
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="flex-1 min-w-[120px] py-5 px-6"
            style={{ borderLeft: idx === 0 ? "none" : `1px solid ${COLORS.hairline}` }}
          >
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
          className="w-full flex items-center justify-between gap-4 p-5 rounded-xl text-left transition-colors"
          style={{ backgroundColor: COLORS.wash, border: `1px solid ${COLORS.hairline}` }}
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 shrink-0" style={{ color: COLORS.accent }} />
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
      <div>
        <div className="flex items-center justify-between mb-4">
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
          <p
            className="text-sm py-6 text-center rounded-xl"
            style={{ color: COLORS.muted, backgroundColor: COLORS.wash, border: `1px solid ${COLORS.hairline}` }}
          >
            No upcoming sessions booked yet.
          </p>
        ) : (
          <div>
            {upcoming.map((s, idx) => {
              const name =
                s.studentName ||
                [s.student?.firstName, s.student?.lastName].filter(Boolean).join(" ") ||
                "Student"
              return (
                <div
                  key={s._id ?? idx}
                  className="py-4 flex items-center justify-between gap-4"
                  style={{ borderTop: `1px solid ${COLORS.hairline}` }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: COLORS.ink }}>
                      {name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: COLORS.muted }}>
                      {s.serviceName || "Session"}
                    </p>
                  </div>
                  <span className="text-xs shrink-0" style={{ color: COLORS.muted }}>
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
          {[
            { label: "Update availability", page: "availability" },
            { label: "Create a plan", page: "plans" },
            { label: "View analytics", page: "analytics" },
          ].map((action) => (
            <button
              key={action.page}
              onClick={() => setActivePage?.(action.page)}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-colors"
              style={{ backgroundColor: COLORS.wash, color: COLORS.accent, border: `1px solid ${COLORS.hairline}` }}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}