"use client";
// src/features/mentorship/components/shared/ProfileDropdown.tsx
//
// "Switch Workspace" dropdown in the mentorship navbar.
// Roles: Mentee / College Mentor (seniorMentor) / Industry Mentor
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
  Lock,
  LogIn,
  type LucideIcon,
} from "lucide-react";
import { useMyRoles, UNLOCK_WHEN_PENDING, type MyRolesResponse } from "@/features/mentorship/hooks/useMentorRole";
import { routes } from "@/config/routes";
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
}

// WorkspaceKey matches FrontendRoleKey from roleVisibility.ts
type WorkspaceKey = FrontendRoleKey;

// Internal extension of RoleOption: adds icon + href helpers for navigation.
interface WorkspaceOption extends RoleOption {
  Icon: LucideIcon;
  dashboardHref: (userId: string) => string;
  applyHref: (userId: string) => string;
}

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
}: ProfileDropdownProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const [open, setOpen]   = useState(false);
  const containerRef      = useRef<HTMLDivElement>(null);

  const { roles, loading: rolesLoading, error: rolesError } = useMyRoles(isAuthenticated);

  const userId = user?.userId || user?.id || user?._id || "";
  const detectedRole: WorkspaceKey | null = detectActiveRole(pathname ?? "");

  // Highest approved role — used for the header label on non-dashboard pages
  const highestApprovedRole: WorkspaceKey = (() => {
    if (roles?.industryMentor === "approved") return "industryMentor";
    if (roles?.seniorMentor   === "approved") return "seniorMentor";
    return "mentee";
  })();

  const activeRole: WorkspaceKey = (() => {
    if (detectedRole === null) return highestApprovedRole;
    if (detectedRole === "seniorMentor"   && roles?.seniorMentor   === "approved") return "seniorMentor";
    if (detectedRole === "industryMentor" && roles?.industryMentor === "approved") return "industryMentor";
    return "mentee";
  })();




  const firstName =
    user?.firstName ||
    (fullName ? fullName.split(" ")[0] : null) ||
    user?.email?.split("@")[0] ||
    "You";

  // ── Icon lookup (keys match FrontendRoleKey) ─────────────────────────────
  const ROLE_ICONS: Record<WorkspaceKey, LucideIcon> = {
    mentee:         GraduationCap,
    seniorMentor:   Users,
    industryMentor: Briefcase,
  };

  // ── Nav-href helpers per role ─────────────────────────────────────────────
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

  // ── Visible options (driven by getVisibleRoles) ───────────────────────────
  // roles may still be null while loading; default to mentee-only structure.
  const baseRoles: MyRolesResponse = roles ?? { mentee: "approved", seniorMentor: "none", industryMentor: "none" };
  // /me/roles failed -> show only Mentee
  const visibleRoleOptions = rolesError
    ? getVisibleRoles(baseRoles).filter((o) => o.key === "mentee")
    : getVisibleRoles(baseRoles, activeRole !== "mentee" ? activeRole : undefined);


  const workspaceOptions: WorkspaceOption[] = visibleRoleOptions.map((opt) => ({
    ...opt,
    Icon:          ROLE_ICONS[opt.key],
    dashboardHref: ROLE_DASHBOARD_HREF[opt.key],
    applyHref:     ROLE_APPLY_HREF[opt.key],
  }));

  const activeOption = workspaceOptions.find((o) => o.key === activeRole) ?? workspaceOptions[0];

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

      if (opt.key === "mentee" || isApproved || (isPending && UNLOCK_WHEN_PENDING)) {
        const target = opt.dashboardHref(userId);
        if (pathname !== target) router.push(target);
        return;
      }

      // Locked (none / rejected) → go to apply flow
      const isLocked = !isApproved && !isPending;
      if (isLocked) {
        if (opt.key === "seniorMentor" && onOpenBecomeMentorModal) {
          onOpenBecomeMentorModal();
        } else {
          router.push(opt.applyHref(userId));
        }
      }
      // isPending && UNLOCK_WHEN_PENDING=false → disabled, do nothing
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

  if (rolesLoading) return <TriggerSkeleton />;

  return (
    <div className="relative" ref={containerRef}>
      {/* ── Trigger ────────────────────────────────────────────────────────── */}
      <button
        id="profile-dropdown-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="profile-dropdown-panel"
        onClick={() => setOpen((p) => !p)}
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

        {/* Role rows — only show roles returned by getVisibleRoles() */}
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
            if (isLocked)   subText = "Apply to unlock";
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
                    // Locked rows stay pointer (they navigate to apply flow)
                    cursor:  isDisabled ? "not-allowed" : "pointer",
                    opacity: isDisabled ? 0.6 : 1,
                    // Fixed min-height so all rows are equal regardless of indicator
                    minHeight: 56,
                    background: isActive ? "#f7efe6" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isDisabled)
                      (e.currentTarget as HTMLElement).style.background = isActive
                        ? "#f7efe6"
                        : "rgba(247,239,230,0.7)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = isActive
                      ? "#f7efe6"
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

                  {/* Right indicator — single rule, one indicator per row:
                      1. Active   → dark circle with white Check
                      2. Locked   → Lock icon (muted)
                      3. Pending  → "Under review" pill
                      4. Other unlocked → nothing
                  */}
                  <div className="ml-auto flex-shrink-0 w-6 flex items-center justify-center">
                    {isActive ? (
                      // Bug 1 fix: use stroke-only Check inside a circle div,
                      // NOT CheckCircle with fill-current (which hides the tick)
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
                    ) : isLocked ? (
                      <Lock size={14} style={{ color: BROWN_LIGHT }} />
                    ) : isPending ? (
                      <span
                        className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                        style={{ background: CREAM_DARK, color: BROWN_LIGHT }}
                      >
                        Under review
                      </span>
                    ) : null /* other approved rows: no indicator */}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Footer — only render when at least one visible option is locked */}
        {workspaceOptions.some(
          (o) => o.status !== "approved" && o.status !== "pending"
        ) && (
          <div
            className="px-5 py-3 text-[9px]"
            style={{ borderTop: `1px solid ${CREAM_DARK}`, color: BROWN_LIGHT }}
          >
            Locked roles can be unlocked by applying.
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
