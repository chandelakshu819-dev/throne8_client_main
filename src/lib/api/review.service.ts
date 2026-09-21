import api from "./api.intance";

export interface MentorReview {
  id?: string;
  _id?: string;
  reviewId?: string;
  sessionId: string;
  mentorId: string;
  menteeId?: string;
  rating: number;
  comment: string;
  helpfulCount?: number;
  isVerified?: boolean;
  tags?: string[];
  mentorResponse?: { comment: string; respondedAt: string };
  createdAt?: string;
  updatedAt?: string;
  mentee?: {
    firstName?: string;
    lastName?: string;
    profilePhotoId?: string | null;
  };
  mentor?: {
    firstName?: string;
    lastName?: string;
    profilePhotoId?: string | null;
  };
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

// matches backend's allowed tags list exactly
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

  submitReview: (input: SubmitReviewInput) =>
    api.post<{ data: MentorReview }>(`/mentorship/reviews`, input).then((res) => res.data.data),

  // NEW: fetches all reviews the logged-in mentee has submitted, so we can
  // cross-reference against `sessions` by sessionId and know which sessions
  // already have a review vs are still pending — SessionMentor documents
  // never carry the review themselves (see backend submitReview()), so this
  // is the only reliable source of truth for "given vs pending".
  getMyReviews: () =>
    api
      .get<any>(`/mentorship/reviews/mentee/me`)
      .then((res) => {
        const raw = res?.data?.data ?? res?.data;
        if (Array.isArray(raw)) return raw as MentorReview[];
        if (Array.isArray(raw?.reviews)) return raw.reviews as MentorReview[];
        return [] as MentorReview[];
      }),

  deleteReview: (reviewId: string) =>
    api.delete<{ message: string; success: boolean }>(`/mentorship/reviews/${reviewId}`).then((res) => res.data),
};

export default ReviewService;