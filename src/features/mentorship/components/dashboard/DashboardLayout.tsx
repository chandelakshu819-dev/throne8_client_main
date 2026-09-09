// src/features/mentorship/components/dashboard/DashboardLayout.tsx
"use client";

import { useEffect, useState } from "react";

// Define ServiceType type
type ServiceType = {
  name: string;
  emoji?: string;
  icon: React.FC<any>;       // ← add karo
  description?: string;
};
import { MessageCircle, Wrench, GraduationCap, Dumbbell, CheckSquare } from "lucide-react";

import Sidebar from "./Sidebar";
import DashboardOverviewPage from "./DashboardOverviewPage";
import NotificationPage from "./NotificationPage";
import ProfilePage from "./ProfilePage";
import ServicesPage from "./ServicesPage";
import BookingsPage from "./BookingsPage";
import AvailabilityPage from "./AvailabilityPage";
import PaymentsPage from "./PaymentsPage";
import ReviewsPage from "./ReviewsPage";
import AnalyticsPage from "./AnalyticsPage";
import PlansPage from "./PlansPage";
import TrustScorePage from "./TrustScorePage";
import CommunityPage from "./CommunityPage";
import MentorService from "@/lib/api/mentorship.service";
import SessionService from "@/lib/api/session.service";
import MarketingKitPage from "./MarketingKitPage";

// Define SERVICE_TYPES array
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
  availability: AvailabilityPage,
  payment: PaymentsPage,
  review: ReviewsPage,
  analytics: AnalyticsPage,
  plans: PlansPage,
  trust: TrustScorePage,
  community: CommunityPage,
  marketing: MarketingKitPage,
};

export default function MentorDashboard(
  { userId }: { userId: string }
) {
  const [activePage, setActivePage] = useState("dashboard");

  // ── Profile states ────────────────────────────────────────
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToCode, setAgreedToCode] = useState(false);

  const [mentorData, setMentorData] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    MentorService.getMentorByUserId(userId)
      .then((res) => setMentorData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    SessionService.getAllSessionsFromDB()
      .then((res) => setSessions(res.data || []))
      .catch(console.error);
  }, []);

  // ── Services states ───────────────────────────────────────
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null);
  // Define Service type
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

  console.log("👤 Mentor Data in Dashboard-:", mentorData);

  return (
    // ✅ FIX 1: Navbar is `fixed top-0 h-20` (80px), so it's out of normal
    // flow and was overlapping this dashboard's content. Wrapping
    // everything in a flex-col with a shrink-0 h-20 spacer pushes the
    // Sidebar + main content below the navbar, while the inner flex-1
    // row still fills the remaining viewport height with its own scroll.
    <div className="flex flex-col h-screen bg-[#f6ede8]">
      {/* Spacer — reserves space for the fixed Navbar (h-20 = 80px) so
          Sidebar/main don't render underneath it. Keep this in sync with
          Navbar's height class. */}
      <div className="h-20 shrink-0" aria-hidden="true" />

      <div className="flex flex-1 min-h-0">
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          mentorData={mentorData}
        />

        <main className="flex-1 overflow-y-auto">
          {/* ✅ FIX 2: was "p-8 max-w-7xl mx-auto" — max-w-7xl (1280px)
              plus mx-auto centering left big empty gutters on both sides
              on wider screens. Widened the cap and trimmed the padding
              so this matches the fuller-width feel of the /dashboard
              page. */}
          <div className="px-4 md:px-6 py-8 max-w-[1600px] mx-auto">
            <CurrentPage
              // Navigation (used by Dashboard overview quick actions)
              setActivePage={setActivePage}

              // Profile props
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

              // Services props
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
            />
          </div>
        </main>
      </div>

      {/* {showServiceForm && (
        <ServicePage
          onClose={() => setShowServiceForm(false)}
          formData={serviceFormData}
          setFormData={setServiceFormData}
          serviceTypes={SERVICE_TYPES}
          handleCreateService={handleCreateService}
        />
      )} */}

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