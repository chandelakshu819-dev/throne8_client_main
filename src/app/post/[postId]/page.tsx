'use client';
/**
 * /post/[postId]/page.tsx
 *
 * Standalone post detail page. Renders a single post (with all its comments)
 * and supports deep-linking to a specific comment via the `?commentId=` and
 * `?replyId=` query params that are injected by the notification click handler.
 *
 * Deep-link flow:
 *   1. User clicks a "Comment Liked" or "Comment Replied" notification.
 *   2. The notification page routes to `/post/{postId}?commentId={id}&replyId={id}`.
 *   3. On load, this page scrolls to and highlights the target comment element
 *      (identified by the id="comment-{id}" attribute set in CommentItem.tsx).
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, MessageCircle, Heart, Bookmark } from 'lucide-react';
import ProfileService from '@/lib/api/profile.service';
import AuthService from '@/lib/api/auth.service';
import { useAuth } from '@/features/auth/hooks/useAuth';
import CommentsSection from '@/features/profile/components/feed/CommentsSection';

export default function PostDetailPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();

    const postId = params?.postId as string;
    const targetCommentId = searchParams.get('commentId');
    const targetReplyId = searchParams.get('replyId');

    const [post, setPost] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [isLoadingPost, setIsLoadingPost] = useState(true);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Comment interaction state (mirrors dashboard/profile pages)
    const [commentText, setCommentText] = useState('');
    const [replyingTo, setReplyingTo] = useState<any>(null);
    const [openCommentMenuIndex, setOpenCommentMenuIndex] = useState<string | null>(null);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editCommentText, setEditCommentText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    // ─── Comment enrichment & tree builder ────────────────────────────────────
    const enrichCommentsWithUserData = useCallback(async (rawComments: any[], postOwnerId?: string) => {
        if (!rawComments || rawComments.length === 0) return [];
        try {
            const uniqueUserIds = [...new Set(rawComments.map((c: any) => c.userId).filter(Boolean))] as string[];

            let usersData: any[] = [];
            if (uniqueUserIds.length > 0) {
                try {
                    const bulkResponse = await AuthService.getUsersBulk(uniqueUserIds);
                    usersData = bulkResponse.data?.users || [];
                } catch {
                    // Fallback to raw comment users
                }
            }

            const photoIds = usersData.map((u: any) => u.profilePhotoId).filter(Boolean);
            const headlineIds = usersData.map((u: any) => u.headlineId).filter(Boolean);

            const [photosMap, headlinesMap] = await Promise.all([
                (async (): Promise<Record<string, string>> => {
                    if (photoIds.length === 0) return {};
                    const res = await ProfileService.getMultipleProfilePhotosByIds(photoIds).catch(() => null);
                    if (!res) return {};
                    return (res.data?.photos || []).reduce((acc: Record<string, string>, p: any) => {
                        acc[p.photoId] = p.cloudinarySecureUrl;
                        return acc;
                    }, {});
                })(),
                (async (): Promise<Record<string, string>> => {
                    if (headlineIds.length === 0) return {};
                    try {
                        const headlinesResponse = await ProfileService.getMultipleHeadlinesByIds(headlineIds);
                        const headlines = headlinesResponse.data?.headlines || [];
                        return headlines.reduce((acc: Record<string, string>, h: any) => {
                            acc[h.headlineId] = h.title;
                            return acc;
                        }, {});
                    } catch {
                        return {};
                    }
                })(),
            ]);

            const usersMap = usersData.reduce((acc: Record<string, any>, u: any) => {
                acc[u.userId] = u;
                return acc;
            }, {});

            const FALLBACK_AVATAR =
                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdYRNQDghH1JvFXro2Yz3iWNmmFAubFZ-RGQ&s';

            return rawComments.map((comment: any) => {
                const u = usersMap[comment.userId];
                return {
                    ...comment,
                    isAuthor: !!postOwnerId && comment.userId === postOwnerId,
                    user: {
                        userId: comment.userId,
                        name: u ? `${u.firstName} ${u.lastName || ''}`.trim() : 'User',
                        avatar: u?.profilePhotoId ? photosMap[u.profilePhotoId] || FALLBACK_AVATAR : FALLBACK_AVATAR,
                        headline: u?.headlineId ? headlinesMap[u.headlineId] || '' : '',
                    },
                };
            });
        } catch {
            return rawComments;
        }
    }, []);

    const buildCommentTree = useCallback((flatComments: any[]) => {
        const map: Record<string, any> = {};
        const roots: any[] = [];

        flatComments.forEach((c: any) => {
            map[c.commentId] = { ...c, replies: [] };
        });

        flatComments.forEach((c: any) => {
            if (c.parentCommentId && map[c.parentCommentId]) {
                map[c.parentCommentId].replies.push(map[c.commentId]);
            } else {
                roots.push(map[c.commentId]);
            }
        });

        return roots;
    }, []);

    // ─── Fetch post ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!postId) return;
        setIsLoadingPost(true);
        ProfileService.getPostById(postId)
            .then(async (data) => {
                const rawPost = data?.data?.post || data?.data || data?.post || data;
                const p = { ...rawPost };

                // Ensure authorName and authorPhoto are populated, with frontend enrichment fallback if needed
                if (!p.authorName || p.authorName === 'User' || !p.authorPhoto) {
                    const authorUserId = p.userId;
                    if (authorUserId) {
                        try {
                            const userRes = await AuthService.getUsersBulk([authorUserId]);
                            const u = userRes.data?.users?.[0];
                            if (u) {
                                const name = `${u.firstName || ''} ${u.lastName || ''}`.trim();
                                if (name) p.authorName = name;
                                if (u.profilePhotoId) {
                                    const photoRes = await ProfileService.getMultipleProfilePhotosByIds([u.profilePhotoId]).catch(() => null);
                                    const photoUrl = photoRes?.data?.photos?.[0]?.cloudinarySecureUrl;
                                    if (photoUrl) p.authorPhoto = photoUrl;
                                }
                                if (u.headlineId) {
                                    const headlineRes = await ProfileService.getMultipleHeadlinesByIds([u.headlineId]).catch(() => null);
                                    const title = headlineRes?.data?.headlines?.[0]?.title;
                                    if (title) p.headline = title;
                                }
                            }
                        } catch {
                            // Fallback silently if enrichment fails
                        }
                    }
                }

                setPost(p);
            })
            .catch((err) => setError(err.message || 'Failed to load post'))
            .finally(() => setIsLoadingPost(false));
    }, [postId]);

    // ─── Fetch comments ────────────────────────────────────────────────────────
    const loadComments = useCallback(async (postOwnerId?: string) => {
        if (!postId) return;
        setIsLoadingComments(true);
        try {
            const data = await ProfileService.getCommentsByPostId(postId);
            const list = data?.data?.comments || data?.comments || data?.data || data || [];
            const rawComments = Array.isArray(list) ? list : [];
            const enriched = await enrichCommentsWithUserData(rawComments, postOwnerId);
            const nested = buildCommentTree(enriched);
            setComments(nested);
        } catch {
            setComments([]);
        } finally {
            setIsLoadingComments(false);
        }
    }, [postId, enrichCommentsWithUserData, buildCommentTree]);

    useEffect(() => {
        loadComments(post?.userId);
    }, [postId, post?.userId, loadComments]);

    // ─── Scroll-to-comment on load ─────────────────────────────────────────────
    useEffect(() => {
        const targetId = targetReplyId || targetCommentId;
        if (!targetId || isLoadingComments || comments.length === 0) return;

        const timer = setTimeout(() => {
            const el = document.getElementById(`comment-${targetId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('notif-highlight');
                setTimeout(() => el.classList.remove('notif-highlight'), 2600);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [targetCommentId, targetReplyId, isLoadingComments, comments]);

    // ─── Comment handlers ──────────────────────────────────────────────────────
    const handleCommentSubmit = useCallback(async () => {
        if (!commentText.trim() || !user?.userId) return;
        try {
            if (replyingTo) {
                await ProfileService.createReply(replyingTo, commentText);
                setReplyingTo(null);
            } else {
                await ProfileService.createComment(postId, commentText);
            }
            setCommentText('');
            await loadComments(post?.userId);
        } catch { /* silent */ }
    }, [commentText, postId, user?.userId, replyingTo, loadComments, post?.userId]);

    const handleReply = useCallback((commentId: string) => {
        setReplyingTo(commentId);
    }, []);

    const handleCommentReaction = useCallback(async (commentId: string) => {
        try {
            await ProfileService.likeComment(commentId);
        } catch { /* silent */ }
    }, []);

    const toggleCommentMenu = useCallback((commentId: string) => {
        setOpenCommentMenuIndex(prev => prev === commentId ? null : commentId);
    }, []);

    const handleCommentAction = useCallback(async (action: string, commentId: string, text?: string) => {
        if (action === 'edit') {
            setEditingCommentId(commentId);
            setEditCommentText(text || '');
        } else if (action === 'delete') {
            try {
                await ProfileService.deleteComment(commentId);
                setComments(prev => prev.filter(c => c.commentId !== commentId));
            } catch { /* silent */ }
        }
        setOpenCommentMenuIndex(null);
    }, []);

    const handleEditSubmit = useCallback(async (commentId: string) => {
        try {
            await ProfileService.updateComment(commentId, editCommentText);
            setComments(prev => prev.map(c =>
                c.commentId === commentId ? { ...c, content: editCommentText } : c
            ));
            setEditingCommentId(null);
        } catch { /* silent */ }
    }, [editCommentText]);

    const handleEmojiClick = useCallback((emoji: string) => {
        setCommentText(prev => prev + emoji);
        setShowEmojiPicker(false);
    }, []);

    // ─── Render ────────────────────────────────────────────────────────────────
    if (isLoadingPost) {
        return (
            <div className="min-h-screen bg-[#f0e6dd] flex items-center justify-center">
                <div className="text-[#6b5643] font-semibold text-lg animate-pulse">Loading post…</div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="min-h-screen bg-[#f0e6dd] flex flex-col items-center justify-center gap-4">
                <p className="text-[#4a3728] font-semibold text-lg">{error || 'Post not found.'}</p>
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 px-4 py-2 bg-[#6b5643] text-white rounded-xl text-sm font-semibold hover:bg-[#4a3728] transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Go Back
                </button>
            </div>
        );
    }

    const authorName = post.authorName || post.user?.name || 'User';
    const authorAvatar = post.authorPhoto || post.user?.avatar || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdYRNQDghH1JvFXro2Yz3iWNmmFAubFZ-RGQ&s';
    const authorHeadline = post.headline || post.user?.headline || '';
    const content = post.content || post.text || '';
    const postDate = post.createdAt
        ? new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : '';

    const postMediaList: string[] = (() => {
        if (Array.isArray(post.media) && post.media.length > 0) {
            return post.media.map((m: any) => typeof m === 'string' ? m : m?.cloudinarySecureUrl || m?.cloudinaryUrl || m?.url).filter(Boolean);
        }
        if (Array.isArray(post.images) && post.images.length > 0) {
            return post.images.map((img: any) => typeof img === 'string' ? img : img?.cloudinarySecureUrl || img?.cloudinaryUrl || img?.url).filter(Boolean);
        }
        const single = post.imageUrl || post.image || post.postImage || post.mediaUrl;
        return single ? [single] : [];
    })();

    return (
        <div className="min-h-screen bg-[#f0e6dd]">
            {/* ── Top nav bar ── */}
            <div className="sticky top-0 z-30 bg-[#f0e6dd]/95 backdrop-blur-sm border-b border-[#4a3728]/10 px-4 py-3 flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-1.5 text-[#4a3728] hover:text-[#6b5643] font-semibold text-sm transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>
                <span className="text-[#4a3728]/40 font-semibold">|</span>
                <span className="text-[#4a3728] font-semibold text-sm">Post</span>
                {(targetCommentId || targetReplyId) && (
                    <span className="ml-auto text-xs text-[#6b5643] bg-[#4a3728]/8 px-2 py-1 rounded-full font-medium">
                        📍 Scrolling to comment…
                    </span>
                )}
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6">
                {/* ── Post card ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#4a3728]/8 overflow-hidden mb-4">
                    {/* Author info */}
                    <div className="p-5 flex items-start gap-3">
                        <img
                            src={authorAvatar}
                            alt={authorName}
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0 ring-2 ring-[#4a3728]/10"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-[#4a3728] text-base leading-tight">{authorName}</p>
                            {authorHeadline && (
                                <p className="text-xs text-[#4a3728]/60 mt-0.5 line-clamp-2">{authorHeadline}</p>
                            )}
                            {postDate && (
                                <p className="text-xs text-[#4a3728]/40 mt-1">{postDate}</p>
                            )}
                        </div>
                    </div>

                    {/* Post content */}
                    <div className="px-5 pb-4">
                        <p className="text-[#4a3728]/90 text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
                    </div>

                    {/* Post media if any */}
                    {postMediaList.length > 0 && (
                        <div className="px-5 pb-4 space-y-3">
                            {postMediaList.map((mediaUrl, idx) => (
                                <img
                                    key={idx}
                                    src={mediaUrl}
                                    alt={`Post media ${idx + 1}`}
                                    className="w-full rounded-xl object-cover max-h-[500px]"
                                />
                            ))}
                        </div>
                    )}

                    {/* Action bar */}
                    <div className="px-5 py-3 border-t border-[#4a3728]/8 flex items-center gap-5">
                        <button className="flex items-center gap-1.5 text-[#4a3728]/60 hover:text-red-500 transition-colors text-sm font-semibold">
                            <Heart className="w-4 h-4" />
                            <span>{post.likesCount || 0}</span>
                        </button>
                        <button className="flex items-center gap-1.5 text-[#4a3728]/60 hover:text-[#4a3728] transition-colors text-sm font-semibold">
                            <MessageCircle className="w-4 h-4" />
                            <span>{comments.length || post.commentCount || 0}</span>
                        </button>
                        <button className="flex items-center gap-1.5 text-[#4a3728]/60 hover:text-[#4a3728] transition-colors text-sm font-semibold ml-auto">
                            <Bookmark className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* ── Comments section ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#4a3728]/8 p-5">
                    <h2 className="font-bold text-[#4a3728] text-base mb-4 flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Comments
                        {comments.length > 0 && (
                            <span className="text-xs text-[#4a3728]/50 font-normal">({comments.length})</span>
                        )}
                    </h2>

                    <CommentsSection
                        isDarkMode={false}
                        commentText={commentText}
                        setCommentText={setCommentText}
                        replyingTo={replyingTo}
                        openCommentMenuIndex={openCommentMenuIndex}
                        commentCount={comments.length}
                        setReplyingTo={setReplyingTo}
                        profileImage={user?.profilePhotoId || ''}
                        editingCommentId={editingCommentId}
                        editCommentText={editCommentText}
                        setEditCommentText={setEditCommentText}
                        showEmojiPicker={showEmojiPicker}
                        setShowEmojiPicker={setShowEmojiPicker}
                        handleCommentSubmit={handleCommentSubmit}
                        handleReply={handleReply}
                        handleCommentReaction={handleCommentReaction}
                        toggleCommentMenu={toggleCommentMenu}
                        handleCommentAction={handleCommentAction}
                        handleEditSubmit={handleEditSubmit}
                        handleEmojiClick={handleEmojiClick}
                        comments={comments}
                        postId={postId}
                        emojiList={['😊', '😂', '❤️', '👍', '🎉', '🔥', '💯', '🙌']}
                        currentUserId={user?.userId}
                        isLoading={isLoadingComments}
                        initialVisibleCount={100}
                    />

                    {!isLoadingComments && comments.length === 0 && (
                        <p className="text-center text-[#4a3728]/40 text-sm py-6">
                            No comments yet. Be the first to comment!
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
