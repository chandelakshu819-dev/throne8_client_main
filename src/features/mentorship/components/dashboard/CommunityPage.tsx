// mentorDashboard/components/CommunityPage.tsx
import React, { useEffect, useState, useCallback } from "react"
import { Star, Users, Calendar, MessageCircle, TrendingUp, Loader2 } from "lucide-react"
import CommunityService from "@/lib/api/community.service"
import { useAuth } from "@/features/auth/hooks/useAuth"
import {
  Forum,
  LeaderboardMentor,
  CommunityEvent,
} from "@/types/community.types"

const COLORS = {
  ink: "#4a3728",
  accent: "#7a5c3e",
  hairline: "#e0d8cf",
  chip: "#f3ece4",
  softWash: "#fbf7f3",
  muted: "#8a7a6a",
}

// ─────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? "s" : ""} ago`
}

function formatEventDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

// ─────────────────────────────────────────────
// Section wrapper (shared loading / error / empty handling)
// ─────────────────────────────────────────────

function SectionState({
  loading,
  error,
  empty,
  emptyLabel,
  children,
}: {
  loading: boolean
  error: string | null
  empty: boolean
  emptyLabel: string
  children: React.ReactNode
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: COLORS.accent }} />
      </div>
    )
  }
  if (error) {
    return (
      <p className="text-sm py-6 text-center" style={{ color: "#b3543f" }}>
        {error}
      </p>
    )
  }
  if (empty) {
    return (
      <p className="text-sm py-6 text-center" style={{ color: COLORS.muted }}>
        {emptyLabel}
      </p>
    )
  }
  return <>{children}</>
}

