// src/core/realtime/socket.client.ts
import { io, Socket } from 'socket.io-client';
import TokenStorage from '@/lib/store/token.storage';
import config from '@/config/env.config';
import { refreshSession } from '@/lib/api/api.intance';

let socket: Socket | null = null;

let authRetrying = false;

export const initializeSocket = (): Socket => {
    // Socket pehle se hai (connected ya connecting) → wahi return karo.
    // Naya banaya to purana orphan ho jata hai aur listeners alag instance
    // par lag jate hain (isi se events miss hote hain).
    if (socket) {
        if (socket.disconnected && !socket.active) {
            socket.connect();
        }
        return socket;
    }

    // 🍪 The session is an httpOnly cookie — the browser sends it with the handshake
    // (withCredentials), so no token is read or passed from JavaScript.
    if (!TokenStorage.isAuthenticated()) {
        console.error('❌ No active session for socket');
        throw new Error('No authentication session available');
    }

    // ✅ FIXED: WS_URL use ho raha hai (bina /api/v1 path ke), API_BASE_URL nahi
    socket = io(config?.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_WS_URL || 'https://throne8-servers-production-ced6.up.railway.app', {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
        console.log('✅ Socket connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
    });

    socket.on('connect_error', async (error) => {
        console.error('❌ Socket connection error:', error.message);

        // The 15-minute access cookie may have expired while the socket was offline.
        // The server then rejects the handshake ("...token required" / "Invalid or expired token"),
        // and socket.io does not auto-retry that. Renew the session once, then reconnect.
        if (!authRetrying && /token|auth|expired/i.test(error.message)) {
            authRetrying = true;
            try {
                await refreshSession();
                socket?.connect();
            } catch (refreshError) {
                console.error('❌ Socket: session refresh failed', refreshError);
            } finally {
                authRetrying = false;
            }
        }
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