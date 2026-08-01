'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import MessagingAPI, {
    ConversationResponse,
    MessageResponse,
} from '@/lib/api/messaging.service';
import { initializeSocket } from '@/core/realtime/socket.client'; // aapka existing socket client

// ==================== TYPES ====================

interface SendMessageOptions {
    replyToMessageId?: string;
    metadata?: Record<string, unknown>;
}

interface UseMessagingReturn {
    // State
    conversations: ConversationResponse[];
    activeConversationId: string | null;
    messages: MessageResponse[];
    isLoadingConversations: boolean;
    isLoadingMessages: boolean;
    isSending: boolean;
    hasMoreMessages: boolean;
    typingUsers: Record<string, boolean>; // conversationId → isTyping

    // Actions
    setActiveConversation: (conversationId: string) => void;
    sendMessage: (text: string, type?: 'text' | 'voice' | 'image', options?: SendMessageOptions) => Promise<void>;
    editMessage: (messageId: string, newText: string) => Promise<void>;
    loadMoreMessages: () => Promise<void>;
    toggleReaction: (messageId: string, emoji: string) => Promise<void>;
    togglePin: (messageId: string) => Promise<void>;
    deleteMessage: (messageId: string) => Promise<void>;
    markSeen: (conversationId: string) => Promise<void>;
}

// ==================== HOOK ====================

