"use client";
// src/features/mentorship/components/MentorshipDashboardRouter.tsx
//
// Single entry point for /mentorship/[userid].
// Dashboards are lazy-loaded so only the one being shown is downloaded.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useMyRoles } from "../hooks/useMentorRole";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { routes } from "@/config/routes";

const FullScreenLoader = () => (
  <div className="flex items-center justify-center h-screen bg-[#f6ede8]">
    <span className="text-sm text-[#7a5c3e]">Loading...</span>
  </div>
);

const UserDashboardLayout = dynamic(
  () => import("./user-dashboard/UserDashboardLayout"),
  { loading: () => <FullScreenLoader /> }
);

const MentorDashboard = dynamic(
  () => import("./dashboard/DashboardLayout"),
  { loading: () => <FullScreenLoader /> }
);

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

  // userId is passed so useMyRoles can verify the Mentor profile when
  // /me/roles fails or returns "none" (prevents the redirect loop).
  const { roles, loading } = useMyRoles(isAuthenticated, userId);

  // ── Role guard ────────────────────────────────────────────────────────────
  // Mentor URL but not approved -> back to the landing page.
  useEffect(() => {
    if (loading || !roles) return;
    if (defaultRole === "mentor" && roles.seniorMentor !== "approved") {
      router.replace("/mentorship");
    }
  }, [loading, roles, defaultRole, userId, router]);

  const isMentor = roles?.seniorMentor === "approved";

  // ── Mentor URL: must wait for roles to verify approval ────────────────────
  if (defaultRole === "mentor") {
    if (loading) return <FullScreenLoader />;
    if (!isMentor) return null; // redirect above is running

    return (
      <MentorDashboard
        userId={userId}
        // Switching back to Mentee is done via the ProfileDropdown in the navbar.
        onSwitchRole={() => router.push(routes.menteeDashboard(userId))}
      />
    );
  }

  // ── Mentee URL: render immediately, don't wait for the roles API ──────────
  return (
    <UserDashboardLayout
      userId={userId}
      isMentor={isMentor}
      onSwitchRole={() => router.push(routes.seniorMentorDashboard(userId))}
      initialPage={initialPage}
    />
  );
}