// features/dashboard/components/feed/PostDetailModal.tsx
import React from 'react';
import { createPortal } from 'react-dom';
import PostHeader from './PostHeader';
import PostContent from './PostContent';
import PostActions from './PostActions';
import CommentsSection from './CommentsSection';

const PostDetailModal = ({
  post,
  index,
  isDarkMode,
  onClose,
  currentUserId,
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
  profileImage,
  postComments,
  postCommentCounts,
  fetchCommentsForPost,
}: {
  post: any;
  index: any;
  isDarkMode: any;
  onClose: () => void;
  currentUserId: string;
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
  profileImage: any;
  postComments: any;
  postCommentCounts: any;
  fetchCommentsForPost?: (postId: string) => void;
}) => {
  const postKey = post.entryId || post.postId;
  const mediaUrl = post.image || post.mediaUrl || post.postImage || null;
  const hasMedia = !!mediaUrl;

  // Modal khulte hi comments fetch karo agar already load nahi hue
  React.useEffect(() => {
    if (fetchCommentsForPost && !postComments?.[postKey]) {
      fetchCommentsForPost(postKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postKey]);

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

  // Next.js SSR-safe mount check — document.body only exists client-side
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const modalContent = (
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
          className="absolute top-3 right-3 z-30 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
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

        {/* Right: single continuous scroll pane — header, content, actions, comments sab ek saath scroll hote hain (LinkedIn style) */}
        <div
          className={`flex flex-col ${hasMedia ? 'w-full md:w-[420px]' : 'w-full'} h-full min-h-0`}
        >
          {/* ✅ Sticky author header — LinkedIn jaisa, scroll karte waqt bhi upar dikhta rehta hai */}
          <div
            className={`sticky top-0 z-20 px-4 pt-4 pb-2 ${
              isDarkMode ? 'bg-slate-800' : 'bg-[#f6ede8]'
            }`}
          >
            <PostHeader
              currentUserId={currentUserId}
              post={post}
              index={index}
              isDarkMode={isDarkMode}
              openMenuIndex={openMenuIndex}
              togglePostMenu={togglePostMenu}
              handlePostAction={handlePostAction}
            />
          </div>

          {/* ✅ Everything below scrolls together in ONE pane — no nested scroll containers */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
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
              currentUserId={currentUserId}
            />

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
              currentUserId={currentUserId}
              postOwnerId={post.userId}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default PostDetailModal;