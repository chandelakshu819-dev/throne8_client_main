/**
 * ====================================
 * STUDY GROUP - GROUP API SERVICE
 * ====================================
 */

import api from "./api.intance";
import axios from "axios";
import {
  CreateTaskInput,
  TaskQueryInput,
  UpdateTaskInput,
} from "../../features/study-group/validators/todo.validation";
import config from "@/config/env.config";

// ==================== URL / PARAM HELPERS ====================

/** Append `suffix` to an env base path unless the env value already ends with it. */
const joinUrl = (base: string | undefined, suffix: string): string => {
  const b = (base ?? "").replace(/\/+$/, "");
  return b.endsWith(suffix) ? b : `${b}${suffix}`;
};

/** Remove undefined / null / empty-string params so backend Joi validators don't reject them. */
const cleanParams = <T extends Record<string, any> | undefined>(
  params: T
): T => {
  if (!params) return params;
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== ""
    )
  ) as T;
};
// ==================== ENUMS ====================

export enum GroupCategory {
  JEE = "JEE",
  NEET = "NEET",
  COMPETITIVE = "Competitive Examinations",
  COLLEGE = "College Students",
  WORKING_PROFESSIONAL = "Working Professionals",
  LANGUAGE = "Language Learning",
  OTHER = "Other",
  // ADD in GroupCategory enum
  PLACEMENT = "Placement Preparation",
}

export enum GroupVisibility {
  PUBLIC = "public",
  PRIVATE = "private",
}

export enum MemberRole {
  LEADER = "leader",
  ADMIN = "admin",
  MEMBER = "member",
}

// ==================== TYPES ====================

export interface CreateGroupData {
  title: string;
  description?: string;
  category: GroupCategory;
  visibility?: GroupVisibility;
  capacity?: number;
  goalHours?: number;
  tags?: string[];
  // ADD
  cameraRequired?: boolean;
  attendanceRequired?: boolean;
  minAttendancePercent?: number;
}

export interface UpdateGroupData {
  title?: string;
  description?: string;
  category?: GroupCategory;
  visibility?: GroupVisibility;
  capacity?: number;
  goalHours?: number;
  tags?: string[];
  avatar?: string;
  coverImage?: string;
}

export interface JoinGroupData {
  joinCode?: string;
}

export interface GroupListQuery {
  page?: number;
  limit?: number;
  category?: GroupCategory;
  visibility?: GroupVisibility;
  search?: string;
  sortBy?: "createdAt" | "memberCount" | "title";
  sortOrder?: "asc" | "desc";
}

export interface GroupResponse {
  _id?: string;
  id?: string;
  groupId: string;
  title: string;
  description?: string;
  category: GroupCategory;
  visibility: GroupVisibility;
  avatar?: string;
  coverImage?: string;
  capacity: number;
  currentMemberCount: number;
  leaderId: string;
  goalHours?: number;
  tags?: string[];
  joinCode?: string;
  isActive: boolean;
  // ADD
  cameraRequired?: boolean;
  attendanceRequired?: boolean;
  minAttendancePercent?: number;
  createdAt: string;
  updatedAt: string;
  memberRole?: MemberRole;
  isMember?: boolean;
}

export interface GroupMember {
  _id: string;
  userId: string;
  role: MemberRole;
  joinedAt: string;
  lastActive?: string;
}

export interface GroupListResponse {
  groups: GroupResponse[];
  total: number;
  page: number;
  totalPages: number;
}

// ADD this interface with your existing interfaces
export interface TopRankedGroupResponse {
  _id?: string;
  id?: string;
  groupId: string;
  title: string;
  description?: string;
  category: string;
  visibility: string;
  avatar?: string;
  coverImage?: string;
  capacity: number;
  currentMemberCount: number;
  leaderId: string;
  goalHours?: number;
  tags?: string[];
  isActive: boolean;
  cameraRequired: boolean;
  attendanceRequired: boolean;
  minAttendancePercent?: number | null;
  isMember: boolean;
  memberRole?: string;
}

// ==================== ADD THESE INTERFACES ====================

export interface SearchGroupsQuery {
  search?: string;
  category?: GroupCategory;
  visibility?: GroupVisibility;
  tags?: string | string[];
  hasSpace?: boolean;
  minHours?: number;
  maxHours?: number;
  sort?:
    | "newest"
    | "oldest"
    | "mostMembers"
    | "leastMembers"
    | "topRanked"
    | "mostActive";
  page?: number;
  limit?: number;
}

