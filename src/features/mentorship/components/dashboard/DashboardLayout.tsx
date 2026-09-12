// src/features/mentorship/components/dashboard/DashboardLayout.tsx
"use client";

import { useEffect, useState, useCallback } from "react";

type ServiceType = {
  name: string;
  emoji?: string;
  icon: React.FC<any>;
  description?: string;
};
import { MessageCircle, Wrench, GraduationCap, Dumbbell, CheckSquare } from "lucide-react";

import Sidebar from "./Sidebar";
import DashboardOverviewPage from "./DashboardOverviewPage";
import NotificationPage from "./NotificationPage";
import ProfilePage from "./ProfilePage";
import ServicesPage from "./ServicesPage";
import BookingsPage from "./BookingsPage";
import QueriesPage from "./QueriesPage";
import AvailabilityPage from "./AvailabilityPage";
import PaymentsPage from "./PaymentsPage";
import ReviewsPage from "./ReviewsPage";
import AnalyticsPage from "./AnalyticsPage";
import PlansPage from "./PlansPage";
import TrustScorePage from "./TrustScorePage";
import CommunityPage from "./CommunityPage";
import MentorService from "@/lib/api/mentorship.service";
import SessionService from "@/lib/api/session.service";
import NotificationService from "@/lib/api/notification.service";
import MarketingKitPage from "./MarketingKitPage";
// ✅ NEW — realtime notification push (booking requests, session started, etc.)
import { useSocket } from "@/core/realtime/useSocket";



const SERVICE_TYPES: ServiceType[] = [
  { name: "Consultation", emoji: "💬", icon: MessageCircle, description: "One-on-one consultation sessions" },
  { name: "Workshop", emoji: "🛠️", icon: Wrench, description: "Group learning workshops" },
  { name: "Mentoring", emoji: "🎓", icon: GraduationCap, description: "Long-term mentoring programs" },
  { name: "Coaching", emoji: "🏋️", icon: Dumbbell, description: "Goal-oriented coaching sessions" },
  { name: "Other", emoji: "✅", icon: CheckSquare, description: "Any other custom services" },
];

const pageComponents: Record<string, React.FC<any>> = {
  dashboard: DashboardOverviewPage,
  profile: ProfilePage,
  notification: NotificationPage,
  services: ServicesPage,
  booking: BookingsPage,
  queries: QueriesPage,
  availability: AvailabilityPage,
  payment: PaymentsPage,
  review: ReviewsPage,
  analytics: AnalyticsPage,
  plans: PlansPage,
  trust: TrustScorePage,
  community: CommunityPage,
  marketing: MarketingKitPage,
};

function normalizeNotifications(res: any): any[] {
  const data = res?.data ?? res;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.notifications)) return data.notifications;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export default function MentorDashboard(
  { userId }: { userId: string }
) {
  const [activePage, setActivePage] = useState("dashboard");

  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToCode, setAgreedToCode] = useState(false);

  const [mentorData, setMentorData] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

   // ── Notification states (mentorship-scoped) ─────────────────
   const [notifications, setNotifications] = useState<any[]>([]);
   const [notificationsLoading, setNotificationsLoading] = useState(true);
 
   // ✅ NEW — realtime socket hook: pushes 'notification:new' the instant the
   // backend emits it (booking request, session started/confirmed, etc.)
   const { latestNotification } = useSocket();
 
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
 
      // ✅ NEW — prepend the realtime notification to the list the instant it
   // arrives, instead of waiting for the next full refetch/page-load.
   // Maps the socket payload's raw `type` (e.g. 'new_booking_request') to the
   // same "booking"|"review"|"payment"|"message"|"system" bucket the fetched
   // list uses, so NotificationPage's icon lookup matches either way.
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
  



  const handleMarkNotificationRead = (id: string) => {
    setNotifications((prev) =>
      (Array.isArray(prev) ? prev : []).map((n) => (n._id === id ? { ...n, isRead: true } : n))
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

  useEffect(() => {
    if (!userId) return;
    MentorService.getMentorByUserId(userId)
      .then((res) => setMentorData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    SessionService.getUpcomingSessions({ role: "mentor", limit: 10 })
      .then((res) => setSessions(res.data || []))
      .catch(console.error);
  }, [userId]);

  const [showServiceForm, setShowServiceForm] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null);
  type Service = {
    serviceName: string;
    price: string;
    duration: string;
    maxParticipants: string;
    description: string;
    serviceType: string;
    emoji?: string;
  };
  const [completedServices, setCompletedServices] = useState<Service[]>([]);
  const [serviceFormData, setServiceFormData] = useState({
    serviceName: "",
    price: "",
    duration: "",
    maxParticipants: "",
    description: "",
    serviceType: "",
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setProfilePhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCreateService = () => {
    if (!serviceFormData.serviceName || !serviceFormData.price) return;

    setCompletedServices(prev => [
      ...prev,
      {
        ...serviceFormData,
        emoji: SERVICE_TYPES.find(t => t.name === serviceFormData.serviceType)?.emoji || "✅",
      },
    ]);

    setShowServiceForm(false);
    setServiceFormData({
      serviceName: "",
      price: "",
      duration: "",
      maxParticipants: "",
      description: "",
      serviceType: "",
    });
    setSelectedServiceType(null);
  };

  const CurrentPage = pageComponents[activePage] || DashboardOverviewPage;

  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  return (
    <div className="flex flex-col h-screen bg-[#f6ede8]">
      <div className="h-20 shrink-0" aria-hidden="true" />

      <div className="flex flex-1 min-h-0">
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          mentorData={mentorData}
          unreadNotificationCount={safeNotifications.filter((n) => !n.isRead).length}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="px-4 md:px-6 py-8 max-w-[1600px] mx-auto">
            <CurrentPage
              setActivePage={setActivePage}

              mentorData={mentorData}
              profilePhoto={profilePhoto}
              isVerified={isVerified}
              agreedToTerms={agreedToTerms}
              agreedToCode={agreedToCode}
              setProfilePhoto={setProfilePhoto}
              setIsVerified={setIsVerified}
              setAgreedToTerms={setAgreedToTerms}
              setAgreedToCode={setAgreedToCode}
              handlePhotoUpload={handlePhotoUpload}

              showServiceForm={showServiceForm}
              setShowServiceForm={setShowServiceForm}
              selectedServiceType={selectedServiceType}
              setSelectedServiceType={setSelectedServiceType}
              completedServices={completedServices}
              formData={serviceFormData}
              setFormData={setServiceFormData}
              handleCreateService={handleCreateService}
              serviceTypes={SERVICE_TYPES}

              sessions={sessions}

              notifications={safeNotifications}
              notificationsLoading={notificationsLoading}
              onMarkRead={handleMarkNotificationRead}
              onMarkAllRead={handleMarkAllNotificationsRead}
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