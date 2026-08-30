
// features/profile/components/feed/PostCard.tsx

// Force rebuild comment section slice update
import React, { useRef, useLayoutEffect, useState } from 'react';
import PostHeader from './PostHeader';
import PostContent from './PostContent';
import PostActions from './PostActions';
import CommentsSection from './CommentsSection';
import PostDetailModal from './PostDetailModal';
import { usePostImpressionTracking } from '@/features/public/hooks/analytics/usePostImpressionTracking';
import { ReactionType } from '@/types/profile.types';

const PostCard = ({
  fullName, headline, postLikes, openMenuId, setOpenMenuId, onLikeToggle, onPinPost, onSavePost, onDeletePost, onArchivePost, onOpenUpdateModal, onToggleComments, commentsByPost, isLoadingComments, isSubmittingComment, commentLikes, formatCommentTime, isDeletingCommentId, setIsDeletingCommentId, replyingToCommentId, setReplyingToCommentId, currentUserId, post, index, isOwnProfile = true, isDarkMode, likedPosts, handleLike, openMenuIndex, openRepostIndex, openCommentsIndex, commentText, setCommentText, replyingTo, openCommentMenuIndex, editingCommentId, editCommentText, setEditCommentText, showEmojiPicker, setShowEmojiPicker, handlePostAction, handleRepost, toggleComments, handleCommentSubmit, handleReply, handleCommentReaction, toggleCommentMenu, handleCommentAction, handleEditSubmit, handleEmojiClick, postComments, emojiList, togglePostMenu, toggleRepostMenu, postCommentCounts, profileImage, onOpenWithPerspectiveModal, handleRepostInstant, replyText, setReplyText, handleReplySubmit, likeCommentToggle, commentLikeStatus, setReplyingTo,showMenu = true, 
  // ✅ ADDED: reaction system props — must be accepted here or JSX below throws
  // "postReactions is not defined" since it's used in the PostActions call.
  postReactions, onReact, fetchCommentsByPost, postSaves, postPins, isFollowing = true,
}: {
  fullName: string; headline: string; postLikes: any; openMenuId: any; setOpenMenuId: any; onLikeToggle: any; onPinPost: any; onSavePost: any; onDeletePost: any; onArchivePost: any; onOpenUpdateModal: any; onToggleComments: any; commentsByPost: any; isLoadingComments: any; isSubmittingComment: any; commentLikes: any; formatCommentTime: any; isDeletingCommentId: any; setIsDeletingCommentId: any; replyingToCommentId: any; setReplyingToCommentId: any; currentUserId: string; post: any; index: any; isOwnProfile?: boolean; isDarkMode: any; likedPosts: any; handleLike: any; openMenuIndex: any; openRepostIndex: any; openCommentsIndex: any; commentText: any; setCommentText: any; replyingTo: any; openCommentMenuIndex: any; editingCommentId: any; editCommentText: any; setEditCommentText: any; showEmojiPicker: any; setShowEmojiPicker: any; handlePostAction: any; handleRepost: any; toggleComments: any; handleCommentSubmit: any; handleReply: any; handleCommentReaction: any; toggleCommentMenu: any; handleCommentAction: any; handleEditSubmit: any; handleEmojiClick: any; postComments: any; emojiList: any; togglePostMenu: any; toggleRepostMenu: any; postCommentCounts: any; profileImage: any; onOpenWithPerspectiveModal?: any; handleRepostInstant?: any; replyText?: any; setReplyText?: any; handleReplySubmit?: any; likeCommentToggle?: any; commentLikeStatus?: any; setReplyingTo?: any;
  // ✅ ADDED
  postReactions?: Record<string, { counts: any; userReaction: ReactionType | null }>;
  onReact?: (postId: string, type: ReactionType) => void;
  fetchCommentsByPost?: (postId: string, ownerId?: string) => Promise<void>;
  showMenu?: boolean; // ✅ NEW
  postSaves?: Record<string, boolean>; // ✅ NEW
  postPins?: Record<string, boolean>; // ✅ NEW
  isFollowing?: boolean; // ✅ NEW — profile owner ko current user follow kar raha hai ya nahi

}) => {
  const { trackPostImpression } = usePostImpressionTracking();
  const postKey = post.entryId || post.postId;

  // LinkedIn-style expanded post modal
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);

  // ✅ NEW: modal kholte waqt, agar comments pehle se fetch nahi hui hain
  // to onToggleComments (= handlers.toggleCommentsPanel) call karo taaki
  // comments load ho jayein — modal me purane comments dikhne lagenge
  
  const handleOpenDetailModal = () => {
    setIsDetailOpen(true);
    if (postKey && (!commentsByPost || !commentsByPost[postKey]) && fetchCommentsByPost) {
      fetchCommentsByPost(postKey, post.userId);
    }
  };


