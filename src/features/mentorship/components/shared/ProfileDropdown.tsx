"use client";
// src/features/mentorship/components/shared/ProfileDropdown.tsx
//
// "Switch Workspace" dropdown in the mentorship navbar.
// Three roles: Mentee / Senior Mentor / Industry Mentor
// Each has: approved (unlocked) | pending (under review) | none/rejected (locked).

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  ChevronDown,
  GraduationCap,
  Users,
  Briefcase,
  CheckCircle,
  Lock,
  Clock,
  LogIn,
} from "lucide-react";
import { useMyRoles, RoleStatus, UNLOCK_WHEN_PENDING } from "@/features/mentorship/hooks/useMentorRole";
import { routes } from "@/config/routes";

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

// WorkspaceKey matches the MY_ROLES response keys (renamed from studentMentor)
type WorkspaceKey = "mentee" | "seniorMentor" | "industryMentor";

interface WorkspaceOption {
  key: WorkspaceKey;
  label: string;
  subLabel: string;
  Icon: React.FC<{ size?: number; className?: string }>;
  status: RoleStatus;
  dashboardHref: (userId: string) => string;
  applyHref: (userId: string) => string;
}

// ── Static segments that exist under /mentorship/ but are NOT userId slugs ───
const MENTORSHIP_STATIC_SEGMENTS = new Set([
  "admin",
  "group-session",
  "group-sessions",
  "mentor-card",
  "mentor-session",
  "mentorProfile",
  "senior-mentor-application",
  "service",
  "services",
  "session-room",
  "user-dashboard",
  "senior-mentor-profile",
]);

/**
 * Detect the active workspace from the current URL — NOT from useState.
 * Falls back to "mentee" for anything that isn't a known role-specific URL.
 *
 * Rules (in priority order):
 *  1. /mentorship/user-dashboard/*         → mentee
 *  2. /mentorship/senior-mentor-profile/*  → industryMentor
 *  3. /mentorship/<segment> where <segment> is NOT a static route
 *     AND looks like a UUID or similar non-word slug  → seniorMentor
 *  4. Everything else                                  → mentee
 */
