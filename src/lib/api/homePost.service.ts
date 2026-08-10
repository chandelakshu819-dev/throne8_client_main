import api from "./api.intance"; // your existing axios instance

interface HomePostPayload {
    title: string;
    content?: string;
    mood?: string;
    isPublic?: boolean;
    scheduledFor?: string;
    pollData?: {
        question: string;
        options: string[];
        duration: 1 | 3 | 7 | 14;
    };
}

class HomePostService {

    /**
     * POST /profile/home-post/create
     */
    static async createPost(payload: HomePostPayload): Promise<any> {
        try {
            const { data } = await api.post('/profile/home-post/create', payload);
            return data;
        } catch (error: any) {
            if (error?.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error('Failed to create post. Please try again.');
        }
    }

    static async createPostWithMedia(formData: FormData): Promise<any> {
        try {
            const { data } = await api.post('/profile/home-post/create', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return data;
        } catch (error: any) {
            if (error?.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error('Failed to create post with media.');
        }
    }

    /**
     * GET /api/v1/profile/home-post/feed?page=1&limit=20
     */
    static async getFeedPosts(page: number = 1, limit: number = 20): Promise<any> {
        try {
            const { data } = await api.get('/profile/home-post/feed', {
                params: { page, limit }
            });
            return data;
        } catch (error: any) {
            if (error?.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error('Failed to fetch feed.');
        }
    }

    /**
     * GET /api/v1/activity/posts/:postId/reactors
     * Post ke saare reactions/likes ki list (Reactions modal ke liye)
     */
    static async getPostReactors(postId: string): Promise<any> {
        try {
            const { data } = await api.get(`/activity/posts/${postId}/reactors`);
            return data;
        } catch (error: any) {
            if (error?.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error('Failed to fetch post reactors.');
        }
    }

    /**
     * ✅ NEW: POST /api/v1/activity/posts/:postId/record-send
     * SendPostModal se post successfully send hone ke baad call hota hai —
     * `recipientCount` batata hai kitne logo ko ek saath bheja gaya, taaki
     * total "sends" count usi hisaab se badhe (5 logo ko bheja = +5, sirf +1 nahi).
     * Non-critical hai — fail ho jaaye toh bhi user ka message already
     * bhej diya gaya hai, isliye yahan error silently swallow hota hai
     * (UI ko block nahi karna, sirf ek counter hai).
     */
    static async recordSend(postId: string, recipientCount: number): Promise<any> {
        try {
            const { data } = await api.post(`/activity/posts/${postId}/record-send`, {
                recipientCount,
            });
            return data;
        } catch (error: any) {
            console.warn('⚠️ Failed to record send count (non-critical):', error?.message);
            return null;
        }
    }
}

export default HomePostService;