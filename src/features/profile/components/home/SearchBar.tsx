// src/profile/components/SearchBar.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, Loader2, Building2 } from 'lucide-react';
import AuthService from '@/lib/api/auth.service';
import AnalyticsService from '@/lib/api/analytics.service';
import CompanyService from '@/lib/api/company.service';
import ProfileService from '@/lib/api/profile.service';

interface UserSearchResult {
    userId: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    location: string;
    userType: string;
    profilePhotoId?: string;
}

interface SearchBarProps {
    currentUserId?: string;
}

interface EnrichedUser extends UserSearchResult {
    profileImageUrl?: string;
}

const SESSION_IDLE_MS = 1500;   // typing rukne ke kitni der baad "final" maana jaaye
const MIN_QUERY_LENGTH = 3;     // "h", "n" jaise 1-2 letter wale track nahi honge

interface CompanySearchResult {
    companyId: string;
    companyName: string;
    companySlug: string;
    industry: string;
    headquarters: {
        city: string;
        state: string;
        country: string;
    };
    media: {
        logo?: { url: string };
    };
}

const SearchBar: React.FC<SearchBarProps> = ({ currentUserId }) => {

    const [searchQuery, setSearchQuery] = useState('');
    const [allUsers, setAllUsers] = useState<EnrichedUser[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<EnrichedUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [allCompanies, setAllCompanies] = useState<CompanySearchResult[]>([]);
    const [filteredCompanies, setFilteredCompanies] = useState<CompanySearchResult[]>([]);

    const searchRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const trackedCompanyIdsRef = useRef<Set<string>>(new Set());
    const trackedQueryKeysRef = useRef<Set<string>>(new Set()); // 🔧 FIX #2: naya ref add kiya
    const latestStateRef = useRef<{
        query: string;
        users: EnrichedUser[];
        companies: CompanySearchResult[];
    }>({ query: '', users: [], companies: [] });
    const sessionIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
                finalizeSearchSession();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    useEffect(() => {
        fetchAllUsers();
        fetchAllCompanies();
    }, []);

    useEffect(() => {
        return () => {
            finalizeSearchSession();
            if (sessionIdleTimerRef.current) {
                clearTimeout(sessionIdleTimerRef.current);
            }
        };
    }, []);


    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredUsers([]);
            setFilteredCompanies([]);
            setShowResults(false);
            trackedCompanyIdsRef.current.clear();
            resetSearchSession();
            return;
        }

        const timeoutId = setTimeout(() => {

            const filtered = allUsers.filter(user => {
                const query = searchQuery.toLowerCase();
                return (
                    user.fullName.toLowerCase().includes(query) ||
                    user.firstName.toLowerCase().includes(query) ||
                    user.lastName.toLowerCase().includes(query) ||
                    user.email.toLowerCase().includes(query) ||
                    user.location.toLowerCase().includes(query)
                );
            });

            const filteredComps = allCompanies.filter(company => {
                const query = searchQuery.toLowerCase();
                return (
                    company.companyName.toLowerCase().includes(query) ||
                    company.industry.toLowerCase().includes(query) ||
                    company.headquarters?.city?.toLowerCase().includes(query)
                );
            });

            setFilteredUsers(filtered);
            setFilteredCompanies(filteredComps);
            setShowResults(true);

            latestStateRef.current = {
                query: searchQuery.toLowerCase().trim(),
                users: filtered,
                companies: filteredComps,
            };

            if (sessionIdleTimerRef.current) {
                clearTimeout(sessionIdleTimerRef.current);
            }
            sessionIdleTimerRef.current = setTimeout(() => {
                finalizeSearchSession();
            }, SESSION_IDLE_MS);

            // 🔧 FIX #1: Dono purane duplicate/buggy company-tracking blocks yahan se
            // HATA diye gaye hain. Ab company tracking SIRF finalizeSearchSession() ke
            // andar hoti hai — idle timer / click-outside / user-click pe, har keystroke pe nahi.

        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, allUsers, allCompanies]);


    const fetchAllUsers = async () => {
        try {
            setIsLoading(true);

            const response = await AuthService.getAllUsers({
                limit: 100,
            });

            const users = response.data.users.filter(
                (user: UserSearchResult) => user.userId !== currentUserId
            );

            console.log('✅ [SEARCH] Loaded users:', users);

            const profilePhotoIds = users
                .map((user: UserSearchResult) => user.profilePhotoId)
                .filter(Boolean);

            let profilePhotosMap: Record<string, string> = {};
            if (profilePhotoIds.length > 0) {
                try {
                    const photosResponse = await ProfileService.getMultipleProfilePhotosByIds(profilePhotoIds);
                    profilePhotosMap = photosResponse.data.photos.reduce((acc: Record<string, string>, photo: any) => {
                        acc[photo.photoId] = photo.cloudinarySecureUrl;
                        return acc;
                    }, {});

                } catch (error) {
                    console.warn('⚠️ Failed to fetch profile photos:', error);
                }
            }

            const enrichedUsers: EnrichedUser[] = users.map((user: any) => ({
                ...user,
                profileImageUrl: user.profilePhotoId
                    ? profilePhotosMap[user.profilePhotoId] || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdYRNQDghH1JvFXro2Yz3iWNmmFAubFZ-RGQ&s'
                    : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdYRNQDghH1JvFXro2Yz3iWNmmFAubFZ-RGQ&s'
            }));

            setAllUsers(enrichedUsers);

        } catch (error: any) {
            console.error('❌ [SEARCH] Failed to fetch users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAllCompanies = async () => {
        try {
            const response = await CompanyService.getAllCompanies({ pageSize: 100 });
            console.log('Fetched all companies:', response.data.response);
            setAllCompanies(response.data.response || []);
        } catch (error) {
            console.error('❌ [SEARCH] Failed to fetch companies:', error);
        }
    };


    const finalizeSearchSession = () => {
        const { query, users, companies } = latestStateRef.current;

        if (!query || query.length < MIN_QUERY_LENGTH) return;

        if (users.length > 0) {
            trackSearchAppearances(users, query);
        }

        if (companies.length > 0) {
            companies.forEach((company) => {
                const companyTrackKey = `company:${query}:${company.companyId}`;
                if (!trackedCompanyIdsRef.current.has(companyTrackKey)) {
                    trackedCompanyIdsRef.current.add(companyTrackKey);

                    CompanyService.trackCompanyEvent({
                        companyId: company.companyId,
                        eventType: 'search_appearance',
                        searchQuery: query,
                    }).catch(() => { });
                }
            });
        }

        if (sessionIdleTimerRef.current) {
            clearTimeout(sessionIdleTimerRef.current);
            sessionIdleTimerRef.current = null;
        }
    };

    const resetSearchSession = () => {
        if (sessionIdleTimerRef.current) {
            clearTimeout(sessionIdleTimerRef.current);
            sessionIdleTimerRef.current = null;
        }
        latestStateRef.current = { query: '', users: [], companies: [] };
    };

    const trackSearchAppearances = async (users: UserSearchResult[], query: string) => {
        const trackingKey = `search:${query}`;

        // 🔧 FIX #2: trackedCompanyIdsRef ki jagah ab trackedQueryKeysRef use ho raha hai
        if (trackedQueryKeysRef.current.has(trackingKey)) {
            return;
        }

        trackedQueryKeysRef.current.add(trackingKey);

        users.forEach((user, index) => {
            AnalyticsService.recordSearchAppearance(
                user.userId,
                query.toLowerCase().trim(),
                false,
                index + 1
            ).catch(err => {
                console.warn('⚠️ [TRACKING] Failed to track appearance:', err);
            });
        });
    };


    const handleUserClick = async (userId: string, fullName: string, position: number) => {
        finalizeSearchSession();

        try {
            await AnalyticsService.recordSearchAppearance(
                userId,
                searchQuery.toLowerCase().trim(),
                true,
                position
            );

        } catch (error) {
            console.warn('⚠️ [TRACKING] Failed to track click:', error);
        }

        setShowResults(false);
        setSearchQuery('');
        trackedCompanyIdsRef.current.clear();
        resetSearchSession();

        router.push(`/profile/${userId}`);
    };


    const handleCompanyClick = async (companyId: string) => {
        finalizeSearchSession();

        setShowResults(false);
        setSearchQuery('');
        resetSearchSession();

        router.push(`/user-company/${companyId}`);
    };

    return (
        <div ref={searchRef} className="relative w-full max-w-md">
            <div className="flex items-center bg-[#f6ede8] rounded-full px-4 py-2 shadow-sm border border-[#e0d8cf]">
                <Search className="w-5 h-5 text-[#7a5c3e]" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery && setShowResults(true)}
                    placeholder="Search users..."
                    className="bg-transparent text-sm text-[#4a3728] placeholder-[#7a5c3e] focus:outline-none ml-2 w-full"
                />
                {isLoading && (
                    <Loader2 className="w-4 h-4 text-[#7a5c3e] animate-spin ml-2" />
                )}
            </div>

            {/* Search Results Dropdown */}
            {showResults && (filteredUsers.length > 0 || filteredCompanies.length > 0) && (
                <div className="absolute top-full mt-2 w-full bg-[#f6ede8] rounded-lg shadow-lg border border-[#e0d8cf] max-h-96 overflow-y-auto z-50">
                    <div className="p-2">
                        <p className="text-xs text-[#7a5c3e] px-3 py-2 font-medium">
                            Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
                        </p>
                        {filteredUsers.map((user, index) => (
                            <button
                                key={user.userId}
                                onClick={() => handleUserClick(user.userId, user.fullName, index + 1)}
                                className="w-full flex items-center gap-3 px-3 py-3 hover:bg-[#e0d8cf] rounded-lg transition-colors duration-200 text-left"
                            >
                                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#e0d8cf] flex-shrink-0">
                                    <img
                                        src={user.profileImageUrl || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdYRNQDghH1JvFXro2Yz3iWNmmFAubFZ-RGQ&s'}
                                        alt={user.fullName}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.src = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdYRNQDghH1JvFXro2Yz3iWNmmFAubFZ-RGQ&s';
                                        }}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[#4a3728] truncate">
                                        {user.fullName}
                                    </p>
                                    <p className="text-xs text-[#7a5c3e] truncate">
                                        {user.location} • {user.userType}
                                    </p>
                                </div>
                                <User className="w-4 h-4 text-[#7a5c3e] flex-shrink-0" />
                            </button>
                        ))}
                        {filteredCompanies.length > 0 && (
                            <>
                                <p className="text-xs text-[#7a5c3e] px-3 py-2 font-medium border-t border-[#e0d8cf] mt-1">
                                    Companies ({filteredCompanies.length})
                                </p>
                                {filteredCompanies.map((company) => (
                                    <button
                                        key={company.companyId}
                                        onClick={() => handleCompanyClick(company.companyId)}
                                        className="w-full flex items-center gap-3 px-3 py-3 hover:bg-[#e0d8cf] rounded-lg transition-colors duration-200 text-left"
                                    >
                                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#e0d8cf] flex-shrink-0 bg-white">
                                            <img
                                                src={company.media?.logo?.url || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdYRNQDghH1JvFXro2Yz3iWNmmFAubFZ-RGQ&s'}
                                                alt={company.companyName}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.src = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdYRNQDghH1JvFXro2Yz3iWNmmFAubFZ-RGQ&s';
                                                }}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-[#4a3728] truncate">
                                                {company.companyName}
                                            </p>
                                            <p className="text-xs text-[#7a5c3e] truncate">
                                                {company.headquarters?.city}, {company.headquarters?.state} • {company.industry}
                                            </p>
                                        </div>
                                        <Building2 className="w-4 h-4 text-[#7a5c3e] flex-shrink-0" />
                                    </button>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* No Results */}
            {showResults && searchQuery && !isLoading && filteredUsers.length === 0 && filteredCompanies.length === 0 && (
                <div className="absolute top-full mt-2 w-full bg-[#f6ede8] rounded-lg shadow-lg border border-[#e0d8cf] p-4 z-50">
                    <p className="text-sm text-[#7a5c3e] text-center">
                        No users found for "{searchQuery}"
                    </p>
                </div>
            )}
        </div>
    );
};

export default SearchBar;