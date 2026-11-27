//src/features/mentorship/components/dashboard/DashboardOverviewPage.tsx
import React, { useState, useMemo, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  CalendarClock,
  ShieldCheck,
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
  Loader2,
  ChevronRight,
  Wallet,
  Briefcase,
  Share2,
  CheckCircle2,
} from "lucide-react"
import {
  getJoinState,
  getSessionTiming,
  useNow,
} from "@/features/mentorship/utils/sessionJoin"
import { capitalizeName } from "@/shared/utils/format"
import ProfileService from "@/lib/api/profile.service"
import SessionService from "@/lib/api/session.service"
import { useSocket } from "@/core/realtime/useSocket"

const COLORS = {
  ink: "#4a3728",
  accent: "#7a5c3e",
  hairline: "#e0d8cf",
  wash: "#f6ede8",
  softWash: "#fbf7f3",
  chip: "#f3ece4",
  muted: "#8a7a6a",
  faint: "#a08070",
}

// Shared focus style so every interactive element has a visible keyboard focus
const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a5c3e]/50 focus-visible:ring-offset-1"

type Session = {
  _id?: string
  sessionId?: string
  bookingId?: string
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
  setActivePage?: (page: string, subtab?: string) => void
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
    return { label: `Today · ${time}`, time, badge: "Today", category }
  }

  if (category === "tomorrow") {
    return { label: `Tomorrow · ${time}`, time, badge: "Tomorrow", category }
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

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n)
}

// Is the photo value a URL or a photo ID? (IDs are resolved to URLs later via ProfileService)
function isUrlLike(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/"))
  )
}

function MenteeAvatar({
  photo,
  name,
  className = "w-10 h-10",
}: {
  photo?: string | null
  name: string
  className?: string
}) {
  const [imgError, setImgError] = useState(false)
  const initials = initialsFrom(name)
  const isValidUrl = isUrlLike(photo)

  // Reset the error when the photo changes (an ID resolves to a URL later)
  useEffect(() => {
    setImgError(false)
  }, [photo])

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
      style={{ backgroundColor: COLORS.ink }}
      aria-hidden="true"
    >
      {initials}
    </div>
  )
}

// -- Small presentational pieces --

function StatCard({
  label,
  value,
  unit,
  caption,
  icon: Icon,
  selected,
  onClick,
}: {
  label: string
  value: string
  unit?: string
  caption?: string
  icon: React.ElementType
  selected?: boolean
  onClick?: () => void
}) {
  const content = (
    <>
      <div className="flex items-center gap-2 min-w-0" style={{ color: COLORS.muted }}>
        <Icon className="w-4 h-4 shrink-0" style={{ color: COLORS.accent }} />
        <span className="text-xs font-medium truncate">{label}</span>
      </div>
      <div className="mt-3 text-2xl font-bold leading-none flex items-baseline gap-1" style={{ color: COLORS.ink }}>
        <span className="truncate">{value}</span>
        {unit && (
          <span className="text-sm font-semibold" style={{ color: COLORS.muted }}>
            {unit}
          </span>
        )}
      </div>
      <div className="mt-1.5 text-xs h-4 truncate" style={{ color: COLORS.muted }}>
        {caption || "\u00A0"}
      </div>
    </>
  )

  const baseClass = "bg-white rounded-xl p-4 text-left w-full min-w-0 border"
  const style = { borderColor: selected ? COLORS.ink : COLORS.hairline }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className={`${baseClass} transition-colors hover:border-[#c9baa9] ${FOCUS_RING}`}
        style={style}
      >
        {content}
      </button>
    )
  }

  return (
    <div className={baseClass} style={style}>
      {content}
    </div>
  )
}

// Time badge for a session row. Color carries meaning: green = today, amber = tomorrow, neutral = later
function TimeBadge({ info }: { info: ReturnType<typeof formatSessionDate> }) {
  if (info.category === "today") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
        <Clock className="w-3.5 h-3.5" />
        Today · {info.time}
      </span>
    )
  }
  if (info.category === "tomorrow") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 whitespace-nowrap">
        <Clock className="w-3.5 h-3.5" />
        Tomorrow · {info.time}
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{ backgroundColor: COLORS.chip, color: COLORS.accent, border: `1px solid ${COLORS.hairline}` }}
    >
      <Calendar className="w-3.5 h-3.5" />
      {info.label}
    </span>
  )
}

