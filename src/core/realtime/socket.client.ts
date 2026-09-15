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
    // ⚠️ FIX: pehle yeh sirf existing `socket` variable return karta tha —
    // agar koi page pehle se initializeSocket() call nahi kar chuka tha
    // (jaise mentor seedha /mentor-session pe navigate kare), to socket
    // hamesha null milta tha → "Socket not connected" error.
    //
    // Sirf tab naya initializeSocket() call karo jab socket kabhi bana hi
    // nahi (socket === null). Agar socket already exist karta hai lekin
    // temporarily disconnected hai (network blip / reconnection already
    // in-progress — socket.io khud reconnectionAttempts:5 se handle kar
    // raha hai), to naya connection mat banao — warna purana reconnecting
    // socket orphan ho jayega aur do parallel connections ban jayenge.
    if (!socket) {
        try {
            const token = TokenStorage.getAccessToken();
            if (token) {
                return initializeSocket();
            }
        } catch (err) {
            console.error('❌ getSocket: auto-init failed', err);
            return null;
        }
    }
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