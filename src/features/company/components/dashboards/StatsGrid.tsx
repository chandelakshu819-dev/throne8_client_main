import { memo } from 'react';
import StatCard from './StatCard';

export interface Stat {
  id: string;
  label: string;
  value: string;
  change: string;
  up: boolean;
  icon: string;
}

interface StatsGridProps {
  stats: Stat[];
  isLoading?: boolean;
  error?: string | null;
}

const StatsGrid = memo(function StatsGrid({ stats, isLoading, error }: StatsGridProps) {
  // Show skeleton cards while loading
  if (isLoading && stats.length === 0) {
    const placeholders = [
      { id: 'views', label: 'Profile Views', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
      { id: 'impressions', label: 'Post Impressions', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
      { id: 'followers', label: 'Followers', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
      { id: 'search', label: 'Search Appearances', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
    ];

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {placeholders.map((p) => (
          <StatCard key={p.id} id={p.id} label={p.label} value="" change="" up={true} icon={p.icon} isLoading={true} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <StatCard key={stat.id} {...stat} isLoading={false} />
      ))}
    </div>
  );
});

export default StatsGrid;