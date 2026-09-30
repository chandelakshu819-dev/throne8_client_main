import api from "./api.intance";

export interface MentorReview {
  id?: string;
  _id?: string;
  reviewId?: string;
  sessionId: string;
  mentorId: string | any;
  menteeId?: string | any;
  // resolved plain user ids, used for profile links / permission checks on the client
  menteeUserId?: string;
  mentorUserId?: string;
  rating: number;
  comment: string;
  helpfulCount?: number;
  notHelpfulCount?: number;
  isVerified?: boolean;
  tags?: string[];
  mentorResponse?: { comment: string; respondedAt: string };
  createdAt?: string;
  updatedAt?: string;
  mentee?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    name?: string;
    profilePhotoId?: string | null;
    profilePic?: string | null;
    title?: string;
  };
  mentor?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    name?: string;
    profilePhotoId?: string | null;
    profilePic?: string | null;
    title?: string;
  };
  session?: {
    title?: string;
    sessionType?: string;
    scheduledAt?: string;
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

export type ReviewSort = "newest" | "helpful" | "highest" | "lowest";
export type ReviewReaction = "like" | "dislike";

export interface ReactionResult {
  helpfulCount: number;
  notHelpfulCount: number;
  userReaction: ReviewReaction | null;
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
  // matches GET /mentor/:mentorId?page=&limit=&sort=
  getMentorReviews: (mentorId: string, page = 1, limit = 10, sort: ReviewSort = "newest") =>
    api
      .get<{
        success: boolean;
        message: string;
        data: MentorReview[];
        meta: { page: number; limit: number; total: number; totalPages: number };
      }>(`/mentorship/reviews/mentor/${mentorId}`, { params: { page, limit, sort } })
      .then((res) => ({
        data: res.data.data,
        pagination: res.data.meta,
      })),

  getTopReviews: (mentorId: string, limit = 5) =>
    api
      .get<{ data: MentorReview[] }>(`/mentorship/reviews/mentor/${mentorId}/top`, { params: { limit } })
      .then((res) => res.data.data),

  // matches GET /mentor/:mentorId/stats
  getReviewStats: (mentorId: string) =>
    api
      .get<{ data: ReviewStats }>(`/mentorship/reviews/mentor/${mentorId}/stats`)
      .then((res) => res.data.data),

  // matches GET /mentor/:mentorId/my-reactions (auth required)
  // returns a map of reviewId -> the logged-in user's reaction on that review
  getMyReviewReactions: (mentorId: string) =>
    api
      .get<{ data: Record<string, ReviewReaction> }>(`/mentorship/reviews/mentor/${mentorId}/my-reactions`)
      .then((res) => res.data.data ?? {})
      .catch(() => ({} as Record<string, ReviewReaction>)),

  // matches POST /:id/react  body: { type: 'like' | 'dislike' } (toggle, auth required)
  reactToReview: (reviewId: string, type: ReviewReaction) =>
    api
      .post<{ data: ReactionResult }>(`/mentorship/reviews/${reviewId}/react`, { type })
      .then((res) => res.data.data),

  markHelpful: (reviewId: string) => api.post(`/mentorship/reviews/${reviewId}/helpful`),

  submitReview: (input: SubmitReviewInput) =>
    api.post<{ data: MentorReview }>(`/mentorship/reviews`, input).then((res) => res.data.data),

  updateReview: (reviewId: string, input: Partial<Pick<SubmitReviewInput, "rating" | "comment" | "tags">>) =>
    api.put<{ data: MentorReview }>(`/mentorship/reviews/${reviewId}`, input).then((res) => res.data.data),

  // matches POST /:id/response  body: { response: string } (mentor only, auth required)
  replyToReview: (reviewId: string, response: string) =>
    api
      .post<{ data: MentorReview }>(`/mentorship/reviews/${reviewId}/response`, { response })
      .then((res) => res.data.data),

  // matches DELETE /:id/response (mentor only, auth required)
  deleteReviewReply: (reviewId: string) =>
    api.delete<{ message: string; success: boolean }>(`/mentorship/reviews/${reviewId}/response`).then((res) => res.data),

  reportReview: (reviewId: string, reason: string) =>
    api.post<{ message: string; success: boolean }>(`/mentorship/reviews/${reviewId}/report`, { reason }).then((res) => res.data),

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