"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  UserCheck,
  Clock,
  CalendarClock,
  Star,
  Flag,
  IndianRupee,
  Wallet,
} from "lucide-react";
import AdminLayout from "./AdminLayout";
import AdminService from "@/lib/api/admin.service";
import CommunityService from "@/lib/api/community.service";
import PayoutService from "@/lib/api/payout.service";
import CommunityReportsView from "./CommunityReportsView";
import PendingMentorsView from "./PendingMentorsView";
import AllMentorsView from "./AllMentorsView";
import ReportedReviewsView from "./ReportedReviewsView";
import AllReviewsView from "./AllReviewsView";
import SessionsView from "./SessionsView";
import PayoutsView from "./PayoutsView";
import RefundsView from "./RefundsView";

const inrFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
});

function formatINR(val: number): string {
  return `₹${inrFormatter.format(val)}`;
}

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Mentorship module overview" },
  "pending-mentors": { title: "Pending Mentors", subtitle: "Applications waiting for approval" },
  "all-mentors": { title: "All Mentors", subtitle: "Manage active and suspended mentors" },
  sessions: { title: "Sessions", subtitle: "All booked mentorship sessions" },
  reviews: { title: "All Reviews", subtitle: "Every review submitted by mentees" },
  "all-reviews": { title: "All Reviews", subtitle: "Every review submitted by mentees" },
  "reported-reviews": { title: "Reported Reviews", subtitle: "Reviews flagged for moderation" },
  "community-reports": { title: "Community Reports", subtitle: "Review and moderate flagged forum threads and replies" },
  payments: { title: "Payment Logs", subtitle: "Transaction history across the module" },
  payouts: { title: "Mentor Payouts", subtitle: "Approve held earnings and pay mentors" },
  refunds: { title: "Refunds", subtitle: "Missed-session refund requests from students" },
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

  // stats == null means the dashboard call failed: show "—", never a fake 0.
  const show = (v: number | undefined): string | number => (stats == null ? "—" : v ?? 0);

  const cards: StatCardConfig[] = [
    {
      label: "Total Mentors",
      value: show(stats?.totalMentors),
      icon: Users,
      accent: "#4a3728",
      iconBg: "#f3ece4",
      iconColor: "#4a3728",
    },
    {
      label: "Active Mentors",
      value: show(stats?.activeMentors),
      icon: UserCheck,
      accent: "#2f7d5c",
      iconBg: "#e4f3ec",
      iconColor: "#2f7d5c",
    },
    {
      label: "Pending Mentors",
      value: show(stats?.pendingMentors),
      icon: Clock,
      accent: "#b8860b",
      iconBg: "#fbf1dc",
      iconColor: "#b8860b",
    },
    {
      label: "Total Sessions",
      value: show(stats?.totalSessions),
      icon: CalendarClock,
      accent: "#2563eb",
      iconBg: "#e6edfc",
      iconColor: "#2563eb",
    },
    {
      label: "Total Reviews",
      value: show(stats?.totalReviews),
      icon: Star,
      accent: "#a855f7",
      iconBg: "#f4e9fd",
      iconColor: "#a855f7",
    },
    {
      label: "Reported Reviews",
      value: show(stats?.reportedReviews),
      icon: Flag,
      accent: "#b91c1c",
      iconBg: "#fdecea",
      iconColor: "#b91c1c",
    },
    {
      label: "Total Revenue",
      value:
        stats == null
          ? "—"
          : stats.totalRevenue != null
            ? formatINR(stats.totalRevenue)
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
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab") || "dashboard";
  const activePage = tabParam in PAGE_META ? tabParam : "dashboard";

  const handleSetActivePage = useCallback(
    (page: string) => {
      const validPage = page in PAGE_META ? page : "dashboard";
      const targetUrl =
        validPage === "dashboard"
          ? "/mentorship/admin"
          : `/mentorship/admin?tab=${encodeURIComponent(validPage)}`;
      router.replace(targetUrl);
    },
    [router]
  );

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  // null = not loaded / failed to load (no badge shown)
  const [pendingMentorCount, setPendingMentorCount] = useState<number | null>(null);
  const [reportedReviewCount, setReportedReviewCount] = useState<number | null>(null);
  const [communityReportCount, setCommunityReportCount] = useState<number | null>(null);
  const [heldPayoutCount, setHeldPayoutCount] = useState<number | null>(null);
  const [pendingRefundCount, setPendingRefundCount] = useState<number | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const isMountedRef = useRef(true);
  const inFlightRef = useRef(false);

  const loadCounts = useCallback(async () => {
    if (inFlightRef.current) return; // guard against double fetch (Retry spam / StrictMode)
    inFlightRef.current = true;
    setErrors([]);
    setLoading(true);

    const reasonText = (reason: unknown) =>
      reason instanceof Error ? reason.message : String(reason);

    try {
      const [dashboardRes, pendingRes, reportedRes, communityRes, payoutRes, refundRes] = await Promise.allSettled([
        AdminService.getDashboardStats(),
        AdminService.getPendingMentors({ page: 1, limit: 1 }),
        AdminService.getReportedReviews({ page: 1, limit: 1 }),
        CommunityService.listCommunityReports({ page: 1, limit: 1, status: "pending" }),
        PayoutService.adminList("held", 1, 1),
        PayoutService.adminListRefunds("pending", 1, 1),
      ]);

      if (!isMountedRef.current) return;
      const failures: string[] = [];

      if (dashboardRes.status === "fulfilled") {
        setStats(dashboardRes.value.data);
      } else {
        setStats(null);
        failures.push(`Could not load dashboard stats: ${reasonText(dashboardRes.reason)}`);
      }

      if (pendingRes.status === "fulfilled") {
        setPendingMentorCount(pendingRes.value.meta?.total ?? 0);
      } else {
        setPendingMentorCount(null);
        failures.push(`Could not load pending mentor count: ${reasonText(pendingRes.reason)}`);
      }

      if (reportedRes.status === "fulfilled") {
        setReportedReviewCount(reportedRes.value.meta?.total ?? 0);
      } else {
        setReportedReviewCount(null);
        failures.push(`Could not load reported review count: ${reasonText(reportedRes.reason)}`);
      }

      if (communityRes.status === "fulfilled") {
        setCommunityReportCount(communityRes.value.total ?? 0);
      } else {
        setCommunityReportCount(null);
        failures.push(`Could not load community report count: ${reasonText(communityRes.reason)}`);
      }

      if (payoutRes.status === "fulfilled") {
        setHeldPayoutCount(payoutRes.value.total ?? 0);
      } else {
        setHeldPayoutCount(null);
        failures.push(`Could not load payouts count: ${reasonText(payoutRes.reason)}`);
      }

      if (refundRes.status === "fulfilled") {
        setPendingRefundCount(refundRes.value.total ?? 0);
      } else {
        setPendingRefundCount(null);
        failures.push(`Could not load refunds count: ${reasonText(refundRes.reason)}`);
      }

      setErrors(failures);
    } finally {
      inFlightRef.current = false;
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadCounts();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadCounts]);

  const meta = PAGE_META[activePage] ?? PAGE_META.dashboard;

  return (
    <AdminLayout
      activePage={activePage}
      setActivePage={handleSetActivePage}
      pendingMentorCount={pendingMentorCount ?? undefined}
      reportedReviewCount={reportedReviewCount ?? undefined}
      communityReportCount={communityReportCount ?? undefined}
      heldPayoutCount={heldPayoutCount ?? undefined}
      pendingRefundCount={pendingRefundCount ?? undefined}
      pageTitle={meta.title}
      pageSubtitle={meta.subtitle}
    >
      {errors.length > 0 && (
        <div
          className="mb-4 p-3 rounded-lg text-sm flex items-start justify-between gap-3"
          style={{ backgroundColor: "#fdecea", color: "#b91c1c" }}
        >
          <ul className="space-y-0.5">
            {errors.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
          <button
            id="admin-dashboard-retry"
            type="button"
            onClick={() => {
              void loadCounts();
            }}
            disabled={loading}
            className="shrink-0 px-2.5 py-1 rounded-md text-xs font-semibold disabled:opacity-50"
            style={{ backgroundColor: "#fff", color: "#b91c1c", border: "1px solid #b91c1c" }}
          >
            Retry
          </button>
        </div>
      )}

      {activePage === "dashboard" && (
        <div className="space-y-5">
          <DashboardOverview stats={stats} loading={loading} />

          {/* Payouts shortcut (sidebar mein link na ho tab bhi yahan se khulega) */}
          <button
            type="button"
            onClick={() => handleSetActivePage("payouts")}
            className="w-full flex items-center justify-between gap-4 rounded-2xl p-5 text-left transition-transform hover:-translate-y-0.5"
            style={{ backgroundColor: "#4a3728", color: "#fff" }}
          >
            <span className="flex items-center gap-4">
              <span className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                <Wallet className="w-5 h-5" />
              </span>
              <span>
                <span className="block text-base font-bold">Mentor Payouts</span>
                <span className="block text-xs opacity-80">
                  {heldPayoutCount == null
                    ? "Payouts review karne ke liye kholo"
                    : heldPayoutCount === 0
                      ? "Abhi koi payout approval ke liye pending nahi"
                      : `${heldPayoutCount} payout approval ka intezaar kar rahe hain`}
                </span>
              </span>
            </span>
            {heldPayoutCount != null && heldPayoutCount > 0 && (
              <span className="px-3 py-1 rounded-full text-sm font-bold" style={{ backgroundColor: "#fff", color: "#4a3728" }}>
                {heldPayoutCount}
              </span>
            )}
          </button>
        </div>
      )}

      {activePage === "pending-mentors" && (
        <PendingMentorsView
          onCountChange={(count) => setPendingMentorCount(count)}
        />
      )}

      {activePage === "all-mentors" && <AllMentorsView />}

      {activePage === "community-reports" && (
        <CommunityReportsView
          onReportCountChange={(count) => setCommunityReportCount(count)}
        />
      )}

      {activePage === "reported-reviews" && (
        <ReportedReviewsView
          onCountChange={(count) => setReportedReviewCount(count)}
        />
      )}

      {(activePage === "all-reviews" || activePage === "reviews") && (
        <AllReviewsView />
      )}

      {activePage === "sessions" && <SessionsView />}

      {activePage === "payouts" && (
        <PayoutsView onHeldCountChange={(count) => setHeldPayoutCount(count)} />
      )}

      {activePage === "refunds" && (
        <RefundsView onPendingCountChange={(count) => setPendingRefundCount(count)} />
      )}

      {activePage !== "dashboard" &&
        activePage !== "pending-mentors" &&
        activePage !== "all-mentors" &&
        activePage !== "community-reports" &&
        activePage !== "reported-reviews" &&
        activePage !== "all-reviews" &&
        activePage !== "reviews" &&
        activePage !== "sessions" &&
        activePage !== "payouts" &&
        activePage !== "refunds" && (
          <p style={{ color: "#8a7a6a" }}>
            {PAGE_META[activePage]?.title} page — agla step mein banega.
          </p>
        )}
    </AdminLayout>
  );
}