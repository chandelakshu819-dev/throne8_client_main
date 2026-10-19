// src/features/profile/components/home/ProfileNavbar.tsx
"use client";
import React, { useState, useEffect } from "react";
import AuthService from "@/lib/api/auth.service";
import ProfileDropdown from "@/features/mentorship/components/shared/ProfileDropdown";
import SearchBar from "./SearchBar";
import ProfileSidePanel from "./ProfileSidePanel";
import { useRouter, usePathname } from "next/navigation";
import { MessageNotificationBadge } from "./MessageNotificationBadge";
import { NetworkNotificationBadge } from "@/features/networks/components/notifications/NetworkNotificationBadge";
import { capitalizeName } from "@/shared/utils/format";
import { HOME_PATH, isFeatureEnabled, FeatureKey } from "@/config/launch";
import BrandWordmark from "@/shared/uiComponents/BrandWordmark";
import { openResumeApp, RESUME_ICON_PATH } from "@/config/resume";
import Link from "next/link";
import MobileBottomNavbar from "@/shared/uiComponents/MobileBottomNavbar";

interface ProfileNavbarProps {
  profileImage: string;
  userName: string;
  currentUserId?: string;
  companyId?: string;
  userRole?: string;
  onOpenLeftPanel?: () => void;
}

// Saare nav items. Launch mode me jo feature band hai, wo niche filter ho jata hai.
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

const NAV_ITEMS = ALL_NAV_ITEMS.filter((item) =>
  isFeatureEnabled(NAV_FEATURE[item])
);

// Company menu items sirf tab dikhein jab company feature on ho
const SHOW_COMPANY_MENU = isFeatureEnabled("company");

// SearchBar auth (getAllUsers) API use karta hai, network flag pe depend nahi karta.
const SHOW_SEARCH = false;

const PROFILE_MENU_ITEMS = [
  "View Profile",
  "Update Profile",
  ...(SHOW_COMPANY_MENU ? ["Company Page", "Create Company Page"] : []),
  "Settings",
  "Sign Out",
];

// Route prefixes: active state detect karne ke liye
const ROUTE_PREFIX: Record<string, string> = {
  Home: "/dashboard",
  Network: "/profile/network",
  Jobs: "/job",
  "Study Group": "/study",
  Messaging: "/message",
  Notifications: "/notifications",
  Mentorship: "/mentorship",
};

