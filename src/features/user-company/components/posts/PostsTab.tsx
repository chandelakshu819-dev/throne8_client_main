'use client';
import { LayoutGrid } from 'lucide-react';
import { PostCard } from './PostCard';
import { usePosts } from '../../hooks/usePosts';
import { PostsFilterBar } from './PostsFilterBar';
import { Card, EmptyState } from '../ui';

export function PostsTab() {
  const { posts, activeFilter, filterOptions, onFilterChange } = usePosts();

  return (
    <div className="space-y-6 animate-slide-up">

      {/* Filter bar */}
      <Card padding="md">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <PostsFilterBar
            options={filterOptions}
            activeFilter={activeFilter}
            onFilterChange={onFilterChange}
          />
          <p className="text-xs text-brand-brown/45 font-medium flex-shrink-0">
            {posts.length} post{posts.length !== 1 ? 's' : ''}
          </p>
        </div>
      </Card>

      {/* Posts grid */}
      {posts.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={<LayoutGrid className="w-10 h-10" />}
            title="No posts yet"
            description="Check back soon — Throne8 is always sharing updates."
          />
        </Card>
      ) : (
        /*
         * Masonry-style responsive grid:
         * 1 col on mobile → 2 col on sm → 3 col on lg
         * Each card is fully self-contained so any col count works.
         */
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
          {posts.map((post) => (
            <div key={post.id} className="break-inside-avoid">
              <PostCard post={post} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
