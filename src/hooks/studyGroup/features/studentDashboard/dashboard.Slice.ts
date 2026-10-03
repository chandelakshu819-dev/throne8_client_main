import { createSlice } from "@reduxjs/toolkit";
import {
  UserDashboardResponse,
  StudyStatisticsResponse,
  PerformanceAnalyticsResponse,
  GroupResponse,
} from "@/lib/api/studyGroup.service";
import {
  fetchUserDashboardThunk,
  fetchStudyStatisticsThunk,
  fetchPerformanceAnalyticsThunk,
  fetchMyGroupsThunk,
} from "./dashboard.thunks";

interface DashboardState {
  userDashboard: UserDashboardResponse | null;
  statistics: StudyStatisticsResponse | null;
  analytics: PerformanceAnalyticsResponse | null;
  myGroups: GroupResponse[];
  loading: boolean;
  statisticsLoading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  userDashboard: null,
  statistics: null,
  analytics: null,
  myGroups: [],
  loading: false,
  statisticsLoading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: "studyDashboard",
  initialState,
  reducers: {
    clearDashboardError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserDashboardThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserDashboardThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.userDashboard = action.payload;
      })
      .addCase(fetchUserDashboardThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchStudyStatisticsThunk.pending, (state) => {
        state.statisticsLoading = true;
      })
      .addCase(fetchStudyStatisticsThunk.fulfilled, (state, action) => {
        state.statisticsLoading = false;
        state.statistics = action.payload;
      })
      .addCase(fetchStudyStatisticsThunk.rejected, (state, action) => {
        state.statisticsLoading = false;
        state.error = action.payload as string;
      });

    // builder
    //   .addCase(fetchPerformanceAnalyticsThunk.fulfilled, (state, action) => {
    //     state.analytics = action.payload;
    //   });

    builder
      .addCase(fetchPerformanceAnalyticsThunk.fulfilled, (state, action) => {
        state.analytics = action.payload;
      })
      .addCase(fetchPerformanceAnalyticsThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // builder
    //   .addCase(fetchMyGroupsThunk.fulfilled, (state, action) => {
    //     state.myGroups = action.payload;
    //   })
    //   .addMatcher(
    //     (action) => action.type.startsWith("dashboard/"),
    //     (state, action) => {}
    //   );

    builder
      .addCase(fetchMyGroupsThunk.fulfilled, (state, action) => {
        state.myGroups = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchMyGroupsThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addMatcher(
        (action) => action.type.startsWith("dashboard/"),
        () => {}
      );
  },
});

export const { clearDashboardError } = dashboardSlice.actions;

// REPLACE all selectors
export const selectUserDashboard = (state: any) =>
  state?.studyDashboard?.userDashboard ?? null;
export const selectDashboardStats = (state: any) =>
  state?.studyDashboard?.userDashboard?.stats ?? null;
export const selectDashboardUser = (state: any) =>
  state?.studyDashboard?.userDashboard?.user ?? null;
export const selectStudyStatistics = (state: any) =>
  state?.studyDashboard?.statistics ?? null;
export const selectPerformanceAnalytics = (state: any) =>
  state?.studyDashboard?.analytics ?? null;
export const selectDashboardMyGroups = (state: any) =>
  state?.studyDashboard?.myGroups ?? [];
export const selectDashboardLoading = (state: any) =>
  state?.studyDashboard?.loading ?? false;

export const dashboardReducer = dashboardSlice.reducer;
