// src/app/mentorship/admin/reports/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import AdminLayout from "@/features/mentorship/components/admin/AdminLayout";
import CommunityReportsView from "@/features/mentorship/components/admin/CommunityReportsView";

export default function CommunityReportsAdminPage() {
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState("community-reports");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf6f1]">
        <div className="text-sm font-semibold text-[#7a5c3e]">Checking authorization...</div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#faf6f1]">
        <div className="max-w-md w-full p-6 rounded-2xl bg-white border border-[#ece4db] text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[#4a3728]">Admin Access Required</h2>
          <p className="text-xs text-[#8a7a6a]">
            You do not have permission to view this moderation page.
          </p>
          <div className="pt-2">
            <Link
              href="/mentorship"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full bg-[#4a3728] text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Mentorship</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout
      activePage={activePage}
      setActivePage={setActivePage}
      pageTitle="Community Reports"
      pageSubtitle="Review and moderate flagged forum threads and replies"
    >
      <CommunityReportsView />
    </AdminLayout>
  );
}
