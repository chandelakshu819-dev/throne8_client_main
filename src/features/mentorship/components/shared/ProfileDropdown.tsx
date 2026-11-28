"use client";
// src/features/mentorship/components/shared/ProfileDropdown.tsx
//
// "Switch Workspace" dropdown in the mentorship navbar.
// Roles (display order): Mentee / College Mentor (industryMentor key) / Industry Mentor (seniorMentor key)
// Visibility is driven by getVisibleRoles() in constants/roleVisibility.ts.
// Each visible role has: approved (open) | pending (under review) | none/rejected (locked).

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  ChevronDown,
  GraduationCap,
  Users,
  Briefcase,
  Check,
  LogIn,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { useMyRoles, UNLOCK_WHEN_PENDING, type MyRolesResponse } from "@/features/mentorship/hooks/useMentorRole";
import { preloadMentorshipDashboards } from "@/features/mentorship/components/MentorshipDashboardRouter";
import { routes } from "@/config/routes";
import MentorService from "@/lib/api/mentorship.service";
import {
  FrontendRoleKey,
  RoleOption,
  getVisibleRoles,
} from "@/features/mentorship/constants/roleVisibility";

// ── Colours ──────────────────────────────────────────────────────────────────
const BROWN_DARK  = "#3b2417";
const BROWN_MID   = "#4a2f1f";
const BROWN_LIGHT = "#9a7b5f";
const CREAM       = "#f7efe6";
const CREAM_DARK  = "#f3e4d3";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ProfileDropdownProps {
  user: {
    userId?: string;
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    [key: string]: any;
  } | null;
  isAuthenticated: boolean;
  profileImageUrl?: string | null;
  fullName?: string;
  onOpenBecomeMentorModal?: () => void;
  // Sign Out dropdown ke andar dikhana ho to pass karo (nahi diya to row nahi dikhegi)
  onSignOut?: () => void;
  isLoggingOut?: boolean;
}

// WorkspaceKey matches FrontendRoleKey from roleVisibility.ts
type WorkspaceKey = FrontendRoleKey;

// Internal extension of RoleOption: adds icon + href helpers for navigation.
interface WorkspaceOption extends RoleOption {
  Icon: LucideIcon;
  dashboardHref: (userId: string) => string;
  applyHref: (userId: string) => string;
}

// ── Static lookups (component ke bahar: har render pe re-create nahi honge) ──
const ROLE_ICONS: Record<WorkspaceKey, LucideIcon> = {
  mentee:         GraduationCap,
  seniorMentor:   Briefcase,
  industryMentor: Users,
};

const ROLE_DASHBOARD_HREF: Record<WorkspaceKey, (uid: string) => string> = {
  mentee:         (uid) => routes.menteeDashboard(uid),
  seniorMentor:   (uid) => routes.seniorMentorDashboard(uid),
  industryMentor: (uid) => routes.industryMentorDashboard(uid),
};

const ROLE_APPLY_HREF: Record<WorkspaceKey, (uid: string) => string> = {
  mentee:         (uid)  => routes.menteeDashboard(uid),
  seniorMentor:   (uid)  => routes.applySeniorMentor(uid),
  industryMentor: (_uid) => routes.applyIndustryMentor,
};

const FALLBACK_ROLES: MyRolesResponse = {
  mentee: "approved",
  seniorMentor: "none",
  industryMentor: "none",
};

/**
 * Detect the active workspace from the URL. Returns null on any page that is
 * not a role-specific dashboard (landing page, services, etc.) so the caller
 * can fall back to the highest approved role.
 */
function detectActiveRole(pathname: string): WorkspaceKey | null {
  if (!pathname) return null;
  if (pathname.startsWith("/mentorship/user-dashboard")) return "mentee";
  if (pathname.startsWith("/mentorship/mentorProfile")) return "seniorMentor";
  if (pathname.startsWith("/mentorship/senior-mentor-profile")) return "industryMentor";
  return null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function TriggerSkeleton() {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 animate-pulse">
      <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: CREAM_DARK }} />
      <div className="hidden sm:block w-16 h-3 rounded" style={{ background: CREAM_DARK }} />
    </div>
  );
}

