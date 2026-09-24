//src/features/mentorship/components/mentor/ServicesSection.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Clock } from "./Icons";
import {
  X,
  Calendar,
  Users,
  IndianRupee,
  CheckCircle2,
  Video,
  Ban,
  ClipboardList,
  History,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { SERVICES, FILTERS, C, btnPrimary } from "../../types/data";
import type { Service } from "../../types/types";
import SessionService from "@/lib/api/session.service";
import MentorService from "@/lib/api/mentorship.service";
import WaitlistModal from "../modal/WaitlistModal";
import QueryService, { QueryItem } from "@/lib/api/query.service";


interface ServicesSectionProps {
  onServiceClick: (service: Service) => void;
  mentorId: string;
  bookedSessionIds: string[];
  currentUserId: string;
  mentorName?: string;
  // ✅ NEW: when the mentee arrives here via a "Join Session" deep-link
  // from the group-session detail page (?serviceId=<sessionId>), this
  // carries that sessionId so the matching group session's detail modal
  // opens automatically instead of forcing the mentee to re-find and
  // re-click the same card they just came from.
  deepLinkSessionId?: string;
}

// Session type ko display label me map karo
const SESSION_TYPE_LABEL: Record<string, string> = {
  quick_call: "1:1 Call",
  mock_interview: "1:1 Call",
  resume_review: "1:1 Call",
  career_planning: "1:1 Call",
  group_session: "Group",
  deep_dive: "1:1 Call",
  portfolio_review: "1:1 Call",
  ask_query: "Query",
};

// Session type ko filter label me map karo
const SESSION_TYPE_FILTER: Record<string, string> = {
  quick_call: "Quick Call",
  mock_interview: "Mock Interview",
  resume_review: "Resume Review",
  career_planning: "Career Planning",
  group_session: "Group Session",
  deep_dive: "Deep Dive",
  portfolio_review: "Portfolio Review",
};

const GROUP_SESSION_HIGHLIGHTS = [
  "Learn alongside peers with similar goals",
  "More perspectives, more questions answered",
  "Usually more relaxed and discussion-driven",
];

const GROUP_STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  open: "Open",
  full: "Full",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  rescheduled: "Rescheduled",
};

const REQUEST_STATUS_META: Record<string, { label: string; bg: string; fg: string }> = {
  pending: { label: "Request Pending", bg: "#fef3c7", fg: "#b45309" },
  accepted: { label: "You're In", bg: "#dcfce7", fg: "#15803d" },
  rejected: { label: "Request Declined", bg: "#fee2e2", fg: "#dc2626" },
};

const formatGroupDate = (dateString?: string) => {
  if (!dateString) return "Date not available";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "Date not available";
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    }).format(d);
  } catch {
    return "Date not available";
  }
};

function formatCountdown(target: Date): string {
  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) return "Starting soon";
  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `in ${days}d ${hours}h`;
  if (hours > 0) return `in ${hours}h ${minutes}m`;
  return `in ${minutes}m`;
}

