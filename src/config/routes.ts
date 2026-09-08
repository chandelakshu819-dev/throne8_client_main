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
  login: "/login",
  signup: "/signup",
} as const;