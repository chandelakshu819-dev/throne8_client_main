// "use client";
// //src/
// import { useParams } from "next/navigation";
// import SeniorMentorLayout from "@/features/mentorship/components/senior-mentor/SeniorMentorLayout";

// export default function SeniorMentorLanding() {
//   const params = useParams();
//   const userId = params.userId as string;

//   return <SeniorMentorLayout userId={userId} />;
// }



"use client";
// src/app/mentorship/senior-mentor-profile/[userId]/page.tsx

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import SeniorMentorLayout from "@/features/mentorship/components/senior-mentor/SeniorMentorLayout";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useMyRoles } from "@/features/mentorship/hooks/useMentorRole";

export default function SeniorMentorLanding() {
  const params = useParams();
  const router = useRouter();
  const userId = typeof params?.userId === "string" ? params.userId : "";

  const { isAuthenticated } = useAuth();
  const { roles, loading } = useMyRoles(isAuthenticated);

  const isApproved = roles?.industryMentor === "approved";

  // Role guard: direct URL without an approved Industry Mentor role -> /mentorship
  useEffect(() => {
    if (!isAuthenticated || loading || !roles) return;
    if (!isApproved) router.replace("/mentorship");
  }, [isAuthenticated, loading, roles, isApproved, router]);

  if (!userId || loading || !isApproved) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f6ede8]">
        <span className="text-sm text-[#7a5c3e]">Loading...</span>
      </div>
    );
  }

  return <SeniorMentorLayout userId={userId} />;
}