export interface SearchGroupsResponse {
  pagination: {
    page: number;
    limit: number;
    skip: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  groups: GroupResponse[];
}

export interface PopularGroupsResponse {
  total: number;
  groups: GroupResponse[];
}

// ADD these interfaces after existing interfaces

export interface StartTimerData {
  subject?: string;
  notes?: string;
  goalId?: string;
}

export interface TimerSessionResponse {
  sessionId: string;
  startTime: string;
  status: "active" | "paused" | "completed" | "cancelled";
  subject?: string;
  goal?: string | null;
  elapsedTime?: number;
  pausedAt?: string | null;
  totalPausedDuration?: number;
  endTime?: string;
  duration?: number;
  durationInMinutes?: number;
  durationInHours?: number;
  notes?: string;
}

export interface TimerStatsResponse {
  totalSessions: number;
  totalDuration: number;
  totalDurationInHours: number;
  averageSessionDuration: number;
  sessionsToday: number;
  durationToday: number;
  durationTodayInHours: number;
  sessionsThisWeek: number;
  durationThisWeek: number;
  durationThisWeekInHours: number;
  sessionsThisMonth: number;
  durationThisMonth: number;
  durationThisMonthInHours: number;
  longestSession: number;
  bySubject: Record<string, { count: number; duration: number }>;
}

export interface TodaySessionsResponse {
  sessions: TimerSessionResponse[];
  count: number;
  totalDuration: number;
  totalDurationInMinutes: number;
  totalDurationInHours: number;
}

export interface AllSessionsResponse {
  sessions: TimerSessionResponse[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

export interface GoalResponse {
  goalId: string;
  user: string;
  title: string;
  description?: string;
  targetHours: number;
  currentHours: number;
  startDate: string;
  endDate: string;
  completed: boolean;
  completedAt?: string | null;
  category?: string;
  tags?: string[];
  progressPercentage: number;
  daysRemaining: number;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GoalStatsResponse {
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  totalTargetHours: number;
  totalCurrentHours: number;
  completionRate: number;
  byCategory: Record<string, number>;
}

export interface UserDashboardResponse {
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  stats: {
    globalRank: number;
    rankScore: number;
    currentStreak: number;
    longestStreak: number;
    totalStudyHours: number;
    activeGroups: number;
    todayStudyHours: number;
    activeTasks: number;
    activeGoals: number;
  };
}

export interface StudyStatisticsResponse {
  period: string;
  statistics: {
    date: string;
    sessions: number;
    hours: number;
  }[];
}

export interface PerformanceAnalyticsResponse {
  totalSessions: number;
  totalTasksCompleted: number;
  totalGoalsAchieved: number;
  totalStudyHours: number;
  globalRank: number;
  rankScore: number;
  currentStreak: number;
  longestStreak: number;
}

// Backend response ke exact fields
export interface TaskResponse {
  taskId: string;
  userId: string;
  groupId: string;
  title: string;
  description?: string | null;
  status: "pending" | "in_progress" | "completed" | "overdue" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  deadline?: string | null;
  completed: boolean;
  completedAt?: string | null;
  tags: string[];
  reminderAt?: string | null;
  createdAt: string;
  updatedAt: string;
  daysRemaining?: number | null;
  isOverdue: boolean;
  id: string; // same as taskId (toJSON transform)
}

export interface TaskListResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  tasks: TaskResponse[];
}

export interface TaskStatsResponse {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  byPriority: Record<string, number>;
}

// ==================== JOIN REQUEST TYPES ====================

export interface SendJoinRequestData {
  message?: string;
}

export interface JoinRequestResponse {
  joinRequestId: string;
  groupId: string;
  status: "pending" | "approved" | "rejected" | "cancelled" | "expired";
  message?: string;
  expiresAt: string;
  createdAt: string;
}

export interface JoinRequestStatusResponse {
  hasRequest: boolean;
  joinRequestId?: string;
  status?: "pending" | "approved" | "rejected" | "cancelled" | "expired";
  message?: string;
  expiresAt?: string;
  createdAt?: string;
}

export interface MyRequestsResponse {
  _id: string;
  joinRequestId: string;
  groupId: string;
  userId: string;
  message?: string;
  status: "pending" | "approved" | "rejected" | "cancelled" | "expired";
  respondedAt?: string | null;
  respondedBy?: string | null;
  rejectionReason?: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PendingJoinRequest {
  joinRequestId: string;
  userId: string;
  message?: string | null;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export interface PendingRequestsResponse {
  requests: PendingJoinRequest[];
  total: number;
  page: number;
  totalPages: number;
}

export interface RespondToRequestData {
  action: "approve" | "reject";
  rejectionReason?: string;
}

// ==================== CHAT TYPES ====================

export interface SendMessageData {
  content: string;
  messageType?: "text" | "image" | "file" | "voice" | "video";
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  replyTo?: string | null;
}

export interface ReactionData {
  emoji: "👍" | "❤️" | "😂" | "😮" | "😢" | "😡" | "🔥" | "👏" | "🎉" | "✅";
}

export interface MessageResponse {
  _id: string;
  messageId: string;
  groupId: string;
  sender: string;
  content: string;
  messageType: "text" | "image" | "file" | "voice" | "video" | "system";
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  replyTo: string | null;
  isPinned: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedBy: string | null;
  readBy: string[];
  reactions: {
    emoji: string;
    users: string[];
    _id: string;
  }[];
  editHistory: { content: string; editedAt: string }[];
  canEdit: boolean;
  readCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GetMessagesResponse {
  messages: MessageResponse[];
  currentPage: number;
  totalPages: number;
  totalMessages: number;
  hasMore: boolean;
}

export interface GetMessagesParams {
  page?: number;
  limit?: number;
}

export interface SearchMessagesResponse {
  messages: MessageResponse[];
  currentPage: number;
  totalPages: number;
  totalResults: number;
}

export interface ReadStatusResponse {
  readCount: number;
  readBy: string[];
}

// ==================== FILE TYPES ====================

export interface FileUploadResponse {
  _id: string;
  fileId: string;
  groupId: string;
  uploadedBy: {
    userId: string;
    name: string;
    avatar: string | null;
  };
  fileName: string;
  originalName: string;
  fileType:
    | "image"
    | "video"
    | "audio"
    | "pdf"
    | "doc"
    | "docx"
    | "ppt"
    | "pptx"
    | "xls"
    | "xlsx"
    | "other";
  mimeType: string;
  fileSize: number;
  fileUrl: string;
  isPinned: boolean;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GetFilesParams {
  page?: number;
  limit?: number;
  fileType?: string;
  search?: string;
  sortBy?: "createdAt" | "fileName" | "fileSize" | "downloadCount";
  sortOrder?: "asc" | "desc";
  pinnedOnly?: boolean;
}

export interface GetFilesResponse {
  files: FileUploadResponse[];
  total: number;
  page: number;
  pages: number;
}

// ==================== ATTENDANCE TYPES ====================

export interface AttendanceCheckInResponse {
  attendanceId: string;
  date: string;
  checkInTime: string;
  status: "present" | "absent" | "late";
}

export interface AttendanceAutoMarkResponse {
  attendanceId: string;
  date: string;
  status: "present" | "absent" | "late";
  wasAutoMarked: boolean;
  autoMarkReason: "study_session" | "task_completion" | "manual";
}

export interface AttendanceStatusResponse {
  todayStatus: "present" | "absent" | "late" | "not_marked";
  hasCheckedInToday: boolean;
  checkInTime?: string;
  totalActiveTime: number;
  isActive: boolean;
}

export interface AttendancePercentageResponse {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendancePercentage: number;
  currentMonthPercentage: number;
  overallPercentage: number;
}

export interface AttendanceRecord {
  attendanceId: string;
  date: string;
  status: "present" | "absent" | "late";
  checkInTime?: string;
  checkOutTime?: string;
  totalActiveTime: number;
  studyHours: number;
  sessionsCompleted: number;
  wasAutoMarked: boolean;
  notes?: string;
}

export interface AttendanceHistoryResponse {
  attendance: AttendanceRecord[];
  summary: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    attendancePercentage: number;
  };
  total: number;
  page: number;
  limit: number;
}

export interface AttendanceCalendarDay {
  date: string;
  day: number;
  dayName: string;
  status: "present" | "absent" | "late" | "not_marked";
  isToday: boolean;
  isFuture: boolean;
  studyHours: number;
  checkInTime?: string;
}

export interface AttendanceCalendarResponse {
  year: number;
  month: number;
  monthName: string;
  days: AttendanceCalendarDay[];
  summary: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    notMarkedDays: number;
    attendancePercentage: number;
  };
}

// ==================== SHARE TYPES ====================

export interface GenerateInviteLinkOptions {
  expiresInHours?: number;
  maxUses?: number;
}

export interface InviteLinkResponse {
  inviteLink: string;
  inviteCode: string;
  expiresAt: string | null;
  maxUses: number | null;
}

export interface QRCodeResponse {
  qrCode: string;
  inviteLink: string;
  inviteCode: string;
}

export interface SocialShareLinksResponse {
  inviteLink: string;
  socialLinks: {
    whatsapp: string;
    telegram: string;
    twitter: string;
    facebook: string;
  };
}

export interface InviteAnalyticsResponse {
  totalInvites: number;
  totalClicks: number;
  totalJoins: number;
  conversionRate: number;
  activeInvites: number;
  expiredInvites: number;
}

export interface InviteLinkDetail {
  inviteCode: string;
  inviteLink: string;
  createdAt: string;
  expiresAt: string | null;
  maxUses: number | null;
  currentUses: number;
  clicks: number;
  successfulJoins: number;
  conversionRate: number;
  isActive: boolean;
}

export interface GroupInviteLinksResponse {
  inviteLinks: InviteLinkDetail[];
  total: number;
}

export interface ValidateInviteResponse {
  groupId: string;
}

// ==================== SERVICE CLASS ====================

export interface GroupStreakEntry {
  userId: string;
  userName?: string;
  userAvatar?: string;
  currentStreak: number;
  longestStreak: number;
  rank: number;
  isCurrentUser: boolean;
}

export interface GroupStreakLeaderboardResponse {
  groupId: string;
  leaderboard: GroupStreakEntry[];
  myRank: number | null;
  totalMembers: number;
}

class StudyGroupService {
  // =======================================================================================
  // ===========================GROUP ROUTES================================================
  // =======================================================================================

  /**
   * 🏠 GET ALL GROUPS
   * GET {studygroup base url}/groups
   */
  static async getGroups(params?: GroupListQuery): Promise<GroupListResponse> {
    try {
      // const { data } = await api.get(
      //   `${config.NEXT_PUBLIC_STUDY_GROUPS_ENDPOINT! || process.env.NEXT_PUBLIC_STUDY_GROUPS_ENDPOINT}`,
      //   { params }
      // );

      const { data } = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUPS_ENDPOINT! || process.env.NEXT_PUBLIC_STUDY_GROUPS_ENDPOINT}`,
        { params: cleanParams(params) }
      );
      return data.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.code === "ERR_NETWORK") {
          throw new Error(
            "Unable to connect to server. Please check your internet connection."
          );
        }
        if (error.response?.status === 401) {
          throw new Error("Authentication required. Please login again.");
        }
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }

      throw new Error("Failed to fetch groups. Please try again.");
    }
  }

  /**
   * 👤 GET MY GROUPS
   * GET {studygroup base url}/groups/my-groups
   */
  static async getMyGroups(): Promise<GroupResponse[]> {
    try {
      // const { data } = await api.get(
      //   `${config.NEXT_PUBLIC_MY_STUDY_GROUPS_ENDPOINT || process.env.NEXT_PUBLIC_MY_STUDY_GROUPS_ENDPOINT}`
      // );

      const { data } = await api.get(
        `${joinUrl(config.NEXT_PUBLIC_MY_STUDY_GROUPS_ENDPOINT || process.env.NEXT_PUBLIC_MY_STUDY_GROUPS_ENDPOINT, "/my-groups")}`
      );
      return data.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.code === "ERR_NETWORK") {
          throw new Error(
            "Unable to connect to server. Please check your internet connection."
          );
        }
        if (error.response?.status === 401) {
          throw new Error("Authentication required. Please login again.");
        }
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }

      throw new Error("Failed to fetch your groups. Please try again.");
    }
  }

  /**
   * ➕ CREATE GROUP
   * POST {studygroup base url}/groups/create
   */
  static async createGroup(groupData: CreateGroupData): Promise<GroupResponse> {
    try {
      const { data } = await api.post(
        `${config.NEXT_PUBLIC_CREATE_STUDY_GROUP_ENDPOINT || process.env.NEXT_PUBLIC_CREATE_STUDY_GROUP_ENDPOINT}`,
        groupData
      );
      return data.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.code === "ERR_NETWORK") {
          throw new Error(
            "Unable to connect to server. Please check your internet connection."
          );
        }
        if (error.response?.status === 400) {
          const errors = error.response?.data?.errors
            ?.map((e: any) => e.message)
            .join(", ");
          throw new Error(
            errors || error.response?.data?.message || "Validation failed"
          );
        }
        if (error.response?.status === 401) {
          throw new Error("Session expired. Please login again.");
        }
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }

      throw new Error("Failed to create group. Please try again.");
    }
  }

  // ADD this method inside StudyGroupService class
  static async getTopRankedGroups(
    limit: number = 3
  ): Promise<TopRankedGroupResponse[]> {
    try {
      // const { data } = await api.get(
      //   `${config.NEXT_PUBLIC_TOP_RANKED_STUDY_GROUPS_ENDPOINT || process.env.NEXT_PUBLIC_TOP_RANKED_STUDY_GROUPS_ENDPOINT}`,
      //   {
      //     params: { limit },
      //   }
      // );

      const { data } = await api.get(
        `${joinUrl(config.NEXT_PUBLIC_STUDY_GROUP_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_ENDPOINT, "/top-ranked")}`,
        {
          params: { limit },
        }
      );
      return data.data.groups;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch top ranked groups.");
    }
  }

  /**
   * 🔍 GET GROUP BY ID
   * GET {studygroup base url}/groups/:groupId
   */
  static async getGroupById(groupId: string): Promise<GroupResponse> {
    try {
      const { data } = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUP_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_ENDPOINT}/${groupId}`
      );
      return data.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.code === "ERR_NETWORK") {
          throw new Error(
            "Unable to connect to server. Please check your internet connection."
          );
        }
        if (error.response?.status === 401) {
          throw new Error("Authentication required. Please login again.");
        }
        if (error.response?.status === 403) {
          throw new Error(
            "This group is private. You need to be a member to view it."
          );
        }
        if (error.response?.status === 404) {
          throw new Error("Group not found.");
        }
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }

      throw new Error("Failed to fetch group. Please try again.");
    }
  }

