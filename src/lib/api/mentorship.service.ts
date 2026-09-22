import axios from 'axios';
import api from "./api.intance";
import { MentorResponse } from '@/features/mentorship/types/mentorship.types';
import config from '@/config/env.config';

export interface CreateGroupSessionInput {
    title: string;
    description: string;
    topic: string;
    category?: string;
    scheduledAt: string;
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
          throw new Error('Unable to connect to server. Please check your internet connection.');
        }

        if (error.response?.status === 400) {
          const errors = apiError?.errors?.map((e: any) => e.message).join(', ');
          throw new Error(errors || apiError?.message || 'Validation failed');
        }

        if (error.response?.status === 401) {
          throw new Error('Session expired. Please login again.');
        }

        if (error.response?.status === 409) {
          throw new Error('Mentor profile already exists for this account.');
        }

        if (apiError?.message) {
          throw new Error(apiError.message);
        }
      }

      throw new Error('Failed to create mentor profile. Please try again.');
    }
  }

  static async getMentorByUserId(userId: string): Promise<MentorResponse> {
    try {
      const { data } = await api.get<MentorResponse>(`${config.NEXT_PUBLIC_MENTOR_BY_USER_ENDPOINT || process.env.NEXT_PUBLIC_MENTOR_BY_USER_ENDPOINT}/${userId}`);
      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) throw new Error('Mentor profile not found.');
      }
      throw new Error('Failed to fetch mentor profile.');
    }
  }

  static async updateMentorAvailability(
    mentorId: string,
    availability: {
      timezone?: string;
      daysAvailable?: string[];
      preferredHours?: { start: string; end: string };
      bufferBetweenSessions?: number;
      slotDuration?: number;
      // ✅ NEW: poora per-day/multi-range weekly schedule — is se ab
      // backend me full-fidelity data save hota hai, na ki sirf simple
      // single-range summary.
      weeklySchedule?: Array<{
        day: string;
        enabled: boolean;
        timeRanges: Array<{ startTime: string; endTime: string }>;
      }>;
    }
  ): Promise<MentorResponse> {
    try {
      const formData = new FormData();
      formData.append('availability', JSON.stringify(availability));

      const { data } = await api.put<MentorResponse>(
        `${config.NEXT_PUBLIC_MENTOR_UPDATE_ENDPOINT || process.env.NEXT_PUBLIC_MENTOR_UPDATE_ENDPOINT}/${mentorId}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;
        if (apiError?.message) throw new Error(apiError.message);
        if (error.response?.status === 404) throw new Error('Mentor not found.');
        if (error.response?.status === 401) throw new Error('Session expired. Please login again.');
      }
      throw new Error('Failed to save weekly availability pattern.');
    }
  }

  static async updateProfilePhoto(mentorId: string, file: File): Promise<MentorResponse> {
    try {
      const formData = new FormData();
      formData.append('profilePic', file);

      const { data } = await api.put<MentorResponse>(
        `${config.NEXT_PUBLIC_MENTOR_UPDATE_ENDPOINT || process.env.NEXT_PUBLIC_MENTOR_UPDATE_ENDPOINT}/${mentorId}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;
        if (apiError?.message) throw new Error(apiError.message);
        if (error.response?.status === 401) throw new Error('Session expired. Please login again.');
      }
      throw new Error('Failed to update profile photo. Please try again.');
    }
  }


  static async getTrustScore(): Promise<any> {
    try {
      const { data } = await api.get('/mentorship/mentors/me/trust-score');
      return data;
    } catch (error: any) {
      throw new Error('Failed to fetch trust score.');
    }
  }

  static async getMentorDashboardStats(mentorId: string): Promise<any> {
    try {
      const { data } = await api.get(`/mentorship/analytics/mentor/${mentorId}/dashboard`);
      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;
        if (apiError?.message) throw new Error(apiError.message);
      }
      throw new Error('Failed to fetch analytics. Please try again.');
    }
  }

  static async getMyMentorProfile(mentorId: string): Promise<MentorResponse> {
    try {
      const { data } = await api.get<MentorResponse>(`${config.NEXT_PUBLIC_MENTOR_BY_ID_ENDPOINT || process.env.NEXT_PUBLIC_MENTOR_BY_ID_ENDPOINT}/${mentorId}`);
      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) throw new Error('Mentor profile not found.');
        if (error.response?.status === 401) throw new Error('Session expired. Please login again.');
      }
      throw new Error('Failed to fetch mentor profile. Please try again.');
    }
  }

  static async getAllMentors(params?: {
    page?: number;
    limit?: number;
    domains?: string[];
    skills?: string[];
  }): Promise<any> {
    try {
      const { data } = await api.get(`${config.NEXT_PUBLIC_ALL_MENTORS_ENDPOINT || process.env.NEXT_PUBLIC_ALL_MENTORS_ENDPOINT}`, { params });
      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;
        if (apiError?.message) throw new Error(apiError.message);
      }
      throw new Error('Failed to fetch mentors. Please try again.');
    }
  }

  static async createGroupSession(input: CreateGroupSessionInput): Promise<any> {
    try {
      const formData = new FormData();
      Object.entries(input).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'thumbnailImage') {
            formData.append(key, value as File);
          } else if (typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        }
      });

      const { data } = await api.post(
        `/mentorship/group-sessions/create`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      return data;
    } catch (error: any) {
      if (error?.response?.status === 400) throw new Error(error.response.data?.message || "Invalid group session data.");
      if (error?.response?.status === 404) throw new Error("Mentor not found.");
      if (error?.code === "ERR_NETWORK") throw new Error("Unable to connect to server.");
      throw new Error(error?.response?.data?.message || "Failed to create group session.");
    }
  }

  static async deleteGroupSession(id: string): Promise<any> {
    try {
      const { data } = await api.delete(`/mentorship/group-sessions/${id}`);
      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;
        if (apiError?.message) throw new Error(apiError.message);
      }
      throw new Error('Failed to delete group session.');
    }
  }

  static async updateGroupSession(id: string, payload: Record<string, any>): Promise<any> {
    try {
      const { data } = await api.patch(`/mentorship/group-sessions/${id}`, payload);
      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;
        if (apiError?.message) throw new Error(apiError.message);
      }
      throw new Error('Failed to update group session.');
    }
  }

  // ⭐ NEW: mentor starts a group session once minParticipants is met and
  // it's near the scheduled time. Backend route already existed
  // (POST /group-sessions/:id/start) but had no frontend caller.
  static async startGroupSession(id: string): Promise<any> {
    try {
      const { data } = await api.post(`/mentorship/group-sessions/${id}/start`);
      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;
        if (apiError?.message) throw new Error(apiError.message);
      }
      throw new Error('Failed to start group session.');
    }
  }

  static async cancelGroupSession(id: string, reason: string): Promise<any> {
    try {
      const { data } = await api.post(`/mentorship/group-sessions/${id}/cancel`, { reason });
      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;
        if (apiError?.message) throw new Error(apiError.message);
      }
      throw new Error('Failed to cancel group session.');
    }
  }

  static async getAllGroupSessions(filters: { mentorId?: string; page?: number; limit?: number; status?: string } = {}): Promise<any> {
    try {
      const { data } = await api.get(`/mentorship/group-sessions`, { params: filters });
      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;
        if (apiError?.message) throw new Error(apiError.message);
      }
      throw new Error('Failed to fetch group sessions. Please try again.');
    }
  }

  static async getGroupSessionById(id: string): Promise<any> {
    try {
      const { data } = await api.get(`/mentorship/group-sessions/${id}`);
      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;
        if (apiError?.message) throw new Error(apiError.message);
      }
      throw new Error('Failed to fetch group session details. Please try again.');
    }
  }

  static async getMentorReviews(mentorId: string, params?: { page?: number; limit?: number }): Promise<any> {
    try {
      const { data } = await api.get(`/reviews/mentor/${mentorId}`, { params });
      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;
        if (apiError?.message) throw new Error(apiError.message);
      }
      throw new Error('Failed to fetch reviews. Please try again.');
    }
  }

  static async getMentorReviewStats(mentorId: string): Promise<any> {
    try {
      const { data } = await api.get(`/reviews/mentor/${mentorId}/stats`);
      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;
        if (apiError?.message) throw new Error(apiError.message);
      }
      throw new Error('Failed to fetch review stats. Please try again.');
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
      const { data } = await api.post(`/reviews`, payload);
      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;
        if (error.response?.status === 400) {
          throw new Error(apiError?.message || 'Review already submitted or invalid data.');
        }
        if (error.response?.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        if (apiError?.message) throw new Error(apiError.message);
      }
      throw new Error('Failed to submit review. Please try again.');
    }
  }

  static async toggleSaveMentor(mentorId: string): Promise<{ saved: boolean }> {
    try {
      const { data } = await api.patch<{ saved: boolean }>(
        `/mentorship/mentors/${mentorId}/save`
      );
      return data;
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

  static async reportMentor(mentorId: string, reason: string): Promise<any> {
    try {
      const { data } = await api.post(
        `/mentorship/mentors/${mentorId}/report`,
        { reason }
      );
      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;
        if (error.code === 'ERR_NETWORK') {
          throw new Error('Unable to connect to server. Please check your internet connection.');
        }
        if (error.response?.status === 400) {
          throw new Error(apiError?.message || 'Report reason is required.');
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
      throw new Error('Failed to submit report. Please try again.');
    }
  }

   // ⭐ fetch single session by sessionId — Join Session flow me
  // isi se meeting/roomId details milengi jo video call room me use hongi.
  static async getSessionById(sessionId: string): Promise<any> {
    try {
      const { data } = await api.get(`/sessions/${sessionId}`);
      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;
        if (error.code === 'ERR_NETWORK') {
          throw new Error('Unable to connect to server. Please check your internet connection.');
        }
        if (error.response?.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        if (error.response?.status === 403) {
          throw new Error('You are not authorized to view this session.');
        }
        if (error.response?.status === 404) {
          throw new Error('Session not found.');
        }
        if (apiError?.message) {
          throw new Error(apiError.message);
        }
      }
      throw new Error('Failed to fetch session details. Please try again.');
    }
  }

  static async joinGroupSession(id: string, transactionId?: string): Promise<any> {
    try {
      const { data } = await api.post(`/mentorship/group-sessions/${id}/join`, { transactionId });
      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;
        if (apiError?.message) throw new Error(apiError.message);
      }
      throw new Error('Failed to join group session.');
    }
  }

  // ⭐ NEW: leave a group session the mentee has already joined.
  // Backend route already existed (POST /group-sessions/:id/leave) but there
  // was no frontend caller for it — the mentee-side "Leave Session" action
  // in the group session detail modal needs this.
  static async leaveGroupSession(id: string): Promise<any> {
    try {
      const { data } = await api.post(`/mentorship/group-sessions/${id}/leave`);
      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;
        if (apiError?.message) throw new Error(apiError.message);
      }
      throw new Error('Failed to leave group session.');
    }
  }

  // ⭐ NEW: student joins waitlist for a mentor whose slot/session is full.
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
      const { data } = await api.post(`/mentorship/waitlist/join`, input);
      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;
        if (error.response?.status === 400) throw new Error(apiError?.message || 'Unable to join this session.');
        if (error.response?.status === 401) throw new Error('Session expired. Please login again.');
        if (apiError?.message) throw new Error(apiError.message);
      }
      throw new Error('Failed to join waitlist. Please try again.');
    }
  }

  private static waitlistError(error: any, fallback: string): Error {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ERR_NETWORK') {
        return new Error('Unable to connect to server. Please check your internet connection.');
      }
      if (error.response?.status === 401) return new Error('Session expired. Please login again.');
      const msg = error.response?.data?.message;
      if (msg) return new Error(msg);
    }
    return new Error(fallback);
  }

  static async getMyWaitlists(): Promise<any> {
    try {
      const { data } = await api.get(`/mentorship/waitlist/my-waitlists`);
      return data;
    } catch (error: any) {
      throw MentorService.waitlistError(error, 'Failed to fetch your waitlist.');
    }
  }

  static async leaveWaitlist(waitlistId: string, reason?: string): Promise<any> {
    try {
      const { data } = await api.delete(`/mentorship/waitlist/${waitlistId}`, {
        data: { reason: reason || 'User requested' },
      });
      return data;
    } catch (error: any) {
      throw MentorService.waitlistError(error, 'Failed to update waitlist.');
    }
  }

  static async getMentorWaitlist(mentorId: string, status?: string): Promise<any> {
    try {
      const { data } = await api.get(`/mentorship/waitlist/mentor/${mentorId}`, {
        params: status ? { status } : undefined,
      });
      return data;
    } catch (error: any) {
      throw MentorService.waitlistError(error, 'Failed to fetch waitlist.');
    }
  }

  static async approveWaitlistEntry(waitlistId: string): Promise<any> {
    try {
      const { data } = await api.post(`/mentorship/waitlist/${waitlistId}/approve`);
      return data;
    } catch (error: any) {
      throw MentorService.waitlistError(error, 'Failed to approve waitlist entry.');
    }
  }
}

export default MentorService;