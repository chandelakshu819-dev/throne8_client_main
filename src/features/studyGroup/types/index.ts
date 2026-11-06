import { TopRankedGroupResponse } from "@/lib/api/studyGroup.service";

export type MainTab = 'overview' | 'study-groups';
export type StatsPeriod = '7days' | '30days' | '90days';

export type GroupTabType = 'all' | 'created' | 'joined';

export type SectionKey = 'university' | 'dsa' | 'jee' | 'public';


export type GroupStats = {
  totalGroups: number;
  createdGroups: number;
  joinedGroups: number;
  totalStudyHours: number;
  avgAttendance: number;
};

export type Group = TopRankedGroupResponse & {
  id: number;
  leader: string;
  members: number;
  attendanceAvg: number;
  rank: number;
  imgUrl: string;
};

export type CompletionFilter = 'all' | 'incomplete' | 'complete';

export type DateType = 'today' | 'future' | 'past';
export type TabId = 'today-tasks' | 'date-tasks' | 'upcoming' | 'overdue' | 'create';