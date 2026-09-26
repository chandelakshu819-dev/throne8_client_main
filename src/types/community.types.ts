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

export interface LeaderboardMentor {
  mentorId: string;
  userId: string;
  name?: string; // confirm: not in the raw model, may be populated from User ref
  profilePic: string;
  title: string;
  domains: string[];
  stats: MentorStats;
  status: 'pending_approval' | 'active' | 'inactive' | 'rejected' | 'suspended';
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

export interface CommunityEvent {
  _id: string;
  title: string;
  description?: string;
  date: string; // ISO date string
  type: EventType;
  createdBy: string; // User ObjectId
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
  page?: number;
  limit?: number;
  type?: EventType;
  upcoming?: boolean; // confirm: not explicitly documented, verify with backend before relying on it
}

export interface EventAttendee {
  _id: string;
  event: string;
  user: {
    _id: string;
    name?: string;
    profilePic?: string;
  };
  status: RsvpStatus;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─────────────────────────────────────────────
// Discussion Forums
// ─────────────────────────────────────────────

export type ForumCategory = 'teaching-tips' | 'pricing' | 'tech-stack' | 'general';

export interface ForumAuthor {
  _id: string;
  name?: string;
  profilePic?: string;
}

export interface Forum {
  _id: string;
  topic: string;
  description?: string;
  category: ForumCategory;
  author: ForumAuthor | string;
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
  author: ForumAuthor | string;
  content: string;
  mentions: string[];
  upvotes: string[];
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
}

export interface ListForumsParams {
  page?: number;
  limit?: number;
  category?: ForumCategory;
}

export interface ListRepliesParams {
  page?: number;
  limit?: number;
}