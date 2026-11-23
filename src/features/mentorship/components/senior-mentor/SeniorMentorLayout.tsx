"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { AlertCircle, Loader2 } from "lucide-react";
import SeniorMentorApplicationService, { SeniorMentorApplication } from "@/lib/api/seniorMentorApplication.service";
import MentorService from "@/lib/api/mentorship.service";
import NotificationService from "@/lib/api/notification.service";
import { isNotificationForRole } from "@/features/mentorship/utils/notificationRouting";
import { useSocket } from "@/core/realtime/useSocket";
import SeniorMentorSidebar from "./SeniorMentorSidebar";
import { useRouter } from "next/navigation";
import BrandWordmark from "@/shared/uiComponents/BrandWordmark";

// Sirf active tab ka code download hoga
const PageLoader = () => (
  <div className="flex items-center justify-center py-24">
    <Loader2 className="w-8 h-8 text-[#4a3728] animate-spin" />
  </div>
);

const lazyPage = (loader: () => Promise<any>) =>
  dynamic(loader, { loading: () => <PageLoader /> }) as React.FC<any>;

const SeniorProfilePage = lazyPage(() => import("./SeniorProfilePage"));
const SeniorMentorServicesPage = lazyPage(() => import("./SeniorMentorServicesPage"));
const SeniorBookingsPage = lazyPage(() => import("./SeniorBookingsPage"));
const SeniorAnalyticsPage = lazyPage(() => import("./SeniorAnalyticsPage"));
const SeniorMentorAvailabilityPage = lazyPage(() => import("./SeniorMentorAvailabilityPage"));
const NotificationPage = lazyPage(() => import("../dashboard/NotificationPage"));

function normalizeNotifications(res: any): any[] {
  const data = res?.data ?? res;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.notifications)) return data.notifications;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export default function SeniorMentorLayout({
  userId,
  activeTab = 'profile',
}: {
  userId: string;
  activeTab?: 'profile' | 'services' | 'availability' | 'bookings' | 'analytics' | 'notifications';
}) {
  const router = useRouter();
  const [application, setApplication] = useState<SeniorMentorApplication | null>(null);
  const [mentorProfile, setMentorProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  // Mobile par sidebar drawer ki tarah khulti hai
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ── Notification states (mentorship-scoped) ─────────────────
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const { latestNotification } = useSocket('senior-mentor');

  const readIdsRef = useRef<Set<string>>(new Set());

  const fetchNotifications = useCallback(() => {
    setNotificationsLoading(true);
    NotificationService.getMentorshipNotifications({ limit: 50, module: 'senior-mentor' })
      .then((res) =>
        setNotifications(
          normalizeNotifications(res).map((n: any) => ({
            ...n,
            isRead: n.isRead || readIdsRef.current.has(n._id),
          }))
        )
      )
      .catch((err) => {
        console.error("Failed to fetch mentorship notifications:", err);
        setNotifications((prev) => (Array.isArray(prev) ? prev : []));
      })
      .finally(() => setNotificationsLoading(false));
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetchNotifications();
  }, [userId, fetchNotifications]);

  // Real-time notification updates via socket
  useEffect(() => {
    if (!latestNotification) return;
    if (latestNotification.module && latestNotification.module !== 'senior-mentor') return;
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
        rawType.includes("query") || rawType.includes("forum") ? "message" :
        "system";

      return [
        {
          _id: latestNotification.notificationId,
          notificationId: latestNotification.notificationId,
          type: mappedType,
          rawType,
          title: latestNotification.title,
          message: latestNotification.message,
          createdAt: latestNotification.createdAt,
          isRead: false,
          data: latestNotification.data || {},
        },
        ...(Array.isArray(prev) ? prev : []),
      ];
    });
  }, [latestNotification]);

  const handleMarkNotificationRead = (id: string) => {
    readIdsRef.current.add(id);
    setNotifications((prev) =>
      (Array.isArray(prev) ? prev : []).map((n) => (n._id === id || n.notificationId === id ? { ...n, isRead: true } : n))
    );
    NotificationService.markMentorshipNotificationRead(id, 'senior-mentor').catch((err) => {
      console.error("Failed to mark notification as read:", err?.response?.status, err);
    });
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      list.forEach((n) => readIdsRef.current.add(n._id));
      return list.map((n) => ({ ...n, isRead: true }));
    });
    NotificationService.markAllMentorshipNotificationsRead('senior-mentor').catch((err) => {
      console.error("Failed to mark all notifications as read:", err?.response?.status, err);
    });
  };

  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    if (!userId) return;

    Promise.all([
      SeniorMentorApplicationService.getMyApplication(),
      MentorService.getMentorByUserId(userId).catch(() => null),
    ])
      .then(([appRes, mentorRes]) => {
        if (appRes) {
          setApplication(appRes);
        } else {
          setErrorMsg("Profile not found or access denied.");
        }

        if (mentorRes && mentorRes.data) {
          setMentorProfile(mentorRes.data);
        }
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || err?.message || 'Unknown network error';
        setErrorMsg(`Error loading profile: ${msg}`);
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-[#f6ede8] items-center justify-center font-sans">
        <Loader2 className="w-12 h-12 text-[#4a3728] animate-spin mb-4" />
        <p className="text-[#4a3728] font-bold">Loading Profile...</p>
      </div>
    );
  }

  if (errorMsg || !application) {
    return (
      <div className="flex flex-col h-screen bg-[#f6ede8] font-sans">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-black text-[#4a3728] mb-2">Error Loading Profile</h2>
          <p className="text-slate-600 font-medium mb-6">{errorMsg || "An unknown error occurred."}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2.5 bg-[#4a3728] text-white rounded-xl font-bold shadow hover:bg-[#7a5c3e] transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#f6ede8] font-sans">
      <div className="h-16 md:h-20 shrink-0" aria-hidden="true" />

      {/* Mobile header: hamburger + wordmark */}
      <div className="md:hidden flex items-center justify-between px-4 h-14 shrink-0 bg-[#fbf7f3] border-b border-[#e0d8cf]">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -ml-2 text-[#4a3728] hover:bg-[#f3ece4] rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
        </button>
        <BrandWordmark size="sm" />
        <div className="w-8" aria-hidden="true" />
      </div>

      <div className="flex flex-1 min-h-0 relative">
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}
        <div
          className={`absolute md:relative z-50 h-full transform transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          } md:transform-none`}
        >
          <SeniorMentorSidebar
            application={application}
            activeTab={activeTab}
            unreadNotificationCount={unreadNotificationCount}
          />
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="px-4 md:px-6 py-8 max-w-[1600px] mx-auto">
            {activeTab === 'profile' && (
              <SeniorProfilePage
                seniorData={application}
                onUpdateApplication={(updated: SeniorMentorApplication) => setApplication(updated)}
              />
            )}
            {activeTab === 'services' && <SeniorMentorServicesPage seniorData={application} />}
            {activeTab === 'bookings' && <SeniorBookingsPage seniorData={application} />}
            {activeTab === 'analytics' && <SeniorAnalyticsPage seniorData={application} />}
            {activeTab === 'notifications' && (
              <NotificationPage
                notifications={notifications.filter((n) => isNotificationForRole(n, "senior-mentor"))}
                notificationsLoading={notificationsLoading}
                onMarkRead={handleMarkNotificationRead}
                onMarkAllRead={handleMarkAllNotificationsRead}
                notificationRole="senior-mentor"
                notificationUserId={userId}
              />
            )}
            {activeTab === 'availability' && <SeniorMentorAvailabilityPage mentorData={application} />}
          </div>
        </main>
      </div>
    </div>
  );
}