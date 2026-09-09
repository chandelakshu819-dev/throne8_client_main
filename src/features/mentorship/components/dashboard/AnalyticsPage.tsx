// mentorDashboard/components/AnalyticsPage.tsx
import React from "react"
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

interface AnalyticsPageProps {
  // If you later want to pass real data from parent or context, you can add props here
  // For now it's static like your original code
}

const metricCards = [
  {
    label: "Profile Views",
    value: "1,234",
    change: "+12%",
    trend: "up" as const,
    icon: Eye,
  },
  {
    label: "Booking Rate",
    value: "68%",
    change: "+5%",
    trend: "up" as const,
    icon: CalendarCheck,
  },
  {
    label: "Avg Session Duration",
    value: "52 min",
    change: "-2%",
    trend: "down" as const,
    icon: Clock,
  },
]

const popularServices = [
  { name: "1-on-1 Mentoring", bookings: 45, percentage: 90, icon: Users },
  { name: "Code Review", bookings: 28, percentage: 56, icon: Code2 },
  { name: "Group Sessions", bookings: 32, percentage: 64, icon: Users },
  { name: "Career Guidance", bookings: 43, percentage: 86, icon: Target },
]

const monthlyEarnings = [
  { month: "January", amount: "₹12,500", change: "+8%", trend: "up" as const },
  { month: "December", amount: "₹11,200", change: "+12%", trend: "up" as const },
  { month: "November", amount: "₹10,000", change: "+5%", trend: "up" as const },
  { month: "October", amount: "₹9,500", change: "+15%", trend: "up" as const },
]

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

export default function AnalyticsPage({}: AnalyticsPageProps) {
  // Quick derived summary for the highlight strip
  const totalEarnings = monthlyEarnings.reduce(
    (sum, e) => sum + Number(e.amount.replace(/[₹,]/g, "")),
    0
  )
  const totalBookings = popularServices.reduce((sum, s) => sum + s.bookings, 0)

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
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl"
          style={{ backgroundColor: "#fbf7f3", border: "1px solid #e0d8cf" }}
        >
          <TrendingUp className="w-4 h-4" style={{ color: "#7a5c3e" }} />
          <span className="text-sm font-bold" style={{ color: "#4a3728" }}>
            {totalBookings} bookings · ₹{totalEarnings.toLocaleString()} (last 4 months)
          </span>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {metricCards.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white p-5 rounded-2xl transition-colors hover:border-[#c9baa9]"
            style={{ border: "1px solid #e0d8cf" }}
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
        <div className="bg-white p-6 rounded-2xl" style={{ border: "1px solid #e0d8cf" }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold" style={{ color: "#4a3728" }}>
              Popular Services
            </h3>
            <span className="text-xs font-semibold" style={{ color: "#a08070" }}>
              {totalBookings} total bookings
            </span>
          </div>
          <div className="space-y-5">
            {popularServices.map((service, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <service.icon className="w-3.5 h-3.5" style={{ color: "#a08070" }} />
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
                      backgroundColor: "#4a3728",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Earnings */}
        <div className="bg-white p-6 rounded-2xl" style={{ border: "1px solid #e0d8cf" }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold" style={{ color: "#4a3728" }}>
              Monthly Earnings
            </h3>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#f3ece4" }}>
              <Wallet className="w-4 h-4" style={{ color: "#7a5c3e" }} />
            </div>
          </div>
          <div className="space-y-3">
            {monthlyEarnings.map((earning, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 rounded-xl"
                style={{ backgroundColor: "#fbf7f3", border: "1px solid #e0d8cf" }}
              >
                <span className="font-semibold text-sm" style={{ color: "#4a3728" }}>
                  {earning.month}
                </span>
                <div className="text-right">
                  <p className="font-bold" style={{ color: "#4a3728" }}>
                    {earning.amount}
                  </p>
                  <TrendPill change={earning.change} trend={earning.trend} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}