// src/lib/api/data/posts.api.ts
import AuthService from '@/lib/api/auth.service';
import { TransformedPost } from '@/types/profile.types';
import { calculateTimeAgo } from '@/shared/utils/time.util';
import ProfileService from '../profile.service';

// Shared transformer — keeps the exact same shape both flows had before
const transformPosts = (rawPosts: any[]): TransformedPost[] => {
    return rawPosts.map((post: any) => ({
        // ✅ FIX: backend response me id field ka naam route ke hisaab se
        // alag ho sakta hai (apne posts wale route vs dusre user ke posts
        // wale /posts/user/:userId route). Pehle sirf `post.postId` set
        // hota tha — agar us route pe backend `entryId` ya `_id` bhej raha
        // ho to postId hamesha undefined ban jaata, aur SAARE posts ka key
        // (jo poore app me `post.entryId || post.postId` se nikala jaata
        // hai) collide ho jaata — isi wajah se kisi ek post pe like ya
        // 3-dot menu click karne se saare posts affect ho rahe the
        // (dusre user ki profile dekhte waqt).
        postId: post.entryId || post.postId || post._id,   // ✅ entryId sabse pehle

        // postId: post.postId || post._id || post.entryId,
        entryId: post.entryId || post.postId || post._id,
        userId: post.userId, // ✅ FIX: missing tha — isi wajah se Unfollow "Unable to identify this user" deta tha, aur post.user (author naam) bhi undefined aata tha
        user: `${post.firstName || ''} ${post.lastName || ''}`.trim() || (typeof post.user === 'string' && post.user !== 'Unknown User' ? post.user : '') || post.authorName || post.fullName || post.name || '',
        title: post.title,
        text: post.content,
        image: post.images?.[0]?.cloudinarySecureUrl
            || post.videos?.[0]?.cloudinarySecureUrl
            || '',
        likes: post.likesCount || 0,
        isLiked: post.isLikedByCurrentUser || false,
        comments: post.commentsCount || 0,
        reposts: 0,
        time: calculateTimeAgo(post.createdAt),
        images: post.images || [],
        videos: post.videos || [],
        documents: post.documents || [],
        createdAt: post.createdAt,
        isPinned: post.isPinned || false,
        isSaved: post.isSaved || false,
        isArchived: post.isArchived || false,
        // ✅ ADDED: reaction fields — backend sends reactionCounts always
        // (default 0s), and we derive "which reaction did I give" from the
        // reactions array since isLikedByCurrentUser only tracks the old
        // simple-like boolean.
        reactionCounts: post.reactionCounts || {
            like: 0, celebrate: 0, support: 0, love: 0, insightful: 0, funny: 0,
        },
        userReaction: post.userReaction ?? null,
    }));
};

export const postsApi = {
    /**
     * Fetch posts.
     * - No userId (or your own userId) → your OWN posts (via /get-all/posts,
     *   which is auth-token scoped — includes archived if you ask for it).
     * - A different userId → that user's PUBLIC posts (via /posts/user/:userId).
     *
     * @param userId  Target user's id. Omit for "my own posts".
     */
    async fetchUserPosts(userId?: string): Promise<TransformedPost[]> {
        const response = userId
            ? await ProfileService.getAllUserPostsByUserId(userId, false)
            : await ProfileService.getAllUserPosts(false);

        return transformPosts(response.data.posts);
    }
};