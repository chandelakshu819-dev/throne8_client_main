// src/features/profile/components/PostCard.tsx

'use client';
import React from 'react';
import { Post, PostLikeState } from '../../types';
import PostMenuPopup from '../home/PostMenuPopup';
import { EMOJI_LIST, formatPostTime } from '../../constants';

interface PostCardProps {
    post: Post;
    idx: number;
    profileImage: string;
    fullName: string;
    headline: string;
    postLikes: PostLikeState;

    // Menu
    openMenuId: number | null;
    setOpenMenuId: (id: number | null) => void;

    // Handlers
    onLikeToggle: (postId: string) => void;
    onPinPost: (postId: string, currentPinState: boolean) => void;
    onSavePost: (postId: string, currentSaveState: boolean) => void;
    onDeletePost: (postId: string) => void;
    onArchivePost: (postId: string) => void;
    onOpenUpdateModal: (idx: number, title: string) => void;

    // Comments
    openCommentsIndex: number | null;
    onToggleComments: (idx: number, postId: string) => void;
    commentsByPost: Record<string, any[]>;
    isLoadingComments: Record<string, boolean>;
    isSubmittingComment: boolean;
    commentLikes: Record<string, { count: number; isLiked: boolean }>;
    formatCommentTime: (time: string) => string;
    openCommentMenuIndex: string | null;
    toggleCommentMenu: (id: string) => void;
    handleCommentAction: (action: string, commentId: string, text?: string) => void;
    editingCommentId: string | null;
    editCommentText: string;
    setEditCommentText: (t: string) => void;
    handleEditSubmit: (commentId: string) => void;
    isDeletingCommentId: string | null;
    replyingToCommentId: string | null;
    setReplyingToCommentId: (id: string | null) => void;
    replyText: string;
    setReplyText: (t: string) => void;
    handleReplySubmit: (postId: string, commentId: string) => void;
    likeCommentToggle: (commentId: string) => void;
    commentText: string;
    setCommentText: (t: string) => void;
    handleCommentSubmit: (postId: string) => void;
    replyingTo: string | null;
    setReplyingTo: (id: string | null) => void;
    showEmojiPicker: boolean;
    setShowEmojiPicker: (v: boolean) => void;
    handleEmojiClick: (emoji: string) => void;
}

