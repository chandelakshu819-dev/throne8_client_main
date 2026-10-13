"use client";
// src/features/mentorship/hooks/useMentorRole.ts
import { useEffect, useState, useCallback, useRef } from "react";
import MentorService, { MyRolesResponse, RoleStatus } from "@/lib/api/mentorship.service";

// ── Legacy types (backward-compat with MentorshipDashboardRouter) ─────────────
export type MentorshipRole = "mentee" | "mentor";

interface UseMentorRoleResult {
  isMentor: boolean;
  mentorData: any;
  loading: boolean;
  refetch: () => void;
}

/** LEGACY — kept so existing callers (MentorshipDashboardRouter) don't break. */
export function useMentorRole(userId: string): UseMentorRoleResult {
  const [mentorData, setMentorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchMentor = useCallback(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    MentorService.getMentorByUserId(userId)
      .then((res) => setMentorData(res?.data || null))
      .catch(() => setMentorData(null))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => { fetchMentor(); }, [fetchMentor]);

  return { isMentor: !!mentorData, mentorData, loading, refetch: fetchMentor };
}

// ── New types re-exported from service ───────────────────────────────────────
export type { RoleStatus, MyRolesResponse };

export interface UseMyRolesResult {
  roles: MyRolesResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// UNLOCK_WHEN_PENDING — single flag: set true if pending users should also
// be able to navigate to the dashboard (currently false = disabled/greyed)
export const UNLOCK_WHEN_PENDING = false;

/**
 * useMyRoles — fetches the current user's workspace role statuses once and
 * caches the result at the module level (via MentorService._rolesCache) so
 * every component (navbar, dashboard router, role guard) shares the same data.
 *
 * Keys returned: mentee | seniorMentor | industryMentor
 * (renamed from the old "studentMentor" key)
 *
 * Re-fetches automatically when isAuthenticated flips (login/logout).
 * Call `refetch()` manually after a successful application submit.
 */
export function useMyRoles(isAuthenticated: boolean): UseMyRolesResult {
  const [roles, setRoles] = useState<MyRolesResponse | null>(null);
  const [loading, setLoading] = useState(isAuthenticated);
  const [error, setError] = useState<string | null>(null);
  const prevAuthRef = useRef<boolean>(isAuthenticated);
  const fetchedRef = useRef(false);

  /** Force a fresh network fetch (ignores module-level cache). */
  const refetch = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    MentorService.invalidateRolesCache();
    setLoading(true);
    setError(null);
    try {
      const data = await MentorService.getMyRoles();
      setRoles(data);
    } catch (err: any) {
      setError(err?.message ?? "Failed to fetch roles");
      setRoles({ mentee: "approved", seniorMentor: "none", industryMentor: "none" });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Re-fetch on auth state change (login/logout)
    const authChanged = prevAuthRef.current !== isAuthenticated;
    prevAuthRef.current = isAuthenticated;

    if (!isAuthenticated) {
      // Logged out — clear everything
      setRoles(null);
      setLoading(false);
      fetchedRef.current = false;
      MentorService.invalidateRolesCache();
      return;
    }

    // First mount or after login
    if (fetchedRef.current && !authChanged) return; // already fetched, use cache
    fetchedRef.current = true;

    setLoading(true);
    MentorService.getMyRoles()
      .then((data) => { setRoles(data); setError(null); })
      .catch((err: any) => {
        setError(err?.message ?? "Failed to fetch roles");
        setRoles({ mentee: "approved", seniorMentor: "none", industryMentor: "none" });
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  return { roles, loading, error, refetch };
}