// src/lib/api/repost.service.ts

import api from './api.intance';

class RepostService {

    static async createRepost(
        entryId: string,
        type: 'repost' | 'quote' = 'repost',
        thoughtText?: string
    ) {
        try {
            const { data } = await api.post(
                `/profile/activity/posts/${entryId}/repost`,
                {
                    type,
                    thoughtText,
                    visibility: 'public',
                    repostSource: 'feed',
                }
            );
            return data;
        } catch (error: any) {
            const message = error?.response?.data?.message || error?.message || 'Failed to create repost';
            throw new Error(message);
        }
    }

    static async deleteRepost(repostId: string) {
        try {
            const { data } = await api.delete(
                `/profile/activity/posts/reposts/${repostId}`
            );
            return data;
        } catch (error: any) {
            throw new Error(error.message || 'Failed to delete repost');
        }
    }

    static async getMyReposts() {
        try {
            const { data } = await api.get(
                `/profile/activity/posts/reposts/my-reposts`
            );
            return data;
        } catch (error: any) {
            throw new Error(error.message || 'Failed to fetch my reposts');
        }
    }

    static async getRepostsByPost(entryId: string) {
        const { data } = await api.get(
            `/profile/activity/posts/${entryId}/reposts`
        );
        return data;
    }

    static async getRepostStatus(entryId: string) {
        const { data } = await api.get(
            `/profile/activity/posts/${entryId}/repost-status`
        );
        return data;
    }

    // ✅ NEW: quote-repost ka apna independent like
    static async reactToRepost(repostId: string) {
        try {
            const { data } = await api.post(
                `/profile/activity/posts/reposts/${repostId}/react`
            );
            return data;
        } catch (error: any) {
            throw new Error(error?.response?.data?.message || error.message || 'Failed to like repost');
        }
    }

    static async removeReactionFromRepost(repostId: string) {
        try {
            const { data } = await api.delete(
                `/profile/activity/posts/reposts/${repostId}/react`
            );
            return data;
        } catch (error: any) {
            throw new Error(error?.response?.data?.message || error.message || 'Failed to unlike repost');
        }
    }
}

export default RepostService;