"use client";

import { useEffect } from "react";
import { LayoutDashboard, ChevronRight, ChevronLeft, CalendarClock, Users, Bookmark, History, Clock, Star, Receipt, Bell, Sparkles, TrendingUp, UserCog, HelpCircle } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { formatUserDisplayName, getInitials } from "@/shared/utils/format";

interface UserSidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  unreadNotificationCount?: number;
  isMentor?: boolean;
  onSwitchRole?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const USER_MENU_ITEMS = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard },
  { id: "profile-preferences", label: "Profile & Preferences", icon: UserCog },
  { id: "progress", label: "Mentorship Progress", icon: TrendingUp },
  { id: "queries", label: "My Queries", icon: HelpCircle },
  { id: "recommended-mentors", label: "Recommended Mentors", icon: Sparkles },
  { id: "upcoming-sessions", label: "Sessions", icon: CalendarClock },
  { id: "my-mentors", label: "My Mentors", icon: Users },
  { id: "my-bookings", label: "My Bookings", icon: Bookmark },
  { id: "payments", label: "Payments & Transactions", icon: Receipt },
  { id: "session-history", label: "Session History", icon: History },
  { id: "group-sessions", label: "Group Sessions", icon: Users },
  { id: "waitlist", label: "Waitlist", icon: Clock },
  { id: "reviews", label: "Reviews & Feedback", icon: Star },
  { id: "notifications", label: "Notifications", icon: Bell },
];

export default function UserSidebar({
  activePage,
  setActivePage,
  unreadNotificationCount = 0,
  isMentor = false,
  onSwitchRole,
  isCollapsed = false,
  onToggleCollapse,
}: UserSidebarProps) {
  const { user } = useAuth();
  const { userProfileData, profileImageUrl, loadProfile } = useProfile();

  useEffect(() => {
    if (!userProfileData && typeof loadProfile === "function") {
      loadProfile();
    }
  }, [userProfileData, loadProfile]);

  const firstName = (userProfileData?.firstName || user?.firstName || "").trim();
  const lastName = (userProfileData?.lastName || user?.lastName || "").trim();
  const directName = [firstName, lastName].filter(Boolean).join(" ");
  const fullName = directName || formatUserDisplayName(userProfileData, user);
  const initials = (firstName || lastName)
    ? `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase()
    : getInitials(fullName) || "U";

  return (
    <aside 
      className={`flex flex-col h-full overflow-visible transition-all duration-300 ease-in-out relative ${isCollapsed ? 'w-20' : 'w-80'}`} 
      style={{ backgroundColor: '#fff', borderRight: '1px solid #ece4db' }}
    >
      {/* Collapse Toggle Button */}
      {onToggleCollapse && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
          className="absolute -right-3.5 top-8 z-50 w-7 h-7 rounded-full flex items-center justify-center border shadow-sm transition-transform hover:scale-105"
          style={{ backgroundColor: '#fff', borderColor: '#ece4db', color: '#7a5c3e' }}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      )}
      {/* Profile Card */}
      <div
        onClick={() => setActivePage("profile-preferences")}
        role="button"
        tabIndex={0}
        className={`mt-6 mb-2 rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-md group ${isCollapsed ? 'mx-3 p-3' : 'mx-5 p-6'}`}
        style={{ backgroundColor: '#fbf7f3', border: '1px solid #e0d8cf' }}
        title="Manage Profile & Preferences"
      >
        <div className="flex flex-col items-center text-center">
          <div className={`rounded-2xl overflow-hidden relative transition-all duration-300 ${isCollapsed ? 'w-10 h-10' : 'w-20 h-20 mb-4'}`} style={{ border: '1px solid #e0d8cf' }}>
            {profileImageUrl ? (
              <img src={profileImageUrl} alt={fullName} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-white transition-all duration-300" style={{ backgroundColor: '#4a3728', fontSize: isCollapsed ? '1rem' : '1.5rem' }}>
                {initials}
              </div>
            )}
          </div>

          {!isCollapsed && (
            <>
              <h2 className="text-lg font-bold group-hover:text-[#7a5c3e] transition-colors whitespace-nowrap overflow-hidden text-ellipsis w-full" style={{ color: '#4a3728' }}>{fullName}</h2>

              <div className="flex items-center gap-2 mt-2">
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: '#f3ece4', color: '#7a5c3e' }}
                >
                  Mentee
                </span>
                <span className="text-[11px] font-medium text-[#7a5c3e] underline opacity-80 group-hover:opacity-100">
                  Manage →
                </span>
              </div>

              {isMentor && onSwitchRole && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSwitchRole();
                  }}
                  className="mt-3 text-[11px] font-semibold underline"
                  style={{ color: '#4a3728' }}
                >
                  Switch to Mentor view →
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto px-5 py-4">
        <div className="space-y-1">
          {USER_MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            const isNotificationItem = item.id === "notifications";
            const showUnreadDot = isNotificationItem && unreadNotificationCount > 0;

            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 py-3 rounded-xl text-sm font-semibold transition-colors duration-150 ${isCollapsed ? 'justify-center px-0' : 'px-4'}`}
                style={{
                  backgroundColor: isActive ? '#4a3728' : 'transparent',
                  color: isActive ? '#fff' : '#5c4a3a',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = '#fbf7f3';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 relative"
                  style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : '#f3ece4' }}
                >
                  <Icon className="w-4 h-4" style={{ color: isActive ? '#fff' : '#7a5c3e' }} />
                  {isCollapsed && showUnreadDot && !isActive && (
                    <span
                      className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white"
                      style={{ backgroundColor: "#b91c1c" }}
                    />
                  )}
                </span>
                {!isCollapsed && <span className="flex-1 text-left whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>}

                {!isCollapsed && showUnreadDot && !isActive && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: "#b91c1c" }}
                  />
                )}

                {!isCollapsed && (
                  isActive ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  ) : !showUnreadDot ? (
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100" style={{ color: '#c0b0a0' }} />
                  ) : null
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