// PostCard.tsx ke top mein, PostCard component se pehle add karo
const PostDocumentCard = ({ doc }: { doc: any }) => {
    const [showPreview, setShowPreview] = React.useState(false);
    const fileSizeKB = doc.fileSize ? (doc.fileSize / 1024).toFixed(0) : '—';
    const previewUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(doc.cloudinarySecureUrl)}&embedded=true`;

    return (
        <div className="bg-[#e0d8cf]/40 rounded-2xl p-4 border border-[#e0d8cf]/60">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#4a3728] to-[#7a5c3e] rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <svg className="w-6 h-6 text-[#f6ede8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#4a3728] truncate text-sm uppercase">{doc.originalName}</p>
                    {/* <p className="text-xs text-[#4a3728]/50 mt-0.5">{fileSizeKB} KB · {doc.format?.toUpperCase()}</p> */}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                    <button
                        onClick={() => setShowPreview(v => !v)}
                        className="px-3 py-1.5 bg-[#4a3728] text-[#f6ede8] rounded-lg text-xs font-semibold hover:opacity-80 transition-opacity"
                    >
                        {showPreview ? 'Hide' : 'View'}
                    </button>
                    <a
                        href={doc.cloudinarySecureUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 border border-[#4a3728]/30 text-[#4a3728] rounded-lg text-xs font-semibold hover:bg-[#4a3728]/10 transition-colors"
                    >
                        Download
                    </a>
                </div>
            </div>
            {showPreview && (
                <div className="mt-3 rounded-xl overflow-hidden border border-[#e0d8cf]">
                    <iframe
                        src={previewUrl}
                        className="w-full h-[700px] bg-white"
                        title={doc.originalName}
                    />
                </div>
            )}
        </div>
    );
};

const PostCard: React.FC<PostCardProps> = ({
    post, idx, profileImage, fullName, headline, postLikes,
    openMenuId, setOpenMenuId,
    onLikeToggle, onPinPost, onSavePost, onDeletePost, onArchivePost, onOpenUpdateModal,
    openCommentsIndex, onToggleComments,
    commentsByPost, isLoadingComments, isSubmittingComment, commentLikes,
    formatCommentTime, openCommentMenuIndex, toggleCommentMenu, handleCommentAction,
    editingCommentId, editCommentText, setEditCommentText, handleEditSubmit,
    isDeletingCommentId, replyingToCommentId, setReplyingToCommentId,
    replyText, setReplyText, handleReplySubmit, likeCommentToggle,
    commentText, setCommentText, handleCommentSubmit,
    replyingTo, setReplyingTo, showEmojiPicker, setShowEmojiPicker, handleEmojiClick,
}) => {
    const isCommentsOpen = openCommentsIndex === idx;

    const postKey = post.entryId || post.postId;

    return (
        <div className="group bg-gradient-to-br from-[#e0d8cf]/60 via-[#e0d8cf]/40 to-[#f6ede8]/30 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-500 border border-[#e0d8cf]/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#4a3728]/5 to-transparent rounded-full blur-xl group-hover:scale-150 transition-transform duration-700" />

            {/* ── Header ── */}
            <div className="flex items-center gap-4 mb-4 relative z-9">
                <div className="w-12 h-12 rounded-2xl overflow-hidden border-3 border-[#e0d8cf] shadow-lg">
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <p className="text-base font-bold text-[#4a3728]">{fullName}</p>
                        <svg className="w-5 h-5 text-[#4a3728]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {post.degreeLabel && (
                            <span className="text-sm text-[#4a3728]/50 font-medium">
                                · {post.degreeLabel}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-[#4a3728]/70 font-medium">
                        {headline.split(' ').slice(0, 4).join(' ')}{headline.split(' ').length > 4 ? '...' : ''}
                    </p>
                    <p className="text-xs text-[#4a3728]/50 mt-1">
                        {post.time || formatPostTime(post.createdAt || '')}
                    </p>
                </div>

                {/* 3-dot menu */}
                <button
                    onClick={(e) => {
                        const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                        document.documentElement.style.setProperty('--button-top', `${rect.top}px`);
                        document.documentElement.style.setProperty('--button-left', `${rect.left}px`);
                        setOpenMenuId(openMenuId === idx ? null : idx);
                    }}
                    className="p-2 text-[#4a3728]/60 hover:text-[#4a3728] hover:bg-[#e0d8cf]/30 rounded-xl transition-all duration-200"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                </button>
                {openMenuId === idx && (
                    <PostMenuPopup
                        postId={post.entryId || post.postId}
                        currentPinState={post.isPinned || false}
                        currentSaveState={post.isSaved || false}
                        isOpen={true}
                        onClose={() => setOpenMenuId(null)}
                        onPin={onPinPost}
                        onSave={onSavePost}
                        onUpdate={() => {
                            onOpenUpdateModal(idx, post.title || post.text);
                            setOpenMenuId(null);
                        }}
                        onDelete={onDeletePost}
                        onArchive={onArchivePost}
                    />
                )}
            </div>

            {/* ── Content ── */}
            <div className="relative z-10">
            {(post.title || post.text) && (
    <div className="text-[#4a3728] mb-4 text-base leading-relaxed">
        {post.title && (
            <p className="font-semibold">{post.title}</p>
        )}
        {post.text && (
            <p dangerouslySetInnerHTML={{ __html: post.text }} />
        )}
    </div>
)}
                {/* Images */}
                {post.images && post.images.length > 0 && (
                    <div className={`grid gap-2 mb-4 ${post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {post.images.map((img: any, i: number) => (
                            <img
                                key={i}
                                src={img.cloudinarySecureUrl}
                                alt={`Post image ${i + 1}`}
                                className="w-full h-72 object-cover rounded-2xl shadow-lg"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                        'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop';
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Videos */}
                {post.videos && post.videos.length > 0 && (
                    <div className="space-y-3 mb-4">
                        {post.videos.map((video: any, i: number) => {
                            const duration = video.duration
                                ? `${Math.floor(video.duration / 60)}:${String(Math.floor(video.duration % 60)).padStart(2, '0')}`
                                : '';
                            return (
                                <div key={i} className="relative rounded-2xl overflow-hidden shadow-lg">
                                    <video
                                        controls
                                        className="w-full h-72 bg-black object-cover"
                                        src={video.cloudinarySecureUrl}
                                        preload="metadata"
                                    />
                                    {duration && (
                                        <div className="absolute bottom-3 right-3 bg-black/70 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                                            {duration}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Documents */}
                {post.documents && post.documents.length > 0 && (
                    <div className="space-y-3 mb-4">
                        {post.documents.map((doc: any, i: number) => (
                            <PostDocumentCard key={i} doc={doc} />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Actions Bar ── */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#e0d8cf]/30 relative z-10">
                <div className="flex gap-6">
                    {/* Like */}
                    <button
                        onClick={() => onLikeToggle(post.entryId || post.postId)}
                        className={`group/btn flex items-center gap-2 transition-all duration-200 ${postLikes[postKey]?.isLiked ? 'text-red-500' : 'text-[#4a3728]/70 hover:text-red-500'}`}
                    >
                        <div className="p-2 rounded-xl group-hover/btn:bg-red-50 transition-colors duration-200">
                            <svg
                                className="w-5 h-5"
                                fill={postLikes[postKey]?.isLiked ? '#ef4444' : 'none'}  // ← red-500 hex
                                stroke={postLikes[postKey]?.isLiked ? '#ef4444' : 'currentColor'}  // ← stroke bhi red
                                viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </div>
                        <span className="text-sm font-semibold">
                            {postLikes[postKey]?.count || post.likesCount || 0}
                        </span>
                    </button>

                    {/* Comment */}
                    <button
                        onClick={() => onToggleComments(idx, post.entryId || post.postId)}
                        className="group/btn flex items-center gap-2 text-[#4a3728]/70 hover:text-blue-500 transition-all duration-200"
                    >
                        <div className="p-2 rounded-xl group-hover/btn:bg-blue-50 transition-colors duration-200">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <span className="text-sm font-semibold">{post.comments}</span>
                    </button>

                  {/* Repost */}
                    <button className="group/btn flex items-center gap-2 text-[#4a3728]/70 hover:text-green-500 transition-all duration-200">
                        <div className="p-2 rounded-xl group-hover/btn:bg-green-50 transition-colors duration-200">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </div>
                        <span className="text-sm font-semibold">{post.repostsCount || 0}</span>
                    </button>
                </div>

                {/* Share / Send */}
                <button className="group/btn flex items-center gap-2 text-[#4a3728]/70 hover:text-[#4a3728] transition-all duration-200">
                    <div className="p-2 rounded-xl group-hover/btn:bg-[#e0d8cf]/30 transition-colors duration-200">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                    </div>
                    {(post.sendsCount || 0) > 0 && (
                        <span className="text-sm font-semibold">{post.sendsCount}</span>
                    )}
                </button>
            </div>

            {/* ── Comments Panel ── */}
            {isCommentsOpen && (
                <div className="mt-6 pt-6 border-t border-[#4a3728]/20">
                    <div className="space-y-4 mb-6">
                        {isLoadingComments[post.entryId || post.postId] ? (

                            <div className="flex justify-center py-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4a3728]" />
                            </div>
                        ) : (commentsByPost[postKey] || []).length === 0 ? (
                            <p className="text-center text-[#4a3728]/50 text-sm py-4">No comments yet. Be the first!</p>
                        ) : (
                            (commentsByPost[postKey] || []).map((comment) => (
                                <div key={comment.commentId} className="p-4 rounded-2xl bg-[#e0d8cf]/30">
                                    <div className="flex items-start gap-3 mb-3">
                                        <img src={comment.user?.avatar} alt={comment.user?.name} className="w-10 h-10 rounded-xl object-cover border-2 border-[#6b5643] flex-shrink-0" />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-sm text-[#4a3728]">{comment.user?.name}</p>
                                                    <span className="text-xs text-[#4a3728]/50">{formatCommentTime(comment.createdAt)}</span>
                                                </div>
                                                <div className="relative">
                                                    <button onClick={() => toggleCommentMenu(comment.commentId)} className="p-1 rounded-lg hover:bg-[#e0d8cf]">
                                                        <span className="text-lg leading-none">⋯</span>
                                                    </button>
                                                    {openCommentMenuIndex === comment.commentId && (
                                                        <div className="absolute right-0 top-8 w-44 rounded-xl shadow-2xl border z-50 bg-white border-[#4a3728]/20 overflow-hidden">
                                                            <button onClick={() => handleCommentAction('edit', comment.commentId, comment.content)} className="w-full px-4 py-2.5 text-left text-sm hover:bg-[#e0d8cf]/50 text-[#4a3728] flex items-center gap-2">
                                                                ✏️ <span>Edit</span>
                                                            </button>
                                                            <button onClick={() => handleCommentAction('delete', comment.commentId)} disabled={isDeletingCommentId === comment.commentId} className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-50 text-red-500 flex items-center gap-2">
                                                                🗑️ <span>{isDeletingCommentId === comment.commentId ? 'Deleting...' : 'Delete'}</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {editingCommentId === comment.commentId ? (
                                                <div className="mb-2">
                                                    <input
                                                        type="text"
                                                        value={editCommentText}
                                                        onChange={(e) => setEditCommentText(e.target.value)}
                                                        className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#6b5643] bg-white border-[#4a3728]/30 text-[#4a3728]"
                                                        onKeyPress={(e) => { if (e.key === 'Enter') handleEditSubmit(comment.commentId); }}
                                                    />
                                                    <div className="flex gap-2 mt-2">
                                                        <button onClick={() => handleEditSubmit(comment.commentId)} className="px-3 py-1 bg-[#6b5643] text-white rounded-lg text-xs font-semibold">Save</button>
                                                        <button onClick={() => { setEditCommentText(''); }} className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#e0d8cf] text-[#4a3728]">Cancel</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-[#4a3728]/80 mb-2">{comment.content}</p>
                                            )}

                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={() => likeCommentToggle(comment.commentId)}
                                                    className={`flex items-center gap-1 text-xs font-semibold transition-colors ${commentLikes[comment.commentId]?.isLiked ? 'text-red-500' : 'text-[#4a3728]/60 hover:text-red-500'}`}
                                                >
                                                    <span>{commentLikes[comment.commentId]?.isLiked ? '❤️' : '🤍'}</span>
                                                    <span>{commentLikes[comment.commentId]?.count || 0}</span>
                                                </button>
                                                <button onClick={() => setReplyingToCommentId(replyingToCommentId === comment.commentId ? null : comment.commentId)} className="text-xs font-semibold text-[#4a3728]/60 hover:text-[#4a3728]">
                                                    💬 Reply {comment.replyCount ? `(${comment.replyCount})` : ''}
                                                </button>
                                            </div>

                                            {replyingToCommentId === comment.commentId && (
                                                <div className="mt-3 flex gap-2">
                                                    <img src={profileImage} alt="You" className="w-8 h-8 rounded-lg object-cover border border-[#6b5643] flex-shrink-0" />
                                                    <div className="flex-1 flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={replyText}
                                                            onChange={(e) => setReplyText(e.target.value)}
                                                            placeholder="Write a reply..."
                                                            className="flex-1 px-3 py-1.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#6b5643] bg-white border-[#4a3728]/30 text-[#4a3728]"
                                                            onKeyPress={(e) => {
                                                                if (e.key === 'Enter') handleReplySubmit(post.entryId || post.postId, comment.commentId)
                                                            }}
                                                        />
                                                        <button
                                                            onClick={() =>
                                                                handleReplySubmit(
                                                                    post.entryId ||
                                                                    post.postId, comment.commentId
                                                                )
                                                            }
                                                            disabled={isSubmittingComment}
                                                            className="px-3 py-1.5 bg-[#4a3728] text-white text-sm rounded-xl font-semibold disabled:opacity-50">
                                                            {isSubmittingComment ? '...' : 'Reply'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Comment Input */}
                    <div className="p-4 rounded-2xl bg-[#e0d8cf]/30">
                        <div className="flex gap-3">
                            <img src={profileImage} alt="Your avatar" className="w-10 h-10 rounded-xl object-cover border-2 border-[#6b5643]" />
                            <div className="flex-1">
                                {replyingTo && (
                                    <div className="mb-2 px-3 py-2 rounded-lg text-sm bg-white/50 text-[#4a3728]/70">
                                        Replying to comment...
                                        <button onClick={() => setReplyingTo(null)} className="ml-2 text-red-500">Cancel</button>
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder={replyingTo ? 'Write a reply...' : 'Write a comment...'}
                                        className="flex-1 px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#6b5643] bg-white border-[#4a3728]/30 text-[#4a3728] placeholder-[#4a3728]/60"
                                        onKeyPress={(e) => { if (e.key === 'Enter') handleCommentSubmit(post.entryId || post.postId); }}
                                    />
                                    <button
                                        onClick={() =>
                                            handleCommentSubmit(post.entryId || post.postId)
                                        }
                                        className="bg-gradient-to-r from-[#4a3728] to-[#6b5643] text-white px-6 py-2 rounded-xl font-semibold hover:shadow-lg transition-all">
                                        Post
                                    </button>
                                </div>

                                {/* Media Row */}
                                <div className="flex items-center gap-3 mt-3 relative">
                                    <button onClick={() => { }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:bg-[#e0d8cf] text-[#4a3728]/60 hover:text-[#4a3728]">
                                        <i className="ri-image-line text-lg" />
                                        <span className="text-sm font-medium">Photo</span>
                                    </button>
                                    <button onClick={() => { }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:bg-[#e0d8cf] text-[#4a3728]/60 hover:text-[#4a3728]">
                                        <i className="ri-file-gif-line text-lg" />
                                        <span className="text-sm font-medium">GIF</span>
                                    </button>
                                    <div className="relative">
                                        <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:bg-[#e0d8cf] text-[#4a3728]/60 hover:text-[#4a3728]">
                                            <i className="ri-emotion-line text-lg" />
                                            <span className="text-sm font-medium">Emoji</span>
                                        </button>
                                        {showEmojiPicker && (
                                            <div className="absolute bottom-full left-0 mb-2 w-72 p-3 rounded-2xl shadow-2xl border z-50 bg-white border-[#4a3728]/20">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="text-sm font-bold text-[#4a3728]">Pick an emoji</h4>
                                                    <button onClick={() => setShowEmojiPicker(false)} className="p-1 rounded-lg hover:bg-[#e0d8cf]">
                                                        <i className="ri-close-line" />
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto">
                                                    {EMOJI_LIST.map((emoji, i) => (
                                                        <button key={i} onClick={() => handleEmojiClick(emoji)} className="text-2xl p-2 rounded-lg transition-all hover:bg-[#e0d8cf]">
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Show/Hide Comments Button */}
            <button
                onClick={() => onToggleComments(idx, post.entryId || post.postId)}
                className={`mt-4 w-full px-4 py-2 rounded-xl font-semibold transition-all ${isCommentsOpen ? 'bg-[#4a3728] text-white' : 'bg-[#4a3728]/10 hover:bg-[#4a3728]/20 text-[#4a3728]'}`}
            >
                {isCommentsOpen ? 'Hide' : 'Show'} Comments ({post.commentsCount || commentsByPost[post.entryId || post.postId]?.length || 0})
            </button>
        </div>
    );
};

export default PostCard;