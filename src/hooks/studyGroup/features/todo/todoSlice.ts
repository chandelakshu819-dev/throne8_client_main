//src/hooks/studyGroup/features/todo/todoSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  TaskResponse,
  TaskListResponse,
  TaskStatsResponse,
} from "@/lib/api/studyGroup.service";
import {
  fetchAllTasksThunk,
  createTaskThunk,
  updateTaskThunk,
  deleteTaskThunk,
  markCompleteThunk,
  markIncompleteThunk,
  fetchStatsThunk,
  fetchUpcomingTasksThunk,
  fetchOverdueTasksThunk,
} from "./todo.thunks";

// ─── Legacy local type (MonthView/YearView ke liye preserve kiya) ───
// export interface Todo {
//   id: number;
//   text: string;
//   completed: boolean;
//   createdAt: string;
//   description?: string;
//   priority?: 'low' | 'medium' | 'high' | 'urgent';
//   deadline?: string;
//   tags?: string[];
//   reminderAt?: string;
// }

export interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: string;
  // ✅ Naye optional fields
  description?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  deadline?: string;
  tags?: string[];
  reminderAt?: string;
  taskId?: string; // future API sync ke liye
}

export interface Todos {
  [dateStr: string]: Todo[];
}

// ─── New API-backed state ───
interface TodosState {
  // ✅ KEEP — MonthView/YearView abhi bhi ye use karta hai
  items: Todos;
  nextId: number;

  // ✅ NEW — API data
  apiTasks: TaskResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null;
  stats: TaskStatsResponse | null;
  upcomingTasks: TaskResponse[];
  overdueTasks: TaskResponse[];

  // ✅ NEW — loading/error per operation
  loading: {
    fetchAll: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    stats: boolean;
    upcoming: boolean;
    overdue: boolean;
  };
  error: string | null;
  lastFetched: string | null; // ISO timestamp — refetch guard ke liye
}

const initialState: TodosState = {
  items: {},
  nextId: 1,

  apiTasks: [],
  pagination: null,
  stats: null,
  upcomingTasks: [],
  overdueTasks: [],

  loading: {
    fetchAll: false,
    create: false,
    update: false,
    delete: false,
    stats: false,
    upcoming: false,
    overdue: false,
  },
  error: null,
  lastFetched: null,
};

const todoSlice = createSlice({
  name: "todos",
  initialState,
  reducers: {
    // ✅ KEEP — local slice actions (MonthView/TodoModal use karta hai)
    // addTodo: (state, action: PayloadAction<{ dateStr: string; text: string; description?: string; priority?: 'low' | 'medium' | 'high' | 'urgent'; deadline?: string; tags?: string[]; reminderAt?: string }>) => {
    //   const { dateStr, text, description, priority, deadline, tags, reminderAt } = action.payload;
    //   if (!state.items[dateStr]) state.items[dateStr] = [];
    //   state.items[dateStr].push({
    //     id: state.nextId++,
    //     text,
    //     completed: false,
    //     createdAt: new Date().toISOString(),
    //     description,
    //     priority,
    //     deadline,
    //     tags,
    //     reminderAt,
    //   });
    // },

    addTodo: (
      state,
      action: PayloadAction<{
        dateStr: string;
        text: string;
        description?: string;
        priority?: "low" | "medium" | "high" | "urgent";
        deadline?: string;
        tags?: string[];
        reminderAt?: string;
        taskId?: string;
      }>
    ) => {
      const {
        dateStr,
        text,
        description,
        priority,
        deadline,
        tags,
        reminderAt,
        taskId,
      } = action.payload;
      if (!state.items[dateStr]) state.items[dateStr] = [];
      state.items[dateStr].push({
        id: state.nextId++,
        text,
        completed: false,
        createdAt: new Date().toISOString(),
        // ✅ optional fields save karo
        ...(description && { description }),
        ...(priority && { priority }),
        ...(deadline && { deadline }),
        ...(tags?.length && { tags }),
        ...(reminderAt && { reminderAt }),
        ...(taskId && { taskId }),
      });
    },
    toggleTodo: (
      state,
      action: PayloadAction<{ dateStr: string; todoId: number }>
    ) => {
      const todo = state.items[action.payload.dateStr]?.find(
        (t) => t.id === action.payload.todoId
      );
      if (todo) todo.completed = !todo.completed;
    },
    deleteTodo: (
      state,
      action: PayloadAction<{ dateStr: string; todoId: number }>
    ) => {
      const { dateStr, todoId } = action.payload;
      if (state.items[dateStr]) {
        state.items[dateStr] = state.items[dateStr].filter(
          (t) => t.id !== todoId
        );
        if (state.items[dateStr].length === 0) delete state.items[dateStr];
      }
    },
    updateTodo: (
      state,
      action: PayloadAction<{ dateStr: string; todoId: number; text: string }>
    ) => {
      const todo = state.items[action.payload.dateStr]?.find(
        (t) => t.id === action.payload.todoId
      );
      if (todo) todo.text = action.payload.text;
    },
    clearCompletedTodos: (state, action: PayloadAction<string>) => {
      if (state.items[action.payload]) {
        state.items[action.payload] = state.items[action.payload].filter(
          (t) => !t.completed
        );
        if (state.items[action.payload].length === 0)
          delete state.items[action.payload];
      }
    },
    importTodos: (state, action: PayloadAction<Todos>) => {
      state.items = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    // ── fetchAll ──
    builder
      .addCase(fetchAllTasksThunk.pending, (state) => {
        state.loading.fetchAll = true;
        state.error = null;
      })
      .addCase(fetchAllTasksThunk.fulfilled, (state, action) => {
        state.loading.fetchAll = false;
        state.apiTasks = action.payload.tasks;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
          hasNextPage: action.payload.hasNextPage,
          hasPrevPage: action.payload.hasPrevPage,
        };
        state.lastFetched = new Date().toISOString();
      })
      .addCase(fetchAllTasksThunk.rejected, (state, action) => {
        state.loading.fetchAll = false;
        state.error = action.payload as string;
      });

    // ── create ──
    builder
      .addCase(createTaskThunk.pending, (state) => {
        state.loading.create = true;
        state.error = null;
      })
      .addCase(createTaskThunk.fulfilled, (state, action) => {
        state.loading.create = false;
        // List ke shuru mein add karo (latest first)
        state.apiTasks.unshift(action.payload);
        if (state.pagination) state.pagination.total += 1;
      })
      .addCase(createTaskThunk.rejected, (state, action) => {
        state.loading.create = false;
        state.error = action.payload as string;
      });

    // ── update ──
    builder
      .addCase(updateTaskThunk.pending, (state) => {
        state.loading.update = true;
        state.error = null;
      })
      .addCase(updateTaskThunk.fulfilled, (state, action) => {
        state.loading.update = false;
        const idx = state.apiTasks.findIndex(
          (t) => t.taskId === action.payload.taskId
        );
        if (idx !== -1) state.apiTasks[idx] = action.payload;
      })
      .addCase(updateTaskThunk.rejected, (state, action) => {
        state.loading.update = false;
        state.error = action.payload as string;
      });

    // ── delete ──
    builder
      .addCase(deleteTaskThunk.pending, (state) => {
        state.loading.delete = true;
        state.error = null;
      })
      .addCase(deleteTaskThunk.fulfilled, (state, action) => {
        state.loading.delete = false;
        state.apiTasks = state.apiTasks.filter(
          (t) => t.taskId !== action.payload
        );
        if (state.pagination) state.pagination.total -= 1;
      })
      .addCase(deleteTaskThunk.rejected, (state, action) => {
        state.loading.delete = false;
        state.error = action.payload as string;
      });

    // ── markComplete ──
    builder
      // .addCase(markCompleteThunk.fulfilled, (state, action) => {
      //   // Backend complete/incomplete response data:{} aata hai
      //   // Isliye taskId se dhundh ke manually update karo
      //   const taskId = action.meta.arg; // thunk mein pass kiya tha
      //   const task = state.apiTasks.find(t => t.taskId === taskId);
      //   if (task) {
      //     task.completed = true;
      //     task.status = 'completed';
      //     task.completedAt = new Date().toISOString();
      //   }
      // });

      .addCase(markCompleteThunk.fulfilled, (state, action) => {
        const taskId = action.meta.arg;
        // Backend ne actual task return kiya toh use karo
        const updatedTask =
          action.payload && (action.payload as any).taskId
            ? (action.payload as any)
            : null;

        const task = state.apiTasks.find((t) => t.taskId === taskId);
        if (task) {
          if (updatedTask) {
            // Backend se aaya data directly assign karo
            Object.assign(task, updatedTask);
          } else {
            // Fallback: manually update karo
            task.completed = true;
            task.status = "completed";
            task.completedAt = new Date().toISOString();
            task.isOverdue = false;
          }
        }
        const upTask = state.upcomingTasks.find((t) => t.taskId === taskId);
        if (upTask) {
          upTask.completed = true;
          upTask.status = "completed";
        }
      })

      // markIncomplete bhi same pattern:
      .addCase(markIncompleteThunk.fulfilled, (state, action) => {
        const taskId = action.meta.arg;
        const updatedTask =
          action.payload && (action.payload as any).taskId
            ? (action.payload as any)
            : null;

        const task = state.apiTasks.find((t) => t.taskId === taskId);
        if (task) {
          if (updatedTask) {
            Object.assign(task, updatedTask);
          } else {
            task.completed = false;
            task.status = "pending";
            task.completedAt = null;
          }
        }
        const upTask = state.upcomingTasks.find((t) => t.taskId === taskId);
        if (upTask) {
          upTask.completed = false;
          upTask.status = "pending";
        }
      });

    // ── markIncomplete ──
    // builder
    //   .addCase(markIncompleteThunk.fulfilled, (state, action) => {
    //     const taskId = action.meta.arg;
    //     const task = state.apiTasks.find(t => t.taskId === taskId);
    //     if (task) {
    //       task.completed = false;
    //       task.status = 'pending';
    //       task.completedAt = null;
    //     }
    //   });

    // ── stats ──
    builder
      .addCase(fetchStatsThunk.pending, (state) => {
        state.loading.stats = true;
      })
      .addCase(fetchStatsThunk.fulfilled, (state, action) => {
        state.loading.stats = false;
        state.stats = action.payload;
      })
      .addCase(fetchStatsThunk.rejected, (state) => {
        state.loading.stats = false;
      });

    // // ── upcoming ──
    // builder
    //   .addCase(fetchUpcomingTasksThunk.pending, (state) => { state.loading.upcoming = true; })
    //   .addCase(fetchUpcomingTasksThunk.fulfilled, (state, action) => {
    //     state.loading.upcoming = false;
    //     // taskId:"false" wale filter karo (old bug)
    //     state.upcomingTasks = action.payload.filter(t => t.taskId && t.taskId !== 'false');
    //   })
    //   .addCase(fetchUpcomingTasksThunk.rejected, (state) => { state.loading.upcoming = false; });

    // // ── overdue ──
    // builder
    //   .addCase(fetchOverdueTasksThunk.pending, (state) => { state.loading.overdue = true; })
    //   .addCase(fetchOverdueTasksThunk.fulfilled, (state, action) => {
    //     state.loading.overdue = false;
    //     state.overdueTasks = action.payload;
    //   })
    //   .addCase(fetchOverdueTasksThunk.rejected, (state) => { state.loading.overdue = false; });

    // ── upcoming ──
    builder
      .addCase(fetchUpcomingTasksThunk.pending, (state) => {
        state.loading.upcoming = true;
      })
      .addCase(fetchUpcomingTasksThunk.fulfilled, (state, action) => {
        state.loading.upcoming = false;
        const list = Array.isArray(action.payload) ? action.payload : [];
        // taskId:"false" wale filter karo (old bug)
        state.upcomingTasks = list.filter(
          (t) => t.taskId && t.taskId !== "false"
        );
      })
      .addCase(fetchUpcomingTasksThunk.rejected, (state) => {
        state.loading.upcoming = false;
      });

    // ── overdue ──
    builder
      .addCase(fetchOverdueTasksThunk.pending, (state) => {
        state.loading.overdue = true;
      })
      .addCase(fetchOverdueTasksThunk.fulfilled, (state, action) => {
        state.loading.overdue = false;
        state.overdueTasks = Array.isArray(action.payload)
          ? action.payload
          : [];
      })
      .addCase(fetchOverdueTasksThunk.rejected, (state) => {
        state.loading.overdue = false;
      });
  },
});

export const {
  addTodo,
  toggleTodo,
  deleteTodo,
  updateTodo,
  clearCompletedTodos,
  importTodos,
  clearError,
} = todoSlice.actions;

export const todoReducer = todoSlice.reducer;
