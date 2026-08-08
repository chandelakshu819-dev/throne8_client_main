// src/core/realtime/socket.client.ts
import { io, Socket } from 'socket.io-client';
import TokenStorage from '@/lib/store/token.storage';

import config from '@/config/env.config';

let socket: Socket | null = null;

export const initializeSocket = (): Socket => {
    if (socket?.connected) {
        console.log('✅ Socket already connected');
        return socket;
    }

    const token = TokenStorage.getAccessToken();

    // ✅ ADD: Token validation
    if (!token) {
        console.error('❌ No token available for socket');
        throw new Error('No authentication token available');
    }

    console.log('🔐 Connecting socket with token:', token.substring(0, 20) + '...'); // ✅ Debug log
    console.log('🔐 [Socket] Token being sent:', token.substring(0, 30) + '...'); // ✅ ADD

    socket = io( config?.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL, {
        auth: {
            token: token 
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    // ✅ ADD: Reconnect with fresh token
    socket.io.on('reconnect_attempt', () => {
        const freshToken = TokenStorage.getAccessToken();
        if (freshToken) {
            socket!.auth = { token: freshToken };
        }
    });

    socket.on('connect', () => {
        console.log('✅ Socket connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error.message);
    });

    return socket;
};

export const getSocket = (): Socket | null => {
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
        console.log('🔌 Socket disconnected manually');
    }
};

export { socket };

