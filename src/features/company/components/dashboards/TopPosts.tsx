import { memo } from 'react';
import Link from 'next/link';

export interface TopPost {
  id: string;
  title: string;
  impressions: number;
  likes: number;
  comments: number;
  date: string;
}

interface TopPostsProps {
  posts?: TopPost[];
  isLoading?: boolean;
  error?: string | null;
}

const TopPosts = memo(function TopPosts({ posts = [], isLoading = false, error = null }: TopPostsProps) {
  const safePosts = Array.isArray(posts) ? posts : [];

  const getRankBadgeClass = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-sm ring-1 ring-amber-300/50 font-black';
      case 1:
        return 'bg-gradient-to-br from-slate-400 to-slate-600 text-white shadow-sm font-bold';
      case 2:
        return 'bg-gradient-to-br from-amber-700 to-amber-900 text-white shadow-sm font-bold';
      default:
        return 'bg-[#e0d8cf] text-[#4a3728] font-bold';
    }
  };

  return (
    <div className="bg-[#f6ede8]/80 border border-[#e0d8cf] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#4a3728] leading-tight">Top Posts</h3>
              <p className="text-[11px] text-[#4a3728]/60 font-medium">Ranked by overall engagement</p>
            </div>
          </div>
          <Link
            href="/posts"
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
                <div className="w-8 h-8 rounded-lg bg-[#4a3728]/15 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-[#4a3728]/20 rounded w-3/5" />
                  <div className="h-2.5 bg-[#4a3728]/10 rounded w-2/5" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="p-5 rounded-xl bg-red-50/80 border border-red-200 text-center my-4">
            <p className="text-xs text-red-600 font-medium">{error}</p>
          </div>
        ) : safePosts.length === 0 ? (
          /* Proper Empty State */
          <div className="py-12 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#e0d8cf]/50 border border-[#e0d8cf] flex items-center justify-center text-xl">
              ✍️
            </div>
            <p className="text-sm font-bold text-[#4a3728]">No posts yet</p>
            <p className="text-xs text-[#4a3728]/60 mt-1 max-w-xs mx-auto">
              Publish company posts to track your top-performing content and impressions.
            </p>
            <Link
              href="/posts"
              className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-lg bg-[#4a3728] text-[#f6ede8] text-xs font-medium hover:bg-[#3d2c20] transition-colors shadow-sm"
            >
              <span>Create first post</span>
              <span>+</span>
            </Link>
          </div>
        ) : (
          /* Real Data List */
          <div className="space-y-2.5">
            {safePosts.map((post, i) => (
              <div
                key={post.id}
                className="group flex items-center gap-3.5 p-3 rounded-xl bg-white/40 hover:bg-white/90 border border-transparent hover:border-[#e0d8cf]/80 transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer"
              >
                {/* Ranking Badge */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs flex-shrink-0 transition-transform group-hover:scale-105 ${getRankBadgeClass(
                    i
                  )}`}
                >
                  #{i + 1}
                </div>

                {/* Post Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#4a3728] truncate group-hover:text-[#6b4e3d] transition-colors">
                    {post.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-[#4a3728]/70">
                    {/* Impressions */}
                    <span className="inline-flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-[#4a3728]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {post.impressions.toLocaleString()}
                    </span>

                    {/* Likes */}
                    <span className="inline-flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-rose-500/70" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      {post.likes}
                    </span>

                    {/* Comments */}
                    <span className="inline-flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-blue-500/70" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                      {post.comments}
                    </span>
                  </div>
                </div>

                {/* Relative Date */}
                <span className="text-[11px] font-medium text-[#4a3728]/60 bg-[#e0d8cf]/40 border border-[#e0d8cf]/60 px-2 py-0.5 rounded-md flex-shrink-0">
                  {post.date}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default TopPosts;