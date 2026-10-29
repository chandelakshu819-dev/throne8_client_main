// src/features/mentorship/components/dashboard/Sidebar.tsx
import { Star, ChevronRight, ChevronLeft, ArrowLeftRight } from "lucide-react";
import { MENU_ITEMS } from "../../constants/constant";
import type { MenuItem } from "../../types";
import { capitalizeName } from "@/shared/utils/format";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useNavbarData } from "@/features/profile/components/home/NavbarProvider";
import { useEffect, useState } from "react";
import PhotoLightbox from "../shared/PhotoLightbox";


interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  mentorData: any;
  dashboardData?: any;
  unreadNotificationCount?: number;
  onSwitchRole?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

// Mentee dashboard ke naming se match karne ke liye labels yahin override kiye hain
const LABEL_OVERRIDES: Record<string, string> = {
  dashboard: "Overview",
  booking: "Bookings",
};

export default function Sidebar({
  activePage,
  setActivePage,
  mentorData,
  dashboardData,
  unreadNotificationCount = 0,
  onSwitchRole,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
    // Account profile (mentee view jaisa) -- mentor API load hone se pehle ya fail hone par bhi
  // sahi naam/photo dikhane ke liye fallback
  const { userProfileData, profileImageUrl: accountPhoto, loadProfile } = useProfile();
  const { user: authUser } = useAuth();
  const { menteeImage } = useNavbarData();
  const [showPhoto, setShowPhoto] = useState(false);

  useEffect(() => {
    if (!userProfileData && typeof loadProfile === "function") {
      loadProfile();
    }
  }, [userProfileData, loadProfile]);

  const pick = (...vals: any[]) =>
    vals.find((v) => typeof v === "string" && v.trim().length > 0)?.trim() ?? "";

  const firstName = pick(
    dashboardData?.user?.firstName,
    mentorData?.user?.firstName,
    userProfileData?.firstName,
    authUser?.firstName
  );
  const lastName = pick(
    dashboardData?.user?.lastName,
    mentorData?.user?.lastName,
    userProfileData?.lastName,
    authUser?.lastName
  );
  const joinedName = `${firstName} ${lastName}`.trim();
  const fullName = capitalizeName(
    pick(dashboardData?.user?.name, joinedName) || "Mentor"
  );
  const initials = (
    firstName || lastName
      ? `${firstName[0] || ""}${lastName[0] || ""}`
      : fullName[0] || "M"
  ).toUpperCase();
  const rawDomain = dashboardData?.category || mentorData?.domains?.[0] || "Mentor";
  const domain = String(rawDomain)
    .replace(/_/g, " ")
    .split(" ")
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
    const profilePic = dashboardData?.profilePic || mentorData?.profilePic || null;
  const rating = Number(
    dashboardData?.stats?.rating ?? dashboardData?.rating ?? mentorData?.stats?.averageRating ?? 0
  );
  const reviewCount: number | undefined =
    dashboardData?.totalReviews ?? mentorData?.stats?.totalReviews ?? undefined;
  // Reviews zero hon to rating nahi dikhani
  const hasReviews = reviewCount != null ? reviewCount > 0 : rating > 0;

  return (
    <aside
      className={`flex flex-col h-full overflow-visible transition-all duration-300 ease-in-out relative ${
        isCollapsed ? "w-20" : "w-72"
      }`}
      style={{ backgroundColor: "#fff", borderRight: "1px solid #ece4db" }}
    >
      {/* Collapse Toggle Button */}
      {onToggleCollapse && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
          className="absolute -right-3.5 top-8 z-50 w-7 h-7 rounded-full flex items-center justify-center border shadow-sm transition-transform hover:scale-105"
          style={{ backgroundColor: "#fff", borderColor: "#ece4db", color: "#7a5c3e" }}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      )}

      {/* Profile Card: photo, naam, category, rating, switch button */}
      <div
        className={`mt-5 mb-1 rounded-2xl transition-all duration-200 shrink-0 ${
          isCollapsed ? "mx-3 p-2" : "mx-4 p-4"
        }`}
        style={{ backgroundColor: "#fbf7f3", border: "1px solid #e0d8cf" }}
      >
        <div className="flex flex-col items-center text-center">
          <div
            className={`rounded-2xl overflow-hidden relative transition-all duration-300 ${
              isCollapsed ? "w-10 h-10" : "w-16 h-16 mb-3"
            }`}
            style={{ border: "1px solid #e0d8cf" }}
          >
            {profilePic ? (
              <>
              <img
                src={profilePic}
                alt={fullName}
                title="Click to view photo"
                className="w-full h-full object-cover cursor-zoom-in"
                onClick={() => setShowPhoto(true)}
              />
              {showPhoto && (
                <PhotoLightbox src={profilePic} alt={fullName} onClose={() => setShowPhoto(false)} />
              )}
            </>
            ) : (
              <div
                className="w-full h-full flex items-center justify-center font-bold text-white transition-all duration-300"
                style={{ backgroundColor: "#4a3728", fontSize: isCollapsed ? "1rem" : "1.25rem" }}
              >
                {initials}
              </div>
            )}
          </div>

          {!isCollapsed && (
            <>
              <h2
                className="text-base font-bold whitespace-nowrap overflow-hidden text-ellipsis w-full"
                style={{ color: "#4a3728" }}
              >
                {fullName}
              </h2>

              <span
                className="mt-2 px-3 py-1 rounded-full text-[11px] font-semibold"
                style={{ backgroundColor: "#f3ece4", color: "#7a5c3e" }}
              >
                {domain}
              </span>

              <div className="flex items-center justify-center gap-1 mt-2.5">
                {hasReviews && rating > 0 ? (
                  <>
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <Star
                          key={i}
                          className="w-3.5 h-3.5"
                          style={{
                            fill: i < Math.round(rating) ? "#c9a87c" : "none",
                            color: i < Math.round(rating) ? "#c9a87c" : "#d8cec4",
                          }}
                        />
                      ))}
                    <span className="ml-1.5 text-sm font-bold" style={{ color: "#4a3728" }}>
                      {rating.toFixed(1)}
                    </span>
                  </>
                ) : (
                  <span className="text-xs" style={{ color: "#a08070" }}>
                    No reviews yet
                  </span>
                )}
              </div>

              {onSwitchRole && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSwitchRole();
                  }}
                  className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors hover:bg-[#f3ece4]"
                  style={{ color: "#4a3728", border: "1px solid #e0d8cf", backgroundColor: "#fff" }}
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  Switch to Mentee view
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto px-4 py-3">
        <div className="space-y-0.5">
          {MENU_ITEMS.map((item: MenuItem) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            const isNotificationItem = item.id === "notification";
            const showUnreadDot = isNotificationItem && unreadNotificationCount > 0;
            const label = LABEL_OVERRIDES[item.id] ?? item.label;

            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                title={isCollapsed ? label : undefined}
                className={`w-full flex items-center gap-3 py-2 rounded-xl text-sm font-semibold transition-colors duration-150 ${
                  isCollapsed ? "justify-center px-0" : "px-3"
                }`}
                style={{
                  backgroundColor: isActive ? "#4a3728" : "transparent",
                  color: isActive ? "#fff" : "#5c4a3a",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = "#fbf7f3";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 relative"
                  style={{ backgroundColor: isActive ? "rgba(255,255,255,0.15)" : "#f3ece4" }}
                >
                  <Icon className="w-4 h-4" style={{ color: isActive ? "#fff" : "#7a5c3e" }} />
                  {isCollapsed && showUnreadDot && !isActive && (
                    <span
                      className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white"
                      style={{ backgroundColor: "#b91c1c" }}
                    />
                  )}
                </span>

                {!isCollapsed && (
                  <span className="flex-1 text-left whitespace-nowrap overflow-hidden text-ellipsis">
                    {label}
                  </span>
                )}

                {!isCollapsed && showUnreadDot && !isActive && (
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#b91c1c" }} />
                )}

                {!isCollapsed && isActive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </button>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}