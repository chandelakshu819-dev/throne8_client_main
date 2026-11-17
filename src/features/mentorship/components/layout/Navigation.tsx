"use client";
//src/features/mentorship/components/layout/Navigation.tsx

import React, { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useProfileData } from "@/features/profile/hooks/useProfileData";
import { useNavbarData } from "@/features/profile/components/home/NavbarProvider";
import { formatUserDisplayName } from "@/shared/utils/format";
import { transformToProfileData } from "@/shared/utils/profileTransformers";
import { HOME_PATH, isFeatureEnabled, type FeatureKey } from "@/config/launch";
import ProfileDropdown from "@/features/mentorship/components/shared/ProfileDropdown";
import { useMyRoles } from "@/features/mentorship/hooks/useMentorRole";
import { routes } from "@/config/routes";
import AuthService from "@/lib/api/auth.service";
import BrandWordmark from "@/shared/uiComponents/BrandWordmark";
import { openResumeApp, RESUME_ICON_PATH } from "@/config/resume";

interface NavigationProps {
  activeTimezone?: string;
  currentUserId?: string;
  isMentor?: boolean;
  mentorUserId?: string;
  // Mobile par neeche tab bar dikhana hai ya nahi (default: haan)
  showMobileNav?: boolean;
}

const ALL_NAV_ITEMS = [
  "Home",
  "Network",
  "Jobs",
  "Study Group",
  "Messaging",
  "Mentorship",
  "Resume",
];

const NAV_FEATURE: Record<string, FeatureKey> = {
  Home: "dashboard",
  Network: "network",
  Jobs: "jobs",
  "Study Group": "study",
  Messaging: "messaging",
  Notifications: "notifications",
  Mentorship: "mentorship",
  Resume: "resume",
};

// Launch mode ke hisaab se sirf enabled tabs
const NAV_ITEMS = ALL_NAV_ITEMS.filter((item) =>
  isFeatureEnabled(NAV_FEATURE[item])
);

const ROUTE_PREFIX: Record<string, string> = {
  Home: "/dashboard",
  Network: "/profile/network",
  Jobs: "/job",
  "Study Group": "/study",
  Messaging: "/message",
  Notifications: "/notifications",
  Mentorship: "/mentorship",
};

