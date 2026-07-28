// features/profile/components/feed/PostDetailModal.tsx
import React from 'react';
import PostHeader from './PostHeader';
import PostContent from './PostContent';
import PostActions from './PostActions';
import CommentsSection from './CommentsSection';
import { ReactionType } from '@/types/profile.types';

const PostDetailModal = ({
  post,
  index,
  isDarkMode,
  onClose,
  currentUserId,
  isOwnProfile = true,
  fullName,
  headline,
  profileImage,
  openMenuIndex,
  togglePostMenu,
  handlePostAction,
  likedPosts,
  handleLike,
  openRepostIndex,
  toggleRepostMenu,
  handleRepost,
  onOpenWithPerspectiveModal,
  handleRepostInstant,
  postReactions,
  onReact,
  commentText,
  setCommentText,
  replyingTo,
  openCommentMenuIndex,
  editingCommentId,
  editCommentText,
  setEditCommentText,
  showEmojiPicker,
  setShowEmojiPicker,
  handleReply,
  handleCommentReaction,
  toggleCommentMenu,
  handleCommentAction,
  handleEditSubmit,
  handleEmojiClick,
  handleCommentSubmit,
  emojiList,
  postComments,
  postCommentCounts,
}: {
  post: any;
  index: any;
  isDarkMode: any;
  onClose: () => void;
  currentUserId: string;
  isOwnProfile?: boolean;
  fullName?: string;
  headline?: string;
  profileImage: any;
  openMenuIndex: any;
  togglePostMenu: any;
  handlePostAction: any;
  likedPosts: any;
  handleLike: any;
  openRepostIndex: any;
  toggleRepostMenu: any;
  handleRepost: any;
  onOpenWithPerspectiveModal?: any;
  handleRepostInstant?: any;
  postReactions?: Record<string, { counts: any; userReaction: ReactionType | null }>;
  onReact?: (postId: string, type: ReactionType) => void;
  commentText: any;
  setCommentText: any;
  replyingTo: any;
  openCommentMenuIndex: any;
  editingCommentId: any;
  editCommentText: any;
  setEditCommentText: any;
  showEmojiPicker: any;
  setShowEmojiPicker: any;
  handleReply: any;
  handleCommentReaction: any;
  toggleCommentMenu: any;
  handleCommentAction: any;
  handleEditSubmit: any;
  handleEmojiClick: any;
  handleCommentSubmit: any;
  emojiList: any;
  postComments: any;
  postCommentCounts: any;
}) => {
  const postKey = post.entryId || post.postId;
  const mediaUrl = post.image || post.mediaUrl || post.postImage || null;
  const hasMedia = !!mediaUrl;

  // Close on ESC key
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // Prevent background scroll while modal is open
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-5xl h-[92vh] sm:h-[88vh] rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl ${
          isDarkMode ? 'bg-slate-800' : 'bg-[#f6ede8]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Left: media panel — only rendered if the post actually has an image/video */}
        {hasMedia && (
          <div className="flex-1 bg-black flex items-center justify-center min-h-[240px] md:min-h-0">
            <img
              src={mediaUrl}
              alt="post media"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        )}

        {/* Right: header + content + actions + comments */}
        <div
          className={`flex flex-col ${hasMedia ? 'w-full md:w-[420px]' : 'w-full'} h-full overflow-y-auto p-4`}
        >
          <PostHeader
            currentUserId={currentUserId}
            post={post}
            index={postKey}
            isOwnProfile={isOwnProfile}
            isDarkMode={isDarkMode}
            openMenuIndex={openMenuIndex}
            togglePostMenu={togglePostMenu}
            handlePostAction={handlePostAction}
            fullName={fullName}
            profileImage={profileImage}
            headline={headline}
          />

          <PostContent post={post} isDarkMode={isDarkMode} />

          <PostActions
            post={post}
            index={index}
            isDarkMode={isDarkMode}
            likedPosts={likedPosts}
            handleLike={handleLike}
            openRepostIndex={openRepostIndex}
            toggleRepostMenu={toggleRepostMenu}
            handleRepost={handleRepost}
            toggleComments={() => {}}
            onOpenWithPerspectiveModal={onOpenWithPerspectiveModal}
            handleRepostInstant={handleRepostInstant}
            postReactions={postReactions}
            onReact={onReact}
            currentUserId={currentUserId}
          />

          <div className="flex-1 overflow-y-auto mt-2">
            <CommentsSection
              isDarkMode={isDarkMode}
              commentText={commentText}
              setCommentText={setCommentText}
              replyingTo={replyingTo}
              openCommentMenuIndex={openCommentMenuIndex}
              editingCommentId={editingCommentId}
              editCommentText={editCommentText}
              setEditCommentText={setEditCommentText}
              showEmojiPicker={showEmojiPicker}
              setShowEmojiPicker={setShowEmojiPicker}
              commentCount={postCommentCounts?.[postKey] ?? post.commentsCount ?? 0}
              handleReply={handleReply}
              handleCommentReaction={handleCommentReaction}
              toggleCommentMenu={toggleCommentMenu}
              handleCommentAction={handleCommentAction}
              handleEditSubmit={handleEditSubmit}
              handleEmojiClick={handleEmojiClick}
              postId={postKey}
              comments={postComments?.[postKey] || []}
              handleCommentSubmit={() => handleCommentSubmit(postKey)}
              emojiList={emojiList}
              profileImage={profileImage}
              setReplyingTo={undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailModal;