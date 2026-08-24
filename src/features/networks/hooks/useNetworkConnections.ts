import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import ConnectionService from "@/lib/api/connection.service";

export const useNetworkConnections = () => {
    const { user } = useAuth();
    const [connectedUsers, setConnectedUsers] = useState<Set<string>>(new Set());
    const [loadingUsers, setLoadingUsers] = useState<Set<string>>(new Set());

    // ✅ Initial load of pending outgoing requests from backend
    useEffect(() => {
        if (!user?.userId) return;

        const loadPendingRequests = async () => {
            try {
                const res = await ConnectionService.getOutgoingRequests(user.userId);
                const requests = res?.data?.data || res?.data || [];
                if (Array.isArray(requests)) {
                    const pendingIds = new Set<string>();
                    requests.forEach((req: any) => {
                        if (req.toUserId && req.status !== 'declined' && req.status !== 'cancelled') {
                            pendingIds.add(req.toUserId);
                        }
                    });
                    setConnectedUsers(pendingIds);
                }
            } catch (err) {
                console.warn('Failed to load initial outgoing requests in useNetworkConnections:', err);
            }
        };

        loadPendingRequests();

        // Listen for global connection-request:sent events
        const handleGlobalRequestSent = (event: any) => {
            const targetId = event.detail?.targetUserId;
            if (targetId) {
                setConnectedUsers(prev => new Set(prev).add(targetId));
            }
        };
        window.addEventListener('connection-request:sent', handleGlobalRequestSent);
        return () => window.removeEventListener('connection-request:sent', handleGlobalRequestSent);
    }, [user?.userId]);

    const handleConnect = async (userId: string) => {
        if (connectedUsers.has(userId) || loadingUsers.has(userId)) {
           return;
        }

        setLoadingUsers(prev => new Set(prev).add(userId));

        try {
            await ConnectionService.sendConnectionRequest({
                toUserId: userId,
                message: "Hi! I'd like to connect with you.",
                priority: 'medium',
                templateId: 'welcome-template',
            });
            setConnectedUsers(prev => new Set(prev).add(userId));
            window.dispatchEvent(new CustomEvent('connection-request:sent', { detail: { targetUserId: userId } }));
        } catch (error: any) {
            const alreadyExists = error.message?.includes('already exists');
            if (alreadyExists) {
                setConnectedUsers(prev => new Set(prev).add(userId));
                window.dispatchEvent(new CustomEvent('connection-request:sent', { detail: { targetUserId: userId } }));
            } else {
                console.error('❌ Failed to send request:', error.message);
                alert(error.message || 'Failed to send connection request');
            }
        } finally {
            setLoadingUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        }
    };

    return { connectedUsers, loadingUsers, handleConnect };
};