export default function Navigation({
  activeTimezone = "IST (UTC+5:30)",
  currentUserId,
  isMentor = false,
  mentorUserId,
  showMobileNav = true,
}: NavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { roles } = useMyRoles(!!user);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    await AuthService.logout(); // token clear + /login redirect ye khud karta hai
  };

  const { userProfileData, profileImageUrl, fetchUserProfile } =
    useProfileData();
  // NavbarProvider ki photo (mentor photo override ke sath) — dashboard me badalte hi yahan bhi badle
  const { profileData: navbarProfileData } = useNavbarData();

  const targetUserId =
    currentUserId || user?.userId || user?.id || (user as any)?._id;

  useEffect(() => {
    if (targetUserId) {
      fetchUserProfile(targetUserId);
    }
  }, [targetUserId, fetchUserProfile]);

  const profileData = transformToProfileData(
    userProfileData,
    profileImageUrl,
    null
  );
  const fullName = formatUserDisplayName(userProfileData, user);

  const handleNavigation = (item: string) => {
    switch (item) {
      case "Home":
        router.push("/dashboard");
        break;
      case "Network":
        router.push(`/profile/network/${targetUserId}`);
        break;
      case "Jobs":
        router.push("/job/jobs");
        break;
      case "Study Group":
        router.push("/study/groups");
        break;
      case "Messaging":
        router.push(`/message/${targetUserId}`);
        break;
      case "Notifications":
        router.push(`/notifications/${targetUserId}`);
        break;
      case "Mentorship":
        if (targetUserId && targetUserId !== "undefined") {
          // Approved mentor ko seedha uske dashboard par bhejo
          if (roles?.industryMentor === "approved") {
            router.push(routes.industryMentorDashboard(targetUserId));
          } else if (roles?.seniorMentor === "approved") {
            router.push(routes.seniorMentorDashboard(targetUserId));
          } else {
            router.push(`/mentorship/${targetUserId}`);
          }
        } else {
          router.push("/mentorship");
        }
        break;
      case "Resume":
        // External app (resume.throne8.com): opens in a new tab, shares the login cookie
        openResumeApp();
        break;
      default:
        break;
    }
  };

  const getShortLabel = (item: string) => {
    if (item === "Study Group") return "Study";
    if (item === "Notifications") return "Alerts";
    return item;
  };

  const getIconPath = (item: string): string => {
    const paths: Record<string, string> = {
      Home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
      Network:
        "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
      Jobs: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
      "Study Group":
        "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
      Messaging:
        "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
      Notifications:
        "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
      Mentorship:
        "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
      Resume: RESUME_ICON_PATH,
    };
    return paths[item] || paths["Home"];
  };

  const isActive = (item: string): boolean => {
    const prefix = ROUTE_PREFIX[item];
    return prefix ? !!pathname?.startsWith(prefix) : false;
  };

  return (
    <>
      <nav className="fixed top-0 left-0 z-50 w-full border-b border-[#E5D9CE] bg-[#F6EDE8] text-[#4a3728] shadow-sm">
        <div className="w-full px-3 sm:px-6 lg:px-8">
          <div className="flex h-14 w-full items-center justify-between gap-2 sm:h-16">
            {/* Left: Throne8 Wordmark */}
            <div className="flex min-w-0 flex-shrink-0 items-center gap-2">
              <BrandWordmark href={HOME_PATH} />
            </div>

            {/* Middle: Navigation Items (desktop) */}
            <div className="hidden h-16 min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item);
                return (
                  <button
                    key={item}
                    onClick={() => handleNavigation(item)}
                    className={`relative flex min-w-[60px] flex-col items-center justify-center gap-0.5
                                rounded-xl px-3 py-1.5 transition-colors duration-200
                                ${
                                  active
                                    ? "bg-[#4a3728] text-[#F6EDE8]"
                                    : "text-[#4a3728]/70 hover:bg-[#EFE3D8] hover:text-[#4a3728]"
                                }`}
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={active ? 2.1 : 1.8}
                        d={getIconPath(item)}
                      />
                    </svg>
                    <span className="whitespace-nowrap text-[10px] font-medium leading-none">
                      {getShortLabel(item)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right: Profile Dropdown + Sign Out */}
            <div className="ml-auto flex min-w-0 flex-shrink-0 items-center gap-2">
              <div className="min-w-0">
                <ProfileDropdown
                  user={user}
                  isAuthenticated={!!user}
                  profileImageUrl={
                    navbarProfileData?.profileImage || profileImageUrl
                  }
                  fullName={fullName || undefined}
                />
              </div>

              {/* Sign Out: sirf logged-in user ko dikhao */}
              {user && (
                <button
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                  title="Sign Out"
                  aria-label="Sign Out"
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#E5D9CE] bg-white px-2.5 py-2 text-xs font-semibold text-[#B4442E] transition-colors hover:bg-[#FBEAE6] disabled:cursor-not-allowed disabled:opacity-50 sm:px-3"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {isLoggingOut ? "Signing out..." : "Sign Out"}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile / tablet bottom tab bar (lg se neeche) */}
      {showMobileNav && (
        <div
          className="fixed bottom-0 left-0 z-50 w-full border-t border-[#E5D9CE] bg-[#F6EDE8] lg:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex w-full items-stretch justify-between overflow-x-auto px-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item);
              return (
                <button
                  key={item}
                  onClick={() => handleNavigation(item)}
                  className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 transition-colors
                              ${
                                active
                                  ? "text-[#4a3728]"
                                  : "text-[#4a3728]/60 hover:text-[#4a3728]"
                              }`}
                >
                  <span
                    className={`flex h-7 w-10 items-center justify-center rounded-full ${
                      active ? "bg-[#4a3728] text-[#F6EDE8]" : ""
                    }`}
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={active ? 2.1 : 1.8}
                        d={getIconPath(item)}
                      />
                    </svg>
                  </span>
                  <span className="w-full truncate text-center text-[10px] font-medium leading-none">
                    {getShortLabel(item)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}