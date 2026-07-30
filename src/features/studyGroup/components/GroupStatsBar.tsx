// src/app/studyGroup/study/my-groups/components/GroupStatsBar.tsx
'use client';

import { STAT_CARDS } from '../data';
import { GroupStats} from '../types';


import { Users, Crown, UserPlus, Clock, Award } from 'lucide-react';
// import type { GroupStats } from '../../types/types';
interface GroupStatsBarProps {
  stats: GroupStats;
}


const STAT_CARDS = [
  { key: 'totalGroups',     label: 'Total Groups',  Icon: Users , suffix: '' },
  { key: 'createdGroups',   label: 'Created',       Icon: Crown,  suffix: '' },
  { key: 'joinedGroups',    label: 'Joined',        Icon: UserPlus, suffix: '' },
  { key: 'totalStudyHours', label: 'Study Hours',   Icon: Clock,  suffix: 'h' },
  { key: 'avgAttendance',   label: 'Avg Attendance', Icon: Award,  suffix: '%' },
] as const;

export const GroupStatsBar: React.FC<GroupStatsBarProps> = ({ stats }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
    {STAT_CARDS.map(({ key, label, Icon, suffix }) => (
      <div
        key={key}
        className={`bg-white rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 border-2 border-[#e0d8cf] hover:border-[#8b7355] transition-all ${key === 'avgAttendance' ? 'col-span-2 sm:col-span-1' : ''
          }`}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#8b7355] rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon className="text-white" size={16} />
          </div>
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-bold text-[#4a3728]">
              {stats[key]}{suffix ?? ''}
            </div>
            <div className="text-[10px] sm:text-xs text-[#6b5847] truncate">{label}</div>
          </div>
        </div>
      </div>
    ))}
  </div>
);