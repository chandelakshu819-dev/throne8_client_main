//src/features/mentorship/components/ServicesSection.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Clock } from "./Icons";
import { btnPrimary, C } from "../types/data";
import SessionService from "@/lib/api/session.service";
import MentorService from "@/lib/api/mentorship.service";
import QueryModal from "./QueryModal";
import { Service } from "../types/types";

interface ServicesSectionProps {
  onServiceClick: (service: Service) => void;
  mentorId: string;
  bookedSessionIds: string[];
  currentUserId: string;
}

const SESSION_TYPE_LABEL: Record<string, string> = {
  quick_call: "1:1 Call",
  mock_interview: "1:1 Call",
  resume_review: "1:1 Call",
  career_planning: "1:1 Call",
  group_session: "Group",
  deep_dive: "1:1 Call",
  portfolio_review: "1:1 Call",
};

const SESSION_TYPE_FILTER: Record<string, string> = {
  quick_call: "Quick Call",
  mock_interview: "Mock Interview",
  resume_review: "Resume Review",
  career_planning: "Career Planning",
  group_session: "Group Session",
  deep_dive: "Deep Dive",
  portfolio_review: "Portfolio Review",
};

// ✅ FIX: mentor.userId is a raw UUID, not a display name. The backend's
// enrichMentorWithRelations (mentor.service.ts) attaches a `user` object
// with firstName/lastName/fullName — same pattern as reviews. Use that.
const getMentorDisplayName = (mentor: any): string => {
  const user = mentor?.user;
  if (!user) return "";
  if (user.fullName) return user.fullName;
  const combined = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  return combined;
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

  const [mentorInfo, setMentorInfo] = useState<{
    askQueryPrice: number;
    acceptQueries: boolean;
    mentorName: string;
  } | null>(null);
  const [queryModalOpen, setQueryModalOpen] = useState(false);

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

  useEffect(() => {
    if (!mentorId) return;
    MentorService.getMyMentorProfile(mentorId)
      .then((res: any) => {
        const mentor = res?.data;
        if (!mentor) return;
        setMentorInfo({
          askQueryPrice: mentor.pricing?.askQuery ?? 0,
          acceptQueries: mentor.preferences?.acceptQueries ?? true,
          mentorName: getMentorDisplayName(mentor),
        });
      })
      .catch(() => setMentorInfo(null));
  }, [mentorId]);

  const uniqueTypes = Array.from(new Set(sessions.map((s) => s.sessionType)));
  const dynamicFilters = ["All", ...uniqueTypes.map((t) => SESSION_TYPE_FILTER[t] || t)];

  const filtered = activeFilter === "All"
    ? sessions
    : sessions.filter((s) => (SESSION_TYPE_FILTER[s.sessionType] || s.sessionType) === activeFilter);

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
    if (sessionType === "group_session") return "\u{1F465}";
    return "\u{1F4DE}";
  };

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

        {!loading && filtered.length === 0 && mentorInfo?.acceptQueries !== true && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: C.mid }}>
            No sessions available for this filter.
          </div>
        )}

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
                minWidth: 0,
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span>{getIcon(session.sessionType)}</span>
                <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "12px", background: C.border, color: C.dark }}>
                  {SESSION_TYPE_FILTER[session.sessionType] || session.sessionType}
                </span>
              </div>
              <h3 style={{
                fontWeight: "bold", color: C.dark, fontSize: "14px",
                marginBottom: "8px", lineHeight: "1.4",
                overflowWrap: "anywhere", wordBreak: "break-word",
              }}>{session.title}</h3>
              {session.description && (
                <p style={{
                  fontSize: "12px", color: C.mid, marginBottom: "8px", lineHeight: "1.4",
                  overflowWrap: "anywhere", wordBreak: "break-word",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}>{session.description}</p>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: C.mid, marginBottom: "14px" }}>
                <Clock /> {session.duration} Min
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: "bold", color: session.pricing?.basePrice === 0 ? "#10b981" : C.dark, fontSize: "15px" }}>
                  {session.pricing?.basePrice === 0 ? "Free" : `\u20B9${session.pricing?.basePrice}`}
                </span>
                {isBooked ? (
                  <div style={{ textAlign: "right" }}>
                    {myBooking?.status === "confirmed" ? (
                      <>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#10b981" }}>
                          {"\u2705"} Session Confirmed
                        </div>
                        <div style={{ fontSize: "10px", color: C.mid, marginTop: "2px" }}>Mentor has confirmed your session</div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#10b981" }}>
                          {"\u2705"} Session Booked
                        </div>
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

        {mentorInfo?.acceptQueries && (
          <div
            style={{
              borderRadius: "16px", padding: "20px", background: C.bg,
              border: `1px solid ${C.border}`, position: "relative",
              boxShadow: "0 2px 8px rgba(74,55,40,0.06)",
              minWidth: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span>{"\u2753"}</span>
              <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "12px", background: C.border, color: C.dark }}>
                Query
              </span>
            </div>
            <h3 style={{
              fontWeight: "bold", color: C.dark, fontSize: "14px",
              marginBottom: "8px", lineHeight: "1.4",
            }}>Ask a Query</h3>
            <p style={{
              fontSize: "12px", color: C.mid, marginBottom: "14px", lineHeight: "1.4",
            }}>
              Text-based question, mentor jawab dega - no live call needed.
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontWeight: "bold", color: mentorInfo.askQueryPrice === 0 ? "#10b981" : C.dark, fontSize: "15px" }}>
                {mentorInfo.askQueryPrice === 0 ? "Free" : `\u20B9${mentorInfo.askQueryPrice}`}
              </span>
              <button
                onClick={() => setQueryModalOpen(true)}
                style={{ ...btnPrimary, padding: "8px 18px", borderRadius: "10px", fontSize: "13px" }}
              >
                Ask
              </button>
            </div>
          </div>
        )}
      </div>

      {queryModalOpen && mentorInfo && (
        <QueryModal
          mentorId={mentorId}
          mentorName={mentorInfo.mentorName || undefined}
          price={mentorInfo.askQueryPrice}
          onClose={() => setQueryModalOpen(false)}
          onSuccess={() => setQueryModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ServicesSection;