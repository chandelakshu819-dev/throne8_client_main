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
  } | null;
  averageRating?: number;
  totalReviews?: number;
}

export const trustScoreService = {
  getByUserId: async (userId: string): Promise<TrustScoreData> => {
    const response = await api.get(`/mentorship/trust-score/${userId}`);
    return response.data.data;
  },
};

export default trustScoreService;