// src/types/community.types.ts

// ─────────────────────────────────────────────
// Top Mentors (Leaderboard)
// ─────────────────────────────────────────────

export interface MentorStats {
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  totalEarnings: number;
  averageRating: number;
  totalReviews: number;
  responseTime: number;
  completionRate: number;
}

// Confirmed from src/Mentorship/services/community.service.ts (backend):
// getTopMentors() returns a FLAT shape, not the nested `stats` object from
// the raw Mentor model. `name`/`fullName` are read off the Mentor doc
// directly, but the Mentor schema has neither field (name only exists on
// the populated User) — so `name` will be undefined until the backend
// query populates `user` or the frontend falls back to `title`/`domains`.
export interface LeaderboardMentor {
  mentorId: string;
  userId: string;
  name?: string; // likely undefined for now — see note above
  profilePic: string;
  domains: string[];
  rating: number;
  sessionsCompleted: number;
}

export type LeaderboardPeriod = 'weekly' | 'monthly' | 'all-time';

export interface GetTopMentorsParams {
  limit?: number;
  period?: LeaderboardPeriod;
  domain?: string;
}

// ─────────────────────────────────────────────
// Community Stats
// ─────────────────────────────────────────────

export interface CommunityStats {
  totalMentors: number;
  activeMentors: number;
}

// ─────────────────────────────────────────────
// Community Events
// ─────────────────────────────────────────────

export type EventType = 'meetup' | 'webinar' | 'workshop' | 'networking';

export interface EventCreator {
  userId: string;
  name?: string;
}

export interface CommunityEvent {
  _id: string;
  title: string;
  description?: string;
  date: string; // ISO date string
  type: EventType;
  createdBy: EventCreator | null; // now an attached User object, not a raw ObjectId/UUID
  participantsCount: number;
  resourceLink?: string;
  isCancelled: boolean;
  createdAt: string;
  updatedAt: string;
  // present only on GET /events/:id when the requester is authenticated
  isGoing?: boolean;
}

export type RsvpStatus = 'going' | 'cancelled';

export interface EventRSVP {
  _id: string;
  event: string;
  user: string;
  status: RsvpStatus;
}

export interface CreateEventPayload {
  title: string;
  description?: string;
  date: string;
  type?: EventType;
  resourceLink?: string;
}

export type UpdateEventPayload = Partial<CreateEventPayload>;

export interface ListEventsParams {
  search?: string;
  page?: number;
  limit?: number;
  type?: EventType;
  upcoming?: boolean; // confirm: not explicitly documented, verify with backend before relying on it
}


export interface EventAttendee {
  _id: string;
  event: string;
  user: {
    _id?: string;
    userId?: string;
    name?: string;
    profilePic?: string;
  } | null;
  status: RsvpStatus;
}

// Confirmed from the live forums response: the backend paginates as
// { items, total, page, pages } — NOT { data, limit, totalPages } as
// originally assumed. Fixed here to match what's actually returned.
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

// ─────────────────────────────────────────────
// Discussion Forums
// ─────────────────────────────────────────────

export type ForumCategory = 'teaching-tips' | 'pricing' | 'tech-stack' | 'general';

export interface ForumAuthor {
  userId?: string;
  name?: string;
  profilePic?: string;
}

export interface Forum {
  _id: string;
  topic: string;
  description?: string;
  category: ForumCategory;
  author: ForumAuthor | string | null;
  replyCount: number;
  upvotes: string[]; // array of User IDs who upvoted
  isPinned: boolean;
  isLocked: boolean;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ForumReply {
  _id: string;
  forum: string;
  author: ForumAuthor | string | null;
  content: string;
  mentions: string[];
  upvotes: string[];
  parentReplyId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateForumPayload {
  topic: string;
  description?: string;
  category?: ForumCategory;
}

export interface AddReplyPayload {
  content: string;
  mentions?: string[];
  parentReplyId?: string | null;
}

export interface ListForumsParams {
  search?: string;
  page?: number;
  limit?: number;
  category?: ForumCategory;
  sort?: "recent" | "trending";
}


export interface ListRepliesParams {
  page?: number;
  limit?: number;
}