// mentorDashboard/components/TrustScorePage.tsx
import React, { useEffect, useState } from "react"
import {
  Shield,
  ShieldCheck,
  UserCheck,
  Star,
  Zap,
  Sparkles,
  TrendingUp,
  Award,
  Clock,
  MessageSquare,
  RefreshCw,
  Target,
  Info,
  Trophy,
} from "lucide-react"
import MentorService from "@/lib/api/mentorship.service"

// ── Tier system derived purely from the overall score ────────────────
const TIERS = [
  { min: 90, name: "Elite Mentor", color: "#a37c2c", bg: "#fdf6e3", ring: "#e6c869" },
  { min: 75, name: "Trusted Pro", color: "#4a3728", bg: "#f3ece4", ring: "#c9a876" },
  { min: 60, name: "Rising Mentor", color: "#7a5c3e", bg: "#fbf7f3", ring: "#a08070" },
  { min: 0, name: "Getting Started", color: "#8a7a6a", bg: "#f6ede8", ring: "#d8cec4" },
]

function getTier(score: number) {
  return TIERS.find((t) => score >= t.min) ?? TIERS[TIERS.length - 1]
}

// The tier strictly above the current one, if any — used for the
// "X points to next tier" progress nudge.
function getNextTier(score: number) {
  const higherTiers = TIERS.filter((t) => t.min > score).sort((a, b) => a.min - b.min)
  return higherTiers[0] ?? null
}

// Achievement badges derived purely from the breakdown scores we already
// have — no new backend fields, just thresholds on existing data.
function getAchievements(breakdown: Record<string, number | undefined>) {
  const achievements: { label: string; icon: any }[] = []
  if ((breakdown.profileCompleteness ?? 0) >= 100) {
    achievements.push({ label: "Profile Complete", icon: UserCheck })
  }
  if ((breakdown.reliability ?? 0) >= 90) {
    achievements.push({ label: "Highly Reliable", icon: ShieldCheck })
  }
  if ((breakdown.studentSatisfaction ?? 0) >= 90) {
    achievements.push({ label: "Top Rated", icon: Star })
  }
  if ((breakdown.engagement ?? 0) >= 90) {
    achievements.push({ label: "Super Responsive", icon: Zap })
  }
  return achievements
}

const breakdownMeta = [
  { key: "profileCompleteness", label: "Profile Completeness", icon: UserCheck, desc: "How complete your mentor profile is" },
  { key: "reliability", label: "Reliability", icon: ShieldCheck, desc: "On-time sessions, low cancellations" },
  { key: "studentSatisfaction", label: "Student Satisfaction", icon: Star, desc: "Ratings & reviews from mentees" },
  { key: "engagement", label: "Engagement", icon: Zap, desc: "Response time & platform activity" },
]

const improvementTips = [
  { text: "Complete 5 more sessions this month", icon: Clock },
  { text: "Respond to inquiries within 2 hours", icon: MessageSquare },
  { text: "Get 3 more 5-star reviews", icon: Star },
  { text: "Update your profile with recent achievements", icon: Sparkles },
]

// ── Circular progress ring ─────────────────────────────────────────────
const ScoreRing = ({
  score,
  loading,
  ringColor,
}: {
  score: number | null
  loading: boolean
  ringColor: string
}) => {
  const size = 200
  const stroke = 14
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const pct = loading ? 8 : score ?? 0
  const offset = circumference - (Math.min(pct, 100) / 100) * circumference

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={loading ? "animate-pulse" : ""}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#efe6da"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={ringColor}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.4s ease" }}
      />
    </svg>
  )
}

