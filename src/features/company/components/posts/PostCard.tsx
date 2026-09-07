'use client';

import { memo, useCallback, useState, useEffect } from 'react';
import Image from 'next/image';
import type { Post } from '@/features/company/store/slices/postsSlice';
import UpdatePostModal from '@/features/study-group/modals/UpdatePostModal';
import DeleteConfirmationModal from '@/features/study-group/modals/DeleteConfirmationModal';
import PostDetailModal from './PostDetailModal';
import CompanyService from '@/lib/api/company.service';

import { useAppDispatch } from '@/core/store/store.hooks';
import {
  incrementComments, decrementComments, setPostCommentsCount,
} from '@/features/company/store/slices/postsSlice';
import { addActivity } from '@/features/company/store/slices/activitySlice';

const STATUS_COLORS: Record<string, string> = {
  published: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  draft: 'bg-amber-100 text-amber-800 border-amber-200',
  scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
  archived: 'bg-gray-100 text-gray-700 border-gray-200',
};

interface Props {
  post: Post;
  onDelete: (id: string) => void;
  onToggleLike: (id: string) => void;
  onUpdate?: (postId: string, updatedData: { title: string; text: string; status: string }) => Promise<void>;
  onPublish?: (postId: string) => Promise<void>;
}

const PostCard = memo(function PostCard({
  post,
  onDelete,
  onToggleLike,
  onUpdate,
  onPublish
}: Props) {
  const dispatch = useAppDispatch();

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isReposted, setIsReposted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [commentText, setCommentText] = useState('');
  const [commentsList, setCommentsList] = useState<Array<{ id: string; name: string; text: string; time: string }>>([]);
  const [isExpandedText, setIsExpandedText] = useState(false);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [repostQuoteText, setRepostQuoteText] = useState('');
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});

  const targetPostId = post.postId || post.id;

  // Fetch real comments from backend when comment drawer is toggled open
  useEffect(() => {
    if (showComments && targetPostId) {
      CompanyService.getPostComments(targetPostId)
        .then(res => {
          const rawComments: any[] = res?.data || res?.items || res || [];
          if (Array.isArray(rawComments)) {
            setCommentsList(rawComments.map((c: any) => ({
              id: c.commentId || c.id || c._id,
              name: c.userName || 'Member',
              text: c.text || c.content || '',
              time: c.time || 'Recently',
            })));
            dispatch(setPostCommentsCount({ id: post.id, count: rawComments.length }));
          }
        })
        .catch(err => console.warn('Failed to load comments:', err));
    }
  }, [showComments, targetPostId, dispatch, post.id]);

  const openDetailModal = useCallback(() => setIsDetailModalOpen(true), []);
  const closeDetailModal = useCallback(() => setIsDetailModalOpen(false), []);

  const handleDelete = useCallback(() => {
    setShowMenu(false);
    setIsDeleteConfirmOpen(true);
  }, []);

  const handleCloseDeleteConfirm = useCallback(() => setIsDeleteConfirmOpen(false), []);

  const handleConfirmDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await onDelete(post.id);
      setIsDeleteConfirmOpen(false);
    } catch (error) {
      console.error('Failed to delete post:', error);
      setIsDeleting(false);
    }
  }, [post.id, onDelete]);

  const handleToggleLike = useCallback(async () => {
    onToggleLike(post.id);
    if (!post.liked) {
      dispatch(addActivity({
        id: `like-${post.id}-${Date.now()}`,
        type: 'like',
        user: 'You',
        avatar: '👍',
        color: 'bg-blue-600',
        action: `liked post "${post.title || post.text.slice(0, 35)}"`,
        time: 'Just now',
        read: false,
      }));
    }
    if (targetPostId) {
      await CompanyService.togglePostLike(targetPostId);
    }
  }, [post.id, post.liked, post.title, post.text, targetPostId, onToggleLike, dispatch]);

  const handleUpdateClick = useCallback(() => {
    setShowMenu(false);
    setIsUpdateModalOpen(true);
  }, []);

  const handlePublishClick = useCallback(async () => {
    setShowMenu(false);
    if (onPublish) {
      await onPublish(post.postId || post.id);
    }
  }, [onPublish, post.id, post.postId]);

  const handleRepost = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsReposted(prev => !prev);
  }, []);

  const handleSend = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }, []);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const textToSend = commentText.trim();
    setCommentText('');

    const tempId = Date.now().toString();
    setCommentsList(prev => [
      ...prev,
      { id: tempId, name: 'You', text: textToSend, time: 'Just now' }
    ]);
    dispatch(incrementComments(post.id));
    dispatch(addActivity({
      id: `comment-${tempId}`,
      type: 'comment',
      user: 'You',
      avatar: 'Y',
      color: 'bg-[#4a3728]',
      action: `commented: "${textToSend}" on post "${post.title || post.text.slice(0, 35)}"`,
      time: 'Just now',
      read: false,
    }));

    try {
      const res = await CompanyService.addPostComment(targetPostId, textToSend);
      const created = res?.data;
      if (created) {
        setCommentsList(prev =>
          prev.map(c => c.id === tempId ? {
            id: created.commentId || created.id || tempId,
            name: created.userName || 'You',
            text: created.text || textToSend,
            time: 'Just now',
          } : c)
        );
      }
    } catch (err: any) {
      console.error('Failed to save comment to backend:', err);
    }
  };

  const handleDeleteComment = useCallback(async (commentId: string) => {
    setCommentsList(prev => prev.filter(c => c.id !== commentId));
    dispatch(decrementComments(post.id));
    try {
      await CompanyService.deletePostComment(targetPostId, commentId);
    } catch (err: any) {
      console.error('Failed to delete comment on backend:', err);
    }
  }, [targetPostId, dispatch, post.id]);

  const authorName = post.author
    ? `${post.author.firstName} ${post.author.lastName}`.trim()
    : post.company?.name || 'Company Page';

  const authorTitle = post.author
    ? (post.author.title || post.author.designation || 'Company Member')
    : (post.company?.name ? `${post.company.name} Official Page` : 'Official Page');

  const [isFollowing, setIsFollowing] = useState(false);

  const isLongText = post.text && post.text.length > 220;
  const displayedText = isLongText && !isExpandedText
    ? post.text.slice(0, 220) + '...'
    : post.text;

  return (
    <div className="bg-white border border-[#e0d8cf] rounded-2xl shadow-sm hover:shadow transition-shadow overflow-hidden">

      {/* Top Activity Banner / Context Header */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between border-b border-[#e0d8cf]/40 text-xs text-[#4a3728]/70">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="text-[#4a3728] font-bold">{post.company?.name || 'Throne8'}</span>
          <span>posted this</span>
          {post.type && (
            <>
              <span>•</span>
              <span className="bg-[#4a3728]/10 text-[#4a3728] px-2 py-0.5 rounded-full text-[11px] font-semibold">
                {post.type}
              </span>
            </>
          )}
        </div>

        {/* Dropdown Menu Toggle */}
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="p-1.5 text-[#4a3728]/60 hover:text-[#4a3728] hover:bg-[#f6ede8] rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>

          {showMenu && (
            <div className="absolute right-0 top-8 w-44 bg-white border border-[#e0d8cf] rounded-xl shadow-lg z-20 py-1.5 space-y-0.5 text-xs text-[#4a3728]">
              {post.status === 'draft' && onPublish && (
                <button
                  onClick={handlePublishClick}
                  className="w-full px-3 py-2 text-left hover:bg-[#f6ede8] font-semibold text-emerald-700 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Publish Post
                </button>
              )}
              <button
                onClick={handleUpdateClick}
                className="w-full px-3 py-2 text-left hover:bg-[#f6ede8] font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Post
              </button>
              <button
                onClick={handleDelete}
                className="w-full px-3 py-2 text-left hover:bg-red-50 text-red-600 font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Post
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Author Header Row */}
      <div className="p-3.5 flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-[#4a3728] text-white font-bold flex items-center justify-center text-sm flex-shrink-0 shadow-xs border border-[#e0d8cf]">
            {authorName.charAt(0).toUpperCase()}
          </div>

          {/* Details */}
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-[#4a3728] leading-tight">
                {authorName}
              </h4>
              <span className="text-[10px] text-[#4a3728]/50 font-normal">• 1st</span>
            </div>
            <p className="text-[11px] text-[#4a3728]/70 line-clamp-1 mt-0.5">
              {authorTitle}
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-[#4a3728]/50 mt-0.5">
              <span>{post.time}</span>
              <span>•</span>
              <svg className="w-3 h-3 text-[#4a3728]/60" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
              {post.status && (
                <span className={`px-2 py-0.2 text-[9px] font-bold rounded-full border capitalize ${STATUS_COLORS[post.status] || ''}`}>
                  {post.status}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Follow / Connection Action */}
        <button
          onClick={() => setIsFollowing(!isFollowing)}
          className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all ${
            isFollowing
              ? 'bg-[#4a3728] text-white border-[#4a3728]'
              : 'text-[#4a3728] hover:bg-[#f6ede8] border-[#4a3728]/30'
          }`}
        >
          {isFollowing ? '✓ Following' : '+ Follow'}
        </button>
      </div>

      {/* Post Content */}
      <div className="px-3.5 pb-2.5 space-y-1.5">
        {post.title && (
          <h3 onClick={openDetailModal} className="text-sm font-bold text-[#4a3728] leading-snug cursor-pointer hover:underline">
            {post.title}
          </h3>
        )}
        {post.text && (
          <p className="text-xs text-[#4a3728]/90 leading-relaxed whitespace-pre-line">
            <span>{displayedText}</span>
            {isLongText && (
              <button
                onClick={(e) => { e.stopPropagation(); setIsExpandedText(!isExpandedText); }}
                className="text-[#4a3728] font-semibold hover:underline ml-1"
              >
                {isExpandedText ? ' show less' : ' ...more'}
              </button>
            )}
          </p>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap pt-0.5">
            {post.tags.map(tag => (
              <span key={tag} className="text-[11px] font-medium text-[#4a3728] hover:underline cursor-pointer">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Media Content Area - Clicking Image opens Lightbox Detail Modal */}
      {post.images && post.images.length > 0 && (
        <div
          onClick={openDetailModal}
          className={`grid gap-0.5 border-y border-[#e0d8cf] cursor-pointer ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}
        >
          {post.images.slice(0, 4).map((src, i) => (
            <div key={i} className="relative bg-black/5 overflow-hidden">
              <Image
                src={src}
                alt="Post Media"
                width={800}
                height={400}
                className="w-full h-[230px] object-cover hover:scale-[1.01] transition-transform duration-300"
              />
              {i === 3 && post.images!.length > 4 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white font-extrabold text-xl">
                    +{post.images!.length - 4}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Video Content */}
      {post.videos && post.videos.length > 0 && (
        <div onClick={openDetailModal} className="border-y border-[#e0d8cf] cursor-pointer">
          {post.videos.map((src, i) => (
            <video key={i} src={src} controls className="w-full max-h-[420px] bg-black" />
          ))}
        </div>
      )}

      {/* Document Content */}
      {post.documents && post.documents.length > 0 && (
        <div className="px-4 py-2 border-y border-[#e0d8cf] bg-[#f6ede8]/30 space-y-2">
          {post.documents.map((doc, i) => (
            <a
              key={i}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-white border border-[#e0d8cf] rounded-xl hover:border-[#4a3728] transition-colors"
            >
              <div className="w-10 h-10 bg-[#4a3728]/10 rounded-lg flex items-center justify-center flex-shrink-0 text-[#4a3728]">
                📄
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#4a3728] truncate">{doc.name}</p>
                <p className="text-xs text-[#4a3728]/50">{doc.type || 'Document'}</p>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Poll Content */}
      {post.hasPoll && post.pollData && (
        <div className="mx-4 my-2 bg-[#f6ede8]/40 border border-[#e0d8cf] rounded-xl p-4 space-y-3">
          <p className="text-sm font-bold text-[#4a3728]">📊 {post.pollData.question}</p>
          <div className="space-y-2">
            {post.pollData.options.map(opt => {
              const pct = post.pollData!.totalVotes > 0
                ? Math.round((opt.votes / post.pollData!.totalVotes) * 100)
                : 0;
              return (
                <div key={opt.optionId} className="space-y-1">
                  <div className="flex justify-between text-xs text-[#4a3728] font-medium">
                    <span>{opt.text}</span>
                    <span className="font-bold">{pct}%</span>
                  </div>
                  <div className="w-full bg-[#e0d8cf] rounded-full h-2 overflow-hidden">
                    <div className="bg-[#4a3728] h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-[#4a3728]/60 font-medium">
            {post.pollData.totalVotes} votes • {post.pollData.isActive ? 'Active' : 'Ended'}
          </p>
        </div>
      )}

      {/* Engagement Stats Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between text-xs text-[#4a3728]/60 border-b border-[#e0d8cf]/50">
        {/* Left: Reaction icons + count */}
        <div className="flex items-center gap-1.5 font-medium">
          <div className="flex -space-x-1">
            <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center ring-1 ring-white">👍</span>
            <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-1 ring-white">❤️</span>
            <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center ring-1 ring-white">👏</span>
          </div>
          <span className="font-medium text-[#4a3728]/80">{post.likes}</span>
        </div>

        {/* Right: Comments + Reposts counts */}
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }}
            className="hover:underline hover:text-[#4a3728]"
          >
            {post.comments} comments
          </button>
          <span>•</span>
          <button
            onClick={handleRepost}
            className="hover:underline hover:text-[#4a3728]"
          >
            {post.reposts + (isReposted ? 1 : 0)} reposts
          </button>
        </div>
      </div>

      {/* Action Buttons Bar (LinkedIn style 4 buttons: Like, Comment, Repost, Send) */}
      <div className="px-2 py-1 flex items-center justify-between border-b border-[#e0d8cf]/50">
        {/* Like */}
        <button
          onClick={(e) => { e.stopPropagation(); handleToggleLike(); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
            post.liked
              ? 'text-blue-700 bg-blue-50/50'
              : 'text-[#4a3728]/70 hover:bg-[#f6ede8]/80 hover:text-[#4a3728]'
          }`}
        >
          <svg className="w-5 h-5" fill={post.liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2" />
          </svg>
          Like
        </button>

        {/* Comment - Toggles Inline Comment Drawer */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
            showComments
              ? 'text-[#4a3728] bg-[#f6ede8]'
              : 'text-[#4a3728]/70 hover:bg-[#f6ede8]/80 hover:text-[#4a3728]'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Comment {post.comments > 0 ? `(${post.comments})` : ''}
        </button>

        {/* Repost */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowRepostModal(true); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
            isReposted
              ? 'text-emerald-700 bg-emerald-50/70'
              : 'text-[#4a3728]/70 hover:bg-[#f6ede8]/80 hover:text-[#4a3728]'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isReposted ? 'Reposted' : 'Repost'}
        </button>

        {/* Send */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowSendModal(true); }}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold text-[#4a3728]/70 hover:bg-[#f6ede8]/80 hover:text-[#4a3728] transition-colors relative"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          Send
        </button>
      </div>

      {/* Expandable Inline Comment Section */}
      {showComments && (
        <div className="p-4 bg-[#f6ede8]/30 space-y-3 border-t border-[#e0d8cf]/40 relative">

          {/* Emoji Picker Popover */}
          {showEmojiPicker && (
            <div className="absolute bottom-full left-4 mb-2 p-2 bg-white border border-[#e0d8cf] rounded-xl shadow-xl z-30 grid grid-cols-5 gap-1.5 w-60">
              {['😊', '🔥', '❤️', '👍', '🚀', '👏', '🎉', '💡', '😍', '🙌', '💯', '🙏', '✨', '😎', '💪', '🤩', '🎯', '⭐', '🤝', '⚡'].map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setCommentText(prev => prev + emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="text-lg hover:bg-[#f6ede8] rounded p-1 transition-transform hover:scale-125"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* GIF Picker Popover */}
          {showGifPicker && (
            <div className="absolute bottom-full left-4 mb-2 p-2 bg-white border border-[#e0d8cf] rounded-xl shadow-xl z-30 grid grid-cols-2 gap-2 w-72 max-h-56 overflow-y-auto">
              {[
                { title: 'Great Job!', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHp1bHZnd3Ryb3prcGlucnZsZm5icndhcmcxeHZocWFodmdzaGJzaSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7abKhOpu0NwenH3O/giphy.gif' },
                { title: 'Awesome!', url: 'https://media.giphy.com/media/xT9IgG5083yC270Z4k/giphy.gif' },
                { title: 'Congrats!', url: 'https://media.giphy.com/media/d31w24psGYeekCXY/giphy.gif' },
                { title: 'Thank You!', url: 'https://media.giphy.com/media/l0G17mKNa6L8fHYra/giphy.gif' },
                { title: 'Mind Blown!', url: 'https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif' },
                { title: 'Applause!', url: 'https://media.giphy.com/media/13G7mmm3MptvEO/giphy.gif' },
              ].map((gif, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={async () => {
                    setShowGifPicker(false);
                    const gifTag = `![GIF](${gif.url})`;
                    const tempId = Date.now().toString();
                    setCommentsList(prev => [...prev, { id: tempId, name: 'You', text: gifTag, time: 'Just now' }]);
                    try {
                      await CompanyService.addPostComment(targetPostId, gifTag);
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="group relative rounded-lg overflow-hidden border border-[#e0d8cf] hover:border-[#4a3728] transition-all bg-black/5"
                >
                  <img src={gif.url} alt={gif.title} className="w-full h-20 object-cover" />
                  <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] font-bold p-0.5 truncate text-center">
                    {gif.title}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Add Comment Input Bar with Emoji and GIF Buttons */}
          <form onSubmit={handleAddComment} className="flex gap-2 items-start">
            <div className="w-8 h-8 rounded-full bg-[#4a3728] text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
              Y
            </div>
            <div className="flex-1 bg-white border border-[#e0d8cf] focus-within:border-[#4a3728] rounded-2xl px-3 py-2 transition-all shadow-sm">
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                className="w-full text-xs text-[#4a3728] placeholder-[#4a3728]/40 focus:outline-none bg-transparent"
              />
              <div className="flex items-center justify-between pt-2 border-t border-[#e0d8cf]/40 mt-2">
                <div className="flex items-center gap-2 text-[#4a3728]/60">
                  <button
                    type="button"
                    onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }}
                    className={`hover:text-[#4a3728] text-sm p-1 rounded hover:bg-[#f6ede8] transition-colors ${showEmojiPicker ? 'bg-[#f6ede8]' : ''}`}
                    title="Add Emoji"
                  >
                    😊
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false); }}
                    className={`hover:text-[#4a3728] text-[10px] font-bold border border-[#4a3728]/40 px-1.5 py-0.5 rounded transition-colors ${showGifPicker ? 'bg-[#4a3728] text-white' : ''}`}
                    title="Add Animated GIF"
                  >
                    GIF
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="bg-[#4a3728] disabled:opacity-40 text-white text-xs font-semibold px-3 py-1 rounded-full transition-all"
                >
                  Post
                </button>
              </div>
            </div>
          </form>

          {/* Comments List (Scrollable container with fixed max height) */}
          <div className="space-y-2 pt-1 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#e0d8cf]">
            {commentsList.length === 0 ? (
              <p className="text-center text-[11px] text-[#4a3728]/50 py-2">No comments yet</p>
            ) : (
              commentsList.map(c => (
                <div key={c.id} className="flex gap-2 text-xs">
                  <div className="w-7 h-7 rounded-full bg-[#6b4e3d] text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                    {c.name.charAt(0)}
                  </div>
                  <div className="bg-white border border-[#e0d8cf] rounded-2xl p-2.5 flex-1 relative group">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-bold text-[#4a3728]">{c.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#4a3728]/40">{c.time}</span>
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="text-[#4a3728]/40 hover:text-red-600 transition-colors p-0.5"
                          title="Delete comment"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {(() => {
                      const gifMatch = c.text?.match(/!\[GIF\]\((.*?)\)/);
                      if (gifMatch) {
                        const clean = c.text.replace(/!\[GIF\]\((.*?)\)/, '').trim();
                        return (
                          <div className="space-y-1">
                            {clean && <p className="text-[#4a3728]/80">{clean}</p>}
                            <div className="rounded-lg overflow-hidden border border-[#e0d8cf] max-w-[180px] mt-1">
                              <img src={gifMatch[1]} alt="GIF" className="w-full h-auto object-cover" />
                            </div>
                          </div>
                        );
                      }
                      return <p className="text-[#4a3728]/80">{c.text}</p>;
                    })()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <PostDetailModal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        post={post}
        onToggleLike={onToggleLike}
        onPublish={onPublish}
      />

      <UpdatePostModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        post={post}
        onUpdate={async (id, data) => {
          if (onUpdate) await onUpdate(id, data);
        }}
        onPublish={onPublish}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={handleCloseDeleteConfirm}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        postTitle={post.title}
      />

      {/* ── Repost Modal Overlay ── */}
      {showRepostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full border border-[#e0d8cf] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e0d8cf] pb-3">
              <h3 className="text-sm font-bold text-[#4a3728]">Repost Options</h3>
              <button onClick={() => setShowRepostModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
            </div>

            <div className="space-y-3">
              {/* Option 1: Instant Repost */}
              <button
                onClick={async () => {
                  setIsReposted(true);
                  setShowRepostModal(false);
                  if (targetPostId) await CompanyService.incrementShares(targetPostId);
                }}
                className="w-full flex items-center gap-3 p-3 bg-[#f6ede8]/60 hover:bg-[#f6ede8] border border-[#e0d8cf] rounded-xl text-left transition-colors"
              >
                <span className="text-lg">🔁</span>
                <div>
                  <p className="text-xs font-bold text-[#4a3728]">Repost instantly</p>
                  <p className="text-[11px] text-[#4a3728]/60">Share directly to your network feed</p>
                </div>
              </button>

              {/* Option 2: Repost with thoughts */}
              <div className="space-y-2 border-t border-[#e0d8cf] pt-3">
                <p className="text-xs font-bold text-[#4a3728]">Repost with your thoughts</p>
                <textarea
                  value={repostQuoteText}
                  onChange={e => setRepostQuoteText(e.target.value)}
                  placeholder="Add your thoughts about this post..."
                  rows={3}
                  className="w-full bg-[#f6ede8]/30 border border-[#e0d8cf] rounded-xl p-2.5 text-xs text-[#4a3728] focus:outline-none focus:border-[#4a3728] resize-none"
                />
                <button
                  onClick={async () => {
                    if (!repostQuoteText.trim()) return;
                    setIsReposted(true);
                    setShowRepostModal(false);
                    setRepostQuoteText('');
                    if (targetPostId) await CompanyService.incrementShares(targetPostId);
                  }}
                  disabled={!repostQuoteText.trim()}
                  className="w-full bg-[#4a3728] disabled:opacity-40 text-white text-xs font-semibold py-2 rounded-xl transition-all"
                >
                  Post Repost
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Send Modal Overlay ── */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full border border-[#e0d8cf] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e0d8cf] pb-3">
              <h3 className="text-sm font-bold text-[#4a3728]">Send Post in Message</h3>
              <button onClick={() => setShowSendModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
            </div>

            {/* Connection list */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {[
                { id: '1', name: 'Ritik Rajput', title: 'Fullstack Developer', avatar: 'R' },
                { id: '2', name: 'Shivam Sharma', title: 'MERN Stack Instructor', avatar: 'S' },
                { id: '3', name: 'Anjali Verma', title: 'Product Designer', avatar: 'A' },
                { id: '4', name: 'Throne8 Team', title: 'Official Page', avatar: 'T' },
              ].map(conn => {
                const isSent = sentMap[conn.id];
                return (
                  <div key={conn.id} className="flex items-center justify-between p-2 bg-[#f6ede8]/40 border border-[#e0d8cf] rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#4a3728] text-white font-bold flex items-center justify-center text-xs">
                        {conn.avatar}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#4a3728]">{conn.name}</p>
                        <p className="text-[10px] text-[#4a3728]/60">{conn.title}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSentMap(prev => ({ ...prev, [conn.id]: true }))}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        isSent
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#4a3728] text-white hover:bg-[#6b4e3d]'
                      }`}
                    >
                      {isSent ? '✓ Sent' : 'Send'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Quick Share Links */}
            <div className="border-t border-[#e0d8cf] pt-3 flex items-center justify-between">
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    navigator.clipboard?.writeText(window.location.href);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-[#4a3728] bg-[#f6ede8] hover:bg-[#e0d8cf] px-3 py-1.5 rounded-lg transition-colors"
              >
                <span>🔗</span> {copiedLink ? 'Link Copied!' : 'Copy Link'}
              </button>
              <div className="flex items-center gap-2 text-xs">
                <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title || 'Check this post out!')}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`} target="_blank" rel="noreferrer" className="p-1.5 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 font-bold">X</a>
                <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`} target="_blank" rel="noreferrer" className="p-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-bold">LinkedIn</a>
                <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent((post.title || '') + ' ' + (typeof window !== 'undefined' ? window.location.href : ''))}`} target="_blank" rel="noreferrer" className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 font-bold">WhatsApp</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default PostCard;