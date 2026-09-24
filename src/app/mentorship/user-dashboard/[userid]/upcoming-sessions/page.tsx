"use client";
// src/app/mentorship/user-dashboard/[userid]/upcoming-sessions/page.tsx
import React from "react";
import { useParams } from "next/navigation";
import MentorshipDashboardRouter from "@/features/mentorship/components/MentorshipDashboardRouter";

export default function UpcomingSessionsRoutePage() {
  const params = useParams();
  const userId = (params?.userid as string) || "";

  return (
    <MentorshipDashboardRouter
      userId={userId}
      initialPage="upcoming-sessions"
    />
  );
}
