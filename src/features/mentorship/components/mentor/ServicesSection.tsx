//src/features/mentorship/components/mentor/ServicesSection.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Clock } from "./Icons";
import { SERVICES, FILTERS, C, btnPrimary } from "../../types/data";
import type { Service } from "../../types/types";
import SessionService from "@/lib/api/session.service";
import MentorService from "@/lib/api/mentorship.service";
import WaitlistModal from "./WaitlistModal";

interface ServicesSectionProps {
  onServiceClick: (service: Service) => void;
  mentorId: string;
  bookedSessionIds: string[];
  currentUserId: string;
  mentorName?: string;
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

const ServicesSection: React.FC<ServicesSectionProps> = ({
  onServiceClick,
  mentorId,
  bookedSessionIds,
  currentUserId,
  mentorName = "",
}) => {
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [sessions, setSessions] = useState<any[]>([]);
  // ✅ NEW: group sessions kept separate — different shape (pricing.pricePerPerson,
  // participants[], fixed scheduledAt) and a different booking action (join, not
  // the calendar/slot-picker flow that 1:1 sessions use).
  const [groupSessions, setGroupSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinedIds, setJoinedIds] = useState<string[]>([]);




  // ── Waitlist ──
  // key = session.sessionId (the service card), value = the user's active waitlist entry
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

  useEffect(() => {
    if (!mentorId) return;
    setLoading(true);

    Promise.allSettled([
      SessionService.getAllSessionsFromDB({ limit: 50 }),
      MentorService.getAllGroupSessions({ mentorId }),
    ]).then(([sessionsRes, groupRes]) => {
      if (sessionsRes.status === "fulfilled") {
        const allSessions = sessionsRes.value?.data ?? [];
        setSessions(allSessions.filter((s: any) => s.mentorId === mentorId));
      } else {
        setSessions([]);
      }

      if (groupRes.status === "fulfilled") {
        const res: any = groupRes.value;
        let groups: any[] = [];
        if (Array.isArray(res)) groups = res;
        else if (res && Array.isArray(res.data)) groups = res.data;
        else if (res?.data && Array.isArray(res.data.data)) groups = res.data.data;
        // ✅ only sessions still open for joining
        setGroupSessions(groups.filter((g: any) => g.status === 'open' || g.status === undefined));
      } else {
        setGroupSessions([]);
      }
    }).finally(() => setLoading(false));
  }, [mentorId]);

  // Dynamic filters — session types se generate karo (group sessions included)
  const uniqueTypes = Array.from(new Set(sessions.map((s) => s.sessionType)));
  const dynamicFilters = ["All", ...uniqueTypes.map((t) => SESSION_TYPE_FILTER[t] || t)];
  if (groupSessions.length > 0 && !dynamicFilters.includes("Group Session")) {
    dynamicFilters.push("Group Session");
  }

  // Filter logic
  const filtered = activeFilter === "All"
    ? sessions
    : activeFilter === "Group Session"
      ? []
      : sessions.filter((s) => (SESSION_TYPE_FILTER[s.sessionType] || s.sessionType) === activeFilter);

  const showGroupSessions = activeFilter === "All" || activeFilter === "Group Session";

  // Session ko Service card format me convert karo
  const getServiceFromSession = (session: any): Service => ({
    id: session.sessionId,
    type: SESSION_TYPE_LABEL[session.sessionType] || "1:1 Call",
    title: session.title,
    duration: `${session.duration} Min`,
    originalPrice: null,
    price: session.pricing?.basePrice === 0 ? "Free" : session.pricing?.basePrice,
    popular: false,
  });

  const getIcon = (sessionType: string): string => {
    if (sessionType === "group_session") return "👥";
    return "";
  };

  const handleJoinGroupSession = async (groupId: string) => {
    setJoinError(null);
    setJoiningId(groupId);
    try {
      await MentorService.joinGroupSession(groupId);
      setJoinedIds((prev) => [...prev, groupId]);
    } catch (err: any) {
      setJoinError(err.message || "Failed to join session.");
    } finally {
      setJoiningId(null);
    }
  };

  const hasAnyResults = filtered.length > 0 || (showGroupSessions && groupSessions.length > 0);

  return (
    <div style={{ borderRadius: "24px", padding: "32px", marginBottom: "24px", background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 8px 32px rgba(74,55,40,0.08)" }}>
      <h2 style={{ fontSize: "22px", fontWeight: "bold", color: C.dark, marginBottom: "4px" }}>
        Available Services
      </h2>
      <p style={{ color: C.mid, fontSize: "13px", marginBottom: "20px" }}>Discover our mentorship offerings designed for your success</p>

      {/* Dynamic Filters */}
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

      {joinError && (
        <div style={{ marginBottom: "16px", padding: "10px 14px", borderRadius: "10px", background: "#fee2e2", color: "#dc2626", fontSize: "13px", fontWeight: 600 }}>
          {joinError}
        </div>
      )}

      {/* Session Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

        {/* Loader - jab tak fetch ho raha hai */}
        {loading && (
          <>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px", gap: "12px" }}>
              <div style={{ width: "36px", height: "36px", border: `3px solid ${C.border}`, borderTop: `3px solid ${C.dark}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <span style={{ fontSize: "13px", color: C.mid }}>Fetching sessions...</span>
            </div>
          </>
        )}

        {/* No sessions - sirf tab dikhao jab fetch complete ho aur result empty ho */}
        {!loading && !hasAnyResults && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: C.mid }}>
            No sessions available for this filter.
          </div>
        )}

        {/* Regular session Cards */}
        {!loading && filtered.map((session) => {
          const svc = getServiceFromSession(session);
          const myBooking = session.bookings?.find(
            (b: any) => b.menteeId === currentUserId
          );
          const isPending = myBooking?.status === 'pending';
          const isConfirmed = myBooking?.status === 'confirmed';
          const isBooked = isPending || isConfirmed;
          const wl = waitlistEntries[session.sessionId];
          return (
            <div key={session.sessionId}
              style={{
                borderRadius: "16px", padding: "20px", background: C.bg,
                border: `1px solid ${C.border}`, position: "relative",
                boxShadow: "0 2px 8px rgba(74,55,40,0.06)",
                opacity: isPending ? 0.6 : 1,
                pointerEvents: isBooked ? "none" : "auto",
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span>{getIcon(session.sessionType)}</span>
                <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "12px", background: C.border, color: C.dark }}>
                  {SESSION_TYPE_FILTER[session.sessionType] || session.sessionType}
                </span>
              </div>
              <h3 style={{ fontWeight: "bold", color: C.dark, fontSize: "14px", marginBottom: "8px", lineHeight: "1.4" }}>{session.title}</h3>
              {session.description && (
                <p style={{ fontSize: "12px", color: C.mid, marginBottom: "8px", lineHeight: "1.4" }}>{session.description}</p>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: C.mid, marginBottom: "14px" }}>
                <Clock /> {session.duration} Min
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: "bold", color: session.pricing?.basePrice === 0 ? "#10b981" : C.dark, fontSize: "15px" }}>
                  {session.pricing?.basePrice === 0 ? "Free" : `₹${session.pricing?.basePrice}`}
                </span>
                {isBooked ? (
                  <div style={{ textAlign: "right" }}>
                    {myBooking?.status === "confirmed" ? (
                      <>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#10b981" }}>✅ Session Confirmed</div>
                        <div style={{ fontSize: "10px", color: C.mid, marginTop: "2px" }}>Mentor has confirmed your session</div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#10b981" }}>✅ Session Booked</div>
                        <div style={{ fontSize: "10px", color: C.mid, marginTop: "2px" }}>Session Confirmation coming soon by Mentor</div>
                      </>
                    )}
                  </div>
                ) : (
                  wl ? (
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
                        Book
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
                  )
                )}
              </div>
            </div>
          );
        })}

        {/* ✅ NEW: Group session cards — separate rendering because they carry
            different fields (fixed scheduledAt, pricePerPerson, participant
            count) and a different action (join, not the slot-picker flow). */}
        {!loading && showGroupSessions && groupSessions.map((group) => {
          const seatsLeft = (group.maxParticipants ?? 0) - (group.currentParticipants ?? 0);
          const alreadyJoined = joinedIds.includes(group.sessionId) ||
            group.participants?.some((p: any) => p.menteeId === currentUserId);
          const isJoining = joiningId === group.sessionId;
          const pricePerPerson = group.pricing?.pricePerPerson ?? group.pricePerPerson ?? 0;

          return (
            <div key={group.sessionId}
              style={{
                borderRadius: "16px", padding: "20px", background: C.bg,
                border: `1px solid ${C.border}`, position: "relative",
                boxShadow: "0 2px 8px rgba(74,55,40,0.06)",
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span>👥</span>
                <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "12px", background: C.border, color: C.dark }}>
                  Group Session
                </span>
              </div>
              <h3 style={{ fontWeight: "bold", color: C.dark, fontSize: "14px", marginBottom: "8px", lineHeight: "1.4" }}>
                {group.title}
              </h3>
              {group.description && (
                <p style={{ fontSize: "12px", color: C.mid, marginBottom: "8px", lineHeight: "1.4" }}>{group.description}</p>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: C.mid, marginBottom: "4px" }}>
                <Clock /> {formatGroupDate(group.scheduledAt)} · {group.duration} Min
              </div>
              <div style={{ fontSize: "12px", color: C.mid, marginBottom: "14px" }}>
                {seatsLeft > 0 ? `${seatsLeft} seats available` : "Session full"} · {group.currentParticipants ?? 0}/{group.maxParticipants ?? 0} enrolled
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: "bold", color: pricePerPerson === 0 ? "#10b981" : C.dark, fontSize: "15px" }}>
                  {pricePerPerson === 0 ? "Free" : `₹${pricePerPerson}/person`}
                </span>
                {alreadyJoined ? (
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#10b981" }}>✅ Seat Reserved</div>
                ) : seatsLeft <= 0 ? (
                  <span style={{ fontSize: "12px", fontWeight: 700, color: C.mid }}>Full</span>
                ) : (
                  <button
                    onClick={() => handleJoinGroupSession(group.sessionId)}
                    disabled={isJoining}
                    style={{ ...btnPrimary, padding: "8px 18px", borderRadius: "10px", fontSize: "13px", opacity: isJoining ? 0.6 : 1 }}
                  >
                    {isJoining ? "Reserving..." : "Reserve Seat"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
          </div>

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