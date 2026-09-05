'use client';
// src/app/profile/[userId]/page.tsx
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import React, { useEffect, useState, useMemo } from 'react';

// Import components
import ProfileNavbar from '../../../features/profile/components/home/ProfileNavbar';
import ProfileBanner from '../../../features/profile/components/home/ProfileBanner';
import ProfileHeader from '../../../features/profile/components/home/ProfileHeader';
import AboutSection from '../../../features/profile/components/home/AboutSection';
import EducationSection from '../../../features/profile/components/home/EducationSection';
import ExperienceSection from '../../../features/profile/components/home/ExperienceSection';
import ActivitySection from '../../../features/profile/components/home/ActivitySection';
import SkillsSection from '../../../features/profile/components/home/SkillsSection';
import InterestsSection from '../../../features/profile/components/home/InterestsSection';
import PeopleYouMayKnow from '../../../features/profile/components/home/PeopleYouMayKnow';
import { transformToProfileData } from '@/shared/utils/profileTransformers';

import { useSearchUserProfileData } from '@/features/profile/hooks/useSearchUserProfileData';
import { usePostsData } from '@/features/profile/hooks/usePostsData';
import { useAboutData } from '@/features/profile/hooks/useAboutData';
import { useHeadlineData } from '@/features/profile/hooks/useHeadlineData';
import { useConnectionsData } from '@/features/profile/hooks/useConnectionsData';
import { useFollowCounts } from '@/features/profile/hooks/useFollowCounts'; // ✅ NEW
import AnalyticsService from '@/lib/api/analytics.service';
import ConnectionService from '@/lib/api/connection.service';
import FollowService from '@/lib/api/follow.service';
import AuthService from '@/lib/api/auth.service';
import ProfileService from '@/lib/api/profile.service';

