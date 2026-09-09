// mentorDashboard/components/ReviewsPage.tsx
import React from "react"
import { Star, Quote } from "lucide-react"

const COLORS = {
  ink: "#4a3728",
  accent: "#7a5c3e",
  hairline: "#e0d8cf",
  wash: "#f6ede8",
  paper: "#fffdfb",
  gold: "#c9932a",
  muted: "#8a7a6a",
}

const stats = [
  { label: "Overall rating", value: "4.8" },
  { label: "Total reviews", value: "156" },
  { label: "Positive", value: "95%" },
  { label: "5-star", value: "142" },
]

const ratingBreakdown = [
  { stars: 5, count: 142 },
  { stars: 4, count: 10 },
  { stars: 3, count: 3 },
  { stars: 2, count: 1 },
  { stars: 1, count: 0 },
]

const totalReviews = ratingBreakdown.reduce((sum, r) => sum + r.count, 0)

const featured = {
  name: "Amit Sharma",
  role: "Product Analyst",
  rating: 5,
  comment:
    "Excellent mentor — very knowledgeable and patient. He broke down the entire interview process into something manageable, and two weeks later I had an offer.",
  time: "2 days ago",
}

const reviews = [
  {
    name: "Priya Singh",
    rating: 5,
    comment: "Learned more in one session than a month of scattered YouTube tutorials.",
    time: "4 days ago",
  },
  {
    name: "Rahul Verma",
    rating: 4,
    comment: "Solid, professional, to the point. Would book again.",
    time: "1 week ago",
  },
  {
    name: "Neha Gupta",
    rating: 5,
    comment: "Clear explanations, practical examples, no fluff.",
    time: "1 week ago",
  },
]

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

export default function ReviewsPage() {
  return (
    <div className="space-y-10 max-w-3xl">
      {/* Heading */}
      <div>
        <h2 className="text-2xl font-bold" style={{ color: COLORS.ink }}>
          Reviews &amp; ratings
        </h2>
        <p style={{ color: COLORS.muted }} className="text-sm mt-1">
          What students are saying about your sessions
        </p>
      </div>

      {/* Rating hero — number + breakdown, no card box */}
      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-x-12 gap-y-6">
        <div>
          <div
            className="text-7xl font-bold leading-none tabular-nums"
            style={{ color: COLORS.ink }}
          >
            4.8
          </div>
          <div className="mt-3">
            <StarRow rating={5} size={16} />
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

      {/* Stat strip — single row, hairline dividers, no repeated card shadows */}
      <div
        className="flex flex-wrap"
        style={{ borderTop: `1px solid ${COLORS.hairline}`, borderBottom: `1px solid ${COLORS.hairline}` }}
      >
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="flex-1 min-w-[120px] py-5 px-6"
            style={{
              borderLeft: idx === 0 ? "none" : `1px solid ${COLORS.hairline}`,
            }}
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

      {/* Featured review — pull quote treatment */}
      <div className="flex gap-4">
        <Quote className="w-8 h-8 shrink-0 mt-1" style={{ color: COLORS.hairline }} />
        <div>
          <p className="text-xl leading-snug" style={{ color: COLORS.ink }}>
            {featured.comment}
          </p>
          <div className="flex items-center gap-3 mt-4">
            <StarRow rating={featured.rating} />
            <span className="text-sm font-semibold" style={{ color: COLORS.ink }}>
              {featured.name}
            </span>
            <span className="text-sm" style={{ color: COLORS.muted }}>
              · {featured.role} · {featured.time}
            </span>
          </div>
        </div>
      </div>

      {/* Remaining reviews — compact editorial rows, hairline separated */}
      <div>
        {reviews.map((review, idx) => (
          <div
            key={idx}
            className="py-5 flex flex-col sm:flex-row sm:items-baseline sm:gap-6"
            style={{ borderTop: `1px solid ${COLORS.hairline}` }}
          >
            <div className="flex items-center gap-2 sm:w-44 shrink-0 mb-1.5 sm:mb-0">
              <span className="font-semibold text-sm" style={{ color: COLORS.ink }}>
                {review.name}
              </span>
              <StarRow rating={review.rating} size={12} />
            </div>
            <p className="text-sm flex-1" style={{ color: COLORS.muted }}>
              {review.comment}
            </p>
            <span className="text-xs shrink-0 mt-1.5 sm:mt-0" style={{ color: COLORS.muted }}>
              {review.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}