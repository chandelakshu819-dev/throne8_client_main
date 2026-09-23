"use client";
//src/features/mentorship/components/user-dashboard/UserDashboardLayout.tsx
import { useEffect, useState, useCallback } from "react";
import UserSidebar from "./UserSidebar";
import UserDashboardOverviewPage from "./UserDashboardOverviewPage";
import UserDashboardProgressPage from "./UserDashboardProgressPage";
import UserDashboardQueriesPage from "./UserDashboardQueriesPage";
import UserDashboardUpcomingSessionsPage from "./UserDashboardUpcomingSessionsPage";
import UserDashboardMyMentorsPage from "./UserDashboardMyMentorsPage";
import UserDashboardMyBookingsPage from "./UserDashboardMyBookingsPage";
import UserDashboardSessionHistoryPage from "./UserDashboardSessionHistoryPage";
import UserDashboardGroupSessionsPage from "./UserDashboardGroupSessionsPage";
import UserDashboardWaitlistPage from "./UserDashboardWaitlistPage";
import UserDashboardReviewsPage from "./UserDashboardReviewsPage";
import UserDashboardPaymentsPage from "./UserDashboardPaymentsPage";
import UserDashboardNotificationsPage from "./UserDashboardNotificationsPage";
import UserDashboardRecommendedMentorsPage from "./UserDashboardRecommendedMentorsPage";
import UserDashboardProfilePreferencesPage from "./UserDashboardProfilePreferencesPage";
import { useRouter } from "next/navigation";
import SessionService from "@/lib/api/session.service";
import NotificationService from "@/lib/api/notification.service";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { useSocket } from "@/core/realtime/useSocket";


const pageComponents: Record<string, React.FC<any>> = {
  dashboard: UserDashboardOverviewPage,
  "profile-preferences": UserDashboardProfilePreferencesPage,
  profile: UserDashboardProfilePreferencesPage,
  progress: UserDashboardProgressPage,
  queries: UserDashboardQueriesPage,
  "upcoming-sessions": UserDashboardUpcomingSessionsPage,
  "my-mentors": UserDashboardMyMentorsPage,
  "my-bookings": UserDashboardMyBookingsPage,
  "session-history": UserDashboardSessionHistoryPage,
  "group-sessions": UserDashboardGroupSessionsPage,
  waitlist: UserDashboardWaitlistPage,
  reviews: UserDashboardReviewsPage,
  payments: UserDashboardPaymentsPage,
  notifications: UserDashboardNotificationsPage,
  "recommended-mentors": UserDashboardRecommendedMentorsPage,
};

