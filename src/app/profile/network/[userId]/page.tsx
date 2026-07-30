'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';

// Network components
import { NetworkSidebar } from '@/features/networks/components/layout/NetworkSidebar';
import { NetworkTab } from '@/features/networks/components/ui/NetworkTab';
import { ConnectionRequestsList } from '@/features/networks/components/connections/ConnectionRequestsList';
import { SuggestionsSection } from '@/features/networks/components/suggestions/SuggestionsSection';
import { SuggestionsForCompaniesSection } from '@/features/networks/components/suggestions/SuggestionsForCompaniesSection';
import { PremiumSpotlight } from '@/features/networks/components/premium/PremiumSpotlight';
import { ProfileViewerCard } from '@/features/networks/components/profile/ProfileViewerCard';
import { ProfileCompletionCard } from '@/features/networks/components/profile/ProfileCompletionCard';
import { CatchUpSection } from '@/features/networks/components/catchup/CatchUpSection';
import { AddBirthdayPrompt } from '@/features/networks/components/catchup/AddBirthdayPrompt';

// Hooks
import { useNetworkConnections } from '@/features/networks/hooks/useNetworkConnections';
import { useNetworkUsers } from '@/features/networks/hooks/useNetworkUsers';
import { useConnectionRequests } from '@/features/networks/hooks/useConnectionRequests';
import { useCatchUp } from '@/features/networks/hooks/useCatchUp';

// Types
import { TabType } from '@/features/networks/types';
import { useSocket } from '@/core/realtime/useSocket';
import { useNetworkCompanies } from '@/features/networks/hooks/useNetworkCompanies';
import { premiumProfiles } from '@/features/networks/constants/mockData';
import { useProfileData } from '@/features/profile/hooks/useProfileData';
import { useHeadlineData } from '@/features/profile/hooks/useHeadlineData';
import { transformToProfileData } from '@/shared/utils/profileTransformers';
import ProfileNavbar from '@/features/profile/components/home/ProfileNavbar';

// ✅ NEW — profile completion ke liye chahiye wale hooks (Profile page jaisa hi)
import { useEducation } from '@/features/profile/hooks/useEducation';
import { useExperienceData } from '@/features/profile/hooks/useExperienceData';
import { useSkillsData } from '@/features/profile/hooks/useSkillsData';
import { useConnectionsData } from '@/features/profile/hooks/useConnectionsData';
import { useAboutData } from '@/features/profile/hooks/useAboutData';
import { calculateProfileCompletion } from '@/shared/utils/profileCompletion';

