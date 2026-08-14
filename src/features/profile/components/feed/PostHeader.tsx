// features/profile/components/feed/PostHeader.tsx
import React from 'react';
import { useRouter } from 'next/navigation';
import PostMenuDropdown from './PostMenuDropdown';

const PostHeader = ({
  post, index, isDarkMode, openMenuIndex, togglePostMenu, handlePostAction, currentUserId, fullName, profileImage, headline, isOwnProfile
}: {
  post: any; index: string; isDarkMode: boolean; openMenuIndex: string | null; togglePostMenu: (index: string) => void; handlePostAction: (action: string, index: string) => void; currentUserId: string;
  fullName?: string; profileImage?: string; headline?: string; isOwnProfile?: boolean;
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
        <img
          src={post.avatar || profileImage || ''}
          alt={post.user || fullName || ''}
          onClick={handleProfileClick}
          className="w-14 h-14 rounded-2xl object-cover border-2 border-[#6b5643] cursor-pointer"
        />
        <div>
          <div className="flex items-center gap-3">
            <h4
              onClick={handleProfileClick}
              className={`text-lg font-bold cursor-pointer hover:underline ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}
            >
              {post.user || fullName || 'Unknown User'}
            </h4>
          </div>
          <p className="text-sm font-semibold bg-gradient-to-r from-[#6b5643] to-[#8b7355] bg-clip-text text-transparent">
            {post.role || headline || ''}
          </p>
          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/60'}`}>
            {post.time}
          </p>
        </div>
      </div>
      <div className="relative post-menu">
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
          />
        )}
      </div>
    </div>
  );
};

export default PostHeader;