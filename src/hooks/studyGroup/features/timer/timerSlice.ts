//src/hooks/studyGroup/features/timer/timerSlice.ts

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  startTimerThunk, pauseTimerThunk, resumeTimerThunk, stopTimerThunk, cancelTimerThunk, getActiveTimerThunk, getAllSessionsThunk, getTodaySessionsThunk, getTimerStatsThunk, deleteSessionThunk,
} from './timer.thunks';
import {
  TimerSessionResponse, TimerStatsResponse, TodaySessionsResponse, AllSessionsResponse,
} from '@/lib/api/studyGroup.service';

export interface StudySession {
  subject: string;
  time: number;
  date: string;
}

export interface TimerSettings {
  pomodoroMinutes: number;
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
}

interface TimerState {
  activeTab: 'pomodoro' | 'focus' | 'timer';
  minutes: number;
  seconds: number;
  isActive: boolean;
  subject: string;
  selectedGoalId: string | null;
  customMinutes: number;
  studySessions: StudySession[];
  totalStudyTime: number;
  sessionStartTime: number | null;
  completedSessions: number;
  isBreakMode: boolean;
  settings: TimerSettings;
  dailyGoal: number;
  weeklyStats: { [date: string]: number };
  streakCount: number;
  lastStudyDate: string | null;

  activeSession: TimerSessionResponse | null;
  activeGroupId: string | null;
  groupStudyTimes: Record<string, number>; // groupId => seconds spent in that group
  activeSessionLoading: boolean;
  allSessions: TimerSessionResponse[];
  allSessionsLoading: boolean;
  allSessionsPagination: { total: number; page: number; pages: number; limit: number } | null;
  todaySessions: TimerSessionResponse[];
  todaySessionsLoading: boolean;
  todayTotalMinutes: number;
  timerStats: TimerStatsResponse | null;
  timerStatsLoading: boolean;

  apiLoading: boolean;   // for start/pause/resume/stop/cancel
  apiError: string | null;
}

const initialState: TimerState = {
  activeTab: 'pomodoro',
  minutes: 25,
  seconds: 0,
  isActive: false,
  subject: '',
  selectedGoalId: null,
  customMinutes: 15,
  studySessions: [],
  totalStudyTime: 0,
  sessionStartTime: null,
  completedSessions: 0,
  isBreakMode: false,
  settings: {
    pomodoroMinutes: 25,
    focusMinutes: 45,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    autoStartBreaks: true,
    autoStartPomodoros: true,
  },
  dailyGoal: 120,
  weeklyStats: {},
  streakCount: 0,
  lastStudyDate: null,// ADD after lastStudyDate: null,

  activeSession: null,
  activeSessionLoading: false,

  allSessions: [],
  allSessionsLoading: false,
  allSessionsPagination: null,

  todaySessions: [],
  todaySessionsLoading: false,
  todayTotalMinutes: 0,

  timerStats: null,
  timerStatsLoading: false,

  activeGroupId: null,
  groupStudyTimes: {},

  apiLoading: false,
  apiError: null,


};

const timerSlice = createSlice({
  name: "timer",
  initialState,
  reducers: {

    setActiveGroupForTimer: (state, action: PayloadAction<string>) => {
      state.activeGroupId = action.payload;
    },
    updateGroupStudyTime: (state, action: PayloadAction<{ groupId: string; seconds: number }>) => {
      state.groupStudyTimes[action.payload.groupId] = action.payload.seconds;
    },

    setActiveTab: (state, action: PayloadAction<'pomodoro' | 'focus' | 'timer'>) => {
      state.activeTab = action.payload;
      state.isBreakMode = false;
      state.isActive = false;
      state.sessionStartTime = null;
      state.seconds = 0;

      if (action.payload === 'pomodoro') {
        state.minutes = state.settings?.pomodoroMinutes ?? 25;
      } else if (action.payload === 'focus') {
        state.minutes = state.settings?.focusMinutes ?? 45;
      } else {
        state.minutes = state.customMinutes ?? 15;
      }
    },

    setMinutes: (state, action: PayloadAction<number>) => {
      state.minutes = action.payload;
    },

    setSeconds: (state, action: PayloadAction<number>) => {
      state.seconds = action.payload;
    },

    decrementTime: (state) => {
      if (state.seconds === 0) {
        if (state.minutes === 0) {
          state.isActive = false;
        } else {
          state.minutes -= 1;
          state.seconds = 59;
        }
      } else {
        state.seconds -= 1;
      }
    },

    toggleTimer: (state) => {
      state.isActive = !state.isActive;

      if (state.isActive && !state.isBreakMode && !state.sessionStartTime) {
        state.sessionStartTime = Date.now();
      }
    },

    resetTimer: (state) => {
      state.isActive = false;
      state.isBreakMode = false;
      state.sessionStartTime = null;
      state.seconds = 0;

      if (state.activeTab === 'pomodoro') {
        state.minutes = state.settings?.pomodoroMinutes ?? 25;
      } else if (state.activeTab === 'focus') {
        state.minutes = state.settings?.focusMinutes ?? 45;
      } else {
        state.minutes = state.customMinutes ?? 15;
      }
    },

    setSubject: (state, action: PayloadAction<string>) => {
      state.subject = action.payload;
    },

    setCustomMinutes: (state, action: PayloadAction<number>) => {
      state.customMinutes = action.payload;
      if (state.activeTab === 'timer' && !state.isActive) {
        state.minutes = action.payload;
        state.seconds = 0;
      }
    },

    addStudySession: (state, action: PayloadAction<{ subject: string; duration: number }>) => {
      const { subject, duration } = action.payload;
      const finalSubject = subject.trim() || "Other";
      const today = new Date().toISOString().split('T')[0];

      const existingIndex = state.studySessions.findIndex(s => s.subject === finalSubject);
      if (existingIndex >= 0) {
        state.studySessions[existingIndex].time += duration;
      } else {
        state.studySessions.push({
          subject: finalSubject,
          time: duration,
          date: today,
        });
      }

      state.totalStudyTime += duration;

      if (!state.weeklyStats[today]) {
        state.weeklyStats[today] = 0;
      }
      state.weeklyStats[today] += duration;

      if (state.lastStudyDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        if (state.lastStudyDate === yesterday) {
          state.streakCount += 1;
        } else {
          state.streakCount = 1;
        }
        state.lastStudyDate = today;
      }
    },

    completeSession: (state) => {
      state.completedSessions += 1;

      if (state.sessionStartTime && !state.isBreakMode) {
        const duration = Math.ceil((Date.now() - state.sessionStartTime) / 60000);
        const finalSubject = state.subject.trim() || "Other";
        const today = new Date().toISOString().split('T')[0];

        const existingIndex = state.studySessions.findIndex(s => s.subject === finalSubject);
        if (existingIndex >= 0) {
          state.studySessions[existingIndex].time += duration;
        } else {
          state.studySessions.push({
            subject: finalSubject,
            time: duration,
            date: today,
          });
        }

        state.totalStudyTime += duration;

        if (!state.weeklyStats[today]) {
          state.weeklyStats[today] = 0;
        }
        state.weeklyStats[today] += duration;
      }

      state.sessionStartTime = null;
    },

    startBreak: (state, action: PayloadAction<'short' | 'long'>) => {
      state.isBreakMode = true;
      state.seconds = 0;
      state.minutes = action.payload === 'short'
        ? state.settings?.shortBreakMinutes ?? 5
        : state.settings?.longBreakMinutes ?? 15;

      if (state.settings?.autoStartBreaks) {
        state.isActive = true;
      }
    },

    endBreak: (state) => {
      state.isBreakMode = false;
      state.seconds = 0;
      state.minutes = state.settings?.pomodoroMinutes ?? 25;

      if (state.settings?.autoStartPomodoros) {
        state.isActive = true;
        state.sessionStartTime = Date.now();
      }
    },

    setSessionStartTime: (state, action: PayloadAction<number | null>) => {
      state.sessionStartTime = action.payload;
    },

    updateSettings: (state, action: PayloadAction<Partial<TimerSettings>>) => {
      state.settings = {
        ...state.settings,
        ...action.payload,
      };
    },

    resetDailyStats: (state) => {
      state.studySessions = [];
      state.totalStudyTime = 0;
      state.completedSessions = 0;
    },
    // ADD after the last reducer in reducers: {}
    // and before the closing }) of createSlice

  },

  extraReducers: (builder) => {

    // ── Start Timer ──
    builder
      .addCase(startTimerThunk.pending, (state) => {
        state.apiLoading = true;
        state.apiError = null;
      })
      .addCase(startTimerThunk.fulfilled, (state, action) => {
        state.apiLoading = false;
        state.activeSession = action.payload;
        // Also toggle local timer
        state.isActive = true;
        state.sessionStartTime = Date.now();
      })
      .addCase(startTimerThunk.rejected, (state, action) => {
        state.apiLoading = false;
        state.apiError = action.payload as string;
      });

    // ── Pause Timer ──
    builder
      .addCase(pauseTimerThunk.pending, (state) => { state.apiLoading = true; })
      .addCase(pauseTimerThunk.fulfilled, (state, action) => {
        state.apiLoading = false;
        state.activeSession = action.payload;
        state.isActive = false;
      })
      .addCase(pauseTimerThunk.rejected, (state, action) => {
        state.apiLoading = false;
        state.apiError = action.payload as string;
      });

    // ── Resume Timer ──
    builder
      .addCase(resumeTimerThunk.pending, (state) => { state.apiLoading = true; })
      .addCase(resumeTimerThunk.fulfilled, (state, action) => {
        state.apiLoading = false;
        state.activeSession = action.payload;
        state.isActive = true;
      })
      .addCase(resumeTimerThunk.rejected, (state, action) => {
        state.apiLoading = false;
        state.apiError = action.payload as string;
      });

    // ── Stop Timer ──
    builder
      .addCase(stopTimerThunk.pending, (state) => { state.apiLoading = true; })
      .addCase(stopTimerThunk.fulfilled, (state, action) => {
        state.apiLoading = false;
        state.activeSession = null;
        state.isActive = false;
        state.sessionStartTime = null;
        // Add to local studySessions for UI
        const completed = action.payload;
        if (completed.durationInMinutes && completed.subject) {
          const today = new Date().toISOString().split('T')[0];
          const existing = state.studySessions.findIndex(s => s.subject === completed.subject);
          if (existing >= 0) {
            state.studySessions[existing].time += completed.durationInMinutes;
          } else {
            state.studySessions.push({
              subject: completed.subject || 'Other',
              time: completed.durationInMinutes,
              date: today,
            });
          }
          state.totalStudyTime += completed.durationInMinutes;

          // stopTimerThunk.fulfilled ke andar, existing code ke baad ADD:
          state.todayTotalMinutes = state.todaySessions.reduce((sum, s) => sum + Math.round((s.duration ?? 0) / 60), 0);
          state.completedSessions += 1;
        }
      })
      .addCase(stopTimerThunk.rejected, (state, action) => {
        state.apiLoading = false;
        state.apiError = action.payload as string;
      });

    // ── Cancel Timer ──
    builder
      .addCase(cancelTimerThunk.pending, (state) => { state.apiLoading = true; })
      .addCase(cancelTimerThunk.fulfilled, (state) => {
        state.apiLoading = false;
        state.activeSession = null;
        state.isActive = false;
        state.sessionStartTime = null;
      })
      .addCase(cancelTimerThunk.rejected, (state, action) => {
        state.apiLoading = false;
        state.apiError = action.payload as string;
      });

    // ── Get Active Timer ──
    builder
      .addCase(getActiveTimerThunk.pending, (state) => { state.activeSessionLoading = true; })
      .addCase(getActiveTimerThunk.fulfilled, (state, action) => {
        state.activeSessionLoading = false;
        state.activeSession = action.payload;
        // Sync local timer if session is active on server
        if (action.payload?.status === 'active') {
          state.isActive = true;
          // if (action.payload.elapsedTime) {
          //   const elapsed = action.payload.elapsedTime;
            const tab = state.activeTab;
          const total = tab === 'pomodoro' ? 25 * 60 : tab === 'focus' ? 45 * 60 : state.customMinutes * 60;
          //   const remaining = Math.max(total - elapsed, 0);
          //   state.minutes = Math.floor(remaining / 60);
          //   state.seconds = remaining % 60;
          // }

          if (action.payload.elapsedTime) {
            const elapsedSeconds = Math.floor(action.payload.elapsedTime / 1000);
            const remaining = Math.max(total - elapsedSeconds, 0);
            state.minutes = Math.floor(remaining / 60);
            state.seconds = remaining % 60;
          }
        }
      })
      .addCase(getActiveTimerThunk.rejected, (state) => { state.activeSessionLoading = false; });

    // ── All Sessions ──
    builder
      .addCase(getAllSessionsThunk.pending, (state) => { state.allSessionsLoading = true; })
      .addCase(getAllSessionsThunk.fulfilled, (state, action) => {
        state.allSessionsLoading = false;
        state.allSessions = action.payload.sessions;
        state.allSessionsPagination = action.payload.pagination;
      })
      .addCase(getAllSessionsThunk.rejected, (state, action) => {
        state.allSessionsLoading = false;
        state.apiError = action.payload as string;
      });

    // ── Today Sessions ──
    builder
      .addCase(getTodaySessionsThunk.pending, (state) => { state.todaySessionsLoading = true; })
      .addCase(getTodaySessionsThunk.fulfilled, (state, action) => {
        state.todaySessionsLoading = false;
        state.todaySessions = action.payload.sessions;
        state.todayTotalMinutes = action.payload.totalDurationInMinutes;
        // Sync totalStudyTime with API data
        state.totalStudyTime = action.payload.totalDurationInMinutes;
      })
      .addCase(getTodaySessionsThunk.rejected, (state, action) => {
        state.todaySessionsLoading = false;
        state.apiError = action.payload as string;
      });

    // ── Timer Stats ──
    builder
      .addCase(getTimerStatsThunk.pending, (state) => { state.timerStatsLoading = true; })
      .addCase(getTimerStatsThunk.fulfilled, (state, action) => {
        state.timerStatsLoading = false;
        state.timerStats = action.payload;
        // Sync streakCount from stats
        state.totalStudyTime = action.payload.durationTodayInHours
          ? Math.round(action.payload.durationTodayInHours * 60)
          : state.totalStudyTime;
      })
      .addCase(getTimerStatsThunk.rejected, (state, action) => {
        state.timerStatsLoading = false;
        state.apiError = action.payload as string;
      });

    // ── Delete Session ──
    builder
      // .addCase(deleteSessionThunk.fulfilled, (state, action) => {
      //   state.allSessions = state.allSessions.filter(
      //     s => s.sessionId !== action.payload
      //   );
      // });
      // REPLACE deleteSessionThunk.fulfilled
      .addCase(deleteSessionThunk.fulfilled, (state, action) => {
        state.allSessions = state.allSessions.filter(s => s.sessionId !== action.payload);
        // ADD: todaySessions se bhi remove karo
        state.todaySessions = state.todaySessions.filter(s => s.sessionId !== action.payload);
        state.todayTotalMinutes = state.todaySessions.reduce((sum, s) => sum + Math.round((s.duration ?? 0) / 60), 0);
      });
  },
});