export function useMessaging(currentUserId: string): UseMessagingReturn {
    // ── State ────────────────────────────────────────────────────────────────
    const [conversations, setConversations] = useState<ConversationResponse[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<MessageResponse[]>([]);
    const [isLoadingConversations, setIsLoadingConversations] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(false);
    const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});

    const cursorRef = useRef<string | null>(null);      // cursor for pagination
    const socketRef = useRef<Socket | null>(null);
    const activeConvRef = useRef<string | null>(null);  // ref for socket callbacks
    const messagesRef = useRef<MessageResponse[]>([]);  // always-fresh snapshot for reply lookups

    // keep refs in sync
    useEffect(() => {
        activeConvRef.current = activeConversationId;
    }, [activeConversationId]);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    // ── 1. CONVERSATIONS FETCH ───────────────────────────────────────────────

    const fetchConversations = useCallback(async () => {
        setIsLoadingConversations(true);
        try {
            const convs = await MessagingAPI.getConversations();
            setConversations(convs);
        } catch (err) {
            console.error('[useMessaging] getConversations failed:', err);
        } finally {
            setIsLoadingConversations(false);
        }
    }, []);

    useEffect(() => {
        if (currentUserId) fetchConversations();
    }, [currentUserId, fetchConversations]);

    // ── 2. MESSAGES FETCH when active conversation changes ───────────────────

    const fetchMessages = useCallback(async (conversationId: string) => {
        setIsLoadingMessages(true);
        setMessages([]);
        cursorRef.current = null;

        try {
            const result = await MessagingAPI.getMessageHistory(conversationId, { limit: 30 });
            // Backend returns newest-first; we reverse for chat display (oldest at top)
            setMessages([...result.messages].reverse());
            setHasMoreMessages(result.hasMore);
            cursorRef.current = result.nextCursor;
        } catch (err) {
            console.error('[useMessaging] getMessageHistory failed:', err);
        } finally {
            setIsLoadingMessages(false);
        }
    }, []);

    const setActiveConversation = useCallback(async (conversationId: string) => {
        if (conversationId === activeConversationId) return;

        // Leave old room, join new room
        if (socketRef.current) {
            if (activeConvRef.current) {
                socketRef.current.emit('conversation:leave', { conversationId: activeConvRef.current });
            }
            socketRef.current.emit('conversation:join', { conversationId });
        }

        setActiveConversationId(conversationId);
        await fetchMessages(conversationId);

        // Mark seen
        try {
            await MessagingAPI.markConversationSeen(conversationId);
            // Update local unread count to 0
            setConversations(prev =>
                prev.map(c => c.conversationId === conversationId ? { ...c, unreadCount: 0 } : c)
            );
        } catch (e) {
            // Non-critical
        }
    }, [activeConversationId, fetchMessages]);

    // ── 3. LOAD MORE (pagination) ────────────────────────────────────────────

    const loadMoreMessages = useCallback(async () => {
        if (!activeConversationId || !hasMoreMessages || !cursorRef.current) return;

        try {
            const result = await MessagingAPI.getMessageHistory(activeConversationId, {
                cursor: cursorRef.current,
                limit: 30,
            });
            // Prepend older messages at the top
            setMessages(prev => [...result.messages.reverse(), ...prev]);
            setHasMoreMessages(result.hasMore);
            cursorRef.current = result.nextCursor;
        } catch (err) {
            console.error('[useMessaging] loadMoreMessages failed:', err);
        }
    }, [activeConversationId, hasMoreMessages]);

    // ── 4. SEND MESSAGE (supports reply + rich metadata) ─────────────────────

    const sendMessage = useCallback(async (
        text: string,
        type: 'text' | 'voice' | 'image' = 'text',
        options?: SendMessageOptions
    ) => {
        if (!activeConversationId || !text.trim()) return;

        // Build a lightweight snapshot of the message being replied to (if any)
        const replyToMsg = options?.replyToMessageId
            ? messagesRef.current.find(m => m.messageId === options.replyToMessageId)
            : undefined;

        // Optimistic message (shows immediately)
        const tempId = `temp_${Date.now()}`;
        const optimisticMsg: MessageResponse = {
            messageId: tempId,
            conversationId: activeConversationId,
            senderId: currentUserId,
            type,
            text,
            status: 'sending',
            reactions: [],
            isPinned: false,
            isEdited: false,
            metadata: options?.metadata,
            replyTo: replyToMsg
                ? {
                    messageId: replyToMsg.messageId,
                    text: replyToMsg.text,
                    senderId: replyToMsg.senderId,
                    type: replyToMsg.type,
                }
                : null,
            createdAt: new Date().toISOString(),
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setIsSending(true);

        try {
            const sentMsg = await MessagingAPI.sendMessage({
                conversationId: activeConversationId,
                text,
                type,
                replyToMessageId: options?.replyToMessageId,
                metadata: options?.metadata,
            });

            // Replace optimistic message with real one from backend
            setMessages(prev =>
                prev.map(m => m.messageId === tempId ? sentMsg : m)
            );

            // Update conversation's lastMessage in sidebar
            setConversations(prev =>
                prev.map(c =>
                    c.conversationId === activeConversationId
                        ? {
                            ...c,
                            lastMessage: {
                                messageId: sentMsg.messageId,
                                text: sentMsg.text || '',
                                type: sentMsg.type,
                                senderId: sentMsg.senderId,
                                sentAt: sentMsg.createdAt,
                            },
                        }
                        : c
                )
            );
        } catch (err) {
            console.error('[useMessaging] sendMessage failed:', err);
            // Mark optimistic message as failed
            setMessages(prev =>
                prev.map(m => m.messageId === tempId ? { ...m, status: 'failed' } : m)
            );
        } finally {
            setIsSending(false);
        }
    }, [activeConversationId, currentUserId]);

    // ── 5. EDIT MESSAGE ───────────────────────────────────────────────────────

    const editMessage = useCallback(async (messageId: string, newText: string) => {
        if (!newText.trim()) return;

        const snapshot = messagesRef.current;

        // Optimistic update
        setMessages(prev =>
            prev.map(m => m.messageId === messageId ? { ...m, text: newText, isEdited: true } : m)
        );

        try {
            const updated = await MessagingAPI.editMessage(messageId, newText);
            setMessages(prev => prev.map(m => m.messageId === messageId ? updated : m));

            // Keep sidebar preview in sync if this was the last message
            setConversations(prev =>
                prev.map(c =>
                    c.lastMessage?.messageId === messageId
                        ? { ...c, lastMessage: { ...c.lastMessage!, text: updated.text || '' } }
                        : c
                )
            );
        } catch (err) {
            console.error('[useMessaging] editMessage failed:', err);
            // Revert on failure
            setMessages(snapshot);
        }
    }, []);

    // ── 6. REACTIONS ─────────────────────────────────────────────────────────

    const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
        try {
            const updated = await MessagingAPI.toggleReaction(messageId, emoji);
            setMessages(prev => prev.map(m => m.messageId === messageId ? updated : m));
        } catch (err) {
            console.error('[useMessaging] toggleReaction failed:', err);
        }
    }, []);

    // ── 7. PIN ───────────────────────────────────────────────────────────────

    const togglePin = useCallback(async (messageId: string) => {
        try {
            const updated = await MessagingAPI.togglePin(messageId);
            setMessages(prev => prev.map(m => m.messageId === messageId ? updated : m));
        } catch (err) {
            console.error('[useMessaging] togglePin failed:', err);
        }
    }, []);

    // ── 8. DELETE ────────────────────────────────────────────────────────────

    const deleteMessage = useCallback(async (messageId: string) => {
        const snapshot = messagesRef.current;
        // Optimistic removal
        setMessages(prev => prev.filter(m => m.messageId !== messageId));
        try {
            await MessagingAPI.deleteMessage(messageId);
        } catch (err) {
            console.error('[useMessaging] deleteMessage failed:', err);
            // Revert on failure
            setMessages(snapshot);
        }
    }, []);

    // ── 9. MARK SEEN ─────────────────────────────────────────────────────────

    const markSeen = useCallback(async (conversationId: string) => {
        try {
            await MessagingAPI.markConversationSeen(conversationId);
        } catch (err) {
            console.error('[useMessaging] markSeen failed:', err);
        }
    }, []);

    // ── 10. SOCKET.IO REAL-TIME EVENTS ───────────────────────────────────────

    useEffect(() => {
        if (!currentUserId) return;

        let socket: Socket;
        try {
            socket = initializeSocket(); // aapka existing socket client
            socketRef.current = socket;
        } catch (e) {
            console.error('[useMessaging] Socket init failed:', e);
            return;
        }

        // ── EVENT: New message received ──────────────────────────────────────
        // Server emits: { messageId, conversationId, senderId, type, text, mediaUrl, status, createdAt, replyTo?, metadata? }
        const onNewMessage = (payload: any) => {
            const { conversationId } = payload;

            // Agar yeh active conversation hai, message add karo
            if (conversationId === activeConvRef.current) {
                const newMsg: MessageResponse = {
                    ...payload,
                    reactions: payload.reactions || [],
                    isPinned: payload.isPinned || false,
                    isEdited: payload.isEdited || false,
                };
                setMessages(prev => {
                    // Duplicate check
                    if (prev.some(m => m.messageId === payload.messageId)) return prev;
                    return [...prev, newMsg];
                });

                // Auto-mark seen since user is looking at this conversation
                MessagingAPI.markConversationSeen(conversationId).catch(() => { });
            }

            // Sidebar mein lastMessage aur unread count update karo
            setConversations(prev =>
                prev.map(c => {
                    if (c.conversationId !== conversationId) return c;
                    const isActive = conversationId === activeConvRef.current;
                    return {
                        ...c,
                        lastMessage: {
                            messageId: payload.messageId,
                            text: payload.text || '',
                            type: payload.type,
                            senderId: payload.senderId,
                            sentAt: payload.createdAt,
                        },
                        // Agar active conversation hai toh unread count mat badhao
                        unreadCount: isActive ? 0 : (c.unreadCount || 0) + 1,
                    };
                })
            );
        };

        // ── EVENT: Message status update (sent → delivered → seen) ──────────
        // Server emits: { messageId, conversationId, status, updatedAt }
        const onMessageStatus = (payload: any) => {
            setMessages(prev =>
                prev.map(m =>
                    m.messageId === payload.messageId
                        ? { ...m, status: payload.status }
                        : m
                )
            );
        };

        // ── EVENT: Conversation seen by other user ───────────────────────────
        // Server emits: { conversationId, seenBy, seenAt }
        const onConversationSeen = (payload: any) => {
            if (payload.conversationId === activeConvRef.current && payload.seenBy !== currentUserId) {
                // Update all sent/delivered messages to seen
                setMessages(prev =>
                    prev.map(m =>
                        m.senderId === currentUserId && m.status !== 'seen'
                            ? { ...m, status: 'seen', seenAt: payload.seenAt }
                            : m
                    )
                );
            }
        };

        // ── EVENT: Message reaction update ──────────────────────────────────
        // Server emits: { messageId, reactions: [{emoji, count}] }
        const onMessageReaction = (payload: any) => {
            setMessages(prev =>
                prev.map(m =>
                    m.messageId === payload.messageId
                        ? {
                            ...m,
                            reactions: payload.reactions.map((r: any) => ({
                                emoji: r.emoji,
                                count: r.count,
                                reactedByMe: false, // backend se aata hai, local state se update hoga
                            })),
                        }
                        : m
                )
            );
        };

        // ── EVENT: Message deleted ───────────────────────────────────────────
        const onMessageDeleted = (payload: any) => {
            setMessages(prev => prev.filter(m => m.messageId !== payload.messageId));
        };

        // ── EVENT: Message edited ────────────────────────────────────────────
        // Server emits: { messageId, conversationId, text, editedAt }
        const onMessageEdited = (payload: any) => {
            setMessages(prev =>
                prev.map(m =>
                    m.messageId === payload.messageId
                        ? { ...m, text: payload.text, isEdited: true, editedAt: payload.editedAt }
                        : m
                )
            );
        };

        // ── EVENT: Typing indicator ──────────────────────────────────────────
        // Server emits: { conversationId, userId, isTyping }
        const onTyping = (payload: any) => {
            if (payload.userId === currentUserId) return;
            setTypingUsers(prev => ({
                ...prev,
                [payload.conversationId]: payload.isTyping,
            }));
        };

        // Register all socket listeners
        socket.on('message:new', onNewMessage);
        socket.on('message:status', onMessageStatus);
        socket.on('conversation:seen', onConversationSeen);
        socket.on('message:reaction', onMessageReaction);
        socket.on('message:deleted', onMessageDeleted);
        socket.on('message:edited', onMessageEdited);
        socket.on('user:typing', onTyping);

        return () => {
            socket.off('message:new', onNewMessage);
            socket.off('message:status', onMessageStatus);
            socket.off('conversation:seen', onConversationSeen);
            socket.off('message:reaction', onMessageReaction);
            socket.off('message:deleted', onMessageDeleted);
            socket.off('message:edited', onMessageEdited);
            socket.off('user:typing', onTyping);
        };
    }, [currentUserId]); // Only currentUserId dependency - socket listeners are stable

    // ── RETURN ───────────────────────────────────────────────────────────────

    return {
        conversations,
        activeConversationId,
        messages,
        isLoadingConversations,
        isLoadingMessages,
        isSending,
        hasMoreMessages,
        typingUsers,
        setActiveConversation,
        sendMessage,
        editMessage,
        loadMoreMessages,
        toggleReaction,
        togglePin,
        deleteMessage,
        markSeen,
    };
}