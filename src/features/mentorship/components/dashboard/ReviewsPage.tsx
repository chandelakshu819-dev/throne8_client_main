import React, { useEffect, useState, useCallback, useMemo } from "react"
import { Star, ThumbsUp, ThumbsDown, Loader2, MessageSquare, Edit2, Trash2, Send, X } from "lucide-react"
import ReviewService, { MentorReview, ReviewStats } from "@/lib/api/review.service"
import TokenStorage from "@/lib/store/token.storage"

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
  danger: "#dc2626",
}

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
}

interface ReviewsPageProps {
  mentorData?: { mentorId?: string; userId?: string; isOwner?: boolean }
}

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          width={size}
          height={size}
          style={{
            color: i < rating ? COLORS.gold : COLORS.chip,
            fill: i < rating ? COLORS.gold : "none",
          }}
        />
      ))}
    </div>
  )
}

function timeAgo(dateStr?: string) {
  if (!dateStr) return "recently"
  const diffMs = Date.now() - new Date(dateStr).getTime()
  if (isNaN(diffMs)) return "recently"
  const mins = Math.floor(diffMs / 60000)
  if (mins < 60) return `${mins || 1} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  return new Date(dateStr).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
}

function getMenteeName(review: MentorReview): string {
  if (review.mentee?.fullName && review.mentee.fullName.trim()) return review.mentee.fullName.trim()
  if (review.mentee?.name && review.mentee.name.trim()) return review.mentee.name.trim()
  if (review.mentee?.firstName) {
    const full = `${review.mentee.firstName} ${review.mentee.lastName || ""}`.trim()
    if (full) return full
  }
  if (typeof review.menteeId === "object" && review.menteeId !== null) {
    const idObj = review.menteeId as any
    if (idObj.fullName && idObj.fullName.trim()) return idObj.fullName.trim()
    if (idObj.name && idObj.name.trim()) return idObj.name.trim()
  }
  return "Mentee"
}

function getMenteePhoto(review: MentorReview): string | undefined {
  if (review.mentee?.profilePic) return review.mentee.profilePic
  if (review.mentee?.profilePhotoId) return review.mentee.profilePhotoId
  if (typeof review.menteeId === "object" && review.menteeId !== null) {
    const idObj = review.menteeId as any
    if (idObj.profilePic) return idObj.profilePic
  }
  return undefined
}

function initialsFrom(name: string) {
  const parts = name.trim().split(" ").filter(Boolean)
  if (parts.length === 0) return "M"
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase()
}

export default function ReviewsPage({ mentorData }: ReviewsPageProps) {
  const mentorId = mentorData?.mentorId

  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [reviews, setReviews] = useState<MentorReview[]>([])
  const [myReactions, setMyReactions] = useState<Record<string, "like" | "dislike">>({})
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mentor reply state
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState<string>("")
  const [isSubmittingReply, setIsSubmittingReply] = useState<boolean>(false)
  const [deletingReplyReviewId, setDeletingReplyReviewId] = useState<string | null>(null)

  const loggedInUserId = useMemo(() => {
    if (typeof window === "undefined") return null
    return TokenStorage.getUserData()?.userId || null
  }, [])

  const isMentorOwner = useMemo(() => {
    if (!mentorData) return true // Default true when rendered on mentor dashboard overview
    if (!loggedInUserId) return false
    const mUserId = (mentorData as any).userId
    const mMentorId = (mentorData as any).mentorId
    return (
      String(loggedInUserId) === String(mUserId) ||
      String(loggedInUserId) === String(mMentorId) ||
      (mentorData as any).isOwner === true
    )
  }, [loggedInUserId, mentorData])

  const loadInitial = useCallback(async () => {
    if (!mentorId) return
    setLoading(true)
    setError(null)
    try {
      const [statsRes, reviewsRes, reactionsRes] = await Promise.all([
        ReviewService.getReviewStats(mentorId),
        ReviewService.getMentorReviews(mentorId, 1, 10),
        ReviewService.getMyReactions(mentorId).catch(() => ({})),
      ])
      setStats(statsRes)
      setReviews(reviewsRes.data)
      setTotalPages(reviewsRes.pagination.totalPages)
      setMyReactions(reactionsRes || {})
      setPage(1)
    } catch (err) {
      console.error("Review load error:", err)
      setError("Failed to load reviews. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [mentorId])

  useEffect(() => {
    loadInitial()
  }, [loadInitial])

  const loadMore = async () => {
    if (!mentorId || page >= totalPages) return
    setLoadingMore(true)
    try {
      const next = page + 1
      const res = await ReviewService.getMentorReviews(mentorId, next, 10)
      setReviews((prev) => [...prev, ...res.data])
      setPage(next)
    } catch {
      // silent fail on pagination
    } finally {
      setLoadingMore(false)
    }
  }

  const handleReact = async (reviewId: string, type: "like" | "dislike", reviewMenteeId?: any) => {
    const rMenteeUserId = typeof reviewMenteeId === "object" ? reviewMenteeId?.userId : reviewMenteeId
    if (loggedInUserId && String(rMenteeUserId) === String(loggedInUserId)) {
      return
    }

    const prevReaction = myReactions[reviewId]
    const nextReaction = prevReaction === type ? null : type

    const prevMyReactions = { ...myReactions }
    const prevReviews = [...reviews]

    setMyReactions((prev) => {
      const copy = { ...prev }
      if (nextReaction) {
        copy[reviewId] = nextReaction
      } else {
        delete copy[reviewId]
      }
      return copy
    })

    setReviews((prev) =>
      prev.map((r) => {
        const idMatches = r.reviewId === reviewId || r._id === reviewId || r.id === reviewId
        if (!idMatches) return r

        let helpful = r.helpfulCount || 0
        let notHelpful = r.notHelpfulCount || 0

        if (prevReaction === "like") helpful = Math.max(0, helpful - 1)
        if (prevReaction === "dislike") notHelpful = Math.max(0, notHelpful - 1)

        if (nextReaction === "like") helpful += 1
        if (nextReaction === "dislike") notHelpful += 1

        return {
          ...r,
          helpfulCount: helpful,
          notHelpfulCount: notHelpful,
          userReaction: nextReaction,
        }
      })
    )

    try {
      const res = await ReviewService.reactToReview(reviewId, type)
      if (res) {
        setReviews((prev) =>
          prev.map((r) => {
            const idMatches = r.reviewId === reviewId || r._id === reviewId || r.id === reviewId
            if (!idMatches) return r
            return {
              ...r,
              helpfulCount: res.helpfulCount,
              notHelpfulCount: res.notHelpfulCount,
              userReaction: res.userReaction,
            }
          })
        )
      }
    } catch (err) {
      setMyReactions(prevMyReactions)
      setReviews(prevReviews)
    }
  }

  const handleOpenReplyForm = (reviewId: string, currentComment?: string) => {
    setReplyingReviewId(reviewId)
    setReplyText(currentComment || "")
  }

  const handleCancelReply = () => {
    setReplyingReviewId(null)
    setReplyText("")
  }

  const handleSubmitReply = async (reviewId: string) => {
    const text = replyText.trim()
    if (text.length < 10 || text.length > 500) return
    setIsSubmittingReply(true)
    try {
      await ReviewService.addMentorResponse(reviewId, text)
      setReviews((prev) =>
        prev.map((r) => {
          const idMatches = r.reviewId === reviewId || r._id === reviewId || r.id === reviewId
          if (!idMatches) return r
          return {
            ...r,
            mentorResponse: {
              comment: text,
              respondedAt: new Date().toISOString(),
            },
          }
        })
      )
      setReplyingReviewId(null)
      setReplyText("")
    } catch (err: any) {
      console.error("Failed to submit mentor reply:", err)
      alert(err?.response?.data?.message || err?.message || "Failed to submit response.")
    } finally {
      setIsSubmittingReply(false)
    }
  }

  const handleDeleteReply = async (reviewId: string) => {
    setDeletingReplyReviewId(reviewId)
    try {
      await ReviewService.deleteMentorResponse(reviewId)
      setReviews((prev) =>
        prev.map((r) => {
          const idMatches = r.reviewId === reviewId || r._id === reviewId || r.id === reviewId
          if (!idMatches) return r
          return {
            ...r,
            mentorResponse: undefined,
          }
        })
      )
    } catch (err: any) {
      console.error("Failed to delete mentor reply:", err)
      alert(err?.response?.data?.message || err?.message || "Failed to delete response.")
    } finally {
      setDeletingReplyReviewId(null)
    }
  }

  if (!mentorId) {
    return (
      <div className="text-sm italic p-4" style={{ color: COLORS.muted }}>
        Waiting for mentor profile to load...
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-16 justify-center" style={{ color: COLORS.muted }}>
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm font-medium">Loading reviews...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-sm py-16 text-center" style={{ color: COLORS.danger }}>
        {error}
      </div>
    )
  }

  const distribution = stats?.distribution ?? { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  const totalReviews = stats?.totalReviews ?? 0
  const averageRating = stats?.averageRating ?? 0
  const fiveStar = distribution[5] ?? 0
  const positivePct =
    totalReviews > 0
      ? Math.round(((distribution[5] + distribution[4]) / totalReviews) * 100)
      : 0

  const ratingBreakdown = [5, 4, 3, 2, 1].map((s) => ({
    stars: s,
    count: distribution[s as keyof typeof distribution] ?? 0,
  }))

  const statCards = [
    { label: "Overall rating", value: averageRating.toFixed(1) },
    { label: "Total reviews", value: String(totalReviews) },
    { label: "Positive", value: `${positivePct}%` },
    { label: "5-star", value: String(fiveStar) },
  ]

  return (
    <div className="space-y-8 max-w-4xl pt-2 pb-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold" style={{ color: COLORS.ink }}>
          Reviews &amp; ratings
        </h2>
        <p style={{ color: COLORS.muted }} className="text-sm mt-1">
          What students are saying about your sessions
        </p>
      </div>

      {totalReviews === 0 ? (
        <div className="text-center py-16 border rounded-2xl bg-white" style={{ borderColor: COLORS.hairline }}>
          <p className="text-sm italic" style={{ color: COLORS.muted }}>
            No reviews received yet. Reviews will appear here after students complete sessions.
          </p>
        </div>
      ) : (
        <>
          {/* Rating Summary Header */}
          <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-x-12 gap-y-6">
            <div>
              <div className="text-7xl font-bold leading-none tabular-nums" style={{ color: COLORS.ink }}>
                {averageRating.toFixed(1)}
              </div>
              <div className="mt-3">
                <StarRow rating={Math.round(averageRating)} size={18} />
              </div>
              <p className="text-sm mt-2" style={{ color: COLORS.muted }}>
                from {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
              </p>
            </div>

            <div className="flex flex-col justify-center gap-2 pt-1">
              {ratingBreakdown.map((row) => {
                const pct = totalReviews ? (row.count / totalReviews) * 100 : 0
                return (
                  <div key={row.stars} className="flex items-center gap-3">
                    <span className="text-xs w-3 text-right" style={{ color: COLORS.muted }}>
                      {row.stars}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.wash }}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%`, backgroundColor: COLORS.accent }}
                      />
                    </div>
                    <span className="text-xs w-6" style={{ color: COLORS.muted }}>
                      {row.count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick Stats Banner */}
          <div
            className="flex flex-wrap rounded-2xl bg-white overflow-hidden shadow-sm"
            style={{ border: `1px solid ${COLORS.hairline}` }}
          >
            {statCards.map((stat, idx) => (
              <div
                key={idx}
                className="flex-1 min-w-[120px] py-4 px-6 text-center sm:text-left"
                style={{ borderLeft: idx === 0 ? "none" : `1px solid ${COLORS.hairline}` }}
              >
                <div className="text-2xl font-bold" style={{ color: COLORS.ink }}>
                  {stat.value}
                </div>
                <div className="text-xs mt-0.5" style={{ color: COLORS.muted }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Individual Reviews Cards */}
          <div className="space-y-4 pt-2">
            {reviews.map((review, idx) => {
              const reviewId = review.reviewId || review._id || review.id || `rev-${idx}`
              const menteeName = getMenteeName(review)
              const photo = getMenteePhoto(review)
              const rating = review.rating || 0
              const comment = review.comment || "No written feedback provided."
              const tags = Array.isArray(review.tags) ? review.tags : []
              const sessionTitle = review.session?.title || "Mentorship Session"
              const rMenteeUserId = typeof review.menteeId === "object" ? review.menteeId?.userId : review.menteeId
              const isOwnReview = Boolean(loggedInUserId && String(rMenteeUserId) === String(loggedInUserId))

              return (
                <div
                  key={reviewId}
                  className="flex flex-col p-5 rounded-2xl transition-all hover:shadow-md bg-white hover:-translate-y-0.5"
                  style={{ border: `1px solid ${COLORS.hairline}` }}
                >
                  {/* Card Header: Mentee Info & Session Info */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {photo ? (
                        <img
                          src={photo}
                          alt={menteeName}
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                          style={{ border: `1px solid ${COLORS.hairline}` }}
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white shadow-sm"
                          style={{ backgroundColor: COLORS.ink }}
                        >
                          {initialsFrom(menteeName)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold truncate" style={{ color: COLORS.ink }}>
                            {menteeName}
                          </p>
                          {review.isVerified !== false && (
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                              style={{ backgroundColor: COLORS.chip, color: COLORS.accent }}
                            >
                              Verified Session
                            </span>
                          )}
                        </div>
                        <p className="text-xs truncate mt-0.5" style={{ color: COLORS.muted }}>
                          {sessionTitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs" style={{ color: COLORS.muted }}>
                        {timeAgo(review.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Rating & Review Content */}
                  <div className="pl-4 border-l-2 py-1 space-y-2.5" style={{ borderColor: COLORS.chip }}>
                    {/* Star Rating */}
                    <div className="flex items-center gap-2">
                      <StarRow rating={rating} size={15} />
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
                            style={{
                              backgroundColor: COLORS.softWash,
                              color: COLORS.accent,
                              border: `1px solid ${COLORS.hairline}`,
                            }}
                          >
                            {TAG_LABELS[tag] || tag.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Comment */}
                    <p className="text-sm leading-relaxed" style={{ color: COLORS.ink }}>
                      "{comment}"
                    </p>

                    {/* Action Buttons: Like, Dislike & Reply */}
                    <div className="flex items-center justify-between gap-4 pt-2 flex-wrap">
                      <div className="flex items-center gap-3">
                        {/* Like Button */}
                        <button
                          onClick={() => handleReact(reviewId, "like", review.menteeId)}
                          disabled={isOwnReview}
                          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors hover:bg-[#f6ede8] disabled:opacity-50"
                          style={{
                            color: myReactions[reviewId] === "like" ? COLORS.accent : COLORS.muted,
                            backgroundColor: myReactions[reviewId] === "like" ? COLORS.softWash : "transparent",
                            border: `1px solid ${myReactions[reviewId] === "like" ? COLORS.accent : COLORS.hairline}`,
                          }}
                          title={isOwnReview ? "You cannot react to your own review" : "Like review"}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" style={{ fill: myReactions[reviewId] === "like" ? COLORS.accent : "none" }} />
                          <span>Like {(review.helpfulCount || 0) > 0 ? `(${review.helpfulCount})` : "(0)"}</span>
                        </button>

                        {/* Dislike Button */}
                        <button
                          onClick={() => handleReact(reviewId, "dislike", review.menteeId)}
                          disabled={isOwnReview}
                          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors hover:bg-[#f6ede8] disabled:opacity-50"
                          style={{
                            color: myReactions[reviewId] === "dislike" ? COLORS.danger : COLORS.muted,
                            backgroundColor: myReactions[reviewId] === "dislike" ? "#fef2f2" : "transparent",
                            border: `1px solid ${myReactions[reviewId] === "dislike" ? "#fecaca" : COLORS.hairline}`,
                          }}
                          title={isOwnReview ? "You cannot react to your own review" : "Dislike review"}
                        >
                          <ThumbsDown className="w-3.5 h-3.5" style={{ fill: myReactions[reviewId] === "dislike" ? COLORS.danger : "none" }} />
                          <span>Dislike {(review.notHelpfulCount || 0) > 0 ? `(${review.notHelpfulCount})` : "(0)"}</span>
                        </button>
                      </div>

                      {/* Mentor Reply Button */}
                      {isMentorOwner && !review.mentorResponse?.comment && replyingReviewId !== reviewId && (
                        <button
                          onClick={() => handleOpenReplyForm(reviewId)}
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg transition-colors text-white shadow-sm"
                          style={{ backgroundColor: COLORS.ink }}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Reply</span>
                        </button>
                      )}
                    </div>

                    {/* Inline Reply Form */}
                    {replyingReviewId === reviewId && (
                      <div className="mt-3 p-3.5 rounded-xl border space-y-3" style={{ backgroundColor: COLORS.softWash, borderColor: COLORS.accent }}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold" style={{ color: COLORS.accent }}>
                            {review.mentorResponse?.comment ? "Edit your response" : "Write a response to mentee"}
                          </span>
                          <button onClick={handleCancelReply} className="text-xs font-semibold hover:opacity-75" style={{ color: COLORS.muted }}>
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write a constructive response (10 - 500 characters)..."
                          rows={3}
                          className="w-full text-xs p-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-[#7a5c3e]"
                          style={{ borderColor: COLORS.hairline, backgroundColor: "#fff", color: COLORS.ink }}
                        />

                        <div className="flex items-center justify-between">
                          <span className={`text-[11px] font-medium ${replyText.length < 10 || replyText.length > 500 ? "text-red-500" : "text-gray-500"}`}>
                            {replyText.length}/500 characters (min 10)
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleCancelReply}
                              disabled={isSubmittingReply}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold border"
                              style={{ borderColor: COLORS.hairline, color: COLORS.ink, backgroundColor: "#fff" }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSubmitReply(reviewId)}
                              disabled={isSubmittingReply || replyText.trim().length < 10 || replyText.trim().length > 500}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity disabled:opacity-50"
                              style={{ backgroundColor: COLORS.accent }}
                            >
                              {isSubmittingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                              <span>{isSubmittingReply ? "Saving..." : "Send reply"}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Display Existing Response */}
                    {review.mentorResponse?.comment && replyingReviewId !== reviewId && (
                      <div
                        className="mt-3 p-3.5 rounded-xl text-xs space-y-1.5"
                        style={{ backgroundColor: COLORS.softWash, border: `1px solid ${COLORS.hairline}` }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold" style={{ color: COLORS.accent }}>
                            {isMentorOwner ? "Your response" : "Mentor's response"}
                          </span>
                          <div className="flex items-center gap-2">
                            {review.mentorResponse.respondedAt && (
                              <span style={{ color: COLORS.muted }}>
                                {timeAgo(review.mentorResponse.respondedAt)}
                              </span>
                            )}
                            {isMentorOwner && (
                              <div className="flex items-center gap-1 ml-2">
                                <button
                                  onClick={() => handleOpenReplyForm(reviewId, review.mentorResponse?.comment)}
                                  className="p-1 rounded text-xs font-medium hover:bg-[#e0d8cf] text-gray-700"
                                  title="Edit response"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteReply(reviewId)}
                                  disabled={deletingReplyReviewId === reviewId}
                                  className="p-1 rounded text-xs font-medium hover:bg-red-50 text-red-500"
                                  title="Delete response"
                                >
                                  {deletingReplyReviewId === reviewId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <p style={{ color: COLORS.ink }}>
                          "{review.mentorResponse.comment}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Load More Button */}
          {page < totalPages && (
            <div className="flex justify-center pt-2">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="text-sm font-semibold px-6 py-2.5 rounded-xl transition-opacity hover:opacity-90 flex items-center gap-2 shadow-sm"
                style={{ backgroundColor: COLORS.ink, color: "#ffffff" }}
              >
                {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loadingMore ? "Loading..." : "Load more reviews"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}