import config from "@/config/env.config";
import api from "./api.intance";

class FollowService {
    private static getEndpoint(): string {
        return config?.NEXT_PUBLIC_FOLLOW_ENDPOINT || process.env.NEXT_PUBLIC_FOLLOW_ENDPOINT || '/connections/follow';
    }

    /**
     * Follow a user
     * POST /api/v1/connections/follow
     */
    static async followUser(followingId: string) {
        try {
            const { data } = await api.post(FollowService.getEndpoint(), { followingId });
            return data;
        } catch (error: any) {
            console.error("[FOLLOW_USER] Failed:", error?.response?.data || error);

            if (error.response?.status === 409) {
                throw new Error("Already following this user");
            }

            if (error.response?.status === 400) {
                throw new Error(
                    error.response?.data?.message || "Invalid request"
                );
            }

            throw new Error(
                error.response?.data?.message || "Failed to follow user"
            );
        }
    }

    /**
     * Unfollow a user
     * DELETE /api/v1/connections/follow/:userId
     */
    static async unfollowUser(followingId: string) {
        try {
            const { data } = await api.delete(
                `${FollowService.getEndpoint()}/${followingId}`
            );
            return data;
        } catch (error: any) {
            console.error("[UNFOLLOW_USER] Failed:", error?.response?.data || error);
            throw new Error(
                error.response?.data?.message || "Failed to unfollow user"
            );
        }
    }

    /**
     * Check follow status
     * GET /api/v1/connections/follow/status/:userId
     */
    static async checkFollowStatus(userId: string) {
        try {
            const { data } = await api.get(
                `${FollowService.getEndpoint()}/status/${userId}`
            );
            return data;
        } catch (error: any) {
            console.error("[CHECK_FOLLOW_STATUS] Failed:", error?.response?.data || error);
            return null;
        }
    }

    /**
     * 📊 GET FOLLOW COUNTS FOR A USER (followers + following)
     * GET /api/v1/connections/follow/counts/:userId
     */
    static async getFollowCounts(userId: string) {
        try {
            const { data } = await api.get(
                `${FollowService.getEndpoint()}/counts/${userId}`
            );
            return data;
        } catch (error: any) {
            console.error('[GET_FOLLOW_COUNTS] Failed:', error?.response?.data || error);
            return null;
        }
    }

    /**
     * ✅ GET user's FOLLOWERS LIST
     * GET /api/v1/connections/follow/followers/:userId
     */
    static async getFollowers(userId: string, params?: { page?: number; limit?: number }) {
        try {
            const { data } = await api.get(
                `${FollowService.getEndpoint()}/followers/${userId}`,
                { params }
            );
            return data;
        } catch (error: any) {
            console.error('[GET_FOLLOWERS] Failed:', error?.response?.data || error);
            throw error;
        }
    }

    /**
     * ✅ GET user's FOLLOWING LIST
     * GET /api/v1/connections/follow/following/:userId
     */
    static async getFollowing(userId: string, params?: { page?: number; limit?: number }) {
        try {
            const { data } = await api.get(
                `${FollowService.getEndpoint()}/following/${userId}`,
                { params }
            );
            return data;
        } catch (error: any) {
            console.error('[GET_FOLLOWING] Failed:', error?.response?.data || error);
            throw error;
        }
    }

    static async getUserFollowingCompanies(userId: string) {
        try {
            const { data } = await api.get(
                `${FollowService.getEndpoint()}/user/${userId}/companies`
            );
            return data;
        } catch (error: any) {
            console.error('[GET_FOLLOWING_COMPANIES] Failed:', error?.response?.data || error);
            throw new Error(error.response?.data?.message || 'Failed to fetch followed companies');
        }
    }
}

export default FollowService;