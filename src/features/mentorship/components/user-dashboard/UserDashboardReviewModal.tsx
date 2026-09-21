"use client";

import React, { useState } from "react";
import { Star, X, Loader2 } from "lucide-react";
import ReviewService, { REVIEW_TAGS, ReviewTag } from "@/lib/api/review.service";

const COLORS = {
  ink: "#4a3728",
  accent: "#7a5c3e",
  hairline: "#e0d8cf",
  wash: "#f6ede8",
  gold: "#c9932a",
  muted: "#8a7a6a",
};

const TAG_LABELS: Record<ReviewTag, string> = {
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

const MIN_COMMENT = 10;
const MAX_COMMENT = 1000;

interface UserDashboardReviewModalProps {
  sessionId: string;
  mentorId: string;
  mentorName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserDashboardReviewModal({
  sessionId,
  mentorId,
  mentorName,
  onClose,
  onSuccess,
}: UserDashboardReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<ReviewTag[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleTag = (tag: ReviewTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const canSubmit =
    rating >= 1 && comment.trim().length >= MIN_COMMENT && comment.length <= MAX_COMMENT;

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await ReviewService.submitReview({
        sessionId,
        mentorId,
        rating,
        comment: comment.trim(),
        tags: selectedTags,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
        style={{ border: `1px solid ${COLORS.hairline}` }}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold" style={{ color: COLORS.ink }}>
              Rate this session
            </h3>
            {mentorName && (
              <p className="text-sm mt-0.5" style={{ color: COLORS.muted }}>
                How was your session with {mentorName}?
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#f3ece4] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" style={{ color: COLORS.muted }} />
          </button>
        </div>

        <>
            {/* Star rating */}
            <div className="flex justify-center gap-1.5 mb-5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-0.5"
                >
                  <Star
                    className="w-8 h-8"
                    style={{
                      color: (hoverRating || rating) >= star ? COLORS.gold : COLORS.hairline,
                      fill: (hoverRating || rating) >= star ? COLORS.gold : "transparent",
                    }}
                  />
                </button>
              ))}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 justify-center mb-5">
              {REVIEW_TAGS.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
                    style={{
                      backgroundColor: active ? COLORS.ink : "#fff",
                      color: active ? "#fff" : COLORS.accent,
                      borderColor: active ? COLORS.ink : COLORS.hairline,
                    }}
                  >
                    {TAG_LABELS[tag]}
                  </button>
                );
              })}
            </div>

            {/* Comment */}
            <div className="mb-2">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={MAX_COMMENT}
                rows={4}
                placeholder="How was your session? What did you like, and what could be improved?"
                className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none resize-none"
                style={{ border: `1px solid ${COLORS.hairline}`, color: COLORS.ink }}
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs" style={{ color: COLORS.muted }}>
                  Minimum {MIN_COMMENT} characters
                </span>
                <span className="text-xs" style={{ color: COLORS.muted }}>
                  {comment.length}/{MAX_COMMENT}
                </span>
              </div>
            </div>

            {error && (
              <p className="text-xs mb-3" style={{ color: "#dc2626" }}>
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-4" style={{ borderTop: `1px solid ${COLORS.hairline}` }}>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm border transition-colors disabled:opacity-50 hover:bg-[#f3ece4]"
                style={{ borderColor: COLORS.hairline, color: COLORS.ink, backgroundColor: COLORS.wash }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-50 hover:opacity-90"
                style={{ backgroundColor: COLORS.ink }}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? "Submitting..." : "Submit review"}
              </button>
            </div>
          </>
      </div>
    </div>
  );
}
