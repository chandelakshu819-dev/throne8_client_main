// app/(dashboard)/components/feed/CommentItem.tsx
import React from 'react';
import CommentMenuDropdown from './CommentMenuDropdown';
import { renderFormattedContent } from '@/shared/utils/postContentFormat';

const CommentItem = ({
  comment,
  isDarkMode,
  openCommentMenuIndex,
  editingCommentId,
  editCommentText,
  setEditCommentText,
  handleCommentReaction,
  toggleCommentMenu,
  handleCommentAction,
  handleEditSubmit,
  handleReply,
  setReplyingTo,
  profileImage,
}: {
  comment: any;
  isDarkMode: any;
  openCommentMenuIndex: any;
  editingCommentId: any;
  editCommentText: any;
  setEditCommentText: any;
  handleCommentReaction: any;
  toggleCommentMenu: any;
  handleCommentAction: any;
  handleEditSubmit: any;
  handleReply: any;
  setReplyingTo: any;
  profileImage: any;
}) => {
  const likeCount = Object.values(comment.reactions || {}).reduce(
    (sum: number, v: any) => sum + (v || 0),
    0
  );
  const isLikedByMe = !!comment.likedByCurrentUser;

  // ✅ FIX: comment.user ab do shapes mein aa sakta hai —
  //   1. Naya backend data: object { userId, name, avatar, headline }
  //      (enrichCommentsWithUserData se aata hai)
  //   2. Purana/sample data: seedha string naam, avatar alag `comment.avatar` field mein
  // Object ko kabhi seedha JSX mein render nahi karna — isliye yahan
  // normalize karke sirf string/plain values nikalte hain.
  const isUserObject = comment.user && typeof comment.user === 'object';
  const commentUserName: string = isUserObject
    ? (comment.user.name || 'Unknown User')
    : (comment.user || 'Unknown User');
  const commentUserAvatar: string | undefined = isUserObject
    ? comment.user.avatar
    : comment.avatar;
  const commentUserHeadline: string | undefined = isUserObject
    ? comment.user.headline
    : comment.headline;

  return (
    <div className="py-3 first:pt-0">
      <div className="flex items-start gap-2.5">
        <img
          src={commentUserAvatar}
          alt={commentUserName}
          className="w-9 h-9 rounded-full object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          {/* ── Bubble: name, badge, degree, headline ── */}
          <div
            className={`inline-block rounded-2xl px-3.5 py-2.5 max-w-full ${
              isDarkMode ? 'bg-slate-700/50' : 'bg-[#e0d8cf]/50'
            }`}
          >
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>
                {commentUserName}
              </p>
              {comment.isAuthor && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    isDarkMode ? 'bg-slate-600 text-slate-200' : 'bg-[#4a3728]/10 text-[#4a3728]'
                  }`}
                >
                  Author
                </span>
              )}
              {comment.isVerified && (
                <span className="w-4 h-4 rounded-full bg-[#4a3728] flex items-center justify-center flex-shrink-0">
                  <i className="ri-shield-check-fill text-[10px] text-white"></i>
                </span>
              )}
              {comment.connectionDegree && (
                <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/50'}`}>
                  · {comment.connectionDegree}
                </span>
              )}
            </div>
            {commentUserHeadline && (
              <p className={`text-xs mt-0.5 line-clamp-1 ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/60'}`}>
                {commentUserHeadline}
              </p>
            )}

            {editingCommentId === comment.id ? (
              <div className="mt-2">
                <input
                  type="text"
                  value={editCommentText}
                  onChange={(e) => setEditCommentText(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#6b5643] ${
                    isDarkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-white border-[#4a3728]/30 text-[#4a3728]'
                  }`}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleEditSubmit(comment.id);
                  }}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleEditSubmit(comment.id)}
                    className="px-3 py-1 bg-[#6b5643] text-white rounded-lg text-xs font-semibold"
                  >
                    Save
                  </button>
                  <button
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      isDarkMode ? 'bg-slate-600 text-white' : 'bg-[#e0d8cf] text-[#4a3728]'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p
                className={`text-sm mt-1 whitespace-pre-wrap ${
                  isDarkMode ? 'text-slate-300' : 'text-[#4a3728]/85'
                }`}
              >
                {renderFormattedContent(comment.content || comment.text || '')}
              </p>
            )}
          </div>

          {/* ── Meta row: time · Follow · Like · Reply · ⋯ (LinkedIn style, outside bubble) ── */}
          <div className="flex items-center gap-3 mt-1 pl-3.5">
            <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-[#4a3728]/45'}`}>
              {comment.time}
            </span>

            {comment.canFollow && (
              <button
                className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-[#4a3728]'}`}
              >
                Follow
              </button>
            )}

            <button
              onClick={() => handleCommentReaction(comment.id, '❤️')}
              className={`text-xs font-bold ${
                isLikedByMe ? 'text-[#0a66c2]' : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-[#4a3728]/60 hover:text-[#4a3728]'
              }`}
            >
              Like{likeCount > 0 ? ` · ${likeCount}` : ''}
            </button>

            <button
              onClick={() => handleReply(comment.id)}
              className={`text-xs font-bold ${
                isDarkMode ? 'text-slate-400 hover:text-white' : 'text-[#4a3728]/60 hover:text-[#4a3728]'
              }`}
            >
              Reply
            </button>

            <div className="relative comment-menu ml-auto">
              <button
                onClick={() => toggleCommentMenu(comment.commentId || comment.id)}
                className={`p-1 rounded-lg transition-all ${isDarkMode ? 'hover:bg-slate-600' : 'hover:bg-[#e0d8cf]'}`}
              >
                <span className="text-base">⋯</span>
              </button>

              {openCommentMenuIndex === comment.id && (
                <CommentMenuDropdown
                  isDarkMode={isDarkMode}
                  comment={comment}
                  handleCommentAction={handleCommentAction}
                />
              )}
            </div>
          </div>

          {/* ── Replies ── */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 ml-3 space-y-3 border-l-2 pl-4" style={{ borderColor: isDarkMode ? '#334155' : '#4a372820' }}>
              {comment.replies.map((reply: any) => {
                // ✅ FIX: replies mein bhi same object/string dual-shape possible hai
                const isReplyUserObject = reply.user && typeof reply.user === 'object';
                const replyUserName: string = isReplyUserObject
                  ? (reply.user.name || 'Unknown User')
                  : (reply.user || 'Unknown User');
                const replyUserAvatar: string | undefined = isReplyUserObject
                  ? reply.user.avatar
                  : reply.avatar;

                return (
                  <div key={reply.id} className="flex items-start gap-2">
                    <img
                      src={replyUserAvatar}
                      alt={replyUserName}
                      className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        className={`inline-block rounded-2xl px-3 py-2 ${
                          isDarkMode ? 'bg-slate-700/50' : 'bg-[#e0d8cf]/50'
                        }`}
                      >
                        <p className={`font-bold text-xs ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>
                          {replyUserName}
                        </p>
                        <p
                          className={`text-xs mt-0.5 whitespace-pre-wrap ${
                            isDarkMode ? 'text-slate-300' : 'text-[#4a3728]/80'
                          }`}
                        >
                          {renderFormattedContent(reply.text || '')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mt-1 pl-3">
                        <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-[#4a3728]/45'}`}>
                          {reply.time}
                        </span>
                        <button
                          onClick={() => handleCommentReaction(reply.id, '❤️')}
                          className={`text-xs font-bold ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-[#4a3728]/60 hover:text-[#4a3728]'}`}
                        >
                          Like
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;