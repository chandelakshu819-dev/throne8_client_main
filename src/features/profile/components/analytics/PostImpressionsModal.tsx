'use client';

import React, { useState,useEffect } from 'react';
import { usePostsData } from '@/features/profile/hooks/usePostsData';
import { usePostImpressions } from '@/hooks/analytics/usePostImpressions';
import AnalyticsService from '@/lib/api/analytics.service';
import { X, TrendingUp, BarChart3, Users, Eye, MousePointer, Share2 } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface PostImpressionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    analytics: any;
    userId?: string;   // ✅ naya prop

}

// Dummy data
const generateDummyGraphData = (days: number) => {
    const labels = [];
    const impressions = [];
    const engagements = [];

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        impressions.push(Math.floor(Math.random() * 500) + 100);
        engagements.push(Math.floor(Math.random() * 200) + 50);
    }

    return { labels, impressions, engagements };
};

// const dummyPosts = [
//     {
//         id: 1,
//         title: 'Excited to share our new product launch! 🚀',
//         date: '2 days ago',
//         impressions: 1250,
//         engagements: 340,
//         clicks: 120,
//         shares: 45
//     },
//     {
//         id: 2,
//         title: 'Great insights from today\'s conference',
//         date: '5 days ago',
//         impressions: 890,
//         engagements: 210,
//         clicks: 85,
//         shares: 28
//     },
//     {
//         id: 3,
//         title: 'Team building activity highlights',
//         date: '1 week ago',
//         impressions: 650,
//         engagements: 180,
//         clicks: 60,
//         shares: 15
//     }
// ];

const dummyFollowersData = {
    totalFollowers: 3282,
    newFollowers7Days: 145,
    newFollowers30Days: 580,
    followersByLocation: [
        { location: 'India', percentage: 45 },
        { location: 'United States', percentage: 25 },
        { location: 'United Kingdom', percentage: 15 },
        { location: 'Canada', percentage: 10 },
        { location: 'Others', percentage: 5 }
    ],
    followersByIndustry: [
        { industry: 'Technology', percentage: 40 },
        { industry: 'Business Services', percentage: 25 },
        { industry: 'Marketing', percentage: 20 },
        { industry: 'Finance', percentage: 10 },
        { industry: 'Others', percentage: 5 }
    ],
    followersBySeniority: [
        { level: 'Entry Level', percentage: 30 },
        { level: 'Mid-Senior', percentage: 45 },
        { level: 'Director', percentage: 15 },
        { level: 'Executive', percentage: 10 }
    ]
};

const PostImpressionsModal: React.FC<PostImpressionsModalProps> = ({
    isOpen,
    onClose,
    analytics,
    userId   // ✅ naya prop

}) => {
    const [activeTab, setActiveTab] = useState<'posts' | 'audience'>('posts');
    const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30);
    const [graphType, setGraphType] = useState<'impressions' | 'engagements'>('impressions');
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customDays, setCustomDays] = useState('');
    const { change, isLoading: changeLoading } = usePostImpressions({ days: timeRange });

    const [discoveryStats, setDiscoveryStats] = useState<any>(null);
const [discoveryLoading, setDiscoveryLoading] = useState(false);

useEffect(() => {
    if (!isOpen) return;

    const fetchDiscoveryStats = async () => {
        setDiscoveryLoading(true);
        try {
            const result = await AnalyticsService.getDiscoveryStats(timeRange);
            setDiscoveryStats(result?.data || result);
        } catch (error) {
            console.error('Failed to fetch discovery stats:', error);
        } finally {
            setDiscoveryLoading(false);
        }
    };

    fetchDiscoveryStats();
}, [isOpen, timeRange]);


const { userPosts, fetchUserPosts } = usePostsData(userId);
const [postsWithStats, setPostsWithStats] = useState<any[]>([]);
const [postsStatsLoading, setPostsStatsLoading] = useState(false);

useEffect(() => {
    if (!isOpen || !userId) return;
    fetchUserPosts(userId);
}, [isOpen, userId]);

