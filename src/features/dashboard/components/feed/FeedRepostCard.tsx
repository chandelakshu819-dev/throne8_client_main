// src/features/deshboard/components/feed/FeedRepostCard.tsx
'use client';
import React from 'react';
import PostActions from './PostActions';
import CommentsSection from './CommentsSection';
import { ReactionType } from '@/types/profile.types';

interface FeedRepostCardProps {
    repostItem: any;
    isDarkMode: boolean;
    profileImage: string;
    fullName: string;
    currentUserId?: string;

    // ✅ FIX (Bug 1): actual reposter ka naam/avatar — repostItem se aata hai,
    // current viewer ke fullName/profileImage se kabhi confuse nahi hona chahiye.
    reposterName?: string;
    reposterAvatar?: string | null;

    likedPosts?: any;
    handleLike?: (postKey: string) => void;
    toggleComments?: (postKey: string) => void;

    // comment wiring — same prop shapes PostCard already receives
    openCommentsIndex?: any;
    postComments?: any;
    commentText?: any;
    setCommentText?: any;
    replyingTo?: any;
    setReplyingTo?: any;
    openCommentMenuIndex?: any;
    editingCommentId?: any;
    editCommentText?: any;
    setEditCommentText?: any;
    showEmojiPicker?: any;
    setShowEmojiPicker?: any;
    handleReply?: any;
    handleCommentReaction?: any;
    toggleCommentMenu?: any;
    handleCommentAction?: any;
    handleEditSubmit?: any;
    handleEmojiClick?: any;
    handleCommentSubmit?: any;
    emojiList?: any;
    postCommentCounts?: any;

    // reaction system wiring (emoji likes), same as PostCard
    postReactions?: Record<string, { counts: any; userReaction: ReactionType | null }>;
    onReact?: (postId: string, type: ReactionType) => void;
}

