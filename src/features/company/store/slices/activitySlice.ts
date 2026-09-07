// activitySlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ActivityItemData } from '../../components/activity/ActivityItem';

const READ_STORAGE_KEY = 'throne8_activity_read_ids';
const RESPONSES_STORAGE_KEY = 'throne8_activity_responses';
const DELETED_STORAGE_KEY = 'throne8_activity_deleted_ids';

export const getStoredReadIds = (): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

export const getStoredResponses = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(RESPONSES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const getStoredDeletedIds = (): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(DELETED_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

const saveReadIds = (readSet: Set<string>) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(readSet)));
  } catch {}
};

const saveResponses = (responses: Record<string, string>) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(RESPONSES_STORAGE_KEY, JSON.stringify(responses));
  } catch {}
};

const saveDeletedIds = (deletedSet: Set<string>) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(Array.from(deletedSet)));
  } catch {}
};

interface ActivityState {
  items: ActivityItemData[];
  isLoaded: boolean;
}

const initialState: ActivityState = {
  items: [],
  isLoaded: false,
};

const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    setActivities: (state, action: PayloadAction<ActivityItemData[]>) => {
      state.items = action.payload;
      state.isLoaded = true;
    },
    addActivity: (state, action: PayloadAction<ActivityItemData>) => {
      const exists = state.items.some(i => i.id === action.payload.id);
      if (!exists) {
        state.items.unshift(action.payload);
      }
    },
    markRead: (state, action: PayloadAction<string>) => {
      const item = state.items.find((i) => i.id === action.payload);
      if (item) item.read = true;
      const currentReads = getStoredReadIds();
      currentReads.add(action.payload);
      saveReadIds(currentReads);
    },
    markAllRead: (state) => {
      state.items.forEach(i => { i.read = true; });
      const currentReads = getStoredReadIds();
      state.items.forEach(i => currentReads.add(i.id));
      saveReadIds(currentReads);
    },
    deleteActivity: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((i) => i.id !== action.payload);
      const currentDeleted = getStoredDeletedIds();
      currentDeleted.add(action.payload);
      saveDeletedIds(currentDeleted);
    },
    deleteAllActivities: (state) => {
      const currentDeleted = getStoredDeletedIds();
      state.items.forEach((i) => currentDeleted.add(i.id));
      saveDeletedIds(currentDeleted);
      state.items = [];
    },
    addResponse: (state, action: PayloadAction<{ id: string; text: string }>) => {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (item) {
        item.postedResponse = action.payload.text;
        item.read = true;
        if (item.review) {
          item.review.existingResponse = action.payload.text;
        }
      }
      const currentReads = getStoredReadIds();
      currentReads.add(action.payload.id);
      saveReadIds(currentReads);

      const responses = getStoredResponses();
      responses[action.payload.id] = action.payload.text;
      saveResponses(responses);
    },
  },
});

export const { setActivities, addActivity, markRead, markAllRead, deleteActivity, deleteAllActivities, addResponse } = activitySlice.actions;
export default activitySlice.reducer;