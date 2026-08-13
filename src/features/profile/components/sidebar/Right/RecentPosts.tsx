//src/features/profile/components/sidebar/Right/RecentPosts.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface RecentPostsProps {
  isDarkMode: boolean;
  userPosts: any[];
}

const RecentPostDocThumbnail = ({ doc, onClick, isDarkMode }: { doc: any; onClick: any; isDarkMode: boolean }) => {
  const [hasError, setHasError] = useState(false);
  const thumbnailUrl = doc.cloudinarySecureUrl.toLowerCase().endsWith('.pdf')
    ? doc.cloudinarySecureUrl.replace(/\.pdf$/i, '.png')
    : doc.cloudinarySecureUrl;

  if (hasError) {
    return (
      <div 
        onClick={onClick}
        className={`w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center cursor-pointer ${
          isDarkMode ? 'bg-slate-600/50 text-slate-300' : 'bg-[#e0d8cf]/30 text-[#4a3728]'
        }`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={thumbnailUrl}
      onError={() => setHasError(true)}
      onClick={onClick}
      className="w-14 h-14 rounded-lg object-cover cursor-pointer flex-shrink-0"
      alt="Document Preview"
    />
  );
};

const RecentPosts: React.FC<RecentPostsProps> = ({ isDarkMode, userPosts }) => {
  const router = useRouter();
  const sortedPosts = [...userPosts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return (
    <>
      <h4 className={`text-lg font-black mb-4 ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>
        Your Recent Posts
      </h4>
      <div className="space-y-3">
        {
          sortedPosts.slice(0, 3).map((post) => (
            <div
              key={post.postId}
              onClick={() => router.push(`/profile/${post.userId}?section=activity`)}
              className={`rounded-xl p-3 border transition-all duration-300 hover:scale-105 cursor-pointer ${isDarkMode ? 'bg-slate-700/60 border-slate-600/60' : 'bg-white/60 border-[#4a3728]/20]'
                }`}
            >
              <div className="flex gap-3">
                {post.images?.[0]?.cloudinarySecureUrl ? (
                  <img
                    src={post.images[0].cloudinarySecureUrl}
                    onClick={(e) => { e.stopPropagation(); router.push(`/posts/${post.postId}`); }}
                    className="w-14 h-14 rounded-lg object-cover cursor-pointer flex-shrink-0"
                    alt="Post"
                  />
                ) : post.videos?.length > 0 ? (
                  <video
                    src={post.videos[0].cloudinarySecureUrl}
                    preload="metadata"
                    muted
                    onClick={(e) => { e.stopPropagation(); router.push(`/posts/${post.postId}`); }}
                    className="w-14 h-14 rounded-lg object-cover cursor-pointer flex-shrink-0 pointer-events-none"
                  />
                ) : post.documents?.length > 0 && post.documents[0].cloudinarySecureUrl ? (
                  <RecentPostDocThumbnail
                    doc={post.documents[0]}
                    onClick={(e) => { e.stopPropagation(); router.push(`/posts/${post.postId}`); }}
                    isDarkMode={isDarkMode}
                  />
                ) : (
                  <div 
                    onClick={(e) => { e.stopPropagation(); router.push(`/posts/${post.postId}`); }}
                    className={`w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center cursor-pointer ${
                      isDarkMode ? 'bg-slate-600/50 text-slate-300' : 'bg-[#e0d8cf]/30 text-[#4a3728]'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1">
                  <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>
                    {/* {post.title} */}
                    {post.title?.split(' ').slice(0, 4).join(' ')}{post.title?.split(' ').length > 4 ? '...' : ''}
                  </p>
                  <div
                    className={`flex justify-between text-xs mt-2 ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/70'
                      }`}
                  >
                    <span>❤️ {post.likesCount}</span>
                    <span>💬 {post.commentsCount}</span>
                    <span>🔁 {post.shares ?? 0}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </>
  );
};

export default RecentPosts;