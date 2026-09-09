// mentorDashboard/components/NotificationPage.tsx
import React, { useMemo } from "react"
import { CalendarClock, Star, CreditCard, Bell, MessageSquare, CheckCheck } from "lucide-react"

const COLORS = {
  ink: "#4a3728",
  accent: "#7a5c3e",
  hairline: "#e0d8cf",
  wash: "#f6ede8",
  paper: "#fffdfb",
  gold: "#c9a87c",
  muted: "#8a7a6a",
}

type NotificationType = "booking" | "review" | "payment" | "message" | "system"

type NotificationItem = {
  _id?: string
  type?: NotificationType
  title?: string
  message?: string
  createdAt?: string
  isRead?: boolean
}

interface NotificationPageProps {
  notifications?: NotificationItem[]
  onMarkAllRead?: () => void
  onMarkRead?: (id: string) => void
}

const TYPE_ICON: Record<NotificationType, React.FC<any>> = {
  booking: CalendarClock,
  review: Star,
  payment: CreditCard,
  message: MessageSquare,
  system: Bell,
}

// Fallback sample data so the page has a sensible look before the real
// notification feed is wired up to the backend.
const SAMPLE: NotificationItem[] = [
  {
    _id: "1",
    type: "booking",
    title: "New session booked",
    message: "A student booked a Consultation session with you for today, 1:30 PM.",
    createdAt: new Date().toISOString(),
    isRead: false,
  },
  {
    _id: "2",
    type: "review",
    title: "New review received",
    message: "You received a 5-star review — \"Excellent mentor, very patient.\"",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    isRead: false,
  },
  {
    _id: "3",
    type: "payment",
    title: "Payment received",
    message: "Payout for last week's sessions has been processed.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    isRead: true,
  },
  {
    _id: "4",
    type: "system",
    title: "Verification reminder",
    message: "Complete your identity verification to unlock the trust badge.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    isRead: true,
  },
]

function timeAgo(iso?: string) {
  if (!iso) return ""
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ""
  const diffMs = Date.now() - d.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString([], { day: "numeric", month: "short" })
}

function groupByRecency(items: NotificationItem[]) {
  const today: NotificationItem[] = []
  const thisWeek: NotificationItem[] = []
  const earlier: NotificationItem[] = []

  const now = new Date()
  items.forEach((item) => {
    const d = new Date(item.createdAt || 0)
    if (isNaN(d.getTime())) {
      earlier.push(item)
      return
    }
    const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    if (d.toDateString() === now.toDateString()) today.push(item)
    else if (diffDays <= 7) thisWeek.push(item)
    else earlier.push(item)
  })

  return [
    { label: "Today", items: today },
    { label: "This week", items: thisWeek },
    { label: "Earlier", items: earlier },
  ].filter((g) => g.items.length > 0)
}

export default function NotificationPage({
  notifications,
  onMarkAllRead,
  onMarkRead,
}: NotificationPageProps) {
  const data = notifications && notifications.length > 0 ? notifications : SAMPLE
  const groups = useMemo(() => groupByRecency(data), [data])
  const unreadCount = data.filter((n) => !n.isRead).length

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: COLORS.ink }}>
            Notifications
          </h2>
          <p style={{ color: COLORS.muted }} className="text-sm mt-1">
            {unreadCount > 0
              ? `${unreadCount} unread update${unreadCount > 1 ? "s" : ""}`
              : "You're all caught up"}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-1.5 text-sm font-semibold hover:underline shrink-0 mt-1"
            style={{ color: COLORS.accent }}
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Empty state */}
      {data.length === 0 && (
        <div
          className="text-sm py-12 text-center rounded-xl"
          style={{ color: COLORS.muted, backgroundColor: COLORS.wash, border: `1px solid ${COLORS.hairline}` }}
        >
          Nothing here yet. Booking requests, reviews and payment updates will show up as they happen.
        </div>
      )}

      {/* Grouped feed */}
      {groups.map((group) => (
        <div key={group.label}>
          <h3
            className="text-xs font-bold uppercase tracking-wide mb-3"
            style={{ color: COLORS.muted }}
          >
            {group.label}
          </h3>
          <div>
            {group.items.map((item, idx) => {
              const Icon = TYPE_ICON[item.type ?? "system"] ?? Bell
              return (
                <button
                  key={item._id ?? idx}
                  onClick={() => item._id && onMarkRead?.(item._id)}
                  className="w-full flex items-start gap-4 py-4 text-left"
                  style={{ borderTop: `1px solid ${COLORS.hairline}` }}
                >
                  <span
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: COLORS.wash, border: `1px solid ${COLORS.hairline}` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: COLORS.accent }} />
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className="text-sm"
                        style={{
                          color: COLORS.ink,
                          fontWeight: item.isRead ? 500 : 700,
                        }}
                      >
                        {item.title}
                      </p>
                      {!item.isRead && (
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: COLORS.accent }}
                        />
                      )}
                    </div>
                    <p className="text-sm mt-0.5" style={{ color: COLORS.muted }}>
                      {item.message}
                    </p>
                  </div>

                  <span className="text-xs shrink-0 mt-0.5" style={{ color: COLORS.muted }}>
                    {timeAgo(item.createdAt)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}