// src/features/profile/components/home/ProfileHeader.tsx
// 'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import EditIntroModal from './EditIntroModal';
import ProfileImageModal from './ProfileImageModal';
import Contactact from './Contactact';
import AboutMemberModal from './modals/AboutMemberModal';
import ShareProfileModal from './modals/ShareProfileModal';
import ReportMemberModal from './modals/ReportMemberModal';
import BlockMemberModal from './modals/BlockMemberModal';
import { useConnectionsData } from '@/features/profile/hooks/useConnectionsData';
import { useAuth } from '@/features/auth/hooks/useAuth';
import ConnectionService from '@/lib/api/connection.service';

interface ProfileHeaderProps {
    currentUserId?: string;
    isOwnProfile?: boolean;
    profileImage: string;
    name: string;
    // ✅ pronouns poori tarah hataya — backend mein field exist nahi karti
    headline: string;
    company: string;
    description: string;
    location: string;
    followers: number;
    connections: string;
    firstName?: string;
    lastName?: string;
    currentPosition?: string;
    education?: string;
    contactInfo?: string;
    onDataRefresh?: () => void;
    onProfileImageUpdate?: (newUrl: string) => void;
    headlineId?: string;
    onHeadlineCreated?: () => void;
    educationData?: {
        collegeName: string;
        degree: string;
        fieldOfStudy: string;
        graduationYear: string;
    };
    educationList?: any[];
    experienceList?: any[];
    isFollowing?: boolean;
    isConnected?: boolean;
    connectionPending?: boolean;
    onFollow?: () => void;
    onConnect?: () => void;
    onMessage?: () => void;
    incomingRequestId?: string | null;
    onAcceptRequest?: () => void;
    onDeclineRequest?: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
    currentUserId,
    isOwnProfile = true,
    profileImage,
    name,
    headline,
    company,
    description,
    location,
    followers,
    connections,
    firstName = '',
    lastName = '',
    currentPosition = '',
    education = '',
    contactInfo = '',
    headlineId = '',
    educationData,
    educationList = [],
    experienceList = [],
    onHeadlineCreated,
    onDataRefresh,
    onProfileImageUpdate,
    isFollowing = false,
    isConnected = false,
    connectionPending = false,
    onFollow,
    onConnect,
    onMessage,
    incomingRequestId = null,
    onAcceptRequest,
    onDeclineRequest,
}) => {
    const router = useRouter();
    const { user: loggedInUser } = useAuth();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isProfileImageModalOpen, setIsProfileImageModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const [isAboutMemberOpen, setIsAboutMemberOpen] = useState(false);
    const [isShareProfileOpen, setIsShareProfileOpen] = useState(false);
    const [isReportMemberOpen, setIsReportMemberOpen] = useState(false);
    const [isBlockMemberOpen, setIsBlockMemberOpen] = useState(false);
    const [currentProfileImage, setCurrentProfileImage] = useState(
        profileImage && profileImage.trim() !== ''
            ? profileImage
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=4a3728&color=fff&size=256`
    );

    // ✅ NEW — Mutual connections count (LinkedIn-style "X mutual connections" badge)
    const [mutualCount, setMutualCount] = useState<number>(0);
    const [isLoadingMutuals, setIsLoadingMutuals] = useState(false);

    useEffect(() => {
        if (profileImage && profileImage.trim() !== '') {
            setCurrentProfileImage(profileImage);
        }
    }, [profileImage]);

    const {
        followingList,
        followersList,
        totalConnections,
        isLoadingConnections,
        fetchConnectionsData,
    } = useConnectionsData();

    useEffect(() => {
        if (currentUserId) {
            fetchConnectionsData(currentUserId);
        }
    }, [currentUserId, fetchConnectionsData]);

    // ✅ NEW — fetch mutual connections count between logged-in user and the
    // profile being viewed. Sirf tab chalta hai jab yeh apni profile na ho
    // (khud ke sath mutual dikhana faltu hai) aur dono IDs available hon.
    useEffect(() => {
        const loggedInUserId = loggedInUser?.userId;

        if (isOwnProfile || !currentUserId || !loggedInUserId || currentUserId === loggedInUserId) {
            setMutualCount(0);
            return;
        }

        let cancelled = false;
        setIsLoadingMutuals(true);

        ConnectionService.getBulkMutualConnections(loggedInUserId, [currentUserId], 3)
            .then((res: any) => {
                if (cancelled) return;
                const resultsMap = res?.data?.data || {};
                const key = `${loggedInUserId}-${currentUserId}`;
                const count = resultsMap[key]?.count || 0;
                setMutualCount(count);
            })
            .catch(() => {
                if (!cancelled) setMutualCount(0);
            })
            .finally(() => {
                if (!cancelled) setIsLoadingMutuals(false);
            });

        return () => {
            cancelled = true;
        };
    }, [isOwnProfile, currentUserId, loggedInUser?.userId]);

    const handleProfileUpdate = async () => {
        if (onDataRefresh) {
            await onDataRefresh();
        }
        if (onHeadlineCreated) {
            await onHeadlineCreated();
        }
    };

    // ✅ FIX: onDataRefresh() call REMOVED from here.
    // Root cause of the "photo reverts after upload" bug: onProfileImageUpdate()
    // already pushes the freshly-uploaded URL into Redux (setProfileImageUrl),
    // so the UI was already correct at this point. But immediately after that,
    // onDataRefresh() (= loadProfile()) used to fire too, which re-fetches the
    // ENTIRE user profile from the backend, reads profilePhotoId from that
    // response, and re-fetches the photo URL for that ID. If the backend's
    // profilePhotoId hadn't fully propagated yet (or the fetch simply raced
    // the just-set state), this second call would overwrite the correct new
    // photo with a stale/previous one a split second later. Since the new URL
    // is already set directly above, we don't need a full profile refetch here.
    const handleProfileImageUpdate = (newImageUrl: string) => {
        setCurrentProfileImage(newImageUrl);
        if (onProfileImageUpdate) {
            onProfileImageUpdate(newImageUrl);
        }
    };

    return (
        <>
            {/* ✅ FIX: min-w-0 added so this flex row can shrink properly instead of
                forcing the page wider than the viewport when a child has long text. */}
            {/* ✅ FIX (density pass): px-6 pb-6 -> px-5 pb-5, gap-6 -> gap-4,
                -mt-12 -> -mt-10, to shrink overall header footprint */}
            <div className="relative z-20 px-5 pb-5 min-w-0">
                <div className="flex flex-col lg:flex-row items-start gap-5 -mt-10 min-w-0">
                    {/* ✅ FIX (density pass v2): w-28 h-28 -> w-32 h-32 for better proportion */}
                    <div
                        className={`profileImageClick relative w-32 h-32 group flex-shrink-0 ${isOwnProfile ? 'cursor-pointer' : ''}`}
                        onClick={() => {
                            if (isOwnProfile) setIsProfileImageModalOpen(true);
                        }}
                    >
                        <img
                            src={currentProfileImage}
                            alt="Profile"
                            className="w-full h-full rounded-2xl border-4 border-white shadow-xl object-cover transition-all duration-500 group-hover:shadow-2xl group-hover:scale-105"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=4a3728&color=fff&size=256`;
                            }}
                        />
                        {isOwnProfile && (
                            <div className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-blue-500/20 to-purple-600/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                        )}
                    </div>
                    {/* ✅ FIX: added w-full + min-w-0 so this flex item shrinks to fit
                        its row instead of expanding to its content's natural width
                        (which is what was pushing the page past the viewport and
                        causing the horizontal scrollbar on profiles with long text). */}
                    {/* ✅ FIX (density pass): p-6 -> p-4, rounded-3xl -> rounded-2xl */}
                    <div className="border border-[#e0d8cf] rounded-2xl p-5 shadow-xl bg-white/60 backdrop-blur-sm w-full min-w-0">
                        <div className="flex-1 text-center md:text-left pt-1 min-w-0">
                            {isOwnProfile && (
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-white text-[#4a3728] border border-[#e0d8cf] shadow-md hover:bg-[#f6ede8] hover:shadow-lg hover:scale-105 transition-all duration-300"
                                    aria-label="Edit profile intro"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                            )}
                            {/* ✅ FIX (density pass): space-y-3 -> space-y-2 */}
                            <div className="space-y-3 min-w-0">
                                <div className="relative min-w-0">
                                    {/* ✅ FIX: break-words so a long name/word can't force
                                        the row wider than the container */}
                                    {/* ✅ FIX (density pass v2): text-2xl kept, mt-5 -> mt-6 for a touch more top breathing room */}
                                    <h1 className="text-2xl font-bold text-[#4a3728] flex items-center gap-2 justify-center md:justify-start mt-6 hover:text-[#5a4738] transition-colors duration-300 break-words">
                                        {name}
                                    </h1>
                                </div>
                                <div className="relative min-w-0">
                                    {/* ✅ FIX: removed fixed w-[80%], added w-full + break-words */}
                                    {/* ✅ FIX (density pass): text-md -> text-sm */}
                                    <h2 className="text-sm w-full font-semibold text-[#4a3728] bg-gradient-to-r from-[#4a3728] to-[#6a5748] bg-clip-text text-transparent break-words">
                                        {headline}
                                    </h2>
                                </div>
                                {/* ✅ FIX: Company aur Education ab alag-alag distinct rows mein
                                    hain, apne apne icon ke saath — pehle dono ek hi line mein
                                    '•' se joined the jo confusing lagta tha */}
                                <div className="flex flex-col gap-1.5 w-full">
                                    {((experienceList && experienceList.length > 0) || company) && (
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <svg className="w-3.5 h-3.5 text-[#4a3728]/70 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m-4 6h16a1 1 0 011 1v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a1 1 0 011-1z" />
                                            </svg>
                                            <p className="text-xs text-[#4a3728] font-bold break-words min-w-0">
                                                {experienceList && experienceList.length > 0
                                                    ? (experienceList.find(exp => exp.current)?.company || experienceList[0]?.company)
                                                    : company}
                                            </p>
                                        </div>
                                    )}

                                    {(((educationList && educationList.length > 0) && educationList[0]?.schoolCollegeName) || educationData?.collegeName) && (
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <svg className="w-3.5 h-3.5 text-[#4a3728]/70 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422A12.083 12.083 0 0121 15.5v0M12 14v7m-9-9.5v0a12.083 12.083 0 002.84 5.922L12 21l6.16-3.578" />
                                            </svg>
                                            <p className="text-xs text-[#4a3728] font-bold break-words min-w-0">
                                                {educationList && educationList.length > 0
                                                    ? educationList[0].schoolCollegeName
                                                    : educationData?.collegeName}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                {/* ✅ FIX (density pass): px-3 py-2 -> px-2.5 py-1.5 */}
                                <div className="flex items-center gap-2 justify-center md:justify-start bg-white/50 rounded-full px-2.5 py-1.5 backdrop-blur-sm border border-[#e0d8cf]/50 min-w-0">
                                    <svg className="w-4 h-4 text-[#4a3728] animate-pulse flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {/* ✅ FIX: break-words so a long location string can't
                                        overflow the pill / push the row wider */}
                                    <p className="text-xs text-[#4a3728] break-words min-w-0">
                                        <span className="font-semibold">Location:</span> {location}
                                    </p>
                                </div>

                                {isOwnProfile && <Contactact />}

                                {/* ✅ FIX (density pass): gap-3 -> gap-2 */}
                                <div className="flex gap-2 justify-center md:justify-start flex-wrap">
                                    {/* ✅ FIX (density pass): px-4 py-2 -> px-3 py-1.5 */}
                                    <button
                                        onClick={() => router.push(`/network/connections?userId=${currentUserId}&tab=followers`)}
                                        className="connectionsShowButton group px-3 py-1.5 bg-white text-[#4a3728] rounded-full text-xs shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-1.5 border border-[#e0d8cf] hover:scale-105 hover:bg-gradient-to-r hover:from-[#f6ede8] hover:to-white">
                                        <svg className="w-4 h-4 text-[#4a3728] group-hover:animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />

                                        </svg>
                                        {/* <span className="font-semibold">
                                            {isLoadingConnections ? '' : followersList.length}
                                        </span> followers */}

                                  <span className="font-semibold">
                                      {followers}
                                  </span> followers

                                    </button>



                                    

                                    <button
                                        className="connectionsShowButton group px-3 py-1.5 bg-white text-[#4a3728] rounded-full text-xs shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-1.5 border border-[#e0d8cf] hover:scale-105 hover:bg-gradient-to-r hover:from-[#f6ede8] hover:to-white"
                                        onClick={() => router.push(`/network/connections?userId=${currentUserId}&tab=connections`)}>
                                        <svg className="w-4 h-4 text-[#4a3728] group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        <span className="font-semibold">
                                            {isLoadingConnections ? '' : totalConnections}
                                        </span> connections
                                    </button>

                                    {/* ✅ NEW — "X mutual connections" badge, LinkedIn-style.
                                        Sirf dikhta hai jab: apni profile na ho, loading khatam ho
                                        chuki ho, aur count 0 se zyada ho — 0 dikhana faltu/noisy hai */}
                                    {!isOwnProfile && !isLoadingMutuals && mutualCount > 0 && (
                                        <button
                                            className="connectionsShowButton group px-3 py-1.5 bg-white text-[#4a3728] rounded-full text-xs shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-1.5 border border-[#e0d8cf] hover:scale-105 hover:bg-gradient-to-r hover:from-[#f6ede8] hover:to-white"
                                            onClick={() => router.push(`/network/connections?userId=${currentUserId}&tab=connections`)}
                                        >
                                            <svg className="w-4 h-4 text-[#4a3728] group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                            <span className="font-semibold">{mutualCount}</span> mutual connection{mutualCount > 1 ? 's' : ''}
                                        </button>
                                    )}
                                </div>

                                {!isOwnProfile && (
                                    // ✅ FIX (density pass): gap-3 mt-4 -> gap-2 mt-3
                                    <div className="flex gap-2 justify-center md:justify-start flex-wrap mt-3">


{isConnected ? (
    // ✅ FIX (density pass): px-5 py-2.5 -> px-4 py-2
    <button
        onClick={onMessage}
        className="px-4 py-2 bg-[#4a3728] text-white rounded-full text-xs font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
    >
        Message
    </button>
) : incomingRequestId ? (
    <>
<button
    onClick={async () => {
        await onAcceptRequest?.();
        if (currentUserId) {
            await fetchConnectionsData(currentUserId);
        }
    }}
    className="px-4 py-2 bg-[#4a3728] text-white rounded-full text-xs font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
>
    Accept
</button>
        <button
            onClick={onDeclineRequest}
            className="px-4 py-2 bg-white text-[#4a3728] border border-[#e0d8cf] rounded-full text-xs font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
            Decline
        </button>
    </>
) : (
    <button
        onClick={onConnect}
        disabled={connectionPending}
        className={`px-4 py-2 rounded-full text-xs font-semibold shadow-lg transition-all duration-300 flex items-center gap-1.5 ${
            connectionPending
                ? 'bg-[#e0d8cf] text-[#4a3728] cursor-not-allowed border border-[#4a3728]/30 font-bold'
                : 'bg-[#4a3728] text-white hover:shadow-xl hover:scale-105'
        }`}
    >
        {connectionPending ? (
            <>
                <svg className="w-3.5 h-3.5 text-[#4a3728]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Pending...</span>
            </>
        ) : (
            <>
                <span>+</span> Connect
            </>
        )}
    </button>
)}

                                        <div className="relative">
                                            <button
                                                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                                                className="px-4 py-2 bg-white text-[#4a3728] border border-[#e0d8cf] rounded-full text-xs font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                                            >
                                                More
                                            </button>
                                            {isMoreMenuOpen && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-40"
                                                        onClick={() => setIsMoreMenuOpen(false)}
                                                    ></div>
                                                   <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-[#e0d8cf] py-2 z-50">
    <button
    onClick={async () => {
        setIsMoreMenuOpen(false);
        await onFollow?.();
        if (currentUserId) {
            await fetchConnectionsData(currentUserId);
        }
    }}
    className="w-full text-left px-4 py-2.5 text-sm text-[#4a3728] hover:bg-[#f6ede8] transition-colors duration-200"
>
    {isFollowing ? 'Unfollow' : 'Follow'}
</button>



    <button
        onClick={() => {
            setIsMoreMenuOpen(false);
            setIsAboutMemberOpen(true);
        }}
        className="w-full text-left px-4 py-2.5 text-sm text-[#4a3728] hover:bg-[#f6ede8] transition-colors duration-200"
    >
        About this member
    </button>

    <button
        onClick={() => {
            setIsMoreMenuOpen(false);
            setIsShareProfileOpen(true);
        }}
        className="w-full text-left px-4 py-2.5 text-sm text-[#4a3728] hover:bg-[#f6ede8] transition-colors duration-200"
    >
        Share Profile
    </button>

    <button
        onClick={() => {
            setIsMoreMenuOpen(false);
            setIsReportMemberOpen(true);
        }}
        className="w-full text-left px-4 py-2.5 text-sm text-[#4a3728] hover:bg-[#f6ede8] transition-colors duration-200"
    >
        Report
    </button>

    <button
        onClick={() => {
            setIsMoreMenuOpen(false);
            setIsBlockMemberOpen(true);
        }}
        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
    >
        Block
    </button>
</div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isOwnProfile && (
                <>
                    <EditIntroModal
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        initialData={{
                            firstName: firstName || name?.split(' ')[0] || '',
                            lastName: lastName || name?.split(' ').slice(1).join(' ') || '',
                            headline: headline,
                            company,
                            location,
                            currentPosition,
                            education,
                            contactInfo,
                            headlineId,
                        }}
                        onSubmit={handleProfileUpdate}
                        onHeadlineCreated={onHeadlineCreated}
                    />

                    <ProfileImageModal
                        isOpen={isProfileImageModalOpen}
                        onClose={() => setIsProfileImageModalOpen(false)}
                        onUploadSuccess={handleProfileImageUpdate}
                        currentImageUrl={currentProfileImage}
                    />
                </>
            )}

            {/* Additional Modals for Profile Actions */}
            <AboutMemberModal
                isOpen={isAboutMemberOpen}
                onClose={() => setIsAboutMemberOpen(false)}
                name={name}
                profileImage={currentProfileImage}
                headline={headline}
                location={location}
                company={company}
                education={education}
                followersCount={followers}
                connectionsCount={connections}
                mutualCount={mutualCount}
                userId={currentUserId}
            />

            <ShareProfileModal
                isOpen={isShareProfileOpen}
                onClose={() => setIsShareProfileOpen(false)}
                name={name}
                profileImage={currentProfileImage}
                headline={headline}
                userId={currentUserId}
            />

            <ReportMemberModal
                isOpen={isReportMemberOpen}
                onClose={() => setIsReportMemberOpen(false)}
                name={name}
                userId={currentUserId || ''}
            />

            <BlockMemberModal
                isOpen={isBlockMemberOpen}
                onClose={() => setIsBlockMemberOpen(false)}
                name={name}
                userId={currentUserId || ''}
            />
        </>
    );
};

export default ProfileHeader;