/**
 * messaging.api.ts
 *
 * Messaging ke liye dedicated API service.
 * Aapke existing `api` axios instance ko use karta hai (auth interceptor included).
 *
 * Usage:
 *   import MessagingAPI from '@/lib/api/messaging.api';
 */

import config from "@/config/env.config";
import api from "./api.intance";

// ==================== TYPES ====================

export interface ConversationResponse {
    conversationId: string;
    type: 'direct' | 'group';
    members: string[];
    lastMessage?: {
        messageId: string;
        text: string;
        type: string;
        senderId: string;
        sentAt: string;
    };
    unreadCount: number;
    groupName?: string;
    groupAvatar?: string;
    isActive: boolean;
    createdAt: string;
}

// Snapshot of the message being replied to — stored on the reply message itself
export interface ReplySnapshot {
    messageId: string;
    text?: string;
    senderId: string;
    type: string;
}

// Rich preview data for a shared post (attached to metadata.postPreview)
export interface PostPreview {
    postId: string;
    title?: string;
    image?: string;
    authorName?: string;
    authorAvatar?: string;
}

export interface MessageResponse {
    messageId: string;
    conversationId: string;
    senderId: string;
    type: 'text' | 'voice' | 'image' | 'system_reminder' | 'system';
    text?: string;
    mediaUrl?: string;
    mediaDuration?: number;
    status: 'sending' | 'sent' | 'delivered' | 'seen' | 'failed';
    reactions: { emoji: string; count: number; reactedByMe: boolean }[];
    isPinned: boolean;
    isEdited?: boolean;
    editedAt?: string;
    replyTo?: ReplySnapshot | null;
    metadata?: Record<string, unknown> & { postPreview?: PostPreview };
    createdAt: string;
    deliveredAt?: string;
    seenAt?: string;
}

export interface PaginatedMessages {
    messages: MessageResponse[];
    nextCursor: string | null;
    hasMore: boolean;
}

// ==================== API CLASS ====================

class MessagingAPIService {

    // ── CONVERSATIONS ─────────────────────────────────────────────────────────

    /**
     * Sabhi conversations fetch karo current user ke liye.
     */
    async getConversations(): Promise<ConversationResponse[]> {
        const { data } = await api.get(`${config.NEXT_PUBLIC_MESSAGES_CONVERSATIONS_ENDPONT || process.env.NEXT_PUBLIC_MESSAGES_CONVERSATIONS_ENDPONT}`);
        return data.data; // ResponseUtil.success wraps in { data: ... }
    }

    /**
     * Kisi user ke saath direct conversation get ya create karo.
     * Body: { targetUserId }
     */
    async getOrCreateDirectConversation(targetUserId: string): Promise<ConversationResponse> {

        const { data } = await api.post(`${config.NEXT_PUBLIC_MESSAGES_DIRECT_ENDPOINT || process.env.NEXT_PUBLIC_MESSAGES_DIRECT_ENDPOINT}`, { targetUserId });
        return data.data;
    }

    /**
     * Conversation ke sabhi messages seen mark karo.
     */
    async markConversationSeen(conversationId: string): Promise<void> {
        await api.patch(`${config.NEXT_PUBLIC_MESSAGES_CONVERSATIONS_ENDPOINT || process.env.NEXT_PUBLIC_MESSAGES_CONVERSATIONS_ENDPOINT}/${conversationId}/seen`);
    }

    // ── MESSAGES ──────────────────────────────────────────────────────────────

    /**
     * Message bhejo. `replyToMessageId` de kar reply banao, `metadata` mein
     * postPreview jaisa rich data bhej sakte ho (e.g. jab post share ho raha ho).
     */
    async sendMessage(payload: {
        conversationId: string;
        text?: string;
        type?: 'text' | 'voice' | 'image';
        mediaUrl?: string;
        mediaDuration?: number;
        replyToMessageId?: string;
        metadata?: Record<string, unknown>;
    }): Promise<MessageResponse> {
        const { data } = await api.post(`${config.NEXT_PUBLIC_MESSAGES_MESSAGES_ENDPOINT || process.env.NEXT_PUBLIC_MESSAGES_MESSAGES_ENDPOINT}`, payload);
        return data.data;
    }

    /**
     * Apna hi message edit karo (text-only). Backend isEdited/editedAt set karega.
     */
    async editMessage(messageId: string, text: string): Promise<MessageResponse> {
        const { data } = await api.patch(
            `${config.NEXT_PUBLIC_MESSAGES_MESSAGES_ENDPOINT || process.env.NEXT_PUBLIC_MESSAGES_MESSAGES_ENDPOINT}/${messageId}`,
            { text }
        );
        return data.data;
    }

    /**
     * Paginated message history fetch karo (cursor-based).
     * Query: ?cursor=ISO_TIMESTAMP&limit=30
     */
    async getMessageHistory(
        conversationId: string,
        options?: { cursor?: string; limit?: number }
    ): Promise<PaginatedMessages> {
        const { data } = await api.get(
            `${config.NEXT_PUBLIC_MESSAGES_CONVERSATIONS_ENDPOINT || process.env.NEXT_PUBLIC_MESSAGES_CONVERSATIONS_ENDPOINT}/${conversationId}/messages`,
            { params: options }
        );
        return data.data;
    }

    /**
     * Messages mein search karo.search
     */
    async searchMessages(
        conversationId: string,
        keyword: string,
        options?: { limit?: number; page?: number }
    ): Promise<{ messages: MessageResponse[]; total: number; page: number }> {
        const { data } = await api.get(
            `${config.NEXT_PUBLIC_MESSAGES_CONVERSATIONS_ENDPONT || process.env.NEXT_PUBLIC_MESSAGES_CONVERSATIONS_ENDPONT}/${conversationId}/messages/search`,
            { params: { keyword, ...options } }
        );
        return data.data;
    }

    /**
     * Pinned messages fetch karo.pinned
     */
    async getPinnedMessages(conversationId: string): Promise<MessageResponse[]> {
        const { data } = await api.get(
            `${config.NEXT_PUBLIC_MESSAGES_CONVERSATIONS_ENDPOINT || process.env.NEXT_PUBLIC_MESSAGES_CONVERSATIONS_ENDPOINT}/${conversationId}/messages/pinned`
        );
        return data.data;
    }

    /**
     * Message pin/unpin toggle karo.
     */
    async togglePin(messageId: string): Promise<MessageResponse> {
        const { data } = await api.patch(`${config.NEXT_PUBLIC_MESSAGES_MESSAGES_ENDPOINT || process.env.NEXT_PUBLIC_MESSAGES_MESSAGES_ENDPOINT}/${messageId}/pin`);
        return data.data;
    }

    /**
     * Emoji reaction toggle karo.
     */
    async toggleReaction(messageId: string, emoji: string): Promise<MessageResponse> {
        const { data } = await api.post(`${config.NEXT_PUBLIC_MESSAGES_REACT_ENDPOINT || process.env.NEXT_PUBLIC_MESSAGES_REACT_ENDPOINT}`, { messageId, emoji });
        return data.data;
    }

    /**
     * Message soft delete karo.
     */
    async deleteMessage(messageId: string): Promise<void> {
        await api.delete(`${config.NEXT_PUBLIC_MESSAGES_MESSAGES_ENDPOINT || process.env.NEXT_PUBLIC_MESSAGES_MESSAGES_ENDPOINT}/${messageId}`);
    }
}

const MessagingAPI = new MessagingAPIService();
export default MessagingAPI;