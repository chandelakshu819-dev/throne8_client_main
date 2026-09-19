"use client";

import { useParams } from "next/navigation";
import MentorshipDashboardRouter from "@/features/mentorship/components/MentorshipDashboardRouter";

export default function MentorLanding() {
  const params = useParams();
  const userId = params.userId as string;

  return <MentorshipDashboardRouter userId={userId} defaultRole="mentor" />;
}
