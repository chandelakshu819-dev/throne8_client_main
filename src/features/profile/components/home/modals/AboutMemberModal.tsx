'use client';

import React, { useEffect } from 'react';
import { X, User, Briefcase, GraduationCap, MapPin, Users, Link as LinkIcon, Check, Calendar, ShieldCheck } from 'lucide-react';

interface AboutMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    name: string;
    profileImage: string;
    headline: string;
    location?: string;
    company?: string;
    education?: string;
    followersCount: number;
    connectionsCount: number | string;
    mutualCount?: number;
    userId?: string;
}

const AboutMemberModal: React.FC<AboutMemberModalProps> = ({
    isOpen,
    onClose,
    name,
    profileImage,
    headline,
    location,
    company,
    education,
    followersCount,
    connectionsCount,
    mutualCount = 0,
    userId,
}) => {
    const [copied, setCopied] = React.useState(false);

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

    const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/profile/${userId}` : '';

    const handleCopyLink = () => {
        if (profileUrl) {
            navigator.clipboard.writeText(profileUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const handleScrollToAbout = () => {
        onClose();
        const el = document.getElementById('about');
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl border border-[#e0d8cf] relative max-h-[90vh] overflow-y-auto"
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
                <div className="flex items-center gap-2 mb-6">
                    <ShieldCheck className="w-6 h-6 text-[#4a3728]" />
                    <h2 className="text-xl font-bold text-[#4a3728]">About this member</h2>
                </div>

                {/* Member Identity Card */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-[#f6ede8] to-white border border-[#e0d8cf]/70 mb-6">
                    <img
                        src={profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=4a3728&color=fff`}
                        alt={name}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md flex-shrink-0"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=4a3728&color=fff`;
                        }}
                    />
                    <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-bold text-[#4a3728] truncate">{name}</h3>
                        <p className="text-xs font-medium text-[#4a3728]/80 line-clamp-2">{headline || 'Throne8 Member'}</p>
                        {location && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-[#4a3728]/70">
                                <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-[#4a3728]" />
                                <span className="truncate">{location}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Network & Community Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6 text-center">
                    <div className="p-3 rounded-2xl bg-[#f6ede8]/60 border border-[#e0d8cf]/50">
                        <p className="text-lg font-black text-[#4a3728]">{followersCount}</p>
                        <p className="text-[11px] font-semibold text-[#4a3728]/70">Followers</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#f6ede8]/60 border border-[#e0d8cf]/50">
                        <p className="text-lg font-black text-[#4a3728]">{connectionsCount}</p>
                        <p className="text-[11px] font-semibold text-[#4a3728]/70">Connections</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#f6ede8]/60 border border-[#e0d8cf]/50">
                        <p className="text-lg font-black text-[#4a3728]">{mutualCount}</p>
                        <p className="text-[11px] font-semibold text-[#4a3728]/70">Mutuals</p>
                    </div>
                </div>

                {/* Information Rows */}
                <div className="space-y-4 mb-6">
                    {company && (
                        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                            <Briefcase className="w-5 h-5 text-[#4a3728] mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-xs font-semibold text-[#4a3728]/60 uppercase tracking-wider">Current Organization</p>
                                <p className="text-sm font-bold text-[#4a3728]">{company}</p>
                            </div>
                        </div>
                    )}

                    {education && (
                        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                            <GraduationCap className="w-5 h-5 text-[#4a3728] mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-xs font-semibold text-[#4a3728]/60 uppercase tracking-wider">Education</p>
                                <p className="text-sm font-bold text-[#4a3728]">{education}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                        <User className="w-5 h-5 text-[#4a3728] mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-xs font-semibold text-[#4a3728]/60 uppercase tracking-wider">Platform Status</p>
                            <p className="text-sm font-bold text-emerald-700 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Verified Member of Throne8
                            </p>
                        </div>
                    </div>

                    {profileUrl && (
                        <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                            <p className="text-xs font-semibold text-[#4a3728]/60 uppercase tracking-wider mb-2">Profile Link</p>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={profileUrl}
                                    className="flex-1 bg-white border border-[#e0d8cf] text-xs text-[#4a3728] rounded-xl px-3 py-2 outline-none font-mono truncate"
                                />
                                <button
                                    onClick={handleCopyLink}
                                    className="px-3 py-2 bg-[#4a3728] text-white text-xs font-semibold rounded-xl hover:bg-[#6b4e31] transition-all duration-200 flex items-center gap-1 flex-shrink-0"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                                            <span>Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <LinkIcon className="w-3.5 h-3.5" />
                                            <span>Copy</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={handleScrollToAbout}
                        className="flex-1 py-3 px-4 rounded-xl border-2 border-[#4a3728]/20 text-[#4a3728] font-bold text-sm hover:bg-[#f6ede8] transition-all duration-200"
                    >
                        View Full Bio
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-xl bg-[#4a3728] text-white font-bold text-sm hover:bg-[#6b4e31] transition-all duration-200 shadow-md"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AboutMemberModal;
