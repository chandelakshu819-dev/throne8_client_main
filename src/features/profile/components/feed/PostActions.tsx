// src/features/profile/components/feed/PostActions.tsx
import React, { useState } from 'react';
import RepostMenuDropdown from './RepostMenuDropdown';
import SendPostModal from './SendPostModal';

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
  currentUserId?: string;
}

// ✅ SIMPLIFIED: ab yeh bilkul dashboard/feed ke PostActions jaisa hai —
// koi ReactionPicker / multi-reaction system nahi, seedha simple
// thumbs-up Like jo handleLike (ProfileService.likePost/unlikePost) use
// karta hai. Purana version onReact/postReactions (reactToPost/removeReaction)
// pe depend karta tha jo thik se kaam nahi kar raha tha.
const PostActions = ({
  post, index, isDarkMode, likedPosts, handleLike, openRepostIndex, toggleRepostMenu,
  handleRepost, toggleComments, onOpenWithPerspectiveModal, handleRepostInstant,
  currentUserId,
}: PostActionsProps) => {
  const postKey = post.entryId || post.postId;

  const isLiked =
    (typeof likedPosts?.[postKey] === 'object' ? likedPosts[postKey]?.isLiked : likedPosts?.[postKey])
    ?? post.isLikedByCurrentUser
    ?? false;

  const likeCount =
    (typeof likedPosts?.[postKey] === 'object' ? likedPosts[postKey]?.count : undefined)
    ?? post.likesCount
    ?? post.likes
    ?? 0;

  const commentCount = post.commentsCount || post.comments || 0;

  const [hasReposted, setHasReposted] = useState(false);
  const [isReposting, setIsReposting] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  const mutedText = isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/60';
  const hoverBg = isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-[#e0d8cf]/60';
  const iconText = isDarkMode ? 'text-slate-300' : 'text-[#4a3728]';

  return (
    <div className="pt-3 mt-1">
      {/* ── Row 1: summary counts ── */}
      {(likeCount > 0 || commentCount > 0) && (
        <div className={`flex items-center justify-between px-1 pb-2 text-sm ${mutedText}`}>
          <div className="flex items-center gap-1.5">
            {likeCount > 0 && (
              <>
                <i className="ri-thumb-up-fill text-[#0a66c2] text-sm"></i>
                <span>{likeCount}</span>
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

      {/* ── Row 2: Like / Comment / Repost / Send ── */}
      <div className="grid grid-cols-4 gap-1 pt-1">

        {/* Like — simple direct toggle, same as dashboard feed */}
        <button
          onClick={() => handleLike?.(postKey)}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
            isLiked ? 'text-[#0a66c2]' : `${iconText} ${hoverBg}`
          }`}
        >
          <i className={`ri-thumb-up-${isLiked ? 'fill' : 'line'} text-lg`}></i>
          <span>Like</span>
        </button>

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

        {/* Send */}
        <button
          onClick={() => setShowSendModal(true)}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${iconText} ${hoverBg}`}
        >
          <i className="ri-send-plane-line text-lg"></i>
          <span>Send</span>
        </button>
      </div>

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