import { memo } from 'react';
import Link from 'next/link';

export interface ActivityItem {
  id: string;
  user: string;
  action: string;
  time: string;
  avatar: string;
  color: string;
  type?: string;
}

interface ActivityFeedProps {
  items?: ActivityItem[];
  isLoading?: boolean;
  error?: string | null;
}

const ActivityFeed = memo(function ActivityFeed({ items = [], isLoading = false, error = null }: ActivityFeedProps) {
  const safeItems = Array.isArray(items) ? items : [];

  const getActivityTypeBadge = (type?: string, actionStr?: string) => {
    const act = (actionStr || '').toLowerCase();
    const t = (type || '').toLowerCase();

    if (t === 'like' || act.includes('liked')) {
      return {
        bg: 'bg-rose-500',
        icon: (
          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
        ),
      };
    }
    if (t === 'comment' || act.includes('commented')) {
      return {
        bg: 'bg-blue-500',
        icon: (
          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clipRule="evenodd" />
          </svg>
        ),
      };
    }
    if (t === 'follow' || act.includes('followed')) {
      return {
        bg: 'bg-emerald-500',
        icon: (
          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
        ),
      };
    }
    if (t === 'review' || act.includes('review')) {
      return {
        bg: 'bg-amber-500',
        icon: (
          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ),
      };
    }
    return {
      bg: 'bg-[#4a3728]',
      icon: (
        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
        </svg>
      ),
    };
  };

  const renderActionContent = (action: string) => {
    // If format is: commented: "comment text" on "post title"
    const commentMatch = action.match(/^commented:\s*"(.*?)"\s*on\s*(.*)$/i);
    if (commentMatch) {
      const commentText = commentMatch[1];
      const targetPost = commentMatch[2];
      return (
        <span>
          <span className="text-[#4a3728]/70">commented: </span>
          <span className="font-medium text-[#4a3728] italic">"{commentText}"</span>
          <span className="text-[#4a3728]/70"> on </span>
          <span className="font-semibold text-[#4a3728]">{targetPost}</span>
        </span>
      );
    }

    // If format is: liked your post "post title" or liked "post title"
    const likeMatch = action.match(/^liked(?:\s+your\s+post)?\s*(.*)$/i);
    if (likeMatch && likeMatch[1]) {
      return (
        <span>
          <span className="text-[#4a3728]/70">liked </span>
          <span className="font-semibold text-[#4a3728]">{likeMatch[1]}</span>
        </span>
      );
    }

    return <span className="text-[#4a3728]/80">{action}</span>;
  };

  return (
    <div className="bg-[#f6ede8]/80 border border-[#e0d8cf] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-xl bg-[#4a3728]/10 border border-[#4a3728]/15 flex items-center justify-center text-[#4a3728]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full animate-pulse ring-2 ring-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#4a3728] leading-tight">Recent Activity</h3>
              <p className="text-[11px] text-[#4a3728]/60 font-medium">Real-time interactions on your company</p>
            </div>
          </div>
          <Link
            href="/activity"
            className="group flex items-center gap-1 text-xs font-semibold text-[#4a3728] hover:text-[#6b4e3d] transition-colors"
          >
            <span>View all</span>
            <span className="group-hover:translate-x-0.5 transition-transform duration-150">→</span>
          </Link>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3.5 p-3 rounded-xl bg-white/40 border border-[#e0d8cf]/40"
              >
                <div className="w-9 h-9 rounded-full bg-[#4a3728]/15 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-[#4a3728]/20 rounded w-2/3" />
                  <div className="h-2.5 bg-[#4a3728]/10 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="p-5 rounded-xl bg-red-50/80 border border-red-200 text-center my-4">
            <p className="text-xs text-red-600 font-medium">{error}</p>
          </div>
        ) : safeItems.length === 0 ? (
          /* Proper Empty State */
          <div className="py-12 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#e0d8cf]/50 border border-[#e0d8cf] flex items-center justify-center text-xl">
              ⚡
            </div>
            <p className="text-sm font-bold text-[#4a3728]">No recent activity</p>
            <p className="text-xs text-[#4a3728]/60 mt-1 max-w-xs mx-auto">
              Followers, likes, comments, and reviews on this company will appear here in real time.
            </p>
          </div>
        ) : (
          /* Real Activity List */
          <div className="space-y-2.5">
            {safeItems.map((item) => {
              const badge = getActivityTypeBadge(item.type, item.action);
              return (
                <div
                  key={item.id}
                  className="group flex items-center gap-3.5 p-3 rounded-xl bg-white/40 hover:bg-white/90 border border-transparent hover:border-[#e0d8cf]/80 transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                >
                  {/* Avatar with Activity Badge */}
                  <div className="relative flex-shrink-0">
                    <div
                      className={`w-9 h-9 ${item.color || 'bg-[#4a3728]'} text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm ring-2 ring-white`}
                    >
                      {item.avatar}
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${badge.bg} flex items-center justify-center ring-2 ring-white shadow-xs`}
                    >
                      {badge.icon}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#4a3728] truncate leading-snug">
                      <span className="font-semibold text-[#4a3728] hover:text-[#6b4e3d] transition-colors">
                        {item.user}
                      </span>{' '}
                      {renderActionContent(item.action)}
                    </p>
                  </div>

                  {/* Time */}
                  <span className="text-[11px] font-medium text-[#4a3728]/60 bg-[#e0d8cf]/40 border border-[#e0d8cf]/60 px-2 py-0.5 rounded-md flex-shrink-0">
                    {item.time}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

export default ActivityFeed;