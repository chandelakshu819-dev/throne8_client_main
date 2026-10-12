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
    | "post_reposted"
    | "connection_request"
    | "connection_accepted"
    | "profile_viewed"
    | "pymk_suggestion"
    | "connection_birthday"
    | "comment_liked"
    | "comment_replied"
    | string;
    entityId: string;
    entityIds?: string[];            // populated for pymk_suggestion (all suggested userIds)
    entityType?: "post" | "connection" | "user" | "comment" | string;
    message: string;
    isRead: boolean;
    createdAt: string;
    actionUrl?: string;
    data?: any;
    // UI helpers
    engagement?: "viral" | "hot" | "trending";
    reactions?: number;
}

export interface Stats {
    unreadCount: number;
    todayCount: number;
    engagementRate: number;
}
