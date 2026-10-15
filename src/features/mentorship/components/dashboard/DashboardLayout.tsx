// src/features/mentorship/components/dashboard/DashboardLayout.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";


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
import WaitlistPage from "./WaitlistPage";
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
import UserDashboardProfilePreferencesPage from "@/features/mentorship/components/user-dashboard/UserDashboardProfilePreferencesPage";
import { useParams } from "next/navigation";
import { useNavbarProfileImage } from "@/features/profile/components/home/NavbarProvider";
// ✅ NEW — realtime notification push (booking requests, session started, etc.)
import { useSocket } from "@/core/realtime/useSocket";
import BrandWordmark from "@/shared/uiComponents/BrandWordmark";

function MenteeProfileTabWrapper(props: any) {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const menteeId = (params?.menteeId as string) || (params?.userId as string) || searchParams.get("menteeId") || props.menteeId || "";

  return (
    <UserDashboardProfilePreferencesPage
      readOnly={true}
      viewerRole="mentor"
      menteeId={menteeId}
      onBack={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          props.setActivePage?.("dashboard");
        }
      }}
    />
  );
}

const SERVICE_TYPES: ServiceType[] = [
  { name: "Consultation", icon: MessageCircle, description: "One-on-one consultation sessions" },
  { name: "Workshop", icon: Wrench, description: "Group learning workshops" },
  { name: "Mentoring", icon: GraduationCap, description: "Long-term mentoring programs" },
  { name: "Coaching", icon: Dumbbell, description: "Goal-oriented coaching sessions" },
  { name: "Other", icon: CheckSquare, description: "Any other custom services" },
];

const pageComponents: Record<string, React.FC<any>> = {
  dashboard: DashboardOverviewPage,
  profile: ProfilePage,
  notification: NotificationPage,
  services: ServicesPage,
  booking: BookingsPage,
  waitlist: WaitlistPage,
  queries: QueriesPage,
  availability: AvailabilityPage,
  payment: PaymentsPage,
  review: ReviewsPage,
  analytics: AnalyticsPage,
  plans: PlansPage,
  trust: TrustScorePage,
  community: CommunityPage,
  marketing: MarketingKitPage,
  services_search: ServicesPage,
  mentee_profile: MenteeProfileTabWrapper,
};

