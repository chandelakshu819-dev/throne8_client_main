// src/profile/components/useActivityHandlers.ts
import { useState, useEffect } from 'react';
import AuthService from '@/lib/api/auth.service';

import { useComments } from './useComments';
import { Post, PostLikeState } from '../types';
import ProfileService from '@/lib/api/profile.service';
import { ReactionCounts, ReactionType } from '@/types/profile.types';
import { emitPostContentUpdated } from '@/shared/utils/postEvents';

interface UseActivityHandlersProps {
    posts: Post[];
    onPostCreated?: () => void;
    profileImage: string;
}

// ✅ ADDED: per-post reaction state shape
interface PostReactionState {
    counts: ReactionCounts;
    userReaction: ReactionType | null;
}

const EMPTY_REACTION_COUNTS: ReactionCounts = {
    like: 0, celebrate: 0, support: 0, love: 0, insightful: 0, funny: 0,
};

export const useActivityHandlers = ({
    posts,
    onPostCreated,
    profileImage
}: UseActivityHandlersProps) => {
    // ── Post UI state ──────────────────────────────────────────────
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [updatePostId, setUpdatePostId] = useState<number | null>(null);
    const [updatePostTitle, setUpdatePostTitle] = useState('');
    const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
    const [archivingPostId, setArchivingPostId] = useState<string | null>(null);
    const [postLikes, setPostLikes] = useState<PostLikeState>({});
    // ✅ ADDED: multi-reaction state, keyed by postId (same key as postLikes)
    const [postReactions, setPostReactions] = useState<Record<string, PostReactionState>>({});
    // ✅ NEW: local save-state, keyed by postId — same pattern as postLikes,
    // avoids a full posts refetch (which was resetting scroll to the top).
    const [postSaves, setPostSaves] = useState<Record<string, boolean>>({});
    // ✅ NEW: local pin-state, keyed by postId — same pattern, so Pin/Unpin
    // toggles the label instantly and lets ActivitySection re-sort pinned-first
    // without waiting for a full posts refetch.
    const [postPins, setPostPins] = useState<Record<string, boolean>>({});
    const [openCommentsIndex, setOpenCommentsIndex] = useState<number | null>(null);

    // ── Comment UI state ───────────────────────────────────────────
    const [commentText, setCommentText] = useState('');
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editCommentText, setEditCommentText] = useState('');
    const [openCommentMenuIndex, setOpenCommentMenuIndex] = useState<string | null>(null);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isDeletingCommentId, setIsDeletingCommentId] = useState<string | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const {
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
    } = useComments();

    // ── Sync postLikes from posts prop ────────────────────────────
    useEffect(() => {
        const likesMap: PostLikeState = {};
        const reactionsMap: Record<string, PostReactionState> = {};
        const savesMap: Record<string, boolean> = {}; // ✅ NEW
        const pinsMap: Record<string, boolean> = {}; // ✅ NEW
        posts.forEach(post => {
            const key = post.entryId || post.postId;
            likesMap[key] = {
                count: post.likes || 0,
                isLiked: post.isLiked || false,
            };
            // ✅ ADDED: seed reaction state from post prop
            reactionsMap[key] = {
                counts: (post as any).reactionCounts || EMPTY_REACTION_COUNTS,
                userReaction: (post as any).userReaction ?? (post.isLiked ? 'like' : null),
            };
            savesMap[key] = (post as any).isSaved || false; // ✅ NEW
            pinsMap[key] = (post as any).isPinned || false; // ✅ NEW
        });
        setPostLikes(likesMap);
        setPostReactions(reactionsMap);
        // ✅ FIX: sirf naye posts ke liye seed karo — jo postId already
        // postSaves/postPins me maujood hai (matlab user pehle hi
        // save/unsave ya pin/unpin kar chuka hai), usko is re-sync se
        // overwrite mat karo. Warna posts prop reference change hote hi
        // (parent re-render, socket event, etc.) optimistic save/unsave
        // 1-2 second baad stale backend value se revert ho jaata tha.
        setPostSaves(prev => {
            const merged = { ...savesMap, ...prev };
            // naye posts jo prev me nahi the unhe savesMap se le lo (already upar hai)
            return merged;
        });
        setPostPins(prev => {
            const merged = { ...pinsMap, ...prev };
            return merged;
        });
    }, [posts]);

    // ✅ NEW: seed like-state for a post that does NOT belong to the current
    // `posts` prop array (e.g. the ORIGINAL post shown inside a repost card
    // on this profile — that original post might belong to a different
    // user entirely, so it never gets synced by the effect above).
    // Only seeds if not already present, so it never clobbers a value that
    // came from the posts-prop sync or from a subsequent like/unlike click.
    const seedPostLikeState = (postId: string, state: { count: number; isLiked: boolean }) => {
        if (!postId) return;
        setPostLikes(prev => {
            if (prev[postId] !== undefined) return prev; // already seeded/known — don't overwrite
            return { ...prev, [postId]: state };
        });
    };

    // ── Post Handlers ─────────────────────────────────────────────
    const handleUpdatePost = async (postId: string, newContent: string) => {
        try {
            // ✅ FIX: content ke saath-saath title bhi bhejo (home page jaisa),
            // warna backend ki title field kabhi update nahi hoti aur
            // Recent Posts sidebar (jo title dikhata hai) stale reh jaata hai.
            const rawTitle = newContent.trim().substring(0, 100);
            const title = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);

            await ProfileService.updatePost(postId, { content: newContent, title });
            onPostCreated?.();
           // ✅ NEW: broadcast karo taaki Home feed (ya koi bhi doosra page) bhi sync ho jaaye
            emitPostContentUpdated(postId, newContent);
        } catch (error: any) {
            alert(error.message || 'Failed to update post');
        }
    };

    const handleDeletePost = async (postId: string) => {
        try {
            setDeletingPostId(postId);
            await ProfileService.deletePost(postId, false);
            onPostCreated?.();
        } catch (error: any) {
            alert(error.message || 'Failed to delete post');
        } finally {
            setDeletingPostId(null);
            setOpenMenuId(null);
        }
    };
    

    const handleArchivePost = async (postId: string) => {
        try {
            setArchivingPostId(postId);
            await ProfileService.archivePost(postId);
            onPostCreated?.();
        } catch (error: any) {
            alert(error.message || 'Failed to archive post');
        } finally {
            setArchivingPostId(null);
        }
    };

    const handlePinPost = async (postId: string, currentPinState: boolean) => {
        // ✅ FIX: optimistic local toggle (jaise save/unsave) — isse label
        // turant "Pin to profile" <-> "Unpin from profile" switch hota hai
        // aur ActivitySection turant pinned post ko sabse aage la sakta hai,
        // bina poora posts list refetch kiye.
        setPostPins(prev => ({ ...prev, [postId]: !currentPinState }));
        try {
            await ProfileService.pinPost(postId, !currentPinState);
        } catch (error: any) {
            setPostPins(prev => ({ ...prev, [postId]: currentPinState })); // revert
            throw error;
        }
    };



    const handleSavePost = async (postId: string, alreadySaved: boolean) => {
        setPostSaves(prev => ({ ...prev, [postId]: !alreadySaved }));
        try {
          await ProfileService.savePost(postId, !alreadySaved);
        } catch (err: any) {
          // 🔍 DEBUG: exact error dekhne ke liye — fix hote hi hata denge
          console.error('🔍 [SAVE_POST_DEBUG] Failed:', {
            postId,
            alreadySaved,
            status: err?.response?.status,
            data: err?.response?.data,
            message: err?.message,
          });
          setPostSaves(prev => ({ ...prev, [postId]: alreadySaved })); // revert
          throw err;
        }
      };


    const handleLikeToggle = async (postId: string) => {
        const currentLike = postLikes[postId] || { count: 0, isLiked: false };
        const newIsLiked = !currentLike.isLiked;
        const newCount = newIsLiked ? currentLike.count + 1 : currentLike.count - 1;

        // Optimistic update
        setPostLikes(prev => ({ ...prev, [postId]: { count: newCount, isLiked: newIsLiked } }));

        try {
            if (newIsLiked) {
                await ProfileService.likePost(postId);
            } else {
                await ProfileService.unlikePost(postId);
            }
        } catch (error: any) {
            // Revert on failure
            setPostLikes(prev => ({ ...prev, [postId]: currentLike }));
            if (!error.message.includes('already liked') && !error.message.includes('not liked')) {
                alert(error.message || 'Failed to update like');
            }
        }
    };

    // ✅ ADDED: multi-reaction handler (like/celebrate/support/love/insightful/funny)
    // Click same reaction again → removes it. Click a different reaction →
    // switches to it. Keeps postLikes in sync too (backend does the same
    // sync for 'like' type on its side).
    const handleReaction = async (postId: string, type: ReactionType) => {
        const current = postReactions[postId] || { counts: EMPTY_REACTION_COUNTS, userReaction: null };
        const isRemoving = current.userReaction === type;

        // Build optimistic new counts
        const newCounts: ReactionCounts = { ...current.counts };
        if (current.userReaction) {
            newCounts[current.userReaction] = Math.max(0, (newCounts[current.userReaction] || 0) - 1);
        }
        if (!isRemoving) {
            newCounts[type] = (newCounts[type] || 0) + 1;
        }
        const newUserReaction: ReactionType | null = isRemoving ? null : type;

        // Optimistic update — reactions
        setPostReactions(prev => ({
            ...prev,
            [postId]: { counts: newCounts, userReaction: newUserReaction },
        }));

        // Optimistic update — keep old postLikes in sync for 'like' type
        // (so any legacy UI reading postLikes still behaves correctly)
        const wasLikeType = current.userReaction === 'like';
        const isLikeTypeNow = newUserReaction === 'like';
        if (wasLikeType !== isLikeTypeNow) {
            setPostLikes(prev => {
                const currentLike = prev[postId] || { count: 0, isLiked: false };
                return {
                    ...prev,
                    [postId]: {
                        isLiked: isLikeTypeNow,
                        count: isLikeTypeNow ? currentLike.count + 1 : Math.max(0, currentLike.count - 1),
                    },
                };
            });
        }

        try {
            if (isRemoving) {
                await ProfileService.removeReaction(postId);
            } else {
                await ProfileService.reactToPost(postId, type);
            }
        } catch (error: any) {
            // Revert on failure
            setPostReactions(prev => ({ ...prev, [postId]: current }));
            if (!error.message?.includes('already reacted')) {
                alert(error.message || 'Failed to update reaction');
            }
        }
    };
    // ── Comment Handlers ──────────────────────────────────────────
    const toggleCommentsPanel = async (idx: number, postId: string) => {
        if (openCommentsIndex === idx) {
            setOpenCommentsIndex(null);
        } else {
            setOpenCommentsIndex(idx);
            if (postId && !commentsByPost[postId]) {
                // ✅ post-owner ka userId nikalo taaki useComments ko pata ho
                // konsa comment "Author" badge ke laayak hai
                const ownerPost = posts.find(p => (p.entryId || p.postId) === postId) as (Post & { userId?: string }) | undefined;
                await fetchCommentsByPost(postId, ownerPost?.userId);
            }
        }
    };;

    const toggleCommentMenu = (commentId: string) => {
        setOpenCommentMenuIndex(prev => (prev === commentId ? null : commentId));
    };

    const handleCommentAction = async (action: string, commentId: string, text?: string) => {
        const postId = Object.keys(commentsByPost).find(pid =>
            commentsByPost[pid]?.some(c => c.commentId === commentId)
        );

        if (action === 'edit') {
            setEditingCommentId(commentId);
            setEditCommentText(text || '');
        } else if (action === 'delete') {
            if (!confirm('Delete this comment?') || !postId) return;
            try {
                setIsDeletingCommentId(commentId);
                await deleteComment(postId, commentId);
            } catch (error: any) {
                alert(error.message || 'Failed to delete comment');
            } finally {
                setIsDeletingCommentId(null);
            }
        }
        setOpenCommentMenuIndex(null);
    };

    const handleEditSubmit = async (commentId: string) => {
        if (!editCommentText.trim()) return;
        const postId = Object.keys(commentsByPost).find(pid =>
            commentsByPost[pid]?.some(c => c.commentId === commentId)
        );
        if (!postId) return;
        try {
            await updateComment(postId, commentId, editCommentText);
            setEditingCommentId(null);
            setEditCommentText('');
        } catch (error: any) {
            alert(error.message || 'Failed to update comment');
        }
    };

    const handleCommentSubmit = async (postId: string) => {
        if (!commentText.trim()) return;
        try {
            await createComment(postId, commentText);
            setCommentText('');
            setReplyingTo(null);
        } catch (error: any) {
            alert(error.message || 'Failed to post comment');
        }
    };

    const handleReplySubmit = async (postId: string, commentId: string) => {
        if (!replyText.trim()) return;
        try {
            await createReply(postId, commentId, replyText);
            setReplyText('');
            setReplyingToCommentId(null);
        } catch (error: any) {
            alert(error.message || 'Failed to post reply');
        }
    };

    const handleEmojiClick = (emoji: string) => {
        setCommentText(prev => prev + emoji);
        setShowEmojiPicker(false);
    };

    return {
        // Post state
        openMenuId, setOpenMenuId,
        showUpdateModal, setShowUpdateModal,
        updatePostId, setUpdatePostId,
        updatePostTitle, setUpdatePostTitle,
        deletingPostId,
        archivingPostId,
        postLikes,
        postSaves, // ✅ NEW — exposed so ActivitySection/PostCard can read save state
        postPins, // ✅ NEW — exposed so ActivitySection/PostCard can read pin state
        seedPostLikeState, // ✅ NEW — exposed for RepostCard to seed original-post like state
        postReactions,
        handleReaction,
        openCommentsIndex,

        // Comment state
        commentText, setCommentText,
        editingCommentId,
        editCommentText, setEditCommentText,
        openCommentMenuIndex,
        replyingTo, setReplyingTo,
        replyingToCommentId, setReplyingToCommentId,
        replyText, setReplyText,
        isDeletingCommentId,
        setIsDeletingCommentId,
        showEmojiPicker, setShowEmojiPicker,

       // Comments hook data
       commentsByPost,
       isLoadingComments,
       isSubmittingComment,
       commentLikes,
       formatCommentTime,
       fetchCommentsByPost,

        // Post handlers
        handleUpdatePost,
        handleDeletePost,
        handleArchivePost,
        handlePinPost,
        handleSavePost,
        handleLikeToggle,

        // Comment handlers
        toggleCommentsPanel,
        toggleCommentMenu,
        handleCommentAction,
        handleEditSubmit,
        handleCommentSubmit,
        handleReplySubmit,
        handleEmojiClick,
        likeCommentToggle,
    };
};