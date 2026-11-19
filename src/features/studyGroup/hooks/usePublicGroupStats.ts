import { useEffect, useState } from 'react';
import StudyGroupService, { PublicGroupStats } from '@/lib/api/studyGroup.service';

// The header and the bottom section of the Groups page both need these numbers:
// share one request (and keep it for a minute) instead of asking twice.
const TTL_MS = 60_000;
let cache: { at: number; promise: Promise<PublicGroupStats> } | null = null;

const load = (): Promise<PublicGroupStats> => {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.promise;
  const promise = StudyGroupService.getPublicStats();
  cache = { at: Date.now(), promise };
  promise.catch(() => {
    if (cache?.promise === promise) cache = null; // allow a retry next time
  });
  return promise;
};

/** Exact while small ("12"), compact once large ("1.2K+"); "—" until loaded. */
export const formatStat = (n?: number): string => {
  if (n === undefined) return '—';
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${Math.floor(n / 100) / 10}K+`;
  return `${Math.floor(n / 100_000) / 10}M+`;
};

/** Real aggregate numbers for the Groups page; null while loading or if the request failed. */
export function usePublicGroupStats(): PublicGroupStats | null {
  const [stats, setStats] = useState<PublicGroupStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    load()
      .then((s) => { if (!cancelled) setStats(s); })
      .catch(() => { /* keep the placeholders */ });
    return () => { cancelled = true; };
  }, []);

  return stats;
}
