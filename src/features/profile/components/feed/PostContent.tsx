// src/features/profile/components/feed/PostContent.tsx
import React, { useState } from 'react';
import AnalyticsService from '@/lib/api/analytics.service';
import { renderFormattedContent, renderFormattedLine } from '@/shared/utils/postContentFormat';

const extractImageUrl = (item: any): string | null => {
  if (!item) return null;
  if (typeof item === 'string') return item;
  return (
    item.cloudinarySecureUrl ||
    item.secureUrl ||
    item.url ||
    item.src ||
    null
  );
};

const PostContent = ({ post, isDarkMode, forceExpanded = false, hideMedia = false, disableToggle = false }: { post: any; isDarkMode: boolean; forceExpanded?: boolean; hideMedia?: boolean; disableToggle?: boolean }) => {
  const [expanded, setExpanded] = useState(!!forceExpanded);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  const content: string = post.content || post.text || post.title || post.caption || post.description || '';

  const isTooLong = content.length > 40;
  const isLong = isTooLong;

  // ✅ Collapsed state me bhi poora formatted content render hota hai,
  // CSS `line-clamp-1` usko visually 1 line tak clip karta hai.
  const displayNode = renderFormattedContent(content);

  const rawImages: any[] = Array.isArray(post.images) && post.images.length > 0
    ? post.images
    : (post.image ? [post.image] : []);

  const imageList: string[] = rawImages
    .map(extractImageUrl)
    .filter((url): url is string => !!url);

  const hasMultipleImages = imageList.length > 1;

  const goToPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev === 0 ? imageList.length - 1 : prev - 1));
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev === imageList.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
           <p className={`text-base font-medium leading-relaxed mb-2 ${expanded ? 'whitespace-pre-wrap' : 'line-clamp-1'} ${isDarkMode ? 'text-slate-200' : 'text-[#4a3728]'}`}>
        {displayNode}
      </p>
      {isLong && (
        <button
          onClick={(e) => {
            if (disableToggle) return; // card ke andar: bubble hone do taaki parent handleOpenDetailModal modal khole
            e.stopPropagation();
            setExpanded(v => !v);
          }}
          className={`text-sm font-semibold mb-4 ${isDarkMode ? 'text-slate-300 hover:text-white' : 'text-[#6b5643] hover:text-[#4a3728]'}`}
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}

      {!hideMedia && imageList.length > 0 && (
        <div className={`relative mb-2 rounded-2xl overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-[#efe9e1]'} w-full h-52 md:h-60 flex items-center justify-center flex-shrink-0`}>
          <img
            src={imageList[currentImgIndex]}
            alt="Post content"
            className="w-full h-full object-contain hover:scale-[1.01] transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop';
            }}
          />

          {hasMultipleImages && (
            <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-xs text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-md z-10 tracking-wide">
              {currentImgIndex + 1}/{imageList.length}
            </div>
          )}

          {hasMultipleImages && currentImgIndex > 0 && (
            <button
              onClick={goToPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-[#4a3728] rounded-full w-7 h-7 flex items-center justify-center shadow-md z-10 transition-transform active:scale-95"
              aria-label="Previous image"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {hasMultipleImages && currentImgIndex < imageList.length - 1 && (
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-[#4a3728] rounded-full w-7 h-7 flex items-center justify-center shadow-md z-10 transition-transform active:scale-95"
              aria-label="Next image"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      )}

      {post.videos && post.videos.length > 0 && (
        <div className={`mb-6 rounded-2xl overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-[#efe9e1]'} w-full h-64 flex justify-center`}>
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