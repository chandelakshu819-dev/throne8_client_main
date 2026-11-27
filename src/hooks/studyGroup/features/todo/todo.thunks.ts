//src/hooks/studyGroup/features/todo/todo.thunks.ts

import { createAsyncThunk } from '@reduxjs/toolkit';
import StudyGroupService from '@/lib/api/studyGroup.service';
import type { CreateTaskInput, TaskQueryInput, UpdateTaskInput } from '@/features/study-group/validators/todo.validation';
import { createFreshnessGuard } from '../../utils/freshness';

const allTasksGuard = createFreshnessGuard('todos/fetchAll', {
  hasData: (state) => (state.todos?.apiTasks?.length ?? 0) > 0,
});
const upcomingTasksGuard = createFreshnessGuard('todos/fetchUpcoming', {
  hasData: (state) => (state.todos?.upcomingTasks?.length ?? 0) > 0,
});
const overdueTasksGuard = createFreshnessGuard('todos/fetchOverdue', {
  hasData: (state) => (state.todos?.overdueTasks?.length ?? 0) > 0,
});

const invalidateTodoCaches = () => {
  allTasksGuard.invalidate();
  upcomingTasksGuard.invalidate();
  overdueTasksGuard.invalidate();
};

export const fetchAllTasksThunk = createAsyncThunk(
  'todos/fetchAll',
  async (params: Partial<TaskQueryInput> | undefined, { rejectWithValue, getState }) => {
    try {
      if (!params) {
        return await allTasksGuard.track(getState, () => StudyGroupService.getAllTasks(undefined));
      }
      return await StudyGroupService.getAllTasks(params);
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  },
  {
    condition: (params, api) => {
      if (params) return true;
      return allTasksGuard.condition(undefined, api);
    },
  }
);

export const createTaskThunk = createAsyncThunk(
  'todos/create',
  async (data: CreateTaskInput, { rejectWithValue }) => {
    try {
      const res = await StudyGroupService.createTask(data);
      invalidateTodoCaches();
      return res;
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

export const updateTaskThunk = createAsyncThunk(
  'todos/update',
  async ({ taskId, data }: { taskId: string; data: UpdateTaskInput }, { rejectWithValue }) => {
    try {
      const res = await StudyGroupService.updateTask(taskId, data);
      invalidateTodoCaches();
      return res;
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

export const deleteTaskThunk = createAsyncThunk(
  'todos/delete',
  async (taskId: string, { rejectWithValue }) => {
    try {
      await StudyGroupService.deleteTask(taskId);
      invalidateTodoCaches();
      return taskId;
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

export const markCompleteThunk = createAsyncThunk(
  'todos/markComplete',
  async (taskId: string, { rejectWithValue }) => {
    try {
      const res = await StudyGroupService.markComplete(taskId);
      invalidateTodoCaches();
      return res;
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

export const markIncompleteThunk = createAsyncThunk(
  'todos/markIncomplete',
  async (taskId: string, { rejectWithValue }) => {
    try {
      const res = await StudyGroupService.markIncomplete(taskId);
      invalidateTodoCaches();
      return res;
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

export const fetchStatsThunk = createAsyncThunk(
  'todos/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      return await StudyGroupService.getStats();
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

export const fetchUpcomingTasksThunk = createAsyncThunk(
  'todos/fetchUpcoming',
  async (days: number = 7, { rejectWithValue, getState }) => {
    try {
      if (days === 7) {
        return await upcomingTasksGuard.track(getState, () => StudyGroupService.getUpcomingTasks(7));
      }
      return await StudyGroupService.getUpcomingTasks(days);
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  },
  {
    condition: (days = 7, api) => {
      if (days !== 7) return true;
      return upcomingTasksGuard.condition(undefined, api);
    },
  }
);

export const fetchOverdueTasksThunk = createAsyncThunk(
  'todos/fetchOverdue',
  async (_: void, { rejectWithValue, getState }) => {
    try {
      return await overdueTasksGuard.track(getState, () => StudyGroupService.getOverdueTasks());
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  },
  { condition: overdueTasksGuard.condition }
);