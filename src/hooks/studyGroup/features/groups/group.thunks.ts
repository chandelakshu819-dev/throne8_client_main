// src/hooks/studyGroup/features/groups/group.thunks.ts

import { createAsyncThunk } from "@reduxjs/toolkit";
import StudyGroupService, {
  CreateGroupData,
  GroupCategory,
  GroupVisibility,
  SearchGroupsQuery,
  UpdateGroupData,
} from "@/lib/api/studyGroup.service";
import AuthService from "@/lib/api/auth.service";

export const fetchAllUsersThunk = createAsyncThunk(
  "groups/fetchAllUsers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await AuthService.getAllUsers({ limit: 100 });
      // response = { status, statusCode, message, data: { users: [...], pagination: {} } }
      const users = response.data?.users ?? response.data?.data?.users ?? [];
      return Array.isArray(users) ? users : [];
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch users");
    }
  }
);

export const createGroupThunk = createAsyncThunk(
  "groups/create",
  async (groupData: CreateGroupData, { rejectWithValue }) => {
    try {
      const group = await StudyGroupService.createGroup(groupData);
      return group;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create group");
    }
  }
);

export const fetchGroupsThunk = createAsyncThunk(
  "groups/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await StudyGroupService.getGroups();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch groups");
    }
  }
);

// ADD this thunk
export const fetchTopRankedGroupsThunk = createAsyncThunk(
  "groups/fetchTopRanked",
  async (limit: number = 10, { rejectWithValue }) => {
    try {
      const groups = await StudyGroupService.getTopRankedGroups(limit);
      return groups;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch top ranked groups"
      );
    }
  }
);

export const fetchGroupByIdThunk = createAsyncThunk(
  "groups/fetchById",
  async (groupId: string, { rejectWithValue }) => {
    try {
      const group = await StudyGroupService.getGroupById(groupId);
      return group;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch group");
    }
  }
);

export const fetchMyGroupsThunk = createAsyncThunk(
  "groups/fetchMyGroups",
  async (_, { rejectWithValue }) => {
    try {
      const groups = await StudyGroupService.getMyGroups();
      return groups;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch your groups");
    }
  }
);

export const fetchGroupMembersThunk = createAsyncThunk(
  "groups/fetchMembers",
  async (groupId: string, { rejectWithValue }) => {
    try {
      // const members = await StudyGroupService.getGroupMembers(groupId);
      // return { groupId, members };
      const response = await StudyGroupService.getGroupMembers(groupId);
      return { groupId, members: response.members ?? response };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch members");
    }
  }
);

export const joinGroupThunk = createAsyncThunk(
  "groups/join",
  async (
    { groupId, joinCode }: { groupId: string; joinCode?: string },
    { rejectWithValue }
  ) => {
    try {
      const group = await StudyGroupService.joinGroup(groupId, { joinCode });
      return group;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to join group");
    }
  }
);

export const leaveGroupThunk = createAsyncThunk(
  "groups/leave",
  async (groupId: string, { rejectWithValue }) => {
    try {
      await StudyGroupService.leaveGroup(groupId);
      return groupId;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to leave group");
    }
  }
);

export const deleteGroupThunk = createAsyncThunk(
  "groups/delete",
  async (groupId: string, { rejectWithValue }) => {
    try {
      await StudyGroupService.deleteGroup(groupId);
      return groupId;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete group");
    }
  }
);

export const updateGroupThunk = createAsyncThunk(
  "groups/update",
  async (
    { groupId, updates }: { groupId: string; updates: UpdateGroupData },
    { rejectWithValue }
  ) => {
    try {
      const group = await StudyGroupService.updateGroup(groupId, updates);
      return group;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update group");
    }
  }
);

export const addMemberThunk = createAsyncThunk(
  "groups/addMember",
  async (
    { groupId, userId }: { groupId: string; userId: string },
    { rejectWithValue }
  ) => {
    try {
      await StudyGroupService.addMember(groupId, userId);
      return { groupId, userId };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add member");
    }
  }
);

export const removeMemberThunk = createAsyncThunk(
  "groups/removeMember",
  async (
    { groupId, userId }: { groupId: string; userId: string },
    { rejectWithValue }
  ) => {
    try {
      await StudyGroupService.removeMember(groupId, userId);
      return { groupId, userId };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to remove member");
    }
  }
);

export const getMemberCountThunk = createAsyncThunk(
  "groups/getMemberCount",
  async (groupId: string, { rejectWithValue }) => {
    try {
      const data = await StudyGroupService.getMemberCount(groupId);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch member count");
    }
  }
);

