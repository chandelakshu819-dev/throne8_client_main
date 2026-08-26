// src/features/dashboard/components/feed/PostActions.tsx
import React, { useState } from 'react';
import RepostMenuDropdown from './RepostMenuDropdown';
import SendPostModal from './SendPostModal';
import ReactionsModal from '@/features/profile/components/feed/ReactionsModal';
import AnalyticsService from '@/lib/api/analytics.service';

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
  // ✅ NEW — full post preview ke liye
  profileImage?: string;
  fullName?: string;
  headline?: string;
}

const PostActions = ({
  post,
  index,
  isDarkMode,
  likedPosts,
  handleLike,
  openRepostIndex,
  toggleRepostMenu,
  handleRepost,
  toggleComments,
  onOpenWithPerspectiveModal,
  handleRepostInstant,
  currentUserId,
  // ✅ NEW
  profileImage,
  fullName,
  headline,


}: PostActionsProps) => {
  const postKey = post?.entryId || post?.postId || post?.id || post?._id || (post?.originalPost ? (post.originalPost.entryId || post.originalPost.postId || post.originalPost.id || post.originalPost._id) : '');
  const isLiked = likedPosts[postKey] ?? post.isLikedByCurrentUser ?? false;

  const [hasReposted, setHasReposted] = useState(false);
  const [isReposting, setIsReposting] = useState(false);

  // ✅ Counts
  const shareCount = post.repostsCount || post.shares || 0;
  const sendCount = post.sendsCount || 0;
  const commentCount = post.commentsCount || post.comments || 0;

  const [showSendModal, setShowSendModal] = useState(false);
  const [showReactionsModal, setShowReactionsModal] = useState(false);

  const likeCount = post.likesCount ?? post.likes ?? 0;

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
      } ${
        active
          ? activeColorClass || 'text-[#0a66c2]'
          : isDarkMode
          ? 'text-slate-300'
          : 'text-[#4a3728]/70'
      }`}
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
      {/* Top summary bar */}
      <div
        className={`flex items-center justify-between pb-2 mb-1 text-xs ${
          isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/50'
        }`}
      >
        <div className="flex items-center gap-1">
          {likeCount > 0 && (
            <button
              onClick={() => setShowReactionsModal(true)}
              className="flex items-center gap-1 hover:underline"
            >
              <i className="ri-thumb-up-fill text-[#0a66c2] text-sm"></i>
              {likeCount}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {commentCount > 0 && <span>{commentCount} comments</span>}
          {shareCount > 0 && <span>{shareCount} reposts</span>}
          {sendCount > 0 && <span>{sendCount} sends</span>}
        </div>
      </div>

      {/* Action buttons */}
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
              data-repost-trigger={index}
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
              {shareCount > 0 && <span className="text-sm">{shareCount}</span>}
            </button>

            {openRepostIndex === index && (
              <RepostMenuDropdown
                isDarkMode={isDarkMode}
                index={index}
                post={post}
                onOpenWithPerspectiveModal={onOpenWithPerspectiveModal}
                onRepostInstant={(idx: any) => {
                  handleRepostInstant?.(idx);
                  toggleRepostMenu(idx);
                }}
              />
            )}
          </div>

          <ActionButton
            icon="ri-send-plane-line"
            label="Send"
            count={sendCount}
            onClick={() => setShowSendModal(true)}
          />
        </div>
      </div>

      {showSendModal && currentUserId && (
        <SendPostModal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          currentUserId={currentUserId}
          profileImage={profileImage}
fullName={fullName}
headline={headline}
          postId={postKey}
          postOwnerName={post.firstName || post.fullName || post.user || fullName || 'this'}
          postImage={post.image || post.images?.[0]?.cloudinarySecureUrl || ''}
          postTitle={post.content || post.title || post.text || ''}
          postAuthorAvatar={post.avatar || profileImage || ''}
          isDarkMode={isDarkMode}
          // ✅ NEW — poora post data chat preview ke liye
          postContent={post.content || post.title || post.text || ''}
          postImages={(post.images || []).map((img: any) => img?.cloudinarySecureUrl || img?.url || img).filter(Boolean)}
          postAuthorHeadline={headline || post.headline || ''}
          postCreatedAt={post.createdAt || ''}
        />
      )}

      <ReactionsModal
        postId={postKey}
        isOpen={showReactionsModal}
        onClose={() => setShowReactionsModal(false)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default PostActions;