"use client";

import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const FilterModal = dynamic(() => import("./FilterModal"), { ssr: false });
const CreateGroupModal = dynamic(() => import("./CreateGroupModal"), { ssr: false });

import {
  Home,
  GraduationCap,
  Search,
  Star,
  Users,
  UserPlus,
  User,
  Menu,
  X,
  Bell,
  PanelLeft
} from "lucide-react";

import StudyGroupNotificationService from "@/lib/api/studyGroupNotification.service";
import { getSocket } from "@/core/realtime/socket.client";

type SidebarItem = {
  name: string;
  path?: string;
  action?: "filter" | "create";
  icon: React.ReactNode;
  badge?: number;
};

const SIDEBAR_SECTIONS: { title: string; items: SidebarItem[] }[] = [
  {
    title: "Community",
    items: [
      {
        name: "Groups",
        path: "/study/groups",
        icon: <GraduationCap size={18} />,
      },
      {
        name: "My Groups",
        path: "/study/my-groups",
        icon: <GraduationCap size={18} />,
      },
      {
        name: "Filter Groups",
        action: "filter",
        icon: <Search size={18} />,
      },
      {
        name: "Create Group",
        action: "create",
        icon: <UserPlus size={18} />,
      },
      {
        name: "Notifications",
        path: "/study/notifications",
        icon: <Bell size={18} />,
      },
    ],
  },
  {
    title: "Planning",
    items: [
      {
        name: "Timer",
        path: "/study/timer",
        icon: <Home size={18} />,
      },
      {
        name: "Goals",
        path: "/study/goals",
        icon: <Star size={18} />,
      },
      {
        name: "Todo",
        path: "/study/todo",
        icon: <Star size={18} />,
      },
    ],
  },
  {
    title: "Profile",
    items: [
      {
        name: "Dashboard",
        path: "/student-dashboard",
        icon: <Users size={18} />,
      },
    ],
  },
];

interface SidebarContentProps {
  pathname: string | null;
  unreadCount: number;
  onCloseMobile: () => void;
  onAction: (action: "filter" | "create") => void;
}

