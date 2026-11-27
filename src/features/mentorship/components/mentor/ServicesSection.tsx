//src/features/mentorship/components/mentor/ServicesSection.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "@/hooks/useScrollLock";
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
import { C, btnPrimary } from "../../types/data";
import type { Service } from "../../types/types";
import SessionService from "@/lib/api/session.service";
import AuthService from "@/lib/api/auth.service";
import MentorService from "@/lib/api/mentorship.service";
import WaitlistModal from "../modal/WaitlistModal";
import QueryService, { QueryItem } from "@/lib/api/query.service";


interface ServicesSectionProps {
  onServiceClick: (service: Service) => void;
  mentorId: string;
  bookedSessionIds: string[];
  currentUserId: string;
  mentorName?: string;
  // When the mentee arrives via a "Join Session" deep-link (?serviceId=<sessionId>),
  // the matching group session's detail modal opens automatically.
  deepLinkSessionId?: string;
  // Logged-out user ne login-required action dabaya to parent use login par bhejta hai.
  onRequireLogin?: (opts?: { serviceId?: string; autoBook?: boolean }) => void;
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

const getServiceImage = (item: any): string | null => {
  if (!item) return null;
  return item.thumbnailImage || item.thumbnail || item.image || item.imageUrl || item.coverImage || null;
};

// ───────────────────────── Card styles (light, flat, calm) ─────────────────────────
const CARD_CSS = `
.svc-card{background:${C.bg};border:1px solid ${C.border};border-radius:18px;overflow:hidden;display:flex;flex-direction:column;min-width:0;transition:border-color .15s ease,box-shadow .15s ease}
.svc-card:hover{border-color:${C.muted};box-shadow:0 6px 18px rgba(74,55,40,.08)}
.svc-card--click{cursor:pointer}
.svc-btn{font-size:13px;font-weight:600;border-radius:10px;padding:8px 16px;cursor:pointer;line-height:1.2;transition:background-color .15s ease,opacity .15s ease}
.svc-btn:focus-visible,.svc-link:focus-visible,.svc-chip:focus-visible{outline:2px solid ${C.dark};outline-offset:2px}
.svc-btn:disabled{opacity:.6;cursor:not-allowed}
.svc-btn--primary{background:${C.dark};color:#fff;border:1px solid ${C.dark}}
.svc-btn--primary:hover:not(:disabled){opacity:.9}
.svc-btn--ghost{background:transparent;color:${C.dark};border:1px solid ${C.border}}
.svc-btn--ghost:hover:not(:disabled){background:${C.border}}
.svc-btn--danger{background:transparent;color:#dc2626;border:1px solid #fca5a5}
.svc-btn--danger:hover:not(:disabled){background:#fef2f2}
.svc-link{background:none;border:none;padding:0;font-size:12px;font-weight:600;color:${C.dark};cursor:pointer;border-radius:4px}
.svc-link:hover{text-decoration:underline}
.svc-chip{font-size:13px;font-weight:500;padding:7px 16px;border-radius:999px;cursor:pointer;transition:background-color .15s ease,color .15s ease,border-color .15s ease}
.svc-chip[aria-pressed="false"]{background:transparent;color:${C.dark};border:1px solid ${C.border}}
.svc-chip[aria-pressed="false"]:hover{background:${C.border}}
.svc-chip[aria-pressed="true"]{background:${C.dark};color:#fff;border:1px solid ${C.dark}}
@keyframes svc-pulse{0%,100%{opacity:1}50%{opacity:.55}}
.svc-skel{background:${C.border};border-radius:8px;animation:svc-pulse 1.4s ease-in-out infinite}
@keyframes svc-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion: reduce){.svc-card,.svc-btn,.svc-chip{transition:none}.svc-skel{animation:none}}
`;

const clamp = (lines: number): React.CSSProperties => ({
  display: "-webkit-box",
  WebkitLineClamp: lines,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
});

interface CardImageProps {
  imageSrc: string | null;
  alt: string;
  icon: React.ReactNode;
  badge: React.ReactNode;
}

const CardImage: React.FC<CardImageProps> = ({ imageSrc, alt, icon, badge }) => {
  const [failed, setFailed] = useState(false);
  return (
    <div style={{ position: "relative", height: "136px", background: "#efe4d6", flexShrink: 0 }}>
      {!failed && imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #f1e7da 0%, #e4d4bf 100%)",
            color: C.dark,
            opacity: 0.9,
          }}
        >
          <span style={{ opacity: 0.45 }}>{icon}</span>
        </div>
      )}
      <span
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          padding: "4px 10px",
          borderRadius: "999px",
          fontSize: "11px",
          fontWeight: 600,
          color: C.dark,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      >
        {badge}
      </span>
    </div>
  );
};

