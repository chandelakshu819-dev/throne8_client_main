'use client';

import { useEffect, useState } from 'react';
import streakService, { PublicStreakData } from '@/lib/api/streak.service';

export const useStudyStreak = (userId: string | undefined) => {
  const [data, setData] = useState<PublicStreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchStreak = async () => {
      try {
        setLoading(true);
        const result = await streakService.getByUserId(userId);
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to fetch streak');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchStreak();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { data, loading, error };
};