import { useState, useMemo, useCallback } from 'react';
import { useAppSelector } from '@/core/store/store.hooks';
import type { PendingItem } from '../components/company/PendingActions';
import type { TopPost } from '../components/company/TopPosts';
import { ACTIVITY, ENGAGEMENT_METRICS, MONTHLY_DATA, QUICK_ACTIONS, STATS, WEEKLY_DATA } from '../types';


export const TOP_POSTS: TopPost[] = [
  { id: 'post-1', title: 'Throne8 launches AI-driven networking...', impressions: 4820, likes: 234, comments: 42, date: '2d ago' },
  { id: 'post-2', title: 'We are hiring! Join our engineering team...', impressions: 3210, likes: 187, comments: 31, date: '5d ago' },
  { id: 'post-3', title: 'Behind the scenes at our last hackathon...', impressions: 2890, likes: 156, comments: 28, date: '1w ago' },
];

// ── Hook ──────────────────────────────────────────────────────

export function useDashboard() {
  // Pull live counts from Redux slices so the dashboard reflects real state
 const user = useAppSelector(s => s.login.user);
  const unreadMsgs = useAppSelector(s => s.inbox.unreadCount);
  const jobItems = useAppSelector(s => s.jobs.items);
  const activityItems = useAppSelector(s => s.activity.items);

  const [activeRange, setActiveRange] = useState<'week' | 'month'>('week');

  // Chart data — switches based on selected range
  const chartData = useMemo(
    () => (activeRange === 'week' ? WEEKLY_DATA : MONTHLY_DATA),
    [activeRange]
  );

  // Pending actions — counts come from live Redux state
  const pendingItems = useMemo<PendingItem[]>(() => {
    const newApplications = jobItems.reduce((a, j) => a + j.applications, 0);
    const unreadActivity = activityItems.filter(a => !a.read).length;

    return [
      { id: 'p-1', label: "You haven't posted in 3 days", action: 'Create Post', href: '/posts', urgency: 'high' },
      { id: 'p-2', label: `${newApplications} new job applications waiting`, action: 'Review', href: '/jobs', urgency: 'high' },
      { id: 'p-3', label: `${unreadMsgs} unread messages`, action: 'Open Inbox', href: '/inbox', urgency: unreadMsgs > 0 ? 'medium' : 'low' },
      { id: 'p-4', label: 'Event "AI Summit" starts in 2 days', action: 'Manage', href: '/events', urgency: 'medium' },
      { id: 'p-5', label: 'Profile completion: 85%', action: 'Complete', href: '/edit', urgency: 'low' },
      ...(unreadActivity > 0
        ? [{ id: 'p-6', label: `${unreadActivity} unread activity items`, action: 'View', href: '/activity', urgency: 'low' as const }]
        : []),
    ];
  }, [jobItems, unreadMsgs, activityItems]);

  const handleRangeChange = useCallback((range: 'week' | 'month') => {
    setActiveRange(range);
  }, []);

  return {
    // User
   userName: user?.email || 'User',
    // Chart
    chartData,
    activeRange,
    handleRangeChange,

    // Static data (will come from API later)
    stats: STATS,
    quickActions: QUICK_ACTIONS,
    topPosts: TOP_POSTS,
    activityFeed: ACTIVITY,
    engagementMetrics: ENGAGEMENT_METRICS,

    // Dynamic — derived from Redux
    pendingItems,
  };
}