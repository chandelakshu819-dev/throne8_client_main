import { memo } from 'react';
import type { ActivityType } from '../../types';

export type FilterValue = 'all' | 'unread' | ActivityType;

const FILTER_CONFIG: { key: FilterValue; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: '⚡' },
  { key: 'unread', label: 'Unread', icon: '🔴' },
  { key: 'review', label: 'Reviews', icon: '⭐' },
  { key: 'follow', label: 'Follows', icon: '👤' },
  { key: 'like', label: 'Likes', icon: '👍' },
  { key: 'comment', label: 'Comments', icon: '💬' },
  { key: 'apply', label: 'Applications', icon: '🎯' },
  { key: 'event', label: 'Events', icon: '📅' },
];

interface Props {
  active: FilterValue;
  unreadCount: number;
  onChange: (f: FilterValue) => void;
}

const ActivityFilters = memo(function ActivityFilters({ active, unreadCount, onChange }: Props) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none max-w-full">
      {FILTER_CONFIG.map(f => {
        const isActive = active === f.key;
        const displayLabel = f.key === 'unread' && unreadCount > 0 ? `Unread (${unreadCount})` : f.label;

        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all duration-200 shadow-2xs active:scale-95 flex-shrink-0 ${
              isActive
                ? 'bg-[#4a3728] text-white ring-2 ring-[#4a3728]/20 shadow-xs font-bold'
                : 'bg-white border border-[#e0d8cf] text-[#4a3728]/70 hover:text-[#4a3728] hover:bg-[#f6ede8] hover:border-[#4a3728]/40'
            }`}
          >
            <span className="text-xs">{f.icon}</span>
            <span>{displayLabel}</span>
          </button>
        );
      })}
    </div>
  );
});

export default ActivityFilters;