export const searchGroupsThunk = createAsyncThunk(
  "groups/search",
  async (params: SearchGroupsQuery, { rejectWithValue }) => {
    try {
      const response = await StudyGroupService.searchGroups(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to search groups");
    }
  }
);

export const fetchPopularGroupsThunk = createAsyncThunk(
  "groups/fetchPopular",
  async (limit: number = 10, { rejectWithValue }) => {
    try {
      const response = await StudyGroupService.getPopularGroups(limit);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch popular groups");
    }
  }
);

export const fetchTrendingGroupsThunk = createAsyncThunk(
  "groups/fetchTrending",
  async (limit: number = 10, { rejectWithValue }) => {
    try {
      const response = await StudyGroupService.getTrendingGroups(limit);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch trending groups"
      );
    }
  }
);

export const fetchRecommendedGroupsThunk = createAsyncThunk(
  "groups/fetchRecommended",
  async (
    params: { category?: GroupCategory; limit?: number } = {},
    { rejectWithValue }
  ) => {
    try {
      const response = await StudyGroupService.getRecommendedGroups(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch recommended groups"
      );
    }
  }
);

export const fetchGroupsByCategoryThunk = createAsyncThunk(
  "groups/fetchByCategory",
  async (
    params: {
      category: GroupCategory;
      page?: number;
      limit?: number;
      sort?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const { category, ...rest } = params;
      const response = await StudyGroupService.getGroupsByCategory(
        category,
        rest
      );
      return { ...response, category };
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch groups by category"
      );
    }
  }
);

export const fetchAvailableGroupsThunk = createAsyncThunk(
  "groups/fetchAvailable",
  async (
    params: { page?: number; limit?: number } = {},
    { rejectWithValue }
  ) => {
    try {
      const response = await StudyGroupService.getAvailableGroups(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch available groups"
      );
    }
  }
);

export const searchGroupsByTagsThunk = createAsyncThunk(
  "groups/searchByTags",
  async (
    params: { tags: string | string[]; page?: number; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await StudyGroupService.searchGroupsByTags(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to search groups by tags"
      );
    }
  }
);

// ADD these 3 specific thunks
export const fetchUniversityGroupsThunk = createAsyncThunk(
  "groups/fetchUniversity",
  async (limit: number = 10, { rejectWithValue }) => {
    try {
      const response = await StudyGroupService.getGroupsByCategory(
        GroupCategory.COLLEGE,
        { limit }
      );
      return response.groups;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch university groups"
      );
    }
  }
);

export const fetchPlacementGroupsThunk = createAsyncThunk(
  "groups/fetchPlacement",
  async (limit: number = 10, { rejectWithValue }) => {
    try {
      //   const response = await StudyGroupService.getGroupsByCategory(
      //     GroupCategory.PLACEMENT,
      //     { limit }
      //   );
      //   return response.groups;
      const [placementRes, competitiveRes] = await Promise.all([
        // StudyGroupService.getGroupsByCategory(GroupCategory.PLACEMENT, { limit }).catch(() => ({ groups: [] })),
        StudyGroupService.getGroupsByCategory(GroupCategory.PLACEMENT, {
          limit,
        }).catch((err: any) => {
          console.warn("[placement groups] failed:", err?.message);
          return { groups: [] as any[] };
        }),
        // StudyGroupService.getGroupsByCategory(GroupCategory.COMPETITIVE, {
        //   limit,
        // }).catch(() => ({ groups: [] })),
        StudyGroupService.getGroupsByCategory(GroupCategory.COMPETITIVE, {
          limit,
        }).catch((err: any) => {
          console.warn("[competitive groups] failed:", err?.message);
          return { groups: [] as any[] };
        }),
      ]);
      return [...(placementRes.groups ?? []), ...(competitiveRes.groups ?? [])];
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch placement groups"
      );
    }
  }
);

export const fetchPublicGroupsThunk = createAsyncThunk(
  "groups/fetchPublic",
  async (limit: number = 10, { rejectWithValue }) => {
    try {
      const response = await StudyGroupService.getGroups({
        visibility: GroupVisibility.PUBLIC,
        // sortBy: 'memberCount',
        // sortOrder: 'desc',
        limit,
      });
      return response.groups;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch public groups");
    }
  }
);

// ADD in group.thunks.ts
export const fetchOtherGroupsThunk = createAsyncThunk(
  "groups/fetchOther",
  async (limit: number = 10, { rejectWithValue }) => {
    try {
      const response = await StudyGroupService.getGroupsByCategory(
        GroupCategory.OTHER,
        { limit }
      );
      return response.groups;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch other groups");
    }
  }
);

// Send join request
export const sendJoinRequestThunk = createAsyncThunk(
  "groups/sendJoinRequest",
  async (
    { groupId, message }: { groupId: string; message?: string },
    { rejectWithValue }
  ) => {
    try {
      const result = await StudyGroupService.sendJoinRequest(groupId, {
        message,
      });
      return { ...result, groupId };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to send request");
    }
  }
);

