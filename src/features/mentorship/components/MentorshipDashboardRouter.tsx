"use client";
// src/features/mentorship/components/MentorshipDashboardRouter.tsx
//
// Single entry point for /mentorship/[userid].
// Dashboards are lazy-loaded, but both chunks are preloaded in idle time
// so that switching between Mentee <-> Mentor feels instant.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useMyRoles } from "../hooks/useMentorRole";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { routes } from "@/config/routes";

const loadUserDashboard = () => import("./user-dashboard/UserDashboardLayout");
const loadMentorDashboard = () => import("./dashboard/DashboardLayout");

/** Call this from navbar dropdown (on open / hover) to warm up both chunks. */
export const preloadMentorshipDashboards = () => {
  loadUserDashboard();
  loadMentorDashboard();
};

const FullScreenLoader = () => (
  <div className="flex items-center justify-center h-screen bg-[#f6ede8]">
    <span className="text-sm text-[#7a5c3e]">Loading...</span>
  </div>
);

const UserDashboardLayout = dynamic(loadUserDashboard, {
  loading: () => <FullScreenLoader />,
});

const MentorDashboard = dynamic(loadMentorDashboard, {
  loading: () => <FullScreenLoader />,
});

interface MentorshipDashboardRouterProps {
  userId: string;
  /** Which dashboard to render — validated against the user's actual approval status. */
  defaultRole?: "mentee" | "mentor";
  initialPage?: string;
}

export default function MentorshipDashboardRouter({
  userId,
  defaultRole = "mentee",
  initialPage,
}: MentorshipDashboardRouterProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const { roles, loading } = useMyRoles(isAuthenticated, userId);

  // ── Prefetch: dono routes + dono chunks, page load ke baad idle me ────────
  useEffect(() => {
    if (!userId) return;
    router.prefetch(routes.menteeDashboard(userId));
    router.prefetch(routes.seniorMentorDashboard(userId));

    const warm = () => preloadMentorshipDashboards();
    const w = window as any;
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(warm, { timeout: 2000 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = setTimeout(warm, 800);
    return () => clearTimeout(t);
  }, [userId, router]);

  // ── Role guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading || !roles) return;
    if (defaultRole === "mentor" && roles.seniorMentor !== "approved") {
      router.replace("/mentorship");
    }
  }, [loading, roles, defaultRole, userId, router]);

  const isMentor = roles?.seniorMentor === "approved";

  // ── Mentor URL: cached roles hon to turant render, warna verify tak wait ──
  if (defaultRole === "mentor") {
    if (loading && !roles) return <FullScreenLoader />;
    if (!isMentor) return null; // redirect above is running

    return (
      <MentorDashboard
        userId={userId}
        onSwitchRole={() => router.push(routes.menteeDashboard(userId))}
      />
    );
  }

  // ── Mentee URL: render immediately ────────────────────────────────────────
  return (
    <UserDashboardLayout
      userId={userId}
      isMentor={isMentor}
      onSwitchRole={() => router.push(routes.seniorMentorDashboard(userId))}
      initialPage={initialPage}
    />
  );
}