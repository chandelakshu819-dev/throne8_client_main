// src/hooks/data/useComments.ts
// ✅ COMPLETE HOOK - Replace previous version

import { useState, useCallback, useRef } from 'react';
import AuthService from '@/lib/api/auth.service';
import { z } from 'zod';
import ProfileService from '@/lib/api/profile.service';

// ==================== ZOD SCHEMAS ====================

export const createCommentSchema = z.object({
    content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Max 2000 characters').trim(),
});

export const createReplySchema = z.object({
    content: z.string().min(1, 'Reply cannot be empty').max(2000, 'Max 2000 characters').trim(),
});

export const updateCommentSchema = z.object({
    content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Max 2000 characters').trim(),
});

// ==================== INTERFACES ====================

export interface CommentUser {
    userId: string;
    name: string;
    avatar: string;
    headline?: string;
}

export interface CommentData {
    commentId: string;
    postId: string;
    userId: string;
    content: string;
    likesCount: number;
    createdAt: string;
    parentCommentId?: string;
    threadDepth?: number;
    replyCount?: number;
    user?: CommentUser;
    isAuthor?: boolean; // true when this comment's author === the post owner
}

// ==================== HOOK ====================

export const useComments = () => {
    const [commentsByPost, setCommentsByPost] = useState<{ [postId: string]: CommentData[] }>({});
    const [isLoadingComments, setIsLoadingComments] = useState<{ [postId: string]: boolean }>({});
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [commentLikes, setCommentLikes] = useState<{ [commentId: string]: { count: number; isLiked: boolean } }>({});

    // remembers each post's owner userId so re-fetches (after create/edit/delete)
    // don't need the caller to keep re-passing it every single time.
    const postOwnerIdsRef = useRef<{ [postId: string]: string }>({});

    // ✅ NEW: tracks which postIds have already been fetched at least once.
    // Isse toggle-open pe agar comments already cache mein hain, dobara
    // poora bulk-fetch + enrichment pipeline nahi chalta — turant open
    // hota hai. `forceRefresh` se explicitly re-fetch bhi ho sakta hai
    // (create/edit/delete ke baad).
    const fetchedPostIdsRef = useRef<Set<string>>(new Set());

    // ==================== FETCH COMMENTS ====================
    const fetchCommentsByPost = useCallback(async (
        postId: string,
        postOwnerId?: string,
        forceRefresh: boolean = false
    ) => {
        if (postOwnerId) {
            postOwnerIdsRef.current[postId] = postOwnerId;
        }
        const effectiveOwnerId = postOwnerIdsRef.current[postId];

        // ✅ Already fetched once and caller isn't forcing a refresh —
        // skip the network round-trip entirely. This is the main fix for
        // "comment section opens slow": on repeat opens of the same post,
        // no loading spinner, no bulk-fetch pipeline, instant open.
        if (!forceRefresh && fetchedPostIdsRef.current.has(postId)) {
            return;
        }

        try {
            setIsLoadingComments(prev => ({ ...prev, [postId]: true }));
            const response = await ProfileService.getCommentsByPostId(postId);
            const rawComments: CommentData[] = response.data?.comments || [];
            const enriched = await enrichCommentsWithUsers(rawComments, effectiveOwnerId);

            const likesMap: { [key: string]: { count: number; isLiked: boolean } } = {};
            enriched.forEach(c => {
                likesMap[c.commentId] = { count: c.likesCount || 0, isLiked: false };
            });
            setCommentLikes(prev => ({ ...prev, ...likesMap }));
            setCommentsByPost(prev => ({ ...prev, [postId]: enriched }));
            fetchedPostIdsRef.current.add(postId);
        } catch (error: any) {
            console.error('❌ [COMMENTS] Fetch failed:', error.message);
            setCommentsByPost(prev => ({ ...prev, [postId]: [] }));
        } finally {
            setIsLoadingComments(prev => ({ ...prev, [postId]: false }));
        }
    }, []);

    // ==================== CREATE COMMENT ====================
    const createComment = useCallback(async (postId: string, content: string) => {
        const parsed = createCommentSchema.safeParse({ content });
        if (!parsed.success) throw new Error(parsed.error.errors[0].message);

        try {
            setIsSubmittingComment(true);
            await ProfileService.createComment(postId, parsed.data.content);
            // ✅ force refresh — naya comment cache ko bypass karke turant dikhna chahiye
            await fetchCommentsByPost(postId, undefined, true);
        } catch (error: any) {
            throw error;
        } finally {
            setIsSubmittingComment(false);
        }
    }, [fetchCommentsByPost]);

    // ==================== CREATE REPLY ====================
    const createReply = useCallback(async (postId: string, commentId: string, content: string) => {
        const parsed = createReplySchema.safeParse({ content });
        if (!parsed.success) throw new Error(parsed.error.errors[0].message);

        try {
            setIsSubmittingComment(true);
            await ProfileService.createReply(commentId, parsed.data.content);
            await fetchCommentsByPost(postId, undefined, true);
        } catch (error: any) {
            throw error;
        } finally {
            setIsSubmittingComment(false);
        }
    }, [fetchCommentsByPost]);

    // ==================== UPDATE COMMENT ====================
    const updateComment = useCallback(async (postId: string, commentId: string, content: string) => {
        const parsed = updateCommentSchema.safeParse({ content });
        if (!parsed.success) throw new Error(parsed.error.errors[0].message);

        try {
            await ProfileService.updateComment(commentId, parsed.data.content);
            setCommentsByPost(prev => ({
                ...prev,
                [postId]: (prev[postId] || []).map(c =>
                    c.commentId === commentId ? { ...c, content: parsed.data.content } : c
                )
            }));
        } catch (error: any) {
            throw error;
        }
    }, []);

    // ==================== DELETE COMMENT ====================
    const deleteComment = useCallback(async (postId: string, commentId: string) => {
        try {
            await ProfileService.deleteComment(commentId);
            setCommentsByPost(prev => ({
                ...prev,
                [postId]: (prev[postId] || []).filter(c => c.commentId !== commentId)
            }));
        } catch (error: any) {
            throw error;
        }
    }, []);

    // ==================== LIKE/UNLIKE COMMENT ====================
    const likeCommentToggle = useCallback(async (commentId: string) => {
        const current = commentLikes[commentId] || { count: 0, isLiked: false };
        const newIsLiked = !current.isLiked;
        const newCount = newIsLiked ? current.count + 1 : Math.max(0, current.count - 1);

        setCommentLikes(prev => ({
            ...prev,
            [commentId]: { count: newCount, isLiked: newIsLiked }
        }));

        try {
            if (newIsLiked) {
                await ProfileService.likeComment(commentId);
            } else {
                await ProfileService.unlikeComment(commentId);
            }
        } catch (error: any) {
            setCommentLikes(prev => ({ ...prev, [commentId]: current }));
            console.error('❌ Like toggle failed:', error.message);
        }
    }, [commentLikes]);

    // ==================== USER ENRICHMENT ====================
    // ✅ Bulk calls use hote hain — individual getUserProfileById/getHeadlineById loops nahi hain.
    // ✅ FIX: photos aur headlines dono sirf usersData pe depend karte hain, ek doosre
    // pe nahi — pehle yeh sequentially (await ek ke baad ek) chal rahe the jo unnecessary
    // latency add kar raha tha. Ab Promise.all se parallel chalte hain.
    const enrichCommentsWithUsers = async (
        comments: CommentData[],
        postOwnerId?: string
    ): Promise<CommentData[]> => {
        if (comments.length === 0) return [];
        try {
            const uniqueUserIds = [...new Set(comments.map(c => c.userId))];

            let usersData: any[] = [];
            if (uniqueUserIds.length > 0) {
                try {
                    const bulkResponse = await AuthService.getUsersBulk(uniqueUserIds);
                    usersData = bulkResponse.data?.users || [];
                } catch (err) {
                    console.warn('⚠️ Failed to fetch users in bulk:', err);
                }
            }

            const photoIds = usersData.map((u: any) => u.profilePhotoId).filter(Boolean);
            const headlineIds = usersData.map((u: any) => u.headlineId).filter(Boolean);

            // ✅ FIX: parallel fetch instead of sequential
            const [photosMap, headlinesMap] = await Promise.all([
                (async (): Promise<Record<string, string>> => {
                    if (photoIds.length === 0) return {};
                    const res = await ProfileService.getMultipleProfilePhotosByIds(photoIds).catch(() => null);
                    if (!res) return {};
                    return res.data.photos.reduce((acc: Record<string, string>, p: any) => {
                        acc[p.photoId] = p.cloudinarySecureUrl; return acc;
                    }, {});
                })(),
                (async (): Promise<Record<string, string>> => {
                    if (headlineIds.length === 0) return {};
                    try {
                        const headlinesResponse = await ProfileService.getMultipleHeadlinesByIds(headlineIds);
                        const headlines = headlinesResponse.data?.headlines || [];
                        return headlines.reduce((acc: Record<string, string>, headline: any) => {
                            acc[headline.headlineId] = headline.title;
                            return acc;
                        }, {});
                    } catch {
                        return {}; // headlines optional
                    }
                })(),
            ]);

            const usersMap = usersData.reduce((acc: Record<string, any>, u: any) => {
                acc[u.userId] = u; return acc;
            }, {});

            return comments.map(comment => {
                const u = usersMap[comment.userId];
                return {
                    ...comment,
                    isAuthor: !!postOwnerId && comment.userId === postOwnerId,
                    user: {
                        userId: comment.userId,
                        name: u ? `${u.firstName} ${u.lastName}`.trim() : 'Unknown User',
                        avatar: u?.profilePhotoId
                            ? photosMap[u.profilePhotoId] || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdYRNQDghH1JvFXro2Yz3iWNmmFAubFZ-RGQ&s'
                            : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdYRNQDghH1JvFXro2Yz3iWNmmFAubFZ-RGQ&s',
                        headline: u?.headlineId ? headlinesMap[u.headlineId] || '' : '',
                    }
                };
            });
        } catch {
            return comments;
        }
    };

    const formatCommentTime = (createdAt: string): string => {
        if (!createdAt) return 'Recently';
        const diffMs = Date.now() - new Date(createdAt).getTime();
        const mins = Math.floor(diffMs / 60000);
        const hours = Math.floor(mins / 60);
        const days = Math.floor(hours / 24);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return {
        commentsByPost,
        isLoadingComments,
        isSubmittingComment,
        commentLikes,
        fetchCommentsByPost,
        createComment,
        createReply,
        updateComment,
        deleteComment,
        likeCommentToggle,
        formatCommentTime,
    };
};