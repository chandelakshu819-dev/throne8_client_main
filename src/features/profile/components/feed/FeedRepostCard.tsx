'use client';
// src/features/profile/components/feed/FeedRepostCard.tsx
import React from 'react';

interface FeedRepostCardProps {
    repostItem: any;
    isDarkMode: boolean;
    profileImage: string;
    fullName: string;
    currentUserId?: string;
}

const FeedRepostCard = ({
    repostItem,
    isDarkMode,
    profileImage,
    fullName,
    currentUserId,
}: FeedRepostCardProps) => {
    const originalPost = repostItem.originalPost;
    if (!originalPost) return null;

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <div
            className={`p-8 rounded-3xl shadow-2xl backdrop-blur-xl border transition-all duration-500 hover:scale-[1.01] hover:-translate-y-0.5 ${isDarkMode
                ? 'bg-slate-800/60 border-slate-700/50'
                : 'bg-[#f6ede8]/95 border-[#4a3728]/20'
                } relative overflow-hidden`}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-[#6b5643]/3 via-[#8b7355]/3 to-[#4a3728]/3" />

            <div className="relative z-10">
                {/* ── Repost Header (tumne repost kiya) ── */}
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#4a3728]/10">
                    <i className="ri-repeat-line text-lg text-[#6b5643]" />
                    <div className="w-6 h-6 rounded-full overflow-hidden border border-[#4a3728]/20 flex-shrink-0">
                        {profileImage ? (
                            <img
                                src={profileImage}
                                alt={fullName}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-[#4a3728]/20 flex items-center justify-center">
                                <span className="text-xs text-[#4a3728] font-bold">
                                    {fullName?.charAt(0)}
                                </span>
                            </div>
                        )}
                    </div>
                    <span
                        className={`text-sm font-semibold ${isDarkMode ? 'text-slate-300' : 'text-[#4a3728]/70'
                            }`}
                    >
                        {fullName} reposted
                        {repostItem.repostType === 'quote' && ' with thoughts'}
                    </span>
                    <span
                        className={`text-xs ml-auto ${isDarkMode ? 'text-slate-500' : 'text-[#4a3728]/40'
                            }`}
                    >
                        {timeAgo(repostItem.createdAt)}
                    </span>
                </div>

                {/* ── Quote Thought (agar quote repost hai) ── */}
                {repostItem.repostType === 'quote' && repostItem.thoughtText && (
                    <p
                        className={`text-sm italic mb-4 pl-3 border-l-2 border-[#6b5643]/40 ${isDarkMode ? 'text-slate-300' : 'text-[#4a3728]/80'
                            }`}
                    >
                        "{repostItem.thoughtText}"
                    </p>
                )}

                {/* ── Original Post Content (border ke saath) ── */}
                <div
                    className={`rounded-2xl border p-5 ${isDarkMode
                        ? 'bg-slate-700/40 border-slate-600/50'
                        : 'bg-white/60 border-[#4a3728]/15'
                        }`}
                >
                    {/* Original Post Author */}
                    <div className="flex items-center gap-3 mb-3">
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${isDarkMode
                                ? 'bg-slate-600 border-slate-500'
                                : 'bg-[#e0d8cf] border-[#4a3728]/10'
                                }`}
                        >
                            {originalPost.userAvatar ? (
                                <img
                                    src={originalPost.userAvatar}
                                    alt="Author"
                                    className="w-full h-full object-cover rounded-full"
                                />
                            ) : (
                                <i className="ri-user-line text-[#4a3728]/50 text-lg" />
                            )}
                        </div>
                        <div>
                            <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>
                                {originalPost.userName || originalPost.fullName || 'Unknown User'}
                            </p>
                            <p
                                className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/50'
                                    }`}
                            >
                                {timeAgo(originalPost.createdAt)}
                            </p>
                        </div>
                    </div>

                    {/* Original Post Title */}
                    <h3
                        className={`text-base font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-[#4a3728]'
                            }`}
                    >
                        {originalPost.title}
                    </h3>

                    {/* Original Post Content */}
                    {originalPost.content && (
                        <p
                            className={`text-sm leading-relaxed mb-3 line-clamp-3 ${isDarkMode ? 'text-slate-300' : 'text-[#4a3728]/70'
                                }`}
                        >
                            {originalPost.content}
                        </p>
                    )}

                    {/* Original Post Image */}
                    {originalPost.images?.length > 0 && (
                        <img
                            src={originalPost.images[0].cloudinarySecureUrl}
                            alt={originalPost.title}
                            className="w-full h-48 object-cover rounded-xl mt-2"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    )}

                    {/* Original Post Stats */}
                    <div
                        className={`flex items-center gap-5 mt-4 pt-3 border-t ${isDarkMode ? 'border-slate-600/50' : 'border-[#4a3728]/10'
                            }`}
                    >
                        <span
                            className={`flex items-center gap-1.5 text-sm ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/50'
                                }`}
                        >
                            <i className="ri-heart-line" />
                            {originalPost.likesCount || 0}
                        </span>
                        <span
                            className={`flex items-center gap-1.5 text-sm ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/50'
                                }`}
                        >
                            <i className="ri-message-3-line" />
                            {originalPost.commentsCount || 0}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeedRepostCard;