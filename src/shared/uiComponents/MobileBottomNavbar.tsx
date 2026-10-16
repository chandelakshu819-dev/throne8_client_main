'use client';
// src/shared/uiComponents/MobileBottomNavbar.tsx
import React, { memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HOME_PATH, isFeatureEnabled } from '@/config/launch';
import { NetworkNotificationBadge } from '@/features/networks/components/notifications/NetworkNotificationBadge';

interface MobileBottomNavbarProps {
  currentUserId?: string;
  userRole?: string;
}

export const MobileBottomNavbar = memo(function MobileBottomNavbar({
  currentUserId,
  userRole,
}: MobileBottomNavbarProps) {
  const pathname = usePathname();

  // Mentorship route: admin vs normal user
  const mentorshipHref =
    userRole === 'admin'
      ? '/mentorship/admin'
      : currentUserId && currentUserId !== 'undefined'
      ? `/mentorship/${currentUserId}`
      : '/mentorship';

  // Network route
  const networkHref =
    currentUserId && currentUserId !== 'undefined'
      ? `/profile/network/${currentUserId}`
      : '/profile/network';

  const tabs = [
    {
      id: 'home',
      label: 'Home',
      href: HOME_PATH,
      isActive:
        pathname === '/dashboard' ||
        pathname === '/' ||
        pathname === HOME_PATH,
      icon: (isActive: boolean) => (
        <svg
          className="w-[22px] h-[22px]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={isActive ? 2.3 : 1.8}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
      badge: null,
      enabled: isFeatureEnabled('dashboard'),
    },
    {
      id: 'network',
      label: 'Network',
      href: networkHref,
      isActive: Boolean(
        pathname?.startsWith('/profile/network') ||
          pathname?.startsWith('/network')
      ),
      icon: (isActive: boolean) => (
        <svg
          className="w-[22px] h-[22px]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={isActive ? 2.3 : 1.8}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      badge: <NetworkNotificationBadge />,
      enabled: isFeatureEnabled('network'),
    },
    {
      id: 'study',
      label: 'Study',
      href: '/study/groups',
      isActive: Boolean(pathname?.startsWith('/study')),
      icon: (isActive: boolean) => (
        <svg
          className="w-[22px] h-[22px]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={isActive ? 2.3 : 1.8}
            d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
          />
        </svg>
      ),
      badge: null,
      enabled: isFeatureEnabled('study'),
    },
    {
      id: 'mentorship',
      label: 'Mentorship',
      href: mentorshipHref,
      isActive: Boolean(pathname?.startsWith('/mentorship')),
      icon: (isActive: boolean) => (
        <svg
          className="w-[22px] h-[22px]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={isActive ? 2.3 : 1.8}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
      badge: null,
      enabled: isFeatureEnabled('mentorship'),
    },
    {
      id: 'jobs',
      label: 'Jobs',
      href: '/job/jobs',
      isActive: Boolean(pathname?.startsWith('/job')),
      icon: (isActive: boolean) => (
        <svg
          className="w-[22px] h-[22px]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={isActive ? 2.3 : 1.8}
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
      badge: null,
      enabled: isFeatureEnabled('jobs'),
    },
  ];

  const visibleTabs = tabs.filter((t) => t.enabled);

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[#FAF6F0]/95 backdrop-blur-xl border-t border-[#E5D9CE] shadow-[0_-4px_24px_rgba(74,55,40,0.08)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch h-16 px-1 max-w-md mx-auto">
        {visibleTabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            aria-label={tab.label}
            className="group relative flex-1 min-w-0 flex flex-col items-center justify-center h-full py-1 text-center select-none transition-transform duration-150 active:scale-95"
          >
            {/* Top active indicator line */}
            {tab.isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-full bg-gradient-to-r from-[#c4963a] via-[#4a3728] to-[#c4963a] shadow-sm animate-fadeIn" />
            )}

            {/* Icon with active badge & pill background */}
            <div
              className={`relative flex items-center justify-center p-1.5 rounded-xl transition-all duration-200 ${
                tab.isActive
                  ? 'bg-[#4a3728] text-[#FAF6F0] shadow-sm scale-105'
                  : 'text-[#4a3728]/70 hover:text-[#4a3728] hover:bg-[#EFE3D8]/60'
              }`}
            >
              {tab.icon(tab.isActive)}
              {tab.badge && (
                <span className="absolute -top-1 -right-2 flex items-center justify-center pointer-events-none">
                  {tab.badge}
                </span>
              )}
            </div>

            {/* Tab Label */}
            <span
              className={`text-[10px] tracking-tight mt-0.5 leading-none transition-colors duration-200 whitespace-nowrap ${
                tab.isActive
                  ? 'font-bold text-[#4a3728]'
                  : 'font-medium text-[#7a6a5a] group-hover:text-[#4a3728]'
              }`}
            >
              {tab.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
});

export default MobileBottomNavbar;