const ServicesSection: React.FC<ServicesSectionProps> = ({
  onServiceClick,
  mentorId,
  bookedSessionIds,
  currentUserId,
  mentorName = "",
  deepLinkSessionId,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [sessions, setSessions] = useState<any[]>([]);
  const [groupSessions, setGroupSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // ✅ joinedIds means "I have an active (pending or accepted) request with
  // this session" — an optimistic flag used only until fetchGroupSessions()
  // returns the real participant row with its actual requestStatus.
  const [joinedIds, setJoinedIds] = useState<string[]>([]);

  const [expandedDescIds, setExpandedDescIds] = useState<string[]>([]);
  const toggleDescExpanded = (sessionId: string) => {
    setExpandedDescIds((prev) =>
      prev.includes(sessionId) ? prev.filter((id) => id !== sessionId) : [...prev, sessionId]
    );
  };

  // ✅ detail modal state for a clicked group session card.
  // ✅ FIX: this modal (date/time/duration/seats + an explicit "Join Group"
  // button) is now the ONLY place a join request can be sent from. The
  // card's own button used to fire the request immediately — that's what
  // let a request go out before the user ever saw session details.
  const [detailGroup, setDetailGroup] = useState<any | null>(null);
  const [groupActionBusy, setGroupActionBusy] = useState(false);
  const [groupActionError, setGroupActionError] = useState<string | null>(null);
  const [, forceTick] = useState(0);

  // ✅ NEW: tracks whether we've already auto-opened the modal for the
  // current deepLinkSessionId, so it doesn't keep re-opening every time
  // groupSessions refreshes (e.g. right after the mentee sends a request).
  const [deepLinkHandled, setDeepLinkHandled] = useState(false);

    // ✅ NEW: mentee's own queries (Query model) — used so ask_query status
  // reflects Query.status ("pending"/"answered"), not the stale Booking status.
  const [myQueries, setMyQueries] = useState<QueryItem[]>([]);

  // ── Waitlist ──
  const [waitlistEntries, setWaitlistEntries] = useState<Record<string, any>>({});
  const [waitlistTarget, setWaitlistTarget] = useState<any | null>(null);
  const [leavingId, setLeavingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!mentorId || !currentUserId) return;
    MentorService.getMyWaitlists()
      .then((res) => {
        const map: Record<string, any> = {};
        (res?.data ?? []).forEach((w: any) => {
          if (w.mentorId === mentorId && w.serviceId && (w.status === "active" || w.status === "notified")) {
            map[w.serviceId] = w;
          }
        });
        setWaitlistEntries(map);
      })
      .catch(() => setWaitlistEntries({}));
    }, [mentorId, currentUserId]);
  
    // ✅ NEW: fetch mentee's own queries so ask_query cards show the real
    // Query.status instead of the stale Booking status.
    useEffect(() => {
      if (!mentorId || !currentUserId) return;
      QueryService.getAllQueries({ role: "mentee", limit: 50 })
        .then((res) => {
          const all = (res.data ?? []) as QueryItem[];
          setMyQueries(all.filter((q) => q.mentorId === mentorId));
        })
        .catch(() => setMyQueries([]));
    }, [mentorId, currentUserId]);

  const handleJoinWaitlist = async (session: any, note: string) => {
    const res = await MentorService.joinWaitlist({
      mentorId,
      serviceId: session.sessionId,
      serviceTitle: session.title,
      preferredDates: [session.scheduledAt || new Date().toISOString()],
      preferredTimeSlots: ["any"],
      sessionType: session.sessionType,
      timezone: "Asia/Kolkata",
      notes: note || undefined,
    });
    setWaitlistEntries((prev) => ({ ...prev, [session.sessionId]: res.data }));
    setWaitlistTarget(null);
    showToast("You're on the waitlist. We'll notify you when a slot opens.");
  };

  const handleLeaveWaitlist = async (serviceId: string, entry: any) => {
    setLeavingId(entry.waitlistId);
    try {
      await MentorService.leaveWaitlist(entry.waitlistId);
      setWaitlistEntries((prev) => {
        const next = { ...prev };
        delete next[serviceId];
        return next;
      });
      showToast("You've left the waitlist.");
    } catch (err: any) {
      showToast(err.message || "Failed to leave waitlist.", "error");
    } finally {
      setLeavingId(null);
    }
  };

  const fetchGroupSessions = useCallback(() => {
    if (!mentorId) return Promise.resolve();
    return MentorService.getAllGroupSessions({ mentorId })
      .then((res: any) => {
        let groups: any[] = [];
        if (Array.isArray(res)) groups = res;
        else if (res && Array.isArray(res.data)) groups = res.data;
        else if (res?.data && Array.isArray(res.data.data)) groups = res.data.data;
        setGroupSessions(groups);
        return groups;
      })
      .catch(() => {
        setGroupSessions([]);
        return [];
      });
  }, [mentorId]);

  useEffect(() => {
    if (!mentorId) return;
    setLoading(true);

    Promise.allSettled([
      SessionService.getAllSessionsFromDB({ limit: 50 }),
      fetchGroupSessions(),
    ]).then(([sessionsRes]) => {
      if (sessionsRes.status === "fulfilled") {
        const allSessions = (sessionsRes as any).value?.data ?? [];
        setSessions(allSessions.filter((s: any) => s.mentorId === mentorId));
      } else {
        setSessions([]);
      }
    }).finally(() => setLoading(false));
  }, [mentorId, fetchGroupSessions]);

  useEffect(() => {
    if (!detailGroup) return;
    const fresh = groupSessions.find((g) => g.sessionId === detailGroup.sessionId);
    if (fresh) setDetailGroup(fresh);
  }, [groupSessions]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!detailGroup) return;
    const interval = setInterval(() => forceTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, [detailGroup]);

  // ✅ NEW: auto-open the detail modal for the group session named in
  // ?serviceId= once groupSessions has loaded. Runs once per
  // deepLinkSessionId — if the match isn't in this mentor's session list
  // (wrong id, or the session was removed), it just does nothing instead
  // of erroring.
  useEffect(() => {
    if (!deepLinkSessionId || deepLinkHandled || groupSessions.length === 0) return;
    const match = groupSessions.find((g) => g.sessionId === deepLinkSessionId);
    if (match) {
      setDetailGroup(match);
    }
    setDeepLinkHandled(true);
  }, [deepLinkSessionId, deepLinkHandled, groupSessions]);

  const uniqueTypes = Array.from(new Set(sessions.map((s) => s.sessionType)));
  const dynamicFilters = ["All", ...uniqueTypes.map((t) => SESSION_TYPE_FILTER[t] || t)];
  if (groupSessions.length > 0 && !dynamicFilters.includes("Group Session")) {
    dynamicFilters.push("Group Session");
  }

  const filtered = activeFilter === "All"
    ? sessions
    : activeFilter === "Group Session"
      ? []
      : sessions.filter((s) => (SESSION_TYPE_FILTER[s.sessionType] || s.sessionType) === activeFilter);

      const showGroupSessions = activeFilter === "All" || activeFilter === "Group Session";
  // ✅ FIX: previously this dropped any group session whose status wasn't
  // 'open' (or undefined) from the "All" tab — including sessions the
  // mentee already has a stake in (pending request, accepted seat). That
  // meant an accepted mentee lost visibility of their own session the
  // moment it filled up ('full') or started ('in_progress') unless they
  // manually switched to the "Group Session" filter. Now a session the
  // mentee has any participant row in always stays visible.
  const visibleGroupSessions = activeFilter === "Group Session"
    ? groupSessions
    : groupSessions.filter((g) => {
        if (g.status === 'open' || g.status === undefined) return true;
        const myParticipant = g.participants?.find((p: any) => p.menteeId === currentUserId);
        return !!myParticipant;
      });

    const getServiceFromSession = (session: any): Service => ({
      id: session.sessionId,
      type: SESSION_TYPE_LABEL[session.sessionType] || "1:1 Call",
      title: session.title,
      duration: `${session.duration} Min`,
      originalPrice: null,
      price: session.pricing?.basePrice === 0 ? "Free" : session.pricing?.basePrice,
      popular: false,
    });
  
    // ✅ NEW: availability-based group session ("template") ko Service shape
    // mein convert karta hai taaki onServiceClick() ko wahi 1:1 flow ki tarah
    // "calendar" bookingStep pe bheja ja sake — CalendarStep already generic
    // hai (sirf mentorId + duration use karta hai), isliye koi extra change
    // uss file mein nahi chahiye.
    const getServiceFromGroupTemplate = (group: any): Service => {
      const pricePerPerson = group.pricing?.pricePerPerson ?? group.pricePerPerson ?? 0;
      return {
        id: group.sessionId,
        type: "GroupSession",
        title: group.title,
        duration: `${group.duration} Min`,
        originalPrice: null,
        price: pricePerPerson === 0 ? "Free" : pricePerPerson,
        popular: false,
      };
    };

  const getIcon = (sessionType: string): string => {
    if (sessionType === "group_session") return "👥";
    return "";
  };

  const closeGroupDetail = () => {
    setDetailGroup(null);
    setGroupActionError(null);
  };

  // ✅ FIX: this is now the single place a join request is actually sent
  // from — only reachable after the user has opened the detail modal (seen
  // date/time/duration/seats) and pressed "Join Group" there.
  // ✅ FIX: was calling MentorService.joinGroupSession() — the OLD
  // direct-join method that adds the mentee as a participant immediately,
  // with no mentor approval step. Switched to
  // MentorService.requestToJoinGroupSession(), which creates a pending
  // request that only becomes a real seat once the mentor accepts it.
  const handleJoinFromModal = async () => {
    if (!detailGroup) return;
    setGroupActionBusy(true);
    setGroupActionError(null);
    try {
      await MentorService.requestToJoinGroupSession(detailGroup.sessionId);
      setJoinedIds((prev) => [...prev, detailGroup.sessionId]);
      await fetchGroupSessions();
      showToast("Join request sent. Waiting for mentor approval.");
    } catch (err: any) {
      setGroupActionError(err.message || "Failed to send join request.");
    } finally {
      setGroupActionBusy(false);
    }
  };

  const handleLeaveFromModal = async () => {
    if (!detailGroup) return;
    if (!window.confirm("Kya aap sach me is group session se leave/cancel karna chahte hain?")) return;
    setGroupActionBusy(true);
    setGroupActionError(null);
    try {
      await MentorService.leaveGroupSession(detailGroup.sessionId);
      setJoinedIds((prev) => prev.filter((id) => id !== detailGroup.sessionId));
      showToast("You've left the group session.");
      await fetchGroupSessions();
      closeGroupDetail();
    } catch (err: any) {
      setGroupActionError(err.message || "Failed to leave session.");
    } finally {
      setGroupActionBusy(false);
    }
  };

  const hasAnyResults = filtered.length > 0 || (showGroupSessions && visibleGroupSessions.length > 0);

  return (
    <div style={{ borderRadius: "24px", padding: "32px", marginBottom: "24px", background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 8px 32px rgba(74,55,40,0.08)" }}>
      <h2 style={{ fontSize: "22px", fontWeight: "bold", color: C.dark, marginBottom: "4px" }}>
        Available Services
      </h2>
      <p style={{ color: C.mid, fontSize: "13px", marginBottom: "20px" }}>Discover our mentorship offerings designed for your success</p>

      <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
        {dynamicFilters.map((f) => (
          <button key={f} onClick={() => setActiveFilter(f)} style={{
            padding: "10px 20px", borderRadius: "20px", fontWeight: 500, fontSize: "14px", cursor: "pointer",
            background: activeFilter === f ? C.grad : C.border,
            color: activeFilter === f ? "#fff" : C.dark,
            border: activeFilter === f ? "none" : `1px solid ${C.muted}`,
            boxShadow: activeFilter === f ? "0 8px 20px rgba(74,55,40,0.3)" : "none",
            transform: activeFilter === f ? "scale(1.05)" : "scale(1)",
            transition: "all 0.3s",
          }}>{f}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

        {loading && (
          <>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px", gap: "12px" }}>
              <div style={{ width: "36px", height: "36px", border: `3px solid ${C.border}`, borderTop: `3px solid ${C.dark}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <span style={{ fontSize: "13px", color: C.mid }}>Fetching sessions...</span>
            </div>
          </>
        )}

        {!loading && !hasAnyResults && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: C.mid }}>
            No sessions available for this filter.
          </div>
        )}

               {!loading && filtered.map((session) => {
          const svc = getServiceFromSession(session);
          const myBookings = session.bookings?.filter(
            (b: any) => b.menteeId === currentUserId
          ) ?? [];
          const latestBooking = myBookings[myBookings.length - 1];
          // ✅ NEW — ask_query ke liye asli status Query model se lo, Booking se nahi
          const latestQuery = session.sessionType === "ask_query"
          ? [...myQueries]
              .filter((q) => (q as any).sessionId === session.sessionId) // TODO: confirm correct field on QueryItem
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
          : undefined;
          const wl = waitlistEntries[session.sessionId];
          return (
            <div key={session.sessionId}
            style={{
              borderRadius: "16px", padding: "20px", background: C.bg,
              border: `1px solid ${C.border}`, position: "relative",
              boxShadow: "0 2px 8px rgba(74,55,40,0.06)",
            }}>
            {session.thumbnailImage && (
              <div style={{ width: "100%", height: "120px", borderRadius: "12px", overflow: "hidden", marginBottom: "12px" }}>
                <img
                  src={session.thumbnailImage}
                  alt={session.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span>{getIcon(session.sessionType)}</span>
              <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "12px", background: C.border, color: C.dark }}>
                {SESSION_TYPE_FILTER[session.sessionType] || session.sessionType}
              </span>
            </div>
              <h3 style={{ fontWeight: "bold", color: C.dark, fontSize: "14px", marginBottom: "8px", lineHeight: "1.4" }}>{session.title}</h3>
              {session.description && (() => {
                const isExpanded = expandedDescIds.includes(session.sessionId);
                const isLong = session.description.length > 100;
                return (
                  <p style={{ fontSize: "12px", color: C.mid, marginBottom: "8px", lineHeight: "1.4", overflowWrap: "break-word", wordBreak: "break-word" }}>
                    {isExpanded || !isLong ? session.description : `${session.description.slice(0, 100)}...`}
                    {isLong && (
                      <span
                        onClick={(e) => { e.stopPropagation(); toggleDescExpanded(session.sessionId); }}
                        style={{ color: C.dark, fontWeight: 700, cursor: "pointer", marginLeft: "4px" }}
                      >
                        {isExpanded ? "Read less" : "Read more"}
                      </span>
                    )}
                  </p>
                );
              })()}
              <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: C.mid, marginBottom: "14px" }}>
                <Clock /> {session.duration} Min
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: "bold", color: session.pricing?.basePrice === 0 ? "#10b981" : C.dark, fontSize: "15px" }}>
                  {session.pricing?.basePrice === 0 ? "Free" : `₹${session.pricing?.basePrice}`}
                </span>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                {session.sessionType === "ask_query" ? (
                    latestQuery && latestQuery.status === "pending" && (
                      <div style={{ fontSize: "10px", fontWeight: 700, color: "#10b981", textAlign: "right" }}>
                        ✅ Your query is pending a reply
                      </div>
                    )
                  ) : (
                    latestBooking && (latestBooking.status === "confirmed" || latestBooking.status === "pending") && (
                      <div style={{ fontSize: "10px", fontWeight: 700, color: "#10b981", textAlign: "right" }}>
                        {latestBooking.status === "confirmed" ? "✅ You have a confirmed session" : "✅ You have a session pending confirmation"}
                      </div>
                    )
                  )}
                  {session.sessionType === "ask_query" ? (
                    <button onClick={() => onServiceClick(svc)} style={{ ...btnPrimary, padding: "8px 18px", borderRadius: "10px", fontSize: "13px" }}>
                      {latestQuery ? "Ask Another Query" : "Ask a Query"}
                    </button>
                  ) : wl ? (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: wl.status === "notified" ? "#10b981" : C.dark }}>
                        {wl.status === "notified"
                          ? "🎉 Slot available — book now"
                          : `⏳ On waitlist · #${wl.queuePosition ?? "-"}`}
                      </div>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "8px" }}>
                        {wl.status === "notified" && (
                          <button
                            onClick={() => onServiceClick(svc)}
                            style={{ ...btnPrimary, padding: "6px 14px", borderRadius: "10px", fontSize: "12px" }}
                          >
                            Book now
                          </button>
                        )}
                        <button
                          onClick={() => handleLeaveWaitlist(session.sessionId, wl)}
                          disabled={leavingId === wl.waitlistId}
                          style={{
                            padding: "6px 14px", borderRadius: "10px", fontSize: "12px", fontWeight: 600,
                            background: "transparent", color: "#dc2626", border: "1.5px solid #fca5a5",
                            cursor: "pointer", opacity: leavingId === wl.waitlistId ? 0.6 : 1,
                          }}
                        >
                          {leavingId === wl.waitlistId ? "Leaving..." : "Leave waitlist"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => onServiceClick(svc)} style={{ ...btnPrimary, padding: "8px 18px", borderRadius: "10px", fontSize: "13px" }}>
                        {latestBooking ? "Book Another Slot" : "Book"}
                      </button>
                      <button
                        onClick={() => setWaitlistTarget(session)}
                        style={{
                          padding: "8px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: 600,
                          background: "transparent", color: C.dark, border: `1.5px solid ${C.dark}`,
                          cursor: "pointer",
                        }}
                      >
                        Waitlist
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* ✅ Group session cards — clicking anywhere on the card (including
            the action button) only OPENS the detail modal. No API call
            happens from here. The modal is where the user sees the
            date/time/duration/seat-count and then explicitly confirms —
            only that confirm click sends the join request. */}
        {!loading && showGroupSessions && visibleGroupSessions.map((group) => {
          const seatsLeft = (group.maxParticipants ?? 0) - (group.currentParticipants ?? 0);
          const myParticipant = group.participants?.find((p: any) => p.menteeId === currentUserId);
          const myRequestStatus: string | undefined =
            myParticipant?.requestStatus || (joinedIds.includes(group.sessionId) ? "pending" : undefined);
          const pricePerPerson = group.pricing?.pricePerPerson ?? group.pricePerPerson ?? 0;
          const statusMeta = myRequestStatus ? REQUEST_STATUS_META[myRequestStatus] : undefined;

                  // ✅ NEW: availability-based templates open the slot-picker
          // (CalendarStep) directly instead of the fixed-date detail modal —
          // this is the actual fix for "group session shows a fixed time
          // instead of a calendar".
          const isTemplate = !!group.isTemplate;
          const openGroupSession = () => {
            if (isTemplate) {
              onServiceClick(getServiceFromGroupTemplate(group));
            } else {
              setDetailGroup(group);
            }
          };

          return (
            <div key={group.sessionId}
              onClick={openGroupSession}
              style={{
                borderRadius: "16px", padding: "20px", background: C.bg,
                border: `1px solid ${C.border}`, position: "relative",
                boxShadow: "0 2px 8px rgba(74,55,40,0.06)",
                cursor: "pointer",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(74,55,40,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(74,55,40,0.06)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span>👥</span>
                <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "12px", background: C.border, color: C.dark }}>
                  Group Session
                </span>
                {group.status && group.status !== 'open' && (
                  <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 10px", borderRadius: "12px", background: "#f3e8ff", color: "#7c3aed" }}>
                    {GROUP_STATUS_LABEL[group.status] || group.status}
                  </span>
                )}
              </div>
              <h3 style={{ fontWeight: "bold", color: C.dark, fontSize: "14px", marginBottom: "8px", lineHeight: "1.4" }}>
                {group.title}
              </h3>
              {group.description && (() => {
                const isExpanded = expandedDescIds.includes(group.sessionId);
                const isLong = group.description.length > 100;
                return (
                  <p style={{ fontSize: "12px", color: C.mid, marginBottom: "8px", lineHeight: "1.4", overflowWrap: "break-word", wordBreak: "break-word" }}>
                    {isExpanded || !isLong ? group.description : `${group.description.slice(0, 100)}...`}
                    {isLong && (
                      <span
                        onClick={(e) => { e.stopPropagation(); toggleDescExpanded(group.sessionId); }}
                        style={{ color: C.dark, fontWeight: 700, cursor: "pointer", marginLeft: "4px" }}
                      >
                        {isExpanded ? "Read less" : "Read more"}
                      </span>
                    )}
                  </p>
                );
              })()}
                            {isTemplate ? (
                // ✅ NEW: template card — no fixed date/seat-count to show,
                // since seats belong to a specific slot-instance, not the
                // template itself.
                <div style={{ fontSize: "12px", color: C.mid, marginBottom: "14px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Clock /> {group.duration} Min · Mentor-led, choose a time that works for you
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: C.mid, marginBottom: "4px" }}>
                    <Clock /> {formatGroupDate(group.scheduledAt)} · {group.duration} Min
                  </div>
                  <div style={{ fontSize: "12px", color: C.mid, marginBottom: "14px" }}>
                    {seatsLeft > 0 ? `${seatsLeft} seats available` : "Session full"} · {group.currentParticipants ?? 0}/{group.maxParticipants ?? 0} enrolled
                  </div>
                </>
              )}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: "bold", color: pricePerPerson === 0 ? "#10b981" : C.dark, fontSize: "15px" }}>
                  {pricePerPerson === 0 ? "Free" : `₹${pricePerPerson}/person`}
                </span>
                {isTemplate ? (
                  // ✅ NEW: templates always route to the slot picker —
                  // there's no fixed-seat "Full" state at the template level.
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onServiceClick(getServiceFromGroupTemplate(group));
                    }}
                    style={{ ...btnPrimary, padding: "8px 18px", borderRadius: "10px", fontSize: "13px" }}
                  >
                    Select a Slot
                  </button>
                ) : statusMeta ? (
                  <div style={{ fontSize: "12px", fontWeight: 700, color: statusMeta.fg }}>
                    {myRequestStatus === "pending" && "⏳ "}
                    {myRequestStatus === "accepted" && "✅ "}
                    {myRequestStatus === "rejected" && "❌ "}
                    {statusMeta.label}
                  </div>
                ) : seatsLeft <= 0 ? (
                  <span style={{ fontSize: "12px", fontWeight: 700, color: C.mid }}>Full</span>
                ) : (
                  // ✅ FIX: used to call handleJoinGroupSession() directly,
                  // which fired MentorService.joinGroupSession() (old
                  // direct-join) the instant it was clicked — no details
                  // screen, no confirmation. It now only opens the same
                  // detail modal the card click opens; the request is sent
                  // from inside that modal instead.
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailGroup(group);
                    }}
                    style={{ ...btnPrimary, padding: "8px 18px", borderRadius: "10px", fontSize: "13px" }}
                  >
                    View Details
                  </button>
                )}
              </div>
            </div>
          );
        })}
          </div>

      {/* ================= Group Session Detail Modal ================= */}
      {detailGroup && (() => {
        const myParticipant = detailGroup.participants?.find((p: any) => p.menteeId === currentUserId);
        const myRequestStatus: string | undefined =
          myParticipant?.requestStatus || (joinedIds.includes(detailGroup.sessionId) ? "pending" : undefined);
        const isPending = myRequestStatus === "pending";
        const isAccepted = myRequestStatus === "accepted";
        const isRejected = myRequestStatus === "rejected";
        const hasRequested = isPending || isAccepted || isRejected;
        const seatsLeft = (detailGroup.maxParticipants ?? 0) - (detailGroup.currentParticipants ?? 0);
        const pricePerPerson = detailGroup.pricing?.pricePerPerson ?? detailGroup.pricePerPerson ?? 0;
        const scheduledDate = detailGroup.scheduledAt ? new Date(detailGroup.scheduledAt) : null;
        const status = detailGroup.status || 'open';
        const isCancelled = status === 'cancelled';
        const isCompleted = status === 'completed';
        const isInProgress = status === 'in_progress';

        const statusColor = isCancelled ? "#ef4444" : isCompleted ? "#10b981" : isInProgress ? "#1d4ed8" : "#b45309";
        const statusBg = isCancelled ? "#fef2f2" : isCompleted ? "#ecfdf5" : isInProgress ? "#dbeafe" : "#fef3c7";

        return (
          <div
            onClick={closeGroupDetail}
            style={{
              position: "fixed", inset: 0, background: "rgba(30,20,10,0.45)",
              backdropFilter: "blur(2px)", display: "flex", alignItems: "center",
              justifyContent: "center", zIndex: 1000, padding: "16px",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: C.surface, borderRadius: "20px", maxWidth: "480px", width: "100%",
                maxHeight: "88vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
                border: `1px solid ${C.border}`,
              }}
            >
              <div style={{ padding: "24px 24px 0 24px", position: "relative" }}>
                <button
                  onClick={closeGroupDetail}
                  style={{
                    position: "absolute", top: "20px", right: "20px", width: "30px", height: "30px",
                    borderRadius: "50%", border: "none", background: C.border, color: C.dark,
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                  }}
                  aria-label="Close"
                >
                  <X size={16} />
                </button>

                {detailGroup.thumbnailImage ? (
                  <div style={{ width: "100%", height: "140px", borderRadius: "14px", overflow: "hidden", marginBottom: "16px" }}>
                    <img src={detailGroup.thumbnailImage} alt={detailGroup.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <div style={{
                      width: "40px", height: "40px", borderRadius: "12px", display: "flex",
                      alignItems: "center", justifyContent: "center", background: C.grad, color: "#fff", flexShrink: 0,
                    }}>
                      <Users size={19} />
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
                  <span style={{
                    fontSize: "12px", fontWeight: 600, padding: "4px 12px", borderRadius: "12px",
                    background: C.border, color: C.dark,
                  }}>
                    Group Session
                  </span>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px",
                    borderRadius: "12px", background: statusBg, color: statusColor, fontSize: "12px", fontWeight: 700,
                  }}>
                    {isCancelled ? <Ban size={12} /> : <CheckCircle2 size={12} />}
                    {GROUP_STATUS_LABEL[status] || status}
                  </span>
                </div>

                <h2 style={{ fontSize: "19px", fontWeight: 700, color: C.dark, marginBottom: "6px", lineHeight: "1.35" }}>
                  {detailGroup.title}
                </h2>

                {mentorName && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", color: C.mid, fontSize: "13px" }}>
                    <UserIcon size={14} />
                    <span>hosted by <strong style={{ color: C.dark }}>{mentorName}</strong></span>
                  </div>
                )}

                {detailGroup.description && (
                  <p className="mb-4 text-sm line-clamp-2" style={{ color: '#8a7a6a', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                    {detailGroup.description || "Interactive group session led by an expert mentor."}
                  </p>
                )}
              </div>

              <div style={{ padding: "0 24px" }}>
                {scheduledDate && (
                  <div style={{
                    background: C.bg, borderRadius: "14px", padding: "14px 16px", border: `1px solid ${C.border}`,
                    marginBottom: "14px", display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Calendar size={16} color={C.dark} />
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: C.dark }}>{formatGroupDate(detailGroup.scheduledAt)}</div>
                        <div style={{ fontSize: "11px", color: C.mid }}>{detailGroup.duration} min · {detailGroup.timezone}</div>
                      </div>
                    </div>
                    {!isCancelled && !isCompleted && (
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#b45309" }}>{formatCountdown(scheduledDate)}</span>
                    )}
                  </div>
                )}

                {myParticipant && (
                  <div style={{
                    background: C.bg, borderRadius: "14px", padding: "14px 16px", border: `1px solid ${C.border}`,
                    marginBottom: "14px",
                  }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: C.dark, marginBottom: "6px" }}>Your Registration</div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", padding: "3px 0" }}>
                      <span style={{ color: C.mid }}>Request Status</span>
                      <span style={{
                        color: REQUEST_STATUS_META[myParticipant.requestStatus]?.fg || C.dark,
                        fontWeight: 700, textTransform: "capitalize",
                      }}>
                        {REQUEST_STATUS_META[myParticipant.requestStatus]?.label || myParticipant.requestStatus}
                      </span>
                    </div>
                    {isAccepted && (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", padding: "3px 0" }}>
                          <span style={{ color: C.mid }}>Attendance</span>
                          <span style={{ color: C.dark, fontWeight: 600, textTransform: "capitalize" }}>{myParticipant.attendanceStatus}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", padding: "3px 0" }}>
                          <span style={{ color: C.mid }}>Payment</span>
                          <span style={{ color: C.dark, fontWeight: 600, textTransform: "capitalize" }}>{myParticipant.paymentStatus}</span>
                        </div>
                      </>
                    )}
                    {isPending && (
                      <div style={{ fontSize: "12px", color: C.mid, marginTop: "6px", lineHeight: "1.5" }}>
                        Join request sent. Waiting for mentor approval — you'll be notified once it's reviewed.
                      </div>
                    )}
                    {isRejected && (
                      <div style={{ fontSize: "12px", color: C.mid, marginTop: "6px", lineHeight: "1.5" }}>
                        The mentor declined this request. You can send a new request if seats are still open.
                      </div>
                    )}
                  </div>
                )}

                {isInProgress && isAccepted && (
                  <button
                    onClick={() => {
                      if (detailGroup.meeting?.meetingUrl) window.open(detailGroup.meeting.meetingUrl, "_blank");
                    }}
                    disabled={!detailGroup.meeting?.meetingUrl}
                    style={{
                      width: "100%", ...btnPrimary, padding: "12px", borderRadius: "12px", fontSize: "14px",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "18px",
                      opacity: detailGroup.meeting?.meetingUrl ? 1 : 0.5,
                      cursor: detailGroup.meeting?.meetingUrl ? "pointer" : "not-allowed",
                    }}
                  >
                    <Video size={16} />
                    {detailGroup.meeting?.meetingUrl ? "Join Session" : "Meeting link not shared yet"}
                  </button>
                )}

                {!hasRequested && !isCancelled && !isCompleted && (
                  <div style={{ background: C.bg, borderRadius: "14px", padding: "16px", border: `1px solid ${C.border}`, marginBottom: "18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                      <Sparkles size={15} color={C.dark} />
                      <span style={{ fontSize: "13px", fontWeight: 700, color: C.dark }}>What you'll get</span>
                    </div>
                    <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                      {GROUP_SESSION_HIGHLIGHTS.map((h, i) => (
                        <li key={i} style={{
                          display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13px", color: C.dark,
                          marginBottom: i === GROUP_SESSION_HIGHLIGHTS.length - 1 ? 0 : "8px", lineHeight: "1.5",
                        }}>
                          <CheckCircle2 size={14} color="#10b981" style={{ marginTop: "2px", flexShrink: 0 }} />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                  <div style={{ flex: 1, background: C.bg, borderRadius: "12px", padding: "12px", border: `1px solid ${C.border}`, textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "4px", color: C.mid }}><Clock /></div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: C.dark }}>{detailGroup.duration} min</div>
                    <div style={{ fontSize: "10px", color: C.mid }}>Duration</div>
                  </div>
                  <div style={{ flex: 1, background: C.bg, borderRadius: "12px", padding: "12px", border: `1px solid ${C.border}`, textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "4px", color: C.mid }}><IndianRupee size={15} /></div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: pricePerPerson === 0 ? "#10b981" : C.dark }}>
                      {pricePerPerson === 0 ? "Free" : `₹${pricePerPerson}`}
                    </div>
                    <div style={{ fontSize: "10px", color: C.mid }}>Per person</div>
                  </div>
                  <div style={{ flex: 1, background: C.bg, borderRadius: "12px", padding: "12px", border: `1px solid ${C.border}`, textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "4px", color: C.mid }}><Users size={15} /></div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: C.dark }}>
                      {detailGroup.currentParticipants ?? 0}/{detailGroup.maxParticipants ?? 0}
                    </div>
                    <div style={{ fontSize: "10px", color: C.mid }}>Enrolled</div>
                  </div>
                </div>

                {detailGroup.agenda && (
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                      <ClipboardList size={15} color={C.dark} />
                      <span style={{ fontSize: "13px", fontWeight: 700, color: C.dark }}>Agenda</span>
                    </div>
                    <div style={{ background: C.bg, borderRadius: "12px", padding: "12px 14px", border: `1px solid ${C.border}`, fontSize: "12.5px", color: C.dark, lineHeight: "1.5" }}>
                      {detailGroup.agenda}
                    </div>
                  </div>
                )}

                {myParticipant?.registeredAt && (
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                      <History size={15} color={C.dark} />
                      <span style={{ fontSize: "13px", fontWeight: 700, color: C.dark }}>Timeline</span>
                    </div>
                    <div style={{ background: C.bg, borderRadius: "12px", padding: "12px 14px", border: `1px solid ${C.border}`, fontSize: "12.5px", color: C.dark }}>
                      Registered on {new Date(myParticipant.registeredAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                )}

                {groupActionError && (
                  <div style={{ marginBottom: "16px", padding: "10px 14px", borderRadius: "10px", background: "#fee2e2", color: "#dc2626", fontSize: "13px", fontWeight: 600 }}>
                    {groupActionError}
                  </div>
                )}
              </div>

              {/* Footer branches on the real requestStatus — Accepted →
                  Leave Session; Pending → Cancel Request; Rejected/none with
                  seats left → Join Group (or "Request Again"); no seats →
                  Session Full. This "Join Group" click is the ONLY trigger
                  for handleJoinFromModal, i.e. the ONLY place a request is
                  actually sent — always after the user has seen the details
                  above. */}
              <div style={{ padding: "16px 24px 24px 24px", borderTop: `1px solid ${C.border}`, display: "flex", gap: "10px" }}>
                <button onClick={closeGroupDetail} style={{ flex: 1, padding: "12px", borderRadius: "12px", fontSize: "13.5px", fontWeight: 600, background: C.border, color: C.dark, border: "none", cursor: "pointer" }}>
                  Close
                </button>

                {!isCancelled && !isCompleted && (
                  isAccepted ? (
                    <button
                      onClick={handleLeaveFromModal}
                      disabled={groupActionBusy}
                      style={{
                        flex: 2, padding: "12px", borderRadius: "12px", fontSize: "13.5px", fontWeight: 700,
                        background: "#fef2f2", color: "#dc2626", border: "1.5px solid #fca5a5",
                        cursor: groupActionBusy ? "not-allowed" : "pointer", opacity: groupActionBusy ? 0.6 : 1,
                      }}
                    >
                      {groupActionBusy ? "Leaving..." : "Leave Session"}
                    </button>
                  ) : isPending ? (
                    <button
                      onClick={handleLeaveFromModal}
                      disabled={groupActionBusy}
                      style={{
                        flex: 2, padding: "12px", borderRadius: "12px", fontSize: "13.5px", fontWeight: 700,
                        background: "#fef3c7", color: "#b45309", border: "1.5px solid #fde68a",
                        cursor: groupActionBusy ? "not-allowed" : "pointer", opacity: groupActionBusy ? 0.6 : 1,
                      }}
                    >
                      {groupActionBusy ? "Cancelling..." : "⏳ Cancel Request"}
                    </button>
                  ) : seatsLeft > 0 ? (
                    <button
                      onClick={handleJoinFromModal}
                      disabled={groupActionBusy}
                      style={{ flex: 2, ...btnPrimary, padding: "12px", borderRadius: "12px", fontSize: "13.5px", opacity: groupActionBusy ? 0.6 : 1 }}
                    >
                      {groupActionBusy ? "Sending request..." : isRejected ? "Request Again" : "Join Group"}
                    </button>
                  ) : (
                    <button disabled style={{ flex: 2, padding: "12px", borderRadius: "12px", fontSize: "13.5px", fontWeight: 700, background: C.border, color: C.mid, border: "none", cursor: "not-allowed" }}>
                      Session Full
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        );
      })()}

{waitlistTarget && (
  <WaitlistModal
    service={{
      title: waitlistTarget.title,
      sessionType: waitlistTarget.sessionType,
      duration: waitlistTarget.duration,
      price: waitlistTarget.pricing?.basePrice,
    }}
    mentorName={mentorName}
    onClose={() => setWaitlistTarget(null)}
    onConfirm={(note) => handleJoinWaitlist(waitlistTarget, note)}
  />
)}

{toast && (
  <div
    style={{
      position: "fixed", top: 20, right: 20, zIndex: 9999, padding: "12px 16px", borderRadius: 12,
      fontSize: 13, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      background: toast.type === "success" ? "#dcfce7" : "#fee2e2",
      color: toast.type === "success" ? "#15803d" : "#dc2626",
      border: `1px solid ${toast.type === "success" ? "#86efac" : "#fca5a5"}`,
    }}
  >
    {toast.msg}
  </div>
)}
</div>
);
};

export default ServicesSection;