import api from './api.intance';

export interface StreakMilestone {
  days: number;
  achieved: boolean;
}

export interface PublicStreakData {
  currentStreak: number;
  longestStreak: number;
  isActive: boolean;
  milestones: StreakMilestone[];
}

export const streakService = {
  getByUserId: async (userId: string): Promise<PublicStreakData> => {
    const response = await api.get(`/study-group/streak/public/${userId}`);
    return response.data.data;
  },
};

export default streakService;