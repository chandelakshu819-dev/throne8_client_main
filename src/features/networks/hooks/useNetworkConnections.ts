import { useState } from "react";
import { useConnectionSocket } from "./useConnectionSocket";
import ConnectionService from "@/lib/api/connection.service";
import { useConnectionStats } from "./useConnectionStats";

export const useNetworkConnections = () => {
    const [connectedUsers, setConnectedUsers] = useState<Set<string>>(new Set());
    const [loadingUsers, setLoadingUsers] = useState<Set<string>>(new Set());
    // const { decrementCount } = useConnectionSocket();
    const { incrementFollowing } = useConnectionStats();

    const handleConnect = async (userId: string) => {
        if (connectedUsers.has(userId) || loadingUsers.has(userId)) {
           return;
        }

        setLoadingUsers(prev => new Set(prev).add(userId));

        try {
             // ✅ CALL API
            await ConnectionService.sendConnectionRequest({
                toUserId: userId,
                message: "Hi! I'd like to connect with you.",
                priority: 'medium',
                templateId: 'welcome-template',
            });

            // ✅ UPDATE STATE
            setConnectedUsers(prev => new Set(prev).add(userId));
            incrementFollowing();

        } catch (error: any) {
            console.error('❌ Failed to send request:', error.message);
            alert(error.message || 'Failed to send connection request');
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








