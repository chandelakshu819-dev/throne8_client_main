import React, { useMemo, useEffect, useState, useCallback } from "react"
import { CalendarClock, Star, CreditCard, Bell, MessageSquare, CheckCheck, BellRing, Trash2 } from "lucide-react"
import AuthService from "@/lib/api/auth.service"
import ProfileService from "@/lib/api/profile.service"
import { useRouter } from "next/navigation"
import { useNotificationNavigator, hasNotificationTarget } from "@/features/mentorship/utils/notificationRouting"

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

type NotificationType = string

type NotificationItem = {
  _id?: string
  type?: NotificationType
  rawType?: string
  title?: string
  message?: string
  createdAt?: string
  isRead?: boolean
  data?: any
  metadata?: any
  sender?: any
  senderDetails?: any
}

interface UserDashboardNotificationsPageProps {
  notifications?: NotificationItem[]
  notificationsLoading?: boolean
  onMarkAllRead?: () => void
  onMarkRead?: (id: string) => void
  onDeleteNotification?: (id: string) => Promise<boolean>
  notificationUserId?: string
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

/** Builds up to two initials from a display name, e.g. "Rahul Verma" -> "RV". */
function getInitials(name?: string) {
  if (!name || typeof name !== "string") return "U"
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "U"
  const first = parts[0].charAt(0)
  const second = parts.length > 1 ? parts[parts.length - 1].charAt(0) : ""
  return (first + second).toUpperCase()
}

/** Picks the raw actor id (the person who triggered the notification) from the notification data. */
function getActorId(item: NotificationItem): string | null {
  const raw =
    item.data?.viewerId ||
    item.data?.menteeId ||
    item.data?.mentorId ||
    item.data?.actorId ||
    item.data?.senderId ||
    item.data?.userId ||
    item.data?.actor
  if (!raw) return null
  if (typeof raw === "string") return raw
  return raw?._id || raw?.id || null
}

/** Display name of the actor, taken from whatever the server attached. */
function getActorName(item: NotificationItem): string {
  const name =
    item.data?.actorName ||
    item.data?.mentorName ||
    item.metadata?.mentorName ||
    item.data?.menteeName ||
    item.metadata?.menteeName ||
    item.data?.user?.name ||
    item.metadata?.user?.name
  return typeof name === "string" ? name : ""
}

/** Photo the server already attached to the notification (no extra fetch needed). */
function getInlinePhoto(item: NotificationItem): string | null {
  const photo =
    item.data?.actorPhoto ||
    item.data?.mentorProfileImage ||
    item.metadata?.mentorProfileImage ||
    item.data?.menteePhoto ||
    item.data?.menteeProfileImage ||
    item.metadata?.menteeProfileImage ||
    item.sender?.avatar ||
    item.senderDetails?.avatar ||
    item.data?.user?.avatar ||
    item.metadata?.user?.avatar ||
    item.data?.actor?.avatar ||
    item.data?.sender?.avatar ||
    item.data?.user?.profilePhoto ||
    item.data?.sender?.profilePhoto ||
    item.data?.user?.profileImage ||
    item.data?.actor?.profileImage ||
    item.metadata?.actor?.profileImage
  return typeof photo === "string" && photo ? photo : null
}

export default function UserDashboardNotificationsPage({
  notifications = [],
  notificationsLoading = false,
  onMarkAllRead,
  onMarkRead,
  onDeleteNotification,
  notificationUserId = "",
}: UserDashboardNotificationsPageProps) {
  const router = useRouter()
  const groups = useMemo(() => groupByRecency(notifications), [notifications])
  const unreadCount = notifications.filter((n) => !n.isRead).length

  const [avatarsMap, setAvatarsMap] = useState<Record<string, string>>({})
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showNotice = useCallback((msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }, [])
  const openNotification = useNotificationNavigator({
    role: "mentee",
    userId: notificationUserId,
    onNotice: showNotice,
  })

  const handleDelete = async () => {
    if (!deleteConfirmId || !onDeleteNotification) return
    setIsDeleting(true)
    const success = await onDeleteNotification(deleteConfirmId)
    setIsDeleting(false)
    setDeleteConfirmId(null)
    setToastMessage(success ? "Notification deleted successfully." : "Failed to delete notification.")
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Fetch avatars only for actors whose photo was NOT already attached by the server
  useEffect(() => {
    const idsToFetch = new Set<string>()
    notifications.forEach((item) => {
      const actorId = getActorId(item)
      if (actorId && !getInlinePhoto(item) && !avatarsMap[actorId]) {
        idsToFetch.add(actorId)
      }
    })

    if (idsToFetch.size === 0) return

    AuthService.getUsersBulk(Array.from(idsToFetch))
      .then(async (res) => {
        const users = res?.data?.users || res?.users || res?.data || []
        const newMap: Record<string, string> = {}
        if (Array.isArray(users)) {
          await Promise.all(
            users.map(async (u: any) => {
              if (u && (u.userId || u._id)) {
                let avatar =
                  u.profilePhotoUrl ||
                  u.profileImage ||
                  u.avatar?.url ||
                  u.avatar ||
                  u.profilePhoto ||
                  u.profileImageUrl

                if (!avatar && u.profilePhotoId) {
                  try {
                    const photoRes = await ProfileService.getProfilePhotoById(u.profilePhotoId)
                    avatar =
                      photoRes?.data?.photo?.cloudinarySecureUrl ||
                      photoRes?.data?.cloudinarySecureUrl ||
                      photoRes?.cloudinarySecureUrl
                  } catch (err) {
                    console.error("Failed to fetch profile photo:", err)
                  }
                }

                if (avatar) {
                  newMap[u.userId || u._id] = avatar
                }
              }
            })
          )
        }
        setAvatarsMap((prev) => ({ ...prev, ...newMap }))
      })
      .catch(console.error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications])

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto pb-10">
      {/* Header (not sticky, so it is never clipped at the top) */}
      <div
        className="flex items-center justify-between flex-wrap gap-4 bg-white p-5 sm:p-6 rounded-2xl shadow-sm"
        style={{ border: `1px solid ${COLORS.hairline}` }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center relative"
            style={{ backgroundColor: COLORS.ink }}
          >
            <Bell className="w-6 h-6 text-white" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                style={{ backgroundColor: "#b91c1c", border: "2px solid #fff" }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold leading-tight" style={{ color: COLORS.ink }}>
              Notifications
            </h2>
            <p style={{ color: COLORS.muted }} className="text-sm mt-0.5">
              {notificationsLoading
                ? "Loading your notifications..."
                : notifications.length === 0
                ? "No notifications yet"
                : unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                : "You're all caught up"}
            </p>
          </div>
        </div>

        {unreadCount > 0 && onMarkAllRead && (
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
            <div
              className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: `${COLORS.accent} transparent transparent transparent` }}
            ></div>
            <p className="text-sm font-medium" style={{ color: COLORS.muted }}>
              Loading notifications...
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!notificationsLoading && notifications.length === 0 && (
        <div
          className="flex flex-col items-center justify-center gap-4 py-24 rounded-2xl text-center bg-white"
          style={{ border: `1px solid ${COLORS.hairline}` }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: COLORS.chip }}
          >
            <BellRing className="w-8 h-8" style={{ color: COLORS.accent }} />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-1" style={{ color: COLORS.ink }}>
              No notifications yet
            </h3>
            <p className="text-sm max-w-sm mx-auto" style={{ color: COLORS.muted }}>
              When you book sessions, receive messages, or get updates on payments and waitlists, they will appear here.
            </p>
          </div>
        </div>
      )}

      {/* Grouped feed */}
      {!notificationsLoading &&
        groups.map((group) => (
          <div key={group.label} className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider pl-1" style={{ color: COLORS.muted }}>
              {group.label}
            </h3>
            <div className="space-y-3">
              {group.items.map((item, idx) => {
                const Icon = TYPE_ICON[item.type ?? "system"] ?? Bell
                const isInteractive = !item.isRead && item._id
                const isPayment = Boolean(item.type?.includes("payment"))

                const actorId = getActorId(item)
                const actorName = isPayment ? "" : getActorName(item)
                const avatarUrl = actorId ? getInlinePhoto(item) || avatarsMap[actorId] || null : null
                const actorRole = item.data?.mentorName || item.metadata?.mentorName ? "Mentor" : ""

                const handleUserClick = (e: React.MouseEvent) => {
                  if (!actorId) return
                  e.stopPropagation()
                  if (isInteractive) onMarkRead?.(item._id!)
                  router.push(`/profile/${actorId}`)
                }

                return (
                  <div
                    key={item._id ?? idx}
                    onClick={() => {
                      if (isInteractive) onMarkRead?.(item._id!)
                      void openNotification(item)
                    }}
                    className={`group w-full flex items-start gap-4 p-4 sm:p-5 rounded-2xl text-left transition-all duration-200 motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-md ${
                      isInteractive || hasNotificationTarget(item)
                        ? "hover:border-[#c9baa9] cursor-pointer"
                        : "cursor-default"
                    }`}
                    style={{
                      backgroundColor: item.isRead ? "#fff" : COLORS.softWash,
                      border: `1px solid ${item.isRead ? COLORS.hairline : COLORS.gold}`,
                    }}
                  >
                    {/* Avatar (or type icon) with a small type badge */}
                    {actorId ? (
                      <div
                        className={`relative w-12 h-12 shrink-0 ${
                          actorId ? "cursor-pointer" : ""
                        }`}
                        onClick={handleUserClick}
                      >
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={actorName || "User"}
                            className="w-12 h-12 rounded-full object-cover transition-opacity hover:opacity-80"
                            style={{ border: `1px solid ${COLORS.hairline}` }}
                          />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-base transition-opacity hover:opacity-80"
                            style={{ backgroundColor: COLORS.ink, border: `1px solid ${COLORS.hairline}` }}
                          >
                            {getInitials(actorName)}
                          </div>
                        )}
                        <span
                          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: COLORS.chip, border: "2px solid #fff" }}
                        >
                          <Icon className="w-2.5 h-2.5" style={{ color: COLORS.accent }} />
                        </span>
                      </div>
                    ) : (
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: item.isRead ? COLORS.wash : COLORS.chip }}
                      >
                        <Icon className="w-5 h-5" style={{ color: item.isRead ? COLORS.muted : COLORS.accent }} />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      {/* Who sent it */}
                      {actorName && (
                        <p className="text-xs font-semibold mb-0.5 truncate" style={{ color: COLORS.accent }}>
                          {actorName}
                          {actorRole ? <span style={{ color: COLORS.muted }}> · {actorRole}</span> : null}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mb-1">
                        <p
                          className="text-base leading-snug"
                          style={{ color: COLORS.ink, fontWeight: item.isRead ? 600 : 700 }}
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

                      <p
                        className="text-sm break-words whitespace-pre-wrap leading-relaxed"
                        style={{ color: item.isRead ? COLORS.muted : "#5c4a3a" }}
                      >
                        {item.message}
                      </p>

                      {hasNotificationTarget(item) && (
                        <div className="mt-2.5">
                          <span
                            className="inline-flex items-center text-xs font-semibold hover:underline"
                            style={{ color: COLORS.accent }}
                          >
                            View Details →
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end shrink-0 gap-2">
                      <span className="text-xs font-semibold whitespace-nowrap" style={{ color: COLORS.muted }}>
                        {timeAgo(item.createdAt)}
                      </span>
                      {onDeleteNotification && item._id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteConfirmId(item._id!)
                          }}
                          className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 text-red-400 hover:text-red-600 focus:opacity-100"
                          title="Delete notification"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

      {/* Toast */}
      {toastMessage && (
        <div
          className="fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fadeIn"
          style={{ backgroundColor: COLORS.ink, color: "white" }}
        >
          <CheckCheck className="w-4 h-4" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl animate-fadeIn">
            <h3 className="text-lg font-bold mb-2" style={{ color: COLORS.ink }}>
              Delete Notification
            </h3>
            <p className="text-sm mb-6" style={{ color: COLORS.muted }}>
              Delete this notification permanently?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors hover:bg-gray-100"
                style={{ color: COLORS.ink }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 flex items-center gap-2"
                style={{ backgroundColor: "#b91c1c" }}
              >
                {isDeleting && (
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}