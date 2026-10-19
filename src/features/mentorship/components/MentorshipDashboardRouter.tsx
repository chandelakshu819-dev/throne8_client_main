"use client";
// src/features/mentorship/components/MentorshipDashboardRouter.tsx
//
// Single entry point for /mentorship/[userid].
// Now uses useMyRoles() instead of a plain isMentor boolean so that:
//   1. Users who haven't been approved as a Student Mentor are
//      redirected to the "apply" flow instead of seeing the dashboard.
//   2. The "switch role" mechanism is URL-driven (via ProfileDropdown)
//      rather than managed by a useState inside this file.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import UserDashboardLayout from "./user-dashboard/UserDashboardLayout";
import MentorDashboard from "./dashboard/DashboardLayout";
import { useMyRoles } from "../hooks/useMentorRole";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { routes } from "@/config/routes";

interface MentorshipDashboardRouterProps {
  userId: string;
  /** Which dashboard to render — still accepted for backward compat,
   *  but now validated against the user's actual approval status. */
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

  // FIX: pass userId so useMyRoles can verify the Mentor profile when
  // /me/roles fails or returns "none". Without it, seniorMentor stayed "none",
  // the guard below redirected to /mentorship, and /mentorship redirected
  // straight back here -> infinite redirect loop.
  const { roles, loading } = useMyRoles(isAuthenticated, userId);

  // ── Role guard ────────────────────────────────────────────────────────────
  // If someone navigates to the Mentor dashboard but they're not approved,
  // send them back to the landing page.
  useEffect(() => {
    if (loading || !roles) return;
    if (defaultRole === "mentor" && roles.seniorMentor !== "approved") {
      router.replace("/mentorship");
    }
  }, [loading, roles, defaultRole, userId, router]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f6ede8]">
        <span className="text-sm text-[#7a5c3e]">Loading...</span>
      </div>
    );
  }

  // ── Render correct dashboard ──────────────────────────────────────────────
  const isMentor = roles?.seniorMentor === "approved";

  // Mentor URL without the role: render nothing while the redirect above runs
  // (avoids flashing the mentee dashboard)
  if (defaultRole === "mentor" && !isMentor) return null;

  if (defaultRole === "mentor" && isMentor) {
    return (
      <MentorDashboard
        userId={userId}
        // Switching back to Mentee is done via the ProfileDropdown in the navbar.
        onSwitchRole={() => router.push(routes.menteeDashboard(userId))}
      />
    );
  }

  return (
    <UserDashboardLayout
      userId={userId}
      isMentor={isMentor}
      onSwitchRole={() => router.push(routes.seniorMentorDashboard(userId))}
      initialPage={initialPage}
    />
  );
}