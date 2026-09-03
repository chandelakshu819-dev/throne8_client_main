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

    if (!token) {
        console.error('❌ No token available for socket');
        throw new Error('No authentication token available');
    }

    console.log('🔐 Connecting socket with token:', token.substring(0, 20) + '...');

    // ✅ FIXED: WS_URL use ho raha hai (bina /api/v1 path ke), API_BASE_URL nahi
    socket = io(config?.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_WS_URL || 'https://throne8-servers-production-ced6.up.railway.app', {
        auth: {
            token: token
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

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