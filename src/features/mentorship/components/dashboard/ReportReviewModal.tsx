// src/features/mentorship/components/dashboard/ReportReviewModal.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Flag, Loader2, X, AlertTriangle } from "lucide-react";
import ReviewService from "@/lib/api/review.service";

const REASON_OPTIONS = [
  { value: "spam", label: "Spam" },
  { value: "inappropriate", label: "Inappropriate" },
  { value: "fake", label: "Fake" },
  { value: "harassment", label: "Harassment" },
  { value: "other", label: "Other" },
];

interface ReportReviewModalProps {
  reviewId: string;
  reviewerName: string;
  onClose: () => void;
  onSuccess?: (reviewId: string) => void;
  onReported?: (reviewId: string) => void;
}

export default function ReportReviewModal({
  reviewId,
  reviewerName,
  onClose,
  onSuccess,
  onReported,
}: ReportReviewModalProps) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape (disabled while submitting)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, submitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setError("Please select a reason.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await ReviewService.reportReview(reviewId, reason, note || undefined);
      onReported?.(reviewId);
      onSuccess?.(reviewId);
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { status?: number; data?: { message?: string } }; status?: number; message?: string }
      const status = errorObj?.response?.status || errorObj?.status
      const errorMsg =
        errorObj?.response?.data?.message ||
        errorObj?.message ||
        "Failed to submit report. Please try again."

      // On 409: treat as already reported (close modal, call onReported)
      if (status === 409 || (typeof errorMsg === "string" && errorMsg.includes("already reported"))) {
        onReported?.(reviewId);
        onSuccess?.(reviewId);
        onClose();
        return;
      }

      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current && !submitting) onClose();
      }}
    >
      <div className="bg-white rounded-2xl max-w-md w-full border border-[#ece4db] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[#ece4db] bg-[#faf6f1]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#4a3728]">Report Review</h3>
              <p className="text-[11px] text-[#8a7a6a] mt-0.5">
                Review by{" "}
                <span className="font-semibold text-[#4a3728]">{reviewerName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-[#8a7a6a] hover:bg-[#ece4db] transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Info banner */}
          <div className="flex gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
            <span>
              An admin will review this report. The review stays visible until the admin decides.
            </span>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-[#4a3728] mb-2">
              Reason <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {REASON_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer text-xs transition-colors ${
                    reason === opt.value
                      ? "border-[#7a5c3e] bg-[#fbf7f3] text-[#4a3728] font-semibold"
                      : "border-[#e0d8cf] text-[#6b5a4e] hover:bg-[#faf6f1]"
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={opt.value}
                    checked={reason === opt.value}
                    onChange={() => setReason(opt.value)}
                    disabled={submitting}
                    className="accent-[#7a5c3e]"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Optional note (max 300) */}
          <div>
            <label className="block text-xs font-semibold text-[#4a3728] mb-1">
              Additional details{" "}
              <span className="font-normal text-[#8a7a6a]">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="Describe the issue in more detail..."
              disabled={submitting}
              className="w-full text-xs p-3 rounded-lg border border-[#e0d8cf] bg-[#fbf7f3] text-[#4a3728] focus:outline-none focus:border-[#7a5c3e] resize-none"
            />
            <div className="text-right text-[10px] text-[#8a7a6a] mt-0.5">
              {note.length}/300
            </div>
          </div>

          {/* Real error message inside modal */}
          {error && (
            <div className="p-3 rounded-lg text-xs bg-red-50 text-red-700 border border-red-200">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1 border-t border-[#ece4db]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-xs font-semibold border border-[#e0d8cf] text-[#4a3728] hover:bg-[#faf6f1] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !reason}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Flag className="w-3.5 h-3.5" />
                  <span>Submit Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
