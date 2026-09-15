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

// 🔧 NEW: matches backend's allowed tags list exactly
// (see MentorshipReviewSchema.tags.enum in the backend model)
export const REVIEW_TAGS = [
  "helpful",
  "knowledgeable",
  "patient",
  "prepared",
  "punctual",
  "friendly",
  "professional",
  "insightful",
  "responsive",
  "exceeded_expectations",
] as const;

export type ReviewTag = (typeof REVIEW_TAGS)[number];

// 🔧 NEW: input shape for submitting a review — mirrors backend's
// submitReviewValidation (sessionId, mentorId, rating 1-5, comment 10-1000 chars)
export interface SubmitReviewInput {
  sessionId: string;
  mentorId: string;
  rating: number;
  comment: string;
  tags?: ReviewTag[];
}

const ReviewService = {
  getMentorReviews: (mentorId: string, page = 1, limit = 10) =>
    api
      .get<PaginatedResponse<MentorReview>>(`/mentorship/reviews/mentor/${mentorId}`, {
        params: { page, limit },
      })
      .then((res) => res.data),

  getReviewStats: (mentorId: string) =>
    api
      .get<{ data: ReviewStats }>(`/mentorship/reviews/mentor/${mentorId}/stats`)
      .then((res) => res.data.data),

  markHelpful: (reviewId: string) => api.post(`/mentorship/reviews/${reviewId}/helpful`),

  // 🔧 NEW: this was missing — no frontend wrapper existed for the
  // backend's POST /api/v1/mentorship/reviews route, so mentees had no way
  // to actually submit a review even though the backend was fully built.
  submitReview: (input: SubmitReviewInput) =>
    api.post<{ data: MentorReview }>(`/mentorship/reviews`, input).then((res) => res.data.data),
};

export default ReviewService;