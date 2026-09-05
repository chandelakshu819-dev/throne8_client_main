// src/features/dashboard/components/feed/PostContent.tsx
import React, { useState } from 'react';
import { renderFormattedContent, renderFormattedLine } from '@/shared/utils/postContentFormat';
import AnalyticsService from '@/lib/api/analytics.service';

const PostContent = ({ post, isDarkMode }: { post: any; isDarkMode: boolean }) => {
  const [expanded, setExpanded] = useState(false);
  const content: string = post.content || post.text || '';

  // Get lines and filter out empty ones to find the first real line
  const lines = content.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
  const firstLine = lines[0] || '';

  const isMultiline = lines.length > 1;
  const isTooLong = content.length > 40;
  const isLong = isMultiline || isTooLong;

  const displayNode = expanded
    ? renderFormattedContent(content)
    : renderFormattedLine(firstLine);

  // ✅ Multi-image support (LinkedIn-style collage grid)
  const images: any[] = post.images || [];
  const imageCount = images.length;

  // ✅ Har case (2 / 3 / 4 / 5+) ke liye sahi grid layout:
  // 1 photo  -> full width, natural height
  // 2 photos -> 2 columns, 1 row, equal height
  // 3 photos -> left tile bada (2 rows span), right side 2 tiles stacked
  // 4 photos -> 2x2 grid, equal tiles
  // 5+ photos -> same 2x2 grid, sirf 4 tiles dikhte hain — 4th tile pe
  //              "+N" overlay baaki count dikhata hai (5 photos => "+1",
  //              6 photos => "+2", waghera)
  const getGridColsClass = (): string => {
    if (imageCount <= 1) return 'grid-cols-1';
    return 'grid-cols-2';
  };

  const getGridRowsClass = (): string => {
    // 3+ images do rows mein arrange hote hain (grid ko explicit
    // batana zaroori hai warna row-span-2 wali tile sahi se stretch
    // nahi hoti)
    if (imageCount >= 3) return 'grid-rows-2';
    return '';
  };

  const getTileClass = (index: number): string => {
    const classes = ['relative', 'overflow-hidden', isDarkMode ? 'bg-slate-800' : 'bg-[#efe9e1]'];

    if (imageCount === 1) {
      classes.push(`max-h-[650px] w-full flex items-center justify-center rounded-2xl ${isDarkMode ? 'bg-slate-800' : 'bg-[#efe9e1]'}`);
      return classes.join(' ');
    }

    if (imageCount === 2) {
      // ✅ 2 photos: dono ek row mein, poori decent height ke saath
      // (pehle 150px tha jo squished dikhta tha)
      classes.push('h-[240px] sm:h-[320px]');
      return classes.join(' ');
    }

    if (imageCount === 3) {
      const isFirstOfThree = index === 0;
      if (isFirstOfThree) {
        // ✅ FIX: pehle yahan h-[150px] bhi push ho raha tha jo
        // row-span-2 ke against conflict karta tha aur tile chhoti
        // reh jaati thi. Ab h-full — apni poori spanned row-height
        // (dono rows + gap) fill karega.
        classes.push('row-span-2 h-full');
      } else {
        classes.push('h-[150px]', 'sm:h-[190px]');
      }
      return classes.join(' ');
    }

    // 4 ya usse zyada (max 4 tiles hi render honge)
    classes.push('h-[150px]', 'sm:h-[190px]');
    return classes.join(' ');
  };

  const handleReadMoreClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setExpanded((v) => !v);
  };

  const handleImageContainerClick = () => {
    AnalyticsService.recordClick(
      post.userId,
      'image',
      images[0]?.cloudinarySecureUrl,
      post.postId
    );
  };

  const handleVideoContainerClick = () => {
    AnalyticsService.recordClick(
      post.userId,
      'video',
      post.videos[0].cloudinarySecureUrl,
      post.postId
    );
  };

  const handleDocumentContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  const handleDocumentDownloadClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
    AnalyticsService.recordClick(
      post.userId,
      'document_download',
      post.documents[0].cloudinarySecureUrl,
      post.postId
    );
  };

  // ✅ SPACING FIX: mb-2 → mb-1 — content text ke baad gap tight kiya
  const contentTextClass = [
    'text-base',
    'font-medium',
    'leading-relaxed',
    'mb-1',
    expanded ? 'whitespace-pre-wrap' : 'truncate',
    isDarkMode ? 'text-slate-200' : 'text-[#4a3728]',
  ]
    .filter(Boolean)
    .join(' ');

  // ✅ SPACING FIX: mb-4 → mb-2 — "Read more" button ke baad gap tight kiya
  const readMoreClass = isDarkMode
    ? 'text-sm font-semibold mb-2 text-slate-300 hover:text-white'
    : 'text-sm font-semibold mb-2 text-[#6b5643] hover:text-[#4a3728]';

  // ✅ SPACING FIX: mb-6 → mb-3 — image grid ke neeche gap tight kiya
  const imageGridClass = [
    'mb-3',
    'rounded-2xl',
    'overflow-hidden',
    'grid',
    'gap-1',
    'cursor-pointer',
    getGridColsClass(),
    getGridRowsClass(),
  ]
    .filter(Boolean)
    .join(' ');

  // ✅ FIX: 5+ photos ho toh bhi sirf 4 tiles render hongi (pehle
  // slice(0,5) tha jo 5-tile ka broken/odd grid banata tha). 4th tile
  // pe hi "+N" overlay lagega, N = baaki bachi hui photos.
  const visibleCount = Math.min(imageCount, 4);
  const visibleImages = images.slice(0, visibleCount);
  const extraCount = imageCount - visibleCount;

  return (
    <>
      <p className={contentTextClass}>{displayNode}</p>

      {isLong && (
        <button onClick={handleReadMoreClick} className={readMoreClass}>
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}

      {imageCount > 0 && (
        <div onClick={handleImageContainerClick} className={imageGridClass}>
          {visibleImages.map((img: any, i: number) => {
            const isOverlayTile = i === visibleCount - 1 && extraCount > 0;

            return (
              <div key={img.mediaId || i} className={getTileClass(i)}>
                <img
                  src={img.cloudinarySecureUrl}
                  alt={'Post image ' + (i + 1)}
                  className={`w-full ${imageCount === 1 ? 'h-auto max-h-[650px] object-contain rounded-2xl' : 'h-full object-cover'} hover:scale-[1.01] transition-transform duration-500`}
                />
                {isOverlayTile && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">+{extraCount}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {post.videos && post.videos.length > 0 && (
        <div
          onClick={handleVideoContainerClick}
          // ✅ SPACING FIX: mb-6 → mb-3
          className={`mb-3 rounded-2xl overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-[#efe9e1]'} w-full h-80 flex justify-center cursor-pointer`}
        >
          <video
            src={post.videos[0].cloudinarySecureUrl}
            controls
            preload="metadata"
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {post.documents && post.documents.length > 0 && (
        <div
          onClick={handleDocumentContainerClick}
          // ✅ SPACING FIX: mb-6 → mb-3
          className="mb-3 bg-gradient-to-br from-[#e0d8cf]/40 to-[#f6ede8]/30 border border-[#e0d8cf]/50 p-4 rounded-2xl flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-[#4a3728] text-[#f6ede8] rounded-xl flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-[#4a3728] truncate">
                {post.documents[0].originalName || 'Document'}
              </p>
              <p className="text-xs text-[#4a3728]/60">
                {post.documents[0].fileSize
                  ? (post.documents[0].fileSize / 1024).toFixed(0) + ' KB'
                  : '—'}{' '}
                · {post.documents[0].format?.toUpperCase() || 'PDF'}
              </p>
            </div>
          </div>
          <a
            href={post.documents[0].cloudinarySecureUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleDocumentDownloadClick}
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