const FeedRepostCard = ({
    repostItem,
    isDarkMode,
    profileImage,
    fullName,
    currentUserId,
    reposterName,
    reposterAvatar,
    likedPosts,
    handleLike,
    toggleComments,
    openCommentsIndex,
    postComments,
    commentText,
    setCommentText,
    replyingTo,
    setReplyingTo,
    openCommentMenuIndex,
    editingCommentId,
    editCommentText,
    setEditCommentText,
    showEmojiPicker,
    setShowEmojiPicker,
    handleReply,
    handleCommentReaction,
    toggleCommentMenu,
    handleCommentAction,
    handleEditSubmit,
    handleEmojiClick,
    handleCommentSubmit,
    emojiList,
    postCommentCounts,
    postReactions,
    onReact,
}: FeedRepostCardProps) => {
    const originalPost = repostItem.originalPost;
    if (!originalPost) return null;

    // ✅ Always key off the ORIGINAL post's id — likes/comments/reactions
    // belong to the original post, not to the repost wrapper.
    const postKey = originalPost.entryId;

    // ✅ FIX (Bug 1): reposter ka display name ab repostItem se resolve
    // hota hai. currentUserId se match kare toh "You reposted" dikhao,
    // warna reposter ka actual naam. Sirf tab fullName/profileImage pe
    // fallback karo jab repostItem mein reposter data hi na aaya ho
    // (defensive — normally yeh case nahi aana chahiye).
    const isOwnRepost = repostItem.userId && currentUserId && repostItem.userId === currentUserId;
    const displayName = isOwnRepost ? 'You' : (reposterName || repostItem.reposterName || fullName || 'Someone');
    const displayAvatar = isOwnRepost ? profileImage : (reposterAvatar ?? repostItem.reposterAvatar ?? profileImage);

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    // PostActions expects a "post"-shaped object. Like/comment/share
    // apply against the original post's id, not the repost's id.
    const syntheticPost = {
        entryId: originalPost.entryId,
        likesCount: originalPost.likesCount || 0,
        commentsCount: postCommentCounts?.[postKey] ?? originalPost.commentsCount ?? 0,
        isLikedByCurrentUser: originalPost.isLikedByCurrentUser || false,
        shares: originalPost.shares || 0,
    };

    return (
        <div
            className={`p-8 rounded-3xl shadow-2xl backdrop-blur-xl border transition-all duration-500 hover:scale-[1.01] hover:-translate-y-0.5 ${isDarkMode
                ? 'bg-slate-800/60 border-slate-700/50'
                : 'bg-[#f6ede8]/95 border-[#4a3728]/20'
                } relative overflow-hidden`}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-[#6b5643]/3 via-[#8b7355]/3 to-[#4a3728]/3" />

            <div className="relative z-10">
                {/* ── Repost Header (actual reposter, not current viewer) ── */}
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#4a3728]/10">
                    <i className="ri-repeat-line text-lg text-[#6b5643]" />
                    <div className="w-6 h-6 rounded-full overflow-hidden border border-[#4a3728]/20 flex-shrink-0">
                        {displayAvatar ? (
                            <img
                                src={displayAvatar}
                                alt={displayName}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-[#4a3728]/20 flex items-center justify-center">
                                <span className="text-xs text-[#4a3728] font-bold">
                                    {displayName?.charAt(0)}
                                </span>
                            </div>
                        )}
                    </div>
                    <span
                        className={`text-sm font-semibold ${isDarkMode ? 'text-slate-300' : 'text-[#4a3728]/70'
                            }`}
                    >
                        {displayName} reposted
                        {repostItem.repostType === 'quote' && ' with thoughts'}
                    </span>
                    <span
                        className={`text-xs ml-auto ${isDarkMode ? 'text-slate-500' : 'text-[#4a3728]/40'
                            }`}
                    >
                        {timeAgo(repostItem.createdAt)}
                    </span>
                </div>

                {/* ── Quote Thought (agar quote repost hai) ── */}
                {repostItem.repostType === 'quote' && repostItem.thoughtText && (
                    <p
                        className={`text-sm italic mb-4 pl-3 border-l-2 border-[#6b5643]/40 ${isDarkMode ? 'text-slate-300' : 'text-[#4a3728]/80'
                            }`}
                    >
                        &ldquo;{repostItem.thoughtText}&rdquo;
                    </p>
                )}

                {/* ── Original Post Content (border ke saath) ── */}
                <div
                    className={`rounded-2xl border p-5 ${isDarkMode
                        ? 'bg-slate-700/40 border-slate-600/50'
                        : 'bg-white/60 border-[#4a3728]/15'
                        }`}
                >
                    {/* Original Post Author */}
                    <div className="flex items-center gap-3 mb-3">
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${isDarkMode
                                ? 'bg-slate-600 border-slate-500'
                                : 'bg-[#e0d8cf] border-[#4a3728]/10'
                                }`}
                        >
                            {originalPost.userAvatar ? (
                                <img
                                    src={originalPost.userAvatar}
                                    alt="Author"
                                    className="w-full h-full object-cover rounded-full"
                                />
                            ) : (
                                <i className="ri-user-line text-[#4a3728]/50 text-lg" />
                            )}
                        </div>
                        <div>
                            <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>
                                {originalPost.userName || originalPost.fullName || 'Unknown User'}
                            </p>
                            <p
                                className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/50'
                                    }`}
                            >
                                {timeAgo(originalPost.createdAt)}
                            </p>
                        </div>
                    </div>

                    {/* Original Post Title */}
                    <h3
                        className={`text-base font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-[#4a3728]'
                            }`}
                    >
                        {originalPost.title}
                    </h3>

                    {/* Original Post Content */}
                    {originalPost.content && (
                        <p
                            className={`text-sm leading-relaxed mb-3 line-clamp-3 ${isDarkMode ? 'text-slate-300' : 'text-[#4a3728]/70'
                                }`}
                        >
                            {originalPost.content}
                        </p>
                    )}

                    {/* Original Post Image */}
                    {originalPost.images?.length > 0 && (
                        <img
                            src={originalPost.images[0].cloudinarySecureUrl}
                            alt={originalPost.title}
                            className="w-full h-48 object-cover rounded-xl mt-2"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    )}

                    {/* Real, clickable actions — reactions + comments +
                        share, wired against the original post's id. */}
                    <div className={`mt-4 pt-3 border-t ${isDarkMode ? 'border-slate-600/50' : 'border-[#4a3728]/10'}`}>
                        <PostActions
                            post={syntheticPost}
                            index={postKey}
                            isDarkMode={isDarkMode}
                            likedPosts={likedPosts}
                            handleLike={handleLike}
                            toggleComments={toggleComments}
                            openRepostIndex={null}
                            toggleRepostMenu={() => {}}
                            handleRepost={() => {}}
                            postReactions={postReactions}
                            onReact={onReact}
                        />
                    </div>

                    {/* ✅ FIX (Bug 2): ab FeedContainer se comment props
                        properly aate hain, isliye yeh block render hoga
                        jab user "Comment" pe click karega. */}
                    {openCommentsIndex === postKey && (
                        <div className="mt-2">
                            <CommentsSection
                                isDarkMode={isDarkMode}
                                commentText={commentText}
                                setCommentText={setCommentText}
                                replyingTo={replyingTo}
                                setReplyingTo={setReplyingTo}
                                openCommentMenuIndex={openCommentMenuIndex}
                                editingCommentId={editingCommentId}
                                editCommentText={editCommentText}
                                setEditCommentText={setEditCommentText}
                                showEmojiPicker={showEmojiPicker}
                                setShowEmojiPicker={setShowEmojiPicker}
                                commentCount={postCommentCounts?.[postKey] ?? originalPost.commentsCount ?? 0}
                                handleReply={handleReply}
                                handleCommentReaction={handleCommentReaction}
                                toggleCommentMenu={toggleCommentMenu}
                                handleCommentAction={handleCommentAction}
                                handleEditSubmit={handleEditSubmit}
                                handleEmojiClick={handleEmojiClick}
                                postId={postKey}
                                comments={postComments?.[postKey] || []}
                                handleCommentSubmit={() => handleCommentSubmit?.(postKey)}
                                emojiList={emojiList}
                                profileImage={profileImage}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeedRepostCard;