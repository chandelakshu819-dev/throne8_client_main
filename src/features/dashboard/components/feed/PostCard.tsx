// features/dashboard/components/feed/PostCard.tsx

import React from 'react';
import PostHeader from './PostHeader';
import PostContent from './PostContent';
import PostActions from './PostActions';
import CommentsSection from './CommentsSection';
import PostDetailModal from './PostDetailModal';
import { usePostImpressionTracking } from '@/features/public/hooks/analytics/usePostImpressionTracking';
import AnalyticsService from '@/lib/api/analytics.service';

const PostCard = ({
  fullName, headline,postLikes,openMenuId, setOpenMenuId, onLikeToggle, onPinPost,onSavePost, onDeletePost, onArchivePost, onOpenUpdateModal, onToggleComments, commentsByPost, isLoadingComments, isSubmittingComment, commentLikes, formatCommentTime, isDeletingCommentId, setIsDeletingCommentId, replyingToCommentId, setReplyingToCommentId, currentUserId, post, index, isDarkMode, likedPosts, handleLike, openMenuIndex, openRepostIndex, openCommentsIndex, commentText, setCommentText, replyingTo, openCommentMenuIndex, editingCommentId, editCommentText, setEditCommentText, showEmojiPicker, setShowEmojiPicker, handlePostAction, handleRepost, toggleComments, handleCommentSubmit, handleReply, handleCommentReaction, toggleCommentMenu, handleCommentAction, handleEditSubmit, handleEmojiClick, postComments, emojiList, togglePostMenu, toggleRepostMenu, postCommentCounts, profileImage, onOpenWithPerspectiveModal, handleRepostInstant, replyText, setReplyText, handleReplySubmit, likeCommentToggle, commentLikeStatus, setReplyingTo, commentsLoading, fetchCommentsForPost,
}: {
  fullName: string; headline: string;postLikes: any; openMenuId: any; setOpenMenuId: any; onLikeToggle: any; onPinPost: any; onSavePost: any; onDeletePost: any; onArchivePost: any; onOpenUpdateModal: any; onToggleComments: any; commentsByPost: any; isLoadingComments: any; isSubmittingComment: any; commentLikes: any; formatCommentTime: any; isDeletingCommentId: any; setIsDeletingCommentId: any; replyingToCommentId: any; setReplyingToCommentId: any;  currentUserId: string; post: any; index: any; isDarkMode: any; likedPosts: any; handleLike: any; openMenuIndex: any; openRepostIndex: any; openCommentsIndex: any; commentText: any; setCommentText: any; replyingTo: any; openCommentMenuIndex: any; editingCommentId: any; editCommentText: any; setEditCommentText: any; showEmojiPicker: any; setShowEmojiPicker: any; handlePostAction: any; handleRepost: any; toggleComments: any; handleCommentSubmit: any; handleReply: any; handleCommentReaction: any; toggleCommentMenu: any; handleCommentAction: any; handleEditSubmit: any; handleEmojiClick: any; postComments: any; emojiList: any; togglePostMenu: any; toggleRepostMenu: any; postCommentCounts: any; profileImage: any; onOpenWithPerspectiveModal?: any; handleRepostInstant?: any; replyText?: any; setReplyText?: any; handleReplySubmit?: any; likeCommentToggle?: any; commentLikeStatus?: any; setReplyingTo?: any; commentsLoading?: any; fetchCommentsForPost?: any;
}) => {
  const { trackPostImpression } = usePostImpressionTracking();
  const postKey = post.entryId || post.postId;

  // LinkedIn-style expanded post modal
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);

  // "Liked by connections you know" — LinkedIn style social proof line
  const [dismissedLikedBy, setDismissedLikedBy] = React.useState(false);
  const [showLikersList, setShowLikersList] = React.useState(false);

  // "Commented by connections you know"
  const [dismissedCommentedBy, setDismissedCommentedBy] = React.useState(false);
  const [showCommentersList, setShowCommentersList] = React.useState(false);

  const renderLikedByConnections = () => {
    const names: string[] = post.likedByConnections || [];
    const totalCount: number = post.likedByConnectionsCount || 0;
    const fullList: Array<{ userId: string; name: string; avatar: string | null }> =
      post.likedByConnectionsFull || [];

    if (names.length === 0 || dismissedLikedBy) return null;

    let text = '';
    if (names.length === 1) {
      text = `${names[0]} likes this`;
    } else if (names.length >= 2) {
      const shown = names.slice(0, 2).join(' and ');
      const remaining = totalCount - Math.min(names.length, 2);
      text = remaining > 0
        ? `${shown} and ${remaining} other${remaining > 1 ? 's' : ''} like this`
        : `${shown} like this`;
    }

    const firstLikerAvatar = post.likedByConnectionsAvatars?.[0] || null;
    const firstLikerInitial = names[0]?.charAt(0)?.toUpperCase() || '?';

    return (
      <div
        className={`relative flex items-center justify-between gap-2 mb-2 pb-3 border-b text-sm ${isDarkMode ? 'text-slate-300 border-slate-700/50' : 'text-[#4a3728]/80 border-[#4a3728]/10'
          }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {firstLikerAvatar ? (
            <img
              src={firstLikerAvatar}
              alt={names[0]}
              className="w-6 h-6 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-[#6b5643] text-white'
                }`}
            >
              {firstLikerInitial}
            </div>
          )}
          <p className="truncate">
            <span className="font-semibold">{text}</span>
          </p>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setShowLikersList((prev) => !prev)}
            className={`p-1 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-[#e0d8cf]/50'
              }`}
            aria-label="Show who liked this"
          >
            <span className="text-lg leading-none">⋯</span>
          </button>
          <button
            onClick={() => setDismissedLikedBy(true)}
            className={`p-1 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-[#e0d8cf]/50'
              }`}
            aria-label="Dismiss"
          >
            <span className="text-lg leading-none">✕</span>
          </button>
        </div>

        {showLikersList && fullList.length > 0 && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowLikersList(false)}
            />
            <div
              className={`absolute right-0 top-full mt-1 z-20 w-64 max-h-72 overflow-y-auto rounded-xl shadow-2xl border py-2 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-[#4a3728]/10'
                }`}
            >
              {fullList.map((liker) => (
                <div
                  key={liker.userId}
                  className={`flex items-center gap-3 px-4 py-2 ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-[#f6ede8]'
                    }`}
                >
                  {liker.avatar ? (
                    <img
                      src={liker.avatar}
                      alt={liker.name}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-[#6b5643] text-white'
                        }`}
                    >
                      {liker.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>
                    {liker.name}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  // ✅ "Commented by connections you know" — same pattern as likes
  const renderCommentedByConnections = () => {
    const names: string[] = post.commentedByConnections || [];
    const totalCount: number = post.commentedByConnectionsCount || 0;
    const fullList: Array<{ userId: string; name: string; avatar: string | null }> =
      post.commentedByConnectionsFull || [];

    if (names.length === 0 || dismissedCommentedBy) return null;

    let text = '';
    if (names.length === 1) {
      text = `${names[0]} commented on this`;
    } else if (names.length >= 2) {
      const shown = names.slice(0, 2).join(' and ');
      const remaining = totalCount - Math.min(names.length, 2);
      text = remaining > 0
        ? `${shown} and ${remaining} other${remaining > 1 ? 's' : ''} commented`
        : `${shown} commented`;
    }

    const firstCommenterAvatar = post.commentedByConnectionsAvatars?.[0] || null;
    const firstCommenterInitial = names[0]?.charAt(0)?.toUpperCase() || '?';

    return (
      <div
        className={`relative flex items-center justify-between gap-2 mb-4 pb-3 border-b text-sm ${isDarkMode ? 'text-slate-300 border-slate-700/50' : 'text-[#4a3728]/80 border-[#4a3728]/10'
          }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {firstCommenterAvatar ? (
            <img
              src={firstCommenterAvatar}
              alt={names[0]}
              className="w-6 h-6 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-[#6b5643] text-white'
                }`}
            >
              {firstCommenterInitial}
            </div>
          )}
          <p className="truncate">
            <span className="font-semibold">{text}</span>
          </p>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setShowCommentersList((prev) => !prev)}
            className={`p-1 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-[#e0d8cf]/50'
              }`}
            aria-label="Show who commented"
          >
            <span className="text-lg leading-none">⋯</span>
          </button>
          <button
            onClick={() => setDismissedCommentedBy(true)}
            className={`p-1 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-[#e0d8cf]/50'
              }`}
            aria-label="Dismiss"
          >
            <span className="text-lg leading-none">✕</span>
          </button>
        </div>

        {showCommentersList && fullList.length > 0 && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowCommentersList(false)}
            />
            <div
              className={`absolute right-0 top-full mt-1 z-20 w-64 max-h-72 overflow-y-auto rounded-xl shadow-2xl border py-2 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-[#4a3728]/10'
                }`}
            >
              {fullList.map((commenter) => (
                <div
                  key={commenter.userId}
                  className={`flex items-center gap-3 px-4 py-2 ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-[#f6ede8]'
                    }`}
                >
                  {commenter.avatar ? (
                    <img
                      src={commenter.avatar}
                      alt={commenter.name}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-[#6b5643] text-white'
                        }`}
                    >
                      {commenter.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>
                    {commenter.name}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div
      ref={trackPostImpression({
        postId: post.postId,
        postOwnerId: post.userId,
        source: 'feed'
      })}
      key={post.postId}
      className={`p-6 rounded-3xl shadow-2xl backdrop-blur-xl border transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 ${isDarkMode ? 'bg-slate-800/60 border-slate-700/50' : 'bg-[#f6ede8]/95 border-[#4a3728]/20'
        } relative`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#6b5643]/3 via-[#8b7355]/3 to-[#4a3728]/3 rounded-3xl"></div>
      <div className="relative z-10">
        {renderLikedByConnections()}
        {renderCommentedByConnections()}

        <PostHeader
          currentUserId={currentUserId}
          post={post}
          index={index}
          isDarkMode={isDarkMode}
          openMenuIndex={openMenuIndex}
          togglePostMenu={togglePostMenu}
          handlePostAction={handlePostAction}
        />

        {/* Click on post body opens the LinkedIn-style expanded modal */}
        <div
          onClick={() => {
            setIsDetailOpen(true);
            AnalyticsService.recordClick(post.userId, 'post_link', undefined, post.postId);
          }}
          className="cursor-pointer"
        >
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
          currentUserId={currentUserId} 
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
            profileImage={profileImage}
            setReplyingTo={undefined}
            currentUserId={currentUserId}
            postOwnerId={post.userId}
            commentsLoading={commentsLoading?.[postKey]}
          />
        )}
      </div>

      {isDetailOpen && (
        <PostDetailModal
          post={post}
          index={index}
          isDarkMode={isDarkMode}
          onClose={() => setIsDetailOpen(false)}
          currentUserId={currentUserId}
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
          profileImage={profileImage}
          postComments={postComments}
          postCommentCounts={postCommentCounts}
          fetchCommentsForPost={fetchCommentsForPost}
        />
      )}
    </div>
  );
};

export default PostCard;