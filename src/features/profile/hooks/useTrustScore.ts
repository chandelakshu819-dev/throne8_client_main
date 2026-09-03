'use client';

import { useEffect, useState } from 'react';
import trustScoreService, { TrustScoreData } from '@/lib/api/trustScore.service';

export const useTrustScore = (userId: string | undefined) => {
  const [data, setData] = useState<TrustScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchTrustScore = async () => {
      try {
        setLoading(true);
        const result = await trustScoreService.getByUserId(userId);
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to fetch trust score');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTrustScore();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { data, loading, error };
};