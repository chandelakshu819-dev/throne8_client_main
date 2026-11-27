import { createAsyncThunk } from '@reduxjs/toolkit';
import StudyGroupService from '@/lib/api/studyGroup.service';
import { CreateGoalInput, UpdateGoalInput } from '@/features/study-group/validators/goal.validation';
import { createFreshnessGuard, FreshnessArg } from '../../utils/freshness';

const allGoalsGuard = createFreshnessGuard('goals/fetchAll', {
  hasData: (state) => (state.goals?.items?.length ?? 0) > 0,
});
const goalStatsGuard = createFreshnessGuard('goals/fetchStats', {
  hasData: (state) => state.goals?.stats != null,
});

const invalidateGoalCaches = () => {
  allGoalsGuard.invalidate();
  goalStatsGuard.invalidate();
};

export const fetchAllGoalsThunk = createAsyncThunk(
  'goals/fetchAll',
  async (_: FreshnessArg, { rejectWithValue, getState }) => {
    try {
      return await allGoalsGuard.track(getState, () => StudyGroupService.getAllGoals());
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch goals');
    }
  },
  { condition: allGoalsGuard.condition }
);

export const fetchActiveGoalsThunk = createAsyncThunk(
  'goals/fetchActive',
  async (_, { rejectWithValue }) => {
    try {
      return await StudyGroupService.getActiveGoals();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch active goals');
    }
  }
);

export const createGoalThunk = createAsyncThunk(
  'goals/create',
  async (data: CreateGoalInput, { rejectWithValue }) => {
    try {
      const res = await StudyGroupService.createGoal(data);
      invalidateGoalCaches();
      return res;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create goal');
    }
  }
);

export const updateGoalThunk = createAsyncThunk(
  'goals/update',
  async ({ goalId, data }: { goalId: string; data: UpdateGoalInput }, { rejectWithValue }) => {
    try {
      const res = await StudyGroupService.updateGoal(goalId, data);
      invalidateGoalCaches();
      return res;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update goal');
    }
  }
);

export const deleteGoalThunk = createAsyncThunk(
  'goals/delete',
  async (goalId: string, { rejectWithValue }) => {
    try {
      await StudyGroupService.deleteGoal(goalId);
      invalidateGoalCaches();
      return goalId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete goal');
    }
  }
);

export const markGoalCompleteThunk = createAsyncThunk(
  'goals/markComplete',
  async (goalId: string, { rejectWithValue }) => {
    try {
      const res = await StudyGroupService.markGoalComplete(goalId);
      invalidateGoalCaches();
      return res;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to mark goal complete');
    }
  }
);

export const fetchGoalStatsThunk = createAsyncThunk(
  'goals/fetchStats',
  async (_: FreshnessArg, { rejectWithValue, getState }) => {
    try {
      return await goalStatsGuard.track(getState, () => StudyGroupService.getGoalStats());
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch goal stats');
    }
  },
  { condition: goalStatsGuard.condition }
);

export const updateGoalProgressThunk = createAsyncThunk(
  'goals/updateProgress',
  async ({ goalId, hoursToAdd }: { goalId: string; hoursToAdd: number }, { rejectWithValue }) => {
    try {
      const data = await StudyGroupService.updateGoalProgress({ goalId, hoursToAdd });
      invalidateGoalCaches();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update progress');
    }
  }
);

export const markGoalIncompleteThunk = createAsyncThunk(
  'goals/markIncomplete',
  async (goalId: string, { rejectWithValue }) => {
    try {
      const res = await StudyGroupService.markGoalIncomplete(goalId);
      invalidateGoalCaches();
      return res;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);