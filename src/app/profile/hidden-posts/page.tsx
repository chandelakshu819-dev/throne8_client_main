'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import AuthService from '@/lib/api/auth.service';
import ProfileService from '@/lib/api/profile.service';
import { useAuth } from '@/features/auth/hooks/useAuth';
import PostCard from '@/features/profile/components/feed/PostCard';
import { useActivityHandlers } from '@/features/profile/hooks/useActivityHandler';
import { getHiddenPosts, unhidePost, HiddenPostItem } from '@/lib/utils/hiddenPosts';

type AuthorInfo = { name: string; headline: string; avatar: string };

const HiddenPostsPage: React.FC = () => {
    const router = useRouter();
    const { user: authUser } = useAuth();
    const [hiddenItems, setHiddenItems] = useState<HiddenPostItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [authorsMap, setAuthorsMap] = useState<Record<string, AuthorInfo>>({});
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const loadHidden = () => {
        setIsLoading(true);
        const items = getHiddenPosts();
        setHiddenItems(items);
        setIsLoading(false);
    };

    useEffect(() => {
        loadHidden();
        const handleChanged = () => loadHidden();
        window.addEventListener('hidden_posts_changed', handleChanged);
        return () => window.removeEventListener('hidden_posts_changed', handleChanged);
    }, []);

    // Fetch author info for hidden posts
    useEffect(() => {
        if (hiddenItems.length === 0) return;

        const uniqueUserIds = Array.from(
            new Set(hiddenItems.map((item) => item.post?.userId).filter(Boolean))
        ).filter((id) => !authorsMap[id as string]) as string[];

        if (uniqueUserIds.length === 0) return;

        const fetchAuthor = async (uid: string) => {
            try {
                const response = await AuthService.getUserProfileById(uid);
                const user = response ? response.data : null;
                if (!user) return;

                let headline = '';
                let avatar = '';

                if (user.headlineId) {
                    try {
                        const headlineRes = await ProfileService.getHeadlineById(user.headlineId);
                        headline = headlineRes?.data?.title || '';
                    } catch {
                        headline = '';
                    }
                }

                if (user.profilePhotoId) {
                    try {
                        const photoRes = await ProfileService.getProfilePhotoById(user.profilePhotoId);
                        avatar = photoRes?.data?.photo?.cloudinarySecureUrl || '';
                    } catch {
                        avatar = '';
                    }
                }

                const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

                setAuthorsMap((prev) => ({
                    ...prev,
                    [uid]: {
                        name: uid === authUser?.userId ? (displayName || 'You') : (displayName || 'Unknown User'),
                        headline,
                        avatar,
                    },
                }));
            } catch {
                setAuthorsMap((prev) => ({
                    ...prev,
                    [uid]: { name: uid === authUser?.userId ? 'You' : 'Unknown User', headline: '', avatar: '' },
                }));
            }
        };

        uniqueUserIds.forEach((uid: string) => {
            fetchAuthor(uid);
        });
    }, [hiddenItems, authUser]);

    const hiddenPostsList = hiddenItems.map((item) => item.post);

    const handlers = useActivityHandlers({
        posts: hiddenPostsList,
        onPostCreated: loadHidden,
        profileImage: authUser?.profileImage || '',
    });

    const handleUnhide = (postId: string) => {
        unhidePost(postId);
        setToastMessage('Post unhidden and restored.');
        setTimeout(() => setToastMessage(null), 3000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#faf6f2] to-[#f0e6dc]">
            {/* Toast notification */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 bg-[#4a3728] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-semibold animate-fade-in">
                    <Eye className="w-4 h-4 text-amber-300" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Header */}
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-[#e0d8cf]">
                <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-[#f6ede8] transition-colors">
                        <ArrowLeft className="w-5 h-5 text-[#4a3728]" />
                    </button>
                    <div className="flex items-center gap-2">
                        <EyeOff className="w-5 h-5 text-[#4a3728]" />
                        <span className="text-lg font-bold text-[#4a3728]">Hidden Posts</span>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
                {isLoading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-8 h-8 border-4 border-[#4a3728]/20 border-t-[#4a3728] rounded-full animate-spin" />
                    </div>
                ) : hiddenItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-white/50 rounded-3xl border border-[#e0d8cf] text-center px-4">
                        <EyeOff className="w-12 h-12 text-[#4a3728]/30 mb-3" />
                        <h3 className="text-lg font-bold text-[#4a3728]">No hidden posts yet</h3>
                        <p className="text-sm text-[#4a3728]/60 mt-1 max-w-sm">
                            Posts you hide from your feed or activity section will appear here. You can unhide them anytime.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {hiddenItems.map(({ id, post }) => {
                            const postKey = id;
                            const author = authorsMap[post?.userId];

                            const postForCard = {
                                ...post,
                                image: post?.images?.[0]?.cloudinarySecureUrl || post?.image || '',
                            };

                            return (
                                <div key={postKey} className="bg-white rounded-3xl border border-[#e0d8cf] shadow-sm overflow-hidden p-4 relative">
                                    <div className="flex items-center justify-between pb-3 border-b border-[#e0d8cf]/60 mb-3">
                                        <span className="text-xs font-semibold text-[#4a3728]/60 flex items-center gap-1.5">
                                            <EyeOff className="w-3.5 h-3.5 text-[#4a3728]/70" /> Hidden from feed
                                        </span>
                                        <button
                                            onClick={() => handleUnhide(postKey)}
                                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#f6ede8] text-[#4a3728] border border-[#e0d8cf] hover:bg-[#4a3728] hover:text-white transition-all text-xs font-bold"
                                        >
                                            <Eye className="w-3.5 h-3.5" /> Unhide Post
                                        </button>
                                    </div>
                                    <div className="flex flex-col">
                                        <PostCard
                                            post={postForCard}
                                            index={postKey}
                                            isOwnProfile={post?.userId === authUser?.userId}
                                            profileImage={author?.avatar || ''}
                                            fullName={author?.name || 'Loading...'}
                                            headline={author?.headline || ''}
                                            postLikes={handlers.postLikes}
                                            openMenuId={handlers.openMenuId}
                                            setOpenMenuId={handlers.setOpenMenuId}
                                            onLikeToggle={handlers.handleLikeToggle}
                                            onSavePost={handlers.handleSavePost}
                                            postSaves={handlers.postSaves}
                                            postPins={handlers.postPins}
                                            currentUserId={authUser?.userId || ''}
                                            commentsByPost={handlers.commentsByPost}
                                            isLoadingComments={handlers.isLoadingComments}
                                            fetchCommentsByPost={handlers.fetchCommentsByPost}
                                            handlePostAction={async (action: string, pid: string) => {
                                                if (action === 'hide' || action === 'unhide') {
                                                    handleUnhide(pid);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HiddenPostsPage;
