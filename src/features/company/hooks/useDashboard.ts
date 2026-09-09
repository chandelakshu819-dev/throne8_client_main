import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useAppSelector } from '@/core/store/store.hooks';
import { useProfile } from '@/features/profile/hooks/useProfile';
import CompanyService from '@/lib/api/company.service';
import type { PendingItem } from '../components/company/PendingActions';
import type { TopPost } from '../components/company/TopPosts';
import type { ActivityItem } from '../components/company/ActivityFeed';
import { ENGAGEMENT_METRICS, MONTHLY_DATA, QUICK_ACTIONS, STATS, WEEKLY_DATA } from '../types';

function timeAgo(dateInput: Date | string | number | undefined): string {
  if (!dateInput) return 'Recently';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Recently';
  const now = new Date();
  const seconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

// ── Hook ──────────────────────────────────────────────────────

export function useDashboard(companyIdOverride?: string) {
  const user = useAppSelector(s => s.login.user);
  const unreadMsgs = useAppSelector(s => s.inbox.unreadCount);
  const jobItems = useAppSelector(s => s.jobs.items);
  const activityItems = useAppSelector(s => s.activity.items);

  const params = useParams();
  const { userProfileData, loadProfile } = useProfile();

  const [activeRange, setActiveRange] = useState<'week' | 'month'>('week');

  // Real data states
  const [topPosts, setTopPosts] = useState<TopPost[]>([]);
  const [isLoadingTopPosts, setIsLoadingTopPosts] = useState<boolean>(true);
  const [topPostsError, setTopPostsError] = useState<string | null>(null);

  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState<boolean>(true);
  const [activityError, setActivityError] = useState<string | null>(null);

  // Resolved dynamic companyId
  const [resolvedCompanyId, setResolvedCompanyId] = useState<string | null>(null);

  // Load user profile if missing
  useEffect(() => {
    if (user && !userProfileData?.companyId) {
      loadProfile();
    }
  }, [user, userProfileData?.companyId]);

  // Determine dynamic company ID
  useEffect(() => {
    let isCancelled = false;

    async function resolveCompany() {
      // 1. Explicit override passed as parameter
      if (companyIdOverride) {
        if (!isCancelled) setResolvedCompanyId(companyIdOverride);
        return;
      }

      // 2. From URL route params
      const routeParam = (params?.userid || params?.id || params?.companyId) as string | undefined;

      // If route param exists and is distinct from the logged-in user ID, treat as company ID/slug
      const userId = user?.userId || (user as any)?.id;
      if (routeParam && routeParam !== userId) {
        if (!isCancelled) setResolvedCompanyId(routeParam);
        return;
      }

      // 3. From user profile companyId
      if (userProfileData?.companyId) {
        if (!isCancelled) setResolvedCompanyId(userProfileData.companyId);
        return;
      }

      // 4. If route param was user's own ID, but profile companyId not loaded yet, wait or check if routeParam is valid company
      if (routeParam) {
        if (!isCancelled) setResolvedCompanyId(routeParam);
        return;
      }

      // 5. Fallback: fetch user's companies via getAllCompanies
      try {
        const allCompRes = await CompanyService.getAllCompanies();
        const compList: any[] =
          allCompRes?.data?.companies ||
          allCompRes?.data?.items ||
          allCompRes?.data ||
          allCompRes?.companies ||
          [];
        if (compList.length > 0 && !isCancelled) {
          const firstCompId = compList[0]._id || compList[0].id || compList[0].companyId;
          setResolvedCompanyId(firstCompId);
        }
      } catch {
        // Handled in individual fetch calls
      }
    }

    resolveCompany();

    return () => {
      isCancelled = true;
    };
  }, [companyIdOverride, params, user, userProfileData?.companyId]);

  // Fetch real Top Posts
  useEffect(() => {
    if (!resolvedCompanyId) return;

    let isCancelled = false;

    async function fetchTopPosts() {
      setIsLoadingTopPosts(true);
      setTopPostsError(null);

      try {
        const res = await CompanyService.getPostsByCompany(resolvedCompanyId!, 1, 5, 'top');
        if (isCancelled) return;

        const rawList: any[] =
          res?.data?.items ||
          res?.data?.posts ||
          res?.items ||
          res?.data ||
          (Array.isArray(res) ? res : []);

        if (!Array.isArray(rawList) || rawList.length === 0) {
          setTopPosts([]);
          return;
        }

        // Sort by highest engagement: views + likes + comments descending
        const sortedList = [...rawList].sort((a, b) => {
          const aEng =
            Number(a.engagementMetrics?.likesCount ?? a.likes ?? 0) * 2 +
            Number(a.engagementMetrics?.commentsCount ?? a.comments ?? 0) * 3 +
            Number(a.engagementMetrics?.viewsCount ?? a.views ?? 0);
          const bEng =
            Number(b.engagementMetrics?.likesCount ?? b.likes ?? 0) * 2 +
            Number(b.engagementMetrics?.commentsCount ?? b.comments ?? 0) * 3 +
            Number(b.engagementMetrics?.viewsCount ?? b.views ?? 0);
          return bEng - aEng;
        });

        const formattedPosts: TopPost[] = sortedList.slice(0, 5).map((post: any) => {
          const rawTitle = post.title?.trim();
          const rawContent = post.content?.trim();
          let displayTitle = rawTitle;
          if (!displayTitle && rawContent) {
            displayTitle = rawContent.length > 60 ? `${rawContent.slice(0, 60)}...` : rawContent;
          }
          if (!displayTitle) {
            displayTitle = 'Company Post';
          }

          return {
            id: String(post.postId || post._id || post.id),
            title: displayTitle,
            impressions: Number(post.engagementMetrics?.viewsCount ?? post.views ?? 0),
            likes: Number(post.engagementMetrics?.likesCount ?? post.likes ?? 0),
            comments: Number(post.engagementMetrics?.commentsCount ?? post.comments ?? 0),
            date: timeAgo(post.createdAt || post.publishedAt),
          };
        });

        setTopPosts(formattedPosts);
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Error fetching real company top posts:', err);
          setTopPostsError(err.message || 'Failed to load top posts');
          setTopPosts([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingTopPosts(false);
        }
      }
    }

    fetchTopPosts();

    return () => {
      isCancelled = true;
    };
  }, [resolvedCompanyId]);

  // Fetch real Recent Activity
  useEffect(() => {
    if (!resolvedCompanyId) return;

    let isCancelled = false;

    async function fetchRecentActivity() {
      setIsLoadingActivities(true);
      setActivityError(null);

      try {
        const res = await CompanyService.getCompanyActivities(resolvedCompanyId!);
        if (isCancelled) return;

        const rawList: any[] =
          res?.data ||
          res?.activities ||
          (Array.isArray(res) ? res : []);

        if (!Array.isArray(rawList) || rawList.length === 0) {
          setActivityFeed([]);
          return;
        }

        const formattedActivities: ActivityItem[] = rawList.slice(0, 6).map((act: any) => {
          const rawUser = String(act.user || 'Member');
          const displayUser = rawUser.includes('@') ? rawUser.split('@')[0] : rawUser;
          let displayAction = String(act.action || 'interacted with your company');

          // Clean up GIF URLs and long links in activity text
          if (displayAction.includes('[GIF] http')) {
            displayAction = displayAction.replace(/\[GIF\]\s*https?:\/\/\S+/i, 'sent a GIF');
          } else if (displayAction.includes('http://') || displayAction.includes('https://')) {
            displayAction = displayAction.replace(/https?:\/\/\S+/g, '[Link]');
          }

          let avatarText = String(act.avatar || '');
          if (!avatarText || avatarText === 'US') {
            avatarText = displayUser.slice(0, 2).toUpperCase();
          }

          return {
            id: String(act.id || act.activityId || act._id),
            type: act.type || 'activity',
            user: displayUser,
            action: displayAction,
            time: String(act.time || (act.createdAt ? timeAgo(act.createdAt) : 'Recently')),
            avatar: avatarText,
            color: String(act.color || 'bg-[#4a3728]'),
          };
        });

        setActivityFeed(formattedActivities);
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Error fetching real company activities:', err);
          setActivityError(err.message || 'Failed to load recent activity');
          setActivityFeed([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingActivities(false);
        }
      }
    }

    fetchRecentActivity();

    return () => {
      isCancelled = true;
    };
  }, [resolvedCompanyId]);

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
    // Dynamic company
    companyId: resolvedCompanyId,
    // Chart
    chartData,
    activeRange,
    handleRangeChange,

    // Static / metrics
    stats: STATS,
    quickActions: QUICK_ACTIONS,
    engagementMetrics: ENGAGEMENT_METRICS,

    // Real dynamic data from database
    topPosts,
    isLoadingTopPosts,
    topPostsError,

    activityFeed,
    isLoadingActivities,
    activityError,

    // Dynamic — derived from Redux
    pendingItems,
  };
}