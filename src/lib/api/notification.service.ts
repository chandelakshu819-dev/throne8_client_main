import api from "./api.intance";
import config from '@/config/env.config';

class NotificationService {

    static async getNotifications(params?: { page?: number; limit?: number }): Promise<any> {
        const { data } = await api.get(`${config.NEXT_PUBLIC_NOTIFICATIONS_ENDPOINT || process.env.NEXT_PUBLIC_NOTIFICATIONS_ENDPOINT}`, { params });
        console.log('📩 [GET_NOTIFICATIONS] Notifications fetched:', data.data);
        return data;
    }

    static async markNotificationRead(notificationId: string): Promise<any> {
        const { data } = await api.patch(`${config.NEXT_PUBLIC_NOTIFICATIONS_ENDPOINT || process.env.NEXT_PUBLIC_NOTIFICATIONS_ENDPOINT}/${notificationId}/read`);
        return data;
    }

    static async markAllNotificationsRead(): Promise<any> {
        const { data } = await api.patch(`${config.NEXT_PUBLIC_NOTIFICATIONS_ALL_MARKED_READ_ENDPOINT || process.env.NEXT_PUBLIC_NOTIFICATIONS_ALL_MARKED_READ_ENDPOINT}`);
        return data;
    }

    static async deleteNotification(notificationId: string): Promise<any> {
        const { data } = await api.delete(`${config.NEXT_PUBLIC_NOTIFICATIONS_ENDPOINT || process.env.NEXT_PUBLIC_NOTIFICATIONS_ENDPOINT}/${notificationId}`);
        return data;
    }

    // ============================================================
    // ✅ NEW: MENTORSHIP-SCOPED NOTIFICATIONS
    // Hits /api/v1/mentorship/notifications — a separate Notification
    // model/collection (booking, session, payment, account, system,
    // promotion, reminder, alert) from the general/profile notifications
    // above (which include profile-view/like events). Hardcoded path
    // (not env-driven) so it can't accidentally resolve to the general
    // endpoint. Confirmed against src/Mentorship/routers/notification.routes.ts —
    // that router uses PUT (not PATCH) and `/read-all` (not `/mark-all-read`).
    // ============================================================

       // ✅ NEW — maps backend's raw shape (id/status.read/exact type enum) into
    // the shape NotificationPage.tsx + DashboardLayout.tsx actually expect
    // (_id/isRead/one of "booking"|"review"|"payment"|"message"|"system").
    // Without this, click-to-mark-read silently no-ops (item._id was always
    // undefined) and the unread badge never goes down (item.isRead was
    // always undefined too).
    private static mapNotificationType(rawType: string): "booking" | "review" | "payment" | "message" | "system" {
        if (!rawType) return "system";
        if (rawType.includes("booking") || rawType.includes("session") || rawType.includes("waitlist")) return "booking";
        if (rawType.includes("review")) return "review";
        if (rawType.includes("payment") || rawType.includes("refund") || rawType.includes("package") || rawType.includes("credit")) return "payment";
        if (rawType.includes("query")) return "message";
        return "system";
    }

    private static normalizeNotificationDoc(raw: any): any {
        return {
            _id: raw.id || raw.notificationId || raw._id,
            notificationId: raw.notificationId || raw.id || raw._id,
            type: NotificationService.mapNotificationType(raw.type),
            title: raw.title,
            message: raw.message,
            createdAt: raw.createdAt,
            isRead: raw.status?.read ?? raw.isRead ?? false,
        };
    }

    static async getMentorshipNotifications(params?: { page?: number; limit?: number; unreadOnly?: boolean }): Promise<any> {
        try {
            const { data } = await api.get('/mentorship/notifications', { params });
            console.log('📩 [GET_MENTORSHIP_NOTIFICATIONS] Fetched:', data.data);

            const rawList = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
            const normalized = rawList.map(NotificationService.normalizeNotificationDoc);

            return { ...data, data: normalized };
        } catch (error: any) {
            console.error('❌ [GET_MENTORSHIP_NOTIFICATIONS] Failed:', error);
            throw new Error('Failed to fetch mentorship notifications.');
        }
    }

    static async markMentorshipNotificationRead(notificationId: string): Promise<any> {
        try {
            // ✅ Backend route is PUT /:id/read, not PATCH
            const { data } = await api.put(`/mentorship/notifications/${notificationId}/read`);
            return data;
        } catch (error: any) {
            console.error('❌ [MARK_MENTORSHIP_NOTIFICATION_READ] Failed:', error);
            throw new Error('Failed to mark notification as read.');
        }
    }

    static async markAllMentorshipNotificationsRead(): Promise<any> {
        try {
            // ✅ Backend route is PUT /read-all, not PATCH /mark-all-read
            const { data } = await api.put('/mentorship/notifications/read-all');
            return data;
        } catch (error: any) {
            console.error('❌ [MARK_ALL_MENTORSHIP_NOTIFICATIONS_READ] Failed:', error);
            throw new Error('Failed to mark all notifications as read.');
        }
    }
}

export default NotificationService;