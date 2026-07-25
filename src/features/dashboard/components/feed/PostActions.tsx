// src/features/dashboard/components/feed/PostActions.tsx
import React, { useState } from 'react';
import RepostMenuDropdown from './RepostMenuDropdown';

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
}

const PostActions = ({ post, index, isDarkMode, likedPosts, handleLike, openRepostIndex, toggleRepostMenu, handleRepost, toggleComments, onOpenWithPerspectiveModal, handleRepostInstant }: PostActionsProps) => {
  const postKey = post.entryId || post.postId;
  const isLiked = likedPosts[postKey] ?? post.isLikedByCurrentUser ?? false;

  const [hasReposted, setHasReposted] = useState(false);
  const [isReposting, setIsReposting] = useState(false);
  const [shareCount, setShareCount] = useState(post.shares || 0);

  const likeCount = (post.likesCount || post.likes || 0)
    + (isLiked && !post.isLikedByCurrentUser ? 1 : 0)
    + (!isLiked && post.isLikedByCurrentUser ? -1 : 0);

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

  // ✅ LinkedIn-style action button: icon in a soft circle + label + count
  const ActionButton = ({
    icon,
    activeIcon,
    active,
    label,
    count,
    onClick,
    activeColorClass,
  }: {
    icon: string;
    activeIcon?: string;
    active?: boolean;
    label: string;
    count?: number;
    onClick: () => void;
    activeColorClass?: string;
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 ${
        isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-[#e0d8cf]/60'
      } ${active ? (activeColorClass || 'text-[#0a66c2]') : (isDarkMode ? 'text-slate-300' : 'text-[#4a3728]/70')}`}
    >
      <i className={`${active && activeIcon ? activeIcon : icon} text-lg`}></i>
      <span className="text-sm font-semibold">{label}</span>
      {typeof count === 'number' && count > 0 && (
        <span className="text-sm">{count}</span>
      )}
    </button>
  );

  return (
    <div className="pt-2">
      {/* ✅ Reaction counts strip (LinkedIn jaise "8  💬2  🔁3  ➤") */}
      <div
        className={`flex items-center justify-between pb-2 mb-1 text-xs ${
          isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/50'
        }`}
      >
        <div className="flex items-center gap-1">
          {likeCount > 0 && (
            <span className="flex items-center gap-1">
              <i className="ri-thumb-up-fill text-[#0a66c2] text-sm"></i>
              {likeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {(post.commentsCount || post.comments || 0) > 0 && (
            <span>{post.commentsCount || post.comments} comments</span>
          )}
          {shareCount > 0 && <span>{shareCount} reposts</span>}
        </div>
      </div>

      <div
        className={`flex items-center justify-between border-t pt-1 ${
          isDarkMode ? 'border-slate-700' : 'border-[#4a3728]/10'
        }`}
      >
        <div className="flex items-center flex-1">
          <ActionButton
            icon="ri-thumb-up-line"
            activeIcon="ri-thumb-up-fill"
            active={isLiked}
            label="Like"
            onClick={() => handleLike(postKey)}
          />

          <ActionButton
            icon="ri-message-3-line"
            label="Comment"
            onClick={() => toggleComments(postKey)}
          />

          <div className="relative repost-menu flex-1">
            <button
              onClick={() => toggleRepostMenu(index)}
              disabled={isReposting}
              className={`w-full flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 ${
                hasReposted
                  ? 'text-green-600'
                  : isDarkMode
                  ? 'hover:bg-slate-700 text-slate-300'
                  : 'hover:bg-[#e0d8cf]/60 text-[#4a3728]/70'
              }`}
            >
              <i className={`ri-repeat-${hasReposted ? 'fill' : 'line'} text-lg`}></i>
              <span className="text-sm font-semibold">Repost</span>
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

          <ActionButton icon="ri-send-plane-line" label="Send" onClick={handleShare} />
        </div>
      </div>
    </div>
  );
};

export default PostActions;