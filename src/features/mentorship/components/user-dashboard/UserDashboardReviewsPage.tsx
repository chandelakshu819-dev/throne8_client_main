//src/features/mentorship/components/user-dashboard/UserDashboardReviewsPage.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Star, MessageSquare, RefreshCw, AlertCircle, CheckCircle2, Clock, Calendar, ArrowRight, Trash2 } from "lucide-react";
import UserDashboardReviewModal from "./UserDashboardReviewModal";
import ReviewService, { MentorReview, ReviewTag, REVIEW_TAGS } from "@/lib/api/review.service";
import SessionService from "@/lib/api/session.service";

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
  success: "#15803d",
  successWash: "#f0fdf4",
  danger: "#dc2626",
  dangerWash: "#fef2f2",
};

const TAG_LABELS: Record<string, string> = {
  helpful: "Helpful",
  knowledgeable: "Knowledgeable",
  patient: "Patient",
  prepared: "Prepared",
  punctual: "Punctual",
  friendly: "Friendly",
  professional: "Professional",
  insightful: "Insightful",
  responsive: "Responsive",
  exceeded_expectations: "Exceeded expectations",
};

export type Session = {
  _id?: string;
  sessionId?: string;
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
    createdAt?: string;
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

function initialsFrom(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "S";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function UserDashboardReviewsPage({ sessions: propSessions = [] }: Props) {
  const [activeTab, setActiveTab] = useState<"given" | "pending">("given");
  const [reviews, setReviews] = useState<MentorReview[]>([]);
  const [sessions, setSessions] = useState<Session[]>(propSessions);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [reviewModalSession, setReviewModalSession] = useState<Session | null>(null);
  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync internal sessions if prop updates
  useEffect(() => {
    if (propSessions && propSessions.length > 0) {
      setSessions(propSessions);
    }
  }, [propSessions]);

  // Fetch reviews and fallback sessions if needed
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const reviewPromises = ReviewService.getMyReviews();
      const sessionsPromise = SessionService.getAllSessions({ role: "mentee", limit: 100 })
        .then((res: any) => res?.data || [])
        .catch((err) => {
          console.error("Failed to load sessions in ReviewsPage:", err);
          return [];
        });

      const [reviewsResult, sessionsResult] = await Promise.all([
        reviewPromises,
        sessionsPromise,
      ]);

      setReviews(Array.isArray(reviewsResult) ? reviewsResult : []);
      if (sessionsResult) {
        setSessions(sessionsResult);
      }
    } catch (err: any) {
      console.error("Error loading reviews:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to load reviews. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [propSessions]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Map of session lookup by sessionId or _id
  const sessionMap = useMemo(() => {
    const map = new Map<string, Session>();
    sessions.forEach((s) => {
      if (s.sessionId) map.set(s.sessionId, s);
      if (s._id) map.set(s._id, s);
    });
    return map;
  }, [sessions]);

  const reviewedSessionIds = useMemo(() => {
    const set = new Set<string>();
    reviews.forEach((r) => {
      if (r.sessionId) set.add(r.sessionId);
    });
    return set;
  }, [reviews]);

  // "Pending Reviews": completed sessions without a submitted review
  const pendingSessions = useMemo(() => {
    return sessions
      .filter((s) => {
        const status = (s.status || "").toLowerCase();
        const isCompleted = status === "completed" || status === "done";
        const id1 = s.sessionId || "";
        const id2 = s._id || "";
        const isAlreadyReviewed = (id1 && reviewedSessionIds.has(id1)) || (id2 && reviewedSessionIds.has(id2));
        return isCompleted && !isAlreadyReviewed;
      })
      .sort((a, b) => {
        const ta = new Date(a.startTime || a.scheduledAt || 0).getTime();
        const tb = new Date(b.startTime || b.scheduledAt || 0).getTime();
        return tb - ta;
      });
  }, [sessions, reviewedSessionIds]);

  // "Reviews Given": real submitted reviews, enriched with session info where available
  const givenReviews = useMemo(() => {
    return [...reviews].sort((a, b) => {
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      return tb - ta;
    });
  }, [reviews]);

  // Handle successful review submission from modal
  const handleReviewSuccess = useCallback(() => {
    if (reviewModalSession) {
      const name = reviewModalSession.mentorName || "Mentor";
      setSuccessBanner(`Your review for ${name} was submitted successfully!`);
      // Auto-dismiss banner after 6 seconds
      setTimeout(() => setSuccessBanner(null), 6000);
    }
    // Instantly refresh reviews list to update both tabs
    fetchData();
    // Switch to Reviews Given tab so user sees their submission
    setActiveTab("given");
  }, [reviewModalSession, fetchData]);

  const handleDelete = async (reviewId: string) => {
    setIsDeleting(true);
    setError(null);
    try {
      await ReviewService.deleteReview(reviewId);
      setSuccessBanner("Review deleted successfully.");
      setTimeout(() => setSuccessBanner(null), 6000);
      setDeleteReviewId(null);
      fetchData();
    } catch (err: any) {
      console.error("Error deleting review:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to delete review.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl pt-2 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: COLORS.ink }}>
            Reviews & Feedback
          </h2>
          <p style={{ color: COLORS.muted }} className="text-sm mt-1">
            Manage your submitted reviews and pending feedback for past mentorship sessions.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="self-start sm:self-center flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors hover:bg-[#f3ece4] disabled:opacity-50"
          style={{ borderColor: COLORS.hairline, color: COLORS.ink, backgroundColor: "#fff" }}
          title="Refresh reviews"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div
          className="flex items-center justify-between p-4 rounded-xl text-sm border animate-fadeIn"
          style={{ backgroundColor: COLORS.successWash, borderColor: "#bbf7d0", color: COLORS.success }}
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="font-semibold">{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-xs font-bold hover:opacity-75 px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Banner with Retry */}
      {error && (
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl text-sm border"
          style={{ backgroundColor: COLORS.dangerWash, borderColor: "#fecaca", color: COLORS.danger }}
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchData}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-opacity hover:opacity-90"
            style={{ backgroundColor: COLORS.danger, color: "#fff" }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b" style={{ borderColor: COLORS.hairline }}>
        <button
          onClick={() => setActiveTab("given")}
          className={`pb-3 text-sm font-bold transition-colors relative ${
            activeTab === "given" ? "" : "opacity-60 hover:opacity-100"
          }`}
          style={{ color: activeTab === "given" ? COLORS.ink : COLORS.muted }}
        >
          Reviews Given ({isLoading ? "..." : givenReviews.length})
          {activeTab === "given" && (
            <span
              className="absolute bottom-0 left-0 w-full h-0.5 rounded-t-full"
              style={{ backgroundColor: COLORS.ink }}
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`pb-3 text-sm font-bold transition-colors relative ${
            activeTab === "pending" ? "" : "opacity-60 hover:opacity-100"
          }`}
          style={{ color: activeTab === "pending" ? COLORS.ink : COLORS.muted }}
        >
          Pending Reviews ({isLoading ? "..." : pendingSessions.length})
          {activeTab === "pending" && (
            <span
              className="absolute bottom-0 left-0 w-full h-0.5 rounded-t-full"
              style={{ backgroundColor: COLORS.ink }}
            />
          )}
        </button>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white animate-pulse"
              style={{ border: `1px solid ${COLORS.hairline}` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#f3ece4]" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-[#f3ece4] rounded w-1/4" />
                  <div className="h-3 bg-[#f3ece4] rounded w-1/3" />
                </div>
              </div>
              <div className="h-4 bg-[#f3ece4] rounded w-3/4 mb-2" />
              <div className="h-4 bg-[#f3ece4] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : activeTab === "given" ? (
        /* Reviews Given Tab */
        <div className="space-y-4">
          {givenReviews.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center gap-3 py-16 px-4 rounded-2xl text-center"
              style={{ backgroundColor: COLORS.softWash, border: `1px solid ${COLORS.hairline}` }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: COLORS.chip }}
              >
                <Star className="w-8 h-8" style={{ color: COLORS.accent }} />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: COLORS.ink }}>
                  No reviews given yet
                </h3>
                <p className="text-sm mt-1 max-w-sm" style={{ color: COLORS.muted }}>
                  When you review your completed mentorship sessions, your ratings and feedback will appear here.
                </p>
              </div>
              {pendingSessions.length > 0 && (
                <button
                  onClick={() => setActiveTab("pending")}
                  className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: COLORS.ink }}
                >
                  Review pending sessions ({pendingSessions.length})
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            givenReviews.map((r, idx) => {
              const matchedSession = sessionMap.get(r.sessionId);
              const mentorName = r.mentor?.firstName && r.mentor?.lastName ? `${r.mentor.firstName} ${r.mentor.lastName}` : matchedSession?.mentorName || "Mentor";
              const photo = r.mentor?.profilePhotoId || matchedSession?.mentorProfilePhoto;
              const sessionTitle = matchedSession?.title || "Mentorship Session";
              const sessionDate = formatDateStr(matchedSession?.startTime || matchedSession?.scheduledAt || r.createdAt);
              const reviewId = r.reviewId || r._id || r.id || `rev-${idx}`;
              const rating = r.rating || 0;
              const comment = r.comment || "No written feedback provided.";
              const tags = Array.isArray(r.tags) ? r.tags : [];

              return (
                <div
                  key={reviewId}
                  className="flex flex-col p-5 rounded-2xl transition-all hover:shadow-md bg-white hover:-translate-y-0.5"
                  style={{ border: `1px solid ${COLORS.hairline}` }}
                >
                  {/* Mentor Header */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {photo ? (
                        <img
                          src={photo}
                          alt={mentorName}
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                          style={{ border: `1px solid ${COLORS.hairline}` }}
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white"
                          style={{ backgroundColor: COLORS.ink }}
                        >
                          {initialsFrom(mentorName)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold truncate" style={{ color: COLORS.ink }}>
                            {mentorName}
                          </p>
                          {r.isVerified && (
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                              style={{ backgroundColor: COLORS.chip, color: COLORS.accent }}
                            >
                              Verified Session
                            </span>
                          )}
                        </div>
                        <p className="text-xs truncate mt-0.5" style={{ color: COLORS.muted }}>
                          {sessionTitle} • {sessionDate}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-right shrink-0" style={{ color: COLORS.muted }}>
                        {formatDateStr(r.createdAt)}
                      </span>
                      <button
                        onClick={() => setDeleteReviewId(reviewId)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-red-50 text-red-500 hover:text-red-600"
                        title="Delete Review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Rating & Review Content */}
                  <div className="pl-4 border-l-2 py-1 space-y-2.5" style={{ borderColor: COLORS.chip }}>
                    {/* Stars */}
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className="w-4 h-4"
                            style={{
                              color: star <= rating ? COLORS.gold : COLORS.chip,
                              fill: star <= rating ? COLORS.gold : "none",
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold" style={{ color: COLORS.ink }}>
                        {rating}.0
                      </span>
                    </div>

                    {/* Tags */}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                            style={{ backgroundColor: COLORS.softWash, color: COLORS.accent, border: `1px solid ${COLORS.hairline}` }}
                          >
                            {TAG_LABELS[tag] || tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Comment */}
                    <p className="text-sm leading-relaxed" style={{ color: COLORS.ink }}>
                      "{comment}"
                    </p>

                    {/* Mentor Response if available */}
                    {r.mentorResponse?.comment && (
                      <div
                        className="mt-3 p-3.5 rounded-xl text-xs space-y-1.5"
                        style={{ backgroundColor: COLORS.softWash, border: `1px solid ${COLORS.hairline}` }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold" style={{ color: COLORS.accent }}>
                            Response from {mentorName}
                          </span>
                          {r.mentorResponse.respondedAt && (
                            <span style={{ color: COLORS.muted }}>
                              {formatDateStr(r.mentorResponse.respondedAt)}
                            </span>
                          )}
                        </div>
                        <p style={{ color: COLORS.ink }}>
                          "{r.mentorResponse.comment}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Pending Reviews Tab */
        <div className="space-y-4">
          {pendingSessions.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center gap-3 py-16 px-4 rounded-2xl text-center"
              style={{ backgroundColor: COLORS.softWash, border: `1px solid ${COLORS.hairline}` }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: COLORS.chip }}
              >
                <MessageSquare className="w-8 h-8" style={{ color: COLORS.accent }} />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: COLORS.ink }}>
                  All caught up!
                </h3>
                <p className="text-sm mt-1 max-w-sm" style={{ color: COLORS.muted }}>
                  You have no pending reviews for your completed sessions.
                </p>
              </div>
              {givenReviews.length > 0 && (
                <button
                  onClick={() => setActiveTab("given")}
                  className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-colors hover:bg-[#f3ece4]"
                  style={{ borderColor: COLORS.hairline, color: COLORS.ink }}
                >
                  View your submitted reviews ({givenReviews.length})
                </button>
              )}
            </div>
          ) : (
            pendingSessions.map((s, idx) => {
              const name = s.mentorName || "Mentor";
              const photo = s.mentorProfilePhoto;
              const sessionId = s.sessionId || s._id || `P-${idx}`;
              const isAlreadyReviewed = reviewedSessionIds.has(sessionId) || (s._id ? reviewedSessionIds.has(s._id) : false);

              return (
                <div
                  key={sessionId}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-2xl transition-all hover:shadow-md bg-white hover:-translate-y-0.5"
                  style={{ border: `1px solid ${COLORS.hairline}` }}
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto mb-4 sm:mb-0">
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
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold truncate" style={{ color: COLORS.ink }}>
                          {name}
                        </p>
                        {s.mentorJobTitle && (
                          <span className="text-xs truncate hidden sm:inline" style={{ color: COLORS.muted }}>
                            • {s.mentorJobTitle}
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: COLORS.ink }}>
                        {s.title || "Mentorship Session"}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: COLORS.muted }}>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDateStr(s.startTime || s.scheduledAt)}
                        </span>
                        {s.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {s.duration} min
                          </span>
                        )}
                        <span
                          className="px-2 py-0.2 rounded-full text-[10px] font-semibold"
                          style={{ backgroundColor: COLORS.successWash, color: COLORS.success }}
                        >
                          Completed
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (!isAlreadyReviewed) {
                        setReviewModalSession(s);
                      }
                    }}
                    disabled={isAlreadyReviewed}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90 shadow-sm text-center disabled:opacity-50"
                    style={{
                      backgroundColor: isAlreadyReviewed ? COLORS.chip : COLORS.ink,
                      color: isAlreadyReviewed ? COLORS.muted : "#fff",
                    }}
                  >
                    <Star className="w-3.5 h-3.5" />
                    {isAlreadyReviewed ? "Reviewed" : "Give Review"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Review Modal */}
      {reviewModalSession && (
        <UserDashboardReviewModal
          sessionId={reviewModalSession.sessionId || reviewModalSession._id!}
          mentorId={reviewModalSession.mentorId!}
          mentorName={reviewModalSession.mentorName}
          onClose={() => setReviewModalSession(null)}
          onSuccess={handleReviewSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteReviewId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm animate-fadeIn">
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            style={{ border: `1px solid ${COLORS.hairline}` }}
          >
            <h3 className="text-lg font-bold mb-2" style={{ color: COLORS.ink }}>
              Delete Review?
            </h3>
            <p className="text-sm mb-6" style={{ color: COLORS.muted }}>
              Are you sure you want to delete this review? This action cannot be undone, but you will be able to submit a new review for this session.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteReviewId(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl font-semibold text-sm border transition-colors disabled:opacity-50 hover:bg-[#f3ece4]"
                style={{ borderColor: COLORS.hairline, color: COLORS.ink, backgroundColor: COLORS.wash }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteReviewId)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-50 hover:opacity-90 flex items-center gap-2"
                style={{ backgroundColor: COLORS.danger }}
              >
                {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
