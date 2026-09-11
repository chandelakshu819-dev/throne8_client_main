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
import PostsRightSidebar from '@/features/company/components/posts/PostsRightSidebar';

const CreatePostModal = dynamic(() => import('../../../features/company/modal/CreatePostModal'), {
  loading: () => null,
});

type TabKey = 'all' | 'published' | 'draft' | 'scheduled' | 'images' | 'videos' | 'documents' | 'employee-posts' | 'polls';

type ModalMode = 'photo' | 'video' | 'document' | 'poll' | undefined;

const TAB_ITEMS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Draft' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'images', label: 'Images' },
  { key: 'videos', label: 'Videos' },
  { key: 'documents', label: 'Documents' },
  { key: 'employee-posts', label: 'Employee Posts' },
  { key: 'polls', label: 'Polls' },
];

export type { Post };

interface EmployeeOption {
  id: string;
  name: string;
  title: string;
}

// Backend post → Redux Post
function transform(bp: any): Post {
  return {
    id: bp._id || bp.id,
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
    likes: bp.engagementMetrics?.likesCount ?? bp.likes ?? 0,
    comments: bp.engagementMetrics?.commentsCount ?? bp.comments ?? 0,
    reposts: bp.engagementMetrics?.sharesCount ?? bp.reposts ?? 0,
    time: bp.createdAt
      ? new Date(bp.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      : 'Recently',
    liked: Boolean(bp.liked),
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
  const [modalMode, setModalMode] = useState<ModalMode>(undefined);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);

  // Load profile
  useEffect(() => { if (user) loadProfile(); }, [user]);

  // Fetch posts + employees when companyId ready (with fallback)
  useEffect(() => {
    (async () => {
      dispatch(setPostsLoading(true));
      try {
        let activeCompanyId = companyId;

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

        if (activeCompanyId) {
          // Posts
          const postsRes = await CompanyService.getPostsByCompany(activeCompanyId);
          const rawList: any[] =
            postsRes?.data?.items ||
            postsRes?.data?.posts ||
            postsRes?.items ||
            postsRes?.data ||
            [];
          dispatch(setPosts(rawList.map(transform)));

          // Employees (for author dropdown)
          const empRes = await CompanyService.getAllEmployees(activeCompanyId);
          const empList: any[] =
            empRes?.data?.result ||
            empRes?.data?.items ||
            empRes?.data ||
            [];
          setEmployees(empList.map((e: any) => ({
            id: e.employeeId || e.id || e._id,
            name: `${e.firstName} ${e.lastName}`,
            title: e.designation || '',
          })));
        } else {
          dispatch(setPosts([]));
        }

      } catch (err: any) {
        dispatch(setPostsError(err.message || 'Failed to load'));
      }
    })();
  }, [companyId, dispatch]);

  const handlePublish = useCallback(async (postId: string) => {
    try {
      await CompanyService.publishPost(postId);

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

  const openModal = useCallback((mode?: ModalMode) => {
    setModalMode(mode);
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setModalMode(undefined);
  }, []);

  const handleAdd = useCallback((p: Post) => dispatch(addPost(p)), [dispatch]);
  const handleDel = useCallback(async (id: string) => {
    try {
      const targetPost = posts.find(p => p.id === id || p.postId === id);
      const targetId = targetPost?.postId || targetPost?.id || id;
      if (targetId) {
        await CompanyService.deletePost(targetId);
      }
    } catch (err: any) {
      console.error('⚠️ [DELETE] Backend delete error:', err?.message || err);
    } finally {
      dispatch(deletePost(id));
    }
  }, [dispatch, posts]);
  const handleLike = useCallback((id: string) => dispatch(toggleLike(id)), [dispatch]);

  const userInitial = userProfileData?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'T';

  return (
    <div className="flex gap-5 max-w-5xl mx-auto items-start">

      {/* Main Content Column */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#4a3728]">Posts</h1>
            <p className="text-xs text-[#4a3728]/60 mt-0.5">Manage and publish your company posts</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-1.5 bg-[#4a3728] text-[#f6ede8] px-3.5 py-2 rounded-lg
                       text-xs font-semibold hover:bg-[#6b4e3d] transition-all shadow-sm active:scale-95"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Create Post
          </button>
        </div>

        {/* Post Stats (Published, Drafts, Scheduled) */}
        <PostStats counts={counts} />

        {/* Tabs Pills */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {TAB_ITEMS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200
                ${activeTab === tab.key
                  ? 'bg-[#4a3728] text-[#f6ede8] shadow-xs'
                  : 'bg-white border border-[#e0d8cf] text-[#4a3728]/70 hover:text-[#4a3728] hover:bg-[#f6ede8]/50'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Start a Post Card */}
        <div className="bg-[#f6ede8]/80 border border-[#e0d8cf] rounded-xl p-3 shadow-xs space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#4a3728] text-[#f6ede8] font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-xs">
              {userInitial}
            </div>
            <button
              onClick={() => openModal()}
              className="flex-1 bg-white border border-[#e0d8cf] hover:border-[#4a3728]/40 rounded-full px-4 py-2 text-left text-xs text-[#4a3728]/60 transition-all shadow-inner"
            >
              Start a post
            </button>
          </div>

          <div className="flex items-center justify-between pt-1.5 border-t border-[#e0d8cf]/70 px-1">
            <button
              onClick={() => openModal('photo')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-[#e0d8cf]/60 text-[11px] font-semibold text-[#4a3728]/80 transition-all"
            >
              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Photo
            </button>

            <button
              onClick={() => openModal('video')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-[#e0d8cf]/60 text-[11px] font-semibold text-[#4a3728]/80 transition-all"
            >
              <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Video
            </button>

            <button
              onClick={() => openModal('document')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-[#e0d8cf]/60 text-[11px] font-semibold text-[#4a3728]/80 transition-all"
            >
              <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Document
            </button>

            <button
              onClick={() => openModal('poll')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-[#e0d8cf]/60 text-[11px] font-semibold text-[#4a3728]/80 transition-all"
            >
              <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Poll
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-3 border-[#4a3728]/20 border-t-[#4a3728] rounded-full animate-spin" />
          </div>
        )}

        {/* Posts List / Empty State */}
        {!loading && (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-12 bg-[#f6ede8]/30 border border-[#e0d8cf]/50 rounded-xl">
                <svg className="w-12 h-12 mx-auto mb-2 text-[#4a3728]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                <p className="text-sm font-semibold text-[#4a3728]">No posts yet</p>
                <p className="text-[11px] text-[#4a3728]/60 mt-0.5">Create your first post to get started</p>
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

      </div>

      {/* Right Sidebar Widgets */}
      <div className="hidden lg:block w-[260px] xl:w-[280px] flex-shrink-0 sticky top-24">
        <PostsRightSidebar />
      </div>

      {/* Create Post Modal */}
      {showModal && companyId && (
        <CreatePostModal
          onClose={closeModal}
          onAdd={handleAdd}
          companyId={companyId}
          employees={employees}
          initialMode={modalMode}
        />
      )}

    </div>
  );
}