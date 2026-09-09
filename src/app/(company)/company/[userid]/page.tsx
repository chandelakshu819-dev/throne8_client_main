// src/app/(company)/company/[userid]/page.tsx
'use client';

import TopPosts from "@/features/company/components/company/TopPosts";
import ActivityFeed from "@/features/company/components/company/ActivityFeed";
import EngagementMetrics from "@/features/company/components/company/EngagementMetrics";
import FollowerChart from "@/features/company/components/company/FollowerChart";
import PendingActions from "@/features/company/components/company/PendingActions";
import QuickActions from "@/features/company/components/company/QuickActions";
import StatsGrid from "@/features/company/components/company/StatsGrid";
import { useDashboard } from "@/features/company/hooks/useDashboard";

export default function DashboardPage() {
  const {
    userName,
    chartData,
    activeRange,
    handleRangeChange,
    stats,
    quickActions,
    topPosts,
    isLoadingTopPosts,
    topPostsError,
    activityFeed,
    isLoadingActivities,
    activityError,
    engagementMetrics,
    pendingItems,
    isLoadingPendingActions,
    pendingActionsError,
  } = useDashboard();

  return (
    <div className="space-y-6 bg-white">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#4a3728]">Dashboard</h1>
          <p className="text-sm text-[#4a3728]/60 mt-0.5">
            Welcome back, {userName.split(' ')[0]}. Here&apos;s what&apos;s happening.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#e0d8cf]/60 rounded-xl px-3 py-1.5">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-[#4a3728]">Live</span>
        </div>
      </div>

      <QuickActions actions={quickActions} />

      <StatsGrid stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <FollowerChart
          data={chartData}
          activeRange={activeRange}
          onRangeChange={handleRangeChange}
        />
        <PendingActions
          items={pendingItems}
          isLoading={isLoadingPendingActions}
          error={pendingActionsError}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        <TopPosts
          posts={topPosts}
          isLoading={isLoadingTopPosts}
          error={topPostsError}
        />
        <ActivityFeed
          items={activityFeed}
          isLoading={isLoadingActivities}
          error={activityError}
        />
      </div>

      <EngagementMetrics metrics={engagementMetrics} />

    </div>
  );
}