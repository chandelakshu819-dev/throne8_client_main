// app/features/profile/components/feed/CommentItem.tsx
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

  const authorName = comment.user?.name || comment.user || 'User';
  const authorAvatar =
    comment.user?.avatar ||
    comment.avatar ||
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdYRNQDghH1JvFXro2Yz3iWNmmFAubFZ-RGQ&s';

  const timeLabel = comment.time
    ? comment.time
    : comment.createdAt
    ? new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '';

  return (
    <div className="py-3 first:pt-0">
      <div className="flex items-start gap-2.5">
        <img
          src={authorAvatar}
          alt={authorName}
          className="w-9 h-9 rounded-full object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          {/* ── Bubble: name, badge, degree, headline, content ── */}
          <div
            className={`inline-block rounded-2xl px-3.5 py-2.5 max-w-full ${
              isDarkMode ? 'bg-slate-700/50' : 'bg-[#e0d8cf]/50'
            }`}
          >
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>
                {authorName}
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
            {comment.headline && (
              <p className={`text-xs mt-0.5 line-clamp-1 ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/60'}`}>
                {comment.headline}
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

          {/* ── Meta row: time · Follow · Like · Reply · ⋯ ── */}
          <div className="flex items-center gap-3 mt-1 pl-3.5">
            <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-[#4a3728]/45'}`}>
              {timeLabel}
            </span>

            {comment.canFollow && (
              <button className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-[#4a3728]'}`}>
                Follow
              </button>
            )}

            <button
              onClick={() => handleCommentReaction(comment.id, '❤️')}
              className={`text-xs font-bold ${
                isLikedByMe
                  ? 'text-[#0a66c2]'
                  : isDarkMode
                  ? 'text-slate-400 hover:text-white'
                  : 'text-[#4a3728]/60 hover:text-[#4a3728]'
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
            <div
              className="mt-3 ml-3 space-y-3 border-l-2 pl-4"
              style={{ borderColor: isDarkMode ? '#334155' : '#4a372820' }}
            >
              {comment.replies.map((reply: any) => (
                <div key={reply.id} className="flex items-start gap-2">
                  <img
                    src={reply.avatar}
                    alt={reply.user}
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className={`inline-block rounded-2xl px-3 py-2 ${
                        isDarkMode ? 'bg-slate-700/50' : 'bg-[#e0d8cf]/50'
                      }`}
                    >
                      <p className={`font-bold text-xs ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>
                        {reply.user}
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
                        className={`text-xs font-bold ${
                          isDarkMode ? 'text-slate-400 hover:text-white' : 'text-[#4a3728]/60 hover:text-[#4a3728]'
                        }`}
                      >
                        Like
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;