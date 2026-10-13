// src/features/mentorship/constants/roleVisibility.ts
//
// Single source of truth for which workspace options are visible in the
// "Switch Workspace" dropdown (ProfileDropdown).
//
// VISIBILITY TABLE
// ---------------------------------------------------------------------------
// | Approved roles (from API)           | Options shown                       |
// |-------------------------------------|-------------------------------------|
// | Only mentee (no approved mentoring) | Mentee + Senior Mentor(L) + Ind(L)  |
// | Approved Senior Mentor only         | Mentee + Senior Mentor               |
// | Approved Industry Mentor only       | Mentee + Industry Mentor             |
// | Both approved                       | Mentee + Senior Mentor + Industry    |
// ---------------------------------------------------------------------------
// "pending" does NOT count as approved for visibility purposes.
// The user's currently-active role (from usePathname) is always included so
// the trigger label never contradicts the visible options.
//
// NOTE: The frontend uses the alias `seniorMentor` as the FrontendRoleKey
// for the API field `seniorMentor` (Mentor collection).
// Display label is "Senior Mentor". No backend changes are needed.

import { MyRolesResponse, RoleStatus } from "@/lib/api/mentorship.service";

// -- Frontend role key -------------------------------------------------------
export type FrontendRoleKey = "mentee" | "seniorMentor" | "industryMentor";

// -- A single entry in the resolved visible-roles array ----------------------
export interface RoleOption {
  /** Frontend key (collegeMentor = seniorMentor API field) */
  key: FrontendRoleKey;
  /** User-facing display label */
  label: string;
  /** Short description shown under the label */
  subLabel: string;
  /** Resolved status from the API */
  status: RoleStatus;
}

// -- Config: display labels & descriptions (change here to update everywhere) -
export const ROLE_CONFIG: Record<
  FrontendRoleKey,
  { label: string; subLabel: string }
> = {
  mentee: {
    label: "Mentee",
    subLabel: "Learn and get guidance",
  },
  seniorMentor: {
    label: "Senior Mentor",
    subLabel: "Guide your juniors",
  },
  industryMentor: {
    label: "Industry Mentor",
    subLabel: "Share professional experience",
  },
};

// -- Helper: map MyRolesResponse -> flat record of FrontendRoleKey -> RoleStatus
function mapRoles(
  roles: MyRolesResponse
): Record<FrontendRoleKey, RoleStatus> {
  return {
    mentee:         roles.mentee          ?? "approved",
    seniorMentor:   roles.seniorMentor    ?? "none",
    industryMentor: roles.industryMentor  ?? "none",
  };
}

/**
 * getVisibleRoles
 * ---------------
 * Pure function -- no side-effects, unit-testable.
 *
 * Returns the ordered list of RoleOptions that should be rendered in the
 * dropdown, based on the user's approved roles.
 *
 * @param roles          The MyRolesResponse from the API.
 * @param activeRoleKey  Optional: the currently-active role detected from the
 *                       URL. When provided, that role is guaranteed to appear
 *                       in the result even if the visibility rules would hide
 *                       it (edge-case guard so the trigger label is consistent).
 */
export function getVisibleRoles(
  roles: MyRolesResponse,
  activeRoleKey?: FrontendRoleKey
): RoleOption[] {
  const mapped = mapRoles(roles);

  const isSeniorMentorApproved   = mapped.seniorMentor   === "approved";
  const isIndustryMentorApproved = mapped.industryMentor === "approved";

  // Visibility rules (checked independently — no early-exit if/else chain):
  //  • Senior Mentor row is shown when:  it is approved  OR  neither role is approved
  //    (i.e. always shown EXCEPT when Industry is approved but Senior is not)
  //  • Industry Mentor row is shown when: it is approved OR  neither role is approved
  // Equivalently:
  //   show Senior  =  isSeniorApproved  || !isIndustryApproved
  //   show Industry = isIndustryApproved || !isSeniorApproved
  // Both-approved  → both shown   ✓
  // Neither approved → both shown (locked) ✓
  // Only Senior approved → Senior shown, Industry hidden ✓
  // Only Industry approved → Industry shown, Senior hidden ✓

  const showSeniorMentor   = isSeniorMentorApproved   || !isIndustryMentorApproved;
  const showIndustryMentor = isIndustryMentorApproved || !isSeniorMentorApproved;

  // Build the ordered list
  const visible: RoleOption[] = [];

  // Mentee is always first and always visible
  visible.push({
    key: "mentee",
    label: ROLE_CONFIG.mentee.label,
    subLabel: ROLE_CONFIG.mentee.subLabel,
    status: "approved",
  });

  if (showSeniorMentor) {
    visible.push({
      key: "seniorMentor",
      label: ROLE_CONFIG.seniorMentor.label,
      subLabel: ROLE_CONFIG.seniorMentor.subLabel,
      status: mapped.seniorMentor,
    });
  }

  if (showIndustryMentor) {
    visible.push({
      key: "industryMentor",
      label: ROLE_CONFIG.industryMentor.label,
      subLabel: ROLE_CONFIG.industryMentor.subLabel,
      status: mapped.industryMentor,
    });
  }

  // Edge-case guard: the user's current URL may imply a role that the rules
  // would hide (e.g. navigating directly to a dashboard URL for a role that
  // is not approved). Always ensure that role is visible so the trigger
  // label is never contradicted by the dropdown contents.
  if (activeRoleKey && activeRoleKey !== "mentee") {
    const alreadyPresent = visible.some((o) => o.key === activeRoleKey);
    if (!alreadyPresent) {
      visible.push({
        key: activeRoleKey,
        label: ROLE_CONFIG[activeRoleKey].label,
        subLabel: ROLE_CONFIG[activeRoleKey].subLabel,
        status: mapped[activeRoleKey],
      });
    }
  }

  return visible;
}
