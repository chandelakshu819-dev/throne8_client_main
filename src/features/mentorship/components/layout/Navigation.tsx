"use client";

import React, { useEffect, useState } from "react";
import { Crown, Globe, User } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import SearchBar from "@/features/profile/components/home/SearchBar";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useProfileData } from "@/features/profile/hooks/useProfileData";
import { formatUserDisplayName, capitalizeName } from "@/shared/utils/format";
import { transformToProfileData } from "@/shared/utils/profileTransformers";
import AuthService from "@/lib/api/auth.service";

interface NavigationProps {
    activeTimezone?: string;
    currentUserId?: string;
    isMentor?: boolean;
    mentorUserId?: string;
}

const NAV_ITEMS = ['Home', 'Network', 'Jobs', 'Study Group', 'Messaging', 'Notifications', 'Mentorship'];

const ROUTE_PREFIX: Record<string, string> = {
    'Home': '/dashboard',
    'Network': '/profile/network',
    'Jobs': '/job',
    'Study Group': '/study',
    'Messaging': '/message',
    'Notifications': '/notifications',
    'Mentorship': '/mentorship',
};

export default function Navigation({
    activeTimezone = "IST (UTC+5:30)",
    currentUserId,
    isMentor = false,
    mentorUserId
}: NavigationProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuth();
    const { userProfileData, profileImageUrl, fetchUserProfile } = useProfileData();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [imgError, setImgError] = useState(false);

    const targetUserId = currentUserId || user?.userId || user?.id || (user as any)?._id;

    useEffect(() => {
        if (targetUserId) {
            fetchUserProfile(targetUserId);
        }
    }, [targetUserId, fetchUserProfile]);

    const profileData = transformToProfileData(userProfileData, profileImageUrl, null);
    const fullName = formatUserDisplayName(userProfileData, user);

    const handleNavigation = (item: string) => {
        switch (item) {
            case 'Home':
                router.push('/dashboard');
                break;
            case 'Network':
                router.push(`/profile/network/${targetUserId}`);
                break;
            case 'Jobs':
                router.push('/job/jobs');
                break;
            case 'Study Group':
                router.push('/study/groups');
                break;
            case 'Messaging':
                router.push(`/message/${targetUserId}`);
                break;
            case 'Notifications':
                router.push(`/notifications/${targetUserId}`);
                break;
            case 'Mentorship':
                router.push(`/mentorship/${targetUserId}`);
                break;
            default:
                break;
        }
    };

    const getShortLabel = (item: string) => {
        if (item === 'Study Group') return 'Study';
        if (item === 'Notifications') return 'Alerts';
        return item;
    };

    const getIconPath = (item: string): string => {
        const paths: Record<string, string> = {
            'Home': 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
            'Network': 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
            'Jobs': 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
            'Study Group': 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
            'Messaging': 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
            'Notifications': 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
            'Mentorship': 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
        };
        return paths[item] || paths['Home'];
    };

    const isActive = (item: string): boolean => {
        const prefix = ROUTE_PREFIX[item];
        return prefix ? pathname?.startsWith(prefix) : false;
    };

    return (
        <nav className="fixed top-0 left-0 w-full bg-[#F6EDE8] text-[#4a3728] border-b border-[#E5D9CE] shadow-sm z-50">
            <div className="w-full px-3 sm:px-6 lg:px-8">
                <div className="flex items-center h-16 gap-2 w-full justify-between">
                    
                    {/* Left: Throne8 Logo */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 whitespace-nowrap group">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#4a3728] shrink-0 transition-transform duration-200 group-hover:scale-105">
                                <Crown size={16} className="text-[#F6EDE8]" strokeWidth={2} />
                            </span>
                            <span className="text-xl font-bold text-[#4a3728] tracking-tight">Throne8</span>
                        </button>
                    </div>

                    {/* Middle: Navigation Items */}
                    <div className="hidden lg:flex items-center justify-center gap-1 flex-1 min-w-0 h-16">
                        {NAV_ITEMS.map((item) => {
                            const active = isActive(item);
                            return (
                                <button
                                    key={item}
                                    onClick={() => handleNavigation(item)}
                                    className={`relative flex flex-col items-center justify-center gap-0.5
                                               px-3 py-1.5 rounded-xl min-w-[60px]
                                               transition-colors duration-200
                                               ${active
                                                   ? 'bg-[#4a3728] text-[#F6EDE8]'
                                                   : 'text-[#4a3728]/70 hover:text-[#4a3728] hover:bg-[#EFE3D8]'
                                               }`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.1 : 1.8} d={getIconPath(item)} />
                                    </svg>
                                    <span className="text-[10px] font-medium leading-none whitespace-nowrap">
                                        {getShortLabel(item)}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Right: Search Bar + Timezone Badge + MY DASHBOARD Button + Profile */}
                    <div className="flex items-center gap-2.5 flex-shrink-0 ml-auto">
                        {/* Active Search Bar */}
                        <div className="hidden sm:flex items-center flex-shrink-0 w-36 xl:w-52 rounded-full bg-white border border-[#E5D9CE] focus-within:border-[#4a3728] transition-colors px-1">
                            <SearchBar currentUserId={targetUserId} />
                        </div>

                        {/* Timezone Badge */}
                        <div className="hidden xl:flex items-center gap-1.5 text-[10px] font-bold text-[#8b7355] bg-[#f8f6f4] px-3 py-1.5 rounded-full border border-[#ece7e2] shrink-0">
                            <Globe className="w-3.5 h-3.5" />
                            {activeTimezone}
                        </div>

                        {/* MY DASHBOARD Button */}
                        <button
                            onClick={() => {
                                if (isMentor && mentorUserId) {
                                    router.push(`/mentorship/mentorProfile/${mentorUserId}`);
                                } else {
                                    router.push('/dashboard');
                                }
                            }}
                            className="bg-[#4a3728] text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[1.5px] shadow-md hover:bg-[#8b7355] transition-all flex items-center gap-1.5 shrink-0"
                        >
                            MY DASHBOARD
                            <User className="w-3.5 h-3.5" />
                        </button>

                    </div>
                </div>
            </div>
        </nav>
    );
}