function EmptyPanel({
  icon: Icon,
  title,
  text,
  action,
}: {
  icon: React.ElementType
  title: string
  text?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-3 py-10 px-4">
      <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.chip }}>
        <Icon className="w-5 h-5" style={{ color: COLORS.accent }} />
      </div>
      <div>
        <p className="text-sm font-semibold" style={{ color: COLORS.ink }}>{title}</p>
        {text && <p className="text-xs mt-1" style={{ color: COLORS.muted }}>{text}</p>}
      </div>
      {action}
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

  // All hooks stay above the early returns (Rules of Hooks)
  // Panel-level tab: "upcoming" shows future sessions, "missedNotHeld" shows stale past ones
  const [sessionsPanelTab, setSessionsPanelTab] = useState<"upcoming" | "missedNotHeld">("upcoming")
  // Day filter within the Upcoming tab
  const [filterTab, setFilterTab] = useState<"all" | "today" | "tomorrow" | "later">("today")

  // Loading + error state while Start / Rejoin is clicked
  const [joiningKey, setJoiningKey] = useState<string | null>(null)
  const [joinError, setJoinError] = useState<string | null>(null)

  // photoId -> resolved cloudinary URL
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})
  // Photo IDs that were already requested (so we never fetch them twice)
  const requestedPhotoIds = useRef<Set<string>>(new Set())

  // Clock skew correction + auto-ticking timer (every 15s)
  const serverNowIso = dashboardData?.serverNow
  const serverOffsetMs = useMemo(() => {
    if (!serverNowIso) return 0
    const serverMs = Date.parse(serverNowIso)
    if (isNaN(serverMs)) return 0
    return serverMs - Date.now()
  }, [serverNowIso])

  const rawNow = useNow(15000)
  const now = rawNow + serverOffsetMs

  // ── Flatten sessions first, then deduplicate by bookingId (fallback to _id) ──
  // Container sessions (SessionMentor) embed bookings. Flatten every item from
  // upcomingSessions, missedNotHeldSessions, and the sessions prop so each booking is
  // evaluated individually via getSessionTiming(session, booking, now).
  const sourceSessionList: any[] = [
    ...(Array.isArray(dashboardData?.upcomingSessions) ? dashboardData.upcomingSessions : []),
    ...(Array.isArray(dashboardData?.missedNotHeldSessions) ? dashboardData.missedNotHeldSessions : []),
    ...(Array.isArray(sessions) ? sessions : []),
  ]

  const rawFlattened: { session: Session; timing: ReturnType<typeof getSessionTiming> }[] = []

  sourceSessionList.forEach((s: any) => {
    if (!s) return

    if (s.isGroupSession) {
      const timing = getSessionTiming(s, null, now)
      rawFlattened.push({
        session: {
          ...s,
          sessionId: s.sessionId || String(s._id),
          title: s.title || "Group Session",
          sessionType: s.sessionType || "Group Session",
          scheduledAt: s.scheduledAt || s.startTime,
          startTime: s.startTime || s.scheduledAt,
          status: s.status || "open",
          timing,
          staleLabel: timing.staleLabel,
        },
        timing,
      })
      return
    }

    const bookings = Array.isArray(s.bookings) && s.bookings.length > 0 ? s.bookings : []
    if (bookings.length > 0) {
      bookings.forEach((b: any) => {
        // Pass the booking to getSessionTiming(session, booking, now)
        const timing = getSessionTiming(s, b, now)
        const bStatus = (b.status || s.status || "confirmed").toLowerCase()

        const menteeName =
          b.mentee?.fullName ||
          (b.mentee?.firstName ? `${b.mentee.firstName} ${b.mentee.lastName || ""}`.trim() : null) ||
          b.menteeName ||
          s.bookedMenteeName ||
          s.menteeName ||
          "Student"

        // Photo URL or photo ID (an ID is resolved to a URL by the effect below)
        const menteePhoto: string | null =
          b.menteeProfilePhoto ||
          b.mentee?.profilePic ||
          s.menteeProfilePhoto ||
          null

        rawFlattened.push({
          session: {
            ...s,
            _id: b._id || b.bookingId || s._id,
            sessionId: s.sessionId || String(s._id),
            bookingId: b._id || b.bookingId,
            menteeId: b.menteeId || b.bookedBy || s.menteeId || null,
            menteeName,
            menteeProfilePhoto: menteePhoto,
            title: s.title || s.sessionType || "1-on-1 Mentorship",
            sessionType: s.sessionType || "1-on-1 Mentorship",
            scheduledAt: b.scheduledAt || s.scheduledAt,
            startTime: b.scheduledAt || b.startTime || s.startTime || s.scheduledAt,
            endTime: b.endTime || s.endTime,
            durationMinutes: b.slotDuration || b.duration || s.duration || s.durationMinutes || 60,
            status: bStatus,
            isGroupSession: false,
            timing,
            staleLabel: timing.staleLabel,
          },
          timing,
        })
      })
    } else {
      const timing = getSessionTiming(s, null, now)
      rawFlattened.push({
        session: {
          ...s,
          sessionId: s.sessionId || String(s._id),
          title: s.title || s.sessionType || "1-on-1 Mentorship",
          sessionType: s.sessionType || "1-on-1 Mentorship",
          scheduledAt: s.scheduledAt || s.startTime,
          startTime: s.startTime || s.scheduledAt,
          status: (s.status || "confirmed").toLowerCase(),
          isGroupSession: Boolean(s.isGroupSession),
          timing,
          staleLabel: timing.staleLabel,
        },
        timing,
      })
    }
  })

  // Deduplicate flattened items:
  // • Bookings: dedupe by bookingId (fallback to _id) so multiple bookings in the same container are preserved
  // • Container items without bookings: dedupe by sessionId
  const seenBookingIds = new Set<string>()
  const seenContainerIds = new Set<string>()
  const flattenedBookings: { session: Session; timing: ReturnType<typeof getSessionTiming> }[] = []

  rawFlattened.forEach((item) => {
    const bookingId = item.session.bookingId || item.session._id
    if (bookingId) {
      const bKey = String(bookingId)
      if (!seenBookingIds.has(bKey)) {
        seenBookingIds.add(bKey)
        flattenedBookings.push(item)
      }
    } else {
      const cKey = String(item.session.sessionId || item.session._id || "")
      if (cKey && !seenContainerIds.has(cKey)) {
        seenContainerIds.add(cKey)
        flattenedBookings.push(item)
      } else if (!cKey) {
        flattenedBookings.push(item)
      }
    }
  })

  // ── Photo IDs that need to be resolved to URLs (URL values are skipped) ──
  // A string key is used so the effect does not re-run on every 15s re-render.
  const pendingPhotoIdsKey = Array.from(
    new Set(
      flattenedBookings
        .map(({ session }) => session.menteeProfilePhoto)
        .filter(
          (p): p is string => typeof p === "string" && p.trim().length > 0 && !isUrlLike(p)
        )
    )
  )
    .sort()
    .join(",")

  useEffect(() => {
    if (!pendingPhotoIdsKey) return
    const ids = pendingPhotoIdsKey
      .split(",")
      .filter((id) => id && !requestedPhotoIds.current.has(id))
    if (ids.length === 0) return

    ids.forEach((id) => requestedPhotoIds.current.add(id))

    let cancelled = false
    Promise.all(
      ids.map((id) =>
        ProfileService.getProfilePhotoById(id)
          .then((res: any) => ({ id, url: res?.data?.photo?.cloudinarySecureUrl as string | undefined }))
          .catch(() => {
            // If it fails, allow a retry later
            requestedPhotoIds.current.delete(id)
            return { id, url: undefined }
          })
      )
    ).then((results) => {
      if (cancelled) return
      setPhotoUrls((prev) => {
        const next = { ...prev }
        results.forEach(({ id, url }) => {
          if (url) next[id] = url
        })
        return next
      })
    })

    return () => {
      cancelled = true
    }
  }, [pendingPhotoIdsKey])

  // A URL is used as-is, an ID uses the resolved URL (initials show until it arrives)
  const resolvePhoto = (photo?: string | null): string | null => {
    if (!photo) return null
    if (isUrlLike(photo)) return photo
    return photoUrls[photo] ?? null
  }

  // Upcoming: not terminal, not completed, not stale, end time in the future (or live)
  const upcoming: Session[] = flattenedBookings
    .filter(
      ({ timing, session }) =>
        timing.isUpcoming &&
        !timing.isStale &&
        session.status !== "available" &&
        // Remove the session from Overview as soon as its end time passes
        (isNaN(timing.endMs) || now <= timing.endMs)
    )
    .map(({ session }) => session)
    .sort(
      (a, b) =>
        new Date(a.startTime || a.scheduledAt || 0).getTime() -
        new Date(b.startTime || b.scheduledAt || 0).getTime()
    )

  // Missed / Not held: non-terminal, non-completed, stale sessions (past their end time)
  // • "Not held" = confirmed/rescheduled, never started (startedAt absent), past end
  // • "Ended"    = in_progress, past grace window (startedAt exists)
  // Excludes unbooked service cards (status === 'available') and expired pending requests
  const missedNotHeld: Session[] = flattenedBookings
    .filter(
      ({ timing, session }) =>
        !timing.isTerminal &&
        !timing.isCompleted &&
        session.status !== "available" &&
        timing.staleLabel !== "Expired" &&
        (timing.isStale ||
          // Was in_progress, the end time passed but End was never pressed
          (timing.isInProgress && !isNaN(timing.endMs) && now > timing.endMs))
    )
    .map(({ session }) => session)
    .sort(
      (a, b) =>
        new Date(b.startTime || b.scheduledAt || 0).getTime() -
        new Date(a.startTime || a.scheduledAt || 0).getTime()
    )

  // Auto-switch panel tab: if there is no upcoming but missed/not held exist, show those
  // Placed at top level before ANY conditional return (Rules of Hooks)
  const prevUpcomingLen = useRef(upcoming.length)
  const prevMissedLen = useRef(missedNotHeld.length)
  useEffect(() => {
    if (prevUpcomingLen.current !== upcoming.length || prevMissedLen.current !== missedNotHeld.length) {
      prevUpcomingLen.current = upcoming.length
      prevMissedLen.current = missedNotHeld.length
      if (upcoming.length === 0 && missedNotHeld.length > 0) setSessionsPanelTab("missedNotHeld")
      else if (upcoming.length > 0) setSessionsPanelTab("upcoming")
    }
  }, [upcoming.length, missedNotHeld.length])

  // When the mentor ends a session or comes back from the room: refetch the dashboard (in_progress -> completed)
  const { sessionEnded } = useSocket()
  useEffect(() => {
    if (sessionEnded) onRetryDashboard?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionEnded])

  useEffect(() => {
    if (!onRetryDashboard) return
    const refresh = () => {
      if (document.visibilityState === "visible") onRetryDashboard()
    }
    window.addEventListener("focus", refresh)
    document.addEventListener("visibilitychange", refresh)
    return () => {
      window.removeEventListener("focus", refresh)
      document.removeEventListener("visibilitychange", refresh)
    }
  }, [onRetryDashboard])

  // Start / Rejoin a session
  const startOrRejoin = async (
    s: Session,
    isLive: boolean,
    rowKey: string,
    sessionId?: string
  ) => {
    if (!sessionId || joiningKey === rowKey) return
    setJoinError(null)
    setJoiningKey(rowKey)
    try {
      if (s.isGroupSession) {
        let meetUrl = s.meetingUrl
        if (!isLive) {
          const res: any = await SessionService.startGroupSession(String(sessionId))
          meetUrl = res?.data?.meeting?.meetingUrl || res?.data?.meetingUrl || meetUrl
          onRetryDashboard?.()
        }
        if (meetUrl) window.open(meetUrl, "_blank", "noopener,noreferrer")
        else setJoinError("Session started, but no meeting link found.")
        return
      }

      // 1:1: first time -> start on the backend, then open the mentor-session room
      // (End Session and Rejoin both live there)
      let roomId = s.bookingId
      if (!isLive) {
        const res: any = await SessionService.startSession(String(sessionId), s.bookingId)
        roomId = res?.data?.roomId || s.bookingId
        onRetryDashboard?.()
      }
      const qs = new URLSearchParams({
        sessionId: String(sessionId),
        roomId: String(roomId || ""),
        bookingId: String(s.bookingId || ""),
        role: "mentor",
      })
      router.push(`/mentorship/mentor-session?${qs.toString()}`)
    } catch (err: any) {
      setJoinError(err?.message || "Could not start the session. Please try again.")
    } finally {
      setJoiningKey(null)
    }
  }

  const openMentee = (menteeId?: string) => {
    if (menteeId) router.push(`/mentorship/menteeProfile/${menteeId}`)
  }

  // Loading skeleton
  if (dashboardLoading && !dashboardData) {
    return (
      <div className="space-y-6 w-full max-w-7xl mx-auto motion-safe:animate-pulse">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-[#e0d8cf] rounded-md" />
          <div className="h-4 w-64 bg-[#e0d8cf]/60 rounded-md" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-[#e0d8cf] space-y-3">
              <div className="h-3 w-20 bg-[#e0d8cf]/60 rounded" />
              <div className="h-6 w-16 bg-[#e0d8cf] rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#e0d8cf] space-y-4">
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
      <div className="w-full max-w-2xl p-5 rounded-xl bg-red-50 border border-red-200 text-red-800 space-y-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <h3 className="font-bold text-base">Unable to load your mentor dashboard</h3>
            <p className="text-sm text-red-600 mt-0.5 break-words">{dashboardError}</p>
          </div>
        </div>
        {onRetryDashboard && (
          <button
            onClick={onRetryDashboard}
            className={`px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors flex items-center gap-2 ${FOCUS_RING}`}
          >
            <RotateCcw className="w-4 h-4" />
            Try again
          </button>
        )}
      </div>
    )
  }

  const firstName = capitalizeName(
    dashboardData?.user?.firstName ?? mentorData?.user?.firstName ?? "there"
  )
  const rating = Number(
    dashboardData?.stats?.rating ?? dashboardData?.rating ?? mentorData?.stats?.averageRating ?? 0
  )
  const reviewCount: number | undefined =
    dashboardData?.totalReviews ?? mentorData?.stats?.totalReviews ?? undefined
  // With zero reviews a rating would look fake
  const hasReviews = reviewCount != null ? reviewCount > 0 : rating > 0

  // trustScore: backend now returns .overall correctly; also guard against old .score
  const trustScore =
    (dashboardData?.stats?.trustScore != null ? dashboardData.stats.trustScore : undefined) ??
    (mentorData?.trustScore?.overall != null ? mentorData.trustScore.overall : undefined) ??
    null

  const isVerified =
    dashboardData?.isVerified ?? Boolean(mentorData?.verification?.isVerified || mentorData?.isVerified)

  const isPendingApproval =
    mentorData?.status === "pending_approval" || dashboardData?.status === "pending_approval"

  // Earnings this month come from the backend (real sum of paid/completed bookings in the IST month)
  // Shows Rs 0 when the real sum is 0, never "--" once the mentor profile or dashboard is loaded.
  const earningsRaw =
    dashboardData?.stats?.thisMonthEarnings ??
    dashboardData?.stats?.monthlyEarnings ??
    dashboardData?.earnings?.thisMonth ??
    mentorData?.stats?.totalEarnings ??
    0
  const earningsValue = formatINR(Number(earningsRaw) || 0)

  // Day-filter tabs (only relevant for the Upcoming panel)
  const todaySessions = upcoming.filter((s) => getDayCategory(s.startTime || s.scheduledAt) === "today")
  const tomorrowSessions = upcoming.filter((s) => getDayCategory(s.startTime || s.scheduledAt) === "tomorrow")
  const laterSessions = upcoming.filter((s) => getDayCategory(s.startTime || s.scheduledAt) === "later")

  const displayedSessions =
    filterTab === "today" ? todaySessions :
      filterTab === "tomorrow" ? tomorrowSessions :
        filterTab === "later" ? laterSessions :
          upcoming

  // Stats come straight from backend dashboardData.stats (computed across all containers)
  const totalSessions = dashboardData?.stats?.totalSessions ?? 0
  const upcomingCount = upcoming.length
  const missedNotHeldCount = missedNotHeld.length

  const stats: {
    key: string
    label: string
    value: string
    unit?: string
    caption?: string
    icon: React.ElementType
    selected?: boolean
    onClick?: () => void
  }[] = [
    { key: "total", label: "Total sessions", value: String(totalSessions), icon: ClipboardList },
    {
      key: "upcoming",
      label: "Upcoming",
      value: String(upcomingCount),
      icon: CalendarClock,
      selected: sessionsPanelTab === "upcoming",
      onClick: () => setSessionsPanelTab("upcoming"),
    },
    {
      key: "missed",
      label: "Missed / not held",
      value: String(missedNotHeldCount),
      icon: AlertCircle,
      selected: sessionsPanelTab === "missedNotHeld",
      onClick: () => setSessionsPanelTab("missedNotHeld"),
    },
    {
      key: "earnings",
      label: "Earnings this month",
      value: earningsValue,
      icon: Wallet,
      onClick: () => setActivePage?.("payment"),
    },
    {
      key: "rating",
      label: "Rating",
      value: hasReviews ? rating.toFixed(1) : "--",
      unit: hasReviews ? "/5" : undefined,
      caption: hasReviews && reviewCount ? `${reviewCount} review${reviewCount > 1 ? "s" : ""}` : "No reviews yet",
      icon: Star,
      onClick: () => setActivePage?.("review"),
    },
    {
      key: "trust",
      label: "Trust score",
      value: trustScore != null ? String(trustScore) : "-",
      unit: trustScore != null ? "/100" : undefined,
      caption: trustScore != null ? undefined : "Building",
      icon: Award,
      onClick: () => setActivePage?.("trust"),
    },
  ]

  const setupSteps = [
    { label: "Set your availability", desc: "Students can only book open slots", page: "availability", icon: Clock3, done: false },
    { label: "Add a service", desc: "Create a 1:1 or group offering", page: "services", icon: Briefcase, done: false },
    { label: "Get verified", desc: "Verified mentors get more booking requests", page: "profile", subtab: "verification", icon: ShieldCheck, done: isVerified },
    { label: "Share your profile", desc: "Use the marketing kit to bring in students", page: "marketing", icon: Share2, done: false },
  ]

  const quickActions = [
    { label: "Update availability", page: "availability", icon: Clock3 },
    { label: "Create a plan", page: "plans", icon: CalendarPlus },
    { label: "View analytics", page: "analytics", icon: BarChart3 },
  ]

  const showSetup = Number(totalSessions) === 0

  const dayTabs = [
    { key: "all", label: "All", count: upcoming.length },
    { key: "today", label: "Today", count: todaySessions.length },
    { key: "tomorrow", label: "Tomorrow", count: tomorrowSessions.length },
    { key: "later", label: "Later", count: laterSessions.length },
  ] as const

  const panelTabs = [
    { key: "upcoming", label: "Upcoming", count: upcomingCount, icon: CalendarClock },
    { key: "missedNotHeld", label: "Missed / not held", count: missedNotHeldCount, icon: AlertCircle },
  ] as const

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: COLORS.ink }}>
          Welcome back, {firstName}
        </h2>
        <p className="text-sm mt-1" style={{ color: COLORS.muted }}>
          Here’s where things stand today
        </p>
      </div>

      {/* Verification nudge: only shown when not verified */}
      {!isVerified && (
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border"
          style={{ backgroundColor: COLORS.wash, borderColor: COLORS.hairline }}
        >
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: COLORS.ink }}
            >
              {isPendingApproval ? (
                <Clock className="w-4 h-4 text-white" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: COLORS.ink }}>
                {isPendingApproval ? "Verification under review" : "Complete verification to unlock your badge"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: COLORS.muted }}>
                {isPendingApproval
                  ? "The Throne8 team is reviewing your application (5 to 7 business days)"
                  : "Verified mentors get more booking requests"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActivePage?.("profile", "verification")}
            className={`shrink-0 w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 ${FOCUS_RING}`}
            style={{ backgroundColor: COLORS.ink }}
          >
            {isPendingApproval ? "Check status" : "Verify now"}
          </button>
        </div>
      )}

      {/* Stat cards: 2 columns on mobile, 3 on tablet, 6 on large screens */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {stats.map((stat) => (
          <StatCard
            key={stat.key}
            label={stat.label}
            value={stat.value}
            unit={stat.unit}
            caption={stat.caption}
            icon={stat.icon}
            selected={stat.selected}
            onClick={stat.onClick}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Sessions panel: Upcoming + Missed / not held tabs */}
        <section
          className="lg:col-span-2 bg-white rounded-xl border min-w-0"
          style={{ borderColor: COLORS.hairline }}
        >
          {/* Panel header: tabs + "View all" */}
          <div
            className="flex items-center justify-between gap-3 px-4 sm:px-5 border-b"
            style={{ borderColor: COLORS.hairline }}
          >
            <div role="tablist" aria-label="Sessions" className="flex gap-4 sm:gap-6 overflow-x-auto">
              {panelTabs.map((tab) => {
                const active = sessionsPanelTab === tab.key
                return (
                  <button
                    key={tab.key}
                    role="tab"
                    type="button"
                    aria-selected={active}
                    onClick={() => setSessionsPanelTab(tab.key)}
                    className={`flex items-center gap-2 py-3.5 -mb-px border-b-2 text-sm font-semibold whitespace-nowrap transition-colors ${FOCUS_RING}`}
                    style={{
                      borderColor: active ? COLORS.ink : "transparent",
                      color: active ? COLORS.ink : COLORS.muted,
                    }}
                  >
                    {tab.label}
                    <span
                      className="px-1.5 min-w-[20px] text-center rounded-full text-[11px] font-bold"
                      style={{
                        backgroundColor: active ? COLORS.ink : COLORS.chip,
                        color: active ? "#fff" : COLORS.accent,
                      }}
                    >
                      {tab.count}
                    </span>
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setActivePage?.("booking")}
              className={`text-xs font-semibold hover:underline flex items-center gap-0.5 shrink-0 rounded ${FOCUS_RING}`}
              style={{ color: COLORS.accent }}
            >
              <span className="hidden sm:inline">View all bookings</span>
              <span className="sm:hidden">View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 sm:p-5">
            {/* Day filter: only when the Upcoming tab is active and has sessions */}
            {sessionsPanelTab === "upcoming" && upcoming.length > 0 && (
              <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
                {dayTabs.map((tab) => {
                  const isActive = filterTab === tab.key
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setFilterTab(tab.key)}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border shrink-0 flex items-center gap-1.5 transition-colors ${FOCUS_RING}`}
                      style={{
                        backgroundColor: isActive ? COLORS.ink : "#fff",
                        color: isActive ? "#fff" : COLORS.accent,
                        borderColor: isActive ? COLORS.ink : COLORS.hairline,
                      }}
                    >
                      {tab.label}
                      <span className="opacity-70">{tab.count}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {joinError && (
              <div
                role="alert"
                className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
              >
                <span className="min-w-0 break-words">{joinError}</span>
                <button type="button" onClick={() => setJoinError(null)} className="font-semibold hover:underline shrink-0">
                  Dismiss
                </button>
              </div>
            )}

            {/* ─── UPCOMING ─────────────────────────────── */}
            {sessionsPanelTab === "upcoming" && (
              upcoming.length === 0 ? (
                <EmptyPanel
                  icon={CalendarClock}
                  title="No upcoming sessions booked yet"
                  text="Open your slots so students can book you."
                  action={
                    <button
                      onClick={() => setActivePage?.("availability")}
                      className={`px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 ${FOCUS_RING}`}
                      style={{ backgroundColor: COLORS.ink }}
                    >
                      Set availability
                    </button>
                  }
                />
              ) : displayedSessions.length === 0 ? (
                <EmptyPanel
                  icon={Calendar}
                  title={`No sessions scheduled for ${filterTab === "today" ? "today" : filterTab === "tomorrow" ? "tomorrow" : "later dates"}`}
                  action={
                    <button
                      onClick={() => setFilterTab("all")}
                      className={`text-xs font-semibold hover:underline rounded ${FOCUS_RING}`}
                      style={{ color: COLORS.accent }}
                    >
                      Show all upcoming sessions ({upcoming.length})
                    </button>
                  }
                />
              ) : (
                <ul className="space-y-3">
                  {displayedSessions.map((s, idx) => {
                    const name = s.menteeName || s.bookedMenteeName || "Student"
                    const menteeId = s.menteeId
                    const isClickable = Boolean(menteeId)
                    const sessionDateInfo = formatSessionDate(s.startTime || s.scheduledAt)
                    const sessionId = s.sessionId || s._id
                    const joinInfo = getJoinState(s, now, 0)

                    // If the session is already in_progress show "Rejoin", never call startSession again
                    const sessionTiming = (s as any).timing as ReturnType<typeof getSessionTiming> | undefined
                    const isLive = Boolean(sessionTiming?.isInProgress)
                    const rowKey = String(s.bookingId ?? s._id ?? sessionId ?? idx)
                    const isJoining = joiningKey === rowKey

                    return (
                      <li
                        key={s.bookingId ?? s._id ?? idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border"
                        style={{ backgroundColor: COLORS.softWash, borderColor: COLORS.hairline }}
                      >
                        {/* Mentee info */}
                        {isClickable ? (
                          <button
                            type="button"
                            onClick={() => openMentee(menteeId)}
                            className={`group flex items-center gap-3 min-w-0 text-left rounded-lg ${FOCUS_RING}`}
                          >
                            <MenteeAvatar photo={resolvePhoto(s.menteeProfilePhoto)} name={name} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold truncate group-hover:underline" style={{ color: COLORS.ink }}>
                                  {name}
                                </p>
                                {s.isGroupSession && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                    Group
                                  </span>
                                )}
                              </div>
                              <p className="text-xs mt-0.5 truncate" style={{ color: COLORS.muted }}>
                                {s.title || s.sessionType || "1-on-1 Mentorship"}
                              </p>
                            </div>
                          </button>
                        ) : (
                          <div className="flex items-center gap-3 min-w-0">
                            <MenteeAvatar photo={resolvePhoto(s.menteeProfilePhoto)} name={name} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold truncate" style={{ color: COLORS.ink }}>
                                  {name}
                                </p>
                                {s.isGroupSession && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                    Group
                                  </span>
                                )}
                              </div>
                              <p className="text-xs mt-0.5 truncate" style={{ color: COLORS.muted }}>
                                {s.title || s.sessionType || "1-on-1 Mentorship"}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Time + action */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <TimeBadge info={sessionDateInfo} />

                          {sessionId && (isLive || joinInfo.state !== "hidden") && (
                            <div className="flex flex-col items-end">
                              {isLive ? (
                                <button
                                  type="button"
                                  onClick={() => startOrRejoin(s, isLive, rowKey, String(sessionId))}
                                  disabled={isJoining}
                                  title="Session is live, click to rejoin"
                                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white transition-colors disabled:opacity-60 ${FOCUS_RING}`}
                                >
                                  {isJoining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />}
                                  Rejoin
                                </button>
                              ) : joinInfo.state === "active" ? (
                                <button
                                  type="button"
                                  onClick={() => startOrRejoin(s, isLive, rowKey, String(sessionId))}
                                  disabled={isJoining}
                                  title="Session is active, click to start"
                                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors disabled:opacity-60 ${FOCUS_RING}`}
                                >
                                  {isJoining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />}
                                  Start
                                </button>
                              ) : joinInfo.state === "ended" ? (
                                <button
                                  type="button"
                                  disabled
                                  title="Session has ended"
                                  className="px-3.5 py-2 rounded-lg text-xs font-bold cursor-not-allowed border"
                                  style={{ backgroundColor: "#ece4dc", color: COLORS.faint, borderColor: COLORS.hairline }}
                                >
                                  Ended
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    disabled
                                    title="Available 5 minutes before the scheduled start"
                                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold cursor-not-allowed border"
                                    style={{ backgroundColor: "#e8e0d5", color: COLORS.muted, borderColor: COLORS.hairline }}
                                  >
                                    <Video className="w-3.5 h-3.5 opacity-60" />
                                    Start
                                  </button>
                                  <span className="text-[10px] mt-1 whitespace-nowrap font-medium" style={{ color: COLORS.muted }}>
                                    {joinInfo.subtext}
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )
            )}

            {/* ─── MISSED / NOT HELD ───────────────────── */}
            {sessionsPanelTab === "missedNotHeld" && (
              missedNotHeld.length === 0 ? (
                <EmptyPanel icon={AlertCircle} title="No missed or not-held sessions" />
              ) : (
                <ul className="space-y-3">
                  {missedNotHeld.map((s, idx) => {
                    const name = s.menteeName || s.bookedMenteeName || "Student"
                    const menteeId = s.menteeId
                    const isClickable = Boolean(menteeId)
                    const sessionDateInfo = formatSessionDate(s.startTime || s.scheduledAt)
                    // Derive the stale label from booking timing
                    const timing = (s as any).timing || getSessionTiming(s, undefined, now)

                    const staleLabel = timing.isInProgress
                      ? "Ended"
                      : (s as any).staleLabel || timing.staleLabel || "Not held"

                    const staleBadgeClass =
                      staleLabel === "Expired"
                        ? "bg-amber-50 text-amber-800 border border-amber-200"
                        : staleLabel === "Ended"
                          ? "bg-zinc-100 text-zinc-600 border border-zinc-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200" // "Missed" / "Not held"

                    const info = (
                      <>
                        <MenteeAvatar photo={resolvePhoto(s.menteeProfilePhoto)} name={name} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p
                              className={`text-sm font-semibold truncate ${isClickable ? "group-hover:underline" : ""}`}
                              style={{ color: COLORS.ink }}
                            >
                              {name}
                            </p>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${staleBadgeClass}`}>
                              {staleLabel === "Missed" ? "Not held" : staleLabel}
                            </span>
                            {s.isGroupSession && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                Group
                              </span>
                            )}
                          </div>
                          <p className="text-xs mt-0.5 truncate" style={{ color: COLORS.muted }}>
                            {s.title || s.sessionType || "1-on-1 Mentorship"}
                          </p>
                        </div>
                      </>
                    )

                    return (
                      <li
                        key={s.bookingId ?? s._id ?? idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border"
                        style={{ backgroundColor: COLORS.softWash, borderColor: COLORS.hairline }}
                      >
                        {isClickable ? (
                          <button
                            type="button"
                            onClick={() => openMentee(menteeId)}
                            className={`group flex items-center gap-3 min-w-0 text-left rounded-lg ${FOCUS_RING}`}
                          >
                            {info}
                          </button>
                        ) : (
                          <div className="flex items-center gap-3 min-w-0">{info}</div>
                        )}

                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full self-start sm:self-center shrink-0 whitespace-nowrap"
                          style={{ backgroundColor: COLORS.chip, color: COLORS.faint, border: `1px solid ${COLORS.hairline}` }}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          {sessionDateInfo.label}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )
            )}
          </div>
        </section>

        {/* Right column: on mobile it stacks below the sessions panel */}
        <aside className="space-y-6 min-w-0">
          {/* Setup checklist: for new mentors (0 sessions) */}
          {showSetup && (
            <section className="bg-white p-4 sm:p-5 rounded-xl border" style={{ borderColor: COLORS.hairline }}>
              <h3 className="text-sm font-bold" style={{ color: COLORS.ink }}>
                Get started
              </h3>
              <p className="text-xs mt-1 mb-3" style={{ color: COLORS.muted }}>
                Complete these steps so students can book you
              </p>
              <ul className="divide-y" style={{ borderColor: COLORS.hairline }}>
                {setupSteps.map((step) => (
                  <li key={step.page} style={{ borderColor: COLORS.hairline }}>
                    <button
                      onClick={() => setActivePage?.(step.page, (step as any).subtab)}
                      className={`w-full flex items-center justify-between gap-3 py-3 text-left rounded-lg hover:bg-[#fbf7f3] transition-colors ${FOCUS_RING}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: step.done ? "#dcfce7" : COLORS.chip }}
                        >
                          {step.done ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          ) : (
                            <step.icon className="w-4 h-4" style={{ color: COLORS.accent }} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold" style={{ color: COLORS.ink }}>
                            {step.label}
                          </p>
                          <p className="text-xs" style={{ color: COLORS.muted }}>
                            {step.desc}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 shrink-0" style={{ color: COLORS.muted }} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Quick actions */}
          <section className="bg-white p-4 sm:p-5 rounded-xl border" style={{ borderColor: COLORS.hairline }}>
            <h3 className="text-sm font-bold mb-3" style={{ color: COLORS.ink }}>
              Quick actions
            </h3>
            <div className="flex flex-col gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.page}
                  onClick={() => setActivePage?.(action.page)}
                  className={`flex items-center justify-between gap-2 px-3.5 py-3 rounded-lg text-sm font-semibold border transition-colors hover:border-[#c9baa9] hover:bg-[#fbf7f3] ${FOCUS_RING}`}
                  style={{ color: COLORS.ink, borderColor: COLORS.hairline }}
                >
                  <span className="flex items-center gap-2.5">
                    <action.icon className="w-4 h-4" style={{ color: COLORS.accent }} />
                    {action.label}
                  </span>
                  <ChevronRight className="w-4 h-4" style={{ color: COLORS.muted }} />
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}