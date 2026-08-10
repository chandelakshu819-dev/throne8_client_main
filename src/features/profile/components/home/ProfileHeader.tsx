// src/features/profile/components/home/ProfileHeader.tsx
// 'use client';
import React, { useEffect, useState } from 'react';
import EditIntroModal from './EditIntroModal';
import ProfileImageModal from './ProfileImageModal';
import ConnectionsModal from './ConnectionsModal';
import Contactact from './Contactact';
import { useConnectionsData } from '@/features/profile/hooks/useConnectionsData';

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
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isProfileImageModalOpen, setIsProfileImageModalOpen] = useState(false);
    const [isConnectionsModalOpen, setIsConnectionsModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const [currentProfileImage, setCurrentProfileImage] = useState(
        profileImage && profileImage.trim() !== ''
            ? profileImage
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=4a3728&color=fff&size=256`
    );
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
    }, [currentUserId, isConnectionsModalOpen, fetchConnectionsData]);

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
            <div className="relative z-20 px-6 pb-6 min-w-0">
                <div className="flex flex-col lg:flex-row items-start gap-6 -mt-12 min-w-0">
                    <div
                        className={`profileImageClick relative w-36 h-36 group flex-shrink-0 ${isOwnProfile ? 'cursor-pointer' : ''}`}
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
                    <div className="border border-[#e0d8cf] rounded-3xl p-6 shadow-xl bg-white/60 backdrop-blur-sm w-full min-w-0">
                        <div className="flex-1 text-center md:text-left pt-2 min-w-0">
                            {isOwnProfile && (
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="bannerEdit absolute top-4 right-4 rounded-2x border-2 border-black text-white/80 text-xl font-medium bg-black px-2 py-2 rounded-full backdrop-blur-sm hover:bg-black/30 transition-all duration-300">
                                    ✏
                                </button>
                            )}
                            <div className="space-y-3 min-w-0">
                                <div className="relative min-w-0">
                                    {/* ✅ FIX: break-words so a long name/word can't force
                                        the row wider than the container */}
                                    <h1 className="text-3xl font-bold text-[#4a3728] flex items-center gap-2 justify-center md:justify-start mt-8 hover:text-[#5a4738] transition-colors duration-300 break-words">
                                        {name}
                                    </h1>
                                </div>
                                <div className="relative min-w-0">
                                    {/* ✅ FIX: removed fixed w-[80%], added w-full + break-words */}
                                    <h2 className="text-md w-full font-semibold text-[#4a3728] bg-gradient-to-r from-[#4a3728] to-[#6a5748] bg-clip-text text-transparent break-words">
                                        {headline}
                                    </h2>
                                </div>
                                {/* ✅ FIX: removed fixed w-[40vw] (viewport-relative width,
                                    ignores the actual parent container), replaced with
                                    w-full + break-words so long college/company names wrap
                                    instead of overflowing horizontally */}
                                <p className="mt-2 text-sm w-full text-[#4a3728] font-bold leading-relaxed relative break-words">
                                    {educationList && educationList.length > 0 && educationList[0]?.schoolCollegeName && (
                                        <>
                                            {educationList[0].schoolCollegeName}
                                            {(experienceList.length > 0 || company) && ' • '}
                                        </>
                                    )}

                                    {(!educationList || educationList.length === 0) && educationData?.collegeName && (
                                        <>
                                            {educationData.collegeName}
                                            {(experienceList.length > 0 || company) && ' • '}
                                        </>
                                    )}

                                    {experienceList && experienceList.length > 0 && (
                                        <>
                                            {experienceList.find(exp => exp.current)?.company || experienceList[0]?.company}
                                        </>
                                    )}

                                    {(!experienceList || experienceList.length === 0) && company && (
                                        <>
                                            {company}
                                        </>
                                    )}

                                    <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-[#4a3728]/20 to-transparent rounded-full"></div>
                                </p>
                                <div className="flex items-center gap-2 justify-center md:justify-start bg-white/50 rounded-full px-3 py-2 backdrop-blur-sm border border-[#e0d8cf]/50 min-w-0">
                                    <svg className="w-5 h-5 text-[#4a3728] animate-pulse flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {/* ✅ FIX: break-words so a long location string can't
                                        overflow the pill / push the row wider */}
                                    <p className="text-sm text-[#4a3728] break-words min-w-0">
                                        <span className="font-semibold">Location:</span> {location}
                                    </p>
                                </div>

                                {isOwnProfile && <Contactact />}

                                <div className="flex gap-3 justify-center md:justify-start flex-wrap">
                                    <button
                                        onClick={() => setIsConnectionsModalOpen(true)}
                                        className="connectionsShowButton group px-4 py-2 bg-white text-[#4a3728] rounded-full text-sm shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 border border-[#e0d8cf] hover:scale-105 hover:bg-gradient-to-r hover:from-[#f6ede8] hover:to-white">
                                        <svg className="w-5 h-5 text-[#4a3728] group-hover:animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                        className="connectionsShowButton group px-4 py-2 bg-white text-[#4a3728] rounded-full text-sm shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 border border-[#e0d8cf] hover:scale-105 hover:bg-gradient-to-r hover:from-[#f6ede8] hover:to-white"
                                        onClick={() => setIsConnectionsModalOpen(true)}>
                                        <svg className="w-5 h-5 text-[#4a3728] group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        <span className="font-semibold">
                                            {isLoadingConnections ? '' : totalConnections}
                                        </span> connections
                                    </button>
                                </div>

                                {!isOwnProfile && (
                                    <div className="flex gap-3 justify-center md:justify-start flex-wrap mt-4">


{isConnected ? (
    <button
        onClick={onMessage}
        className="px-5 py-2.5 bg-[#4a3728] text-white rounded-full text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
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
    className="px-5 py-2.5 bg-[#4a3728] text-white rounded-full text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
>
    Accept
</button>
        <button
            onClick={onDeclineRequest}
            className="px-5 py-2.5 bg-white text-[#4a3728] border border-[#e0d8cf] rounded-full text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
            Decline
        </button>
    </>
) : (
    <button
        onClick={onConnect}
        disabled={connectionPending}
        className="px-5 py-2.5 bg-[#4a3728] text-white rounded-full text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-60"
    >
        {connectionPending ? 'Pending...' : 'Connect'}
    </button>
)}

                                        <div className="relative">
                                            <button
                                                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                                                className="px-5 py-2.5 bg-white text-[#4a3728] border border-[#e0d8cf] rounded-full text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
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
            const el = document.getElementById('about');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        className="w-full text-left px-4 py-2.5 text-sm text-[#4a3728] hover:bg-[#f6ede8] transition-colors duration-200"
    >
        About this member
    </button>

    <button
        onClick={() => {
            const profileUrl = `${window.location.origin}/profile/${currentUserId}`;
            navigator.clipboard.writeText(profileUrl);
            alert('Profile link copied to clipboard!');
            setIsMoreMenuOpen(false);
        }}
        className="w-full text-left px-4 py-2.5 text-sm text-[#4a3728] hover:bg-[#f6ede8] transition-colors duration-200"
    >
        Share Profile
    </button>

    <button
        onClick={() => {
            alert('Report feature coming soon');
            setIsMoreMenuOpen(false);
        }}
        className="w-full text-left px-4 py-2.5 text-sm text-[#4a3728] hover:bg-[#f6ede8] transition-colors duration-200"
    >
        Report
    </button>

    <button
        onClick={() => {
            alert('Block feature coming soon');
            setIsMoreMenuOpen(false);
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

            <ConnectionsModal
                isOpen={isConnectionsModalOpen}
                onClose={() => setIsConnectionsModalOpen(false)}
                following={followingList}
                followers={followersList}
                username={name}
                currentUserId={currentUserId}
            />
        </>
    );
};

export default ProfileHeader;