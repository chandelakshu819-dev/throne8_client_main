// ─── Types ──────────────────────────────────────────────────────────────────

export interface Notification {
    notificationId: string;
    senderId: string;
    senderName: string;
    senderPhoto?: string;
    type:
    | "post_created"
    | "post_liked"
    | "post_commented"
    | "connection_request"
    | "connection_accepted"
    | "profile_viewed";
    entityId: string;
    entityType: "post" | "connection" | "user";
    message: string;
    isRead: boolean;
    createdAt: string;
    // UI helpers
    engagement?: "viral" | "hot" | "trending";
    reactions?: number;
}

export interface Stats {
    unreadCount: number;
    todayCount: number;
    engagementRate: number;
}
