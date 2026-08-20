// src/profile/components/ProfileNavbar.tsx
'use client';
import React, { useState } from 'react';
import { Crown, Search as SearchIcon } from 'lucide-react';
import AuthService from '@/lib/api/auth.service';
import SearchBar from './SearchBar';
import ProfileSidePanel from './ProfileSidePanel';
import { useRouter, usePathname } from 'next/navigation';
import { MessageNotificationBadge } from './MessageNotificationBadge';
import { NetworkNotificationBadge } from '@/features/networks/components/notifications/NetworkNotificationBadge';

interface ProfileNavbarProps {
    profileImage: string;
    userName: string;
    currentUserId?: string;
    companyId?: string;
    onOpenLeftPanel?: () => void;
}

// Nav items config — sab items ab consistent icon+label pattern follow karte hain
const NAV_ITEMS = ['Home', 'Network', 'Jobs', 'Study Group', 'Messaging', 'Notifications', 'Mentorship'];

// Route prefixes — active state detect karne ke liye (currentUserId ke saath bhi match ho jaye)
const ROUTE_PREFIX: Record<string, string> = {
    'Home': '/dashboard',
    'Network': '/profile/network',
    'Study Group': '/study',
    'Messaging': '/message',
    'Notifications': '/notifications',
    'Mentorship': '/mentorship',
};

