// Home Page - Dashboard
'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Hash, Users, Image as LucideImage, Video, Sparkles, X, BarChart2 } from 'lucide-react';
import Left from '@/features/dashboard/components/sidebar/Left/LeftSidebar';
import LeftSidebarPanel from '@/features/dashboard/components/sidebar/Left/LeftSidebarPanel'
import Main from '@/features/dashboard/components/feed/FeedContainer';
import Right from '@/features/dashboard/components/sidebar/Right/RightSidebar';
import { useAllUsersPosts } from '@/features/dashboard/hooks/useAllUsersPosts';
import { useProfile } from '@/store/hooks';
import RepostWithPerspectiveModal from '@/features/dashboard/components/feed/RepostWithPerspectiveModal';
import ConfirmRepostModal from '@/features/dashboard/components/feed/ConfirmRepostModal';
import ProfileService from '@/lib/api/profile.service';
import AnalyticsService from '@/lib/api/analytics.service';
import HomePostService from '@/lib/api/homePost.service';
import RepostService from '@/lib/api/repost.service';
import AuthService from '@/lib/api/auth.service';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useProfileData } from '@/features/profile/hooks/useProfileData';
import { useHeadlineData } from '@/features/profile/hooks/useHeadlineData';
import { transformToProfileData } from '@/shared/utils/profileTransformers';
import ProfileNavbar from '@/features/profile/components/home/ProfileNavbar';
import ConnectionService from '@/lib/api/connection.service';
import { useSocket } from '@/core/realtime/useSocket';
import { SOCKET_EVENTS } from '@/core/realtime/socket.events';

