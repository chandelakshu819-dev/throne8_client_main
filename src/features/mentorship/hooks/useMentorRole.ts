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

const DEFAULT_ROLES: MyRolesResponse = {
  mentee: "approved",
  seniorMentor: "none",
  industryMentor: "none",
};

/**
 * FIX: /mentorship/mentors/me/roles can fail or return "none" even when the
 * user already has a Mentor profile. In that case, double-check using the
 * Mentor-by-userId endpoint (the same one the mentor dashboard uses).
 * If a Mentor doc exists, treat the `seniorMentor` role (shown as
 * "Industry Mentor") as approved so the dropdown opens the dashboard
 * instead of the "Become a Mentor" form.
 */
async function reconcileWithMentorDoc(
  base: MyRolesResponse,
  userId?: string
): Promise<MyRolesResponse> {
  if (!userId || base.seniorMentor === "approved") return base;
  try {
    const res: any = await MentorService.getMentorByUserId(userId);
    const mentor = res?.data ?? null;
    if (!mentor) return base;

    const raw = String(
      mentor.verificationStatus ?? mentor.status ?? mentor.approvalStatus ?? ""
    ).toLowerCase();

    let status: RoleStatus = "approved";
    if (raw.includes("pending") || raw.includes("review")) status = "pending";
    else if (raw.includes("reject")) status = "rejected";

    return {
      ...base,
      seniorMentor: status,
      seniorMentorId: base.seniorMentorId ?? mentor.mentorId ?? mentor._id,
    };
  } catch {
    // 404 = really not a mentor; any other error -> keep the backend value
    return base;
  }
}

/**
 * useMyRoles — fetches the current user's workspace role statuses and shares
 * them via MentorService's module-level cache.
 *
 * Pass `userId` so the hook can verify the Mentor profile as a fallback
 * (see reconcileWithMentorDoc above).
 *
 * Keys returned: mentee | seniorMentor | industryMentor
 * Re-fetches when auth state or userId changes. Call `refetch()` manually
 * after a successful application submit.
 */
export function useMyRoles(
  isAuthenticated: boolean,
  userId?: string
): UseMyRolesResult {
  const [roles, setRoles] = useState<MyRolesResponse | null>(null);
  const [loading, setLoading] = useState(isAuthenticated);
  const [error, setError] = useState<string | null>(null);
  const keyRef = useRef<string>("");

  const load = useCallback(
    async (isCancelled: () => boolean = () => false) => {
      setLoading(true);
      let base: MyRolesResponse = DEFAULT_ROLES;
      let errMsg: string | null = null;

      try {
        base = await MentorService.getMyRoles();
      } catch (err: any) {
        errMsg = err?.message ?? "Failed to fetch roles";
        base = DEFAULT_ROLES;
      }

      const finalRoles = await reconcileWithMentorDoc(base, userId);

      if (isCancelled()) return;
      setRoles(finalRoles);
      // If the mentor doc check rescued us, don't surface the roles error.
      setError(finalRoles.seniorMentor !== "none" ? null : errMsg);
      setLoading(false);
    },
    [userId]
  );

  /** Force a fresh network fetch (ignores module-level cache). */
  const refetch = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    MentorService.invalidateRolesCache();
    await load();
  }, [isAuthenticated, load]);

  useEffect(() => {
    if (!isAuthenticated) {
      // Logged out — clear everything
      setRoles(null);
      setLoading(false);
      keyRef.current = "";
      MentorService.invalidateRolesCache();
      return;
    }

    // Only (re)fetch when auth state or userId actually changed
    const key = `auth:${userId ?? ""}`;
    if (keyRef.current === key) return;
    keyRef.current = key;

    let cancelled = false;
    load(() => cancelled);
    return () => {
      cancelled = true;
      keyRef.current = ""; // lets StrictMode's 2nd effect run re-fetch
    };
  }, [isAuthenticated, userId, load]);

  return { roles, loading, error, refetch };
}