// Cancel join request
export const cancelJoinRequestThunk = createAsyncThunk(
  "groups/cancelJoinRequest",
  async (groupId: string, { rejectWithValue }) => {
    try {
      await StudyGroupService.cancelJoinRequest(groupId);
      return groupId;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to cancel request");
    }
  }
);

// Get request status for a group
export const getJoinRequestStatusThunk = createAsyncThunk(
  "groups/getJoinRequestStatus",
  async (groupId: string, { rejectWithValue }) => {
    try {
      const result = await StudyGroupService.getJoinRequestStatus(groupId);
      return { ...result, groupId };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to get status");
    }
  }
);

// Get my all requests
export const getMyJoinRequestsThunk = createAsyncThunk(
  "groups/getMyJoinRequests",
  async (_, { rejectWithValue }) => {
    try {
      const result = await StudyGroupService.getMyJoinRequests();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch requests");
    }
  }
);

// Get pending requests for a group (leader)
export const getGroupPendingRequestsThunk = createAsyncThunk(
  "groups/getGroupPendingRequests",
  async (
    {
      groupId,
      page = 1,
      limit = 20,
    }: { groupId: string; page?: number; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      const result = await StudyGroupService.getGroupPendingRequests(
        groupId,
        page,
        limit
      );
      return { ...result, groupId };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch requests");
    }
  }
);

// Respond to join request (approve/reject)
export const respondToJoinRequestThunk = createAsyncThunk(
  "groups/respondToJoinRequest",
  async (
    {
      joinRequestId,
      groupId,
      action,
      rejectionReason,
    }: {
      joinRequestId: string;
      groupId: string;
      action: "approve" | "reject";
      rejectionReason?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const result = await StudyGroupService.respondToJoinRequest(
        joinRequestId,
        {
          action,
          rejectionReason,
        }
      );
      return { ...result, groupId, joinRequestId, action };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to respond to request");
    }
  }
);

///==========================================================================
//==========================LIVE ROOM THUNKS==========================
//=============================================================================

// ==================== LIVE ROOM THUNKS ====================

export const createLiveRoomThunk = createAsyncThunk(
  "groups/liveRoom/create",
  async (
    data: {
      groupId: string;
      title: string;
      description?: string;
      maxParticipants?: number;
      settings?: any;
    },
    { rejectWithValue }
  ) => {
    try {
      return await StudyGroupService.createLiveRoom(data);
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create live room");
    }
  }
);

export const fetchGroupActiveLiveRoomThunk = createAsyncThunk(
  "groups/liveRoom/fetchActive",
  async (groupId: string, { rejectWithValue }) => {
    try {
      return await StudyGroupService.getGroupActiveLiveRoom(groupId);
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch active live room"
      );
    }
  }
);

export const joinLiveRoomThunk = createAsyncThunk(
  "groups/liveRoom/join",
  async (
    {
      roomId,
      options,
    }: { roomId: string; options?: { cameraOn?: boolean; micOn?: boolean } },
    { rejectWithValue }
  ) => {
    try {
      return await StudyGroupService.joinLiveRoom(roomId, options);
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to join live room");
    }
  }
);

export const leaveLiveRoomThunk = createAsyncThunk(
  "groups/liveRoom/leave",
  async (roomId: string, { rejectWithValue }) => {
    try {
      await StudyGroupService.leaveLiveRoom(roomId);
      return roomId;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to leave live room");
    }
  }
);

export const endLiveRoomThunk = createAsyncThunk(
  "groups/liveRoom/end",
  async (roomId: string, { rejectWithValue }) => {
    try {
      return await StudyGroupService.endLiveRoom(roomId);
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to end live room");
    }
  }
);

export const toggleCameraThunk = createAsyncThunk(
  "groups/liveRoom/toggleCamera",
  async (
    { roomId, cameraOn }: { roomId: string; cameraOn: boolean },
    { rejectWithValue }
  ) => {
    try {
      return await StudyGroupService.toggleCamera(roomId, cameraOn);
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to toggle camera");
    }
  }
);

export const toggleMicThunk = createAsyncThunk(
  "groups/liveRoom/toggleMic",
  async (
    { roomId, micOn }: { roomId: string; micOn: boolean },
    { rejectWithValue }
  ) => {
    try {
      return await StudyGroupService.toggleMic(roomId, micOn);
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to toggle mic");
    }
  }
);

export const toggleScreenShareThunk = createAsyncThunk(
  "groups/liveRoom/toggleScreenShare",
  async (
    { roomId, sharing }: { roomId: string; sharing: boolean },
    { rejectWithValue }
  ) => {
    try {
      return await StudyGroupService.toggleScreenShare(roomId, sharing);
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to toggle screen share");
    }
  }
);

// =======================================================================================
// ==================== ATTENDANCE THUNKS ===============================================
// =======================================================================================

