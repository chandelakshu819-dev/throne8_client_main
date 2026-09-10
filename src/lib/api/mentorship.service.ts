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
    thumbnailImage?: File; // For FormData
    paymentMethod: string;
    bufferTimeMinutes?: number;
    followUp?: {
        allowed: boolean;
        periodDays: number;
    };
}

class MentorService {

  /**
   * 🎓 CREATE MENTOR PROFILE
   * multipart/form-data — profilePic file + JSON fields
   */
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
      console.log('🎓 [CREATE_MENTOR] Creating mentor profile...');

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

      console.log('✅ [CREATE_MENTOR] Mentor created:', data.data?.mentorId);
      return data;

    } catch (error: any) {
      console.error('❌ [CREATE_MENTOR] Failed:', error);

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
      console.log(`👤 [GET_MENTOR_BY_USER_ID] Fetching mentor profile for userId: ${userId}`);
      const { data } = await api.get<MentorResponse>(`${config.NEXT_PUBLIC_MENTOR_BY_USER_ENDPOINT || process.env.NEXT_PUBLIC_MENTOR_BY_USER_ENDPOINT}/${userId}`);
      console.log('✅ [GET_MENTOR_BY_USER_ID] Profile fetched:', data);
      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) throw new Error('Mentor profile not found.');
      }
      throw new Error('Failed to fetch mentor profile.');
    }
  }

  /**
   * 🛡️ GET MENTOR TRUST SCORE
   */
  static async getTrustScore(): Promise<any> {
    try {
      console.log('🛡️ [GET_TRUST_SCORE] Fetching trust score...');
      const { data } = await api.get('/mentorship/mentors/me/trust-score');
      console.log('✅ [GET_TRUST_SCORE] Fetched:', data);
      return data;
    } catch (error: any) {
      console.error('❌ [GET_TRUST_SCORE] Failed:', error);
      throw new Error('Failed to fetch trust score.');
    }
  }
  static async getMentorDashboardStats(mentorId: string): Promise<any> {
    try {
      console.log(`📊 [GET_DASHBOARD_STATS] Fetching for mentor: ${mentorId}`);

      const { data } = await api.get(`/mentorship/analytics/mentor/${mentorId}/dashboard`);
                                   

      console.log('✅ [GET_DASHBOARD_STATS] Fetched:', data);
      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;
        if (apiError?.message) throw new Error(apiError.message);
      }
      throw new Error('Failed to fetch analytics. Please try again.');
    }
  }

  /**
   * 👤 GET MY MENTOR PROFILE
   */
  static async getMyMentorProfile(mentorId: string): Promise<MentorResponse> {
    try {
      console.log('👤 [GET_MY_MENTOR] Fetching mentor profile...');

      const { data } = await api.get<MentorResponse>(`${config.NEXT_PUBLIC_MENTOR_BY_ID_ENDPOINT || process.env.NEXT_PUBLIC_MENTOR_BY_ID_ENDPOINT}/${mentorId}`);

      console.log('✅ [GET_MY_MENTOR] Profile fetched:', data);
      return data;

    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) throw new Error('Mentor profile not found.');
        if (error.response?.status === 401) throw new Error('Session expired. Please login again.');
      }
      throw new Error('Failed to fetch mentor profile. Please try again.');
    }
  }

  /**
   * 📋 GET ALL MENTORS
   */
  static async getAllMentors(params?: {
    page?: number;
    limit?: number;
    domains?: string[];
    skills?: string[];
  }): Promise<any> {
    try {
      console.log('📋 [GET_ALL_MENTORS] Fetching mentors...', params);

      const { data } = await api.get(`${config.NEXT_PUBLIC_ALL_MENTORS_ENDPOINT || process.env.NEXT_PUBLIC_ALL_MENTORS_ENDPOINT}`, { params });

      console.log('✅ [GET_ALL_MENTORS] Fetched:', data);
      return data;

    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;
        if (apiError?.message) throw new Error(apiError.message);
      }
      throw new Error('Failed to fetch mentors. Please try again.');
    }
  }

  /**
   * 👥 CREATE GROUP SESSION
   */
  static async createGroupSession(input: CreateGroupSessionInput): Promise<any> {
    try {
      console.log("👥 [CREATE_GROUP_SESSION] Creating...", {
        title: input.title,
        scheduledAt: input.scheduledAt,
      });

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
      console.error("❌ [CREATE_GROUP_SESSION] Failed", error?.response?.data || error?.message);
      if (error?.response?.status === 400) throw new Error(error.response.data?.message || "Invalid group session data.");
      if (error?.response?.status === 404) throw new Error("Mentor not found.");
      if (error?.code === "ERR_NETWORK") throw new Error("Unable to connect to server.");
      throw new Error(error?.response?.data?.message || "Failed to create group session.");
    }
  }

  /**
   * 👥 DELETE GROUP SESSION
   */
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

  /**
   * 👥 UPDATE GROUP SESSION
   */
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

  /**
   * 👥 CANCEL GROUP SESSION
   */
  
  
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

  /**
   * 👥 GET ALL GROUP SESSIONS
   */
  static async getAllGroupSessions(filters: { mentorId?: string; page?: number; limit?: number; status?: string } = {}): Promise<any> {
    try {
      console.log('👥 [GET_ALL_GROUP_SESSIONS] Fetching group sessions...', filters);

      const { data } = await api.get(`/mentorship/group-sessions`, { params: filters });

      console.log('✅ [GET_ALL_GROUP_SESSIONS] Fetched:', data);
      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;
        if (apiError?.message) throw new Error(apiError.message);
      }
      throw new Error('Failed to fetch group sessions. Please try again.');
    }
  }

  /**
   * 👥 GET GROUP SESSION BY ID
   */
  static async getGroupSessionById(id: string): Promise<any> {
    try {
      console.log(`👥 [GET_GROUP_SESSION_BY_ID] Fetching group session ${id}...`);

      const { data } = await api.get(`/mentorship/group-sessions/${id}`);

      console.log('✅ [GET_GROUP_SESSION_BY_ID] Fetched:', data);
      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;
        if (apiError?.message) throw new Error(apiError.message);
      }
      throw new Error('Failed to fetch group session details. Please try again.');
    }
  }

  /**
   * ⭐ GET REVIEWS FOR A MENTOR (real data — replaces hardcoded REVIEWS mock)
   * GET /reviews/mentor/:mentorId
   */
  static async getMentorReviews(mentorId: string, params?: { page?: number; limit?: number }): Promise<any> {
    try {
      console.log(`⭐ [GET_MENTOR_REVIEWS] Fetching reviews for mentor: ${mentorId}`);

      const { data } = await api.get(`/reviews/mentor/${mentorId}`, { params });

      console.log('✅ [GET_MENTOR_REVIEWS] Fetched:', data);
      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;
        if (apiError?.message) throw new Error(apiError.message);
      }
      throw new Error('Failed to fetch reviews. Please try again.');
    }
  }

  /**
   * 📊 GET REVIEW STATS FOR A MENTOR (average rating + star distribution)
   * GET /reviews/mentor/:mentorId/stats
   */
  static async getMentorReviewStats(mentorId: string): Promise<any> {
    try {
      console.log(`📊 [GET_MENTOR_REVIEW_STATS] Fetching review stats for mentor: ${mentorId}`);

      const { data } = await api.get(`/reviews/mentor/${mentorId}/stats`);

      console.log('✅ [GET_MENTOR_REVIEW_STATS] Fetched:', data);
      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;
        if (apiError?.message) throw new Error(apiError.message);
      }
      throw new Error('Failed to fetch review stats. Please try again.');
    }
  }
}

export default MentorService;