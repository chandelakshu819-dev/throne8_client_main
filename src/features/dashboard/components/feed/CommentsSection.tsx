// app/(dashboard)/components/feed/CommentsSection.tsx
import React, { useState } from 'react';
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';

interface CommentsSectionProps {
  isDarkMode: any;
  commentText: any;
  setCommentText: any;
  replyingTo: any;
  openCommentMenuIndex: any;
  commentCount: any;
  setReplyingTo: any;
  profileImage: any;
  editingCommentId: any;
  editCommentText: any;
  setEditCommentText: any;
  showEmojiPicker: any;
  setShowEmojiPicker: any;
  handleCommentSubmit: any;
  handleReply: any;
  handleCommentReaction: any;
  toggleCommentMenu: any;
  handleCommentAction: any;
  handleEditSubmit: any;
  handleEmojiClick: any;
  comments: any;
  postId: any;
  emojiList: any;
}

const CommentsSection = ({
  isDarkMode,
  commentCount,
  commentText,
  setCommentText,
  replyingTo,
  openCommentMenuIndex,
  setReplyingTo,
  profileImage,
  editingCommentId,
  editCommentText,
  setEditCommentText,
  showEmojiPicker,
  setShowEmojiPicker,
  handleCommentSubmit,
  handleReply,
  handleCommentReaction,
  toggleCommentMenu,
  handleCommentAction,
  handleEditSubmit,
  handleEmojiClick,
  comments = [],
  postId,
  emojiList,
}: CommentsSectionProps) => {
  const [visibleCommentsCount, setVisibleCommentsCount] = useState(3);
  const [sortMode, setSortMode] = useState<'relevant' | 'recent'>('relevant');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const sortedComments = React.useMemo(() => {
    const list = [...(comments || [])];
    if (sortMode === 'recent') {
      return list.sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    }
    // "Most relevant" — likes count first, fallback createdAt
    return list.sort((a, b) => {
      const aLikes = Object.values(a.reactions || {}).reduce((s: number, v: any) => s + v, 0);
      const bLikes = Object.values(b.reactions || {}).reduce((s: number, v: any) => s + v, 0);
      if (bLikes !== aLikes) return bLikes - aLikes;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [comments, sortMode]);

  const visibleComments = sortedComments.slice(0, visibleCommentsCount);

  return (
    <div
      className={`mt-4 pt-4 border-t animate-[fadeIn_0.25s_ease-out] ${
        isDarkMode ? 'border-slate-700' : 'border-[#4a3728]/20'
      }`}
    >
      {/* ── Comment input at top, LinkedIn style ── */}
      <CommentInput
        isDarkMode={isDarkMode}
        commentText={commentText}
        setCommentText={setCommentText}
        replyingTo={replyingTo}
        showEmojiPicker={showEmojiPicker}
        setShowEmojiPicker={setShowEmojiPicker}
        profileImage={profileImage}
        handleCommentSubmit={handleCommentSubmit}
        handleEmojiClick={handleEmojiClick}
        emojiList={emojiList}
      />

      {/* ── "Most relevant" sort dropdown ── */}
      {sortedComments.length > 0 && (
        <div className="relative mt-4 mb-3">
          <button
            onClick={() => setShowSortMenu((prev) => !prev)}
            className={`flex items-center gap-1 text-sm font-semibold ${
              isDarkMode ? 'text-slate-300 hover:text-white' : 'text-[#4a3728] hover:text-[#6b5643]'
            }`}
          >
            {sortMode === 'relevant' ? 'Most relevant' : 'Most recent'}
            <i className={`ri-arrow-down-s-line text-base transition-transform ${showSortMenu ? 'rotate-180' : ''}`}></i>
          </button>

          {showSortMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
              <div
                className={`absolute left-0 top-full mt-1 z-20 w-44 rounded-xl shadow-2xl border py-1 ${
                  isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-[#4a3728]/10'
                }`}
              >
                {(['relevant', 'recent'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setSortMode(mode);
                      setShowSortMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      sortMode === mode ? 'font-bold' : 'font-medium'
                    } ${
                      isDarkMode
                        ? 'text-white hover:bg-slate-700'
                        : 'text-[#4a3728] hover:bg-[#f6ede8]'
                    }`}
                  >
                    {mode === 'relevant' ? 'Most relevant' : 'Most recent'}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Comments list ── */}
      <div className="space-y-1">
        {visibleComments.map((comment: any) => (
          <CommentItem
            key={comment.commentId || comment._id}
            comment={comment}
            isDarkMode={isDarkMode}
            openCommentMenuIndex={openCommentMenuIndex}
            setReplyingTo={setReplyingTo}
            profileImage={profileImage}
            editingCommentId={editingCommentId}
            editCommentText={editCommentText}
            setEditCommentText={setEditCommentText}
            handleCommentReaction={handleCommentReaction}
            toggleCommentMenu={toggleCommentMenu}
            handleCommentAction={handleCommentAction}
            handleEditSubmit={handleEditSubmit}
            handleReply={handleReply}
          />
        ))}
      </div>

      {sortedComments.length > visibleCommentsCount && (
        <button
          onClick={() => setVisibleCommentsCount((prev) => prev + 3)}
          className={`text-sm font-semibold mt-2 mb-1 px-2 hover:underline ${
            isDarkMode ? 'text-slate-300 hover:text-white' : 'text-[#6b5643] hover:text-[#4a3728]'
          }`}
        >
          Load more comments
        </button>
      )}
    </div>
  );
};

export default CommentsSection;