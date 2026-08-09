// src/app/studyGroup/study/my-groups/components/GroupFilterBar.tsx
'use client';

import { Search, Crown, UserPlus } from 'lucide-react';
import type { GroupStats } from '../../types/types';
import { GroupTabType } from '../../types/types';

interface GroupFilterBarProps {
  activeTab:      GroupTabType;
  searchQuery:    string;
  stats:          GroupStats;
  onTabChange:    (tab: GroupTabType) => void;
  onSearchChange: (query: string) => void;
}

const TAB_ICONS: Record<string, React.ReactNode> = {
  created: <Crown  size={14} />,
  joined:  <UserPlus size={14} />,
};

const TAB_COUNTS = (stats: GroupStats): Record<string, number> => ({
  all:     stats.totalGroups,
  created: stats.createdGroups,
  joined:  stats.joinedGroups,
});

export const GroupFilterBar: React.FC<GroupFilterBarProps> = ({
  activeTab,
  searchQuery,
  stats,
  onTabChange,
  onSearchChange,
}) => {
  const counts = TAB_COUNTS(stats);

  return (
    <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border-2 border-[#e0d8cf]">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">

        {/* Tab Buttons */}
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto">
          {GROUP_TABS.map(({id, label}: { id: any, label: any }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all whitespace-nowrap flex items-center gap-1 ${
                  isActive
                    ? 'bg-linear-to-r from-[#8b7355] to-[#6b5847] text-white shadow-md'
                    : 'bg-[#f6ede8] text-[#4a3728] hover:bg-[#e0d8cf]'
                }`}
              >
                {TAB_ICONS[id] ?? null}
                {label} ({counts[id]})
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search groups..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-3 sm:pl-4 pr-8 sm:pr-10 py-1.5 sm:py-2 border-2 border-[#e0d8cf] rounded-lg focus:border-[#8b7355] focus:ring-2 focus:ring-[#8b7355]/30 outline-none text-xs sm:text-sm"
          />
          <Search
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-[#6b5847] pointer-events-none"
            size={16}
          />
        </div>
      </div>
    </div>
  );
};
