/**
 * src/config/launch.ts
 * Launch mode config. NEXT_PUBLIC_LAUNCH_MODE=mentorship => sirf Auth + Mentorship + Profile + Notifications.
 * Value build time pe inline hoti hai, change ke baad Vercel redeploy zaroori hai.
 */

export type FeatureKey =
  | 'mentorship'
  | 'profile'
  | 'notifications'
  | 'dashboard'
  | 'network'
  | 'messaging'
  | 'jobs'
  | 'study'
  | 'company';

const MODE =
  process.env.NEXT_PUBLIC_LAUNCH_MODE === 'mentorship' ? 'mentorship' : 'full';

export const LAUNCH_MODE = MODE;
export const IS_MENTORSHIP_MODE = MODE === 'mentorship';

// Login ke baad user kahan jaye
export const HOME_PATH = IS_MENTORSHIP_MODE ? '/mentorship' : '/dashboard';

const MENTORSHIP_MODE_FEATURES: ReadonlySet<FeatureKey> = new Set<FeatureKey>([
  'mentorship',
  'profile',
  'notifications',
]);

/** Navbar/sidebar links filter karne ke liye: isFeatureEnabled('jobs') */
export function isFeatureEnabled(feature: FeatureKey): boolean {
  return !IS_MENTORSHIP_MODE || MENTORSHIP_MODE_FEATURES.has(feature);
}

// Mentorship mode me sirf ye paths allowed hain (baaki sab redirect)
const ALLOWED_PREFIXES = [
  '/login',
  '/signup',
  '/forgot-my-password',
  '/auth',
  '/onboarding',
  '/mentorship',
  '/profile',
  '/notifications',
  '/api',
];

// Allowed prefix ke andar bhi ye sub-paths band hain
const BLOCKED_PREFIXES = [
  '/profile/network',
  '/profile/saved-posts',
  '/profile/hidden-posts',
  '/profile/analytics',
];

const matches = (pathname: string, prefix: string): boolean =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export function isPathAllowedInLaunchMode(pathname: string): boolean {
  if (!IS_MENTORSHIP_MODE) return true;
  if (pathname === '/') return true;
  if (BLOCKED_PREFIXES.some((p) => matches(pathname, p))) return false;
  return ALLOWED_PREFIXES.some((p) => matches(pathname, p));
}