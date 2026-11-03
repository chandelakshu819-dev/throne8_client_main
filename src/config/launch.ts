/**
 * src/config/launch.ts
 * Launch mode config. NEXT_PUBLIC_LAUNCH_MODE=mentorship => sirf Auth + Mentorship + Profile + Notifications.
 * Value build time pe inline hoti hai, change ke baad Vercel redeploy zaroori hai.
 */

export type FeatureKey =
  | "mentorship"
  | "profile"
  | "notifications"
  | "dashboard"
  | "network"
  | "messaging"
  | "jobs"
  | "study"
  | "company"
  | "resume";

const MODE =
  process.env.NEXT_PUBLIC_LAUNCH_MODE === "mentorship" ? "mentorship" : "full";

export const LAUNCH_MODE = MODE;
export const IS_MENTORSHIP_MODE = MODE === "mentorship";

// Study Group ko mentorship mode me alag se ON karne ka flag.
// NEXT_PUBLIC_ENABLE_STUDY_GROUP=true => mentorship mode me bhi Study nav + routes khul jate hain.
// Backend me ENABLE_STUDY_GROUP=true bhi hona chahiye. Full mode me ye flag zaroori nahi.
export const IS_STUDY_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_STUDY_GROUP === "true";

// Login ke baad user kahan jaye
export const HOME_PATH = IS_MENTORSHIP_MODE ? "/mentorship" : "/dashboard";

const MENTORSHIP_MODE_FEATURES: ReadonlySet<FeatureKey> = new Set<FeatureKey>([
  "mentorship",
  "resume",
  "profile",
  "notifications",
]);

/** Navbar/sidebar links filter karne ke liye: isFeatureEnabled('jobs') */
export function isFeatureEnabled(feature: FeatureKey): boolean {
  if (feature === "study" && IS_STUDY_ENABLED) return true;
  return !IS_MENTORSHIP_MODE || MENTORSHIP_MODE_FEATURES.has(feature);
}

// Mentorship mode me sirf ye paths allowed hain (baaki sab redirect)
const ALLOWED_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-my-password",
  "/auth",
  "/onboarding",
  "/mentorship",
  "/profile",
  "/notifications",
  "/api",
];

// Study Group routes: sirf IS_STUDY_ENABLED hone par allowed
// ((studyGroup) route group URL me nahi aata: /study/* aur /student-dashboard)
const STUDY_PREFIXES = ["/study", "/student-dashboard"];

// Allowed prefix ke andar bhi ye sub-paths band hain
const BLOCKED_PREFIXES = [
  "/profile/network",
  "/profile/saved-posts",
  "/profile/hidden-posts",
  "/profile/analytics",
];

const matches = (pathname: string, prefix: string): boolean =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export function isPathAllowedInLaunchMode(pathname: string): boolean {
  if (!IS_MENTORSHIP_MODE) return true;
  if (pathname === "/") return true;
  if (BLOCKED_PREFIXES.some((p) => matches(pathname, p))) return false;
  if (IS_STUDY_ENABLED && STUDY_PREFIXES.some((p) => matches(pathname, p))) {
    return true;
  }
  return ALLOWED_PREFIXES.some((p) => matches(pathname, p));
}