interface CardShellProps {
  imageSrc: string | null;
  fallbackIcon: React.ReactNode;
  badge: React.ReactNode;
  title: string;
  description?: string;
  expanded: boolean;
  onToggleDesc: () => void;
  meta: React.ReactNode;
  footer: React.ReactNode;
  onClick?: () => void;
}

const CardShell: React.FC<CardShellProps> = ({
  imageSrc,
  fallbackIcon,
  badge,
  title,
  description,
  expanded,
  onToggleDesc,
  meta,
  footer,
  onClick,
}) => {
  const isLong = !!description && description.length > 90;
  return (
    <div
      className={`svc-card${onClick ? " svc-card--click" : ""}`}
      onClick={onClick}
    >
      <CardImage imageSrc={imageSrc} alt={title} icon={fallbackIcon} badge={badge} />
      <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", flex: 1, gap: "8px" }}>
        <h3
          title={title}
          style={{ fontSize: "15px", fontWeight: 700, color: C.dark, lineHeight: 1.35, margin: 0, overflowWrap: "anywhere", ...clamp(2) }}
        >
          {title}
        </h3>

        {description && (
          <div>
            <p
              style={{
                fontSize: "12.5px",
                color: C.mid,
                lineHeight: 1.5,
                margin: 0,
                overflowWrap: "break-word",
                ...(expanded ? {} : clamp(2)),
              }}
            >
              {description}
            </p>
            {isLong && (
              <button
                type="button"
                className="svc-link"
                style={{ marginTop: "4px" }}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleDesc();
                }}
              >
                {expanded ? "Show less" : "Read more"}
              </button>
            )}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: C.mid }}>{meta}</div>

        <div style={{ marginTop: "auto", paddingTop: "12px", borderTop: `1px solid ${C.border}` }}>{footer}</div>
      </div>
    </div>
  );
};

const PriceTag: React.FC<{ value: unknown; suffix?: string }> = ({ value, suffix }) => {
  if (value === 0) {
    return <span style={{ fontSize: "16px", fontWeight: 700, color: "#10b981" }}>Free</span>;
  }
  if (typeof value !== "number") return <span />;
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: "3px" }}>
      <span style={{ fontSize: "17px", fontWeight: 700, color: C.dark }}>₹{value}</span>
      {suffix && <span style={{ fontSize: "11px", color: C.mid }}>{suffix}</span>}
    </span>
  );
};

const StatusPill: React.FC<{ children: React.ReactNode; bg?: string; fg?: string }> = ({
  children,
  bg = "#ecfdf5",
  fg = "#047857",
}) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      padding: "4px 10px",
      borderRadius: "999px",
      fontSize: "11px",
      fontWeight: 600,
      background: bg,
      color: fg,
    }}
  >
    {children}
  </span>
);

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

