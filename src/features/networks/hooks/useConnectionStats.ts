import { useState, useEffect, useCallback } from 'react';
import ConnectionService from '@/lib/api/connection.service';
import FollowService from '@/lib/api/follow.service';
import { useAuth } from '@/features/auth/hooks/useAuth';

// ✅ Multiple components apna-apna useConnectionStats() instance banate hai
// (koi shared Context/Store nahi hai), isliye ek component me accept hone
// par doosre component ka state kabhi update nahi hota tha. Ye global event
// sab instances ko "refetch karo" bolne ke liye use hoga.
export const CONNECTION_STATS_REFRESH_EVENT = 'connection-stats:refresh';


interface ConnectionStats {
    totalConnections: number;
    following: number;
    followers: number;
}

export const useConnectionStats = () => {
    const [stats, setStats] = useState<ConnectionStats>({
        totalConnections: 0,
        following: 0,
        followers: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        if (user?.userId) {
            fetchStats();
        }
    }, [user]);

    // ✅ Jab bhi kahin bhi (RequestsModal accept, follow/unfollow, etc.)
    // se ye event fire ho, ye instance bhi apna data refetch kar lega.
    useEffect(() => {
        const handleRefresh = () => {
            if (user?.userId) {
                fetchStats();
            }
        };
        window.addEventListener(CONNECTION_STATS_REFRESH_EVENT, handleRefresh);
        return () => window.removeEventListener(CONNECTION_STATS_REFRESH_EVENT, handleRefresh);
    }, [user]);

    const fetchStats = async () => {
        try {
            setIsLoading(true);

            const [connectionRes, followRes] = await Promise.all([
                ConnectionService.getConnectionStats(user!.userId),
                FollowService.getFollowCounts(user!.userId),
            ]);

            const statsData = connectionRes?.data || {};
            const followers = followRes?.data?.followersCount ?? followRes?.followersCount ?? 0;
            const following = followRes?.data?.followingCount ?? followRes?.followingCount ?? 0;

            setStats({
                totalConnections: statsData.totalConnections || 0,
                following,
                followers,
            });

        } catch (error: any) {
            console.error('❌ [STATS] Failed:', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const incrementFollowing = () => {
        setStats(prev => ({ ...prev, following: prev.following + 1 }));
    };

    const incrementFollowers = () => {
        setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
    };

    const incrementConnections = () => {
        setStats(prev => ({ ...prev, totalConnections: prev.totalConnections + 1 }));
    };

    return {
        stats,
        isLoading,
        incrementFollowing,
        incrementFollowers,
        incrementConnections,
        refetch: fetchStats
    };
};