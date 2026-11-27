// src/hooks/studyGroup/features/timer/timer.thunks.ts

import { createAsyncThunk } from '@reduxjs/toolkit';
import StudyGroupService, {
  StartTimerData,
} from '@/lib/api/studyGroup.service';
import { createFreshnessGuard, FreshnessArg } from '../../utils/freshness';

// Timer stats are an expensive aggregation on the server, and three screens ask for them.
const timerStatsGuard = createFreshnessGuard('timer/getStats', {
  hasData: (state) => state.timer?.timerStats != null,
});
const activeTimerGuard = createFreshnessGuard('timer/getActive', {
  ttlMs: 15_000,
});
const todaySessionsGuard = createFreshnessGuard('timer/getTodaySessions', {
  hasData: (state) => (state.timer?.todaySessions?.length ?? 0) > 0,
});
const allSessionsGuard = createFreshnessGuard('timer/getAllSessions:10', {
  hasData: (state) => (state.timer?.allSessions?.length ?? 0) > 0,
});

const invalidateTimerCaches = () => {
  timerStatsGuard.invalidate();
  activeTimerGuard.invalidate();
  todaySessionsGuard.invalidate();
  allSessionsGuard.invalidate();
};

export const startTimerThunk = createAsyncThunk(
  'timer/start',
  async (data: StartTimerData, { rejectWithValue }) => {
    try {
      const res = await StudyGroupService.startTimer(data);
      activeTimerGuard.invalidate();
      return res;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to start timer');
    }
  }
);

export const pauseTimerThunk = createAsyncThunk(
  'timer/pause',
  async (_, { rejectWithValue }) => {
    try {
      const res = await StudyGroupService.pauseTimer();
      activeTimerGuard.invalidate();
      return res;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to pause timer');
    }
  }
);

export const resumeTimerThunk = createAsyncThunk(
  'timer/resume',
  async (_, { rejectWithValue }) => {
    try {
      const res = await StudyGroupService.resumeTimer();
      activeTimerGuard.invalidate();
      return res;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to resume timer');
    }
  }
);

export const stopTimerThunk = createAsyncThunk(
  'timer/stop',
  async (notes: string | undefined, { rejectWithValue }) => {
    try {
      const result = await StudyGroupService.stopTimer(notes);
      invalidateTimerCaches();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to stop timer');
    }
  }
);

export const cancelTimerThunk = createAsyncThunk(
  'timer/cancel',
  async (_, { rejectWithValue }) => {
    try {
      await StudyGroupService.cancelTimer();
      invalidateTimerCaches();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to cancel timer');
    }
  }
);

export const getActiveTimerThunk = createAsyncThunk(
  'timer/getActive',
  async (_: FreshnessArg, { rejectWithValue, getState }) => {
    try {
      return await activeTimerGuard.track(getState, () => StudyGroupService.getActiveTimer());
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch active timer');
    }
  },
  { condition: activeTimerGuard.condition }
);

export const getAllSessionsThunk = createAsyncThunk(
  'timer/getAllSessions',
  async (
    params: { page?: number; limit?: number; subject?: string } = {},
    { rejectWithValue, getState }
  ) => {
    try {
      const isDefault = !params.subject && (!params.page || params.page === 1) && (params.limit ?? 10) === 10;
      if (isDefault) {
        return await allSessionsGuard.track(getState, () => StudyGroupService.getAllTimerSessions(params));
      }
      return await StudyGroupService.getAllTimerSessions(params);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch sessions');
    }
  },
  {
    condition: (params = {}, api) => {
      const isDefault = !params.subject && (!params.page || params.page === 1) && (params.limit ?? 10) === 10;
      if (!isDefault) return true;
      return allSessionsGuard.condition(undefined, api);
    },
  }
);

export const getTodaySessionsThunk = createAsyncThunk(
  'timer/getTodaySessions',
  async (_: FreshnessArg, { rejectWithValue, getState }) => {
    try {
      return await todaySessionsGuard.track(getState, () => StudyGroupService.getTodayTimerSessions());
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch today sessions');
    }
  },
  { condition: todaySessionsGuard.condition }
);

export const getTimerStatsThunk = createAsyncThunk(
  'timer/getStats',
  async (_: FreshnessArg, { rejectWithValue, getState }) => {
    try {
      return await timerStatsGuard.track(getState, () => StudyGroupService.getTimerStats());
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch timer stats');
    }
  },
  { condition: timerStatsGuard.condition }
);

export const deleteSessionThunk = createAsyncThunk(
  'timer/deleteSession',
  async (sessionId: string, { rejectWithValue }) => {
    try {
      await StudyGroupService.deleteTimerSession(sessionId);
      invalidateTimerCaches();
      return sessionId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete session');
    }
  }
);