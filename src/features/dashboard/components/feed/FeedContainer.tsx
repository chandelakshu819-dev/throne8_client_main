// app/(dashboard)/components/feed/FeedContainer.tsx
import React, { useEffect, useRef } from 'react';
import PostCard from './PostCard';
import RepostProgressBar from './RepostProgressBar';
import FeedRepostCard from './FeedRepostCard';

// Skeleton Loader Component for Post
const PostSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-32"></div>
        <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-24"></div>
      </div>
    </div>
    <div className="space-y-3">
      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded"></div>
      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-5/6"></div>
      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-4/6"></div>
    </div>
    <div className="h-64 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded"></div>
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
    feedReposts = [],
    isLoadingPosts = false,
    isLoadingMore = false,
    hasMore = false,
    loadMorePosts,
    currentUserId,
    likedPosts,
    isDarkMode,
    showRepostProgressBar,
    repostProgress,
    profileData,
    fullName,
  } = props;

  // ✅ FIX: pehle yahan posts ko pinned/unpinned mein split karke pinned
  // posts ko hamesha feed ke top par force kiya jaata tha. Pinning sirf
  // profile page (apni posts ki list) ke liye hona chahiye — home feed
  // mein nahi. Isi wajah se nayi/fresh post kabhi #1 slot par nahi aa
  // paati thi agar koi purani post pinned thi. Ab `posts` prop jis order
  // mein aata hai (jahan sabse naya prepended post already sabse upar
  // hota hai), usi natural order mein render karte hain — koi re-sort nahi.

  // ✅ Infinite scroll trigger — jab yeh sentinel div viewport mein aata hai,
  // aur hasMore true hai aur pehle se loadMore chal nahi raha, agla page fetch karo
  const observerTarget = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loadMorePosts) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoadingPosts) {
          loadMorePosts();
        }
      },
      { threshold: 0.1, rootMargin: '200px' } // 200px pehle hi trigger karo, taaki user ko wait na karna pade
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [hasMore, isLoadingMore, isLoadingPosts, loadMorePosts]);

  if (isLoadingPosts) {
    return (
      // ✅ SPACING FIX: space-y-8 → space-y-4 — posts ke beech gap sabse
      // bada spacing culprit tha, poore feed pe iska sabse bada asar padta
      // tha. Loading skeleton bhi consistent rehne ke liye same tight kiya.
      <main className="postLoader flex-1 space-y-4">
        <div className="space-y-4">
          {[1, 2, 3].map((index) => (
            <PostSkeleton key={`skeleton-${index}`} />
          ))}
        </div>
      </main>
    );
  }

  // ✅ FIX: ab feedReposts ko bhi consider karo — agar sirf naye client-side
  // reposts hain aur backend posts abhi load nahi hue, tab bhi "No posts"
  // wala empty state galat trigger na ho
  if (posts.length === 0 && feedReposts.length === 0) {
    return (
      <main className="flex-1 text-center py-20">
        <p className="text-gray-500 text-lg">No posts available yet</p>
        <p className="text-gray-400 text-sm mt-2">Check back later for updates!</p>
      </main>
    );
  }

  return (
    // ✅ SPACING FIX: space-y-8 → space-y-4 (see note above)
    <main className="flex-1 space-y-4">
      <RepostProgressBar
        isVisible={showRepostProgressBar}
        progress={repostProgress}
        isDarkMode={isDarkMode}
      />
      <div className="space-y-4">
        {/* client-side reposts (jo abhi-abhi create hui hain) sabse upar —
            turant dikhengi, refresh ka wait nahi karna padega. Backend
            refetch/refresh ke baad yeh hi reposts `posts` array ke andar
            `feedItemType: 'repost'` ban ke aa jaayengi (neeche wale block
            se render hongi), isliye duplicate render se bachne ke liye
            unique `repostId` key use ki hai dono jagah. */}
        {feedReposts.map((repostItem: any) => (
          <FeedRepostCard
            key={`local-${repostItem.repostId}`}
            {...props}
            repostItem={repostItem}
            isDarkMode={isDarkMode}
            profileImage={profileData?.profileImage || props.profileImage}
            fullName={fullName}
            reposterName={repostItem.reposterName || fullName}
            reposterAvatar={repostItem.reposterAvatar || profileData?.profileImage}
            currentUserId={currentUserId}
            likedPosts={likedPosts}
            handleLike={props.handleLike}
            toggleComments={props.toggleComments}
          />
        ))}

        {/* ✅ FIX: ab pinned/unpinned split nahi hota — `posts` array ke
            natural order mein hi render karte hain */}
        {posts.map((post: any, index: number) =>
          post.feedItemType === 'repost' ? (
            <FeedRepostCard
              key={post.repostId}
              {...props}
              repostItem={post}
              isDarkMode={isDarkMode}
              profileImage={profileData?.profileImage || props.profileImage}
              fullName={fullName}
              reposterName={post.reposterName}
              reposterAvatar={post.reposterAvatar}
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

      {/* ✅ Sentinel element — jab yeh screen pe aata hai, next page load hota hai */}
      {hasMore && (
        <div ref={observerTarget} className="py-4">
          {isLoadingMore && (
            <div className="space-y-4">
              <PostSkeleton />
            </div>
          )}
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <p className="text-center text-gray-400 text-sm py-8">You are all caught up 🎉</p>
      )}
    </main>
  );
};

export default FeedContainer;