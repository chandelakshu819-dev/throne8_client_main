'use client';
// src/app/profile/page.tsx
import { useAuth, useProtectedRoute } from '@/features/auth/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import ProfileNavbar from '../../features/profile/components/home/ProfileNavbar';
import ProfileBanner from '../../features/profile/components/home/ProfileBanner';
import ProfileHeader from '../../features/profile/components/home/ProfileHeader';
import ProfileActions from '../../features/profile/components/home/ProfileActions';
import ProfessionalJourney from '../../features/profile/components/home/ProfessionalJourney';
import AboutSection from '../../features/profile/components/home/AboutSection';
import ExperienceSection from '../../features/profile/components/home/ExperienceSection';
import EducationSection from '../../features/profile/components/home/EducationSection';
import PremiumFeatures from '../../features/profile/components/home/PremiumFeatures';
import ActivitySection from '../../features/profile/components/home/ActivitySection';
import SkillsSection from '../../features/profile/components/home/SkillsSection';
import InterestsSection from '../../features/profile/components/home/InterestsSection';
import AnalyticsDashboard from '../../features/profile/components/home/AnalyticsDashboard';
import ProfileProgress from '../../features/profile/components/home/ProfileProgress';
import PeopleYouMayKnow from '../../features/profile/components/home/PeopleYouMayKnow';

// ✅ Import transformer
import { transformToProfileData } from '@/shared/utils/profileTransformers';
import FollowService from '@/lib/api/follow.service';

import { useSocket } from '@/core/realtime/useSocket';
import { SOCKET_EVENTS } from '@/core/realtime/socket.events';

import { useEducation } from '@/features/profile/hooks/useEducation';
import { useExperienceData } from '@/features/profile/hooks/useExperienceData';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useAboutData } from '@/features/profile/hooks/useAboutData';
import { useHeadlineData } from '@/features/profile/hooks/useHeadlineData';
import { useSkillsData } from '@/features/profile/hooks/useSkillsData';
// ✅ NEW — connections ka single source of truth is page ke liye
import { useConnectionsData } from '@/features/profile/hooks/useConnectionsData';


