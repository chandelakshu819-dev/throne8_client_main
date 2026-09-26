// src/lib/api/community.service.ts
import api from "./api.intance";
import {
  LeaderboardMentor,
  GetTopMentorsParams,
  CommunityStats,
  CommunityEvent,
  CreateEventPayload,
  UpdateEventPayload,
  ListEventsParams,
  EventAttendee,
  PaginatedResponse,
  Forum,
  ForumReply,
  CreateForumPayload,
  AddReplyPayload,
  ListForumsParams,
  ListRepliesParams,
} from "@/types/community.types";

/**
 * NOTE ON BASE PATHS:
 * The router file (src/routes/index.ts) mounts:
 *   router.use('/community', communityRoutes)         -> top-mentors, stats
 *   router.use('/community/events', communityEventRoutes)
 *   router.use('/forums', forumRoutes)
 *
 * The AI-generated doc listed top-mentors/community-stats WITHOUT the
 * `/community` prefix, and `cancel-rsvp` as POST instead of DELETE `/rsvp`.
 * Trusting the router file here since it's the primary source. If any of
 * these 404 in testing, the two flagged spots below are the first things
 * to check.
 */

export class CommunityService {
  // ─────────────────────────────────────────
  // Top Mentors (Leaderboard)
  // ─────────────────────────────────────────
  static async getTopMentors(
    params: GetTopMentorsParams = {}
  ): Promise<LeaderboardMentor[]> {
    const { data } = await api.get("/community/top-mentors", { params });
    return data;
  }

  // ─────────────────────────────────────────
  // Community Stats
  // ─────────────────────────────────────────
  static async getStats(): Promise<CommunityStats> {
    const { data } = await api.get("/community/stats");
    return data;
  }

  // ─────────────────────────────────────────
  // Community Events
  // ─────────────────────────────────────────
  static async listEvents(
    params: ListEventsParams = {}
  ): Promise<PaginatedResponse<CommunityEvent> | CommunityEvent[]> {
    const { data } = await api.get("/community/events", { params });
    return data;
  }

  static async getEvent(id: string): Promise<CommunityEvent> {
    const { data } = await api.get(`/community/events/${id}`);
    return data;
  }

  static async createEvent(
    payload: CreateEventPayload
  ): Promise<CommunityEvent> {
    const { data } = await api.post("/community/events", payload);
    return data;
  }

  static async updateEvent(
    id: string,
    payload: UpdateEventPayload
  ): Promise<CommunityEvent> {
    const { data } = await api.put(`/community/events/${id}`, payload);
    return data;
  }

  static async cancelEvent(id: string): Promise<CommunityEvent> {
    const { data } = await api.patch(`/community/events/${id}/cancel`);
    return data;
  }

  static async deleteEvent(id: string): Promise<void> {
    await api.delete(`/community/events/${id}`);
  }

  static async rsvp(id: string): Promise<{ status: string; message?: string }> {
    const { data } = await api.post(`/community/events/${id}/rsvp`);
    return data;
  }

  // ⚠️ UNCONFIRMED: router file says DELETE `/events/:id/rsvp`,
  // the doc says POST `/events/:id/cancel-rsvp`. Using the router file's
  // version below. If this 404s, swap to:
  //   api.post(`/community/events/${id}/cancel-rsvp`)
  static async cancelRsvp(id: string): Promise<{ status: string }> {
    const { data } = await api.delete(`/community/events/${id}/rsvp`);
    return data;
  }

  static async listAttendees(
    id: string,
    params: { page?: number; limit?: number } = {}
  ): Promise<PaginatedResponse<EventAttendee>> {
    const { data } = await api.get(`/community/events/${id}/attendees`, {
      params,
    });
    return data;
  }

  // ─────────────────────────────────────────
  // Discussion Forums (all routes require auth)
  // ─────────────────────────────────────────
  static async listForums(
    params: ListForumsParams = {}
  ): Promise<PaginatedResponse<Forum> | Forum[]> {
    const { data } = await api.get("/forums", { params });
    return data;
  }

  static async getForum(id: string): Promise<Forum> {
    const { data } = await api.get(`/forums/${id}`);
    return data;
  }

  static async createForum(payload: CreateForumPayload): Promise<Forum> {
    const { data } = await api.post("/forums", payload);
    return data;
  }

  static async deleteForum(id: string): Promise<void> {
    await api.delete(`/forums/${id}`);
  }

  static async pinForum(id: string, isPinned: boolean): Promise<Forum> {
    const { data } = await api.post(`/forums/${id}/pin`, { isPinned });
    return data;
  }

  static async lockForum(id: string, isLocked: boolean): Promise<Forum> {
    const { data } = await api.post(`/forums/${id}/lock`, { isLocked });
    return data;
  }

  static async toggleUpvote(id: string): Promise<Forum> {
    const { data } = await api.post(`/forums/${id}/upvote`);
    return data;
  }

  static async listReplies(
    id: string,
    params: ListRepliesParams = {}
  ): Promise<PaginatedResponse<ForumReply>> {
    const { data } = await api.get(`/forums/${id}/replies`, { params });
    return data;
  }

  static async addReply(
    id: string,
    payload: AddReplyPayload
  ): Promise<ForumReply> {
    const { data } = await api.post(`/forums/${id}/replies`, payload);
    return data;
  }
}

export default CommunityService;