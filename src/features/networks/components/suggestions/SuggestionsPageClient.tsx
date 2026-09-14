'use client';
// src/features/networks/components/suggestions/SuggestionsPageClient.tsx
//
// Full-page PYMK "People You May Know" suggestions list.
// Fetches a fresh list on mount via GET /api/v1/connections/suggestions.
// Each card reuses the existing <PersonCard> component which already has
// onConnect and onDismiss props wired up.
//
// Dismiss → DELETE /api/v1/connections/suggestions/:targetUserId (persisted).
// Connect → POST /api/v1/connections/requests (existing ConnectionService).
// Pagination → "Load more" appends the next offset page.

import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Loader2, RefreshCw, Users } from 'lucide-react';
import { PersonCard } from './PersonCard';
import { Person } from '@/features/networks/types';
import ConnectionService from '@/lib/api/connection.service';

const PAGE_SIZE = 20;

export default function SuggestionsPageClient() {
    const [cards, setCards] = useState<Person[]>([]);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
    const [connectingId, setConnectingId] = useState<string | null>(null);

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const fetchPage = useCallback(async (currentOffset: number, append: boolean) => {
        try {
            const res = await ConnectionService.getSuggestions(PAGE_SIZE, currentOffset);
            const newCards: Person[] = res?.data ?? [];
            setCards((prev) => append ? [...prev, ...newCards] : newCards);
            setHasMore(res?.pagination?.hasMore ?? newCards.length === PAGE_SIZE);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to load suggestions');
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchPage(0, false).finally(() => setLoading(false));
    }, [fetchPage]);

    // ── Load more ─────────────────────────────────────────────────────────────
    const handleLoadMore = async () => {
        const nextOffset = offset + PAGE_SIZE;
        setLoadingMore(true);
        await fetchPage(nextOffset, true);
        setOffset(nextOffset);
        setLoadingMore(false);
    };

    // ── Connect ───────────────────────────────────────────────────────────────
    const handleConnect = async (targetUserId: string) => {
        if (connectedIds.has(targetUserId) || connectingId === targetUserId) return;
        setConnectingId(targetUserId);
        try {
            await ConnectionService.sendConnectionRequest({ toUserId: targetUserId });
            setConnectedIds((prev) => new Set([...prev, targetUserId]));
        } catch (err: any) {
            console.error('Connect failed:', err.message);
        } finally {
            setConnectingId(null);
        }
    };

    // ── Dismiss ───────────────────────────────────────────────────────────────
    const handleDismiss = async (targetUserId: string) => {
        // Optimistic: remove immediately from UI
        setCards((prev) => prev.filter((c) => c.id !== targetUserId));
        try {
            await ConnectionService.dismissSuggestion(targetUserId);
        } catch (err: any) {
            // Non-blocking — if it fails the card is just hidden until next page load
            console.error('Dismiss failed (non-fatal):', err.message);
        }
    };

    // ── Refresh ───────────────────────────────────────────────────────────────
    const handleRefresh = async () => {
        setLoading(true);
        setOffset(0);
        await fetchPage(0, false);
        setLoading(false);
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#faf6f2] via-[#f6ede8] to-[#f0e6dc]">
            {/* ── Header ───────────────────────────────────────────────────── */}
            <div className="max-w-6xl mx-auto px-4 pt-10 pb-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-[#4a3728]">People You May Know</h1>
                            <p className="text-sm text-[#4a3728]/60">Fresh suggestions — updated daily</p>
                        </div>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/60 backdrop-blur border border-[#4a3728]/15 text-[#4a3728] text-sm font-medium hover:bg-white/90 transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
                <p className="text-xs text-[#4a3728]/50">
                    Showing suggestions based on your connections and activity. Dismissed suggestions never resurface.
                </p>
            </div>

            <div className="max-w-6xl mx-auto px-4 pb-16">
                {/* ── Loading skeleton ─────────────────────────────────────── */}
                {loading && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div
                                key={i}
                                className="rounded-2xl bg-white/40 border border-[#4a3728]/10 animate-pulse h-56"
                            />
                        ))}
                    </div>
                )}

                {/* ── Error state ──────────────────────────────────────────── */}
                {!loading && error && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                            <Users className="w-8 h-8 text-red-400" />
                        </div>
                        <p className="text-[#4a3728]/70 text-sm">{error}</p>
                        <button
                            onClick={handleRefresh}
                            className="px-6 py-2 rounded-xl bg-[#4a3728] text-white text-sm font-medium hover:bg-[#6a5748] transition-colors"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {/* ── Empty state ──────────────────────────────────────────── */}
                {!loading && !error && cards.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-teal-400" />
                        </div>
                        <p className="text-[#4a3728]/70 text-sm font-medium">
                            No suggestions right now — check back later!
                        </p>
                    </div>
                )}

                {/* ── Card grid ────────────────────────────────────────────── */}
                {!loading && !error && cards.length > 0 && (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {cards.map((person) => (
                                <PersonCard
                                    key={person.id}
                                    person={person}
                                    isConnected={connectedIds.has(person.id)}
                                    isLoading={connectingId === person.id}
                                    onConnect={handleConnect}
                                    onDismiss={handleDismiss}
                                />
                            ))}
                        </div>

                        {/* ── Load more ─────────────────────────────────────── */}
                        {hasMore && (
                            <div className="mt-10 flex justify-center">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#4a3728] to-[#6a5748] text-white rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300 font-medium disabled:opacity-70"
                                >
                                    {loadingMore ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Loading…</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Load more suggestions</span>
                                            <Sparkles className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {!hasMore && cards.length > 0 && (
                            <p className="mt-8 text-center text-xs text-[#4a3728]/40">
                                You&apos;ve seen all suggestions for now. Check back tomorrow!
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