function detectActiveRole(pathname: string): WorkspaceKey {
  if (!pathname) return "mentee";

  if (pathname.startsWith("/mentorship/user-dashboard")) return "mentee";
  if (pathname.startsWith("/mentorship/senior-mentor-profile")) return "industryMentor";

  // /mentorship/<segment>[/...] — check if <segment> is a static page
  const match = pathname.match(/^\/mentorship\/([^/]+)/);
  if (match) {
    const segment = match[1];
    if (!MENTORSHIP_STATIC_SEGMENTS.has(segment)) {
      // If segment has UUID-like chars (hex + dashes) it's a userId slug
      // UUID: 8-4-4-4-12 pattern, or Mongo ObjectId (24 hex chars)
      const looksLikeId = /^[0-9a-f-]{8,}$/i.test(segment);
      if (looksLikeId) return "seniorMentor";
    }
  }

  return "mentee";
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

  const { roles, loading: rolesLoading } = useMyRoles(isAuthenticated);

  const userId = user?.userId || user?.id || (user as any)?._id || "";
  const detectedRole: WorkspaceKey = detectActiveRole(pathname ?? "");

  // If the detected role isn't approved for this user, fall back to mentee
  const activeRole: WorkspaceKey = (() => {
    if (detectedRole === "mentee") return "mentee";
    if (detectedRole === "seniorMentor"   && roles?.seniorMentor   === "approved") return "seniorMentor";
    if (detectedRole === "industryMentor" && roles?.industryMentor === "approved") return "industryMentor";
    return "mentee";
  })();

  const firstName =
    user?.firstName ||
    (fullName ? fullName.split(" ")[0] : null) ||
    user?.email?.split("@")[0] ||
    "You";

  // ── Workspace options (all three always shown) ───────────────────────────
  const workspaceOptions: WorkspaceOption[] = [
    {
      key: "mentee",
      label: "Mentee",
      subLabel: "Learn and get guidance",
      Icon: GraduationCap,
      status: "approved",
      dashboardHref: (uid) => routes.menteeDashboard(uid),
      applyHref:     (uid) => routes.menteeDashboard(uid),
    },
    {
      key: "seniorMentor",
      label: "Senior Mentor",        // ← renamed from "Student Mentor"
      subLabel: "Guide your juniors",
      Icon: Users,
      status: roles?.seniorMentor ?? "none",
      dashboardHref: (uid) => routes.seniorMentorDashboard(uid),
      applyHref:     (uid) => routes.applySeniorMentor(uid),
    },
    {
      key: "industryMentor",
      label: "Industry Mentor",
      subLabel: "Share professional experience",
      Icon: Briefcase,
      status: roles?.industryMentor ?? "none",
      dashboardHref: (uid) => routes.industryMentorDashboard(uid),
      applyHref:     ()    => routes.applyIndustryMentor,
    },
  ];

  const activeOption = workspaceOptions.find((o) => o.key === activeRole) ?? workspaceOptions[0];
  const ActiveIcon   = activeOption.Icon;

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
      const isLocked   = !isApproved && (!isPending || !UNLOCK_WHEN_PENDING);

      if (opt.key === "mentee" || isApproved || (isPending && UNLOCK_WHEN_PENDING)) {
        router.push(opt.dashboardHref(userId));
        return;
      }

      if (isLocked) {
        // Senior Mentor apply: prefer the modal callback if provided
        if (opt.key === "seniorMentor" && onOpenBecomeMentorModal) {
          onOpenBecomeMentorModal();
        } else {
          router.push(opt.applyHref(userId));
        }
      }
      // pending + UNLOCK_WHEN_PENDING=false → disabled, do nothing
    },
    [userId, router, onOpenBecomeMentorModal]
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

        {/* Role rows — always show all three, never hide */}
        <ul className="py-2">
          {workspaceOptions.map((opt) => {
            const Icon       = opt.Icon;
            const isActive   = opt.key === activeRole;
            const isApproved = opt.status === "approved";
            const isPending  = opt.status === "pending";
            const isLocked   = !isApproved && (!isPending || !UNLOCK_WHEN_PENDING);
            // Pending is disabled when UNLOCK_WHEN_PENDING = false
            const isDisabled = isPending && !UNLOCK_WHEN_PENDING;

            let subText = opt.subLabel;
            if (isPending) subText = "Under review";
            if (isLocked && !isPending) subText = "Apply to unlock";

            return (
              <li key={opt.key} role="none">
                <button
                  role="menuitem"
                  aria-disabled={isDisabled}
                  onClick={() => !isDisabled && handleOptionClick(opt)}
                  className="flex items-center gap-3 w-full px-5 py-3 text-left transition-colors"
                  style={{
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    opacity: isDisabled ? 0.6 : 1,
                    background: isActive ? CREAM : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isDisabled) (e.currentTarget as HTMLElement).style.background = CREAM;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = isActive ? CREAM : "transparent";
                  }}
                >
                  {/* Icon box */}
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

                  {/* Right indicator */}
                  <div className="ml-auto flex-shrink-0">
                    {isActive && isApproved ? (
                      <CheckCircle size={18} style={{ color: BROWN_DARK }} className="fill-current" />
                    ) : isPending ? (
                      <Clock size={15} style={{ color: BROWN_LIGHT }} />
                    ) : isLocked ? (
                      <Lock size={14} style={{ color: BROWN_LIGHT }} />
                    ) : isApproved ? (
                      <ChevronDown size={13} className="-rotate-90" style={{ color: BROWN_LIGHT }} />
                    ) : null}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Footer */}
        <div
          className="px-5 py-3 text-[9px]"
          style={{ borderTop: `1px solid ${CREAM_DARK}`, color: BROWN_LIGHT }}
        >
          Locked roles can be unlocked by applying.
        </div>
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
