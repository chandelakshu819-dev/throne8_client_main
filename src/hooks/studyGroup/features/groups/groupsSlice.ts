// src/hooks/studyGroup/features/groups/groupsSlice.ts

// import { createSlice, createSelector, PayloadAction } from '@reduxjs/toolkit';
import { Group, GroupTabType, PublicGroup } from '@/app/studyGroup/study/groups/types';
import { createSlice, createSelector, PayloadAction } from '@reduxjs/toolkit';
import { ApiGroup, PaginationResult } from './groups.types';
import { addMemberThunk, attendanceAutoMarkThunk, attendanceCheckInThunk, cancelJoinRequestThunk, createGroupThunk, createLiveRoomThunk, deleteGroupThunk, endLiveRoomThunk, fetchAllUsersThunk, fetchAttendanceCalendarThunk, fetchAttendanceHistoryThunk, fetchAttendancePercentageThunk, fetchAttendanceStatusThunk, fetchAvailableGroupsThunk, fetchGroupActiveLiveRoomThunk, fetchGroupByIdThunk, fetchGroupInviteLinksThunk, fetchGroupMembersThunk, fetchGroupsByCategoryThunk, fetchGroupsThunk, fetchInviteAnalyticsThunk, fetchMyGroupsThunk, fetchPlacementGroupsThunk, fetchPopularGroupsThunk, fetchPublicGroupsThunk, fetchRecommendedGroupsThunk, fetchSocialShareLinksThunk, fetchTopRankedGroupsThunk, fetchTrendingGroupsThunk, fetchUniversityGroupsThunk, fetchUserStreakThunk, generateInviteLinkThunk, generateQRCodeThunk, getGroupPendingRequestsThunk, getJoinRequestStatusThunk, getMemberCountThunk, getMyJoinRequestsThunk, joinGroupThunk, joinLiveRoomThunk, leaveGroupThunk, leaveLiveRoomThunk, removeMemberThunk, respondToJoinRequestThunk, revokeInviteLinkThunk, searchGroupsByTagsThunk, searchGroupsThunk, sendJoinRequestThunk, toggleCameraThunk, toggleMicThunk, toggleScreenShareThunk, updateGroupThunk, validateInviteCodeThunk } from './group.thunks';
import { AttendanceCalendarResponse, AttendanceHistoryResponse, AttendancePercentageResponse, AttendanceStatusResponse, GroupMember, GroupResponse, InviteAnalyticsResponse, InviteLinkDetail, InviteLinkResponse, JoinRequestStatusResponse, MyRequestsResponse, PendingJoinRequest, QRCodeResponse, SocialShareLinksResponse, TopRankedGroupResponse } from '@/lib/api/studyGroup.service';
// import type { Group, GroupTabType, PublicGroup } from '../../types';

// ─── State ───────────────────────────────────────────────────────────────────

interface ExpandedSections {
  university: boolean;
  dsa: boolean;
  jee: boolean;
  public: boolean;
}

interface GroupsState {

  allUsers: any[];
  allUsersLoading: boolean;

  items: Group[];
  activeTab: GroupTabType;
  searchQuery: string;
  settingsGroupId: number | null;
  browseItems: Group[];
  publicGroups: PublicGroup[];
  joinedGroupIds: number[];
  browseSearchQuery: string;
  isCreateModalOpen: boolean;
  expandedSections: ExpandedSections;

  apiGroups: ApiGroup[];
  isApiLoading: boolean;
  apiError: string | null;
  selectedGroup: GroupResponse | null;     // ← for single group page
  allGroups: GroupResponse[];              // ← for browse groups list
  allGroupsTotal: number;
  allGroupsLoading: boolean;
  selectedGroupLoading: boolean;
  myGroups: GroupResponse[];
  myGroupsLoading: boolean;
  groupMembers: GroupMember[];           // members of currently viewed group
  groupMembersLoading: boolean;
  joinLoading: boolean;
  joiningGroupId: string | null; // ← ADD this
  leaveLoading: boolean;
  deleteLoading: boolean;
  updateLoading: boolean;
  topRankedGroups: TopRankedGroupResponse[];        // ← import this type
  topRankedGroupsLoading: boolean;


  addMemberLoading: boolean;
  removeMemberLoading: boolean;
  memberCount: { groupId: string; memberCount: number; capacity: number; availableSlots: number } | null;
  memberCountLoading: boolean;

  // ADD inside GroupsState interface after topRankedGroupsLoading

  // ── Search ──
  searchResults: GroupResponse[];
  searchResultsTotal: number;
  searchResultsLoading: boolean;
  searchPagination: PaginationResult | null;

  // ── Popular ──
  popularGroups: GroupResponse[];
  popularGroupsLoading: boolean;

  // ── Trending ──
  trendingGroups: GroupResponse[];
  trendingGroupsLoading: boolean;

  // ── Recommended ──
  recommendedGroups: GroupResponse[];
  recommendedGroupsLoading: boolean;

  // ── By Category ──
  categoryGroups: GroupResponse[];
  categoryGroupsLoading: boolean;
  activeCategoryFilter: string | null;

  // ── Available ──
  availableGroups: GroupResponse[];
  availableGroupsLoading: boolean;

  // ── By Tags ──
  tagGroups: GroupResponse[];
  tagGroupsLoading: boolean;

  // ADD after categoryGroups
  universityGroups: GroupResponse[];
  universityGroupsLoading: boolean;
  placementGroups: GroupResponse[];
  placementGroupsLoading: boolean;
  publicGroupsFromApi: GroupResponse[];
  publicGroupsFromApiLoading: boolean;

  // JOIN REQUESTS — user side
  joinRequests: MyRequestsResponse[];
  joinRequestsLoading: boolean;
  joinRequestStatus: Record<string, JoinRequestStatusResponse>; // groupId => status
  joinRequestStatusLoading: boolean;
  sendRequestLoading: boolean;
  cancelRequestLoading: boolean;

  // Leader side — pending requests
  pendingRequests: Record<string, PendingJoinRequest[]>; // groupId => requests
  pendingRequestsTotal: Record<string, number>;
  pendingRequestsLoading: boolean;
  respondToRequestLoading: boolean;

  //LIVE ROOM 
  // Live Room
  activeLiveRoom: any | null;
  activeLiveRoomLoading: boolean;
  liveRoomActionLoading: boolean;
  liveRoomError: string | null;
  // Local media state (UI only — not from backend)
  localCameraOn: boolean;
  localMicOn: boolean;
  localScreenShareOn: boolean;

  // ── Attendance ──
  attendanceStatus: AttendanceStatusResponse | null;
  attendanceStatusLoading: boolean;
  attendanceCheckInLoading: boolean;
  attendanceAutoMarkLoading: boolean;
  attendancePercentage: AttendancePercentageResponse | null;
  attendancePercentageLoading: boolean;
  attendanceHistory: AttendanceHistoryResponse | null;
  attendanceHistoryLoading: boolean;
  attendanceCalendar: AttendanceCalendarResponse | null;
  attendanceCalendarLoading: boolean;
  attendanceError: string | null;

  // ── Streak ──
  userStreak: number;
  userStreakLoading: boolean;

