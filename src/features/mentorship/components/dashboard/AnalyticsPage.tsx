// File: src/features/mentorship/components/dashboard/AnalyticsPage.tsx
"use client"
import React, { useEffect, useState } from "react"
import {
  BarChart3,
  ArrowUp,
  ArrowDown,
  Eye,
  CalendarCheck,
  Clock,
  Wallet,
  TrendingUp,
  Users,
  Code2,
  Target,
  XCircle,
  Percent,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import MentorService from "@/lib/api/mentorship.service"

interface PopularServiceStat {
  sessionType: string
  bookings: number
  revenue?: number
}

interface MonthlyEarningStat {
  month: string
  amount: number
}

interface RatingTrendStat {
  month: string
  avgRating: number
  count: number
}

interface AnalyticsData {
  profileViews: { value: number; changePercent: number; trend: string }
  bookingRate: { value: number; trend: string }
  avgSessionDuration: { value: number }
  cancellationRate?: { value: number; cancelled: number; noShow: number; total: number }
  conversion?: { views: number; bookings: number; rate: number }
  popularServices: PopularServiceStat[]
  monthlyEarnings: MonthlyEarningStat[]
  ratingTrend?: RatingTrendStat[]
}

interface AnalyticsPageProps {
  mentorData?: any
  [key: string]: any
}

const SERVICE_ICON_MAP: Record<string, { icon: React.ElementType; color: string }> = {
  "one-on-one": { icon: Users, color: "#4a3728" },
  "code-review": { icon: Code2, color: "#8a6a4a" },
  "group": { icon: Users, color: "#7a5c3e" },
  "career-guidance": { icon: Target, color: "#5c4632" },
}

const FALLBACK_COLORS = ["#4a3728", "#8a6a4a", "#7a5c3e", "#5c4632", "#a08070"]

const monthLabel = (ym: string) => {
  const [y, m] = ym.split("-")
  return new Date(Number(y), Number(m) - 1).toLocaleString("en-US", { month: "long" })
}

const TrendPill = ({ change, trend }: { change: string; trend: "up" | "down" }) => (
  <span
    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
    style={{
      backgroundColor: trend === "up" ? "#dcfce7" : "#fee2e2",
      color: trend === "up" ? "#15803d" : "#b91c1c",
    }}
  >
    {trend === "up" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
    {change}
  </span>
)

// ── Real bar chart for the earnings trend (recharts) ─────────────────
const EarningsTrend = ({ data }: { data: MonthlyEarningStat[] }) => {
  const chartData = [...data].reverse().map((d) => ({
    month: monthLabel(d.month).slice(0, 3),
    amount: d.amount,
  }))

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0d8cf" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#a08070" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#a08070" }} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={(value: number) => [`₹${value.toLocaleString()}`, "Earnings"]}
          contentStyle={{ borderRadius: 8, border: "1px solid #e0d8cf", fontSize: 12 }}
        />
        <Bar dataKey="amount" radius={[6, 6, 0, 0]} fill="#4a3728" />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Donut chart for service popularity ───────────────────────────────
const ServicesDonut = ({
  data,
}: {
  data: { name: string; bookings: number; color: string }[]
}) => (
  <ResponsiveContainer width="100%" height={180}>
    <PieChart>
      <Pie data={data} dataKey="bookings" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={3}>
        {data.map((entry, idx) => (
          <Cell key={idx} fill={entry.color} />
        ))}
      </Pie>
      <Tooltip
        formatter={(value: number, name: string) => [`${value} bookings`, name]}
        contentStyle={{ borderRadius: 8, border: "1px solid #e0d8cf", fontSize: 12 }}
      />
    </PieChart>
  </ResponsiveContainer>
)

// ── Line chart for rating trend over months ──────────────────────────
const RatingTrendChart = ({ data }: { data: RatingTrendStat[] }) => {
  const chartData = data.map((d) => ({
    month: monthLabel(d.month).slice(0, 3),
    rating: d.avgRating,
  }))

  return (
    <ResponsiveContainer width="100%" height={140}>
      <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0d8cf" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#a08070" }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: "#a08070" }} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={(value: number) => [`${value} ★`, "Avg rating"]}
          contentStyle={{ borderRadius: 8, border: "1px solid #e0d8cf", fontSize: 12 }}
        />
        <Line type="monotone" dataKey="rating" stroke="#4a3728" strokeWidth={2} dot={{ r: 3, fill: "#4a3728" }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default function AnalyticsPage({ mentorData }: AnalyticsPageProps) {
  const mentorId: string | undefined = mentorData?.mentorId

  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!mentorData) {
      return
    }
    if (!mentorId) {
      setLoading(false)
      setError("Mentor profile has no mentorId — check MentorService.getMentorByUserId response shape.")
      return
    }
    let cancelled = false

    setLoading(true)
    setError(null)

    MentorService.getMentorDashboardStats(mentorId)
      .then((res) => {
        if (!cancelled) setData(res.data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [mentorId, mentorData])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 rounded-full border-4 border-[#e0d8cf] border-t-[#4a3728] animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center rounded-2xl bg-white" style={{ border: "1px solid #e0d8cf" }}>
        <p className="font-semibold" style={{ color: "#b91c1c" }}>
          {error || "No analytics data found."}
        </p>
      </div>
    )
  }

  const metricCards = [
    {
      label: "Profile Views",
      value: data.profileViews.value.toLocaleString(),
      change: `${data.profileViews.changePercent >= 0 ? "+" : ""}${data.profileViews.changePercent}%`,
      trend: data.profileViews.trend as "up" | "down",
      icon: Eye,
    },
    {
      label: "Booking Rate",
      value: `${data.bookingRate.value}%`,
      change: "—",
      trend: (data.bookingRate.trend as "up" | "down") || "up",
      icon: CalendarCheck,
    },
    {
      label: "Avg Session Duration",
      value: `${data.avgSessionDuration.value} min`,
      change: "—",
      trend: "up" as const,
      icon: Clock,
    },
    // ✅ NEW cards — only render if backend sent the data
    ...(data.cancellationRate
      ? [
          {
            label: "Cancellation Rate",
            value: `${data.cancellationRate.value}%`,
            change: "—",
            trend: (data.cancellationRate.value <= 10 ? "up" : "down") as "up" | "down",
            icon: XCircle,
          },
        ]
      : []),
    ...(data.conversion
      ? [
          {
            label: "View → Booking Rate",
            value: `${data.conversion.rate}%`,
            change: "—",
            trend: "up" as const,
            icon: Percent,
          },
        ]
      : []),
  ]

  const totalBookings = data.popularServices.reduce((sum: number, s: PopularServiceStat) => sum + s.bookings, 0)

  const popularServices = data.popularServices.map((s: PopularServiceStat, idx: number) => {
    const meta = SERVICE_ICON_MAP[s.sessionType] || {
      icon: Users,
      color: FALLBACK_COLORS[idx % FALLBACK_COLORS.length],
    }
    return {
      name: s.sessionType,
      bookings: s.bookings,
      revenue: s.revenue || 0,
      percentage: totalBookings ? Math.round((s.bookings / totalBookings) * 100) : 0,
      icon: meta.icon,
      color: meta.color,
    }
  })

  const totalEarnings = data.monthlyEarnings.reduce((sum: number, e: MonthlyEarningStat) => sum + e.amount, 0)
  const totalServiceRevenue = popularServices.reduce((sum, s) => sum + s.revenue, 0)

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#4a3728" }}>
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: "#4a3728" }}>
              Analytics
            </h2>
            <p style={{ color: "#8a7a6a" }} className="text-sm">
              Track your growth
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl" style={{ backgroundColor: "#4a3728" }}>
          <TrendingUp className="w-4 h-4 text-white" />
          <span className="text-sm font-bold text-white">
            {totalBookings} bookings · ₹{totalEarnings.toLocaleString()}
          </span>
          <span className="text-xs text-white/70">last 4 months</span>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {metricCards.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white p-5 rounded-2xl transition-all hover:border-[#c9baa9] hover:-translate-y-0.5"
            style={{ border: "1px solid #e0d8cf", boxShadow: "0 1px 3px rgba(74,55,40,0.04)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#f3ece4" }}>
                <stat.icon className="w-4.5 h-4.5" style={{ color: "#7a5c3e" }} />
              </div>
              <TrendPill change={stat.change} trend={stat.trend} />
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: "#8a7a6a" }}>
              {stat.label}
            </p>
            <p className="text-3xl font-bold" style={{ color: "#4a3728" }}>
              {stat.value}
            </p>
            <p className="text-xs mt-1" style={{ color: "#a08070" }}>
              vs last month
            </p>
          </div>
        ))}
      </div>

      {/* Two-column detailed sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Popular Services */}
        <div
          className="bg-white p-6 rounded-2xl"
          style={{ border: "1px solid #e0d8cf", boxShadow: "0 1px 3px rgba(74,55,40,0.04)" }}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold" style={{ color: "#4a3728" }}>
              Popular Services
            </h3>
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: "#f3ece4", color: "#7a5c3e" }}
            >
              {totalBookings} total bookings
            </span>
          </div>

          {popularServices.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: "#a08070" }}>
              No completed sessions yet.
            </p>
          ) : (
            <>
              <ServicesDonut data={popularServices} />

              <div className="space-y-5 mt-4">
                {popularServices.map((service, idx: number) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center"
                          style={{ backgroundColor: `${service.color}1a` }}
                        >
                          <service.icon className="w-3.5 h-3.5" style={{ color: service.color }} />
                        </div>
                        <span className="text-sm font-semibold" style={{ color: "#4a3728" }}>
                          {service.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold block" style={{ color: "#7a5c3e" }}>
                          {service.bookings} bookings
                        </span>
                        {service.revenue > 0 && (
                          <span className="text-xs" style={{ color: "#a08070" }}>
                            ₹{service.revenue.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-full h-2.5 rounded-full" style={{ backgroundColor: "#f0e9e1" }}>
                      <div
                        className="h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${service.percentage}%`, backgroundColor: service.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {totalServiceRevenue > 0 && (
                <p className="text-xs mt-4 text-right" style={{ color: "#a08070" }}>
                  Total revenue from services: <strong style={{ color: "#4a3728" }}>₹{totalServiceRevenue.toLocaleString()}</strong>
                </p>
              )}
            </>
          )}
        </div>

        {/* Monthly Earnings */}
        <div
          className="bg-white p-6 rounded-2xl"
          style={{ border: "1px solid #e0d8cf", boxShadow: "0 1px 3px rgba(74,55,40,0.04)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold" style={{ color: "#4a3728" }}>
              Monthly Earnings
            </h3>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#f3ece4" }}>
              <Wallet className="w-4 h-4" style={{ color: "#7a5c3e" }} />
            </div>
          </div>

          {data.monthlyEarnings.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: "#a08070" }}>
              No earnings recorded yet.
            </p>
          ) : (
            <>
              <div className="p-3 rounded-xl mb-4" style={{ backgroundColor: "#fbf7f3", border: "1px solid #e0d8cf" }}>
                <EarningsTrend data={data.monthlyEarnings} />
              </div>

              <div className="space-y-3">
                {data.monthlyEarnings.map((earning: MonthlyEarningStat, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-xl transition-colors hover:border-[#c9baa9]"
                    style={{ backgroundColor: "#fbf7f3", border: "1px solid #e0d8cf" }}
                  >
                    <span className="font-semibold text-sm" style={{ color: "#4a3728" }}>
                      {monthLabel(earning.month)}
                    </span>
                    <div className="text-right">
                      <p className="font-bold" style={{ color: "#4a3728" }}>
                        ₹{earning.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ✅ NEW: Rating trend — only renders if backend sends ratingTrend */}
      {data.ratingTrend && data.ratingTrend.length > 0 && (
        <div
          className="bg-white p-6 rounded-2xl"
          style={{ border: "1px solid #e0d8cf", boxShadow: "0 1px 3px rgba(74,55,40,0.04)" }}
        >
          <h3 className="text-base font-bold mb-4" style={{ color: "#4a3728" }}>
            Rating Trend
          </h3>
          <RatingTrendChart data={data.ratingTrend} />
        </div>
      )}
    </div>
  )
}