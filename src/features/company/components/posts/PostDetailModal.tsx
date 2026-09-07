 'use client';

import { memo, useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import type { Post } from '@/features/company/store/slices/postsSlice';
import CompanyService from '@/lib/api/company.service';

import { useAppDispatch } from '@/core/store/store.hooks';
import {
  incrementComments, decrementComments, setPostCommentsCount,
} from '@/features/company/store/slices/postsSlice';

interface CommentItem {
  id: string;
  name: string;
  avatar?: string;
  title: string;
  time: string;
  text: string;
  isAuthor?: boolean;
  likes: number;
  liked?: boolean;
  replies?: CommentItem[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  onToggleLike: (id: string) => void;
  onDelete?: (id: string) => void;
  onPublish?: (postId: string) => Promise<void>;
}

const EMOJI_LIST = ['😊', '🔥', '❤️', '👍', '🚀', '👏', '🎉', '💡', '😍', '🙌', '💯', '🙏', '✨', '😎', '💪', '🤩', '🎯', '⭐', '🤝', '⚡'];

const GIF_LIST = [
  { title: 'Great Job!', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHp1bHZnd3Ryb3prcGlucnZsZm5icndhcmcxeHZocWFodmdzaGJzaSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7abKhOpu0NwenH3O/giphy.gif' },
  { title: 'Awesome!', url: 'https://media.giphy.com/media/xT9IgG5083yC270Z4k/giphy.gif' },
  { title: 'Congrats!', url: 'https://media.giphy.com/media/d31w24psGYeekCXY/giphy.gif' },
  { title: 'Thank You!', url: 'https://media.giphy.com/media/l0G17mKNa6L8fHYra/giphy.gif' },
  { title: 'Mind Blown!', url: 'https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif' },
  { title: 'Applause!', url: 'https://media.giphy.com/media/13G7mmm3MptvEO/giphy.gif' },
];

const CONNECTIONS_LIST = [
  { id: '1', name: 'Ritik Rajput', title: 'Fullstack Developer', avatar: 'R' },
  { id: '2', name: 'Shivam Sharma', title: 'MERN Stack Instructor', avatar: 'S' },
  { id: '3', name: 'Anjali Verma', title: 'Product Designer', avatar: 'A' },
  { id: '4', name: 'Throne8 Team', title: 'Official Page', avatar: 'T' },
];

function renderCommentContent(text: string) {
  const gifMatch = text.match(/!\[GIF\]\((.*?)\)/);
  if (gifMatch) {
    const cleanText = text.replace(/!\[GIF\]\((.*?)\)/, '').trim();
    return (
      <div className="space-y-1 mt-0.5">
        {cleanText && <p className="text-[#4a3728]/90">{cleanText}</p>}
        <div className="rounded-lg overflow-hidden border border-[#e0d8cf] max-w-[200px] mt-1 bg-black/5">
          <img src={gifMatch[1]} alt="GIF" className="w-full max-h-36 object-contain" />
        </div>
      </div>
    );
  }
  return <p className="text-[#4a3728]/80">{text}</p>;
}

const PostDetailModal = memo(function PostDetailModal({
  isOpen,
  onClose,
  post,
  onToggleLike,
  onDelete,
  onPublish,
}: Props) {
  const dispatch = useAppDispatch();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [commentInput, setCommentInput] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');

  const [isFollowing, setIsFollowing] = useState(false);
  const [isReposted, setIsReposted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [repostQuoteText, setRepostQuoteText] = useState('');
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});

  const targetPostId = post?.postId || post?.id;

  // Fetch real comments from backend when modal opens
  useEffect(() => {
    if (isOpen && targetPostId) {
      CompanyService.getPostComments(targetPostId)
        .then(res => {
          const rawComments: any[] = res?.data || res?.items || res || [];
          if (Array.isArray(rawComments)) {
            setComments(rawComments.map((c: any) => ({
              id: c.commentId || c.id || c._id,
              name: c.userName || 'Member',
              title: 'Member',
              time: c.time || 'Recently',
              text: c.text || c.content || '',
              likes: 0,
              liked: false,
            })));
            dispatch(setPostCommentsCount({ id: post.id, count: rawComments.length }));
          }
        })
        .catch(err => console.warn('Failed to load comments in modal:', err));
    }
  }, [isOpen, targetPostId, dispatch, post.id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    const textToSend = commentInput.trim();
    setCommentInput('');

    const tempId = Date.now().toString();
    const newComment: CommentItem = {
      id: tempId,
      name: 'You',
      title: 'Member',
      time: 'Just now',
      text: textToSend,
      likes: 0,
      liked: false,
    };

    setComments(prev => [newComment, ...prev]);
    dispatch(incrementComments(post.id));

    try {
      const res = await CompanyService.addPostComment(targetPostId, textToSend);
      const created = res?.data;
      if (created) {
        setComments(prev =>
          prev.map(c => c.id === tempId ? {
            ...c,
            id: created.commentId || created.id || tempId,
            name: created.userName || 'You',
          } : c)
        );
      }
    } catch (err: any) {
      console.error('Failed to post comment to backend:', err);
    }
  };

  const handleAddReply = (commentId: string) => {
    if (!replyInput.trim()) return;

    const newReply: CommentItem = {
      id: Date.now().toString(),
      name: 'You',
      title: 'Member',
      time: 'Just now',
      text: replyInput.trim(),
      likes: 0,
    };

    setComments(prev =>
      prev.map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            replies: [...(c.replies || []), newReply],
          };
        }
        return c;
      })
    );

    setReplyInput('');
    setReplyingToId(null);
  };

  const handleCommentLike = (commentId: string, replyId?: string) => {
    setComments(prev =>
      prev.map(c => {
        if (replyId && c.id === commentId) {
          return {
            ...c,
            replies: c.replies?.map(r =>
              r.id === replyId
                ? { ...r, liked: !r.liked, likes: r.liked ? r.likes - 1 : r.likes + 1 }
                : r
            ),
          };
        }
        if (c.id === commentId && !replyId) {
          return { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 };
        }
        return c;
      })
    );
  };

  const handleDeleteComment = useCallback(async (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
    dispatch(decrementComments(post.id));
    try {
      await CompanyService.deletePostComment(targetPostId, commentId);
    } catch (err: any) {
      console.error('Failed to delete comment on backend:', err);
    }
  }, [targetPostId, dispatch, post.id]);

  const handleDeleteReply = useCallback((commentId: string, replyId: string) => {
    setComments(prev =>
      prev.map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            replies: c.replies?.filter(r => r.id !== replyId),
          };
        }
        return c;
      })
    );
  }, []);

  if (!isOpen || !post) return null;

  const images = post.images && post.images.length > 0 ? post.images : post.image ? [post.image] : [];
  
  const authorName = post.author
    ? `${post.author.firstName} ${post.author.lastName}`.trim()
    : post.company?.name || 'Company Page';

  const authorTitle = post.author
    ? (post.author.title || post.author.designation || 'Company Member')
    : (post.company?.name ? `${post.company.name} Official Page` : 'Official Page');

  const totalLikes = post.likes;
  const totalComments = post.comments;
  const totalReposts = post.reposts + (isReposted ? 1 : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 md:p-4 animate-fade-in">
      {/* Main Modal Overlay Container */}
      <div className="relative w-full max-w-4xl h-[82vh] bg-white rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl border border-[#e0d8cf]">

        {/* ── LEFT COLUMN: Media Viewer (Dark background) ── */}
        <div className="w-full md:w-[58%] lg:w-[62%] bg-[#121212] flex items-center justify-center relative select-none overflow-hidden h-64 md:h-full">
          {images.length > 0 ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={images[activeImageIndex]}
                alt="Post Media Detail"
                fill
                className="object-contain"
                unoptimized
              />

              {/* Prev / Next Carousel Controls */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImageIndex(prev => (prev > 0 ? prev - 1 : images.length - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-all shadow-lg text-lg"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => setActiveImageIndex(prev => (prev < images.length - 1 ? prev + 1 : 0))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-all shadow-lg text-lg"
                  >
                    ›
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                    {activeImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>
          ) : post.videos && post.videos.length > 0 ? (
            <video src={post.videos[0]} controls className="w-full h-full object-contain bg-black" />
          ) : (
            <div className="text-white/60 p-8 text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-white/10 mx-auto flex items-center justify-center text-2xl">
                📄
              </div>
              <p className="text-sm font-semibold">{post.title || 'Post Content'}</p>
            </div>
          )}

          {/* Top Left Badge */}
          <div className="absolute top-4 left-4 w-7 h-7 rounded-full bg-black/60 text-white font-bold text-xs flex items-center justify-center border border-white/20">
            {post.company?.name?.[0] || 'T'}
          </div>
        </div>

        {/* ── RIGHT COLUMN: Discussion & Post Details (100% Dynamic Data) ── */}
        <div className="w-full md:w-[42%] lg:w-[38%] flex flex-col h-full bg-white text-[#4a3728] border-l border-[#e0d8cf]">

          {/* 1. Header Row (Real Author info + Follow toggle + Close X) */}
          <div className="p-4 flex items-start justify-between border-b border-[#e0d8cf]/70 flex-shrink-0 bg-white z-10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#4a3728] text-white font-bold flex items-center justify-center text-sm flex-shrink-0 shadow-sm">
                {authorName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-sm font-bold text-[#4a3728] truncate hover:underline cursor-pointer">
                    {authorName}
                  </h3>
                  <button
                    onClick={() => setIsFollowing(!isFollowing)}
                    className={`text-xs font-bold px-2 py-0.5 rounded-full border transition-all ${
                      isFollowing
                        ? 'bg-[#4a3728] text-white border-[#4a3728]'
                        : 'text-blue-700 border-blue-700 hover:bg-blue-50'
                    }`}
                  >
                    {isFollowing ? '✓ Following' : '+ Follow'}
                  </button>
                </div>
                <p className="text-[11px] text-[#4a3728]/60 truncate">{authorTitle}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-[#4a3728]/50 mt-0.5">
                  <span>{post.time}</span>
                  <span>•</span>
                  <svg className="w-3 h-3 text-[#4a3728]/60" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-[#f6ede8] flex items-center justify-center text-[#4a3728]/70 hover:text-[#4a3728] transition-colors"
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 2. Scrollable Body Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {/* Post Title & Text */}
            <div className="space-y-1">
              {post.title && <h4 className="text-sm font-bold text-[#4a3728]">{post.title}</h4>}
              {post.text && (
                <p className="text-xs text-[#4a3728]/90 leading-relaxed whitespace-pre-line">
                  {post.text}
                </p>
              )}
            </div>

            {/* Dynamic Reactions & Stats Row */}
            <div className="flex items-center justify-between text-xs text-[#4a3728]/60 pt-2 border-t border-[#e0d8cf]/50">
              <div className="flex items-center gap-1.5 cursor-pointer">
                <div className="flex -space-x-1">
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center ring-1 ring-white">👍</span>
                  <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center ring-1 ring-white">❤️</span>
                </div>
                <span className="font-semibold text-[#4a3728]/80">{totalLikes}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>{totalComments} comments</span>
                <span>•</span>
                <span>{totalReposts} reposts</span>
              </div>
            </div>

            {/* Action Buttons Bar */}
            <div className="flex items-center justify-between py-1 border-y border-[#e0d8cf]/50">
              <button
                onClick={() => onToggleLike(post.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  post.liked ? 'text-blue-700 bg-blue-50/60' : 'text-[#4a3728]/70 hover:bg-[#f6ede8]'
                }`}
              >
                <svg className="w-4 h-4" fill={post.liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2" />
                </svg>
                Like
              </button>

              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-[#4a3728]/70 hover:bg-[#f6ede8]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Comment {post.comments > 0 ? `(${post.comments})` : ''}
              </button>

              <button
                onClick={() => setShowRepostModal(true)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  isReposted ? 'text-emerald-700 bg-emerald-50' : 'text-[#4a3728]/70 hover:bg-[#f6ede8]'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isReposted ? 'Reposted' : 'Repost'}
              </button>

              <button
                onClick={() => setShowSendModal(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-[#4a3728]/70 hover:bg-[#f6ede8]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send
              </button>
            </div>

            {/* Comment Input Section (With Emoji & GIF Pickers) */}
            <div className="relative">
              {/* Emoji Picker Popover */}
              {showEmojiPicker && (
                <div className="absolute bottom-full left-0 mb-2 p-2 bg-white border border-[#e0d8cf] rounded-xl shadow-xl z-30 grid grid-cols-5 gap-1.5 w-60">
                  {EMOJI_LIST.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setCommentInput(prev => prev + emoji);
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
                <div className="absolute bottom-full left-0 mb-2 p-2 bg-white border border-[#e0d8cf] rounded-xl shadow-xl z-30 grid grid-cols-2 gap-2 w-72 max-h-56 overflow-y-auto">
                  {GIF_LIST.map((gif, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={async () => {
                        setShowGifPicker(false);
                        const gifTag = `![GIF](${gif.url})`;
                        const tempId = Date.now().toString();
                        setComments(prev => [{
                          id: tempId,
                          name: 'You',
                          title: 'Member',
                          time: 'Just now',
                          text: gifTag,
                          likes: 0,
                        }, ...prev]);
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

              <form onSubmit={handleAddComment} className="flex gap-2 items-start pt-1">
                <div className="w-8 h-8 rounded-full bg-[#4a3728] text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                  Y
                </div>
                <div className="flex-1 bg-white border border-[#e0d8cf] focus-within:border-[#4a3728] rounded-2xl px-3 py-2 transition-all shadow-sm">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={commentInput}
                    onChange={e => setCommentInput(e.target.value)}
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
                      disabled={!commentInput.trim()}
                      className="bg-[#4a3728] disabled:opacity-40 text-white text-xs font-semibold px-3 py-1 rounded-full transition-all"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* ── Threaded Comments & Replies List (100% Live State) ── */}
            <div className="space-y-3 pt-1">
              {comments.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#4a3728]/50">
                  Be the first to comment on this post!
                </div>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="space-y-2">
                    {/* Top Level Comment */}
                    <div className="flex items-start gap-2 text-xs">
                      <div className="w-7 h-7 rounded-full bg-[#4a3728] text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                        {comment.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="bg-[#f6ede8]/60 border border-[#e0d8cf] rounded-2xl p-2.5 space-y-0.5">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-bold text-[#4a3728]">{comment.name}</span>
                              <p className="text-[10px] text-[#4a3728]/60">{comment.title}</p>
                            </div>
                            <span className="text-[10px] text-[#4a3728]/40">{comment.time}</span>
                          </div>
                          {renderCommentContent(comment.text)}
                        </div>

                        {/* Comment Actions (Like, Reply, Delete, Count) */}
                        <div className="flex items-center gap-3 text-[10px] text-[#4a3728]/60 px-2 pt-1">
                          <button
                            onClick={() => handleCommentLike(comment.id)}
                            className={`font-semibold hover:underline ${comment.liked ? 'text-blue-700' : ''}`}
                          >
                            Like
                          </button>
                          <span>•</span>
                          <button
                            onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}
                            className="font-semibold hover:underline"
                          >
                            Reply
                          </button>
                          <span>•</span>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="font-semibold text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                          {comment.likes > 0 && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <span className="text-blue-600 font-bold">👍</span> {comment.likes}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Reply Input Box */}
                        {replyingToId === comment.id && (
                          <div className="flex gap-2 mt-2 ml-4">
                            <input
                              type="text"
                              placeholder={`Reply to ${comment.name}...`}
                              value={replyInput}
                              onChange={e => setReplyInput(e.target.value)}
                              className="flex-1 bg-white border border-[#e0d8cf] rounded-full px-3 py-1 text-xs focus:outline-none focus:border-[#4a3728]"
                            />
                            <button
                              onClick={() => handleAddReply(comment.id)}
                              className="bg-[#4a3728] text-white text-xs px-3 py-1 rounded-full font-semibold"
                            >
                              Reply
                            </button>
                          </div>
                        )}

                        {/* Nested Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-2 ml-4 space-y-2 border-l-2 border-[#e0d8cf] pl-2">
                            {comment.replies.map(reply => (
                              <div key={reply.id} className="flex items-start gap-2 text-xs">
                                <div className="w-6 h-6 rounded-full bg-[#6b4e3d] text-white font-bold flex items-center justify-center text-[9px] flex-shrink-0">
                                  {reply.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                  <div className="bg-[#f6ede8]/80 border border-[#e0d8cf] rounded-xl p-2 space-y-0.5">
                                    <div className="flex justify-between items-start">
                                      <div className="flex items-center gap-1 flex-wrap">
                                        <span className="font-bold text-[#4a3728]">{reply.name}</span>
                                        {reply.isAuthor && (
                                          <span className="bg-[#4a3728] text-white text-[8px] font-bold px-1.5 py-0.2 rounded">
                                            Author
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[10px] text-[#4a3728]/40">{reply.time}</span>
                                    </div>
                                    <p className="text-xs text-[#4a3728]">
                                      <span className="font-bold text-blue-700 mr-1">@{comment.name}</span>
                                      {reply.text}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2 text-[10px] text-[#4a3728]/60 px-2 pt-0.5">
                                    <button
                                      onClick={() => handleCommentLike(comment.id, reply.id)}
                                      className={`font-semibold hover:underline ${reply.liked ? 'text-blue-700' : ''}`}
                                    >
                                      Like
                                    </button>
                                    <span>•</span>
                                    <button
                                      onClick={() => handleDeleteReply(comment.id, reply.id)}
                                      className="font-semibold text-red-600 hover:underline"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

        </div>

      </div>

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
              {CONNECTIONS_LIST.map(conn => {
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

export default PostDetailModal;
