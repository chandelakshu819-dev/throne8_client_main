// src/config/routes.ts
export const routes = {
  home: "/",
  feed: "/feed",
  profile: (userId: string) => `/profile/${userId}`,
  connections: (userId: string, tab: "connections" | "followers" | "following" = "connections") =>
    `/network/connections?userId=${userId}&tab=${tab}`,
  message: (userId: string) => `/message/${userId}`,
  login: "/login",
  signup: "/signup",
} as const;