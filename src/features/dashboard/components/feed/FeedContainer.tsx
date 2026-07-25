// app/(dashboard)/components/feed/FeedContainer.tsx
import React from 'react';
import PostCard from './PostCard';
import RepostProgressBar from './RepostProgressBar';
import FeedRepostCard from './FeedRepostCard';

// Skeleton Loader Component for Post
const PostSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
    {/* Header with profile image and name */}
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-32"></div>
        <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-24"></div>
      </div>
    </div>

    {/* Content skeleton */}
    <div className="space-y-3">
      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded"></div>
      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-5/6"></div>
      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-4/6"></div>
    </div>

    {/* Image skeleton */}
    <div className="h-64 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded"></div>

    {/* Actions skeleton */}
    <div className="flex justify-between pt-4 border-t">
      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-16"></div>
      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-16"></div>
      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-16"></div>
    </div>
  </div>
);

const FeedContainer = (props: any) => {
  const {
    posts = [],
    isLoadingPosts = false,
    currentUserId,
    likedPosts,
    isDarkMode,
    showRepostProgressBar,
    repostProgress,
    profileData,
    fullName,
  } = props;

  // Add loading state with skeleton loaders
  if (isLoadingPosts) {
    return (
      <main className="postLoader flex-1 space-y-8">
        <div className="space-y-8">
          {[1, 2, 3].map((index) => (
            <PostSkeleton key={`skeleton-${index}`} />
          ))}
        </div>
      </main>
    );
  }

  // Add empty state
  if (posts.length === 0) {
    return (
      <main className="flex-1 text-center py-20">
        <p className="text-gray-500 text-lg">No posts available yet</p>
        <p className="text-gray-400 text-sm mt-2">Check back later for updates!</p>
      </main>
    );
  }

  return (
    <main className="flex-1 space-y-8">
      {/* Repost Progress Bar at top of feed */}
      <RepostProgressBar
        isVisible={showRepostProgressBar}
        progress={repostProgress}
        isDarkMode={isDarkMode}
      />
      <div className="space-y-8">
        {/* ✅ FIX: feedReposts wala hardcoded block hataya —
            ab reposts backend se hi `posts` array ke andar
            feedItemType: 'repost' tag ke saath aate hain,
            already feedScore se sorted. Isliye ek hi loop
            mein dono types render karte hain, taaki order
            sahi rahe aur duplicate na ho. */}
        {posts.map((post: any, index: number) =>
          post.feedItemType === 'repost' ? (
            <FeedRepostCard
              key={post.repostId}
              repostItem={post}
              isDarkMode={isDarkMode}
              profileImage={profileData?.profileImage || props.profileImage}
              fullName={fullName}
              currentUserId={currentUserId}
              likedPosts={likedPosts}
              handleLike={props.handleLike}
              toggleComments={props.toggleComments}
            />
          ) : (
            <PostCard
              likedPosts={likedPosts}
              currentUserId={currentUserId}
              key={post.entryId || post.postId || index}
              post={post}
              profileImage={props.profileImage}
              index={index}
              onOpenWithPerspectiveModal={props.onOpenWithPerspectiveModal}
              handleRepostInstant={props.handleRepostInstant}
              {...props}
            />
          )
        )}
      </div>
    </main>
  );
};

export default FeedContainer;