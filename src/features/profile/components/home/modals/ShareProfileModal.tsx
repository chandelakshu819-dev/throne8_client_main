'use client';

import React, { useEffect, useState } from 'react';
import { X, Copy, Check, Share2, Mail, MessageSquare, Globe, Linkedin, Twitter } from 'lucide-react';

interface ShareProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    name: string;
    profileImage: string;
    headline: string;
    userId?: string;
}

const ShareProfileModal: React.FC<ShareProfileModalProps> = ({
    isOpen,
    onClose,
    name,
    profileImage,
    headline,
    userId,
}) => {
    const [copied, setCopied] = useState(false);
    const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/profile/${userId}` : '';

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleCopy = () => {
        if (profileUrl) {
            navigator.clipboard.writeText(profileUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const handleNativeShare = async () => {
        if (navigator.share && profileUrl) {
            try {
                await navigator.share({
                    title: `${name} on Throne8`,
                    text: `Check out ${name}'s profile on Throne8: ${headline}`,
                    url: profileUrl,
                });
            } catch (err) {
                // Ignore user cancellation
            }
        }
    };

    const shareText = encodeURIComponent(`Check out ${name}'s profile on Throne8: ${headline}`);
    const encodedUrl = encodeURIComponent(profileUrl);

    const shareOptions = [
        {
            name: 'WhatsApp',
            icon: MessageSquare,
            bgColor: 'bg-emerald-600 hover:bg-emerald-700',
            url: `https://api.whatsapp.com/send?text=${shareText}%20${encodedUrl}`,
        },
        {
            name: 'LinkedIn',
            icon: Linkedin,
            bgColor: 'bg-blue-600 hover:bg-blue-700',
            url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        },
        {
            name: 'X (Twitter)',
            icon: Twitter,
            bgColor: 'bg-black hover:bg-gray-800',
            url: `https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}`,
        },
        {
            name: 'Email',
            icon: Mail,
            bgColor: 'bg-amber-700 hover:bg-amber-800',
            url: `mailto:?subject=${encodeURIComponent(`Profile of ${name} on Throne8`)}&body=${shareText}%20${encodedUrl}`,
        },
    ];

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl border border-[#e0d8cf] relative"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full bg-[#f6ede8] text-[#4a3728] hover:bg-[#e0d8cf] transition-all duration-200"
                    aria-label="Close modal"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Modal Title */}
                <div className="flex items-center gap-2 mb-4">
                    <Share2 className="w-6 h-6 text-[#4a3728]" />
                    <h2 className="text-xl font-bold text-[#4a3728]">Share Profile</h2>
                </div>

                {/* Member Preview Card */}
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#f6ede8]/60 border border-[#e0d8cf]/70 mb-6">
                    <img
                        src={profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=4a3728&color=fff`}
                        alt={name}
                        className="w-12 h-12 rounded-xl object-cover border border-white shadow-sm flex-shrink-0"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=4a3728&color=fff`;
                        }}
                    />
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-[#4a3728] truncate">{name}</h3>
                        <p className="text-xs text-[#4a3728]/70 truncate">{headline || 'Throne8 Member'}</p>
                    </div>
                </div>

                {/* Direct Link Section */}
                <div className="mb-6">
                    <label className="block text-xs font-bold text-[#4a3728] uppercase tracking-wider mb-2">
                        Direct Profile URL
                    </label>
                    <div className="flex items-center gap-2 bg-[#f6ede8]/40 border border-[#e0d8cf] rounded-2xl p-1.5 focus-within:border-[#4a3728] transition-all duration-200">
                        <input
                            type="text"
                            readOnly
                            value={profileUrl}
                            className="flex-1 bg-transparent border-none text-xs text-[#4a3728] px-3 py-1.5 outline-none font-mono truncate"
                        />
                        <button
                            onClick={handleCopy}
                            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-1.5 shadow-sm ${
                                copied
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-[#4a3728] text-white hover:bg-[#6b4e31]'
                            }`}
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    <span>Copied!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    <span>Copy</span>
                                </>
                            )}
                        </button>
                    </div>
                    {copied && (
                        <p className="text-xs font-semibold text-emerald-600 mt-2 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Profile link copied to clipboard!
                        </p>
                    )}
                </div>

                {/* Social Share Grid */}
                <div className="mb-6">
                    <label className="block text-xs font-bold text-[#4a3728] uppercase tracking-wider mb-3">
                        Share Via
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {shareOptions.map((opt) => {
                            const Icon = opt.icon;
                            return (
                                <a
                                    key={opt.name}
                                    href={opt.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-white font-semibold text-xs transition-all duration-200 shadow-sm ${opt.bgColor} hover:scale-[1.02] active:scale-[0.98]`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{opt.name}</span>
                                </a>
                            );
                        })}
                    </div>

                    {typeof navigator !== 'undefined' && 'share' in navigator && (
                        <button
                            onClick={handleNativeShare}
                            className="w-full mt-3 py-3 px-4 rounded-2xl bg-[#f6ede8] text-[#4a3728] border border-[#e0d8cf] font-bold text-xs hover:bg-[#e0d8cf] transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <Globe className="w-4 h-4" />
                            <span>More Share Options...</span>
                        </button>
                    )}
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="w-full py-3 rounded-2xl border-2 border-[#4a3728]/20 text-[#4a3728] font-bold text-sm hover:bg-[#f6ede8] transition-all duration-200"
                >
                    Done
                </button>
            </div>
        </div>
    );
};

export default ShareProfileModal;
