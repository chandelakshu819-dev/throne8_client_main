// src/features/mentorship/components/admin/ReportedReviewsView.tsx
"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Search,
  Star,
  Flag,
  ShieldCheck,
  Trash2,
  MessageSquare,
} from "lucide-react";
import AdminService from "@/lib/api/admin.service";
import ProfileService from "@/lib/api/profile.service";

interface UserAvatarProps {
  photoUrl?: string | null;
  name: string;
  initials: string;
  className?: string;
}

function UserAvatar({ photoUrl, name, initials, className = "w-8 h-8" }: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [photoUrl]);

  if (photoUrl && !imgError) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={photoUrl}
        alt={name}
        loading="lazy"
        onError={() => setImgError(true)}
        className={`${className} rounded-full object-cover shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${className} rounded-full flex items-center justify-center font-bold text-xs shrink-0`}
      style={{ backgroundColor: "#f3ece4", color: "#4a3728" }}
    >
      {initials || "U"}
    </div>
  );
}

export interface ReportedReviewItem {
  _id?: string;
  reviewId: string;
  sessionId?: string;
  mentorId?: string;
  menteeId?: string;
  rating: number;
  comment?: string;
  reportCount: number;
  helpfulCount?: number;
  isVerified?: boolean;
  isPublic: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt?: string;
  reviewer?: {
    firstName?: string;
    lastName?: string;
    profilePhotoId?: string | null;
  } | null;
  mentor?: {
    mentorId?: string;
    name?: string;
    title?: string;
    profilePhotoId?: string | null;
  } | null;
  report?: {
    reason?: string;
    note?: string;
    reportedAt?: string;
    status?: string;
  };
  mentorReportCount?: number;
}

interface ReportedReviewsViewProps {
  onCountChange?: (count: number) => void;
}

const REASON_MIN = 5;
const REASON_MAX = 500;
const isReasonValid = (value: string) => {
  const len = value.trim().length;
  return len >= REASON_MIN && len <= REASON_MAX;
};

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  inappropriate: 'Inappropriate',
  fake: 'Fake',
  harassment: 'Harassment',
  other: 'Other',
};