const ProfileNavbar: React.FC<ProfileNavbarProps> = ({ profileImage, userName, currentUserId, companyId, onOpenLeftPanel }) => {
    const router = useRouter();
    const pathname = usePathname();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false);

    const handleMenuClick = async (item: string) => {
        switch (item) {
            case 'View Profile':
                if (onOpenLeftPanel && window.innerWidth < 1024) {
                    onOpenLeftPanel();
                    setIsProfilePanelOpen(false);
                    setIsDropdownOpen(false);
                } else {
                    router.push(`/profile`);
                    setIsDropdownOpen(false);
                }
                break;
            case 'Update Profile':
                setIsDropdownOpen(false);
                break;
            case 'Create Company Page':
                router.push(`/create-company/${currentUserId}`);
                setIsDropdownOpen(false);
                break;
            case 'Company Page':
                router.push(`/company/${currentUserId}`);
                setIsDropdownOpen(false);
                break;
            case 'Settings':
                setIsDropdownOpen(false);
                break;
            case 'Sign Out':
                setIsLoggingOut(true);
                await AuthService.logout();
                break;
            default:
                break;
        }
    };

    const handleHomePage = () => {
        router.push('/dashboard');
    };

    const handleNavigation = (item: string) => {
        switch (item) {
            case 'Home':
                handleHomePage();
                break;
            case 'Network':
                router.push(`/profile/network/${currentUserId}`);
                break;
            case 'Jobs':
                router.push('/#');
                break;
            case 'Study Group':
                router.push('/study/groups');
                break;
            case 'Messaging':
                router.push(`/message/${currentUserId}`);
                break;
            case 'Notifications':
                router.push(`/notifications/${currentUserId}`);
                break;
            case 'Mentorship':
                router.push(`/mentorship/${currentUserId}`);
                break;
            default:
                break;
        }
        setIsMobileMenuOpen(false);
    };

    const getIconPath = (item: string): string => {
        const paths: Record<string, string> = {
            'Home': 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
            'Network': 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
            'Jobs': 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
            'Study Group': 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
            'Messaging': 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
            'Notifications': 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
            'Mentorship': 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
        };
        return paths[item] || '';
    };

    // Netflix jaisi short label — "Study Group" wraps awkwardly, "Notifications" bhi lambi hai
    const getShortLabel = (item: string): string => {
        const short: Record<string, string> = {
            'Study Group': 'Study',
            'Notifications': 'Alerts',
        };
        return short[item] || item;
    };

    const isActive = (item: string): boolean => {
        const prefix = ROUTE_PREFIX[item];
        return prefix ? pathname?.startsWith(prefix) : false;
    };

    return (
        <>
            <nav className="fixed top-0 left-0 w-full bg-[#F6EDE8] text-[#4a3728] border-b border-[#E5D9CE] shadow-sm z-50">
                <div className="w-full px-3 sm:px-6 lg:px-8">
                    <div className="flex items-center h-16 gap-2 w-full">

                        {/* Left Section: Mobile Menu Button + Logo */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="lg:hidden">
                                <button
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                    className="text-[#4a3728] hover:bg-[#EFE3D8] rounded-lg p-2 transition-colors duration-200"
                                >
                                    <svg className={`w-6 h-6 transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16m-7 6h7'} />
                                    </svg>
                                </button>
                            </div>
                            <div className="flex-shrink-0">
                                <button onClick={handleHomePage} className="flex items-center gap-2 whitespace-nowrap group">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#4a3728] shrink-0 transition-transform duration-200 group-hover:scale-105">
                                        <Crown size={16} className="text-[#F6EDE8]" strokeWidth={2} />
                                    </span>
                                    <span className="text-xl font-bold text-[#4a3728] tracking-tight">Throne8</span>
                                </button>
                            </div>
                        </div>

                        {/* Middle Section: Desktop Navigation — consistent icon-over-label, pill active/hover state */}
                        <div className="hidden lg:flex items-center justify-center gap-1 flex-1 min-w-0 h-16">
                            {NAV_ITEMS.map((item) => {
                                const active = isActive(item);
                                return (
                                    <button
                                        key={item}
                                        onClick={() => handleNavigation(item)}
                                        className={`relative flex flex-col items-center justify-center gap-0.5
                                                   px-3.5 py-2 rounded-xl min-w-[64px]
                                                   transition-colors duration-200
                                                   ${active
                                                       ? 'bg-[#4a3728] text-[#F6EDE8]'
                                                       : 'text-[#4a3728]/70 hover:text-[#4a3728] hover:bg-[#EFE3D8]'
                                                   }`}
                                    >
                                        <span className="relative">
                                            <svg className="w-[21px] h-[21px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.1 : 1.8} d={getIconPath(item)} />
                                            </svg>
                                            {item === 'Network' && (
                                                <span className="absolute -top-1 -right-1.5"><NetworkNotificationBadge /></span>
                                            )}
                                            {item === 'Messaging' && (
                                                <span className="absolute -top-1 -right-1.5"><MessageNotificationBadge /></span>
                                            )}
                                        </span>
                                        <span className="text-[11px] font-medium leading-none whitespace-nowrap">
                                            {getShortLabel(item)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Right Section: Search Bar + Profile Icon */}
                        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                            <div className="hidden sm:flex items-center flex-shrink-0 w-40 xl:w-64 rounded-full bg-white border border-[#E5D9CE] focus-within:border-[#4a3728] transition-colors px-1">
                                <SearchBar currentUserId={currentUserId} />
                            </div>

                            <button
                                onClick={() => setIsSearchOpen(!isSearchOpen)}
                                className="sm:hidden text-[#4a3728] hover:bg-[#EFE3D8] rounded-lg p-2 transition-colors duration-200"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>

                            <div className="h-8 w-px bg-[#E5D9CE] mx-1 hidden md:block" />

                            <div className="relative">
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center gap-2 hover:bg-[#EFE3D8] rounded-full pl-1 pr-2 py-1 transition-colors duration-200"
                                >
                                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                                        <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                    </div>
                                    <span className="text-sm font-medium hidden md:inline text-[#4a3728] whitespace-nowrap">{userName}</span>
                                    <svg
                                        className={`w-4 h-4 text-[#4a3728]/60 transition-transform duration-200 flex-shrink-0 hidden md:block ${isDropdownOpen ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg py-1.5 border border-[#E5D9CE] z-50 overflow-hidden">
                                        {['View Profile', 'Update Profile', 'Company Page', 'Create Company Page', 'Settings', 'Sign Out']
                                            .map((item, idx) => (
                                                <button
                                                    key={`${item}-${idx}`}
                                                    onClick={() => handleMenuClick(item)}
                                                    disabled={item === 'Sign Out' && isLoggingOut}
                                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
                                                        item === 'Sign Out'
                                                            ? 'text-[#B4442E] hover:bg-[#FBEAE6]'
                                                            : 'text-[#4a3728] hover:bg-[#F6EDE8]'
                                                    }`}
                                                >
                                                    {item === 'Sign Out' && isLoggingOut ? 'Signing out...' : item}
                                                </button>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Mobile Search Section */}
                    {isSearchOpen && (
                        <div className="sm:hidden border-t border-[#E5D9CE] bg-[#F6EDE8] -mx-3 px-3 py-4">
                            <SearchBar currentUserId={currentUserId} />
                        </div>
                    )}

                    {/* Mobile Navigation Menu */}
                    {isMobileMenuOpen && (
                        <div className="lg:hidden border-t border-[#E5D9CE] bg-[#F6EDE8] -mx-3 sm:-mx-6">
                            <div className="px-3 sm:px-6 py-4 space-y-1">
                                {NAV_ITEMS.map((item) => (
                                    <button
                                        key={item}
                                        onClick={() => handleNavigation(item)}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#4a3728] hover:bg-[#EFE3D8] rounded-xl transition-colors duration-200"
                                    >
                                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d={getIconPath(item)} />
                                        </svg>
                                        <span>{item}</span>
                                        {item === 'Network' && <div className="ml-auto"><NetworkNotificationBadge /></div>}
                                        {item === 'Messaging' && <div className="ml-auto"><MessageNotificationBadge /></div>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            <ProfileSidePanel
                isOpen={isProfilePanelOpen}
                onClose={() => setIsProfilePanelOpen(false)}
                profileImage={profileImage}
                userName={userName}
                currentUserId={currentUserId}
                onOpenLeftPanel={onOpenLeftPanel}
            />
        </>
    );
};

export default ProfileNavbar;