  // ── Share ──
  shareInviteLink: (InviteLinkResponse & { groupId: string }) | null;
  shareInviteLinkLoading: boolean;
  shareQRCode: (QRCodeResponse & { groupId: string }) | null;
  shareQRCodeLoading: boolean;
  shareValidatedGroupId: string | null;
  shareValidateLoading: boolean;
  shareSocialLinks: (SocialShareLinksResponse & { groupId: string }) | null;
  shareSocialLinksLoading: boolean;
  shareAnalytics: (InviteAnalyticsResponse & { groupId: string }) | null;
  shareAnalyticsLoading: boolean;
  shareInviteLinks: Record<string, InviteLinkDetail[]>; // groupId => links[]
  shareInviteLinksLoading: boolean;
  shareRevokeLoading: boolean;
  shareError: string | null;
}

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: GroupsState = {
  items: [],

  allUsers: [],
  allUsersLoading: false,


  activeTab: 'all',
  searchQuery: '',
  settingsGroupId: null,
  browseItems: [],
  publicGroups: [],
  joinedGroupIds: [],
  browseSearchQuery: '',
  isCreateModalOpen: false,
  expandedSections: {
    university: false,
    dsa: false,
    jee: false,
    public: false,
  },
  apiGroups: [],
  isApiLoading: false,
  apiError: null,
  selectedGroup: null,
  allGroups: [],
  allGroupsTotal: 0,
  allGroupsLoading: false,
  selectedGroupLoading: false,
  myGroups: [],
  myGroupsLoading: false,
  groupMembers: [],
  groupMembersLoading: false,
  joinLoading: false,
  // ADD
  joiningGroupId: null,
  leaveLoading: false,
  deleteLoading: false,
  updateLoading: false,
  topRankedGroups: [],
  topRankedGroupsLoading: false,


  addMemberLoading: false,
  removeMemberLoading: false,
  memberCount: null,
  memberCountLoading: false,

  // ADD inside initialState object

  searchResults: [],
  searchResultsTotal: 0,
  searchResultsLoading: false,
  searchPagination: null,

  popularGroups: [],
  popularGroupsLoading: false,

  trendingGroups: [],
  trendingGroupsLoading: false,

  recommendedGroups: [],
  recommendedGroupsLoading: false,

  categoryGroups: [],
  categoryGroupsLoading: false,
  activeCategoryFilter: null,

  availableGroups: [],
  availableGroupsLoading: false,

  tagGroups: [],
  tagGroupsLoading: false,
  // ADD
  universityGroups: [],
  universityGroupsLoading: false,
  placementGroups: [],
  placementGroupsLoading: false,
  publicGroupsFromApi: [],
  publicGroupsFromApiLoading: false,

  joinRequests: [],
  joinRequestsLoading: false,
  joinRequestStatus: {},
  joinRequestStatusLoading: false,
  sendRequestLoading: false,
  cancelRequestLoading: false,
  pendingRequests: {},
  pendingRequestsTotal: {},
  pendingRequestsLoading: false,
  respondToRequestLoading: false,

  activeLiveRoom: null,
  activeLiveRoomLoading: false,
  liveRoomActionLoading: false,
  liveRoomError: null,
  localCameraOn: false,
  localMicOn: false,
  localScreenShareOn: false,

  // Attendance
  attendanceStatus: null,
  attendanceStatusLoading: false,
  attendanceCheckInLoading: false,
  attendanceAutoMarkLoading: false,
  attendancePercentage: null,
  attendancePercentageLoading: false,
  attendanceHistory: null,
  attendanceHistoryLoading: false,
  attendanceCalendar: null,
  attendanceCalendarLoading: false,
  attendanceError: null,
  userStreak: 0,
  userStreakLoading: false,

  // Share
  shareInviteLink: null,
  shareInviteLinkLoading: false,
  shareQRCode: null,
  shareQRCodeLoading: false,
  shareValidatedGroupId: null,
  shareValidateLoading: false,
  shareSocialLinks: null,
  shareSocialLinksLoading: false,
  shareAnalytics: null,
  shareAnalyticsLoading: false,
  shareInviteLinks: {},
  shareInviteLinksLoading: false,
  shareRevokeLoading: false,
  shareError: null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const groupsSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    // my-groups
    updateGroup: (state, action: PayloadAction<{ id: number; data: Partial<Group> }>) => {
      const index = state.items.findIndex(g => g.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...action.payload.data };
      }
    },
    deleteGroup: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter(g => g.id !== action.payload);
      if (state.settingsGroupId === action.payload) state.settingsGroupId = null;
    },
    leaveGroup: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter(g => g.id !== action.payload);
      if (state.settingsGroupId === action.payload) state.settingsGroupId = null;
    },
    setActiveTab: (state, action: PayloadAction<GroupTabType>) => {
      state.activeTab = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    openSettings: (state, action: PayloadAction<number>) => {
      state.settingsGroupId = action.payload;
    },
    closeSettings: (state) => {
      state.settingsGroupId = null;
    },

    // browse-groups
    seedBrowseGroups: (
      state,
      action: PayloadAction<{ browseItems: Group[]; publicGroups: PublicGroup[] }>
    ) => {
      if (state.browseItems.length === 0) state.browseItems = action.payload.browseItems;
      if (state.publicGroups.length === 0) state.publicGroups = action.payload.publicGroups;
    },
    joinGroup: (state, action: PayloadAction<number>) => {
      const id = action.payload;
      if (state.joinedGroupIds.includes(id)) return;
      state.joinedGroupIds.push(id);
      const group = state.browseItems.find(g => g.id === id);
      if (group && group.members < group.capacity) group.members += 1;
    },
    unjoinGroup: (state, action: PayloadAction<number>) => {
      const id = action.payload;
      state.joinedGroupIds = state.joinedGroupIds.filter(gid => gid !== id);
      const group = state.browseItems.find(g => g.id === id);
      if (group && group.members > 0) group.members -= 1;
    },
    setBrowseSearchQuery: (state, action: PayloadAction<string>) => {
      state.browseSearchQuery = action.payload;
    },
    openCreateModal: (state) => { state.isCreateModalOpen = true; },
    closeCreateModal: (state) => { state.isCreateModalOpen = false; },
    toggleSectionExpanded: (state, action: PayloadAction<keyof ExpandedSections>) => {
      state.expandedSections[action.payload] = !state.expandedSections[action.payload];
    },

    addApiGroup: (state, action: PayloadAction<ApiGroup>) => {
      state.apiGroups.unshift(action.payload); // new group at top
    },
    setApiLoading: (state, action: PayloadAction<boolean>) => {
      state.isApiLoading = action.payload;
    },
    setApiError: (state, action: PayloadAction<string | null>) => {
      state.apiError = action.payload;
    },
    setApiGroups: (state, action: PayloadAction<ApiGroup[]>) => {
      state.apiGroups = action.payload;
    },
    // FIND in groupsSlice.ts reducers section
    // ADD a new reducer
    clearSelectedGroup: (state) => {
      state.selectedGroup = null;
      state.selectedGroupLoading = false;
    },

    setLocalCamera: (state, action: PayloadAction<boolean>) => {
      state.localCameraOn = action.payload;
    },
    setLocalMic: (state, action: PayloadAction<boolean>) => {
      state.localMicOn = action.payload;
    },
    setLocalScreenShare: (state, action: PayloadAction<boolean>) => {
      state.localScreenShareOn = action.payload;
    },
    clearActiveLiveRoom: (state) => {
      state.activeLiveRoom = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllUsersThunk.pending, (state) => { state.allUsersLoading = true; })
      .addCase(fetchAllUsersThunk.fulfilled, (state, action) => {
        state.allUsersLoading = false;
        state.allUsers = Array.isArray(action.payload) ? action.payload : (action.payload as any)?.users ?? [];
      })
      .addCase(fetchAllUsersThunk.rejected, (state) => { state.allUsersLoading = false; });

    builder
      .addCase(createGroupThunk.pending, (state) => {
        state.isApiLoading = true;
        state.apiError = null;
      })
      // .addCase(createGroupThunk.fulfilled, (state, action) => {
      //   state.isApiLoading = false;
      //   state.apiGroups.unshift(action.payload as any);
      // })
      .addCase(createGroupThunk.fulfilled, (state, action) => {
        state.isApiLoading = false;
        state.apiGroups.unshift(action.payload as any);

        const newGroup = action.payload;

        // Auto-add to correct category section
        if (newGroup.category === 'College Students') {
          state.universityGroups.unshift(newGroup);
        }

        if (
          newGroup.category === 'Competitive Examinations' ||
          newGroup.category === 'Placement Preparation'
        ) {
          state.placementGroups.unshift(newGroup);
        }

        // Add to public section if public
        if (newGroup.visibility === 'public') {
          state.publicGroupsFromApi.unshift(newGroup);
        }

        // Add to myGroups since creator is also member
        state.myGroups.unshift(newGroup);

        // Add to topRanked if it scores high (simple check — add and re-sort in UI)
        state.topRankedGroups.unshift(newGroup as any);
      })
      .addCase(createGroupThunk.rejected, (state, action) => {
        state.isApiLoading = false;
        state.apiError = action.payload as string;
      });

    // fetch all groups
    builder
      .addCase(fetchGroupsThunk.pending, (state) => {
        state.allGroupsLoading = true;
        state.apiError = null;
      })
      .addCase(fetchGroupsThunk.fulfilled, (state, action) => {
        state.allGroupsLoading = false;
        state.allGroups = action.payload.groups;
        state.allGroupsTotal = action.payload.total;
      })
      .addCase(fetchGroupsThunk.rejected, (state, action) => {
        state.allGroupsLoading = false;
        state.apiError = action.payload as string;
      });

    builder
      .addCase(fetchTopRankedGroupsThunk.pending, (state) => {
        state.topRankedGroupsLoading = true;
        state.apiError = null;
      })
      .addCase(fetchTopRankedGroupsThunk.fulfilled, (state, action) => {
        state.topRankedGroupsLoading = false;
        state.topRankedGroups = action.payload;
      })
      .addCase(fetchTopRankedGroupsThunk.rejected, (state, action) => {
        state.topRankedGroupsLoading = false;
        state.apiError = action.payload as string;
      });

    // fetch single group
    builder
      // groupsSlice.ts
      .addCase(fetchGroupByIdThunk.fulfilled, (state, action) => {
        state.selectedGroupLoading = false;
        state.selectedGroup = action.payload;
      })
      .addCase(fetchGroupByIdThunk.pending, (state) => {
        state.selectedGroupLoading = true;
      })
      .addCase(fetchGroupByIdThunk.rejected, (state, action) => {
        state.selectedGroupLoading = false;
      })

    builder
      .addCase(fetchMyGroupsThunk.pending, (state) => {
        state.myGroupsLoading = true;
      })
      .addCase(fetchMyGroupsThunk.fulfilled, (state, action) => {
        state.myGroupsLoading = false;
        state.myGroups = action.payload;
      })
      .addCase(fetchMyGroupsThunk.rejected, (state, action) => {
        state.myGroupsLoading = false;
        state.apiError = action.payload as string;
      });

    // fetch members
    builder
      .addCase(fetchGroupMembersThunk.pending, (state) => {
        state.groupMembersLoading = true;
      })
      .addCase(fetchGroupMembersThunk.fulfilled, (state, action) => {
        state.groupMembersLoading = false;
        const payload = action.payload as any;
        state.groupMembers = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.members)
            ? payload.members
            : [];
      })
      .addCase(fetchGroupMembersThunk.rejected, (state, action) => {
        state.groupMembersLoading = false;
        state.apiError = action.payload as string;
      });

    // join group
    builder
      .addCase(joinGroupThunk.pending, (state, action) => {
        state.joinLoading = true;
        state.joiningGroupId = action.meta.arg.groupId; // ← track which group
      })

      .addCase(joinGroupThunk.fulfilled, (state, action) => {
        state.joinLoading = false;
        state.joiningGroupId = null

        const gId = action.payload.groupId;

        // update allGroups
        const idx = state.allGroups.findIndex(g => g.groupId === gId);
        if (idx !== -1) state.allGroups[idx] = action.payload;

        // update universityGroups
        const uIdx = state.universityGroups.findIndex(g => g.groupId === gId);
        if (uIdx !== -1) state.universityGroups[uIdx] = action.payload;

        // update placementGroups
        const pIdx = state.placementGroups.findIndex(g => g.groupId === gId);
        if (pIdx !== -1) state.placementGroups[pIdx] = action.payload;

        // update publicGroupsFromApi
        const pubIdx = state.publicGroupsFromApi.findIndex(g => g.groupId === gId);
        if (pubIdx !== -1) state.publicGroupsFromApi[pubIdx] = action.payload;

        // add to myGroups if not already there
        const alreadyInMy = state.myGroups.some(g => g.groupId === gId);
        if (!alreadyInMy) state.myGroups.push(action.payload);
      })
      .addCase(joinGroupThunk.rejected, (state, action) => {
        state.joinLoading = false;
        state.apiError = action.payload as string;
      });

    // leave group
    builder
      .addCase(leaveGroupThunk.pending, (state) => { state.leaveLoading = true; })
      .addCase(leaveGroupThunk.fulfilled, (state, action) => {
        state.leaveLoading = false;
        state.myGroups = state.myGroups.filter(g => g.groupId !== action.payload);
      })
      .addCase(leaveGroupThunk.rejected, (state, action) => {
        state.leaveLoading = false;
        state.apiError = action.payload as string;
      });

    // delete group
    builder
      .addCase(deleteGroupThunk.pending, (state) => { state.deleteLoading = true; })
      .addCase(deleteGroupThunk.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.myGroups = state.myGroups.filter(g => g.groupId !== action.payload);
        state.allGroups = state.allGroups.filter(g => g.groupId !== action.payload);
      })
      .addCase(deleteGroupThunk.rejected, (state, action) => {
        state.deleteLoading = false;
        state.apiError = action.payload as string;
      });

    // update group
    builder
      .addCase(updateGroupThunk.pending, (state) => { state.updateLoading = true; })
      .addCase(updateGroupThunk.fulfilled, (state, action) => {
        state.updateLoading = false;
        // update in allGroups
        const idx = state.allGroups.findIndex(g => g.groupId === action.payload.groupId);
        if (idx !== -1) state.allGroups[idx] = action.payload;
        // update in myGroups
        const myIdx = state.myGroups.findIndex(g => g.groupId === action.payload.groupId);
        if (myIdx !== -1) state.myGroups[myIdx] = action.payload;
        // update selectedGroup if same
        if (state.selectedGroup?.groupId === action.payload.groupId) {
          state.selectedGroup = action.payload;
        }
      })
      .addCase(updateGroupThunk.rejected, (state, action) => {
        state.updateLoading = false;
        state.apiError = action.payload as string;
      });

    // add member
    builder
      .addCase(addMemberThunk.pending, (state) => { state.addMemberLoading = true; })
      .addCase(addMemberThunk.fulfilled, (state, action) => {
        state.addMemberLoading = false;
        // selectedGroup ka member count update karo
        if (state.selectedGroup?.groupId === action.payload.groupId) {
          state.selectedGroup.currentMemberCount += 1;
        }
      })
      .addCase(addMemberThunk.rejected, (state, action) => {
        state.addMemberLoading = false;
        state.apiError = action.payload as string;
      });

    // remove member
    builder
      .addCase(removeMemberThunk.pending, (state) => { state.removeMemberLoading = true; })
      .addCase(removeMemberThunk.fulfilled, (state, action) => {
        state.removeMemberLoading = false;
        // groupMembers list se remove karo
        state.groupMembers = state.groupMembers.filter(
          m => m.userId !== action.payload.userId
        );
        // selectedGroup ka count bhi update karo
        if (state.selectedGroup?.groupId === action.payload.groupId) {
          state.selectedGroup.currentMemberCount = Math.max(
            0, state.selectedGroup.currentMemberCount - 1
          );
        }
      })
      .addCase(removeMemberThunk.rejected, (state, action) => {
        state.removeMemberLoading = false;
        state.apiError = action.payload as string;
      });

    // member count
    builder
      .addCase(getMemberCountThunk.pending, (state) => { state.memberCountLoading = true; })
      .addCase(getMemberCountThunk.fulfilled, (state, action) => {
        state.memberCountLoading = false;
        state.memberCount = action.payload;
      })
      .addCase(getMemberCountThunk.rejected, (state, action) => {
        state.memberCountLoading = false;
        state.apiError = action.payload as string;
      });

    // ── Search Groups ──
    builder
      .addCase(searchGroupsThunk.pending, (state) => {
        state.searchResultsLoading = true;
        state.apiError = null;
      })
      .addCase(searchGroupsThunk.fulfilled, (state, action) => {
        state.searchResultsLoading = false;
        state.searchResults = action.payload.groups;
        state.searchResultsTotal = action.payload.pagination.totalItems;
        state.searchPagination = action.payload.pagination;
      })
      .addCase(searchGroupsThunk.rejected, (state, action) => {
        state.searchResultsLoading = false;
        state.apiError = action.payload as string;
      });

    // ── Popular Groups ──
    builder
      .addCase(fetchPopularGroupsThunk.pending, (state) => {
        state.popularGroupsLoading = true;
      })
      .addCase(fetchPopularGroupsThunk.fulfilled, (state, action) => {
        state.popularGroupsLoading = false;
        state.popularGroups = action.payload.groups;
      })
      .addCase(fetchPopularGroupsThunk.rejected, (state, action) => {
        state.popularGroupsLoading = false;
        state.apiError = action.payload as string;
      });

    // ── Trending Groups ──
    builder
      .addCase(fetchTrendingGroupsThunk.pending, (state) => {
        state.trendingGroupsLoading = true;
      })
      .addCase(fetchTrendingGroupsThunk.fulfilled, (state, action) => {
        state.trendingGroupsLoading = false;
        state.trendingGroups = action.payload.groups;
      })
      .addCase(fetchTrendingGroupsThunk.rejected, (state, action) => {
        state.trendingGroupsLoading = false;
        state.apiError = action.payload as string;
      });

    // ── Recommended Groups ──
    builder
      .addCase(fetchRecommendedGroupsThunk.pending, (state) => {
        state.recommendedGroupsLoading = true;
      })
      .addCase(fetchRecommendedGroupsThunk.fulfilled, (state, action) => {
        state.recommendedGroupsLoading = false;
        state.recommendedGroups = action.payload.groups;
      })
      .addCase(fetchRecommendedGroupsThunk.rejected, (state, action) => {
        state.recommendedGroupsLoading = false;
        state.apiError = action.payload as string;
      });

    // ── Groups By Category ──
    builder
      .addCase(fetchGroupsByCategoryThunk.pending, (state) => {
        state.categoryGroupsLoading = true;
      })
      .addCase(fetchGroupsByCategoryThunk.fulfilled, (state, action) => {
        state.categoryGroupsLoading = false;
        state.categoryGroups = action.payload.groups;
        state.activeCategoryFilter = action.payload.category;
      })
      .addCase(fetchGroupsByCategoryThunk.rejected, (state, action) => {
        state.categoryGroupsLoading = false;
        state.apiError = action.payload as string;
      });

    // ── Available Groups ──
    builder
      .addCase(fetchAvailableGroupsThunk.pending, (state) => {
        state.availableGroupsLoading = true;
      })
      .addCase(fetchAvailableGroupsThunk.fulfilled, (state, action) => {
        state.availableGroupsLoading = false;
        state.availableGroups = action.payload.groups;
      })
      .addCase(fetchAvailableGroupsThunk.rejected, (state, action) => {
        state.availableGroupsLoading = false;
        state.apiError = action.payload as string;
      });

    // ── Search By Tags ──
    builder
      .addCase(searchGroupsByTagsThunk.pending, (state) => {
        state.tagGroupsLoading = true;
      })
      .addCase(searchGroupsByTagsThunk.fulfilled, (state, action) => {
        state.tagGroupsLoading = false;
        state.tagGroups = action.payload.groups;
      })
      .addCase(searchGroupsByTagsThunk.rejected, (state, action) => {
        state.tagGroupsLoading = false;
        state.apiError = action.payload as string;
      });

    // ADD after existing extraReducers

    // ── University Groups ──
    builder
      .addCase(fetchUniversityGroupsThunk.pending, (state) => {
        state.universityGroupsLoading = true;
      })
      .addCase(fetchUniversityGroupsThunk.fulfilled, (state, action) => {
        state.universityGroupsLoading = false;
        state.universityGroups = action.payload;
      })
      .addCase(fetchUniversityGroupsThunk.rejected, (state, action) => {
        state.universityGroupsLoading = false;
        state.apiError = action.payload as string;
      });

    // ── Placement Groups ──
    builder
      .addCase(fetchPlacementGroupsThunk.pending, (state) => {
        state.placementGroupsLoading = true;
      })
      .addCase(fetchPlacementGroupsThunk.fulfilled, (state, action) => {
        state.placementGroupsLoading = false;
        state.placementGroups = action.payload;
      })
      .addCase(fetchPlacementGroupsThunk.rejected, (state, action) => {
        state.placementGroupsLoading = false;
        state.apiError = action.payload as string;
      });

    // ── Public Groups ──
    builder
      .addCase(fetchPublicGroupsThunk.pending, (state) => {
        state.publicGroupsFromApiLoading = true;
      })
      .addCase(fetchPublicGroupsThunk.fulfilled, (state, action) => {
        state.publicGroupsFromApiLoading = false;
        state.publicGroupsFromApi = action.payload;
      })
      .addCase(fetchPublicGroupsThunk.rejected, (state, action) => {
        state.publicGroupsFromApiLoading = false;
        state.apiError = action.payload as string;
      });

    // ── Send Join Request ──
    builder
      .addCase(sendJoinRequestThunk.pending, (state) => {
        state.sendRequestLoading = true;
      })
      .addCase(sendJoinRequestThunk.fulfilled, (state, action) => {
        state.sendRequestLoading = false;
        // update joinRequestStatus for that groupId
        state.joinRequestStatus[action.payload.groupId] = {
          hasRequest: true,
          joinRequestId: action.payload.joinRequestId,
          status: action.payload.status,
          message: action.payload.message,
          expiresAt: action.payload.expiresAt,
          createdAt: action.payload.createdAt,
        };
      })
      .addCase(sendJoinRequestThunk.rejected, (state, action) => {
        state.sendRequestLoading = false;
        state.apiError = action.payload as string;
      });

    // ── Cancel Join Request ──
    builder
      .addCase(cancelJoinRequestThunk.pending, (state) => {
        state.cancelRequestLoading = true;
      })
      .addCase(cancelJoinRequestThunk.fulfilled, (state, action) => {
        state.cancelRequestLoading = false;
        // groupId = action.payload
        if (state.joinRequestStatus[action.payload]) {
          state.joinRequestStatus[action.payload] = {
            hasRequest: false,
          };
        }
        // joinRequests list se bhi remove karo
        state.joinRequests = state.joinRequests.filter(
          (r) => r.groupId !== action.payload
        );
      })
      .addCase(cancelJoinRequestThunk.rejected, (state, action) => {
        state.cancelRequestLoading = false;
        state.apiError = action.payload as string;
      });

    // ── Get Join Request Status ──
    builder
      .addCase(getJoinRequestStatusThunk.pending, (state) => {
        state.joinRequestStatusLoading = true;
      })
      .addCase(getJoinRequestStatusThunk.fulfilled, (state, action) => {
        state.joinRequestStatusLoading = false;
        state.joinRequestStatus[action.payload.groupId] = action.payload;
      })
      .addCase(getJoinRequestStatusThunk.rejected, (state, action) => {
        state.joinRequestStatusLoading = false;
        state.apiError = action.payload as string;
      });

    // ── Get My Join Requests ──
    builder
      .addCase(getMyJoinRequestsThunk.pending, (state) => {
        state.joinRequestsLoading = true;
      })
      .addCase(getMyJoinRequestsThunk.fulfilled, (state, action) => {
        state.joinRequestsLoading = false;
        state.joinRequests = action.payload;
      })
      .addCase(getMyJoinRequestsThunk.rejected, (state, action) => {
        state.joinRequestsLoading = false;
        state.apiError = action.payload as string;
      });

    // ── Get Pending Requests ──
    builder
      .addCase(getGroupPendingRequestsThunk.pending, (state) => {
        state.pendingRequestsLoading = true;
      })
      .addCase(getGroupPendingRequestsThunk.fulfilled, (state, action) => {
        state.pendingRequestsLoading = false;
        const { groupId, requests, total } = action.payload;
        state.pendingRequests[groupId] = requests;
        state.pendingRequestsTotal[groupId] = total;
      })
      .addCase(getGroupPendingRequestsThunk.rejected, (state, action) => {
        state.pendingRequestsLoading = false;
        state.apiError = action.payload as string;
      });

    // ── Respond To Request ──
    builder
      .addCase(respondToJoinRequestThunk.pending, (state) => {
        state.respondToRequestLoading = true;
      })
      .addCase(respondToJoinRequestThunk.fulfilled, (state, action) => {
        state.respondToRequestLoading = false;
        const { groupId, joinRequestId } = action.payload;

        // Remove from pending list
        if (state.pendingRequests[groupId]) {
          state.pendingRequests[groupId] = state.pendingRequests[groupId].filter(
            (r) => r.joinRequestId !== joinRequestId
          );
          // total bhi update karo
          if (state.pendingRequestsTotal[groupId] > 0) {
            state.pendingRequestsTotal[groupId] -= 1;
          }
        }

        // Agar approve hua toh myGroups ka member count update karo
        if (action.payload.action === 'approve') {
          const groupIdx = state.myGroups.findIndex(g => g.groupId === groupId);
          if (groupIdx !== -1) {
            state.myGroups[groupIdx] = {
              ...state.myGroups[groupIdx],
              currentMemberCount: state.myGroups[groupIdx].currentMemberCount + 1,
            };
          }
        }
      })
      .addCase(respondToJoinRequestThunk.rejected, (state, action) => {
        state.respondToRequestLoading = false;
        state.apiError = action.payload as string;
      });

    // ── Live Room ──
    builder
      .addCase(createLiveRoomThunk.pending, (state) => { state.liveRoomActionLoading = true; state.liveRoomError = null; })
      .addCase(createLiveRoomThunk.fulfilled, (state, action) => { state.liveRoomActionLoading = false; state.activeLiveRoom = action.payload; })
      .addCase(createLiveRoomThunk.rejected, (state, action) => { state.liveRoomActionLoading = false; state.liveRoomError = action.payload as string; });

    builder
      .addCase(fetchGroupActiveLiveRoomThunk.pending, (state) => { state.activeLiveRoomLoading = true; })
      .addCase(fetchGroupActiveLiveRoomThunk.fulfilled, (state, action) => { state.activeLiveRoomLoading = false; state.activeLiveRoom = action.payload; })
      .addCase(fetchGroupActiveLiveRoomThunk.rejected, (state) => { state.activeLiveRoomLoading = false; state.activeLiveRoom = null; });

    builder
      .addCase(joinLiveRoomThunk.pending, (state) => { state.liveRoomActionLoading = true; })
      .addCase(joinLiveRoomThunk.fulfilled, (state, action) => { state.liveRoomActionLoading = false; state.activeLiveRoom = action.payload; })
      .addCase(joinLiveRoomThunk.rejected, (state, action) => { state.liveRoomActionLoading = false; state.liveRoomError = action.payload as string; });

    builder
      .addCase(leaveLiveRoomThunk.fulfilled, (state) => { state.activeLiveRoom = null; state.localCameraOn = false; state.localMicOn = false; state.localScreenShareOn = false; })

    builder
      .addCase(endLiveRoomThunk.fulfilled, (state) => { state.activeLiveRoom = null; state.localCameraOn = false; state.localMicOn = false; state.localScreenShareOn = false; });

    builder
      .addCase(toggleCameraThunk.fulfilled, (state, action) => { state.localCameraOn = action.payload.cameraOn; });

    builder
      .addCase(toggleMicThunk.fulfilled, (state, action) => { state.localMicOn = action.payload.micOn; });

    builder
      .addCase(toggleScreenShareThunk.fulfilled, (state, action) => { state.localScreenShareOn = action.payload.sharing; });


    // ── Attendance Check In ──
    builder
      .addCase(attendanceCheckInThunk.pending, (state) => {
        state.attendanceCheckInLoading = true;
        state.attendanceError = null;
      })
      .addCase(attendanceCheckInThunk.fulfilled, (state, action) => {
        state.attendanceCheckInLoading = false;
        // Update status immediately after check-in
        state.attendanceStatus = {
          todayStatus: action.payload.status,
          hasCheckedInToday: true,
          checkInTime: action.payload.checkInTime,
          totalActiveTime: 0,
          isActive: true,
        };
        if (state.userStreak === 0) {
          state.userStreak = 1;
        }
      })
      .addCase(attendanceCheckInThunk.rejected, (state, action) => {
        state.attendanceCheckInLoading = false;
        state.attendanceError = action.payload as string;
      });

    // ── Attendance Auto Mark ──
    builder
      .addCase(attendanceAutoMarkThunk.pending, (state) => {
        state.attendanceAutoMarkLoading = true;
        state.attendanceError = null;
      })
      .addCase(attendanceAutoMarkThunk.fulfilled, (state, action) => {
        state.attendanceAutoMarkLoading = false;
        if (state.attendanceStatus) {
          state.attendanceStatus.todayStatus = action.payload.status;
          state.attendanceStatus.hasCheckedInToday = true;
        } else {
          state.attendanceStatus = {
            todayStatus: action.payload.status,
            hasCheckedInToday: true,
            checkInTime: new Date().toISOString(),
            totalActiveTime: 0,
            isActive: true,
          };
        }
        if (state.userStreak === 0) {
          state.userStreak = 1;
        }
      })
      .addCase(attendanceAutoMarkThunk.rejected, (state, action) => {
        state.attendanceAutoMarkLoading = false;
        state.attendanceError = action.payload as string;
      });

    // ── User Streak ──
    builder
      .addCase(fetchUserStreakThunk.pending, (state) => {
        state.userStreakLoading = true;
      })
      .addCase(fetchUserStreakThunk.fulfilled, (state, action) => {
        state.userStreakLoading = false;
        state.userStreak = action.payload?.currentStreak ?? 0;
      })
      .addCase(fetchUserStreakThunk.rejected, (state) => {
        state.userStreakLoading = false;
      });

    // ── Attendance Status ──
    builder
      .addCase(fetchAttendanceStatusThunk.pending, (state) => {
        state.attendanceStatusLoading = true;
      })
      .addCase(fetchAttendanceStatusThunk.fulfilled, (state, action) => {
        state.attendanceStatusLoading = false;
        state.attendanceStatus = action.payload;
      })
      .addCase(fetchAttendanceStatusThunk.rejected, (state, action) => {
        state.attendanceStatusLoading = false;
        state.attendanceError = action.payload as string;
      });

    // ── Attendance Percentage ──
    builder
      .addCase(fetchAttendancePercentageThunk.pending, (state) => {
        state.attendancePercentageLoading = true;
      })
      .addCase(fetchAttendancePercentageThunk.fulfilled, (state, action) => {
        state.attendancePercentageLoading = false;
        state.attendancePercentage = action.payload;
      })
      .addCase(fetchAttendancePercentageThunk.rejected, (state, action) => {
        state.attendancePercentageLoading = false;
        state.attendanceError = action.payload as string;
      });

    // ── Attendance History ──
    builder
      .addCase(fetchAttendanceHistoryThunk.pending, (state) => {
        state.attendanceHistoryLoading = true;
      })
      .addCase(fetchAttendanceHistoryThunk.fulfilled, (state, action) => {
        state.attendanceHistoryLoading = false;
        state.attendanceHistory = action.payload;
      })
      .addCase(fetchAttendanceHistoryThunk.rejected, (state, action) => {
        state.attendanceHistoryLoading = false;
        state.attendanceError = action.payload as string;
      });

    // ── Attendance Calendar ──
    builder
      .addCase(fetchAttendanceCalendarThunk.pending, (state) => {
        state.attendanceCalendarLoading = true;
      })
      .addCase(fetchAttendanceCalendarThunk.fulfilled, (state, action) => {
        state.attendanceCalendarLoading = false;
        state.attendanceCalendar = action.payload;
      })
      .addCase(fetchAttendanceCalendarThunk.rejected, (state, action) => {
        state.attendanceCalendarLoading = false;
        state.attendanceError = action.payload as string;
      });

    // ── Generate Invite Link ──
    builder
      .addCase(generateInviteLinkThunk.pending, (state) => {
        state.shareInviteLinkLoading = true;
        state.shareError = null;
      })
      .addCase(generateInviteLinkThunk.fulfilled, (state, action) => {
        state.shareInviteLinkLoading = false;
        state.shareInviteLink = action.payload;
      })
      .addCase(generateInviteLinkThunk.rejected, (state, action) => {
        state.shareInviteLinkLoading = false;
        state.shareError = action.payload as string;
      });

    // ── Generate QR Code ──
    builder
      .addCase(generateQRCodeThunk.pending, (state) => {
        state.shareQRCodeLoading = true;
        state.shareError = null;
      })
      .addCase(generateQRCodeThunk.fulfilled, (state, action) => {
        state.shareQRCodeLoading = false;
        state.shareQRCode = action.payload;
      })
      .addCase(generateQRCodeThunk.rejected, (state, action) => {
        state.shareQRCodeLoading = false;
        state.shareError = action.payload as string;
      });

    // ── Validate Invite Code ──
    builder
      .addCase(validateInviteCodeThunk.pending, (state) => {
        state.shareValidateLoading = true;
        state.shareValidatedGroupId = null;
        state.shareError = null;
      })
      .addCase(validateInviteCodeThunk.fulfilled, (state, action) => {
        state.shareValidateLoading = false;
        state.shareValidatedGroupId = action.payload.groupId;
      })
      .addCase(validateInviteCodeThunk.rejected, (state, action) => {
        state.shareValidateLoading = false;
        state.shareError = action.payload as string;
      });

    // ── Social Share Links ──
    builder
      .addCase(fetchSocialShareLinksThunk.pending, (state) => {
        state.shareSocialLinksLoading = true;
      })
      .addCase(fetchSocialShareLinksThunk.fulfilled, (state, action) => {
        state.shareSocialLinksLoading = false;
        state.shareSocialLinks = action.payload;
      })
      .addCase(fetchSocialShareLinksThunk.rejected, (state, action) => {
        state.shareSocialLinksLoading = false;
        state.shareError = action.payload as string;
      });

    // ── Invite Analytics ──
    builder
      .addCase(fetchInviteAnalyticsThunk.pending, (state) => {
        state.shareAnalyticsLoading = true;
      })
      .addCase(fetchInviteAnalyticsThunk.fulfilled, (state, action) => {
        state.shareAnalyticsLoading = false;
        state.shareAnalytics = action.payload;
      })
      .addCase(fetchInviteAnalyticsThunk.rejected, (state, action) => {
        state.shareAnalyticsLoading = false;
        state.shareError = action.payload as string;
      });

    // ── Group Invite Links ──
    builder
      .addCase(fetchGroupInviteLinksThunk.pending, (state) => {
        state.shareInviteLinksLoading = true;
      })
      .addCase(fetchGroupInviteLinksThunk.fulfilled, (state, action) => {
        state.shareInviteLinksLoading = false;
        // store per groupId for O(1) lookup
        state.shareInviteLinks[action.payload.groupId] = action.payload.inviteLinks;
      })
      .addCase(fetchGroupInviteLinksThunk.rejected, (state, action) => {
        state.shareInviteLinksLoading = false;
        state.shareError = action.payload as string;
      });

    // ── Revoke Invite Link ──
    builder
      .addCase(revokeInviteLinkThunk.pending, (state) => {
        state.shareRevokeLoading = true;
      })
      .addCase(revokeInviteLinkThunk.fulfilled, (state, action) => {
        state.shareRevokeLoading = false;
        const { inviteCode, groupId } = action.payload;
        // Remove from local cache
        if (state.shareInviteLinks[groupId]) {
          state.shareInviteLinks[groupId] = state.shareInviteLinks[groupId].filter(
            (link) => link.inviteCode !== inviteCode
          );
        }
        // Clear shareInviteLink if same code
        if (state.shareInviteLink?.inviteCode === inviteCode) {
          state.shareInviteLink = null;
        }
      })
      .addCase(revokeInviteLinkThunk.rejected, (state, action) => {
        state.shareRevokeLoading = false;
        state.shareError = action.payload as string;
      });

  },



});