export default function CommunityPage() {
  const { user } = useAuth()

  // Forums
  const [forums, setForums] = useState<Forum[]>([])
  const [forumsLoading, setForumsLoading] = useState(true)
  const [forumsError, setForumsError] = useState<string | null>(null)

  // Top mentors
  const [topMentors, setTopMentors] = useState<LeaderboardMentor[]>([])
  const [mentorsLoading, setMentorsLoading] = useState(true)
  const [mentorsError, setMentorsError] = useState<string | null>(null)

  // Events
  const [events, setEvents] = useState<CommunityEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [eventsError, setEventsError] = useState<string | null>(null)
  // optimistic local RSVP tracking — listEvents doesn't return isGoing,
  // only GET /events/:id does, so we track user actions locally per session
  const [rsvpPending, setRsvpPending] = useState<Set<string>>(new Set())
  const [rsvpGoing, setRsvpGoing] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false

    async function loadForums() {
      setForumsLoading(true)
      setForumsError(null)
      try {
        const data = await CommunityService.listForums({ limit: 4 })
        const list = Array.isArray(data) ? data : data.data
        if (!cancelled) setForums(list)
      } catch (err) {
        // forums require auth — a 401 here likely means the session expired
        if (!cancelled) setForumsError("Couldn't load discussions right now.")
      } finally {
        if (!cancelled) setForumsLoading(false)
      }
    }

    async function loadTopMentors() {
      setMentorsLoading(true)
      setMentorsError(null)
      try {
        const data = await CommunityService.getTopMentors({ limit: 4 })
        if (!cancelled) setTopMentors(data)
      } catch (err) {
        if (!cancelled) setMentorsError("Couldn't load top mentors right now.")
      } finally {
        if (!cancelled) setMentorsLoading(false)
      }
    }

    async function loadEvents() {
      setEventsLoading(true)
      setEventsError(null)
      try {
        const data = await CommunityService.listEvents({ limit: 3 })
        const list = Array.isArray(data) ? data : data.data
        if (!cancelled) setEvents(list.filter((e) => !e.isCancelled))
      } catch (err) {
        if (!cancelled) setEventsError("Couldn't load events right now.")
      } finally {
        if (!cancelled) setEventsLoading(false)
      }
    }

    loadForums()
    loadTopMentors()
    loadEvents()

    return () => {
      cancelled = true
    }
  }, [])

  const handleRsvp = useCallback(
    async (eventId: string, currentlyGoing: boolean) => {
      if (!user) return // not logged in — button should already be hidden/disabled
      setRsvpPending((prev) => new Set(prev).add(eventId))
      try {
        if (currentlyGoing) {
          await CommunityService.cancelRsvp(eventId)
          setRsvpGoing((prev) => {
            const next = new Set(prev)
            next.delete(eventId)
            return next
          })
          setEvents((prev) =>
            prev.map((e) =>
              e._id === eventId
                ? { ...e, participantsCount: Math.max(0, e.participantsCount - 1) }
                : e
            )
          )
        } else {
          await CommunityService.rsvp(eventId)
          setRsvpGoing((prev) => new Set(prev).add(eventId))
          setEvents((prev) =>
            prev.map((e) =>
              e._id === eventId
                ? { ...e, participantsCount: e.participantsCount + 1 }
                : e
            )
          )
        }
      } catch (err) {
        // silent fail is bad UX long-term — swap for a toast once one exists in this codebase
        console.error("RSVP action failed", err)
      } finally {
        setRsvpPending((prev) => {
          const next = new Set(prev)
          next.delete(eventId)
          return next
        })
      }
    },
    [user]
  )

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.ink }}>
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: COLORS.ink }}>
            Community
          </h2>
          <p style={{ color: COLORS.muted }} className="text-sm">
            Connect with other mentors
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Discussion Forums */}
        <div className="bg-white p-6 rounded-2xl" style={{ border: `1px solid ${COLORS.hairline}` }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold" style={{ color: COLORS.ink }}>
              Discussion Forums
            </h3>
            <span className="text-xs font-semibold" style={{ color: "#a08070" }}>
              {forums.length} active
            </span>
          </div>
          <SectionState
            loading={forumsLoading}
            error={forumsError}
            empty={!forumsLoading && !forumsError && forums.length === 0}
            emptyLabel="No discussions yet — start one!"
          >
            <div className="space-y-3">
              {forums.map((forum) => (
                <div
                  key={forum._id}
                  className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-colors hover:border-[#c9baa9]"
                  style={{ border: `1px solid ${COLORS.hairline}`, backgroundColor: COLORS.softWash }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: COLORS.chip }}
                  >
                    <MessageCircle className="w-4 h-4" style={{ color: COLORS.accent }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: COLORS.ink }}>
                      {forum.topic}
                    </p>
                    <p className="text-xs mt-1" style={{ color: COLORS.muted }}>
                      {forum.replyCount} replies · {timeAgo(forum.lastActivityAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </SectionState>
        </div>

        {/* Top Mentors */}
        <div className="bg-white p-6 rounded-2xl" style={{ border: `1px solid ${COLORS.hairline}` }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold" style={{ color: COLORS.ink }}>
              Top Mentors
            </h3>
            <TrendingUp className="w-4 h-4" style={{ color: COLORS.accent }} />
          </div>
          <SectionState
            loading={mentorsLoading}
            error={mentorsError}
            empty={!mentorsLoading && !mentorsError && topMentors.length === 0}
            emptyLabel="No mentors to show yet."
          >
            <div className="space-y-3">
              {topMentors.map((mentor) => (
                <div
                  key={mentor.mentorId}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-xl transition-colors hover:border-[#c9baa9]"
                  style={{ border: `1px solid ${COLORS.hairline}`, backgroundColor: COLORS.softWash }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {mentor.profilePic ? (
                      <img
                        src={mentor.profilePic}
                        alt={mentor.name || mentor.title}
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ backgroundColor: COLORS.ink }}
                      >
                        {(mentor.name || mentor.title || "?")[0]}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: COLORS.ink }}>
                        {mentor.name || mentor.title}
                      </p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: COLORS.muted }}>
                        {mentor.domains?.[0] ?? mentor.title} · {mentor.stats.completedSessions} sessions
                      </p>
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS.chip }}
                  >
                    <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                    <span className="text-sm font-bold" style={{ color: COLORS.ink }}>
                      {mentor.stats.averageRating.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </SectionState>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white p-6 rounded-2xl" style={{ border: `1px solid ${COLORS.hairline}` }}>
        <h3 className="text-base font-bold mb-5" style={{ color: COLORS.ink }}>
          Upcoming Community Events
        </h3>
        <SectionState
          loading={eventsLoading}
          error={eventsError}
          empty={!eventsLoading && !eventsError && events.length === 0}
          emptyLabel="No upcoming events right now."
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {events.map((event) => {
              const going = rsvpGoing.has(event._id)
              const pending = rsvpPending.has(event._id)
              return (
                <div
                  key={event._id}
                  className="p-5 rounded-xl transition-colors hover:border-[#c9baa9]"
                  style={{ border: `1px solid ${COLORS.hairline}`, backgroundColor: COLORS.softWash }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                    style={{ backgroundColor: COLORS.chip }}
                  >
                    <Calendar className="w-4.5 h-4.5" style={{ color: COLORS.accent }} />
                  </div>
                  <h4 className="text-sm font-bold mb-1.5" style={{ color: COLORS.ink }}>
                    {event.title}
                  </h4>
                  <p className="text-xs mb-3" style={{ color: COLORS.muted }}>
                    {formatEventDate(event.date)}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" style={{ color: COLORS.accent }} />
                      <span className="text-xs font-semibold" style={{ color: COLORS.accent }}>
                        {event.participantsCount} attending
                      </span>
                    </div>
                    {user && (
                      <button
                        onClick={() => handleRsvp(event._id, going)}
                        disabled={pending}
                        className="text-xs font-semibold px-2.5 py-1 rounded-full transition-colors disabled:opacity-50"
                        style={
                          going
                            ? { backgroundColor: COLORS.chip, color: COLORS.ink }
                            : { backgroundColor: COLORS.ink, color: "#fff" }
                        }
                      >
                        {pending ? "..." : going ? "Going ✓" : "RSVP"}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </SectionState>
      </div>
    </div>
  )
}