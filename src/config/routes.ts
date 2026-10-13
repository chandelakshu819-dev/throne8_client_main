// src/config/routes.ts
export const routes = {
  home: "/",
  feed: "/feed",
  profile: (userId: string) => `/profile/${userId}`,
  connections: (userId: string, tab: "connections" | "followers" | "following" = "connections") =>
    `/network/connections?userId=${userId}&tab=${tab}`,
  message: (userId: string) => `/message/${userId}`,
  mentorCard: (mentorName: string, mentorId: string) =>
    `/mentorship/mentor-card/${encodeURIComponent(
      (mentorName || "mentor").trim().toLowerCase().replace(/\s+/g, "-")
    )}/${mentorId}`,
  mentorEditProfile: (userId: string) => `/mentorship/mentorProfile/${userId}`,
  login: "/login",
  signup: "/signup",

  // ── Mentorship workspace routes ──────────────────────────────────────────────

  /** Mentee dashboard */
  menteeDashboard: (userId: string) => `/mentorship/user-dashboard/${userId}`,

    /**
   * Dashboard for the `seniorMentor` role key (Mentor collection, "Become Mentor" flow).
   * NOTE: /mentorship/[userid] is the landing page, NOT the dashboard.
   */
    seniorMentorDashboard: (userId: string) => `/mentorship/mentorProfile/${userId}`,


  /**
   * Industry Mentor dashboard — /mentorship/senior-mentor-profile/[userId].
   * Backed by SeniorMentorApplication ("Become Senior Mentor" flow).
   */
  industryMentorDashboard: (userId: string) => `/mentorship/senior-mentor-profile/${userId}`,

  /** Navigate to the landing page; ?openMentorForm=true auto-opens BecomeMentorModal */
  applySeniorMentor: (userId: string) => `/mentorship/${userId}?openMentorForm=true`,

  /** Apply as Industry Mentor */
  applyIndustryMentor: "/mentorship/senior-mentor-application",

  // ── Kept for backward-compat (aliased) ───────────────────────────────────────
  /** @deprecated use seniorMentorDashboard */
  studentMentorDashboard: (userId: string) => `/mentorship/mentorProfile/${userId}`,
  /** @deprecated use applySeniorMentor */
  applyStudentMentor: (userId: string) => `/mentorship/${userId}?openMentorForm=true`,
} as const;