// ─── Actions ─────────────────────────────────────────────────────────────────

export const {
  updateGroup, deleteGroup, leaveGroup,
  setActiveTab, setSearchQuery, openSettings, closeSettings,
  seedBrowseGroups, joinGroup, unjoinGroup,
  setBrowseSearchQuery, openCreateModal, closeCreateModal, toggleSectionExpanded,
  setLocalCamera, setLocalMic, setLocalScreenShare, clearActiveLiveRoom,

  addApiGroup, setApiLoading, setApiError, setApiGroups, clearSelectedGroup
} = groupsSlice.actions;

export const groupsReducer = groupsSlice.reducer;

// ─── Selector type (avoids circular import with store.ts) ─────────────────────

interface StateWithGroups {
  groups: GroupsState;
}

// ─── Selectors — my-groups ────────────────────────────────────────────────────

export const selectAllUsers = (state: StateWithGroups) => state.groups.allUsers;
export const selectAllUsersLoading = (state: StateWithGroups) => state.groups.allUsersLoading;

export const selectGroupItems = (state: StateWithGroups) => state.groups.items;
export const selectActiveTab = (state: StateWithGroups) => state.groups.activeTab;
export const selectSearchQuery = (state: StateWithGroups) => state.groups.searchQuery;
export const selectSettingsGroupId = (state: StateWithGroups) => state.groups.settingsGroupId;
export const selectSettingsGroup = (state: StateWithGroups) => state.groups.items.find(g => g.id === state.groups.settingsGroupId) ?? null;
export const selectApiGroups = (state: StateWithGroups) => state.groups.apiGroups;
export const selectApiLoading = (state: StateWithGroups) => state.groups.isApiLoading;
export const selectApiError = (state: StateWithGroups) => state.groups.apiError;
export const selectAllGroups = (state: StateWithGroups) => state.groups.allGroups;
export const selectAllGroupsTotal = (state: StateWithGroups) => state.groups.allGroupsTotal;
export const selectAllGroupsLoading = (state: StateWithGroups) => state.groups.allGroupsLoading;
export const selectSelectedGroup = (state: StateWithGroups) => state.groups.selectedGroup;
export const selectSelectedGroupLoading = (state: StateWithGroups) => state.groups.selectedGroupLoading;
export const selectMyGroups = (state: StateWithGroups) => state.groups.myGroups;
export const selectMyGroupsLoading = (state: StateWithGroups) => state.groups.myGroupsLoading;
export const selectGroupMembers = (state: StateWithGroups) => state.groups.groupMembers;
export const selectGroupMembersLoading = (state: StateWithGroups) => state.groups.groupMembersLoading;
export const selectJoinLoading = (state: StateWithGroups) => state.groups.joinLoading;
export const selectJoiningGroupId = (state: StateWithGroups) => state.groups.joiningGroupId;
export const selectLeaveLoading = (state: StateWithGroups) => state.groups.leaveLoading;
export const selectDeleteLoading = (state: StateWithGroups) => state.groups.deleteLoading;
export const selectUpdateLoading = (state: StateWithGroups) => state.groups.updateLoading;
export const selectFilteredGroups = createSelector(
  [selectGroupItems, selectActiveTab, selectSearchQuery],
  (items, activeTab, searchQuery) => {
    let result = items;
    if (activeTab === 'created') result = result.filter(g => g.isCreator);
    if (activeTab === 'joined') result = result.filter(g => !g.isCreator);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        g => g.title.toLowerCase().includes(q) || g.category.toLowerCase().includes(q)
      );
    }
    return result;
  }
);
export const selectTopRankedGroups = (state: StateWithGroups) => state.groups.topRankedGroups;
export const selectTopRankedGroupsLoading = (state: StateWithGroups) => state.groups.topRankedGroupsLoading;

