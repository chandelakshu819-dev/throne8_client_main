import { memo } from 'react';

interface Props {
  unreadCount: number;
  totalCount: number;
  onMarkAllRead: () => void;
  onDeleteAll: () => void;
}

const ActivityHeader = memo(function ActivityHeader({ unreadCount, totalCount, onMarkAllRead, onDeleteAll }: Props) {
  return (
    <div className="bg-white border border-[#e0d8cf] p-4 sm:p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold text-[#4a3728]">Company Activity</h1>
          {unreadCount > 0 && (
            <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full text-xs font-bold animate-pulse">
              {unreadCount} unread
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-[#4a3728]/60 mt-1">
          {totalCount > 0
            ? 'Track real-time engagement, post comments, likes, reviews, job applications & events'
            : '🎉 All caught up! No active notifications'}
        </p>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-1.5 text-xs font-bold text-[#4a3728] bg-[#f6ede8] border border-[#e0d8cf] hover:border-[#4a3728] px-3.5 py-2 rounded-xl hover:bg-[#4a3728] hover:text-white transition-all shadow-2xs active:scale-95"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Mark all read
          </button>
        )}

        {totalCount > 0 && (
          <button
            onClick={onDeleteAll}
            className="flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 border border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600 px-3.5 py-2 rounded-xl transition-all shadow-2xs active:scale-95"
            title="Delete all activity notifications"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete all
          </button>
        )}
      </div>
    </div>
  );
});

export default ActivityHeader;