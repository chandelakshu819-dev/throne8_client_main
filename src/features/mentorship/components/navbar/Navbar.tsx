// src/app/(mentor)/mentorDashboard/components/navbar/Navbar.tsx
'use client';

import React from 'react';
import { Search, Globe } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface NavbarProps {
  activeTimezone?: string; // optional: default "IST (UTC+5:30)"
}

export default function Navbar({ activeTimezone = "IST (UTC+5:30)" }: NavbarProps) {
  const { user } = useAuth();
  return (
    <nav className="fixed top-0 w-full z-[100] bg-white/70 backdrop-blur-xl border-b border-[#ece7e2] px-6 py-4 flex justify-between items-center">
      {/* Left side: Logo + Search */}
      <div className="flex items-center gap-10">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#4a3728] rounded-lg" />
          <h1 className="text-xl font-black tracking-tighter">THRONE</h1>
        </div>

        {/* Search bar - hidden on mobile */}
        <div className="hidden lg:flex relative group">
          <Search className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
          <input
            className="bg-[#f8f6f4] border-none rounded-full py-2.5 pl-11 pr-4 text-[11px] w-[350px] font-medium focus:ring-1 ring-[#4a3728] outline-none"
            placeholder="Search by name, skills or company..."
          />
        </div>
      </div>

      {/* Right side: Timezone + Dashboard button */}
      <div className="flex items-center gap-6">
        {/* Timezone badge - hidden on mobile */}
        <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-[#8b7355] bg-[#f8f6f4] px-4 py-2 rounded-full border border-[#ece7e2]">
          <Globe className="w-3.5 h-3.5" />
          {activeTimezone}
        </div>

        {/* Dashboard Button */}
        {user && user.role !== 'user' && (
          <button className="bg-[#4a3728] text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[2px] shadow-lg hover:bg-[#8b7355] transition-all">
            DASHBOARD
          </button>
        )}
      </div>
    </nav>
  );
}