export const selectAddMemberLoading = (state: StateWithGroups) => state.groups.addMemberLoading;
export const selectRemoveMemberLoading = (state: StateWithGroups) => state.groups.removeMemberLoading;
export const selectMemberCount = (state: StateWithGroups) => state.groups.memberCount;
export const selectMemberCountLoading = (state: StateWithGroups) => state.groups.memberCountLoading;

// ─── Selectors — browse-groups ────────────────────────────────────────────────
const EMPTY_ARRAY: Group[] = [];  // ✅ ek hi reference
const DEFAULT_EXPANDED_SECTIONS: ExpandedSections = {
  university: false,
  dsa: false,
  jee: false,
  public: false,
};

export const selectBrowseItems = (state: StateWithGroups) => state.groups?.browseItems ?? EMPTY_ARRAY;
export const selectPublicGroups = (state: StateWithGroups) => state.groups?.publicGroups ?? EMPTY_ARRAY;
export const selectJoinedGroupIds = (state: StateWithGroups) => state.groups?.joinedGroupIds;
export const selectBrowseSearchQuery = (state: StateWithGroups) => state.groups?.browseSearchQuery;
export const selectIsCreateModalOpen = (state: StateWithGroups) => state.groups?.isCreateModalOpen;
export const selectExpandedSections = (state: StateWithGroups) => state.groups?.expandedSections ?? DEFAULT_EXPANDED_SECTIONS;