function normalizeNotifications(res: any): any[] {
  const data = res?.data ?? res;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.notifications)) return data.notifications;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export default function MentorDashboard(
  { userId, onSwitchRole }: { userId: string; onSwitchRole?: () => void }
) {
  const setNavbarProfileImage = useNavbarProfileImage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeParams = useParams();

  const [mentorData, setMentorData] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isMenteeProfileRoute = Boolean(
    routeParams?.menteeId || (pathname && (pathname.includes("/mentorship/mentee-profile/") || pathname.includes("/mentorship/menteeProfile/")))
  );

  const [activePage, setActivePageState] = useState(() => {
    if (isMenteeProfileRoute) {
      return "mentee_profile";
    }
    return searchParams.get("tab") || "dashboard";
  });

  // Tab change hote hi URL me bhi likh do (bina full page reload ke),
  // taaki refresh, back/forward button, aur direct-link sharing sab kaam karein.
  const setActivePage = useCallback((page: string, subtab?: string) => {
    setActivePageState(page);
    const targetMentorId = mentorData?.mentorId || userId;
    const subtabParam = subtab ? `&subtab=${subtab}` : "";

    if (isMenteeProfileRoute) {
      router.push(`/mentorship/mentorProfile/${targetMentorId}?tab=${page}${subtabParam}`);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", page);
      if (subtab) {
        params.set("subtab", subtab);
      } else {
        params.delete("subtab");
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [pathname, router, searchParams, isMenteeProfileRoute, mentorData?.mentorId, userId]);

  // Browser back/forward dabaye to URL ke hisaab se activePage update ho jaye.
  useEffect(() => {
    if (isMenteeProfileRoute) {
      setActivePageState("mentee_profile");
      return;
    }
    const tabFromUrl = searchParams.get("tab") || "dashboard";
    setActivePageState((prev) => (prev !== tabFromUrl ? tabFromUrl : prev));
  }, [searchParams, isMenteeProfileRoute]);

  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToCode, setAgreedToCode] = useState(false);

  // Unified Dashboard Overview Data
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!userId) return;
    setDashboardLoading(true);
    setDashboardError(null);

    let fetchedData = null;
    try {
      const targetId = mentorData?.mentorId || userId;
      const res = await MentorService.getMentorDashboard(targetId);
      fetchedData = res?.data ?? res;
    } catch (err: any) {
      console.warn("[DashboardLayout] Unified endpoint not reachable or returned 404:", err?.message);
    }

    // Graceful fallback sessions list extraction
    const fallbackUpcoming: any[] = [];
    (sessions || []).forEach((s: any) => {
      if (Array.isArray(s.bookings) && s.bookings.length > 0) {
        s.bookings.forEach((b: any) => {
          fallbackUpcoming.push({
            _id: b._id || s._id,
            sessionId: s.sessionId || String(s._id),
            menteeId: b.menteeId || b.bookedBy || s.menteeId || null,
            menteeName:
              b.mentee?.fullName ||
              (b.mentee?.firstName ? `${b.mentee.firstName} ${b.mentee.lastName || ""}`.trim() : null) ||
              s.bookedMenteeName ||
              "Student",
            menteeProfilePhoto:
              (typeof b.menteeProfilePhoto === "string" && b.menteeProfilePhoto) ||
              (typeof s.menteeProfilePhoto === "string" && s.menteeProfilePhoto) ||
              (typeof b.mentee?.profilePic === "string" && b.mentee.profilePic.startsWith("http") ? b.mentee.profilePic : null) ||
              null,
            title: s.title || s.sessionType || "1-on-1 Mentorship",
            sessionType: s.sessionType || "1-on-1 Mentorship",
            scheduledAt: b.scheduledAt || s.scheduledAt || s.startTime,
            startTime: b.scheduledAt || s.scheduledAt || s.startTime,
            endTime: b.endTime || s.endTime || (b.scheduledAt || s.scheduledAt ? new Date(new Date(b.scheduledAt || s.scheduledAt).getTime() + (b.slotDuration || s.duration || 60) * 60000).toISOString() : null),
            durationMinutes: b.slotDuration || s.duration || s.durationMinutes || 60,
            status: b.status || s.status || "confirmed",
            isGroupSession: false,
          });
        });
      } else {
        fallbackUpcoming.push({
          _id: s._id || s.sessionId,
          sessionId: s.sessionId || String(s._id),
          menteeId: s.menteeId || s.bookedBy || s.mentee?.userId || null,
          menteeName:
            s.menteeName ||
            s.bookedMenteeName ||
            s.mentee?.fullName ||
            (s.mentee?.firstName ? `${s.mentee.firstName} ${s.mentee.lastName || ""}`.trim() : null) ||
            "Student",
          menteeProfilePhoto:
            (typeof s.menteeProfilePhoto === "string" && s.menteeProfilePhoto) ||
            (typeof s.mentee?.profilePic === "string" && s.mentee.profilePic.startsWith("http") ? s.mentee.profilePic : null) ||
            null,
          title: s.title || s.sessionType || "Session",
          sessionType: s.sessionType || "Session",
          scheduledAt: s.scheduledAt || s.startTime || new Date().toISOString(),
          startTime: s.scheduledAt || s.startTime || new Date().toISOString(),
          endTime: s.endTime || (s.scheduledAt || s.startTime ? new Date(new Date(s.scheduledAt || s.startTime).getTime() + (s.duration || 60) * 60000).toISOString() : null),
          durationMinutes: s.duration || s.durationMinutes || 60,
          status: s.status || "confirmed",
          isGroupSession: Boolean(s.isGroupSession),
        });
      }
    });

    if (fetchedData && typeof fetchedData === "object" && Object.keys(fetchedData).length > 0) {
      const hasUpcoming = Array.isArray(fetchedData.upcomingSessions) && fetchedData.upcomingSessions.length > 0;
      if (!hasUpcoming && fallbackUpcoming.length > 0) {
        fetchedData.upcomingSessions = fallbackUpcoming;
        if (fetchedData.stats) {
          fetchedData.stats.upcoming = fallbackUpcoming.filter(
            (s: any) => new Date(s.scheduledAt).getTime() >= Date.now()
          ).length;
        }
      }
      setDashboardData(fetchedData);
      setDashboardError(null);
    } else if (mentorData) {
      setDashboardData({
        mentorId: mentorData?.mentorId,
        userId: mentorData?.userId,
        user: mentorData?.user,
        profilePic: mentorData?.profilePic,
        category: (Array.isArray(mentorData?.domains) && mentorData?.domains[0]) || mentorData?.title || "Web Development",
        rating: mentorData?.stats?.averageRating ?? 0,
        totalReviews: mentorData?.stats?.totalReviews ?? 0,
        stats: {
          totalSessions: mentorData?.stats?.totalSessions ?? mentorData?.stats?.completedSessions ?? 0,
          upcoming: fallbackUpcoming.filter((s: any) => new Date(s.scheduledAt).getTime() >= Date.now()).length,
          rating: mentorData?.stats?.averageRating ?? 0,
          trustScore: mentorData?.trustScore?.score ?? mentorData?.stats?.trustScore ?? null,
        },
        isVerified: Boolean(mentorData?.verification?.isVerified || mentorData?.isVerified),
        upcomingSessions: fallbackUpcoming,
      });
      setDashboardError(null);
    } else {
      setDashboardError("Unable to load mentor dashboard data.");
    }
    setDashboardLoading(false);
  }, [userId, mentorData, sessions]);

  useEffect(() => {
    if (!userId) return;
    fetchDashboardData();
  }, [userId, mentorData, sessions, fetchDashboardData]);

  // Notification states (mentorship-scoped)
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  // Realtime socket hook: 'notification:new' backend emit karte hi aa jata hai
  // (booking request, session started/confirmed, etc.)
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

  // Realtime notification ko list ke top par turant daalo, refetch ka wait nahi.
  // Socket payload ka raw `type` (jaise 'new_booking_request') ko usi
  // "booking"|"review"|"payment"|"message"|"system" bucket me map karte hain
  // jo fetched list use karti hai, taaki NotificationPage ka icon lookup dono me match kare.
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
    SessionService.getUpcomingSessions({ role: "mentor", limit: 20 })
      .then((res) => {
        const list = res?.data || [];
        if (Array.isArray(list) && list.length > 0) {
          setSessions(list);
        } else if (mentorData?.mentorId) {
          SessionService.getMentorSessions(mentorData.mentorId)
            .then((mRes) => {
              const mList = (mRes?.data || []).filter(
                (s: any) =>
                  (s.bookings?.length ?? 0) > 0 ||
                  (s.scheduledAt && new Date(s.scheduledAt).getTime() >= Date.now())
              );
              if (mList.length > 0) setSessions(mList);
            })
            .catch(() => {});
        }
      })
      .catch((err) => {
        console.error("Failed to fetch upcoming sessions:", err);
        if (mentorData?.mentorId) {
          SessionService.getMentorSessions(mentorData.mentorId)
            .then((mRes) => {
              const mList = (mRes?.data || []).filter(
                (s: any) =>
                  (s.bookings?.length ?? 0) > 0 ||
                  (s.scheduledAt && new Date(s.scheduledAt).getTime() >= Date.now())
              );
              if (mList.length > 0) setSessions(mList);
            })
            .catch(() => {});
        }
      });
  }, [userId, mentorData?.mentorId]);

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
    const input = e.target;
    const file = input.files?.[0];
    if (!file || !mentorData?.mentorId) return;

