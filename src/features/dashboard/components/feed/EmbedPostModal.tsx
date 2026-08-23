// src/features/dashboard/components/feed/EmbedPostModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface EmbedPostModalProps {
    post: any;
    isOpen: boolean;
    onClose: () => void;
    isDarkMode?: boolean;
    authorName: string;
    authorHeadline?: string;
    authorAvatar?: string;
    comments?: any[]; // flat/nested comments — same shape as postComments[postId]
    onRequestComments?: () => void;
    commentsLoading?: boolean;
  }

  const EmbedPostModal: React.FC<EmbedPostModalProps> = ({
    post,
    isOpen,
    onClose,
    isDarkMode,
    authorName,
    authorHeadline,
    authorAvatar,
    comments = [],
    onRequestComments,
    commentsLoading = false,
  }) => {
    const [embedMode, setEmbedMode] = useState<'less' | 'full'>('less');
    const [copied, setCopied] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [showLikesList, setShowLikesList] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (embedMode === 'full' && onRequestComments) {
      onRequestComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embedMode]);

  // ✅ NEW: modal khulte hi background page ko scroll hone se roko
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  if (!isOpen || !mounted || !post) return null;

  const postId = post.entryId || post.postId;
  const embedUrl = `${window.location.origin}/post/${postId}`;
  const iframeCode = `<iframe src="${embedUrl}" height="570" width="504" frameborder="0" allowfullscreen title="Embedded post"></iframe>`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(iframeCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const content = post.content || post.title || post.text || '';
  const truncated = content.length > 120 ? content.slice(0, 120) + '…' : content;
  const image = post.images?.[0]?.cloudinarySecureUrl || post.image;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
          isDarkMode ? 'bg-slate-800' : 'bg-white'
        }`}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-[#1a1a1a]'}`}>
            Embed this post
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-full ${isDarkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-500'}`}
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 pb-4">
          <p className={`text-sm mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            Copy and paste embed code on your site
          </p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={iframeCode}
              className={`flex-1 min-w-0 px-3 py-2 rounded-lg text-xs border truncate ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}
            />
            <button
              onClick={handleCopyCode}
              className="px-4 py-2 rounded-lg bg-[#4a3728] text-white text-sm font-semibold hover:opacity-90 flex-shrink-0"
            >
              {copied ? 'Copied!' : 'Copy code'}
            </button>
          </div>

          <div className="flex items-center gap-5 mt-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                checked={embedMode === 'less'}
                onChange={() => setEmbedMode('less')}
                className="accent-[#4a3728]"
              />
              <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>Embed with less text</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                checked={embedMode === 'full'}
                onChange={() => setEmbedMode('full')}
                className="accent-[#4a3728]"
              />
              <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>Embed full post</span>
            </label>
          </div>
        </div>

        {/* Preview */}
        <div className={`mx-6 mb-6 rounded-xl border overflow-hidden ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              {authorAvatar ? (
                <img src={authorAvatar} alt={authorName} className="w-11 h-11 rounded-full object-cover" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-[#4a3728] text-white flex items-center justify-center font-bold">
                  {authorName?.charAt(0)}
                </div>
              )}
              <div>
                <p className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-[#1a1a1a]'}`}>{authorName}</p>
                {authorHeadline && (
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{authorHeadline}</p>
                )}
                <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                  {post.createdAt
                    ? new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : ''}
                </p>
              </div>
            </div>

            <p className={`text-sm mb-1 ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
              {embedMode === 'less' ? truncated : content}
            </p>
            {embedMode === 'less' && content.length > 120 && (
              <button className="text-sm font-semibold text-[#4a3728] hover:underline mb-3">Read more</button>
            )}

            {image && (
              <img src={image} alt="post" className="w-full max-h-64 object-cover rounded-lg mt-2 mb-3" />
            )}

<div
              className={`relative flex items-center gap-4 text-xs pt-3 border-t ${
                isDarkMode ? 'border-slate-700 text-slate-400' : 'border-gray-100 text-gray-500'
              }`}
            >
              <button
                type="button"
                onClick={() => setShowLikesList((prev) => !prev)}
                className={`hover:underline cursor-pointer ${
                  isDarkMode ? 'hover:text-white' : 'hover:text-[#4a3728]'
                }`}
              >
                {post.likesCount || post.likes || 0} likes
              </button>
              <button
                type="button"
                onClick={() => setEmbedMode('full')}
                className={`hover:underline cursor-pointer ${
                  isDarkMode ? 'hover:text-white' : 'hover:text-[#4a3728]'
                }`}
              >
                {post.commentsCount || 0} comments
              </button>

              {showLikesList && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowLikesList(false)} />
                  <div
                    className={`absolute left-0 top-full mt-1 z-20 w-56 max-h-48 overflow-y-auto rounded-xl shadow-2xl border py-2 ${
                      isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
                    }`}
                  >
                    {(post.likedByConnectionsFull || []).length === 0 ? (
                      <p className={`px-4 py-2 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                        {post.likesCount || post.likes || 0} people liked this
                      </p>
                    ) : (
                      (post.likedByConnectionsFull || []).map((liker: any) => (
                        <div
                          key={liker.userId}
                          className={`flex items-center gap-2 px-4 py-2 ${
                            isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-50'
                          }`}
                        >
                          {liker.avatar ? (
                            <img src={liker.avatar} className="w-7 h-7 rounded-full object-cover" alt="" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-white">
                              {liker.name?.charAt(0)}
                            </div>
                          )}
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-[#1a1a1a]'}`}>
                            {liker.name}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

                       {/* Full post mode — comment box (sticky) + scrollable comments list */}
                       {embedMode === 'full' && (
              <div className="mt-4 max-h-72 overflow-y-auto">
                {/* ✅ Sticky top — comment input + sort dropdown scroll ke sath upar hi rehte hain */}
                <div className={`sticky top-0 z-10 pb-3 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    {authorAvatar ? (
                      <img src={authorAvatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#4a3728] text-white flex items-center justify-center text-xs font-bold">
                        {authorName?.charAt(0)}
                      </div>
                    )}
                    <div
                      className={`flex-1 flex items-center justify-between rounded-full px-4 py-2 border ${
                        isDarkMode ? 'border-slate-700' : 'border-gray-200'
                      }`}
                    >
                      <span className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                        Write a comment...
                      </span>
                      <button className="text-xs font-semibold px-3 py-1 rounded-full bg-[#4a3728] text-white">
                        Post
                      </button>
                    </div>
                  </div>

                  <p className={`text-xs font-semibold ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                    Most relevant ▾
                  </p>
                </div>

                {/* Comments list — ye hissa scroll hota hai, upar wala static rehta hai */}
                {commentsLoading ? (
                  <p className={`text-sm py-3 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Loading comments...
                  </p>
                ) : comments.length === 0 ? (
                  <p className={`text-sm py-3 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                    No comments yet.
                  </p>
                ) : (
                  <div className="space-y-3 pb-1">
                    {comments.map((c: any, i: number) => (
                      <div key={c.commentId || i} className="flex items-start gap-2">
                        {c.user?.avatar ? (
                          <img src={c.user.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-white">
                            {c.user?.name?.charAt(0) || '?'}
                          </div>
                        )}
                        <div className={`flex-1 rounded-2xl px-3 py-2 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                          <p className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-[#1a1a1a]'}`}>
                            {c.user?.name}
                          </p>
                          {c.user?.headline && (
                            <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                              {c.user.headline}
                            </p>
                          )}
                          <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                            {c.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EmbedPostModal;