// src/app/notifications/[userid]/page.tsx
"use client";
import TokenStorage from "@/lib/store/token.storage";

import config from "@/config/env.config";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    Bell, MessageCircle, Users, Edit3, CheckCircle, X, Heart, MessageSquare, Bookmark, Search, Filter, Settings, Moon, Sun, Volume2, VolumeX, Zap, TrendingUp, Award, Calendar, MapPin, Eye, EyeOff, Loader2, Wifi, WifiOff, RefreshCw, Trash2
} from "lucide-react";

import NotificationService from "@/lib/api/notification.service";
import { Stats, Notification } from "@/features/notification/interface";
import { useAppSelector, useAppDispatch } from "@/core/store/store.hooks";
import { fetchCurrentUser } from "@/hooks/auth/thunks";
import ProfileService from "@/lib/api/profile.service";

////////////////////////////////////// changed modified
import ConnectionService from "@/lib/api/connection.service";
import FollowService from "@/lib/api/follow.service";
import { useSocket } from "@/core/realtime/useSocket";
import { useRouter } from "next/navigation";


// ─── Helpers ────────────────────────────────────────────────────────────────


function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
}

 function isTodayDate(dateStr: string): boolean {
    const d = new Date(dateStr);
    const n = new Date();
    return (
        d.getDate() === n.getDate() &&
        d.getMonth() === n.getMonth() &&
        d.getFullYear() === n.getFullYear()
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

const NotificationsPage = () => {
    const router = useRouter();
    const [selectedTab, setSelectedTab] = useState("all");
    const [darkMode, setDarkMode] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterBy, setFilterBy] = useState("all");
    const [realTimeEnabled, setRealTimeEnabled] = useState(true);
    const [autoMarkRead, setAutoMarkRead] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [newAlert, setNewAlert] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [stats, setStats] = useState<Stats>({
        unreadCount: 0,
        todayCount: 0,
        engagementRate: 85,
    });
    const [animateCards, setAnimateCards] = useState(false);
    // Tracks requestIds that have been acted on, so Accept/Ignore hides them immediately
    const [actedRequests, setActedRequests] = useState<Set<string>>(new Set());


    ////////////////////////////////////Changed Modified



    ////////////////////////////////////changed modified
    const dispatch = useAppDispatch();
    const profile = useAppSelector((state) => state.login.profile);
    const authUser = useAppSelector((state) => state.login.user);
    const { socket, isConnected: socketConnected } = useSocket();
    const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
    const [connectionStats, setConnectionStats] = useState<{ connections: number } | null>(null);
    const [followStats, setFollowStats] = useState<{ followers: number; following: number } | null>(null);

    useEffect(() => {
        dispatch(fetchCurrentUser());
    }, [dispatch]);

    useEffect(() => {
        if (profile?.profilePhotoId) {
            ProfileService.getProfilePhotoById(profile.profilePhotoId)
                .then((res) => {
                    setProfilePhotoUrl(res?.data?.photo?.cloudinarySecureUrl || null);
                })
                .catch((err) => {
                    console.error('Failed to fetch profile photo:', err);
                });
        }
    }, [profile?.profilePhotoId]);


    /////////////////////////////// changed modified 
    useEffect(() => {
        const userId = profile?.userId || (profile as any)?.id || (profile as any)?._id || authUser?.userId || (authUser as any)?.id;
        if (userId) {
            ConnectionService.getConnectionStats(userId)
                .then((res) => {
                    const stats = res?.data;
                    setConnectionStats({
                        connections: stats?.accepted?.total ?? 0,
                    });
                })
                .catch((err) => {
                    console.error('Failed to fetch connection stats:', err);
                    setConnectionStats({ connections: 0 });
                });
        }
    }, [profile?.userId, (profile as any)?.id, (profile as any)?._id, authUser?.userId, (authUser as any)?.id]);



    useEffect(() => {
        const userId = profile?.userId || (profile as any)?.id || (profile as any)?._id || authUser?.userId || (authUser as any)?.id;
        if (userId) {
            FollowService.getFollowCounts(userId)
                .then((res) => {
                    const data = res?.data;
                    setFollowStats({
                        followers: data?.followersCount ?? 0,
                        following: data?.followingCount ?? 0,
                    });
                })
                .catch((err) => {
                    console.error('Failed to fetch follow counts:', err);
                    setFollowStats({ followers: 0, following: 0 });
                });
        }
    }, [profile?.userId, (profile as any)?.id, (profile as any)?._id, authUser?.userId, (authUser as any)?.id]);




    const audioRef = useRef<HTMLAudioElement | null>(null);
    const WS_URL = config?.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_WS_URL;
    // const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    // const token =
    //     typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

    // ── Fetch notifications from REST API ─────────────────────────────────────
    const fetchNotifications = useCallback(
        async (pageNum = 1, append = false) => {
            if (append) setLoadingMore(true);
            else setIsLoading(true);

            try {
                const json = await NotificationService.getNotifications({ page: pageNum, limit: 20 });

                //////////////////////////////Changed Modified
                if (json.success) {


                    const data: Notification[] = json.data.notifications || [];
                    console.log('NOTIFICATIONS DATA:', JSON.stringify(data, null, 2));
                    setNotifications((prev) => (append ? [...prev, ...data] : data));


                    setHasMore(data.length === 20);
                    setStats({
                        unreadCount: json.data.unreadCount || 0,
                        todayCount: data.filter((n) => isTodayDate(n.createdAt)).length,
                        engagementRate: 85,
                    });
                }
            } catch (err) {
                console.error("Failed to fetch notifications:", err);
                // socket se live aate rahenge
            } finally {
                setIsLoading(false);
                setLoadingMore(false);
                setAnimateCards(true);
            }
        },
        [] // token dependency hata do
    );

    useEffect(() => {
        fetchNotifications(1, false);
    }, [fetchNotifications]);






    //////////////////////////////////changed Modified 
    // ── Poll for new notifications every 15 seconds (frontend-only) ──
    useEffect(() => {
        if (!realTimeEnabled) return;

        setIsConnected(true);

        const interval = setInterval(async () => {
            try {
                const json = await NotificationService.getNotifications({ page: 1, limit: 20 });
                if (json.success) {
                    const data: Notification[] = json.data.notifications || [];

                    setNotifications((prev) => {
                        const prevIds = new Set(prev.map((n) => n.notificationId));
                        const hasNew = data.some((n) => !prevIds.has(n.notificationId));

                        if (hasNew) {
                            setNewAlert(true);
                            setTimeout(() => setNewAlert(false), 3500);
                            if (soundEnabled) playNotifSound();
                        }

                        return data;
                    });

                    setStats((prev) => ({
                        ...prev,
                        unreadCount: json.data.unreadCount || 0,
                        todayCount: data.filter((n) => isTodayDate(n.createdAt)).length,
                    }));
                }
            } catch (err) {
                console.error("Polling failed:", err);
                setIsConnected(false);
            }
        }, 15000);

        return () => clearInterval(interval);
    }, [realTimeEnabled, soundEnabled]);

    // ── Socket: subscribe to notification:new and notification:unread:count ──
    useEffect(() => {
        if (!socket || !socketConnected) return;

        const handleNew = (payload: Notification) => {
            if (!payload?.notificationId) return;
            setNotifications((prev) => {
                // Deduplicate — if the polling already stored this ID, skip
                if (prev.some((n) => n.notificationId === payload.notificationId)) return prev;
                setNewAlert(true);
                setTimeout(() => setNewAlert(false), 3500);
                if (soundEnabled) playNotifSound();
                return [payload, ...prev];
            });
            // Unread count: only increment if the payload is unread
            if (!payload.isRead) {
                setStats((prev) => ({
                    ...prev,
                    unreadCount: prev.unreadCount + 1,
                    todayCount: isTodayDate(payload.createdAt) ? prev.todayCount + 1 : prev.todayCount,
                }));
            }
        };

        const handleUnreadCount = (data: { count: number }) => {
            setStats((prev) => ({ ...prev, unreadCount: data.count }));
        };

        socket.on('notification:new', handleNew);
        socket.on('notification:unread:count', handleUnreadCount);

        // Update isConnected to reflect real socket status
        setIsConnected(socketConnected);

        return () => {
            socket.off('notification:new', handleNew);
            socket.off('notification:unread:count', handleUnreadCount);
        };
    }, [socket, socketConnected, soundEnabled]);








    // ── Auto mark-read ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (!autoMarkRead) return;
        const t = setTimeout(() => markAllRead(), 3000);
        return () => clearTimeout(t);
    }, [autoMarkRead, notifications]);

    // ── Sound ─────────────────────────────────────────────────────────────────
    function playNotifSound() {
        try {
            const ctx = new (
                window.AudioContext || (window as any).webkitAudioContext
            )();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc.start();
            osc.stop(ctx.currentTime + 0.4);
        } catch (_) { }
    }

    // ── REST actions ──────────────────────────────────────────────────────────
    const markAsRead = async (notificationId: string) => {
        setNotifications((prev) =>
            prev.map((n) =>
                n.notificationId === notificationId ? { ...n, isRead: true } : n
            )
        );
        setStats((prev) => ({
            ...prev,
            unreadCount: Math.max(0, prev.unreadCount - 1),
        }));

        try {
            await NotificationService.markNotificationRead(notificationId);
        } catch (_) { }
    };

    const markAllRead = async () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setStats((prev) => ({ ...prev, unreadCount: 0 }));
        try {
            await NotificationService.markAllNotificationsRead();
        } catch (_) { }
    };

    const removeNotification = async (notificationId: string) => {
        const n = notifications.find((n) => n.notificationId === notificationId);
        setNotifications((prev) =>
            prev.filter((n) => n.notificationId !== notificationId)
        );
        if (n && !n.isRead)
            setStats((prev) => ({
                ...prev,
                unreadCount: Math.max(0, prev.unreadCount - 1),
            }));
        try {
            await NotificationService.deleteNotification(notificationId);
        } catch (_) { }
    };

    const loadMore = async () => {
        const nextPage = page + 1;
        setPage(nextPage);
        await fetchNotifications(nextPage, true);
    };

    // ── Accept / Ignore connection request from Notifications panel ──
    const handleAcceptFromNotification = async (notificationId: string, requestId: string) => {
        try {
            await ConnectionService.acceptConnectionRequest(requestId);
            setActedRequests((prev) => new Set(prev).add(requestId));
            // Mark the notification as read and remove it from the unread count
            markAsRead(notificationId);
        } catch (error: any) {
            console.error('❌ Failed to accept connection request from notification:', error.message);
            alert(error.message || 'Failed to accept connection request');
        }
    };

    const handleIgnoreFromNotification = async (notificationId: string, requestId: string) => {
        try {
            await ConnectionService.declineConnectionRequest(requestId);
            setActedRequests((prev) => new Set(prev).add(requestId));
            // Dismiss the notification from the list
            removeNotification(notificationId);
        } catch (error: any) {
            console.error('❌ Failed to decline connection request from notification:', error.message);
            alert(error.message || 'Failed to decline connection request');
        }
    };

    // ── Filter / search ────────────────────────────────────────────────────────
    const filteredNotifications = notifications.filter((n) => {
        const lowerQuery = searchQuery.toLowerCase();
        const matchesSearch =
            !searchQuery ||
            (n.senderName ?? "").toLowerCase().includes(lowerQuery) ||
            (n.message ?? "").toLowerCase().includes(lowerQuery);
        const matchesFilter = filterBy === "all" || n.type === filterBy;
        const isConnectionNotif =
            n.entityType === "connection" ||
            n.type === "connection_request" ||
            n.type === "connection_accepted" ||
            n.type === "profile_viewed";
        const matchesTab =
            selectedTab === "all" ||
            (selectedTab === "unread" && !n.isRead) ||
            (selectedTab === "posts" && n.entityType === "post") ||
            (selectedTab === "connections" && isConnectionNotif);
        return matchesSearch && matchesFilter && matchesTab;
    });

    // ── Icon helpers ──────────────────────────────────────────────────────────
    const getIcon = (type: Notification["type"]) => {
        switch (type) {
            case "post_created":
                return <Edit3 className="w-4 h-4 text-[#4a3728]" />;
            case "post_liked":
                return <Heart className="w-4 h-4 text-red-500" fill="currentColor" />;
            case "post_commented":
                return <MessageSquare className="w-4 h-4 text-blue-500" />;
            case "connection_request":
                return <Users className="w-4 h-4 text-orange-500" />;
            case "connection_accepted":
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case "profile_viewed":
                return <Eye className="w-4 h-4 text-purple-500" />;
            default:
                return <Bell className="w-4 h-4 text-gray-500" />;
        }
    };

    const getPriorityColor = (type: Notification["type"]) => {
        switch (type) {
            case "post_created":
                return "from-[#4a3728] to-[#7a5c3e]";
            case "post_liked":
                return "from-red-500 to-pink-500";
            case "post_commented":
                return "from-blue-500 to-indigo-500";
            case "connection_request":
                return "from-orange-500 to-yellow-500";
            case "connection_accepted":
                return "from-green-500 to-emerald-500";
            case "profile_viewed":
                return "from-purple-500 to-pink-500";
            default:
                return "from-gray-500 to-slate-500";
        }
    };

    // ── Tabs ─────────────────────────────────────────────────────────────────
    const tabs = [
        { id: "all", label: "All", icon: Bell, count: notifications.length },
        { id: "unread", label: "Unread", icon: Eye, count: stats.unreadCount },
        {
            id: "posts",
            label: "My posts",
            icon: Edit3,
            count: notifications.filter((n) => n.entityType === "post").length,
        },
        {
            id: "connections",
            label: "Network",
            icon: Users,
            count: notifications.filter((n) => n.entityType === "connection").length,
        },
    ];

    // ── Theme classes ─────────────────────────────────────────────────────────
    const themeClass = darkMode
        ? "dark bg-gray-900"
        : "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100";
    const cardClass = darkMode
        ? "bg-gray-800/40 border-gray-700/40"
        : "bg-white/40 border-white/20";
    const textClass = darkMode ? "text-white" : "text-gray-900";

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className={`min-h-screen ${themeClass} transition-all duration-500`}>
            {/* Live alert toast */}
            {newAlert && (
                <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-[#4a3728] to-[#7a5c3e] text-white px-6 py-3 rounded-2xl shadow-2xl animate-pulse flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    <span className="font-medium">New notification!</span>
                </div>
            )}

            {/* Animated background orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className={`absolute -top-40 -right-40 w-80 h-80 ${darkMode ? "bg-gradient-to-br from-purple-400/10 to-blue-600/10" : "bg-gradient-to-br from-blue-400/20 to-purple-600/20"} rounded-full blur-3xl animate-pulse`}
                ></div>
                <div
                    className={`absolute -bottom-40 -left-40 w-80 h-80 ${darkMode ? "bg-gradient-to-br from-pink-400/10 to-indigo-600/10" : "bg-gradient-to-br from-indigo-400/20 to-pink-600/20"} rounded-full blur-3xl animate-pulse delay-1000`}
                ></div>
            </div>

            <div className="relative max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 py-8 px-4">
                {/* ═══════════════════════ SIDEBAR ═══════════════════════ */}
                <div className="w-full lg:w-80 flex flex-col gap-6">
                    {/* Profile Card */}
                    <div
                        className={`${cardClass} backdrop-blur-xl rounded-3xl p-6 shadow-2xl hover:shadow-3xl hover:scale-[1.02] transition-all duration-500 group`}
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#4a3728] to-[#7a5c3e] rounded-full blur-lg opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>

                                {/* //////////////////Changed Modified */}
                                <img
                                    src={
                                        profilePhotoUrl ||
                                        `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.firstName || 'User'}`
                                    }
                                    alt="Profile"
                                    className="relative w-20 h-20 rounded-2xl object-cover border-4 border-white/50 shadow-xl hover:border-white/80 transition-all duration-500"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                            "https://via.placeholder.com/80";
                                    }}
                                />
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <h2 className="text-xl font-bold bg-gradient-to-r from-[#4a3728] to-[#6a5748] bg-clip-text text-transparent">
                                        {profile ? `${profile.firstName} ${profile.lastName || ''}`.trim() : 'Loading...'}
                                    </h2>
                                    {profile?.emailVerified && (
                                        <div className="flex items-center justify-center gap-2 mt-1">
                                            <CheckCircle className="w-4 h-4 text-blue-500" fill="currentColor" />
                                            <span className="text-sm font-medium text-blue-600">Verified</span>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <p className={`text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                        {profile?.onboarding?.workingProfile?.jobTitle && profile?.onboarding?.workingProfile?.companyName
                                            ? `${profile.onboarding.workingProfile.jobTitle} @${profile.onboarding.workingProfile.companyName}`
                                            : 'Role not set'}
                                    </p>
                                    <p
                                        className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"} leading-relaxed`}
                                    >
                                        Empowering Professional Networking with AI
                                    </p>
                                    <div className="flex items-center justify-center gap-1 text-xs text-[#4a3728]">
                                        <MapPin className="w-3 h-3" />
                                        <span>{profile?.location || 'Location not set'}</span>
                                    </div>
                                </div>
                                <div className="flex justify-center gap-6 pt-3">
                                    <div className="text-center">
                                        <p className={`text-lg font-bold ${textClass}`}>{connectionStats?.connections ?? '—'}</p>
                                        <p
                                            className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                                        >
                                            Connections
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className={`text-lg font-bold ${textClass}`}>{followStats?.followers ?? '—'}</p>
                                        <p
                                            className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                                        >
                                            Followers
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className={`text-lg font-bold ${textClass}`}>
                                            {stats.engagementRate}%
                                        </p>
                                        <p
                                            className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                                        >
                                            Engagement
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div
                        className={`${cardClass} backdrop-blur-xl rounded-3xl p-6 shadow-2xl transition-all duration-500`}
                    >
                        <h3 className="text-lg font-bold text-[#4a3728] mb-4">
                            Todays Activity
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-[#f6ede8] rounded-xl">
                                <p className="text-2xl font-bold text-[#4a3728]">
                                    {stats.unreadCount}
                                </p>
                                <p
                                    className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                                >
                                    Unread
                                </p>
                            </div>
                            <div className="text-center p-3 bg-[#f6ede8] rounded-xl">
                                <p className="text-2xl font-bold text-[#4a3728]">
                                    {stats.todayCount}
                                </p>
                                <p
                                    className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                                >
                                    Today
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div
                        className={`${cardClass} backdrop-blur-xl rounded-3xl p-6 shadow-2xl transition-all duration-500`}
                    >
                        <nav className="space-y-2">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setSelectedTab(tab.id)}
                                        className={`w-full flex items-center justify-between p-3 rounded-2xl text-sm font-medium transition-all duration-300 ${selectedTab === tab.id
                                            ? "bg-gradient-to-r from-[#4a3728] to-[#6a5748] text-white shadow-lg transform scale-105"
                                            : `${darkMode ? "text-[#4a3728] hover:bg-gray-700/50" : "text-gray-700 hover:bg-white/60"} hover:scale-102`
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon className="w-5 h-5" />
                                            <span>{tab.label}</span>
                                        </div>
                                        {tab.count > 0 && (
                                            <span
                                                className={`px-2 py-1 text-xs rounded-full ${selectedTab === tab.id
                                                    ? "bg-white/20 text-white"
                                                    : "bg-red-500 text-white animate-pulse"
                                                    }`}
                                            >
                                                {tab.count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Settings Panel */}
                    <div
                        className={`${cardClass} backdrop-blur-xl rounded-3xl p-6 shadow-2xl transition-all duration-500`}
                    >
                        <h3 className={`text-lg font-bold ${textClass} mb-4`}>Settings</h3>
                        <div className="space-y-3">
                            {[
                                {
                                    label: "Dark Mode",
                                    icon: darkMode ? Sun : Moon,
                                    active: darkMode,
                                    toggle: () => setDarkMode(!darkMode),
                                },
                                {
                                    label: "Sound",
                                    icon: soundEnabled ? Volume2 : VolumeX,
                                    active: soundEnabled,
                                    toggle: () => setSoundEnabled(!soundEnabled),
                                },
                                {
                                    label: "Real-time",
                                    icon: Zap,
                                    active: realTimeEnabled,
                                    toggle: () => setRealTimeEnabled(!realTimeEnabled),
                                },
                                {
                                    label: "Auto-read",
                                    icon: EyeOff,
                                    active: autoMarkRead,
                                    toggle: () => setAutoMarkRead(!autoMarkRead),
                                },
                            ].map(({ label, icon: Icon, active, toggle }) => (
                                <div key={label} className="flex items-center justify-between">
                                    <span
                                        className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                                    >
                                        {label}
                                    </span>
                                    <button
                                        onClick={toggle}
                                        className={`p-2 rounded-full ${active ? "bg-[#4a3728]/10 text-[#4a3728]" : "bg-gray-500/20 text-gray-500"} transition-all duration-300`}
                                    >
                                        <Icon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════ MAIN CONTENT ═══════════════════════ */}
                <div className="flex-1">
                    <div
                        className={`${cardClass} backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden`}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-[#4a3728] to-[#6a5748] p-6 text-white">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Bell className="w-6 h-6" />
                                    <h1 className="text-2xl font-bold">Notifications</h1>
                                    {/* Live indicator */}
                                    <div
                                        className={`flex items-center gap-2 px-3 py-1 rounded-full ${isConnected ? "bg-white/20" : "bg-red-500/30"}`}
                                    >
                                        {isConnected ? (
                                            <>
                                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                                <span className="text-xs">Live</span>
                                            </>
                                        ) : (
                                            <>
                                                <WifiOff className="w-3 h-3" />
                                                <span className="text-xs">Offline</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={markAllRead}
                                        className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl hover:bg-white/30 transition-all duration-300 backdrop-blur-sm"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        <span className="text-sm font-medium">Mark all read</span>
                                    </button>
                                    <button
                                        onClick={() => fetchNotifications(1, false)}
                                        className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-all duration-300"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Search & Filter */}
                            <div className="flex gap-3">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/70" />
                                    <input
                                        type="text"
                                        placeholder="Search notifications..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/70 focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300"
                                    />
                                </div>
                                <select
                                    value={filterBy}
                                    onChange={(e) => setFilterBy(e.target.value)}
                                    className="px-4 py-2 bg-white/20 border border-white/30 rounded-xl text-white focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300"
                                >
                                    <option value="all">All Types</option>
                                    <option value="post_created">New Posts</option>
                                    <option value="post_liked">Likes</option>
                                    <option value="post_commented">Comments</option>
                                    <option value="connection_request">
                                        Connection Requests
                                    </option>
                                    <option value="connection_accepted">
                                        Connections Accepted
                                    </option>
                                    <option value="profile_viewed">
                                        Profile Views
                                    </option>
                                </select>
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="p-6">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-4">
                                    <Loader2
                                        className={`w-10 h-10 animate-spin text-[#4a3728]`}
                                    />
                                    <p
                                        className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                                    >
                                        Loading notifications…
                                    </p>
                                </div>
                            ) : filteredNotifications.length === 0 ? (
                                <div className="text-center py-12">
                                    <Bell
                                        className={`w-16 h-16 ${darkMode ? "text-gray-600" : "text-gray-400"} mx-auto mb-4`}
                                    />
                                    <h3 className={`text-lg font-semibold ${textClass} mb-2`}>
                                        No notifications found
                                    </h3>
                                    <p
                                        className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}
                                    >
                                        {searchQuery || filterBy !== "all"
                                            ? "Try adjusting your search or filter."
                                            : "You're all caught up!"}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredNotifications.map((notification, index) => (
                                        <div
                                            key={notification.notificationId}
                                            className={`group relative overflow-hidden rounded-2xl ${darkMode
                                                ? "bg-gray-800/60 hover:bg-gray-700/60"
                                                : "bg-white/60 hover:bg-white/80"
                                                } backdrop-blur-sm border ${darkMode ? "border-gray-700/40" : "border-white/40"
                                                } hover:shadow-xl transition-all duration-500 ${animateCards ? "animate-fade-in" : "opacity-0"
                                                }`}
                                            style={{ animationDelay: `${index * 80}ms` }}
                                        >
                                            {/* Unread indicator bar */}
                                            {!notification.isRead && (
                                                <div
                                                    className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${getPriorityColor(notification.type)}`}
                                                ></div>
                                            )}

                                            <div className="p-4">
                                                <div className="flex items-start gap-4">
                                                    {/* Avatar */}
                                                    <div className="relative flex-shrink-0">
                                                        <img
                                                            src={
                                                                notification.senderPhoto ||
                                                                `https://api.dicebear.com/7.x/initials/svg?seed=${notification.senderName}`
                                                            }
                                                            alt={notification.senderName}
                                                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-lg group-hover:scale-110 transition-transform duration-300"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src =
                                                                    `https://api.dicebear.com/7.x/initials/svg?seed=${notification.senderName}`;
                                                            }}
                                                        />
                                                        <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow-lg">
                                                            {getIcon(notification.type)}
                                                        </div>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1">
                                                                <p
                                                                    className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-800"} leading-relaxed`}
                                                                >
                                                                    <span
                                                                        className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"} hover:text-[#4a3728] transition-colors cursor-pointer`}
                                                                    >
                                                                        {notification.senderName}
                                                                    </span>{" "}
                                                                    {notification.message
                                                                        .replace(notification.senderName, "")
                                                                        .trim()}
                                                                </p>

                                                                {/* Unread badge */}
                                                                {!notification.isRead && (
                                                                    <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-[#4a3728]/10 text-[#4a3728] rounded-full font-medium">
                                                                        New
                                                                    </span>
                                                                )}

                                                                <div className="flex items-center mt-3">
                                                                    <p
                                                                        className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"} flex items-center gap-2`}
                                                                    >
                                                                        <Calendar className="w-3 h-3" />
                                                                        {timeAgo(notification.createdAt)}
                                                                        <span
                                                                            className={`px-2 py-0.5 rounded-full text-xs bg-gray-500/10 text-[#4a3728]`}
                                                                        >
                                                                            {notification.type.replace(/_/g, " ")}
                                                                        </span>
                                                                    </p>
                                                                </div>

                                                                {/* Accept / Ignore for connection requests */}
                                                                {notification.type === 'connection_request' && !actedRequests.has(notification.entityId) && (
                                                                    <div className="flex items-center gap-2 mt-3">
                                                                        <button
                                                                            onClick={() => handleAcceptFromNotification(notification.notificationId, notification.entityId)}
                                                                            className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-[#4a3728] to-[#6a5748] text-white text-xs font-semibold rounded-xl hover:opacity-90 hover:scale-105 transition-all duration-200 shadow"
                                                                        >
                                                                            <CheckCircle className="w-3.5 h-3.5" />
                                                                            Accept
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleIgnoreFromNotification(notification.notificationId, notification.entityId)}
                                                                            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-xl border transition-all duration-200 hover:scale-105 ${darkMode
                                                                                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                                                                                    : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                                                                                }`}
                                                                        >
                                                                            <X className="w-3.5 h-3.5" />
                                                                            Ignore
                                                                        </button>
                                                                    </div>
                                                                )}
                                                                {/* Acted state — show confirmation inline */}
                                                                {notification.type === 'connection_request' && actedRequests.has(notification.entityId) && (
                                                                    <p className="mt-2 text-xs text-green-600 font-medium flex items-center gap-1">
                                                                        <CheckCircle className="w-3.5 h-3.5" /> Request handled
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {/* Action buttons */}
                                                            <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                                                                {!notification.isRead && (
                                                                    <button
                                                                        onClick={() =>
                                                                            markAsRead(notification.notificationId)
                                                                        }
                                                                        className={`p-2 rounded-full ${darkMode ? "hover:bg-gray-600/50" : "hover:bg-gray-200/50"} transition-colors group`}
                                                                        title="Mark as read"
                                                                    >
                                                                        <CheckCircle className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    className={`p-2 rounded-full ${darkMode ? "hover:bg-gray-600/50" : "hover:bg-gray-200/50"} transition-colors`}
                                                                >
                                                                    <Bookmark className="w-4 h-4 text-gray-500 hover:text-[#4a3728] transition-colors" />
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        removeNotification(
                                                                            notification.notificationId
                                                                        )
                                                                    }
                                                                    className="p-2 rounded-full hover:bg-red-100/50 transition-colors opacity-0 group-hover:opacity-100"
                                                                    title="Remove"
                                                                >
                                                                    <X className="w-4 h-4 text-gray-400 group-hover:scale-110 transition-transform" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* View Post link for post notifications */}
                                            {notification.entityType === "post" && (
                                                <div className={`px-4 pb-3`}>
                                                    <button 
                                                        onClick={() => router.push(`/post/${notification.entityId}`)}
                                                        className="text-xs text-[#4a3728] hover:underline transition-colors font-medium"
                                                    >
                                                        View Post →
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Load More */}
                            {!isLoading && hasMore && filteredNotifications.length > 0 && (
                                <div className="mt-8 flex justify-center">
                                    <button
                                        onClick={loadMore}
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
                                                <span>Load more notifications</span>
                                                <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div
                        className={`mt-6 ${cardClass} backdrop-blur-xl rounded-2xl p-4 shadow-xl`}
                    >
                        <div className="flex items-center justify-between">
                            <h3 className={`text-sm font-semibold ${textClass}`}>
                                Quick Actions
                            </h3>
                            <div className="flex items-center gap-2">
                                {[Bell, MessageSquare, Users, Settings].map((Icon, i) => (
                                    <button
                                        key={i}
                                        className="p-2 bg-white/70 text-[#4a3728] rounded-lg hover:bg-[#6a5748] hover:text-white transition-colors"
                                    >
                                        <Icon className="w-4 h-4" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
        </div>
    );
};

export default NotificationsPage;