<<<<<<< HEAD
    // Server sirf jpg/jpeg/png/webp/gif leta hai
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      alert("Only JPG, PNG, WEBP or GIF images are allowed.");
      input.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be smaller than 5MB.");
      input.value = "";
      return;
    }

    // Instant preview
=======
    // Instant preview, sirf UI feedback ke liye, source of truth nahi
>>>>>>> 70bdae8 (Update mentorship dashboards and sidebars)
    const reader = new FileReader();
    reader.onloadend = () => setProfilePhoto(reader.result as string);
    reader.readAsDataURL(file);

<<<<<<< HEAD
=======
    // Actual backend update: isi se Sidebar + MentorSidebar sync honge
>>>>>>> 70bdae8 (Update mentorship dashboards and sidebars)
    MentorService.updateProfilePhoto(mentorData.mentorId, file)
      .then((res: any) => {
        console.log("📸 updateProfilePhoto response:", res);
        const updated = res?.data ?? res;
<<<<<<< HEAD
        const newPic = updated?.profilePic;

        if (!newPic) {
          throw new Error("Server did not return the new profile photo.");
        }

        setMentorData((prev: any) => ({ ...prev, profilePic: newPic }));
        // ✅ Sidebar dashboardData se bhi photo leta hai, isliye isko bhi update karo
        setDashboardData((prev: any) => (prev ? { ...prev, profilePic: newPic } : prev));
        setProfilePhoto(null);
        // ✅ Top-right navbar avatar bhi turant update karo
        setNavbarProfileImage(newPic);
=======
        setMentorData((prev: any) => ({ ...prev, profilePic: updated?.profilePic }));
        setProfilePhoto(null); // local preview clear, ab mentorData.profilePic hi source hai
>>>>>>> 70bdae8 (Update mentorship dashboards and sidebars)
      })
      .catch((err) => {
        console.error("Failed to update profile photo:", err);
        setProfilePhoto(null);
        alert(err?.message || "Failed to update profile photo. Please try again.");
      })
      .finally(() => {
        input.value = ""; // same file dobara select ho sake
      });
  };


  const handlePhotoRemove = async () => {
    if (!mentorData?.mentorId) return;
    try {
      await MentorService.removeProfilePhoto(mentorData.mentorId);
      setMentorData((prev: any) => ({ ...prev, profilePic: null }));
      setDashboardData((prev: any) => (prev ? { ...prev, profilePic: null } : prev));
      setProfilePhoto(null);
      setNavbarProfileImage(null);
    } catch (err) {
      console.error("Failed to remove profile photo:", err);
      alert("Failed to remove photo. Please try again.");
    }
  };

  const handleCreateService = () => {
    if (!serviceFormData.serviceName || !serviceFormData.price) return;

    setCompletedServices(prev => [
      ...prev,
      { ...serviceFormData },
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

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-[#f6ede8]">
      <div className="h-16 shrink-0" aria-hidden="true" />

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-4 h-16 shrink-0 bg-[#fbf7f3] border-b border-[#e0d8cf]">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -ml-2 text-[#4a3728] hover:bg-[#f3ece4] rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
        </button>

        <BrandWordmark size="sm" />

        <div className="w-8 h-8 rounded-full overflow-hidden border border-[#e0d8cf] flex-shrink-0">
          {dashboardData?.profilePic || mentorData?.profilePic ? (
            <img src={dashboardData?.profilePic || mentorData?.profilePic} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[#4a3728] text-white flex items-center justify-center text-xs font-bold">
              {(dashboardData?.user?.firstName?.[0] || mentorData?.user?.firstName?.[0] || 'M').toUpperCase()}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 min-h-0 relative">
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}
        <div className={`
          absolute md:relative z-50 h-full transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <Sidebar
            activePage={activePage}
            setActivePage={(page) => {
              setActivePage(page);
              setIsMobileMenuOpen(false);
            }}
            mentorData={mentorData}
            dashboardData={dashboardData}
            unreadNotificationCount={safeNotifications.filter((n) => !n.isRead).length}
            onSwitchRole={onSwitchRole}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="px-4 md:px-8 py-6 max-w-[1600px] mx-auto">
            <CurrentPage
              setActivePage={setActivePage}

              mentorData={mentorData}
              dashboardData={dashboardData}
              dashboardLoading={dashboardLoading}
              dashboardError={dashboardError}
              onRetryDashboard={fetchDashboardData}

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
              handlePhotoRemove={handlePhotoRemove}
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