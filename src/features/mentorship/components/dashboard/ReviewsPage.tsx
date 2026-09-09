import React, { useEffect, useState, useCallback } from "react"
import { Star, Quote, ThumbsUp, Loader2 } from "lucide-react"
import ReviewService, { MentorReview, ReviewStats } from "@/lib/api/review.service"

const COLORS = {
  ink: "#4a3728",
  accent: "#7a5c3e",
  hairline: "#e0d8cf",
  wash: "#f6ede8",
  paper: "#fffdfb",
  gold: "#c9932a",
  muted: "#8a7a6a",
}

interface ReviewsPageProps {
  mentorData?: any // DashboardLayout se aata hai
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
            color: i < rating ? COLORS.gold : COLORS.hairline,
            fill: i < rating ? COLORS.gold : "transparent",
          }}
        />
      ))}
    </div>
  )
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 60) return `${mins || 1} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function ReviewsPage({ mentorData }: ReviewsPageProps) {
  const mentorId = mentorData?.mentorId

  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [reviews, setReviews] = useState<MentorReview[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadInitial = useCallback(async () => {
    if (!mentorId) return
    setLoading(true)
    setError(null)
    try {
      const [statsRes, reviewsRes] = await Promise.all([
        ReviewService.getReviewStats(mentorId),
        ReviewService.getMentorReviews(mentorId, 1, 10),
      ])
      setStats(statsRes)
      setReviews(reviewsRes.data)
      setTotalPages(reviewsRes.pagination.totalPages)
      setPage(1)
    } catch (e) {
      setError("Reviews load nahi ho paaye. Try again.")
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
    } catch (e) {
      // silent fail on pagination
    } finally {
      setLoadingMore(false)
    }
  }

  const handleHelpful = async (reviewId: string) => {
    // optimistic update
    setReviews((prev) =>
      prev.map((r) => (r.reviewId === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r))
    )
    try {
      await ReviewService.markHelpful(reviewId)
    } catch (e) {
      // revert on failure
      setReviews((prev) =>
        prev.map((r) => (r.reviewId === reviewId ? { ...r, helpfulCount: r.helpfulCount - 1 } : r))
      )
    }
  }

  if (!mentorId) {
    return (
      <div className="text-sm italic" style={{ color: COLORS.muted }}>
        Mentor profile load hone ka wait karo...
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-16 justify-center" style={{ color: COLORS.muted }}>
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading reviews...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-sm py-16 text-center" style={{ color: "#b45309" }}>
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

  const featured = reviews[0] // sabse recent/pehla ko featured treat kar rahe hain
  const rest = reviews.slice(1)

  return (
    <div className="space-y-10 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: COLORS.ink }}>
          Reviews &amp; ratings
        </h2>
        <p style={{ color: COLORS.muted }} className="text-sm mt-1">
          What students are saying about your sessions
        </p>
      </div>

      {totalReviews === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm italic" style={{ color: COLORS.muted }}>
            Abhi tak koi review nahi mila. Session complete hone ke baad reviews yahan dikhenge.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-x-12 gap-y-6">
            <div>
              <div className="text-7xl font-bold leading-none tabular-nums" style={{ color: COLORS.ink }}>
                {averageRating.toFixed(1)}
              </div>
              <div className="mt-3">
                <StarRow rating={Math.round(averageRating)} size={16} />
              </div>
              <p className="text-sm mt-2" style={{ color: COLORS.muted }}>
                from {totalReviews} reviews
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
                    <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: COLORS.wash }}>
                      <div
                        className="h-full rounded-full"
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

          <div
            className="flex flex-wrap"
            style={{ borderTop: `1px solid ${COLORS.hairline}`, borderBottom: `1px solid ${COLORS.hairline}` }}
          >
            {statCards.map((stat, idx) => (
              <div
                key={idx}
                className="flex-1 min-w-[120px] py-5 px-6"
                style={{ borderLeft: idx === 0 ? "none" : `1px solid ${COLORS.hairline}` }}
              >
                <div className="text-2xl font-bold" style={{ color: COLORS.ink }}>
                  {stat.value}
                </div>
                <div className="text-xs mt-1" style={{ color: COLORS.muted }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {featured && (
            <div className="flex gap-4">
              <Quote className="w-8 h-8 shrink-0 mt-1" style={{ color: COLORS.hairline }} />
              <div>
                <p className="text-xl leading-snug" style={{ color: COLORS.ink }}>
                  {featured.comment}
                </p>
                <div className="flex items-center gap-3 mt-4 flex-wrap">
                  <StarRow rating={featured.rating} />
                  <span className="text-sm font-semibold" style={{ color: COLORS.ink }}>
                    {/* ⚠️ backend abhi naam nahi bhejta — menteeId fallback */}
                    Mentee
                  </span>
                  <span className="text-sm" style={{ color: COLORS.muted }}>
                    · {timeAgo(featured.createdAt)}
                  </span>
                  {featured.tags?.length > 0 && (
                    <span className="text-xs flex gap-1.5 flex-wrap">
                      {featured.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: COLORS.wash, color: COLORS.accent }}
                        >
                          {t.replace(/_/g, " ")}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
                {featured.mentorResponse?.comment && (
                  <div className="mt-3 pl-4" style={{ borderLeft: `2px solid ${COLORS.hairline}` }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: COLORS.accent }}>
                      Your response
                    </p>
                    <p className="text-sm" style={{ color: COLORS.muted }}>
                      {featured.mentorResponse.comment}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            {rest.map((review) => (
              <div
                key={review.reviewId}
                className="py-5 flex flex-col sm:flex-row sm:items-baseline sm:gap-6"
                style={{ borderTop: `1px solid ${COLORS.hairline}` }}
              >
                <div className="flex items-center gap-2 sm:w-44 shrink-0 mb-1.5 sm:mb-0">
                  <span className="font-semibold text-sm" style={{ color: COLORS.ink }}>
                    Mentee
                  </span>
                  <StarRow rating={review.rating} size={12} />
                </div>
                <p className="text-sm flex-1" style={{ color: COLORS.muted }}>
                  {review.comment}
                </p>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => handleHelpful(review.reviewId)}
                    className="flex items-center gap-1 text-xs hover:underline"
                    style={{ color: COLORS.accent }}
                  >
                    <ThumbsUp className="w-3 h-3" />
                    {review.helpfulCount > 0 ? review.helpfulCount : ""}
                  </button>
                  <span className="text-xs" style={{ color: COLORS.muted }}>
                    {timeAgo(review.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {page < totalPages && (
            <div className="flex justify-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="text-sm font-semibold px-5 py-2 rounded-xl transition-opacity hover:opacity-80"
                style={{ backgroundColor: COLORS.wash, color: COLORS.accent }}
              >
                {loadingMore ? "Loading..." : "Load more reviews"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}