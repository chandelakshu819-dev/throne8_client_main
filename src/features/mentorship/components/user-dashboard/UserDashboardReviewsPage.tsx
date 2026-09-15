import React, { useState } from "react";
import { Star, MessageSquare } from "lucide-react";
import WriteReviewModal from "../WriteReviewModal";

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
};

type Session = {
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

export default function UserDashboardReviewsPage({ sessions = [] }: Props) {
  const [activeTab, setActiveTab] = useState<"given" | "pending">("given");
  const [reviewModalSession, setReviewModalSession] = useState<Session | null>(null);

  const now = Date.now();

  // "Pending Reviews" are completed sessions without a review
  const pendingSessions = sessions.filter((s) => {
    const status = (s.status || "").toLowerCase();
    const isCompleted = status === "completed" || status === "done";
    const hasReview = s.review && (s.review.rating || s.review.menteeReview);
    return isCompleted && !hasReview;
  }).sort((a, b) => {
    const ta = new Date(a.startTime || a.scheduledAt || 0).getTime();
    const tb = new Date(b.startTime || b.scheduledAt || 0).getTime();
    return tb - ta;
  });

  // "Reviews Given" are sessions with a review
  const givenReviews = sessions.filter((s) => {
    const hasReview = s.review && (s.review.rating || s.review.menteeReview);
    return !!hasReview;
  }).sort((a, b) => {
    const ta = new Date(a.review?.createdAt || a.startTime || a.scheduledAt || 0).getTime();
    const tb = new Date(b.review?.createdAt || b.startTime || b.scheduledAt || 0).getTime();
    return tb - ta;
  });

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl pt-2 pb-8">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: COLORS.ink }}>
          Reviews & Feedback
        </h2>
        <p style={{ color: COLORS.muted }} className="text-sm mt-1">
          Manage your submitted reviews and pending feedback for past sessions.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b" style={{ borderColor: COLORS.hairline }}>
        <button
          onClick={() => setActiveTab("given")}
          className={`pb-3 text-sm font-bold transition-colors relative ${
            activeTab === "given" ? "" : "opacity-60 hover:opacity-100"
          }`}
          style={{ color: activeTab === "given" ? COLORS.ink : COLORS.muted }}
        >
          Reviews Given ({givenReviews.length})
          {activeTab === "given" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 rounded-t-full" style={{ backgroundColor: COLORS.ink }} />
          )}
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`pb-3 text-sm font-bold transition-colors relative ${
            activeTab === "pending" ? "" : "opacity-60 hover:opacity-100"
          }`}
          style={{ color: activeTab === "pending" ? COLORS.ink : COLORS.muted }}
        >
          Pending Reviews ({pendingSessions.length})
          {activeTab === "pending" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 rounded-t-full" style={{ backgroundColor: COLORS.ink }} />
          )}
        </button>
      </div>

      {/* Content */}
      {activeTab === "given" && (
        <div className="space-y-4">
          {givenReviews.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center gap-3 py-16 rounded-2xl text-center"
              style={{ backgroundColor: COLORS.softWash, border: `1px solid ${COLORS.hairline}` }}
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.chip }}>
                <Star className="w-8 h-8" style={{ color: COLORS.accent }} />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: COLORS.ink }}>No reviews given yet</h3>
                <p className="text-sm mt-1" style={{ color: COLORS.muted }}>
                  When you review a session, it will appear here.
                </p>
              </div>
            </div>
          ) : (
            givenReviews.map((s, idx) => {
              const name = s.mentorName || "Mentor";
              const photo = s.mentorProfilePhoto;
              const sessionId = s.sessionId || s._id || `R-${idx}`;
              const rating = s.review?.rating || 0;
              const comment = s.review?.menteeReview || "No written feedback provided.";

              return (
                <div
                  key={sessionId}
                  className="flex flex-col p-5 rounded-2xl transition-all hover:shadow-md bg-white hover:-translate-y-0.5"
                  style={{ border: `1px solid ${COLORS.hairline}` }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    {photo ? (
                      <img
                        src={photo}
                        alt={name}
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                        style={{ border: `1px solid ${COLORS.hairline}` }}
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white"
                        style={{ backgroundColor: COLORS.ink }}
                      >
                        {initialsFrom(name)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate" style={{ color: COLORS.ink }}>
                        {name}
                      </p>
                      <p className="text-xs truncate" style={{ color: COLORS.muted }}>
                        {s.title || "Mentorship Session"} • {formatDateStr(s.startTime || s.scheduledAt)}
                      </p>
                    </div>
                  </div>

                  <div className="pl-13 ml-2 border-l-2 py-1" style={{ borderColor: COLORS.chip, paddingLeft: "1.25rem" }}>
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className="w-4 h-4"
                          style={{
                            color: star <= rating ? COLORS.gold : COLORS.chip,
                            fill: star <= rating ? COLORS.gold : "none"
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-sm" style={{ color: COLORS.ink }}>
                      "{comment}"
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === "pending" && (
        <div className="space-y-4">
          {pendingSessions.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center gap-3 py-16 rounded-2xl text-center"
              style={{ backgroundColor: COLORS.softWash, border: `1px solid ${COLORS.hairline}` }}
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.chip }}>
                <MessageSquare className="w-8 h-8" style={{ color: COLORS.accent }} />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: COLORS.ink }}>All caught up!</h3>
                <p className="text-sm mt-1" style={{ color: COLORS.muted }}>
                  You have no pending reviews for your completed sessions.
                </p>
              </div>
            </div>
          ) : (
            pendingSessions.map((s, idx) => {
              const name = s.mentorName || "Mentor";
              const photo = s.mentorProfilePhoto;
              const sessionId = s.sessionId || s._id || `P-${idx}`;

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
                      <p className="text-sm font-bold truncate" style={{ color: COLORS.ink }}>
                        {name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: COLORS.ink }}>
                        {s.title || "Mentorship Session"}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: COLORS.muted }}>
                        {formatDateStr(s.startTime || s.scheduledAt)}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setReviewModalSession(s)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:bg-[#8b7355] shadow-sm text-center"
                    style={{ backgroundColor: COLORS.ink, color: "#fff" }}
                  >
                    <Star className="w-3.5 h-3.5" />
                    Give Review
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Review Modal */}
      {reviewModalSession && (
        <WriteReviewModal
          sessionId={reviewModalSession.sessionId || reviewModalSession._id!}
          mentorId={reviewModalSession.mentorId!}
          mentorName={reviewModalSession.mentorName}
          onClose={() => setReviewModalSession(null)}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  );
}
