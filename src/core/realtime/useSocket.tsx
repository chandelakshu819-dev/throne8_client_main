// src/core/realtime/useSocket.tsx
'use client';

import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { initializeSocket, disconnectSocket } from './socket.client';
import TokenStorage from '../../lib/store/token.storage';

export interface RealtimeNotification {
    notificationId: string;
    type: string;
    title?: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

export function useSocket() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // ✅ NEW: built-in notification state — any component calling useSocket()
    // gets live unread-count + latest-notification updates for free, instead
    // of every screen wiring its own 'notification:new' listener.
    const [unreadCount, setUnreadCount] = useState(0);
    const [latestNotification, setLatestNotification] = useState<RealtimeNotification | null>(null);

    useEffect(() => {
        if (!TokenStorage.isAuthenticated()) {
            console.warn('⚠️ User not authenticated, skipping socket');
            return;
        }

        try {
            const socketInstance = initializeSocket();
            setSocket(socketInstance);

            socketInstance.on('connect', () => {
                setIsConnected(true);
                console.log('✅ [useSocket] Connected');
                // Ask the server for the current unread count right away —
                // backend's notificationHandler already answers this event.
                socketInstance.emit('notification:get:unread:count');
            });

            socketInstance.on('disconnect', () => {
                setIsConnected(false);
                console.log('❌ [useSocket] Disconnected');
            });

            // ✅ NEW: fired by Mentorship + global notification services alike
            // (booking requests, session started/confirmed, posts, follows, etc.)
            socketInstance.on('notification:new', (payload: RealtimeNotification) => {
                console.log('🔔 [useSocket] New notification:', payload);
                setLatestNotification(payload);
                setUnreadCount((prev) => prev + 1);
            });

            // ✅ NEW: server pushes the authoritative count after any read/markAllRead
            socketInstance.on('notification:unread:count', (data: { count: number }) => {
                setUnreadCount(data.count);
            });

            return () => {
                socketInstance.off('connect');
                socketInstance.off('disconnect');
                socketInstance.off('notification:new');
                socketInstance.off('notification:unread:count');
            };
        } catch (error) {
            console.error('❌ [useSocket] Failed to initialize:', error);
        }
    }, []);

    return { socket, isConnected, unreadCount, latestNotification };
}