"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

import FilterModal from "./FilterModal";
import CreateGroupModal from "./CreateGroupModal";

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

const StudySidebar = () => {
  const router = useRouter();
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

  // ✅ Load unread count on mount and every 60s (socket pushes cover the rest).
  // Route changes no longer trigger a request; see the effect below for the one case that does.
  // Failures are silent so the sidebar never breaks because of notifications.
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      StudyGroupNotificationService.getUnreadCount()
        .then((n) => { if (!cancelled) setUnreadCount(n); })
        .catch(() => {});
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

  // ✅ Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
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

  const handleItemClick = (item: SidebarItem) => {
    if (item.action === "filter") {
      setIsFilterOpen(true);
      return;
    }

    if (item.action === "create") {
      setIsCreateGroupOpen(true);
      return;
    }

    if (item.path) {
      router.push(item.path);
    }
  };

  const sidebarSections = [
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
          action: "filter" as const,
          icon: <Search size={18} />,
        },
        {
          name: "Create Group",
          action: "create" as const,
          icon: <UserPlus size={18} />,
        },
        {
          name: "Notifications",
          path: "/study/notifications",
          icon: <Bell size={18} />,
          badge: unreadCount,
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

  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 lg:mb-10">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#4a3728]">
          Throne8
        </h2>
        {/* Close button - only visible on mobile */}
        <button
          onClick={() => setIsMobileSidebarOpen(false)}
          className="lg:hidden p-2 hover:bg-black/5 rounded-lg transition-colors"
          aria-label="Close sidebar"
        >
          <X size={24} className="text-[#4a3728]" />
        </button>
      </div>

      {/* Sections - REMOVED overflow-y-auto */}
      <div className="flex-1">
        {sidebarSections.map((section, index) => (
          <div key={index} className="mb-6 lg:mb-8">
            <h3 className="text-xs lg:text-sm font-bold text-gray-700 uppercase mb-3 lg:mb-4 px-1">
              {section.title}
            </h3>

            <ul className="space-y-2 lg:space-y-3">
              {section.items.map((item, idx) => (
                <li
                  key={idx}
                  onClick={() => handleItemClick(item)}
                  className={`flex items-center gap-3 p-2.5 lg:p-3 rounded-xl cursor-pointer transition-all
                    ${
                      pathname === item.path
                        ? "bg-[#4a3728] text-white shadow-md"
                        : "text-gray-700 hover:bg-black/5"
                    }`}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span className="text-sm lg:text-base font-medium">{item.name}</span>
                  {!!(item as SidebarItem).badge && (
                    <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
                      {(item as SidebarItem).badge! > 99 ? "99+" : (item as SidebarItem).badge}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <>
      {/* MOBILE TOGGLE BUTTON - Fixed at top */}
      <button
        onClick={() => setIsMobileSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-3 bg-[#4a3728] text-white rounded-xl shadow-lg hover:bg-[#5a4738] transition-colors"
        aria-label="Open sidebar"
      >
        <Menu size={24} />
      </button>

      {/* OVERLAY - Mobile & Tablet only */}
      {isMobileSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR - Desktop (fixed), Mobile/Tablet (sliding) */}
      <aside
        className={`
          fixed top-0 left-0 h-screen bg-[#f7f3ee] shadow-lg z-50 flex flex-col
          transition-transform duration-300 ease-in-out
          
          /* Mobile: Full screen sliding sidebar */
          w-full sm:w-80
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          
          /* Tablet: Medium width */
          md:w-64
          
          /* Desktop: Always visible, fixed */
          lg:translate-x-0 lg:w-72
          
          p-4 sm:p-5 lg:p-6
        `}
      >
        <SidebarContent />
      </aside>

      {/* MODALS (render ONLY after mount) */}
      {mounted && (
        <>
          <FilterModal
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
          />

          <CreateGroupModal
            isOpen={isCreateGroupOpen}
            onClose={() => setIsCreateGroupOpen(false)}
          />
        </>
      )}
    </>
  );
};

export default StudySidebar;