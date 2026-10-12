"use client";
import React, { useEffect, useState, useCallback } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import SeniorMentorApplicationService, { SeniorMentorApplication } from "@/lib/api/seniorMentorApplication.service";
import MentorService from "@/lib/api/mentorship.service";
import NotificationService from "@/lib/api/notification.service";
import { useSocket } from "@/core/realtime/useSocket";
import SeniorMentorSidebar from "./SeniorMentorSidebar";
import SeniorProfilePage from "./SeniorProfilePage";
import SeniorMentorServicesPage from "./SeniorMentorServicesPage";
import SeniorBookingsPage from "./SeniorBookingsPage";
import SeniorAnalyticsPage from "./SeniorAnalyticsPage";
import SeniorMentorAvailabilityPage from "./SeniorMentorAvailabilityPage";
import NotificationPage from "../dashboard/NotificationPage";
import { useRouter } from "next/navigation";

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

  // ── Notification states (mentorship-scoped) ─────────────────
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const { latestNotification } = useSocket();

  const fetchNotifications = useCallback(() => {
    setNotificationsLoading(true);
    NotificationService.getMentorshipNotifications({ limit: 50 })
      .then((res) => setNotifications(normalizeNotifications(res)))
      .catch((err) => {
        console.error("Failed to fetch mentorship notifications:", err);
        setNotifications([]);
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
    setNotifications((prev) =>
      (Array.isArray(prev) ? prev : []).map((n) => (n._id === id || n.notificationId === id ? { ...n, isRead: true } : n))
    );
    NotificationService.markMentorshipNotificationRead(id).catch((err) => {
      console.error("Failed to mark notification as read:", err);
      fetchNotifications();
    });
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => (Array.isArray(prev) ? prev : []).map((n) => ({ ...n, isRead: true })));
    NotificationService.markAllMentorshipNotificationsRead().catch((err) => {
      console.error("Failed to mark all notifications as read:", err);
      fetchNotifications();
    });
  };

  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    if (!userId) return;
    
    Promise.all([
      SeniorMentorApplicationService.getMyApplication(),
      MentorService.getMentorByUserId(userId).catch(err => {
        // Specifically catch and log, as not all users might have a provisioned Mentor profile yet
        console.warn("Mentor profile fetch warning:", err);
        return null;
      })
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
      <div className="h-20 shrink-0" aria-hidden="true" />
      
      <div className="flex flex-1 min-h-0">
        <SeniorMentorSidebar
          application={application}
          activeTab={activeTab}
          unreadNotificationCount={unreadNotificationCount}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="px-4 md:px-6 py-8 max-w-[1600px] mx-auto">
            {activeTab === 'profile' && <SeniorProfilePage seniorData={application} />}
            {activeTab === 'services' && <SeniorMentorServicesPage seniorData={application} />}
            {activeTab === 'bookings' && <SeniorBookingsPage seniorData={application} />}
            {activeTab === 'analytics' && <SeniorAnalyticsPage seniorData={application} />}
            {activeTab === 'notifications' && (
              <NotificationPage
                notifications={notifications}
                notificationsLoading={notificationsLoading}
                onMarkRead={handleMarkNotificationRead}
                onMarkAllRead={handleMarkAllNotificationsRead}
              />
            )}
            {activeTab === 'availability' && <SeniorMentorAvailabilityPage mentorData={application} />}
          </div>
        </main>
      </div>
    </div>
  );
}