export default function ProfilePage() {
    const { isChecking } = useProtectedRoute();
    const { user, isLoading } = useAuth();
    const [followersCount, setFollowersCount] = useState(0);

    // ✅ Ye hamesha "apni" profile hai (koi userId param nahi hai is route pe),
    // isliye explicitly true rakh rahe hain — kisi component ke default
    // value pe depend nahi karna, taaki future me galti se change na ho
    const isOwnProfile = true;

    const {
        userProfileData,
        profileImageUrl,
        bannerUrl,
        coverPhotoId,
        aboutId,
        headlineId,
        isLoadingProfile,
        userPosts,
        isLoadingPosts,
        loadProfile,
        loadPosts,
        updateProfileImage,
        updateBanner,
        userReposts,
        isLoadingReposts,
        loadMyReposts,
        createRepost,
        removeRepost,
    } = useProfile();

    // ✅ FIX: stable reference — warna har render pe naya [] array banega
    // aur ExperienceSection ke andar wala useEffect infinite loop mein
    // chala jayega, jo backend ko continuously hit karke 429 rate-limit
    // laga deta hai, jiski wajah se baaki APIs (About, etc.) bhi fail hone lagti hain
    const experienceIds = useMemo(
        () => userProfileData?.experienceIds || [],
        [userProfileData?.experienceIds]
    );

    // ✅ Scroll to activity section after data loads
    useEffect(() => {
        if (!isLoadingProfile && window.location.hash === '#activity-section') {
            setTimeout(() => {
                const el = document.getElementById('activity-section');
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }
    }, [isLoadingProfile]);

    const {
        aboutData,
        videoUrl,
        isLoadingAbout,
        isUploadingVideo,
        fetchAboutData,
        handleVideoUpload,
    } = useAboutData(aboutId);

    const { headlineData, fetchHeadlineData } = useHeadlineData(headlineId);
    const { experienceList, fetchExperienceData } = useExperienceData();
    const { educationList, loadEducation } = useEducation();
    const { skillsList, fetchSkillsData } = useSkillsData(user?.userId, true);

    // ✅ NEW: connections count — ProfileHeader jaisa hi hook, 30s cache +
    // in-flight dedupe ki wajah se extra network request NAHI lagegi
    // (ProfileHeader apna alag instance call karta hai, dono same cache hit karenge)
    const { totalConnections, fetchConnectionsData } = useConnectionsData();

    // ✅ Fetch data on mount
    useEffect(() => {
        if (user) {
            loadProfile();
            loadPosts();
            loadEducation();
            loadMyReposts();
            fetchSkillsData();
            fetchConnectionsData(user.userId); // ✅ NEW
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);


    useEffect(() => {
        if (!user?.userId) return;
        const loadFollowersCount = async () => {
            const res = await FollowService.getFollowCounts(user.userId);
            setFollowersCount(res?.data?.followersCount ?? 0);
        };
        loadFollowersCount();
    }, [user?.userId]);


    const { socket } = useSocket();

    useEffect(() => {
        if (!socket) return;

        const handleFollowReceived = () => {
            setFollowersCount(prev => prev + 1);
        };

        const handleFollowRemoved = () => {
            setFollowersCount(prev => Math.max(0, prev - 1));
        };

        socket.on(SOCKET_EVENTS.FOLLOW_RECEIVED, handleFollowReceived);
        socket.on(SOCKET_EVENTS.FOLLOW_REMOVED, handleFollowRemoved);

        return () => {
            socket.off(SOCKET_EVENTS.FOLLOW_RECEIVED, handleFollowReceived);
            socket.off(SOCKET_EVENTS.FOLLOW_REMOVED, handleFollowRemoved);
        };
    }, [socket]);



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
        if (userProfileData?.experienceIds && userProfileData.experienceIds.length > 0) {
            fetchExperienceData(userProfileData.experienceIds);
        }
    }, [userProfileData?.experienceIds, fetchExperienceData]);

    // ✅ Transform profile data using utility function
    const profileData = transformToProfileData(userProfileData, profileImageUrl, headlineData);

    const fullName = userProfileData
        ? `${userProfileData.firstName} ${userProfileData.lastName}`.trim()
        : 'Loading...';

    // 🎨 Loading state
    if (isChecking || isLoading || isLoadingProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5f1ed] to-[#e8dfd7]">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-[#4a3728] mx-auto" />
                    <p className="mt-4 text-gray-600">
                        {isLoadingProfile ? 'Loading profile data...' : 'Loading your profile...'}
                    </p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#f6ede8] py-12 px-4 font-sans">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
                {/* Navbar */}
                <ProfileNavbar
                    profileImage={profileImageUrl}
                    userName={profileData.userName}
                    currentUserId={user?.userId}
                    companyId={profileData?.company}
                />

                {/* Main Content (Left) */}
                <div className="flex-1 min-w-0 pt-20">
                    {/* Banner */}
                    <ProfileBanner
                        bannerImage={bannerUrl}
                        onBannerUpdate={(newUrl) => {
                            updateBanner(newUrl);
                        }}
                        onDataRefresh={loadProfile}
                        coverId={coverPhotoId}
                        isOwnProfile={isOwnProfile}
                    />

                    {/* Profile Header */}
                    <ProfileHeader
                        isOwnProfile={isOwnProfile}
                        currentUserId={user?.userId}
                        profileImage={profileImageUrl}
                        name={profileData.name}
                        // pronouns={profileData.pronouns}
                        headline={headlineData?.title || profileData.headline}
                        headlineId={headlineId}
                        onHeadlineCreated={fetchHeadlineData}
                        company={profileData.company}
                        description={profileData.description}
                        location={profileData.location}
                        // followers={profileData.followers}
                        followers={followersCount}
                        connections={profileData.connections}
                        firstName={userProfileData?.firstName || ''}
                        lastName={userProfileData?.lastName || ''}
                        currentPosition={userProfileData?.currentPosition || ''}
                        education={userProfileData?.education || ''}
                        educationData={profileData.education}
                        educationList={educationList}
                        experienceList={experienceList}
                        contactInfo={userProfileData?.contactInfo || ''}
                        onDataRefresh={loadProfile}
                        onProfileImageUpdate={(newUrl) => updateProfileImage(newUrl)}
                    />

                    {/* Profile Actions */}
                    <ProfileActions />

                    {/* Analytics Dashboard */}
                    <AnalyticsDashboard userId={user?.userId || ''} />


                    {/* About Section */}
                    <AboutSection
                        isOwnProfile={isOwnProfile}
                        aboutData={aboutData}
                        isLoading={isLoadingAbout}
                        onAboutCreated={fetchAboutData}
                        aboutId={aboutId}
                        videoUrl={videoUrl}
                        onVideoUpload={handleVideoUpload}
                        isUploadingVideo={isUploadingVideo}
                    />

                    {/* Education Section */}
                    <EducationSection
                        isOwnProfile={isOwnProfile}
                        collegeName={profileData.education.collegeName}
                        degree={profileData.education.degree}
                        fieldOfStudy={profileData.education.fieldOfStudy}
                        graduationYear={profileData.education.graduationYear}
                    />

                    {/* ✅ FIXED: Experience Section — stable experienceIds reference */}
                    <ExperienceSection
                        isOwnProfile={isOwnProfile}
                        experienceIds={experienceIds}
                    />

                    {/* Premium Features */}
                    <PremiumFeatures />

                    {/* Activity Section */}
                    <div id="activity-section">

                    <ActivitySection
                        isOwnProfile={isOwnProfile}
                        posts={userPosts}
                        currentUserId={user?.userId}
                        onPostCreated={loadPosts}
                        followers={profileData.followers}
                        isLoading={isLoadingPosts}
                        profileImage={profileImageUrl}
                        fullName={fullName}
                        headline={profileData.headline}
                        userReposts={userReposts}
                        isLoadingReposts={isLoadingReposts}
                        onCreateRepost={createRepost}
                        onDeleteRepost={removeRepost}
                    />
                    </div>

                    {/* Skills Section */}
                    <SkillsSection isOwnProfile={isOwnProfile} />

                    {/* Interests Section */}
                    <InterestsSection />
                </div>

                {/* Sidebar (Right) */}
                <div className="w-full md:w-80 md:min-w-[20rem]">
                    {/* Profile Progress */}
                    <ProfileProgress
                        profileImageUrl={profileImageUrl}
                        bannerUrl={bannerUrl}
                        headline={headlineData?.title || profileData.headline}
                        about={aboutData}
                        educationList={educationList}
                        experienceList={experienceList}
                        skillsCount={skillsList.length}
                        connectionsCount={totalConnections}
                        //{/* ✅ FIX: profileData.connections (jo transformer mein hamesha '' hardcoded hai)
                            // ki jagah ab totalConnections use ho raha hai — same real
                            // source jo ProfileHeader ke "8 connections" mein dikhta hai *///
                        postsCount={userPosts?.length || 0}
                    />
                    {/* People You May Know */}
                    <PeopleYouMayKnow userId={user?.userId} />
                </div>
            </div>
        </div>
    );
}