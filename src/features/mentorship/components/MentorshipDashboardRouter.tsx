"use client";
// src/features/mentorship/components/MentorshipDashboardRouter.tsx
import { useState } from "react";
import UserDashboardLayout from "./user-dashboard/UserDashboardLayout";
import MentorDashboard from "./dashboard/DashboardLayout";
import { useMentorRole, MentorshipRole } from "../hooks/useMentorRole";

interface MentorshipDashboardRouterProps {
  userId: string;
  defaultRole?: MentorshipRole;
}

/**
 * Single entry point for the mentorship dashboard route.
 * Checks if this user also has a mentor profile — if yes, both
 * dashboards pass down a switch link inside their sidebar profile
 * card ("Switch to Mentor view →" / "Switch to Mentee view →")
 * instead of a floating button.
 */
export default function MentorshipDashboardRouter({
  userId,
  defaultRole = "mentee",
}: MentorshipDashboardRouterProps) {
  const { isMentor, loading } = useMentorRole(userId);
  const [activeRole, setActiveRole] = useState<MentorshipRole>(defaultRole);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f6ede8]">
        <span className="text-sm text-[#7a5c3e]">Loading...</span>
      </div>
    );
  }

  const switchToMentor = () => setActiveRole("mentor");
  const switchToMentee = () => setActiveRole("mentee");

  if (activeRole === "mentor" && isMentor) {
    return <MentorDashboard userId={userId} onSwitchRole={switchToMentee} />;
  }

  return (
    <UserDashboardLayout
      userId={userId}
      isMentor={isMentor}
      onSwitchRole={switchToMentor}
    />
  );
}