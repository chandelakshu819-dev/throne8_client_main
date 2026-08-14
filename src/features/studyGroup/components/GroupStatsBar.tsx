// src/features/studyGroup/components/GroupStatsBar.tsx
'use client';

import { GroupStats } from '../types';
import { Users, Crown, UserPlus, Clock, Award } from 'lucide-react';

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