export default function NetworkPage() {
    const params = useParams();
    const userId = params.userId as string;
    const { user } = useAuth();
    const { isConnected } = useSocket();

    // Network state
    const [activeTab, setActiveTab] = useState<TabType>('grow');
    const {
        companies: realCompanies,
        isLoading: isLoadingCompanies,
        followingCompanies,
        handleFollowCompany
    } = useNetworkCompanies();

    // Custom hooks
    const { connectedUsers, handleConnect } = useNetworkConnections();

    const {
        requests,
        sentRequests,
        isLoading: isLoadingRequests,
        showRequestsPanel,
        activeReqTab,
        setActiveReqTab,
        handleAccept,
        handleIgnore,
        handleWithdraw,
        toggleRequestsPanel
    } = useConnectionRequests();

    // Profile data hooks
    const {
        userProfileData,
        profileImageUrl,
        bannerUrl,       // ⚠️ CONFIRM: agar useProfileData ye field expose NAHI karta,
                          // to niche bannerUrl hardcode `null` rakhna padega — file check kar lo
        aboutId,          // ⚠️ CONFIRM: agar useProfileData ye field expose NAHI karta,
                          // to about-completion check hamesha false rahega — file bhej do main confirm kar dunga
        headlineId,
        fetchUserProfile
    } = useProfileData();

    const { headlineData } = useHeadlineData(headlineId);
    const { networkUsers, isLoadingUsers, fetchNetworkUsers } = useNetworkUsers();
    const { items: catchUpItems, isLoading: isLoadingCatchUp, fetchCatchUp } = useCatchUp();

    // ✅ NEW — profile completion ke liye real data
    const { educationList, loadEducation } = useEducation();
    const { experienceList, fetchExperienceData } = useExperienceData();
    const { skillsList, fetchSkillsData } = useSkillsData(user?.userId, true);
    const { aboutData, fetchAboutData } = useAboutData(aboutId);
    const { totalConnections, fetchConnectionsData } = useConnectionsData(); // ✅ cached hook, extra API load nahi

    useEffect(() => {
        if (user) {
            fetchUserProfile();
            fetchNetworkUsers(user.userId);
            loadEducation();
            fetchSkillsData();
            fetchConnectionsData(user.userId);

            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }
    }, [user, fetchUserProfile, fetchNetworkUsers]);

    useEffect(() => {
        if (aboutId) {
            fetchAboutData();
        }
    }, [aboutId, fetchAboutData]);

    useEffect(() => {
        if (userProfileData?.experienceIds && userProfileData.experienceIds.length > 0) {
            fetchExperienceData(userProfileData.experienceIds);
        }
    }, [userProfileData?.experienceIds, fetchExperienceData]);

    useEffect(() => {
        if (user && activeTab === 'catchup') {
            fetchCatchUp(user.userId);
        }
    }, [user, activeTab, fetchCatchUp]);

    const profileData = transformToProfileData(
        userProfileData,
        profileImageUrl,
        headlineData
    );

    const hasDateOfBirth = !!(userProfileData as any)?.dateOfBirth;

    // ✅ FIX: hardcoded 12% ki jagah real calculation — same formula ProfileProgress.tsx jaisa
    const completionPercentage = calculateProfileCompletion({
        profileImageUrl,
        bannerUrl,
        headline: headlineData?.title,
        about: aboutData,
        educationList,
        experienceList,
        skillsCount: skillsList.length,
    });

    return (
        <>
            <ProfileNavbar
                profileImage={profileData.profileImage}
                userName={profileData.userName}
                currentUserId={user?.userId}
            />

            <div className="min-h-screen mt-12" style={{ backgroundColor: '#f6ede8' }}>
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-10 w-32 h-32 rounded-full opacity-5" style={{ backgroundColor: '#4a3728' }}></div>
                    <div className="absolute top-60 right-20 w-24 h-24 rounded-full opacity-5" style={{ backgroundColor: '#4a3728' }}></div>
                    <div className="absolute bottom-40 left-1/4 w-40 h-40 rounded-full opacity-5" style={{ backgroundColor: '#4a3728' }}></div>
                </div>

                <div className="relative max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 p-6">
                    <NetworkSidebar />

                    <div className="flex-1 space-y-8">
                        <div className="max-w-4xl mx-auto p-6 space-y-8">
                            <NetworkTab activeTab={activeTab} setActiveTab={setActiveTab} />

                            <ConnectionRequestsList
                                requests={requests}
                                sentRequests={sentRequests}
                                isLoading={isLoadingRequests}
                                showRequestsPanel={showRequestsPanel}
                                activeReqTab={activeReqTab}
                                setActiveReqTab={setActiveReqTab}
                                onTogglePanel={toggleRequestsPanel}
                                onAccept={handleAccept}
                                onIgnore={handleIgnore}
                                onWithdraw={handleWithdraw}
                            />

                            <ProfileViewerCard />
                        </div>

                        {activeTab === 'grow' && (
                            <>
                                <SuggestionsSection
                                    people={networkUsers}
                                    connectedUsers={connectedUsers}
                                    onConnect={handleConnect}
                                    isLoading={isLoadingUsers}
                                />

                                <SuggestionsForCompaniesSection
                                    companies={realCompanies}
                                    followingCompanies={followingCompanies}
                                    onFollow={handleFollowCompany}
                                    isLoading={isLoadingCompanies}
                                />

                                <PremiumSpotlight profiles={premiumProfiles} />

                                {/* ✅ FIX: hardcoded 12% hataya, ab real calculation */}
                                <ProfileCompletionCard completionPercentage={completionPercentage} />
                            </>
                        )}

                        {activeTab === 'catchup' && (
                            <>
                                <AddBirthdayPrompt
                                    hasDateOfBirth={hasDateOfBirth}
                                    onSaved={() => user && fetchCatchUp(user.userId)}
                                />

                                <CatchUpSection items={catchUpItems} isLoading={isLoadingCatchUp} />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}