// src/features/networks/hooks/useConnectionRequests.ts

import { useState, useEffect } from 'react';
import { ConnectionRequest, RequestTabType, SentRequest } from '@/features/networks/types';
import { useConnectionSocket } from './useConnectionSocket';
import ConnectionService from '@/lib/api/connection.service';
import { useAuth } from '@/features/auth/hooks/useAuth';
import AuthService from '@/lib/api/auth.service';
import { useConnectionStats } from './useConnectionStats';
import ProfileService from '@/lib/api/profile.service';

export const useConnectionRequests = () => {
    const [requests, setRequests] = useState<ConnectionRequest[]>([]);
    const [sentRequests, setSentRequests] = useState<SentRequest[]>([])
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingSent, setIsLoadingSent] = useState(true);
    const [showRequestsPanel, setShowRequestsPanel] = useState(false);
    const [activeReqTab, setActiveReqTab] = useState<RequestTabType>('received');
    const { latestRequest } = useConnectionSocket();
    const { incrementFollowers, incrementConnections } = useConnectionStats();
    const { user } = useAuth();

    useEffect(() => {
        if (user?.userId) {
            fetchIncomingRequests();
            fetchOutgoingRequests();
        }
    }, [user]);

    useEffect(() => {
        if (latestRequest) {
            fetchIncomingRequests();
        }
    }, [latestRequest]);

    const fetchIncomingRequests = async () => {
        try {
            setIsLoading(true);
            const response = await ConnectionService.getIncomingRequests(user!.userId);

            const requestsArray = response.data.data;

            if (!Array.isArray(requestsArray)) {
                console.error('❌ Invalid response format');
                setRequests([]);
                return;
            }

            const fromUserIds = [...new Set(requestsArray.map((req: any) => req.fromUserId))] as string[];

            // ✅ SINGLE BULK CALL (pehle yahan har user ke liye alag call hota tha)
            let usersData: any[] = [];
            if (fromUserIds.length > 0) {
                try {
                    const bulkResponse = await AuthService.getUsersBulk(fromUserIds);
                    usersData = bulkResponse.data?.users || [];
                } catch (err) {
                    console.warn('⚠️ Failed to fetch users in bulk:', err);
                }
            }

            const profilePhotoIds = usersData
                .map((user: any) => user.profilePhotoId)
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

            const headlineIds = usersData
                .map((user: any) => user.headlineId)
                .filter(Boolean);

            // ✅ SINGLE BULK CALL (pehle yahan har headline ke liye alag call hota tha)
            let headlinesMap: Record<string, string> = {};
            if (headlineIds.length > 0) {
                try {
                    const headlinesResponse = await ProfileService.getMultipleHeadlinesByIds(headlineIds);
                    const headlines = headlinesResponse.data?.headlines || [];
                    headlinesMap = headlines.reduce((acc: Record<string, string>, headline: any) => {
                        acc[headline.headlineId] = headline.title;
                        return acc;
                    }, {});
                } catch (error) {
                    console.warn('⚠️ Failed to fetch headlines:', error);
                }
            }

            const usersDataMap = usersData.reduce((acc, user: any) => {
                acc[user.userId] = user;
                return acc;
            }, {} as Record<string, any>);

            const transformedRequests: ConnectionRequest[] = requestsArray.map((req: any) => {
                const userData = usersDataMap[req.fromUserId];

                const profileImageUrl = userData?.profilePhotoId
                    ? profilePhotosMap[userData.profilePhotoId] || null
                    : null;

                const headlineText = userData?.headlineId
                    ? headlinesMap[userData.headlineId] || null
                    : null;

                return {
                    id: req.requestId,
                    name: userData
                        ? `${userData.firstName} ${userData.lastName}`.trim()
                        : 'Unknown User',
                    title: headlineText || 'Professional',
                    mutuals: '0 mutual connections',
                    image: profileImageUrl || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdYRNQDghH1JvFXro2Yz3iWNmmFAubFZ-RGQ&s',
                    location: userData?.location || 'Unknown'
                };
            });

            setRequests(transformedRequests);
        } catch (error: any) {
            console.error('❌ Failed to fetch requests:', error.message);
            setRequests([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchOutgoingRequests = async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s max
        try {
            setIsLoadingSent(true);
            const response = await ConnectionService.getOutgoingRequests(user!.userId);
            clearTimeout(timeoutId);

            const requestsArray = response.data.data;

            if (!Array.isArray(requestsArray)) {
                console.error('❌ Invalid response format for outgoing requests');
                setSentRequests([]);
                return;
            }

            const toUserIds = [...new Set(requestsArray.map((req: any) => req.toUserId))] as string[];

            // ✅ SINGLE BULK CALL
            let usersData: any[] = [];
            if (toUserIds.length > 0) {
                try {
                    const bulkResponse = await AuthService.getUsersBulk(toUserIds);
                    usersData = bulkResponse.data?.users || [];
                } catch (err) {
                    console.warn('⚠️ Failed to fetch users in bulk:', err);
                }
            }

            const profilePhotoIds = usersData
                .map((user: any) => user.profilePhotoId)
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

            const headlineIds = usersData
                .map((user: any) => user.headlineId)
                .filter(Boolean);

            // ✅ SINGLE BULK CALL
            let headlinesMap: Record<string, string> = {};
            if (headlineIds.length > 0) {
                try {
                    const headlinesResponse = await ProfileService.getMultipleHeadlinesByIds(headlineIds);
                    const headlines = headlinesResponse.data?.headlines || [];
                    headlinesMap = headlines.reduce((acc: Record<string, string>, headline: any) => {
                        acc[headline.headlineId] = headline.title;
                        return acc;
                    }, {});
                } catch (error) {
                    console.warn('⚠️ Failed to fetch headlines:', error);
                }
            }

            const usersDataMap = usersData.reduce((acc, user: any) => {
                acc[user.userId] = user;
                return acc;
            }, {} as Record<string, any>);

            const transformedSentRequests: SentRequest[] = requestsArray.map((req: any) => {
                const userData = usersDataMap[req.toUserId];

                const profileImageUrl = userData?.profilePhotoId
                    ? profilePhotosMap[userData.profilePhotoId] || null
                    : null;

                const headlineText = userData?.headlineId
                    ? headlinesMap[userData.headlineId] || null
                    : null;

                return {
                    id: req.requestId,
                    name: userData
                        ? `${userData.firstName} ${userData.lastName}`.trim()
                        : 'Unknown User',
                    title: headlineText || 'Professional',
                    image: profileImageUrl || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdYRNQDghH1JvFXro2Yz3iWNmmFAubFZ-RGQ&s',
                };
            });

            setSentRequests(transformedSentRequests);
        } catch (error: any) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
                console.warn('⚠️ getOutgoingRequests timed out — showing empty sent list');
            } else {
                console.error('❌ Failed to fetch outgoing requests:', error.message);
            }
            setSentRequests([]);
        } finally {
            setIsLoadingSent(false);
        }
    };

    const toggleRequestsPanel = () => {
        setShowRequestsPanel(!showRequestsPanel);
    };

    const handleAccept = async (requestId: string) => {
        try {
            await ConnectionService.acceptConnectionRequest(requestId);
            setRequests(prev => prev.filter(req => req.id !== requestId));
            incrementFollowers();
            incrementConnections();
        } catch (error: any) {
            console.error('❌ Failed to accept:', error.message);
            alert(error.message || 'Failed to accept request');
        }
    };

    const handleIgnore = async (requestId: string) => {
        try {
            await ConnectionService.declineConnectionRequest(requestId);
            setRequests(prev => prev.filter(req => req.id !== requestId));
        } catch (error: any) {
            console.error('❌ Failed to decline:', error.message);
            alert(error.message || 'Failed to decline request');
        }
    };

    const handleWithdraw = async (requestId: string) => {
        try {
            await ConnectionService.cancelConnectionRequest(requestId);
            setSentRequests(prev => prev.filter(req => req.id !== requestId));
        } catch (error: any) {
            console.error('❌ Failed to withdraw:', error.message);
            alert(error.message || 'Failed to withdraw request');
        }
    };

    return {
        requests,
        sentRequests,
        isLoading,
        isLoadingSent,
        showRequestsPanel,
        activeReqTab,
        setActiveReqTab,
        handleAccept,
        handleIgnore,
        handleWithdraw,
        toggleRequestsPanel,
        refetch: fetchIncomingRequests,
        refetchSent: fetchOutgoingRequests,
    };
};