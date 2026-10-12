"use client";

import { useParams } from "next/navigation";
import SeniorMentorLayout from "@/features/mentorship/components/senior-mentor/SeniorMentorLayout";

export default function SeniorMentorNotificationsWrapper() {
  const params = useParams();
  const userId = params.userId as string;

  return <SeniorMentorLayout userId={userId} activeTab="notifications" />;
}
