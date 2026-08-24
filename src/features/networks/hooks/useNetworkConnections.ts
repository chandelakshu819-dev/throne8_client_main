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
        if (!userId || connectedUsers.has(userId) || loadingUsers.has(userId)) {
           return;
        }

        setLoadingUsers(prev => new Set(prev).add(userId));
        // Optimistically mark as pending & broadcast global event
        setConnectedUsers(prev => new Set(prev).add(userId));
        window.dispatchEvent(new CustomEvent('connection-request:sent', { detail: { targetUserId: userId } }));

        try {
            await ConnectionService.sendConnectionRequest({
                toUserId: userId,
                message: "Hi! I'd like to connect with you.",
            });
        } catch (error: any) {
            const alreadyExists = error.message?.includes('already exists');
            if (!alreadyExists) {
                console.error('❌ Failed to send request:', error.message);
                // Revert optimistic pending state on real error
                setConnectedUsers(prev => {
                    const next = new Set(prev);
                    next.delete(userId);
                    return next;
                });
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








