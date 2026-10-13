import React, { useState, useMemo } from "react"
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
  Calendar,
  Clock,
  Video,
  ChevronRight,
} from "lucide-react"
import {
  getJoinState,
  getJoinWindow,
  useNow,
} from "@/features/mentorship/utils/sessionJoin"

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
  menteeProfilePhoto?: string | null
  title?: string
  sessionType?: string
  scheduledAt?: string
  startTime?: string
  endTime?: string
  durationMinutes?: number
  duration?: number
  status?: string
  isGroupSession?: boolean
  enrolledCount?: number
  meetingUrl?: string
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

type DayCategory = "today" | "tomorrow" | "later"

function getDayCategory(dateInput?: string): DayCategory {
  if (!dateInput) return "later"
  const d = new Date(dateInput)
  if (isNaN(d.getTime())) return "later"

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const tomorrowStart = todayStart + 86400000
  const targetStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

  if (targetStart === todayStart) return "today"
  if (targetStart === tomorrowStart) return "tomorrow"
  return "later"
}

function formatSessionDate(dateInput?: string) {
  if (!dateInput) {
    return { label: "Time not set", time: "", badge: "Upcoming", category: "later" as DayCategory }
  }
  const d = new Date(dateInput)
  if (isNaN(d.getTime())) {
    return { label: "Time not set", time: "", badge: "Upcoming", category: "later" as DayCategory }
  }

  const category = getDayCategory(dateInput)
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })

  if (category === "today") {
    return {
      label: `Today · ${time}`,
      time,
      badge: "Today",
      category,
    }
  }

  if (category === "tomorrow") {
    return {
      label: `Tomorrow · ${time}`,
      time,
      badge: "Tomorrow",
      category,
    }
  }

  const dateStr = d.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })
  return {
    label: `${dateStr} · ${time}`,
    time,
    badge: d.toLocaleDateString([], { day: "numeric", month: "short" }),
    category,
  }
}

function initialsFrom(name: string) {
  const parts = name.trim().split(" ").filter(Boolean)
  if (parts.length === 0) return "S"
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase()
}

