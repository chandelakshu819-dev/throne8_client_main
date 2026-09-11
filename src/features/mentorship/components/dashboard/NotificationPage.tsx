// mentorDashboard/components/NotificationPage.tsx
import React, { useMemo } from "react"
import { CalendarClock, Star, CreditCard, Bell, MessageSquare, CheckCheck, BellRing } from "lucide-react"

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
  notificationsLoading?: boolean
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
  notifications = [],
  notificationsLoading = false,
  onMarkAllRead,
  onMarkRead,
}: NotificationPageProps) {
  const groups = useMemo(() => groupByRecency(notifications), [notifications])
  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="space-y-6 animate-fadeIn max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center relative" style={{ backgroundColor: COLORS.ink }}>
            <Bell className="w-5 h-5 text-white" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: "#b91c1c", border: "2px solid #fff" }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: COLORS.ink }}>
              Notifications
            </h2>
            <p style={{ color: COLORS.muted }} className="text-sm">
              {notificationsLoading
                ? "Loading..."
                : unreadCount > 0
                ? `${unreadCount} unread update${unreadCount > 1 ? "s" : ""}`
                : "You're all caught up"}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors hover:border-[#c9baa9]"
            style={{ color: COLORS.accent, backgroundColor: COLORS.softWash, border: `1px solid ${COLORS.hairline}` }}
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Loading state */}
      {notificationsLoading && (
        <div
          className="flex items-center justify-center py-14 rounded-2xl"
          style={{ backgroundColor: COLORS.softWash, border: `1px solid ${COLORS.hairline}` }}
        >
          <p className="text-sm" style={{ color: COLORS.muted }}>Fetching notifications...</p>
        </div>
      )}

      {/* Empty state */}
      {!notificationsLoading && notifications.length === 0 && (
        <div
          className="flex flex-col items-center justify-center gap-3 py-14 rounded-2xl text-center"
          style={{ backgroundColor: COLORS.softWash, border: `1px solid ${COLORS.hairline}` }}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.chip }}>
            <BellRing className="w-5 h-5" style={{ color: COLORS.accent }} />
          </div>
          <p className="text-sm max-w-xs" style={{ color: COLORS.muted }}>
            Nothing here yet. Booking requests, reviews and payment updates will show up as they happen.
          </p>
        </div>
      )}

      {/* Grouped feed */}
      {!notificationsLoading && groups.map((group) => (
        <div key={group.label} className="bg-white p-5 rounded-2xl" style={{ border: `1px solid ${COLORS.hairline}` }}>
          <h3
            className="text-xs font-bold uppercase tracking-wide mb-3 px-1"
            style={{ color: COLORS.muted }}
          >
            {group.label}
          </h3>
          <div className="space-y-2">
            {group.items.map((item, idx) => {
              const Icon = TYPE_ICON[item.type ?? "system"] ?? Bell
              return (
                <button
                  key={item._id ?? idx}
                  onClick={() => item._id && onMarkRead?.(item._id)}
                  className="w-full flex items-start gap-3.5 p-3.5 rounded-xl text-left transition-colors hover:border-[#c9baa9]"
                  style={{
                    backgroundColor: item.isRead ? "transparent" : COLORS.softWash,
                    border: `1px solid ${item.isRead ? "transparent" : COLORS.hairline}`,
                  }}
                >
                  <span
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: COLORS.chip }}
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
                          style={{ backgroundColor: "#b91c1c" }}
                        />
                      )}
                    </div>
                    <p className="text-sm mt-0.5 line-clamp-2" style={{ color: COLORS.muted }}>
                      {item.message}
                    </p>
                  </div>

                  <span className="text-xs shrink-0 mt-0.5 font-medium" style={{ color: COLORS.muted }}>
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