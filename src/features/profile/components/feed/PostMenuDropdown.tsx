// app/feature/components/feed/PostMenuDropdown.tsx
import React from 'react';

const PostMenuDropdown = ({ isDarkMode, index, handlePostAction, post, currentUserId, fullName, isSaved = false, isPinned = false, isFollowing = true }: {
  isDarkMode: boolean;
  index: string;
  handlePostAction: (action: string, index: string) => void,
  post: any;
  currentUserId: string;
  fullName?: string;
  isSaved?: boolean;
  isPinned?: boolean;
  isFollowing?: boolean;
}) => {

  const isOwn = post.userId === currentUserId;

  // ✅ CHANGED: RepostCard ke dropdown jaisa hi compact size — rounded-xl,
  // px-4 py-2.5, text-sm, icon text-base, min-w-[220px]
  const itemClass = (extra = '') =>
    `w-full text-left px-4 py-2.5 text-sm transition-colors duration-200 flex items-center gap-2 ${extra} ${isDarkMode ? 'hover:bg-slate-700 text-white' : 'hover:bg-[#e0d8cf]/50 text-[#4a3728]'
    }`;

  const authorName = (post.user && post.user !== 'Unknown User')
    ? post.user
    : (fullName || post.userName || post.fullName || post.authorName || post.name || 'User');

  return (
    <div
      className={`post-menu-container absolute right-10 top-0 min-w-[220px] w-auto rounded-xl shadow-2xl border z-50 overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-[#e0d8cf]'
        }`}
    >
      {/* SAVE */}
      <button onClick={() => handlePostAction('save', index)} className={itemClass()}>
        <i className={`ri-bookmark-${isSaved ? 'fill' : 'line'} text-base`}></i>
        <span>{isSaved ? 'Unsave' : 'Save'}</span>
      </button>

      {/* COPY */}
      <button onClick={() => handlePostAction('copy', index)} className={itemClass()}>
        <i className="ri-links-line text-base"></i>
        <span>Copy link</span>
      </button>

      {/* EMBED */}
      <button onClick={() => handlePostAction('embed', index)} className={itemClass()}>
        <i className="ri-code-s-slash-line text-base"></i>
        <span>Embed post</span>
      </button>

      <div className={`h-px my-1 ${isDarkMode ? 'bg-slate-700' : 'bg-[#e0d8cf]'}`}></div>

    {/* PIN */}
    {isOwn && (
        <button onClick={() => handlePostAction('pin', index)} className={itemClass()}>
          <i className={`ri-pushpin-${isPinned ? 'fill' : 'line'} text-base`}></i>
          <span>{isPinned ? 'Unpin from profile' : 'Pin to profile'}</span>
        </button>
      )}

      {/* EDIT */}
      {isOwn && (
        <button onClick={() => handlePostAction('edit', index)} className={itemClass()}>
          <i className="ri-edit-line text-base"></i>
          <span>Edit post</span>
        </button>
      )}

      {/* ANALYTICS */}
      {isOwn && (
        <button onClick={() => handlePostAction('analytics', index)} className={itemClass()}>
          <i className="ri-bar-chart-line text-base"></i>
          <span>View post analytics</span>
        </button>
      )}

      {/* DELETE */}
      {isOwn && (
        <button
          onClick={() => handlePostAction('delete', index)}
          className={itemClass(isDarkMode ? 'text-red-400 hover:bg-slate-700' : 'text-red-600 hover:bg-red-50')}
        >
          <i className="ri-delete-bin-line text-base"></i>
          <span>Delete post</span>
        </button>
      )}

      <div className={`h-px my-1 ${isDarkMode ? 'bg-slate-700' : 'bg-[#e0d8cf]'}`}></div>

      {/* INTEREST */}
      {!isOwn && (
        <button onClick={() => handlePostAction('not-interested', index)} className={itemClass()}>
          <i className="ri-eye-off-line text-base"></i>
          <span>Not interested</span>
        </button>
      )}
      {isOwn && (
        <button onClick={() => handlePostAction('hide', index)} className={itemClass()}>
          <i className="ri-eye-close-line text-base"></i>
          <span>Hide this post</span>
        </button>
      )}
      {!isOwn && (
        <button onClick={() => handlePostAction('unfollow', index)} className={itemClass()}>
          <i className={`${isFollowing ? 'ri-user-unfollow-line' : 'ri-user-follow-line'} text-base`}></i>
          <span>{isFollowing ? `Unfollow ${authorName}` : `Follow ${authorName}`}</span>
        </button>
      )}

      <div className={`h-px my-1 ${isDarkMode ? 'bg-slate-700' : 'bg-[#e0d8cf]'}`}></div>

      {!isOwn && (
        <button
          onClick={() => handlePostAction('report', index)}
          className={itemClass(isDarkMode ? 'text-red-400 hover:bg-slate-700' : 'text-red-600 hover:bg-red-50')}
        >
          <i className="ri-flag-line text-base"></i>
          <span>Report post</span>
        </button>
      )}
    </div>
  );
};

export default PostMenuDropdown;