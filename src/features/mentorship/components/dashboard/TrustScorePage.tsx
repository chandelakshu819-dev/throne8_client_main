// mentorDashboard/components/TrustScorePage.tsx
import React, { useEffect, useState, useMemo } from "react"
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

// Achievement badges derived purely from the breakdown scores we already
// have — no new backend fields, just thresholds on existing data.
function getAchievements(breakdown: Record<string, number | null | undefined>) {
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

interface TrustScorePageProps {
  setActivePage?: (page: string, subtab?: string) => void;
  mentorData?: any;
}

export default function TrustScorePage({ setActivePage, mentorData }: TrustScorePageProps) {
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

  const syncScore = () => {
    setLoading(true);
    import("@/lib/api/trustScore.service").then(({ trustScoreService }) => {
      import("@/lib/api/api.intance").then(({ default: api }) => {
        api.post('/mentorship/trust-score/' + (trustScore?.userId || 'me') + '/sync').then((res) => {
          if (res.data?.data?.trustScore) {
             setTrustScore(res.data.data.trustScore);
             setError(false);
          } else {
             fetchScore(); // fallback
          }
        }).catch(() => setError(true)).finally(() => setLoading(false));
      });
    });
  }

  useEffect(() => {
    fetchScore()
  }, [])

  const numericScore =
    typeof trustScore?.overall === "number" ? trustScore.overall : null

  const tier = trustScore?.tier || { name: "Getting Started", color: "#8a7a6a", bg: "#f6ede8", ring: "#d8cec4" };
  const nextTier = trustScore?.nextTier || null;
  const pointsToNextTier = trustScore?.pointsToNextTier || 0;
  const achievements = getAchievements(trustScore?.breakdown ?? {})

  const reviewCount =
    typeof trustScore?.metrics?.reviewCount === "number"
      ? trustScore.metrics.reviewCount
      : typeof trustScore?.metrics?.totalReviews === "number"
      ? trustScore.metrics.totalReviews
      : typeof mentorData?.stats?.totalReviews === "number"
      ? mentorData.stats.totalReviews
      : 0;

  // Compute tips dynamically from breakdown if backend array is empty
  const dynamicImprovementTips = useMemo(() => {
    if (trustScore?.improvementSuggestions && Array.isArray(trustScore.improvementSuggestions) && trustScore.improvementSuggestions.length > 0) {
      return trustScore.improvementSuggestions;
    }

    const tips: { text: string; action?: string }[] = [];
    const isVerified = Boolean(mentorData?.isVerified ?? trustScore?.metrics?.isVerified);
    const profilePct = trustScore?.breakdown?.profileCompleteness ?? 100;
    const reliabilityPct = trustScore?.breakdown?.reliability ?? 100;

    if (!isVerified) {
      tips.push({
        text: "Complete document and identity verification to earn your trusted mentor badge.",
        action: "verify",
      });
    }

    if (profilePct < 100) {
      tips.push({
        text: `Complete the remaining profile sections to reach 100% (currently ${profilePct}%).`,
        action: "profile",
      });
    }

    if (reliabilityPct < 90) {
      tips.push({
        text: `Your session reliability is currently ${reliabilityPct}%. Attend upcoming scheduled sessions to rebuild reliability.`,
        action: "bookings",
      });
    }

    if (reviewCount === 0) {
      tips.push({
        text: "No reviews yet. Encourage mentees to leave a review after sessions to establish Student Satisfaction.",
        action: "reviews",
      });
    }

    return tips;
  }, [trustScore, mentorData, reviewCount]);

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

        <div className="flex gap-2">
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
          <button
            onClick={syncScore}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#4a3728", color: "#fff" }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync
          </button>
        </div>
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
              const isNoReviews = item.key === "studentSatisfaction" && (numeric === null || reviewCount === 0)
              const displayValue = loading
                ? "—"
                : isNoReviews
                ? "No reviews yet"
                : numeric === null
                ? "—"
                : `${numeric}%`

              const barWidth = loading
                ? "12%"
                : isNoReviews || numeric === null
                ? "0%"
                : `${numeric}%`

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
                    <span className={`text-sm font-bold shrink-0 ${isNoReviews ? "text-xs font-medium" : ""}`} style={{ color: isNoReviews ? "#8a7a6a" : "#4a3728" }}>
                      {displayValue}
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full" style={{ backgroundColor: "#f0e9e1" }}>
                    <div
                      className={`h-2.5 rounded-full transition-all duration-700 ${loading ? "animate-pulse" : ""}`}
                      style={{
                        width: barWidth,
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
            {dynamicImprovementTips.length > 0 ? (
              dynamicImprovementTips.map((tip: any, idx: number) => (
                <li
                  key={idx}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-xl transition-colors hover:border-[#c9baa9]"
                  style={{ backgroundColor: "#fbf7f3", border: "1px solid #e0d8cf" }}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "#f3ece4" }}
                    >
                      <Sparkles className="w-4 h-4" style={{ color: "#7a5c3e" }} />
                    </div>
                    <span className="text-sm pt-1" style={{ color: "#5a4535" }}>
                      {tip.text}
                    </span>
                  </div>

                  {tip.action === "profile" && (
                    <button
                      onClick={() => setActivePage?.("profile")}
                      className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: "#4a3728" }}
                    >
                      Complete profile
                    </button>
                  )}
                  {tip.action === "verify" && (
                    <button
                      onClick={() => setActivePage?.("profile", "verification")}
                      className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: "#4a3728" }}
                    >
                      Get verified
                    </button>
                  )}
                  {tip.action === "bookings" && (
                    <button
                      onClick={() => setActivePage?.("bookings")}
                      className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: "#4a3728" }}
                    >
                      View bookings
                    </button>
                  )}
                </li>
              ))
            ) : (
              <li className="text-sm" style={{ color: "#8a7a6a" }}>
                {!loading && !error && !trustScore ? "Data unavailable" : "Not enough data"}
              </li>
            )}
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