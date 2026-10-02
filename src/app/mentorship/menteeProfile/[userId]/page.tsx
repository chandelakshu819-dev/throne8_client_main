"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import TokenStorage from "@/lib/store/token.storage";
import MentorDashboard from "@/features/mentorship/components/dashboard/DashboardLayout";

export default function MenteeProfileUserIdPage() {
  const params = useParams();
  const menteeId = (params?.userId || params?.menteeId) as string;
  const [mentorUserId, setMentorUserId] = useState<string | null>(null);

  useEffect(() => {
    const user = TokenStorage.getUserData();
    if (user?.userId) {
      setMentorUserId(user.userId);
    }
  }, []);

  if (!mentorUserId) {
    return (
      <div className="min-h-screen bg-[#f6ede8] p-8 flex items-center justify-center">
        <div className="bg-white p-6 rounded-2xl border border-[#ece4db] text-center max-w-md shadow-sm">
          <div className="w-8 h-8 rounded-full border-2 border-[#4a3728] border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#4a3728]">
            Loading mentee profile...
          </p>
        </div>
      </div>
    );
  }

  return <MentorDashboard userId={mentorUserId} />;
}