const ProfileNavbar: React.FC<ProfileNavbarProps> = ({
  profileImage,
  userName,
  currentUserId,
  userRole,
  onOpenLeftPanel,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // Mentorship pages par avatar dropdown band (Sign Out wahan Navigation me alag button hai)
  const isMentorshipRoute = !!pathname?.startsWith("/mentorship");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [profileImage]);

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [isMobileMenuOpen]);

  // Close mobile menu on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleMenuClick = async (item: string) => {
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
    switch (item) {
      case "View Profile":
        if (onOpenLeftPanel && window.innerWidth < 1024) {
          onOpenLeftPanel();
          setIsProfilePanelOpen(false);
        } else {
          router.push(`/profile`);
        }
        break;
      case "Update Profile":
        router.push(`/profile`);
        break;
      case "Create Company Page":
        router.push(`/create-company/${currentUserId}`);
        break;
      case "Company Page":
        router.push(`/company/${currentUserId}`);
        break;
      case "Settings":
        break;
      case "Sign Out":
        setIsLoggingOut(true);
        await AuthService.logout();
        break;
      default:
        break;
    }
  };

  // Home click: launch mode me /mentorship, full mode me /dashboard
  const handleHomePage = () => {
    router.push(HOME_PATH);
  };

  const handleNavigation = (item: string) => {
    switch (item) {
      case "Home":
        handleHomePage();
        break;
      case "Network":
        router.push(`/profile/network/${currentUserId}`);
        break;
      case "Jobs":
        router.push("/job/jobs");
        break;
      case "Study Group":
        router.push("/study/groups");
        break;
      case "Messaging":
        router.push(`/message/${currentUserId}`);
        break;
      case "Notifications":
        router.push(`/notifications/${currentUserId}`);
        break;
      case "Mentorship":
        if (userRole === "admin") {
          router.push("/mentorship/admin");
        } else if (currentUserId && currentUserId !== "undefined") {
          router.push(`/mentorship/${currentUserId}`);
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
    setIsMobileMenuOpen(false);
  };

  const getIconPath = (item: string): string => {
    const paths: Record<string, string> = {
      Home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
      Network:
        "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
      Jobs: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
      "Study Group":
        "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
      Messaging:
        "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
      Notifications:
        "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
      Mentorship:
        "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
      Resume: RESUME_ICON_PATH,
    };
    return paths[item] || "";
  };

  // Short labels: "Study Group" wrap hota hai, "Notifications" lambi hai
  const getShortLabel = (item: string): string => {
    const short: Record<string, string> = {
      "Study Group": "Study",
      Notifications: "Alerts",
    };
    return short[item] || item;
  };

  const isActive = (item: string): boolean => {
    const prefix = ROUTE_PREFIX[item];
    return prefix ? pathname?.startsWith(prefix) : false;
  };

  return (
    <>
      <nav className="fixed top-0 left-0 w-full bg-[#F6EDE8] text-[#4a3728] border-b border-[#E5D9CE] shadow-sm z-50">
        <div className="w-full px-3 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-2 w-full">
            {/* Left Section: Mobile Menu Button + Wordmark */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="lg:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-[#4a3728] hover:bg-[#EFE3D8] rounded-lg p-2 transition-colors duration-200"
                  aria-label="Toggle menu"
                >
                  <svg
                    className={`w-6 h-6 transition-transform duration-300 ${isMobileMenuOpen ? "rotate-90" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d={
                        isMobileMenuOpen
                          ? "M6 18L18 6M6 6l12 12"
                          : "M4 6h16M4 12h16m-7 6h7"
                      }
                    />
                  </svg>
                </button>
              </div>
              <div className="flex-shrink-0">
                <BrandWordmark href={HOME_PATH} />
              </div>
            </div>

            {/* Middle Section: Desktop Navigation */}
            <div className="hidden lg:flex items-center justify-center gap-1 flex-1 min-w-0 h-16">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item);
                return (
                  <button
                    key={item}
                    onClick={() => handleNavigation(item)}
                    className={`relative flex flex-col items-center justify-center gap-0.5
                                                   px-3.5 py-2 rounded-xl min-w-[64px]
                                                   transition-colors duration-200
                                                   ${
                                                     active
                                                       ? "bg-[#4a3728] text-[#F6EDE8]"
                                                       : "text-[#4a3728]/70 hover:text-[#4a3728] hover:bg-[#EFE3D8]"
                                                   }`}
                  >
                    <span className="relative">
                      <svg
                        className="w-[21px] h-[21px]"
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
                      {item === "Network" && (
                        <span className="absolute -top-1 -right-1.5">
                          <NetworkNotificationBadge />
                        </span>
                      )}
                      {item === "Messaging" && (
                        <span className="absolute -top-1 -right-1.5">
                          <MessageNotificationBadge />
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] font-medium leading-none whitespace-nowrap">
                      {getShortLabel(item)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right Section: Search Bar + Profile Icon */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
              {SHOW_SEARCH && (
                <div className="hidden sm:flex items-center flex-shrink-0 w-40 xl:w-64 rounded-full bg-white border border-[#E5D9CE] focus-within:border-[#4a3728] transition-colors px-1">
                  <SearchBar currentUserId={currentUserId} />
                </div>
              )}

              {SHOW_SEARCH && (
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="sm:hidden text-[#4a3728] hover:bg-[#EFE3D8] rounded-lg p-2 transition-colors duration-200"
                  aria-label="Search"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
              )}

              {/* Mobile Messaging Quick Icon */}
              {isFeatureEnabled("messaging") && (
                <Link
                  href={
                    currentUserId ? `/message/${currentUserId}` : "/message"
                  }
                  className="lg:hidden relative text-[#4a3728] hover:bg-[#EFE3D8] rounded-lg p-2 transition-colors duration-200"
                  aria-label="Messages"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <span className="absolute -top-0.5 -right-0.5">
                    <MessageNotificationBadge />
                  </span>
                </Link>
              )}

              {/* Mobile Notifications Quick Icon */}
              {/* {isFeatureEnabled("notifications") && (
                <Link
                  href={
                    currentUserId
                      ? `/notifications/${currentUserId}`
                      : "/notifications"
                  }
                  className="lg:hidden relative text-[#4a3728] hover:bg-[#EFE3D8] rounded-lg p-2 transition-colors duration-200"
                  aria-label="Notifications"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </Link>
              )} */}

              {SHOW_SEARCH && (
                <div className="h-8 w-px bg-[#E5D9CE] mx-1 hidden md:block" />
              )}

              {/* Profile commented out from top bar as requested */}
              {/*
                            {isMentorshipRoute && (
                                <ProfileDropdown
                                    user={{ userId: currentUserId }}
                                    isAuthenticated={!!currentUserId}
                                    profileImageUrl={profileImage}
                                    fullName={userName}
                                />
                            )}

                            <div className="relative">
                                <button
                                    onClick={() => { if (!isMentorshipRoute) setIsDropdownOpen(!isDropdownOpen); }}
                                    className={`items-center gap-2 rounded-full pl-1 pr-2 py-1 transition-colors duration-200 ${isMentorshipRoute ? 'hidden' : 'flex hover:bg-[#EFE3D8]'}`}
                                >
                                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0 bg-[#4a3728] flex items-center justify-center">
                                        {profileImage && profileImage.trim() !== '' && !imgError ? (
                                            <img
                                                src={profileImage}
                                                alt={userName || "Profile"}
                                                className="w-full h-full object-cover"
                                                onError={() => setImgError(true)}
                                            />
                                        ) : (
                                            <img
                                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(capitalizeName(userName || 'User'))}&background=4a3728&color=fff&size=128`}
                                                alt={capitalizeName(userName || "Profile")}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <span className="text-sm font-medium hidden md:inline text-[#4a3728] whitespace-nowrap">{capitalizeName(userName || 'User')}</span>
                                    <svg
                                        className={`w-4 h-4 text-[#4a3728]/60 transition-transform duration-200 flex-shrink-0 hidden ${isMentorshipRoute ? '' : 'md:block'} ${isDropdownOpen ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {isDropdownOpen && !isMentorshipRoute && (
                                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg py-1.5 border border-[#E5D9CE] z-50 overflow-hidden">
                                        {PROFILE_MENU_ITEMS.map((item, idx) => (
                                            <button
                                                key={`${item}-${idx}`}
                                                onClick={() => handleMenuClick(item)}
                                                disabled={item === 'Sign Out' && isLoggingOut}
                                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
                                                    item === 'Sign Out'
                                                        ? 'text-[#B4442E] hover:bg-[#FBEAE6]'
                                                        : 'text-[#4a3728] hover:bg-[#F6EDE8]'
                                                }`}
                                            >
                                                {item === 'Sign Out' && isLoggingOut ? 'Signing out...' : item}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            */}
            </div>
          </div>

          {/* Mobile Search Section */}
          {SHOW_SEARCH && isSearchOpen && (
            <div className="sm:hidden border-t border-[#E5D9CE] bg-[#F6EDE8] -mx-3 px-3 py-4">
              <SearchBar currentUserId={currentUserId} />
            </div>
          )}

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <>
              {/* Backdrop: clicking outside menu closes it */}
              <div
                className="fixed inset-0 top-16 bg-black/30 backdrop-blur-[2px] z-40 lg:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-hidden="true"
              />
              <div
                className="relative z-50 lg:hidden border-t border-[#E5D9CE] bg-[#F6EDE8] -mx-3 sm:-mx-6 overflow-y-auto overscroll-contain shadow-2xl"
                style={{
                  maxHeight:
                    "calc(100dvh - 4rem - 4.25rem - env(safe-area-inset-bottom, 0px))",
                  WebkitOverflowScrolling: "touch",
                  touchAction: "pan-y",
                }}
              >
                <div className="px-3 sm:px-6 pt-3 pb-8 space-y-1">
                  {/* Profile Card Header */}
                  <button
                    onClick={() => handleMenuClick("View Profile")}
                    className="w-full flex items-center gap-3.5 p-3 mb-3 bg-white/90 hover:bg-white border border-[#E5D9CE] rounded-2xl text-left transition-all duration-200 shadow-sm active:scale-[0.99] group"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#FAF6F0] shadow-sm flex-shrink-0 bg-[#4a3728] flex items-center justify-center">
                      {profileImage &&
                      profileImage.trim() !== "" &&
                      !imgError ? (
                        <img
                          src={profileImage}
                          alt={userName || "Profile"}
                          className="w-full h-full object-cover"
                          onError={() => setImgError(true)}
                        />
                      ) : (
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(capitalizeName(userName || "User"))}&background=4a3728&color=fff&size=128`}
                          alt={capitalizeName(userName || "Profile")}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[#4a3728] truncate group-hover:text-[#2d2116]">
                        {capitalizeName(userName || "User")}
                      </p>
                      <p className="text-xs text-[#c4963a] font-semibold flex items-center gap-1 mt-0.5">
                        <span>View Profile</span>
                        <svg
                          className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </p>
                    </div>
                  </button>

                  <div className="h-px bg-[#E5D9CE]/70 my-2" />

                  {NAV_ITEMS.map((item) => (
                    <button
                      key={item}
                      onClick={() => handleNavigation(item)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#4a3728] hover:bg-[#EFE3D8] rounded-xl transition-colors duration-200"
                    >
                      <svg
                        className="w-5 h-5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                          d={getIconPath(item)}
                        />
                      </svg>
                      <span>{item}</span>
                      {item === "Network" && (
                        <div className="ml-auto">
                          <NetworkNotificationBadge />
                        </div>
                      )}
                      {item === "Messaging" && (
                        <div className="ml-auto">
                          <MessageNotificationBadge />
                        </div>
                      )}
                    </button>
                  ))}

                  <div className="h-px bg-[#E5D9CE]/70 my-2" />

                  {SHOW_COMPANY_MENU && (
                    <>
                      <button
                        onClick={() => handleMenuClick("Company Page")}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#4a3728] hover:bg-[#EFE3D8] rounded-xl transition-colors duration-200"
                      >
                        <svg
                          className="w-5 h-5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.8"
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                        <span>Company Page</span>
                      </button>
                      <button
                        onClick={() => handleMenuClick("Create Company Page")}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#4a3728] hover:bg-[#EFE3D8] rounded-xl transition-colors duration-200"
                      >
                        <svg
                          className="w-5 h-5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.8"
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        <span>Create Company Page</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => handleMenuClick("Sign Out")}
                    disabled={isLoggingOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#B4442E] hover:bg-[#FBEAE6] rounded-xl transition-colors duration-200 disabled:opacity-50"
                  >
                    <svg
                      className="w-5 h-5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </nav>

      <ProfileSidePanel
        isOpen={isProfilePanelOpen}
        onClose={() => setIsProfilePanelOpen(false)}
        profileImage={profileImage}
        userName={userName}
        currentUserId={currentUserId}
        onOpenLeftPanel={onOpenLeftPanel}
      />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNavbar currentUserId={currentUserId} userRole={userRole} />
    </>
  );
};

export default ProfileNavbar;
