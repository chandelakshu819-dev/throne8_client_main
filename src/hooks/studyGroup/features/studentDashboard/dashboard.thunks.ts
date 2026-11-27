import { createAsyncThunk } from '@reduxjs/toolkit';
import StudyGroupService from '@/lib/api/studyGroup.service';
import { createFreshnessGuard, FreshnessArg } from '../../utils/freshness';

const userDashboardGuard = createFreshnessGuard('studyDashboard/fetchUser', {
  hasData: (state) => state.studyDashboard?.user != null,
});
const analyticsGuard = createFreshnessGuard('studyDashboard/fetchAnalytics', {
  hasData: (state) => state.studyDashboard?.analytics != null,
});
const dashboardMyGroupsGuard = createFreshnessGuard('studyDashboard/fetchMyGroups', {
  hasData: (state) => (state.studyDashboard?.myGroups?.length ?? 0) > 0,
});
const statsGuards = new Map<string, ReturnType<typeof createFreshnessGuard>>();
const getStatsGuard = (period: string) => {
  let g = statsGuards.get(period);
  if (!g) {
    g = createFreshnessGuard(`studyDashboard/fetchStatistics:${period}`);
    statsGuards.set(period, g);
  }
  return g;
};

export const fetchUserDashboardThunk = createAsyncThunk(
  'studyDashboard/fetchUser',
  async (_: FreshnessArg, { rejectWithValue, getState }) => {
    try {
      return await userDashboardGuard.track(getState, () => StudyGroupService.getUserDashboard());
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
  { condition: userDashboardGuard.condition }
);

export const fetchStudyStatisticsThunk = createAsyncThunk(
  'studyDashboard/fetchStatistics',
  async (period: '7days' | '30days' | '90days' = '7days', { rejectWithValue, getState }) => {
    try {
      return await getStatsGuard(period).track(getState, () => StudyGroupService.getStudyStatistics(period));
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch statistics');
    }
  },
  { condition: (period = '7days', api) => getStatsGuard(period).condition(undefined, api) }
);

export const fetchPerformanceAnalyticsThunk = createAsyncThunk(
  'studyDashboard/fetchAnalytics',
  async (_: FreshnessArg, { rejectWithValue, getState }) => {
    try {
      return await analyticsGuard.track(getState, () => StudyGroupService.getPerformanceAnalytics());
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch analytics');
    }
  },
  { condition: analyticsGuard.condition }
);

export const fetchMyGroupsThunk = createAsyncThunk(
  'studyDashboard/fetchMyGroups',
  async (_: FreshnessArg, { rejectWithValue, getState }) => {
    try {
      return await dashboardMyGroupsGuard.track(getState, () => StudyGroupService.getMyGroups());
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch groups');
    }
  },
  { condition: dashboardMyGroupsGuard.condition }
);
