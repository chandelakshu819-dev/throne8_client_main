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
  ChevronRight,
  Wallet,
  Briefcase,
  Share2,
  CheckCircle2,
} from "lucide-react"
import {
  getJoinState,
  getJoinWindow,
  getSessionTiming,
  useNow,
} from "@/features/mentorship/utils/sessionJoin"
import { capitalizeName } from "@/shared/utils/format"
import ProfileService from "@/lib/api/profile.service"

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

// Photo value URL hai ya photo ID? (ID ko baad me ProfileService se URL me convert karte hain)
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
  className = "w-9 h-9",
}: {
  photo?: string | null
  name: string
  className?: string
}) {
  const [imgError, setImgError] = useState(false)
  const initials = initialsFrom(name)
  const isValidUrl = isUrlLike(photo)

  // photo badalne par error reset ho (ID resolve hone ke baad URL aata hai)
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

  // Saare hooks early return se pehle (Rules of Hooks)
  // Panel-level tab: "upcoming" shows future sessions, "missedNotHeld" shows stale past ones
  const [sessionsPanelTab, setSessionsPanelTab] = useState<"upcoming" | "missedNotHeld">("upcoming")
  // Day-filter within Upcoming tab
  const [filterTab, setFilterTab] = useState<"all" | "today" | "tomorrow" | "later">("today")

  // photoId -> resolved cloudinary URL
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})
  // Jin photo IDs ki request ja chuki hai (dobara fetch na ho)
  const requestedPhotoIds = useRef<Set<string>>(new Set())

  // Clock skew correction + auto-ticking timer (har 15s)
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
  // upcomingSessions, missedNotHeldSessions, and sessions prop so each booking is
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

        // Photo URL ya photo ID (ID ho to neeche effect se URL me resolve hoga)
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

  // ── Photo IDs jinhe URL me resolve karna hai (URL wale skip) ──
  // String key use kar rahe hain taaki har 15s ke re-render par effect dobara na chale.
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
            // fail hua to dobara try ho sake
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

  // URL ho to wahi, ID ho to resolved URL (jab tak nahi aata, initials dikhte hain)
  const resolvePhoto = (photo?: string | null): string | null => {
    if (!photo) return null
    if (isUrlLike(photo)) return photo
    return photoUrls[photo] ?? null
  }

  // Upcoming: not terminal, not completed, not stale, end time in the future (or live)
  const upcoming: Session[] = flattenedBookings
    .filter(({ timing, session }) => timing.isUpcoming && !timing.isStale && session.status !== "available")
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
        timing.isStale &&
        timing.staleLabel !== "Expired" &&
        session.status !== "available"
    )
    .map(({ session }) => session)
    .sort(
      (a, b) =>
        new Date(b.startTime || b.scheduledAt || 0).getTime() -
        new Date(a.startTime || a.scheduledAt || 0).getTime()
    )

  const completed: Session[] = flattenedBookings
    .filter(({ timing }) => timing.isCompleted)
    .map(({ session }) => session)

  // Auto-switch panel tab: if no upcoming but missed/not held exist, show those
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

  // Loading skeleton
  if (dashboardLoading && !dashboardData) {
    return (
      <div className="space-y-6 w-full max-w-7xl mx-auto animate-pulse">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-[#e0d8cf] rounded-md" />
          <div className="h-4 w-64 bg-[#e0d8cf]/60 rounded-md" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-[#e0d8cf] space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#f3ece4]" />
              <div className="h-6 w-16 bg-[#e0d8cf] rounded" />
              <div className="h-3 w-20 bg-[#e0d8cf]/60 rounded" />
            </div>
          ))}
        </div>
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

  const firstName = capitalizeName(
    dashboardData?.user?.firstName ?? mentorData?.user?.firstName ?? "there"
  )
  const rating = Number(
    dashboardData?.stats?.rating ?? dashboardData?.rating ?? mentorData?.stats?.averageRating ?? 0
  )
  const reviewCount: number | undefined =
    dashboardData?.totalReviews ?? mentorData?.stats?.totalReviews ?? undefined
  // Reviews zero hain to rating dikhana fake lagta hai
  const hasReviews = reviewCount != null ? reviewCount > 0 : rating > 0

  // trustScore: backend now returns .overall correctly; also guard against old .score
  const trustScore =
    (dashboardData?.stats?.trustScore != null ? dashboardData.stats.trustScore : undefined) ??
    (mentorData?.trustScore?.overall != null ? mentorData.trustScore.overall : undefined) ??
    null

  const isVerified =
    dashboardData?.isVerified ?? Boolean(mentorData?.verification?.isVerified || mentorData?.isVerified)

  // Earnings this month: comes from backend (real sum of paid/completed bookings in IST month)
  // Shows Rs 0 when real sum is 0, never "--" when mentor profile or dashboard is loaded.
  const earningsRaw =
    dashboardData?.stats?.thisMonthEarnings ??
    dashboardData?.stats?.monthlyEarnings ??
    dashboardData?.earnings?.thisMonth ??
    mentorData?.stats?.totalEarnings ??
    0
  const earningsValue = formatINR(Number(earningsRaw) || 0)

  // Day-filter tabs (only relevant for Upcoming panel)
  const todaySessions = upcoming.filter((s) => getDayCategory(s.startTime || s.scheduledAt) === "today")
  const tomorrowSessions = upcoming.filter((s) => getDayCategory(s.startTime || s.scheduledAt) === "tomorrow")
  const laterSessions = upcoming.filter((s) => getDayCategory(s.startTime || s.scheduledAt) === "later")

  const displayedSessions =
    filterTab === "today" ? todaySessions :
      filterTab === "tomorrow" ? tomorrowSessions :
        filterTab === "later" ? laterSessions :
          upcoming

  // Read stats directly from backend dashboardData.stats (computed across all containers)
  const totalSessions = dashboardData?.stats?.totalSessions ?? 0
  const upcomingCount = upcoming.length
  const missedNotHeldCount = missedNotHeld.length

  const stats: {
    label: string
    value: string
    unit?: string
    icon: React.ElementType
    page?: string
    highlight?: boolean
    onClick?: () => void
  }[] = [
      { label: "Total sessions", value: String(totalSessions), icon: ClipboardList },
      {
        label: "Upcoming",
        value: String(upcomingCount),
        icon: CalendarClock,
        highlight: upcomingCount > 0,
        onClick: () => setSessionsPanelTab("upcoming"),
      },
      {
        label: "Missed / Not held",
        value: String(missedNotHeldCount),
        icon: AlertCircle,
        onClick: () => setSessionsPanelTab("missedNotHeld"),
      },
      { label: "Earnings this month", value: earningsValue, icon: Wallet, page: "payment" },
      {
        label: hasReviews && reviewCount ? `Rating · ${reviewCount} review${reviewCount > 1 ? "s" : ""}` : "No reviews yet",
        value: hasReviews ? rating.toFixed(1) : "--",
        unit: hasReviews ? "/5" : undefined,
        icon: Star,
        page: "review",
      },
      {
        label: trustScore != null ? "Trust score" : "Trust score (building)",
        value: trustScore != null ? String(trustScore) : "-",
        unit: trustScore != null ? "/100" : undefined,
        icon: Award,
        page: "trust",
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

  return (
    <div className="space-y-6 animate-fadeIn w-full max-w-7xl mx-auto">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold" style={{ color: COLORS.ink }}>
          Welcome back, {firstName}
        </h2>
        <p style={{ color: COLORS.muted }} className="text-sm mt-1">
          Here's where things stand today
        </p>
      </div>

      {/* Stat cards: sab ek jaisi size aur baseline */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, idx) => {
          const clickable = Boolean(stat.page || stat.onClick)
          const handleClick = () => {
            if (stat.onClick) stat.onClick()
            else if (stat.page) setActivePage?.(stat.page)
          }
          return (
            <div
              key={idx}
              role={clickable ? "button" : undefined}
              tabIndex={clickable ? 0 : undefined}
              onClick={clickable ? handleClick : undefined}
              onKeyDown={
                clickable
                  ? (e) => (e.key === "Enter" || e.key === " ") && handleClick()
                  : undefined
              }
              className={`bg-white p-4 rounded-2xl transition-colors hover:border-[#c9baa9] ${clickable ? "cursor-pointer" : ""
                }`}
              style={{
                border: `1px solid ${stat.highlight ? COLORS.gold : COLORS.hairline}`,
                boxShadow: stat.highlight ? "0 2px 10px rgba(201,168,124,0.22)" : undefined,
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                style={{ backgroundColor: stat.highlight ? "#f4e6d0" : COLORS.chip }}
              >
                <stat.icon className="w-4 h-4" style={{ color: COLORS.accent }} />
              </div>
              <div className="text-2xl font-bold flex items-baseline gap-1" style={{ color: COLORS.ink }}>
                {stat.value}
                {stat.unit && (
                  <span className="text-sm font-semibold" style={{ color: COLORS.muted }}>
                    {stat.unit}
                  </span>
                )}
              </div>
              <div className="text-xs mt-1" style={{ color: COLORS.muted }}>
                {stat.label}
              </div>
            </div>
          )
        })}
      </div>

      {/* Verification nudge: sirf jab verified nahi */}
      {!isVerified && (
        <div
          className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl"
          style={{ backgroundColor: COLORS.wash, border: `1px solid ${COLORS.hairline}` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: COLORS.ink }}
            >
              {mentorData?.status === "pending_approval" || dashboardData?.status === "pending_approval" ? (
                <Clock className="w-4 h-4 text-white" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-white" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: COLORS.ink }}>
                {mentorData?.status === "pending_approval" || dashboardData?.status === "pending_approval"
                  ? "Verification under review"
                  : "Complete verification to unlock your badge"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: COLORS.muted }}>
                {mentorData?.status === "pending_approval" || dashboardData?.status === "pending_approval"
                  ? "Your application is currently under review by the Throne8 team (5 to 7 business days)"
                  : "Verified mentors get more booking requests"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActivePage?.("profile", "verification")}
            className="shrink-0 px-5 py-2.5 rounded-full text-xs font-bold transition-all hover:bg-[#8b7355] shadow-sm"
            style={{ backgroundColor: COLORS.ink, color: "#fff" }}
          >
            {mentorData?.status === "pending_approval" || dashboardData?.status === "pending_approval"
              ? "Check status"
              : "Verify now"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Sessions panel — Upcoming + Missed/Not held dual tabs */}
        <div
          className="lg:col-span-3 bg-white p-6 rounded-2xl"
          style={{ border: `1px solid ${COLORS.hairline}` }}
        >
          {/* Panel header: tab switcher + "View all" */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setSessionsPanelTab("upcoming")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={{
                  backgroundColor: sessionsPanelTab === "upcoming" ? COLORS.ink : COLORS.chip,
                  color: sessionsPanelTab === "upcoming" ? "#fff" : COLORS.accent,
                }}
              >
                <CalendarClock className="w-3.5 h-3.5" />
                Upcoming ({upcomingCount})
              </button>
              <button
                type="button"
                onClick={() => setSessionsPanelTab("missedNotHeld")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={{
                  backgroundColor: sessionsPanelTab === "missedNotHeld" ? COLORS.ink : COLORS.chip,
                  color: sessionsPanelTab === "missedNotHeld" ? "#fff" : COLORS.accent,
                }}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                Missed / Not held ({missedNotHeldCount})
              </button>
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

          {/* Day-filter sub-tabs — only visible when Upcoming tab is active and has sessions */}
          {sessionsPanelTab === "upcoming" && upcoming.length > 0 && (
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
                    className={`px-3 py-1.5 text-xs rounded-lg transition-all shrink-0 flex items-center gap-1.5 ${isActive
                      ? "bg-[#7a5c3e] text-white shadow-sm font-bold"
                      : "text-[#8a7a6a] hover:text-[#4a3728]"
                      }`}
                  >
                    {"hasDot" in tab && tab.hasDot && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-300" : "bg-emerald-500"
                          } animate-pulse`}
                      />
                    )}
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 rounded-full text-[10px] font-bold ${isActive ? "bg-white/20 text-white" : "bg-[#e0d8cf] text-[#4a3728]"
                        }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* ─── UPCOMING panel content ─────────────────────────────── */}
          {sessionsPanelTab === "upcoming" && (
            upcoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: COLORS.chip }}
                >
                  <CalendarClock className="w-6 h-6" style={{ color: COLORS.accent }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: COLORS.ink }}>
                    No upcoming sessions booked yet.
                  </p>
                  <p className="text-xs mt-1" style={{ color: COLORS.muted }}>
                    Open your slots so students can book you.
                  </p>
                </div>
                <button
                  onClick={() => setActivePage?.("availability")}
                  className="px-5 py-2.5 rounded-full text-xs font-bold transition-all hover:bg-[#8b7355] shadow-sm"
                  style={{ backgroundColor: COLORS.ink, color: "#fff" }}
                >
                  Set availability
                </button>
              </div>
            ) : displayedSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                <p className="text-sm font-medium" style={{ color: COLORS.muted }}>
                  No sessions scheduled for{" "}
                  {filterTab === "today" ? "today" : filterTab === "tomorrow" ? "tomorrow" : "later dates"}.
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
                      key={s.bookingId ?? s._id ?? idx}
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
                        className={`flex items-center gap-3 min-w-0 ${isClickable ? "cursor-pointer group" : ""}`}
                      >
                        <MenteeAvatar photo={resolvePhoto(s.menteeProfilePhoto)} name={name} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p
                              className={`text-sm font-semibold truncate ${isClickable ? "group-hover:underline" : ""}`}
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
                        {isToday ? (
                          <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
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
                            style={{
                              backgroundColor: COLORS.chip,
                              color: COLORS.accent,
                              border: `1px solid ${COLORS.hairline}`,
                            }}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            {sessionDateInfo.label}
                          </span>
                        )}

                        {sessionId && joinInfo.state !== "hidden" && (
                          <div className="flex flex-col items-end">
                            {joinInfo.state === "active" ? (
                              <button
                                type="button"
                                onClick={handleJoinSession}
                                title="Session is active, click to join"
                                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-xs cursor-pointer"
                              >
                                <Video className="w-3.5 h-3.5" />
                                <span>Start</span>
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
                                  <span>Start</span>
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
            )
          )}

          {/* ─── MISSED / NOT HELD panel content ───────────────────── */}
          {sessionsPanelTab === "missedNotHeld" && (
            missedNotHeld.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: COLORS.chip }}
                >
                  <AlertCircle className="w-6 h-6" style={{ color: COLORS.accent }} />
                </div>
                <p className="text-sm font-medium" style={{ color: COLORS.muted }}>
                  No missed or not-held sessions.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {missedNotHeld.map((s, idx) => {
                  const name = s.menteeName || s.bookedMenteeName || "Student"
                  const menteeId = s.menteeId
                  const isClickable = Boolean(menteeId)
                  const sessionDateInfo = formatSessionDate(s.startTime || s.scheduledAt)
                  // Derive stale label from booking timing
                  const timing = (s as any).timing || getSessionTiming(s, undefined, now)
                  const staleLabel = (s as any).staleLabel || timing.staleLabel || "Not held"

                  const staleBadgeClass =
                    staleLabel === "Expired"
                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                      : staleLabel === "Ended"
                        ? "bg-zinc-100 text-zinc-600 border border-zinc-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200" // "Missed" / "Not held"

                  const handleMenteeClick = (e: React.MouseEvent | React.KeyboardEvent) => {
                    if (!menteeId) return
                    e.stopPropagation()
                    if ("key" in e && e.key !== "Enter" && e.key !== " ") return
                    if ("key" in e) e.preventDefault()
                    router.push(`/mentorship/menteeProfile/${menteeId}`)
                  }

                  return (
                    <div
                      key={s.bookingId ?? s._id ?? idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl"
                      style={{
                        backgroundColor: "#fdf8f6",
                        border: `1px solid ${COLORS.hairline}`,
                        opacity: 0.9,
                      }}
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
                        className={`flex items-center gap-3 min-w-0 ${isClickable ? "cursor-pointer group" : ""}`}
                      >
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
                      </div>

                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full self-end sm:self-center shrink-0"
                        style={{
                          backgroundColor: COLORS.chip,
                          color: COLORS.faint,
                          border: `1px solid ${COLORS.hairline}`,
                        }}
                      >
                        {sessionDateInfo.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          )}
        </div>


        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Setup checklist: naye mentor (0 sessions) ke liye */}
          {showSetup && (
            <div className="bg-white p-6 rounded-2xl" style={{ border: `1px solid ${COLORS.hairline}` }}>
              <h3 className="text-sm font-bold mb-1" style={{ color: COLORS.ink }}>
                Get started
              </h3>
              <p className="text-xs mb-4" style={{ color: COLORS.muted }}>
                Ye steps complete karo taaki students tumhe book kar sakein
              </p>
              <div className="flex flex-col gap-2.5">
                {setupSteps.map((step) => (
                  <button
                    key={step.page}
                    onClick={() => setActivePage?.(step.page, (step as any).subtab)}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl text-left transition-all hover:border-[#c9baa9] hover:shadow-sm"
                    style={{ backgroundColor: COLORS.softWash, border: `1px solid ${COLORS.hairline}` }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center bg-white border border-[#e0d8cf]">
                        {step.done ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
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
                    <ChevronRight className="w-4 h-4 shrink-0" style={{ color: COLORS.accent }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="bg-white p-6 rounded-2xl" style={{ border: `1px solid ${COLORS.hairline}` }}>
            <h3 className="text-sm font-bold mb-4" style={{ color: COLORS.ink }}>
              Quick actions
            </h3>
            <div className="flex flex-col gap-2.5">
              {quickActions.map((action) => (
                <button
                  key={action.page}
                  onClick={() => setActivePage?.(action.page)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:border-[#c9baa9]"
                  style={{ backgroundColor: COLORS.wash, color: COLORS.accent, border: `1px solid ${COLORS.hairline}` }}
                >
                  <action.icon className="w-4 h-4" />
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}