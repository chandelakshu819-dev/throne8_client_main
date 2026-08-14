// app/feature/components/feed/PostMenuDropdown.tsx
import React from 'react';

const PostMenuDropdown = ({ isDarkMode, index, handlePostAction, post, currentUserId }: {
  isDarkMode: boolean;
  index: string;
  handlePostAction: (action: string, index: string) => void,
  post: any;
  currentUserId: string;
}) => {

  const isOwn = post.userId === currentUserId;

  return (
    <div
      className={`absolute right-10 top-0 w-64 rounded-2xl shadow-2xl border z-50  overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-[#4a3728]/20'
        }`}
    >
      {/* SAVE */}
      <button
        onClick={() => handlePostAction('save', index)}
        className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-white' : 'hover:bg-[#e0d8cf]/50 text-[#4a3728]'
          }`}
      >
        <i className="ri-bookmark-line text-lg"></i>
        <span className="font-medium">Save</span>
      </button>

      {/* COPY */}
      <button
        onClick={() => handlePostAction('copy', index)}
        className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-white' : 'hover:bg-[#e0d8cf]/50 text-[#4a3728]'
          }`}
      >
        <i className="ri-links-line text-lg"></i>
        <span className="font-medium">Copy link</span>
      </button>

      {/* EMBED */}
      <button
        onClick={() => handlePostAction('embed', index)}
        className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-white' : 'hover:bg-[#e0d8cf]/50 text-[#4a3728]'
          }`}
      >
        <i className="ri-code-s-slash-line text-lg"></i>
        <span className="font-medium">Embed post</span>
      </button>

      <div className={`h-px my-2 ${isDarkMode ? 'bg-slate-700' : 'bg-[#4a3728]/20'}`}></div>

      {/* PIN */}
      {isOwn && <button
        onClick={() => handlePostAction('pin', index)}
        className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-white' : 'hover:bg-[#e0d8cf]/50 text-[#4a3728]'
          }`}
      >
        <i className="ri-pushpin-line text-lg"></i>
        <span className="font-medium">Pin to profile</span>
      </button>
      }

      {/* EDIT */}
      {isOwn && (
        <button
          onClick={() => handlePostAction('edit', index)}
          className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-white' : 'hover:bg-[#e0d8cf]/50 text-[#4a3728]'
            }`}
        >
          <i className="ri-edit-line text-lg"></i>
          <span className="font-medium">Edit post</span>
        </button>
      )}

      {/* ANALYTICS */}
      {isOwn &&
        <button
          onClick={() => handlePostAction('analytics', index)}
          className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-white' : 'hover:bg-[#e0d8cf]/50 text-[#4a3728]'
            }`}
        >
          <i className="ri-bar-chart-line text-lg"></i>
          <span className="font-medium">View post analytics</span>
        </button>
      }

      {/* DELETE */}
      {isOwn && (
        <button
          onClick={() => handlePostAction('delete', index)}
          className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors text-red-500 ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-red-50'
            }`}
        >
          <i className="ri-delete-bin-line text-lg"></i>
          <span className="font-medium">Delete post</span>
        </button>
      )}

      <div className={`h-px my-2 ${isDarkMode ? 'bg-slate-700' : 'bg-[#4a3728]/20'}`}></div>

      {/* INTEREST */}
      {!isOwn &&
        <button
          onClick={() => handlePostAction('not-interested', index)}
          className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-white' : 'hover:bg-[#e0d8cf]/50 text-[#4a3728]'
            }`}
        >
          <i className="ri-eye-off-line text-lg"></i>
          <span className="font-medium">Not interested</span>
        </button>
      }
      {isOwn &&
        <button
          onClick={() => handlePostAction('hide', index)}
          className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-white' : 'hover:bg-[#e0d8cf]/50 text-[#4a3728]'
            }`}
        >
          <i className="ri-eye-close-line text-lg"></i>
          <span className="font-medium">Hide this post</span>
        </button>
      }
      {!isOwn &&
        <button
          onClick={() => handlePostAction('unfollow', index)}
          className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-white' : 'hover:bg-[#e0d8cf]/50 text-[#4a3728]'
            }`}
        >
          <i className="ri-user-unfollow-line text-lg"></i>
          <span className="font-medium">Unfollow {post.user}</span>
        </button>}

      <div className={`h-px my-2 ${isDarkMode ? 'bg-slate-700' : 'bg-[#4a3728]/20'}`}></div>
      {!isOwn &&
        <button
          onClick={() => handlePostAction('report', index)}
          className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors text-red-500 ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-red-50'
            }`}
        >
          <i className="ri-flag-line text-lg"></i>
          <span className="font-medium">Report post</span>
        </button>
      }
    </div>
  );
};

export default PostMenuDropdown;