export default function TrustScorePage() {
  const [loading, setLoading] = useState(true)
  const [trustScore, setTrustScore] = useState<any>(null)
  const [error, setError] = useState(false)

  const fetchScore = () => {
    setLoading(true)
    MentorService.getTrustScore()
      .then((res) => {
        if (!res?.data) {
          setTrustScore(null)
          setError(false)
        } else {
          setTrustScore(res.data)
          setError(false)
        }
      })
      .catch(() => {
        setError(true)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchScore()
  }, [])

  const numericScore =
    typeof trustScore?.overall === "number" ? trustScore.overall : null

  const tier = getTier(numericScore ?? 0)
  const nextTier = numericScore !== null ? getNextTier(numericScore) : null
  const pointsToNextTier = nextTier ? Math.max(nextTier.min - (numericScore ?? 0), 0) : 0
  const achievements = getAchievements(trustScore?.breakdown ?? {})

  const overallDisplay = loading
    ? "—"
    : error
    ? "!"
    : numericScore === null
    ? "—"
    : numericScore

  const statusText = loading
    ? "Calculating your score..."
    : error
    ? "Couldn't load your score right now"
    : !trustScore
    ? "Complete more sessions to unlock your score"
    : "Based on your recent platform activity"

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#4a3728" }}>
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: "#4a3728" }}>
              Trust Score
            </h2>
            <p style={{ color: "#8a7a6a" }} className="text-sm">
              Your credibility score
            </p>
          </div>
        </div>

        {error && (
          <button
            onClick={fetchScore}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#4a3728", color: "#fff" }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        )}
      </div>

      {/* Hero Score Card */}
      <div
        className="relative overflow-hidden rounded-2xl p-8 md:p-10"
        style={{ backgroundColor: tier.bg, border: `1px solid ${tier.ring}55` }}
      >
        {/* decorative glow */}
        <div
          className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-30 pointer-events-none"
          style={{ backgroundColor: tier.ring }}
        />
        <div
          className="absolute -bottom-20 -left-10 w-48 h-48 rounded-full opacity-20 pointer-events-none"
          style={{ backgroundColor: tier.color }}
        />

        <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-12">
          {/* Ring */}
          <div className="relative shrink-0">
            <ScoreRing score={numericScore} loading={loading} ringColor={tier.color} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-5xl font-extrabold ${loading ? "animate-pulse" : ""}`} style={{ color: tier.color }}>
                {overallDisplay}
              </span>
              {!loading && !error && numericScore !== null && (
                <span className="text-xs font-semibold mt-1" style={{ color: "#8a7a6a" }}>
                  out of 100
                </span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="text-center md:text-left flex-1">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3"
              style={{ backgroundColor: tier.color, color: "#fff" }}
            >
              <Award className="w-3.5 h-3.5" />
              {tier.name}
            </div>
            <p className="text-2xl font-bold" style={{ color: "#4a3728" }}>
              Overall Trust Score
            </p>
            <p className="mt-2 text-sm" style={{ color: "#8a7a6a" }}>
              {statusText}
            </p>

            {!loading && !error && numericScore !== null && (
              <div className="mt-4 flex items-center justify-center md:justify-start gap-2">
                <TrendingUp className="w-4 h-4" style={{ color: tier.color }} />
                <span className="text-sm font-semibold" style={{ color: tier.color }}>
                  {numericScore >= 75
                    ? "You're in the top tier of mentors"
                    : "Keep improving to reach the next tier"}
                </span>
              </div>
            )}

            {/* Next tier progress nudge */}
            {!loading && !error && numericScore !== null && nextTier && (
              <div className="mt-5 max-w-sm mx-auto md:mx-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "#4a3728" }}>
                    <Target className="w-3.5 h-3.5" />
                    {pointsToNextTier} points to {nextTier.name}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: "#8a7a6a" }}>
                    {numericScore}/{nextTier.min}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ backgroundColor: "#efe6da" }}>
                  <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min((numericScore / nextTier.min) * 100, 100)}%`,
                      backgroundColor: tier.color,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Update frequency note */}
        <div className="relative mt-6 flex items-center gap-2 text-xs" style={{ color: "#8a7a6a" }}>
          <Info className="w-3.5 h-3.5" />
          Trust Score updates weekly based on your latest sessions, reviews, and activity.
        </div>
      </div>

      {/* Two-column breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Score Breakdown */}
        <div className="bg-white p-6 rounded-2xl" style={{ border: "1px solid #e0d8cf" }}>
          <h3 className="font-bold text-base mb-5" style={{ color: "#4a3728" }}>
            Score Breakdown
          </h3>

          <div className="space-y-5">
            {breakdownMeta.map((item, idx) => {
              const score = trustScore?.breakdown?.[item.key]
              const numeric = typeof score === "number" ? score : null
              return (
                <div key={idx}>
                  <div className="flex items-start justify-between mb-2 gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "#f3ece4" }}>
                        <item.icon className="w-4 h-4" style={{ color: "#7a5c3e" }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#4a3728" }}>
                          {item.label}
                        </p>
                        <p className="text-xs" style={{ color: "#a08070" }}>
                          {item.desc}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold shrink-0" style={{ color: "#4a3728" }}>
                      {loading ? "—" : numeric === null ? "—" : `${numeric}%`}
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full" style={{ backgroundColor: "#f0e9e1" }}>
                    <div
                      className={`h-2.5 rounded-full transition-all duration-700 ${loading ? "animate-pulse" : ""}`}
                      style={{
                        width: loading ? "12%" : numeric === null ? "0%" : `${numeric}%`,
                        backgroundColor: tier.color,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* How to Improve */}
        <div className="bg-white p-6 rounded-2xl" style={{ border: "1px solid #e0d8cf" }}>
          <h3 className="font-bold text-base mb-5" style={{ color: "#4a3728" }}>
            How to Improve
          </h3>

          <ul className="space-y-3">
            {improvementTips.map((tip, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-xl transition-colors hover:border-[#c9baa9]"
                style={{ backgroundColor: "#fbf7f3", border: "1px solid #e0d8cf" }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "#f3ece4" }}
                >
                  <tip.icon className="w-4 h-4" style={{ color: "#7a5c3e" }} />
                </div>
                <span className="text-sm pt-1" style={{ color: "#5a4535" }}>
                  {tip.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Achievements — derived from the breakdown scores you already have */}
      {!loading && !error && achievements.length > 0 && (
        <div className="bg-white p-6 rounded-2xl" style={{ border: "1px solid #e0d8cf" }}>
          <h3 className="font-bold text-base mb-5 flex items-center gap-2" style={{ color: "#4a3728" }}>
            <Trophy className="w-4.5 h-4.5" />
            Achievements
          </h3>
          <div className="flex flex-wrap gap-3">
            {achievements.map((a, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
                style={{ backgroundColor: "#fbf7f3", border: "1px solid #e0d8cf" }}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#f3ece4" }}>
                  <a.icon className="w-3.5 h-3.5" style={{ color: "#7a5c3e" }} />
                </div>
                <span className="text-sm font-semibold" style={{ color: "#4a3728" }}>
                  {a.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}