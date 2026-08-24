// app/(dashboard)/components/feed/PostHeader.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PostMenuDropdown from './PostMenuDropdown';
import ConnectionService from '@/lib/api/connection.service';
import DefaultAvatar from '@/shared/uiComponents/DefaultAvatar';

type ConnectionStatus = 'self' | 'connected' | 'pending_sent' | 'pending_received' | 'none';

// ✅ NEW: mood → emoji map, LinkedIn/Facebook style "is feeling 😊 happy"
const MOOD_EMOJI_MAP: Record<string, string> = {
  happy: '😊',
  thoughtful: '🤔',
  excited: '🤩',
  reflective: '💭',
  grateful: '🙏',
};

const PostHeader = ({
  post, index, isDarkMode, openMenuIndex, togglePostMenu, handlePostAction, currentUserId, isSaved, isPinned
}: {
  post: any; index: number; isDarkMode: boolean; openMenuIndex: number | null; togglePostMenu: (index: number) => void; handlePostAction: (action: string, index: number) => void; currentUserId: string; isSaved?: boolean; isPinned?: boolean;
}) => {
  const router = useRouter();
  const isOwnPost = post.userId && currentUserId && post.userId === currentUserId;

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    post.connectionStatus || 'none'
  );
  const [isSending, setIsSending] = useState(false);
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!post.userId) return;

    if (isOwnPost) {
      router.push('/profile');
    } else {
      router.push(`/profile/${post.userId}`);
    }
  };

  const handleConnect = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSending || connectionStatus !== 'none') return;

    setIsSending(true);
    try {
      await ConnectionService.sendConnectionRequest({ toUserId: post.userId });
      setConnectionStatus('pending_sent');
    } catch (error: any) {
      console.error('❌ Connect failed:', error.message);
      if (error.message?.includes('already exists')) {
        setConnectionStatus('pending_sent');
      }
    } finally {
      setIsSending(false);
    }
  };

  const renderConnectButton = () => {
    if (isOwnPost || connectionStatus === 'self') return null;
    if (connectionStatus === 'connected') return null;
    if (connectionStatus === 'pending_sent') return null;

    if (connectionStatus === 'pending_received') {
      return (
        <span
          className={`px-4 py-1.5 rounded-full text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/60'
            }`}
        >
          Wants to connect
        </span>
      );
    }

    return (
      <button
        onClick={handleConnect}
        disabled={isSending}
        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${isDarkMode
          ? 'bg-slate-700 text-white hover:bg-slate-600 border border-slate-600'
          : 'bg-[#e0d8cf] text-[#4a3728] hover:bg-[#d0c8bf] border border-[#4a3728]/20'
          } ${isSending ? 'opacity-50 cursor-wait' : ''}`}
      >
        {isSending ? '...' : '+ Connect'}
      </button>
    );
  };

  const showDefaultAvatar = !post.avatar || avatarLoadError;

  // ✅ NEW: build the "is feeling 😊 happy" fragment if mood exists
  const moodEmoji = post.mood ? MOOD_EMOJI_MAP[post.mood] : null;
  const moodLabel = post.mood
    ? post.mood.charAt(0).toUpperCase() + post.mood.slice(1)
    : null;

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        {showDefaultAvatar ? (
          <div
            onClick={handleProfileClick}
            className="w-14 h-14 border-2 border-[#6b5643] cursor-pointer"
          >
            <DefaultAvatar className="w-full h-full" rounded="2xl" />
          </div>
        ) : (
          <img
            src={post.avatar}
            alt={post.user}
            onClick={handleProfileClick}
            onError={() => setAvatarLoadError(true)}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-[#6b5643] cursor-pointer"
          />
        )}
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h4
              onClick={handleProfileClick}
              className={`text-lg font-bold cursor-pointer hover:underline ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}
            >
              {post.user}
              {/* ✅ NEW: mood shown right after name, LinkedIn/Facebook style */}
              {moodEmoji && (
                <span className={`text-sm font-normal ml-1 ${isDarkMode ? 'text-slate-300' : 'text-[#4a3728]/70'}`}>
                  is feeling {moodEmoji} {moodLabel}
                </span>
              )}
            </h4>
            {post.degreeLabel && !isOwnPost && (
              <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/50'}`}>
                · {post.degreeLabel}
              </span>
            )}
            {renderConnectButton()}
          </div>
          <p className={`text-sm font-semibold bg-gradient-to-r from-[#6b5643] to-[#8b7355] bg-clip-text text-transparent`}>
            {post.role}
          </p>
          <p className={`text-xs flex items-center gap-1 ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/60'}`}>
            {post.time}
            {isPinned && (
              <span className="flex items-center gap-0.5 font-semibold">
                <i className="ri-pushpin-fill text-[11px]"></i>
                Pinned
              </span>
            )}
          </p>
        </div>
      </div>
      <div className="relative post-menu">
        <button
          onClick={() => togglePostMenu(index)}
          className={`p-2 rounded-xl transition-all duration-300 ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-[#e0d8cf]/50'}`}
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
            isSaved={isSaved}
            isPinned={isPinned}
          />
        )}
      </div>
    </div>
  );
};

export default PostHeader;