import api from './api.intance';

class RepostService {

    /**
     * POST /posts/:entryId/repost
     * Simple repost ya quote repost banana
     */
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
            console.log('✅ Repost created successfully:', data);
            return data;
        } catch (error: any) {
            console.error('❌ Repost creation failed:', error);
            const message = error?.response?.data?.message || error?.message || 'Failed to create repost';
            throw new Error(message);
        }
    }

    /**
     * DELETE /reposts/:repostId
     * Repost delete karo
     * ✅ FIX: extra "posts/" segment hataya — backend route sirf /reposts/:repostId hai
     */
    static async deleteRepost(repostId: string) {
        try {
            const { data } = await api.delete(
                `/profile/activity/reposts/${repostId}`
            );
            console.log('✅ Repost deleted successfully:', data);
            return data;
        } catch (error: any) {
            console.error('❌ Repost deletion failed:', error);
            throw new Error(error.message || 'Failed to delete repost');
        }
    }

    /**
     * GET /reposts/my-reposts
     * Apne saare reposts laao
     * ✅ FIX: extra "posts/" segment hataya — backend route sirf /reposts/my-reposts hai
     */
    static async getMyReposts() {
        try {
            const { data } = await api.get(
                `/profile/activity/reposts/my-reposts`
            );
            console.log('✅ My reposts fetched successfully:', data);
            return data;
        } catch (error: any) {
            console.error('❌ Failed to fetch my reposts:', error);
            throw new Error(error.message || 'Failed to fetch my reposts');
        }
    }

    /**
     * GET /posts/:entryId/reposts
     * Ek post ke saare reposts
     */
    static async getRepostsByPost(entryId: string) {
        const { data } = await api.get(
            `/profile/activity/posts/${entryId}/reposts`
        );
        return data;
    }

    /**
     * GET /posts/:entryId/repost-status
     * Kya maine ye post repost ki hai?
     */
    static async getRepostStatus(entryId: string) {
        const { data } = await api.get(
            `/profile/activity/posts/${entryId}/repost-status`
        );
        return data;
    }
}

export default RepostService;