function InitialsAvatar({ name, size = 32 }: { name?: string; size?: number }) {
  const initials = name
    ? name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")
    : "?";
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 select-none"
      style={{ width: size, height: size, background: BROWN_MID, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ProfileDropdown({
  user,
  isAuthenticated,
  profileImageUrl,
  fullName,
  onOpenBecomeMentorModal,
  onSignOut,
  isLoggingOut = false,
}: ProfileDropdownProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const [open, setOpen]   = useState(false);
  const containerRef      = useRef<HTMLDivElement>(null);
  const warmedRef         = useRef<Set<string>>(new Set());

  const userId = user?.userId || user?.id || user?._id || "";

  // userId pass karo taaki /me/roles fail ho to bhi Mentor profile se role verify ho sake.
  // Cache (module-level) ki wajah se remount pe turant roles milte hain.
  const { roles, loading: rolesLoading } = useMyRoles(isAuthenticated, userId);

  // Clicked role par tick turant shift ho, page load hone ka wait na kare
  const [pendingRole, setPendingRole] = useState<WorkspaceKey | null>(null);
  useEffect(() => { setPendingRole(null); }, [pathname]);
  const detectedRole: WorkspaceKey | null = detectActiveRole(pathname ?? "");

  // Role implied by the current URL. On non-dashboard pages (landing, etc.)
  // there is NO active role, so no tick is shown by default.
  const routeRole: WorkspaceKey | null = (() => {
    if (detectedRole === null) return null;
    if (detectedRole === "seniorMentor"   && roles?.seniorMentor   === "approved") return "seniorMentor";
    if (detectedRole === "industryMentor" && roles?.industryMentor === "approved") return "industryMentor";
    return "mentee";
  })();

  // pendingRole makes the tick move instantly on click, before the page loads
  const activeRole: WorkspaceKey | null = pendingRole ?? routeRole;

  const firstName =
    user?.firstName ||
    (fullName ? fullName.split(" ")[0] : null) ||
    user?.email?.split("@")[0] ||
    "You";

  // ── Visible options (driven by getVisibleRoles) ───────────────────────────
  const baseRoles: MyRolesResponse = roles ?? FALLBACK_ROLES;

  const visibleRoleOptions = getVisibleRoles(
    baseRoles,
    activeRole && activeRole !== "mentee" ? activeRole : undefined
  );

  const workspaceOptions: WorkspaceOption[] = visibleRoleOptions.map((opt) => ({
    ...opt,
    Icon:          ROLE_ICONS[opt.key],
    dashboardHref: ROLE_DASHBOARD_HREF[opt.key],
    applyHref:     ROLE_APPLY_HREF[opt.key],
  }));

  // Falls back to the first option (Mentee) for the header label only; no tick is shown in that case.
  const activeOption = workspaceOptions.find((o) => o.key === activeRole) ?? workspaceOptions[0];

  // ── Warm-up: dashboard JS chunks + route prefetch ─────────────────────────
  // Click se pehle hi sab ready, taaki click pe switch instant lage.
  const warmTargets = () => {
    if (!userId) return;
    preloadMentorshipDashboards();
    workspaceOptions.forEach((opt) => {
      if (opt.key === "mentee" || opt.status === "approved") {
        const href = opt.dashboardHref(userId);
        if (!warmedRef.current.has(href)) {
          warmedRef.current.add(href);
          router.prefetch(href);
        }
      }
    });
  };

  // Roles aate hi idle time me prefetch (user ke click karne ka wait nahi)
  useEffect(() => {
    if (!isAuthenticated || !userId || !roles) return;
    const w = window as any;
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(warmTargets, { timeout: 2000 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = setTimeout(warmTargets, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, userId, roles]);

  // ── Outside click + Escape ────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  // ── Click handler ─────────────────────────────────────────────────────────
  const handleOptionClick = useCallback(
    (opt: WorkspaceOption) => {
      if (!userId) return;
      setOpen(false);

      const isApproved = opt.status === "approved";
      const isPending  = opt.status === "pending";

      // Fast path: koi await nahi, tick turant shift, seedha navigate
      if (opt.key === "mentee" || isApproved || (isPending && UNLOCK_WHEN_PENDING)) {
        const target = opt.dashboardHref(userId);
        if (pathname !== target) {
          setPendingRole(opt.key);
          router.push(target);
        }
        return;
      }

      // Locked (none / rejected) -> apply flow
      const isLocked = !isApproved && !isPending;
      if (isLocked) {
        // Safety check: agar user ka Mentor profile already hai to form mat kholo,
        // seedha dashboard par bhejo (roles API galat/late ho tab bhi).
        if (opt.key === "seniorMentor") {
          MentorService.getMentorByUserId(userId)
            .then((res) => {
              if (res?.data) {
                setPendingRole("seniorMentor");
                router.push(opt.dashboardHref(userId));
              } else if (onOpenBecomeMentorModal) {
                onOpenBecomeMentorModal();
              } else {
                router.push(opt.applyHref(userId));
              }
            })
            .catch(() => {
              // 404 = sach mein mentor nahi hai -> form kholo
              if (onOpenBecomeMentorModal) onOpenBecomeMentorModal();
              else router.push(opt.applyHref(userId));
            });
          return;
        }
        router.push(opt.applyHref(userId));
      }
      // isPending && UNLOCK_WHEN_PENDING=false -> disabled, do nothing
    },
    [userId, router, pathname, onOpenBecomeMentorModal]
  );

  // ── Unauthenticated ───────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <button
        onClick={() => router.push(routes.login)}
        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[1.5px] shadow-md transition-all shrink-0"
        style={{ background: BROWN_MID, color: "white" }}
      >
        <LogIn className="w-3.5 h-3.5" />
        Login
      </button>
    );
  }

  // Skeleton sirf tab jab cache me bhi kuch nahi (pehli baar load)
  if (rolesLoading && !roles) return <TriggerSkeleton />;

  return (
    <div className="relative" ref={containerRef}>
      {/* ── Trigger ────────────────────────────────────────────────────────── */}
      <button
        id="profile-dropdown-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="profile-dropdown-panel"
        onClick={() => {
          if (!open) warmTargets();
          setOpen((p) => !p);
        }}
        onMouseEnter={warmTargets}
        onFocus={warmTargets}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-full transition-all focus:outline-none focus-visible:ring-2"
        style={{ background: open ? CREAM_DARK : "transparent", color: BROWN_DARK }}
      >
        {profileImageUrl ? (
          <img
            src={profileImageUrl}
            alt={fullName ?? "Profile"}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0 border-2"
            style={{ borderColor: BROWN_MID }}
          />
        ) : (
          <InitialsAvatar name={fullName ?? firstName} size={32} />
        )}

        <div className="hidden sm:flex flex-col items-start leading-tight">
          <span className="text-[11px] font-bold" style={{ color: BROWN_DARK }}>
            {firstName}
          </span>
          <span className="text-[9px] font-medium" style={{ color: BROWN_LIGHT }}>
            {activeOption.label}
          </span>
        </div>

        <ChevronDown
          size={14}
          className="shrink-0 transition-transform duration-200"
          style={{ color: BROWN_LIGHT, transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {/* ── Panel ──────────────────────────────────────────────────────────── */}
      <div
        id="profile-dropdown-panel"
        role="menu"
        aria-label="Switch workspace"
        className="absolute right-0 mt-3 w-72 rounded-2xl bg-white z-50 overflow-hidden"
        style={{
          display: open ? "block" : "none",
          boxShadow: "0 20px 60px -10px rgba(59,36,23,0.18), 0 4px 16px -4px rgba(59,36,23,0.10)",
          border: `1px solid ${CREAM_DARK}`,
          transformOrigin: "top right",
          animation: open ? "profileDropIn 0.18s ease" : undefined,
        }}
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-2" style={{ borderBottom: `1px solid ${CREAM_DARK}` }}>
          <p className="text-[9px] font-black tracking-widest uppercase" style={{ color: BROWN_LIGHT }}>
            Switch Workspace
          </p>
        </div>

        {/* Role rows: only show roles returned by getVisibleRoles() */}
        <ul className="py-2">
          {workspaceOptions.map((opt) => {
            const Icon       = opt.Icon;
            const isActive   = opt.key === activeRole;
            const isApproved = opt.status === "approved";
            const isPending  = opt.status === "pending";
            // Locked = not approved and not pending (none / rejected)
            const isLocked   = !isApproved && !isPending;
            // Only pending rows are non-clickable; locked rows click -> apply flow
            const isDisabled = !userId || (isPending && !UNLOCK_WHEN_PENDING);

            let subText = opt.subLabel;
            if (isLocked)   subText = "Apply now";
            if (isPending)  subText = "Under review";

            return (
              <li key={opt.key} role="none">
                <button
                  role="menuitem"
                  aria-current={isActive ? "true" : undefined}
                  aria-disabled={isDisabled || undefined}
                  onClick={() => !isDisabled && handleOptionClick(opt)}
                  className="flex items-center gap-3 w-full px-5 py-3 text-left transition-colors"
                  style={{
                    cursor:  isDisabled ? "not-allowed" : "pointer",
                    opacity: isDisabled ? 0.6 : 1,
                    minHeight: 56,
                    background: isActive ? CREAM : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isDisabled)
                      (e.currentTarget as HTMLElement).style.background = isActive
                        ? CREAM
                        : "rgba(247,239,230,0.7)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = isActive
                      ? CREAM
                      : "transparent";
                  }}
                >
                  {/* Left icon box */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: isActive ? BROWN_MID : CREAM_DARK }}
                  >
                    <Icon
                      size={17}
                      className="shrink-0"
                      style={{ color: isActive ? "white" : BROWN_LIGHT }}
                    />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold leading-tight" style={{ color: BROWN_DARK }}>
                      {opt.label}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: BROWN_LIGHT }}>
                      {subText}
                    </p>
                  </div>

                  {/* Right indicator: active tick / pending pill / nothing */}
                  <div className="ml-auto flex-shrink-0 w-6 flex items-center justify-center">
                    {isActive ? (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: BROWN_MID }}
                      >
                        <Check
                          className="w-3.5 h-3.5"
                          strokeWidth={3}
                          style={{ color: "white" }}
                        />
                      </div>
                    ) : isPending ? (
                      <span
                        className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                        style={{ background: CREAM_DARK, color: BROWN_LIGHT }}
                      >
                        Under review
                      </span>
                    ) : null}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Sign Out: sabse neeche, divider ke baad */}
        {onSignOut && (
          <div className="py-2" style={{ borderTop: `1px solid ${CREAM_DARK}` }}>
            <button
              role="menuitem"
              onClick={() => {
                if (isLoggingOut) return;
                setOpen(false);
                onSignOut();
              }}
              disabled={isLoggingOut}
              className="flex items-center gap-3 w-full px-5 py-3 text-left transition-colors hover:bg-[#FBEAE6] disabled:cursor-not-allowed disabled:opacity-50"
              style={{ color: "#B4442E" }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "#FBEAE6" }}
              >
                <LogOut size={17} className="shrink-0" />
              </div>
              <span className="text-[13px] font-semibold">
                {isLoggingOut ? "Signing out..." : "Sign Out"}
              </span>
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes profileDropIn {
          from { opacity: 0; transform: scale(0.96) translateY(-6px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>
    </div>
  );
}