export default function Home() {
    const { user, isLoading } = useAuth();

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false);
    const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
    const [postComments, setPostComments] = useState<Record<string, any[]>>({});
    const [postCommentCounts, setPostCommentCounts] = useState<Record<string, number>>({});
    const [commentsLoading, setCommentsLoading] = useState<Record<string, boolean>>({});
    const [notifications] = useState(3);
    const [searchQuery, setSearchQuery] = useState('');
    const [postContent, setPostContent] = useState('');
    const [isPostCreatorOpen, setIsPostCreatorOpen] = useState(false);
    const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
    const [selectedAnalyticsPost, setSelectedAnalyticsPost] = useState<any | null>(null);
    const [selectedMood, setSelectedMood] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [openMenuIndex, setOpenMenuIndex] = useState(null);
    const [openRepostIndex, setOpenRepostIndex] = useState(null);
    const [openCommentsIndex, setOpenCommentsIndex] = useState<string | null>(null);
    const [commentText, setCommentText] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [openCommentMenuIndex, setOpenCommentMenuIndex] = useState<string | null>(null);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editCommentText, setEditCommentText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const [weeklyPerformance, setWeeklyPerformance] = useState<{
        profileViewsChange: number;
        postReachChange: number;
    } | null>(null);
    const [isLoadingWeeklyPerformance, setIsLoadingWeeklyPerformance] = useState(false);

    const [isRepostWithPerspectiveOpen, setIsRepostWithPerspectiveOpen] = useState(false);
    const [isConfirmRepostOpen, setIsConfirmRepostOpen] = useState(false);
    const [selectedRepostPost, setSelectedRepostPost] = useState(null);
    const [selectedRepostIndex, setSelectedRepostIndex] = useState(null);
    const [isRepostInProgress, setIsRepostInProgress] = useState(false);
    const [repostProgress, setRepostProgress] = useState(0);
    const [showRepostProgressBar, setShowRepostProgressBar] = useState(false);

    const { allPosts, isLoadingAllPosts, isLoadingMore, hasMore, fetchAllUsersPosts, loadMorePosts, prependPost } = useAllUsersPosts();

    const { socket } = useSocket();
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [selectedVideos, setSelectedVideos] = useState<File[]>([]);
    const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
    const [videoPreviewUrls, setVideoPreviewUrls] = useState<string[]>([]);
    const [activeMediaOption, setActiveMediaOption] = useState<string | null>(null);

    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');

    const [isPollOpen, setIsPollOpen] = useState(false);
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);
    const [pollDuration, setPollDuration] = useState<1 | 3 | 7 | 14>(7);

    const [feedReposts, setFeedReposts] = useState<any[]>([]);
    const [repostingPostId, setRepostingPostId] = useState<string | null>(null);

    const [isEventOpen, setIsEventOpen] = useState(false);
    const [eventData, setEventData] = useState({
        eventName: '',
        eventType: 'online' as 'online' | 'in-person' | 'hybrid',
        eventFormat: 'webinar' as 'conference' | 'webinar' | 'workshop' | 'meetup' | 'seminar' | 'other',
        startDate: '',
        startTime: '',
        description: '',
        timezone: 'UTC',
    });

    const [postTitle, setPostTitle] = useState('');
    const [isSubmittingPost, setIsSubmittingPost] = useState(false);
    const [postError, setPostError] = useState('');

    const {
        userProfileData,
        profileImageUrl,
        headlineId,
        fetchUserProfile
    } = useProfileData();

    const {
        userPosts,
        isLoadingPosts,
        loadProfile,
        loadPosts,
    } = useProfile();
    useEffect(() => {
    if (userPosts?.length > 0) {
        console.log('SAMPLE POST OBJECT:', JSON.stringify(userPosts[0], null, 2));
    }
}, [userPosts]);

    const { headlineData, isLoadingHeadline, fetchHeadlineData } = useHeadlineData(headlineId);

    useEffect(() => {
        if (user) {
            loadProfile();  
            loadPosts();
            fetchUserProfile();
        }
    }, [user, fetchUserProfile]);

    useEffect(() => {
        if (user) {
            fetchUserProfile();
            fetchAllUsersPosts();
        }
    }, [user, fetchUserProfile, fetchAllUsersPosts]);

    useEffect(() => {
        if (allPosts?.length > 0) {
            const initialLikes: Record<string, boolean> = {};
            allPosts.forEach(post => {
                const key = post.entryId || post.postId;
                initialLikes[key] = post.isLiked || post.isLikedByCurrentUser || false;
            });
            setLikedPosts(initialLikes);
        }
    }, [allPosts]);

    useEffect(() => {
        if (!socket) return;

        const handleNewPost = (payload: any) => {
            prependPost(payload);
        };

        socket.on(SOCKET_EVENTS.FEED_NEW_POST, handleNewPost);

        return () => {
            socket.off(SOCKET_EVENTS.FEED_NEW_POST, handleNewPost);
        };
    }, [socket, prependPost]);

    useEffect(() => {
        if (!isAnalyticsOpen) return;
        let cancelled = false;
        setIsLoadingWeeklyPerformance(true);

       Promise.all([
            AnalyticsService.getProfileViewsChange(7),
            AnalyticsService.getPostImpressionsChange(7),
        ])
            .then(([profileViewsRes, postReachRes]) => {
                if (cancelled) return;
                setWeeklyPerformance({
                    profileViewsChange: profileViewsRes?.data?.change?.percentage ?? 0,
                    postReachChange: postReachRes?.data?.change?.percentage ?? 0,
                });
            })
            .catch((err) => {
                console.error('Failed to fetch weekly performance:', err);
                if (!cancelled) setWeeklyPerformance({ profileViewsChange: 0, postReachChange: 0 });
            })
            .finally(() => {
                if (!cancelled) setIsLoadingWeeklyPerformance(false);
            });

        return () => { cancelled = true; };
    }, [isAnalyticsOpen]);

    const profileData = transformToProfileData(
        userProfileData,
        profileImageUrl,
        headlineData
    );

    const fullName = userProfileData
        ? `${userProfileData.firstName} ${userProfileData.lastName}`.trim()
        : 'Loading...';

    const totalEngagement = userPosts.reduce(
        (sum: number, p: any) => sum + (p.likesCount || 0) + (p.commentsCount || 0) + (p.shares ?? p.sharesCount ?? 0),
        0
    );
    const formatEngagement = (num: number) => (num >= 1000 ? (num / 1000).toFixed(1) + 'K' : String(num));

    const moods = [
        { id: 'happy', label: 'Happy', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
        { id: 'thoughtful', label: 'Thoughtful', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
        { id: 'excited', label: 'Excited', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
        { id: 'reflective', label: 'Reflective', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
        { id: 'grateful', label: 'Grateful', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' }
    ];

    const features = [
        { id: 'schedule', icon: Calendar, label: 'Schedule Post' },
    ];

    const mediaOptions = [
        { id: 'photo', icon: LucideImage, label: 'Photo' },
        { id: 'video', icon: Video, label: 'Video' },
        { id: 'poll', icon: BarChart2, label: 'Poll' },
        { id: 'event', icon: Calendar, label: 'Event' }
    ];

    const handleLike = async (postId: string) => {
        const post = allPosts.find(p => (p.entryId || p.postId) === postId);
        const isCurrentlyLiked = likedPosts[postId] ?? post?.isLikedByCurrentUser ?? false;
    
        setLikedPosts(prev => ({ ...prev, [postId]: !isCurrentlyLiked }));
    
        try {
            if (isCurrentlyLiked) {
                await ProfileService.removeReaction(postId);
            } else {
                await ProfileService.reactToPost(postId, 'like');
    
                if (post?.userId && post.userId !== user?.userId) {
                    AnalyticsService.recordEngagement(postId, post.userId, 'like');
                }
            }
        } catch (error: any) {
            console.error('Like/Unlike failed:', error);
            setLikedPosts(prev => ({ ...prev, [postId]: isCurrentlyLiked }));
        }
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleSearch = (e: any) => {
        setSearchQuery(e.target.value);
    };

    const handlePostSubmit = async () => {
        if (!postContent.trim()) {
            setPostError('Please write something before posting.');
            return;
        }

        if (isPollOpen) {
            if (!pollQuestion.trim()) {
                setPostError('Poll question is required.');
                return;
            }
            const filledOptions = pollOptions.filter(o => o.trim());
            if (filledOptions.length < 2) {
                setPostError('At least 2 poll options are required.');
                return;
            }
        }

        if (isScheduleOpen && (!scheduledDate || !scheduledTime)) {
            setPostError('Please select both date and time for scheduling.');
            return;
        }

        setPostError('');
        setIsSubmittingPost(true);

        try {
            const rawTitle = postContent.trim().substring(0, 100);
            const title = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);

            if (selectedImages.length > 0 || selectedVideos.length > 0) {
                const formData = new FormData();
                formData.append('title', title);
                formData.append('content', postContent.trim());
                if (selectedMood) formData.append('mood', selectedMood);
                formData.append('isPublic', String(isPublic));

                if (isScheduleOpen && scheduledDate && scheduledTime) {
                    formData.append('scheduledFor', `${scheduledDate}T${scheduledTime}:00.000Z`);
                }

                selectedImages.forEach(img => formData.append('images', img));
                selectedVideos.forEach(vid => formData.append('videos', vid));

                await HomePostService.createPostWithMedia(formData);
            } else {
                const payload: any = {
                    title,
                    content: postContent.trim(),
                    mood: selectedMood || undefined,
                    isPublic,
                };

                if (isScheduleOpen && scheduledDate && scheduledTime) {
                    payload.scheduledFor = `${scheduledDate}T${scheduledTime}:00.000Z`;
                }

                if (isPollOpen && pollQuestion.trim()) {
                    payload.pollData = {
                        question: pollQuestion.trim(),
                        options: pollOptions.filter(o => o.trim()),
                        duration: pollDuration,
                    };
                }

                if (isEventOpen && eventData.eventName) {
                    payload.eventData = eventData;
                }

                await HomePostService.createPost(payload);
            }

            resetPostModal();
            setIsPostCreatorOpen(false);
            fetchAllUsersPosts();

        } catch (error: any) {
            setPostError(error.message || 'Failed to post. Try again.');
        } finally {
            setIsSubmittingPost(false);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length + selectedImages.length > 10) {
            setPostError('Maximum 10 images allowed');
            return;
        }
        setSelectedImages(prev => [...prev, ...files]);
        const urls = files.map(f => URL.createObjectURL(f));
        setImagePreviewUrls(prev => [...prev, ...urls]);
        setActiveMediaOption(null);
    };

    const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length + selectedVideos.length > 5) {
            setPostError('Maximum 5 videos allowed');
            return;
        }
        setSelectedVideos(prev => [...prev, ...files]);
        const urls = files.map(f => URL.createObjectURL(f));
        setVideoPreviewUrls(prev => [...prev, ...urls]);
        setActiveMediaOption(null);
    };

    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    const removeVideo = (index: number) => {
        setSelectedVideos(prev => prev.filter((_, i) => i !== index));
        setVideoPreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    const addPollOption = () => {
        if (pollOptions.length < 4) setPollOptions(prev => [...prev, '']);
    };

    const removePollOption = (index: number) => {
        if (pollOptions.length > 2) {
            setPollOptions(prev => prev.filter((_, i) => i !== index));
        }
    };

    const updatePollOption = (index: number, value: string) => {
        setPollOptions(prev => prev.map((opt, i) => i === index ? value : opt));
    };

    const handleMediaOptionClick = (optionId: string) => {
        if (optionId === 'photo') {
            document.getElementById('image-upload-input')?.click();
        } else if (optionId === 'video') {
            document.getElementById('video-upload-input')?.click();
        } else if (optionId === 'poll') {
            setIsPollOpen(!isPollOpen);
            setIsEventOpen(false);
            setIsScheduleOpen(false);
        } else if (optionId === 'event') {
            setIsEventOpen(!isEventOpen);
            setIsPollOpen(false);
            setIsScheduleOpen(false);
        }
    };

    const handleScheduleClick = () => {
        setIsScheduleOpen(!isScheduleOpen);
        setIsPollOpen(false);
        setIsEventOpen(false);
    };

    const resetPostModal = () => {
        setPostContent('');
        setSelectedMood('');
        setIsPublic(true);
        setSelectedImages([]);
        setSelectedVideos([]);
        setImagePreviewUrls([]);
        setVideoPreviewUrls([]);
        setIsScheduleOpen(false);
        setScheduledDate('');
        setScheduledTime('');
        setIsPollOpen(false);
        setPollQuestion('');
        setPollOptions(['', '']);
        setPollDuration(7);
        setIsEventOpen(false);
        setEventData({
            eventName: '', eventType: 'online', eventFormat: 'webinar',
            startDate: '', startTime: '', description: '', timezone: 'UTC',
        });
        setPostError('');
        setActiveMediaOption(null);
    };

    const togglePostMenu = (index: any) => {
        setOpenMenuIndex(openMenuIndex === index ? null : index);
    };

    const handlePostAction = (action: any, postIndex: any) => {
        if (action === 'analytics') {
            const post = allPosts[postIndex];
            setSelectedAnalyticsPost(post);
        }
        setOpenMenuIndex(null);
    };

    const toggleRepostMenu = (index: any) => {
        setOpenRepostIndex(openRepostIndex === index ? null : index);
    };

    const handleRepost = (type: any, postIndex: any) => {
        setOpenRepostIndex(null);
    };

    const openRepostWithPerspectiveModal = (post: any, index: any) => {
        setSelectedRepostPost(post);
        setSelectedRepostIndex(index);
        setIsRepostWithPerspectiveOpen(true);
        setOpenRepostIndex(null);
    };

    const simulateRepostProgress = async () => {
        setShowRepostProgressBar(true);
        setRepostProgress(0);
        setIsRepostInProgress(true);

        const interval = setInterval(() => {
            setRepostProgress(prev => {
                const newProgress = prev + Math.random() * 30;
                if (newProgress >= 100) {
                    clearInterval(interval);
                    setRepostProgress(100);
                    return 100;
                }
                return newProgress;
            });
        }, 200);

        setTimeout(() => {
            setShowRepostProgressBar(false);
            setIsRepostInProgress(false);
            setRepostProgress(0);
        }, 3000);
    };

    const confirmRepost = async (thoughts: string) => {
        if (!selectedRepostPost) return;

        const post = selectedRepostPost as any;
        const postId = post.entryId || post.postId;

        setShowRepostProgressBar(true);
        setRepostProgress(0);
        setIsRepostInProgress(true);

        try {
            const result = await RepostService.createRepost(postId, 'quote', thoughts);
            if (post?.userId && post.userId !== user?.userId) {
               AnalyticsService.recordShare(post.userId, postId, 'linkedin');
         }

            setRepostProgress(60);
            await new Promise(resolve => setTimeout(resolve, 300));
            setRepostProgress(100);

            const newRepostFeedItem = {
                feedItemType: 'repost',
                repostId: result?.data?.repost?.repostId || result?.repost?.repostId || `temp-${Date.now()}`,
                repostType: 'quote',
                thoughtText: thoughts,
                repostedBy: user?.userId,
                createdAt: new Date().toISOString(),
                originalPost: {
                    ...post,
                    entryId: postId,
                    userName: post.userName || post.fullName || post.userId || 'User',
                },
            };

            setFeedReposts(prev => [newRepostFeedItem, ...prev]);
            setIsRepostWithPerspectiveOpen(false);

            setTimeout(() => {
                setShowRepostProgressBar(false);
                setIsRepostInProgress(false);
                setRepostProgress(0);
            }, 1500);

        } catch (error: any) {
            setShowRepostProgressBar(false);
            setIsRepostInProgress(false);
            setRepostProgress(0);
            alert(error.message || 'Repost failed');
        }
    };

    const handleConfirmRepostWithoutThoughts = async () => {
        setIsConfirmRepostOpen(false);
        await simulateRepostProgress();
        console.log('Reposted without thoughts');
    };

    const handleRepostInstant = async (indexOrId: any) => {
    const post = typeof indexOrId === 'number'
        ? allPosts[indexOrId]
        : allPosts.find(p => (p.entryId || p.postId) === indexOrId);

    if (!post) return;

    const postId = post.entryId || post.postId;
    setRepostingPostId(postId);
    setShowRepostProgressBar(true);
    setRepostProgress(0);
    setIsRepostInProgress(true);

    try {
        const result = await RepostService.createRepost(postId, 'repost');

        if (post?.userId && post.userId !== user?.userId) {
            AnalyticsService.recordShare(post.userId, postId, 'linkedin');
        }

        setRepostProgress(60);
        await new Promise(resolve => setTimeout(resolve, 300));
        setRepostProgress(100);

        const newRepostFeedItem = {
            feedItemType: 'repost',
            repostId: result?.data?.repost?.repostId || result?.repost?.repostId || `temp-${Date.now()}`,
            repostType: 'repost',
            thoughtText: null,
            repostedBy: user?.userId,
            createdAt: new Date().toISOString(),
            originalPost: {
                ...post,
                entryId: postId,
                userName: post.userName || post.fullName || post.userId || 'User',
            },
        };

        setFeedReposts(prev => [newRepostFeedItem, ...prev]);

        setTimeout(() => {
            setShowRepostProgressBar(false);
            setIsRepostInProgress(false);
            setRepostProgress(0);
            setRepostingPostId(null);
        }, 1500);

    } catch (error: any) {
        setShowRepostProgressBar(false);
        setIsRepostInProgress(false);
        setRepostProgress(0);
        setRepostingPostId(null);

        if (error.message?.includes('already reposted')) {
            alert('You have already reposted this post');
        } else {
            alert(error.message || 'Repost failed');
        }
    }
};

    const enrichCommentsWithUserData = async (rawComments: any[], postOwnerId?: string) => {
        if (!rawComments || rawComments.length === 0) return [];

        try {
            const uniqueUserIds = [...new Set(rawComments.map((c: any) => c.userId))] as string[];

            let usersData: any[] = [];
            if (uniqueUserIds.length > 0) {
                try {
                    const bulkResponse = await AuthService.getUsersBulk(uniqueUserIds);
                    usersData = bulkResponse.data?.users || [];
                } catch (err) {
                    console.warn('⚠️ Failed to fetch comment users in bulk:', err);
                }
            }

            const photoIds = usersData.map((u: any) => u.profilePhotoId).filter(Boolean);
            let photosMap: Record<string, string> = {};
            if (photoIds.length > 0) {
                const res = await ProfileService.getMultipleProfilePhotosByIds(photoIds).catch(() => null);
                if (res) {
                    photosMap = res.data.photos.reduce((acc: Record<string, string>, p: any) => {
                        acc[p.photoId] = p.cloudinarySecureUrl;
                        return acc;
                    }, {});
                }
            }

            const headlineIds = usersData.map((u: any) => u.headlineId).filter(Boolean);
            let headlinesMap: Record<string, string> = {};
            if (headlineIds.length > 0) {
                try {
                    const headlinesResponse = await ProfileService.getMultipleHeadlinesByIds(headlineIds);
                    const headlines = headlinesResponse.data?.headlines || [];
                    headlinesMap = headlines.reduce((acc: Record<string, string>, h: any) => {
                        acc[h.headlineId] = h.title;
                        return acc;
                    }, {});
                } catch {
                }
            }

            const usersMap = usersData.reduce((acc: Record<string, any>, u: any) => {
                acc[u.userId] = u;
                return acc;
            }, {});

            const FALLBACK_AVATAR =
                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdYRNQDghH1JvFXro2Yz3iWNmmFAubFZ-RGQ&s';

            return rawComments.map((comment: any) => {
                const u = usersMap[comment.userId];
                return {
                    ...comment,
                    isAuthor: !!postOwnerId && comment.userId === postOwnerId,
                    user: {
                        userId: comment.userId,
                        name: u ? `${u.firstName} ${u.lastName}`.trim() : 'Unknown User',
                        avatar: u?.profilePhotoId ? photosMap[u.profilePhotoId] || FALLBACK_AVATAR : FALLBACK_AVATAR,
                        headline: u?.headlineId ? headlinesMap[u.headlineId] || '' : '',
                    },
                };
            });
        } catch {
            return rawComments;
        }
    };

    const buildCommentTree = (flatComments: any[]) => {
        const map: Record<string, any> = {};
        const roots: any[] = [];

        flatComments.forEach((c: any) => {
            map[c.commentId] = { ...c, replies: [] };
        });

        flatComments.forEach((c: any) => {
            if (c.parentCommentId && map[c.parentCommentId]) {
                map[c.parentCommentId].replies.push(map[c.commentId]);
            } else {
                roots.push(map[c.commentId]);
            }
        });

        return roots;
    };

    const fetchCommentsForPost = async (postId: string) => {
        if (postComments[postId] || commentsLoading[postId]) return;

        setCommentsLoading(prev => ({ ...prev, [postId]: true }));
        try {
            const res = await ProfileService.getCommentsByPostId(postId);
            const rawComments = res.data.comments || [];

            const postOwnerId = allPosts.find(
                (p) => (p.entryId || p.postId) === postId
            )?.userId;

            const enrichedComments = await enrichCommentsWithUserData(rawComments, postOwnerId);
            const nestedComments = buildCommentTree(enrichedComments);

            setPostComments(prev => ({ ...prev, [postId]: nestedComments }));
            setPostCommentCounts(prev => ({ ...prev, [postId]: enrichedComments.length }));
        } catch (error) {
            console.error('Failed to fetch comments:', error);
        } finally {
            setCommentsLoading(prev => ({ ...prev, [postId]: false }));
        }
    };

    const toggleComments = (postId: string) => {
        const isOpen = openCommentsIndex === postId;
        setOpenCommentsIndex(isOpen ? null : postId);
        if (!isOpen) {
            fetchCommentsForPost(postId);
        }
    };

    const handleCommentSubmit = async (postId: string) => {
        if (!commentText.trim()) return;

        const FALLBACK_AVATAR =
            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdYRNQDghH1JvFXro2Yz3iWNmmFAubFZ-RGQ&s';
        const postOwnerId = allPosts.find(
            (p) => (p.entryId || p.postId) === postId
        )?.userId;
        const selfUser = {
            userId: user?.userId,
            name: fullName,
            avatar: profileData.profileImage || FALLBACK_AVATAR,
            headline: headlineData?.title || '',
        };

        try {
            if (replyingTo) {
                const res = await ProfileService.createReply(replyingTo, commentText);
                const newReply = {
                    ...res.data.reply,
                    user: selfUser,
                    likesCount: res.data.reply?.likesCount || 0,
                    likedBy: res.data.reply?.likedBy || [],
                };
                setPostComments(prev => {
                    const updated = (prev[postId] || []).map(c => {
                        if (c.commentId === replyingTo) {
                            return { ...c, replies: [...(c.replies || []), newReply] };
                        }
                        return c;
                    });
                    return { ...prev, [postId]: updated };
                });
            } else {
                const res = await ProfileService.createComment(postId, commentText);

const post = allPosts.find(p => (p.entryId || p.postId) === postId);
if (post?.userId && post.userId !== user?.userId) {
    AnalyticsService.recordEngagement(postId, post.userId, 'comment');
}
                const newComment = {
                    ...res.data.comment,
                    user: selfUser,
                    isAuthor: !!postOwnerId && user?.userId === postOwnerId,
                    replies: [],
                    likesCount: res.data.comment?.likesCount || 0,
                    likedBy: res.data.comment?.likedBy || [],
                };
                setPostComments(prev => ({
                    ...prev,
                    [postId]: [...(prev[postId] || []), newComment]
                }));
                setPostCommentCounts(prev => ({
                    ...prev,
                    [postId]: (prev[postId] || 0) + 1
                }));
            }
            setCommentText('');
            setReplyingTo(null);
        } catch (error) {
            console.error('Comment failed:', error);
        }
    };

    const handleReply = (commentId: any) => {
        setReplyingTo(commentId);
    }

    const handleCommentReaction = async (commentId: string) => {
        const findComment = (comments: any[]): any => {
            for (const c of comments) {
                if (c.commentId === commentId) return c;
                if (c.replies?.length) {
                    const found = findComment(c.replies);
                    if (found) return found;
                }
            }
            return null;
        };

        const updateCommentInTree = (comments: any[], updater: (c: any) => any): any[] =>
            comments.map((c: any) => {
                if (c.commentId === commentId) return updater(c);
                if (c.replies?.length) {
                    return { ...c, replies: updateCommentInTree(c.replies, updater) };
                }
                return c;
            });

        let targetPostId: string | null = null;
        let targetComment: any = null;
        for (const pid in postComments) {
            const found = findComment(postComments[pid] || []);
            if (found) {
                targetPostId = pid;
                targetComment = found;
                break;
            }
        }
        if (!targetPostId || !targetComment) return;

        const isCurrentlyLiked = (targetComment.likedBy || []).includes(user?.userId);
        const prevLikedBy = targetComment.likedBy || [];
        const prevLikesCount = targetComment.likesCount || 0;

        setPostComments(prev => ({
            ...prev,
            [targetPostId as string]: updateCommentInTree(prev[targetPostId as string] || [], (c) => ({
                ...c,
                likedBy: isCurrentlyLiked
                    ? prevLikedBy.filter((id: string) => id !== user?.userId)
                    : [...prevLikedBy, user?.userId],
                likesCount: isCurrentlyLiked ? Math.max(0, prevLikesCount - 1) : prevLikesCount + 1,
            })),
        }));

        try {
            if (isCurrentlyLiked) {
                await ProfileService.unlikeComment(commentId);
            } else {
                await ProfileService.likeComment(commentId);
            }
        } catch (error: any) {
            console.error('Comment like/unlike failed:', error);
            setPostComments(prev => ({
                ...prev,
                [targetPostId as string]: updateCommentInTree(prev[targetPostId as string] || [], (c) => ({
                    ...c,
                    likedBy: prevLikedBy,
                    likesCount: prevLikesCount,
                })),
            }));
        }
    };

    const toggleCommentMenu = (commentId: any) => {
        setOpenCommentMenuIndex(openCommentMenuIndex === commentId ? null : commentId);
    };

    const handleCommentAction = async (action: any, commentId: any, extra: any) => {
        if (action === 'edit') {
            setEditingCommentId(commentId);
            setEditCommentText(extra);
        } else if (action === 'delete') {
            if (!confirm('Delete this comment? This cannot be undone.')) return;
            try {
                await ProfileService.deleteComment(commentId);

                setPostComments(prev => {
                    const updated: Record<string, any[]> = {};
                    for (const postId in prev) {
                        const comments = prev[postId] || [];
                        const wasTopLevel = comments.some((c: any) => c.commentId === commentId);

                        if (wasTopLevel) {
                            updated[postId] = comments.filter((c: any) => c.commentId !== commentId);
                            setPostCommentCounts(counts => ({
                                ...counts,
                                [postId]: Math.max(0, (counts[postId] || 1) - 1),
                            }));
                        } else {
                            updated[postId] = comments.map((c: any) => ({
                                ...c,
                                replies: (c.replies || []).filter((r: any) => (r.commentId || r.id) !== commentId),
                            }));
                        }
                    }
                    return updated;
                });
            } catch (error: any) {
                alert(error.message || 'Failed to delete comment');
            }
        } else if (action === 'copy') {
            const url = `${window.location.origin}/post#comment-${commentId}`;
            navigator.clipboard.writeText(url).then(() => {
                alert('Link copied to clipboard');
            }).catch(() => {
                alert('Could not copy link');
            });
        } else if (action === 'block') {
            const targetUserId = extra;
            if (!targetUserId) return;
            if (!confirm('Block this user? They will no longer be able to interact with you.')) return;
            try {
                await ConnectionService.blockUser(targetUserId);
                alert('User blocked successfully');
            } catch (error: any) {
                alert(error.message || 'Failed to block user');
            }
       } else if (action === 'report') {
            try {
                await ProfileService.reportComment(commentId);
                alert('Comment reported. Our team will review it.');
            } catch (error: any) {
                alert(error.message || 'Failed to report comment');
            }
        } else if (action === 'mute-notifications' || action === 'mute-thread') {
            try {
                await ProfileService.muteThread(commentId);
                alert('Notifications muted for this conversation.');
            } catch (error: any) {
                alert(error.message || 'Failed to mute notifications');
            }
        } else if (action === 'follow' || action === 'unfollow') {
            console.log(`${action} user`);
        }
        setOpenCommentMenuIndex(null);
    };

    const handleEditSubmit = (commentId: any) => {
        if (editCommentText.trim()) {
            setEditingCommentId(null);
            setEditCommentText('');
        }
    };

    const handleEmojiClick = (emoji: any) => {
        setCommentText(commentText + emoji);
        setShowEmojiPicker(false);
    };

    const handlePhotoUpload = () => {
    };

    const handleGifSelect = () => {
    };

    const emojiList = ['😀', '😂', '🤣', '😍', '🥰', '😊', '😎', '🤔', '😢', '😭', '😡', '🤯', '🎉', '🎊', '👍', '👏', '🙌', '💪', '🔥', '✨', '❤️', '💙', '💚', '💛', '🧡', '💜', '🖤', '🤍', '💯', '✅', '❌', '⭐', '🌟', '💫', '🚀', '🎯'];

    useEffect(() => {
        const handleClickOutside = (event: any) => {
            if (openMenuIndex !== null && !event.target.closest('.post-menu')) {
                setOpenMenuIndex(null);
            }
            if (openRepostIndex !== null && !event.target.closest('.repost-menu')) {
                setOpenRepostIndex(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenuIndex, openRepostIndex]);

    useEffect(() => {
        const handleClickOutside = (event: any) => {
            if (openMenuIndex !== null && !event.target.closest('.post-menu')) {
                setOpenMenuIndex(null);
            }
            if (openCommentMenuIndex !== null && !event.target.closest('.comment-menu')) {
                setOpenCommentMenuIndex(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openMenuIndex]);

    return (
        <div className={`min-h-screen transition-all duration-500 ${isDarkMode ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-[#d4c9bc]'} font-['Poppins'] overflow-x-clip`}>
            {/* Header */}
            <ProfileNavbar
                profileImage={profileData.profileImage}
                userName={profileData.userName}
                currentUserId={user?.userId}
                onOpenLeftPanel={() => setIsLeftPanelOpen(true)}
            />

            {/* Repost Progress Bar */}
            {showRepostProgressBar && (
                <div className="fixed top-0 left-0 right-0 z-[100]">
                    <div
                        className="h-1 bg-gradient-to-r from-[#4a3728] via-[#6b5643] to-[#8b7355] transition-all duration-300 ease-out"
                        style={{ width: `${repostProgress}%` }}
                    />
                    {repostProgress === 100 && (
                        <div className="flex justify-center mt-2">
                            <div className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold shadow-lg ${isDarkMode
                                ? 'bg-slate-800 text-green-400 border border-slate-700'
                                : 'bg-white text-green-600 border border-green-200'
                                }`}>
                                ✓ Reposted successfully!
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Main Container — zoom se compact, LinkedIn-jaisa; 'zoom' sticky ko nahi todta jaise transform:scale todta hai */}
            <div
                className="flex flex-col lg:flex-row pt-20 sm:pt-24 px-6 sm:px-10 lg:px-16 mx-auto gap-4 md:gap-6 lg:gap-8 max-w-[1400px] w-full"
                style={{ zoom: 0.85 } as React.CSSProperties}
            >
                {/* Left Sidebar - Hidden on mobile, shown on desktop */}
                <div className="hidden lg:block sticky-sidebar">
                    <Left
                        currentUserId={user?.userId ?? ''}
                        isSidebarOpen={isSidebarOpen}
                        isDarkMode={isDarkMode}
                    />
                </div>

                {/* Main Content Wrapper */}
                <div className="flex flex-col lg:flex-row flex-1 gap-4 lg:gap-6">
                    {/* Mobile Search Bar - appears at top on phone */}
                    <div className="lg:hidden w-full">
                        <Right
                            isDarkMode={isDarkMode}
                            userPosts={userPosts}
                            isPostCreatorOpen={isPostCreatorOpen}
                            setIsPostCreatorOpen={setIsPostCreatorOpen}
                            isAnalyticsOpen={isAnalyticsOpen}
                            setIsAnalyticsOpen={setIsAnalyticsOpen}
                        />
                    </div>

                    {/* Main Feed */}
                    <Main
                        currentUserId={user?.userId}
                        isDarkMode={isDarkMode}
                        likedPosts={likedPosts}
                        profileImage={profileData.profileImage}
                        handleLike={handleLike}
                        postComments={postComments}
                        postCommentCounts={postCommentCounts}
                        commentsLoading={commentsLoading}
                        openMenuIndex={openMenuIndex}
                        openRepostIndex={openRepostIndex}
                        openCommentsIndex={openCommentsIndex}
                        commentText={commentText}
                        setCommentText={setCommentText}
                        replyingTo={replyingTo}
                        openCommentMenuIndex={openCommentMenuIndex}
                        editingCommentId={editingCommentId}
                        editCommentText={editCommentText}
                        setEditCommentText={setEditCommentText}
                        showEmojiPicker={showEmojiPicker}
                        setShowEmojiPicker={setShowEmojiPicker}
                        handlePostAction={handlePostAction}
                        handleRepost={handleRepost}
                        toggleComments={toggleComments}
                        handleCommentSubmit={handleCommentSubmit}
                        handleReply={handleReply}
                        handleCommentReaction={handleCommentReaction}
                        toggleCommentMenu={toggleCommentMenu}
                        handleCommentAction={handleCommentAction}
                        handleEditSubmit={handleEditSubmit}
                        handleEmojiClick={handleEmojiClick}
                        emojiList={emojiList}
                        togglePostMenu={togglePostMenu}
                        toggleRepostMenu={toggleRepostMenu}
                        isSidebarOpen={isSidebarOpen}
                        onOpenWithPerspectiveModal={openRepostWithPerspectiveModal}
                        handleRepostInstant={handleRepostInstant}
                        showRepostProgressBar={showRepostProgressBar}
                        repostProgress={repostProgress}
                        posts={allPosts}
                        isLoadingPosts={isLoadingAllPosts}
                        isLoadingMore={isLoadingMore}          
                        hasMore={hasMore}                     
                        loadMorePosts={loadMorePosts}          
                        feedReposts={feedReposts}
                        profileData={profileData}
                        fullName={fullName}
                        repostingPostId={repostingPostId}
                        fetchCommentsForPost={fetchCommentsForPost}
                    />

                    {/* Desktop Right Sidebar */}
                    <div className="hidden lg:block sticky-sidebar">
                        <Right
                            isDarkMode={isDarkMode}
                            userPosts={userPosts}
                            isPostCreatorOpen={isPostCreatorOpen}
                            setIsPostCreatorOpen={setIsPostCreatorOpen}
                            isAnalyticsOpen={isAnalyticsOpen}
                            setIsAnalyticsOpen={setIsAnalyticsOpen}
                        />
                    </div>
                </div>
            </div>

            {/* Left Sidebar Panel - Mobile Slide-in */}
            <LeftSidebarPanel
                isOpen={isLeftPanelOpen}
                onClose={() => setIsLeftPanelOpen(false)}
                currentUserId={user?.userId}
                isDarkMode={isDarkMode}
            />
        

            
            {
        isPostCreatorOpen && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-center md:justify-end md:pr-[2%] bg-black/40 backdrop-blur-sm animate-fadeIn">
                <div className={`w-full sm:w-[95%] md:w-[90%] lg:w-[520px] max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 md:p-6 relative shadow-2xl transform transition-all duration-500 animate-slideUp ${isDarkMode ? 'bg-slate-800/95' : 'bg-[#f6ede8]/95'} backdrop-blur-xl`}>

                    {/* Close Button */}
                    <button
                        onClick={() => { resetPostModal(); setIsPostCreatorOpen(false); }}
                        className={`absolute top-3 sm:top-4 right-3 sm:right-4 p-2 rounded-full transition-all duration-300 ${isDarkMode ? 'text-white hover:bg-slate-700' : 'text-[#4a3728] hover:bg-[#e0d8cf]'}`}
                    >
                        <X className="w-4 sm:w-5 h-4 sm:h-5" />
                    </button>

                    {/* Header */}
                    <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#4a3728] to-[#8b7355] rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                            {profileData.profileImage ? (
                                <img src={profileData.profileImage} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-white font-bold text-xs sm:text-sm">{fullName.charAt(0)}</span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className={`text-base sm:text-lg font-bold truncate ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>What&apos;s inspiring you today?</h1>
                            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/70'}`}>Share your thoughts ✨</p>
                        </div>
                    </div>

                    {/* Mood Selection */}
                    <div className="mb-3 sm:mb-4">
                        <p className={`text-xs font-semibold mb-2 ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/60'}`}>HOW ARE YOU FEELING?</p>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {moods.map((mood) => (
                                <button
                                    key={mood.id}
                                    onClick={() => setSelectedMood(selectedMood === mood.id ? '' : mood.id)}
                                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border text-xs sm:text-sm transition-all duration-200 ${selectedMood === mood.id
                                        ? mood.color
                                        : isDarkMode
                                            ? 'bg-slate-700/50 text-slate-400 border-slate-600 hover:bg-slate-700'
                                            : 'bg-[#e0d8cf]/50 text-[#4a3728]/60 border-[#4a3728]/30 hover:bg-[#e0d8cf]'
                                        }`}
                                >
                                    {mood.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Text Input */}
                    <div className="mb-3 sm:mb-4">
                        <div className="relative">
                            <textarea
                                value={postContent}
                                onChange={(e) => setPostContent(e.target.value)}
                                placeholder="Share your thoughts, ideas, or experiences... ✨"
                                className={`w-full h-24 sm:h-28 rounded-2xl px-3 sm:px-4 py-2 sm:py-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#6b5643]/50 transition-all duration-300 text-xs sm:text-sm border ${isDarkMode ? 'bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400' : 'bg-[#e0d8cf]/50 border-[#4a3728]/30 text-[#4a3728] placeholder-[#4a3728]/60'}`}
                                maxLength={5000}
                            />
                            <div className={`absolute bottom-2 right-2 sm:right-3 text-xs ${isDarkMode ? 'text-slate-500' : 'text-[#4a3728]/40'}`}>
                                {postContent.length}/5000
                            </div>
                        </div>
                        {postError && <p className="text-red-500 text-xs mt-1">{postError}</p>}
                    </div>

                    {/* Image Previews */}
                    {imagePreviewUrls.length > 0 && (
                        <div className="mb-4">
                            <div className="flex gap-2 flex-wrap">
                                {imagePreviewUrls.map((url, i) => (
                                    <div key={i} className="relative w-20 h-20">
                                        <img src={url} alt="" className="w-full h-full object-cover rounded-xl" />
                                        <button
                                            onClick={() => removeImage(i)}
                                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                                        >
                                            <X className="w-3 h-3 text-white" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Video Previews */}
                    {videoPreviewUrls.length > 0 && (
                        <div className="mb-4">
                            <div className="flex gap-2 flex-wrap">
                                {videoPreviewUrls.map((url, i) => (
                                    <div key={i} className="relative w-32 h-20">
                                        <video src={url} className="w-full h-full object-cover rounded-xl" />
                                        <button
                                            onClick={() => removeVideo(i)}
                                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                                        >
                                            <X className="w-3 h-3 text-white" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Hidden file inputs */}
                    <input
                        id="image-upload-input"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageSelect}
                    />
                    <input
                        id="video-upload-input"
                        type="file"
                        accept="video/*"
                        multiple
                        className="hidden"
                        onChange={handleVideoSelect}
                    />

                    {/* Schedule Panel */}
                    {isScheduleOpen && (
                        <div className={`mb-4 p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-white/60 border-[#4a3728]/20'}`}>
                            <p className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>📅 Schedule Post</p>
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className={`text-xs mb-1 block ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/60'}`}>Date</label>
                                    <input
                                        type="date"
                                        value={scheduledDate}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => setScheduledDate(e.target.value)}
                                        className={`w-full rounded-xl px-3 py-2 text-sm border focus:outline-none focus:ring-2 focus:ring-[#6b5643]/50 ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-[#e0d8cf]/50 border-[#4a3728]/30 text-[#4a3728]'}`}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className={`text-xs mb-1 block ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/60'}`}>Time</label>
                                    <input
                                        type="time"
                                        value={scheduledTime}
                                        onChange={(e) => setScheduledTime(e.target.value)}
                                        className={`w-full rounded-xl px-3 py-2 text-sm border focus:outline-none focus:ring-2 focus:ring-[#6b5643]/50 ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-[#e0d8cf]/50 border-[#4a3728]/30 text-[#4a3728]'}`}
                                    />
                                </div>
                            </div>
                            {scheduledDate && scheduledTime && (
                                <p className={`text-xs mt-2 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                                    ✓ Will post on {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Poll Panel */}
                    {isPollOpen && (
                        <div className={`mb-4 p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-white/60 border-[#4a3728]/20'}`}>
                            <p className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>📊 Create Poll</p>

                            <input
                                type="text"
                                placeholder="Ask a question..."
                                value={pollQuestion}
                                onChange={(e) => setPollQuestion(e.target.value)}
                                maxLength={140}
                                className={`w-full rounded-xl px-3 py-2 text-sm border mb-3 focus:outline-none focus:ring-2 focus:ring-[#6b5643]/50 ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white placeholder-slate-400' : 'bg-[#e0d8cf]/50 border-[#4a3728]/30 text-[#4a3728] placeholder-[#4a3728]/50'}`}
                            />

                            <div className="space-y-2 mb-3">
                                {pollOptions.map((opt, i) => (
                                    <div key={i} className="flex gap-2 items-center">
                                        <input
                                            type="text"
                                            placeholder={`Option ${i + 1}`}
                                            value={opt}
                                            onChange={(e) => updatePollOption(i, e.target.value)}
                                            maxLength={100}
                                            className={`flex-1 rounded-xl px-3 py-2 text-sm border focus:outline-none focus:ring-2 focus:ring-[#6b5643]/50 ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white placeholder-slate-400' : 'bg-[#e0d8cf]/50 border-[#4a3728]/30 text-[#4a3728] placeholder-[#4a3728]/50'}`}
                                        />
                                        {pollOptions.length > 2 && (
                                            <button onClick={() => removePollOption(i)} className="text-red-400 hover:text-red-500">
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {pollOptions.length < 4 && (
                                <button
                                    onClick={addPollOption}
                                    className={`text-xs mb-3 px-3 py-1.5 rounded-lg border transition-all ${isDarkMode ? 'border-slate-500 text-slate-300 hover:bg-slate-600' : 'border-[#4a3728]/30 text-[#4a3728]/70 hover:bg-[#e0d8cf]'}`}
                                >
                                    + Add Option
                                </button>
                            )}

                            <div>
                                <label className={`text-xs mb-1 block ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/60'}`}>Poll Duration</label>
                                <div className="flex gap-2">
                                    {([1, 3, 7, 14] as const).map(d => (
                                        <button
                                            key={d}
                                            onClick={() => setPollDuration(d)}
                                            className={`flex-1 py-1.5 rounded-lg text-xs border transition-all ${pollDuration === d
                                                ? 'bg-[#6b5643] text-white border-[#6b5643]'
                                                : isDarkMode
                                                    ? 'bg-slate-600 border-slate-500 text-slate-300 hover:bg-slate-500'
                                                    : 'bg-[#e0d8cf]/50 border-[#4a3728]/30 text-[#4a3728]/70 hover:bg-[#e0d8cf]'
                                                }`}
                                        >
                                            {d}d
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Event Panel */}
                    {isEventOpen && (
                        <div className={`mb-4 p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-white/60 border-[#4a3728]/20'}`}>
                            <p className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>🎉 Create Event</p>

                            <div className="space-y-3">
                                <input
                                    type="text"
                                    placeholder="Event name"
                                    value={eventData.eventName}
                                    onChange={(e) => setEventData(prev => ({ ...prev, eventName: e.target.value }))}
                                    maxLength={75}
                                    className={`w-full rounded-xl px-3 py-2 text-sm border focus:outline-none focus:ring-2 focus:ring-[#6b5643]/50 ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white placeholder-slate-400' : 'bg-[#e0d8cf]/50 border-[#4a3728]/30 text-[#4a3728] placeholder-[#4a3728]/50'}`}
                                />

                                <div className="flex gap-2">
                                    <select
                                        value={eventData.eventType}
                                        onChange={(e) => setEventData(prev => ({ ...prev, eventType: e.target.value as any }))}
                                        className={`flex-1 rounded-xl px-3 py-2 text-sm border focus:outline-none ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-[#e0d8cf]/50 border-[#4a3728]/30 text-[#4a3728]'}`}
                                    >
                                        <option value="online">Online</option>
                                        <option value="in-person">In-Person</option>
                                        <option value="hybrid">Hybrid</option>
                                    </select>
                                    <select
                                        value={eventData.eventFormat}
                                        onChange={(e) => setEventData(prev => ({ ...prev, eventFormat: e.target.value as any }))}
                                        className={`flex-1 rounded-xl px-3 py-2 text-sm border focus:outline-none ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-[#e0d8cf]/50 border-[#4a3728]/30 text-[#4a3728]'}`}
                                    >
                                        <option value="webinar">Webinar</option>
                                        <option value="conference">Conference</option>
                                        <option value="workshop">Workshop</option>
                                        <option value="meetup">Meetup</option>
                                        <option value="seminar">Seminar</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className={`text-xs mb-1 block ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/60'}`}>Start Date</label>
                                        <input
                                            type="date"
                                            value={eventData.startDate}
                                            min={new Date().toISOString().split('T')[0]}
                                            onChange={(e) => setEventData(prev => ({ ...prev, startDate: e.target.value }))}
                                            className={`w-full rounded-xl px-3 py-2 text-sm border focus:outline-none ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-[#e0d8cf]/50 border-[#4a3728]/30 text-[#4a3728]'}`}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className={`text-xs mb-1 block ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/60'}`}>Start Time</label>
                                        <input
                                            type="time"
                                            value={eventData.startTime}
                                            onChange={(e) => setEventData(prev => ({ ...prev, startTime: e.target.value }))}
                                            className={`w-full rounded-xl px-3 py-2 text-sm border focus:outline-none ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-[#e0d8cf]/50 border-[#4a3728]/30 text-[#4a3728]'}`}
                                        />
                                    </div>
                                </div>

                                <textarea
                                    placeholder="Event description (optional)"
                                    value={eventData.description}
                                    onChange={(e) => setEventData(prev => ({ ...prev, description: e.target.value }))}
                                    rows={2}
                                    className={`w-full rounded-xl px-3 py-2 text-sm border resize-none focus:outline-none focus:ring-2 focus:ring-[#6b5643]/50 ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white placeholder-slate-400' : 'bg-[#e0d8cf]/50 border-[#4a3728]/30 text-[#4a3728] placeholder-[#4a3728]/50'}`}
                                />
                            </div>
                        </div>
                    )}

                    {/* Action Buttons Row */}
                    <div className={`flex items-center gap-1 sm:gap-2 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b overflow-x-auto ${isDarkMode ? 'border-slate-700' : 'border-[#4a3728]/10'}`}>
                        {/* Photo */}
                        <button
                            onClick={() => handleMediaOptionClick('photo')}
                            className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm border transition-all flex-shrink-0 ${selectedImages.length > 0
                                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                : isDarkMode
                                    ? 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700'
                                    : 'bg-[#e0d8cf]/50 border-[#4a3728]/30 text-[#4a3728]/70 hover:bg-[#e0d8cf]'
                                }`}
                        >
                            <LucideImage className="w-3 sm:w-4 h-3 sm:h-4" />
                            <span className="hidden sm:inline">Photo {selectedImages.length > 0 && `(${selectedImages.length})`}</span>
                            <span className="sm:hidden">{selectedImages.length > 0 && `${selectedImages.length}`}</span>
                        </button>

                        {/* Video */}
                        <button
                            onClick={() => handleMediaOptionClick('video')}
                            className={`flex items-center gap-1 px-2 sm:py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm border transition-all flex-shrink-0 ${selectedVideos.length > 0
                                ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                                : isDarkMode
                                    ? 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700'
                                    : 'bg-[#e0d8cf]/50 border-[#4a3728]/30 text-[#4a3728]/70 hover:bg-[#e0d8cf]'
                                }`}
                        >
                            <Video className="w-3 sm:w-4 h-3 sm:h-4" />
                            <span className="hidden sm:inline">Video {selectedVideos.length > 0 && `(${selectedVideos.length})`}</span>
                            <span className="sm:hidden">{selectedVideos.length > 0 && `${selectedVideos.length}`}</span>
                        </button>

                        {/* Poll */}
                        <button
                            onClick={() => handleMediaOptionClick('poll')}
                            className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm border transition-all flex-shrink-0 ${isPollOpen
                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                : isDarkMode
                                    ? 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700'
                                    : 'bg-[#e0d8cf]/50 border-[#4a3728]/30 text-[#4a3728]/70 hover:bg-[#e0d8cf]'
                                }`}
                        >
                            <BarChart2 className="w-3 sm:w-4 h-3 sm:h-4" />
                            <span className="hidden sm:inline">Poll</span>
                        </button>

                        {/* Event */}
                        <button
                            onClick={() => handleMediaOptionClick('event')}
                            className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm border transition-all flex-shrink-0 ${isEventOpen
                                ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                                : isDarkMode
                                    ? 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700'
                                    : 'bg-[#e0d8cf]/50 border-[#4a3728]/30 text-[#4a3728]/70 hover:bg-[#e0d8cf]'
                                }`}
                        >
                            <Calendar className="w-3 sm:w-4 h-3 sm:h-4" />
                            <span className="hidden sm:inline">Event</span>
                        </button>

                        {/* Schedule */}
                        <button
                            onClick={handleScheduleClick}
                            className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm border transition-all flex-shrink-0 ml-auto ${isScheduleOpen || (scheduledDate && scheduledTime)
                                ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
                                : isDarkMode
                                    ? 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700'
                                    : 'bg-[#e0d8cf]/50 border-[#4a3728]/30 text-[#4a3728]/70 hover:bg-[#e0d8cf]'
                                }`}
                        >
                            <Calendar className="w-3 sm:w-4 h-3 sm:h-4" />
                            <span className="hidden sm:inline">{scheduledDate && scheduledTime ? 'Scheduled ✓' : 'Schedule'}</span>
                        </button>
                    </div>

                    {/* Bottom — Privacy + Share */}
                    <div className="flex items-center justify-between gap-2 sm:gap-4">
                        <div className="flex items-center gap-1 sm:gap-2">
                            <span className={`text-xs sm:text-sm ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/70'}`}>
                                {isPublic ? 'Public' : 'Private'}
                            </span>
                            <button
                                onClick={() => setIsPublic(!isPublic)}
                                className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${isPublic ? 'bg-[#6b5643]' : isDarkMode ? 'bg-slate-600' : 'bg-[#4a3728]/40'}`}
                            >
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-transform duration-200 ${isDarkMode ? 'bg-white' : 'bg-[#f6ede8]'} ${isPublic ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </button>
                        </div>

                        <button
                            onClick={handlePostSubmit}
                            disabled={isSubmittingPost}
                            className="bg-gradient-to-r from-[#4a3728] via-[#6b5643] to-[#8b7355] text-white px-3 sm:px-6 py-2 sm:py-2.5 rounded-2xl font-semibold text-xs sm:text-sm transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden flex-shrink-0"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
                            <span className="relative z-10">
                                {isSubmittingPost ? 'Posting...' : isScheduleOpen && scheduledDate && scheduledTime ? 'Schedule' : 'Share'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    {/* POST ANALYTICS MODAL */ }
    {
        isAnalyticsOpen && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-center md:justify-end md:pr-[2%] bg-black/40 backdrop-blur-sm animate-fadeIn">
                <div
                    className={`w-full sm:w-[95%] md:w-[90%] lg:w-[520px] max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 md:p-8 relative shadow-2xl transform transition-all duration-500 animate-slideUp ${isDarkMode ? 'bg-slate-800/95' : 'bg-[#f6ede8]/95'} backdrop-blur-xl`}
                >
                    <button
                        onClick={() => setIsAnalyticsOpen(false)}
                        className={`absolute top-3 sm:top-4 right-3 sm:right-4 p-2 rounded-full transition-all duration-300 ${isDarkMode ? 'text-white hover:bg-slate-700' : 'text-[#4a3728] hover:bg-[#e0d8cf]'}`}
                    >
                        <X className="w-5 sm:w-6 h-5 sm:h-6" />
                    </button>
                    <h2 className={`text-lg sm:text-2xl font-bold mb-4 sm:mb-6 pr-8 ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>
                        <BarChart2 className="inline mr-2 w-5 sm:w-6 h-5 sm:h-6" />
                        Post Analytics
                    </h2>
                    {/* Overview Stats */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
                        <div className={`p-3 sm:p-4 rounded-2xl ${isDarkMode ? 'bg-slate-700/50' : 'bg-white/60'}`}>
                            <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/70'} mb-1`}>Total Posts</p>
                            <p className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-[#6b5643] to-[#8b7355] bg-clip-text text-transparent">{userPosts.length}</p>
                        </div>
                        <div className={`p-3 sm:p-4 rounded-2xl ${isDarkMode ? 'bg-slate-700/50' : 'bg-white/60'}`}>
                            <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/70'} mb-1`}>Engagement</p>
                            <p className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-[#8b7355] to-[#6b5643] bg-clip-text text-transparent">{formatEngagement(totalEngagement)}</p>
                        </div>
                    </div>
                    {/* Top Performing Posts */}
                    <h3 className={`text-base sm:text-lg font-bold mb-3 sm:mb-4 ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>
                        Top Posts
                    </h3>
                    <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                        {userPosts.map((post) => (
                            <div
                                key={post.postId}
                                className={`rounded-xl p-3 sm:p-4 border ${isDarkMode ? 'bg-slate-700/60 border-slate-600/60' : 'bg-white/60 border-[#4a3728]/20'}`}
                            >
                                <div className="flex gap-2 sm:gap-3 mb-2 sm:mb-3">
                                    {post.images && post.images.length > 0 && (
                                        <img
                                            src={post.images[0].cloudinarySecureUrl}
                                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0"
                                            alt="Post"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs sm:text-sm font-bold mb-2 truncate ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>
                                            {post.title}
                                        </p>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2 text-xs">
                                            <div className={`p-2 rounded ${isDarkMode ? 'bg-slate-800/50' : 'bg-[#e0d8cf]/50'}`}>
                                                <p className={isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/60'}>Impressions</p>
                                                <p className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>{post.viewsCount ?? post.impressions ?? 0}</p>
                                            </div>
                                            <div className={`p-2 rounded ${isDarkMode ? 'bg-slate-800/50' : 'bg-[#e0d8cf]/50'}`}>
                                                <p className={isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/60'}>Likes</p>
                                                <p className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>{post.likesCount}</p>
                                            </div>
                                            <div className={`p-2 rounded ${isDarkMode ? 'bg-slate-800/50' : 'bg-[#e0d8cf]/50'}`}>
                                                <p className={isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/60'}>Comments</p>
                                                <p className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>{post.commentsCount}</p>
                                            </div>
                                            <div className={`p-2 rounded ${isDarkMode ? 'bg-slate-800/50' : 'bg-[#e0d8cf]/50'}`}>
                                                <p className={isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/60'}>Shares</p>
                                                <p className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>{post.shares ?? 0}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className={`p-2 sm:p-3 rounded-lg ${isDarkMode ? 'bg-slate-800/50' : 'bg-[#e0d8cf]/50'}`}>
                                    <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/70'} mb-1`}>Engagement Rate</p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-gradient-to-r from-[#4a3728]/20 to-[#8b7355]/20 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-[#4a3728] to-[#8b7355] h-2 rounded-full"
                                                style={{ width: `${Math.min((post.likesCount + post.commentsCount + (post.shares ?? 0)) / 2, 100)}%` }}
                                            ></div>
                                        </div>
                                        <span className={`text-xs sm:text-sm font-bold ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>
                                            {Math.round((post.likesCount + post.commentsCount + (post.shares ?? 0)) / 2)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Weekly Performance */}
                    <h3 className={`text-base sm:text-lg font-bold mb-3 sm:mb-4 ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>
                        Weekly Performance
                    </h3>
                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                        <div className={`p-3 sm:p-4 rounded-xl ${isDarkMode ? 'bg-slate-700/50' : 'bg-white/60'}`}>
                            <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/70'} mb-1`}>Profile Views</p>
                            <p className="text-xl sm:text-2xl font-black bg-gradient-to-r from-[#6b5643] to-[#8b7355] bg-clip-text text-transparent">
                                {isLoadingWeeklyPerformance
                                    ? '...'
                                    : `${weeklyPerformance && weeklyPerformance.profileViewsChange >= 0 ? '+' : ''}${weeklyPerformance?.profileViewsChange ?? 0}%`}
                            </p>
                        </div>
                        <div className={`p-3 sm:p-4 rounded-xl ${isDarkMode ? 'bg-slate-700/50' : 'bg-white/60'}`}>
                            <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/70'} mb-1`}>Post Reach</p>
                            <p className="text-xl sm:text-2xl font-black bg-gradient-to-r from-[#8b7355] to-[#6b5643] bg-clip-text text-transparent">
                                {isLoadingWeeklyPerformance
                                    ? '...'
                                    : `${weeklyPerformance && weeklyPerformance.postReachChange >= 0 ? '+' : ''}${weeklyPerformance?.postReachChange ?? 0}%`}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    {/* Repost with Perspective Modal */ }
    <RepostWithPerspectiveModal
        isOpen={isRepostWithPerspectiveOpen}
        onClose={() => {
            setIsRepostWithPerspectiveOpen(false);
            setSelectedRepostPost(null);
            setSelectedRepostIndex(null);
        }}
        post={selectedRepostPost}
        onRepost={(thoughts) => {
            confirmRepost(thoughts);
        }}
        onOpenConfirmDialog={() => {
            setIsRepostWithPerspectiveOpen(false);
            setIsConfirmRepostOpen(true);
        }}
        isDarkMode={isDarkMode}
    />

    {/* Confirm Repost Modal (no thoughts) */ }
    <ConfirmRepostModal
        isOpen={isConfirmRepostOpen}
        onClose={() => setIsConfirmRepostOpen(false)}
        onConfirm={handleConfirmRepostWithoutThoughts}
        isDarkMode={isDarkMode}
    />

    {selectedAnalyticsPost && (
        <div 
            onClick={() => setSelectedAnalyticsPost(null)}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
        >
            <div 
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl border border-[#e0d8cf]/50 dark:border-slate-700/50 relative text-[#4a3728] dark:text-slate-100"
            >
                <button 
                    onClick={() => setSelectedAnalyticsPost(null)}
                    className="absolute top-4 right-4 p-2.5 rounded-full hover:bg-[#e0d8cf]/40 dark:hover:bg-slate-700/50 transition-colors text-[#4a3728]/70 dark:text-slate-400"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                
                {/* Title */}
                <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-[#4a3728] text-white rounded-xl">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-black text-[#4a3728] dark:text-white">Post Analytics</h2>
                </div>

                {/* Content Preview */}
                <div className="mb-6 bg-[#e0d8cf]/10 border border-[#e0d8cf]/30 rounded-2xl p-4">
                    <p className="text-xs font-bold text-[#4a3728]/50 dark:text-white/50 uppercase tracking-wider mb-1">Post Caption</p>
                    <p className="text-sm font-semibold text-[#4a3728] dark:text-slate-200 line-clamp-2 italic">
                        {selectedAnalyticsPost.content || selectedAnalyticsPost.text || 'No text content'}
                    </p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Views */}
                    <div className="p-4 bg-gradient-to-br from-[#e0d8cf]/20 to-[#f6ede8]/10 dark:from-slate-700/30 dark:to-slate-700/10 border border-[#e0d8cf]/20 dark:border-slate-700 rounded-2xl flex flex-col justify-between">
                        <span className="text-xs font-bold text-[#4a3728]/60 dark:text-slate-400 flex items-center gap-1.5 mb-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Impressions
                        </span>
                        <span className="text-3xl font-black tracking-tight text-[#4a3728] dark:text-white">
                            {selectedAnalyticsPost.viewsCount || selectedAnalyticsPost.impressions || 0}
                        </span>
                    </div>

                    {/* Likes */}
                    <div className="p-4 bg-gradient-to-br from-[#e0d8cf]/20 to-[#f6ede8]/10 dark:from-slate-700/30 dark:to-slate-700/10 border border-[#e0d8cf]/20 dark:border-slate-700 rounded-2xl flex flex-col justify-between">
                        <span className="text-xs font-bold text-[#4a3728]/60 dark:text-slate-400 flex items-center gap-1.5 mb-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            Likes
                        </span>
                        <span className="text-3xl font-black tracking-tight text-[#4a3728] dark:text-white">
                            {selectedAnalyticsPost.likesCount || selectedAnalyticsPost.likes || 0}
                        </span>
                    </div>

                    {/* Comments */}
                    <div className="p-4 bg-gradient-to-br from-[#e0d8cf]/20 to-[#f6ede8]/10 dark:from-slate-700/30 dark:to-slate-700/10 border border-[#e0d8cf]/20 dark:border-slate-700 rounded-2xl flex flex-col justify-between">
                        <span className="text-xs font-bold text-[#4a3728]/60 dark:text-slate-400 flex items-center gap-1.5 mb-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            Comments
                        </span>
                        <span className="text-3xl font-black tracking-tight text-[#4a3728] dark:text-white">
                            {selectedAnalyticsPost.commentsCount || 0}
                        </span>
                    </div>

                    {/* Engagement Rate */}
                    <div className="p-4 bg-gradient-to-br from-[#e0d8cf]/20 to-[#f6ede8]/10 dark:from-slate-700/30 dark:to-slate-700/10 border border-[#e0d8cf]/20 dark:border-slate-700 rounded-2xl flex flex-col justify-between">
                        <span className="text-xs font-bold text-[#4a3728]/60 dark:text-slate-400 flex items-center gap-1.5 mb-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Engagement
                        </span>
                        <span className="text-3xl font-black tracking-tight text-[#4a3728] dark:text-white">
                            {(((selectedAnalyticsPost.likesCount || selectedAnalyticsPost.likes || 0) + (selectedAnalyticsPost.commentsCount || 0) + (selectedAnalyticsPost.sharesCount || selectedAnalyticsPost.shares || 0)) / (selectedAnalyticsPost.viewsCount || selectedAnalyticsPost.impressions || 1) * 100).toFixed(1)}%
                        </span>
                    </div>
                </div>

                {/* Progress Bar visual indicator */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-[#4a3728]/60 dark:text-slate-400">
                        <span>Engagement Level</span>
                        <span className="text-[#4a3728] dark:text-white">
                            {Math.min(100, Math.round((((selectedAnalyticsPost.likesCount || selectedAnalyticsPost.likes || 0) + (selectedAnalyticsPost.commentsCount || 0) + (selectedAnalyticsPost.sharesCount || selectedAnalyticsPost.shares || 0)) / (selectedAnalyticsPost.viewsCount || selectedAnalyticsPost.impressions || 1) * 100) * 2))}%
                        </span>
                    </div>
                    <div className="w-full h-3 bg-[#e0d8cf]/30 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-[#8b7355] to-[#4a3728] dark:from-[#9d8466] dark:to-white rounded-full transition-all duration-1000"
                            style={{ 
                                width: `${Math.min(100, Math.round((((selectedAnalyticsPost.likesCount || selectedAnalyticsPost.likes || 0) + (selectedAnalyticsPost.commentsCount || 0) + (selectedAnalyticsPost.sharesCount || selectedAnalyticsPost.shares || 0)) / (selectedAnalyticsPost.viewsCount || selectedAnalyticsPost.impressions || 1) * 100) * 2))}%` 
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )}

    {/* Custom Styles */ }
    <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
                @import url('https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css');
                
                .sticky-sidebar {
                    position: -webkit-sticky !important;
                    position: sticky !important;
                    top: 96px !important;
                    align-self: flex-start !important;
                }

                html, body {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    scroll-behavior: smooth;
                }
                * {
                    box-sizing: inherit;
                }
                ::-webkit-scrollbar {
                    width: 8px;
                }
                ::-webkit-scrollbar-track {
                    background: ${isDarkMode ? '#2d3748' : '#e0d8cf'};
                }
                ::-webkit-scrollbar-thumb {
                    background: linear-gradient(to bottom, #4a3728, #8b7355);
                    border-radius: 4px;
                }
                ::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(to bottom, #6b5643, #9d8466);
                }
                button {
                    cursor: pointer;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
                .animate-slideUp {
                    animation: slideUp 0.4s ease-out;
                }
            `}</style>
        </div >
    );
}