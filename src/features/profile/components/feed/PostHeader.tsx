// features/profile/components/feed/PostHeader.tsx
import React from 'react';
import { useRouter } from 'next/navigation';
import PostMenuDropdown from './PostMenuDropdown';

const PostHeader = ({
  post, index, isDarkMode, openMenuIndex, togglePostMenu, handlePostAction, currentUserId, fullName, profileImage, headline, isOwnProfile, showMenu = true, isSaved = false, isPinned = false, isFollowing = true,
}: {
  post: any; index: string; isDarkMode: boolean; openMenuIndex: string | null; togglePostMenu: (index: string) => void; handlePostAction: (action: string, index: string) => void; currentUserId: string;
  fullName?: string; profileImage?: string; headline?: string; isOwnProfile?: boolean; showMenu?: boolean; isSaved?: boolean; isPinned?: boolean; isFollowing?: boolean; // ✅ NEW
}) => {
  const router = useRouter();
  const isOwnPost = post.userId && currentUserId && post.userId === currentUserId;

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!post.userId) return;

    if (isOwnPost) {
      router.push('/profile');
    } else {
      router.push(`/profile/${post.userId}`);
    }
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
      {(post.avatar || profileImage) ? (
  <img
    src={post.avatar || profileImage}
    alt={post.user || fullName || ''}
    onClick={handleProfileClick}
    className="w-14 h-14 rounded-2xl object-cover border-2 border-[#6b5643] cursor-pointer"
  />
) : (
  <div
    onClick={handleProfileClick}
    className="w-14 h-14 rounded-2xl border-2 border-[#6b5643] cursor-pointer bg-[#4a3728]/20 flex items-center justify-center flex-shrink-0"
  >
    <svg className="w-6 h-6 text-[#4a3728]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  </div>
)}
        <div>
          <div className="flex items-center gap-3">
            <h4
              onClick={handleProfileClick}
              className={`text-lg font-bold cursor-pointer hover:underline ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}
            >
              {(post.user && post.user !== 'Unknown User') ? post.user : (fullName || 'Unknown User')}
            </h4>
            {(post.username || post.userName) && (
              <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/60'}`}>
                @{post.username || post.userName}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold bg-gradient-to-r from-[#6b5643] to-[#8b7355] bg-clip-text text-transparent">
            {post.role || headline || ''}
          </p>
          <p className={`text-xs flex items-center gap-1.5 ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/60'}`}>
            {post.time}
            {isPinned ? (
              <span className={`inline-flex items-center gap-1 font-semibold ${isDarkMode ? 'text-slate-300' : 'text-[#4a3728]'}`}>
                <i className="ri-pushpin-fill text-xs"></i>
                Pinned
              </span>
            ) : null}
          </p>
        </div>
      </div>
      {showMenu && (
  <div className="relative post-menu post-menu-container">
          <button
            onClick={() => togglePostMenu(index)}
            className={`p-2 rounded-xl transition-all duration-300 post-menu-trigger ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-[#e0d8cf]/50'}`}
          >
            <span className="text-xl text-[#4a3728]">⋯</span>
          </button>
          {openMenuIndex === index && (
            <PostMenuDropdown
              isDarkMode={isDarkMode}
              index={index}
              handlePostAction={handlePostAction}
              post={post}
              currentUserId={currentUserId}
              fullName={fullName}
              isSaved={isSaved} // ✅ NEW
              isPinned={isPinned} // ✅ NEW
              isFollowing={isFollowing} // ✅ NEW — real follow-status, dropdown mein sahi "Follow"/"Unfollow" label dikhayega
            />
          )}
         
        </div>
      )}
    </div>
  );
};

export default PostHeader;