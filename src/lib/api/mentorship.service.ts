import axios from 'axios';
import api from "./api.intance";
import { MentorResponse } from '@/features/mentorship/types/mentorship.types';
import config from '@/config/env.config';
import SeniorMentorApplicationService from './seniorMentorApplication.service';

// ── My-Roles types (used by ProfileDropdown) ─────────────────────────────────
export type RoleStatus = 'approved' | 'pending' | 'rejected' | 'none';

export interface MyRolesResponse {
  mentee: RoleStatus;
  seniorMentor: RoleStatus;       // Mentor collection ("Become Mentor" flow)
  industryMentor: RoleStatus;     // SeniorMentorApplication ("Become Senior Mentor" flow)
  seniorMentorId?: string;        // mentorId from Mentor doc
  industryMentorId?: string;      // seniorMentorId from SeniorMentorApplication doc
}

/** Module-level cache so the navbar doesn't refetch on every re-render. */
let _rolesCache: MyRolesResponse | null = null;
/** In-flight request, so concurrent callers share ONE network call. */
let _rolesInflight: Promise<MyRolesResponse> | null = null;
// ─────────────────────────────────────────────────────────────────────────────

export interface PublicSeniorMentor {
  id: string;
  displayName: string;
  profilePic?: string;
  college: string;
  degree: string;
  fieldOfStudy: string;
  skills: string[];
  sessionsCount: number;
  sessionId: string | null;
}

