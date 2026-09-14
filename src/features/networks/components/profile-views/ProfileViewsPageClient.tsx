'use client';
// src/features/networks/components/profile-views/ProfileViewsPageClient.tsx
//
// Full-page "Who Viewed Your Profile" list.
// Fetches viewers on mount via GET /api/v1/connections/profile-views/viewers.
import ProfileService from '@/lib/api/profile.service';
import React, { useState, useEffect, useCallback } from 'react';
import { Eye, Loader2, RefreshCw, Users } from 'lucide-react';

const PAGE_SIZE = 20;

interface Viewer {
    viewId: string;
    viewer: {
        userId: string;
        name: string;
        profilePhotoId?: string | null;
        photoUrl?: string | null;
    } | null;
    timestamp: string;
}

export default function ProfileViewsPageClient() {
    const [viewers, setViewers] = useState<Viewer[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ── Fetch ─────────────────────────────────────────────────────────────
    const fetchPage = useCallback(async (currentPage: number, append: boolean) => {
    try {
        const ConnectionService = (await import('@/lib/api/connection.service')).default;
        const res = await ConnectionService.getWhoViewedProfile(currentPage, PAGE_SIZE);
        const newViewers: Viewer[] = res?.data?.data ?? [];

        // Fetch photos for each unique profilePhotoId
        const uniquePhotoIds = Array.from(
            new Set(
                newViewers
                    .map((v) => v.viewer?.profilePhotoId)
                    .filter((id): id is string => !!id)
            )
        );

        const photoMap = new Map<string, string>();
        await Promise.all(
            uniquePhotoIds.map(async (photoId) => {
                try {
                    const photoRes = await ProfileService.getProfilePhotoById(photoId);
                    const url = photoRes?.data?.photo?.cloudinarySecureUrl;
                    if (url) photoMap.set(photoId, url);
                } catch (err) {
                    // Non-fatal — just falls back to generic avatar
                }
            })
        );

        const viewersWithPhotos = newViewers.map((v) => ({
            ...v,
            viewer: v.viewer
                ? { ...v.viewer, photoUrl: v.viewer.profilePhotoId ? photoMap.get(v.viewer.profilePhotoId) : null }
                : null,
        }));

        setViewers((prev) => append ? [...prev, ...viewersWithPhotos] : viewersWithPhotos);
        setHasMore(newViewers.length === PAGE_SIZE);
        setError(null);
    } catch (err: any) {
        setError(err.message || 'Failed to load profile viewers');
    }
}, []);

    useEffect(() => {
        setLoading(true);
        fetchPage(1, false).finally(() => setLoading(false));
    }, [fetchPage]);

    // ── Load more ─────────────────────────────────────────────────────────
    const handleLoadMore = async () => {
        const nextPage = page + 1;
        setLoadingMore(true);
        await fetchPage(nextPage, true);
        setPage(nextPage);
        setLoadingMore(false);
    };

    // ── Refresh ───────────────────────────────────────────────────────────
    const handleRefresh = async () => {
        setLoading(true);
        setPage(1);
        await fetchPage(1, false);
        setLoading(false);
    };

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#faf6f2] via-[#f6ede8] to-[#f0e6dc]">
            {/* Header */}
            <div className="max-w-6xl mx-auto px-4 pt-10 pb-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg">
                            <Eye className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-[#4a3728]">Who Viewed Your Profile</h1>
                            <p className="text-sm text-[#4a3728]/60">See who's been checking you out</p>
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
            </div>

            <div className="max-w-6xl mx-auto px-4 pb-16">
                {/* Loading skeleton */}
                {loading && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="rounded-2xl bg-white/40 border border-[#4a3728]/10 animate-pulse h-40" />
                        ))}
                    </div>
                )}

                {/* Error state */}
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

                {/* Empty state */}
                {!loading && !error && viewers.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                            <Eye className="w-8 h-8 text-purple-400" />
                        </div>
                        <p className="text-[#4a3728]/70 text-sm font-medium">No profile views yet.</p>
                    </div>
                )}

                {/* Viewer grid */}
                {!loading && !error && viewers.length > 0 && (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {viewers.map((v) => (
                                <div
                                    key={v.viewId}
                                    className="rounded-2xl bg-white/60 border border-[#4a3728]/10 p-4 flex flex-col items-center text-center"
                                >
                                    <div className="w-14 h-14 rounded-full bg-[#e0d8cf] flex items-center justify-center mb-2 overflow-hidden">
                                    {v.viewer?.photoUrl ? (
                                      <img
                                      src={v.viewer.photoUrl}
                                      alt={v.viewer.name}
                                      className="w-full h-full object-cover"
                                      />
                                      ) : (
                                         
                                    <Users className="w-6 h-6 text-[#4a3728]/50" />
                                          )}
</div>
                                    <p className="text-sm font-semibold text-[#4a3728]">
                                        {v.viewer ? v.viewer.name : 'Someone'}
                                    </p>
                                    <p className="text-xs text-[#4a3728]/50 mt-1">
                                        {new Date(v.timestamp).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {hasMore && (
                            <div className="mt-10 flex justify-center">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#4a3728] to-[#6a5748] text-white rounded-2xl hover:shadow-2xl transition-all font-medium disabled:opacity-70"
                                >
                                    {loadingMore ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Loading…</span>
                                        </>
                                    ) : (
                                        <span>Load more</span>
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}