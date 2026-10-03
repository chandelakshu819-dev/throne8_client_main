"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Clock,
  Award,
  BookOpen,
  Target,
  Trophy,
  GraduationCap,
  AlertCircle,
  TrendingUp,
  Flame,
  CheckCircle,
  BarChart2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { useAppDispatch, useAppSelector } from "@/core/store/store.hooks";
import {
  fetchUserDashboardThunk,
  fetchStudyStatisticsThunk,
  fetchPerformanceAnalyticsThunk,
  fetchMyGroupsThunk,
} from "@/hooks/studyGroup/features/studentDashboard/dashboard.thunks";
import {
  selectDashboardStats,
  selectStudyStatistics,
  selectPerformanceAnalytics,
  selectDashboardMyGroups,
  selectDashboardLoading,
  selectDashboardUser,
} from "@/hooks/studyGroup/features/studentDashboard/dashboard.Slice";
import SkeletonLoader from "@/app/loading";
import { StatsPeriod, MainTab } from "@/features/studyGroup/types";
import { useGroupData } from "@/features/study-group/hooks/useGroupData";

export default function StudentDashboard() {
  const dispatch = useAppDispatch();
  const { getUserInfo } = useGroupData();
  const [mainTab, setMainTab] = useState<MainTab>("overview");
  const [period, setPeriod] = useState<StatsPeriod>("7days");

  const user = useAppSelector(selectDashboardUser);
  const stats = useAppSelector(selectDashboardStats);
  const statistics = useAppSelector(selectStudyStatistics);
  const analytics = useAppSelector(selectPerformanceAnalytics);
  const myGroups = useAppSelector(selectDashboardMyGroups);
  const loading = useAppSelector(selectDashboardLoading);
  const error = useAppSelector((state: any) => state?.studyDashboard?.error);
  // useEffect(() => {
  //   dispatch(fetchUserDashboardThunk()).then((result: any) => {});
  // }, [dispatch]);

  useEffect(() => {
    dispatch(fetchUserDashboardThunk());
    dispatch(fetchPerformanceAnalyticsThunk());
    dispatch(fetchMyGroupsThunk());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchStudyStatisticsThunk(period));
  }, [period, dispatch]);

  if (loading && !user) {
    return <SkeletonLoader />;
  }

  const chartData =
    statistics?.statistics?.map((s: any) => ({
      // date: s.date.slice(5),
      date: String(s.date).slice(5),
      sessions: s.sessions,
      hours: s.hours,
    })) ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf8f5] to-[#f5f1ea] p-3 md:p-4">
      <div className="max-w-7xl mx-auto">
        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            Couldn't load some dashboard data: {error}
          </div>
        )}
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#4a3728] to-[#8b6f47] flex items-center justify-center text-white font-black text-lg flex-shrink-0">
            {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#4a3728]">
              {user?.name || user?.email?.split("@")[0] || "Student"}
            </h1>
            <div className="flex items-center gap-2 text-xs text-[#8b6f47]">
              <span>{user?.email}</span>
              {stats?.globalRank > 0 && (
                <>
                  <span>•</span>
                  <span>Rank #{stats.globalRank}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="flex gap-2 mb-4">
          {(["overview", "study-groups"] as MainTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setMainTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                mainTab === tab
                  ? "bg-gradient-to-r from-[#4a3728] to-[#8b6f47] text-white shadow-sm"
                  : "bg-white text-[#8b6f47] border border-[#d4a574]/30 hover:bg-[#faf8f5]"
              }`}
            >
              {tab === "overview" ? "Overview" : "Study Groups"}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {mainTab === "overview" && (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-white rounded-lg p-3 border border-[#d4a574]/30">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-[#8b6f47]" />
                  <span className="text-xs text-[#8b6f47]">Today</span>
                </div>
                <p className="text-2xl font-bold text-[#4a3728]">
                  {stats?.todayStudyHours?.toFixed(1) ?? "0"}h
                </p>
              </div>

              <div className="bg-white rounded-lg p-3 border border-[#d4a574]/30">
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-4 h-4 text-[#8b6f47]" />
                  <span className="text-xs text-[#8b6f47]">Streak</span>
                </div>
                <p className="text-2xl font-bold text-[#4a3728]">
                  {stats?.currentStreak ?? 0}d
                </p>
              </div>

              <div className="bg-white rounded-lg p-3 border border-[#d4a574]/30">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-[#8b6f47]" />
                  <span className="text-xs text-[#8b6f47]">Groups</span>
                </div>
                <p className="text-2xl font-bold text-[#4a3728]">
                  {stats?.activeGroups ?? 0}
                </p>
              </div>

              <div className="bg-white rounded-lg p-3 border border-[#d4a574]/30">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-[#8b6f47]" />
                  <span className="text-xs text-[#8b6f47]">Active Goals</span>
                </div>
                <p className="text-2xl font-bold text-[#4a3728]">
                  {stats?.activeGoals ?? 0}
                </p>
              </div>
            </div>

            {/* Analytics cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-white rounded-lg p-3 border border-[#d4a574]/30">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart2 className="w-4 h-4 text-[#8b6f47]" />
                  <span className="text-xs text-[#8b6f47]">Sessions</span>
                </div>
                <p className="text-2xl font-bold text-[#4a3728]">
                  {analytics?.totalSessions ?? 0}
                </p>
              </div>

              <div className="bg-white rounded-lg p-3 border border-[#d4a574]/30">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-4 h-4 text-[#8b6f47]" />
                  <span className="text-xs text-[#8b6f47]">Goals Done</span>
                </div>
                <p className="text-2xl font-bold text-[#4a3728]">
                  {analytics?.totalGoalsAchieved ?? 0}
                </p>
              </div>

              <div className="bg-white rounded-lg p-3 border border-[#d4a574]/30">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-[#8b6f47]" />
                  <span className="text-xs text-[#8b6f47]">Tasks Done</span>
                </div>
                <p className="text-2xl font-bold text-[#4a3728]">
                  {analytics?.totalTasksCompleted ?? 0}
                </p>
              </div>

              <div className="bg-white rounded-lg p-3 border border-[#d4a574]/30">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-[#8b6f47]" />
                  <span className="text-xs text-[#8b6f47]">Longest Streak</span>
                </div>
                <p className="text-2xl font-bold text-[#4a3728]">
                  {analytics?.longestStreak ?? 0}d
                </p>
              </div>
            </div>

            {/* Study Statistics Chart */}
            <div className="bg-white rounded-lg p-4 border border-[#d4a574]/30 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-[#4a3728]">
                  Study Statistics
                </h2>
                <div className="flex gap-1">
                  {(["7days", "30days", "90days"] as StatsPeriod[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        period === p
                          ? "bg-gradient-to-r from-[#4a3728] to-[#8b6f47] text-white"
                          : "bg-[#faf8f5] text-[#8b6f47] border border-[#d4a574]/30"
                      }`}
                    >
                      {p === "7days" ? "7D" : p === "30days" ? "30D" : "90D"}
                    </button>
                  ))}
                </div>
              </div>

              {chartData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-[#8b6f47] text-sm">
                  No study sessions yet for this period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f1ea" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#8b6f47" }}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "#8b6f47" }} />
                    <Tooltip
                      contentStyle={{
                        background: "#faf8f5",
                        border: "1px solid #d4a574",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="hours"
                      fill="#8b6f47"
                      radius={[4, 4, 0, 0]}
                      name="Hours"
                    />
                    <Bar
                      dataKey="sessions"
                      fill="#d4a574"
                      radius={[4, 4, 0, 0]}
                      name="Sessions"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}

        {/* STUDY GROUPS TAB */}
        {mainTab === "study-groups" && (
          <>
            {/* Groups stats */}
            <div className="grid grid-cols-3 gap-3 mb-4 max-w-3xl">
              <div className="bg-white rounded-lg p-3 border border-[#d4a574]/30">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-[#8b6f47]" />
                  <span className="text-xs text-[#8b6f47]">Total Groups</span>
                </div>
                <p className="text-2xl font-bold text-[#4a3728]">
                  {myGroups.length}
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-[#d4a574]/30">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-4 h-4 text-[#8b6f47]" />
                  <span className="text-xs text-[#8b6f47]">Active</span>
                </div>
                <p className="text-2xl font-bold text-[#4a3728]">
                  {myGroups.filter((g: any) => g.isActive).length}
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-[#d4a574]/30">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-[#8b6f47]" />
                  <span className="text-xs text-[#8b6f47]">Today Hours</span>
                </div>
                <p className="text-2xl font-bold text-[#4a3728]">
                  {stats?.todayStudyHours?.toFixed(1) ?? "0"}h
                </p>
              </div>
            </div>

            {/* Groups list */}
            {myGroups.length === 0 ? (
              <div className="bg-white rounded-lg p-8 border border-[#d4a574]/30 text-center">
                <Users className="w-10 h-10 text-[#d4a574] mx-auto mb-2" />
                <p className="text-[#4a3728] font-semibold">No groups yet</p>
                <p className="text-sm text-[#8b6f47] mt-1">
                  Join a study group to get started
                </p>
                <Link
                  href="/study/groups"
                  className="inline-block mt-3 px-4 py-2 bg-gradient-to-r from-[#4a3728] to-[#8b6f47] text-white text-sm rounded-lg"
                >
                  Browse Groups
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-lg p-4 border border-[#d4a574]/30">
                <h2 className="text-base font-bold text-[#4a3728] mb-3">
                  My Study Groups
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {myGroups.map((group: any) => (
                    <div
                      key={group.groupId}
                      className="border border-[#d4a574]/30 rounded-lg overflow-hidden hover:border-[#8b6f47] transition-colors"
                    >
                      <div className="bg-gradient-to-r from-[#4a3728] to-[#8b6f47] p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-white text-sm mb-1 truncate">
                              {group.title}
                            </h3>
                            <span className="inline-block bg-white/20 text-white px-2 py-0.5 rounded text-xs">
                              {group.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs bg-white/20 text-white rounded px-2 py-1 ml-2 flex-shrink-0">
                            <Users className="w-3 h-3" />
                            <span>{group.currentMemberCount}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3">
                        {group.description && (
                          <p className="text-xs text-[#8b6f47] mb-2 line-clamp-2">
                            {group.description}
                          </p>
                        )}

                        <div className="grid grid-cols-2 gap-1.5 mb-3">
                          <div className="bg-[#faf8f5] rounded p-1.5 text-center">
                            <p className="text-[10px] text-[#8b6f47]">
                              Capacity
                            </p>
                            <p className="text-xs font-bold text-[#4a3728]">
                              {group.currentMemberCount}/{group.capacity}
                            </p>
                          </div>
                          <div className="bg-[#faf8f5] rounded p-1.5 text-center">
                            <p className="text-[10px] text-[#8b6f47]">Role</p>
                            <p className="text-xs font-bold text-[#4a3728] capitalize">
                              {group.memberRole || "member"}
                            </p>
                          </div>
                        </div>

                        {group.tags && group.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {group.tags.slice(0, 3).map((tag: any, i: any) => (
                              <span
                                key={i}
                                className="text-[10px] px-1.5 py-0.5 bg-[#faf8f5] text-[#8b6f47] rounded"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <Link
                          href={`/study/my-groups/${group.groupId}`}
                          className="block w-full bg-gradient-to-r from-[#4a3728] to-[#8b6f47] hover:opacity-90 text-white font-medium py-1.5 rounded text-xs transition-all text-center"
                        >
                          View Group
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
