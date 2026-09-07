'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import CompanyService from '@/lib/api/company.service';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useProfile } from '@/features/profile/hooks/useProfile';


interface CompanyData {
  name: string;
  tagline: string;
  logoUrl: string | null;
  coverUrl: string | null;
  followers: number;
  employees: string;
  industry: string;
}

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (val: boolean) => void;
}

export default function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const pathname = usePathname();
  const params = useParams();

  // console.log('Sidebar received userId:', params); // Debug log
  // const [collapsed, setCollapsed] = useState(false);

  const { user } = useAuth();
  const userId = user?.userId;
  // console.log('Sidebar userid => ', userId); // Debug log

  const {
    userProfileData,
    loadProfile
  } = useProfile();

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const companyId = userProfileData?.companyId || null;

  // console.log('👤 [SIDEBAR] Current User:', user);
  // console.log('👤 [SIDEBAR] User Company ID:', companyId);

  const [company, setCompany] = useState<CompanyData>({
    name: 'Loading...',
    tagline: '',
    logoUrl: null,
    coverUrl: null,
    followers: 0,
    employees: '—',
    industry: '—',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;

    const fetchCompanyData = async () => {
      try {
        setLoading(true);

        const companyRes = await CompanyService.getCompany(companyId);
        const companyData = companyRes.data;

        let logoUrl: string | null = companyData?.media?.logo?.url || null;
        if (!logoUrl) {
          try {
            const logosRes = await CompanyService.getCompanyLogos(companyId);
            const logos = logosRes.data?.logos || [];
            const activeLogo = logos.find((l: any) => l.isActive);
            logoUrl = activeLogo?.cloudinarySecureUrl || null;
          } catch {
            console.warn('Failed to fetch company logos, using fallback');
            throw new Error('Failed to fetch company logos');
          }
        }

        let coverUrl: string | null = companyData?.media?.coverImage?.url || null;

        // ✅ Real followers count
        let realFollowersCount = companyData?.stats?.followersCount || 0;
        try {
          const followersRes = await CompanyService.getCompanyFollowersCount(companyId);
          realFollowersCount = followersRes?.data?.followersCount ?? realFollowersCount;
        } catch {
          console.warn('Failed to fetch real followers count, using fallback');
          throw new Error('Failed to fetch followers count');
        }

        setCompany({
          name: companyData?.companyName || 'Company',
          tagline: companyData?.descriptions?.tagline || companyData?.descriptions?.short || '',
          logoUrl,
          coverUrl,
          followers: realFollowersCount,  // ✅ real count
          employees: companyData?.companySize || '—',
          industry: companyData?.industry || '—',
        });

      } catch (err) {
        console.error('Failed to load company data:', err);
        setCompany(prev => ({ ...prev, name: 'Company Not Found' }));
        throw err; // Rethrow to be caught by outer catch if needed
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [companyId]);

  const NAV_GROUPS = [
    {
      label: 'Overview',
      items: [
        { label: 'Dashboard', href: `/company/${userId}`, icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { label: 'About', href: `/about`, icon: 'M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z' },
        { label: 'Analytics', href: `/analysis`, icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
        { label: 'Activity', href: `/activity`, icon: 'M13 10V3L4 14h7v7l9-11h-7z', badge: 3 },
        { label: 'Inbox', href: `/inbox`, icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', badge: 7 },
      ],
    },
    {
      label: 'Content',
      items: [
        { label: 'Posts', href: `/posts`, icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
        { label: 'Events', href: `/events`, icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
      ],
    },
    {
      label: 'People',
      items: [
        { label: 'Employees', href: `/employees`, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
        { label: 'Jobs & ATS', href: `/jobs`, icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', badge: 5 },
      ],
    },
    {
      label: 'Settings',
      items: [
        { label: 'Edit Page', href: `/edit`, icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
      ],
    },
  ];

  return (
    <>
      <aside className={`hidden md:flex flex-col fixed left-0 top-16 h-[calc(100vh-4rem)] z-40 bg-[#f6ede8] border-r border-[#e0d8cf] shadow-lg transition-all duration-300 ease-in-out ${collapsed ? 'w-20' : 'w-64'}`}>

        {/* ── Collapse toggle ── */}
        <button
          // onClick={() => setCollapsed(!collapsed)}
          onClick={() => onCollapse(!collapsed)}
          className="absolute -right-3 top-20 z-50 w-6 h-6 bg-[#f6ede8] border border-[#e0d8cf] rounded-full flex items-center justify-center shadow-md hover:bg-[#e0d8cf] transition-colors"
        >
          <svg className="w-3 h-3 text-[#4a3728]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={collapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} />
          </svg>
        </button>

        {/* ══════════════════════════════════════
            EXPANDED HEADER
        ══════════════════════════════════════ */}
        {!collapsed ? (
          <div className="border-b border-[#e0d8cf] flex-shrink-0">

            {/* 1. COVER IMAGE — top, full width, h-20 */}
            <div className="relative h-20 w-full overflow-hidden bg-gradient-to-br from-[#d4c8be] to-[#b8a99a]">
              {company.coverUrl && (
                <Image
                  src={company.coverUrl}
                  alt="Company Cover"
                  fill
                  className="object-cover"
                  unoptimized
                />
              )}
              {/* subtle dark overlay */}
              <div className="absolute inset-0 bg-black/10" />
            </div>

            {/* 2. LOGO + NAME + TAGLINE */}
            <div className="px-3 pb-4 relative z-10">

              {/* Logo + Name - same row */}
              <div className="flex items-center gap-2 -mt-6 mb-2">
                {/* Logo */}
                <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-[#f6ede8] shadow-md bg-white/60 backdrop-blur-sm flex-shrink-0">
                  {company.logoUrl ? (
                    <Image
                      src={company.logoUrl}
                      alt={company.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#4a3728]">
                      <span className="text-[#f6ede8] text-lg font-bold">
                        {company.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Name only */}
                <p className="py-2 px-4 text-sm font-bold text-[#4a3728] rounded-xl shadow-md bg-white/60 backdrop-blur-sm leading-tight truncate">
                  {loading ? '...' : company.name}
                </p>
              </div>

              {/* Tagline */}
              <p className="text-wrap text-[14px] text-[#4a3728]/60 tracking-tight leading-tight mb-2">
                {company.tagline}
              </p>

              {/* Industry Badge */}
              <span className="mt-2 px-2 py-0.5 bg-[#4a3728]/10 text-[#4a3728] text-[10px] font-semibold rounded-full border border-[#4a3728]/20 inline-block mb-2">
                {loading ? '—' : company.industry}
              </span>

              {/* Followers + Employees */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#e0d8cf]/70 rounded-xl px-3 py-2 text-center">
                  <p className="text-sm font-bold text-[#4a3728]">
                    {loading ? '...' : company.followers.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-[#4a3728]/60">Followers</p>
                </div>
                <div className="bg-[#e0d8cf]/70 rounded-xl px-3 py-2 text-center">
                  <p className="text-sm font-bold text-[#4a3728]">
                    {loading ? '...' : company.employees}
                  </p>
                  <p className="text-[10px] text-[#4a3728]/60">Employees</p>
                </div>
              </div>

            </div>
          </div>

        ) : (
          /* ══════════════════════════════════════
              COLLAPSED HEADER — sirf logo
          ══════════════════════════════════════ */
          <div className="p-3 border-b border-[#e0d8cf] flex justify-center mt-4">
            <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-[#e0d8cf] bg-[#4a3728]">
              {company.logoUrl ? (
                <Image
                  src={company.logoUrl}
                  alt={company.name}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-[#f6ede8] text-sm font-bold">
                    {company.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            5. NAV LINKS
        ══════════════════════════════════════ */}
        <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'none' }}>
          {NAV_GROUPS.map(group => (
            <div key={group.label} className="mb-1">
              {!collapsed && (
                <p className="text-[10px] font-bold text-[#4a3728]/40 uppercase tracking-widest px-5 py-2">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5 px-3">
                {group.items.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${isActive
                          ? 'bg-[#4a3728] text-[#f6ede8] shadow-md'
                          : 'text-[#4a3728]/80 hover:bg-[#e0d8cf] hover:text-[#4a3728]'
                          }`}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#f6ede8]/60 rounded-r-full" />
                        )}
                        <svg
                          className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#f6ede8]' : 'text-[#4a3728]/60 group-hover:text-[#4a3728]'}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                        </svg>
                        {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                        {!collapsed && item.badge && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${isActive ? 'bg-[#f6ede8]/20 text-[#f6ede8]' : 'bg-[#4a3728] text-[#f6ede8]'}`}>
                            {item.badge}
                          </span>
                        )}
                        {collapsed && (
                          <div className="absolute left-full ml-3 px-2 py-1 bg-[#4a3728] text-[#f6ede8] text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-lg z-50">
                            {item.label}{item.badge ? ` (${item.badge})` : ''}
                          </div>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* ══════════════════════════════════════
            6. BOTTOM ACTIONS
        ══════════════════════════════════════ */}
        <div className="p-3 border-t border-[#e0d8cf] space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-[#4a3728]/70 hover:bg-[#e0d8cf] hover:text-[#4a3728] transition-all duration-200 group relative"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            {!collapsed && <span>View Public Page</span>}
            {collapsed && (
              <div className="absolute left-full ml-3 px-2 py-1 bg-[#4a3728] text-[#f6ede8] text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                View Public Page
              </div>
            )}
          </Link>

          <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-[#4a3728]/70 hover:bg-[#e0d8cf] hover:text-[#4a3728] transition-all duration-200 group relative">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!collapsed && <span>Logout</span>}
            {collapsed && (
              <div className="absolute left-full ml-3 px-2 py-1 bg-[#4a3728] text-[#f6ede8] text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                Logout
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#f6ede8] border-t border-[#e0d8cf] shadow-xl">
        <ul className="flex items-center justify-around px-1 py-1.5">
          {[
            { label: 'Home', href: '/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
            { label: 'Posts', href: '/posts', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
            { label: 'Jobs', href: '/jobs', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', badge: 5 },
            { label: 'Inbox', href: '/inbox', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', badge: 7 },
            { label: 'More', href: '/edit', icon: 'M4 6h16M4 12h16M4 18h16' },
          ].map((item: { label: string; href: string; icon: string; badge?: number }) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link href={item.href} className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${isActive ? 'text-[#4a3728]' : 'text-[#4a3728]/40'}`}>
                  {isActive && <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-5 h-1 bg-[#4a3728] rounded-b-full" />}
                  <span className={`p-1.5 rounded-lg transition-all duration-200 ${isActive ? 'bg-[#4a3728] text-[#f6ede8]' : ''}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                  </span>
                  <span className="text-[9px] font-semibold">{item.label}</span>
                  {item.badge && (
                    <span className="absolute top-0.5 right-1.5 w-3.5 h-3.5 bg-[#4a3728] text-[#f6ede8] text-[8px] font-bold rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}