// src/features/profile/components/feed/PostContent.tsx
import React, { useState } from 'react';
import AnalyticsService from '@/lib/api/analytics.service';


const PostContent = ({ post, isDarkMode }: { post: any; isDarkMode: boolean }) => {
  const [expanded, setExpanded] = useState(false);
  const content: string = post.content || '';

  // Get lines and filter out empty ones to find the first real line
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const firstLine = lines[0] || '';

  const isMultiline = lines.length > 1;
  const isTooLong = content.length > 40;
  const isLong = isMultiline || isTooLong;

  return (
    <>
      <p className={`text-base font-medium leading-relaxed mb-2 whitespace-pre-wrap ${!expanded && isLong ? 'line-clamp-1' : ''} ${isDarkMode ? 'text-slate-200' : 'text-[#4a3728]'}`}>
        {expanded ? content : (isMultiline ? firstLine : content)}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(v => !v)}
          className={`text-sm font-semibold mb-4 ${isDarkMode ? 'text-slate-300 hover:text-white' : 'text-[#6b5643] hover:text-[#4a3728]'}`}
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
      {post.image && (
        <div className="mb-6 rounded-2xl overflow-hidden bg-transparent w-full h-[180px] flex justify-center">
          <img
            src={post.image}
            alt="Post content"
            className="w-full h-full object-contain hover:scale-[1.01] transition-transform duration-500"
          />
        </div>
      )}
      {post.videos && post.videos.length > 0 && (
        <div className="mb-6 rounded-2xl overflow-hidden bg-black w-full h-64 flex justify-center">
          <video
            src={post.videos[0].cloudinarySecureUrl}
            controls
            preload="metadata"
            className="w-full h-full object-contain"
          />
        </div>
      )}
      {post.documents && post.documents.length > 0 && (
        <div className="mb-6 bg-gradient-to-br from-[#e0d8cf]/40 to-[#f6ede8]/30 border border-[#e0d8cf]/50 p-4 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-[#4a3728] text-[#f6ede8] rounded-xl flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-[#4a3728] truncate">
                {post.documents[0].originalName || 'Document'}
              </p>
              <p className="text-xs text-[#4a3728]/60">
                {post.documents[0].fileSize ? `${(post.documents[0].fileSize / 1024).toFixed(0)} KB` : '—'} · {post.documents[0].format?.toUpperCase() || 'PDF'}
              </p>
            </div>
          </div>
          <a
           href={post.documents[0].cloudinarySecureUrl}
           target="_blank"
           rel="noopener noreferrer"
           onClick={() => {
             AnalyticsService.recordClick(
               post.userId,
               'document_download',
               post.documents[0].cloudinarySecureUrl,
               post.entryId || post.postId
             );
           }}
           className="px-4 py-2 bg-[#4a3728] text-[#f6ede8] text-xs font-bold rounded-xl hover:opacity-90 transition-opacity flex-shrink-0"
         >
           Download
         </a>
        </div>
      )}
    </>
  );
};

export default PostContent;