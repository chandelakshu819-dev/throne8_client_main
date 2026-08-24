'use client';
// src/features/profile/components/home/ActivitySection.tsx
// top of ActivitySection.tsx
import { createPortal } from 'react-dom';
import React, { useEffect, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ShowAllActivityModal from './ShowAllActivityModal';
import CreatePostModal from './CreatePostModal';
import UpdatePostModal from './UpdatePostModal';
import PostCard from '../feed/PostCard';
import PostActions from '../feed/PostActions';
import CommentsSection from '../feed/CommentsSection';
import RepostWithPerspectiveModal from '../../../dashboard/components/feed/RepostWithPerspectiveModal';
import ReportPostModal from './ReportPostModal';
import { useActivityHandlers } from '../../hooks/useActivityHandler';
import { ActivitySectionProps } from '../../types';
import { ACTIVITY_TABS } from '../../constants';
import { useConnectionsData } from '@/features/profile/hooks/useConnectionsData';
import ProfileService from '@/lib/api/profile.service';
import AuthService from '@/lib/api/auth.service';
import FollowService from '@/lib/api/follow.service';
import ReportService from '@/lib/api/report.service';
import AnalyticsService from '@/lib/api/analytics.service'; // ✅ NEW — real post analytics ke liye
import RepostService from '@/lib/api/repost.service'; // ✅ NEW
import PostHeader from '../feed/PostHeader'; // ✅ NEW — embed preview ke liye
import PostContent from '../feed/PostContent'; // ✅ NEW — embed preview ke liye
import ReactionsModal from '../feed/ReactionsModal'; // ✅ NEW — embed preview ke likes modal ke liye
import DeleteConfirmModal from './DeleteConfirmModal';

const EmptyState = ({ label }: { label: string }) => {
  return (
    <div className="text-center py-14">
      <div className="w-16 h-16 bg-[#4a3728]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-[#4a3728]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p className="text-[#4a3728]/50 font-medium">{label}</p>
    </div>
  );
};

const DocumentCard = ({ post, doc }: { post: any; doc: any }) => {
  const [showPreview, setShowPreview] = useState(false);
  const previewUrl = 'https://docs.google.com/viewer?url=' + encodeURIComponent(doc.cloudinarySecureUrl) + '&embedded=true';
  const fileSizeKB = doc.fileSize ? (doc.fileSize / 1024).toFixed(0) : '-';

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  return (
    <div className="group bg-gradient-to-br from-[#e0d8cf]/60 via-[#e0d8cf]/40 to-[#f6ede8]/30 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-[#e0d8cf]/40 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#4a3728]/5 to-transparent rounded-full blur-xl group-hover:scale-150 transition-transform duration-700" />
      <div className="flex items-start gap-5 relative z-10">
        <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-[#4a3728] to-[#7a5c3e] rounded-xl flex items-center justify-center shadow-lg">
          <svg className="w-7 h-7 text-[#f6ede8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-[#4a3728] truncate">{doc.originalName}</h4>
          <p className="text-sm text-[#4a3728]/60 mt-0.5">
            {post.title} - {fileSizeKB} KB - {doc.format ? doc.format.toUpperCase() : 'DOC'}
          </p>
          <div className="flex gap-3 mt-3 flex-wrap">
            <button onClick={togglePreview} className="px-4 py-2 bg-gradient-to-r from-[#4a3728] to-[#7a5c3e] text-[#f6ede8] rounded-xl text-sm font-semibold hover:opacity-90 transition-all duration-200 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{showPreview ? 'Hide PDF' : 'View PDF'}</span>
            </button>
            <a href={doc.cloudinarySecureUrl} download={doc.originalName} target="_blank" rel="noopener noreferrer" className="px-4 py-2 border-2 border-[#4a3728]/30 text-[#4a3728] rounded-xl text-sm font-semibold hover:border-[#4a3728]/60 hover:bg-[#4a3728]/5 transition-all duration-200 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download</span>
            </a>
          </div>
        </div>
      </div>
      {showPreview ? (
        <div className="mt-5 rounded-xl overflow-hidden border-2 border-[#e0d8cf] relative z-10">
          <div className="bg-[#4a3728]/5 px-4 py-2 flex items-center gap-2 border-b border-[#e0d8cf]">
            <div className="w-2 h-2 rounded-full bg-[#4a3728]/40" />
            <span className="text-xs font-semibold text-[#4a3728]/60 truncate">{doc.originalName}</span>
          </div>
          <iframe src={previewUrl} className="w-full h-[520px] bg-white" title={doc.originalName} />
        </div>
      ) : null}
    </div>
  );
};

// ✅ REWRITTEN: RepostCard now reuses the SAME PostCard component used for
// normal posts, instead of duplicating card markup. Only the OUTER header
// ("You reposted") is custom — everything below it (author, content, media,
// like/comment/repost/send bar) is the exact same PostCard used elsewhere,
// so styling/behavior stays perfectly consistent and never drifts.
const RepostCard = (props: any) => {
  const {
    repost,
    onDeleteRepost,
    profileImage,
    fullName,
    currentUserId,
    isOwnProfile,
    handlers,
    openRepostCommentsKey,
    setOpenRepostCommentsKey,
    onReportPost, // ✅ NEW
  } = props;

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);   // 👈 NEW
  const [isThoughtExpanded, setIsThoughtExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);   // ✅ yaha le aao

  const [originalAuthorName, setOriginalAuthorName] = useState('');
  const [originalAuthorHeadline, setOriginalAuthorHeadline] = useState('');
  const [originalAuthorAvatar, setOriginalAuthorAvatar] = useState('');


   // ✅ NEW: toast + save state + embed modal
   const [toast, setToast] = useState<{ message: string; linkText?: string; onLinkClick?: () => void } | null>(null);
   const [isSaved, setIsSaved] = useState(false); // will sync in useEffect below
   const [isSaving, setIsSaving] = useState(false);
   const [showEmbedModal, setShowEmbedModal] = useState(false);
   const [embedFullText, setEmbedFullText] = useState(false); // ✅ NEW — "less text" vs "full post" toggle

   const [showEmbedLikesModal, setShowEmbedLikesModal] = useState(false);
const [showEmbedComments, setShowEmbedComments] = useState(false);


const [deleteConfirmPostId, setDeleteConfirmPostId] = useState<string | null>(null);
const [isDeletingConfirmed, setIsDeletingConfirmed] = useState(false);


  const originalPost = repost.originalPost;
  const isQuote = repost.repostType === 'quote';
  const postKey = originalPost ? (originalPost.entryId || originalPost.postId) : undefined;


// ✅ FIX: sirf tab re-sync karo jab repost khud badle (postKey change),
  // parent ke har re-render par nahi — warna optimistic save turant purane
  // stale value se overwrite ho jata hai (flicker: save → unsave → save)
  useEffect(() => {
    if (originalPost) setIsSaved(!!originalPost.isSaved);
  }, [postKey]);



  // ✅ NEW: menu ke bahar kahin bhi click ho toh menu band ho jaye
useEffect(() => {
  if (!openMenuId) return;
  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setOpenMenuId(null);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [openMenuId]);




  // ✅ NEW: toast auto-dismiss// ✅ NEW: jab embed modal khule tab background page ko scroll hone se roko
useEffect(() => {
  if (showEmbedModal) {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // background static
    return () => {
      document.body.style.overflow = originalOverflow; // modal band hote hi wapas normal
    };
  }
}, [showEmbedModal]);


  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);


  // ✅ Quote-repost ka apna independent like state (server value se init)
  const [quoteLiked, setQuoteLiked] = useState(!!repost.isLikedByCurrentUser);
  const [quoteLikesCount, setQuoteLikesCount] = useState(repost.likesCount || 0);

  // ── Fetch original author's name/headline/avatar ──
  useEffect(() => {
    if (!originalPost || !originalPost.userId) return;

    if (originalPost.userId === currentUserId) {
      setOriginalAuthorName(fullName || 'You');
      setOriginalAuthorAvatar(profileImage || '');
      return;
    }

    const fetchAuthor = async () => {
      try {
        const response = await AuthService.getUserProfileById(originalPost.userId);
        const user = response ? response.data : null;
        if (user) {
          setOriginalAuthorName((user.firstName + ' ' + (user.lastName || '')).trim());
          if (user.headlineId) {
            try {
              const headlineRes = await ProfileService.getHeadlineById(user.headlineId);
              setOriginalAuthorHeadline(headlineRes?.data?.title || '');
            } catch {
              setOriginalAuthorHeadline('');
            }
          }
          if (user.profilePhotoId) {
            const photoRes = await ProfileService.getProfilePhotoById(user.profilePhotoId);
            setOriginalAuthorAvatar(photoRes && photoRes.data && photoRes.data.photo ? photoRes.data.photo.cloudinarySecureUrl : '');
          }
        }
      } catch (err) {
        setOriginalAuthorName('Unknown User');
      }
    };
    fetchAuthor();
  }, [originalPost, currentUserId, fullName, profileImage]);

  // ✅ Simple repost ke liye: original post ka like-state postLikes map mein
  // seed karo agar wahan pehle se nahi hai (kyunki ye post `posts` prop
  // — apne khud ke posts — ka hissa nahi hai, isliye normal sync-effect
  // isko cover nahi karta)
  useEffect(() => {
    if (!isQuote && postKey && originalPost) {
      handlers.seedPostLikeState(postKey, {
        count: originalPost.likesCount || 0,
        isLiked: originalPost.isLikedByCurrentUser || false,
      });
    }
  }, [isQuote, postKey, originalPost]);

  if (!originalPost) return null;


const handleDeleteRepost = () => {
  setOpenMenuId(null);
  setShowDeleteConfirm(true);
};

const confirmDeleteRepost = async () => {
  try {
    setIsDeleting(true);
    if (onDeleteRepost) await onDeleteRepost(repost.repostId);
  } catch (err) {
    alert('Failed to remove repost');
  } finally {
    setIsDeleting(false);
    setShowDeleteConfirm(false);
  }
};

  const handleCopyLink = async () => {
    setOpenMenuId(null);
    try {
      const postUrl = window.location.origin + '/post/' + postKey;
      await navigator.clipboard.writeText(postUrl);
      setToast({
        message: 'Link copied to clipboard.',
        linkText: 'View post',
        onLinkClick: () => window.open(postUrl, '_blank'),
      });
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleEmbed = () => {
    setOpenMenuId(null);
    setShowEmbedModal(true); // ✅ ab silent copy nahi, modal khulega
  };

  const handleSaveRepost = async () => {
    setOpenMenuId(null);
    const prevSaved = isSaved;
    setIsSaved(!prevSaved); // optimistic toggle
    setIsSaving(true);
    try {
      await handlers.handleSavePost(postKey, prevSaved);
      setToast({ message: prevSaved ? 'Post unsaved.' : 'Post saved.' });
    } catch (err) {
      setIsSaved(prevSaved); // revert on failure
      setToast({ message: 'Failed to save post.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleWhoCanView = () => {
    setOpenMenuId(null);
    setToast({ message: 'Visible to: ' + (originalPost.visibility ? originalPost.visibility : 'Anyone (Public)') });
  };

  const handleReportRepost = () => {
    setOpenMenuId(null);
    if (onReportPost) onReportPost(postKey);
  };




  // ✅ Quote-repost ka apna like/unlike handler — independent API call
  const handleQuoteLike = async () => {
    const wasLiked = quoteLiked;
    setQuoteLiked(!wasLiked);
    setQuoteLikesCount((prev: number) => (wasLiked ? Math.max(0, prev - 1) : prev + 1));

    try {
      if (wasLiked) {
        await RepostService.removeReactionFromRepost(repost.repostId);
      } else {
        await RepostService.reactToRepost(repost.repostId);
      }
    } catch (err) {
      setQuoteLiked(wasLiked);
      setQuoteLikesCount((prev: number) => (wasLiked ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  // ✅ getPostIdForInteraction() concept: normal post -> post._id,
  // simple repost -> originalPostEntryId, quote repost -> its own repostId
  // (independent engagement).
  const postKeyForActions = isQuote ? `repost:${repost.repostId}` : postKey;

  // ✅ Synthetic post object handed to PostCard. For simple repost, all
  // engagement numbers/state come straight from originalPost (backend
  // source of truth). For quote repost, likes come from the repost's own
  // independent state; comments/reposts still reference the original.
const postForCard = isQuote
    ? {
        ...originalPost,
        entryId: postKeyForActions,
        postId: postKeyForActions,
        likesCount: quoteLikesCount,
        isLikedByCurrentUser: quoteLiked,
        image: originalPost.images?.[0]?.cloudinarySecureUrl || '',
      }
    : {
        ...originalPost,
        entryId: postKey,
        postId: postKey,
        image: originalPost.images?.[0]?.cloudinarySecureUrl || '',
      };

  const effectiveHandleLike = () => {
    if (isQuote) {
      handleQuoteLike();
    } else {
      handlers.handleLikeToggle(postKey);
    }
  };

  return (
    <div className="p-3 rounded-3xl shadow-2xl backdrop-blur-xl border transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 bg-[#f6ede8]/95 border-[#4a3728]/20 relative overflow-hidden h-full flex flex-col">
      {/* ── Outer header: represents the REPOSTER ("You reposted"), never the original author ── */}


      {/* <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#e0d8cf]/50"> */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#e0d8cf]/50">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#4a3728]/20 flex-shrink-0 flex items-center justify-center bg-[#4a3728]/20">
            {profileImage ? (
              <img src={profileImage} alt="You" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-5 h-5 text-[#4a3728]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-[#4a3728] text-sm truncate">You</p>
              <span className="text-xs text-[#4a3728]/50 flex-shrink-0">reposted</span>
            </div>
            <p className="text-xs text-[#4a3728]/50 mt-0.5">
              {isQuote ? 'Quote Repost' : 'Repost'} · {new Date(repost.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* ✅ Only the "remove my repost" action — no edit/delete/pin/archive
            menu for the ORIGINAL post shows up here */}
        {isOwnProfile ? (
          <div className="relative flex-shrink-0" ref={menuRef}>
            <button onClick={() => setOpenMenuId(openMenuId ? null : 'menu')} className="p-2 hover:bg-[#4a3728]/10 rounded-full transition-all duration-200">
              <svg className="w-5 h-5 text-[#4a3728]/60" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 8a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 8a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
              </svg>
            </button>
            {openMenuId === 'menu' ? (
              <div className="absolute right-0 top-8 bg-white rounded-xl shadow-2xl border border-[#e0d8cf] z-50 min-w-[220px] overflow-hidden">
                <button onClick={handleSaveRepost} disabled={isSaving} className="w-full text-left px-4 py-2.5 text-sm text-[#4a3728] hover:bg-[#e0d8cf]/50 transition-colors duration-200 flex items-center gap-2 disabled:opacity-50">
                  <i className={`ri-bookmark-${isSaved ? 'fill' : 'line'} text-base`}></i>
                  <span>{isSaved ? 'Unsave' : 'Save'}</span>
                </button>
                <button onClick={handleCopyLink} className="w-full text-left px-4 py-2.5 text-sm text-[#4a3728] hover:bg-[#e0d8cf]/50 transition-colors duration-200 flex items-center gap-2">
                  <i className="ri-links-line text-base"></i>
                  <span>Copy link to post</span>
                </button>
                <button onClick={handleEmbed} className="w-full text-left px-4 py-2.5 text-sm text-[#4a3728] hover:bg-[#e0d8cf]/50 transition-colors duration-200 flex items-center gap-2">
                  <i className="ri-code-s-slash-line text-base"></i>
                  <span>Embed this post</span>
                </button>

                <div className="h-px bg-[#e0d8cf] my-1" />

                <button onClick={handleDeleteRepost} disabled={isDeleting} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 flex items-center gap-2 disabled:opacity-50">
                  <i className="ri-delete-bin-line text-base"></i>
                  <span>{isDeleting ? 'Removing...' : 'Delete repost'}</span>
                </button>
                <button onClick={handleReportRepost} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 flex items-center gap-2">
                  <i className="ri-flag-line text-base"></i>
                  <span>Report post</span>
                </button>

                <div className="h-px bg-[#e0d8cf] my-1" />

                <button onClick={handleWhoCanView} className="w-full text-left px-4 py-2.5 text-sm text-[#4a3728] hover:bg-[#e0d8cf]/50 transition-colors duration-200 flex items-center gap-2">
                  <i className="ri-eye-line text-base"></i>
                  <span>Who can view my post?</span>
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {isQuote && repost.thoughtText ? (
  <div className="mb-2 px-2 border-l-2 border-[#4a3728]/30">
    <p className={`text-sm text-[#4a3728]/80 italic whitespace-pre-wrap ${!isThoughtExpanded ? 'line-clamp-1' : ''}`}>
      {repost.thoughtText}
    </p>
    {repost.thoughtText.length > 40 || repost.thoughtText.includes('\n') ? (
      <button
        onClick={() => setIsThoughtExpanded((v) => !v)}
        className="text-xs font-semibold text-[#6b5643] hover:text-[#4a3728] mt-0.5"
      >
        {isThoughtExpanded ? 'Show less' : 'Read more'}
      </button>
    ) : null}
  </div>
) : null}


      {/* ── Inner content: SAME PostCard component used for normal posts ── */}
  <div className="flex-1 min-h-0 overflow-hidden">
  <PostCard
          post={postForCard}
          index={postKeyForActions}
          isOwnProfile={false}
          showMenu={false}   // ✅ NEW — image 2 wala non-functional "⋯" hatane ke liye

          profileImage={originalAuthorAvatar || originalPost.userAvatar}
          fullName={originalAuthorName || originalPost.userName || originalPost.fullName || 'Unknown User'}
          headline={originalAuthorHeadline}
          postLikes={handlers.postLikes}
          openMenuId={null}
          setOpenMenuId={() => {}}
          onLikeToggle={effectiveHandleLike}
          onPinPost={undefined}
          onSavePost={handlers.handleSavePost}
          onDeletePost={undefined}
          onArchivePost={undefined}
          onOpenUpdateModal={undefined}
          openCommentsIndex={openRepostCommentsKey === postKeyForActions ? postKeyForActions : null}
          onToggleComments={() => setOpenRepostCommentsKey((prev: string | null) => (prev === postKeyForActions ? null : postKeyForActions))}
          commentsByPost={handlers.commentsByPost}
          isLoadingComments={handlers.isLoadingComments}
          isSubmittingComment={handlers.isSubmittingComment}
          commentLikes={handlers.commentLikes}
          formatCommentTime={handlers.formatCommentTime}
          openCommentMenuIndex={handlers.openCommentMenuIndex}
          toggleCommentMenu={handlers.toggleCommentMenu}
          handleCommentAction={handlers.handleCommentAction}
          editingCommentId={handlers.editingCommentId}
          editCommentText={handlers.editCommentText}
          setEditCommentText={handlers.setEditCommentText}
          handleEditSubmit={handlers.handleEditSubmit}
          isDeletingCommentId={handlers.isDeletingCommentId}
          replyingToCommentId={handlers.replyingToCommentId}
          setReplyingToCommentId={handlers.setReplyingToCommentId}
          replyText={handlers.replyText}
          setReplyText={handlers.setReplyText}
          handleReplySubmit={handlers.handleReplySubmit}
          likeCommentToggle={handlers.likeCommentToggle}
          commentText={handlers.commentText}
          setCommentText={handlers.setCommentText}
          handleCommentSubmit={handlers.handleCommentSubmit}
          replyingTo={handlers.replyingTo}
          setReplyingTo={handlers.setReplyingTo}
          showEmojiPicker={handlers.showEmojiPicker}
          setShowEmojiPicker={handlers.setShowEmojiPicker}
          handleEmojiClick={handlers.handleEmojiClick}
          setIsDeletingCommentId={handlers.setIsDeletingCommentId}
          currentUserId={currentUserId || ''}
          isDarkMode={undefined}
          likedPosts={handlers.postLikes}
          handleLike={effectiveHandleLike}
          openMenuIndex={null}
          openRepostIndex={null}
          handlePostAction={() => {}}
           handleRepost={() => {}}
          toggleComments={() => setOpenRepostCommentsKey((prev: string | null) => (prev === postKeyForActions ? null : postKeyForActions))}
          handleReply={handlers.setReplyingToCommentId}
          handleCommentReaction={handlers.likeCommentToggle}
          postComments={handlers.commentsByPost}
          emojiList={undefined}
          togglePostMenu={() => {}}
          toggleRepostMenu={() => {}}
          postCommentCounts={undefined}
          fetchCommentsByPost={handlers.fetchCommentsByPost}
          
        />
      </div>

      {/* ✅ NEW: toast (alert() ki jagah) */}
      {toast && createPortal(
        <div className="fixed bottom-6 left-6 z-[3000] bg-white rounded-xl shadow-2xl border border-[#e0d8cf] px-4 py-3 flex items-center gap-3">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm text-[#4a3728] font-medium">
            {toast.message}{' '}
            {toast.linkText && (
              <button onClick={toast.onLinkClick} className="underline font-semibold">{toast.linkText}</button>
            )}
          </span>
          <button onClick={() => setToast(null)} className="text-[#4a3728]/40 hover:text-[#4a3728] ml-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>,
        document.body
      )}

  {/* ✅ NEW: Embed modal — real LinkedIn jaisa scrollable preview */}
  {showEmbedModal && createPortal(
        <div onClick={() => setShowEmbedModal(false)} className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-[#e0d8cf] relative flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h2 className="text-lg font-bold text-[#4a3728]">Embed this post</h2>
              <button onClick={() => setShowEmbedModal(false)} className="p-1.5 rounded-full hover:bg-[#e0d8cf]/50 text-[#4a3728]/60">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-[#4a3728]/60 mb-2 flex-shrink-0">Copy and paste embed code on your site</p>

            <div className="flex items-center gap-2 mb-4 flex-shrink-0">
              <input
                readOnly
                value={'<iframe src="' + window.location.origin + '/post/' + postKey + '/embed" width="504" height="600" frameborder="0"></iframe>'}
                className="flex-1 px-3 py-2 rounded-lg border border-[#e0d8cf] text-xs text-[#4a3728]/70 bg-[#f6ede8]/50 truncate"
              />
              <button
                onClick={async () => {
                  const embedCode = '<iframe src="' + window.location.origin + '/post/' + postKey + '/embed" width="504" height="600" frameborder="0"></iframe>';
                  await navigator.clipboard.writeText(embedCode);
                  setShowEmbedModal(false);
                  setToast({ message: 'Embed code copied to clipboard.' });
                }}
                className="px-4 py-2 bg-[#4a3728] text-white rounded-lg text-sm font-semibold hover:opacity-90 flex-shrink-0"
              >
                Copy code
              </button>
            </div>

            {/* ✅ NEW: real LinkedIn jaisa "less text" / "full post" toggle */}
            <div className="flex items-center gap-6 mb-4 flex-shrink-0">
              <label className="flex items-center gap-2 text-sm text-[#4a3728] cursor-pointer">
                <input type="radio" checked={!embedFullText} onChange={() => setEmbedFullText(false)} className="accent-[#4a3728]" />
                Embed with less text
              </label>
              <label className="flex items-center gap-2 text-sm text-[#4a3728] cursor-pointer">
                <input type="radio" checked={embedFullText} onChange={() => setEmbedFullText(true)} className="accent-[#4a3728]" />
                Embed full post
              </label>
            </div>

            {/* ✅ NEW: scrollable, real post jaisa preview — same PostHeader/PostContent reuse */}
            <div className="rounded-xl border border-[#e0d8cf] overflow-y-auto flex-1 min-h-0 bg-white p-4">
              <PostHeader
                post={{
                  avatar: originalAuthorAvatar || originalPost.userAvatar,
                  user: originalAuthorName || originalPost.userName || originalPost.fullName || 'Unknown User',
                  role: originalAuthorHeadline,
                  time: new Date(originalPost.createdAt || repost.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                  userId: originalPost.userId,
                }}
                index={postKeyForActions}
                isDarkMode={false}
                openMenuIndex={null}
                togglePostMenu={() => {}}
                handlePostAction={() => {}}
                currentUserId={currentUserId || ''}
                showMenu={false}
              />
              <PostContent
                post={{
                  content: originalPost.content || originalPost.title || '',
                  image: originalPost.images?.[0]?.cloudinarySecureUrl || '',
                  videos: originalPost.videos,
                  documents: originalPost.documents,
                }}
                isDarkMode={false}
                forceExpanded={embedFullText}
              />
              {/* ✅ yahan paste karo — PostContent ke turant baad, closing </div> se pehle */}
              <div className="flex items-center justify-between text-xs text-[#4a3728]/60 border-t border-[#e0d8cf] pt-3 mt-2">
  <button
    type="button"
    onClick={() => setShowEmbedLikesModal(true)}
    className="hover:underline hover:text-[#4a3728] font-medium"
  >
    {originalPost.likesCount || 0} likes
  </button>
  <span className="mx-1">·</span>
  <button
    type="button"
    onClick={async () => {
      const next = !showEmbedComments;
      setShowEmbedComments(next);
      // ✅ pehli baar khulte waqt hi comments fetch karo agar already load nahi hue
      if (next && postKey && !handlers.commentsByPost[postKey]) {
        await handlers.fetchCommentsByPost(postKey, originalPost.userId);
      }
    }}
    className="hover:underline hover:text-[#4a3728] font-medium"
  >
    {originalPost.commentsCount || 0} comments
  </button>
</div>

{/* ✅ NEW: comments inline expand — embed preview ke andar hi */}
{showEmbedComments && postKey ? (
  <div className="mt-3 border-t border-[#e0d8cf] pt-3">
    <CommentsSection
      postId={postKey}
      comments={handlers.commentsByPost[postKey] || []}
      isLoading={!!handlers.isLoadingComments[postKey]}
      commentCount={originalPost.commentsCount || 0}
      profileImage={profileImage}
      openCommentMenuIndex={handlers.openCommentMenuIndex}
      toggleCommentMenu={handlers.toggleCommentMenu}
      handleCommentAction={handlers.handleCommentAction}
      editingCommentId={handlers.editingCommentId}
      editCommentText={handlers.editCommentText}
      setEditCommentText={handlers.setEditCommentText}
      handleEditSubmit={handlers.handleEditSubmit}
      commentText={handlers.commentText}
      setCommentText={handlers.setCommentText}
      handleCommentSubmit={() => handlers.handleCommentSubmit(postKey)}
      handleReply={handlers.setReplyingToCommentId}
      handleCommentReaction={handlers.likeCommentToggle}
      replyingTo={handlers.replyingTo}
      setReplyingTo={handlers.setReplyingTo}
      showEmojiPicker={handlers.showEmojiPicker}
      setShowEmojiPicker={handlers.setShowEmojiPicker}
      handleEmojiClick={handlers.handleEmojiClick}
      currentUserId={currentUserId || ''}
      isDarkMode={false}
    />
  </div>
) : null}
            </div>
          </div>
        </div>,
        document.body
      )}


{showEmbedLikesModal && postKey ? (
  <ReactionsModal
    postId={postKey}
    isOpen={showEmbedLikesModal}
    onClose={() => setShowEmbedLikesModal(false)}
    isDarkMode={false}
  />
) : null}

<DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteRepost}
        isDeleting={isDeleting}
        message="Are you sure you want to delete this repost permanently?"
      />
    </div>
  );
};



  

const VideoCard = ({ post, video }: { post: any; video: any }) => {
  const fileSizeMB = video.fileSize ? (video.fileSize / (1024 * 1024)).toFixed(1) : '-';
  const duration = video.duration ? Math.floor(video.duration / 60) + ':' + String(Math.floor(video.duration % 60)).padStart(2, '0') : '';

  return (
    <div className="group bg-gradient-to-br from-[#e0d8cf]/60 via-[#e0d8cf]/40 to-[#f6ede8]/30 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-[#e0d8cf]/40 relative">
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#4a3728]/5 to-transparent rounded-full blur-xl group-hover:scale-150 transition-transform duration-700 z-[1]" />
      <div className="relative">
        <video controls className="w-full h-64 object-cover bg-black" src={video.cloudinarySecureUrl} preload="metadata" />
        {duration ? (
          <div className="absolute bottom-3 right-3 bg-black/70 text-white px-3 py-1 rounded-lg text-sm font-semibold z-[2]">{duration}</div>
        ) : null}
      </div>
      <div className="p-5 relative z-[1]">
        <h4 className="text-base font-bold text-[#4a3728] mb-1">{post.title}</h4>
        <div className="flex items-center gap-3 text-[#4a3728]/60 text-sm">
          <span className="bg-[#4a3728]/10 px-2 py-0.5 rounded-lg font-semibold uppercase text-xs">{video.format || 'MP4'}</span>
          <span>{fileSizeMB} MB</span>
          <span className="truncate">{video.originalName}</span>
        </div>
      </div>
    </div>
  );
};

const ImageCard = ({ post, img }: { post: any; img: any }) => {
  return (
    <div className="group bg-gradient-to-br from-[#e0d8cf]/60 via-[#e0d8cf]/40 to-[#f6ede8]/30 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-500 border border-[#e0d8cf]/40">
      <div className="relative overflow-hidden h-56">
        <img
          src={img.cloudinarySecureUrl}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=500&fit=crop'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="p-4">
        <p className="text-[#4a3728] font-semibold text-sm truncate">{post.title}</p>
      
      </div>
    </div>
  );
};

const ActivitySection: React.FC<ActivitySectionProps> = (props) => {
  const {
    posts,
    onPostCreated,
    isLoading = false,
    profileImage = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    fullName = '',
    headline = '',
    followers = 0,
    currentUserId,
    userReposts = [],
    userId,
    onCreateRepost,
    onDeleteRepost,
    isOwnProfile = true,
  } = props as any;

  const [activeTab, setActiveTab] = useState('Posts');
  const [showAllModal, setShowAllModal] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [openRepostIndex, setOpenRepostIndex] = useState<number | null>(null);
  const [isRepostWithPerspectiveOpen, setIsRepostWithPerspectiveOpen] = useState(false);
  const [selectedRepostPost, setSelectedRepostPost] = useState<any>(null);
  const [userComments, setUserComments] = useState<any[]>([]);
  const [isLoadingUserComments, setIsLoadingUserComments] = useState(false);
  const [selectedAnalyticsPost, setSelectedAnalyticsPost] = useState<any>(null);
  // ✅ NEW: real backend analytics ke liye state (post.viewsCount jaisa stale field use nahi karenge)
  const [analyticsData, setAnalyticsData] = useState<{ impressions: number; likes: number; comments: number; shares: number } | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [visibleCommentsCount, setVisibleCommentsCount] = useState(3);
  const [visibleImagesCount, setVisibleImagesCount] = useState(3);
  const [hiddenPostIds, setHiddenPostIds] = useState<Set<string>>(new Set());
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [undoToast, setUndoToast] = useState<any>(null);
  const [openRepostCommentsKey, setOpenRepostCommentsKey] = useState<string | null>(null);
  const [actionToast, setActionToast] = useState<{ message: string; linkText?: string; onLinkClick?: () => void } | null>(null); // ✅ NEW

  // ✅ NEW: normal post ke liye embed preview modal (RepostCard jaisa)
  const [embedPostId, setEmbedPostId] = useState<string | null>(null);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [embedFullText, setEmbedFullText] = useState(false);
  const [showEmbedLikesModal, setShowEmbedLikesModal] = useState(false);
  const [showEmbedComments, setShowEmbedComments] = useState(false);


  const [deleteConfirmPostId, setDeleteConfirmPostId] = useState<string | null>(null);
  const [isDeletingConfirmed, setIsDeletingConfirmed] = useState(false);

  // ✅ Live followers count sync for Activity badge
  const [displayFollowers, setDisplayFollowers] = useState<number>(followers);

  useEffect(() => {
    setDisplayFollowers(followers);
  }, [followers]);

  useEffect(() => {
    const targetId = userId || currentUserId;
    if (targetId) {
      FollowService.getFollowCounts(targetId)
        .then((res: any) => {
          const count = res?.data?.followersCount ?? res?.followersCount;
          if (typeof count === 'number') {
            setDisplayFollowers(count);
          }
        })
        .catch(() => {});
    }
  }, [userId, currentUserId]);

 
  useEffect(() => {
    if (reportingPostId) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [reportingPostId]);
  
  // ✅ NEW: embed modal khulte hi background page ko scroll hone se roko
  useEffect(() => {
    if (showEmbedModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showEmbedModal]);




useEffect(() => {
  if (!actionToast) return;
  const t = setTimeout(() => setActionToast(null), 4000);
  return () => clearTimeout(t);
}, [actionToast]);

// ✅ NEW: post analytics modal khulte hi background page ko scroll hone se roko
useEffect(() => {
  if (selectedAnalyticsPost) {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }
}, [selectedAnalyticsPost]);

// ✅ NEW: modal khulte hi backend se REAL analytics fetch karo — post.viewsCount
// hamesha stale/0 tha kyunki wo kabhi backend se aata hi nahi tha
useEffect(() => {
  if (!selectedAnalyticsPost) {
    setAnalyticsData(null);
    return;
  }
  const postId = selectedAnalyticsPost.entryId || selectedAnalyticsPost.postId;
  if (!postId) return;

  let cancelled = false;
  setIsLoadingAnalytics(true);
  AnalyticsService.getPostAnalytics(postId)
    .then((res: any) => {
      if (cancelled) return;
      const d = res?.data || res || {};
      setAnalyticsData({
        impressions: d.impressions ?? d.viewsCount ?? d.totalImpressions ?? 0,
        likes: d.likes ?? d.likesCount ?? selectedAnalyticsPost.likesCount ?? 0,
        comments: d.comments ?? d.commentsCount ?? selectedAnalyticsPost.commentsCount ?? 0,
        shares: d.shares ?? d.sharesCount ?? 0,
      });
    })
    .catch((err) => {
      console.error('Failed to load post analytics:', err);
      if (!cancelled) {
        // fallback: jo bhi post object me already hai wahi dikha do
        setAnalyticsData({
          impressions: 0,
          likes: selectedAnalyticsPost.likesCount || selectedAnalyticsPost.likes || 0,
          comments: selectedAnalyticsPost.commentsCount || 0,
          shares: 0,
        });
      }
    })
    .finally(() => {
      if (!cancelled) setIsLoadingAnalytics(false);
    });

  return () => { cancelled = true; };
}, [selectedAnalyticsPost]);

// ✅ NEW: engagement % real fetched data se calculate hoga
const engagementPercent = analyticsData
  ? Math.min(
      100,
      Number((((analyticsData.likes + analyticsData.comments + analyticsData.shares) / Math.max(1, analyticsData.impressions)) * 100).toFixed(1))
    )
  : 0;

  useEffect(() => {
    setVisibleCommentsCount(3);
    setVisibleImagesCount(3);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'Comments') return;
    const targetUserId = isOwnProfile ? currentUserId : userId;
    if (!targetUserId) return;

    const fetchComments = async () => {
      try {
        setIsLoadingUserComments(true);
        const response = isOwnProfile ? await ProfileService.getMyComments() : await ProfileService.getCommentsByUserId(targetUserId);
        setUserComments(response.data && response.data.comments ? response.data.comments : (response.data || []));
      } catch (error) {
        setUserComments([]);
      } finally {
        setIsLoadingUserComments(false);
      }
    };
    fetchComments();
  }, [activeTab, currentUserId, userId, isOwnProfile]);

  const formatRelativeTime = (dateStr: string) => {
    if (!dateStr) return 'Recently';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (mins < 1) return 'Just now';
    if (mins < 60) return mins + 'm ago';
    if (hours < 24) return hours + 'h ago';
    return days + 'd ago';
  };

  const handlers = useActivityHandlers({ posts, onPostCreated, profileImage });

  // ✅ NOTE: yeh sirf "Posts" tab se original post ko hide karta hai (jaisa
  // LinkedIn karta hai) — repost card khud hamesha alag, naya card ke roop
  // mein render hota hai. Yeh already sahi behavior hai.
  const repostedEntryIds = new Set(userReposts.map((r: any) => r.originalPost ? r.originalPost.entryId : null).filter(Boolean));

  const filteredPosts = posts.filter((p: any) => {
    const key = p.entryId || p.postId;
    return !repostedEntryIds.has(key) && !hiddenPostIds.has(key);
  });
  const hasMorePosts = (filteredPosts.length + userReposts.length) > 2;

 // ✅ FIX: pehle pinned post(s) sabse upar, uske baad baaki createdAt
  // ke hisaab se real chronological order (jaise pehle tha)
  const combinedItems = [
    ...userReposts.map((repost: any) => ({ type: 'repost' as const, data: repost, createdAt: repost.createdAt })),
    ...filteredPosts.map((post: any) => ({ type: 'post' as const, data: post, createdAt: post.createdAt })),
  ].sort((a, b) => {
    const aKey = a.type === 'post' ? (a.data.entryId || a.data.postId) : null;
    const bKey = b.type === 'post' ? (b.data.entryId || b.data.postId) : null;
    const aPinned = aKey ? (handlers.postPins[aKey] ?? a.data.isPinned ?? false) : false;
    const bPinned = bKey ? (handlers.postPins[bKey] ?? b.data.isPinned ?? false) : false;
    if (aPinned !== bPinned) return aPinned ? -1 : 1; // pinned wala pehle
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });


  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const clientWidth = scrollRef.current.clientWidth;
      const scrollWidth = scrollRef.current.scrollWidth;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => { handleScroll(); }, 200);
    return () => clearTimeout(timer);
  }, [combinedItems.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (handlers.openMenuId !== null) {
        const target = event.target as HTMLElement;
        if (!target.closest('.post-menu-container') && !target.closest('.post-menu-trigger')) {
          handlers.setOpenMenuId(null);
        }
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [handlers.openMenuId, handlers.setOpenMenuId]);

  const scrollLeftFn = () => {
    if (scrollRef.current) {
      const clientWidth = scrollRef.current.clientWidth;
      scrollRef.current.scrollBy({ left: -clientWidth / 2, behavior: 'smooth' });
    }
  };

  const scrollRightFn = () => {
    if (scrollRef.current) {
      const clientWidth = scrollRef.current.clientWidth;
      scrollRef.current.scrollBy({ left: clientWidth / 2, behavior: 'smooth' });
    }
  };

  const { fetchConnectionsData } = useConnectionsData();

  useEffect(() => {
    if (currentUserId) fetchConnectionsData(currentUserId);
  }, [currentUserId]);

  const ShowAllButton = ({ label }: { label: string }) => (
    <button onClick={() => setShowAllModal(true)} className="w-full group bg-gradient-to-r from-[#4a3728]/10 via-[#4a3728]/5 to-[#e0d8cf]/20 hover:from-[#4a3728]/20 hover:via-[#4a3728]/15 hover:to-[#e0d8cf]/30 border-2 border-dashed border-[#4a3728]/30 hover:border-[#4a3728]/50 rounded-2xl p-6 transition-all duration-300 flex items-center justify-center gap-3 relative z-30">
      <span className="text-[#4a3728] font-bold text-lg">{label}</span>
      <svg className="w-5 h-5 text-[#4a3728] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );

  const allVideos: { post: any; video: any }[] = posts.flatMap((p: any) => (p.videos || []).map((v: any) => ({ post: p, video: v })));
  const allImages: { post: any; img: any }[] = posts.flatMap((p: any) => (p.images || []).map((img: any) => ({ post: p, img })));
  const allDocuments: { post: any; doc: any }[] = posts.flatMap((p: any) => (p.documents || []).map((doc: any) => ({ post: p, doc })));

  const handleRepostInstant = async (idx: number) => {
    const post = posts[idx];
    if (!post) return;
    const postId = post.entryId || post.postId;
    try {
      if (onCreateRepost) await onCreateRepost(postId, 'repost');
      alert('Post reposted successfully!');
      if (onPostCreated) onPostCreated();
    } catch (error: any) {
      if (error.message && error.message.includes('already reposted')) {
        alert('You have already reposted this post');
      } else {
        alert(error.message || 'Repost failed');
      }
    } finally {
      setOpenRepostIndex(null);
    }
  };

  const openRepostWithPerspectiveModal = (post: any, idx: number) => {
    setSelectedRepostPost(post);
    setIsRepostWithPerspectiveOpen(true);
    setOpenRepostIndex(null);
  };

  const handleConfirmRepost = async (thoughts: string) => {
    if (!selectedRepostPost) return;
    const postId = selectedRepostPost.entryId || selectedRepostPost.postId;
    try {
      if (onCreateRepost) await onCreateRepost(postId, 'quote', thoughts);
      alert('Quote reposted successfully!');
      if (onPostCreated) onPostCreated();
    } catch (error: any) {
      alert(error.message || 'Repost failed');
    } finally {
      setIsRepostWithPerspectiveOpen(false);
      setSelectedRepostPost(null);
    }
  };

  const handleUndoAction = async () => {
    if (!undoToast) return;
    const postId = undoToast.postId;
    const action = undoToast.action;
    const targetUserId = undoToast.targetUserId;

    setHiddenPostIds((prev) => {
      const next = new Set(prev);
      next.delete(postId);
      return next;
    });

    if (action === 'unfollow' && targetUserId) {
      try {
        await FollowService.followUser(targetUserId);
      } catch (err: any) {
        alert(err.message || 'Failed to re-follow');
      }
    }

    setUndoToast(null);
  };

  const handlePostAction = async (action: string, postId: string) => {
    const viewerAllowedActions = ['copy', 'embed', 'analytics', 'save', 'not-interested', 'unfollow', 'report'];

    if (!isOwnProfile && viewerAllowedActions.indexOf(action) === -1) {
      return;
    }

    const post = posts.find((p: any) => (p.entryId || p.postId) === postId);
    if (!post) return;

    if (action === 'copy') {
      try {
        const postUrl = window.location.origin + '/post/' + postId;
        await navigator.clipboard.writeText(postUrl);
        setActionToast({ message: 'Link copied to clipboard.', linkText: 'View post', onLinkClick: () => window.open(postUrl, '_blank') });
      } catch (err) {
        console.error('Failed to copy text: ', err);
        setActionToast({ message: 'Failed to copy link.' });
      }
      return;
    }

    if (action === 'embed') {
      // ✅ FIX: seedha clipboard copy nahi — RepostCard jaisa preview modal kholo
      setEmbedPostId(postId);
      setShowEmbedModal(true);
      return;

    }


    if (action === 'pin') {
      // ✅ FIX: read from local postPins state (not stale post.isPinned prop)
      const wasPinned = handlers.postPins[postId] ?? post.isPinned ?? false;
      try {
        await handlers.handlePinPost(postId, wasPinned);
        setActionToast({ message: wasPinned ? 'Post unpinned.' : 'Post pinned to profile.' });
      } catch (err) {
        setActionToast({ message: 'Failed to pin post.' });
      }
      return;
    }



    if (action === 'edit') {
      const idx = posts.findIndex((p: any) => (p.entryId || p.postId) === postId);
      if (idx === -1) return;
      handlers.setUpdatePostId(idx);
      handlers.setUpdatePostTitle(post.content || post.title || '');
      handlers.setShowUpdateModal(true);
      return;
    }

    if (action === 'save') {
      const wasSaved = handlers.postSaves[postId] ?? post.isSaved ?? false;
      try {
        await handlers.handleSavePost(postId, wasSaved);
        setActionToast({ message: wasSaved ? 'Post unsaved.' : 'Post saved.' });
      } catch (err: any) {
        console.error('Save/unsave failed:', err); // debug ke liye — dekh sakte ho actual backend error kya hai
        // ✅ FIX: pehle hardcoded "Failed to save post." tha chahe save fail ho
        // ya unsave — ab action ke hisaab se sahi message dikhega
        setActionToast({ message: wasSaved ? 'Failed to unsave post.' : 'Failed to save post.' });
      }
      return;
    }



    if (action === 'delete') {
      // ✅ ab confirm() nahi — custom modal khulega, user confirm karega tab delete hoga
      setDeleteConfirmPostId(postId);
      return;
    }



    if (action === 'archive' || action === 'hide') {
      await handlers.handleArchivePost(postId);
      setActionToast({ message: 'Post archived.' });
      return;
    }

    if (action === 'analytics') {
      setSelectedAnalyticsPost(post);
      return;
    }

    if (action === 'not-interested') {
      setHiddenPostIds((prev) => {
        const next = new Set(prev);
        next.add(postId);
        return next;
      });
      setUndoToast({
        postId: postId,
        message: "You won't see this post again.",
        action: 'not-interested',
      });
      setTimeout(() => {
        setUndoToast((prev: any) => (prev && prev.postId === postId ? null : prev));
      }, 6000);
      return;
    }

    if (action === 'unfollow') {
      const targetUserId = post.userId || post.userid || post.authorId;
      if (!targetUserId) {
        alert('Unable to identify this user.');
        return;
      }
      const targetName = post.userName || post.fullName || 'this user';
      if (!confirm('Unfollow ' + targetName + '? You will stop seeing their posts.')) return;

      try {
        await FollowService.unfollowUser(targetUserId);
        setHiddenPostIds((prev) => {
          const next = new Set(prev);
          next.add(postId);
          return next;
        });
        setUndoToast({
          postId: postId,
          message: 'Unfollowed ' + targetName + '.',
          action: 'unfollow',
          targetUserId: targetUserId,
        });
        setTimeout(() => {
          setUndoToast((prev: any) => (prev && prev.postId === postId ? null : prev));
        }, 6000);
      } catch (err: any) {
        alert(err.message || 'Failed to unfollow');
      }
      return;
    }

    if (action === 'report') {
      setReportingPostId(postId);
      return;
    }
  };


  const confirmDeletePost = async () => {
    if (!deleteConfirmPostId) return;
    try {
      setIsDeletingConfirmed(true);
      await handlers.handleDeletePost(deleteConfirmPostId);
    } catch (err) {
      setActionToast({ message: 'Failed to delete post.' });
    } finally {
      setIsDeletingConfirmed(false);
      setDeleteConfirmPostId(null);
    }
  };

  return (
    <>
      <div id="activity-section" className="bg-gradient-to-br from-[#f6ede8]/90 via-[#f6ede8]/80 to-[#e0d8cf]/70 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-[#e0d8cf]/60 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#e0d8cf]/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#4a3728]/10 to-transparent rounded-full blur-2xl" />

        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-gradient-to-b from-[#4a3728] to-[#7a5c3e] rounded-full" />
            <h3 className="text-2xl font-bold text-[#4a3728] tracking-tight">Activity</h3>
          </div>
          <div className="flex items-center gap-2 bg-[#4a3728]/10 px-4 py-2 rounded-full backdrop-blur-sm">
            <div className="w-2 h-2 bg-[#4a3728] rounded-full animate-pulse" />
            <p className="text-sm font-semibold text-[#4a3728]">{displayFollowers} followers</p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-8 relative z-10">
          <div className="bg-[#e0d8cf]/50 backdrop-blur-sm rounded-2xl p-1">
            <div className="flex">
              {ACTIVITY_TABS.map((item: string) => (
                <button
                  key={item}
                  onClick={() => setActiveTab(item)}
                  className={'px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-300 relative ' + (activeTab === item ? 'text-[#f6ede8] bg-[#4a3728] shadow-lg transform scale-105' : 'text-[#4a3728]/70 hover:text-[#4a3728] hover:bg-[#e0d8cf]/30')}
                >
                  {item}
                  {activeTab === item ? (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-[#4a3728] rounded-full" />
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          {isOwnProfile ? (
            <button onClick={() => setShowCreatePostModal(true)} className="group px-6 py-3 bg-gradient-to-r from-[#4a3728] to-[#7a5c3e] text-[#f6ede8] rounded-2xl text-sm font-semibold transition-all duration-300 flex items-center gap-3 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[#7a5c3e] to-[#4a3728] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <svg className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span className="relative z-10">Create a post</span>
            </button>
          ) : null}
        </div>

        <div className="space-y-6 relative z-10">
          {activeTab === 'Posts' ? (
            isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4a3728]" />
              </div>
            ) : combinedItems.length === 0 ? (
              <EmptyState label={isOwnProfile ? 'No posts yet. Create your first post!' : 'No posts yet.'} />
            ) : (
              <>
                <div className="relative w-full min-w-0 group/slider">
                  <style dangerouslySetInnerHTML={{ __html: '.no-scrollbar::-webkit-scrollbar { display: none !important; }' }} />

                  {showLeftArrow ? (
                    <button onClick={scrollLeftFn} className="absolute left-[-16px] top-1/2 -translate-y-1/2 z-20 bg-white hover:bg-neutral-100 text-[#4a3728] w-10 h-10 rounded-full flex items-center justify-center shadow-lg border border-[#e0d8cf] transition-all duration-200">
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                  ) : null}

                  {showRightArrow ? (
                    <button onClick={scrollRightFn} className="absolute right-[-16px] top-1/2 -translate-y-1/2 z-20 bg-white hover:bg-neutral-100 text-[#4a3728] w-10 h-10 rounded-full flex items-center justify-center shadow-lg border border-[#e0d8cf] transition-all duration-200">
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  ) : null}

                  <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex flex-row overflow-x-auto gap-4 scroll-smooth pb-28 px-1 no-scrollbar -mb-28"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {combinedItems.map((item, idx) => {
                      if (item.type === 'repost') {
                        return (
                          // <div key={'repost-' + item.data.repostId} className="w-[calc(100%-16px)] sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-11px)] flex-shrink-0 flex flex-col h-[560px]">
<div key={'repost-' + item.data.repostId} className="w-[calc(100%-16px)] md:w-[calc(50%-8px)] flex-shrink-0 flex flex-col h-[500px]">                            
                          <RepostCard
                              repost={item.data}
                              onDeleteRepost={onDeleteRepost}
                              profileImage={profileImage}
                              fullName={fullName}
                              currentUserId={currentUserId}
                              isOwnProfile={isOwnProfile}
                              handlers={handlers}
                              openRepostCommentsKey={openRepostCommentsKey}
                              setOpenRepostCommentsKey={setOpenRepostCommentsKey}
                              onReportPost={(pid: string) => setReportingPostId(pid)}

                            />

                          </div>

                          
                        );
                      }

                      

                      const post = item.data;
                      const postKey = post.entryId || post.postId;
                      const originalIndex = posts.findIndex((p: any) => (p.entryId || p.postId) === postKey);
                      const idxToUse = originalIndex !== -1 ? originalIndex : idx;

                      return (
                        // <div key={'post-' + postKey} className="w-[calc(100%-16px)] sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-11px)] flex-shrink-0 flex flex-col h-[560px]">
                        <div key={'post-' + postKey} className="w-[calc(100%-16px)] md:w-[calc(50%-8px)] flex-shrink-0 flex flex-col h-[500px]">
                          <PostCard
                            post={post}
                            index={idxToUse}
                            isOwnProfile={isOwnProfile}
                            profileImage={profileImage}
                            fullName={fullName}
                            headline={headline}
                            postLikes={handlers.postLikes}
                            openMenuId={handlers.openMenuId}
                            setOpenMenuId={handlers.setOpenMenuId}
                            onLikeToggle={handlers.handleLikeToggle}
                            onPinPost={isOwnProfile ? handlers.handlePinPost : undefined}
                            onSavePost={handlers.handleSavePost}
                            onDeletePost={isOwnProfile ? handlers.handleDeletePost : undefined}
                            onArchivePost={isOwnProfile ? handlers.handleArchivePost : undefined}
                            onOpenUpdateModal={
                              isOwnProfile
                                ? (i: any, title: any) => {
                                    handlers.setUpdatePostId(i);
                                    handlers.setUpdatePostTitle(title);
                                    handlers.setShowUpdateModal(true);
                                  }
                                : undefined
                            }
                            openCommentsIndex={handlers.openCommentsIndex === idxToUse ? postKey : null}
                            onToggleComments={handlers.toggleCommentsPanel}
                            commentsByPost={handlers.commentsByPost}
                            isLoadingComments={handlers.isLoadingComments}
                            isSubmittingComment={handlers.isSubmittingComment}
                            commentLikes={handlers.commentLikes}
                            formatCommentTime={handlers.formatCommentTime}
                            openCommentMenuIndex={handlers.openCommentMenuIndex}
                            toggleCommentMenu={handlers.toggleCommentMenu}
                            handleCommentAction={handlers.handleCommentAction}
                            editingCommentId={handlers.editingCommentId}
                            editCommentText={handlers.editCommentText}
                            setEditCommentText={handlers.setEditCommentText}
                            handleEditSubmit={handlers.handleEditSubmit}
                            isDeletingCommentId={handlers.isDeletingCommentId}
                            replyingToCommentId={handlers.replyingToCommentId}
                            setReplyingToCommentId={handlers.setReplyingToCommentId}
                            replyText={handlers.replyText}
                            setReplyText={handlers.setReplyText}
                            handleReplySubmit={handlers.handleReplySubmit}
                            likeCommentToggle={handlers.likeCommentToggle}
                            commentText={handlers.commentText}
                            setCommentText={handlers.setCommentText}
                            handleCommentSubmit={handlers.handleCommentSubmit}
                            replyingTo={handlers.replyingTo}
                            setReplyingTo={handlers.setReplyingTo}
                            showEmojiPicker={handlers.showEmojiPicker}
                            setShowEmojiPicker={handlers.setShowEmojiPicker}
                            handleEmojiClick={handlers.handleEmojiClick}
                            setIsDeletingCommentId={handlers.setIsDeletingCommentId}
                            currentUserId={currentUserId || ''}
                            isDarkMode={undefined}
                            likedPosts={handlers.postLikes}
                            postSaves={handlers.postSaves}
                            postPins={handlers.postPins}
                            handleLike={handlers.handleLikeToggle}
                            openMenuIndex={handlers.openMenuId}
                            openRepostIndex={openRepostIndex}
                            handlePostAction={handlePostAction}
                            toggleComments={(pid: string) => {
                              const pIdx = posts.findIndex((p: any) => (p.entryId || p.postId) === pid);
                              if (pIdx !== -1) {
                                handlers.toggleCommentsPanel(pIdx, pid);
                              }
                            }}
                            handleReply={handlers.setReplyingToCommentId}
                            handleCommentReaction={handlers.likeCommentToggle}
                            postComments={handlers.commentsByPost}
                            emojiList={undefined}
                            togglePostMenu={(key: string) => handlers.setOpenMenuId(handlers.openMenuId === key ? null : key)}
                            toggleRepostMenu={(i: number) => setOpenRepostIndex(openRepostIndex === i ? null : i)}
                            onOpenWithPerspectiveModal={openRepostWithPerspectiveModal}
                            handleRepostInstant={handleRepostInstant}
                            handleRepost={handleRepostInstant}
                            postCommentCounts={undefined}
                            fetchCommentsByPost={handlers.fetchCommentsByPost}
                          />
                        </div>



                      );
                    })}
                  </div>
                </div>
                {hasMorePosts ? (
                  <div className="relative z-30 mt-6 w-full">
                    <ShowAllButton label={'Show All Posts (' + (filteredPosts.length + userReposts.length) + ')'} />
                  </div>
                ) : null}
              </>
            )
          ) : null}

          {activeTab === 'Comments' ? (
            <div className="space-y-6">
              {isLoadingUserComments ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4a3728]" />
                </div>
              ) : userComments.length === 0 ? (
                <EmptyState label="Comments you've made will appear here." />
              ) : (
                <div className="space-y-4">
                  {userComments.slice(0, visibleCommentsCount).map((comment: any, commentIdx: number) => (
                    <div key={comment.commentId || commentIdx} className="bg-white hover:bg-neutral-50/50 transition-colors p-6 rounded-2xl border border-[#e0d8cf]/40 shadow-sm flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={profileImage || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdYRNQDghH1JvFXro2Yz3iWNmmFAubFZ-RGQ&s'}
                          alt={fullName}
                          className="w-10 h-10 rounded-xl object-cover border border-[#4a3728]/20"
                        />
                        <div>
                          <h4 className="font-bold text-[#4a3728]">{fullName}</h4>
                          <p className="text-xs text-[#4a3728]/60">{formatRelativeTime(comment.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-[#4a3728] pl-1">{comment.content}</div>
                      <div className="flex items-center gap-4 text-xs text-[#4a3728]/50 pl-1 mt-1 border-t border-[#4a3728]/10 pt-2">
                        <span className="flex items-center gap-1">
                          <i className="ri-heart-line text-sm"></i>
                          {comment.likesCount || 0} likes
                        </span>
                      </div>
                    </div>
                  ))}

                  {userComments.length > visibleCommentsCount ? (
                    <button
                      onClick={() => setVisibleCommentsCount((prev) => prev + 3)}
                      className="w-full mt-6 group bg-gradient-to-r from-[#4a3728]/10 via-[#4a3728]/5 to-[#e0d8cf]/20 hover:from-[#4a3728]/20 hover:via-[#4a3728]/15 hover:to-[#e0d8cf]/30 border-2 border-dashed border-[#4a3728]/30 hover:border-[#4a3728]/50 rounded-2xl p-4 transition-all duration-300 flex items-center justify-center gap-2 relative z-30 text-[#4a3728] font-bold text-sm"
                    >
                      <span>Show More</span>
                      <svg className="w-4 h-4 text-[#4a3728] group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}

          {activeTab === 'Videos' ? (
            <div className="space-y-6">
              {allVideos.length === 0 ? (
                <EmptyState label="No videos uploaded yet." />
              ) : (
                <>
                  {allVideos.slice(0, 2).map(({ post, video }, idx) => (
                    <VideoCard key={(post.entryId || post.postId) + '-' + idx} post={post} video={video} />
                  ))}
                  {allVideos.length > 2 ? <ShowAllButton label={'Show All Videos (' + allVideos.length + ')'} /> : null}
                </>
              )}
            </div>
          ) : null}

          {activeTab === 'Images' ? (
            <div className="space-y-5">
              {allImages.length === 0 ? (
                <EmptyState label="No images uploaded yet." />
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {allImages.slice(0, visibleImagesCount).map(({ post, img }, idx) => (
                      <ImageCard key={(post.entryId || post.postId) + '-' + idx} post={post} img={img} />
                    ))}
                  </div>
                  {allImages.length > visibleImagesCount ? (
                    <button
                      onClick={() => setVisibleImagesCount((prev) => prev + 3)}
                      className="w-full mt-6 group bg-gradient-to-r from-[#4a3728]/10 via-[#4a3728]/5 to-[#e0d8cf]/20 hover:from-[#4a3728]/20 hover:via-[#4a3728]/15 hover:to-[#e0d8cf]/30 border-2 border-dashed border-[#4a3728]/30 hover:border-[#4a3728]/50 rounded-2xl p-4 transition-all duration-300 flex items-center justify-center gap-2 relative z-30 text-[#4a3728] font-bold text-sm"
                    >
                      <span>Show all images</span>
                      <svg className="w-4 h-4 text-[#4a3728] group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  ) : null}
                </>
              )}
            </div>
          ) : null}

          {activeTab === 'Documents' ? (
            <div className="space-y-5">
              {allDocuments.length === 0 ? (
                <EmptyState label="No documents uploaded yet." />
              ) : (
                <>
                  {allDocuments.slice(0, 3).map(({ post, doc }, idx) => (
                    <DocumentCard key={(post.entryId || post.postId) + '-' + idx} post={post} doc={doc} />
                  ))}
                  {allDocuments.length > 3 ? <ShowAllButton label={'Show All Documents (' + allDocuments.length + ')'} /> : null}
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <ShowAllActivityModal
        isOpen={showAllModal}
        onClose={() => setShowAllModal(false)}
        activeSection={activeTab}
        posts={posts}
        userReposts={userReposts}
        profileImage={profileImage}
        fullName={fullName}
        currentUserId={currentUserId}
        postLikes={handlers.postLikes}
        onLikeToggle={handlers.handleLikeToggle}
      />

      {isOwnProfile ? (
        <UpdatePostModal
          postId={(posts[handlers.updatePostId || 0] && (posts[handlers.updatePostId || 0].entryId || posts[handlers.updatePostId || 0].postId)) || ''}
          isOpen={handlers.showUpdateModal}
          onClose={() => {
            handlers.setShowUpdateModal(false);
            handlers.setUpdatePostId(null);
          }}
          currentTitle={handlers.updatePostTitle}
          onUpdate={handlers.handleUpdatePost}
        />
      ) : null}

      {isOwnProfile ? (
        <CreatePostModal
          isOpen={showCreatePostModal}
          onClose={() => setShowCreatePostModal(false)}
          onSubmit={async () => {
            setShowCreatePostModal(false);
            if (onPostCreated) onPostCreated();
          }}
        />
      ) : null}

      <RepostWithPerspectiveModal
        isOpen={isRepostWithPerspectiveOpen}
        onClose={() => {
          setIsRepostWithPerspectiveOpen(false);
          setSelectedRepostPost(null);
        }}
        post={selectedRepostPost}
        onRepost={handleConfirmRepost}
        isDarkMode={false}
      />

      {reportingPostId ? (
        <ReportPostModal
          postId={reportingPostId}
          onClose={() => setReportingPostId(null)}
          onSubmit={async (reason: string) => {
            setReportSubmitting(true);
            try {
              await ReportService.reportPost(reportingPostId, reason);
              setActionToast({ message: 'Post reported. Thank you for helping keep our community safe.' }); // ✅ replaced alert

              } catch (err: any) {
             setActionToast({ message: 'Report received. Our team will review it shortly.' }); // ✅ replaced alert

            } finally {
              setReportSubmitting(false);
              setReportingPostId(null);
            }
          }}
          isSubmitting={reportSubmitting}
        />
      ) : null}

{selectedAnalyticsPost ? (
        <div onClick={() => setSelectedAnalyticsPost(null)} className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div onClick={(e) => e.stopPropagation()} className="bg-[#f6ede8] w-full max-w-md rounded-3xl p-8 shadow-2xl border border-[#e0d8cf] relative text-[#4a3728]">
            <button onClick={() => setSelectedAnalyticsPost(null)} className="absolute top-4 right-4 p-2.5 rounded-full hover:bg-[#e0d8cf]/50 transition-colors text-[#4a3728]/70">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-[#4a3728] text-[#f6ede8] rounded-xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-xl font-black text-[#4a3728]">Post Analytics</h2>
            </div>

            <div className="mb-6 bg-white/60 border border-[#e0d8cf]/60 rounded-2xl p-4">
              <p className="text-xs font-bold text-[#4a3728]/50 uppercase tracking-wider mb-1">Post Caption</p>
              <p className="text-sm font-semibold text-[#4a3728] line-clamp-2 italic">
                {selectedAnalyticsPost.content || selectedAnalyticsPost.text || 'No text content'}
              </p>
            </div>

            {isLoadingAnalytics ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4a3728]" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-white/60 border border-[#e0d8cf]/60 rounded-2xl flex flex-col justify-between">
                    <span className="text-xs font-bold text-[#4a3728]/60 flex items-center gap-1.5 mb-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Impressions
                    </span>
                    <span className="text-3xl font-black tracking-tight text-[#4a3728]">
                      {analyticsData?.impressions ?? 0}
                    </span>
                  </div>

                  <div className="p-4 bg-white/60 border border-[#e0d8cf]/60 rounded-2xl flex flex-col justify-between">
                    <span className="text-xs font-bold text-[#4a3728]/60 flex items-center gap-1.5 mb-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      Likes
                    </span>
                    <span className="text-3xl font-black tracking-tight text-[#4a3728]">
                      {analyticsData?.likes ?? (selectedAnalyticsPost.likesCount || selectedAnalyticsPost.likes || 0)}
                    </span>
                  </div>

                  <div className="p-4 bg-white/60 border border-[#e0d8cf]/60 rounded-2xl flex flex-col justify-between">
                    <span className="text-xs font-bold text-[#4a3728]/60 flex items-center gap-1.5 mb-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Comments
                    </span>
                    <span className="text-3xl font-black tracking-tight text-[#4a3728]">
                      {analyticsData?.comments ?? (selectedAnalyticsPost.commentsCount || 0)}
                    </span>
                  </div>

                  <div className="p-4 bg-white/60 border border-[#e0d8cf]/60 rounded-2xl flex flex-col justify-between">
                    <span className="text-xs font-bold text-[#4a3728]/60 flex items-center gap-1.5 mb-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Engagement
                    </span>
                    <span className="text-3xl font-black tracking-tight text-[#4a3728]">
                      {engagementPercent}%
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-[#4a3728]/60">
                    <span>Engagement Level</span>
                    <span className="text-[#4a3728]">{Math.min(100, Math.round(engagementPercent))}%</span>
                  </div>
                  <div className="w-full h-3 bg-[#e0d8cf]/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#8b7355] to-[#4a3728] rounded-full transition-all duration-1000"
                      style={{ width: Math.min(100, Math.round(engagementPercent)) + '%' }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}





      {/* ✅ NEW: normal post ke liye embed preview modal — RepostCard wale se hubahu */}
      {showEmbedModal && embedPostId ? (() => {
        const embedPost = posts.find((p: any) => (p.entryId || p.postId) === embedPostId);
        if (!embedPost) return null;
        const embedPostKey = embedPost.entryId || embedPost.postId;
        return createPortal(
          <div onClick={() => setShowEmbedModal(false)} className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-[#e0d8cf] relative flex flex-col max-h-[85vh]">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h2 className="text-lg font-bold text-[#4a3728]">Embed this post</h2>
                <button onClick={() => setShowEmbedModal(false)} className="p-1.5 rounded-full hover:bg-[#e0d8cf]/50 text-[#4a3728]/60">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-[#4a3728]/60 mb-2 flex-shrink-0">Copy and paste embed code on your site</p>

              <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                <input
                  readOnly
                  value={'<iframe src="' + window.location.origin + '/post/' + embedPostKey + '/embed" width="504" height="600" frameborder="0"></iframe>'}
                  className="flex-1 px-3 py-2 rounded-lg border border-[#e0d8cf] text-xs text-[#4a3728]/70 bg-[#f6ede8]/50 truncate"
                />
                <button
                  onClick={async () => {
                    const embedCode = '<iframe src="' + window.location.origin + '/post/' + embedPostKey + '/embed" width="504" height="600" frameborder="0"></iframe>';
                    try {
                      await navigator.clipboard.writeText(embedCode);
                      setShowEmbedModal(false);
                      setActionToast({ message: 'Embed code copied to clipboard.' });
                    } catch (err) {
                      setActionToast({ message: 'Failed to copy embed code.' });
                    }
                  }}
                  className="px-4 py-2 bg-[#4a3728] text-white rounded-lg text-sm font-semibold hover:opacity-90 flex-shrink-0"
                >
                  Copy code
                </button>
              </div>

              <div className="flex items-center gap-6 mb-4 flex-shrink-0">
                <label className="flex items-center gap-2 text-sm text-[#4a3728] cursor-pointer">
                  <input type="radio" checked={!embedFullText} onChange={() => setEmbedFullText(false)} className="accent-[#4a3728]" />
                  Embed with less text
                </label>
                <label className="flex items-center gap-2 text-sm text-[#4a3728] cursor-pointer">
                  <input type="radio" checked={embedFullText} onChange={() => setEmbedFullText(true)} className="accent-[#4a3728]" />
                  Embed full post
                </label>
              </div>

              <div className="rounded-xl border border-[#e0d8cf] overflow-y-auto flex-1 min-h-0 bg-white p-4">
                <PostHeader
                  post={{
                    avatar: embedPost.avatar || profileImage,
                    user: embedPost.user || fullName,
                    role: embedPost.role || headline,
                    time: new Date(embedPost.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    userId: embedPost.userId,
                  }}
                  index={embedPostKey}
                  isDarkMode={false}
                  openMenuIndex={null}
                  togglePostMenu={() => {}}
                  handlePostAction={() => {}}
                  currentUserId={currentUserId || ''}
                  showMenu={false}
                />
                <PostContent
                  post={{
                    content: embedPost.content || embedPost.title || '',
                    image: embedPost.images?.[0]?.cloudinarySecureUrl || embedPost.image || '',
                    videos: embedPost.videos,
                    documents: embedPost.documents,
                  }}
                  isDarkMode={false}
                  forceExpanded={embedFullText}
                />
                <div className="flex items-center justify-between text-xs text-[#4a3728]/60 border-t border-[#e0d8cf] pt-3 mt-2">
                  <button type="button" onClick={() => setShowEmbedLikesModal(true)} className="hover:underline hover:text-[#4a3728] font-medium">
                    {embedPost.likesCount || embedPost.likes || 0} likes
                  </button>
                  <span className="mx-1">·</span>
                  <button
                    type="button"
                    onClick={async () => {
                      const next = !showEmbedComments;
                      setShowEmbedComments(next);
                      if (next && embedPostKey && !handlers.commentsByPost[embedPostKey]) {
                        await handlers.fetchCommentsByPost(embedPostKey, embedPost.userId);
                      }
                    }}
                    className="hover:underline hover:text-[#4a3728] font-medium"
                  >
                    {embedPost.commentsCount || 0} comments
                  </button>
                </div>

                {showEmbedComments && embedPostKey ? (
                  <div className="mt-3 border-t border-[#e0d8cf] pt-3">
                    <CommentsSection
                  postId={embedPostKey}
                  comments={handlers.commentsByPost[embedPostKey] || []}
                  isLoading={!!handlers.isLoadingComments[embedPostKey]}
                  commentCount={embedPost.commentsCount || 0}
                      profileImage={profileImage}
                      openCommentMenuIndex={handlers.openCommentMenuIndex}
                      toggleCommentMenu={handlers.toggleCommentMenu}
                      handleCommentAction={handlers.handleCommentAction}
                      editingCommentId={handlers.editingCommentId}
                      editCommentText={handlers.editCommentText}
                      setEditCommentText={handlers.setEditCommentText}
                      commentText={handlers.commentText}
                      setCommentText={handlers.setCommentText}
                      handleCommentSubmit={() => handlers.handleCommentSubmit(embedPostKey)}
                      handleReply={handlers.setReplyingToCommentId}
                      handleCommentReaction={handlers.likeCommentToggle}
                      replyingTo={handlers.replyingTo}
                      setReplyingTo={handlers.setReplyingTo}
                      showEmojiPicker={handlers.showEmojiPicker}
                      setShowEmojiPicker={handlers.setShowEmojiPicker}
                      handleEmojiClick={handlers.handleEmojiClick}
                      currentUserId={currentUserId || ''}
                      isDarkMode={false}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>,
          document.body
        );
      })() : null}

      {showEmbedLikesModal && embedPostId ? (
        <ReactionsModal
          postId={embedPostId}
          isOpen={showEmbedLikesModal}
          onClose={() => setShowEmbedLikesModal(false)}
          isDarkMode={false}
        />
      ) : null}

      {undoToast ? (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[2000] bg-[#4a3728] text-[#f6ede8] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-fade-in">
          <span className="text-sm font-medium">{undoToast.message}</span>
          <button onClick={handleUndoAction} className="text-sm font-bold underline hover:text-white transition-colors">Undo</button>
          <button onClick={() => setUndoToast(null)} className="text-[#f6ede8]/60 hover:text-[#f6ede8] ml-1">x</button>
        </div>
      ) : null}

<DeleteConfirmModal
        isOpen={!!deleteConfirmPostId}
        onCancel={() => setDeleteConfirmPostId(null)}
        onConfirm={confirmDeletePost}
        isDeleting={isDeletingConfirmed}
        message="Are you sure you want to delete this post permanently?"
      />

{actionToast ? (
        <div className="fixed bottom-6 left-6 z-[3000] bg-white rounded-xl shadow-2xl border border-[#e0d8cf] px-4 py-3 flex items-center gap-3">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm text-[#4a3728] font-medium">
            {actionToast.message}{' '}
            {actionToast.linkText && (
              <button onClick={actionToast.onLinkClick} className="underline font-semibold">{actionToast.linkText}</button>
            )}
          </span>
          <button onClick={() => setActionToast(null)} className="text-[#4a3728]/40 hover:text-[#4a3728] ml-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : null}
    </>
  );
};

export default ActivitySection;