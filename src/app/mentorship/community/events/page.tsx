// src/app/mentorship/community/events/page.tsx
"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Calendar,
  Users,
  Loader2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  X,
} from "lucide-react";
import CommunityService from "@/lib/api/community.service";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { CommunityEvent, EventAttendee, EventType } from "@/types/community.types";

const COLORS = {
  ink: "#4a3728",
  accent: "#7a5c3e",
  hairline: "#e0d8cf",
  chip: "#f3ece4",
  softWash: "#fbf7f3",
  muted: "#8a7a6a",
};

function formatEventDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toLocalDatetimeInput(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  } catch {
    return "";
  }
}

export default function AllEventsPage() {
  const { user } = useAuth();
  const currentUserId = user?.userId || (user as any)?.id || (user as any)?._id;
  const isAdmin = user?.role === "admin";

  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search state
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 9;

  // RSVP state
  const [rsvpPending, setRsvpPending] = useState<Set<string>>(new Set());
  const [rsvpGoing, setRsvpGoing] = useState<Set<string>>(new Set());

  // Attendees cache state
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [attendeesCache, setAttendeesCache] = useState<
    Record<string, { loading: boolean; error: string | null; items: EventAttendee[] }>
  >({});

  // Edit / cancel state
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [cancellingEventId, setCancellingEventId] = useState<string | null>(null);

  // Create event form state
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventType, setEventType] = useState<EventType>("meetup");
  const [eventDescription, setEventDescription] = useState("");
  const [eventSubmitting, setEventSubmitting] = useState(false);
  const [eventSubmitError, setEventSubmitError] = useState<string | null>(null);

  const fetchEvents = useCallback(
    async (targetPage: number, querySearch = activeSearch) => {
      setLoading(true);
      setError(null);
      try {
        const trimmed = querySearch.trim();
        const data = await CommunityService.listEvents({
          page: targetPage,
          limit,
          ...(trimmed ? { search: trimmed } : {}),
        });
        const itemsList = Array.isArray(data) ? data : data.items || [];
        const upcomingList = itemsList.filter((e) => !e.isCancelled);

        setEvents(upcomingList);
        if (Array.isArray(data)) {
          setTotal(upcomingList.length);
          setPages(1);
          setPage(1);
        } else {
          setTotal(data.total || upcomingList.length);
          setPage(data.page || 1);
          setPages(data.pages || 1);
        }

        // Hydrate RSVP state for current user
        if (user && upcomingList.length > 0) {
          const goingIds = await Promise.all(
            upcomingList.map((e) =>
              CommunityService.getEvent(e._id)
                .then((full) => (full.isGoing ? e._id : null))
                .catch(() => null)
            )
          );
          const resolved = goingIds.filter(Boolean) as string[];
          if (resolved.length > 0) {
            setRsvpGoing(new Set(resolved));
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Couldn't load community events right now.");
      } finally {
        setLoading(false);
      }
    },
    [limit, user, activeSearch]
  );

  useEffect(() => {
    fetchEvents(page, activeSearch);
  }, [page, activeSearch, fetchEvents]);

  // Debounced search handler (250ms delay)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchInput(val);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      setPage(1);
      setActiveSearch(val);
    }, 250);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setActiveSearch("");
    setPage(1);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
  };

  const handleCreateEvent = async () => {
    if (!eventTitle.trim() || !eventDate) return;
    setEventSubmitting(true);
    setEventSubmitError(null);
    try {
      await CommunityService.createEvent({
        title: eventTitle.trim(),
        date: new Date(eventDate).toISOString(),
        type: eventType,
        description: eventDescription.trim() || undefined,
      });
      setEventTitle("");
      setEventDate("");
      setEventType("meetup");
      setEventDescription("");
      setShowEventForm(false);
      if (page === 1) {
        fetchEvents(1, activeSearch);
      } else {
        setPage(1);
      }
    } catch (err: any) {
      setEventSubmitError(err.response?.data?.message || "Couldn't create event.");
    } finally {
      setEventSubmitting(false);
    }
  };

  const handleRsvp = async (eventId: string, currentlyGoing: boolean) => {
    if (!user) return;
    setRsvpPending((prev) => new Set(prev).add(eventId));
    try {
      if (currentlyGoing) {
        await CommunityService.cancelRsvp(eventId);
        setRsvpGoing((prev) => {
          const next = new Set(prev);
          next.delete(eventId);
          return next;
        });
        setEvents((prev) =>
          prev.map((e) =>
            e._id === eventId
              ? { ...e, participantsCount: Math.max(0, e.participantsCount - 1) }
              : e
          )
        );
      } else {
        const updatedEvent = await CommunityService.rsvp(eventId);
        setRsvpGoing((prev) => new Set(prev).add(eventId));
        setEvents((prev) =>
          prev.map((e) =>
            e._id === eventId
              ? { ...e, participantsCount: updatedEvent?.participantsCount ?? e.participantsCount }
              : e
          )
        );
      }

      if (expandedEventId === eventId) {
        fetchAttendees(eventId);
      } else {
        setAttendeesCache((prev) => {
          const next = { ...prev };
          delete next[eventId];
          return next;
        });
      }
    } catch (err) {
      console.error("RSVP action failed", err);
    } finally {
      setRsvpPending((prev) => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
    }
  };

  const fetchAttendees = async (eventId: string) => {
    setAttendeesCache((prev) => ({
      ...prev,
      [eventId]: { loading: true, error: null, items: prev[eventId]?.items || [] },
    }));
    try {
      const res = await CommunityService.listAttendees(eventId);
      const items = Array.isArray(res) ? res : res.items || [];
      setAttendeesCache((prev) => ({
        ...prev,
        [eventId]: { loading: false, error: null, items },
      }));
    } catch (err: any) {
      setAttendeesCache((prev) => ({
        ...prev,
        [eventId]: {
          loading: false,
          error: err.response?.data?.message || "Couldn't load attendees.",
          items: [],
        },
      }));
    }
  };

  const handleToggleAttendees = async (eventId: string) => {
    if (expandedEventId === eventId) {
      setExpandedEventId(null);
      return;
    }
    setExpandedEventId(eventId);
    if (!attendeesCache[eventId] || attendeesCache[eventId].error) {
      await fetchAttendees(eventId);
    }
  };

  const startEditingEvent = (event: CommunityEvent) => {
    setEditingEventId(event._id);
    setEditTitle(event.title);
    setEditDate(toLocalDatetimeInput(event.date));
    setEditError(null);
  };

  const cancelEditingEvent = () => {
    setEditingEventId(null);
    setEditTitle("");
    setEditDate("");
    setEditError(null);
  };

  const handleSaveEventEdit = async (eventId: string) => {
    if (!editTitle.trim() || !editDate) return;
    setEditSubmitting(true);
    setEditError(null);
    try {
      const updated = await CommunityService.updateEvent(eventId, {
        title: editTitle.trim(),
        date: new Date(editDate).toISOString(),
      });
      setEvents((prev) =>
        prev.map((e) => (e._id === eventId ? { ...e, ...updated } : e))
      );
      setEditingEventId(null);
    } catch (err: any) {
      setEditError(err.response?.data?.message || "Couldn't update event. Please try again.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleCancelEvent = async (eventId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to cancel this event? It will be removed from the community list."
      )
    ) {
      return;
    }
    setCancellingEventId(eventId);
    try {
      await CommunityService.cancelEvent(eventId);
      setEvents((prev) => prev.filter((e) => e._id !== eventId));
      if (expandedEventId === eventId) {
        setExpandedEventId(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to cancel event. Please try again.");
    } finally {
      setCancellingEventId(null);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#fdfbf9" }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Navigation / Header */}
        <div className="mb-6">
          <Link
            href="/mentorship"
            className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline mb-3"
            style={{ color: COLORS.accent }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Mentorship Community</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: COLORS.ink }}
              >
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: COLORS.ink }}>
                  Community Events
                </h1>
                <p className="text-xs" style={{ color: COLORS.muted }}>
                  Workshops, webinars, meetups, and networking sessions
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {total > 0 && (
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: COLORS.chip, color: COLORS.ink }}
                >
                  {total} {total === 1 ? "event" : "events"}
                </span>
              )}
              {user && (
                <button
                  type="button"
                  onClick={() => setShowEventForm((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
                  style={{ backgroundColor: COLORS.ink, color: "#fff" }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Event</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* New Event Form Inset */}
        {showEventForm && (
          <div
            className="mb-6 p-5 rounded-2xl space-y-3"
            style={{ border: `1px solid ${COLORS.hairline}`, backgroundColor: COLORS.softWash }}
          >
            <h3 className="text-sm font-bold" style={{ color: COLORS.ink }}>
              Create an Upcoming Event
            </h3>
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
                style={{
                  border: `1px solid ${COLORS.hairline}`,
                  backgroundColor: "#fff",
                  color: COLORS.ink,
                }}
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
              <p className="text-xs" style={{ color: "#b3543f" }}>
                {eventSubmitError}
              </p>
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
                  setShowEventForm(false);
                  setEventTitle("");
                  setEventDate("");
                  setEventDescription("");
                  setEventSubmitError(null);
                }}
                className="text-xs font-medium px-2.5 py-1.5 rounded-full transition-colors"
                style={{ backgroundColor: COLORS.chip, color: COLORS.ink }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Content Section */}
        <div
          className="bg-white p-6 rounded-2xl shadow-sm"
          style={{ border: `1px solid ${COLORS.hairline}` }}
        >
          {/* Search Input */}
          <div className="mb-5 relative">
            <div className="relative flex items-center">
              <Search
                className="w-4 h-4 absolute left-3.5 pointer-events-none"
                style={{ color: COLORS.muted }}
              />
              <input
                type="text"
                value={searchInput}
                onChange={handleSearchChange}
                placeholder="Search events by title or keywords..."
                className="w-full text-xs pl-9 pr-9 py-2.5 rounded-xl focus:outline-none transition-colors"
                style={{
                  border: `1px solid ${COLORS.hairline}`,
                  backgroundColor: COLORS.softWash,
                  color: COLORS.ink,
                }}
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 p-1 rounded-full text-xs hover:bg-gray-200 transition-colors cursor-pointer"
                  style={{ color: COLORS.muted }}
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: COLORS.accent }} />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-sm mb-4" style={{ color: "#b3543f" }}>
                {error}
              </p>
              <button
                type="button"
                onClick={() => fetchEvents(page, activeSearch)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ backgroundColor: COLORS.chip, color: COLORS.ink }}
              >
                Try Again
              </button>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16">
              {activeSearch ? (
                <>
                  <p className="text-sm font-semibold mb-1" style={{ color: COLORS.ink }}>
                    No events found matching &ldquo;{activeSearch}&rdquo;
                  </p>
                  <p className="text-xs mb-4" style={{ color: COLORS.muted }}>
                    Try searching with different keywords or clear your search filter.
                  </p>
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: COLORS.chip, color: COLORS.ink }}
                  >
                    Clear Search
                  </button>
                </>
              ) : (
                <p className="text-sm" style={{ color: COLORS.muted }}>
                  No upcoming events right now.
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => {
                const going = rsvpGoing.has(event._id);
                const pending = rsvpPending.has(event._id);
                const isCreator = Boolean(
                  currentUserId &&
                    event.createdBy?.userId &&
                    currentUserId === event.createdBy.userId
                );
                const canManageEvent = Boolean(isCreator || isAdmin);
                const isEditing = editingEventId === event._id;

                return (
                  <div
                    key={event._id}
                    className="p-5 rounded-xl transition-colors hover:border-[#c9baa9] flex flex-col justify-between"
                    style={{
                      border: `1px solid ${COLORS.hairline}`,
                      backgroundColor: COLORS.softWash,
                    }}
                  >
                    <div>
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
                              {cancellingEventId === event._id ? "Cancelling..." : "Cancel"}
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
                            style={{
                              border: `1px solid ${COLORS.hairline}`,
                              backgroundColor: "#fff",
                            }}
                          />
                          <input
                            type="datetime-local"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg"
                            style={{
                              border: `1px solid ${COLORS.hairline}`,
                              backgroundColor: "#fff",
                            }}
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
                          {event.description && (
                            <p
                              className="text-xs mb-2 line-clamp-2"
                              style={{ color: COLORS.ink, opacity: 0.8 }}
                            >
                              {event.description}
                            </p>
                          )}
                          <p className="text-xs mb-1" style={{ color: COLORS.muted }}>
                            by {event.createdBy?.name || "Community Member"}
                          </p>
                          <p className="text-xs mb-3 font-medium" style={{ color: COLORS.accent }}>
                            {formatEventDate(event.date)}
                          </p>
                        </>
                      )}
                    </div>

                    <div className="pt-2 border-t" style={{ borderColor: `${COLORS.hairline}88` }}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" style={{ color: COLORS.accent }} />
                            <span
                              className="text-xs font-semibold"
                              style={{ color: COLORS.accent }}
                            >
                              {event.participantsCount} attending
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleAttendees(event._id)}
                            className="text-[11px] font-medium underline transition-opacity hover:opacity-80"
                            style={{ color: COLORS.accent }}
                          >
                            {expandedEventId === event._id ? "Hide" : "View"}
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
                              <Loader2
                                className="w-4 h-4 animate-spin"
                                style={{ color: COLORS.accent }}
                              />
                            </div>
                          ) : attendeesCache[event._id]?.error ? (
                            <p className="text-[11px] py-1" style={{ color: "#b3543f" }}>
                              {attendeesCache[event._id]?.error}
                            </p>
                          ) : (attendeesCache[event._id]?.items || []).length === 0 ? (
                            <p
                              className="text-[11px] py-1 text-center"
                              style={{ color: COLORS.muted }}
                            >
                              No attendees registered yet.
                            </p>
                          ) : (
                            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                              <p
                                className="text-[11px] font-semibold mb-1"
                                style={{ color: COLORS.muted }}
                              >
                                Attendees:
                              </p>
                              {(attendeesCache[event._id]?.items || []).map((attendee) => {
                                const attendeeName =
                                  attendee.user &&
                                  typeof attendee.user === "object" &&
                                  attendee.user.name
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
                                        style={{
                                          backgroundColor: COLORS.chip,
                                          color: COLORS.ink,
                                        }}
                                      >
                                        {attendeeName[0]?.toUpperCase() || "U"}
                                      </div>
                                    )}
                                    <span
                                      className="truncate text-xs font-medium"
                                      style={{ color: COLORS.ink }}
                                    >
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
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && !error && pages > 1 && (
            <div
              className="flex items-center justify-between pt-6 mt-6 border-t"
              style={{ borderColor: COLORS.hairline }}
            >
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: COLORS.chip, color: COLORS.ink }}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <span className="text-xs font-medium" style={{ color: COLORS.muted }}>
                Page {page} of {pages}
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page >= pages}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: COLORS.chip, color: COLORS.ink }}
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
