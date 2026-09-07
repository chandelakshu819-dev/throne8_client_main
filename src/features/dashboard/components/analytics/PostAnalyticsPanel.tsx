'use client';
// src/features/dashboard/components/analytics/PostAnalyticsPanel.tsx

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import AnalyticsService from '@/lib/api/analytics.service';

interface PostAnalyticsPanelProps {
    post: any;
    isDarkMode: boolean;
    onClose: () => void;
}

const PostAnalyticsPanel: React.FC<PostAnalyticsPanelProps> = ({ post, isDarkMode, onClose }) => {
    const [stats, setStats] = useState<{
        impressions: number;
        shares: number;
        uniqueViewers: number;
        sourceBreakdown: Record<string, number>;
    } | null>(null);
    const [demographics, setDemographics] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const postId = post?.entryId || post?.postId;

    useEffect(() => {
        if (!postId) return;
        let cancelled = false;
        setIsLoading(true);

        Promise.all([
            AnalyticsService.getPostImpressionStats(postId),
            AnalyticsService.getViewerDemographics(),
        ])
            .then(([statsRes, demoRes]) => {
                if (cancelled) return;
                const s = statsRes?.data || statsRes;
                setStats({
                    impressions: s?.totalImpressions ?? 0,
                    shares: s?.shares ?? 0,
                    uniqueViewers: s?.uniqueViewers ?? 0,
                    sourceBreakdown: s?.sourceBreakdown ?? {},
                });
                setDemographics(demoRes?.data || demoRes);
            })
            .catch(() => {
                if (!cancelled) {
                    setStats({ impressions: 0, shares: 0, uniqueViewers: 0, sourceBreakdown: {} });
                    setDemographics(null);
                }
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => { cancelled = true; };
    }, [postId]);

    if (!post) return null;

    const likes = post.likesCount || post.likes || 0;
    const comments = post.commentsCount || 0;
    const shares = stats?.shares ?? 0;
    const impressions = stats?.impressions ?? 0;
    const uniqueViewers = stats?.uniqueViewers ?? 0;
    const sourceBreakdown = stats?.sourceBreakdown ?? {};
    const totalSourceHits = Object.values(sourceBreakdown).reduce((a: number, b: any) => a + b, 0) as number;
    const inNetworkSources = ['feed', 'profile', 'direct'];
    const inNetworkCount = inNetworkSources.reduce((sum, s) => sum + (sourceBreakdown[s] || 0), 0);
    const inNetworkPct = totalSourceHits > 0 ? Math.round((inNetworkCount / totalSourceHits) * 100) : 0;
    const outNetworkPct = totalSourceHits > 0 ? 100 - inNetworkPct : 0;
    const engagementPct = impressions > 0
        ? Math.min(100, Math.round(((likes + comments + shares) / impressions) * 100))
        : 0;

    const demoBar = (label: string, pct: number) => (
        <div className="mb-3" key={label}>
            <div className="flex justify-between mb-1">
                <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>{label}</span>
                <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>{pct}%</span>
            </div>
            <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-[#e0d8cf]'}`}>
                <div
                    className="h-full rounded-full bg-gradient-to-r from-[#8b7355] to-[#4a3728]"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
            <div className={`w-full sm:w-[90%] md:w-[600px] h-full overflow-y-auto shadow-2xl border-l ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-[#f6ede8] border-[#e0d8cf]'}`}>

                {/* Sticky header */}
                <div className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b ${isDarkMode ? 'bg-slate-800/95 border-slate-700' : 'bg-[#f6ede8]/95 border-[#e0d8cf]'} backdrop-blur`}>
                    <h2 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>Post Analytics</h2>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-[#e0d8cf] text-[#4a3728]/70'}`}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Post preview */}
                    <div className={`flex gap-3 mb-6 p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-700/40 border-slate-600' : 'bg-white/60 border-[#e0d8cf]'}`}>
                        {post.images?.[0]?.cloudinarySecureUrl && (
                            <img
                                src={post.images[0].cloudinarySecureUrl}
                                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                                alt=""
                            />
                        )}
                        <div className="min-w-0">
                            <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/50'}`}>
                                Post
                            </p>
                            <p className={`text-sm line-clamp-2 ${isDarkMode ? 'text-slate-200' : 'text-[#4a3728]'}`}>
                                {post.content || post.text || post.title || 'No text content'}
                            </p>
                        </div>
                    </div>

                    {isLoading ? (
                        <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/60'}`}>Loading analytics...</p>
                    ) : (
                        <>
                            {/* Discovery */}
                            <h3 className={`text-lg font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>Discovery</h3>
                            <div className={`p-5 rounded-2xl border mb-6 ${isDarkMode ? 'bg-slate-700/40 border-slate-600' : 'bg-white/60 border-[#e0d8cf]'}`}>
                                <p className={`text-4xl font-black mb-1 ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>
                                    {impressions.toLocaleString()}
                                </p>
                                <p className={`text-sm mb-4 ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/60'}`}>Impressions</p>

                                <div className="flex justify-between text-sm mb-1">
                                    <span className={isDarkMode ? 'text-slate-300' : 'text-[#4a3728]/80'}>In-network (feed/profile/direct)</span>
                                    <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>{inNetworkPct}%</span>
                                </div>
                                <div className="flex justify-between text-sm mb-4">
                                    <span className={isDarkMode ? 'text-slate-300' : 'text-[#4a3728]/80'}>Out-of-network (search/hashtag)</span>
                                    <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>{outNetworkPct}%</span>
                                </div>

                                <p className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>
                                    {uniqueViewers.toLocaleString()}
                                </p>
                                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/60'}`}>
                                    Members reached (unique viewers)
                                </p>
                            </div>

                            {/* Engagement */}
                            <h3 className={`text-lg font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>Engagement</h3>
                            <div className={`p-5 rounded-2xl border mb-6 ${isDarkMode ? 'bg-slate-700/40 border-slate-600' : 'bg-white/60 border-[#e0d8cf]'}`}>
                                <p className={`text-3xl font-black mb-4 ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>
                                    {(likes + comments + shares).toLocaleString()}{' '}
                                    <span className="text-sm font-normal">Social engagements</span>
                                </p>
                                <div className="space-y-2">
                                    {[
                                        ['Reactions', likes],
                                        ['Comments', comments],
                                        ['Reposts / Shares', shares],
                                    ].map(([label, val]) => (
                                        <div key={label as string} className="flex justify-between text-sm">
                                            <span className={isDarkMode ? 'text-slate-300' : 'text-[#4a3728]/80'}>{label}</span>
                                            <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>{val as number}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4">
                                    <div className="flex justify-between text-xs font-bold mb-1">
                                        <span className={isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/60'}>Engagement Rate</span>
                                        <span className={isDarkMode ? 'text-white' : 'text-[#4a3728]'}>{engagementPct}%</span>
                                    </div>
                                    <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-[#e0d8cf]'}`}>
                                        <div
                                            className="h-full bg-gradient-to-r from-[#8b7355] to-[#4a3728]"
                                            style={{ width: `${engagementPct}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Top demographics — account-level (post-specific not tracked yet) */}
                            <h3 className={`text-lg font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>Top Demographics</h3>
                            <p className={`text-xs mb-3 ${isDarkMode ? 'text-slate-500' : 'text-[#4a3728]/50'}`}>
                                Based on your overall audience (post-specific breakdown coming soon)
                            </p>
                            <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-700/40 border-slate-600' : 'bg-white/60 border-[#e0d8cf]'}`}>
                                {!demographics?.hasEnoughData ? (
                                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/60'}`}>
                                        Not enough data yet.
                                    </p>
                                ) : (
                                    <>
                                        {demographics.locations?.[0] &&
                                            demoBar(`Location: ${demographics.locations[0].location}`, demographics.locations[0].percentage)}
                                        {demographics.industries?.[0] &&
                                            demoBar(`Industry: ${demographics.industries[0].industry}`, demographics.industries[0].percentage)}
                                        {demographics.jobTitles?.[0] &&
                                            demoBar(`Job Title: ${demographics.jobTitles[0].title}`, demographics.jobTitles[0].percentage)}
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PostAnalyticsPanel;