// ADD after timerReducer export

interface StateWithTimer {
  timer: ReturnType<typeof timerSlice.getInitialState>;
}

export const selectActiveSession = (state: StateWithTimer) => state.timer.activeSession;
export const selectActiveSessionLoading = (state: StateWithTimer) => state.timer.activeSessionLoading;
export const selectAllTimerSessions = (state: StateWithTimer) => state.timer.allSessions;
export const selectAllSessionsLoading = (state: StateWithTimer) => state.timer.allSessionsLoading;
export const selectTodaySessions = (state: StateWithTimer) => state.timer.todaySessions;
export const selectTodaySessionsLoading = (state: StateWithTimer) => state.timer.todaySessionsLoading;
export const selectTodayTotalMinutes = (state: StateWithTimer) => state.timer.todayTotalMinutes;
export const selectTimerStats = (state: StateWithTimer) => state.timer.timerStats;
export const selectTimerStatsLoading = (state: StateWithTimer) => state.timer.timerStatsLoading;
export const selectTimerApiLoading = (state: StateWithTimer) => state.timer.apiLoading;
export const selectTimerApiError = (state: StateWithTimer) => state.timer.apiError;
export const selectGroupStudyTime = (groupId: string) => (state: StateWithTimer) =>
  state.timer.groupStudyTimes[groupId] ?? 0;
export const selectActiveGroupId = (state: StateWithTimer) => state.timer.activeGroupId;

export const {
  setActiveTab,
  setMinutes,
  setSeconds,
  decrementTime,
  toggleTimer,
  resetTimer,
  setSubject,
  setCustomMinutes,
  addStudySession,
  completeSession,
  startBreak,
  endBreak,
  setSessionStartTime,
  updateSettings,
  setActiveGroupForTimer,
  updateGroupStudyTime,
  resetDailyStats,
} = timerSlice.actions;

export const timerReducer = timerSlice.reducer;

