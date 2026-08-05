// app profile/components/feed/CommentMenuDropdown.tsx
import React from 'react';

const CommentMenuDropdown = (
  { isDarkMode, comment, currentUserId, handleCommentAction }:
    {
      isDarkMode: boolean;
      comment: any;
      currentUserId?: string;
      handleCommentAction: (action: string, commentId: string, content?: string) => void
    }
) => {
  const commentId = comment.commentId || comment.id;
  const userName = comment.user?.name || comment.user || 'this user';
  const handle = userName.replace(/\s+/g, '').toLowerCase();
  const isOwnComment = !!currentUserId && comment.userId === currentUserId;

  return (
    <div
      className={`absolute right-0 top-8 w-56 rounded-xl shadow-2xl border z-50 overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-[#4a3728]/20'
        }`}
    >
      {isOwnComment ? (
        <>
          <button
            onClick={() => handleCommentAction('edit', commentId, comment.content || comment.text)}
            className={`w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-white' : 'hover:bg-[#e0d8cf]/50 text-[#4a3728]'
              }`}
          >
            <i className="ri-edit-line"></i>
            <span className="font-medium">Edit</span>
          </button>

          <button
            onClick={() => handleCommentAction('delete', commentId)}
            className={`w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-white' : 'hover:bg-[#e0d8cf]/50 text-[#4a3728]'
              }`}
          >
            <i className="ri-delete-bin-line"></i>
            <span className="font-medium">Delete</span>
          </button>

          <div className={`h-px ${isDarkMode ? 'bg-slate-700' : 'bg-[#4a3728]/20'}`}></div>

          <button
            onClick={() => handleCommentAction('copy', commentId)}
            className={`w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-white' : 'hover:bg-[#e0d8cf]/50 text-[#4a3728]'
              }`}
          >
            <i className="ri-links-line"></i>
            <span className="font-medium">Copy link to comment</span>
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => handleCommentAction('copy', commentId)}
            className={`w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-white' : 'hover:bg-[#e0d8cf]/50 text-[#4a3728]'
              }`}
          >
            <i className="ri-links-line"></i>
            <span className="font-medium">Copy link to comment</span>
          </button>

          <div className={`h-px ${isDarkMode ? 'bg-slate-700' : 'bg-[#4a3728]/20'}`}></div>

          <button
            onClick={() => handleCommentAction('follow', commentId)}
            className={`w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-white' : 'hover:bg-[#e0d8cf]/50 text-[#4a3728]'
              }`}
          >
            <i className="ri-user-follow-line"></i>
            <span className="font-medium">Connect with @{handle}</span>
          </button>

          <div className={`h-px ${isDarkMode ? 'bg-slate-700' : 'bg-[#4a3728]/20'}`}></div>

          <button
            onClick={() => handleCommentAction('report', commentId)}
            className={`w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-white' : 'hover:bg-[#e0d8cf]/50 text-[#4a3728]'
              }`}
          >
            <i className="ri-flag-line"></i>
            <span className="font-medium">Report comment</span>
          </button>

          <button
            onClick={() => handleCommentAction('hide', commentId)}
            className={`w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-white' : 'hover:bg-[#e0d8cf]/50 text-[#4a3728]'
              }`}
          >
            <i className="ri-eye-off-line"></i>
            <span className="font-medium">I don't want to see this</span>
          </button>
        </>
      )}
    </div>
  );
};

export default CommentMenuDropdown;