const filterBySection = (items: Group[], section: string, query: string): Group[] => {
  if (!items || !Array.isArray(items)) return [];
  const safeQuery = query ?? '';  // ✅ ye add karo
  let result = items.filter(g => (g as any).section === section);
  if (safeQuery.trim()) {
    const q = safeQuery.toLowerCase();
    result = result.filter(
      g => g.title.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        g.leader.toLowerCase().includes(q)
    );
  }
  return result;
};
export const selectFilteredUniversityGroups = createSelector(
  [selectBrowseItems, selectBrowseSearchQuery],
  (items, query) => filterBySection(items, 'university', query)
);
export const selectFilteredDsaGroups = createSelector(
  [selectBrowseItems, selectBrowseSearchQuery],
  (items, query) => filterBySection(items, 'dsa', query)
);
export const selectFilteredJeeGroups = createSelector(
  [selectBrowseItems, selectBrowseSearchQuery],
  (items, query) => filterBySection(items, 'jee', query)
);

// ADD after existing selectors

// ── Search ──
export const selectSearchResults = (state: StateWithGroups) => state.groups.searchResults;
export const selectSearchResultsTotal = (state: StateWithGroups) => state.groups.searchResultsTotal;
export const selectSearchResultsLoading = (state: StateWithGroups) => state.groups.searchResultsLoading;
export const selectSearchPagination = (state: StateWithGroups) => state.groups.searchPagination;

