// hooks/studyGroup/useGroupData.ts

import { useState, useCallback, useRef } from 'react';
import AuthService from '@/lib/api/auth.service';
import StudyGroupService, { GroupResponse, GroupMember, GroupCategory, MyRequestsResponse } from '@/lib/api/studyGroup.service';
import ProfileService from '@/lib/api/profile.service';

// ─── Types ─────────────────────────────────────────────────

export interface UserInfo {
  userId: string;
  name: string;
  avatar: string | null;
  headline: string;
  email: string;
}

export interface EnrichedGroupMember {
  userId: string;
  role: 'leader' | 'admin' | 'member';
  joinedAt: string;
  lastActive?: string;
  name: string;
  avatar: string | null;
  headline: string;
}

// Module-level cache — shared across all hook instances
const globalUserCache: Record<string, UserInfo> = {};
const globalJoinRequestsMap: Record<string, MyRequestsResponse> = {};

// ─── Hook ─────────────────────────────────────────────────

export const useGroupData = () => {

  const [allGroups, setAllGroups] = useState<GroupResponse[]>([]);
  const [isLoadingAllGroups, setIsLoadingAllGroups] = useState(false);

  const [allUsers, setAllUsers] = useState<UserInfo[]>([]);
  const [isLoadingAllUsers, setIsLoadingAllUsers] = useState(false);

  const [groupMembers, setGroupMembers] = useState<EnrichedGroupMember[]>([]);
  const [isLoadingGroupMembers, setIsLoadingGroupMembers] = useState(false);

  const [groupCount, setGroupCount] = useState(0);

  const [publicGroups, setPublicGroups] = useState<GroupResponse[]>([]);
  const [isLoadingPublicGroups, setIsLoadingPublicGroups] = useState(false);

  const [privateGroups, setPrivateGroups] = useState<GroupResponse[]>([]);
  const [isLoadingPrivateGroups, setIsLoadingPrivateGroups] = useState(false);

  const [myJoinRequests, setMyJoinRequests] = useState<MyRequestsResponse[]>([]);
  const [isLoadingMyJoinRequests, setIsLoadingMyJoinRequests] = useState(false);

  const myJoinRequestsMap = useRef<Record<string, MyRequestsResponse>>({});

  const [error, setError] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────
  // INTERNAL: fetch profile + photo + headline for uncached userIds
  // ✅ Ab bulk calls use hote hain (pehle har user ke liye alag call hota tha)
  // ─────────────────────────────────────────────────────────

  const resolveUserIds = useCallback(async (userIds: string[]): Promise<void> => {
    const uncached = userIds.filter(id => id && !globalUserCache[id]);
    if (uncached.length === 0) return;

    // STEP 1 — SINGLE BULK CALL for all uncached users
    let profiles: any[] = [];
    try {
      const bulkResponse = await AuthService.getUsersBulk(uncached);
      profiles = bulkResponse.data?.users || [];
    } catch (err) {
      console.warn('⚠️ Failed to fetch users in bulk:', err);
    }

    // STEP 2 — getMultipleProfilePhotosByIds (batch)
    const photoIds = profiles.map((p: any) => p.profilePhotoId).filter(Boolean);
    let photosMap: Record<string, string> = {};
    if (photoIds.length > 0) {
      try {
        const res = await ProfileService.getMultipleProfilePhotosByIds(photoIds);
        photosMap = res.data.photos.reduce(
          (acc: Record<string, string>, photo: any) => {
            acc[photo.photoId] = photo.cloudinarySecureUrl;
            return acc;
          },
          {}
        );
      } catch {
        // photos are optional — continue without them
      }
    }

    // STEP 3 — SINGLE BULK CALL for headlines
    const headlineIds = profiles.map((p: any) => p.headlineId).filter(Boolean);
    let headlinesMap: Record<string, string> = {};
    if (headlineIds.length > 0) {
      try {
        const headlinesResponse = await ProfileService.getMultipleHeadlinesByIds(headlineIds);
        const headlines = headlinesResponse.data?.headlines || [];
        headlinesMap = headlines.reduce((acc: Record<string, string>, headline: any) => {
          acc[headline.headlineId] = headline.title;
          return acc;
        }, {});
      } catch {
        // headlines optional
      }
    }

    // STEP 4 — build UserInfo and write to cache
    profiles.forEach((p: any) => {
      globalUserCache[p.userId] = {
        userId: p.userId,
        name: `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim()
          || p.username
          || p.email?.split('@')[0]
          || p.userId.slice(0, 8),
        avatar: p.profilePhotoId
          ? (photosMap[p.profilePhotoId] ?? null)
          : null,
        headline: p.headlineId
          ? (headlinesMap[p.headlineId] ?? '')
          : '',
        email: p.email ?? '',
      };
    });

    // Placeholder for any that failed — prevents infinite retry
    uncached.forEach(id => {
      if (!globalUserCache[id]) {
        globalUserCache[id] = {
          userId: id,
          name: 'Unknown User',
          avatar: null,
          headline: '',
          email: '',
        };
      }
    });
  }, []);

  const fetchAllGroups = useCallback(async () => {
    try {
      setIsLoadingAllGroups(true);
      setError(null);
      const groups = await StudyGroupService.getMyGroups();
      setAllGroups(groups);
      setGroupCount(groups.length);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch groups');
    } finally {
      setIsLoadingAllGroups(false);
    }
  }, []);

  const fetchAllUsers = useCallback(async () => {
    try {
      setIsLoadingAllUsers(true);
      setError(null);

      const res = await AuthService.getAllUsers({ limit: 100 });
      const userIds: string[] = (res.data.users as any[]).map((u: any) => u.userId);

      await resolveUserIds(userIds);

      const enriched: UserInfo[] = userIds
        .map(id => globalUserCache[id])
        .filter(Boolean);

      setAllUsers(enriched);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setIsLoadingAllUsers(false);
    }
  }, [resolveUserIds]);

  const getUserInfo = useCallback(async (userId: string): Promise<UserInfo> => {
    if (globalUserCache[userId]) return globalUserCache[userId];
    await resolveUserIds([userId]);
    return globalUserCache[userId] ?? {
      userId,
      name: 'Unknown User',
      avatar: null,
      headline: '',
      email: '',
    };
  }, [resolveUserIds]);

  // Accepts a plain userId string, or a populated user object ({ _id | userId | id }).
  // Pehle sirf string assume hota tha: object aane par `userId.slice` TypeError deta tha
  // aur poora chat render crash ho jaata tha.
  const getUserInfoSync = useCallback(
    (
      user: string | { _id?: string; userId?: string; id?: string } | null | undefined
    ): UserInfo => {
      const userId =
        typeof user === 'string'
          ? user
          : user?.userId ?? user?._id ?? user?.id ?? '';
      return globalUserCache[userId] ?? {
        userId,
        name: userId ? userId.slice(0, 8) + '...' : 'Unknown',
        avatar: null,
        headline: '',
        email: '',
      };
    },
    []
  );

  const fetchGroupMembers = useCallback(async (groupId: string) => {
    try {
      setIsLoadingGroupMembers(true);
      setError(null);

      const res = await StudyGroupService.getGroupMembers(groupId);
      const rawMembers: GroupMember[] = res.members ?? [];

      const memberUserIds = rawMembers.map(m => m.userId).filter(Boolean);
      await resolveUserIds(memberUserIds);

      const enriched: EnrichedGroupMember[] = rawMembers.map(m => {
        const info = globalUserCache[m.userId];
        return {
          userId: m.userId,
          role: m.role as 'leader' | 'admin' | 'member',
          joinedAt: m.joinedAt,
          lastActive: m.lastActive,
          name: info?.name ?? m.userId.slice(0, 8),
          avatar: info?.avatar ?? null,
          headline: info?.headline ?? '',
        };
      });

      setGroupMembers(enriched);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch group members');
    } finally {
      setIsLoadingGroupMembers(false);
    }
  }, [resolveUserIds]);

  const fetchGroupCount = useCallback(async () => {
    try {
      const groups = await StudyGroupService.getMyGroups();
      setGroupCount(groups.length);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch group count');
    }
  }, []);

  const fetchPublicGroups = useCallback(async (filters?: {
    category?: GroupCategory;
    search?: string;
    limit?: number;
  }) => {
    try {
      setIsLoadingPublicGroups(true);
      setError(null);
      const res = await StudyGroupService.getGroups({
        visibility: 'public' as any,
        ...filters,
      });
      setPublicGroups(res.groups ?? []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch public groups');
    } finally {
      setIsLoadingPublicGroups(false);
    }
  }, []);

  const fetchPrivateGroups = useCallback(async (filters?: {
    category?: GroupCategory;
    search?: string;
    limit?: number;
  }) => {
    try {
      setIsLoadingPrivateGroups(true);
      setError(null);
      const res = await StudyGroupService.getGroups({
        visibility: 'private' as any,
        ...filters,
      });
      setPrivateGroups(res.groups ?? []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch private groups');
    } finally {
      setIsLoadingPrivateGroups(false);
    }
  }, []);

  const fetchMyJoinRequests = useCallback(async () => {
    try {
      setIsLoadingMyJoinRequests(true);
      const requests = await StudyGroupService.getMyJoinRequests();
      setMyJoinRequests(requests);

      myJoinRequestsMap.current = requests.reduce(
        (acc, req) => {
          acc[req.groupId] = req;
          return acc;
        },
        {} as Record<string, MyRequestsResponse>
      );
    } catch (err: any) {
      console.error('Failed to fetch join requests:', err.message);
    } finally {
      setIsLoadingMyJoinRequests(false);
    }
  }, []);

  const getJoinRequestForGroup = useCallback(
    (groupId: string): MyRequestsResponse | null => {
      return myJoinRequestsMap.current[groupId] ?? null;
    },
    []
  );

  const addJoinRequestToCache = useCallback(
    (request: MyRequestsResponse) => {
      myJoinRequestsMap.current[request.groupId] = request;
      setMyJoinRequests(prev => {
        const exists = prev.find(r => r.groupId === request.groupId);
        if (exists) {
          return prev.map(r => r.groupId === request.groupId ? request : r);
        }
        return [...prev, request];
      });
    },
    []
  );

  const removeJoinRequestFromCache = useCallback(
    (groupId: string) => {
      delete myJoinRequestsMap.current[groupId];
      setMyJoinRequests(prev => prev.filter(r => r.groupId !== groupId));
    },
    []
  );

  return {
    allGroups,
    isLoadingAllGroups,
    fetchAllGroups,

    allUsers,
    isLoadingAllUsers,
    fetchAllUsers,

    getUserInfo,
    getUserInfoSync,

    groupMembers,
    isLoadingGroupMembers,
    fetchGroupMembers,

    groupCount,
    fetchGroupCount,

    publicGroups,
    isLoadingPublicGroups,
    fetchPublicGroups,

    privateGroups,
    isLoadingPrivateGroups,
    fetchPrivateGroups,

    myJoinRequests,
    isLoadingMyJoinRequests,
    fetchMyJoinRequests,
    getJoinRequestForGroup,
    addJoinRequestToCache,
    removeJoinRequestFromCache,

    error,
  };
};