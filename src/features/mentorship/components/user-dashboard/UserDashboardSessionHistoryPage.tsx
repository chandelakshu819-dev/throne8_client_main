//src/features/mentorship/components/user-dashboard/UserDashboardSessionHistoryPage.tsx
import React, { useState } from "react";
import {
  CalendarClock,
  Clock,
  Video,
  MapPin,
  Star,
  RotateCcw, 
  History,
  MessageSquare
} from "lucide-react";
import { useRouter } from "next/navigation";
import UserDashboardReviewModal from "./UserDashboardReviewModal";
import { routes } from "@/config/routes";

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
  success: "#15803d",
  successWash: "#f0fdf4",
  danger: "#dc2626",
  dangerWash: "#fef2f2",
};

type Session = {
  _id?: string;
  sessionId?: string;
  serviceId?: string;
  mentorId?: string;
  mentorName?: string;
  mentorProfilePhoto?: string;
  mentorJobTitle?: string;
  title?: string;
  sessionType?: string;
  scheduledAt?: string;
  startTime?: string;
  status?: string;
  duration?: number;
  review?: {
    rating?: number;
    menteeReview?: string;
  };
};

interface Props {
  sessions?: Session[];
}

function formatDateStr(iso?: string) {
  if (!iso) return "Date not set";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Date not set";
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function formatTimeStr(iso?: string) {
  if (!iso) return "Time not set";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Time not set";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function initialsFrom(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "S";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function UserDashboardSessionHistoryPage({ sessions = [] }: Props) {
  const router = useRouter();
  const now = Date.now();

  const [reviewTarget, setReviewTarget] = useState<Session | null>(null);
  const [locallyReviewedIds, setLocallyReviewedIds] = useState<Set<string>>(new Set());
  const [viewReviewSession, setViewReviewSession] = useState<Session | null>(null);

  const historySessions = sessions.filter((s) => {
    const status = (s.status || "").toLowerCase();
    const t = new Date(s.startTime || s.scheduledAt || 0).getTime();
    const isPast = t < now && t > 0;

    return status === "completed" || status === "done" || (isPast && status !== "cancelled");
  }).sort((a, b) => {
    const ta = new Date(a.startTime || a.scheduledAt || 0).getTime();
    const tb = new Date(b.startTime || b.scheduledAt || 0).getTime();
    return tb - ta; // Descending for history
  });

  const getStatusBadgeStyles = (status: string) => {
    const s = status.toLowerCase();
    if (s === "completed" || s === "done") return { bg: COLORS.successWash, text: COLORS.success };
    if (s === "cancelled" || s === "refunded") return { bg: COLORS.dangerWash, text: COLORS.danger };
    return { bg: COLORS.chip, text: COLORS.accent };
  };

  const handleBookAgain = (s: Session) => {
    if (!s.mentorId) {
      router.push("/mentorship");
      return;
    }
    const serviceIdentifier = s.serviceId || s.sessionId || s._id;
    const baseCardUrl = routes.mentorCard(s.mentorName || "mentor", s.mentorId);
    const bookingUrl = serviceIdentifier
      ? `${baseCardUrl}?serviceId=${encodeURIComponent(serviceIdentifier)}&book=true`
      : `${baseCardUrl}?book=true`;
    router.push(bookingUrl);
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl pt-2 pb-8">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: COLORS.ink }}>
          Session History
        </h2>
        <p style={{ color: COLORS.muted }} className="text-sm mt-1">
          Review your past mentorship sessions and feedback.
        </p>
      </div>

      {historySessions.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center gap-3 py-16 rounded-2xl text-center"
          style={{ backgroundColor: COLORS.softWash, border: `1px solid ${COLORS.hairline}` }}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.chip }}>
            <History className="w-8 h-8" style={{ color: COLORS.accent }} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: COLORS.ink }}>No session history yet</h3>
            <p className="text-sm mt-1" style={{ color: COLORS.muted }}>
              You don't have any completed sessions at the moment.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {historySessions.map((s, idx) => {
            const name = s.mentorName || "Mentor";
            const photo = s.mentorProfilePhoto;
            const jobTitle = s.mentorJobTitle || "Mentor";
            const isOnline = !s.sessionType || s.sessionType.toLowerCase() === "virtual" || s.sessionType.toLowerCase() === "online";
            const sessionId = s.sessionId || s._id || `SH-${idx}`;
            const statusStyles = getStatusBadgeStyles(s.status || "Unknown");

            const hasReview =
              (s.review && (s.review.rating || s.review.menteeReview)) ||
              locallyReviewedIds.has(sessionId);
            const isCompletedStatus = (s.status || "").toLowerCase() === "completed" || (s.status || "").toLowerCase() === "done";
            const canReview = isCompletedStatus && !hasReview;

            return (
              <div
                key={sessionId}
                className="flex flex-col lg:flex-row items-start lg:items-start gap-5 lg:gap-0 p-5 rounded-2xl transition-all hover:shadow-md bg-white hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                style={{ border: `1px solid ${COLORS.hairline}` }}
              >
                {/* 1. Mentor Info */}
                <div className="flex items-center gap-3 w-full lg:w-[28%] shrink-0 lg:pr-4">
                  {photo ? (
                    <img
                      src={photo}
                      alt={name}
                      className="w-12 h-12 rounded-full object-cover shrink-0"
                      style={{ border: `1px solid ${COLORS.hairline}` }}
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-base font-bold text-white"
                      style={{ backgroundColor: COLORS.ink }}
                    >
                      {initialsFrom(name)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate" style={{ color: COLORS.ink }}>
                      {name}
                    </p>
                    <p className="text-xs truncate mt-0.5 mb-1.5" style={{ color: COLORS.muted }}>
                      {jobTitle}
                    </p>
                  </div>
                </div>

                {/* 2. Service & Status */}
                <div className="w-full lg:w-[24%] shrink-0 space-y-4 lg:px-4 lg:border-l" style={{ borderColor: COLORS.hairline }}>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: COLORS.muted }}>Service</p>
                    <p className="text-sm font-bold line-clamp-2" style={{ color: COLORS.ink }} title={s.title || "Mentorship Session"}>
                      {s.title || "Mentorship Session"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: COLORS.muted }}>Session Status</p>
                    <span
                      className="inline-flex text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider"
                      style={{ backgroundColor: statusStyles.bg, color: statusStyles.text }}
                    >
                      {s.status || "Unknown"}
                    </span>
                  </div>
                </div>

                {/* 3. Date & Duration */}
                <div className="w-full lg:w-[24%] shrink-0 space-y-2 lg:px-4 lg:border-l pt-1 lg:pt-0" style={{ borderColor: COLORS.hairline }}>
                  <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: COLORS.ink }}>
                    <CalendarClock className="w-3.5 h-3.5 shrink-0" style={{ color: COLORS.muted }} />
                    <span>{formatDateStr(s.startTime || s.scheduledAt)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: COLORS.ink }}>
                    <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: COLORS.muted }} />
                    <span>
                      {formatTimeStr(s.startTime || s.scheduledAt)}
                      {s.duration ? ` (${s.duration} min)` : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: COLORS.muted }}>
                    {isOnline ? (
                      <Video className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>{isOnline ? "Online Meeting" : "In Person"}</span>
                  </div>
                </div>

                {/* 4. Review & Actions */}
                <div className="flex flex-col gap-4 shrink-0 w-full lg:w-[24%] lg:border-l lg:pl-4 pt-4 lg:pt-0 border-t lg:border-t-0 mt-2 lg:mt-0" style={{ borderColor: COLORS.hairline }}>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: COLORS.muted }}>Review Status</p>
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5" style={{ color: hasReview ? COLORS.gold : COLORS.faint, fill: hasReview ? COLORS.gold : "none" }} />
                      {hasReview ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-medium" style={{ color: COLORS.ink }}>
                            {s.review?.rating ? `${s.review.rating}/5` : "Reviewed"}
                          </span>
                          {s.review?.menteeReview && (
                            <button
                              onClick={() => setViewReviewSession(s)}
                              className="text-[10px] ml-1 font-semibold underline hover:text-[#7a5c3e] transition-colors"
                              style={{ color: COLORS.muted }}
                            >
                              View
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs font-medium" style={{ color: COLORS.muted }}>
                          Not reviewed
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-auto w-full">
                    {canReview && (
                      <button
                        onClick={() => setReviewTarget(s)}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors hover:border-[#c9baa9] text-center"
                        style={{ backgroundColor: "transparent", color: COLORS.ink, border: `1px solid ${COLORS.hairline}` }}
                      >
                        <Star className="w-3.5 h-3.5" />
                        Give Review
                      </button>
                    )}
                    <button
                      onClick={() => handleBookAgain(s)}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 hover:-translate-y-1 hover:shadow-md motion-reduce:hover:translate-y-0 motion-reduce:transition-none hover:bg-[#8b7355] shadow-sm text-center"
                      style={{ backgroundColor: COLORS.ink, color: "#fff" }}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Book Again
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {reviewTarget && (
        <UserDashboardReviewModal
          sessionId={reviewTarget.sessionId || reviewTarget._id || ""}
          mentorId={reviewTarget.mentorId || ""}
          mentorName={reviewTarget.mentorName}
          onClose={() => setReviewTarget(null)}
          onSuccess={() => {
            const sid = reviewTarget.sessionId || reviewTarget._id;
            if (sid) {
              setLocallyReviewedIds((prev) => {
                const next = new Set(prev);
                next.add(sid);
                return next;
              });
            }
            setReviewTarget(null);
          }}
        />
      )}

      {viewReviewSession && viewReviewSession.review && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl" style={{ border: `1px solid ${COLORS.hairline}` }}>
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: COLORS.hairline, backgroundColor: COLORS.softWash }}>
              <h3 className="font-bold text-lg" style={{ color: COLORS.ink }}>Your Review</h3>
              <button onClick={() => setViewReviewSession(null)} className="text-sm font-bold" style={{ color: COLORS.muted }}>✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold" style={{ color: COLORS.muted }}>Rating:</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-4 h-4"
                      style={{
                        color: (viewReviewSession.review?.rating || 0) >= star ? COLORS.gold : COLORS.hairline,
                        fill: (viewReviewSession.review?.rating || 0) >= star ? COLORS.gold : "none"
                      }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-1.5" style={{ color: COLORS.muted }}>Feedback:</p>
                <div className="p-3 rounded-xl text-sm" style={{ backgroundColor: COLORS.softWash, border: `1px solid ${COLORS.hairline}`, color: COLORS.ink }}>
                  {viewReviewSession.review?.menteeReview || "No written feedback provided."}
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end" style={{ borderColor: COLORS.hairline }}>
              <button
                onClick={() => setViewReviewSession(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors hover:bg-[#f6ede8]"
                style={{ color: COLORS.ink, border: `1px solid ${COLORS.hairline}` }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}