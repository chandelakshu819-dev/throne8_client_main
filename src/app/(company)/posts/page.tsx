'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAppDispatch, useAppSelector } from '@/core/store/store.hooks';
import {
  addPost, deletePost, toggleLike,
  setPosts, setPostsLoading, setPostsError,
} from '@/features/company/store/slices/postsSlice';
import type { Post } from '@/features/company/store/slices/postsSlice';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useProfile } from '@/features/profile/hooks/useProfile';
import CompanyService from '@/lib/api/company.service';
import PostStats from '@/features/company/components/posts/PostStats';
import PostCard from '@/features/company/components/posts/PostCard';

const CreatePostModal = dynamic(() => import('../../../features/company/modal/CreatePostModal'), {
  loading: () => null,
});

type TabKey = 'all' | 'published' | 'draft' | 'scheduled' | 'images' | 'videos' | 'documents' | 'employee-posts' | 'polls';

const TABS: TabKey[] = ['all', 'published', 'draft', 'scheduled', 'images', 'videos', 'documents', 'employee-posts', 'polls'];

export type { Post };

interface EmployeeOption {
  id: string;
  name: string;
  title: string;
}

// Backend post → Redux Post
function transform(bp: any): Post {
  return {
    id: bp._id,
    postId: bp.postId,
    title: bp.title || '',
    text: bp.content || '',
    image: bp.media?.find((m: any) => m.type === 'Image')?.url,
    images: bp.media?.filter((m: any) => m.type === 'Image').map((m: any) => m.url) || [],
    videos: bp.media?.filter((m: any) => m.type === 'Video').map((m: any) => m.url) || [],
    documents: bp.documents || [],
    hasPoll: bp.hasPoll || false,
    pollData: bp.pollData ? {
      ...bp.pollData,
      endsAt: bp.pollData.endsAt?.toString() || '',
    } : undefined,
    likes: bp.engagementMetrics?.likesCount || 0,
    comments: bp.engagementMetrics?.commentsCount || 0,
    reposts: bp.engagementMetrics?.sharesCount || 0,
    time: bp.createdAt
      ? new Date(bp.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      : 'Recently',
    liked: false,
    status: (bp.status?.toLowerCase() || 'draft') as Post['status'],
    type: bp.type,
    company: bp.company,
    author: bp.author,
    tags: bp.tags || [],
    createdAt: bp.createdAt,
  };
}

export default function PostsPage() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const posts = useAppSelector(s => s.posts?.items ?? []);
  const loading = useAppSelector(s => s.posts?.loading ?? false);
  const { userProfileData, loadProfile } = useProfile();

  const companyId = userProfileData?.companyId ?? null;

  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [showModal, setShowModal] = useState(false);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);

  // Load profile
  useEffect(() => { if (user) loadProfile(); }, [user]);

  // Fetch posts + employees when companyId ready
  useEffect(() => {
    if (!companyId) return;

    (async () => {
      dispatch(setPostsLoading(true));
      try {
        // Posts
        const postsRes = await CompanyService.getPostsByCompany(companyId);
        const rawList: any[] =
          postsRes?.data?.items ||
          postsRes?.data?.posts ||
          postsRes?.items ||
          [];
        dispatch(setPosts(rawList.map(transform)));

        // Employees (for author dropdown)
        const empRes = await CompanyService.getAllEmployees(companyId);
        const empList: any[] =
          empRes?.data?.result ||
          empRes?.data?.items ||
          empRes?.data ||
          [];
        setEmployees(empList.map((e: any) => ({
          id: e.employeeId,
          name: `${e.firstName} ${e.lastName}`,
          title: e.designation || '',
        })));

      } catch (err: any) {
        dispatch(setPostsError(err.message || 'Failed to load'));
      }
    })();
  }, [companyId, dispatch]);

  // ✅ ADD: handlePublish function
  const handlePublish = useCallback(async (postId: string) => {
    try {
      await CompanyService.publishPost(postId);

      // Redux store mein status update karo
      dispatch(setPosts(
        posts.map(p =>
          (p.postId === postId || p.id === postId)
            ? { ...p, status: 'published' as Post['status'] }
            : p
        )
      ));
    } catch (err: any) {
      console.error('Publish failed:', err.message);
    }
  }, [dispatch, posts]);

  // Tab filter
  const filtered = useMemo(() => {
    if (activeTab === 'all') return posts;
    if (activeTab === 'images') return posts.filter(p => p.images?.length);
    if (activeTab === 'videos') return posts.filter(p => p.videos?.length);
    if (activeTab === 'documents') return posts.filter(p => p.documents?.length);
    if (activeTab === 'employee-posts') return posts.filter(p => p.author?._id !== user?._id);
    if (activeTab === 'polls') return posts.filter(p => p.hasPoll);
    return posts.filter(p => p.status === activeTab);
  }, [activeTab, posts, user?._id]);

  const counts = useMemo(() => ({
    published: posts.filter(p => p.status === 'published').length,
    draft: posts.filter(p => p.status === 'draft').length,
    scheduled: posts.filter(p => p.status === 'scheduled').length,
    documents: posts.filter(p => p.documents?.length).length,
    comments: 0,
    images: posts.filter(p => p.images?.length).length,
    videos: posts.filter(p => p.videos?.length).length,
    'employee-posts': posts.filter(p => p.author?._id !== user?._id).length,
    polls: posts.filter(p => p.hasPoll).length,
 }), [posts, user?._id]);

  const openModal = useCallback(() => setShowModal(true), []);
  const closeModal = useCallback(() => setShowModal(false), []);
  const handleAdd = useCallback((p: Post) => dispatch(addPost(p)), [dispatch]);
  const handleDel = useCallback((id: string) => dispatch(deletePost(id)), [dispatch]);
  const handleLike = useCallback((id: string) => dispatch(toggleLike(id)), [dispatch]);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#4a3728]">Posts</h1>
          <p className="text-sm text-[#4a3728]/60 mt-0.5">Manage and publish your company posts</p>
        </div>
        <button onClick={openModal}
          className="flex items-center gap-2 bg-[#4a3728] text-[#f6ede8] px-4 py-2.5 rounded-xl
                     text-sm font-semibold hover:bg-[#6b4e3d] transition-all shadow-md">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Post
        </button>
      </div>

      <PostStats counts={counts} />

      {/* Tabs */}
      <div className="flex gap-1 bg-[#e0d8cf]/50 rounded-xl p-1 w-fit flex-wrap">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg capitalize transition-all
              ${activeTab === tab
                ? 'bg-[#4a3728] text-[#f6ede8] shadow-sm'
                : 'text-[#4a3728]/60 hover:text-[#4a3728]'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#4a3728]/20 border-t-[#4a3728] rounded-full animate-spin" />
        </div>
      )}

      {/* Posts */}
      {!loading && (
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-[#4a3728]/40">
              <svg className="w-14 h-14 mx-auto mb-3 opacity-25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <p className="text-sm font-medium">No posts yet</p>
              <p className="text-xs mt-1 opacity-70">Create your first post to get started</p>
            </div>
          ) : (
            filtered.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onDelete={handleDel}
                onToggleLike={handleLike}
                onPublish={handlePublish}
              />
            ))
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && companyId && (
        <CreatePostModal
          onClose={closeModal}
          onAdd={handleAdd}
          companyId={companyId}
          employees={employees}
        />
      )}
    </div>
  );
}