import { useState } from "react";
import { useConnectionSocket } from "./useConnectionSocket";
import ConnectionService from "@/lib/api/connection.service";

export const useNetworkConnections = () => {
    const [connectedUsers, setConnectedUsers] = useState<Set<string>>(new Set());
    const [loadingUsers, setLoadingUsers] = useState<Set<string>>(new Set());
    // const { decrementCount } = useConnectionSocket();

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
            // Note: following/followers count sirf accept hone par badhega
            // (Follow document tabhi backend me create hota hai), isliye
            // yaha optimistic increment nahi karte — request sirf "pending" state hai.
            setConnectedUsers(prev => new Set(prev).add(userId));

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








