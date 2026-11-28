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

/** LEGACY — kept so existing callers don't break. */
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

// ── Module-level roles cache (survives route changes / remounts) ─────────────
// Isse mentee <-> mentor switch pe loader nahi dikhta: cached roles turant
// milte hain aur background me silently revalidate hote hain.
const ROLES_TTL_MS = 60_000;
const rolesCache = new Map<string, { roles: MyRolesResponse; at: number }>();

function getCachedRoles(userId?: string) {
  return userId ? rolesCache.get(userId) ?? null : null;
}

export function clearRolesCache() {
  rolesCache.clear();
}

/**
 * /mentorship/mentors/me/roles can fail or return "none" even when the
 * user already has a Mentor profile. In that case, double-check using the
 * Mentor-by-userId endpoint.
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
    return base;
  }
}

/**
 * useMyRoles — stale-while-revalidate:
 *  - cache hai  -> roles turant, loading=false, background me refresh (agar TTL expire)
 *  - cache nahi -> normal fetch with loading=true
 */
export function useMyRoles(
  isAuthenticated: boolean,
  userId?: string
): UseMyRolesResult {
  const initialCached = isAuthenticated ? getCachedRoles(userId) : null;

  const [roles, setRoles] = useState<MyRolesResponse | null>(initialCached?.roles ?? null);
  const [loading, setLoading] = useState(isAuthenticated && !initialCached);
  const [error, setError] = useState<string | null>(null);
  const keyRef = useRef<string>("");

  const load = useCallback(
    async (isCancelled: () => boolean = () => false, silent = false) => {
      if (!silent) setLoading(true);
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

      // Network error pe achha cached value mat bigaado
      if (!(errMsg && silent && userId && rolesCache.has(userId))) {
        if (userId) rolesCache.set(userId, { roles: finalRoles, at: Date.now() });
        setRoles(finalRoles);
        setError(finalRoles.seniorMentor !== "none" ? null : errMsg);
      }
      setLoading(false);
    },
    [userId]
  );

  /** Force a fresh network fetch (ignores cache). */
  const refetch = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    if (userId) rolesCache.delete(userId);
    MentorService.invalidateRolesCache();
    await load();
  }, [isAuthenticated, load, userId]);

  useEffect(() => {
    if (!isAuthenticated) {
      setRoles(null);
      setLoading(false);
      keyRef.current = "";
      clearRolesCache();
      MentorService.invalidateRolesCache();
      return;
    }

    const key = `auth:${userId ?? ""}`;
    if (keyRef.current === key) return;
    keyRef.current = key;

    let cancelled = false;
    const cached = getCachedRoles(userId);

    if (cached) {
      setRoles(cached.roles);
      setLoading(false);
      // Fresh hai to network call hi nahi; stale hai to silent background refresh
      if (Date.now() - cached.at >= ROLES_TTL_MS) {
        load(() => cancelled, true);
      }
    } else {
      load(() => cancelled);
    }

    return () => {
      cancelled = true;
      keyRef.current = ""; // lets StrictMode's 2nd effect run
    };
  }, [isAuthenticated, userId, load]);

  return { roles, loading, error, refetch };
}