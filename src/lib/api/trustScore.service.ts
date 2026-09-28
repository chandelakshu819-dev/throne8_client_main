import api from './api.intance';

export interface TrustScoreBreakdown {
  profileCompleteness: number;
  reliability: number;
  studentSatisfaction: number;
  engagement: number;
}

export interface TrustScoreData {
  isMentor: boolean;
  mentorId?: string;
  userId?: string;
  title?: string;
  isVerified?: boolean;
  trustScore?: {
    overall: number;
    breakdown: TrustScoreBreakdown;
    tier: { min: number; name: string; color: string; bg: string; ring: string };
    nextTier: { min: number; name: string; color: string; bg: string; ring: string } | null;
    pointsToNextTier: number;
    improvementSuggestions: { text: string }[];
  } | null;
  averageRating?: number;
  totalReviews?: number;
}

export const trustScoreService = {
  getByUserId: async (userId: string): Promise<TrustScoreData | null> => {
    try {
      const response = await api.get(`/mentorship/trust-score/${userId}`);
      return response.data?.data || response.data || null;
    } catch {
      return null;
    }
  },
  syncByUserId: async (userId: string): Promise<TrustScoreData | null> => {
    try {
      const response = await api.post(`/mentorship/trust-score/${userId}/sync`);
      return response.data?.data || response.data || null;
    } catch {
      return null;
    }
  }
};

export default trustScoreService;