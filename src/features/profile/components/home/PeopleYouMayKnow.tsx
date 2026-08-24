// src/features/profile/components/home/PeopleYouMayKnow.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNetworkUsers } from '@/features/networks/hooks/useNetworkUsers';
import ConnectionService from '@/lib/api/connection.service';

interface PeopleYouMayKnowProps {
    userId?: string; // ✅ hamesha LOGIN user ka userId aayega
}

const PeopleYouMayKnow: React.FC<PeopleYouMayKnowProps> = ({ userId }) => {
    const router = useRouter();
    const { networkUsers, isLoadingUsers, fetchNetworkUsers } = useNetworkUsers();

    // ✅ jinko connect kar diya (ya request already pending thi) — inhe list se hide karna hai
    const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

    // ✅ NEW: jinke liye request abhi in-flight hai — duplicate click/submit rokne ke liye
    const [connectingIds, setConnectingIds] = useState<Set<string>>(new Set());
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    useEffect(() => {
        if (userId) {
            fetchNetworkUsers(userId);
        }
    }, [userId, fetchNetworkUsers]);

    // ✅ Listen for connection requests sent from elsewhere in the app
    useEffect(() => {
        const handleGlobalRequestSent = (event: any) => {
            const targetId = event.detail?.targetUserId;
            if (targetId) {
                setHiddenIds((prev) => new Set(prev).add(targetId));
            }
        };
        window.addEventListener('connection-request:sent', handleGlobalRequestSent);
        return () => window.removeEventListener('connection-request:sent', handleGlobalRequestSent);
    }, []);

    // Auto-dismiss toast
    useEffect(() => {
        if (!toastMessage) return;
        const timer = setTimeout(() => setToastMessage(null), 3000);
        return () => clearTimeout(timer);
    }, [toastMessage]);

    const handleCardClick = (targetUserId: string) => {
        router.push(`/profile/${targetUserId}`);
    };

    const handleConnect = async (e: React.MouseEvent, targetUserId: string, targetName?: string) => {
        e.stopPropagation(); // ✅ card navigation trigger na ho

        if (connectingIds.has(targetUserId)) {
            return;
        }

        setConnectingIds((prev) => new Set(prev).add(targetUserId));

        try {
            await ConnectionService.sendConnectionRequest({ toUserId: targetUserId });
            setToastMessage(`Connection request sent to ${targetName || 'user'}!`);
            window.dispatchEvent(new CustomEvent('connection-request:sent', { detail: { targetUserId } }));
        } catch (error: any) {
            const alreadyExists = error.message?.includes('already exists');
            if (!alreadyExists) {
                alert(error.message || 'Failed to send connection request');

                setConnectingIds((prev) => {
                    const next = new Set(prev);
                    next.delete(targetUserId);
                    return next;
                });
                return;
            }
            setToastMessage(`Connection request already pending.`);
            window.dispatchEvent(new CustomEvent('connection-request:sent', { detail: { targetUserId } }));
        }

        // ✅ Card list se hata do — agla user apne aap queue se aa jayega
        setHiddenIds((prev) => new Set(prev).add(targetUserId));
    };

    if (!userId) return null;

    // ✅ Extra safety: khud ko kabhi bhi list me na dikhaye, chahe hook se
    // kisi wajah se aa jaye. Fir jinhe connect kar diya unhe bhi hide karo,
    // aur sirf top 4 hi dikhao — baaki queue me safe rehte hain.
    const visibleUsers = networkUsers
        .filter((person) => person.id !== userId && !hiddenIds.has(person.id))
        .slice(0, 4);

    return (
        <div className="w-full bg-[#f6ede8]/90 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-[#e0d8cf]/50 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#f6ede8]/50 to-[#e0d8cf]/50 rounded-3xl"></div>
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-[#4a3728] rounded-xl text-[#f6ede8]">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-[#4a3728]">
                        People You May Know
                    </h3>
                </div>
                <p className="text-sm text-[#4a3728]/70 mb-6 font-medium">From your industry</p>

                {isLoadingUsers ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="animate-pulse h-24 bg-[#e0d8cf]/50 rounded-2xl" />
                        ))}
                    </div>
                ) : visibleUsers.length === 0 ? (
                    <p className="text-sm text-[#4a3728]/60 text-center py-6">
                        No suggestions right now
                    </p>
                ) : (
                    <div className="space-y-4">
                        {visibleUsers.map((person) => {
                            const initials = person.name
                                ? person.name
                                    .split(' ')
                                    .map((n: string) => n[0])
                                    .join('')
                                    .slice(0, 2)
                                    .toUpperCase()
                                : '??';

                            // ✅ NEW: is card ke liye request abhi in-flight hai kya
                            const isConnecting = connectingIds.has(person.id);

                            return (
                                <div
                                    key={person.id}
                                    onClick={() => handleCardClick(person.id)}
                                    className="group flex items-center gap-4 p-5 bg-[#e0d8cf]/70 backdrop-blur-sm rounded-2xl shadow-lg border border-[#e0d8cf]/50 cursor-pointer hover:shadow-xl transition-shadow duration-300"
                                >
                                    <div className="relative flex-shrink-0">
                                        {person.image ? (
                                            <img
                                                src={person.image}
                                                alt={person.name}
                                                className="w-12 h-12 rounded-2xl object-cover shadow-lg"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 bg-[#4a3728] rounded-2xl flex items-center justify-center text-[#f6ede8] font-bold text-lg shadow-lg">
                                                {initials}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-lg font-bold text-[#4a3728] truncate">
                                                {person.name}
                                            </p>
                                        </div>
                                        <p className="text-sm text-[#4a3728]/70 mb-3 line-clamp-2">
                                            {person.title || 'Throne8 member'}
                                        </p>
                                        
                                        <button
                                            onClick={(e) => handleConnect(e, person.id, person.name)}
                                            disabled={isConnecting}
                                            className="px-4 py-2 bg-transparent border border-[#4a3728] text-[#4a3728] rounded-xl text-sm font-semibold shadow-lg hover:bg-[#4a3728] hover:text-[#f6ede8] transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#4a3728]"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                            </svg>
                                            {isConnecting ? 'Connecting...' : 'Connect'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Toast Notification */}
                {toastMessage && (
                    <div className="mt-4 p-3 bg-[#4a3728] text-[#f6ede8] text-xs font-semibold rounded-xl text-center shadow-lg transition-all animate-fade-in flex items-center justify-center gap-2">
                        <span>✓</span>
                        <span>{toastMessage}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PeopleYouMayKnow;