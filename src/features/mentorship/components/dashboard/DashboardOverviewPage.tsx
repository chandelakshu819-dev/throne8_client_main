import React, { useState } from "react"
import { useRouter } from "next/navigation"
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
  AlertCircle,
  RotateCcw,
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

type Session = {
  _id?: string
  sessionId?: string
  menteeId?: string
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
  dashboardData?: any
  dashboardLoading?: boolean
  dashboardError?: string | null
  onRetryDashboard?: () => void
  sessions?: Session[]
  setActivePage?: (page: string) => void
}

function formatWhen(iso?: string) {
  if (!iso) return "Time not set"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "Time not set"
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
  if (isToday) return `Today · ${time}`
  return `${d.toLocaleDateString([], { day: "numeric", month: "short" })} · ${time}`
}

function initialsFrom(name: string) {
  const parts = name.trim().split(" ").filter(Boolean)
  if (parts.length === 0) return "S"
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase()
}

function MenteeAvatar({ photo, name }: { photo?: string | null; name: string }) {
  const [imgError, setImgError] = useState(false)

  if (photo && !imgError) {
    return (
      <img
        src={photo}
        alt={name}
        onError={() => setImgError(true)}
        className="w-9 h-9 rounded-full object-cover shrink-0"
        style={{ border: `1px solid ${COLORS.hairline}` }}
      />
    )
  }

  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
      style={{ backgroundColor: COLORS.ink }}
    >
      {initialsFrom(name)}
    </div>
  )
}

export default function DashboardOverviewPage({
  mentorData,
  dashboardData,
  dashboardLoading = false,
  dashboardError = null,
  onRetryDashboard,
  sessions = [],
  setActivePage,
}: DashboardOverviewPageProps) {
  const router = useRouter()

  // Loading skeleton state
  if (dashboardLoading && !dashboardData) {
    return (
      <div className="space-y-8 max-w-4xl animate-pulse">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-[#e0d8cf] rounded-md" />
          <div className="h-4 w-64 bg-[#e0d8cf]/60 rounded-md" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-[#e0d8cf] space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#f3ece4]" />
              <div className="h-6 w-16 bg-[#e0d8cf] rounded" />
              <div className="h-3 w-20 bg-[#e0d8cf]/60 rounded" />
            </div>
          ))}
        </div>
        <div className="h-20 w-full bg-[#f6ede8] rounded-2xl border border-[#e0d8cf]" />
        <div className="bg-white p-6 rounded-2xl border border-[#e0d8cf] space-y-4">
          <div className="h-5 w-36 bg-[#e0d8cf] rounded" />
          {[1, 2].map((i) => (
            <div key={i} className="h-16 w-full bg-[#fbf7f3] rounded-xl border border-[#e0d8cf]" />
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (dashboardError && !dashboardData) {
    return (
      <div className="max-w-4xl p-6 rounded-2xl bg-red-50 border border-red-200 text-red-800 space-y-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
          <div>
            <h3 className="font-bold text-base">Unable to load mentor dashboard data</h3>
            <p className="text-sm text-red-600 mt-0.5">{dashboardError}</p>
          </div>
        </div>
        {onRetryDashboard && (
          <button
            onClick={onRetryDashboard}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
        )}
      </div>
    )
  }

  const firstName = dashboardData?.user?.firstName ?? mentorData?.user?.firstName ?? "there"
  const rating = dashboardData?.stats?.rating ?? dashboardData?.rating ?? mentorData?.stats?.averageRating ?? 0
  const totalSessions = dashboardData?.stats?.totalSessions ?? mentorData?.stats?.totalSessions ?? sessions.length
  const trustScore = dashboardData?.stats?.trustScore ?? mentorData?.trustScore?.score ?? mentorData?.stats?.trustScore ?? null
  const isVerified = dashboardData?.isVerified ?? Boolean(mentorData?.verification?.isVerified || mentorData?.isVerified)

  // Use pre-computed upcomingSessions from unified API if available, else filter raw sessions
  const upcomingRaw: Session[] = dashboardData?.upcomingSessions ?? sessions
  const now = Date.now()
  const upcoming = dashboardData?.upcomingSessions
    ? dashboardData.upcomingSessions
    : [...upcomingRaw]
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

  const upcomingCount = dashboardData?.stats?.upcoming ?? upcoming.length

  const stats = [
    { label: "Total sessions", value: String(totalSessions), muted: false, icon: ClipboardList },
    { label: "Upcoming", value: String(upcomingCount), muted: false, icon: CalendarClock },
    { label: "Rating", value: rating ? Number(rating).toFixed(1) : "New", muted: !rating, icon: Star },
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
              const name = s.menteeName || s.bookedMenteeName || "Student"
              const photo = s.menteeProfilePhoto
              const menteeId = s.menteeId
              const isClickable = Boolean(menteeId)

              const handleMenteeClick = (e: React.MouseEvent | React.KeyboardEvent) => {
                if (!menteeId) return
                e.stopPropagation()
                if ("key" in e && e.key !== "Enter" && e.key !== " ") return
                if ("key" in e) e.preventDefault()
                router.push(`/mentorship/user-dashboard/${menteeId}`)
              }

              return (
                <div
                  key={s.sessionId ?? s._id ?? idx}
                  className="flex items-center justify-between gap-4 p-3.5 rounded-xl transition-colors hover:border-[#c9baa9]"
                  style={{ backgroundColor: COLORS.softWash, border: `1px solid ${COLORS.hairline}` }}
                >
                  <div
                    {...(isClickable
                      ? {
                          role: "link",
                          tabIndex: 0,
                          onClick: handleMenteeClick,
                          onKeyDown: handleMenteeClick,
                        }
                      : {})}
                    className={`flex items-center gap-3 min-w-0 ${
                      isClickable ? "cursor-pointer group" : ""
                    }`}
                  >
                    <MenteeAvatar photo={photo} name={name} />
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-semibold truncate ${
                          isClickable ? "group-hover:underline" : ""
                        }`}
                        style={{ color: COLORS.ink }}
                      >
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