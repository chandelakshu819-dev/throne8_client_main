'use client';

import React, { useState ,useEffect} from 'react';
import { useRouter } from 'next/navigation';
import { X, Eye, TrendingUp, Calendar, User } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import AnalyticsService from '@/lib/api/analytics.service';
import ConnectionService from '@/lib/api/connection.service';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface ProfileViewer {
    viewerId: string | null;
    viewerName: string;
    viewerHeadline: string | null;
    viewerPhotoUrl: string | null;
    viewedAt: string;
    isAnonymous: boolean;
}

interface ProfileViewsModalProps {
    isOpen: boolean;
    onClose: () => void;
    analytics: any;
}


// ✅ FIX: "2h ago" jaisa relative time dikhane ke liye helper.
// Agar 7 din se zyada purana view hai, to readable date dikha do
// (warna "45d ago" jaisa ajeeb lagega).
const formatRelativeTime = (dateString: string): string => {
    const viewedDate = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - viewedDate.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;

    return viewedDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: viewedDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
};

// const generateViewsGraphData = (days: number) => {
//     const labels = [];
//     const views = [];

//     for (let i = days - 1; i >= 0; i--) {
//         const date = new Date();
//         date.setDate(date.getDate() - i);
//         labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
//         views.push(Math.floor(Math.random() * 50) + 10);
//     }

//     return { labels, views };
// };

