import axios from 'axios';
import api from "./api.intance";
import { MentorResponse } from '@/features/mentorship/types/mentorship.types';
import config from '@/config/env.config';

export interface CreateGroupSessionInput {
  title: string;
  description: string;
  topic: string;
  category?: string;
  scheduledAt?: string;   // ✅ CHANGED: optional — isTemplate: true pe nahi bheja jaata
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
  isTemplate?: boolean;   // ✅ NEW
}



class MentorService {

  static async createMentor(payload: {
    title: string;
    bio: string;
    domains: string[];
    skills: string[];
    experienceTotal: number;
    currentRole: string;
    linkedinUrl: string;
    githubUrl?: string;
    profilePic: File;
  }): Promise<MentorResponse> {
    try {
      const formData = new FormData();

      formData.append('title', payload.title);
      formData.append('bio', payload.bio);
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
   * ✅ NEW: the mentee/mentor's own group sessions — powers the "My
   * Registered Sessions" tab on the user dashboard (mentee side) and any
   * future mentor-side "my group sessions" view. Backend endpoint already
   * existed (GET /group-sessions/my-sessions?role=...); this was the
   * missing frontend method — the dashboard tab was hardcoding an empty
   * array with a comment incorrectly claiming no such endpoint existed.
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
   *
   * IMPORTANT:
   * This does NOT directly add the mentee as a participant.
   * Mentor has to accept the request first.
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
   * Get current user's join request status
   * for a particular group session.
   *
   * Expected response:
   * {
   *   status: "pending" | "accepted" | "rejected"
   * }
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
   * ✅ NEW: fetch a group-session TEMPLATE's bookable slots for a given
   * date, derived from the mentor's Availability. Powers the mentee-facing
   * "Select Date & Time" calendar for Group Session (same pattern as
   * Quick Call's CalendarStep, but backed by /template-slots instead of
   * /availability/mentor/:id).
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
     * ✅ NEW: mentee ne group-session TEMPLATE ke liye Quick-Call-style
     * calendar se ek date+time slot choose kiya (mentor ki Availability se).
   * Backend: agar us exact slot pe already koi open group "instance" hai
   * to mentee usi instance mein pending join-request bhejta hai; warna
   * naya instance banta hai (mentor ki availability se wo slot book karke)
   * aur usi mein request bheji jaati hai.
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
        // ✅ FIX: backend's joinBySlot controller only reads `scheduledAt`
        // (and `transactionId`) from the body — it never reads `date`,
        // `startTime` or `availabilityId`. Sending those alone meant every
        // request failed with 400 "scheduledAt is required to pick a slot".
        // Combine date + startTime into the ISO datetime the backend expects.
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
   * Direct join.
   *
   * DO NOT use this from the "Join Group" button when
   * mentor approval is required.
   *
   * Keep this method because other existing flows may still
   * use it after approval/payment.
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
      const { data } = await api.patch<{ saved: boolean }>(
        `/mentorship/mentors/${mentorId}/save`
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
        'Failed to save/unsave mentor. Please try again.'
      );
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
}

export default MentorService;