export const attendanceCheckInThunk = createAsyncThunk(
  "groups/attendance/checkIn",
  async (notes: string | undefined, { rejectWithValue }) => {
    try {
      return await StudyGroupService.attendanceCheckIn(notes);
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to check in");
    }
  }
);

export const attendanceAutoMarkThunk = createAsyncThunk(
  "groups/attendance/autoMark",
  async (
    {
      reason,
      studyHours,
    }: { reason: "study_session" | "task_completion"; studyHours?: number },
    { rejectWithValue }
  ) => {
    try {
      return await StudyGroupService.attendanceAutoMark(reason, studyHours);
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to auto-mark attendance");
    }
  }
);

export const fetchAttendanceStatusThunk = createAsyncThunk(
  "groups/attendance/fetchStatus",
  async (_, { rejectWithValue }) => {
    try {
      return await StudyGroupService.getAttendanceStatus();
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch attendance status"
      );
    }
  }
);

export const fetchAttendancePercentageThunk = createAsyncThunk(
  "groups/attendance/fetchPercentage",
  async (_, { rejectWithValue }) => {
    try {
      return await StudyGroupService.getAttendancePercentage();
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch attendance percentage"
      );
    }
  }
);

export const fetchAttendanceHistoryThunk = createAsyncThunk(
  "groups/attendance/fetchHistory",
  async (
    { page = 1, limit = 30 }: { page?: number; limit?: number } = {},
    { rejectWithValue }
  ) => {
    try {
      return await StudyGroupService.getAttendanceHistory(page, limit);
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch attendance history"
      );
    }
  }
);

export const fetchAttendanceCalendarThunk = createAsyncThunk(
  "groups/attendance/fetchCalendar",
  async (
    { month, year }: { month?: number; year?: number } = {},
    { rejectWithValue }
  ) => {
    try {
      return await StudyGroupService.getAttendanceCalendar(month, year);
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch attendance calendar"
      );
    }
  }
);

// =======================================================================================
// ==================== SHARE THUNKS ====================================================
// =======================================================================================

export const generateInviteLinkThunk = createAsyncThunk(
  "groups/share/generateLink",
  async (
    {
      groupId,
      options,
    }: {
      groupId: string;
      options?: { expiresInHours?: number; maxUses?: number };
    },
    { rejectWithValue }
  ) => {
    try {
      const result = await StudyGroupService.generateInviteLink(
        groupId,
        options
      );
      return { ...result, groupId };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to generate invite link");
    }
  }
);

export const generateQRCodeThunk = createAsyncThunk(
  "groups/share/generateQR",
  async (groupId: string, { rejectWithValue }) => {
    try {
      const result = await StudyGroupService.generateGroupQRCode(groupId);
      return { ...result, groupId };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to generate QR code");
    }
  }
);

export const validateInviteCodeThunk = createAsyncThunk(
  "groups/share/validateCode",
  async (inviteCode: string, { rejectWithValue }) => {
    try {
      const result = await StudyGroupService.validateInviteCode(inviteCode);
      return { ...result, inviteCode };
    } catch (error: any) {
      return rejectWithValue(error.message || "Invalid invite code");
    }
  }
);

export const fetchSocialShareLinksThunk = createAsyncThunk(
  "groups/share/fetchSocialLinks",
  async (groupId: string, { rejectWithValue }) => {
    try {
      const result = await StudyGroupService.getSocialShareLinks(groupId);
      return { ...result, groupId };
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch social share links"
      );
    }
  }
);

export const fetchInviteAnalyticsThunk = createAsyncThunk(
  "groups/share/fetchAnalytics",
  async (groupId: string, { rejectWithValue }) => {
    try {
      const result = await StudyGroupService.getInviteAnalytics(groupId);
      return { ...result, groupId };
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch invite analytics"
      );
    }
  }
);

export const fetchGroupInviteLinksThunk = createAsyncThunk(
  "groups/share/fetchLinks",
  async (groupId: string, { rejectWithValue }) => {
    try {
      const result = await StudyGroupService.getGroupInviteLinks(groupId);
      return { ...result, groupId };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch invite links");
    }
  }
);

export const revokeInviteLinkThunk = createAsyncThunk(
  "groups/share/revokeLink",
  async (
    { inviteCode, groupId }: { inviteCode: string; groupId: string },
    { rejectWithValue }
  ) => {
    try {
      await StudyGroupService.revokeInviteLink(inviteCode);
      return { inviteCode, groupId };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to revoke invite link");
    }
  }
);

export const trackInviteJoinThunk = createAsyncThunk(
  "groups/share/trackJoin",
  async (inviteCode: string, { rejectWithValue }) => {
    try {
      await StudyGroupService.trackInviteJoin(inviteCode);
      return inviteCode;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to track join");
    }
  }
);
