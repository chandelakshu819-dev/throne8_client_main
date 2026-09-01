'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import ConnectionService from '@/lib/api/connection.service';
import { useSocket } from '@/core/realtime/useSocket';

interface ConnectionRequestPayload {
    requestId: string;
    fromUserId: string;
    fromUserName: string;
    fromUserPhoto?: string;
    message?: string;
    timestamp: string;
}

export function useConnectionSocket() {
    const { socket, isConnected } = useSocket();
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [latestRequest, setLatestRequest] = useState<ConnectionRequestPayload | null>(null);

    // // ✅ Fetch initial pending count on mount
    // useEffect(() => {
    //     const fetchInitialCount = async () => {
    //         if (!user?.userId) return;

    //         try {
    //             const response = await ConnectionService.getIncomingRequests(user.userId);
    //             const pendingCount = response.data?.length || 0;
    //             setUnreadCount(pendingCount);
    //         } catch (error) {
    //             console.error('❌ [Socket] Failed to fetch initial count:', error);
    //         }
    //     };

    //     fetchInitialCount();
    // }, [user]);

        // ✅ REMOVED: duplicate fetch — useConnectionRequests already fetches
    // this same data via fetchIncomingRequests(). unreadCount yahan kabhi
    // consume nahi hota tha, sirf ek extra API call kar raha tha.


    useEffect(() => {
        if (!socket || !isConnected) return;

        // ✅ Listen for new connection requests
        socket.on('connection:request:received', (data: ConnectionRequestPayload) => {

            setLatestRequest(data);

            // ✅ Show browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('New Connection Request', {
                    body: `${data.fromUserName} wants to connect`,
                    icon: data.fromUserPhoto || '/default-avatar.png',
                });
            }
        });

        // ✅ Listen for accepted requests
        socket.on('connection:request:accepted', (data) => {

            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Connection Accepted', {
                    body: `${data.acceptedByUserName} accepted your request`,
                    icon: data.acceptedByUserPhoto || '/default-avatar.png',
                });
            }
        });

        // ✅ Listen for unread count updates
        socket.on('notification:unread:count', (data: { count: number }) => {
            setUnreadCount(data.count);
        });

        return () => {
            socket.off('connection:request:received');
            socket.off('connection:request:accepted');
        };
    }, [socket, isConnected]);

    const decrementCount = () => {
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const resetCount = () => {
        setUnreadCount(0);
    };

    return {
        latestRequest,
        isConnected,
    };
}