const SidebarContent = memo(function SidebarContent({
  pathname,
  unreadCount,
  onCloseMobile,
  onAction,
}: SidebarContentProps) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 lg:mb-8 flex-shrink-0">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#4a3728]">
          Throne8
        </h2>
        {/* Close button - only visible on mobile */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-2 hover:bg-black/5 rounded-lg transition-colors"
          aria-label="Close sidebar"
        >
          <X size={24} className="text-[#4a3728]" />
        </button>
      </div>

      {/* Sections - independently scrollable with accessible Profile section */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden throne8-scrollbar pr-1 -mr-1">
        {SIDEBAR_SECTIONS.map((section) => (
          <div key={section.title} className="mb-5 lg:mb-7">
            <h3 className="text-xs lg:text-sm font-bold text-gray-700 uppercase mb-2.5 lg:mb-3.5 px-1">
              {section.title}
            </h3>

            <ul className="space-y-1.5 lg:space-y-2.5">
              {section.items.map((item) => {
                const badge = item.path === "/study/notifications" ? unreadCount : undefined;
                const isActive = item.path ? pathname === item.path : false;
                const itemClass = `flex items-center gap-3 p-2.5 lg:p-3 rounded-xl cursor-pointer transition-all ${
                  isActive
                    ? "bg-[#4a3728] text-white shadow-md"
                    : "text-gray-700 hover:bg-black/5"
                }`;

                if (item.path) {
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.path}
                        prefetch={true}
                        onClick={onCloseMobile}
                        className={itemClass}
                      >
                        <span className="flex-shrink-0">{item.icon}</span>
                        <span className="text-sm lg:text-base font-medium">{item.name}</span>
                        {!!badge && (
                          <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
                            {badge > 99 ? "99+" : badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                }

                return (
                  <li key={item.name}>
                    <button
                      type="button"
                      onClick={() => {
                        if (item.action) onAction(item.action);
                      }}
                      className={`w-full text-left ${itemClass}`}
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                      <span className="text-sm lg:text-base font-medium">{item.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
});

const StudySidebar = () => {
  const pathname = usePathname();

  // ✅ modal states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  
  // ✅ mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // ✅ unread study-group notifications (badge)
  const [unreadCount, setUnreadCount] = useState(0);

  // ✅ hydration fix
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ Load unread count on mount and every 60s when tab is visible (socket pushes cover the rest).
  // Route changes no longer trigger a request; see the effect below for the one case that does.
  // Failures are silent so the sidebar never breaks because of notifications.
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      StudyGroupNotificationService.getUnreadCount()
        .then((n) => { if (!cancelled) setUnreadCount(n); })
        .catch(() => {});
    };
    load();
    const timer = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  // ✅ Items are marked read on the notifications page, so refresh the badge only when
  // the user leaves it. Every other route change cannot change the count.
  const previousPathRef = useRef(pathname);
  useEffect(() => {
    const previous = previousPathRef.current;
    previousPathRef.current = pathname;
    const NOTIFICATIONS = "/study/notifications";
    if (previous?.startsWith(NOTIFICATIONS) && !pathname?.startsWith(NOTIFICATIONS)) {
      StudyGroupNotificationService.getUnreadCount().then(setUnreadCount).catch(() => {});
    }
  }, [pathname]);

  // ✅ Instant badge update when the server pushes a new notification (e.g. a host reminder).
  // The socket may not exist yet at first render, so retry attaching until it does.
  useEffect(() => {
    let attached: ReturnType<typeof getSocket> = null;
    const refresh = () =>
      StudyGroupNotificationService.getUnreadCount().then(setUnreadCount).catch(() => {});
    const attach = () => {
      const socket = getSocket();
      if (!socket || socket === attached) return;
      attached?.off("notification:new", refresh);
      attached = socket;
      socket.on("notification:new", refresh);
    };
    attach();
    const t = setInterval(attach, 3000);
    return () => {
      clearInterval(t);
      attached?.off("notification:new", refresh);
    };
  }, []);

  // ✅ Close mobile sidebar and temporary modals when route changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
    setIsFilterOpen(false);
    setIsCreateGroupOpen(false);
  }, [pathname]);

  // ✅ Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileSidebarOpen]);

  const handleCloseMobile = useCallback(() => {
    setIsMobileSidebarOpen(false);
  }, []);

  const handleAction = useCallback((action: "filter" | "create") => {
    if (action === "filter") setIsFilterOpen(true);
    else if (action === "create") setIsCreateGroupOpen(true);
  }, []);

  return (
    <>
      {/* MOBILE TOGGLE BUTTON - sits below the fixed top nav */}
      <button
        onClick={() => setIsMobileSidebarOpen(true)}
        className="lg:hidden fixed top-3 right-4 z-[51] flex h-10 w-10 items-center justify-center bg-[#4a3728] text-white rounded-xl shadow-md hover:bg-[#5a4738] active:scale-95 transition"
         aria-label="Open sidebar"
      >
        <Menu size={22} />
      </button>

      {/* OVERLAY - Mobile & Tablet only */}
      {isMobileSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-[55] transition-opacity"
           onClick={handleCloseMobile}
        />
      )}

      {/* SIDEBAR - Desktop (fixed), Mobile/Tablet (sliding) */}
      <aside
        className={`
          fixed top-0 left-0 h-screen bg-[#f7f3ee] shadow-lg z-[60] flex flex-col
          transition-transform duration-300 ease-in-out
          w-72 max-w-[85vw] md:w-64 lg:w-72
          ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          p-4 sm:p-5 lg:p-6
        `}
      >
        <SidebarContent
          pathname={pathname}
          unreadCount={unreadCount}
          onCloseMobile={handleCloseMobile}
          onAction={handleAction}
        />
      </aside>

      {/* MODALS (lazy-loaded & mounted only when opened) */}
      {mounted && isFilterOpen && (
        <FilterModal
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
        />
      )}

      {mounted && isCreateGroupOpen && (
        <CreateGroupModal
          isOpen={isCreateGroupOpen}
          onClose={() => setIsCreateGroupOpen(false)}
        />
      )}
    </>
  );
};

export default StudySidebar;