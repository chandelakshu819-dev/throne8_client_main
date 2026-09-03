'use client';

import { useStudyStreak } from '@/features/profile/hooks/useStudyStreak';

interface StudyStreakBadgeProps {
  userId: string;
}

export default function StudyStreakBadge({ userId }: StudyStreakBadgeProps) {
  const { data, loading } = useStudyStreak(userId);

  if (loading || !data || data.currentStreak === 0) {
    return null;
  }

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium"
      style={{ backgroundColor: '#f6ede8', color: '#4a3728', border: '1px solid #e0d8cf' }}
      title={`Longest streak: ${data.longestStreak} days`}
    >
      <span>🔥</span>
      <span>{data.currentStreak}-day streak</span>
    </div>
  );
}