export default function SearchUserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.userId as string;
    const { user } = useAuth();

    // ✅ FIX: yahi decide karta hai ki edit buttons / owner-only actions
    // dikhne chahiye ya nahi. Pehle isOwnProfile={false} hardcoded tha
    // har jagah, isliye apni profile bhi [userId] route se khulne par
    // "dusre ki profile" jaisa treat ho rahi thi.
    // String() isliye taaki agar kabhi ek field ObjectId aur doosra
    // string ho, to bhi comparison sahi se ho.
    const isOwnProfile = !!user?.userId && String(user.userId) === String(userId);

    const {
        userProfileData,
        profileImageUrl,
        bannerUrl,
        coverPhotoId,
        aboutId,
        headlineId,
        websiteUrl: searchedWebsiteUrl,
        isLoadingProfile,
        profileError,
        fetchUserProfileById,
    } = useSearchUserProfileData(userId);

    // ✅ FIX: stable reference — warna har render pe naya [] array banega
    // aur ExperienceSection ke andar wala useEffect infinite loop mein
    // chala jayega, jo backend ko continuously hit karke 429 rate-limit
    // laga deta hai, jiski wajah se About/Experience dono fail ho jaate hain
    const experienceIds = useMemo(
        () => userProfileData?.experienceIds || [],
        [userProfileData?.experienceIds]
    );

    const {
        totalConnections,
        followersList,
        fetchConnectionsData,
    } = useConnectionsData();

    // ✅ NEW — dedicated Follow-system counts. This is DIFFERENT from
    // "connections" above (mutual/accepted network). This hook hits
    // GET /api/v1/follow/counts/:userId which is the real one-directional
    // follow count (LinkedIn/Twitter-style "Follow" button), and is what
    // the "X followers" badge on ProfileHeader / ActivitySection should
    // actually be showing. Previously both were wired to
    // `followersList.length` (from useConnectionsData), which only
    // reflects mutual connections — hence "0 followers" even when the
    // user had real followers via the Follow system.
    const {
        followersCount,
        fetchFollowCounts,
        invalidateFollowCounts,
    } = useFollowCounts();

    const [isFollowing, setIsFollowing] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionPending, setConnectionPending] = useState(false);
    const [isFollowActionLoading, setIsFollowActionLoading] = useState(false);

    // ✅ FIX: navbar ko hamesha LOGGED-IN user ka naam/photo dikhana hai,
    // jis profile ko view kar rahe hain uska nahi. useAuth() ka `user`
    // sirf { userId, email, role } jaisa halka object deta hai, isliye
    // naam/photo alag se fetch karke yahan store karte hain.
    const [currentUserName, setCurrentUserName] = useState('');
    const [currentUserImage, setCurrentUserImage] = useState('');
    // ✅ FIX: current user ki headline bhi store karte hain, taaki jab
    // ye kisi aur ka profile view kare, uski headline bhi record ho sake
    const [currentUserHeadline, setCurrentUserHeadline] = useState('');
    // ✅ FIX: ye flag batata hai ki current user ka naam/photo fetch
    // poora ho chuka hai ya nahi. Isse pehle profile-view record
    // nahi hogi, taaki viewerPhotoUrl kabhi khali na jaye (race condition fix)
    const [isCurrentUserLoaded, setIsCurrentUserLoaded] = useState(false);

    useEffect(() => {
        if (!user?.userId) return;
        const fetchCurrentUser = async () => {
            try {
                const response = await AuthService.getUserProfileById(user.userId);
                const data = response?.data;
                if (data) {
                    setCurrentUserName(
                        `${data.firstName || ''} ${data.lastName || ''}`.trim() || user.email || ''
                    );
                    if (data.profilePhotoId) {
                        const photoRes = await ProfileService.getProfilePhotoById(data.profilePhotoId);
                        setCurrentUserImage(photoRes?.data?.photo?.cloudinarySecureUrl || '');
                    }
                    // ✅ FIX: current user ki headline fetch karo (agar headlineId hai)
                   console.log('🔍 [DEBUG] data.headlineId:', data.headlineId);
                   if (data.headlineId) {
                       try {
                           const headlineRes = await ProfileService.getHeadlineById(data.headlineId);
                           console.log('🔍 [DEBUG] headlineRes:', headlineRes);
                           setCurrentUserHeadline(headlineRes?.data?.title || '');
                       } catch (err) {
                           console.log('🔍 [DEBUG] headline fetch error:', err);
                           setCurrentUserHeadline('');
                       }
                   } else {
                       console.log('🔍 [DEBUG] No headlineId found on user data');
                   }
                } else {
                    setCurrentUserName(user.email || '');
                }
            } catch (error) {
                setCurrentUserName(user.email || '');
            } finally {
                setIsCurrentUserLoaded(true);
            }
        };
        fetchCurrentUser();
    }, [user?.userId, user?.email]);

    
    useEffect(() => {
        if (userId) {
            fetchConnectionsData(userId);
        }
    }, [userId, fetchConnectionsData]);

    // ✅ NEW — fetch real follow-system counts (followers/following) for
    // whichever profile is being viewed.
    useEffect(() => {
        if (userId) {
            fetchFollowCounts(userId);
        }
    }, [userId, fetchFollowCounts]);

    useEffect(() => {
        if (!userId || !user?.userId || userId === user.userId) return;
        const checkStatus = async () => {
            try {
                const followRes = await FollowService.checkFollowStatus(userId);
                setIsFollowing(!!followRes?.data?.isFollowing);
            } catch {
                setIsFollowing(false);
            }
        };
        checkStatus();
    }, [userId, user?.userId]);

    useEffect(() => {
        if (!user?.userId || !userId) return;
        const checkConnection = async () => {
            try {
                const res = await ConnectionService.getUserConnections(user.userId);
                const connections = res?.data?.data || res?.data || [];
                const connected = connections.some(
                    (c: { fromUserId?: string; toUserId?: string; status?: string }) =>
                        (c.fromUserId === userId || c.toUserId === userId) &&
                        c.status === 'active'
                );
                setIsConnected(connected);
            } catch {
                setIsConnected(false);
            }
        };
        checkConnection();
    }, [userId, user?.userId]);

    const [isConnecting, setIsConnecting] = useState(false);

    useEffect(() => {
        if (!user?.userId || !userId || userId === user.userId) return;
        const checkPendingStatus = async () => {
            try {
                const res = await ConnectionService.getOutgoingRequests(user.userId);
                const outgoingRequests = Array.isArray(res?.data?.data?.data)
                    ? res.data.data.data
                    : Array.isArray(res?.data?.data)
                        ? res.data.data
                        : Array.isArray(res?.data)
                            ? res.data
                            : [];
                const isPending = outgoingRequests.some(
                    (r: { toUserId?: string }) => r.toUserId === userId
                );
                setConnectionPending(isPending);
            } catch {
                setConnectionPending(false);
            }
        };
        checkPendingStatus();

        const handleGlobalRequestSent = (event: any) => {
            if (event.detail?.targetUserId === userId) {
                setConnectionPending(true);
            }
        };
        window.addEventListener('connection-request:sent', handleGlobalRequestSent);
        return () => window.removeEventListener('connection-request:sent', handleGlobalRequestSent);
    }, [userId, user?.userId]);

    const [incomingRequestId, setIncomingRequestId] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.userId || !userId || userId === user.userId) return;
        const checkIncomingRequest = async () => {
            try {
                const res = await ConnectionService.getIncomingRequests(user.userId);
                const incomingRequests = Array.isArray(res?.data?.data?.data)
                    ? res.data.data.data
                    : Array.isArray(res?.data?.data)
                        ? res.data.data
                        : Array.isArray(res?.data)
                            ? res.data
                            : [];
                const matchedRequest = incomingRequests.find(
                    (r: { fromUserId?: string }) => r.fromUserId === userId
                );
                setIncomingRequestId(matchedRequest?.requestId || null);
            } catch {
                setIncomingRequestId(null);
            }
        };
        checkIncomingRequest();
    }, [userId, user?.userId]);

    const handleConnect = async () => {
        if (!userId || connectionPending || isConnecting) return;
        try {
            setIsConnecting(true);
            setConnectionPending(true);
            await ConnectionService.sendConnectionRequest({ toUserId: userId });
            window.dispatchEvent(new CustomEvent('connection-request:sent', { detail: { targetUserId: userId } }));
        } catch (error: any) {
            const alreadyExists = error.message?.includes('already exists');
            if (alreadyExists) {
                setConnectionPending(true);
            } else {
                setConnectionPending(false);
                alert(error.message || 'Failed to send connection request');
            }
        } finally {
            setIsConnecting(false);
        }
    };

    const handleAcceptRequest = async () => {
        if (!incomingRequestId) return;
        try {
            await ConnectionService.acceptConnectionRequest(incomingRequestId);
            setIncomingRequestId(null);
            setIsConnected(true);
        } catch (error: any) {
            alert(error.message || 'Failed to accept request');
        }
    };

    const handleDeclineRequest = async () => {
        if (!incomingRequestId) return;
        try {
            await ConnectionService.declineConnectionRequest(incomingRequestId);
            setIncomingRequestId(null);
        } catch (error: any) {
            alert(error.message || 'Failed to decline request');
        }
    };

    const handleFollow = async () => {
        if (!userId || isFollowActionLoading) return;
        try {
            setIsFollowActionLoading(true);
            if (isFollowing) {
                await FollowService.unfollowUser(userId);
                setIsFollowing(false);
            } else {
                await FollowService.followUser(userId);
                setIsFollowing(true);
            }
            // ✅ NEW — invalidate cached follow counts and refetch immediately
            // so the "X followers" badge updates right after follow/unfollow,
            // instead of waiting for the next natural fetch cycle.
            invalidateFollowCounts(userId);
            await fetchFollowCounts(userId);
        } catch (error: any) {
            alert(error.message || 'Failed to update follow status');
        } finally {
            setIsFollowActionLoading(false);
        }
    };

    const handleMessage = () => {
        router.push(`/message/${userId}`);
    };

    const { userPosts, isLoadingPosts, fetchUserPosts } = usePostsData(userId);

    const {
        aboutData,
        videoUrl,
        isLoadingAbout,
        isUploadingVideo,
        isDeletingVideo,
        fetchAboutData,
        handleVideoUpload,
        handleVideoDelete,
    } = useAboutData(aboutId);

    const { headlineData, fetchHeadlineData } = useHeadlineData(headlineId);

    const profileData = transformToProfileData(userProfileData, profileImageUrl, headlineData);

    const fullName = userProfileData
        ? `${userProfileData.firstName} ${userProfileData.lastName}`.trim()
        : 'Loading...';

    useEffect(() => {
        if (userId) {
            fetchUserProfileById();
        }
    }, [userId, fetchUserProfileById]);

    useEffect(() => {
        // ✅ FIX: jab tak currentUserImage/currentUserName ka fetch poora
        // nahi ho jaata (isCurrentUserLoaded === true), tab tak view record
        // nahi karni — warna viewerPhotoUrl khali chali jaati hai (race condition)
        if (user?.userId && userId && user.userId !== userId && isCurrentUserLoaded) {
            console.log('🔍 [DEBUG] Recording profile view with:', {
                viewerId: user.userId,
                viewerName: currentUserName || user.email,
                viewerPhotoUrl: currentUserImage,
                isCurrentUserLoaded,
            });
            AnalyticsService.recordProfileView(userId, {
                viewerId: user.userId,
                viewerName: currentUserName || user.email,
                viewerHeadline: currentUserHeadline || undefined,
                viewerPhotoUrl: currentUserImage || undefined,
            });

        // ✅ NEW: Unique visitor bhi record karo (profile visit event)
        AnalyticsService.recordUniqueVisitor(
            userId,
            typeof window !== 'undefined' ? window.location.href : undefined
        );
        }
    }, [user, userId, currentUserName, currentUserImage, currentUserHeadline, isCurrentUserLoaded]);

    useEffect(() => {
        if (aboutId) {
            fetchAboutData();
        }
    }, [aboutId, fetchAboutData]);

    useEffect(() => {
        if (headlineId) {
            fetchHeadlineData();
        }
    }, [headlineId, fetchHeadlineData]);

    useEffect(() => {
        if (userId) {
            fetchUserPosts(userId);
        }
    }, [userId, fetchUserPosts]);

    const searchParams = useSearchParams();

    useEffect(() => {
        const section = searchParams.get('section');
        if (section) {
            setTimeout(() => {
                const el = document.getElementById(section);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 3000);
        }
    }, [searchParams]);

    if (isLoadingProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5f1ed] to-[#e8dfd7]">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-[#4a3728] mx-auto" />
                    <p className="mt-4 text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (profileError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5f1ed] to-[#e8dfd7]">
                <div className="text-center">
                    <p className="text-red-600 text-lg">{profileError}</p>
                    <button
                        onClick={() => window.history.back()}
                        className="mt-4 px-6 py-2 bg-[#4a3728] text-white rounded-lg"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }
return (
        <div
            className="min-h-screen bg-[#f6ede8] py-12 px-4 font-sans overflow-x-hidden"
            style={{ zoom: 0.85 } as React.CSSProperties}
        >
            {/* ✅ FIX: navbar ab hamesha LOGGED-IN user ka naam/photo dikhata hai,
                chahe kisi bhi profile ([userId]) ko view kar rahe ho */}
            <ProfileNavbar
                profileImage={currentUserImage}
                userName={currentUserName}
                currentUserId={user?.userId}
            />

            <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
                <div className="flex-1 min-w-0 pt-20">
                    <ProfileBanner
                        bannerImage={bannerUrl}
                        onBannerUpdate={() => { }}
                        onDataRefresh={() => { }}
                        coverId={coverPhotoId}
                        isOwnProfile={isOwnProfile}
                    />

                    {/* ✅ FIX: pronouns prop hataya — ProfileHeader ab yeh prop
                        accept hi nahi karta (backend me field exist nahi karti) */}
                    <ProfileHeader
                        isOwnProfile={isOwnProfile}
                        currentUserId={userId}
                        profileImage={profileImageUrl}
                        name={profileData.name}
                        headline={headlineData?.title || profileData.headline}
                        headlineId={headlineId}
                        onHeadlineCreated={() => { }}
                        company={profileData.company}
                        description={profileData.description}
                        location={profileData.location}
                        followers={followersCount}
                        connections={totalConnections.toString()}
                        websiteUrl={(() => {
                            let prefUrl = '';
                            if (userProfileData?.preferences) {
                                if (typeof userProfileData.preferences === 'string') {
                                    try { prefUrl = JSON.parse(userProfileData.preferences)?.websiteUrl || ''; } catch {}
                                } else {
                                    prefUrl = (userProfileData.preferences as any)?.websiteUrl || '';
                                }
                            }
                            return searchedWebsiteUrl || prefUrl || userProfileData?.website || userProfileData?.websiteUrl || '';
                        })()}
                        firstName={userProfileData?.firstName || ''}
                        lastName={userProfileData?.lastName || ''}
                        currentPosition={userProfileData?.currentPosition || ''}
                        education={userProfileData?.education || ''}
                        contactInfo={userProfileData?.contactInfo || ''}
                        onDataRefresh={() => { }}
                        onProfileImageUpdate={() => { }}
                        isFollowing={isFollowing}
                        isConnected={isConnected}
                        connectionPending={connectionPending}
                        onFollow={handleFollow}
                        onConnect={handleConnect}
                        onMessage={handleMessage}
                        incomingRequestId={incomingRequestId}
                        onAcceptRequest={handleAcceptRequest}
                        onDeclineRequest={handleDeclineRequest}
                    />
                    <div id="about">
                        <AboutSection
                            isOwnProfile={isOwnProfile}
                            aboutData={aboutData}
                            isLoading={isLoadingAbout}
                            onAboutCreated={() => { }}
                            aboutId={aboutId}
                            videoUrl={videoUrl}
                            onVideoUpload={handleVideoUpload}
                            onVideoDelete={handleVideoDelete}
                            isUploadingVideo={isUploadingVideo}
                            isDeletingVideo={isDeletingVideo}
                        />
                    </div>

                    <EducationSection
                        isOwnProfile={isOwnProfile}
                        userId={userId}
                        collegeName={profileData.education.collegeName}
                        degree={profileData.education.degree}
                        fieldOfStudy={profileData.education.fieldOfStudy}
                        graduationYear={profileData.education.graduationYear}
                    />

                    {/* ✅ stable experienceIds reference */}
                    <ExperienceSection
                        experienceIds={experienceIds}
                        userId={userId}
                        isOwnProfile={isOwnProfile}
                    />

                    <div id="activity">
                        <ActivitySection
                            posts={userPosts as any}
                            onPostCreated={() => { }}
                            isLoading={isLoadingPosts}
                            profileImage={profileImageUrl}
                            fullName={fullName}
                            headline={profileData.headline}
                            followers={followersCount}
                            userId={userId}
                            currentUserId={user?.userId}
                            isOwnProfile={isOwnProfile}
                        />
                    </div>

                    <SkillsSection userId={userId} isOwnProfile={isOwnProfile} />
                    <InterestsSection />
                </div>

                <div className="w-full md:w-80 md:min-w-[20rem]">
                    <PeopleYouMayKnow userId={user?.userId} />
                </div>
            </div>
        </div>
    );
}