export default function ReportedReviewsView({ onCountChange }: ReportedReviewsViewProps) {
  const [reviews, setReviews] = useState<ReportedReviewItem[]>([]);
  const [photosMap, setPhotosMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState<number | null>(null);

  // Modals state
  const [selectedReview, setSelectedReview] = useState<ReportedReviewItem | null>(null);
  const [approvingReview, setApprovingReview] = useState<ReportedReviewItem | null>(null);
  const [deletingReview, setDeletingReview] = useState<ReportedReviewItem | null>(null);

  const [modalReason, setModalReason] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  // In-flight action states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Parent passes an inline callback; keep it in a ref so it does not retrigger fetches.
  const onCountChangeRef = useRef(onCountChange);
  useEffect(() => {
    onCountChangeRef.current = onCountChange;
  }, [onCountChange]);

  // Only the latest request may update state (ignore stale responses).
  const requestIdRef = useRef(0);

  const fetchReportedReviews = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await AdminService.getReportedReviews({
        page,
        limit: 10,
      });
      if (requestId !== requestIdRef.current) return;

      const list = (res.data || []) as ReportedReviewItem[];
      const totalCount = res.meta?.total ?? list.length;
      const totalPages = res.meta?.totalPages ?? Math.max(1, Math.ceil(totalCount / 10));

      setReviews(list);
      setTotal(totalCount);
      setPages(totalPages);
      onCountChangeRef.current?.(totalCount);

      // Collect photo IDs for batch resolution
      const photoIds = list
        .map((r) => r.reviewer?.profilePhotoId)
        .filter((id): id is string => Boolean(id));

      if (photoIds.length > 0) {
        try {
          const photoRes = await ProfileService.getMultipleProfilePhotosByIds(photoIds);
          if (requestId !== requestIdRef.current) return;
          const map: Record<string, string> = {};
          (photoRes?.data?.photos || []).forEach(
            (p: { photoId?: string; cloudinarySecureUrl?: string }) => {
              if (p?.photoId && p?.cloudinarySecureUrl) {
                map[p.photoId] = p.cloudinarySecureUrl;
              }
            }
          );
          if (Object.keys(map).length > 0) {
            setPhotosMap((prev) => ({ ...prev, ...map }));
          }
        } catch {
          // Non-critical: Fallback to initials
        }
      }
    } catch (err: unknown) {
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : "Failed to load reported reviews.");
      setTotal(null);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchReportedReviews();
  }, [fetchReportedReviews]);

  // Escape key handler across all modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !actionLoadingId) {
        setSelectedReview(null);
        setApprovingReview(null);
        setDeletingReview(null);
        setModalReason("");
        setModalError(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [actionLoadingId]);

  // Moderation handler for keep and delete
  const handleModerate = async (
    review: ReportedReviewItem,
    action: "approve" | "delete"
  ) => {
    if (actionLoadingId) return;
    const trimmed = modalReason.trim();
    if (action === "delete" && !isReasonValid(modalReason)) {
      setModalError(`Reason must be ${REASON_MIN}-${REASON_MAX} characters.`);
      return;
    }

    setActionLoadingId(review.reviewId);
    setModalError(null);
    try {
      await AdminService.moderateReview(
        review.reviewId,
        action,
        trimmed || undefined
      );

      const actionLabels: Record<string, string> = {
        approve: "Report dismissed. Review stays public.",
        delete: "Review deleted.",
      };
      setActionSuccess(actionLabels[action]);

      // Both keep and delete remove the row from this list
      const remaining = reviews.filter((r) => r.reviewId !== review.reviewId);
      setReviews(remaining);
      const newTotal = Math.max(0, (total ?? 1) - 1);
      setTotal(newTotal);
      onCountChangeRef.current?.(newTotal);

      // Page emptied but more items exist: load the previous/current page again.
      if (remaining.length === 0 && newTotal > 0) {
        if (page > 1) setPage((p) => Math.max(1, p - 1));
        else void fetchReportedReviews();
      }

      // Close modals
      setSelectedReview(null);
      setApprovingReview(null);
      setDeletingReview(null);
      setModalReason("");

      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Failed to ${action} review.`;
      setModalError(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter reviews locally by search query
  const filteredReviews = reviews.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const reviewerName = `${r.reviewer?.firstName || ""} ${r.reviewer?.lastName || ""}`.toLowerCase();
    const mentorName = (r.mentor?.name || "").toLowerCase();
    const comment = (r.comment || "").toLowerCase();
    return reviewerName.includes(q) || mentorName.includes(q) || comment.includes(q);
  });

  return (
    <div className="space-y-4">
      {/* Top Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#ece4db]">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7a6a]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by reviewer, mentor, comment..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-[#e0d8cf] bg-[#fbf7f3] text-[#4a3728] focus:outline-none focus:border-[#4a3728]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-medium text-[#8a7a6a]">
            Total:{" "}
            <span className="font-bold text-[#4a3728]">
              {total !== null && !error ? total : "—"}
            </span>{" "}
            reported review{total === 1 && !error ? "" : "s"}
          </div>
          <button
            type="button"
            onClick={() => fetchReportedReviews()}
            disabled={loading}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-[#e0d8cf] bg-[#fbf7f3] text-[#4a3728] hover:bg-[#f3ece4] disabled:opacity-50 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 rounded-lg text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg text-xs bg-red-50 text-red-800 border border-red-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchReportedReviews()}
            disabled={loading}
            className="text-xs px-2.5 py-1 rounded-md border border-red-300 bg-white text-red-700 hover:bg-red-50 disabled:opacity-50 font-medium transition-colors shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Reported Reviews Table */}
      {loading && reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#ece4db] overflow-hidden">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#7a5c3e]" />
          </div>
        </div>
      ) : error && reviews.length === 0 ? null : (
        <div className="bg-white rounded-xl border border-[#ece4db] overflow-hidden">
          {!error && filteredReviews.length === 0 ? (
            <div className="text-center py-16 text-[#8a7a6a] text-sm">
              {searchQuery ? "No matching reported reviews found." : "No reported reviews"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#ece4db] bg-[#faf6f1] text-[#7a5c3e]">
                    <th className="py-3 px-4 font-semibold">Reviewer</th>
                    <th className="py-3 px-4 font-semibold">Mentor</th>
                    <th className="py-3 px-4 font-semibold">Rating</th>
                    <th className="py-3 px-4 font-semibold">Comment</th>
                    <th className="py-3 px-4 font-semibold">Reports</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ece4db]">
                  {filteredReviews.map((review) => {
                    const isUpdating = actionLoadingId === review.reviewId;
                    const reviewerName = review.reviewer?.firstName
                      ? `${review.reviewer.firstName} ${review.reviewer.lastName || ""}`.trim()
                      : "Anonymous Mentee";
                    const reviewerInitials = reviewerName
                      .split(" ")
                      .map((n) => n[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();
                    const avatarUrl = review.reviewer?.profilePhotoId
                      ? photosMap[review.reviewer.profilePhotoId]
                      : null;

                    const formattedDate = review.createdAt
                      ? new Date(review.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—";

                    const commentText = review.comment ?? "";
                    const isCommentLong = commentText.length > 110;
                    const displayedComment = isCommentLong
                      ? `${commentText.slice(0, 110)}...`
                      : commentText;

                    return (
                      <tr
                        key={review.reviewId}
                        className="hover:bg-[#faf6f1]/60 transition-colors"
                      >
                        {/* Reviewer */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="flex items-center gap-2.5">
                            <UserAvatar
                              photoUrl={avatarUrl}
                              name={reviewerName}
                              initials={reviewerInitials}
                              className="w-8 h-8"
                            />
                            <div>
                              <div className="font-semibold text-[#4a3728]">{reviewerName}</div>
                              <div className="text-[10px] text-[#8a7a6a]">Mentee</div>
                            </div>
                          </div>
                        </td>

                        {/* Mentor */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-semibold text-[#4a3728]">
                            {review.mentor?.name || "Mentor"}
                          </div>
                          {review.mentor?.title && (
                            <div className="text-[10px] text-[#8a7a6a] line-clamp-1 max-w-[150px]">
                              {review.mentor.title}
                            </div>
                          )}
                        </td>

                        {/* Rating */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <div className="flex items-center gap-1 font-semibold text-[#4a3728]">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{Number(review.rating ?? 0).toFixed(1)}</span>
                          </div>
                        </td>

                        {/* Comment */}
                        <td className="py-3.5 px-4 align-top max-w-[280px]">
                          <p className="text-[#4a3728] leading-relaxed break-words">
                            {displayedComment}
                          </p>
                          {isCommentLong && (
                            <button
                              type="button"
                              onClick={() => setSelectedReview(review)}
                              className="text-[11px] text-[#7a5c3e] font-semibold hover:underline mt-0.5"
                            >
                              Read full review
                            </button>
                          )}
                        </td>

                        {/* Reports */}
                        <td className="py-3.5 px-4 align-top">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                            <Flag className="w-3 h-3 text-red-600" />
                            <span>
                              {review.reportCount} report{review.reportCount === 1 ? "" : "s"}
                            </span>
                          </span>
                          <div className="mt-1.5 space-y-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              Reported by mentor
                            </span>
                            {review.report?.reason && (
                              <div className="text-[10px] text-[#4a3728]">
                                Reason:{" "}
                                <span className="font-semibold">
                                  {REASON_LABELS[review.report.reason] || review.report.reason}
                                </span>
                              </div>
                            )}
                            {review.report?.note && (
                              <div className="text-[10px] text-[#8a7a6a] max-w-[160px] line-clamp-2">
                                &ldquo;{review.report.note}&rdquo;
                              </div>
                            )}
                            {review.mentorReportCount != null && review.mentorReportCount > 1 && (
                              <div
                                className="text-[10px] text-amber-700 font-medium"
                                title="High report count may indicate misuse"
                              >
                                ⚠ {review.mentorReportCount} reports by this mentor
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          {review.isPublic ? (
                            <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              Public
                            </span>
                          ) : (
                            <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              Hidden
                            </span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 align-top text-[#8a7a6a] whitespace-nowrap">
                          {formattedDate}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                          {isUpdating ? (
                            <Loader2 className="w-4 h-4 animate-spin inline-block text-[#7a5c3e]" />
                          ) : (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedReview(review)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border border-[#e0d8cf] text-[#4a3728] hover:bg-[#fbf7f3] transition-colors cursor-pointer"
                                title="View full details"
                              >
                                <Eye className="w-3 h-3 text-[#7a5c3e]" />
                                <span>View</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setApprovingReview(review);
                                  setModalReason("");
                                  setModalError(null);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                                title="Dismiss reports and keep review public"
                              >
                                <ShieldCheck className="w-3 h-3" />
                                <span>Keep</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setDeletingReview(review);
                                  setModalReason("");
                                  setModalError(null);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
                                title="Delete review permanently"
                              >
                                <Trash2 className="w-3 h-3 text-red-600" />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination footer */}
          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#ece4db] bg-[#faf6f1]">
              <span className="text-xs text-[#8a7a6a]">
                Page {page} of {pages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                  className="p-1 rounded border border-[#e0d8cf] disabled:opacity-40 hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-[#4a3728]" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page >= pages || loading}
                  className="p-1 rounded border border-[#e0d8cf] disabled:opacity-40 hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-[#4a3728]" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Details Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-[#ece4db] shadow-2xl flex flex-col">
            <div className="p-6 border-b border-[#ece4db] flex items-start justify-between bg-[#faf6f1]">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-5 h-5 text-[#7a5c3e]" />
                <div>
                  <h3 className="text-base font-bold text-[#4a3728]">Reported Review Details</h3>
                  <p className="text-xs text-[#8a7a6a]">
                    ID: <code className="text-[#4a3728]">{selectedReview.reviewId}</code>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                className="p-1.5 rounded-lg text-[#8a7a6a] hover:bg-[#ece4db] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#faf6f1] p-3 rounded-xl border border-[#ece4db]">
                <div>
                  <span className="text-[#8a7a6a] block text-[11px]">Reviewer:</span>
                  <span className="font-semibold text-[#4a3728]">
                    {selectedReview.reviewer?.firstName
                      ? `${selectedReview.reviewer.firstName} ${selectedReview.reviewer.lastName || ""}`.trim()
                      : "Anonymous Mentee"}
                  </span>
                </div>
                <div>
                  <span className="text-[#8a7a6a] block text-[11px]">Mentor:</span>
                  <span className="font-semibold text-[#4a3728]">
                    {selectedReview.mentor?.name || "Mentor"}
                  </span>
                </div>
                <div>
                  <span className="text-[#8a7a6a] block text-[11px]">Rating:</span>
                  <span className="font-semibold text-[#4a3728] flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {selectedReview.rating} / 5
                  </span>
                </div>
                <div>
                  <span className="text-[#8a7a6a] block text-[11px]">Reports:</span>
                  <span className="font-bold text-red-700">
                    {selectedReview.reportCount} report{selectedReview.reportCount === 1 ? "" : "s"}
                  </span>
                </div>
              </div>

              {/* Report Details */}
              {selectedReview.report && (
                <div className="bg-amber-50/60 border border-amber-200 p-3 rounded-xl space-y-2">
                  <span className="text-[11px] font-semibold text-amber-800 flex items-center gap-1.5">
                    <Flag className="w-3 h-3 text-amber-600" />
                    Reported by mentor
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[#8a7a6a] block">Reason:</span>
                      <span className="font-semibold text-[#4a3728]">
                        {REASON_LABELS[selectedReview.report.reason || ""] || selectedReview.report.reason || "—"}
                      </span>
                    </div>
                    {selectedReview.report.reportedAt && (
                      <div>
                        <span className="text-[#8a7a6a] block">Reported:</span>
                        <span className="font-semibold text-[#4a3728]">
                          {new Date(selectedReview.report.reportedAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                  {selectedReview.report.note && (
                    <div>
                      <span className="text-[#8a7a6a] block text-[11px]">Note from mentor:</span>
                      <p className="text-[#4a3728] text-[11px] leading-relaxed mt-0.5">
                        {selectedReview.report.note}
                      </p>
                    </div>
                  )}
                  {selectedReview.mentorReportCount != null && (
                    <div className="text-[11px] text-amber-700 font-medium pt-1 border-t border-amber-200">
                      Reports by this mentor: {selectedReview.mentorReportCount}
                      {selectedReview.mentorReportCount > 2 && (
                        <span className="ml-1 text-[10px] text-amber-600">
                          (frequent reporter — review for potential misuse)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <span className="text-[#8a7a6a] block text-[11px] mb-1 font-medium">Full Review:</span>
                <div className="p-3 bg-white border border-[#ece4db] rounded-xl text-[#4a3728] leading-relaxed whitespace-pre-wrap">
                  {selectedReview.comment}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#ece4db] bg-[#faf6f1] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#4a3728] text-white hover:bg-[#38291e] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keep Review Confirmation Modal */}
      {approvingReview && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#ece4db] shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-[#4a3728]">Keep Review</h3>
                <p className="text-xs text-[#8a7a6a] mt-1">
                  {approvingReview.isPublic
                    ? "Dismiss reports and keep this review public on the mentor\u2019s profile?"
                    : "This review is currently hidden. Keeping it makes it public again on the mentor\u2019s profile."}{" "}
                  The report counter will be reset to 0.
                </p>
              </div>
            </div>

            {modalError && (
              <div className="p-3 rounded-lg text-xs bg-red-50 text-red-700 border border-red-200">
                {modalError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#ece4db]">
              <button
                type="button"
                onClick={() => {
                  setApprovingReview(null);
                  setModalError(null);
                }}
                disabled={actionLoadingId === approvingReview.reviewId}
                className="px-4 py-2 rounded-lg text-xs font-semibold border border-[#e0d8cf] text-[#4a3728] hover:bg-[#faf6f1] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleModerate(approvingReview, "approve")}
                disabled={actionLoadingId === approvingReview.reviewId}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {actionLoadingId === approvingReview.reviewId ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Working...</span>
                  </>
                ) : (
                  <span>Confirm Keep</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Delete Review Modal */}
      {deletingReview && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#ece4db] shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-red-700">Delete Review</h3>
                <p className="text-xs text-[#8a7a6a] mt-1">
                  Are you sure you want to delete this review? It is removed from the mentor&apos;s profile and from this list, and cannot be restored from the admin panel.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4a3728] mb-1">
                Reason (required)
              </label>
              <textarea
                value={modalReason}
                onChange={(e) => setModalReason(e.target.value)}
                placeholder="Explain why this review is being deleted (minimum 5 characters)..."
                rows={3}
                disabled={actionLoadingId === deletingReview.reviewId}
                className="w-full text-xs p-3 rounded-lg border border-[#e0d8cf] bg-[#fbf7f3] text-[#4a3728] focus:outline-none focus:border-[#4a3728]"
              />
              <div className="flex justify-between text-[11px] text-[#8a7a6a] mt-1">
                <span>Minimum {REASON_MIN} characters</span>
                <span className={!isReasonValid(modalReason) ? "text-red-600 font-medium" : "text-emerald-700"}>
                  {modalReason.trim().length} / {REASON_MAX}
                </span>
              </div>
            </div>

            {modalError && (
              <div className="p-3 rounded-lg text-xs bg-red-50 text-red-700 border border-red-200">
                {modalError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#ece4db]">
              <button
                type="button"
                onClick={() => {
                  setDeletingReview(null);
                  setModalReason("");
                  setModalError(null);
                }}
                disabled={actionLoadingId === deletingReview.reviewId}
                className="px-4 py-2 rounded-lg text-xs font-semibold border border-[#e0d8cf] text-[#4a3728] hover:bg-[#faf6f1] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleModerate(deletingReview, "delete")}
                disabled={actionLoadingId === deletingReview.reviewId || !isReasonValid(modalReason)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {actionLoadingId === deletingReview.reviewId ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Working...</span>
                  </>
                ) : (
                  <span>Confirm Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
