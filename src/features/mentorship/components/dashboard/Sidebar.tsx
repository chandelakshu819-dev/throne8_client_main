// mentorDashboard/components/Sidebar.tsx
import { Star, ChevronRight, ChevronLeft } from "lucide-react";
import { MENU_ITEMS } from "../../constants/constant";
import type { MenuItem } from "../../types";

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
  const firstName = dashboardData?.user?.firstName ?? mentorData?.user?.firstName ?? "A";
  const lastName = dashboardData?.user?.lastName ?? mentorData?.user?.lastName ?? "S";
  const initials = `${firstName[0] || 'A'}${lastName[0] || ''}`;
  const fullName = dashboardData?.user?.name || `${firstName} ${lastName}`.trim();
  const rawDomain = dashboardData?.category || mentorData?.domains?.[0] || "Mentor";
  const domain = (rawDomain.replace("_", " "))
    .split(" ")
    .map((word: any) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
  const profilePic = dashboardData?.profilePic ?? mentorData?.profilePic ?? null;
  const rating = dashboardData?.stats?.rating ?? dashboardData?.rating ?? mentorData?.stats?.averageRating ?? 0;

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
        className={`mt-6 mb-2 rounded-2xl transition-all duration-200 group ${isCollapsed ? 'mx-3 p-3' : 'mx-5 p-6'}`} 
        style={{ backgroundColor: '#fbf7f3', border: '1px solid #e0d8cf' }}
      >
        <div className="flex flex-col items-center text-center">
          <div className={`rounded-2xl overflow-hidden relative transition-all duration-300 ${isCollapsed ? 'w-10 h-10' : 'w-20 h-20 mb-4'}`} style={{ border: '1px solid #e0d8cf' }}>
            {profilePic ? (
              <img src={profilePic} alt={fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-white transition-all duration-300" style={{ backgroundColor: '#4a3728', fontSize: isCollapsed ? '1rem' : '1.5rem' }}>
                {initials}
              </div>
            )}
          </div>

          {!isCollapsed && (
            <>
              <div className="flex flex-col items-center mb-1 w-full px-2">
                <span className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: '#a08070' }}>
                  Mentor Dashboard
                </span>
                <span className="text-xs text-[#7a5c3e] mb-1 whitespace-nowrap overflow-hidden text-ellipsis w-full">
                  Mentoring by
                </span>
              </div>
              <h2 className="text-lg font-bold whitespace-nowrap overflow-hidden text-ellipsis w-full" style={{ color: '#4a3728' }}>{fullName}</h2>

              <span
                className="mt-2 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: '#f3ece4', color: '#7a5c3e' }}
              >
                {domain}
              </span>

              <div className="flex items-center justify-center gap-1 mt-3">
                {rating > 0 ? (
                  <>
                    {Array(5).fill(0).map((_, i) => (
                      <Star
                        key={i}
                        className="w-3.5 h-3.5"
                        style={{
                          fill: i < Math.round(rating) ? '#c9a87c' : 'none',
                          color: i < Math.round(rating) ? '#c9a87c' : '#d8cec4',
                        }}
                      />
                    ))}
                    <span className="ml-1.5 text-sm font-bold" style={{ color: '#4a3728' }}>{rating.toFixed(1)}</span>
                  </>
                ) : (
                  <span className="text-xs" style={{ color: '#a08070' }}>No ratings yet</span>
                )}
              </div>

              {onSwitchRole && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSwitchRole();
                  }}
                  className="mt-3 text-[11px] font-semibold underline"
                  style={{ color: '#4a3728' }}
                >
                  Switch to Mentee view →
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto px-5 py-4">
        <div className="space-y-1">
          {MENU_ITEMS.map((item: MenuItem) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            const isNotificationItem = item.id === "notification";
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