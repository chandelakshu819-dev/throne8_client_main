//src/features/mentorship/components/ServicesSection.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock as ClockIcon,
  Phone,
  Users,
  HelpCircle,
  X,
  CheckCircle2,
  Sparkles,
  IndianRupee,
  Calendar,
  Video,
  MessageCircle,
  RefreshCcw,
  Ban,
  Circle,
  ClipboardList,
  Wallet,
  History,
  User as UserIcon,
} from "lucide-react";
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

const SESSION_HIGHLIGHTS: Record<string, string[]> = {
  quick_call: [
    "Fast, focused conversation — no fluff",
    "Get direct answers to your specific questions",
    "Great for a quick gut-check before a decision",
  ],
  mock_interview: [
    "Real interview-style practice with live feedback",
    "Identify blind spots before the actual interview",
    "Walk away with a clear improvement checklist",
  ],
  resume_review: [
    "Line-by-line feedback from someone who's hired before",
    "Learn what recruiters actually skim for",
    "Leave with a stronger, ATS-friendly resume",
  ],
  career_planning: [
    "Map out a realistic path for your next 1–2 years",
    "Get an outsider's honest perspective on your options",
    "Leave with concrete next steps, not just advice",
  ],
  group_session: [
    "Learn alongside peers with similar goals",
    "More perspectives, more questions answered",
    "Usually more relaxed and discussion-driven",
  ],
  deep_dive: [
    "Go deep on one topic instead of skimming many",
    "Ideal if you already know the basics",
    "Comes with follow-up notes/resources when relevant",
  ],
  portfolio_review: [
    "Honest, detailed feedback on your work",
    "Understand what stands out and what doesn't",
    "Practical suggestions you can act on immediately",
  ],
};

const DEFAULT_HIGHLIGHTS = [
  "Personalized 1:1 attention",
  "Direct access to someone who's been there",
  "Practical, actionable takeaways",
];

// Session-type ke hisaab se generic preparation tips — jab tak koi
// specific `notes` field session pe set nahi hai, ye fallback dikhta hai.
const PREP_INSTRUCTIONS: Record<string, string[]> = {
  quick_call: ["Keep your specific question ready", "Join 2–3 minutes early to test your mic/camera"],
  mock_interview: ["Keep your resume handy for reference", "Find a quiet space with stable internet"],
  resume_review: ["Have your latest resume ready to share on screen", "Note down 2–3 areas you're unsure about"],
  career_planning: ["Think about your top 2–3 career goals beforehand", "List any specific decisions you're stuck on"],
  group_session: ["Join on time — group sessions start promptly", "Prepare 1 question to ask the group"],
  deep_dive: ["Review the basics beforehand so time isn't spent on fundamentals", "Note specific sub-topics you want covered"],
  portfolio_review: ["Share your portfolio link/file in advance if possible", "Shortlist 2–3 pieces you want the most feedback on"],
};

const getMentorDisplayName = (mentor: any): string => {
  const user = mentor?.user;
  if (!user) return "";
  if (user.fullName) return user.fullName;
  const combined = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  return combined;
};

const getTypeIcon = (sessionType: string) => {
  if (sessionType === "group_session") return Users;
  return Phone;
};

// ── Progress tracker step order ──────────────────────────────────
const STEP_ORDER = ["pending", "confirmed", "in_progress", "completed"] as const;
const STEP_LABEL: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  completed: "Completed",
};

function stepIndex(status: string) {
  if (status === "rescheduled") return STEP_ORDER.indexOf("confirmed");
  const idx = STEP_ORDER.indexOf(status as any);
  return idx === -1 ? 0 : idx;
}

// ── Countdown helper ──────────────────────────────────────────────
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

