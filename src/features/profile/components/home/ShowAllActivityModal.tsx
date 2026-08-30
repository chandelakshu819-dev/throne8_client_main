'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import AuthService from '@/lib/api/auth.service';
import ProfileService from '@/lib/api/profile.service';

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface ShowAllActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    activeSection: string;
    posts: any[];
    userReposts?: any[];
    profileImage?: string;
    fullName?: string;
    currentUserId?: string;
    postLikes: { [key: string]: { count: number; isLiked: boolean } };
    onLikeToggle: (postId: string) => void;
}

// ✅ CHANGED: accepts postLikes + onLikeToggle so the like button is real,
// not a static count. Comment count stays static for now — see note below
// on what's needed to make it clickable too (same pattern as the fix here).
const ModalRepostCard = ({ repost, profileImage, fullName, currentUserId, postLikes, onLikeToggle }: {
    repost: any;
    profileImage: string;
    fullName: string;
    currentUserId: string;
    postLikes?: { [key: string]: { count: number; isLiked: boolean } };
    onLikeToggle?: (postId: string) => void;
}) => {
    const [originalAuthorName, setOriginalAuthorName] = useState<string>('');
    const [originalAuthorAvatar, setOriginalAuthorAvatar] = useState<string>('');

    const originalPost = repost.originalPost;
    // ✅ Like state always keyed off the ORIGINAL post's id.
    const postKey = originalPost?.entryId;

    useEffect(() => {
        if (!originalPost?.userId) return;
        
        if (originalPost.userId === currentUserId) {
            setOriginalAuthorName(fullName || 'You');
            setOriginalAuthorAvatar(profileImage || '');
            return;
        }

        const fetchAuthor = async () => {
            try {
                const response = await AuthService.getUserProfileById(originalPost.userId);
                const user = response?.data;
                if (user) {
                    setOriginalAuthorName(`${user.firstName} ${user.lastName || ''}`.trim());
                    if (user.profilePhotoId) {
                        const photoRes = await ProfileService.getProfilePhotoById(user.profilePhotoId);
                        setOriginalAuthorAvatar(photoRes?.data?.photo?.cloudinarySecureUrl || '');
                    }
                }
            } catch (err) {
                setOriginalAuthorName('Unknown User');
            }
        };
        fetchAuthor();
    }, [originalPost?.userId, currentUserId, fullName, profileImage]);

    if (!originalPost) return null;

    const isLiked = postLikes?.[postKey]?.isLiked ?? originalPost.isLikedByCurrentUser ?? false;
    const likeCount = postLikes?.[postKey]?.count ?? originalPost.likesCount ?? 0;

    return (
        <div className="p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-500 bg-[#f6ede8]/95 border border-[#4a3728]/20 relative overflow-hidden flex flex-col">
            {/* Repost Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#e0d8cf]/50">
                <div className="flex items-center gap-3 flex-1">
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
                            {repost.repostType === 'quote' ? 'Quote Repost' : 'Repost'} ·{' '}
                            {repost.createdAt ? new Date(repost.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                        </p>
                    </div>
                </div>
            </div>

            {/* Quote thought */}
            {repost.repostType === 'quote' && repost.thoughtText && (
                <p className="text-sm text-[#4a3728]/80 italic mb-4 px-2 border-l-2 border-[#4a3728]/30">
                    "{repost.thoughtText}"
                </p>
            )}

            {/* Original Post */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e0d8cf]/30">
                <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center border-2 border-[#4a3728]/10 bg-[#4a3728]/10">
                        {originalAuthorAvatar || originalPost.userAvatar ? (
                            <img src={originalAuthorAvatar || originalPost.userAvatar} alt="Author" className="w-full h-full object-cover" />
                        ) : (
                            <svg className="w-5 h-5 text-[#4a3728]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#4a3728] text-sm">
                            {originalAuthorName || originalPost.userName || originalPost.fullName || 'Unknown User'}
                        </p>
                        <p className="text-xs text-[#4a3728]/50">
                            {originalPost.createdAt ? new Date(originalPost.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                        </p>
                    </div>
                </div>

                <h3 className="text-base font-bold text-[#4a3728] mb-2">{originalPost.title}</h3>
                {originalPost.content && (
                    <p className="text-sm text-[#4a3728]/70 leading-relaxed mb-3 line-clamp-3">{originalPost.content}</p>
                )}

                {originalPost.images?.length > 0 && (
                    <div className="relative mt-2 mb-3 rounded-xl overflow-hidden bg-[#4a3728]/5 w-full flex justify-center items-center">
                        <img
                            src={originalPost.images[0].cloudinarySecureUrl}
                            alt={originalPost.title}
                            className="w-full h-auto max-h-[380px] object-contain rounded-xl"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                    </div>
                )}

                {/* ✅ CHANGED: like is now a real button wired to onLikeToggle;
                    comment count stays a static display for now (see note
                    below the component for what's needed to make it clickable). */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#e0d8cf]/30">
                    <button
                        onClick={() => onLikeToggle?.(postKey)}
                        className={`text-xs flex items-center gap-1 transition-colors ${
                            isLiked ? 'text-red-500 font-semibold' : 'text-[#4a3728]/50 hover:text-red-500'
                        }`}
                    >
                        <svg className="w-3.5 h-3.5" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {likeCount}
                    </button>
                    <span className="text-xs text-[#4a3728]/50 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {originalPost.commentsCount || 0}
                    </span>
                </div>
            </div>
        </div>
    );
};

// ─── Document Preview (Modal version) ────────────────────────────────────────
const ModalDocumentCard = ({ post, doc }: { post: any; doc: any }) => {
    const [showPreview, setShowPreview] = useState(false);
    const previewUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(doc.cloudinarySecureUrl)}&embedded=true`;
    const fileSizeKB = doc.fileSize ? (doc.fileSize / 1024).toFixed(0) : '—';

    return (
        <div className="group bg-gradient-to-br from-[#e0d8cf]/60 via-[#e0d8cf]/40 to-[#f6ede8]/30 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-[#e0d8cf]/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#4a3728]/5 to-transparent rounded-full blur-xl group-hover:scale-150 transition-transform duration-700" />
            <div className="flex items-start gap-5 relative z-10">
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-[#4a3728] to-[#7a5c3e] rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-7 h-7 text-[#f6ede8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[#4a3728] truncate">{doc.originalName}</h4>
                    <p className="text-sm text-[#4a3728]/60 mt-0.5">
                        {post.title} · {fileSizeKB} KB · {doc.format?.toUpperCase() || 'DOC'}
                    </p>
                    <div className="flex gap-3 mt-3 flex-wrap">
                        <button
                            onClick={() => setShowPreview(v => !v)}
                            className="px-4 py-2 bg-gradient-to-r from-[#4a3728] to-[#7a5c3e] text-[#f6ede8] rounded-xl text-sm font-semibold hover:opacity-90 transition-all duration-200 flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {showPreview ? 'Hide PDF' : 'View PDF'}
                        </button>
                        <a
                            href={doc.cloudinarySecureUrl}
                            download={doc.originalName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 border-2 border-[#4a3728]/30 text-[#4a3728] rounded-xl text-sm font-semibold hover:border-[#4a3728]/60 hover:bg-[#4a3728]/5 transition-all duration-200 flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download
                        </a>
                    </div>
                </div>
            </div>
            {showPreview && (
                <div className="mt-5 rounded-xl overflow-hidden border-2 border-[#e0d8cf] relative z-10">
                    <div className="bg-[#4a3728]/5 px-4 py-2 flex items-center gap-2 border-b border-[#e0d8cf]">
                        <div className="w-2 h-2 rounded-full bg-[#4a3728]/40" />
                        <span className="text-xs font-semibold text-[#4a3728]/60 truncate">{doc.originalName}</span>
                    </div>
                    <iframe
                        src={previewUrl}
                        className="w-full h-[520px] bg-white"
                        title={doc.originalName}
                    />
                </div>
            )}
        </div>
    );
};

// ─── Video Card (Modal) ───────────────────────────────────────────────────────
const ModalVideoCard = ({ post, video }: { post: any; video: any }) => {
    const fileSizeMB = video.fileSize ? (video.fileSize / (1024 * 1024)).toFixed(1) : '—';
    const duration = video.duration
        ? `${Math.floor(video.duration / 60)}:${String(Math.floor(video.duration % 60)).padStart(2, '0')}`
        : '';

    return (
        <div className="group bg-gradient-to-br from-[#e0d8cf]/60 via-[#e0d8cf]/40 to-[#f6ede8]/30 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-[#e0d8cf]/40 relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#4a3728]/5 to-transparent rounded-full blur-xl group-hover:scale-150 transition-transform duration-700 z-[1]" />
            <div className="relative">
                <video
                    controls
                    className="w-full h-64 object-cover bg-black"
                    src={video.cloudinarySecureUrl}
                    preload="metadata"
                />
                {duration && (
                    <div className="absolute bottom-3 right-3 bg-black/70 text-white px-3 py-1 rounded-lg text-sm font-semibold z-[2]">
                        {duration}
                    </div>
                )}
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

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = ({ label }: { label: string }) => (
    <div className="text-center py-14">
        <div className="w-16 h-16 bg-[#4a3728]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#4a3728]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
        </div>
        <p className="text-[#4a3728]/50 font-medium">{label}</p>
    </div>
);  

// ─── Main Modal ───────────────────────────────────────────────────────────────
const ShowAllActivityModal: React.FC<ShowAllActivityModalProps> = ({
    isOpen,
    onClose,
    activeSection,
    posts = [],
    userReposts = [],
    profileImage = '',
    fullName = '',
    currentUserId = '',
    postLikes = {},
    onLikeToggle,
}) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    // ── Derived combined lists ────────────────────────────────────
    const repostedEntryIds = new Set(
        userReposts
            .map((r: any) => r.originalPost?.entryId)
            .filter(Boolean)
    );
    const filteredPosts = posts.filter(
        (p: any) => !repostedEntryIds.has(p.entryId || p.postId)
    );
    const combinedItems = [
        ...userReposts.map((repost: any) => ({ type: 'repost', data: repost })),
        ...filteredPosts.map((post: any) => ({ type: 'post', data: post })),
    ];

    // ── Derived media lists ───────────────────────────────────────
    const allVideos = posts.flatMap(p =>
        (p.videos || []).map((v: any) => ({ post: p, video: v }))
    );
    const allImages = posts.flatMap(p =>
        (p.images || []).map((img: any) => ({ post: p, img }))
    );
    const allDocuments = posts.flatMap(p =>
        (p.documents || []).map((doc: any) => ({ post: p, doc }))
    );

    const sectionCount = {
        Posts: combinedItems.length,
        Comments: 0,
        Videos: allVideos.length,
        Images: allImages.length,
        Documents: allDocuments.length,
    };

    const sectionTitle: Record<string, string> = {
        Posts: 'All Posts',
        Comments: 'All Comments',
        Videos: 'All Videos',
        Images: 'All Images',
        Documents: 'All Documents',
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#f6ede8] rounded-2xl shadow-2xl border border-[#e0d8cf] max-w-4xl w-full max-h-[90vh] flex flex-col">

                {/* ── Sticky Header ── */}
                <div className="sticky top-0 bg-[#f6ede8] border-b border-[#e0d8cf] p-6 flex items-center justify-between rounded-t-2xl flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-[#4a3728]">
                            {sectionTitle[activeSection] || 'All Activity'}
                        </h2>
                        <p className="text-sm text-[#8b6f47] mt-1">
                            Total: {sectionCount[activeSection as keyof typeof sectionCount] ?? 0}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 rounded-xl bg-[#e0d8cf]/70 hover:bg-[#d4c4b5] transition-all"
                    >
                        <X className="w-5 h-5 text-[#4a3728]" />
                    </button>
                </div>

                {/* ── Scrollable Content ── */}
                <div className="p-6 overflow-y-auto flex-1">

                    {/* ── POSTS ── */}
                    {activeSection === 'Posts' && (
                        <div className="space-y-6">
                            {combinedItems.length === 0 ? (
                                <EmptyState label="No posts yet." />
                            ) : (
                                combinedItems.map((item, idx) => {
                                    if (item.type === 'repost') {
                                        return (
                                            <ModalRepostCard
                                                key={`repost-${item.data.repostId || idx}`}
                                                repost={item.data}
                                                profileImage={profileImage}
                                                fullName={fullName}
                                                currentUserId={currentUserId}
                                                // ✅ ADDED — same source the normal posts below already use
                                                postLikes={postLikes}
                                                onLikeToggle={onLikeToggle}
                                            />
                                        );
                                    }

                                    const post = item.data;
                                    const postKey = post.entryId || post.postId;
                                    return (
                                        <div key={postKey || idx} className="group bg-gradient-to-br from-[#e0d8cf]/60 via-[#e0d8cf]/40 to-[#f6ede8]/30 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-[#e0d8cf]/40 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#4a3728]/5 to-transparent rounded-full blur-xl group-hover:scale-150 transition-transform duration-700" />

                                            {/* Post Header */}
                                            <div className="flex items-center gap-4 mb-4 relative z-10">
                                                <p className="text-xs text-[#4a3728]/50 ml-auto">
                                                    {post.createdAt ? new Date(post.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                                                </p>
                                            </div>

                                            {/* Post Content */}
                                            <div className="relative z-10">
                                                <h4 className="text-lg font-bold text-[#4a3728] mb-2">{post.title}</h4>
                                                {post.content && (
                                                    <p className="text-[#4a3728]/80 text-sm leading-relaxed mb-4">{post.content}</p>
                                                )}

                                                {/* Images */}
                                                {post.images && post.images.length > 0 && (
                                                    <div className="mb-4 rounded-xl overflow-hidden bg-[#4a3728]/5 w-full min-h-[200px] flex justify-center items-center">
                                                        <img
                                                            src={post.images[0].cloudinarySecureUrl}
                                                            alt="Post content"
                                                            className="w-full h-auto max-h-[440px] object-contain rounded-xl"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src =
                                                                    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=280&fit=crop';
                                                            }}
                                                        />
                                                    </div>
                                                )}

                                                {/* Videos */}
                                                {post.videos && post.videos.length > 0 && (
                                                    <div className="space-y-3 mb-4">
                                                        {post.videos.map((video: any, i: number) => (
                                                            <video
                                                                key={i}
                                                                controls
                                                                className="w-full h-64 rounded-xl bg-black"
                                                                src={video.cloudinarySecureUrl}
                                                                preload="metadata"
                                                            />
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Documents */}
                                                {post.documents && post.documents.length > 0 && (
                                                    <div className="space-y-2 mb-4">
                                                        {post.documents.map((doc: any, i: number) => (
                                                            <ModalDocumentCard key={i} post={post} doc={doc} />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Like / Comment actions */}
                                            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[#e0d8cf]/40 relative z-10">
                                                <button
                                                    onClick={() => onLikeToggle(postKey)}
                                                    className={`flex items-center gap-2 transition-all duration-200 ${postLikes[postKey]?.isLiked
                                                            ? 'text-red-500'
                                                            : 'text-[#4a3728]/70 hover:text-red-500'
                                                        }`}
                                                >
                                                    <div className="p-2 rounded-xl hover:bg-red-50 transition-colors duration-200">
                                                        <svg
                                                            className="w-5 h-5"
                                                            fill={postLikes[postKey]?.isLiked ? 'currentColor' : 'none'}
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-sm font-semibold">
                                                        {postLikes[postKey]?.count ?? post.likesCount ?? 0}
                                                    </span>
                                                </button>
                                                <div className="flex items-center gap-2 text-[#4a3728]/60">
                                                    <div className="p-2 rounded-xl">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-sm font-semibold">{post.commentsCount ?? 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* ── COMMENTS ── */}
                    {activeSection === 'Comments' && (
                        <EmptyState label="Comments you've made will appear here." />
                    )}

                    {/* ── VIDEOS ── */}
                    {activeSection === 'Videos' && (
                        <div className="space-y-6">
                            {allVideos.length === 0 ? (
                                <EmptyState label="No videos uploaded yet." />
                            ) : (
                                allVideos.map(({ post, video }, idx) => (
                                    <ModalVideoCard key={`${post.postId}-${idx}`} post={post} video={video} />
                                ))
                            )}
                        </div>
                    )}

                    {/* ── IMAGES ── */}
                    {activeSection === 'Images' && (
                        <>
                            {allImages.length === 0 ? (
                                <EmptyState label="No images uploaded yet." />
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {allImages.map(({ post, img }, idx) => (
                                        <div key={`${post.postId}-${idx}`} className="group bg-gradient-to-br from-[#e0d8cf]/60 via-[#e0d8cf]/40 to-[#f6ede8]/30 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-500 border border-[#e0d8cf]/40 flex flex-col h-full">
                                            <div className="relative overflow-hidden h-56 bg-black flex items-center justify-center">
                                                <img
                                                    src={img.cloudinarySecureUrl}
                                                    alt={post.title}
                                                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src =
                                                            'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=500&fit=crop';
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                            </div>
                                            <div className="p-4 flex-shrink-0">
                                                <p className="text-[#4a3728] font-semibold text-sm truncate">{post.title}</p>
                                                <div className="flex items-center justify-between mt-1">
                                                    <span className="text-xs text-[#4a3728]/50 uppercase">{img.format}</span>
                                                    <span className="text-xs text-[#4a3728]/50">{img.width}×{img.height}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* ── DOCUMENTS ── */}
                    {activeSection === 'Documents' && (
                        <div className="space-y-5">
                            {allDocuments.length === 0 ? (
                                <EmptyState label="No documents uploaded yet." />
                            ) : (
                                allDocuments.map(({ post, doc }, idx) => (
                                    <ModalDocumentCard key={`${post.postId}-${idx}`} post={post} doc={doc} />
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShowAllActivityModal;