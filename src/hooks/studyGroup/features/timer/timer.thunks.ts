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

export const startTimerThunk = createAsyncThunk(
  'timer/start',
  async (data: StartTimerData, { rejectWithValue }) => {
    try {
      return await StudyGroupService.startTimer(data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to start timer');
    }
  }
);

export const pauseTimerThunk = createAsyncThunk(
  'timer/pause',
  async (_, { rejectWithValue }) => {
    try {
      return await StudyGroupService.pauseTimer();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to pause timer');
    }
  }
);

export const resumeTimerThunk = createAsyncThunk(
  'timer/resume',
  async (_, { rejectWithValue }) => {
    try {
      return await StudyGroupService.resumeTimer();
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
      timerStatsGuard.invalidate();
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
      timerStatsGuard.invalidate();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to cancel timer');
    }
  }
);

export const getActiveTimerThunk = createAsyncThunk(
  'timer/getActive',
  async (_, { rejectWithValue }) => {
    try {
      return await StudyGroupService.getActiveTimer();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch active timer');
    }
  }
);

export const getAllSessionsThunk = createAsyncThunk(
  'timer/getAllSessions',
  async (
    params: { page?: number; limit?: number; subject?: string } = {},
    { rejectWithValue }
  ) => {
    try {
      return await StudyGroupService.getAllTimerSessions(params);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch sessions');
    }
  }
);

export const getTodaySessionsThunk = createAsyncThunk(
  'timer/getTodaySessions',
  async (_, { rejectWithValue }) => {
    try {
      return await StudyGroupService.getTodayTimerSessions();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch today sessions');
    }
  }
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
      timerStatsGuard.invalidate();
      return sessionId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete session');
    }
  }
);