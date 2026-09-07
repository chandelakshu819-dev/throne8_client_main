'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import ActivityHeader from '@/features/company/components/activity/ActivityHeader';
import ActivityFilters, { FilterValue } from '@/features/company/components/activity/ActivityFilters';
import ActivityList from '@/features/company/components/activity/ActivityList';
import { ActivityItemData } from '@/features/company/components/activity/ActivityItem';
import { useAppDispatch, useAppSelector } from '@/core/store/store.hooks';
import { markRead, markAllRead as markAllReadAction, addResponse, setActivities, deleteActivity, deleteAllActivities, getStoredReadIds, getStoredResponses, getStoredDeletedIds } from '@/features/company/store/slices/activitySlice';
import CompanyService from '@/lib/api/company.service';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function ActivityPage() {
  const dispatch = useAppDispatch();
  const activities = useAppSelector(s => s.activity?.items ?? []);
  const isLoaded = useAppSelector(s => s.activity?.isLoaded ?? false);
  const { user } = useAuth();
  const { userProfileData, loadProfile } = useProfile();

  const [filter, setFilter] = useState<FilterValue>('all');
  const [loading, setLoading] = useState(!isLoaded);
  const [postedResponses, setPostedResponses] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  useEffect(() => {
    let isSubscribed = true;

    async function fetchRealActivities(isInitial = false) {
      if (isInitial) setLoading(true);
      try {
        let activeCompanyId = userProfileData?.companyId;

        if (!activeCompanyId) {
          const allCompRes = await CompanyService.getAllCompanies();
          const compList: any[] =
            allCompRes?.data?.companies ||
            allCompRes?.data?.items ||
            allCompRes?.data ||
            allCompRes?.companies ||
            [];
          if (compList.length > 0) {
            activeCompanyId = compList[0]._id || compList[0].id || compList[0].companyId;
          }
        }

        const storedReadIds = getStoredReadIds();
        const storedResponses = getStoredResponses();
        const storedDeletedIds = getStoredDeletedIds();
        const realActivities: ActivityItemData[] = [];

        if (activeCompanyId) {
          // 1. Fetch Real Posts & Post Comments/Likes
          try {
            const postsRes = await CompanyService.getPostsByCompany(activeCompanyId);
            const postsList: any[] = postsRes?.data?.items || postsRes?.data?.posts || postsRes?.items || postsRes?.data || [];

            for (const post of postsList) {
              const postId = post._id || post.id || post.postId;
              const postTitle = post.title || (post.content ? post.content.slice(0, 35) + '...' : 'Company Post');

              // Fetch real comments for this post
              try {
                const commentsRes = await CompanyService.getPostComments(postId);
                const comments: any[] = commentsRes?.data || commentsRes?.items || commentsRes || [];
                if (Array.isArray(comments)) {
                  comments.forEach((c: any) => {
                    const authorName = c.userName || (c.user ? `${c.user.firstName} ${c.user.lastName}` : 'Member');
                    const itemId = `comment-${c._id || c.id || c.commentId || Date.now()}`;
                    if (!storedDeletedIds.has(itemId)) {
                      realActivities.push({
                        id: itemId,
                        type: 'comment',
                        user: authorName,
                        avatar: authorName.slice(0, 2).toUpperCase(),
                        color: 'bg-[#4a3728]',
                        action: `commented: "${c.text || c.content || ''}" on post "${postTitle}"`,
                        time: c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recently',
                        read: storedReadIds.has(itemId),
                      });
                    }
                  });
                }
              } catch (e) {}

              // Real Likes activity
              if (post.engagementMetrics?.likesCount > 0 || post.likes > 0) {
                const likesCount = post.engagementMetrics?.likesCount || post.likes;
                const itemId = `like-${postId}`;
                if (!storedDeletedIds.has(itemId)) {
                  realActivities.push({
                    id: itemId,
                    type: 'like',
                    user: `${likesCount} User${likesCount > 1 ? 's' : ''}`,
                    avatar: '👍',
                    color: 'bg-blue-600',
                    action: `liked your post "${postTitle}"`,
                    time: post.createdAt ? new Date(post.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recently',
                    read: storedReadIds.has(itemId),
                  });
                }
              }
            }
          } catch (e) {}

          // 2. Fetch Real Testimonials (Reviews)
          try {
            const testRes = await CompanyService.getTestimonials(activeCompanyId);
            const testimonials: any[] = testRes?.data?.testimonials || testRes?.data || testRes || [];
            if (Array.isArray(testimonials)) {
              testimonials.forEach((t: any) => {
                const itemId = `review-${t._id || t.id}`;
                if (!storedDeletedIds.has(itemId)) {
                  const respText = storedResponses[itemId];
                  realActivities.push({
                    id: itemId,
                    type: 'review',
                    user: t.authorName || 'Verified Employee',
                    avatar: (t.authorName || 'VE').slice(0, 2).toUpperCase(),
                    color: 'bg-amber-500',
                    action: `left a ${t.rating || 5}★ review on your company`,
                    time: t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recently',
                    read: storedReadIds.has(itemId),
                    postedResponse: respText,
                    review: {
                      rating: t.rating || 5,
                      title: t.authorTitle || 'Employee Review',
                      content: t.message || '',
                      isAnonymous: !t.authorName,
                      isVerified: true,
                      sentiment: (t.rating >= 4 ? 'positive' : t.rating === 3 ? 'neutral' : 'negative'),
                      existingResponse: respText || t.existingResponse,
                    },
                  });
                }
              });
            }
          } catch (e) {}

          // 3. Fetch Real Employees (Job Applicants)
          try {
            const empRes = await CompanyService.getAllEmployees(activeCompanyId);
            const empList: any[] = empRes?.data?.result || empRes?.data?.items || empRes?.data || [];
            if (Array.isArray(empList)) {
              empList.forEach((emp: any) => {
                const empName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Candidate';
                const itemId = `emp-${emp._id || emp.id || emp.employeeId}`;
                if (!storedDeletedIds.has(itemId)) {
                  realActivities.push({
                    id: itemId,
                    type: 'apply',
                    user: empName,
                    avatar: empName.slice(0, 2).toUpperCase(),
                    color: 'bg-emerald-600',
                    action: `applied to "${emp.designation || 'Team Role'}"`,
                    time: emp.joinDate ? new Date(emp.joinDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recently',
                    read: storedReadIds.has(itemId),
                  });
                }
              });
            }
          } catch (e) {}

          // 4. Fetch Real Events
          try {
            const evRes = await CompanyService.getAllEvents();
            const evList: any[] = evRes?.data?.items || evRes?.data?.events || evRes?.data || [];
            if (Array.isArray(evList)) {
              evList.forEach((ev: any) => {
                const itemId = `event-${ev._id || ev.id}`;
                if (!storedDeletedIds.has(itemId)) {
                  realActivities.push({
                    id: itemId,
                    type: 'event',
                    user: 'Network User',
                    avatar: '📅',
                    color: 'bg-indigo-600',
                    action: `registered for "${ev.title || ev.eventName || 'Company Event'}"`,
                    time: 'Recently',
                    read: storedReadIds.has(itemId),
                  });
                }
              });
            }
          } catch (e) {}
        }

        if (isSubscribed) {
          dispatch(setActivities(realActivities));
        }

      } catch (err) {
        console.error('Failed to fetch real company activities:', err);
      } finally {
        if (isSubscribed && isInitial) {
          setLoading(false);
        }
      }
    }

    fetchRealActivities(true);
    const timer = setInterval(() => {
      fetchRealActivities(false);
    }, 4000);

    return () => {
      isSubscribed = false;
      clearInterval(timer);
    };
  }, [userProfileData?.companyId, dispatch]);

  const unreadCount = useMemo(() => activities.filter(a => !a.read).length, [activities]);

  const filtered = useMemo(() => {
    if (filter === 'all') return activities;
    if (filter === 'unread') return activities.filter(a => !a.read);
    return activities.filter(a => a.type === filter);
  }, [activities, filter]);

  const markReadHandler = useCallback((id: string) => {
    dispatch(markRead(id));
  }, [dispatch]);

  const handleMarkAllRead = useCallback(() => {
    dispatch(markAllReadAction());
  }, [dispatch]);

  const handleDeleteActivity = useCallback((id: string) => {
    dispatch(deleteActivity(id));
  }, [dispatch]);

  const handleDeleteAllActivities = useCallback(() => {
    dispatch(deleteAllActivities());
  }, [dispatch]);

  const handleRespond = useCallback((id: string, text: string) => {
    setPostedResponses(prev => ({ ...prev, [id]: text }));
    dispatch(addResponse({ id, text }));
  }, [dispatch]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <ActivityHeader
        unreadCount={unreadCount}
        totalCount={activities.length}
        onMarkAllRead={handleMarkAllRead}
        onDeleteAll={handleDeleteAllActivities}
      />
      <ActivityFilters active={filter} unreadCount={unreadCount} onChange={setFilter} />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <div className="w-8 h-8 border-3 border-[#4a3728]/20 border-t-[#4a3728] rounded-full animate-spin" />
          <p className="text-xs font-semibold text-[#4a3728]/60">Loading real company activities...</p>
        </div>
      ) : (
        <ActivityList
          items={filtered}
          postedResponses={postedResponses}
          onMarkRead={markReadHandler}
          onRespond={handleRespond}
          onDelete={handleDeleteActivity}
        />
      )}
    </div>
  );
}