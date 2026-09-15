
// src/hooks/studyGroup/features/goals/goalsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GoalResponse } from '@/lib/api/studyGroup.service';
import {
  fetchAllGoalsThunk, fetchActiveGoalsThunk,
  createGoalThunk, updateGoalThunk,
  deleteGoalThunk, markGoalCompleteThunk,
  fetchGoalStatsThunk,
  updateGoalProgressThunk,
  markGoalIncompleteThunk,
} from './goals.thunks';

// Frontend-only fields ke liye extended type
export interface GoalWithUI extends GoalResponse {
  color: string;   // frontend only — assign by index
}

// Weekly tracker ke liye local type — backend se sync nahi hota
export interface WeeklyGoal {
  goalId: string;
  title: string;
  color: string;
  completed: boolean;
}

export interface WeeklyGoals {
  Monday: WeeklyGoal[];
  Tuesday: WeeklyGoal[];
  Wednesday: WeeklyGoal[];
  Thursday: WeeklyGoal[];
  Friday: WeeklyGoal[];
  Saturday: WeeklyGoal[];
  Sunday: WeeklyGoal[];
}

// Color assign karne ke liye — goalId ke index se
const GOAL_COLORS = [
  '#3b82f6', '#10b981', '#8b5cf6',
  '#ec4899', '#f97316', '#ef4444', '#14b8a6',
];

interface GoalsState {
  items: GoalWithUI[];
  activeGoals: GoalResponse[];
  weeklyGoals: WeeklyGoals;
  stats: any | null;
  loading: boolean;
  createLoading: boolean;
  updateLoading: boolean;
  deleteLoading: string | null; // goalId of item being deleted
  error: string | null;
}

const initialState: GoalsState = {
  items: [],
  activeGoals: [],
  weeklyGoals: {
    Monday: [], Tuesday: [], Wednesday: [],
    Thursday: [], Friday: [], Saturday: [], Sunday: [],
  },
  stats: null,
  loading: false,
  createLoading: false,
  updateLoading: false,
  deleteLoading: null,
  error: null,
};

