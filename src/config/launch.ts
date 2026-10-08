/**
 * src/config/launch.ts
 * NEXT_PUBLIC_LAUNCH_MODE=mentorship => sirf Auth + Mentorship.
 * Value build time pe inline hoti hai, change ke baad dev server restart / redeploy zaroori hai.
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
  '/api',
];

const matches = (pathname: string, prefix: string): boolean =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export function isPathAllowedInLaunchMode(pathname: string): boolean {
  if (!IS_MENTORSHIP_MODE) return true;
  if (pathname === '/') return true;
  return ALLOWED_PREFIXES.some((p) => matches(pathname, p));
}