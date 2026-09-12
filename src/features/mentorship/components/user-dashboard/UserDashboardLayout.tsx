"use client";

import { useEffect, useState, useCallback } from "react";
import UserSidebar from "./UserSidebar";
import UserDashboardOverviewPage from "./UserDashboardOverviewPage";
import UserDashboardUpcomingSessionsPage from "./UserDashboardUpcomingSessionsPage";
import UserDashboardMyMentorsPage from "./UserDashboardMyMentorsPage";
import SessionService from "@/lib/api/session.service";
import NotificationService from "@/lib/api/notification.service";
import { useAuth } from "@/features/auth/hooks/useAuth";

const pageComponents: Record<string, React.FC<any>> = {
  dashboard: UserDashboardOverviewPage,
  "upcoming-sessions": UserDashboardUpcomingSessionsPage,
  "my-mentors": UserDashboardMyMentorsPage,
};

function normalizeNotifications(res: any): any[] {
  const data = res?.data ?? res;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.notifications)) return data.notifications;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export default function UserDashboardLayout({ userId }: { userId: string }) {
  const [activePage, setActivePage] = useState("dashboard");
  const [sessions, setSessions] = useState<any[]>([]);
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

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

  useEffect(() => {
    if (!userId) return;
    SessionService.getAllSessions({ role: "mentee", limit: 100 })
      .then((res) => setSessions(res.data || []))
      .catch(console.error);
  }, [userId]);

  const CurrentPage = pageComponents[activePage] || UserDashboardOverviewPage;
  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  return (
    <div className="flex flex-col h-screen bg-[#f6ede8]">
      <div className="h-20 shrink-0" aria-hidden="true" />
      <div className="flex flex-1 min-h-0">
        <UserSidebar
          activePage={activePage}
          setActivePage={setActivePage}
          unreadNotificationCount={safeNotifications.filter((n) => !n.isRead).length}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 md:px-6 py-8 max-w-[1600px] mx-auto">
            <CurrentPage
              setActivePage={setActivePage}
              sessions={sessions}
              user={user}
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