useEffect(() => {
    if (!isOpen || userPosts.length === 0) return;

    const top3 = [...userPosts]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);

    const fetchStats = async () => {
        setPostsStatsLoading(true);
        try {
            const results = await Promise.all(
                top3.map(async (post) => {
                    try {
                        const res = await AnalyticsService.getPostAnalytics(post.postId, 30);
                        const stats = res?.data || res;
                        return {
                            id: post.postId,
                            title: post.title || post.text || 'Untitled post',
                            date: post.time,
                            impressions: stats?.totalImpressions || 0,
                            engagements: (
                                (stats?.engagement?.likes || 0) +
                                (stats?.engagement?.comments || 0) +
                                (stats?.engagement?.shares || 0) +
                                (stats?.engagement?.saves || 0)
                            ),
                            shares: stats?.engagement?.shares || 0,
                        };
                    } catch (err) {
                        console.error('Failed to fetch stats for post', post.postId, err);
                        return {
                            id: post.postId,
                            title: post.title || post.text || 'Untitled post',
                            date: post.time,
                            impressions: 0,
                            engagements: 0,
                            shares: 0,
                        };
                    }
                })
            );
            setPostsWithStats(results);
        } finally {
            setPostsStatsLoading(false);
        }
    };

    fetchStats();
}, [isOpen, userPosts]);

    if (!isOpen) return null;

    const graphData = generateDummyGraphData(timeRange);

    const chartData = {
        labels: graphData.labels,
        datasets: [
            {
                label: graphType === 'impressions' ? 'Impressions' : 'Engagements',
                data: graphType === 'impressions' ? graphData.impressions : graphData.engagements,
                borderColor: graphType === 'impressions' ? '#3b82f6' : '#10b981',
                backgroundColor: graphType === 'impressions'
                    ? 'rgba(59, 130, 246, 0.1)'
                    : 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: graphType === 'impressions' ? '#3b82f6' : '#10b981',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: '#4a3728',
                padding: 12,
                borderRadius: 8,
                titleColor: '#f6ede8',
                bodyColor: '#f6ede8'
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: '#7a5c3e',
                    font: {
                        size: 11
                    }
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(122, 92, 62, 0.1)'
                },
                ticks: {
                    color: '#7a5c3e',
                    font: {
                        size: 11
                    }
                }
            }
        }
    };

    const followersGraphData = generateDummyGraphData(timeRange);
    const followersChartData = {
        labels: followersGraphData.labels,
        datasets: [
            {
                label: 'Followers',
                data: followersGraphData.impressions.map(v => v / 10),
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#8b5cf6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }
        ]
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#f6ede8] rounded-3xl shadow-2xl border border-[#e0d8cf] max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#4a3728] to-[#7a5c3e] p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-[#f6ede8]" />
                        <div>
                            <h2 className="text-2xl font-bold text-[#f6ede8]">Analytics Dashboard</h2>
                            <p className="text-sm text-[#f6ede8]/80">Detailed insights and metrics</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                    >
                        <X className="w-6 h-6 text-[#f6ede8]" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="bg-white border-b border-[#e0d8cf] px-6 pt-4">
                    <div className="flex gap-6">
                        <button
                            onClick={() => setActiveTab('posts')}
                            className={`pb-4 px-2 font-semibold transition-all ${activeTab === 'posts'
                                ? 'text-[#4a3728] border-b-2 border-[#4a3728]'
                                : 'text-[#7a5c3e] hover:text-[#4a3728]'
                                }`}
                        >
                            Posts Analytics
                        </button>
                        <button
                            onClick={() => setActiveTab('audience')}
                            className={`pb-4 px-2 font-semibold transition-all ${activeTab === 'audience'
                                ? 'text-[#4a3728] border-b-2 border-[#4a3728]'
                                : 'text-[#7a5c3e] hover:text-[#4a3728]'
                                }`}
                        >
                            Audience
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'posts' ? (
                        <>
                            {/* Graph Controls */}
                            <div className="mb-6 flex justify-between items-center">
                                <div className="flex gap-2 items-center">
                                    {[7, 30, 90].map((days) => (
                                        <button
                                            key={days}
                                            onClick={() => {
                                                setTimeRange(days as 7 | 30 | 90);
                                                setShowCustomInput(false);
                                            }}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeRange === days && !showCustomInput
                                                    ? 'bg-[#4a3728] text-white'
                                                    : 'bg-[#e0d8cf] text-[#7a5c3e] hover:bg-[#d4c4b5]'
                                                }`}
                                        >
                                            {days} days
                                        </button>
                                    ))}

                                    {/* Custom Days Button */}
                                    <button
                                        onClick={() => setShowCustomInput(!showCustomInput)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${showCustomInput
                                                ? 'bg-[#4a3728] text-white'
                                                : 'bg-[#e0d8cf] text-[#7a5c3e] hover:bg-[#d4c4b5]'
                                            }`}
                                    >
                                        Custom
                                    </button>

                                    {/* Custom Input Field */}
                                    {showCustomInput && (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="1"
                                                max="365"
                                                value={customDays}
                                                onChange={(e) => setCustomDays(e.target.value)}
                                                placeholder="Days"
                                                className="w-20 px-3 py-2 rounded-lg border border-[#e0d8cf] text-sm focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-[#4a3728]"
                                            />
                                            <button
                                                onClick={() => {
                                                    const days = parseInt(customDays);
                                                    if (days > 0 && days <= 365) {
                                                        setTimeRange(days as any);
                                                    }
                                                }}
                                                className="px-3 py-2 bg-[#4a3728] text-white rounded-lg text-sm font-medium hover:bg-[#3a2b1f] transition-all"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setGraphType('impressions')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${graphType === 'impressions'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-[#e0d8cf] text-[#7a5c3e] hover:bg-[#d4c4b5]'
                                            }`}
                                    >
                                        Impressions
                                    </button>
                                    <button
                                        onClick={() => setGraphType('engagements')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${graphType === 'engagements'
                                            ? 'bg-green-500 text-white'
                                            : 'bg-[#e0d8cf] text-[#7a5c3e] hover:bg-[#d4c4b5]'
                                            }`}
                                    >
                                        Engagements
                                    </button>
                                </div>
                            </div>

                            {/* Graph */}
                            <div className="bg-white rounded-2xl p-6 shadow-lg border border-[#e0d8cf] mb-6">
                                <div className="mb-4">
                                    <h3 className="text-lg font-bold text-[#4a3728]">
                                        {graphType === 'impressions' ? 'Post Impressions' : 'Post Engagements'} Over Time
                                    </h3>
                                    <p className="text-xs text-[#7a5c3e] mt-1">
                                        Daily data is recorded in UTC
                                    </p>
                                </div>
                                <div style={{ height: '300px' }}>
                                    <Line data={chartData} options={chartOptions} />
                                </div>
                            </div>

                            {/* Discovery Stats */}
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-[#4a3728] mb-4">Discovery</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white rounded-xl p-4 shadow border border-[#e0d8cf]">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Eye className="w-5 h-5 text-blue-500" />
                                            <span className="text-sm text-[#7a5c3e]">Total Impressions</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-2xl font-bold text-[#4a3728]">
                                                {analytics?.postImpressions?.total || 0}
                                            </p>
                                            {!changeLoading && change?.change && (
                                                <span
                                                    className={`text-xs font-semibold ${
                                                        change.change.trend === 'up'
                                                            ? 'text-green-600'
                                                            : 'text-red-600'
                                                    }`}
                                                >
                                                    {change.change.trend === 'up' ? '▲' : '▼'}{' '}
                                                    {Math.abs(change.change.percentage)}%
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-xl p-4 shadow border border-[#e0d8cf]">
    <div className="flex items-center gap-3 mb-2">
        <MousePointer className="w-5 h-5 text-green-500" />
        <span className="text-sm text-[#7a5c3e]">Total Engagements</span>
    </div>
    <p className="text-2xl font-bold text-[#4a3728]">
        {discoveryLoading ? '...' : (discoveryStats?.totalEngagements ?? 0)}
    </p>
</div>
<div className="bg-white rounded-xl p-4 shadow border border-[#e0d8cf]">
    <div className="flex items-center gap-3 mb-2">
        <Users className="w-5 h-5 text-purple-500" />
        <span className="text-sm text-[#7a5c3e]">Members Reached</span>
    </div>
    <p className="text-2xl font-bold text-[#4a3728]">
        {discoveryLoading ? '...' : (discoveryStats?.membersReached ?? 0)}
    </p>
</div>
                                </div>
                            </div>

                            {/* Posts List */}

                            <div>
    <h3 className="text-xl font-bold text-[#4a3728] mb-4">Recent Posts Performance</h3>
    <div className="space-y-4">
        {postsStatsLoading && (
            <p className="text-sm text-[#7a5c3e]">Loading post stats...</p>
        )}
        {!postsStatsLoading && postsWithStats.length === 0 && (
            <p className="text-sm text-[#7a5c3e]">No posts yet.</p>
        )}
        {postsWithStats.map((post) => (
            <div key={post.id} className="bg-white rounded-xl p-5 shadow border border-[#e0d8cf] hover:shadow-lg transition-all">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                        <p className="font-semibold text-[#4a3728] mb-1">{post.title}</p>
                        <p className="text-xs text-[#7a5c3e]">{post.date}</p>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                        <p className="text-lg font-bold text-blue-600">{post.impressions}</p>
                        <p className="text-xs text-[#7a5c3e]">Impressions</p>
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-bold text-green-600">{post.engagements}</p>
                        <p className="text-xs text-[#7a5c3e]">Engagements</p>
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-bold text-orange-600">{post.shares}</p>
                        <p className="text-xs text-[#7a5c3e]">Shares</p>
                    </div>
                </div>
            </div>
        ))}
    </div>
</div>
                           
                        </>
                    ) : (
                        <>
                            {/* Followers Graph */}
                            <div className="bg-white rounded-2xl p-6 shadow-lg border border-[#e0d8cf] mb-6">
                                <div className="mb-4">
                                    <h3 className="text-lg font-bold text-[#4a3728]">Followers Growth</h3>
                                    <p className="text-xs text-[#7a5c3e] mt-1">
                                        Total Followers: {dummyFollowersData.totalFollowers}
                                    </p>
                                </div>
                                <div style={{ height: '300px' }}>
                                    <Line data={followersChartData} options={chartOptions} />
                                </div>
                            </div>

                            {/* Followers Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="bg-white rounded-xl p-4 shadow border border-[#e0d8cf]">
                                    <p className="text-sm text-[#7a5c3e] mb-1">New Followers (7 days)</p>
                                    <p className="text-2xl font-bold text-[#4a3728]">
                                        +{dummyFollowersData.newFollowers7Days}
                                    </p>
                                </div>
                                <div className="bg-white rounded-xl p-4 shadow border border-[#e0d8cf]">
                                    <p className="text-sm text-[#7a5c3e] mb-1">New Followers (30 days)</p>
                                    <p className="text-2xl font-bold text-[#4a3728]">
                                        +{dummyFollowersData.newFollowers30Days}
                                    </p>
                                </div>
                            </div>

                            {/* Demographics */}
                            <h3 className="text-xl font-bold text-[#4a3728] mb-4">Top Demographics of Followers</h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* By Location */}
                                <div className="bg-white rounded-xl p-5 shadow border border-[#e0d8cf]">
                                    <h4 className="font-bold text-[#4a3728] mb-4">By Location</h4>
                                    <div className="space-y-3">
                                        {dummyFollowersData.followersByLocation.map((item, idx) => (
                                            <div key={idx}>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm text-[#7a5c3e]">{item.location}</span>
                                                    <span className="text-sm font-semibold text-[#4a3728]">{item.percentage}%</span>
                                                </div>
                                                <div className="w-full h-2 bg-[#e0d8cf] rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 rounded-full"
                                                        style={{ width: `${item.percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* By Industry */}
                                <div className="bg-white rounded-xl p-5 shadow border border-[#e0d8cf]">
                                    <h4 className="font-bold text-[#4a3728] mb-4">By Industry</h4>
                                    <div className="space-y-3">
                                        {dummyFollowersData.followersByIndustry.map((item, idx) => (
                                            <div key={idx}>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm text-[#7a5c3e]">{item.industry}</span>
                                                    <span className="text-sm font-semibold text-[#4a3728]">{item.percentage}%</span>
                                                </div>
                                                <div className="w-full h-2 bg-[#e0d8cf] rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-green-500 rounded-full"
                                                        style={{ width: `${item.percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* By Seniority */}
                                <div className="bg-white rounded-xl p-5 shadow border border-[#e0d8cf]">
                                    <h4 className="font-bold text-[#4a3728] mb-4">By Seniority</h4>
                                    <div className="space-y-3">
                                        {dummyFollowersData.followersBySeniority.map((item, idx) => (
                                            <div key={idx}>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm text-[#7a5c3e]">{item.level}</span>
                                                    <span className="text-sm font-semibold text-[#4a3728]">{item.percentage}%</span>
                                                </div>
                                                <div className="w-full h-2 bg-[#e0d8cf] rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-purple-500 rounded-full"
                                                        style={{ width: `${item.percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PostImpressionsModal;