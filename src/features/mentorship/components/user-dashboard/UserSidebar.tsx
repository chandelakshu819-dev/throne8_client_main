"use client";

import { LayoutDashboard, ChevronRight, CalendarClock } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useProfile } from "@/features/profile/hooks/useProfile";

interface UserSidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  unreadNotificationCount?: number;
}

const USER_MENU_ITEMS = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard },
  { id: "upcoming-sessions", label: "Upcoming Sessions", icon: CalendarClock },
];

export default function UserSidebar({
  activePage,
  setActivePage,
  unreadNotificationCount = 0,
}: UserSidebarProps) {
  const { user } = useAuth();
  const { profileImageUrl } = useProfile();

  const firstName = user?.firstName ?? "U";
  const lastName = user?.lastName ?? "S";
  const initials = `${firstName[0]}${lastName[0]}`.toUpperCase();
  const fullName = `${firstName} ${lastName}`;

  return (
    <aside className="w-80 flex flex-col" style={{ backgroundColor: '#fff', borderRight: '1px solid #ece4db' }}>
      {/* Profile Card */}
      <div className="mx-5 mt-6 mb-2 p-6 rounded-2xl" style={{ backgroundColor: '#fbf7f3', border: '1px solid #e0d8cf' }}>
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl overflow-hidden mb-4" style={{ border: '1px solid #e0d8cf' }}>
            {profileImageUrl ? (
              <img src={profileImageUrl} alt={fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white" style={{ backgroundColor: '#4a3728' }}>
                {initials}
              </div>
            )}
          </div>

          <h2 className="text-lg font-bold" style={{ color: '#4a3728' }}>{fullName}</h2>

          <span
            className="mt-2 px-3 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: '#f3ece4', color: '#7a5c3e' }}
          >
            Mentee
          </span>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto px-5 py-4">
        <div className="space-y-1">
          {USER_MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            const isNotificationItem = item.id === "notification";
            const showUnreadDot = isNotificationItem && unreadNotificationCount > 0;

            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors duration-150"
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
                </span>
                <span className="flex-1 text-left">{item.label}</span>

                {showUnreadDot && !isActive && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: "#b91c1c" }}
                  />
                )}

                {isActive ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                ) : !showUnreadDot ? (
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100" style={{ color: '#c0b0a0' }} />
                ) : null}
              </button>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
