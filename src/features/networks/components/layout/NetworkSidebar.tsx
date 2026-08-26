'use client';
import React, { useEffect } from 'react';
import { networkStats } from '../../constants/mockData';
import { useConnectionRequests } from '@/features/networks/hooks/useConnectionRequests';
import { useConnectionsData } from '@/features/profile/hooks/useConnectionsData';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const NetworkSidebar: React.FC = () => {
    const { requests } = useConnectionRequests();
    const { user } = useAuth();

    const {
        followingList,
        followersList,
        totalConnections,
        isLoadingConnections,
        fetchConnectionsData,
    } = useConnectionsData();

    useEffect(() => {
        if (user?.userId) {
            fetchConnectionsData(user.userId);
        }
    }, [user?.userId]);

    // ✅ Real data for Connections + Following & Followers, 0 for the rest (not built yet)
    const dynamicStats = networkStats.map(stat => {
        if (stat.label === 'Connections') {
            return { ...stat, count: isLoadingConnections ? '...' : totalConnections };
        }
        if (stat.label === 'Following & Followers') {
            return {
                ...stat,
                count: isLoadingConnections ? '...' : followingList.length + followersList.length,
            };
        }
        // Contacts, Groups, Events, Pages, Newsletters — not implemented yet
        return { ...stat, count: 0 };
    });

    return (
        <div className="w-full lg:w-80">
            <div
                className="rounded-3xl shadow-2xl border-2 overflow-hidden transform hover:scale-105 transition-all duration-300"
                style={{ backgroundColor: '#e0d8cf', borderColor: '#4a3728' }}
            >
                <div className="p-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white to-transparent opacity-10"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-3">
                            <div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
                                style={{ backgroundColor: '#e0d8cf', borderColor: '#4a3728' }}
                            >
                                <i className="ri-global-fill"></i>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black" style={{ color: '#4a3728' }}>
                                    My Network
                                </h2>
                                <p className="text-sm opacity-70" style={{ color: '#4a3728' }}>
                                    Build meaningful connections
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {dynamicStats.map((item, index) => (
                        <div
                            key={index}
                            className="group relative overflow-hidden rounded-2xl shadow-lg cursor-pointer transform hover:scale-105 transition-all duration-300"
                            style={{ backgroundColor: '#f6ede8' }}
                        >
                            <div
                                className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                                style={{ background: `linear-gradient(135deg, #4a3728, #6b4e3d)` }}
                            ></div>
                            <div className="relative p-4 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-lg"
                                        style={{ backgroundColor: '#e0d8cf' }}
                                    >
                                        <i className={item.icon}></i>
                                    </div>
                                    <span
                                        className="font-bold group-hover:translate-x-2 transition-transform duration-300"
                                        style={{ color: '#4a3728' }}
                                    >
                                        {item.label}
                                    </span>
                                </div>
                                {item.count !== undefined && (
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-[#f6ede8]/50 to-[#f6ede8]/50 rounded-full blur opacity-30"></div>
                                        <span
                                            className="relative text-sm font-black px-3 py-1 rounded-full shadow-lg"
                                            style={{ color: '#4a3728', backgroundColor: '#e0d8cf' }}
                                        >
                                            {item.count}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};