const goalsSlice = createSlice({
  name: 'goals',
  initialState,
  reducers: {
    // Weekly tracker — local only (drag & drop)
    addGoalToDay: (state, action: PayloadAction<{ goal: GoalWithUI; day: string }>) => {
      const dayKey = action.payload.day as keyof WeeklyGoals;
      if (state.weeklyGoals[dayKey]) {
        const exists = state.weeklyGoals[dayKey].some(g => g.goalId === action.payload.goal.goalId);
        if (!exists) {
          state.weeklyGoals[dayKey].push({
            goalId: action.payload.goal.goalId,
            title: action.payload.goal.title,
            color: action.payload.goal.color,
            completed: false,
          });
        }
      }
    },

    toggleDayGoalCompletion: (state, action: PayloadAction<{ day: string; goalId: string }>) => {
      const dayKey = action.payload.day as keyof WeeklyGoals;
      const goal = state.weeklyGoals[dayKey]?.find(g => g.goalId === action.payload.goalId);
      if (goal) goal.completed = !goal.completed;
    },

    removeGoalFromDay: (state, action: PayloadAction<{ day: string; goalId: string }>) => {
      const dayKey = action.payload.day as keyof WeeklyGoals;
      if (state.weeklyGoals[dayKey]) {
        state.weeklyGoals[dayKey] = state.weeklyGoals[dayKey].filter(
          g => g.goalId !== action.payload.goalId
        );
      }
    },

    clearError: (state) => { state.error = null; },
  },

  extraReducers: (builder) => {

    // Fetch All Goals
    builder
      .addCase(fetchAllGoalsThunk.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAllGoalsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = (action.payload.data ?? []).map((goal, index) => ({
          ...goal,
          color: GOAL_COLORS[index % GOAL_COLORS.length],
        }));
      })
      .addCase(fetchAllGoalsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Active Goals
    builder
      .addCase(fetchActiveGoalsThunk.fulfilled, (state, action) => {
        state.activeGoals = action.payload;
      });

    // Create Goal
    builder
      .addCase(createGoalThunk.pending, (state) => { state.createLoading = true; state.error = null; })
      .addCase(createGoalThunk.fulfilled, (state, action) => {
        state.createLoading = false;
        const newGoal: GoalWithUI = {
          ...action.payload,
          color: GOAL_COLORS[state.items.length % GOAL_COLORS.length],
        };
        state.items.push(newGoal);
      })
      .addCase(createGoalThunk.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload as string;
      });

    // Update Goal
    builder
      .addCase(updateGoalThunk.pending, (state) => { state.updateLoading = true; })
      .addCase(updateGoalThunk.fulfilled, (state, action) => {
        state.updateLoading = false;
        const index = state.items.findIndex(g => g.goalId === action.payload.goalId);
        if (index !== -1) {
          state.items[index] = { ...action.payload, color: state.items[index].color };
        }
        // Weekly goals mein bhi update karo
        Object.keys(state.weeklyGoals).forEach(day => {
          const dayKey = day as keyof WeeklyGoals;
          state.weeklyGoals[dayKey] = state.weeklyGoals[dayKey].map(g =>
            g.goalId === action.payload.goalId
              ? { ...g, title: action.payload.title }
              : g
          );
        });
      })
      .addCase(updateGoalThunk.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload as string;
      });

    // Delete Goal
    builder
      .addCase(deleteGoalThunk.pending, (state, action) => {
        state.deleteLoading = action.meta.arg;
      })
      .addCase(deleteGoalThunk.fulfilled, (state, action) => {
        state.deleteLoading = null;
        state.items = state.items.filter(g => g.goalId !== action.payload);
        // Weekly goals se bhi hatao
        Object.keys(state.weeklyGoals).forEach(day => {
          const dayKey = day as keyof WeeklyGoals;
          state.weeklyGoals[dayKey] = state.weeklyGoals[dayKey].filter(
            g => g.goalId !== action.payload
          );
        });
      })
      .addCase(deleteGoalThunk.rejected, (state, action) => {
        state.deleteLoading = null;
        state.error = action.payload as string;
      });

    //goal hours progrss update
    // builder
    //   .addCase(updateGoalProgressThunk.fulfilled, (state, action) => {
    //     const index = state.items.findIndex(g => g.goalId === action.payload.goalId);
    //     if (index !== -1) {
    //       state.items[index] = { ...action.payload, color: state.items[index].color };
    //     }
    //   });

    builder
      .addCase(updateGoalProgressThunk.fulfilled, (state, action) => {
        const index = state.items.findIndex(g => g.goalId === action.payload.goalId);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload, color: state.items[index].color };
        }
      });

    builder
      .addCase(markGoalIncompleteThunk.fulfilled, (state, action) => {
        const index = state.items.findIndex(g => g.goalId === action.payload.goalId);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload, color: state.items[index].color };
        }
      });

    // Mark Complete
    builder
      .addCase(markGoalCompleteThunk.fulfilled, (state, action) => {
        const index = state.items.findIndex(g => g.goalId === action.payload.goalId);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload, color: state.items[index].color };
        }
      });

    // Goal Stats
    builder
      .addCase(fetchGoalStatsThunk.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const {
  addGoalToDay,
  toggleDayGoalCompletion,
  removeGoalFromDay,
  clearError,
} = goalsSlice.actions;

// Selectors
export const selectAllGoals = (state: any) => state.goals.items;
export const selectActiveGoals = (state: any) => state.goals.activeGoals;
export const selectGoalsLoading = (state: any) => state.goals.loading;
export const selectCreateLoading = (state: any) => state.goals.createLoading;
export const selectGoalStats = (state: any) => state.goals.stats;
export const selectWeeklyGoals = (state: any) => state.goals.weeklyGoals;

export const goalsReducer = goalsSlice.reducer;

// Backward compat — purane components ke liye
export type Goal = GoalWithUI;