function MenteeAvatar({
  photo,
  name,
  className = "w-9 h-9",
}: {
  photo?: string | null
  name: string
  className?: string
}) {
  const [imgError, setImgError] = useState(false)
  const initials = initialsFrom(name)
  const isValidUrl = Boolean(
    photo &&
      typeof photo === "string" &&
      photo.trim().length > 0 &&
      (photo.startsWith("http://") || photo.startsWith("https://") || photo.startsWith("/"))
  )

  if (isValidUrl && !imgError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo!}
        alt={name || "User profile"}
        onError={() => setImgError(true)}
        className={`${className} rounded-full object-cover shrink-0`}
        style={{ border: `1px solid ${COLORS.hairline}` }}
      />
    )
  }

  return (
    <div
      className={`${className} rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white`}
      style={{ backgroundColor: COLORS.ink, border: `1px solid ${COLORS.hairline}` }}
    >
      {initials}
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

  const [filterTab, setFilterTab] = useState<"all" | "today" | "tomorrow" | "later">("today")

  // Source of upcoming sessions
  const rawUpcomingList: Session[] =
    dashboardData?.upcomingSessions && Array.isArray(dashboardData.upcomingSessions) && dashboardData.upcomingSessions.length > 0
      ? dashboardData.upcomingSessions
      : sessions || []

  // Clock skew correction & auto-ticking timer (updates every 15s)
  const serverNowIso = dashboardData?.serverNow
  const serverOffsetMs = useMemo(() => {
    if (!serverNowIso) return 0
    const serverMs = Date.parse(serverNowIso)
    if (isNaN(serverMs)) return 0
    return serverMs - Date.now()
  }, [serverNowIso])

  const rawNow = useNow(15000)
  const now = rawNow + serverOffsetMs

  const upcoming: Session[] = [...rawUpcomingList]
    .filter((s) => {
      const status = (s.status || "").toLowerCase()
      if (status === "cancelled" || status === "completed" || status === "no_show" || status === "refunded") {
        return false
      }
      const { joinClosesAt } = getJoinWindow(s)
      return isNaN(joinClosesAt) || now <= joinClosesAt || status === "in_progress"
    })
    .sort(
      (a, b) =>
        new Date(a.startTime || a.scheduledAt || 0).getTime() -
        new Date(b.startTime || b.scheduledAt || 0).getTime()
    )

  const todaySessions = upcoming.filter((s) => getDayCategory(s.startTime || s.scheduledAt) === "today")
  const tomorrowSessions = upcoming.filter((s) => getDayCategory(s.startTime || s.scheduledAt) === "tomorrow")
  const laterSessions = upcoming.filter((s) => getDayCategory(s.startTime || s.scheduledAt) === "later")

  const displayedSessions =
    filterTab === "today"
      ? todaySessions
      : filterTab === "tomorrow"
      ? tomorrowSessions
      : filterTab === "later"
      ? laterSessions
      : upcoming

  const upcomingCount = upcoming.length

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#f3ece4]">
              <CalendarClock className="w-4.5 h-4.5" style={{ color: COLORS.accent }} />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2" style={{ color: COLORS.ink }}>
                Upcoming sessions
                {upcoming.length > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#f3ece4] text-[#7a5c3e]">
                    {upcoming.length}
                  </span>
                )}
              </h3>
            </div>
          </div>

          <button
            onClick={() => setActivePage?.("booking")}
            className="text-xs font-semibold hover:underline flex items-center gap-1 self-start sm:self-auto"
            style={{ color: COLORS.accent }}
          >
            <span>View all bookings</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Filter Tabs: All, Today, Tomorrow, Later */}
        {upcoming.length > 0 && (
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#f6ede8] border border-[#e0d8cf] mb-4 w-fit overflow-x-auto max-w-full">
            {(
              [
                { key: "all", label: "All", count: upcoming.length },
                { key: "today", label: "Today", count: todaySessions.length, hasDot: todaySessions.length > 0 },
                { key: "tomorrow", label: "Tomorrow", count: tomorrowSessions.length },
                { key: "later", label: "Later", count: laterSessions.length },
              ] as const
            ).map((tab) => {
              const isActive = filterTab === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilterTab(tab.key)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-all shrink-0 flex items-center gap-1.5 ${
                    isActive
                      ? "bg-[#7a5c3e] text-white shadow-sm font-bold"
                      : "text-[#8a7a6a] hover:text-[#4a3728]"
                  }`}
                >
                  {tab.hasDot && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActive ? "bg-emerald-300" : "bg-emerald-500"
                      } animate-pulse`}
                    />
                  )}
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-[#e0d8cf] text-[#4a3728]"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Sessions List */}
        {upcoming.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center gap-3 py-10 rounded-xl text-center"
            style={{ backgroundColor: COLORS.softWash, border: `1px solid ${COLORS.hairline}` }}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.chip }}>
              <CalendarClock className="w-6 h-6" style={{ color: COLORS.accent }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: COLORS.ink }}>
                No upcoming sessions booked yet.
              </p>
              <p className="text-xs mt-1" style={{ color: COLORS.muted }}>
                Sessions booked for today, tomorrow, or later will appear here.
              </p>
            </div>
            <button
              onClick={() => setActivePage?.("availability")}
              className="mt-1 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors hover:border-[#7a5c3e]"
              style={{ backgroundColor: COLORS.wash, color: COLORS.accent, border: `1px solid ${COLORS.hairline}` }}
            >
              Set availability slots →
            </button>
          </div>
        ) : displayedSessions.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center gap-2 py-8 rounded-xl text-center"
            style={{ backgroundColor: COLORS.softWash, border: `1px solid ${COLORS.hairline}` }}
          >
            <p className="text-sm font-medium" style={{ color: COLORS.muted }}>
              No sessions scheduled for {filterTab === "today" ? "today" : filterTab === "tomorrow" ? "tomorrow" : "later dates"}.
            </p>
            <button
              onClick={() => setFilterTab("all")}
              className="text-xs font-semibold hover:underline"
              style={{ color: COLORS.accent }}
            >
              Show all upcoming sessions ({upcoming.length})
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedSessions.map((s, idx) => {
              const name = s.menteeName || s.bookedMenteeName || "Student"
              const menteeId = s.menteeId
              const isClickable = Boolean(menteeId)
              const sessionDateInfo = formatSessionDate(s.startTime || s.scheduledAt)
              const isToday = sessionDateInfo.category === "today"
              const isTomorrow = sessionDateInfo.category === "tomorrow"
              const sessionId = s.sessionId || s._id
              const joinInfo = getJoinState(s, now, 0)

              const handleMenteeClick = (e: React.MouseEvent | React.KeyboardEvent) => {
                if (!menteeId) return
                e.stopPropagation()
                if ("key" in e && e.key !== "Enter" && e.key !== " ") return
                if ("key" in e) e.preventDefault()
                router.push(`/mentorship/menteeProfile/${menteeId}`)
              }

              const handleJoinSession = (e: React.MouseEvent) => {
                e.stopPropagation()
                if (sessionId) {
                  router.push(`/mentorship/session-room/${encodeURIComponent(sessionId)}`)
                } else {
                  setActivePage?.("booking")
                }
              }

              return (
                <div
                  key={s.sessionId ?? s._id ?? idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl transition-all hover:border-[#c9baa9] hover:shadow-xs"
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
                    <MenteeAvatar photo={s.menteeProfilePhoto} name={name} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p
                          className={`text-sm font-semibold truncate ${
                            isClickable ? "group-hover:underline" : ""
                          }`}
                          style={{ color: COLORS.ink }}
                        >
                          {name}
                        </p>
                        {s.isGroupSession && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                            Group Session
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5 truncate" style={{ color: COLORS.muted }}>
                        {s.title || s.sessionType || "1-on-1 Mentorship"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {/* Date/Time badge with distinct styling for Today and Tomorrow */}
                    {isToday ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                        Today · {sessionDateInfo.time}
                      </span>
                    ) : isTomorrow ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                        <Clock className="w-3.5 h-3.5 text-amber-700" />
                        Tomorrow · {sessionDateInfo.time}
                      </span>
                    ) : (
                      <span
                        className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: COLORS.chip, color: COLORS.accent, border: `1px solid ${COLORS.hairline}` }}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        {sessionDateInfo.label}
                      </span>
                    )}

                    {/* Time-aware Join button across all tabs */}
                    {sessionId && joinInfo.state !== "hidden" && (
                      <div className="flex flex-col items-end">
                        {joinInfo.state === "active" ? (
                          <button
                            type="button"
                            onClick={handleJoinSession}
                            title="Session is active — click to join"
                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-xs cursor-pointer"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Join</span>
                          </button>
                        ) : joinInfo.state === "ended" ? (
                          <button
                            type="button"
                            disabled
                            title="Session has ended"
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#ece4dc] text-[#a08070] cursor-not-allowed border border-[#e0d8cf]"
                          >
                            <span>Ended</span>
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              disabled
                              title="Available 5 minutes before scheduled start"
                              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-[#e8e0d5] text-[#8a7a6a] cursor-not-allowed border border-[#e0d8cf]"
                            >
                              <Video className="w-3.5 h-3.5 opacity-60" />
                              <span>Join</span>
                            </button>
                            <span className="text-[10px] text-[#8a7a6a] mt-0.5 whitespace-nowrap font-medium">
                              {joinInfo.subtext}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
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