'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ArrowLeft,
    Search,
    MoreHorizontal,
    MapPin,
    Users as UsersIcon,
    Bookmark,
    UsersRound,
    CalendarDays,
    Hash,
} from 'lucide-react';
import { useConnectionsData } from '@/features/profile/hooks/useConnectionsData';
import { useAuth } from '@/features/auth/hooks/useAuth';
import ConnectionService from '@/lib/api/connection.service';
import AuthService from '@/lib/api/auth.service';

type TabType = 'connections' | 'followers' | 'following';

interface ListUser {
    id: string;
    connectionId?: string;
    name: string;
    headline: string;
    image: string;
    location?: string;
}

const PAGE_SIZE = 20;

const ConnectionsPageClient: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user: authUser } = useAuth();

    const targetUserId = searchParams.get('userId') || authUser?.userId || '';
    const initialTab = (searchParams.get('tab') as TabType) || 'connections';

    const [activeTab, setActiveTab] = useState<TabType>(initialTab);
    const [searchQuery, setSearchQuery] = useState('');
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [targetName, setTargetName] = useState<string>('');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [removingId, setRemovingId] = useState<string | null>(null);

    const {
        followingList,
        followersList,
        // ⚠️ NOTE: totalConnections from the hook is the RAW backend
        // Connection-document count (see useConnectionsData.ts -> doFetch ->
        // `totalConnections: connections.length`). It is intentionally NOT
        // used for display anymore — see connectionsMerged below.
        totalConnections: rawTotalConnectionsFromBackend,
        isLoadingConnections,
        fetchConnectionsData,
    } = useConnectionsData();

    const isOwnProfile = !!authUser?.userId && authUser.userId === targetUserId;

    // Fetch connection data for the target user (own or someone else's)
    useEffect(() => {
        if (targetUserId) {
            fetchConnectionsData(targetUserId);
        }
    }, [targetUserId, fetchConnectionsData]);

    // Fetch display name for the header ("Honey's Network")
    useEffect(() => {
        if (!targetUserId) return;
        if (isOwnProfile && authUser) {
            setTargetName(`${authUser.firstName || ''} ${authUser.lastName || ''}`.trim() || 'Your');
            return;
        }
        AuthService.getUsersBulk([targetUserId])
            .then((res: any) => {
                const u = res?.data?.users?.[0];
                if (u) setTargetName(`${u.firstName || ''} ${u.lastName || ''}`.trim());
            })
            .catch(() => setTargetName(''));
    }, [targetUserId, isOwnProfile, authUser]);

    // Keep tab in the URL so it's shareable / back-button friendly
    const setTab = (tab: TabType) => {
        setActiveTab(tab);
        setVisibleCount(PAGE_SIZE);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        params.set('userId', targetUserId);
        router.replace(`/network/connections?${params.toString()}`);
    };

    // "Connections" tab = union of followingList + followersList (both are
    // just the same Connection collection split by direction, so together
    // they ARE the user's full connections list).
    const connectionsMerged: ListUser[] = useMemo(() => {
        const map = new Map<string, ListUser>();
        [...followingList, ...followersList].forEach((u: ListUser) => {
            if (!map.has(u.id)) map.set(u.id, u);
        });
        return Array.from(map.values());
    }, [followingList, followersList]);

    // ✅ FIX (count mismatch bug): the backend's `totalConnections` counts
    // raw Connection *documents*, not unique connected people. If the same
    // pair of users ends up with two docs (one where the person is
    // `fromUserId`, one where they're `toUserId` — a data duplication bug
    // on the backend), that one person gets counted twice in the raw total
    // but only appears once in the merged/deduped list. That's why you saw
    // "10 connections" in the header/tab but only 9 cards rendered.
    //
    // Until the backend dedupes/prevents duplicate directional docs for the
    // same pair (see Connection.checkConnectionExists — it likely only
    // checks one direction), we display the UNIQUE count derived from the
    // actual list we render, so the number on screen always matches what
    // the user can count.
    const uniqueTotalConnections = connectionsMerged.length;

    // Kept around only for debugging / comparison — not rendered.
    const hasBackendCountMismatch = rawTotalConnectionsFromBackend !== uniqueTotalConnections;
    if (hasBackendCountMismatch && !isLoadingConnections) {
        // eslint-disable-next-line no-console
        console.warn(
            `[ConnectionsPage] Backend total (${rawTotalConnectionsFromBackend}) != unique merged total (${uniqueTotalConnections}). ` +
            `Likely a duplicate directional Connection doc for the same user pair — check Connection.checkConnectionExists on the backend.`
        );
    }

    const activeList: ListUser[] =
        activeTab === 'connections' ? connectionsMerged
        : activeTab === 'following' ? followingList
        : followersList;

    const filteredList = useMemo(() => {
        if (!searchQuery.trim()) return activeList;
        const q = searchQuery.toLowerCase();
        return activeList.filter(
            (u) => u.name?.toLowerCase().includes(q) || u.headline?.toLowerCase().includes(q)
        );
    }, [activeList, searchQuery]);

    const visibleList = filteredList.slice(0, visibleCount);
    const hasMore = visibleCount < filteredList.length;

    const tabCount = (tab: TabType) =>
        tab === 'connections' ? uniqueTotalConnections
        : tab === 'following' ? followingList.length
        : followersList.length;

    const handleRemove = async (user: ListUser) => {
        if (!user.connectionId) {
            setOpenMenuId(null);
            return;
        }
        try {
            setRemovingId(user.id);
            await ConnectionService.deleteConnection(user.connectionId);
            await fetchConnectionsData(targetUserId);
        } catch (err: any) {
            alert(err.message || 'Failed to remove connection');
        } finally {
            setRemovingId(null);
            setOpenMenuId(null);
        }
    };

    const manageLinks = [
        { icon: Bookmark, label: 'Saved posts', href: '/saved' },
        { icon: UsersRound, label: 'Groups', href: '/groups' },
        { icon: CalendarDays, label: 'Events', href: '/events' },
        { icon: Hash, label: 'Followed Hashtags', href: '/hashtags/followed' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#faf6f2] to-[#f0e6dc]">
            {/* Simple header bar — swap in the shared Navbar component later if desired */}
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-[#e0d8cf]">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-full hover:bg-[#f6ede8] transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-[#4a3728]" />
                    </button>
                    <span className="text-lg font-bold text-[#4a3728]">Throne8</span>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-6">
                {/* Title */}
                <div className="mb-5">
                    <h1 className="text-2xl font-bold text-[#4a3728]">
                        {isOwnProfile ? 'Your' : targetName ? `${targetName}'s` : "User's"} Network
                    </h1>
                    <p className="text-sm text-[#4a3728]/60 mt-1">
                        {isLoadingConnections ? '...' : uniqueTotalConnections} connections
                    </p>
                </div>

                {/* 2-column layout: list (left) + Manage card (right) */}
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                    {/* LEFT: main list column */}
                    <div className="flex-1 min-w-0 w-full">
                        {/* Tabs */}
                        <div className="flex gap-1 border-b border-[#e0d8cf] mb-5 bg-white/50 rounded-t-2xl overflow-hidden">
                            {(['connections', 'followers', 'following'] as TabType[]).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setTab(tab)}
                                    className={`relative flex-1 px-4 py-3 text-sm font-semibold capitalize transition-colors ${
                                        activeTab === tab
                                            ? 'text-[#4a3728]'
                                            : 'text-[#4a3728]/50 hover:text-[#4a3728]/70'
                                    }`}
                                >
                                    {tab} <span className="ml-1 text-xs font-bold">({isLoadingConnections ? '…' : tabCount(tab)})</span>
                                    {activeTab === tab && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#4a3728] to-[#6a5748]" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="relative mb-5">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a3728]/50" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={`Search ${activeTab}...`}
                                className="w-full pl-11 pr-4 py-3 rounded-full bg-white border border-[#e0d8cf] text-sm text-[#4a3728] placeholder:text-[#4a3728]/40 focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20"
                            />
                        </div>

                        {/* List */}
                        {isLoadingConnections ? (
                            <div className="flex justify-center py-16">
                                <div className="w-8 h-8 border-4 border-[#4a3728]/20 border-t-[#4a3728] rounded-full animate-spin" />
                            </div>
                        ) : visibleList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center bg-white/50 rounded-3xl border border-[#e0d8cf]">
                                <UsersIcon className="w-10 h-10 text-[#4a3728]/30 mb-3" />
                                <h3 className="text-lg font-semibold text-[#4a3728]">
                                    No {activeTab} {searchQuery ? 'match your search' : 'yet'}
                                </h3>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {visibleList.map((u) => (
                                    <div
                                        key={u.id}
                                        className="flex items-center gap-4 p-4 rounded-2xl border border-[#e0d8cf] bg-white shadow-sm hover:shadow-md transition-all duration-300"
                                    >
                                        <img
                                            src={u.image}
                                            alt={u.name}
                                            onClick={() => router.push(`/profile/${u.id}`)}
                                            className="w-16 h-16 rounded-xl object-cover border-2 border-[#e0d8cf] cursor-pointer flex-shrink-0"
                                        />
                                        <div
                                            className="flex-1 min-w-0 cursor-pointer"
                                            onClick={() => router.push(`/profile/${u.id}`)}
                                        >
                                            <h3 className="text-base font-bold text-[#4a3728] truncate">{u.name}</h3>
                                            {u.headline && (
                                                <p className="text-sm text-[#4a3728]/70 line-clamp-1 mt-0.5">{u.headline}</p>
                                            )}
                                            {u.location && (
                                                <p className="text-xs text-[#4a3728]/50 flex items-center gap-1 mt-1">
                                                    <MapPin className="w-3 h-3" /> {u.location}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => router.push(`/message/${u.id}`)}
                                                className="px-4 py-2 bg-[#4a3728] text-white rounded-full text-sm font-semibold hover:bg-[#3a2718] transition-colors"
                                            >
                                                Message
                                            </button>
                                            {isOwnProfile && (
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}
                                                        className="p-2 rounded-full border border-[#e0d8cf] hover:bg-[#f6ede8] transition-colors"
                                                    >
                                                        <MoreHorizontal className="w-4 h-4 text-[#4a3728]" />
                                                    </button>
                                                    {openMenuId === u.id && (
                                                        <>
                                                            <div className="fixed inset-0 z-30" onClick={() => setOpenMenuId(null)} />
                                                            <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-2xl border border-[#e0d8cf] py-1 z-40">
                                                                <button
                                                                    onClick={() => handleRemove(u)}
                                                                    disabled={removingId === u.id}
                                                                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                                                >
                                                                    {removingId === u.id ? 'Removing...' : 'Remove connection'}
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {hasMore && (
                            <div className="flex justify-center mt-6">
                                <button
                                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                                    className="px-6 py-2.5 bg-white border border-[#e0d8cf] text-[#4a3728] rounded-full text-sm font-semibold hover:bg-[#f6ede8] transition-colors"
                                >
                                    Load more
                                </button>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Manage sidebar card (LinkedIn-style) — hidden on small screens above list, shown below it on mobile via flex-col order */}
                    <div className="w-full lg:w-72 flex-shrink-0 lg:sticky lg:top-20">
                        <div className="bg-white rounded-2xl border border-[#e0d8cf] shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-[#e0d8cf]">
                                <h3 className="text-sm font-bold text-[#4a3728]">Manage</h3>
                            </div>
                            <div className="py-2">
                                {manageLinks.map(({ icon: Icon, label, href }) => (
                                    <button
                                        key={label}
                                        onClick={() => router.push(href)}
                                        className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-[#f6ede8] transition-colors"
                                    >
                                        <Icon className="w-4 h-4 text-[#4a3728]/70 flex-shrink-0" />
                                        <span className="text-sm font-medium text-[#4a3728]">{label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConnectionsPageClient;