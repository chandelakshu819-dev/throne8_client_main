"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  CalendarClock,
  Clock,
  Video,
  MapPin,
  Star,
  RotateCcw, 
  History,
  MessageSquare,
  AlertCircle,
  Loader2,
  RefreshCw
} from "lucide-react";
import { useRouter } from "next/navigation";
import UserDashboardReviewModal from "./UserDashboardReviewModal";
import { routes } from "@/config/routes";
import SessionService from "@/lib/api/session.service";
import ReviewService, { MentorReview } from "@/lib/api/review.service";

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
};

interface Props {
  sessions?: any[]; // Ignored, we fetch fresh data
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

export default function UserDashboardSessionHistoryPage(_props: Props) {
  const router = useRouter();
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [reviewsMap, setReviewsMap] = useState<Record<string, MentorReview>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reviewTarget, setReviewTarget] = useState<Session | null>(null);
  const [viewReview, setViewReview] = useState<MentorReview | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [sessionsRes, reviewsData] = await Promise.all([
        SessionService.getAllSessions({ role: "mentee", limit: 100 }),
        ReviewService.getMyReviews()
      ]);
      
      const allSessions = sessionsRes?.data || [];
      setSessions(allSessions);
      
      const rMap: Record<string, MentorReview> = {};
      (reviewsData || []).forEach((r: MentorReview) => {
        if (r.sessionId) rMap[r.sessionId] = r;
      });
      setReviewsMap(rMap);
    } catch (err: any) {
      console.error("Failed to fetch session history data:", err);
      setError(err.message || "Failed to load session history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData();
  };

  const now = Date.now();
  
  // Filter history sessions
  const historySessions = sessions.filter((s) => {
    const status = (s.status || "").toUpperCase();
    const t = new Date(s.startTime || s.scheduledAt || 0).getTime();
    const isPast = t < now && t > 0;
    
    return ["COMPLETED", "DONE", "CANCELLED", "REJECTED"].includes(status) || (isPast && !["PENDING", "CONFIRMED"].includes(status));
  }).sort((a, b) => {
    const ta = new Date(a.startTime || a.scheduledAt || 0).getTime();
    const tb = new Date(b.startTime || b.scheduledAt || 0).getTime();
    return tb - ta; 
  });

  const getStatusBadgeStyles = (status: string) => {
    const s = status.toUpperCase();
    if (["COMPLETED", "DONE"].includes(s)) return { bg: COLORS.successWash, text: COLORS.success };
    if (["CANCELLED", "REFUNDED", "REJECTED"].includes(s)) return { bg: COLORS.dangerWash, text: COLORS.danger };
    if (["IN_PROGRESS"].includes(s)) return { bg: "#fff7ed", text: "#ea580c" };
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: COLORS.ink }}>
            Session History
          </h2>
          <p style={{ color: COLORS.muted }} className="text-sm mt-1">
            Review your past mentorship sessions and feedback.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-[#f6ede8] disabled:opacity-50"
          style={{ color: COLORS.ink, border: `1px solid ${COLORS.hairline}` }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex flex-col lg:flex-row gap-5 p-5 rounded-2xl bg-white" style={{ border: `1px solid ${COLORS.hairline}` }}>
              <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-3 py-1">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
              <div className="flex-1 space-y-3 py-1">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
              <div className="flex-1 space-y-3 py-1">
                <div className="h-8 bg-gray-200 rounded w-full" />
                <div className="h-8 bg-gray-200 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 rounded-2xl text-center" style={{ backgroundColor: COLORS.dangerWash, border: `1px solid #fca5a5` }}>
          <AlertCircle className="w-8 h-8 text-red-500" />
          <div>
            <h3 className="text-lg font-bold text-red-700">Failed to load history</h3>
            <p className="text-sm mt-1 text-red-600">{error}</p>
          </div>
          <button
            onClick={handleRefresh}
            className="mt-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : historySessions.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center gap-3 py-16 rounded-2xl text-center"
          style={{ backgroundColor: COLORS.softWash, border: `1px solid ${COLORS.hairline}` }}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.chip }}>
            <History className="w-8 h-8" style={{ color: COLORS.accent }} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: COLORS.ink }}>No mentorship sessions yet.</h3>
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
            const statusStyles = getStatusBadgeStyles(s.status || "UNKNOWN");

            const actualReview = reviewsMap[sessionId];
            const hasReview = !!actualReview;
            const isCompletedStatus = ["COMPLETED", "DONE"].includes((s.status || "").toUpperCase());
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
                      {s.status || "UNKNOWN"}
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
                            {actualReview.rating ? `${actualReview.rating}/5` : "Reviewed"}
                          </span>
                          {actualReview.comment && (
                            <button
                              onClick={() => setViewReview(actualReview)}
                              className="text-[10px] ml-1 font-semibold underline hover:text-[#7a5c3e] transition-colors"
                              style={{ color: COLORS.muted }}
                            >
                              View
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs font-medium" style={{ color: COLORS.muted }}>
                          {isCompletedStatus ? "Not reviewed" : "Not eligible"}
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
            setReviewTarget(null);
            fetchData(); // Refresh to get the new review and update UI
          }}
        />
      )}

      {viewReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl" style={{ border: `1px solid ${COLORS.hairline}` }}>
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: COLORS.hairline, backgroundColor: COLORS.softWash }}>
              <h3 className="font-bold text-lg" style={{ color: COLORS.ink }}>Your Review</h3>
              <button onClick={() => setViewReview(null)} className="text-sm font-bold" style={{ color: COLORS.muted }}>✕</button>
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
                        color: (viewReview.rating || 0) >= star ? COLORS.gold : COLORS.hairline,
                        fill: (viewReview.rating || 0) >= star ? COLORS.gold : "none"
                      }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-1.5" style={{ color: COLORS.muted }}>Feedback:</p>
                <div className="p-3 rounded-xl text-sm" style={{ backgroundColor: COLORS.softWash, border: `1px solid ${COLORS.hairline}`, color: COLORS.ink }}>
                  {viewReview.comment || "No written feedback provided."}
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end" style={{ borderColor: COLORS.hairline }}>
              <button
                onClick={() => setViewReview(null)}
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