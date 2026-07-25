import config from "@/config/env.config";
import api from "./api.intance";

class ReportService {
    /**
     * ⚠️ BACKEND NOTE: /api/v1/reports route abhi thronet-server mein nahi hai.
     * Isko banane ke liye Profile module mein ek naya:
     *   - Report.model.ts   (postId, reporterId, reason, status, createdAt)
     *   - report.controller.ts (POST /reports)
     *   - report.routes.ts
     * add karna hoga. Filhaal ye function call fail hoga (404) —
     * frontend usko gracefully handle karta hai (soft-fail).
     */
    static async reportPost(postId: string, reason: string) {
        try {
            const { data } = await api.post(
                `${config?.NEXT_PUBLIC_REPORTS_ENDPOINT || process.env.NEXT_PUBLIC_REPORTS_ENDPOINT || '/reports'}`,
                { postId, reason }
            );
            return data;
        } catch (error: any) {
            console.error('[REPORT_POST] Failed:', error);
            throw new Error(error.response?.data?.message || 'Failed to submit report');
        }
    }
}

export default ReportService;