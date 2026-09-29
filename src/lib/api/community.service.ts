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
 * app.ts mounts the whole mentorship router at /api/v1/mentorship, and
 * within that, src/routes/index.ts mounts:
 *   router.use('/community', communityRoutes)         -> top-mentors, stats
 *   router.use('/community/events', communityEventRoutes)
 *   router.use('/forums', forumRoutes)
 *
 * `api` (api.intance.ts) has baseURL = /api/v1 only — it does NOT include
 * `/mentorship` — confirmed via a 404 on GET /api/v1/community/top-mentors
 * in the browser Network tab. So every path below is written in full from
 * `/mentorship` onward, e.g. `/mentorship/community/top-mentors`.
 *
 * If api.intance.ts's baseURL is later changed to include `/mentorship`,
 * every path in this file needs the prefix stripped back out.
 *
 * cancelRsvp is still unconfirmed: router file says DELETE `/rsvp`, an
 * earlier doc said POST `/cancel-rsvp`. Flagged again at that method.
 *
 * RESPONSE ENVELOPE: confirmed from the mentor-profile endpoint's response
 * (GET /mentorship/mentors/:id) that this backend wraps every response as
 * { success, message, data }. `topMentors.map is not a function` happened
 * because we were returning the whole envelope instead of `data.data`.
 * Every method below now returns `data.data`. This was confirmed on the
 * mentor-profile endpoint specifically — if any one method here (e.g.
 * listForums, listEvents with pagination) turns out to nest differently
 * (like `data.data.items`), that one method needs its own unwrap, not
 * a blanket fix.
 */

export class CommunityService {
  // ─────────────────────────────────────────
  // Top Mentors (Leaderboard)
  // ─────────────────────────────────────────
  static async getTopMentors(
    params: GetTopMentorsParams = {}
  ): Promise<LeaderboardMentor[]> {
    const { data } = await api.get("/mentorship/community/top-mentors", { params });
    return data.data;
  }

  // ─────────────────────────────────────────
  // Community Stats
  // ─────────────────────────────────────────
  static async getStats(): Promise<CommunityStats> {
    const { data } = await api.get("/mentorship/community/stats");
    return data.data;
  }

  // ─────────────────────────────────────────
  // Community Events
  // ─────────────────────────────────────────
  static async listEvents(
    params: ListEventsParams = {}
  ): Promise<PaginatedResponse<CommunityEvent> | CommunityEvent[]> {
    const { data } = await api.get("/mentorship/community/events", { params });
    return data.data;
  }

  static async getEvent(id: string): Promise<CommunityEvent> {
    const { data } = await api.get(`/mentorship/community/events/${id}`);
    return data.data;
  }

  static async createEvent(
    payload: CreateEventPayload
  ): Promise<CommunityEvent> {
    const { data } = await api.post("/mentorship/community/events", payload);
    return data.data;
  }

  static async updateEvent(
    id: string,
    payload: UpdateEventPayload
  ): Promise<CommunityEvent> {
    const { data } = await api.put(`/mentorship/community/events/${id}`, payload);
    return data.data;
  }

  static async cancelEvent(id: string): Promise<CommunityEvent> {
    const { data } = await api.patch(`/mentorship/community/events/${id}/cancel`);
    return data.data;
  }

  static async deleteEvent(id: string): Promise<void> {
    await api.delete(`/mentorship/community/events/${id}`);
  }

  static async rsvp(id: string): Promise<CommunityEvent> {
    const { data } = await api.post(`/mentorship/community/events/${id}/rsvp`);
    return data.data;
  }

  // ⚠️ UNCONFIRMED: router file says DELETE `/events/:id/rsvp`,
  // the doc says POST `/events/:id/cancel-rsvp`. Using the router file's
  // version below. If this 404s, swap to:
  //   api.post(`/mentorship/community/events/${id}/cancel-rsvp`)
  static async cancelRsvp(id: string): Promise<{ status: string }> {
    const { data } = await api.delete(`/mentorship/community/events/${id}/rsvp`);
    return data.data;
  }

  static async listAttendees(
    id: string,
    params: { page?: number; limit?: number } = {}
  ): Promise<PaginatedResponse<EventAttendee>> {
    const { data } = await api.get(`/mentorship/community/events/${id}/attendees`, {
      params,
    });
    return data.data;
  }

  // ─────────────────────────────────────────
  // Discussion Forums (all routes require auth)
  // ─────────────────────────────────────────
  static async listForums(
    params: ListForumsParams = {}
  ): Promise<PaginatedResponse<Forum> | Forum[]> {
    const { data } = await api.get("/mentorship/forums", { params });
    return data.data;
  }

  static async getForum(id: string): Promise<Forum> {
    const { data } = await api.get(`/mentorship/forums/${id}`);
    return data.data;
  }

  static async getForumById(id: string): Promise<Forum> {
    return this.getForum(id);
  }

  static async createForum(payload: CreateForumPayload): Promise<Forum> {
    const { data } = await api.post("/mentorship/forums", payload);
    return data.data;
  }

  static async deleteForum(id: string): Promise<void> {
    await api.delete(`/mentorship/forums/${id}`);
  }

  static async updateForum(
    id: string,
    payload: { topic?: string; description?: string }
  ): Promise<Forum> {
    const { data } = await api.patch(`/mentorship/forums/${id}`, payload);
    return data.data;
  }

  static async pinForum(id: string, isPinned: boolean): Promise<Forum> {
    const { data } = await api.patch(`/mentorship/forums/${id}/pin`, { isPinned });
    return data.data;
  }

  static async lockForum(id: string, isLocked: boolean): Promise<Forum> {
    const { data } = await api.patch(`/mentorship/forums/${id}/lock`, { isLocked });
    return data.data;
  }

  static async toggleUpvote(id: string): Promise<Forum> {
    const { data } = await api.post(`/mentorship/forums/${id}/upvote`);
    return data.data;
  }

  static async listReplies(
    id: string,
    params: ListRepliesParams = {}
  ): Promise<PaginatedResponse<ForumReply>> {
    const { data } = await api.get(`/mentorship/forums/${id}/replies`, { params });
    return data.data;
  }

  static async addReply(
    id: string,
    payload: AddReplyPayload
  ): Promise<ForumReply> {
    const { data } = await api.post(`/mentorship/forums/${id}/replies`, payload);
    return data.data;
  }
}

export default CommunityService;