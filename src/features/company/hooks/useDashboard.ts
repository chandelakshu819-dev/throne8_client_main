import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useAppSelector } from '@/core/store/store.hooks';
import { useProfile } from '@/features/profile/hooks/useProfile';
import CompanyService from '@/lib/api/company.service';
import type { PendingItem } from '../components/company/PendingActions';
import type { TopPost } from '../components/company/TopPosts';
import type { ActivityItem } from '../components/company/ActivityFeed';
import type { Stat } from '../components/company/StatsGrid';
import { ENGAGEMENT_METRICS, MONTHLY_DATA, QUICK_ACTIONS, WEEKLY_DATA } from '../types';

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

// SVG icon paths for the 4 stat cards
const STAT_ICONS = {
  views: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  impressions: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  followers: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
};

/**
 * Format a number for display: 28400 → "28.4K", 3282 → "3,282", 0 → "0"
 */
function formatStatValue(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 10_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

/**
 * Format a percentage change for display.
 * Returns null if change is null (no historical data).
 */
function formatChange(change: number | null): { text: string; up: boolean } | null {
  if (change === null || change === undefined) return null;
  const prefix = change >= 0 ? '+' : '';
  return {
    text: `${prefix}${change}%`,
    up: change >= 0,
  };
}

// ── Hook ──────────────────────────────────────────────────────

export function useDashboard(companyIdOverride?: string) {
  const user = useAppSelector(s => s.login.user);

  const params = useParams();
  const { userProfileData, loadProfile } = useProfile();

  const [activeRange, setActiveRange] = useState<'week' | 'month'>('week');

  // Real stats data states
  const [stats, setStats] = useState<Stat[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Real data states
  const [topPosts, setTopPosts] = useState<TopPost[]>([]);
  const [isLoadingTopPosts, setIsLoadingTopPosts] = useState<boolean>(true);
  const [topPostsError, setTopPostsError] = useState<string | null>(null);

  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState<boolean>(true);
  const [activityError, setActivityError] = useState<string | null>(null);

  // Real Action Needed states (100% database driven)
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [isLoadingPendingActions, setIsLoadingPendingActions] = useState<boolean>(true);
  const [pendingActionsError, setPendingActionsError] = useState<string | null>(null);

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

  // Fetch real Dashboard Card Stats (Profile Views, Post Impressions, Followers, Search Appearances)
  useEffect(() => {
    if (!resolvedCompanyId) return;

    let isCancelled = false;

    async function fetchDashboardCardStats() {
      setIsLoadingStats(true);
      setStatsError(null);

      try {
        const res = await CompanyService.getDashboardCardStats(resolvedCompanyId!, 30);
        if (isCancelled) return;

        const data = res?.data;

        if (!data) {
          // No data returned — show empty state
          setStats([
            { id: 'views', label: 'Profile Views', value: '0', change: '', up: true, icon: STAT_ICONS.views },
            { id: 'impressions', label: 'Post Impressions', value: '0', change: '', up: true, icon: STAT_ICONS.impressions },
            { id: 'followers', label: 'Followers', value: '0', change: '', up: true, icon: STAT_ICONS.followers },
            { id: 'search', label: 'Search Appearances', value: '0', change: '', up: true, icon: STAT_ICONS.search },
          ]);
          return;
        }

        const profileViewsChange = formatChange(data.profileViews?.change);
        const impressionsChange = formatChange(data.postImpressions?.change);
        const followersChange = formatChange(data.followers?.change);
        const searchChange = formatChange(data.searchAppearances?.change);

        const realStats: Stat[] = [
          {
            id: 'views',
            label: 'Profile Views',
            value: formatStatValue(data.profileViews?.value ?? 0),
            change: profileViewsChange?.text ?? '',
            up: profileViewsChange?.up ?? true,
            icon: STAT_ICONS.views,
          },
          {
            id: 'impressions',
            label: 'Post Impressions',
            value: formatStatValue(data.postImpressions?.value ?? 0),
            change: impressionsChange?.text ?? '',
            up: impressionsChange?.up ?? true,
            icon: STAT_ICONS.impressions,
          },
          {
            id: 'followers',
            label: 'Followers',
            value: formatStatValue(data.followers?.value ?? 0),
            change: followersChange?.text ?? '',
            up: followersChange?.up ?? true,
            icon: STAT_ICONS.followers,
          },
          {
            id: 'search',
            label: 'Search Appearances',
            value: formatStatValue(data.searchAppearances?.value ?? 0),
            change: searchChange?.text ?? '',
            up: searchChange?.up ?? true,
            icon: STAT_ICONS.search,
          },
        ];

        setStats(realStats);
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Error fetching dashboard card stats:', err);
          setStatsError(err.message || 'Failed to load stats');
          // Show empty values on error — no fake fallbacks
          setStats([
            { id: 'views', label: 'Profile Views', value: '—', change: '', up: true, icon: STAT_ICONS.views },
            { id: 'impressions', label: 'Post Impressions', value: '—', change: '', up: true, icon: STAT_ICONS.impressions },
            { id: 'followers', label: 'Followers', value: '—', change: '', up: true, icon: STAT_ICONS.followers },
            { id: 'search', label: 'Search Appearances', value: '—', change: '', up: true, icon: STAT_ICONS.search },
          ]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingStats(false);
        }
      }
    }

    fetchDashboardCardStats();

    return () => {
      isCancelled = true;
    };
  }, [resolvedCompanyId]);

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

  // Fetch real Action Needed items (100% database driven)
  useEffect(() => {
    if (!resolvedCompanyId) return;

    let isCancelled = false;

    async function fetchActionNeeded() {
      setIsLoadingPendingActions(true);
      setPendingActionsError(null);

      try {
        const res = await CompanyService.getActionNeeded(resolvedCompanyId!);
        if (isCancelled) return;

        const rawItems: PendingItem[] = res?.data?.items || res?.items || [];
        if (Array.isArray(rawItems)) {
          setPendingItems(rawItems);
        } else {
          setPendingItems([]);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Error fetching action needed items:', err);
          setPendingActionsError(err.message || 'Failed to load action needed items');
          setPendingItems([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingPendingActions(false);
        }
      }
    }

    fetchActionNeeded();

    return () => {
      isCancelled = true;
    };
  }, [resolvedCompanyId]);

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

    // Real stats from API (no hardcoded fallbacks)
    stats,
    isLoadingStats,
    statsError,

    // Static quick actions & engagement (not part of this change)
    quickActions: QUICK_ACTIONS,
    engagementMetrics: ENGAGEMENT_METRICS,

    // Real dynamic data from database
    topPosts,
    isLoadingTopPosts,
    topPostsError,

    activityFeed,
    isLoadingActivities,
    activityError,

    // Real dynamic Action Needed items from database
    pendingItems,
    isLoadingPendingActions,
    pendingActionsError,
  };
}