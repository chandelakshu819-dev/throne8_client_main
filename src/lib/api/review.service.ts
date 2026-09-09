import api from "./api.intance";

export interface MentorReview {
  id: string;
  reviewId: string;
  mentorId: string;
  menteeId: string;
  rating: number;
  comment: string;
  helpfulCount: number;
  isVerified: boolean;
  tags: string[];
  mentorResponse?: { comment: string; respondedAt: string };
  createdAt: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: { 5: number; 4: number; 3: number; 2: number; 1: number };
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const ReviewService = {
  getMentorReviews: (mentorId: string, page = 1, limit = 10) =>
    api
      .get<PaginatedResponse<MentorReview>>(`/reviews/mentor/${mentorId}`, {
        params: { page, limit },
      })
      .then((res) => res.data),

  getReviewStats: (mentorId: string) =>
    api
      .get<{ data: ReviewStats }>(`/reviews/mentor/${mentorId}/stats`)
      .then((res) => res.data.data),

  markHelpful: (reviewId: string) => api.post(`/reviews/${reviewId}/helpful`),
};

export default ReviewService;