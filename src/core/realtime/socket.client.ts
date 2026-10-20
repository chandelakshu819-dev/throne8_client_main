// src/core/realtime/socket.client.ts
import { io, Socket } from 'socket.io-client';
import TokenStorage from '@/lib/store/token.storage';
import config from '@/config/env.config';
import { renewSession } from '@/lib/api/api.intance';

let socket: Socket | null = null;

const MAX_AUTH_RETRIES = 2;
const COOLDOWN_MS = 60_000;

let authRetrying = false;
let authRetries = 0;
let blockedUntil = 0;

export const initializeSocket = (): Socket => {
    // Socket pehle se hai (connected ya connecting) -> wahi return karo.
    if (socket) {
        if (socket.disconnected && !socket.active) {
            socket.connect();
        }
        return socket;
    }

    // Auth fail loop ke baad cooldown: bar-bar naya socket mat banao
    if (Date.now() < blockedUntil) {
        throw new Error('Socket auth cooldown active');
    }

    if (!TokenStorage.isAuthenticated()) {
        console.error('❌ No active session for socket');
        throw new Error('No authentication session available');
    }

    socket = io(
        config?.NEXT_PUBLIC_WS_URL ||
            process.env.NEXT_PUBLIC_WS_URL ||
            'https://throne8-servers-production-ced6.up.railway.app',
        {
            withCredentials: true,
            // Token mode: har (re)connect par fresh token. Cookie mode: null, cookie khud jaati hai.
            auth: (cb) => cb({ token: TokenStorage.getAccessToken() }),
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        }
    );

    socket.on('connect', () => {
        authRetries = 0;
        console.log('✅ Socket connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
    });

    socket.on('connect_error', async (error) => {
        console.error('❌ Socket connection error:', error.message);

        // Sirf auth errors par session renew try karo
        if (authRetrying || !/token|auth|expired/i.test(error.message)) return;

        if (authRetries >= MAX_AUTH_RETRIES) {
            console.error('❌ Socket: auth retry limit reached, stopping');
            blockedUntil = Date.now() + COOLDOWN_MS;
            authRetries = 0;
            disconnectSocket();
            return;
        }

        authRetrying = true;
        authRetries += 1;
        try {
            const renewed = await renewSession();
            if (renewed) {
                socket?.connect();
            } else {
                // Session renew nahi hua (401 par logout ho chuka hoga) -> reconnect mat karo
                disconnectSocket();
            }
        } catch (refreshError) {
            console.error('❌ Socket: session refresh failed', refreshError);
            disconnectSocket();
        } finally {
            authRetrying = false;
        }
    });

    return socket;
};

export const getSocket = (): Socket | null => {
    // Sirf tab naya socket banao jab kabhi bana hi nahi (socket === null).
    // Existing socket temporarily disconnected ho to socket.io khud reconnect karta hai.
    if (!socket) {
        try {
            if (TokenStorage.isAuthenticated()) {
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