import config from "@/config/env.config";
import api from "./api.intance";

class ReportService {
    /**
     * Backend Report route thronet-server mein Profile module ke andar
     * mount hai. Profile router khud "/api/v1/profile" prefix ke andar
     * mount hota hai, isliye fallback "/profile/reports" hai.
     */
    static async reportPost(postId: string, reason: string) {
        try {
            const endpoint = config.NEXT_PUBLIC_REPORTS_ENDPOINT || '/profile/reports';
            const { data } = await api.post(endpoint, { postId, reason });
            return data;
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            console.error('[REPORT_POST] Failed:', err);
            throw new Error(err.response?.data?.message || err.message || 'Failed to submit report');
        }
    }

    /**
     * Report User Profile
     */
    static async reportUser(userId: string, reason: string, details?: string) {
        try {
            const endpoint = config.NEXT_PUBLIC_REPORTS_ENDPOINT || '/profile/reports';
            const { data } = await api.post(endpoint, { userId, targetType: 'user', reason, details });
            return data;
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            console.error('[REPORT_USER] Failed:', err);
            throw new Error(err.response?.data?.message || err.message || 'Failed to submit report');
        }
    }
}

export default ReportService;