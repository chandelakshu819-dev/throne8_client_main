import { memo, useCallback } from 'react';
import type { ActivityType, ReviewData } from '../../types';
import ReviewCard from './ReviewCard';

export interface ActivityItemData {
  id: string;
  type: ActivityType;
  user: string;
  avatar: string;
  color: string;
  action: string;
  time: string;
  read: boolean;
  review?: ReviewData;
  postedResponse?: string;
}

const TYPE_ICONS: Record<ActivityType, string> = {
  follow: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
  like: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  comment: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  share: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z',
  apply: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  review: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  event: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
};

const TYPE_BG: Record<ActivityType, string> = {
  follow: 'bg-purple-100 text-purple-700',
  like: 'bg-blue-100 text-blue-700',
  comment: 'bg-amber-100 text-amber-800',
  share: 'bg-pink-100 text-pink-700',
  apply: 'bg-emerald-100 text-emerald-800',
  review: 'bg-amber-100 text-amber-900',
  event: 'bg-indigo-100 text-indigo-700',
};

function formatActionContent(action: string) {
  const gifMatch = action.match(/!\[GIF\]\((.*?)\)/);
  if (gifMatch) {
    const cleanActionText = action.replace(/!\[GIF\]\((.*?)\)/, 'posted an Animated GIF').trim();
    return (
      <span className="inline-flex items-center gap-1.5 flex-wrap">
        <span>{cleanActionText}</span>
        <span className="inline-flex items-center gap-1 bg-[#4a3728]/10 text-[#4a3728] text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#4a3728]/20">
          👾 GIF
        </span>
      </span>
    );
  }
  return <span>{action}</span>;
}

function formatUserName(user: string) {
  if (user && user.includes('@')) {
    return user.split('@')[0];
  }
  return user;
}

interface Props {
  item: ActivityItemData;
  postedResponse?: string;
  onMarkRead: (id: string) => void;
  onRespond: (id: string, text: string) => void;
  onDelete?: (id: string) => void;
}

const ActivityItem = memo(function ActivityItem({ item, postedResponse, onMarkRead, onRespond, onDelete }: Props) {
  const handleClick = useCallback(() => {
    if (item.type !== 'review') onMarkRead(item.id);
  }, [item.id, item.type, onMarkRead]);

  const cleanName = formatUserName(item.user);
  const avatarInitials = (item.avatar || cleanName || 'U').slice(0, 2).toUpperCase();

  return (
    <div className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-2xs ${
      !item.read
        ? 'bg-[#f6ede8]/90 border-[#4a3728]/30 shadow-xs'
        : 'bg-white border-[#e0d8cf] hover:border-[#4a3728]/30'
    }`}>
      {/* Main Container Row */}
      <div
        className={`flex items-start gap-3 sm:gap-4 p-3.5 sm:p-4 ${item.type !== 'review' ? 'cursor-pointer hover:bg-[#4a3728]/5 transition-colors' : ''}`}
        onClick={handleClick}
      >
        {/* Avatar */}
        <div className={`w-9 h-9 sm:w-10 sm:h-10 ${item.color || 'bg-[#4a3728]'} text-white rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-xs`}>
          {avatarInitials}
        </div>

        {/* Details Text */}
        <div className="flex-1 min-w-0 pr-1">
          <p className="text-xs sm:text-sm text-[#4a3728] leading-relaxed break-words">
            <span className="font-bold text-[#4a3728] mr-1">{cleanName}</span>
            <span className="text-[#4a3728]/80">{formatActionContent(item.action)}</span>
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] sm:text-xs text-[#4a3728]/50 font-medium">{item.time}</span>
            {!item.read && (
              <span className="bg-emerald-700 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                New
              </span>
            )}
          </div>
        </div>

        {/* Category Icon Badge, Delete Button & Unread Indicator */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 pt-0.5">
          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${TYPE_BG[item.type] || 'bg-[#e0d8cf] text-[#4a3728]'}`}>
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={TYPE_ICONS[item.type]} />
            </svg>
          </div>

          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-xl transition-all shadow-2xs group/del focus:outline-none"
              title="Delete notification"
              aria-label="Delete notification"
            >
              <svg className="w-4 h-4 transition-transform group-hover/del:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}

          {!item.read && (
            <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full animate-pulse ring-2 ring-white" />
          )}
        </div>
      </div>

      {/* Inline review — only for review type */}
      {item.type === 'review' && item.review && (
        <ReviewCard
          itemId={item.id}
          review={item.review}
          postedResponse={postedResponse || item.postedResponse}
          onMarkRead={onMarkRead}
          onRespond={onRespond}
        />
      )}
    </div>
  );
});

export default ActivityItem;