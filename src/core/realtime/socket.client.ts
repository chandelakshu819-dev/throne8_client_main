// src/core/realtime/socket.client.ts
import { io, Socket } from 'socket.io-client';
import TokenStorage from '@/lib/store/token.storage';
import config from '@/config/env.config';
import { renewSession, isRefreshCoolingDown } from '@/lib/api/api.intance';

let socket: Socket | null = null;

const SOCKET_AUTH_COOLDOWN_MS = 5 * 60 * 1000;
const AUTH_ERROR_REGEX = /token|auth|expired/i;

let authRetrying = false;
let blockedUntil = 0;

export const initializeSocket = (): Socket => {
    // Socket pehle se hai (connected ya connecting) -> wahi return karo.
    if (socket) {
        if (socket.disconnected && !socket.active) {
            socket.connect();
        }
        return socket;
    }

    // Auth fail ke baad cooldown: naya handshake mat bhejo
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
        console.log('✅ Socket connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
    });

    socket.on('connect_error', async (error) => {
        console.error('❌ Socket connection error:', error.message);

        // Network / server errors: socket.io khud reconnect karta hai (max 5 attempts)
        if (!AUTH_ERROR_REGEX.test(error.message)) return;

        // Auth error par socket.io auto-retry nahi karta. Ek hi baar session
        // renew try karo, aur sirf tab jab refresh cooldown mein na ho.
        if (authRetrying) return;

        if (isRefreshCoolingDown()) {
            console.warn('⏸️ Socket: refresh cooling down, not retrying');
            blockedUntil = Date.now() + SOCKET_AUTH_COOLDOWN_MS;
            disconnectSocket();
            return;
        }

        authRetrying = true;
        try {
            const renewed = await renewSession();
            if (renewed) {
                socket?.connect();
            } else {
                blockedUntil = Date.now() + SOCKET_AUTH_COOLDOWN_MS;
                disconnectSocket();
            }
        } catch (refreshError) {
            console.error('❌ Socket: session refresh failed', refreshError);
            blockedUntil = Date.now() + SOCKET_AUTH_COOLDOWN_MS;
            disconnectSocket();
        } finally {
            authRetrying = false;
        }
    });

    return socket;
};

export const getSocket = (): Socket | null => {
    // Sirf tab naya socket banao jab kabhi bana hi nahi (socket === null).
    if (!socket) {
        try {
            if (TokenStorage.isAuthenticated()) {
                return initializeSocket();
            }
        } catch (err) {
            // Cooldown ya no-session: chupchap null do
            return null;
        }
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        socket = null;
        console.log('🔌 Socket disconnected manually');
    }
};

export { socket };