// ── Popular ──
export const selectPopularGroups = (state: StateWithGroups) => state.groups.popularGroups;
export const selectPopularGroupsLoading = (state: StateWithGroups) => state.groups.popularGroupsLoading;

// ── Trending ──
export const selectTrendingGroups = (state: StateWithGroups) => state.groups.trendingGroups;
export const selectTrendingGroupsLoading = (state: StateWithGroups) => state.groups.trendingGroupsLoading;

// ── Recommended ──
export const selectRecommendedGroups = (state: StateWithGroups) => state.groups.recommendedGroups;
export const selectRecommendedGroupsLoading = (state: StateWithGroups) => state.groups.recommendedGroupsLoading;

// ── By Category ──
export const selectCategoryGroups = (state: StateWithGroups) => state.groups.categoryGroups;
export const selectCategoryGroupsLoading = (state: StateWithGroups) => state.groups.categoryGroupsLoading;
export const selectActiveCategoryFilter = (state: StateWithGroups) => state.groups.activeCategoryFilter;

// ── Available ──
export const selectAvailableGroups = (state: StateWithGroups) => state.groups.availableGroups;
export const selectAvailableGroupsLoading = (state: StateWithGroups) => state.groups.availableGroupsLoading;

// ── By Tags ──
export const selectTagGroups = (state: StateWithGroups) => state.groups.tagGroups;
export const selectTagGroupsLoading = (state: StateWithGroups) => state.groups.tagGroupsLoading;
// ADD after existing selectors
export const selectUniversityGroups = (state: StateWithGroups) => state.groups.universityGroups;
export const selectUniversityGroupsLoading = (state: StateWithGroups) => state.groups.universityGroupsLoading;
export const selectPlacementGroups = (state: StateWithGroups) => state.groups.placementGroups;
export const selectPlacementGroupsLoading = (state: StateWithGroups) => state.groups.placementGroupsLoading;
export const selectPublicGroupsFromApi = (state: StateWithGroups) => state.groups.publicGroupsFromApi;
export const selectPublicGroupsFromApiLoading = (state: StateWithGroups) => state.groups.publicGroupsFromApiLoading;

