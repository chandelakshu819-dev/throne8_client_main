"use client";

import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Loader2, Trash2, UserPlus, UserCheck, UserX, Video, BellRing } from "lucide-react";

import StudyGroupNotificationService, {
  StudyNotification,
} from "@/lib/api/studyGroupNotification.service";
import StudyGroupService from "@/lib/api/studyGroup.service";

const iconFor = (type: string) => {
  switch (type) {
    case "join_request_received":
      return <UserPlus size={18} className="text-[#8b7355]" />;
    case "join_request_approved":
      return <UserCheck size={18} className="text-green-600" />;
    case "join_request_rejected":
      return <UserX size={18} className="text-red-500" />;
    case "live_room_started":
      return <Video size={18} className="text-red-500" />;
    case "member_reminder":
      return <BellRing size={18} className="text-[#8b7355]" />;
    default:
      return <Bell size={18} className="text-[#8b7355]" />;
  }
};

const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString();
};

export default function StudyNotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<StudyNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // roomId -> groupId of live rooms that are running right now
  const [liveRooms, setLiveRooms] = useState<Record<string, string>>({});

  const refreshLive = useCallback(async () => {
    const rooms = await StudyGroupService.getMyActiveLiveRooms();
    const map: Record<string, string> = {};
    rooms.forEach((r: any) => {
      if (r?.roomId) map[String(r.roomId)] = String(r.groupId);
    });
    setLiveRooms(map);
  }, []);

  useEffect(() => {
    void refreshLive();
    const t = setInterval(refreshLive, 15_000);
    return () => clearInterval(t);
  }, [refreshLive]);

  const handleJoinLive = (e: MouseEvent, n: StudyNotification, groupId: string) => {
    e.stopPropagation();
    if (!n.isRead) {
      setItems((prev) => prev.map((x) => (x.notificationId === n.notificationId ? { ...x, isRead: true } : x)));
      setUnread((c) => Math.max(c - 1, 0));
      StudyGroupNotificationService.markAsRead(n.notificationId).catch(() => {});
    }
    // joinLive=1: the group page joins the live room by itself
    router.push(`/study/my-groups/${groupId}?joinLive=1`);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await StudyGroupNotificationService.getAll({
        limit: 50,
        ...(filter === "unread" ? { isRead: false } : {}),
      });
      setItems(res.notifications);
      setUnread(res.unreadCount);
    } catch (e: any) {
      setError(e?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleOpen = async (n: StudyNotification) => {
    if (!n.isRead) {
      setItems((prev) => prev.map((x) => (x.notificationId === n.notificationId ? { ...x, isRead: true } : x)));
      setUnread((c) => Math.max(c - 1, 0));
      StudyGroupNotificationService.markAsRead(n.notificationId).catch(() => {});
    }
    if (n.link) router.push(n.link);
  };

  const handleMarkAll = async () => {
    try {
      await StudyGroupNotificationService.markAllAsRead();
      setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
      setUnread(0);
    } catch (e: any) {
      setError(e?.message || "Failed to mark all as read");
    }
  };

  const handleDelete = async (n: StudyNotification) => {
    try {
      await StudyGroupNotificationService.remove(n.notificationId);
      setItems((prev) => prev.filter((x) => x.notificationId !== n.notificationId));
      if (!n.isRead) setUnread((c) => Math.max(c - 1, 0));
    } catch (e: any) {
      setError(e?.message || "Failed to delete notification");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-[#4a3728] flex items-center gap-2">
          <Bell size={22} /> Notifications
          {unread > 0 && (
            <span className="text-xs bg-red-500 text-white rounded-full px-2 py-0.5">{unread} new</span>
          )}
        </h1>
        <button
          onClick={handleMarkAll}
          disabled={unread === 0}
          className="flex items-center gap-1.5 text-sm text-[#8b7355] hover:text-[#4a3728] disabled:opacity-40"
        >
          <CheckCheck size={16} /> Mark all as read
        </button>
      </div>

      <div className="flex gap-2 mb-4 bg-[#f6ede8] rounded-xl p-1 w-fit">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${
              filter === f ? "bg-white text-[#4a3728] shadow-sm" : "text-[#8b7355]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      {loading ? (
        <div className="flex items-center justify-center gap-2 text-[#8b7355] py-16">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="text-center text-[#8b7355] py-16">
          <Bell className="w-10 h-10 mx-auto mb-2 opacity-40" />
          {filter === "unread" ? "No unread notifications" : "No notifications yet"}
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li
              key={n.notificationId}
              onClick={() => handleOpen(n)}
              className={`flex items-start gap-3 p-3 sm:p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                n.isRead ? "bg-white border-[#e0d8cf]" : "bg-[#fbf6f0] border-[#d4a574]"
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">{iconFor(n.type)}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm text-[#4a3728] ${n.isRead ? "font-medium" : "font-bold"}`}>{n.title}</p>
                <p className="text-sm text-[#6b5847] break-words">{n.message}</p>
                <p className="text-xs text-[#a89080] mt-1">{timeAgo(n.createdAt)}</p>
                {(n.type === "live_room_started" || n.type === "member_reminder") && n.data?.roomId && (
                  liveRooms[String(n.data.roomId)] ? (
                    <button
                      onClick={(e) => handleJoinLive(e, n, liveRooms[String(n.data!.roomId)])}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#4a3728] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#3a2a1e]"
                    >
                      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
                      Join live now
                    </button>
                  ) : (
                    <span className="mt-2 inline-block rounded-full bg-[#f0e8df] px-3 py-1 text-xs font-semibold text-[#8b7355]">
                      Session ended
                    </span>
                  )
                )}
              </div>
              {!n.isRead && <span className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(n);
                }}
                className="text-[#a89080] hover:text-red-500 flex-shrink-0"
                aria-label="Delete notification"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
