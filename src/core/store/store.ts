// src/store/store.ts (main Redux store configuration for the application)

import { configureStore } from "@reduxjs/toolkit";
import { loginReducer } from "../../hooks/auth";
import { registerReducer } from "../../hooks/auth/slices";
import { profileReducer } from "../../hooks/profile";
import { educationReducer } from "../../hooks/profile/slices";
import { groupsReducer } from "@/hooks/studyGroup/features/groups/groupsSlice";
import { timerReducer } from "@/hooks/studyGroup/features/timer/timerSlice";
import { goalsReducer } from "@/hooks/studyGroup/features/goals/goalsSlice";
import { todoReducer } from "@/hooks/studyGroup/features/todo/todoSlice";
import { chatReducer } from "@/hooks/studyGroup/features/chats/chatSlice";
import { dashboardReducer } from "@/hooks/studyGroup/features/studentDashboard/dashboard.Slice";

import companyReducer from "@/features/company/store/slices/companySlice";
import userReducer from "@/features/company/store/slices/userSlice";
import postsReducer from "@/features/company/store/slices/postsSlice";
import activityReducer from "@/features/company/store/slices/activitySlice";
import analyticsReducer from "@/features/company/store/slices/analyticsSlice";
import inboxReducer from "@/features/company/store/slices/inboxSlice";
import companyJobsReducer from "@/features/company/store/slices/jobsslice";
import jobsReducer from "@/features/jobs/jobsSlice";
import employeesReducer from "@/features/company/store/slices/employeesslice";
import eventsReducer from "@/features/company/store/slices/eventSlice";
import uiReducer from "@/features/company/store/slices/uiSlice";

export const store = configureStore({
  reducer: {
    login: loginReducer,
    register: registerReducer,
    profile: profileReducer,
    education: educationReducer,
    groups: groupsReducer,
    timer: timerReducer,
    goals: goalsReducer,
    todos: todoReducer,

    chat: chatReducer,
    studyDashboard: dashboardReducer,

    company: companyReducer,
    companyUser: userReducer,
    posts: postsReducer,
    activity: activityReducer,
    analytics: analyticsReducer,
    inbox: inboxReducer,
    jobs: companyJobsReducer,
    jobBoard: jobsReducer,
    employees: employeesReducer,
    events: eventsReducer,

    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these paths in serialization check
        ignoredActions: [
          //auth
          "auth/login/fulfilled",
          "auth/register/fulfilled",

          //profile
          "profile/fetchUserProfile/fulfilled",
          "education/fetchAll/fulfilled",

          //company
          "company/fetchById/fulfilled",
          "company/fetchEmployees/fulfilled",
          "company/fetchPosts/fulfilled",
        ],
      },
    }),
  devTools: process.env.NODE_ENV !== "production",
});
console.log("STORE KEYS:", Object.keys(store.getState()));
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
