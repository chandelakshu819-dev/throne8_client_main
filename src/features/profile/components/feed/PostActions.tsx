// src/features/profile/components/feed/PostActions.tsx
import React, { useState, useRef } from 'react';
import RepostMenuDropdown from './RepostMenuDropdown';
import ReactionPicker, { REACTION_CONFIG } from './ReactionPicker';
import { ReactionType } from '@/types/profile.types';

interface PostActionsProps {
  post: any;
  index: any;
  isDarkMode: any;
  likedPosts: any;
  handleLike: any;
  openRepostIndex: any;
  toggleRepostMenu: any;
  handleRepost: any;
  toggleComments: any;
  onOpenWithPerspectiveModal?: any;
  handleRepostInstant?: any;
  postReactions?: Record<string, { counts: any; userReaction: ReactionType | null }>;
  onReact?: (postId: string, type: ReactionType) => void;
}

const PostActions = ({
  post, index, isDarkMode, likedPosts, handleLike, openRepostIndex, toggleRepostMenu,
  handleRepost, toggleComments, onOpenWithPerspectiveModal, handleRepostInstant,
  postReactions, onReact,
}: PostActionsProps) => {
  const postKey = post.entryId || post.postId;

  const reactionState = postReactions?.[postKey];
  const legacyIsLiked = (typeof likedPosts?.[postKey] === 'object' ? likedPosts[postKey]?.isLiked : likedPosts?.[postKey]) ?? post.isLikedByCurrentUser ?? false;
  const userReaction: ReactionType | null = reactionState?.userReaction ?? (legacyIsLiked ? 'like' : null);

  const reactionCounts = reactionState?.counts;
  const totalReactionCount = reactionCounts
    ? Object.values(reactionCounts).reduce((sum: number, v: any) => sum + (v || 0), 0)
    : (post.likesCount || post.likes || 0);

  const activeConfig = REACTION_CONFIG.find(r => r.type === userReaction);

  const [showPicker, setShowPicker] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [hasReposted, setHasReposted] = useState(false);
  const [isReposting, setIsReposting] = useState(false);
  const [shareCount, setShareCount] = useState(post.shares || 0);

  const handleShare = async () => {
    try {
      const postUrl = `${window.location.origin}/post/${postKey}`;
      await navigator.clipboard.writeText(postUrl);
      setShareCount((prev: number) => prev + 1);
      alert('Post link copied! Share it anywhere.');
    } catch (err) {
      console.error('Failed to share post:', err);
      alert('Failed to copy link');
    }
  };

  const handleQuickClick = () => {
    if (onReact) {
      onReact(postKey, 'like');
    } else {
      handleLike?.(postKey);
    }
  };

  const handleMouseEnter = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => setShowPicker(true), 350);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => setShowPicker(false), 200);
  };

  const handlePick = (type: ReactionType) => {
    setShowPicker(false);
    onReact?.(postKey, type);
  };

  return (
    <div className={`flex items-center justify-between pt-4 mt-1 border-t ${isDarkMode ? 'border-slate-700' : 'border-[#e0d8cf]'}`}>
      <div className="flex items-center gap-2">

        {/* ✅ Reaction pill — matches Comment/Share pill styling */}
        <div
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {showPicker && (
            <ReactionPicker onSelect={handlePick} isDarkMode={isDarkMode} />
          )}
          <button
            onClick={handleQuickClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
              userReaction
                ? 'bg-opacity-10'
                : isDarkMode
                  ? 'text-slate-300 hover:bg-slate-700'
                  : 'text-[#4a3728] hover:bg-[#e0d8cf]/60'
            }`}
            style={
              userReaction
                ? { color: activeConfig?.color, backgroundColor: `${activeConfig?.color}1A` }
                : undefined
            }
          >
            <span className="text-lg leading-none">
              {activeConfig ? activeConfig.emoji : '👍'}
            </span>
            <span>{totalReactionCount > 0 ? totalReactionCount : 'Like'}</span>
          </button>
        </div>

        <button
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
            isDarkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-[#4a3728] hover:bg-[#e0d8cf]/60'
          }`}
          onClick={() => toggleComments(postKey)}
        >
          <i className="ri-message-3-line text-lg"></i>
          <span>{post.commentsCount || post.comments || 0}</span>
        </button>

        <button
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
            isDarkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-[#4a3728] hover:bg-[#e0d8cf]/60'
          }`}
          onClick={handleShare}
        >
          <i className="ri-share-forward-line text-lg"></i>
          <span>{shareCount}</span>
        </button>
      </div>

      <div className="relative repost-menu">
        <button
          onClick={() => toggleRepostMenu(index)}
          disabled={isReposting}
          className={`p-2 rounded-full transition-all duration-200 ${hasReposted
              ? 'text-green-600'
              : isDarkMode ? 'hover:bg-slate-700 text-white' : 'hover:bg-[#e0d8cf]/60 text-[#4a3728]'
            }`}
        >
          <i className={`ri-repeat-${hasReposted ? 'fill' : 'line'} text-xl`}></i>
        </button>
        {openRepostIndex === index && (
          <RepostMenuDropdown
            isDarkMode={isDarkMode}
            index={index}
            post={post}
            onOpenWithPerspectiveModal={onOpenWithPerspectiveModal}
            onRepostInstant={(idx: any) => {
              handleRepostInstant(idx);
              toggleRepostMenu(idx);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default PostActions;