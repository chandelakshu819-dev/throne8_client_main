'use client';

import { useTrustScore } from '@/features/profile/hooks/useTrustScore';

interface TrustScoreBadgeProps {
  userId: string;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return { bg: '#e0d8cf', text: '#4a3728', ring: '#7a5c3e' };
  if (score >= 50) return { bg: '#f6ede8', text: '#7a5c3e', ring: '#7a5c3e' };
  return { bg: '#f6ede8', text: '#9c8b7a', ring: '#e0d8cf' };
};

export default function TrustScoreBadge({ userId }: TrustScoreBadgeProps) {
  const { data, loading } = useTrustScore(userId);

  if (loading || !data || !data.isMentor || !data.trustScore) {
    return null;
  }

  const score = data.trustScore.overall;
  const colors = getScoreColor(score);

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium"
      style={{ backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.ring}` }}
      title={`Reliability: ${data.trustScore.breakdown.reliability} | Satisfaction: ${data.trustScore.breakdown.studentSatisfaction} | Engagement: ${data.trustScore.breakdown.engagement}`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2l3 6.5 7 1-5 5 1.5 7L12 18l-6.5 3.5L7 14.5l-5-5 7-1z" />
      </svg>
      <span>Trust Score {score}</span>
      {data.isVerified && (
        <span title="Verified Mentor" style={{ color: colors.ring }}>✓</span>
      )}
    </div>
  );
}