  /**
   * ✏️ UPDATE GROUP
   * PUT {studygroup base url}/groups/:groupId
   * Leader only
   */
  static async updateGroup(
    groupId: string,
    updates: UpdateGroupData
  ): Promise<GroupResponse> {
    try {
      const { data } = await api.put(
        `${config.NEXT_PUBLIC_STUDY_GROUP_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_ENDPOINT}/${groupId}`,
        updates
      );
      return data.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.code === "ERR_NETWORK") {
          throw new Error(
            "Unable to connect to server. Please check your internet connection."
          );
        }
        if (error.response?.status === 400) {
          const errors = error.response?.data?.errors
            ?.map((e: any) => e.message)
            .join(", ");
          throw new Error(
            errors || error.response?.data?.message || "Validation failed"
          );
        }
        if (error.response?.status === 401) {
          throw new Error("Session expired. Please login again.");
        }
        if (error.response?.status === 403) {
          throw new Error("Only the group leader can update the group.");
        }
        if (error.response?.status === 404) {
          throw new Error("Group not found.");
        }
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }

      throw new Error("Failed to update group. Please try again.");
    }
  }

  /**
   * 🗑️ DELETE GROUP
   * DELETE {studygroup base url}/groups/:groupId
   * Leader only
   */
  static async deleteGroup(groupId: string): Promise<void> {
    try {
      await api.delete(
        `${config.NEXT_PUBLIC_STUDY_GROUP_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_ENDPOINT}/${groupId}`
      );
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.code === "ERR_NETWORK") {
          throw new Error(
            "Unable to connect to server. Please check your internet connection."
          );
        }
        if (error.response?.status === 401) {
          throw new Error("Session expired. Please login again.");
        }
        if (error.response?.status === 403) {
          throw new Error("Only the group leader can delete the group.");
        }
        if (error.response?.status === 404) {
          throw new Error("Group not found.");
        }
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }

      throw new Error("Failed to delete group. Please try again.");
    }
  }

  /**
   * 🚪 JOIN GROUP
   * POST {studygroup base url}/groups/:groupId/join
   */
  static async joinGroup(
    groupId: string,
    joinData?: JoinGroupData
  ): Promise<GroupResponse> {
    try {
      const { data } = await api.post(
        `${config.NEXT_PUBLIC_STUDY_GROUP_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_ENDPOINT}/${groupId}/join`,
        joinData || {}
      );
      return data.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.code === "ERR_NETWORK") {
          throw new Error(
            "Unable to connect to server. Please check your internet connection."
          );
        }
        if (error.response?.status === 400) {
          throw new Error(
            error.response?.data?.message || "Invalid join code."
          );
        }
        if (error.response?.status === 401) {
          throw new Error("Session expired. Please login again.");
        }
        if (error.response?.status === 403) {
          const msg = error.response?.data?.message;
          if (msg?.includes("banned"))
            throw new Error("You have been banned from this group.");
          if (msg?.includes("full")) throw new Error("This group is full.");
          throw new Error(msg || "You cannot join this group.");
        }
        if (error.response?.status === 404) {
          throw new Error("Group not found.");
        }
        if (error.response?.status === 409) {
          throw new Error("You are already a member of this group.");
        }
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }

      throw new Error("Failed to join group. Please try again.");
    }
  }

  /**
   * 👋 LEAVE GROUP
   * POST {studygroup base url}/groups/:groupId/leave
   */
  static async leaveGroup(groupId: string): Promise<void> {
    try {
      // console.loglog('👋 [LEAVE_GROUP] Leaving group:', groupId);

      await api.post(
        `${config.NEXT_PUBLIC_STUDY_GROUP_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_ENDPOINT}/${groupId}/leave`
      );

      // console.loglog('✅ [LEAVE_GROUP] Left group successfully');
    } catch (error: any) {
      // console.logerror('❌ [LEAVE_GROUP] Failed:', error);

      if (axios.isAxiosError(error)) {
        if (error.code === "ERR_NETWORK") {
          throw new Error(
            "Unable to connect to server. Please check your internet connection."
          );
        }
        if (error.response?.status === 400) {
          throw new Error(
            error.response?.data?.message ||
              "Group leader cannot leave. Please delete or transfer leadership first."
          );
        }
        if (error.response?.status === 401) {
          throw new Error("Session expired. Please login again.");
        }
        if (error.response?.status === 404) {
          throw new Error("Group not found or you are not a member.");
        }
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }

      throw new Error("Failed to leave group. Please try again.");
    }
  }

  // =======================================================================================
  // ====================MEMBER ROUTES================================================
  // =======================================================================================

  /**
   * 👥 GET GROUP MEMBERS
   * GET {studygroup base url}/member/:groupId/members
   */
  static async getGroupMembers(
    groupId: string
  ): Promise<{ total: number; members: GroupMember[] }> {
    try {
      // console.loglog('👥 [GET_MEMBERS] Fetching members for group:', groupId);

      const { data } = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUP_MEMBER_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_MEMBER_ENDPOINT}/${groupId}/members`
      );

      // console.loglog('✅ [GET_MEMBERS] Members fetched:', data.data?.length);
      return data.data;
    } catch (error: any) {
      // console.logerror('❌ [GET_MEMBERS] Failed:', error);

      if (axios.isAxiosError(error)) {
        if (error.code === "ERR_NETWORK") {
          throw new Error(
            "Unable to connect to server. Please check your internet connection."
          );
        }
        if (error.response?.status === 401) {
          throw new Error("Authentication required. Please login again.");
        }
        if (error.response?.status === 403) {
          throw new Error("You do not have access to view group members.");
        }
        if (error.response?.status === 404) {
          throw new Error("Group not found.");
        }
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }

      throw new Error("Failed to fetch group members. Please try again.");
    }
  }
  /**
   * ➕ ADD MEMBER (leader/admin only)
   * POST {studygroup base url}/member/:groupId/add-member
   */
  static async addMember(groupId: string, userId: string): Promise<void> {
    try {
      const { data } = await api.post(
        `${config.NEXT_PUBLIC_STUDY_GROUP_MEMBER_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_MEMBER_ENDPOINT}/${groupId}/add-member`,
        { userId }
      );
      return data.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 409)
          throw new Error("User is already a member.");
        if (error.response?.status === 403)
          throw new Error("You do not have permission to add members.");
        if (error.response?.status === 404)
          throw new Error("Group or user not found.");
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to add member.");
    }
  }

  /**
   * ❌ REMOVE MEMBER (leader/admin only)
   * DELETE /:groupId/remove-member/:userId
   */
  static async removeMember(groupId: string, userId: string): Promise<void> {
    try {
      await api.delete(
        `${config.NEXT_PUBLIC_STUDY_GROUP_MEMBER_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_MEMBER_ENDPOINT}/${groupId}/remove-member/${userId}`
      );
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403)
          throw new Error("You do not have permission to remove members.");
        if (error.response?.status === 404)
          throw new Error("Member not found.");
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to remove member.");
    }
  }

  /**
   * 🔢 GET MEMBER COUNT
   * GET /:groupId/member-count
   */
  static async getMemberCount(groupId: string): Promise<{
    groupId: string;
    memberCount: number;
    capacity: number;
    availableSlots: number;
  }> {
    try {
      const { data } = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUP_MEMBER_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_MEMBER_ENDPOINT}/${groupId}/member-count`
      );
      return data.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch member count.");
    }
  }

  // =======================================================================================
  // ====================SEARCH ROUTES================================================
  // =======================================================================================

  /**
   * 🔍 SEARCH GROUPS
   * GET {studygroup base url}/search/groups
   */
  static async searchGroups(
    params?: SearchGroupsQuery
  ): Promise<SearchGroupsResponse> {
    try {
      // const { data } = await api.get(
      //   `${config.NEXT_PUBLIC_STUDY_GROUP_SEARCH_GROUPS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_SEARCH_GROUPS_ENDPOINT}`,
      //   { params }
      // );
      const { data } = await api.get(
        `${joinUrl(config.NEXT_PUBLIC_STUDY_GROUP_SEARCH_GROUPS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_SEARCH_GROUPS_ENDPOINT, "/groups")}`,
        { params: cleanParams(params) }
      );
      return data.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to search groups.");
    }
  }

  /**
   * 🔥 GET POPULAR GROUPS
   * GET {studygroup base url}/search/groups/popular
   */
  static async getPopularGroups(
    limit?: number
  ): Promise<PopularGroupsResponse> {
    try {
      // const { data } = await api.get(
      //   `${config.NEXT_PUBLIC_STUDY_GROUP_SEARCH_POPULAR_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_SEARCH_POPULAR_ENDPOINT}`,
      //   {
      //     params: limit ? { limit } : undefined,
      //   }
      // );

      const { data } = await api.get(
        `${joinUrl(config.NEXT_PUBLIC_STUDY_GROUP_SEARCH_POPULAR_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_SEARCH_POPULAR_ENDPOINT, "/groups/popular")}`,
        {
          params: limit ? { limit } : undefined,
        }
      );
      return data.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch popular groups.");
    }
  }

  /**
   * 📈 GET TRENDING GROUPS
   * GET {studygroup base url}/search/groups/trending
   */
  static async getTrendingGroups(
    limit?: number
  ): Promise<PopularGroupsResponse> {
    try {
      // const { data } = await api.get(
      //   `${config.NEXT_PUBLIC_STUDY_GROUP_SEARCH_TRENDING_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_SEARCH_TRENDING_ENDPOINT}`,
      //   {
      //     params: limit ? { limit } : undefined,
      //   }
      // );

      const { data } = await api.get(
        `${joinUrl(config.NEXT_PUBLIC_STUDY_GROUP_SEARCH_TRENDING_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_SEARCH_TRENDING_ENDPOINT, "/groups/trending")}`,
        {
          params: limit ? { limit } : undefined,
        }
      );
      return data.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch trending groups.");
    }
  }

  /**
   * 💡 GET RECOMMENDED GROUPS
   * GET {studygroup base url}/search/groups/recommended
   */
  static async getRecommendedGroups(params?: {
    category?: GroupCategory;
    limit?: number;
  }): Promise<PopularGroupsResponse> {
    try {
      // const { data } = await api.get(
      //   `${config.NEXT_PUBLIC_STUDY_GROUP_SEARCH_RECOMMENDED_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_SEARCH_RECOMMENDED_ENDPOINT}`,
      //   { params }
      // );
      const { data } = await api.get(
        `${joinUrl(config.NEXT_PUBLIC_STUDY_GROUP_SEARCH_RECOMMENDED_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_SEARCH_RECOMMENDED_ENDPOINT, "/groups/recommended")}`,
        { params: cleanParams(params) }
      );
      return data.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch recommended groups.");
    }
  }

  /**
   * 📚 GET GROUPS BY CATEGORY
   * GET {studygroup base url}/search/groups/category/:category
   */
  static async getGroupsByCategory(
    category: GroupCategory,
    params?: { page?: number; limit?: number; sort?: string }
  ): Promise<SearchGroupsResponse & { category: string }> {
    try {
      // const { data } = await api.get(
      //   `${config.NEXT_PUBLIC_STUDY_GROUP_SEARCH_CATEGORY_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_SEARCH_CATEGORY_ENDPOINT}`,
      //   { params: { ...params, category } }
      // );
      const { data } = await api.get(
        `${joinUrl(config.NEXT_PUBLIC_STUDY_GROUP_SEARCH_CATEGORY_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_SEARCH_CATEGORY_ENDPOINT, "/groups/category")}/${encodeURIComponent(category)}`,
        { params: cleanParams(params) }
      );
      return data.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400)
          throw new Error("Invalid category.");
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch groups by category.");
    }
  }

  /**
   * 🪑 GET AVAILABLE GROUPS (with open slots)
   * GET {studygroup base url}/search/groups/available
   */
  static async getAvailableGroups(params?: {
    page?: number;
    limit?: number;
  }): Promise<SearchGroupsResponse> {
    try {
      // const { data } = await api.get(
      //   `${config.NEXT_PUBLIC_STUDY_GROUP_SEARCH_AVAILABLE_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_SEARCH_AVAILABLE_ENDPOINT}`,
      //   { params }
      // );

      const { data } = await api.get(
        `${joinUrl(config.NEXT_PUBLIC_STUDY_GROUP_SEARCH_AVAILABLE_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_SEARCH_AVAILABLE_ENDPOINT, "/groups/available")}`,
        { params: cleanParams(params) }
      );
      return data.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch available groups.");
    }
  }

  /**
   * 🏷️ SEARCH GROUPS BY TAGS
   * GET {studygroup base url}/search/groups/tags
   */
  static async searchGroupsByTags(params: {
    tags: string | string[];
    page?: number;
    limit?: number;
  }): Promise<SearchGroupsResponse> {
    try {
      // const { data } = await api.get(
      //   `${config.NEXT_PUBLIC_STUDY_GROUP_SEARCH_TAGS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_SEARCH_TAGS_ENDPOINT}`,
      //   { params }
      // );

      const { data } = await api.get(
        `${joinUrl(config.NEXT_PUBLIC_STUDY_GROUP_SEARCH_TAGS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_SEARCH_TAGS_ENDPOINT, "/groups/tags")}`,
        { params: cleanParams(params) }
      );
      return data.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400)
          throw new Error("Tags parameter is required.");
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to search groups by tags.");
    }
  }

  // ADD inside StudyGroupService class — after searchGroupsByTags method

  // =======================================================================================
  // ====================TIMER ROUTES================================================
  // =======================================================================================

  static async startTimer(data: StartTimerData): Promise<TimerSessionResponse> {
    try {
      // const { data: res } = await api.post(
      //   `${config.NEXT_PUBLIC_STUDY_GROUP_TIMER_START_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_TIMER_START_ENDPOINT}`,
      //   data
      // );

      const { data: res } = await api.post(
        `${joinUrl(config.NEXT_PUBLIC_STUDY_GROUP_TIMER_START_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_TIMER_START_ENDPOINT, "/start")}`,
        data
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to start timer.");
    }
  }

  static async pauseTimer(): Promise<TimerSessionResponse> {
    try {
      // const { data: res } = await api.patch(
      //   `${config.NEXT_PUBLIC_STUDY_GROUP_TIMER_PAUSE_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_TIMER_PAUSE_ENDPOINT}`
      // );

      const { data: res } = await api.patch(
        `${joinUrl(config.NEXT_PUBLIC_STUDY_GROUP_TIMER_PAUSE_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_TIMER_PAUSE_ENDPOINT, "/pause")}`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to pause timer.");
    }
  }

  static async resumeTimer(): Promise<TimerSessionResponse> {
    try {
      // const { data: res } = await api.patch(
      //   `${config.NEXT_PUBLIC_STUDY_GROUP_TIMER_RESUME_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_TIMER_RESUME_ENDPOINT}`
      // );

      const { data: res } = await api.patch(
        `${joinUrl(config.NEXT_PUBLIC_STUDY_GROUP_TIMER_RESUME_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_TIMER_RESUME_ENDPOINT, "/resume")}`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to resume timer.");
    }
  }

  static async stopTimer(notes?: string): Promise<TimerSessionResponse> {
    try {
      // const { data: res } = await api.patch(
      //   `${config.NEXT_PUBLIC_STUDY_GROUP_TIMER_STOP_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_TIMER_STOP_ENDPOINT}`,
      //   { notes }
      // );

      const { data: res } = await api.patch(
        `${joinUrl(config.NEXT_PUBLIC_STUDY_GROUP_TIMER_STOP_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_TIMER_STOP_ENDPOINT, "/stop")}`,
        { notes }
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to stop timer.");
    }
  }

  static async cancelTimer(): Promise<void> {
    try {
      // await api.delete(
      //   `${config.NEXT_PUBLIC_STUDY_GROUP_TIMER_CANCEL_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_TIMER_CANCEL_ENDPOINT}`
      // );
      await api.delete(
        `${joinUrl(config.NEXT_PUBLIC_STUDY_GROUP_TIMER_CANCEL_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_TIMER_CANCEL_ENDPOINT, "/cancel")}`
      );
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to cancel timer.");
    }
  }

  static async getActiveTimer(): Promise<TimerSessionResponse | null> {
    try {
      // const { data: res } = await api.get(
      //   `${config.NEXT_PUBLIC_STUDY_GROUP_TIMER_ACTIVE_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_TIMER_ACTIVE_ENDPOINT}`
      // );

      const { data: res } = await api.get(
        `${joinUrl(config.NEXT_PUBLIC_STUDY_GROUP_TIMER_ACTIVE_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_TIMER_ACTIVE_ENDPOINT, "/active")}`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch active timer.");
    }
  }

  static async getAllTimerSessions(params?: {
    page?: number;
    limit?: number;
    status?: string;
    subject?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<AllSessionsResponse> {
    try {
      const { data: res } = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUP_TIMER_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_TIMER_ENDPOINT}`,
        { params }
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch sessions.");
    }
  }

  static async getTodayTimerSessions(): Promise<TodaySessionsResponse> {
    try {
      // const { data: res } = await api.get(
      //   `${config.NEXT_PUBLIC_STUDY_GROUP_TIMER_TODAY_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_TIMER_TODAY_ENDPOINT}`
      // );

      const { data: res } = await api.get(
        `${joinUrl(config.NEXT_PUBLIC_STUDY_GROUP_TIMER_TODAY_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_TIMER_TODAY_ENDPOINT, "/today")}`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch today sessions.");
    }
  }

  static async getGroupStreakLeaderboard(
    groupId: string,
    limit: number = 50
  ): Promise<GroupStreakLeaderboardResponse> {
    try {
      const base =
        process.env.NEXT_PUBLIC_STUDY_GROUP_STREAK_ENDPOINT ||
        "/study-group/streak";
      const { data: res } = await api.get(
        `${joinUrl(base, "/group-leaderboard")}/${groupId}`,
        { params: { limit } }
      );
      return res.data;
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to fetch group streak leaderboard"
      );
    }
  }

  static async getTimerStats(): Promise<TimerStatsResponse> {
    try {
      // const { data: res } = await api.get(
      //   `${config.NEXT_PUBLIC_STUDY_GROUP_TIMER_STATS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_TIMER_STATS_ENDPOINT}`
      // );

      const { data: res } = await api.get(
        `${joinUrl(config.NEXT_PUBLIC_STUDY_GROUP_TIMER_STATS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_TIMER_STATS_ENDPOINT, "/stats")}`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch timer stats.");
    }
  }

  static async deleteTimerSession(sessionId: string): Promise<void> {
    try {
      await api.delete(
        `${config.NEXT_PUBLIC_STUDY_GROUP_TIMER_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_TIMER_ENDPOINT}/${sessionId}`
      );
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to delete session.");
    }
  }

  // =======================================================================================
  // ====================GOAL ROUTES=======================================================
  // =======================================================================================

  // Class ke andar add karo — timer methods ke baad
  static async getAllGoals(params?: {
    completed?: boolean;
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: GoalResponse[]; total: number; page: number }> {
    try {
      const { data: res } = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUP_GOALS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_GOALS_ENDPOINT}`,
        { params }
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch goals.");
    }
  }

  static async getActiveGoals(): Promise<GoalResponse[]> {
    try {
      // const { data: res } = await api.get(
      //   `${config.NEXT_PUBLIC_STUDY_GROUP_GOALS_ACTIVE_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_GOALS_ACTIVE_ENDPOINT}`
      // );
      const { data: res } = await api.get(
        `${joinUrl(config.NEXT_PUBLIC_STUDY_GROUP_GOALS_ACTIVE_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_GOALS_ACTIVE_ENDPOINT, "/active")}`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch active goals.");
    }
  }

  static async createGoal(data: any): Promise<GoalResponse> {
    try {
      const { data: res } = await api.post(
        `${config.NEXT_PUBLIC_STUDY_GROUP_GOALS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_GOALS_ENDPOINT}`,
        data
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to create goal.");
    }
  }

  static async updateGoal(goalId: string, data: any): Promise<GoalResponse> {
    try {
      const { data: res } = await api.put(
        `${config.NEXT_PUBLIC_STUDY_GROUP_GOALS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_GOALS_ENDPOINT}/${goalId}`,
        data
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to update goal.");
    }
  }

  static async deleteGoal(goalId: string): Promise<void> {
    try {
      await api.delete(
        `${config.NEXT_PUBLIC_STUDY_GROUP_GOALS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_GOALS_ENDPOINT}/${goalId}`
      );
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to delete goal.");
    }
  }

  static async markGoalComplete(goalId: string): Promise<GoalResponse> {
    try {
      const { data: res } = await api.patch(
        `${config.NEXT_PUBLIC_STUDY_GROUP_GOALS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_GOALS_ENDPOINT}/${goalId}/complete`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to mark goal complete.");
    }
  }

  static async getGoalStats(): Promise<GoalStatsResponse> {
    try {
      const { data: res } = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUP_GOALS_STATS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_GOALS_STATS_ENDPOINT}/stats`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch goal stats.");
    }
  }

  static async updateGoalProgress({
    goalId,
    hoursToAdd,
  }: {
    goalId: string;
    hoursToAdd: number;
  }): Promise<{ goalId: string; hoursToAdd: number }> {
    try {
      const { data: res } = await api.patch(
        `${config.NEXT_PUBLIC_STUDY_GROUP_GOALS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_GOALS_ENDPOINT}/${goalId}/progress`,
        { hoursToAdd }
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to update progress.");
    }
  }

  static async markGoalIncomplete(goalId: string): Promise<GoalResponse> {
    try {
      const { data: res } = await api.patch(
        `${config.NEXT_PUBLIC_STUDY_GROUP_GOALS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_GOALS_ENDPOINT}/${goalId}/incomplete`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to mark goal incomplete.");
    }
  }

  // =======================================================================================
  // ====================student dashboard ROUTES================================================
  // =======================================================================================

  // ADD methods — getGoalStats ke baad class ke andar
  static async getUserDashboard(): Promise<UserDashboardResponse> {
    try {
      // const { data: res } = await api.get(
      //   `${config.NEXT_PUBLIC_STUDY_GROUP_DASHBOARD_USER_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_DASHBOARD_USER_ENDPOINT}`
      // );

      const { data: res } = await api.get(
        `${joinUrl(config.NEXT_PUBLIC_STUDY_GROUP_DASHBOARD_USER_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_DASHBOARD_USER_ENDPOINT, "/user")}`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch user dashboard.");
    }
  }

  static async getStudyStatistics(
    period: "7days" | "30days" | "90days" = "7days"
  ): Promise<StudyStatisticsResponse> {
    try {
      // const { data: res } = await api.get(
      //   `${config.NEXT_PUBLIC_STUDY_GROUP_DASHBOARD_STATISTICS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_DASHBOARD_STATISTICS_ENDPOINT}`,
      //   {
      //     params: { period },
      //   }
      // );

      const { data: res } = await api.get(
        `${joinUrl(config.NEXT_PUBLIC_STUDY_GROUP_DASHBOARD_STATISTICS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_DASHBOARD_STATISTICS_ENDPOINT, "/statistics")}`,
        {
          params: { period },
        }
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch study statistics.");
    }
  }

  static async getPerformanceAnalytics(): Promise<PerformanceAnalyticsResponse> {
    try {
      // const { data: res } = await api.get(
      //   `${config.NEXT_PUBLIC_STUDY_GROUP_DASHBOARD_ANALYTICS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_DASHBOARD_ANALYTICS_ENDPOINT}`
      // );

      const { data: res } = await api.get(
        `${joinUrl(config.NEXT_PUBLIC_STUDY_GROUP_DASHBOARD_ANALYTICS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_DASHBOARD_ANALYTICS_ENDPOINT, "/analytics")}`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch performance analytics.");
    }
  }

  // =======================================================================================
  // ====================TODOS ROUTES================================================
  // =======================================================================================

  static async createTask(data: CreateTaskInput): Promise<TaskResponse> {
    try {
      const { data: res } = await api.post(
        `${config.NEXT_PUBLIC_STUDY_GROUP_TASKS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_TASKS_ENDPOINT}`,
        data
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.code === "ERR_NETWORK")
          throw new Error("No internet connection.");
        if (error.response?.status === 401)
          throw new Error("Session expired. Please login again.");
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to create task.");
    }
  }

  static async getAllTasks(
    params?: Partial<TaskQueryInput>
  ): Promise<TaskListResponse> {
    try {
      const { data: res } = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUP_TASKS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_TASKS_ENDPOINT}`,
        { params }
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401)
          throw new Error("Session expired. Please login again.");
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch tasks.");
    }
  }

  static async getTaskById(taskId: string): Promise<TaskResponse> {
    try {
      const { data: res } = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUP_TASKS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_TASKS_ENDPOINT}/${taskId}`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401)
          throw new Error("Session expired. Please login again.");
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch task.");
    }
  }

  static async updateTask(
    taskId: string,
    data: UpdateTaskInput
  ): Promise<TaskResponse> {
    try {
      const { data: res } = await api.put(
        `${config.NEXT_PUBLIC_STUDY_GROUP_TASKS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_TASKS_ENDPOINT}/${taskId}`,
        data
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401)
          throw new Error("Session expired. Please login again.");
        if (error.response?.status === 403)
          throw new Error("Not authorized to update this task.");
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to update task.");
    }
  }

  static async deleteTask(taskId: string): Promise<void> {
    try {
      await api.delete(
        `${config.NEXT_PUBLIC_STUDY_GROUP_TASKS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_TASKS_ENDPOINT}/${taskId}`
      );
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401)
          throw new Error("Session expired. Please login again.");
        if (error.response?.status === 403)
          throw new Error("Not authorized to delete this task.");
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to delete task.");
    }
  }

  static async markComplete(taskId: string): Promise<TaskResponse> {
    try {
      const { data: res } = await api.patch(
        `${config.NEXT_PUBLIC_STUDY_GROUP_TASKS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_TASKS_ENDPOINT}/${taskId}/complete`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401)
          throw new Error("Session expired. Please login again.");
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to mark task complete.");
    }
  }

  static async markIncomplete(taskId: string): Promise<TaskResponse> {
    try {
      const { data: res } = await api.patch(
        `${config.NEXT_PUBLIC_STUDY_GROUP_TASKS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_TASKS_ENDPOINT}/${taskId}/incomplete`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401)
          throw new Error("Session expired. Please login again.");
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to mark task incomplete.");
    }
  }

  static async getStats(): Promise<TaskStatsResponse> {
    try {
      // const { data: res } = await api.get(
      //   `${config.NEXT_PUBLIC_STUDY_GROUP_TASKS_STATS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_TASKS_STATS_ENDPOINT}`
      // );
      const { data: res } = await api.get(
        `${joinUrl(config.NEXT_PUBLIC_STUDY_GROUP_TASKS_STATS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_TASKS_STATS_ENDPOINT, "/stats")}`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401)
          throw new Error("Session expired. Please login again.");
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch task stats.");
    }
  }

  static async getOverdueTasks(): Promise<TaskResponse[]> {
    try {
      // const { data: res } = await api.get(
      //   `${config.NEXT_PUBLIC_STUDY_GROUP_TASKS_OVERDUE_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_TASKS_OVERDUE_ENDPOINT}`
      // );
      const { data: res } = await api.get(
        `${joinUrl(config.NEXT_PUBLIC_STUDY_GROUP_TASKS_OVERDUE_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_TASKS_OVERDUE_ENDPOINT, "/overdue")}`
      );
      // return res.data;
      return Array.isArray(res.data) ? res.data : (res.data?.tasks ?? []);
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401)
          throw new Error("Session expired. Please login again.");
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch overdue tasks.");
    }
  }

  static async getUpcomingTasks(days: number = 7): Promise<TaskResponse[]> {
    try {
      // const { data: res } = await api.get(
      //   `${config.NEXT_PUBLIC_STUDY_GROUP_TASKS_UPCOMING_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_TASKS_UPCOMING_ENDPOINT}`,
      //   { params: { days } }
      // );
      const { data: res } = await api.get(
        `${joinUrl(config.NEXT_PUBLIC_STUDY_GROUP_TASKS_UPCOMING_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_TASKS_UPCOMING_ENDPOINT, "/upcoming")}`,
        { params: { days } }
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401)
          throw new Error("Session expired. Please login again.");
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch upcoming tasks.");
    }
  }

  // ==================== JOIN REQUEST METHODS ====================

  // Send join request to private group
  static async sendJoinRequest(
    groupId: string,
    data?: SendJoinRequestData
  ): Promise<JoinRequestResponse> {
    try {
      const { data: res } = await api.post(
        `${config.NEXT_PUBLIC_STUDY_GROUP_JOIN_REQUEST_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_JOIN_REQUEST_ENDPOINT}/${groupId}/send`,
        data || {}
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 409)
          throw new Error(
            error.response.data.message || "Request already sent"
          );
        if (error.response?.status === 403)
          throw new Error(error.response.data.message || "Cannot send request");
        if (error.response?.status === 404) throw new Error("Group not found");
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to send join request");
    }
  }

  // Cancel own pending request
  static async cancelJoinRequest(groupId: string): Promise<void> {
    try {
      await api.delete(
        `${config.NEXT_PUBLIC_STUDY_GROUP_JOIN_REQUEST_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_JOIN_REQUEST_ENDPOINT}/${groupId}/cancel`
      );
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404)
          throw new Error("No pending request found");
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to cancel request");
    }
  }

  // Get request status for a group
  static async getJoinRequestStatus(
    groupId: string
  ): Promise<JoinRequestStatusResponse> {
    try {
      const { data: res } = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUP_JOIN_REQUEST_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_JOIN_REQUEST_ENDPOINT}/${groupId}/status`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to get request status");
    }
  }

  // Get all my requests
  static async getMyJoinRequests(): Promise<MyRequestsResponse[]> {
    try {
      const { data: res } = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUP_JOIN_REQUESTS_MY_REQUESTS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_JOIN_REQUESTS_MY_REQUESTS_ENDPOINT}/my-requests`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch your requests");
    }
  }

  // ── Leader side methods ──

  static async getGroupPendingRequests(
    groupId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PendingRequestsResponse> {
    try {
      const { data: res } = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUP_JOIN_REQUEST_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_JOIN_REQUEST_ENDPOINT}/${groupId}/pending`,
        { params: { page, limit } }
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403)
          throw new Error("Not authorized to view requests");
        if (error.response?.status === 404) throw new Error("Group not found");
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch pending requests");
    }
  }

  static async respondToJoinRequest(
    joinRequestId: string,
    data: RespondToRequestData
  ): Promise<any> {
    try {
      const { data: res } = await api.patch(
        `${config.NEXT_PUBLIC_STUDY_GROUP_JOIN_REQUEST_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_JOIN_REQUEST_ENDPOINT}/${joinRequestId}/respond`,
        data
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) throw new Error("Not authorized");
        if (error.response?.status === 404)
          throw new Error("Request not found");
        if (error.response?.status === 400)
          throw new Error(error.response.data.message || "Invalid action");
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to respond to request");
    }
  }

  // ==================== CHAT METHODS ====================
  // Add inside StudyGroupService class

  static async sendMessage(
    groupId: string,
    data: SendMessageData
  ): Promise<MessageResponse> {
    try {
      const { data: res } = await api.post(
        `${config.NEXT_PUBLIC_STUDY_GROUP_CHAT_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_CHAT_ENDPOINT}/${groupId}/send`,
        data
      );
      return res.data?.data || res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403)
          throw new Error("You are not a member of this group.");
        if (error.response?.status === 400)
          throw new Error(error.response.data.message || "Validation failed.");
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to send message.");
    }
  }

  static async getMessages(
    groupId: string,
    params?: GetMessagesParams
  ): Promise<GetMessagesResponse> {
    try {
      const { data: res } = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUP_CHAT_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_CHAT_ENDPOINT}/${groupId}/messages`,
        { params }
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403)
          throw new Error("You are not a member of this group.");
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch messages.");
    }
  }

  static async getPinnedMessages(groupId: string): Promise<MessageResponse[]> {
    try {
      const { data: res } = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUP_CHAT_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_CHAT_ENDPOINT}/${groupId}/pinned`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch pinned messages.");
    }
  }

  static async searchMessages(
    groupId: string,
    query: string,
    params?: { page?: number; limit?: number }
  ): Promise<SearchMessagesResponse> {
    try {
      const { data: res } = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUP_CHAT_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_CHAT_ENDPOINT}/${groupId}/search`,
        { params: { query, ...params } }
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to search messages.");
    }
  }

  static async editMessage(
    messageId: string,
    content: string
  ): Promise<MessageResponse> {
    try {
      const { data: res } = await api.put(
        `${config.NEXT_PUBLIC_STUDY_GROUP_CHAT_MESSAGE_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_CHAT_MESSAGE_ENDPOINT}/${messageId}`,
        { content }
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403)
          throw new Error("You can only edit your own messages.");
        if (error.response?.status === 400)
          throw new Error(
            error.response.data.message || "Cannot edit this message."
          );
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to edit message.");
    }
  }

  static async deleteMessage(messageId: string): Promise<void> {
    try {
      await api.delete(
        `${config.NEXT_PUBLIC_STUDY_GROUP_CHAT_MESSAGE_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_CHAT_MESSAGE_ENDPOINT}/${messageId}`
      );
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403)
          throw new Error("You can only delete your own messages.");
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to delete message.");
    }
  }

  static async reactToMessage(
    messageId: string,
    emoji: ReactionData["emoji"]
  ): Promise<MessageResponse> {
    try {
      const { data: res } = await api.post(
        `${config.NEXT_PUBLIC_STUDY_GROUP_CHAT_MESSAGE_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_CHAT_MESSAGE_ENDPOINT}/${messageId}/react`,
        { emoji }
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) throw new Error("Invalid emoji.");
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to react to message.");
    }
  }

  static async togglePinMessage(messageId: string): Promise<MessageResponse> {
    try {
      const { data: res } = await api.patch(
        `${config.NEXT_PUBLIC_STUDY_GROUP_CHAT_MESSAGE_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_CHAT_MESSAGE_ENDPOINT}/${messageId}/pin`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403)
          throw new Error("Only group leader can pin messages.");
        if (error.response?.status === 400)
          throw new Error(error.response.data.message || "Cannot pin message.");
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to pin message.");
    }
  }

  static async markMessageAsRead(messageId: string): Promise<void> {
    try {
      await api.patch(
        `${config.NEXT_PUBLIC_STUDY_GROUP_CHAT_MESSAGE_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_CHAT_MESSAGE_ENDPOINT}/${messageId}/read`
      );
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to mark message as read.");
    }
  }

  static async getMessageReadStatus(
    messageId: string
  ): Promise<ReadStatusResponse> {
    try {
      const { data: res } = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUP_CHAT_MESSAGE_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_CHAT_MESSAGE_ENDPOINT}/${messageId}/read-status`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch read status.");
    }
  }

  // ==================== FILE UPLOAD (AWS) ====================

  static async uploadFileToChat(
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<{
    fileUrl: string;
    fileName: string;
    fileSize: number;
    messageType: "image" | "file" | "video";
  }> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data: res } = await api.post(
        `${config.NEXT_PUBLIC_STUDY_GROUP_FILES_UPLOAD_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_FILES_UPLOAD_ENDPOINT}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const percent = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              onProgress(percent);
            }
          },
        }
      );

      const fileUrl: string = res.data.url;
      const messageType = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
          ? "video"
          : "file";

      return {
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        messageType,
      };
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400)
          throw new Error("Invalid file type or size.");
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to upload file.");
    }
  }

  // ==================== FILE METHODS ====================
  // Add inside StudyGroupService class

  static async uploadGroupFile(
    groupId: string,
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<FileUploadResponse> {
    try {
      const formData = new FormData();
      formData.append("file", file); // group files route uses uploadSingle('file')
      const { data: res } = await api.post(
        `${config.NEXT_PUBLIC_STUDY_GROUP_FILES_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_FILES_ENDPOINT}/${groupId}/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const percent = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              onProgress(percent);
            }
          },
        }
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403)
          throw new Error("You are not a member of this group.");
        if (error.response?.status === 400)
          throw new Error(error.response.data.message || "Invalid file.");
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to upload file.");
    }
  }

  static async getGroupFiles(
    groupId: string,
    params?: GetFilesParams
  ): Promise<GetFilesResponse> {
    try {
      const { data: res } = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUP_FILES_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_FILES_ENDPOINT}/${groupId}/all`,
        { params }
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch files.");
    }
  }

  static async getGroupPinnedFiles(groupId: string): Promise<GetFilesResponse> {
    try {
      const { data: res } = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUP_FILES_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_FILES_ENDPOINT}/${groupId}/pinned`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch pinned files.");
    }
  }

  static async getFileById(fileId: string): Promise<FileUploadResponse> {
    try {
      const { data: res } = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUP_FILES_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_FILES_ENDPOINT}/${fileId}`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) throw new Error("File not found.");
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch file.");
    }
  }

  static async deleteGroupFile(fileId: string): Promise<void> {
    try {
      await api.delete(
        `${config.NEXT_PUBLIC_STUDY_GROUP_FILES_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_FILES_ENDPOINT}/${fileId}`
      );
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403)
          throw new Error("You can only delete your own files.");
        if (error.response?.status === 404) throw new Error("File not found.");
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to delete file.");
    }
  }

  static async togglePinGroupFile(
    fileId: string
  ): Promise<{ isPinned: boolean }> {
    try {
      const { data: res } = await api.patch(
        `${config.NEXT_PUBLIC_STUDY_GROUP_FILES_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_FILES_ENDPOINT}/${fileId}/pin`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403)
          throw new Error("Only leaders and admins can pin files.");
        if (error.response?.status === 400)
          throw new Error(error.response.data.message || "Cannot pin file.");
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to pin file.");
    }
  }

  static async downloadGroupFile(fileId: string): Promise<string> {
    try {
      // increment download count and get redirect URL
      const { data: res } = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUP_FILES_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_FILES_ENDPOINT}/${fileId}/download`,
        { maxRedirects: 0 } // don't follow redirect, get the URL
      );
      return res.data?.fileUrl ?? "";
    } catch (error: any) {
      // 302 redirect is expected — get fileUrl from file details instead
      if (axios.isAxiosError(error) && error.response?.status === 302) {
        return error.response.headers?.location ?? "";
      }
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to download file.");
    }
  }
  //===================================================================
  // ==================== DOUBT METHODS ===============================
  //===================================================================

  static async getGroupDoubts(
    groupId: string,
    params?: {
      page?: number;
      limit?: number;
      category?: string;
      isSolved?: boolean;
      sort?: string;
      search?: string;
    }
  ): Promise<any> {
    try {
      const { data: res } = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ENDPOINT}/${groupId}/all`,
        { params }
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch doubts.");
    }
  }

  static async postDoubt(
    groupId: string,
    data: {
      title: string;
      description?: string;
      category?: string;
      subject?: string;
      tags?: string[];
      isUrgent?: boolean;
      difficulty?: string;
      taggedMembers?: string[];
    }
  ): Promise<any> {
    try {
      const { data: res } = await api.post(
        `${config.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ENDPOINT}/${groupId}/post`,
        data
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to post doubt.");
    }
  }

  static async updateDoubt(
    doubtId: string,
    data: {
      title?: string;
      description?: string;
      category?: string;
      isUrgent?: boolean;
      difficulty?: string;
      tags?: string[];
    }
  ): Promise<any> {
    try {
      const { data: res } = await api.put(
        `${config.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ENDPOINT}/${doubtId}`,
        data
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to update doubt.");
    }
  }

  static async deleteDoubt(doubtId: string): Promise<void> {
    try {
      await api.delete(
        `${config.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ENDPOINT}/${doubtId}`
      );
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to delete doubt.");
    }
  }

  static async markDoubtSolved(
    doubtId: string,
    bestAnswerId: string
  ): Promise<any> {
    try {
      const { data: res } = await api.patch(
        `${config.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ENDPOINT}/${doubtId}/mark-solved`,
        { bestAnswerId }
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to mark doubt as solved.");
    }
  }

  static async postAnswer(
    doubtId: string,
    data: {
      content: string;
      links?: { url: string; title?: string }[];
    }
  ): Promise<any> {
    try {
      const { data: res } = await api.post(
        `${config.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ENDPOINT}/${doubtId}/answer`,
        data
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to post answer.");
    }
  }

  static async upvoteAnswer(answerId: string): Promise<any> {
    try {
      const { data: res } = await api.post(
        `${config.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ANSWER_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ANSWER_ENDPOINT}/${answerId}/upvote`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to upvote answer.");
    }
  }

  static async downvoteAnswer(answerId: string): Promise<any> {
    try {
      const { data: res } = await api.post(
        `${config.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ANSWER_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ANSWER_ENDPOINT}/${answerId}/downvote`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to downvote answer.");
    }
  }

  static async searchDoubts(query: string, groupId?: string): Promise<any> {
    try {
      const { data: res } = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_SEARCH_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_SEARCH_ENDPOINT}`,
        { params: { query, groupId } }
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to search doubts.");
    }
  }

  static async getSingleDoubt(doubtId: string): Promise<any> {
    try {
      const { data: res } = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ENDPOINT}/${doubtId}`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch doubt.");
    }
  }

  static async getMyDoubts(params?: {
    page?: number;
    limit?: number;
    isSolved?: boolean;
  }): Promise<any> {
    try {
      const { data: res } = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_USER_MY_DOUBTS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_USER_MY_DOUBTS_ENDPOINT}/user/my-doubts`,
        { params }
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch your doubts.");
    }
  }

  static async getSolvedDoubts(
    groupId: string,
    params?: {
      page?: number;
      limit?: number;
      sort?: string;
    }
  ): Promise<any> {
    try {
      const { data: res } = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ENDPOINT}/${groupId}/solved`,
        { params }
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch solved doubts.");
    }
  }

  static async getUnsolvedDoubts(
    groupId: string,
    params?: {
      page?: number;
      limit?: number;
      sort?: string;
    }
  ): Promise<any> {
    try {
      const { data: res } = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ENDPOINT}/${groupId}/unsolved`,
        { params }
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch unsolved doubts.");
    }
  }

  static async getUrgentDoubts(groupId: string): Promise<any> {
    try {
      const { data: res } = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ENDPOINT}/${groupId}/urgent`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch urgent doubts.");
    }
  }

  static async getDoubtAnswers(
    doubtId: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ): Promise<any> {
    try {
      const { data: res } = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ENDPOINT}/${doubtId}/answers`,
        { params }
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch answers.");
    }
  }

  static async updateAnswer(
    answerId: string,
    data: {
      content: string;
      links?: { url: string; title?: string }[];
    }
  ): Promise<any> {
    try {
      const { data: res } = await api.put(
        `${config.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ANSWER_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ANSWER_ENDPOINT}/${answerId}`,
        data
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to update answer.");
    }
  }

  static async deleteAnswer(answerId: string): Promise<void> {
    try {
      await api.delete(
        `${config.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ANSWER_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ANSWER_ENDPOINT}/${answerId}`
      );
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to delete answer.");
    }
  }

  static async removeAnswerVote(answerId: string): Promise<any> {
    try {
      const { data: res } = await api.post(
        `${config.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ANSWER_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ANSWER_ENDPOINT}/${answerId}/remove-vote`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to remove vote.");
    }
  }

  static async tagDoubtMembers(
    doubtId: string,
    memberIds: string[]
  ): Promise<any> {
    try {
      const { data: res } = await api.post(
        `${config.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ENDPOINT}/${doubtId}/tag-member`,
        { memberIds }
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to tag members.");
    }
  }

  static async getGroupDoubtStats(groupId: string): Promise<any> {
    try {
      const { data: res } = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ENDPOINT}/${groupId}/stats`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch doubt stats.");
    }
  }

  static async getUserDoubtStats(userId: string): Promise<any> {
    try {
      const { data: res } = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_USER_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_USER_ENDPOINT}/${userId}/stats`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch user doubt stats.");
    }
  }

  static async getDoubtsByCategory(
    category: string,
    groupId?: string
  ): Promise<any> {
    try {
      const { data: res } = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_CATEGORY_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_CATEGORY_ENDPOINT}/category/${category}`,
        { params: groupId ? { groupId } : undefined }
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch doubts by category.");
    }
  }

  static async getDoubt(doubtId: string) {
    try {
      const res = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ENDPOINT}/${doubtId}`,
        { params: doubtId ? { doubtId } : undefined }
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch doubt details.");
    }
  }

  static async toggleDoubtUpvote(
    doubtId: string,
    action: "upvote" | "remove-upvote"
  ) {
    try {
      const res = await api.post(
        `${config.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_DOUBTS_ENDPOINT}/${doubtId}/${action}`,
        { params: doubtId ? { doubtId } : undefined }
      );
      return res.data.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to toggle doubt upvote.");
    }
  }

  //===================================================================
  //======================LIVE ROOM METHODS==============================
  //===================================================================
  // ==================== LIVE ROOM METHODS ====================

  static async createLiveRoom(data: {
    groupId: string;
    title: string;
    description?: string;
    maxParticipants?: number;
    settings?: {
      allowCamera?: boolean;
      allowMic?: boolean;
      allowScreenShare?: boolean;
      requireApproval?: boolean;
      muteOnEntry?: boolean;
    };
  }): Promise<any> {
    try {
      const { data: res } = await api.post(
        `${config.NEXT_PUBLIC_STUDY_GROUP_LIVE_ROOMS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_LIVE_ROOMS_ENDPOINT}`,
        data
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to create live room.");
    }
  }

  static async getLiveRoomByRoomId(roomId: string): Promise<any> {
    try {
      const { data: res } = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUP_LIVE_ROOMS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_LIVE_ROOMS_ENDPOINT}/${roomId}`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch live room.");
    }
  }

  static async getGroupActiveLiveRoom(groupId: string): Promise<any> {
    try {
      const { data: res } = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUP_LIVE_ROOMS_GROUP_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_LIVE_ROOMS_GROUP_ENDPOINT}/group/${groupId}/active`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) return null;
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch active live room.");
    }
  }

  static async joinLiveRoom(
    roomId: string,
    options?: { cameraOn?: boolean; micOn?: boolean }
  ): Promise<any> {
    try {
      const { data: res } = await api.post(
        `${config.NEXT_PUBLIC_STUDY_GROUP_LIVE_ROOMS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_LIVE_ROOMS_ENDPOINT}/${roomId}/join`,
        options || {}
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to join live room.");
    }
  }

  static async leaveLiveRoom(roomId: string): Promise<void> {
    try {
      await api.post(
        `${config.NEXT_PUBLIC_STUDY_GROUP_LIVE_ROOMS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_LIVE_ROOMS_ENDPOINT}/${roomId}/leave`
      );
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to leave live room.");
    }
  }

  static async endLiveRoom(roomId: string): Promise<any> {
    try {
      const { data: res } = await api.post(
        `${config.NEXT_PUBLIC_STUDY_GROUP_LIVE_ROOMS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_LIVE_ROOMS_ENDPOINT}/${roomId}/end`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to end live room.");
    }
  }

  static async updateLiveRoom(
    roomId: string,
    data: {
      title?: string;
      description?: string;
      maxParticipants?: number;
      settings?: {
        allowCamera?: boolean;
        allowMic?: boolean;
        allowScreenShare?: boolean;
        requireApproval?: boolean;
        muteOnEntry?: boolean;
      };
    }
  ): Promise<any> {
    try {
      const { data: res } = await api.put(
        `${config.NEXT_PUBLIC_STUDY_GROUP_LIVE_ROOMS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_LIVE_ROOMS_ENDPOINT}/${roomId}`,
        data
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to update live room.");
    }
  }

  static async toggleCamera(roomId: string, cameraOn: boolean): Promise<any> {
    try {
      const { data: res } = await api.patch(
        `${config.NEXT_PUBLIC_STUDY_GROUP_LIVE_ROOMS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_LIVE_ROOMS_ENDPOINT}/${roomId}/toggle-camera`,
        { cameraOn }
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to toggle camera.");
    }
  }

  static async toggleMic(roomId: string, micOn: boolean): Promise<any> {
    try {
      const { data: res } = await api.patch(
        `${config.NEXT_PUBLIC_STUDY_GROUP_LIVE_ROOMS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_LIVE_ROOMS_ENDPOINT}/${roomId}/toggle-mic`,
        { micOn }
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to toggle mic.");
    }
  }

  static async toggleScreenShare(
    roomId: string,
    sharing: boolean
  ): Promise<any> {
    try {
      const { data: res } = await api.patch(
        `${config.NEXT_PUBLIC_STUDY_GROUP_LIVE_ROOMS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_LIVE_ROOMS_ENDPOINT}/${roomId}/toggle-screen-share`,
        { sharing }
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to toggle screen share.");
    }
  }

  static async getLiveRoomParticipants(roomId: string): Promise<any> {
    try {
      const { data: res } = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUP_LIVE_ROOMS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_LIVE_ROOMS_ENDPOINT}/${roomId}/participants`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch participants.");
    }
  }

  // =======================================================================================
  // ==================== ATTENDANCE METHODS ==============================================
  // =======================================================================================

  static async attendanceCheckIn(
    notes?: string
  ): Promise<AttendanceCheckInResponse> {
    try {
      // const { data: res } = await api.post(
      //   `${config.NEXT_PUBLIC_STUDY_GROUP_ATTENDANCE_CHECK_IN_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_ATTENDANCE_CHECK_IN_ENDPOINT}`,
      //   { notes }
      // );

      const { data: res } = await api.post(
        `${joinUrl(config.NEXT_PUBLIC_STUDY_GROUP_ATTENDANCE_CHECK_IN_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_ATTENDANCE_CHECK_IN_ENDPOINT, "/check-in")}`,
        { notes }
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 409)
          throw new Error("Already checked in for today.");
        if (error.response?.status === 401)
          throw new Error("Session expired. Please login again.");
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to check in.");
    }
  }

  static async attendanceAutoMark(
    reason: "study_session" | "task_completion",
    studyHours?: number
  ): Promise<AttendanceAutoMarkResponse> {
    try {
      // const { data: res } = await api.patch(
      //   `${config.NEXT_PUBLIC_STUDY_GROUP_ATTENDANCE_AUTO_MARK_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_ATTENDANCE_AUTO_MARK_ENDPOINT}`,
      //   {
      //     reason,
      //     studyHours,
      //   }
      // );

      const { data: res } = await api.patch(
        `${joinUrl(config.NEXT_PUBLIC_STUDY_GROUP_ATTENDANCE_AUTO_MARK_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_ATTENDANCE_AUTO_MARK_ENDPOINT, "/auto-mark")}`,
        {
          reason,
          studyHours,
        }
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to auto-mark attendance.");
    }
  }

  static async getAttendanceStatus(): Promise<AttendanceStatusResponse> {
    try {
      // const { data: res } = await api.get(
      //   `${config.NEXT_PUBLIC_STUDY_GROUP_ATTENDANCE_STATUS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_ATTENDANCE_STATUS_ENDPOINT}`
      // );

      const { data: res } = await api.get(
        `${joinUrl(config.NEXT_PUBLIC_STUDY_GROUP_ATTENDANCE_STATUS_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_ATTENDANCE_STATUS_ENDPOINT, "/status")}`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch attendance status.");
    }
  }

  static async getAttendancePercentage(): Promise<AttendancePercentageResponse> {
    try {
      // const { data: res } = await api.get(
      //   `${config.NEXT_PUBLIC_STUDY_GROUP_ATTENDANCE_PERCENTAGE_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_ATTENDANCE_PERCENTAGE_ENDPOINT}`
      // );

      const { data: res } = await api.get(
        `${joinUrl(config.NEXT_PUBLIC_STUDY_GROUP_ATTENDANCE_PERCENTAGE_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_ATTENDANCE_PERCENTAGE_ENDPOINT, "/percentage")}`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch attendance percentage.");
    }
  }

  static async getAttendanceHistory(
    page: number = 1,
    limit: number = 30
  ): Promise<AttendanceHistoryResponse> {
    try {
      // const { data: res } = await api.get(
      //   `${config.NEXT_PUBLIC_STUDY_GROUP_ATTENDANCE_HISTORY_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_ATTENDANCE_HISTORY_ENDPOINT}`,
      //   {
      //     params: { page, limit },
      //   }
      // );

      const { data: res } = await api.get(
        `${joinUrl(config.NEXT_PUBLIC_STUDY_GROUP_ATTENDANCE_HISTORY_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_ATTENDANCE_HISTORY_ENDPOINT, "/history")}`,
        {
          params: { page, limit },
        }
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch attendance history.");
    }
  }

  static async getAttendanceCalendar(
    month?: number,
    year?: number
  ): Promise<AttendanceCalendarResponse> {
    try {
      // const { data: res } = await api.get(
      //   `${config.NEXT_PUBLIC_STUDY_GROUP_ATTENDANCE_CALENDAR_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_ATTENDANCE_CALENDAR_ENDPOINT}`,
      //   {
      //     params: { month, year },
      //   }
      // );

      const { data: res } = await api.get(
        `${joinUrl(config.NEXT_PUBLIC_STUDY_GROUP_ATTENDANCE_CALENDAR_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_ATTENDANCE_CALENDAR_ENDPOINT, "/calendar")}`,
        {
          params: { month, year },
        }
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch attendance calendar.");
    }
  }

  // =======================================================================================
  // ==================== SHARE METHODS ===================================================
  // =======================================================================================

  static async generateInviteLink(
    groupId: string,
    options?: GenerateInviteLinkOptions
  ): Promise<InviteLinkResponse> {
    try {
      const { data: res } = await api.post(
        `${config.NEXT_PUBLIC_STUDY_GROUP_SHARE_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_SHARE_ENDPOINT}/${groupId}/generate-link`,
        options || {}
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403)
          throw new Error("Only group leader can generate invite links.");
        if (error.response?.status === 404) throw new Error("Group not found.");
        if (error.response?.status === 400)
          throw new Error(error.response.data.message || "Invalid options.");
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to generate invite link.");
    }
  }

  static async generateGroupQRCode(groupId: string): Promise<QRCodeResponse> {
    try {
      const { data: res } = await api.post(
        `${config.NEXT_PUBLIC_STUDY_GROUP_SHARE_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_SHARE_ENDPOINT}/${groupId}/generate-qr`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403)
          throw new Error("Only group leader can generate QR codes.");
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to generate QR code.");
    }
  }

  static async validateInviteCode(
    inviteCode: string
  ): Promise<ValidateInviteResponse> {
    try {
      // const { data: res } = await api.get(
      //   `${config.NEXT_PUBLIC_STUDY_GROUP_SHARE_VALIDATE_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_SHARE_VALIDATE_ENDPOINT}/${inviteCode}`
      // );

      const { data: res } = await api.get(
        `${joinUrl(config.NEXT_PUBLIC_STUDY_GROUP_SHARE_VALIDATE_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_SHARE_VALIDATE_ENDPOINT, "/validate")}/${inviteCode}`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400)
          throw new Error(
            error.response.data.message || "Invalid invite code."
          );
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to validate invite code.");
    }
  }

  static async getSocialShareLinks(
    groupId: string
  ): Promise<SocialShareLinksResponse> {
    try {
      const { data: res } = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUP_SHARE_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_SHARE_ENDPOINT}/${groupId}/social-links`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) throw new Error("Not authorized.");
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to get social share links.");
    }
  }

  static async getInviteAnalytics(
    groupId: string
  ): Promise<InviteAnalyticsResponse> {
    try {
      const { data: res } = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUP_SHARE_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_SHARE_ENDPOINT}/${groupId}/analytics`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403)
          throw new Error("Only group leader can view analytics.");
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch invite analytics.");
    }
  }

  static async getGroupInviteLinks(
    groupId: string
  ): Promise<GroupInviteLinksResponse> {
    try {
      const { data: res } = await api.get(
        `${config.NEXT_PUBLIC_STUDY_GROUP_SHARE_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_SHARE_ENDPOINT}/${groupId}/links`
      );
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403)
          throw new Error("Only group leader can view invite links.");
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to fetch invite links.");
    }
  }

  static async revokeInviteLink(inviteCode: string): Promise<void> {
    try {
      await api.delete(
        `${config.NEXT_PUBLIC_STUDY_GROUP_SHARE_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_SHARE_ENDPOINT}/${inviteCode}/revoke`
      );
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403)
          throw new Error("Not authorized to revoke this link.");
        if (error.response?.status === 404)
          throw new Error("Invite link not found.");
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to revoke invite link.");
    }
  }

  static async trackInviteJoin(inviteCode: string): Promise<void> {
    try {
      await api.post(
        `${config.NEXT_PUBLIC_STUDY_GROUP_SHARE_ENDPOINT || process.env.NEXT_PUBLIC_STUDY_GROUP_SHARE_ENDPOINT}/${inviteCode}/track-join`
      );
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (msg) throw new Error(msg);
      }
      throw new Error("Failed to track join.");
    }
  }
}

export default StudyGroupService;