function normalizeNotifications(res: any): any[] {
  const data = res?.data ?? res;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.notifications)) return data.notifications;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export default function UserDashboardLayout({ userId, isMentor, onSwitchRole }: { userId: string; isMentor?: boolean; onSwitchRole?: () => void }) {
  const router = useRouter();
  const [activePage, setActivePage] = useState("dashboard");
  const [sessions, setSessions] = useState<any[]>([]);
  const { user } = useAuth();
  const { userProfileData, loadProfile } = useProfile();

  useEffect(() => {
    if (!userProfileData && typeof loadProfile === "function") {
      loadProfile();
    }
  }, [userProfileData, loadProfile]);

  // ✅ "your mentor started the session" live banner. Persistent by design —
  // session:started fires once, real-time, and the mentee could be on any
  // tab (Payments, Reviews, etc). A silent auto-redirect would yank them
  // away without warning, so we surface a dismissible Join Now banner
  // instead and let them join on their own terms.
  const [liveSession, setLiveSession] = useState<{
    sessionId: string;
    bookingId: string;
    roomId: string;
    title: string;
  } | null>(null);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  // ✅ Realtime socket hook: pushes 'notification:new' and 'session:started'
  // the instant the backend emits them
  const { latestNotification, sessionStarted } = useSocket();

  const fetchNotifications = useCallback(() => {
    setNotificationsLoading(true);
    NotificationService.getMentorshipNotifications({ limit: 50 })
      .then((res) => setNotifications(normalizeNotifications(res)))
      .catch((err) => {
        console.error("Failed to fetch notifications:", err);
        setNotifications([]);
      })
      .finally(() => setNotificationsLoading(false));
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetchNotifications();
  }, [userId, fetchNotifications]);

  // ✅ Prepend realtime notification to state immediately
  useEffect(() => {
    if (!latestNotification) return;
    setNotifications((prev) => {
      const already = (Array.isArray(prev) ? prev : []).some(
        (n) => n._id === latestNotification.notificationId || n.notificationId === latestNotification.notificationId
      );
      if (already) return prev;

      const rawType = latestNotification.type || "";
      const mappedType =
        rawType.includes("booking") || rawType.includes("session") || rawType.includes("waitlist") ? "booking" :
        rawType.includes("review") ? "review" :
        rawType.includes("payment") || rawType.includes("refund") || rawType.includes("package") || rawType.includes("credit") ? "payment" :
        rawType.includes("query") ? "message" :
        "system";

      return [
        {
          _id: latestNotification.notificationId,
          notificationId: latestNotification.notificationId,
          type: mappedType,
          title: latestNotification.title,
          message: latestNotification.message,
          createdAt: latestNotification.createdAt,
          isRead: false,
        },
        ...(Array.isArray(prev) ? prev : []),
      ];
    });
  }, [latestNotification]);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await NotificationService.markAllMentorshipNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  }, []);

  const handleMarkRead = useCallback(async (id: string) => {
    try {
      await NotificationService.markMentorshipNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  }, []);

  const fetchSessions = useCallback(() => {
    if (!userId) return;
    SessionService.getAllSessions({ role: "mentee", limit: 100 })
      .then((res) => setSessions(res.data || []))
      .catch(console.error);
  }, [userId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // ✅ Real-time "mentor started the session" listener via useSocket()
  useEffect(() => {
    if (!sessionStarted) return;
    setLiveSession({
      sessionId: sessionStarted.sessionId,
      bookingId: sessionStarted.bookingId,
      roomId: sessionStarted.roomId || sessionStarted.bookingId,
      title: sessionStarted.title,
    });
    fetchSessions();
  }, [sessionStarted, fetchSessions]);

  // ✅ FIXED: was pointing at "/mentorship/mentor-session" — a route that
  // doesn't exist in the app. The mentor's "Start" button in BookingsPage.tsx
  // navigates to `/mentorship/session-room/${sessionId}`, so the mentee must
  // land on the SAME route or the two sides never end up in the same
  // WebRTC room.
  const handleJoinLiveSession = () => {
    if (!liveSession) return;
    router.push(`/mentorship/session-room/${liveSession.sessionId}`);
    setLiveSession(null);
  };

  const CurrentPage = pageComponents[activePage] || UserDashboardOverviewPage;
  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  return (
    <div className="flex flex-col h-screen bg-[#f6ede8]">
    <div className="h-20 shrink-0" aria-hidden="true" />
    {liveSession && (
      <div
        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-5 py-3 rounded-2xl shadow-lg"
        style={{ background: "#4a3728" }}
      >
        <span className="text-sm font-semibold text-white">
          🔴 Your mentor started "{liveSession.title}"
        </span>
        <button
          onClick={handleJoinLiveSession}
          className="px-4 py-1.5 rounded-lg text-xs font-bold transition-opacity hover:opacity-90"
          style={{ background: "white", color: "#4a3728" }}
        >
          Join Now →
        </button>
        <button
          onClick={() => setLiveSession(null)}
          className="text-white/70 hover:text-white text-xs"
        >
          ✕
        </button>
      </div>
    )}
    <div className="flex flex-1 min-h-0">
        <UserSidebar
          activePage={activePage}
          setActivePage={setActivePage}
          unreadNotificationCount={safeNotifications.filter((n) => !n.isRead).length}
          isMentor={isMentor}
          onSwitchRole={onSwitchRole}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 md:px-6 py-8 max-w-[1600px] mx-auto">
            <CurrentPage
              setActivePage={setActivePage}
              sessions={sessions}
              user={userProfileData ? { ...user, ...userProfileData } : user}
              notifications={safeNotifications}
              notificationsLoading={notificationsLoading}
              onMarkAllRead={handleMarkAllRead}
              onMarkRead={handleMarkRead}
            />
          </div>
        </main>
      </div>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f6ede8; }
        ::-webkit-scrollbar-thumb { background: #d8cec4; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #7a5c3e; }
      `}</style>
    </div>
  );
}