function formatDateTime(d: Date): string {
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ServicesSection: React.FC<ServicesSectionProps> = ({
  onServiceClick,
  mentorId,
  bookedSessionIds,
  currentUserId,
}) => {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [mentorFull, setMentorFull] = useState<any | null>(null);
  const [mentorInfo, setMentorInfo] = useState<{
    askQueryPrice: number;
    acceptQueries: boolean;
    mentorName: string;
  } | null>(null);
  const [queryModalOpen, setQueryModalOpen] = useState(false);

  const [detailSession, setDetailSession] = useState<any | null>(null);
  const [, forceTick] = useState(0); // countdown ko live update karne ke liye
  const [actionBusy, setActionBusy] = useState(false);

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
        setMentorFull(mentor);
        setMentorInfo({
          askQueryPrice: mentor.pricing?.askQuery ?? 0,
          acceptQueries: mentor.preferences?.acceptQueries ?? true,
          mentorName: getMentorDisplayName(mentor),
        });
      })
      .catch(() => setMentorInfo(null));
  }, [mentorId]);

  // Countdown ko har 60s me refresh karo jab detail modal khula ho
  useEffect(() => {
    if (!detailSession) return;
    const interval = setInterval(() => forceTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, [detailSession]);

  const uniqueTypes = Array.from(new Set(sessions.map((s) => s.sessionType)));
  const dynamicFilters = ["All", ...uniqueTypes.map((t) => SESSION_TYPE_FILTER[t] || t)];

  const filtered =
    activeFilter === "All"
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

  const getMyBooking = (session: any) =>
    session.bookings?.find((b: any) => b.menteeId === currentUserId);

  const closeDetail = () => setDetailSession(null);

  const handleBookFromModal = () => {
    if (!detailSession) return;
    const svc = getServiceFromSession(detailSession);
    onServiceClick(svc);
    closeDetail();
  };

  const handleMessageMentor = () => {
    if (!mentorFull?.userId) return;
    router.push(`/message/${mentorFull.userId}`);
  };

  const handleReschedule = async (session: any) => {
    const myBooking = getMyBooking(session);
    if (!myBooking?.bookingId) {
      // ⚠️ CONFIRM: assuming booking object has `bookingId` field
      // (same pattern as session.sessionId). Agar aapke booking object
      // me field ka naam alag hai (e.g. `_id`), to sirf yahi field name badlo.
      alert("Booking not found.");
      return;
    }

    // TODO: apna actual reschedule flow yaha lagao (date-picker modal etc.)
    // placeholder: sirf ek prompt se demo ke liye
    const input = window.prompt("Naya date/time enter karo (YYYY-MM-DD HH:mm):");
    if (!input) return;
    const newDate = new Date(input);
    if (isNaN(newDate.getTime())) {
      alert("Invalid date format");
      return;
    }
    setActionBusy(true);
    try {
      await SessionService.rescheduleSession(
        session.sessionId,
        newDate.toISOString(),
        "Mentee requested reschedule",
        myBooking.bookingId
      );
      alert("Reschedule request sent.");
      closeDetail();
    } catch (err: any) {
      alert(err?.message || "Failed to reschedule.");
    } finally {
      setActionBusy(false);
    }
  };

  const handleCancel = async (session: any) => {
    const myBooking = getMyBooking(session);
    if (!myBooking?.bookingId) {
      // ⚠️ CONFIRM: same assumption as handleReschedule above
      alert("Booking not found.");
      return;
    }

    if (!window.confirm("Kya aap sach me is session ko cancel karna chahte hain?")) return;
    setActionBusy(true);
    try {
      await SessionService.cancelSession(session.sessionId, "Cancelled by mentee", myBooking.bookingId);
      alert("Session cancelled.");
      closeDetail();
    } catch (err: any) {
      alert(err?.message || "Failed to cancel.");
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div
      style={{
        borderRadius: "24px",
        padding: "32px",
        marginBottom: "24px",
        background: C.surface,
        border: `1px solid ${C.border}`,
        boxShadow: "0 8px 32px rgba(74,55,40,0.08)",
      }}
    >
      <h2 style={{ fontSize: "22px", fontWeight: "bold", color: C.dark, marginBottom: "4px" }}>
        Available Services
      </h2>
      <p style={{ color: C.mid, fontSize: "13px", marginBottom: "20px" }}>
        Discover our mentorship offerings designed for your success
      </p>

      <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
        {dynamicFilters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            style={{
              padding: "10px 20px",
              borderRadius: "20px",
              fontWeight: 500,
              fontSize: "14px",
              cursor: "pointer",
              background: activeFilter === f ? C.grad : C.border,
              color: activeFilter === f ? "#fff" : C.dark,
              border: activeFilter === f ? "none" : `1px solid ${C.muted}`,
              boxShadow: activeFilter === f ? "0 8px 20px rgba(74,55,40,0.3)" : "none",
              transform: activeFilter === f ? "scale(1.05)" : "scale(1)",
              transition: "all 0.3s",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {loading && (
          <>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div
              style={{
                gridColumn: "1 / -1",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "60px",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  border: `3px solid ${C.border}`,
                  borderTop: `3px solid ${C.dark}`,
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <span style={{ fontSize: "13px", color: C.mid }}>Fetching sessions...</span>
            </div>
          </>
        )}

        {!loading && filtered.length === 0 && mentorInfo?.acceptQueries !== true && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: C.mid }}>
            No sessions available for this filter.
          </div>
        )}

        {!loading &&
          filtered.length > 0 &&
          filtered.map((session) => {
            const myBooking = getMyBooking(session);
            const isPending = myBooking?.status === "pending";
            const isConfirmed = myBooking?.status === "confirmed";
            const isBooked = isPending || isConfirmed;
            const TypeIcon = getTypeIcon(session.sessionType);

            return (
              <div
                key={session.sessionId}
                onClick={() => setDetailSession(session)}
                style={{
                  borderRadius: "16px",
                  overflow: "hidden",
                  background: C.bg,
                  border: `1px solid ${C.border}`,
                  position: "relative",
                  boxShadow: "0 2px 8px rgba(74,55,40,0.06)",
                  opacity: isPending ? 0.6 : 1,
                  minWidth: 0,
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
                {/* Thumbnail image agar mentor ne set ki ho */}
                {session.thumbnailImage && (
                  <div style={{ width: "100%", height: "110px", overflow: "hidden" }}>
                    <img
                      src={session.thumbnailImage}
                      alt={session.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  </div>
                )}

                <div style={{ padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: C.border,
                        color: C.dark,
                        flexShrink: 0,
                      }}
                    >
                      <TypeIcon size={14} />
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "3px 10px",
                        borderRadius: "12px",
                        background: C.border,
                        color: C.dark,
                      }}
                    >
                      {SESSION_TYPE_FILTER[session.sessionType] || session.sessionType}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontWeight: "bold",
                      color: C.dark,
                      fontSize: "14px",
                      marginBottom: "8px",
                      lineHeight: "1.4",
                      overflowWrap: "anywhere",
                      wordBreak: "break-word",
                    }}
                  >
                    {session.title}
                  </h3>

                  {session.description && (
                    <p
                      style={{
                        fontSize: "12px",
                        color: C.mid,
                        marginBottom: "8px",
                        lineHeight: "1.4",
                        overflowWrap: "anywhere",
                        wordBreak: "break-word",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {session.description}
                    </p>
                  )}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "12px",
                      color: C.mid,
                      marginBottom: "14px",
                    }}
                  >
                    <ClockIcon size={13} /> {session.duration} Min
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span
                      style={{
                        fontWeight: "bold",
                        color: session.pricing?.basePrice === 0 ? "#10b981" : C.dark,
                        fontSize: "15px",
                      }}
                    >
                      {session.pricing?.basePrice === 0 ? "Free" : `₹${session.pricing?.basePrice}`}
                    </span>

                    {isBooked ? (
                      <div style={{ textAlign: "right" }}>
                        {myBooking?.status === "confirmed" ? (
                          <>
                            <div
                              style={{
                                fontSize: "12px",
                                fontWeight: 700,
                                color: "#10b981",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                justifyContent: "flex-end",
                              }}
                            >
                              <CheckCircle2 size={13} /> Session Confirmed
                            </div>
                            <div style={{ fontSize: "10px", color: C.mid, marginTop: "2px" }}>
                              Mentor has confirmed your session
                            </div>
                          </>
                        ) : (
                          <>
                            <div
                              style={{
                                fontSize: "12px",
                                fontWeight: 700,
                                color: "#10b981",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                justifyContent: "flex-end",
                              }}
                            >
                              <CheckCircle2 size={13} /> Session Booked
                            </div>
                            <div style={{ fontSize: "10px", color: C.mid, marginTop: "2px" }}>
                              Session Confirmation coming soon by Mentor
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onServiceClick(getServiceFromSession(session));
                        }}
                        style={{ ...btnPrimary, padding: "8px 18px", borderRadius: "10px", fontSize: "13px" }}
                      >
                        Book
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

        {mentorInfo?.acceptQueries && (
          <div
            style={{
              borderRadius: "16px",
              padding: "20px",
              background: C.bg,
              border: `1px solid ${C.border}`,
              position: "relative",
              boxShadow: "0 2px 8px rgba(74,55,40,0.06)",
              minWidth: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: C.border,
                  color: C.dark,
                  flexShrink: 0,
                }}
              >
                <HelpCircle size={14} />
              </div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "3px 10px",
                  borderRadius: "12px",
                  background: C.border,
                  color: C.dark,
                }}
              >
                Query
              </span>
            </div>
            <h3 style={{ fontWeight: "bold", color: C.dark, fontSize: "14px", marginBottom: "8px", lineHeight: "1.4" }}>
              Ask a Query
            </h3>
            <p style={{ fontSize: "12px", color: C.mid, marginBottom: "14px", lineHeight: "1.4" }}>
              Text-based question, mentor jawab dega - no live call needed.
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span
                style={{
                  fontWeight: "bold",
                  color: mentorInfo.askQueryPrice === 0 ? "#10b981" : C.dark,
                  fontSize: "15px",
                }}
              >
                {mentorInfo.askQueryPrice === 0 ? "Free" : `₹${mentorInfo.askQueryPrice}`}
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

      {/* ================= Detail Modal ================= */}
      {detailSession && (() => {
        const myBooking = getMyBooking(detailSession);
        const isConfirmed = myBooking?.status === "confirmed";
        const isPending = myBooking?.status === "pending";
        const isCancelled = myBooking?.status === "cancelled";
        const isCompleted = myBooking?.status === "completed";
        const isInProgress = myBooking?.status === "in_progress";
        const isBooked = !!myBooking;
        const TypeIcon = getTypeIcon(detailSession.sessionType);

        // ---------- UNBOOKED: pitch modal (jaisa pehle tha) ----------
        if (!isBooked) {
          const highlights = SESSION_HIGHLIGHTS[detailSession.sessionType] || DEFAULT_HIGHLIGHTS;
          const bookingsCount = detailSession.bookings?.length || 0;

          return (
            <ModalShell onBackdropClick={closeDetail}>
              <div style={{ padding: "24px 24px 0 24px", position: "relative" }}>
                <CloseButton onClick={closeDetail} />
                <HeaderBlock session={detailSession} TypeIcon={TypeIcon} />
                {detailSession.description && (
                  <p style={{ fontSize: "13.5px", color: C.mid, lineHeight: "1.6", marginBottom: "18px" }}>
                    {detailSession.description}
                  </p>
                )}
              </div>

              <div style={{ padding: "0 24px" }}>
                <div
                  style={{
                    background: C.bg,
                    borderRadius: "14px",
                    padding: "16px",
                    border: `1px solid ${C.border}`,
                    marginBottom: "18px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                    <Sparkles size={15} color={C.dark} />
                    <span style={{ fontSize: "13px", fontWeight: 700, color: C.dark }}>What you'll get</span>
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                    {highlights.map((h, i) => (
                      <li
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "8px",
                          fontSize: "13px",
                          color: C.dark,
                          marginBottom: i === highlights.length - 1 ? 0 : "8px",
                          lineHeight: "1.5",
                        }}
                      >
                        <CheckCircle2 size={14} color="#10b981" style={{ marginTop: "2px", flexShrink: 0 }} />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                  <FactBox icon={<ClockIcon size={15} />} value={`${detailSession.duration} min`} label="Duration" />
                  <FactBox
                    icon={<IndianRupee size={15} />}
                    value={detailSession.pricing?.basePrice === 0 ? "Free" : `₹${detailSession.pricing?.basePrice}`}
                    label="Price"
                    valueColor={detailSession.pricing?.basePrice === 0 ? "#10b981" : C.dark}
                  />
                  {bookingsCount > 0 && (
                    <FactBox icon={<Users size={15} />} value={String(bookingsCount)} label="Already booked" />
                  )}
                </div>
              </div>

              <div style={{ padding: "16px 24px 24px 24px", borderTop: `1px solid ${C.border}`, display: "flex", gap: "10px" }}>
                <button onClick={closeDetail} style={secondaryBtnStyle}>Close</button>
                <button onClick={handleBookFromModal} style={{ flex: 2, ...btnPrimary, padding: "12px", borderRadius: "12px", fontSize: "13.5px" }}>
                  Book This Session
                </button>
              </div>
            </ModalShell>
          );
        }

        // ---------- BOOKED: full structured modal ----------
        const scheduledDate = myBooking?.scheduledAt ? new Date(myBooking.scheduledAt) : (detailSession.scheduledAt ? new Date(detailSession.scheduledAt) : null);
        const statusIdx = isCancelled ? -1 : stepIndex(myBooking.status);
        const prepTips = detailSession.notes
          ? detailSession.notes.split("\n").filter(Boolean)
          : PREP_INSTRUCTIONS[detailSession.sessionType] || ["Join a few minutes early", "Keep your questions ready"];

        const statusColor = isCancelled ? "#ef4444" : isCompleted ? "#10b981" : isConfirmed || isInProgress ? "#10b981" : "#b45309";
        const statusBg = isCancelled ? "#fef2f2" : isCompleted || isConfirmed || isInProgress ? "#ecfdf5" : "#fef3c7";
        const statusLabel = isCancelled ? "Cancelled" : isCompleted ? "Completed" : isInProgress ? "In Progress" : isConfirmed ? "Confirmed" : "Pending Confirmation";

        return (
          <ModalShell onBackdropClick={closeDetail} maxWidth="520px">
            {/* 1. Service Image + Name + Mentor */}
            <div style={{ padding: "24px 24px 0 24px", position: "relative" }}>
              <CloseButton onClick={closeDetail} />
              <HeaderBlock session={detailSession} TypeIcon={TypeIcon} />
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", color: C.mid, fontSize: "13px" }}>
                <UserIcon size={14} />
                <span>with <strong style={{ color: C.dark }}>{mentorInfo?.mentorName || "your mentor"}</strong></span>
              </div>
            </div>

            <div style={{ padding: "0 24px" }}>
              {/* 2. Confirmed Badge */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  borderRadius: "20px",
                  background: statusBg,
                  color: statusColor,
                  fontSize: "12.5px",
                  fontWeight: 700,
                  marginBottom: "20px",
                }}
              >
                {isCancelled ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                {statusLabel}
              </div>

              {/* 3. Booking Progress Tracker */}
              {!isCancelled && (
                <div style={{ marginBottom: "22px" }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    {STEP_ORDER.map((step, i) => (
                      <React.Fragment key={step}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: i === STEP_ORDER.length - 1 ? "0 0 auto" : 1 }}>
                          <div
                            style={{
                              width: "22px",
                              height: "22px",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: i <= statusIdx ? "#10b981" : C.border,
                              color: i <= statusIdx ? "#fff" : C.mid,
                              flexShrink: 0,
                            }}
                          >
                            {i < statusIdx ? <CheckCircle2 size={13} /> : <Circle size={8} fill="currentColor" />}
                          </div>
                          <span style={{ fontSize: "10px", color: i <= statusIdx ? C.dark : C.mid, marginTop: "6px", fontWeight: i === statusIdx ? 700 : 500, whiteSpace: "nowrap" }}>
                            {STEP_LABEL[step]}
                          </span>
                        </div>
                        {i < STEP_ORDER.length - 1 && (
                          <div style={{ flex: 1, height: "2px", background: i < statusIdx ? "#10b981" : C.border, marginBottom: "16px" }} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Date / Time / Countdown */}
              {scheduledDate && (
                <div
                  style={{
                    background: C.bg,
                    borderRadius: "14px",
                    padding: "14px 16px",
                    border: `1px solid ${C.border}`,
                    marginBottom: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Calendar size={16} color={C.dark} />
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: C.dark }}>{formatDateTime(scheduledDate)}</div>
                      {myBooking?.slotTime && <div style={{ fontSize: "11px", color: C.mid }}>{myBooking.slotTime}</div>}
                    </div>
                  </div>
                  {!isCancelled && !isCompleted && (
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#b45309" }}>{formatCountdown(scheduledDate)}</span>
                  )}
                </div>
              )}

              {/* 5. Join Session */}
              {(isConfirmed || isInProgress) && (
                <button
                  onClick={() => {
                    if (detailSession.meeting?.meetingUrl) window.open(detailSession.meeting.meetingUrl, "_blank");
                  }}
                  disabled={!detailSession.meeting?.meetingUrl}
                  style={{
                    width: "100%",
                    ...btnPrimary,
                    padding: "12px",
                    borderRadius: "12px",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    marginBottom: "18px",
                    opacity: detailSession.meeting?.meetingUrl ? 1 : 0.5,
                    cursor: detailSession.meeting?.meetingUrl ? "pointer" : "not-allowed",
                  }}
                >
                  <Video size={16} />
                  {detailSession.meeting?.meetingUrl ? "Join Session" : "Meeting link not shared yet"}
                </button>
              )}

              {/* 6. What You Booked */}
              <SectionBlock icon={<ClipboardList size={15} />} title="What You Booked">
                <p style={{ fontSize: "13px", color: C.dark, marginBottom: "8px" }}>
                  {SESSION_TYPE_FILTER[detailSession.sessionType] || detailSession.sessionType} — {detailSession.duration} min
                </p>
                {detailSession.description && (
                  <p style={{ fontSize: "12.5px", color: C.mid, lineHeight: "1.5" }}>{detailSession.description}</p>
                )}
              </SectionBlock>

              {/* 7. Mentor Details */}
              <SectionBlock icon={<UserIcon size={15} />} title="Mentor Details">
                <p style={{ fontSize: "13px", color: C.dark, fontWeight: 600, marginBottom: "2px" }}>
                  {mentorInfo?.mentorName || "Mentor"}
                </p>
                {mentorFull?.title && <p style={{ fontSize: "12px", color: C.mid, marginBottom: "2px" }}>{mentorFull.title}</p>}
                {typeof mentorFull?.experience === "number" && (
                  <p style={{ fontSize: "12px", color: C.mid }}>{mentorFull.experience} years of experience</p>
                )}
              </SectionBlock>

              {/* 8. Preparation Instructions */}
              <SectionBlock icon={<Sparkles size={15} />} title="Preparation Instructions">
                <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                  {prepTips.map((tip: string, i: number) => (
                    <li key={i} style={{ display: "flex", gap: "8px", fontSize: "12.5px", color: C.dark, marginBottom: i === prepTips.length - 1 ? 0 : "6px" }}>
                      <CheckCircle2 size={13} color="#10b981" style={{ marginTop: "2px", flexShrink: 0 }} />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </SectionBlock>

              {/* 9. Booking & Payment Details */}
              <SectionBlock icon={<Wallet size={15} />} title="Booking & Payment Details">
                <Row label="Base Price" value={`₹${myBooking.pricing?.basePrice ?? detailSession.pricing?.basePrice ?? 0}`} />
                <Row label="Platform Fee" value={`₹${myBooking.pricing?.platformFee ?? detailSession.pricing?.platformFee ?? 0}`} />
                <Row label="Total Paid" value={`₹${myBooking.pricing?.totalAmount ?? detailSession.pricing?.totalAmount ?? 0}`} bold />
                <Row label="Payment Status" value={myBooking.payment?.status || "—"} />
                {myBooking.payment?.method && <Row label="Payment Method" value={myBooking.payment.method} />}
              </SectionBlock>

              {/* 10. Communication / Reschedule / Cancel */}
              {!isCancelled && !isCompleted && (
                <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
                  <ActionChip icon={<MessageCircle size={13} />} label="Message" onClick={handleMessageMentor} />
                  <ActionChip icon={<RefreshCcw size={13} />} label="Reschedule" onClick={() => handleReschedule(detailSession)} disabled={actionBusy} />
                  <ActionChip icon={<Ban size={13} />} label="Cancel" onClick={() => handleCancel(detailSession)} disabled={actionBusy} danger />
                </div>
              )}

              {/* 11. Timeline */}
              <SectionBlock icon={<History size={15} />} title="Timeline">
                <TimelineList session={detailSession} booking={myBooking} />
              </SectionBlock>
            </div>

            <div style={{ padding: "16px 24px 24px 24px" }}>
              <button onClick={closeDetail} style={{ ...secondaryBtnStyle, width: "100%" }}>Close</button>
            </div>
          </ModalShell>
        );
      })()}

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

// ============================================================
// Small presentational helpers (isi file me, alag file nahi banayi
// taaki import paths na tootein)
// ============================================================

function ModalShell({ children, onBackdropClick, maxWidth = "460px" }: { children: React.ReactNode; onBackdropClick: () => void; maxWidth?: string }) {
  return (
    <div
      onClick={onBackdropClick}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(30,20,10,0.45)",
        backdropFilter: "blur(2px)",
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
          background: C.surface,
          borderRadius: "20px",
          maxWidth,
          width: "100%",
          maxHeight: "88vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          border: `1px solid ${C.border}`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "absolute",
        top: "20px",
        right: "20px",
        width: "30px",
        height: "30px",
        borderRadius: "50%",
        border: "none",
        background: C.border,
        color: C.dark,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
      aria-label="Close"
    >
      <X size={16} />
    </button>
  );
}

function HeaderBlock({ session, TypeIcon }: { session: any; TypeIcon: any }) {
  return (
    <>
      {session.thumbnailImage ? (
        <div style={{ width: "100%", height: "140px", borderRadius: "14px", overflow: "hidden", marginBottom: "16px" }}>
          <img src={session.thumbnailImage} alt={session.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: C.grad,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            <TypeIcon size={19} />
          </div>
        </div>
      )}
      <span
        style={{
          fontSize: "12px",
          fontWeight: 600,
          padding: "4px 12px",
          borderRadius: "12px",
          background: C.border,
          color: C.dark,
          display: "inline-block",
          marginBottom: "10px",
        }}
      >
        {SESSION_TYPE_FILTER[session.sessionType] || session.sessionType}
      </span>
      <h2 style={{ fontSize: "19px", fontWeight: 700, color: C.dark, marginBottom: "6px", lineHeight: "1.35" }}>
        {session.title}
      </h2>
    </>
  );
}

function FactBox({ icon, value, label, valueColor }: { icon: React.ReactNode; value: string; label: string; valueColor?: string }) {
  return (
    <div style={{ flex: 1, background: C.bg, borderRadius: "12px", padding: "12px", border: `1px solid ${C.border}`, textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "4px", color: C.mid }}>{icon}</div>
      <div style={{ fontSize: "13px", fontWeight: 700, color: valueColor || C.dark }}>{value}</div>
      <div style={{ fontSize: "10px", color: C.mid }}>{label}</div>
    </div>
  );
}

function SectionBlock({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
        <span style={{ color: C.dark }}>{icon}</span>
        <span style={{ fontSize: "13px", fontWeight: 700, color: C.dark }}>{title}</span>
      </div>
      <div style={{ background: C.bg, borderRadius: "12px", padding: "12px 14px", border: `1px solid ${C.border}` }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", padding: "3px 0" }}>
      <span style={{ color: C.mid }}>{label}</span>
      <span style={{ color: C.dark, fontWeight: bold ? 700 : 500 }}>{value}</span>
    </div>
  );
}

function ActionChip({
  icon,
  label,
  onClick,
  danger,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 14px",
        borderRadius: "10px",
        fontSize: "12.5px",
        fontWeight: 600,
        background: danger ? "#fef2f2" : C.border,
        color: danger ? "#ef4444" : C.dark,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function TimelineList({ session, booking }: { session: any; booking: any }) {
  const events: { label: string; date: Date | null; color: string }[] = [];

  if (booking?.bookedAt) events.push({ label: "Session booked", date: new Date(booking.bookedAt), color: "#8a7a6a" });
  if (booking?.status !== "pending" && booking?.scheduledAt) {
    events.push({ label: "Confirmed for", date: new Date(booking.scheduledAt), color: "#10b981" });
  }
  if (session.reschedule?.lastRescheduledAt) {
    events.push({ label: "Rescheduled", date: new Date(session.reschedule.lastRescheduledAt), color: "#b45309" });
  }
  if (session.cancellation?.cancelledAt) {
    events.push({ label: `Cancelled${session.cancellation.reason ? ` — ${session.cancellation.reason}` : ""}`, date: new Date(session.cancellation.cancelledAt), color: "#ef4444" });
  }
  if (session.completion?.completedAt) {
    events.push({ label: "Session completed", date: new Date(session.completion.completedAt), color: "#10b981" });
  }

  events.sort((a, b) => (a.date && b.date ? a.date.getTime() - b.date.getTime() : 0));

  if (events.length === 0) {
    return <p style={{ fontSize: "12px", color: C.mid, margin: 0 }}>No timeline events yet.</p>;
  }

  return (
    <div>
      {events.map((ev, i) => (
        <div key={i} style={{ display: "flex", gap: "10px", marginBottom: i === events.length - 1 ? 0 : "10px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: ev.color, marginTop: "4px" }} />
            {i < events.length - 1 && <div style={{ width: "2px", flex: 1, background: C.border, marginTop: "2px" }} />}
          </div>
          <div style={{ paddingBottom: "2px" }}>
            <div style={{ fontSize: "12.5px", fontWeight: 600, color: C.dark }}>{ev.label}</div>
            {ev.date && <div style={{ fontSize: "11px", color: C.mid }}>{formatDateTime(ev.date)}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

const secondaryBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: "12px",
  borderRadius: "12px",
  fontSize: "13.5px",
  fontWeight: 600,
  background: C.border,
  color: C.dark,
  border: "none",
  cursor: "pointer",
};