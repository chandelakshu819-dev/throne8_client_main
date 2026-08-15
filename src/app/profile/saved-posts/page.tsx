'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import ProfileService from '@/lib/api/profile.service';
import AuthService from '@/lib/api/auth.service';
import { useAuth } from '@/features/auth/hooks/useAuth';
import PostCard from '@/features/profile/components/feed/PostCard';
import { useActivityHandlers } from '@/features/profile/hooks/useActivityHandler';

type AuthorInfo = { name: string; headline: string; avatar: string };

const SavedPostsPage: React.FC = () => {
    const router = useRouter();
    const { user: authUser } = useAuth();
    const [savedPosts, setSavedPosts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [authorsMap, setAuthorsMap] = useState<Record<string, AuthorInfo>>({});

    const fetchSaved = async () => {
        try {
            setIsLoading(true);
            const res = await ProfileService.getAllUserPosts();
            setSavedPosts(res?.data?.savedPosts || []);
        } catch (err) {
            setSavedPosts([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSaved();
    }, []);

    // ✅ saved posts ke unique authors fetch karo
    useEffect(() => {
        if (savedPosts.length === 0) return;

        const uniqueUserIds = Array.from(
            new Set(savedPosts.map((p: any) => p.userId).filter(Boolean))
        ).filter((id: string) => !authorsMap[id]);

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
            } catch (err) {
                setAuthorsMap((prev) => ({
                    ...prev,
                    [uid]: { name: uid === authUser?.userId ? 'You' : 'Unknown User', headline: '', avatar: '' },
                }));
            }
        };

        uniqueUserIds.forEach((uid: string) => {
            fetchAuthor(uid);
        });
    }, [savedPosts, authUser]);

    const handlers = useActivityHandlers({
        posts: savedPosts,
        onPostCreated: fetchSaved,
        profileImage: authUser?.profileImage || '',
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#faf6f2] to-[#f0e6dc]">
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-[#e0d8cf]">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-[#f6ede8]">
                        <ArrowLeft className="w-5 h-5 text-[#4a3728]" />
                    </button>
                    <span className="text-lg font-bold text-[#4a3728]">Saved Posts</span>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6">
                {isLoading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-8 h-8 border-4 border-[#4a3728]/20 border-t-[#4a3728] rounded-full animate-spin" />
                    </div>
                ) : savedPosts.length === 0 ? (
                    <div className="text-center py-16 bg-white/50 rounded-3xl border border-[#e0d8cf]">
                        <p className="text-[#4a3728]/60 font-medium">No saved posts yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {savedPosts.map((post: any) => {
    const postKey = post.entryId || post.postId;
    const author = authorsMap[post.userId];

    // ✅ NEW — images array se singular `image` field banao,
    // PostCard/PostContent isi field ko expect karta hai
    const postForCard = {
        ...post,
        image: post.images?.[0]?.cloudinarySecureUrl || '',
    };

    return (
        <div key={postKey} className="h-[500px] flex flex-col">
            <PostCard
                post={postForCard}
                index={postKey}
            
                                        isOwnProfile={post.userId === authUser?.userId}
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
                                        handlePostAction={async (action: string, postId: string) => {
                                            if (action === 'save') {
                                                const wasSaved = handlers.postSaves[postId] ?? true;
                                                await handlers.handleSavePost(postId, wasSaved);
                                                fetchSaved();
                                            }
                                        }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SavedPostsPage;