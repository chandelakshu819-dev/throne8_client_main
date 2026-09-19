"use client";

import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  Clock,
  CalendarClock,
  Star,
  Flag,
  IndianRupee,
} from "lucide-react";
import AdminLayout from "./AdminLayout";
import AdminService from "@/lib/api/admin.service";

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Mentorship module overview" },
  "pending-mentors": { title: "Pending Mentors", subtitle: "Applications waiting for approval" },
  "all-mentors": { title: "All Mentors", subtitle: "Manage active and suspended mentors" },
  sessions: { title: "Sessions", subtitle: "All booked mentorship sessions" },
  reviews: { title: "All Reviews", subtitle: "Every review submitted by mentees" },
  "reported-reviews": { title: "Reported Reviews", subtitle: "Reviews flagged for moderation" },
  payments: { title: "Payment Logs", subtitle: "Transaction history across the module" },
};

interface DashboardStats {
  totalMentors?: number;
  activeMentors?: number;
  pendingMentors?: number;
  totalSessions?: number;
  totalRevenue?: number;
  totalReviews?: number;
  reportedReviews?: number;
  [key: string]: any;
}

interface StatCardConfig {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
  iconBg: string;
  iconColor: string;
}

function StatCard({ label, value, icon: Icon, accent, iconBg, iconColor }: StatCardConfig) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 transition-transform duration-150 hover:-translate-y-0.5"
      style={{
        backgroundColor: "#fff",
        border: "1px solid #ece4db",
        boxShadow: "0 1px 2px rgba(74, 55, 40, 0.04)",
      }}
    >
      <div
        className="absolute top-0 left-0 h-full w-1"
        style={{ backgroundColor: accent }}
      />
      <div className="flex items-start justify-between">
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "#a3907e" }}
          >
            {label}
          </p>
          <p className="text-3xl font-bold mt-2" style={{ color: "#4a3728" }}>
            {value}
          </p>
        </div>
        <span
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: iconBg }}
        >
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </span>
      </div>
    </div>
  );
}

function DashboardOverview({ stats, loading }: { stats: DashboardStats | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="h-[104px] rounded-2xl animate-pulse"
            style={{ backgroundColor: "#f3ece4" }}
          />
        ))}
      </div>
    );
  }

  const cards: StatCardConfig[] = [
    {
      label: "Total Mentors",
      value: stats?.totalMentors ?? 0,
      icon: Users,
      accent: "#4a3728",
      iconBg: "#f3ece4",
      iconColor: "#4a3728",
    },
    {
      label: "Active Mentors",
      value: stats?.activeMentors ?? 0,
      icon: UserCheck,
      accent: "#2f7d5c",
      iconBg: "#e4f3ec",
      iconColor: "#2f7d5c",
    },
    {
      label: "Pending Mentors",
      value: stats?.pendingMentors ?? 0,
      icon: Clock,
      accent: "#b8860b",
      iconBg: "#fbf1dc",
      iconColor: "#b8860b",
    },
    {
      label: "Total Sessions",
      value: stats?.totalSessions ?? 0,
      icon: CalendarClock,
      accent: "#2563eb",
      iconBg: "#e6edfc",
      iconColor: "#2563eb",
    },
    {
      label: "Total Reviews",
      value: stats?.totalReviews ?? 0,
      icon: Star,
      accent: "#a855f7",
      iconBg: "#f4e9fd",
      iconColor: "#a855f7",
    },
    {
      label: "Reported Reviews",
      value: stats?.reportedReviews ?? 0,
      icon: Flag,
      accent: "#b91c1c",
      iconBg: "#fdecea",
      iconColor: "#b91c1c",
    },
    {
      label: "Total Revenue",
      value:
        stats?.totalRevenue != null
          ? `₹${stats.totalRevenue.toLocaleString("en-IN")}`
          : "₹0",
      icon: IndianRupee,
      accent: "#0f766e",
      iconBg: "#e2f5f3",
      iconColor: "#0f766e",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
}

export default function MentorshipAdminPage() {
  const [activePage, setActivePage] = useState("dashboard");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingMentorCount, setPendingMentorCount] = useState(0);
  const [reportedReviewCount, setReportedReviewCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCounts() {
      try {
        const [dashboardRes, pendingRes, reportedRes] = await Promise.all([
          AdminService.getDashboardStats(),
          AdminService.getPendingMentors({ page: 1, limit: 1 }),
          AdminService.getReportedReviews({ page: 1, limit: 1 }),
        ]);

        if (!isMounted) return;
        setStats(dashboardRes.data);
        setPendingMentorCount(pendingRes.pagination?.total ?? 0);
        setReportedReviewCount(reportedRes.pagination?.total ?? 0);
      } catch (err: any) {
        if (isMounted) setError(err.message || "Failed to load admin data.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCounts();
    return () => {
      isMounted = false;
    };
  }, []);

  const meta = PAGE_META[activePage] ?? PAGE_META.dashboard;

  return (
    <AdminLayout
      activePage={activePage}
      setActivePage={setActivePage}
      pendingMentorCount={pendingMentorCount}
      reportedReviewCount={reportedReviewCount}
      pageTitle={meta.title}
      pageSubtitle={meta.subtitle}
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: "#fdecea", color: "#b91c1c" }}>
          {error}
        </div>
      )}

      {activePage === "dashboard" && <DashboardOverview stats={stats} loading={loading} />}

      {activePage !== "dashboard" && (
        <p style={{ color: "#8a7a6a" }}>
          {PAGE_META[activePage]?.title} page — agla step mein banega.
        </p>
      )}
    </AdminLayout>
  );
}