// src/core/realtime/useSocket.tsx
'use client';

import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { initializeSocket, disconnectSocket } from './socket.client';
import TokenStorage from '../../lib/store/token.storage';

export function useSocket() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

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
            });

            socketInstance.on('disconnect', () => {
                setIsConnected(false);
                console.log('❌ [useSocket] Disconnected');
            });

            return () => {
                disconnectSocket();
            };
        } catch (error) {
            console.error('❌ [useSocket] Failed to initialize:', error);
        }
    }, []);

    return { socket, isConnected };
}


