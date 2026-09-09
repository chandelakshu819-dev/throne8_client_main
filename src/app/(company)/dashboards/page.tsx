'use client';

import { useDashboard } from "@/features/company/hooks/useDashboard";
import QuickActions from '../../../features/company/components/dashboards/QuickActions';
import StatsGrid from '../../../features/company/components/dashboards/StatsGrid';
import FollowerChart from '../../../features/company/components/dashboards/FollowerChart';
import PendingActions from '../../../features/company/components/dashboards/PendingActions';
import TopPosts from '../../../features/company/components/dashboards/TopPosts';
import ActivityFeed from '../../../features/company/components/dashboards/ActivityFeed';
import EngagementMetrics from '../../../features/company/components/dashboards/EngagementMetrics';

export default function DashboardPage() {
  const {
    userName,
    chartData,
    activeRange,
    handleRangeChange,
    stats,
    isLoadingStats,
    statsError,
    quickActions,
    topPosts,
    isLoadingTopPosts,
    topPostsError,
    activityFeed,
    isLoadingActivities,
    activityError,
    engagementMetrics,
    pendingItems,
  } = useDashboard();

  return (
    <div className="space-y-6">

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

      <StatsGrid stats={stats} isLoading={isLoadingStats} error={statsError} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <FollowerChart
          data={chartData}
          activeRange={activeRange}
          onRangeChange={handleRangeChange}
        />
        <PendingActions items={pendingItems} />
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