// src/features/mentorship/components/admin/AllReviewsView.tsx
"use client";

import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
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
  Trash2,
  MessageSquare,
  RotateCcw,
  Info,
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

export interface ReviewItem {
  reviewId: string;
  sessionId?: string;
  mentorId?: string;
  menteeId?: string;
  rating: number;
  comment?: string;
  reportCount?: number;
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
  } | null;
  mentorReportCount?: number;
}

const REASON_MIN = 5;
const REASON_MAX = 500;
const isReasonValid = (value: string) => {
  const len = value.trim().length;
  return len >= REASON_MIN && len <= REASON_MAX;
};

const REASON_LABELS: Record<string, string> = {
  spam: "Spam",
  inappropriate: "Inappropriate",
  fake: "Fake",
  harassment: "Harassment",
  other: "Other",
};

export default function AllReviewsView() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [photosMap, setPhotosMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [reportedOnly, setReportedOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState<number | null>(null);

  // Modals state
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [deletingReview, setDeletingReview] = useState<ReviewItem | null>(null);
  const [modalReason, setModalReason] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  // Action states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Request ID ref to ignore stale responses
  const requestIdRef = useRef(0);

  const fetchReviews = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const res = await AdminService.getAllReviews({
        page,
        limit: 10,
        rating: ratingFilter === "all" ? undefined : Number(ratingFilter),
        status: statusFilter === "all" ? undefined : statusFilter,
        reported: reportedOnly ? true : undefined,
      });

      if (requestId !== requestIdRef.current) return;

      const list = (res.data || []) as ReviewItem[];
      const totalCount = res.meta?.total ?? list.length;
      const totalPages = res.meta?.totalPages ?? Math.max(1, Math.ceil(totalCount / 10));

      setReviews(list);
      setTotal(totalCount);
      setPages(totalPages);

      // Collect reviewer photo IDs for batch resolution
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
      setError(err instanceof Error ? err.message : "Failed to load reviews.");
      setTotal(null);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [page, ratingFilter, statusFilter, reportedOnly]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Escape key handler across modals (blocked during active mutation)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !actionLoadingId) {
        setSelectedReview(null);
        setDeletingReview(null);
        setModalReason("");
        setModalError(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [actionLoadingId]);

  // Filter change handlers - reset to page 1
  const handleRatingChange = (val: string) => {
    setRatingFilter(val);
    setPage(1);
  };

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    setPage(1);
  };

  const handleReportedToggle = (checked: boolean) => {
    setReportedOnly(checked);
    setPage(1);
  };

  const clearFilters = () => {
    setRatingFilter("all");
    setStatusFilter("all");
    setReportedOnly(false);
    setSearchQuery("");
    setPage(1);
  };

  const isFiltersActive =
    ratingFilter !== "all" ||
    statusFilter !== "all" ||
    reportedOnly ||
    searchQuery.trim().length > 0;

  // Client-side search filters the loaded page only (reviewer, mentor, comment)
  const filteredReviews = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return reviews;

    return reviews.filter((r) => {
      const reviewerName = `${r.reviewer?.firstName || ""} ${r.reviewer?.lastName || ""}`.toLowerCase();
      const mentorName = (r.mentor?.name || "").toLowerCase();
      const mentorTitle = (r.mentor?.title || "").toLowerCase();
      const comment = (r.comment || "").toLowerCase();

      return (
        reviewerName.includes(query) ||
        mentorName.includes(query) ||
        mentorTitle.includes(query) ||
        comment.includes(query)
      );
    });
  }, [reviews, searchQuery]);

  // Handle Delete Review action
  const handleDeleteReview = async (review: ReviewItem) => {
    if (actionLoadingId) return;
    const trimmed = modalReason.trim();

    if (!isReasonValid(modalReason)) {
      setModalError(`Reason must be ${REASON_MIN}-${REASON_MAX} characters.`);
      return;
    }

    setActionLoadingId(review.reviewId);
    setModalError(null);

    try {
      await AdminService.moderateReview(review.reviewId, "delete", trimmed);

      setActionSuccess("Review deleted successfully.");

      // Update the row in place: mark as deleted and hide
      setReviews((prev) =>
        prev.map((r) =>
          r.reviewId === review.reviewId
            ? { ...r, isDeleted: true, isPublic: false }
            : r
        )
      );

      // Close modal
      setDeletingReview(null);
      setModalReason("");
      setModalError(null);

      // Auto-hide success toast after 4s
      setTimeout(() => {
        setActionSuccess(null);
      }, 4000);
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : "Failed to delete review.");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionSuccess && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 rounded-xl text-sm flex items-center justify-between border shadow-sm animate-in fade-in"
          style={{
            backgroundColor: "#f0fdf4",
            borderColor: "#bbf7d0",
            color: "#166534",
          }}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="p-1 rounded-md text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header and Controls */}
      <div
        className="p-6 rounded-2xl border"
        style={{
          backgroundColor: "#fff",
          borderColor: "#ece4db",
          boxShadow: "0 1px 2px rgba(74, 55, 40, 0.04)",
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-5 border-b border-[#ece4db]">
          <div>
            <h2 className="text-xl font-bold" style={{ color: "#4a3728" }}>
              All Reviews
            </h2>
            <p className="text-xs mt-1" style={{ color: "#8a7a6a" }}>
              Browse and inspect all submitted reviews. Total:{" "}
              <span className="font-semibold" style={{ color: "#4a3728" }}>
                {loading || error ? "—" : total ?? "—"}
              </span>
            </p>
          </div>

          {/* Hint banner */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium"
            style={{ backgroundColor: "#fbf7f3", border: "1px solid #e0d8cf", color: "#7a5c3e" }}
          >
            <Info className="w-4 h-4 shrink-0 text-[#a3907e]" />
            <span>Use Reported Reviews to dismiss reports</span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
          {/* Client-side search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a7a6a]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reviewer, mentor, text..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border outline-none transition-colors"
              style={{
                backgroundColor: "#fff",
                borderColor: "#e0d8cf",
                color: "#4a3728",
              }}
            />
          </div>

          {/* Rating filter */}
          <div>
            <select
              value={ratingFilter}
              onChange={(e) => handleRatingChange(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border outline-none transition-colors font-medium"
              style={{
                backgroundColor: "#fff",
                borderColor: "#e0d8cf",
                color: "#4a3728",
              }}
            >
              <option value="all">Rating: All</option>
              <option value="5">Rating: 5 Stars</option>
              <option value="4">Rating: 4 Stars</option>
              <option value="3">Rating: 3 Stars</option>
              <option value="2">Rating: 2 Stars</option>
              <option value="1">Rating: 1 Star</option>
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border outline-none transition-colors font-medium"
              style={{
                backgroundColor: "#fff",
                borderColor: "#e0d8cf",
                color: "#4a3728",
              }}
            >
              <option value="all">Status: All</option>
              <option value="public">Status: Public</option>
              <option value="hidden">Status: Hidden</option>
              <option value="deleted">Status: Deleted</option>
            </select>
          </div>

          {/* Reported only checkbox */}
          <div className="flex items-center justify-between sm:justify-start gap-3 px-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-[#4a3728]">
              <input
                type="checkbox"
                checked={reportedOnly}
                onChange={(e) => handleReportedToggle(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#4a3728] focus:ring-[#4a3728]"
              />
              <span>Reported only</span>
            </label>

            {isFiltersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-[#8a7a6a] hover:text-[#4a3728] underline underline-offset-2 ml-auto sm:ml-2"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area - Mutually Exclusive States */}
      {loading && reviews.length === 0 ? (
        /* First-load spinner */
        <div
          className="p-16 rounded-2xl border text-center flex flex-col items-center justify-center space-y-3"
          style={{ backgroundColor: "#fff", borderColor: "#ece4db" }}
        >
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#7a5c3e" }} />
          <p className="text-xs font-medium" style={{ color: "#8a7a6a" }}>
            Loading reviews...
          </p>
        </div>
      ) : error ? (
        /* Error banner with Retry */
        <div
          className="p-8 rounded-2xl border flex flex-col items-center justify-center text-center space-y-3"
          style={{
            backgroundColor: "#fdecea",
            borderColor: "#fca5a5",
            color: "#b91c1c",
          }}
        >
          <AlertCircle className="w-8 h-8" />
          <div>
            <h3 className="text-sm font-bold">Failed to load reviews</h3>
            <p className="text-xs mt-1 opacity-90">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => void fetchReviews()}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-[#b91c1c] text-[#b91c1c] hover:bg-red-50 transition-colors shadow-sm"
          >
            Retry
          </button>
        </div>
      ) : filteredReviews.length === 0 ? (
        /* Empty State */
        <div
          className="p-16 rounded-2xl border text-center flex flex-col items-center justify-center space-y-3"
          style={{ backgroundColor: "#fff", borderColor: "#ece4db" }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: "#f3ece4", color: "#7a5c3e" }}
          >
            <Star className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: "#4a3728" }}>
              No reviews found
            </h3>
            <p className="text-xs mt-1 max-w-sm" style={{ color: "#8a7a6a" }}>
              {isFiltersActive
                ? "No reviews match the selected filter criteria."
                : "No reviews have been submitted in the mentorship module yet."}
            </p>
          </div>
          {isFiltersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors"
              style={{
                backgroundColor: "#fbf7f3",
                borderColor: "#e0d8cf",
                color: "#4a3728",
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear filters</span>
            </button>
          )}
        </div>
      ) : (
        /* Reviews Table */
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            backgroundColor: "#fff",
            borderColor: "#ece4db",
            boxShadow: "0 1px 2px rgba(74, 55, 40, 0.04)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className="border-b font-semibold uppercase tracking-wider text-[11px]"
                style={{
                  backgroundColor: "#faf6f1",
                  borderColor: "#ece4db",
                  color: "#8a7a6a",
                }}
              >
                <tr>
                  <th className="py-3.5 px-4">Reviewer</th>
                  <th className="py-3.5 px-4">Mentor</th>
                  <th className="py-3.5 px-3">Rating</th>
                  <th className="py-3.5 px-4">Comment</th>
                  <th className="py-3.5 px-3">Reports</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-3">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ece4db]">
                {filteredReviews.map((review) => {
                  const revName = review.reviewer?.firstName
                    ? `${review.reviewer.firstName} ${review.reviewer.lastName || ""}`.trim()
                    : "Anonymous Mentee";
                  const revInitials = review.reviewer?.firstName
                    ? `${review.reviewer.firstName[0]}${review.reviewer.lastName?.[0] || ""}`.toUpperCase()
                    : "U";
                  const avatarUrl = review.reviewer?.profilePhotoId
                    ? photosMap[review.reviewer.profilePhotoId]
                    : null;

                  const mentorName = review.mentor?.name || "Mentor";
                  const mentorTitle = review.mentor?.title || "Mentorship Guide";

                  const commentText = review.comment || "—";
                  const isLongComment = commentText.length > 70;
                  const trimmedComment = isLongComment
                    ? `${commentText.substring(0, 70)}...`
                    : commentText;

                  const reportsCount = review.reportCount ?? 0;
                  const dateStr = review.createdAt
                    ? new Date(review.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "—";

                  return (
                    <tr
                      key={review.reviewId}
                      className="hover:bg-[#faf6f1]/50 transition-colors"
                    >
                      {/* Reviewer */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar
                            photoUrl={avatarUrl}
                            name={revName}
                            initials={revInitials}
                            className="w-8 h-8"
                          />
                          <div className="min-w-0">
                            <span className="font-semibold block truncate" style={{ color: "#4a3728" }}>
                              {revName}
                            </span>
                            <span className="text-[10px] text-[#8a7a6a] font-mono">
                              {review.reviewId.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Mentor */}
                      <td className="py-3.5 px-4">
                        <div className="min-w-0">
                          <span className="font-semibold block truncate" style={{ color: "#4a3728" }}>
                            {mentorName}
                          </span>
                          <span className="text-[11px] block truncate" style={{ color: "#8a7a6a" }}>
                            {mentorTitle}
                          </span>
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1 font-semibold" style={{ color: "#4a3728" }}>
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                          <span>{review.rating}</span>
                        </div>
                      </td>

                      {/* Comment */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-xs text-[#5c4a3a] leading-relaxed break-words">
                          {trimmedComment}
                        </p>
                        {isLongComment && (
                          <button
                            type="button"
                            onClick={() => setSelectedReview(review)}
                            className="text-[11px] font-semibold text-[#7a5c3e] hover:underline mt-0.5 inline-block"
                          >
                            Read full review
                          </button>
                        )}
                      </td>

                      {/* Reports Pill */}
                      <td className="py-3.5 px-3">
                        {reportsCount > 0 ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
                            style={{ backgroundColor: "#fee2e2", color: "#b91c1c" }}
                          >
                            <Flag className="w-3 h-3" />
                            <span>
                              {reportsCount} {reportsCount === 1 ? "report" : "reports"}
                            </span>
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                            style={{ backgroundColor: "#f3ece4", color: "#8a7a6a" }}
                          >
                            0 reports
                          </span>
                        )}
                      </td>

                      {/* Status Pill */}
                      <td className="py-3.5 px-3">
                        {review.isDeleted ? (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold"
                            style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}
                          >
                            Deleted
                          </span>
                        ) : !review.isPublic ? (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold"
                            style={{ backgroundColor: "#fef3c7", color: "#92400e" }}
                          >
                            Hidden
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold"
                            style={{ backgroundColor: "#dcfce7", color: "#166534" }}
                          >
                            Public
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-3 text-[#8a7a6a] whitespace-nowrap">
                        {dateStr}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedReview(review)}
                            className="p-1.5 rounded-lg text-[#7a5c3e] hover:bg-[#f3ece4] transition-colors"
                            title="View review details"
                            aria-label="View review details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {!review.isDeleted && (
                            <button
                              type="button"
                              onClick={() => {
                                setDeletingReview(review);
                                setModalReason("");
                                setModalError(null);
                              }}
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete review"
                              aria-label="Delete review"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div
            className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
            style={{ backgroundColor: "#faf6f1", borderColor: "#ece4db", color: "#8a7a6a" }}
          >
            <div>
              Showing page <span className="font-semibold text-[#4a3728]">{page}</span> of{" "}
              <span className="font-semibold text-[#4a3728]">{pages}</span> (
              <span className="font-semibold text-[#4a3728]">{total ?? 0}</span> total)
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="p-1.5 rounded-lg border bg-white text-[#4a3728] hover:bg-[#faf6f1] disabled:opacity-40 transition-colors"
                style={{ borderColor: "#e0d8cf" }}
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 font-semibold text-[#4a3728]">{page}</span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page >= pages || loading}
                className="p-1.5 rounded-lg border bg-white text-[#4a3728] hover:bg-[#faf6f1] disabled:opacity-40 transition-colors"
                style={{ borderColor: "#e0d8cf" }}
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedReview && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full border shadow-2xl overflow-hidden flex flex-col"
            style={{ borderColor: "#ece4db" }}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-[#ece4db] flex items-start justify-between bg-[#faf6f1]">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-5 h-5 text-[#7a5c3e]" />
                <div>
                  <h3 className="text-base font-bold text-[#4a3728]">Review Details</h3>
                  <p className="text-xs text-[#8a7a6a] font-mono">
                    ID: <span className="text-[#4a3728]">{selectedReview.reviewId}</span>
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

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
              {/* Reviewer / Mentor Summary */}
              <div className="grid grid-cols-2 gap-3 bg-[#faf6f1] p-3.5 rounded-xl border border-[#ece4db]">
                <div>
                  <span className="text-[#8a7a6a] block text-[11px]">Reviewer:</span>
                  <span className="font-semibold text-[#4a3728] block truncate">
                    {selectedReview.reviewer?.firstName
                      ? `${selectedReview.reviewer.firstName} ${selectedReview.reviewer.lastName || ""}`.trim()
                      : "Anonymous Mentee"}
                  </span>
                </div>
                <div>
                  <span className="text-[#8a7a6a] block text-[11px]">Mentor:</span>
                  <span className="font-semibold text-[#4a3728] block truncate">
                    {selectedReview.mentor?.name || "Mentor"}
                  </span>
                </div>
                <div>
                  <span className="text-[#8a7a6a] block text-[11px]">Rating:</span>
                  <span className="font-semibold text-[#4a3728] flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {selectedReview.rating} / 5
                  </span>
                </div>
                <div>
                  <span className="text-[#8a7a6a] block text-[11px]">Status:</span>
                  <span className="font-bold">
                    {selectedReview.isDeleted ? (
                      <span className="text-gray-600">Deleted</span>
                    ) : !selectedReview.isPublic ? (
                      <span className="text-amber-700">Hidden</span>
                    ) : (
                      <span className="text-emerald-700">Public</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Reports Information if any */}
              {selectedReview.report && (
                <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-amber-900 flex items-center gap-1.5">
                      <Flag className="w-3 h-3 text-amber-600" />
                      Reported review ({selectedReview.reportCount ?? 1} flags)
                    </span>
                    <span className="text-[10px] text-amber-700 italic">
                      Use Reported Reviews to dismiss
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[#8a7a6a] block">Reason:</span>
                      <span className="font-semibold text-[#4a3728]">
                        {REASON_LABELS[selectedReview.report.reason || ""] ||
                          selectedReview.report.reason ||
                          "—"}
                      </span>
                    </div>
                    {selectedReview.report.reportedAt && (
                      <div>
                        <span className="text-[#8a7a6a] block">Reported At:</span>
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
                      <span className="text-[#8a7a6a] block text-[11px]">Reporter note:</span>
                      <p className="text-[#4a3728] text-[11px] leading-relaxed mt-0.5">
                        {selectedReview.report.note}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Full Review Comment */}
              <div>
                <span className="text-[#8a7a6a] block text-[11px] mb-1 font-medium">
                  Full Review Comment:
                </span>
                <div className="p-3.5 bg-white border border-[#ece4db] rounded-xl text-[#4a3728] leading-relaxed whitespace-pre-wrap font-sans">
                  {selectedReview.comment || "(No text comment provided)"}
                </div>
              </div>

              {/* Date details */}
              <div className="text-[11px] text-[#8a7a6a] pt-1">
                Submitted on:{" "}
                {selectedReview.createdAt
                  ? new Date(selectedReview.createdAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "—"}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#ece4db] bg-[#faf6f1] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#4a3728] text-white hover:bg-[#38291e] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Review Modal */}
      {deletingReview && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#ece4db] shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-red-700">Delete Review</h3>
                <p className="text-xs text-[#8a7a6a] mt-1 leading-relaxed">
                  Are you sure you want to delete this review? It will be removed from the
                  mentor&apos;s public profile and marked as deleted. It cannot be restored from the
                  admin panel.
                </p>
              </div>
            </div>

            {/* Reason Input */}
            <div>
              <label className="block text-xs font-semibold text-[#4a3728] mb-1">
                Reason (required, 5-500 characters)
              </label>
              <textarea
                value={modalReason}
                onChange={(e) => setModalReason(e.target.value)}
                placeholder="Explain why this review is being deleted (minimum 5 characters)..."
                rows={3}
                disabled={actionLoadingId === deletingReview.reviewId}
                className="w-full p-3 text-xs border rounded-xl outline-none resize-none transition-colors"
                style={{ borderColor: "#e0d8cf", color: "#4a3728" }}
              />
              <div className="flex justify-between text-[11px] text-[#8a7a6a] mt-1">
                <span>Min {REASON_MIN} characters</span>
                <span
                  style={{
                    color: modalReason.trim().length > REASON_MAX ? "#b91c1c" : undefined,
                  }}
                >
                  {modalReason.trim().length}/{REASON_MAX}
                </span>
              </div>
            </div>

            {modalError && (
              <div className="p-3 rounded-lg text-xs bg-red-50 text-red-700 border border-red-200">
                {modalError}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-[#ece4db]">
              <button
                type="button"
                onClick={() => {
                  setDeletingReview(null);
                  setModalReason("");
                  setModalError(null);
                }}
                disabled={actionLoadingId === deletingReview.reviewId}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#e0d8cf] text-[#4a3728] hover:bg-[#faf6f1] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteReview(deletingReview)}
                disabled={
                  actionLoadingId === deletingReview.reviewId || !isReasonValid(modalReason)
                }
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {actionLoadingId === deletingReview.reviewId ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
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
