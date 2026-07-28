// src/features/profile/components/feed/PostActions.tsx
import React, { useState, useRef } from 'react';
import RepostMenuDropdown from './RepostMenuDropdown';
import ReactionPicker, { REACTION_CONFIG } from './ReactionPicker';
import SendPostModal from './SendPostModal';
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
  currentUserId?: string; // ✅ NEW: needed to fetch connections for the Send modal
}

const PostActions = ({
  post, index, isDarkMode, likedPosts, handleLike, openRepostIndex, toggleRepostMenu,
  handleRepost, toggleComments, onOpenWithPerspectiveModal, handleRepostInstant,
  postReactions, onReact, currentUserId,
}: PostActionsProps) => {
  const postKey = post.entryId || post.postId;

  const reactionState = postReactions?.[postKey];
  const legacyIsLiked = (typeof likedPosts?.[postKey] === 'object' ? likedPosts[postKey]?.isLiked : likedPosts?.[postKey]) ?? post.isLikedByCurrentUser ?? false;
  const userReaction: ReactionType | null = reactionState?.userReaction ?? (legacyIsLiked ? 'like' : null);

  const reactionCounts = reactionState?.counts;
  const totalReactionCount = reactionCounts
    ? Object.values(reactionCounts).reduce((sum: number, v: any) => sum + (v || 0), 0)
    : (post.likesCount || post.likes || 0);

  const commentCount = post.commentsCount || post.comments || 0;

  const activeConfig = REACTION_CONFIG.find(r => r.type === userReaction);

  const [showPicker, setShowPicker] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [hasReposted, setHasReposted] = useState(false);
  const [isReposting, setIsReposting] = useState(false);

  // ✅ NEW: Send modal state (replaces plain clipboard-copy behaviour)
  const [showSendModal, setShowSendModal] = useState(false);

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

  const mutedText = isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/60';
  const hoverBg = isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-[#e0d8cf]/60';
  const iconText = isDarkMode ? 'text-slate-300' : 'text-[#4a3728]';

  return (
    <div className="pt-3 mt-1">
      {/* ── Row 1: summary counts (reaction icon + total, comment count) ── */}
      {(totalReactionCount > 0 || commentCount > 0) && (
        <div className={`flex items-center justify-between px-1 pb-2 text-sm ${mutedText}`}>
          <div className="flex items-center gap-1.5">
            {totalReactionCount > 0 && (
              <>
                <span className="text-base leading-none">{activeConfig ? activeConfig.emoji : '👍'}</span>
                <span>{totalReactionCount}</span>
              </>
            )}
          </div>
          {commentCount > 0 && (
            <button
              onClick={() => toggleComments(postKey)}
              className="hover:underline"
            >
              {commentCount} comment{commentCount !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}

      {/* ── Divider ── */}
      <div className={`border-t ${isDarkMode ? 'border-slate-700' : 'border-[#e0d8cf]'}`} />

      {/* ── Row 2: Like / Comment / Repost / Send — evenly spaced ── */}
      <div className="grid grid-cols-4 gap-1 pt-1">

        {/* Like */}
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
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              userReaction ? '' : `${iconText} ${hoverBg}`
            }`}
            style={userReaction ? { color: activeConfig?.color } : undefined}
          >
            <span className="text-lg leading-none">
              {activeConfig ? activeConfig.emoji : '👍'}
            </span>
            <span>{activeConfig?.label || 'Like'}</span>
          </button>
        </div>

        {/* Comment */}
        <button
          onClick={() => toggleComments(postKey)}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${iconText} ${hoverBg}`}
        >
          <i className="ri-message-3-line text-lg"></i>
          <span>Comment</span>
        </button>

        {/* Repost */}
        <div className="relative repost-menu">
          <button
            onClick={() => toggleRepostMenu(index)}
            disabled={isReposting}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              hasReposted ? 'text-green-600' : `${iconText} ${hoverBg}`
            }`}
          >
            <i className={`ri-repeat-${hasReposted ? 'fill' : 'line'} text-lg`}></i>
            <span>Repost</span>
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

        {/* Send — ab modal open karta hai (LinkedIn-style) instead of silent clipboard copy */}
        <button
          onClick={() => setShowSendModal(true)}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${iconText} ${hoverBg}`}
        >
          <i className="ri-send-plane-line text-lg"></i>
          <span>Send</span>
        </button>
      </div>

      {/* ✅ NEW: Send Post Modal */}
      {showSendModal && currentUserId && (
        <SendPostModal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          currentUserId={currentUserId}
          postId={postKey}
          postOwnerName={post.firstName || post.fullName || 'this'}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
};

export default PostActions;