import {
  LayoutDashboard,
  UserCheck,
  Users,
  CalendarClock,
  Star,
  Flag,
  Receipt,
  ChevronRight,
} from "lucide-react";

interface AdminSidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  pendingMentorCount?: number;
  reportedReviewCount?: number;
}

const ADMIN_MENU_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "pending-mentors", label: "Pending Mentors", icon: UserCheck },
  { id: "all-mentors", label: "All Mentors", icon: Users },
  { id: "sessions", label: "Sessions", icon: CalendarClock },
  { id: "reviews", label: "All Reviews", icon: Star },
  { id: "reported-reviews", label: "Reported Reviews", icon: Flag },
  { id: "payments", label: "Payment Logs", icon: Receipt },
];

export default function AdminSidebar({
  activePage,
  setActivePage,
  pendingMentorCount = 0,
  reportedReviewCount = 0,
}: AdminSidebarProps) {
  return (
    <aside className="w-72 flex flex-col" style={{ backgroundColor: '#fff', borderRight: '1px solid #ece4db' }}>
      <div className="mx-5 mt-6 mb-2 p-5 rounded-2xl" style={{ backgroundColor: '#fbf7f3', border: '1px solid #e0d8cf' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#4a3728' }}>
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold" style={{ color: '#4a3728' }}>Admin Panel</h2>
            <p className="text-xs" style={{ color: '#8a7a6a' }}>Mentorship module</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-5 py-4">
        <div className="space-y-1">
          {ADMIN_MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            const badgeCount =
              item.id === "pending-mentors" ? pendingMentorCount :
              item.id === "reported-reviews" ? reportedReviewCount : 0;

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
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : '#f3ece4' }}
                >
                  <Icon className="w-4 h-4" style={{ color: isActive ? '#fff' : '#7a5c3e' }} />
                </span>
                <span className="flex-1 text-left">{item.label}</span>

                {badgeCount > 0 && !isActive && (
                  <span
                    className="px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-[18px] text-center"
                    style={{ backgroundColor: "#b91c1c", color: "#fff" }}
                  >
                    {badgeCount}
                  </span>
                )}

                {isActive ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                ) : badgeCount === 0 ? (
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