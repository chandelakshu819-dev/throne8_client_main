// mentorDashboard/components/AnalyticsPage.tsx
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
} from "lucide-react"
import MentorService from "@/lib/api/mentorship.service"

interface AnalyticsPageProps {
  mentorData?: any // passed down from DashboardLayout — contains mentorId, title, status, etc.
  [key: string]: any // DashboardLayout spreads many other props onto every page; rest are unused here
}

const SERVICE_ICON_MAP: Record<string, { icon: any; color: string }> = {
  "one-on-one": { icon: Users, color: "#4a3728" },
  "code-review": { icon: Code2, color: "#8a6a4a" },
  "group": { icon: Users, color: "#7a5c3e" },
  "career-guidance": { icon: Target, color: "#5c4632" },
}

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

// ── Mini bar-chart visual for the earnings trend (pure CSS/SVG, no
// extra chart library dependency needed) ─────────────────────────────
const EarningsTrend = ({
  data,
}: {
  data: { month: string; amount: number }[]
}) => {
  const values = data.map((d) => d.amount)
  const max = Math.max(...values, 1)
  // Reverse so oldest month is on the left, most recent on the right
  const ordered = [...data].reverse()

  return (
    <div className="flex items-end justify-between gap-3 h-24 px-1 mb-1">
      {ordered.map((d, idx) => {
        const heightPct = Math.max((d.amount / max) * 100, 8)
        const isLast = idx === ordered.length - 1
        return (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full h-16 flex items-end">
              <div
                className="w-full rounded-t-md transition-all duration-500"
                style={{
                  height: `${heightPct}%`,
                  backgroundColor: isLast ? "#4a3728" : "#d9c9b8",
                }}
              />
            </div>
            <span
              className="text-[10px] font-semibold uppercase tracking-wide"
              style={{ color: isLast ? "#4a3728" : "#a08070" }}
            >
              {monthLabel(d.month).slice(0, 3)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function AnalyticsPage({ mentorData }: AnalyticsPageProps) {
  const mentorId: string | undefined = mentorData?.mentorId

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // mentorData hasn't arrived from DashboardLayout's fetch yet — keep showing the spinner,
    // don't error out. It errors only if mentorData resolved but has no mentorId on it.
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
  ]

  const totalBookings = data.popularServices.reduce((sum: number, s: any) => sum + s.bookings, 0)

  const popularServices = data.popularServices.map((s: any) => {
    const meta = SERVICE_ICON_MAP[s.sessionType] || { icon: Users, color: "#4a3728" }
    return {
      name: s.sessionType,
      bookings: s.bookings,
      percentage: totalBookings ? Math.round((s.bookings / totalBookings) * 100) : 0,
      icon: meta.icon,
      color: meta.color,
    }
  })

  const totalEarnings = data.monthlyEarnings.reduce((sum: number, e: any) => sum + e.amount, 0)

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

        {/* Quick summary chip */}
        <div
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
          style={{ backgroundColor: "#4a3728" }}
        >
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
            <div className="space-y-5">
              {popularServices.map((service: any, idx: number) => (
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
                    <span className="text-sm font-bold" style={{ color: "#7a5c3e" }}>
                      {service.bookings} bookings
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full" style={{ backgroundColor: "#f0e9e1" }}>
                    <div
                      className="h-2.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${service.percentage}%`,
                        backgroundColor: service.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
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
              {/* Trend visual */}
              <div className="p-3 rounded-xl mb-4" style={{ backgroundColor: "#fbf7f3", border: "1px solid #e0d8cf" }}>
                <EarningsTrend data={data.monthlyEarnings} />
              </div>

              <div className="space-y-3">
                {data.monthlyEarnings.map((earning: any, idx: number) => (
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
    </div>
  )
}