export interface PublicSeniorMentorsResponse {
  success: boolean;
  message: string;
  data: PublicSeniorMentor[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PublicSeniorMentorResponse {
  success: boolean;
  message: string;
  data: PublicSeniorMentor;
}

export interface CreateGroupSessionInput {
  title: string;
  description: string;
  topic: string;
  category?: string;
  scheduledAt?: string;
  duration: number;
  timezone: string;
  maxParticipants: number;
  minParticipants: number;
  pricePerPerson: number;
  agenda?: string;
  outcomes?: string[];
  thumbnailImage?: File;
  paymentMethod: string;
  bufferTimeMinutes?: number;
  followUp?: {
    allowed: boolean;
    periodDays: number;
  };
  isTemplate?: boolean;
  meetingUrl?: string;
}

class MentorService {

  static async createMentor(payload: {
    title: string;
    bio: string;
    domains: string[];
    skills: string[];
    experienceTotal: number;
    currentRole: string;
    company: string;
    college: string;
    degree: string;
    branch: string;
    linkedinUrl: string;
    githubUrl?: string;
    profilePic: File;
  }): Promise<MentorResponse> {
    try {
      const formData = new FormData();

      formData.append('title', payload.title);
      formData.append('bio', payload.bio);
      formData.append('company', payload.company);
      formData.append('college', payload.college);
      formData.append('degree', payload.degree);
      formData.append('branch', payload.branch);
      formData.append('domains', JSON.stringify(payload.domains));
      formData.append('skills', JSON.stringify(payload.skills));

      formData.append(
        'experience',
        JSON.stringify({
          total: payload.experienceTotal,
          currentRole: payload.currentRole,
        })
      );

      formData.append(
        'socialProof',
        JSON.stringify({
          linkedinUrl: payload.linkedinUrl,
          ...(payload.githubUrl && { githubUrl: payload.githubUrl }),
        })
      );

      formData.append('profilePic', payload.profilePic);

      const { data } = await api.post<MentorResponse>(
        `${config.NEXT_PUBLIC_MENTOR_CREATE_ENDPOINT || process.env.NEXT_PUBLIC_MENTOR_CREATE_ENDPOINT}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return data;

    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;

        if (error.code === 'ERR_NETWORK') {
          throw new Error(
            'Unable to connect to server. Please check your internet connection.'
          );
        }

        if (error.response?.status === 400) {
          const errors = apiError?.errors
            ?.map((e: any) => e.message)
            .join(', ');

          throw new Error(
            errors || apiError?.message || 'Validation failed'
          );
        }

        if (error.response?.status === 401) {
          throw new Error('Session expired. Please login again.');
        }

        if (error.response?.status === 409) {
          throw new Error(
            'Mentor profile already exists for this account.'
          );
        }

        if (apiError?.message) {
          throw new Error(apiError.message);
        }
      }

      throw new Error(
        'Failed to create mentor profile. Please try again.'
      );
    }
  }

  static async getMentorByUserId(
    userId: string,
    forceFresh: boolean = false
  ): Promise<MentorResponse> {
    try {
      const url = `${config.NEXT_PUBLIC_MENTOR_BY_USER_ENDPOINT || process.env.NEXT_PUBLIC_MENTOR_BY_USER_ENDPOINT}/${userId}`;

      const requestConfig = forceFresh
        ? { params: { _t: Date.now() } }
        : undefined;

      const { data } = await api.get<MentorResponse>(
        url,
        requestConfig
      );

      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Mentor profile not found.');
        }
      }

      throw new Error('Failed to fetch mentor profile.');
    }
  }

  static async getMentorDashboard(mentorId: string): Promise<any> {
    try {
      const endpoint = `${(config as any).NEXT_PUBLIC_MENTOR_BY_ID_ENDPOINT || process.env.NEXT_PUBLIC_MENTOR_BY_ID_ENDPOINT || '/mentorship/mentors'}/${mentorId}/dashboard`;
      const { data } = await api.get<any>(endpoint);
      return data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "Failed to fetch mentor dashboard data.");
    }
  }

  static async updateMentorAvailability(
    mentorId: string,
    availability: {
      timezone?: string;
      daysAvailable?: string[];
      preferredHours?: {
        start: string;
        end: string;
      };
      bufferBetweenSessions?: number;
      slotDuration?: number;

      weeklySchedule?: Array<{
        day: string;
        enabled: boolean;
        timeRanges: Array<{
          startTime: string;
          endTime: string;
        }>;
      }>;
    }
  ): Promise<MentorResponse> {
    try {
      const formData = new FormData();

      formData.append(
        'availability',
        JSON.stringify(availability)
      );

      const { data } = await api.put<MentorResponse>(
        `${config.NEXT_PUBLIC_MENTOR_UPDATE_ENDPOINT || process.env.NEXT_PUBLIC_MENTOR_UPDATE_ENDPOINT}/${mentorId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return data;

    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;

        if (apiError?.message) {
          throw new Error(apiError.message);
        }

        if (error.response?.status === 404) {
          throw new Error('Mentor not found.');
        }

        if (error.response?.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
      }

      throw new Error(
        'Failed to save weekly availability pattern.'
      );
    }
  }

  static async updateProfilePhoto(
    mentorId: string,
    file: File
  ): Promise<MentorResponse> {
    try {
      const formData = new FormData();

      formData.append('profilePic', file);

      const { data } = await api.put<MentorResponse>(
        `${config.NEXT_PUBLIC_MENTOR_UPDATE_ENDPOINT || process.env.NEXT_PUBLIC_MENTOR_UPDATE_ENDPOINT}/${mentorId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return data;

    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;

        if (apiError?.message) {
          throw new Error(apiError.message);
        }

        if (error.response?.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
      }

      throw new Error(
        'Failed to update profile photo. Please try again.'
      );
    }
  }

  static async removeProfilePhoto(mentorId: string): Promise<any> {
    try {
      const { data } = await api.delete(
        `${config.NEXT_PUBLIC_MENTOR_UPDATE_ENDPOINT || process.env.NEXT_PUBLIC_MENTOR_UPDATE_ENDPOINT}/${mentorId}/profile-photo`
      );
      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;
        if (apiError?.message) {
          throw new Error(apiError.message);
        }
        if (error.response?.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
      }
      throw new Error('Failed to remove profile photo. Please try again.');
    }
  }

  static async getTrustScore(): Promise<any> {
    try {
      const { data } = await api.get(
        '/mentorship/mentors/me/trust-score'
      );

      return data;
    } catch (error: any) {
      throw new Error('Failed to fetch trust score.');
    }
  }

  static async getMentorDashboardStats(
    mentorId: string
  ): Promise<any> {
    try {
      const { data } = await api.get(
        `/mentorship/analytics/mentor/${mentorId}/dashboard`
      );

      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;

        if (apiError?.message) {
          throw new Error(apiError.message);
        }
      }

      throw new Error(
        'Failed to fetch analytics. Please try again.'
      );
    }
  }

  static async getMyMentorProfile(
    mentorId: string
  ): Promise<MentorResponse> {
    try {
      const { data } = await api.get<MentorResponse>(
        `${config.NEXT_PUBLIC_MENTOR_BY_ID_ENDPOINT || process.env.NEXT_PUBLIC_MENTOR_BY_ID_ENDPOINT}/${mentorId}`
      );

      // Fire-and-forget request to trigger backend
      // 'Profile Viewed' notification logic.
      // userId is the user-collection ID returned by this endpoint.
      const mentor = data as MentorResponse & { userId?: string };
      if (mentor.userId) {
        MentorService.getMentorByUserId(mentor.userId, true).catch(() => {});
      }

      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Mentor profile not found.');
        }

        if (error.response?.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
      }

      throw new Error(
        'Failed to fetch mentor profile. Please try again.'
      );
    }
  }

  static async getAllMentors(params?: {
    page?: number;
    limit?: number;
    domains?: string[];
    skills?: string[];
  }): Promise<any> {
    try {
      const { data } = await api.get(
        `${config.NEXT_PUBLIC_ALL_MENTORS_ENDPOINT || process.env.NEXT_PUBLIC_ALL_MENTORS_ENDPOINT}`,
        {
          params
        }
      );

      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;

        if (apiError?.message) {
          throw new Error(apiError.message);
        }
      }

      throw new Error(
        'Failed to fetch mentors. Please try again.'
      );
    }
  }

  static async getPublicSeniorMentors(params?: {
    page?: number;
    limit?: number;
  }): Promise<PublicSeniorMentorsResponse> {
    try {
      const endpoint =
        config.NEXT_PUBLIC_SENIOR_MENTORS_ENDPOINT ||
        process.env.NEXT_PUBLIC_SENIOR_MENTORS_ENDPOINT ||
        "/mentorship/senior-mentors";
      const { data } = await api.get<PublicSeniorMentorsResponse>(endpoint, { params });
      return data;
    } catch (error: unknown) {
      if (axios.isAxiosError<{ message?: string }>(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error("Failed to fetch college mentors. Please try again.");
    }
  }

  static async getPublicSeniorMentor(mentorId: string): Promise<PublicSeniorMentor | null> {
    try {
      const endpoint =
        config.NEXT_PUBLIC_SENIOR_MENTORS_ENDPOINT ||
        process.env.NEXT_PUBLIC_SENIOR_MENTORS_ENDPOINT ||
        "/mentorship/senior-mentors";
      const { data } = await api.get<PublicSeniorMentorResponse>(
        `${endpoint}/${encodeURIComponent(mentorId)}`
      );
      return data.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      if (axios.isAxiosError<{ message?: string }>(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error("Failed to fetch college mentor profile. Please try again.");
    }
  }

  static async getMentorById(mentorId: string): Promise<any> {
    try {
      const base =
        config.NEXT_PUBLIC_MENTOR_BY_ID_ENDPOINT ||
        process.env.NEXT_PUBLIC_MENTOR_BY_ID_ENDPOINT ||
        '/mentorship/mentors';

      const { data } = await api.get(`${base}/${mentorId}`);
      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Mentor profile not found.');
        }
        const apiError = error.response?.data;
        if (apiError?.message) {
          throw new Error(apiError.message);
        }
      }
      throw new Error('Failed to fetch mentor. Please try again.');
    }
  }

  // =========================================================
  // GROUP SESSION
  // =========================================================

  static async createGroupSession(
    input: CreateGroupSessionInput
  ): Promise<any> {
    try {
      const formData = new FormData();

      Object.entries(input).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'thumbnailImage') {
            formData.append(key, value as File);
          } else if (typeof value === 'object') {
            formData.append(
              key,
              JSON.stringify(value)
            );
          } else {
            formData.append(
              key,
              String(value)
            );
          }
        }
      });

      const { data } = await api.post(
        `/mentorship/group-sessions/create`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return data;

    } catch (error: any) {
      if (error?.response?.status === 400) {
        throw new Error(
          error.response.data?.message ||
          'Invalid group session data.'
        );
      }

      if (error?.response?.status === 404) {
        throw new Error('Mentor not found.');
      }

      if (error?.code === 'ERR_NETWORK') {
        throw new Error(
          'Unable to connect to server.'
        );
      }

      throw new Error(
        error?.response?.data?.message ||
        'Failed to create group session.'
      );
    }
  }

  static async deleteGroupSession(
    id: string
  ): Promise<any> {
    try {
      const { data } = await api.delete(
        `/mentorship/group-sessions/${id}`
      );

      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;

        if (apiError?.message) {
          throw new Error(apiError.message);
        }
      }

      throw new Error(
        'Failed to delete group session.'
      );
    }
  }

  static async updateGroupSession(
    id: string,
    payload: Record<string, any>
  ): Promise<any> {
    try {
      const { data } = await api.patch(
        `/mentorship/group-sessions/${id}`,
        payload
      );

      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;

        if (apiError?.message) {
          throw new Error(apiError.message);
        }
      }

      throw new Error(
        'Failed to update group session.'
      );
    }
  }

  static async startGroupSession(
    id: string
  ): Promise<any> {
    try {
      const { data } = await api.post(
        `/mentorship/group-sessions/${id}/start`
      );

      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;

        if (apiError?.message) {
          throw new Error(apiError.message);
        }
      }

      throw new Error(
        'Failed to start group session.'
      );
    }
  }

  static async markGroupAttendance(
    id: string
  ): Promise<any> {
    try {
      const { data } = await api.post(
        `/mentorship/group-sessions/${id}/attend`
      );

      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;

        if (apiError?.message) {
          throw new Error(apiError.message);
        }
      }

      throw new Error(
        error?.response?.data?.message || 'Failed to mark attendance.'
      );
    }
  }

  static async cancelGroupSession(
    id: string,
    reason: string
  ): Promise<any> {
    try {
      const { data } = await api.post(
        `/mentorship/group-sessions/${id}/cancel`,
        {
          reason
        }
      );

      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;

        if (apiError?.message) {
          throw new Error(apiError.message);
        }
      }

      throw new Error(
        'Failed to cancel group session.'
      );
    }
  }

  static async getAllGroupSessions(
    filters: {
      mentorId?: string;
      page?: number;
      limit?: number;
      status?: string;
    } = {}
  ): Promise<any> {
    try {
      const { data } = await api.get(
        `/mentorship/group-sessions`,
        {
          params: filters
        }
      );

      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;

        if (apiError?.message) {
          throw new Error(apiError.message);
        }
      }

      throw new Error(
        'Failed to fetch group sessions. Please try again.'
      );
    }
  }

  static async getGroupSessionById(
    id: string
  ): Promise<any> {
    try {
      const { data } = await api.get(
        `/mentorship/group-sessions/${id}`
      );

      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;

        if (apiError?.message) {
          throw new Error(apiError.message);
        }
      }

      throw new Error(
        'Failed to fetch group session details. Please try again.'
      );
    }
  }

  /**
   * The mentee/mentor's own group sessions — powers the "My Registered
   * Sessions" tab on the user dashboard.
   */
  static async getMyGroupSessions(
    role: 'mentor' | 'mentee' = 'mentee'
  ): Promise<any> {
    try {
      const { data } = await api.get(
        `/mentorship/group-sessions/my-sessions`,
        {
          params: { role }
        }
      );

      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;

        if (error.code === 'ERR_NETWORK') {
          throw new Error(
            'Unable to connect to server. Please check your internet connection.'
          );
        }

        if (error.response?.status === 401) {
          throw new Error(
            'Session expired. Please login again.'
          );
        }

        if (apiError?.message) {
          throw new Error(apiError.message);
        }
      }

      throw new Error(
        'Failed to fetch your group sessions.'
      );
    }
  }

  // =========================================================
  // GROUP SESSION JOIN REQUEST
  // =========================================================

  /**
   * Mentee sends a request to join a group session.
   * This does NOT directly add the mentee as a participant;
   * the mentor has to accept the request first.
   */
  static async requestToJoinGroupSession(
    sessionId: string,
    transactionId?: string
  ): Promise<any> {
    try {
      const { data } = await api.post(
        `/mentorship/group-sessions/${sessionId}/request`,
        { transactionId }
      );

      return data;

    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;

        if (error.code === 'ERR_NETWORK') {
          throw new Error(
            'Unable to connect to server. Please check your internet connection.'
          );
        }

        if (error.response?.status === 400) {
          throw new Error(
            apiError?.message ||
            'Unable to send join request.'
          );
        }

        if (error.response?.status === 401) {
          throw new Error(
            'Session expired. Please login again.'
          );
        }

        if (error.response?.status === 403) {
          throw new Error(
            apiError?.message ||
            'You are not allowed to join this group session.'
          );
        }

        if (error.response?.status === 404) {
          throw new Error(
            'Group session not found.'
          );
        }

        if (error.response?.status === 409) {
          throw new Error(
            apiError?.message ||
            'Join request already exists.'
          );
        }

        if (apiError?.message) {
          throw new Error(apiError.message);
        }
      }

      throw new Error(
        'Failed to send join request.'
      );
    }
  }

  /**
   * Get current user's join request status for a group session.
   * Expected response: { status: "pending" | "accepted" | "rejected" }
   */
  static async getMyGroupJoinRequest(
    sessionId: string
  ): Promise<any> {
    try {
      const { data } = await api.get(
        `/mentorship/group-sessions/${sessionId}/request`
      );

      return data;

    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;

        // No request means user has not requested to join.
        if (error.response?.status === 404) {
          return null;
        }

        if (error.response?.status === 401) {
          throw new Error(
            'Session expired. Please login again.'
          );
        }

        if (error.response?.status === 403) {
          throw new Error(
            'You are not authorized to view this request.'
          );
        }

        if (apiError?.message) {
          throw new Error(apiError.message);
        }
      }

      throw new Error(
        'Failed to fetch join request status.'
      );
    }
  }

  /**
   * Fetch a group-session TEMPLATE's bookable slots for a given date,
   * derived from the mentor's Availability.
   */
  static async getGroupTemplateAvailability(
    templateId: string,
    date: string // "YYYY-MM-DD"
  ): Promise<any> {
    try {
      const { data } = await api.get(
        `/mentorship/group-sessions/${templateId}/template-slots`,
        { params: { date } }
      );
      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;
        if (error.code === 'ERR_NETWORK') {
          throw new Error('Unable to connect to server. Please check your internet connection.');
        }
        if (apiError?.message) {
          throw new Error(apiError.message);
        }
      }
      throw new Error('Failed to fetch group session slots.');
    }
  }

  /**
   * Mentee picks a date+time slot for a group-session TEMPLATE.
   * Backend: if an open group "instance" already exists at that exact slot,
   * the mentee sends a pending join-request to it; otherwise a new instance
   * is created and the request is sent to that.
   */
  static async joinGroupSessionBySlot(
    templateId: string,
    payload: {
      date: string;            // "YYYY-MM-DD"
      startTime: string;       // "HH:mm"
      availabilityId?: string;
      transactionId?: string;
    }
  ): Promise<any> {
    try {
      // Backend's joinBySlot controller only reads `scheduledAt` and
      // `transactionId`, so combine date + startTime into an ISO datetime.
      const scheduledAt = new Date(`${payload.date}T${payload.startTime}:00+05:30`).toISOString();

      const { data } = await api.post(
        `/mentorship/group-sessions/${templateId}/join-by-slot`,
        { scheduledAt, transactionId: payload.transactionId }
      );

      return data;

    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;

        if (error.code === 'ERR_NETWORK') {
          throw new Error(
            'Unable to connect to server. Please check your internet connection.'
          );
        }

        if (error.response?.status === 400) {
          throw new Error(
            apiError?.message ||
            'This slot is no longer available. Please pick another.'
          );
        }

        if (error.response?.status === 401) {
          throw new Error(
            'Session expired. Please login again.'
          );
        }

        if (apiError?.message) {
          throw new Error(apiError.message);
        }
      }

      throw new Error(
        'Failed to send join request.'
      );
    }
  }

  // =========================================================
  // OLD DIRECT JOIN
  // =========================================================

  /**
   * Direct join. Do NOT use from the "Join Group" button when mentor
   * approval is required. Kept for flows that use it after approval/payment.
   */
  static async joinGroupSession(
    id: string,
    transactionId?: string
  ): Promise<any> {
    try {
      const { data } = await api.post(
        `/mentorship/group-sessions/${id}/join`,
        {
          transactionId
        }
      );

      return data;

    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;

        if (apiError?.message) {
          throw new Error(apiError.message);
        }
      }

      throw new Error(
        'Failed to join group session.'
      );
    }
  }

  /**
   * Leave a group session the mentee has already joined.
   */
  static async leaveGroupSession(
    id: string
  ): Promise<any> {
    try {
      const { data } = await api.post(
        `/mentorship/group-sessions/${id}/leave`
      );

      return data;

    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;

        if (apiError?.message) {
          throw new Error(apiError.message);
        }
      }

      throw new Error(
        'Failed to leave group session.'
      );
    }
  }

  // =========================================================
  // MENTOR ACCEPT / REJECT GROUP JOIN REQUEST
  // =========================================================

  static async acceptGroupJoinRequest(
    sessionId: string,
    menteeId: string
  ): Promise<any> {
    try {
      const { data } = await api.patch(
        `/mentorship/group-sessions/${sessionId}/requests/${menteeId}/accept`
      );

      return data;

    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;

        if (error.response?.status === 400) {
          throw new Error(
            apiError?.message ||
            'Unable to accept join request.'
          );
        }

        if (error.response?.status === 401) {
          throw new Error(
            'Session expired. Please login again.'
          );
        }

        if (error.response?.status === 403) {
          throw new Error(
            'You are not authorized to accept this request.'
          );
        }

        if (error.response?.status === 404) {
          throw new Error(
            'Join request or group session not found.'
          );
        }

        if (apiError?.message) {
          throw new Error(apiError.message);
        }
      }

      throw new Error(
        'Failed to accept join request.'
      );
    }
  }

  static async rejectGroupJoinRequest(
    sessionId: string,
    menteeId: string
  ): Promise<any> {
    try {
      const { data } = await api.patch(
        `/mentorship/group-sessions/${sessionId}/requests/${menteeId}/reject`
      );

      return data;

    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;

        if (error.response?.status === 400) {
          throw new Error(
            apiError?.message ||
            'Unable to reject join request.'
          );
        }

        if (error.response?.status === 401) {
          throw new Error(
            'Session expired. Please login again.'
          );
        }

        if (error.response?.status === 403) {
          throw new Error(
            'You are not authorized to reject this request.'
          );
        }

        if (error.response?.status === 404) {
          throw new Error(
            'Join request or group session not found.'
          );
        }

        if (apiError?.message) {
          throw new Error(apiError.message);
        }
      }

      throw new Error(
        'Failed to reject join request.'
      );
    }
  }

  // =========================================================
  // REVIEWS
  // =========================================================

  static async getMentorReviews(
    mentorId: string,
    params?: {
      page?: number;
      limit?: number;
      sort?: 'newest' | 'helpful' | 'highest' | 'lowest';
    }
  ): Promise<any> {
    try {
      const { data } = await api.get(
        `/reviews/mentor/${mentorId}`,
        {
          params
        }
      );

      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;

        if (apiError?.message) {
          throw new Error(apiError.message);
        }
      }

      throw new Error(
        'Failed to fetch reviews. Please try again.'
      );
    }
  }

  static async getMentorReviewStats(
    mentorId: string
  ): Promise<any> {
    try {
      const { data } = await api.get(
        `/reviews/mentor/${mentorId}/stats`
      );

      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;

        if (apiError?.message) {
          throw new Error(apiError.message);
        }
      }

      throw new Error(
        'Failed to fetch review stats. Please try again.'
      );
    }
  }

  // ---- Review interactions (like / dislike / mentor reply) ----

  private static reviewError(error: any, fallback: string): Error {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        return new Error('Please login to continue.');
      }
      const apiMessage = error.response?.data?.message;
      if (apiMessage) return new Error(apiMessage);
    }
    return new Error(fallback);
  }

  /** Logged-in user's like/dislike state for a mentor's reviews: { [reviewId]: 'like' | 'dislike' } */
  static async getMyReviewReactions(
    mentorId: string
  ): Promise<Record<string, 'like' | 'dislike'>> {
    try {
      const { data } = await api.get(`/reviews/mentor/${mentorId}/my-reactions`);
      return data?.data ?? {};
    } catch (error: any) {
      throw MentorService.reviewError(error, 'Failed to fetch your reactions.');
    }
  }

  /** Toggle like/dislike. Clicking the active reaction again removes it. */
  static async reactToReview(
    reviewId: string,
    type: 'like' | 'dislike'
  ): Promise<{
    reviewId: string;
    helpfulCount: number;
    notHelpfulCount: number;
    userReaction: 'like' | 'dislike' | null;
  }> {
    try {
      const { data } = await api.post(`/reviews/${reviewId}/react`, { type });
      return data?.data;
    } catch (error: any) {
      throw MentorService.reviewError(error, 'Failed to update reaction.');
    }
  }

  /** Mentor adds (or edits) the reply on a review */
  static async replyToReview(
    reviewId: string,
    response: string
  ): Promise<any> {
    try {
      const { data } = await api.post(`/reviews/${reviewId}/response`, {
        response,
      });
      return data?.data;
    } catch (error: any) {
      throw MentorService.reviewError(error, 'Failed to post reply.');
    }
  }

  static async deleteReviewReply(reviewId: string): Promise<void> {
    try {
      await api.delete(`/reviews/${reviewId}/response`);
    } catch (error: any) {
      throw MentorService.reviewError(error, 'Failed to delete reply.');
    }
  }

  static async submitReview(payload: {
    sessionId: string;
    mentorId: string;
    rating: number;
    comment: string;
    tags?: string[];
  }): Promise<any> {
    try {
      const { data } = await api.post(
        `/reviews`,
        payload
      );

      return data;

    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;

        if (error.response?.status === 400) {
          throw new Error(
            apiError?.message ||
            'Review already submitted or invalid data.'
          );
        }

        if (error.response?.status === 401) {
          throw new Error(
            'Session expired. Please login again.'
          );
        }

        if (apiError?.message) {
          throw new Error(apiError.message);
        }
      }

      throw new Error(
        'Failed to submit review. Please try again.'
      );
    }
  }

  // =========================================================
  // SAVE / REPORT MENTOR
  // =========================================================

  static async toggleSaveMentor(
    mentorId: string
  ): Promise<{ saved: boolean }> {
    try {
      const { data } = await api.patch<{ success: boolean; message: string; data: { saved: boolean } }>(
        `/mentorship/mentors/${mentorId}/save`
      );

      return data.data;

    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;

        if (error.code === 'ERR_NETWORK') {
          throw new Error('Unable to connect to server. Please check your internet connection.');
        }

        if (error.response?.status === 401) {
          throw new Error('Session expired. Please login again.');
        }

        if (error.response?.status === 404) {
          throw new Error('Mentor not found.');
        }

        if (apiError?.message) {
          throw new Error(apiError.message);
        }
      }

      throw new Error('Failed to save/unsave mentor. Please try again.');
    }
  }

  static async reportMentor(
    mentorId: string,
    reason: string
  ): Promise<any> {
    try {
      const { data } = await api.post(
        `/mentorship/mentors/${mentorId}/report`,
        {
          reason
        }
      );

      return data;

    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;

        if (error.code === 'ERR_NETWORK') {
          throw new Error(
            'Unable to connect to server. Please check your internet connection.'
          );
        }

        if (error.response?.status === 400) {
          throw new Error(
            apiError?.message ||
            'Report reason is required.'
          );
        }

        if (error.response?.status === 401) {
          throw new Error(
            'Session expired. Please login again.'
          );
        }

        if (error.response?.status === 404) {
          throw new Error(
            'Mentor not found.'
          );
        }

        if (apiError?.message) {
          throw new Error(apiError.message);
        }
      }

      throw new Error(
        'Failed to submit report. Please try again.'
      );
    }
  }

  // =========================================================
  // NORMAL SESSION
  // =========================================================

  static async getSessionById(
    sessionId: string
  ): Promise<any> {
    try {
      const { data } = await api.get(
        `/sessions/${sessionId}`
      );

      return data;

    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;

        if (error.code === 'ERR_NETWORK') {
          throw new Error(
            'Unable to connect to server. Please check your internet connection.'
          );
        }

        if (error.response?.status === 401) {
          throw new Error(
            'Session expired. Please login again.'
          );
        }

        if (error.response?.status === 403) {
          throw new Error(
            'You are not authorized to view this session.'
          );
        }

        if (error.response?.status === 404) {
          throw new Error(
            'Session not found.'
          );
        }

        if (apiError?.message) {
          throw new Error(apiError.message);
        }
      }

      throw new Error(
        'Failed to fetch session details. Please try again.'
      );
    }
  }

  // =========================================================
  // WAITLIST
  // =========================================================

  static async joinWaitlist(input: {
    mentorId: string;
    serviceId?: string;
    serviceTitle?: string;
    preferredDates: string[];
    preferredTimeSlots: string[];
    sessionType: string;
    timezone: string;
    notes?: string;
  }): Promise<any> {
    try {
      const { data } = await api.post(
        `/mentorship/waitlist/join`,
        input
      );

      return data;

    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;

        if (error.response?.status === 400) {
          throw new Error(
            apiError?.message ||
            'Unable to join this session.'
          );
        }

        if (error.response?.status === 401) {
          throw new Error(
            'Session expired. Please login again.'
          );
        }

        if (apiError?.message) {
          throw new Error(apiError.message);
        }
      }

      throw new Error(
        'Failed to join waitlist. Please try again.'
      );
    }
  }

  private static waitlistError(
    error: any,
    fallback: string
  ): Error {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ERR_NETWORK') {
        return new Error(
          'Unable to connect to server. Please check your internet connection.'
        );
      }

      if (error.response?.status === 401) {
        return new Error(
          'Session expired. Please login again.'
        );
      }

      const msg = error.response?.data?.message;

      if (msg) {
        return new Error(msg);
      }
    }

    return new Error(fallback);
  }

  static async getMyWaitlists(): Promise<any> {
    try {
      const { data } = await api.get(
        `/mentorship/waitlist/my-waitlists`
      );

      return data;
    } catch (error: any) {
      throw MentorService.waitlistError(
        error,
        'Failed to fetch your waitlist.'
      );
    }
  }

  static async leaveWaitlist(
    waitlistId: string,
    reason?: string
  ): Promise<any> {
    try {
      const { data } = await api.delete(
        `/mentorship/waitlist/${waitlistId}`,
        {
          data: {
            reason: reason || 'User requested'
          }
        }
      );

      return data;

    } catch (error: any) {
      throw MentorService.waitlistError(
        error,
        'Failed to update waitlist.'
      );
    }
  }

  static async getMentorWaitlist(
    mentorId: string,
    status?: string
  ): Promise<any> {
    try {
      const { data } = await api.get(
        `/mentorship/waitlist/mentor/${mentorId}`,
        {
          params: status
            ? { status }
            : undefined
        }
      );

      return data;

    } catch (error: any) {
      throw MentorService.waitlistError(
        error,
        'Failed to fetch waitlist.'
      );
    }
  }

  static async approveWaitlistEntry(
    waitlistId: string
  ): Promise<any> {
    try {
      const { data } = await api.post(
        `/mentorship/waitlist/${waitlistId}/approve`
      );

      return data;

    } catch (error: any) {
      throw MentorService.waitlistError(
        error,
        'Failed to approve waitlist entry.'
      );
    }
  }

  static async claimWaitlistSlot(
    waitlistId: string,
    sessionId?: string
  ): Promise<any> {
    try {
      const { data } = await api.post(
        `/mentorship/waitlist/${waitlistId}/claim`,
        { sessionId }
      );
      return data;
    } catch (error: any) {
      throw MentorService.waitlistError(error, 'Failed to claim waitlist slot.');
    }
  }

  static async declineWaitlistSlot(
    waitlistId: string,
    reason?: string
  ): Promise<any> {
    try {
      const { data } = await api.post(
        `/mentorship/waitlist/${waitlistId}/decline`,
        { reason }
      );
      return data;
    } catch (error: any) {
      throw MentorService.waitlistError(error, 'Failed to decline waitlist offer.');
    }
  }

  static async updateWaitlistPriority(
    waitlistId: string,
    delta: number
  ): Promise<any> {
    try {
      const { data } = await api.patch(
        `/mentorship/waitlist/${waitlistId}/priority`,
        { delta }
      );
      return data;
    } catch (error: any) {
      throw MentorService.waitlistError(error, 'Failed to update priority.');
    }
  }

  static async removeWaitlistEntry(
    waitlistId: string,
    reason?: string
  ): Promise<any> {
    try {
      const { data } = await api.delete(
        `/mentorship/waitlist/${waitlistId}/remove`,
        { data: { reason } }
      );
      return data;
    } catch (error: any) {
      throw MentorService.waitlistError(error, 'Failed to remove waitlist entry.');
    }
  }

  static async toggleAutoOffer(
    enabled: boolean
  ): Promise<any> {
    try {
      const { data } = await api.patch(
        `/mentorship/waitlist/settings/auto-offer`,
        { enabled }
      );
      return data;
    } catch (error: any) {
      throw MentorService.waitlistError(error, 'Failed to update auto-offer setting.');
    }
  }

  // ── Workspace Role Status ───────────────────────────────────────────────────
  /**
   * GET /mentorship/mentors/me/roles
   * Cached + de-duplicated: concurrent callers share one in-flight request.
   * Cache is busted by calling invalidateRolesCache().
   */
  static getMyRoles(): Promise<MyRolesResponse> {
    if (_rolesCache) return Promise.resolve(_rolesCache);
    if (_rolesInflight) return _rolesInflight;

    _rolesInflight = (async (): Promise<MyRolesResponse> => {
      const { data } = await api.get('/mentorship/mentors/me/roles');

      // Backend either sends { data: {...} } or the object directly
      const payload = (data?.data ?? data) as Partial<MyRolesResponse> | undefined;

      const result: MyRolesResponse = {
        mentee: 'approved',
        seniorMentor: payload?.seniorMentor ?? 'none',
        industryMentor: payload?.industryMentor ?? 'none',
        seniorMentorId: payload?.seniorMentorId,
        industryMentorId: payload?.industryMentorId,
      };

      // Fallback: application is verified but /me/roles didn't say approved
      if (result.industryMentor !== 'approved') {
        try {
          const app = await SeniorMentorApplicationService.getMyApplication();
          const status = String(app?.verificationStatus ?? '').toLowerCase();
          if (status === 'verified' || status === 'approved' || status === 'active') {
            result.industryMentor = 'approved';
            result.industryMentorId =
              result.industryMentorId ?? (app as any)?.seniorMentorId;
          }
        } catch {
          /* ignore, keep backend value */
        }
      }

      _rolesCache = result;
      return result;
    })().finally(() => {
      _rolesInflight = null;
    });

    return _rolesInflight;
  }

  /** Call after the user applies for a role so the next render re-fetches. */
  static invalidateRolesCache(): void {
    _rolesCache = null;
    _rolesInflight = null;
  }
}

export default MentorService;