const ProfileViewsModal: React.FC<ProfileViewsModalProps> = ({
    isOpen,
    onClose,
    analytics
}) => {
    const router = useRouter();
    const { user } = useAuth();

    const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30);
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customDays, setCustomDays] = useState('');

    const [viewers, setViewers] = useState<ProfileViewer[]>([]);
    const [isLoadingViewers, setIsLoadingViewers] = useState(false);
    const [graphData, setGraphData] = useState<{ labels: string[]; views: number[] }>({ labels: [], views: [] });

    // ✅ FIX: connected users ki ek Set banate hain (fast lookup ke liye),
    // taaki har viewer ke liye check kar saken ki hum unse pehle se connected hain ya nahi
    const [connectedUserIds, setConnectedUserIds] = useState<Set<string>>(new Set());

    // ✅ FIX: jinhe request bhej di hai (is session mein), unko track karne ke liye —
    // taaki button turant "Pending" dikha de bina refresh kiye
    const [pendingRequestIds, setPendingRequestIds] = useState<Set<string>>(new Set());
    // ✅ FIX: kis viewer ke Connect button pe abhi request bhej rahe hain (loading state)
    const [connectingId, setConnectingId] = useState<string | null>(null);






    useEffect(() => {
        if (!isOpen) return;

        const loadData = async () => {
            setIsLoadingViewers(true);
            try {
                const [detailRes, trendRes, connectionsRes] = await Promise.all([
                    AnalyticsService.getProfileViewsDetail(true, 1, 20),
                    AnalyticsService.getProfileViewsTrend(timeRange, 'day'),
                    user?.userId ? ConnectionService.getUserConnections(user.userId) : Promise.resolve(null)
                ]);

                setViewers(detailRes?.data?.views || []);

                const trend = trendRes?.data?.trend || [];
                setGraphData({
                    labels: trend.map((t: any) =>
                        new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    ),
                    views: trend.map((t: any) => t.views)
                });

                // ✅ FIX: connections list se ek Set banao — jisme doosre wale user ki id ho
                // (fromUserId/toUserId mein se jo current user nahi hai wo), sirf 'active' status wale
                if (connectionsRes && user?.userId) {
                    const connections = connectionsRes?.data?.data || connectionsRes?.data || [];
                    const ids = new Set<string>(
                        connections
                            .filter((c: any) => c.status === 'active')
                            .map((c: any) =>
                                c.fromUserId === user.userId ? c.toUserId : c.fromUserId
                            )
                    );
                    setConnectedUserIds(ids);
                }
            } catch (error) {
                console.error('Failed to load profile views data:', error);
                setViewers([]);
                setGraphData({ labels: [], views: [] });
            } finally {
                setIsLoadingViewers(false);
            }
        };

        loadData();
    }, [isOpen, timeRange, user?.userId]);

     // ✅ Scroll lock effect — YAHA ADD KARO
     useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    // ✅ FIX: Connect button click hone par connection request bhejta hai
    const handleConnect = async (targetUserId: string) => {
        if (connectingId) return; // ek time pe ek hi request
        try {
            setConnectingId(targetUserId);
            await ConnectionService.sendConnectionRequest({ toUserId: targetUserId });
            setPendingRequestIds((prev) => new Set(prev).add(targetUserId));
        } catch (error: any) {
            alert(
                error.message?.includes('already exists')
                    ? 'Connection request already sent'
                    : (error.message || 'Failed to send connection request')
            );
        } finally {
            setConnectingId(null);
        }
    };

    const chartData = {
        labels: graphData.labels,
        datasets: [
            {
                label: 'Profile Views',
                data: graphData.views,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#3b82f6',
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

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#f6ede8] rounded-3xl shadow-2xl border border-[#e0d8cf] max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#7a5c3e] to-[#5f4630] p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Eye className="w-8 h-8 text-white" />
                        <div>
                            <h2 className="text-2xl font-bold text-white">Profile Views</h2>
                            <p className="text-sm text-white/80">
                                Total Views: <span className="font-bold">{analytics?.profileViews?.total || 0}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Graph Controls */}
                    <div className="mb-6 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-[#4a3728]">Views Over Time</h3>
                        <div className="flex gap-2 items-center">
                            {[7, 30, 90].map((days) => (
                                <button
                                    key={days}
                                    onClick={() => {
                                        setTimeRange(days as 7 | 30 | 90);
                                        setShowCustomInput(false);
                                    }}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeRange === days && !showCustomInput
                                            ? 'bg-[#7a5c3e] text-white'
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
                                        ? 'bg-[#7a5c3e] text-white'
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
                                        className="w-20 px-3 py-2 rounded-lg border border-[#e0d8cf] text-sm focus:outline-none focus:ring-2 focus:ring-[#7a5c3e] text-[#4a3728]"
                                    />
                                    <button
                                        onClick={() => {
                                            const days = parseInt(customDays);
                                            if (days > 0 && days <= 365) {
                                                setTimeRange(days as any);
                                            }
                                        }}
                                        className="px-3 py-2 bg-[#7a5c3e] text-white rounded-lg text-sm font-medium hover:bg-[#6b4e34] transition-all"
                                    >
                                        Apply
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Graph */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-[#e0d8cf] mb-6">
                        <div style={{ height: '250px' }}>
                            <Line data={chartData} options={chartOptions} />
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-xl p-4 shadow border border-[#e0d8cf]">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-5 h-5 text-blue-500" />
                                <span className="text-sm text-[#7a5c3e]">Last 7 Days</span>
                            </div>
                            <p className="text-2xl font-bold text-[#4a3728]">
                                {analytics?.profileViews?.last7Days || 0}
                            </p>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow border border-[#e0d8cf]">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-5 h-5 text-blue-500" />
                                <span className="text-sm text-[#7a5c3e]">Last 30 Days</span>
                            </div>
                            <p className="text-2xl font-bold text-[#4a3728]">
                                {analytics?.profileViews?.last30Days || 0}
                            </p>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow border border-[#e0d8cf]">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-5 h-5 text-blue-500" />
                                <span className="text-sm text-[#7a5c3e]">Last 90 Days</span>
                            </div>
                            <p className="text-2xl font-bold text-[#4a3728]">
                                {analytics?.profileViews?.last90Days || 0}
                            </p>
                        </div>
                    </div>

                    {/* Who Viewed Your Profile */}
                    <div>
                        <h3 className="text-xl font-bold text-[#4a3728] mb-4">
                            Who Viewed Your Profile
                        </h3>
                        <div className="space-y-3">
                            {isLoadingViewers ? (
                                <p className="text-sm text-[#7a5c3e] text-center py-8">Loading viewers...</p>
                            ) : viewers.length === 0 ? (
                                <p className="text-sm text-[#7a5c3e] text-center py-8">No profile views yet</p>
                            ) : (
                                viewers.map((viewer, index) => (
                                    <div
                                        key={viewer.viewerId || index}
                                        className="bg-white rounded-xl p-4 shadow border border-[#e0d8cf] hover:shadow-lg transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            {viewer.viewerPhotoUrl ? (
                                                <img
                                                    src={viewer.viewerPhotoUrl}
                                                    alt={viewer.viewerName}
                                                    className="w-14 h-14 rounded-xl object-cover border-2 border-[#c4a789]"
                                                />
                                            ) : (
                                                <div className="w-14 h-14 rounded-xl border-2 border-[#c4a789] bg-[#f0e6d8] flex items-center justify-center flex-shrink-0">
                                                    <span className="text-[#7a5c3e] font-bold text-lg">
                                                        {viewer.viewerName?.charAt(0)?.toUpperCase() || '?'}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-bold text-[#4a3728]">{viewer.viewerName}</h4>
                                                </div>
                                                {viewer.viewerHeadline && (
                                                    <p className="text-sm text-[#7a5c3e] mb-2">{viewer.viewerHeadline}</p>
                                                )}
                                                <div className="text-xs text-[#7a5c3e]">
                                                    <span title={new Date(viewer.viewedAt).toLocaleString()}>
                                                        Viewed {formatRelativeTime(viewer.viewedAt)}
                                                    </span>
                                                </div>
                                            </div>
                                            {!viewer.isAnonymous && viewer.viewerId && (
                                                connectedUserIds.has(viewer.viewerId) ? (
                                                    <button
                                                        onClick={() => router.push(`/message/${user?.userId}?chatWith=${viewer.viewerId}`)}
                                                        className="px-4 py-2 bg-[#4a3728] text-white rounded-lg hover:bg-[#3a2b1f] transition-all text-sm font-semibold"
                                                    >
                                                        Message
                                                    </button>
                                                ) : pendingRequestIds.has(viewer.viewerId) ? (
                                                    <button
                                                        disabled
                                                        className="px-4 py-2 bg-[#e0d8cf] text-[#7a5c3e] rounded-lg text-sm font-semibold cursor-not-allowed"
                                                    >
                                                        Pending
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleConnect(viewer.viewerId as string)}
                                                        disabled={connectingId === viewer.viewerId}
                                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {connectingId === viewer.viewerId ? 'Sending...' : 'Connect'}
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileViewsModal;