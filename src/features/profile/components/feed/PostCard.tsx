// features/profile/components/feed/PostCard.tsx
// Force rebuild comment section slice update
import React from 'react';
import PostHeader from './PostHeader';
import PostContent from './PostContent';
import PostActions from './PostActions';
import CommentsSection from './CommentsSection';
import { usePostImpressionTracking } from '@/features/public/hooks/analytics/usePostImpressionTracking';
import { ReactionType } from '@/types/profile.types';

const PostCard = ({
  fullName, headline, postLikes, openMenuId, setOpenMenuId, onLikeToggle, onPinPost, onSavePost, onDeletePost, onArchivePost, onOpenUpdateModal, onToggleComments, commentsByPost, isLoadingComments, isSubmittingComment, commentLikes, formatCommentTime, isDeletingCommentId, setIsDeletingCommentId, replyingToCommentId, setReplyingToCommentId, currentUserId, post, index, isOwnProfile = true, isDarkMode, likedPosts, handleLike, openMenuIndex, openRepostIndex, openCommentsIndex, commentText, setCommentText, replyingTo, openCommentMenuIndex, editingCommentId, editCommentText, setEditCommentText, showEmojiPicker, setShowEmojiPicker, handlePostAction, handleRepost, toggleComments, handleCommentSubmit, handleReply, handleCommentReaction, toggleCommentMenu, handleCommentAction, handleEditSubmit, handleEmojiClick, postComments, emojiList, togglePostMenu, toggleRepostMenu, postCommentCounts, profileImage, onOpenWithPerspectiveModal, handleRepostInstant, replyText, setReplyText, handleReplySubmit, likeCommentToggle, commentLikeStatus, setReplyingTo,
  // ✅ ADDED: reaction system props — must be accepted here or JSX below throws
  // "postReactions is not defined" since it's used in the PostActions call.
  postReactions, onReact,
}: {
  fullName: string; headline: string; postLikes: any; openMenuId: any; setOpenMenuId: any; onLikeToggle: any; onPinPost: any; onSavePost: any; onDeletePost: any; onArchivePost: any; onOpenUpdateModal: any; onToggleComments: any; commentsByPost: any; isLoadingComments: any; isSubmittingComment: any; commentLikes: any; formatCommentTime: any; isDeletingCommentId: any; setIsDeletingCommentId: any; replyingToCommentId: any; setReplyingToCommentId: any; currentUserId: string; post: any; index: any; isOwnProfile?: boolean; isDarkMode: any; likedPosts: any; handleLike: any; openMenuIndex: any; openRepostIndex: any; openCommentsIndex: any; commentText: any; setCommentText: any; replyingTo: any; openCommentMenuIndex: any; editingCommentId: any; editCommentText: any; setEditCommentText: any; showEmojiPicker: any; setShowEmojiPicker: any; handlePostAction: any; handleRepost: any; toggleComments: any; handleCommentSubmit: any; handleReply: any; handleCommentReaction: any; toggleCommentMenu: any; handleCommentAction: any; handleEditSubmit: any; handleEmojiClick: any; postComments: any; emojiList: any; togglePostMenu: any; toggleRepostMenu: any; postCommentCounts: any; profileImage: any; onOpenWithPerspectiveModal?: any; handleRepostInstant?: any; replyText?: any; setReplyText?: any; handleReplySubmit?: any; likeCommentToggle?: any; commentLikeStatus?: any; setReplyingTo?: any;
  // ✅ ADDED
  postReactions?: Record<string, { counts: any; userReaction: ReactionType | null }>;
  onReact?: (postId: string, type: ReactionType) => void;
}) => {
  const { trackPostImpression } = usePostImpressionTracking();
  const postKey = post.entryId || post.postId;

  return (
    <div
      ref={trackPostImpression({
        postId: post.entryId || post.postId,
        postOwnerId: post.userId,
        source: 'profile'
      })}
      key={postKey}
      className={`p-6 rounded-3xl shadow-2xl backdrop-blur-xl border transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 ${isDarkMode ? 'bg-slate-800/60 border-slate-700/50' : 'bg-[#f6ede8]/95 border-[#4a3728]/20'
        } relative h-full flex flex-col`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#6b5643]/3 via-[#8b7355]/3 to-[#4a3728]/3 rounded-3xl"></div>
      <div className="relative z-10 flex flex-col justify-between h-full flex-1">
        <div>
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
        </div>

        <PostActions
          post={post}
          index={index}
          isDarkMode={isDarkMode}
          likedPosts={likedPosts}
          handleLike={handleLike}
          openRepostIndex={openRepostIndex}
          toggleRepostMenu={toggleRepostMenu}
          handleRepost={handleRepost}
          toggleComments={toggleComments}
          onOpenWithPerspectiveModal={onOpenWithPerspectiveModal}
          handleRepostInstant={handleRepostInstant}
          postReactions={postReactions}
          onReact={onReact}
        />

        {openCommentsIndex === postKey && (
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
            profileImage={profileImage} setReplyingTo={undefined} />
        )}
      </div>
    </div>
  );
};

export default PostCard;