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

interface UserDashboardNotificationsPageProps {
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

export default function UserDashboardNotificationsPage({
  notifications = [],
  notificationsLoading = false,
  onMarkAllRead,
  onMarkRead,
}: UserDashboardNotificationsPageProps) {
  const groups = useMemo(() => groupByRecency(notifications), [notifications])
  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white p-6 rounded-2xl" style={{ border: `1px solid ${COLORS.hairline}` }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center relative" style={{ backgroundColor: COLORS.ink }}>
            <Bell className="w-6 h-6 text-white" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
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
            <p style={{ color: COLORS.muted }} className="text-sm mt-0.5">
              {notificationsLoading
                ? "Loading your notifications..."
                : unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                : "You're all caught up"}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-[#eadecc]"
            style={{ color: COLORS.accent, backgroundColor: COLORS.chip }}
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Loading state */}
      {notificationsLoading && (
        <div
          className="flex items-center justify-center py-20 rounded-2xl bg-white"
          style={{ border: `1px solid ${COLORS.hairline}` }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: `${COLORS.accent} transparent transparent transparent` }}></div>
            <p className="text-sm font-medium" style={{ color: COLORS.muted }}>Loading notifications...</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!notificationsLoading && notifications.length === 0 && (
        <div
          className="flex flex-col items-center justify-center gap-4 py-24 rounded-2xl text-center bg-white"
          style={{ border: `1px solid ${COLORS.hairline}` }}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.chip }}>
            <BellRing className="w-8 h-8" style={{ color: COLORS.accent }} />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-1" style={{ color: COLORS.ink }}>No notifications yet</h3>
            <p className="text-sm max-w-sm mx-auto" style={{ color: COLORS.muted }}>
              When you book sessions, receive messages, or get updates on payments and waitlists, they will appear here.
            </p>
          </div>
        </div>
      )}

      {/* Grouped feed */}
      {!notificationsLoading && groups.map((group) => (
        <div key={group.label} className="bg-transparent space-y-3">
          <h3
            className="text-xs font-bold uppercase tracking-wider pl-1"
            style={{ color: COLORS.muted }}
          >
            {group.label}
          </h3>
          <div className="space-y-3">
            {group.items.map((item, idx) => {
              const Icon = TYPE_ICON[item.type ?? "system"] ?? Bell
              
              const isInteractive = !item.isRead && item._id;

              return (
                <div
                  key={item._id ?? idx}
                  onClick={() => {
                    if (isInteractive) {
                      onMarkRead?.(item._id!);
                    }
                  }}
                  className={`w-full flex items-start gap-4 p-4 rounded-2xl text-left transition-all duration-200 motion-reduce:transition-none ${
                    isInteractive 
                      ? 'hover:-translate-y-1 hover:shadow-md hover:border-[#c9baa9] cursor-pointer' 
                      : 'cursor-default'
                  }`}
                  style={{
                    backgroundColor: item.isRead ? "#fff" : COLORS.softWash,
                    border: `1px solid ${item.isRead ? COLORS.hairline : COLORS.gold}`,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: item.isRead ? COLORS.wash : COLORS.chip }}
                  >
                    <Icon className="w-5 h-5" style={{ color: item.isRead ? COLORS.muted : COLORS.accent }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p
                        className="text-base"
                        style={{
                          color: COLORS.ink,
                          fontWeight: item.isRead ? 600 : 700,
                        }}
                      >
                        {item.title}
                      </p>
                      {!item.isRead && (
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: "#b91c1c" }}
                        />
                      )}
                    </div>
                    <p className="text-sm" style={{ color: item.isRead ? COLORS.muted : "#5c4a3a" }}>
                      {item.message}
                    </p>
                  </div>

                  <span className="text-xs shrink-0 mt-1 font-semibold" style={{ color: COLORS.muted }}>
                    {timeAgo(item.createdAt)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
