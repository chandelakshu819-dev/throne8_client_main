"use client";
// src/features/mentorship/hooks/useMentorRole.ts
import { useEffect, useState, useCallback } from "react";
import MentorService from "@/lib/api/mentorship.service";

export type MentorshipRole = "mentee" | "mentor";

interface UseMentorRoleResult {
  isMentor: boolean;
  mentorData: any;
  loading: boolean;
  refetch: () => void;
}

/**
 * Checks whether the given userId also has a mentor profile.
 * Same API call already used inside DashboardLayout.tsx
 * (MentorService.getMentorByUserId) — reused here so the mentee
 * dashboard can know, before rendering, whether to show the
 * role switcher at all.
 */
export function useMentorRole(userId: string): UseMentorRoleResult {
  const [mentorData, setMentorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchMentor = useCallback(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    MentorService.getMentorByUserId(userId)
      .then((res) => setMentorData(res?.data || null))
      .catch(() => setMentorData(null))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    fetchMentor();
  }, [fetchMentor]);

  return {
    isMentor: !!mentorData,
    mentorData,
    loading,
    refetch: fetchMentor,
  };
}