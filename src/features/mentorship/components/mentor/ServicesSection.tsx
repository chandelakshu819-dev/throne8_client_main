// components/mentor-profile/ServicesSection.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Clock } from "./Icons";
import { SERVICES, FILTERS, C, btnPrimary } from "../../types/data";
import type { Service } from "../../types/types";
import SessionService from "@/lib/api/session.service";

interface ServicesSectionProps {
  onServiceClick: (service: Service) => void;
  mentorId: string;
  bookedSessionIds: string[];
  currentUserId: string;
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

const ServicesSection: React.FC<ServicesSectionProps> = ({
  onServiceClick,
  mentorId,
  bookedSessionIds,
  currentUserId
}) => {
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mentorId) return;
    SessionService.getAllSessionsFromDB({ limit: 50 })
      .then((res) => {
        const allSessions = res?.data ?? [];
        const mentorSessions = allSessions.filter((s: any) => s.mentorId === mentorId);
        setSessions(mentorSessions);
      })
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [mentorId]);

  // if (loading) return <div style={{ padding: "32px", textAlign: "center" }}>Loading sessions...</div>;

  // Dynamic filters — session types se generate karo
  const uniqueTypes = Array.from(new Set(sessions.map((s) => s.sessionType)));
  const dynamicFilters = ["All", ...uniqueTypes.map((t) => SESSION_TYPE_FILTER[t] || t)];

  // Filter logic
  const filtered = activeFilter === "All"
    ? sessions
    : sessions.filter((s) => (SESSION_TYPE_FILTER[s.sessionType] || s.sessionType) === activeFilter);

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
    return "📞";
  };

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
        {!loading && filtered.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: C.mid }}>
            No sessions available for this filter.
          </div>
        )}

        {/* Cards - sirf tab dikhao jab fetch complete ho aur data ho */}
        {!loading && filtered.length > 0 && filtered.map((session) => {
          const svc = getServiceFromSession(session);
          const myBooking = session.bookings?.find(
            (b: any) => b.menteeId === currentUserId
          );
          const isPending = myBooking?.status === 'pending';
          const isConfirmed = myBooking?.status === 'confirmed';
          const isBooked = isPending || isConfirmed;
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
                  <button onClick={() => onServiceClick(svc)} style={{ ...btnPrimary, padding: "8px 18px", borderRadius: "10px", fontSize: "13px" }}>
                    Book
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ServicesSection;