// JOIN REQUEST selectors
export const selectJoinRequests = (state: StateWithGroups) => state.groups.joinRequests;
export const selectJoinRequestsLoading = (state: StateWithGroups) => state.groups.joinRequestsLoading;
export const selectJoinRequestStatus = (state: StateWithGroups) => state.groups.joinRequestStatus;
export const selectJoinRequestStatusLoading = (state: StateWithGroups) => state.groups.joinRequestStatusLoading;
export const selectSendRequestLoading = (state: StateWithGroups) => state.groups.sendRequestLoading;
export const selectCancelRequestLoading = (state: StateWithGroups) => state.groups.cancelRequestLoading;
// Pending requests selectors
export const selectPendingRequests = (state: StateWithGroups) => state.groups.pendingRequests;
export const selectPendingRequestsTotal = (state: StateWithGroups) => state.groups.pendingRequestsTotal;
export const selectPendingRequestsLoading = (state: StateWithGroups) => state.groups.pendingRequestsLoading;
export const selectRespondToRequestLoading = (state: StateWithGroups) => state.groups.respondToRequestLoading;
export const selectActiveLiveRoom = (state: StateWithGroups) => state.groups.activeLiveRoom;
export const selectActiveLiveRoomLoading = (state: StateWithGroups) => state.groups.activeLiveRoomLoading;
export const selectLiveRoomActionLoading = (state: StateWithGroups) => state.groups.liveRoomActionLoading;
export const selectLiveRoomError = (state: StateWithGroups) => state.groups.liveRoomError;
export const selectLocalCameraOn = (state: StateWithGroups) => state.groups.localCameraOn;
export const selectLocalMicOn = (state: StateWithGroups) => state.groups.localMicOn;
export const selectLocalScreenShareOn = (state: StateWithGroups) => state.groups.localScreenShareOn;