//   const contentWrapperRef = React.useRef<HTMLDivElement>(null);
// const [contentScale, setContentScale] = React.useState(1);

// React.useLayoutEffect(() => {
//   const el = contentWrapperRef.current;
//   if (!el) return;
//   const parentHeight = el.parentElement?.clientHeight || 0;
//   const contentHeight = el.scrollHeight;
//   if (contentHeight > parentHeight && parentHeight > 0) {
//     setContentScale(parentHeight / contentHeight);
//   } else {
//     setContentScale(1);
//   }
// }, [post]);

  return (
    <div
      ref={trackPostImpression({
        postId: post.entryId || post.postId,
        postOwnerId: post.userId,
        source: 'profile'
      })}
      key={postKey}
      className={`p-4 rounded-3xl shadow-2xl backdrop-blur-xl border transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 ${isDarkMode ? 'bg-slate-800/60 border-slate-700/50' : 'bg-[#f6ede8]/95 border-[#4a3728]/20'
        } relative h-full flex flex-col overflow-hidden`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#6b5643]/3 via-[#8b7355]/3 to-[#4a3728]/3 rounded-3xl"></div>
      <div className="relative z-10 flex flex-col justify-between h-full flex-1 min-h-0">
      <div className="flex-1 min-h-0">
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
            showMenu={showMenu} // ✅ NEW
            isSaved={postSaves ? (postSaves[postKey] ?? (post as any).isSaved ?? false) : ((post as any).isSaved ?? false)} // ✅ NEW
            isPinned={postPins ? (postPins[postKey] ?? (post as any).isPinned ?? false) : ((post as any).isPinned ?? false)} // ✅ NEW
            isFollowing={isFollowing} // ✅ NEW — PostMenuDropdown tak yahi se aage jayega

          />
          {/* Click on post body opens the LinkedIn-style expanded modal */}
          <div onClick={handleOpenDetailModal} className="cursor-pointer">
            <PostContent post={post} isDarkMode={isDarkMode} disableToggle />
          </div>
        </div>

        <div className="flex-shrink-0">


        <PostActions
          post={post}
          index={index}
          isDarkMode={isDarkMode}
          likedPosts={likedPosts}
          handleLike={handleLike}
          openRepostIndex={openRepostIndex}
          toggleRepostMenu={toggleRepostMenu}
          handleRepost={handleRepost}
          toggleComments={handleOpenDetailModal}
          headline={headline}
          onOpenWithPerspectiveModal={onOpenWithPerspectiveModal}
          handleRepostInstant={handleRepostInstant}
          postReactions={postReactions}
          onReact={onReact}
          currentUserId={currentUserId}
          profileImage={profileImage}   // ✅ NEW
          fullName={fullName}           // ✅ NEW
        />
        </div>

        {/* {openCommentsIndex === postKey && (
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
          />
        )} */}
      </div>

      {isDetailOpen && (
        <PostDetailModal
          post={post}
          index={index}
          isDarkMode={isDarkMode}
          onClose={() => setIsDetailOpen(false)}
          currentUserId={currentUserId}
          isOwnProfile={isOwnProfile}
          fullName={fullName}
          headline={headline}
          profileImage={profileImage}
          openMenuIndex={openMenuIndex}
          togglePostMenu={togglePostMenu}
          handlePostAction={handlePostAction}
          likedPosts={likedPosts}
          handleLike={handleLike}
          openRepostIndex={openRepostIndex}
          toggleRepostMenu={toggleRepostMenu}
          handleRepost={handleRepost}
          onOpenWithPerspectiveModal={onOpenWithPerspectiveModal}
          handleRepostInstant={handleRepostInstant}
          postReactions={postReactions}
          onReact={onReact}
          commentText={commentText}
          setCommentText={setCommentText}
          replyingTo={replyingTo}
          openCommentMenuIndex={openCommentMenuIndex}
          editingCommentId={editingCommentId}
          editCommentText={editCommentText}
          setEditCommentText={setEditCommentText}
          showEmojiPicker={showEmojiPicker}
          setShowEmojiPicker={setShowEmojiPicker}
          handleReply={handleReply}
          handleCommentReaction={handleCommentReaction}
          toggleCommentMenu={toggleCommentMenu}
          handleCommentAction={handleCommentAction}
          handleEditSubmit={handleEditSubmit}
          handleEmojiClick={handleEmojiClick}
          handleCommentSubmit={handleCommentSubmit}
          emojiList={emojiList}
          postComments={postComments}
          postCommentCounts={postCommentCounts}
          isLoadingComments={isLoadingComments}
          isFollowing={isFollowing} // ✅ NEW
        />
      )}
    </div>
   
  );
};

export default PostCard;