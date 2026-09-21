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

export interface SessionStartedEvent {
    sessionId: string;
    bookingId: string;
    title: string;
    startedAt: string;
    scheduledAt: string;
    meetingUrl: string | null;
    roomId?: string;
}

export interface SessionEndedEvent {
    sessionId: string;
    bookingId?: string;
    endedAt: string;
    endedBy?: string;
    status?: string; // e.g. 'COMPLETED'
}

export interface SessionReminderEvent {
    sessionId: string;
    bookingId?: string;
    title?: string;
    mentorName?: string;
    scheduledAt: string;
    minutesLeft: number;
}

export function useSocket() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // ✅ NEW: built-in notification state — any component calling useSocket()
    // gets live unread-count + latest-notification updates for free, instead
    // of every screen wiring its own 'notification:new' listener.
    const [unreadCount, setUnreadCount] = useState(0);
    const [latestNotification, setLatestNotification] = useState<RealtimeNotification | null>(null);
    const [sessionStarted, setSessionStarted] = useState<SessionStartedEvent | null>(null);
    const [sessionEnded, setSessionEnded] = useState<SessionEndedEvent | null>(null);
    const [sessionReminder, setSessionReminder] = useState<SessionReminderEvent | null>(null);



    useEffect(() => {
        if (!TokenStorage.isAuthenticated()) {
            console.warn('⚠️ User not authenticated, skipping socket');
            return;
        }

        try {
            const socketInstance = initializeSocket();
            setSocket(socketInstance);

            // ── Named handlers so cleanup only removes THIS hook's own
            // listener, not every listener registered on the shared/singleton
            // socket by other components also calling useSocket(). Calling
            // `.off('eventName')` with no function reference wipes out ALL
            // listeners for that event across the whole app — this was
            // silently killing other mounted components' listeners whenever
            // any single instance of this hook unmounted (e.g. on navigation).
            const handleConnect = () => {
                setIsConnected(true);
                console.log('✅ [useSocket] Connected');
                socketInstance.emit('notification:get:unread:count');
            };

            const handleDisconnect = () => {
                setIsConnected(false);
                console.log('❌ [useSocket] Disconnected');
            };

            const handleNotificationNew = (payload: RealtimeNotification) => {
                console.log('🔔 [useSocket] New notification:', payload);
                setLatestNotification(payload);
                setUnreadCount((prev) => prev + 1);
            };

            const handleUnreadCount = (data: { count: number }) => {
                setUnreadCount(data.count);
            };

            const handleSessionStarted = (payload: SessionStartedEvent) => {
                console.log('🟢 [useSocket] Session started:', payload);
                setSessionEnded(null);
                setSessionStarted(payload);
            };

            const handleSessionEnded = (payload: SessionEndedEvent) => {
                console.log('🔴 [useSocket] Session ended:', payload);
                setSessionEnded(payload);
                // Same session ka "live" state clear karo
                setSessionStarted((prev) =>
                    prev && prev.sessionId !== payload.sessionId ? prev : null
                );
            };

            const handleSessionReminder = (payload: SessionReminderEvent) => {
                console.log('⏰ [useSocket] Session reminder:', payload);
                setSessionReminder(payload);
            };

            socketInstance.on('connect', handleConnect);
            socketInstance.on('disconnect', handleDisconnect);
            socketInstance.on('notification:new', handleNotificationNew);
            socketInstance.on('notification:unread:count', handleUnreadCount);
            socketInstance.on('session:started', handleSessionStarted);
            socketInstance.on('session:ended', handleSessionEnded);
            socketInstance.on('session:reminder', handleSessionReminder);



            // If the socket is ALREADY connected by the time this effect runs
            // (e.g. another component initialized it earlier), 'connect' will
            // never fire again for us — sync isConnected immediately instead
            // of waiting on an event that already happened.
            if (socketInstance.connected) {
                handleConnect();
            }

            return () => {
                socketInstance.off('connect', handleConnect);
                socketInstance.off('disconnect', handleDisconnect);
                socketInstance.off('notification:new', handleNotificationNew);
                socketInstance.off('notification:unread:count', handleUnreadCount);
                socketInstance.off('session:started', handleSessionStarted);
                socketInstance.off('session:ended', handleSessionEnded);
                socketInstance.off('session:reminder', handleSessionReminder);
            };
        } catch (error) {
            console.error('❌ [useSocket] Failed to initialize:', error);
        }
    }, []);


    return {
        socket,
        isConnected,
        unreadCount,
        latestNotification,
        sessionStarted,
        sessionEnded,
        sessionReminder,
    };
    
}