// ── Attendance Selectors ──
export const selectAttendanceStatus = (state: StateWithGroups) => state.groups.attendanceStatus;
export const selectAttendanceStatusLoading = (state: StateWithGroups) => state.groups.attendanceStatusLoading;
export const selectAttendanceCheckInLoading = (state: StateWithGroups) => state.groups.attendanceCheckInLoading;
export const selectAttendanceAutoMarkLoading = (state: StateWithGroups) => state.groups.attendanceAutoMarkLoading;
export const selectAttendancePercentage = (state: StateWithGroups) => state.groups.attendancePercentage;
export const selectAttendancePercentageLoading = (state: StateWithGroups) => state.groups.attendancePercentageLoading;
export const selectAttendanceHistory = (state: StateWithGroups) => state.groups.attendanceHistory;
export const selectAttendanceHistoryLoading = (state: StateWithGroups) => state.groups.attendanceHistoryLoading;
export const selectAttendanceCalendar = (state: StateWithGroups) => state.groups.attendanceCalendar;
export const selectAttendanceCalendarLoading = (state: StateWithGroups) => state.groups.attendanceCalendarLoading;
export const selectAttendanceError = (state: StateWithGroups) => state.groups.attendanceError;
export const selectUserStreak = (state: StateWithGroups) => state.groups.userStreak ?? 0;
export const selectUserStreakLoading = (state: StateWithGroups) => state.groups.userStreakLoading;

// ── Share Selectors ──
export const selectShareInviteLink = (state: StateWithGroups) => state.groups.shareInviteLink;
export const selectShareInviteLinkLoading = (state: StateWithGroups) => state.groups.shareInviteLinkLoading;
export const selectShareQRCode = (state: StateWithGroups) => state.groups.shareQRCode;
export const selectShareQRCodeLoading = (state: StateWithGroups) => state.groups.shareQRCodeLoading;
export const selectShareValidatedGroupId = (state: StateWithGroups) => state.groups.shareValidatedGroupId;
export const selectShareValidateLoading = (state: StateWithGroups) => state.groups.shareValidateLoading;
export const selectShareSocialLinks = (state: StateWithGroups) => state.groups.shareSocialLinks;
export const selectShareSocialLinksLoading = (state: StateWithGroups) => state.groups.shareSocialLinksLoading;
export const selectShareAnalytics = (state: StateWithGroups) => state.groups.shareAnalytics;
export const selectShareAnalyticsLoading = (state: StateWithGroups) => state.groups.shareAnalyticsLoading;
export const selectShareInviteLinks = (state: StateWithGroups) => state.groups.shareInviteLinks;
export const selectShareInviteLinksLoading = (state: StateWithGroups) => state.groups.shareInviteLinksLoading;
export const selectShareRevokeLoading = (state: StateWithGroups) => state.groups.shareRevokeLoading;
export const selectShareError = (state: StateWithGroups) => state.groups.shareError;

// Helper — get invite links for a specific group
export const selectInviteLinksForGroup = (groupId: string) =>
  (state: StateWithGroups) => state.groups.shareInviteLinks[groupId] ?? [];



