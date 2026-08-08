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
     * ✅ FIX: backend route "/posts/reposts/:repostId" hai — "posts/" wapas add kiya
     */
    static async deleteRepost(repostId: string) {
        try {
            const { data } = await api.delete(
                `/profile/activity/posts/reposts/${repostId}`
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
     * ✅ FIX: backend route "/posts/reposts/my-reposts" hai — "posts/" wapas add kiya.
     * Yehi missing segment tha jiski wajah se "ROUTE_NOT_FOUND" 404 aa raha tha
     * aur Activity tab pe userReposts hamesha empty rehta tha.
     */
    static async getMyReposts() {
        try {
            const { data } = await api.get(
                `/profile/activity/posts/reposts/my-reposts`
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
     * Yeh route sahi hai — backend mein bhi "/posts/:entryId/reposts" hi hai
     */
    static async getRepostsByPost(entryId: string) {
        const { data } = await api.get(
            `/profile/activity/posts/${entryId}/reposts`
        );
        return data;
    }

    /**
     * GET /posts/:entryId/repost-status
     * Yeh bhi sahi hai
     */
    static async getRepostStatus(entryId: string) {
        const { data } = await api.get(
            `/profile/activity/posts/${entryId}/repost-status`
        );
        return data;
    }
}

export default RepostService;