const formatGroupDateShort = (dateString?: string) => {
  if (!dateString) return "Date not available";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "Date not available";
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric', month: 'short',
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
  onRequireLogin,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [sessions, setSessions] = useState<any[]>([]);
  const [groupSessions, setGroupSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // joinedIds: optimistic flag until fetchGroupSessions() returns the real participant row.
  const [joinedIds, setJoinedIds] = useState<string[]>([]);

  // "Read more/less" toggle state for long descriptions.
  const [expandedDescIds, setExpandedDescIds] = useState<string[]>([]);
  const toggleDescExpanded = (sessionId: string) => {
    setExpandedDescIds((prev) =>
      prev.includes(sessionId) ? prev.filter((id) => id !== sessionId) : [...prev, sessionId]
    );
  };

  // detail modal state for a clicked group session card
  const [detailGroup, setDetailGroup] = useState<any | null>(null);
  const [groupActionBusy, setGroupActionBusy] = useState(false);
  const [groupActionError, setGroupActionError] = useState<string | null>(null);
  const [, forceTick] = useState(0);

  // Auto-open the modal only once per deepLinkSessionId.
  const [deepLinkHandled, setDeepLinkHandled] = useState(false);

  // mentee's own queries - ask_query status reflects Query.status, not the stale Booking status.
  const [myQueries, setMyQueries] = useState<QueryItem[]>([]);

  // Waitlist
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

    // Logged-out visitor ko bhi services dikhni chahiye (login sirf Book par chahiye).
    const fetchSessions = AuthService.isAuthenticated()
      ? SessionService.getMentorSessions(mentorId)
      : SessionService.getPublicMentorSessions(mentorId);

    Promise.allSettled([
      fetchSessions,
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
  // A session the mentee has any participant row in always stays visible, even once full / started.
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

  // availability-based group session ("template") ko Service shape mein convert karta hai.
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

  const closeGroupDetail = () => {
    setDetailGroup(null);
    setGroupActionError(null);
  };

  // The single place a join request is sent from (after the user saw the details modal).
  const handleJoinFromModal = async () => {
    if (!detailGroup) return;
    // Logged-out user: login par bhejo, wapas aane par yahi modal khulega (?serviceId=).
    if (!currentUserId && onRequireLogin) {
      onRequireLogin({ serviceId: detailGroup.sessionId });
      return;
    }
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
    <div
      className="w-full min-w-0 p-4 sm:p-6"
      style={{ borderRadius: "20px", background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(74,55,40,0.06)" }}
    >
      <style>{CARD_CSS}</style>

      <h2 style={{ fontSize: "20px", fontWeight: 700, color: C.dark, margin: 0, letterSpacing: "-0.01em" }}>
        Available services
      </h2>
      <p style={{ color: C.mid, fontSize: "13px", margin: "4px 0 16px" }}>
        Pick a session that fits what you want to work on.
      </p>

      {/* Filter chips */}
      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filter services">
        {dynamicFilters.map((f) => (
          <button
            key={f}
            type="button"
            className="svc-chip"
            aria-pressed={activeFilter === f}
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Cards: as many columns as fit, never narrower than 260px */}
      <div
        style={{
          display: "grid",
          gap: "16px",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        }}
      >
        {loading &&
          [0, 1, 2].map((i) => (
            <div key={i} className="svc-card" aria-hidden="true">
              <div className="svc-skel" style={{ height: "136px", borderRadius: 0 }} />
              <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div className="svc-skel" style={{ height: "16px", width: "75%" }} />
                <div className="svc-skel" style={{ height: "12px", width: "100%" }} />
                <div className="svc-skel" style={{ height: "12px", width: "60%" }} />
                <div className="svc-skel" style={{ height: "34px", width: "100%", marginTop: "10px" }} />
              </div>
            </div>
          ))}

        {!loading && !hasAnyResults && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 16px", color: C.mid, fontSize: "13px" }}>
            No sessions available for this filter yet.
          </div>
        )}

        {!loading && filtered.map((session) => {
          const svc = getServiceFromSession(session);
          const myBookings = session.bookings?.filter(
            (b: any) => b.menteeId === currentUserId
          ) ?? [];
          const latestBooking = myBookings[myBookings.length - 1];
          // ask_query ke liye asli status Query model se lo, Booking se nahi
          const latestQuery = session.sessionType === "ask_query"
            ? [...myQueries]
                .filter((q) => (q as any).sessionId === session.sessionId) // TODO: confirm correct field on QueryItem
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
            : undefined;
          const wl = waitlistEntries[session.sessionId];
          const isQuery = session.sessionType === "ask_query";
          const hasActiveBooking =
            !isQuery && latestBooking && (latestBooking.status === "confirmed" || latestBooking.status === "pending");
          const queryPending = isQuery && latestQuery && latestQuery.status === "pending";

          return (
            <CardShell
              key={session.sessionId}
              imageSrc={getServiceImage(session)}
              fallbackIcon={<Sparkles size={28} />}
              badge={SESSION_TYPE_FILTER[session.sessionType] || session.sessionType}
              title={session.title}
              description={session.description}
              expanded={expandedDescIds.includes(session.sessionId)}
              onToggleDesc={() => toggleDescExpanded(session.sessionId)}
              meta={
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Clock /> {session.duration} min
                </div>
              }
              footer={
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {hasActiveBooking && (
                    <div>
                      <StatusPill>
                        <CheckCircle2 size={12} />
                        {latestBooking.status === "confirmed" ? "Session confirmed" : "Awaiting confirmation"}
                      </StatusPill>
                    </div>
                  )}
                  {queryPending && (
                    <div>
                      <StatusPill bg="#fef3c7" fg="#b45309">Query pending a reply</StatusPill>
                    </div>
                  )}

                  {wl ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: wl.status === "notified" ? "#10b981" : C.dark }}>
                        {wl.status === "notified"
                          ? "A slot opened up. Book now."
                          : `On the waitlist, position #${wl.queuePosition ?? "-"}`}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
                        <PriceTag value={session.pricing?.basePrice} />
                        <div style={{ display: "flex", gap: "8px" }}>
                          {wl.status === "notified" && (
                            <button className="svc-btn svc-btn--primary" onClick={() => onServiceClick(svc)}>
                              Book now
                            </button>
                          )}
                          <button
                            className="svc-btn svc-btn--danger"
                            onClick={() => handleLeaveWaitlist(session.sessionId, wl)}
                            disabled={leavingId === wl.waitlistId}
                          >
                            {leavingId === wl.waitlistId ? "Leaving..." : "Leave waitlist"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
                      <PriceTag value={session.pricing?.basePrice} />
                      <div style={{ display: "flex", gap: "8px" }}>
                        {isQuery ? (
                          <button className="svc-btn svc-btn--primary" onClick={() => onServiceClick(svc)}>
                            {latestQuery ? "Ask another" : "Ask a query"}
                          </button>
                        ) : (
                          <>
                            <button
                              className="svc-btn svc-btn--ghost"
                              onClick={() => {
                                if (!currentUserId && onRequireLogin) {
                                  onRequireLogin();
                                  return;
                                }
                                setWaitlistTarget(session);
                              }}
                            >
                              Waitlist
                            </button>
                            <button className="svc-btn svc-btn--primary" onClick={() => onServiceClick(svc)}>
                              {latestBooking ? "Book again" : "Book"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              }
            />
          );
        })}

        {/* Group session cards: the card only OPENS the detail modal. The modal is where the
            user sees date/time/seats and confirms; only that click sends the join request. */}
        {!loading && showGroupSessions && visibleGroupSessions.map((group) => {
          const maxP = group.maxParticipants ?? 0;
          const curP = group.currentParticipants ?? 0;
          const seatsLeft = maxP - curP;
          const fillPct = maxP > 0 ? Math.min(100, Math.round((curP / maxP) * 100)) : 0;
          const myParticipant = group.participants?.find((p: any) => p.menteeId === currentUserId);
          const myRequestStatus: string | undefined =
            myParticipant?.requestStatus || (joinedIds.includes(group.sessionId) ? "pending" : undefined);
          const pricePerPerson = group.pricing?.pricePerPerson ?? group.pricePerPerson ?? 0;
          const statusMeta = myRequestStatus ? REQUEST_STATUS_META[myRequestStatus] : undefined;
          const isTemplate = !!group.isTemplate;
          const open = () => setDetailGroup(group);

          return (
            <CardShell
              key={group.sessionId}
              onClick={open}
              imageSrc={getServiceImage(group)}
              fallbackIcon={<Users size={28} />}
              badge={
                <>
                  <Users size={12} />
                  Group session
                </>
              }
              title={group.title}
              description={group.description}
              expanded={expandedDescIds.includes(group.sessionId)}
              onToggleDesc={() => toggleDescExpanded(group.sessionId)}
              meta={
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Calendar size={13} />
                    {formatGroupDateShort(group.scheduledAt)} · {group.duration} min
                  </div>
                  {!isTemplate && maxP > 0 && (
                    <div style={{ marginTop: "4px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span>{seatsLeft > 0 ? `${seatsLeft} seat${seatsLeft === 1 ? "" : "s"} left` : "Session full"}</span>
                        <span style={{ fontVariantNumeric: "tabular-nums" }}>{curP}/{maxP}</span>
                      </div>
                      <div style={{ height: "4px", borderRadius: "999px", background: C.border, overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${fillPct}%`,
                            borderRadius: "999px",
                            background: seatsLeft <= 0 ? "#dc2626" : C.dark,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </>
              }
              footer={
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {group.status && group.status !== "open" && (
                    <div>
                      <StatusPill bg="#f3e8ff" fg="#7c3aed">{GROUP_STATUS_LABEL[group.status] || group.status}</StatusPill>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
                    <PriceTag value={pricePerPerson} suffix={pricePerPerson === 0 ? undefined : "/person"} />
                    {isTemplate ? (
                      <button
                        className="svc-btn svc-btn--primary"
                        onClick={(e) => { e.stopPropagation(); open(); }}
                      >
                        {bookedSessionIds.includes(group.sessionId) ? "Book again" : "View details"}
                      </button>
                    ) : statusMeta ? (
                      <StatusPill bg={statusMeta.bg} fg={statusMeta.fg}>{statusMeta.label}</StatusPill>
                    ) : seatsLeft <= 0 ? (
                      <StatusPill bg={C.border} fg={C.mid}>Full</StatusPill>
                    ) : (
                      <button
                        className="svc-btn svc-btn--primary"
                        onClick={(e) => { e.stopPropagation(); open(); }}
                      >
                        View details
                      </button>
                    )}
                  </div>
                </div>
              }
            />
          );
        })}
      </div>

      {/* ================= Group Session Detail Modal ================= */}
      {detailGroup && (
        <GroupSessionDetailModal
          detailGroup={detailGroup}
          currentUserId={currentUserId}
          mentorName={mentorName}
          joinedIds={joinedIds}
          bookedSessionIds={bookedSessionIds}
          groupActionError={groupActionError}
          groupActionBusy={groupActionBusy}
          onClose={closeGroupDetail}
          onJoinFromModal={handleJoinFromModal}
          onLeaveFromModal={handleLeaveFromModal}
          onServiceClick={onServiceClick}
          getServiceFromGroupTemplate={getServiceFromGroupTemplate}
        />
      )}

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
          role="status"
          className="left-3 right-3 sm:left-auto sm:right-5"
          style={{
            position: "fixed", top: 20, zIndex: 9999, padding: "12px 16px", borderRadius: 12,
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

interface GroupSessionDetailModalProps {
  detailGroup: any;
  currentUserId: string;
  mentorName: string;
  joinedIds: string[];
  bookedSessionIds: string[];
  groupActionError: string | null;
  groupActionBusy: boolean;
  onClose: () => void;
  onJoinFromModal: () => void;
  onLeaveFromModal: () => void;
  onServiceClick: (service: Service) => void;
  getServiceFromGroupTemplate: (group: any) => Service;
}

// Modal is unchanged from the previous version.
const GroupSessionDetailModal: React.FC<GroupSessionDetailModalProps> = ({
  detailGroup,
  currentUserId,
  mentorName,
  joinedIds,
  bookedSessionIds,
  groupActionError,
  groupActionBusy,
  onClose,
  onJoinFromModal,
  onLeaveFromModal,
  onServiceClick,
  getServiceFromGroupTemplate,
}) => {
  useScrollLock(true, onClose);

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
  const status = detailGroup.status || "open";
  const isTemplateSession = !!detailGroup.isTemplate;
  const isCancelled = status === "cancelled";
  const isCompleted = status === "completed";
  const isInProgress = status === "in_progress";

  const statusColor = isCancelled ? "#ef4444" : isCompleted ? "#10b981" : isInProgress ? "#1d4ed8" : "#b45309";
  const statusBg = isCancelled ? "#fef2f2" : isCompleted ? "#ecfdf5" : isInProgress ? "#dbeafe" : "#fef3c7";

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(30,20,10,0.55)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          background: C.surface,
          borderRadius: "20px",
          maxWidth: "480px",
          width: "100%",
          maxHeight: "calc(100dvh - 32px)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          border: `1px solid ${C.border}`,
          overflow: "hidden",
        }}
      >
        {/* Static (fixed) pinned close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            zIndex: 30,
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            border: "1px solid rgba(0,0,0,0.1)",
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            color: C.dark,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            outline: "none",
            transition: "transform 0.15s ease, background-color 0.15s ease",
          }}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Inner scrollable content wrapper */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
            padding: "20px 20px 12px 20px",
          }}
        >
          {getServiceImage(detailGroup) ? (
            <div style={{ width: "100%", height: "140px", borderRadius: "14px", overflow: "hidden", marginBottom: "16px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getServiceImage(detailGroup)!} alt={detailGroup.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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

          <h2 style={{ fontSize: "19px", fontWeight: 700, color: C.dark, marginBottom: "6px", lineHeight: "1.35", overflowWrap: "anywhere" }}>
            {detailGroup.title}
          </h2>

          {mentorName && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", color: C.mid, fontSize: "13px" }}>
              <UserIcon size={14} />
              <span>hosted by <strong style={{ color: C.dark }}>{mentorName}</strong></span>
            </div>
          )}

          {detailGroup.description && (
            <p className="mb-4 text-sm" style={{ color: '#8a7a6a', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
              {detailGroup.description || "Interactive group session led by an expert mentor."}
            </p>
          )}

          {scheduledDate && (
            <div style={{
              background: C.bg, borderRadius: "14px", padding: "14px 16px", border: `1px solid ${C.border}`,
              marginBottom: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px",
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
                  Join request sent. Waiting for mentor approval - you'll be notified once it's reviewed.
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
            <div style={{ flex: 1, minWidth: 0, background: C.bg, borderRadius: "12px", padding: "12px", border: `1px solid ${C.border}`, textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "4px", color: C.mid }}><Clock /></div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: C.dark }}>{detailGroup.duration} min</div>
              <div style={{ fontSize: "10px", color: C.mid }}>Duration</div>
            </div>
            <div style={{ flex: 1, minWidth: 0, background: C.bg, borderRadius: "12px", padding: "12px", border: `1px solid ${C.border}`, textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "4px", color: C.mid }}><IndianRupee size={15} /></div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: pricePerPerson === 0 ? "#10b981" : C.dark }}>
                {pricePerPerson === 0 ? "Free" : `₹${pricePerPerson}`}
              </div>
              <div style={{ fontSize: "10px", color: C.mid }}>Per person</div>
            </div>
            <div style={{ flex: 1, minWidth: 0, background: C.bg, borderRadius: "12px", padding: "12px", border: `1px solid ${C.border}`, textAlign: "center" }}>
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
              <div style={{ background: C.bg, borderRadius: "12px", padding: "12px 14px", border: `1px solid ${C.border}`, fontSize: "12.5px", color: C.dark, lineHeight: "1.5", overflowWrap: "anywhere" }}>
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

        {/* Sticky fixed footer */}
        <div style={{ padding: "16px 20px", borderTop: `1px solid ${C.border}`, background: C.surface, display: "flex", gap: "10px", flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: "12px", fontSize: "13.5px", fontWeight: 600, background: C.border, color: C.dark, border: "none", cursor: "pointer" }}>
            Close
          </button>

          {!isCancelled && !isCompleted && (
            isTemplateSession ? (
              <button
                onClick={() => {
                  onServiceClick(getServiceFromGroupTemplate(detailGroup));
                  onClose();
                }}
                style={{ flex: 2, ...btnPrimary, padding: "12px", borderRadius: "12px", fontSize: "13.5px" }}
              >
                {bookedSessionIds.includes(detailGroup.sessionId) ? "Book Another Slot" : "Select a Slot"}
              </button>
            ) : isAccepted ? (
              <button
                onClick={onLeaveFromModal}
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
                onClick={onLeaveFromModal}
                disabled={groupActionBusy}
                style={{
                  flex: 2, padding: "12px", borderRadius: "12px", fontSize: "13.5px", fontWeight: 700,
                  background: "#fef3c7", color: "#b45309", border: "1.5px solid #fde68a",
                  cursor: groupActionBusy ? "not-allowed" : "pointer", opacity: groupActionBusy ? 0.6 : 1,
                }}
              >
                {groupActionBusy ? "Cancelling..." : "Cancel Request"}
              </button>
            ) : seatsLeft > 0 ? (
              <button
                onClick={onJoinFromModal}
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
    </div>,
    document.body
  );
};

export default ServicesSection;