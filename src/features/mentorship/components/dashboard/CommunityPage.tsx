// mentorDashboard/components/CommunityPage.tsx
import React, { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Star, Users, Calendar, MessageCircle, TrendingUp, Loader2, Pin, Lock } from "lucide-react"
import CommunityService from "@/lib/api/community.service"
import { useAuth } from "@/features/auth/hooks/useAuth"
import {
  Forum,
  LeaderboardMentor,
  CommunityEvent,
  EventAttendee,
  ForumCategory,
  EventType,
  CommunityStats,
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

function toLocalDatetimeInput(isoStr: string): string {
  try {
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return ""
    const pad = (n: number) => String(n).padStart(2, "0")
    const yyyy = d.getFullYear()
    const mm = pad(d.getMonth() + 1)
    const dd = pad(d.getDate())
    const hh = pad(d.getHours())
    const min = pad(d.getMinutes())
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`
  } catch {
    return ""
  }
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
  const currentUserId = user?.userId || (user as any)?.id || (user as any)?._id
  const isAdmin = user?.role === "admin"

  // Forums
  const [forums, setForums] = useState<Forum[]>([])
  const [forumsLoading, setForumsLoading] = useState(true)
  const [forumsError, setForumsError] = useState<string | null>(null)

  // Top mentors
  const [topMentors, setTopMentors] = useState<LeaderboardMentor[]>([])
  const [mentorsLoading, setMentorsLoading] = useState(true)
  const [mentorsError, setMentorsError] = useState<string | null>(null)

  // Community stats
  const [communityStats, setCommunityStats] = useState<CommunityStats | null>(null)

  // Events
  const [events, setEvents] = useState<CommunityEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [eventsError, setEventsError] = useState<string | null>(null)
  // optimistic local RSVP tracking — listEvents doesn't return isGoing,
  // only GET /events/:id does, so we track user actions locally per session
  const [rsvpPending, setRsvpPending] = useState<Set<string>>(new Set())
  const [rsvpGoing, setRsvpGoing] = useState<Set<string>>(new Set())

  // Event attendees state
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null)
  const [attendeesCache, setAttendeesCache] = useState<
    Record<string, { loading: boolean; error: string | null; items: EventAttendee[] }>
  >({})

  // Event edit / cancel state
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDate, setEditDate] = useState("")
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [cancellingEventId, setCancellingEventId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadForums() {
      setForumsLoading(true)
      setForumsError(null)
      try {
        const data = await CommunityService.listForums({ limit: 4 })
        const list = Array.isArray(data) ? data : data.items
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
        const list = Array.isArray(data) ? data : data.items
        const upcomingList = list.filter((e) => !e.isCancelled)
        if (!cancelled) setEvents(upcomingList)

        // Hydrate isGoing state for the current user across devices/sessions.
        // With only 3 events shown, 3 extra GETs is acceptable. This prevents
        // the fresh-session double-RSVP bug where rsvpGoing starts empty even
        // when the user already registered from another device/tab.
        if (user && upcomingList.length > 0) {
          const goingIds = await Promise.all(
            upcomingList.map((e) =>
              CommunityService.getEvent(e._id)
                .then((full) => (full.isGoing ? e._id : null))
                .catch(() => null) // non-critical — fail silently per event
            )
          )
          const goingSet = new Set(goingIds.filter((id): id is string => id !== null))
          if (!cancelled && goingSet.size > 0) {
            setRsvpGoing((prev) => new Set([...prev, ...goingSet]))
          }
        }
      } catch (err) {
        if (!cancelled) setEventsError("Couldn't load events right now.")
      } finally {
        if (!cancelled) setEventsLoading(false)
      }
    }

    async function loadStats() {
      try {
        const stats = await CommunityService.getStats()
        if (!cancelled) setCommunityStats(stats)
      } catch {
        // stats strip is non-critical — fail silently
      }
    }

    loadForums()
    loadTopMentors()
    loadEvents()
    loadStats()

    return () => {
      cancelled = true
    }
  }, [user])

  // ── Quick-creation forms ──
  const [showForumForm, setShowForumForm] = useState(false)
  const [forumTopic, setForumTopic] = useState("")
  const [forumCategory, setForumCategory] = useState<ForumCategory>("general")
  const [forumDescription, setForumDescription] = useState("")
  const [forumSubmitting, setForumSubmitting] = useState(false)
  const [forumSubmitError, setForumSubmitError] = useState<string | null>(null)

  const [showEventForm, setShowEventForm] = useState(false)
  const [eventTitle, setEventTitle] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [eventType, setEventType] = useState<EventType>("meetup")
  const [eventDescription, setEventDescription] = useState("")
  const [eventSubmitting, setEventSubmitting] = useState(false)
  const [eventSubmitError, setEventSubmitError] = useState<string | null>(null)

  const handleCreateForum = useCallback(async () => {
    if (!forumTopic.trim()) return
    setForumSubmitting(true)
    setForumSubmitError(null)
    try {
      const newForum = await CommunityService.createForum({
        topic: forumTopic.trim(),
        category: forumCategory,
        description: forumDescription.trim() || undefined,
      })
      setForums((prev) => [newForum, ...prev])
      setForumTopic("")
      setForumCategory("general")
      setForumDescription("")
      setShowForumForm(false)
    } catch (err) {
      setForumSubmitError("Couldn't create thread — check console for details.")
      console.error("Create forum failed", err)
    } finally {
      setForumSubmitting(false)
    }
  }, [forumTopic, forumCategory, forumDescription])

  const handleCreateEvent = useCallback(async () => {
    if (!eventTitle.trim() || !eventDate) return
    setEventSubmitting(true)
    setEventSubmitError(null)
    try {
      const newEvent = await CommunityService.createEvent({
        title: eventTitle.trim(),
        date: new Date(eventDate).toISOString(),
        type: eventType,
        description: eventDescription.trim() || undefined,
      })
      setEvents((prev) => [newEvent, ...prev])
      setEventTitle("")
      setEventDate("")
      setEventType("meetup")
      setEventDescription("")
      setShowEventForm(false)
    } catch (err) {
      setEventSubmitError("Couldn't create event — check console for details.")
      console.error("Create event failed", err)
    } finally {
      setEventSubmitting(false)
    }
  }, [eventTitle, eventDate, eventType, eventDescription])

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
          // Use the backend-returned event with its authoritative participantsCount.
          // This prevents double-incrementing when the user was already registered
          // from another device/session (backend returns alreadyGoing:true and
          // the count is NOT incremented server-side).
          const updatedEvent = await CommunityService.rsvp(eventId)
          setRsvpGoing((prev) => new Set(prev).add(eventId))
          setEvents((prev) =>
            prev.map((e) =>
              e._id === eventId
                ? { ...e, participantsCount: updatedEvent?.participantsCount ?? e.participantsCount }
                : e
            )
          )
        }
        // Invalidate or refresh attendees if currently expanded
        if (expandedEventId === eventId) {
          fetchAttendees(eventId)
        } else {
          setAttendeesCache((prev) => {
            const next = { ...prev }
            delete next[eventId]
            return next
          })
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
    [user, expandedEventId]
  )

  const fetchAttendees = useCallback(async (eventId: string) => {
    setAttendeesCache((prev) => ({
      ...prev,
      [eventId]: { loading: true, error: null, items: prev[eventId]?.items || [] },
    }))
    try {
      const res = await CommunityService.listAttendees(eventId)
      const items = Array.isArray(res) ? res : res.items || []
      setAttendeesCache((prev) => ({
        ...prev,
        [eventId]: { loading: false, error: null, items },
      }))
    } catch (err: any) {
      setAttendeesCache((prev) => ({
        ...prev,
        [eventId]: {
          loading: false,
          error: err.response?.data?.message || "Couldn't load attendees.",
          items: [],
        },
      }))
    }
  }, [])

  const handleToggleAttendees = useCallback(
    async (eventId: string) => {
      if (expandedEventId === eventId) {
        setExpandedEventId(null)
        return
      }
      setExpandedEventId(eventId)
      if (!attendeesCache[eventId] || attendeesCache[eventId].error) {
        await fetchAttendees(eventId)
      }
    },
    [expandedEventId, attendeesCache, fetchAttendees]
  )

  const startEditingEvent = useCallback((event: CommunityEvent) => {
    setEditingEventId(event._id)
    setEditTitle(event.title)
    setEditDate(toLocalDatetimeInput(event.date))
    setEditError(null)
  }, [])

  const cancelEditingEvent = useCallback(() => {
    setEditingEventId(null)
    setEditTitle("")
    setEditDate("")
    setEditError(null)
  }, [])

  const handleSaveEventEdit = useCallback(
    async (eventId: string) => {
      if (!editTitle.trim() || !editDate) return
      setEditSubmitting(true)
      setEditError(null)
      try {
        const updated = await CommunityService.updateEvent(eventId, {
          title: editTitle.trim(),
          date: new Date(editDate).toISOString(),
        })
        setEvents((prev) =>
          prev.map((e) => (e._id === eventId ? { ...e, ...updated } : e))
        )
        setEditingEventId(null)
      } catch (err: any) {
        setEditError(err.response?.data?.message || "Couldn't update event. Please try again.")
      } finally {
        setEditSubmitting(false)
      }
    },
    [editTitle, editDate]
  )

  const handleCancelEvent = useCallback(
    async (eventId: string) => {
      if (!window.confirm("Are you sure you want to cancel this event? It will be removed from the community list.")) {
        return
      }
      setCancellingEventId(eventId)
      try {
        await CommunityService.cancelEvent(eventId)
        setEvents((prev) => prev.filter((e) => e._id !== eventId))
        if (expandedEventId === eventId) {
          setExpandedEventId(null)
        }
      } catch (err: any) {
        alert(err.response?.data?.message || "Failed to cancel event. Please try again.")
      } finally {
        setCancellingEventId(null)
      }
    },
    [expandedEventId]
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
        {/* Community stats strip */}
        {communityStats && (
          <div className="ml-auto flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ backgroundColor: COLORS.chip, color: COLORS.ink, border: `1px solid ${COLORS.hairline}` }}
            >
              <Users className="w-3.5 h-3.5" style={{ color: COLORS.accent }} />
              <span>{communityStats.totalMentors} mentors</span>
            </div>
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ backgroundColor: COLORS.chip, color: COLORS.ink, border: `1px solid ${COLORS.hairline}` }}
            >
              <TrendingUp className="w-3.5 h-3.5" style={{ color: COLORS.accent }} />
              <span>{communityStats.activeMentors} active</span>
            </div>
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Discussion Forums */}
        <div className="bg-white p-6 rounded-2xl" style={{ border: `1px solid ${COLORS.hairline}` }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold" style={{ color: COLORS.ink }}>
              Discussion Forums
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold" style={{ color: "#a08070" }}>
                {forums.length} active
              </span>
              {user && (
                <button
                  onClick={() => setShowForumForm((v) => !v)}
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: COLORS.ink, color: "#fff" }}
                >
                  + New Thread
                </button>
              )}
            </div>
          </div>
          {showForumForm && (
            <div className="mb-4 p-4 rounded-xl space-y-3" style={{ border: `1px solid ${COLORS.hairline}`, backgroundColor: COLORS.softWash }}>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={forumTopic}
                  onChange={(e) => setForumTopic(e.target.value)}
                  placeholder="Thread topic (e.g. Tips for First-Time Mentors)"
                  className="flex-1 text-sm px-3 py-2 rounded-lg"
                  style={{ border: `1px solid ${COLORS.hairline}`, backgroundColor: "#fff" }}
                />
                <select
                  value={forumCategory}
                  onChange={(e) => setForumCategory(e.target.value as ForumCategory)}
                  className="text-sm px-3 py-2 rounded-lg"
                  style={{ border: `1px solid ${COLORS.hairline}`, backgroundColor: "#fff", color: COLORS.ink }}
                >
                  <option value="general">General</option>
                  <option value="teaching-tips">Teaching Tips</option>
                  <option value="pricing">Pricing</option>
                  <option value="tech-stack">Tech Stack</option>
                </select>
              </div>
              <textarea
                rows={3}
                value={forumDescription}
                onChange={(e) => setForumDescription(e.target.value)}
                placeholder="Description or opening thoughts (optional)..."
                className="w-full text-sm px-3 py-2 rounded-lg"
                style={{ border: `1px solid ${COLORS.hairline}`, backgroundColor: "#fff" }}
              />
              {forumSubmitError && (
                <p className="text-xs" style={{ color: "#b3543f" }}>{forumSubmitError}</p>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCreateForum}
                  disabled={forumSubmitting || !forumTopic.trim()}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: COLORS.accent, color: "#fff" }}
                >
                  {forumSubmitting ? "Posting..." : "Post Thread"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForumForm(false)
                    setForumTopic("")
                    setForumDescription("")
                    setForumSubmitError(null)
                  }}
                  className="text-xs font-medium px-2.5 py-1.5 rounded-full transition-colors"
                  style={{ backgroundColor: COLORS.chip, color: COLORS.ink }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          <SectionState
            loading={forumsLoading}
            error={forumsError}
            empty={!forumsLoading && !forumsError && forums.length === 0}
            emptyLabel="No discussions yet — start one!"
          >
            <div className="space-y-3">
              {forums.map((forum) => {
                const authorName =
                  typeof forum.author === "object" && forum.author !== null && forum.author.name
                    ? forum.author.name
                    : "Community Member"

                return (
                  <Link
                    key={forum._id}
                    href={`/mentorship/community/forum/${forum._id}`}
                    className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-colors hover:border-[#c9baa9] block"
                    style={{ border: `1px solid ${COLORS.hairline}`, backgroundColor: COLORS.softWash }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: COLORS.chip }}
                    >
                      <MessageCircle className="w-4 h-4" style={{ color: COLORS.accent }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate" style={{ color: COLORS.ink }}>
                          {forum.topic}
                        </p>
                        {forum.isPinned && (
                          <span title="Pinned">
                            <Pin className="w-3.5 h-3.5 shrink-0" style={{ color: COLORS.accent }} />
                          </span>
                        )}
                        {forum.isLocked && (
                          <span title="Locked">
                            <Lock className="w-3.5 h-3.5 shrink-0" style={{ color: COLORS.muted }} />
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-1" style={{ color: COLORS.muted }}>
                        {authorName} · {forum.replyCount} replies · {timeAgo(forum.lastActivityAt)}
                      </p>
                    </div>
                  </Link>
                )
              })}
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
                <Link
                  key={mentor.mentorId}
                  href={`/mentorship/mentorProfile/${mentor.userId}`}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-xl transition-colors hover:border-[#c9baa9] block"
                  style={{ border: `1px solid ${COLORS.hairline}`, backgroundColor: COLORS.softWash }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {mentor.profilePic ? (
                      <img
                        src={mentor.profilePic}
                        alt={mentor.name || mentor.domains?.[0] || "Mentor"}
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ backgroundColor: COLORS.ink }}
                      >
                        {(mentor.name || mentor.domains?.[0] || "?")[0]}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: COLORS.ink }}>
                        {/* backend doesn't populate `name` yet — falls back to domain until it does */}
                        {mentor.name || mentor.domains?.[0] || "Mentor"}
                      </p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: COLORS.muted }}>
                        {mentor.domains?.[0] ?? "General"} · {mentor.sessionsCompleted} sessions
                      </p>
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS.chip }}
                  >
                    <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                    <span className="text-sm font-bold" style={{ color: COLORS.ink }}>
                      {mentor.rating.toFixed(1)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </SectionState>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white p-6 rounded-2xl" style={{ border: `1px solid ${COLORS.hairline}` }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold" style={{ color: COLORS.ink }}>
            Upcoming Community Events
          </h3>
          {user && (
            <button
              onClick={() => setShowEventForm((v) => !v)}
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: COLORS.ink, color: "#fff" }}
            >
              + New Event
            </button>
          )}
        </div>
        {showEventForm && (
          <div className="mb-4 p-4 rounded-xl space-y-3" style={{ border: `1px solid ${COLORS.hairline}`, backgroundColor: COLORS.softWash }}>
            <div className="flex flex-col md:flex-row gap-2">
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Event title (e.g. Monthly Mentors Meetup)"
                className="flex-1 text-sm px-3 py-2 rounded-lg"
                style={{ border: `1px solid ${COLORS.hairline}`, backgroundColor: "#fff" }}
              />
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as EventType)}
                className="text-sm px-3 py-2 rounded-lg"
                style={{ border: `1px solid ${COLORS.hairline}`, backgroundColor: "#fff", color: COLORS.ink }}
              >
                <option value="meetup">Meetup</option>
                <option value="webinar">Webinar</option>
                <option value="workshop">Workshop</option>
                <option value="networking">Networking</option>
              </select>
              <input
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="text-sm px-3 py-2 rounded-lg"
                style={{ border: `1px solid ${COLORS.hairline}`, backgroundColor: "#fff" }}
              />
            </div>
            <textarea
              rows={2}
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder="Event description or details (optional)..."
              className="w-full text-sm px-3 py-2 rounded-lg"
              style={{ border: `1px solid ${COLORS.hairline}`, backgroundColor: "#fff" }}
            />
            {eventSubmitError && (
              <p className="text-xs" style={{ color: "#b3543f" }}>{eventSubmitError}</p>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCreateEvent}
                disabled={eventSubmitting || !eventTitle.trim() || !eventDate}
                className="text-xs font-semibold px-3 py-1.5 rounded-full disabled:opacity-50 transition-colors"
                style={{ backgroundColor: COLORS.accent, color: "#fff" }}
              >
                {eventSubmitting ? "Creating..." : "Create Event"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEventForm(false)
                  setEventTitle("")
                  setEventDate("")
                  setEventDescription("")
                  setEventSubmitError(null)
                }}
                className="text-xs font-medium px-2.5 py-1.5 rounded-full transition-colors"
                style={{ backgroundColor: COLORS.chip, color: COLORS.ink }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
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
              const isCreator = Boolean(
                currentUserId &&
                  event.createdBy?.userId &&
                  currentUserId === event.createdBy.userId
              )
              const canManageEvent = Boolean(isCreator || isAdmin)
              const isEditing = editingEventId === event._id

              return (
                <div
                  key={event._id}
                  className="p-5 rounded-xl transition-colors hover:border-[#c9baa9]"
                  style={{ border: `1px solid ${COLORS.hairline}`, backgroundColor: COLORS.softWash }}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: COLORS.chip }}
                    >
                      <Calendar className="w-4.5 h-4.5" style={{ color: COLORS.accent }} />
                    </div>

                    {canManageEvent && !isEditing && (
                      <div className="flex items-center gap-1.5 text-[11px] pt-1">
                        <button
                          type="button"
                          onClick={() => startEditingEvent(event)}
                          className="font-medium underline hover:opacity-80 transition-opacity"
                          style={{ color: COLORS.accent }}
                        >
                          Edit
                        </button>
                        <span style={{ color: COLORS.hairline }}>•</span>
                        <button
                          type="button"
                          onClick={() => handleCancelEvent(event._id)}
                          disabled={cancellingEventId === event._id}
                          className="font-medium underline hover:opacity-80 transition-opacity disabled:opacity-50"
                          style={{ color: "#dc2626" }}
                        >
                          {cancellingEventId === event._id ? "Cancelling..." : "Cancel Event"}
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2 mb-3 pt-1">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Event title"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg"
                        style={{ border: `1px solid ${COLORS.hairline}`, backgroundColor: "#fff" }}
                      />
                      <input
                        type="datetime-local"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg"
                        style={{ border: `1px solid ${COLORS.hairline}`, backgroundColor: "#fff" }}
                      />
                      {editError && (
                        <p className="text-[11px]" style={{ color: "#b3543f" }}>
                          {editError}
                        </p>
                      )}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleSaveEventEdit(event._id)}
                          disabled={editSubmitting || !editTitle.trim() || !editDate}
                          className="text-xs font-semibold px-3 py-1 rounded-full transition-colors disabled:opacity-50"
                          style={{ backgroundColor: COLORS.accent, color: "#fff" }}
                        >
                          {editSubmitting ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditingEvent}
                          disabled={editSubmitting}
                          className="text-xs font-medium px-2.5 py-1 rounded-full transition-colors"
                          style={{ backgroundColor: COLORS.chip, color: COLORS.ink }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4 className="text-sm font-bold mb-1.5" style={{ color: COLORS.ink }}>
                        {event.title}
                      </h4>
                      <p className="text-xs mb-1" style={{ color: COLORS.muted }}>
                        by {event.createdBy?.name || "Community Member"}
                      </p>
                      <p className="text-xs mb-3" style={{ color: COLORS.muted }}>
                        {formatEventDate(event.date)}
                      </p>
                    </>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" style={{ color: COLORS.accent }} />
                        <span className="text-xs font-semibold" style={{ color: COLORS.accent }}>
                          {event.participantsCount} attending
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleAttendees(event._id)}
                        className="text-[11px] font-medium underline transition-opacity hover:opacity-80"
                        style={{ color: COLORS.accent }}
                      >
                        {expandedEventId === event._id ? "Hide" : "View attendees"}
                      </button>
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

                  {/* Expanded Attendees List */}
                  {expandedEventId === event._id && (
                    <div
                      className="mt-3 pt-3 border-t text-xs"
                      style={{ borderColor: COLORS.hairline }}
                    >
                      {attendeesCache[event._id]?.loading ? (
                        <div className="flex items-center justify-center py-3">
                          <Loader2 className="w-4 h-4 animate-spin" style={{ color: COLORS.accent }} />
                        </div>
                      ) : attendeesCache[event._id]?.error ? (
                        <p className="text-[11px] py-1" style={{ color: "#b3543f" }}>
                          {attendeesCache[event._id]?.error}
                        </p>
                      ) : (attendeesCache[event._id]?.items || []).length === 0 ? (
                        <p className="text-[11px] py-1 text-center" style={{ color: COLORS.muted }}>
                          No attendees registered yet.
                        </p>
                      ) : (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          <p className="text-[11px] font-semibold mb-1" style={{ color: COLORS.muted }}>
                            Attendees:
                          </p>
                          {(attendeesCache[event._id]?.items || []).map((attendee) => {
                            const attendeeName =
                              attendee.user && typeof attendee.user === "object" && attendee.user.name
                                ? attendee.user.name.trim()
                                : "Unknown attendee";
                            return (
                              <div
                                key={attendee._id}
                                className="flex items-center gap-2 p-1.5 rounded-lg"
                                style={{ backgroundColor: "#fff" }}
                              >
                                {attendee.user?.profilePic ? (
                                  <img
                                    src={attendee.user.profilePic}
                                    alt={attendeeName}
                                    className="w-5 h-5 rounded-full object-cover shrink-0"
                                  />
                                ) : (
                                  <div
                                    className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0"
                                    style={{ backgroundColor: COLORS.chip, color: COLORS.ink }}
                                  >
                                    {attendeeName[0]?.toUpperCase() || "U"}
                                  </div>
                                )}
                                <span className="truncate text-xs font-medium" style={{ color: COLORS.ink }}>
                                  {attendeeName}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </SectionState>
      </div>
    </div>
  )
}