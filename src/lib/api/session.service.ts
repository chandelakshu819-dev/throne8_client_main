import config from "@/config/env.config";
import api from "./api.intance";

// ── Types ──────────────────────────────────────────────────
export interface CreateSessionInput {
    sessionType: string;
    scheduledAt: string;
    timezone: string;
    title: string;
    description?: string;
    paymentMethod: string;
    interviewType?: string;
    duration: number;
    followUp?: {
        allowed: boolean;
        periodDays: number;
    };
    bufferTimeMinutes?: number;
    pricing: {
        basePrice: number;
        platformFee: number;
        totalAmount: number;
        currency?: string;
    };
    thumbnailImage?: File;
}

export interface SessionFilters {
    page?: number;
    limit?: number;
    status?: string;
    sessionType?: string;
    role?: "mentor" | "mentee";
    startDate?: string;
    endDate?: string;
}

interface ApiResponse {
    status: string;
    message: string;
    data: any;
}

// ── Analytics Types ────────────────────────────────────────
export interface PopularService {
    _id: string; // e.g., "1_ON_1"
    count: number;
    revenue: number;
}
export interface AnalyticsData {
    mentor: { id: string; userId: string; title: string; status: string };
    sessions: {
        total: number;
        completed: number;
        cancelled: number;
        completionRate: number;
        byType: PopularService[];
    };
    earnings: {
        total: number;
        average: number;
        currency: string;
    };
    reviews: {
        averageRating: number;
        totalReviews: number;
        distribution: Record<string, number>;
    };
    period: { startDate?: string; endDate?: string };
}
export interface AnalyticsResponse {
    success: boolean;
    data: AnalyticsData;
}

export interface BookSessionInput {
    sessionId: string;
    mentorId: string;
    availabilityId: string;
    slotTime: string;
    scheduledAt: string;
    timezone: string;
    paymentMethod: string;
    pricing: {
        basePrice: number;
        platformFee: number;
        totalAmount: number;
        currency?: string;
    };
}

// ── Group join-request status (mentee's own request state) ──
export interface GroupJoinRequestStatus {
    sessionId: string;
    menteeId: string;
    requestStatus: "pending" | "accepted" | "rejected";
    attendanceStatus?: string;
    registeredAt?: string;
    paymentStatus?: string;
}

class SessionService {

    // ── GROUP SESSIONS base endpoint ────────────────────────
    // Falls back to a sane default path if not defined in env config,
    // same pattern as every other *_ENDPOINT fallback in this file.
    private static readonly GROUP_SESSIONS_ENDPOINT =
        (config as any).NEXT_PUBLIC_GROUP_SESSIONS_ENDPOINT
        || (process.env as any).NEXT_PUBLIC_GROUP_SESSIONS_ENDPOINT
        || '/mentorship/group-sessions';

    static async createSession(input: CreateSessionInput): Promise<ApiResponse> {
        try {
            console.log("📅 [CREATE_SESSION] Creating...", {
                sessionType: input.sessionType,
                scheduledAt: input.scheduledAt,
            });

            const formData = new FormData();
            Object.entries(input).forEach(([key, value]) => {
                if (value !== undefined) {
                    if (key === 'thumbnailImage') {
                        formData.append(key, value as File);
                    } else if (typeof value === 'object') {
                        formData.append(key, JSON.stringify(value));
                    } else {
                        formData.append(key, String(value));
                    }
                }
            });

            const { data } = await api.post<ApiResponse>(
                `${config.NEXT_PUBLIC_SESSIONS_CREATE_ENDPOINT || process.env.NEXT_PUBLIC_SESSIONS_CREATE_ENDPOINT}`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            // console.log("✅ [CREATE_SESSION] Created:", data.data?.sessionId);
            return data;
        } catch (error: any) {
            console.error("❌ [CREATE_SESSION] Failed", error?.response?.data || error?.message);
            if (error?.response?.status === 400) throw new Error(error.response.data?.message || "Invalid session data.");
            if (error?.response?.status === 404) throw new Error("Mentor not found.");
            if (error?.response?.status === 409) throw new Error("Slot already booked.");
            if (error?.code === "ERR_NETWORK") throw new Error("Unable to connect to server.");
            throw new Error(error?.response?.data?.message || "Failed to create session.");
        }
    }

    static async getMentorSessions(mentorId: string): Promise<ApiResponse> {
        try {
            const { data } = await api.get<ApiResponse>(
                `${config.NEXT_PUBLIC_SESSIONS_MENTOR_ENDPOINT || process.env.NEXT_PUBLIC_SESSIONS_MENTOR_ENDPOINT}/${mentorId}`
            );
            console.log("✅ [GET_MENTOR_SESSIONS] Fetched:", data, "sessions");
            return data;
        } catch (error: any) {
            console.error("❌ [GET_MENTOR_SESSIONS] Failed", error?.response?.data);
            throw new Error(error?.response?.data?.message || "Failed to fetch mentor sessions.");
        }
    }

    // ── GET MENTOR ANALYTICS ───────────────────────────────
    static async getMentorAnalytics(mentorId: string): Promise<AnalyticsResponse> {
        try {
            console.log("📊 [GET_MENTOR_ANALYTICS] Fetching for:", mentorId);
            const { data } = await api.get<AnalyticsResponse>(
                `/mentorship/analytics/mentor/${mentorId}/stats`
            );
            return data;
        } catch (error: any) {
            console.error("❌ [GET_MENTOR_ANALYTICS] Failed:", error?.response?.data || error?.message);
            throw new Error(error?.response?.data?.message || "Failed to fetch mentor analytics.");
        }
    }

    static async bookSession(input: BookSessionInput): Promise<ApiResponse> {
        try {
            const { data } = await api.post<ApiResponse>(
                `${config.NEXT_PUBLIC_SESSIONS_BOOK_ENDPOINT || process.env.NEXT_PUBLIC_SESSIONS_BOOK_ENDPOINT}`,
                input
            );
            return data;
        } catch (error: any) {
            console.error("RAW ERROR TYPE:", typeof error, error?.constructor?.name);
            console.error("IS AXIOS ERROR:", error?.isAxiosError);
            console.error("RESPONSE:", error?.response);
            console.error("RESPONSE DATA:", error?.response?.data);
            console.error("MESSAGE:", error?.message);
            throw new Error(error?.response?.data?.message || "Failed to book session.");
        }
    }

    // ── GET ALL SESSIONS FROM DB (admin only — no mentor/user filter) ──
    static async getAllSessionsFromDB(filters: { page?: number; limit?: number } = {}): Promise<ApiResponse> {
        try {
            const { data } = await api.get<ApiResponse>(
                `${config.NEXT_PUBLIC_SESSIONS_GET_ALL_DB_ENDPOINT || process.env.NEXT_PUBLIC_SESSIONS_GET_ALL_DB_ENDPOINT}`,
                { params: filters }
            );
            console.log("✅ [GET_ALL_SESSIONS_DB] Fetched:", data, "sessions");
            return data;
        } catch (error: any) {
            throw new Error(error?.response?.data?.message || "Failed to fetch all sessions.");
        }
    }

    // ── GET UPCOMING SESSIONS (mentor/user-scoped, real mentee data) ───
    // ✅ FIX: was missing entirely — the dashboard was falling back to
    // getAllSessionsFromDB(), an admin endpoint with no mentor/user filter,
    // which is why "Upcoming sessions" showed random platform-wide session
    // templates instead of this mentor's actual bookings with real mentee
    // names/photos. Backend derives the user from the auth token — no
    // userId param needed here, just role.
    static async getUpcomingSessions(params: { role?: "mentor" | "mentee"; limit?: number } = {}): Promise<ApiResponse> {
        try {
            const endpoint = config.NEXT_PUBLIC_SESSIONS_UPCOMING_ENDPOINT
                || `${config.NEXT_PUBLIC_SESSIONS_ENDPOINT || process.env.NEXT_PUBLIC_SESSIONS_ENDPOINT}/upcoming`;

            const { data } = await api.get<ApiResponse>(endpoint, { params });
            console.log("✅ [GET_UPCOMING_SESSIONS] Fetched:", data);
            return data;
        } catch (error: any) {
            console.error("❌ [GET_UPCOMING_SESSIONS] Failed", error?.response?.data || error?.message);
            if (error?.response?.status === 401) throw new Error("Please login again.");
            if (error?.code === "ERR_NETWORK") throw new Error("Unable to connect to server.");
            throw new Error(error?.response?.data?.message || "Failed to fetch upcoming sessions.");
        }
    }

    // ── GET PAST SESSIONS (mentor/user-scoped, real mentee data) ───
    static async getPastSessions(params: { role?: "mentor" | "mentee"; limit?: number; page?: number } = {}): Promise<ApiResponse> {
        try {
            const endpoint = config.NEXT_PUBLIC_SESSIONS_PAST_ENDPOINT
                || `${config.NEXT_PUBLIC_SESSIONS_ENDPOINT || process.env.NEXT_PUBLIC_SESSIONS_ENDPOINT}/past`;

            const { data } = await api.get<ApiResponse>(endpoint, { params });
            console.log("✅ [GET_PAST_SESSIONS] Fetched:", data);
            return data;
        } catch (error: any) {
            console.error("❌ [GET_PAST_SESSIONS] Failed", error?.response?.data || error?.message);
            if (error?.response?.status === 401) throw new Error("Please login again.");
            if (error?.code === "ERR_NETWORK") throw new Error("Unable to connect to server.");
            throw new Error(error?.response?.data?.message || "Failed to fetch past sessions.");
        }
    }

    // ── GET SESSION BY ID ──────────────────────────────────
    static async getSessionById(sessionId: string): Promise<ApiResponse> {
        try {
            // console.log("🔍 [GET_SESSION] Fetching:", sessionId);

            const { data } = await api.get<ApiResponse>(
                `${config.NEXT_PUBLIC_SESSIONS_ENDPOINT || process.env.NEXT_PUBLIC_SESSIONS_ENDPOINT}/${sessionId}`
            );

            // console.log("✅ [GET_SESSION] Fetched:", data.data?.sessionId);
            return data;
        } catch (error: any) {
            console.error("❌ [GET_SESSION] Failed", error?.response?.data || error?.message);
            if (error?.response?.status === 404) throw new Error("Session not found.");
            if (error?.response?.status === 403) throw new Error("Not authorized to view this session.");
            if (error?.code === "ERR_NETWORK") throw new Error("Unable to connect to server.");
            throw new Error(error?.response?.data?.message || "Failed to fetch session.");
        }
    }

    // ── GET ALL SESSIONS ───────────────────────────────────
    static async getAllSessions(filters: SessionFilters = {}): Promise<ApiResponse> {
        try {
            console.log("📋 [GET_ALL_SESSIONS] Fetching with filters:", filters);

            const endpoint = config.NEXT_PUBLIC_SESSIONS_GET_ALL_ENDPOINT
                || `${config.NEXT_PUBLIC_SESSIONS_ENDPOINT || process.env.NEXT_PUBLIC_SESSIONS_ENDPOINT}/get-all`;

            const { data } = await api.get<ApiResponse>(endpoint, { params: filters });

            // console.log("✅ [GET_ALL_SESSIONS] Fetched:", data, "sessions");
            return data;
        } catch (error: any) {
            console.error("❌ [GET_ALL_SESSIONS] Failed", error?.response?.data || error?.message);
            if (error?.response?.status === 401) throw new Error("Please login again.");
            if (error?.code === "ERR_NETWORK") throw new Error("Unable to connect to server.");
            throw new Error(error?.response?.data?.message || "Failed to fetch sessions.");
        }
    }



    static async confirmSession(sessionId: string, bookingId?: string): Promise<ApiResponse> {
        try {
            const { data } = await api.post<ApiResponse>(
                `${config.NEXT_PUBLIC_SESSIONS_ENDPOINT || process.env.NEXT_PUBLIC_SESSIONS_ENDPOINT}/${sessionId}/confirm`,
                { bookingId }
            );
            return data;
        } catch (error: any) {
            throw new Error(error?.response?.data?.message || "Failed to confirm session.");
        }
    }

    static async startSession(sessionId: string, bookingId?: string): Promise<ApiResponse> {
        try {
            const { data } = await api.post<ApiResponse>(
                `${config.NEXT_PUBLIC_SESSIONS_ENDPOINT || process.env.NEXT_PUBLIC_SESSIONS_ENDPOINT}/${sessionId}/start`,
                { bookingId }
            );
            return data;
        } catch (error: any) {
            throw new Error(error?.response?.data?.message || "Failed to start session.");
        }
    }

    static async completeSession(sessionId: string, payload: { actualDuration?: number, wasSuccessful?: boolean, followUpRequired?: boolean, followUpNotes?: string, bookingId?: string }): Promise<ApiResponse> {
        try {
            const { data } = await api.post<ApiResponse>(
                `${config.NEXT_PUBLIC_SESSIONS_ENDPOINT || process.env.NEXT_PUBLIC_SESSIONS_ENDPOINT}/${sessionId}/complete`,
                payload
            );
            return data;
        } catch (error: any) {
            throw new Error(error?.response?.data?.message || "Failed to complete session.");
        }
    }

    static async deleteSession(sessionId: string): Promise<ApiResponse> {
        try {
            const { data } = await api.delete<ApiResponse>(
                `${config.NEXT_PUBLIC_SESSIONS_ENDPOINT || process.env.NEXT_PUBLIC_SESSIONS_ENDPOINT}/${sessionId}`
            );
            return data;
        } catch (error: any) {
            console.error("❌ [DELETE_SESSION] Failed", error?.response?.data || error?.message);
            throw new Error(error?.response?.data?.message || "Failed to delete session.");
        }
    }

    static async updateSession(sessionId: string, payload: Record<string, any>): Promise<ApiResponse> {
        try {
            // ⚠️ Always send multipart/form-data (even without a new image).
            // The backend's uploadSingle('thumbnailImage') middleware chain only
            // reliably parses multipart requests on this route — plain JSON PUT
            // requests were causing a 500. Sending FormData consistently avoids
            // that, matching the working behavior of createSession.
            const formData = new FormData();
            Object.entries(payload).forEach(([key, value]) => {
                if (value === undefined || value === null) return;
                if (key === 'thumbnailImage') {
                    if (value instanceof File) {
                        formData.append(key, value);
                    }
                    // if it's a string (existing URL, unchanged), skip — don't send it back
                } else if (typeof value === 'object') {
                    formData.append(key, JSON.stringify(value));
                } else {
                    formData.append(key, String(value));
                }
            });

            const { data } = await api.put<ApiResponse>(
                `${config.NEXT_PUBLIC_SESSIONS_ENDPOINT || process.env.NEXT_PUBLIC_SESSIONS_ENDPOINT}/${sessionId}`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            return data;
        } catch (error: any) {
            console.error("❌ [UPDATE_SESSION] Failed", error?.response?.data || error?.message);
            throw new Error(error?.response?.data?.message || "Failed to update session.");
        }
    }

    static async cancelSession(sessionId: string, reason: string, bookingId: string): Promise<ApiResponse> {
        try {
            const { data } = await api.post<ApiResponse>(
                `${config.NEXT_PUBLIC_SESSIONS_ENDPOINT || process.env.NEXT_PUBLIC_SESSIONS_ENDPOINT}/${sessionId}/cancel`,
                { reason, bookingId }
            );
            return data;
        } catch (error: any) {
            throw new Error(error?.response?.data?.message || "Failed to cancel session.");
        }
    }

    static async rescheduleSession(sessionId: string, newScheduledAt: string, reason: string, bookingId: string): Promise<ApiResponse> {
        try {
            const { data } = await api.post<ApiResponse>(
                `${config.NEXT_PUBLIC_SESSIONS_ENDPOINT || process.env.NEXT_PUBLIC_SESSIONS_ENDPOINT}/${sessionId}/reschedule`,
                { newScheduledAt, reason, bookingId }
            );
            return data;
        } catch (error: any) {
            throw new Error(error?.response?.data?.message || "Failed to reschedule session.");
        }
    }

    // ── GET SESSION RECEIPT (for completed booking's Download/View) ────
    // ✅ NEW: fetches real booking data (mentee name, price, payment status,
    // completedAt) to build the receipt shown/downloaded from BookingsPage.
    static async getSessionReceipt(sessionId: string, bookingId?: string): Promise<ApiResponse> {
        try {
            const { data } = await api.get<ApiResponse>(
                `${config.NEXT_PUBLIC_SESSIONS_ENDPOINT || process.env.NEXT_PUBLIC_SESSIONS_ENDPOINT}/${sessionId}/receipt`,
                { params: bookingId ? { bookingId } : {} }
            );
            return data;
        } catch (error: any) {
            console.error("❌ [GET_SESSION_RECEIPT] Failed", error?.response?.data || error?.message);
            if (error?.response?.status === 404) throw new Error("Session not found.");
            if (error?.response?.status === 400) throw new Error(error?.response?.data?.message || "Receipt not available.");
            throw new Error(error?.response?.data?.message || "Failed to fetch receipt.");
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // GROUP SESSIONS — mentor Booking dashboard integration
    // ══════════════════════════════════════════════════════════════════

    // ── GET all group-session participants for the logged-in mentor ────
    // ✅ NEW: powers the "group sessions inside Booking dashboard" merge.
    // Backend already shapes each row like a 1:1 booking row
    // (bookingId, sessionId, menteeId, menteeName, menteeProfilePhoto,
    // serviceName, scheduledAt, status, isGroupSession: true) so
    // BookingsPage.tsx can flatten/merge it directly with 1:1 bookings.
    static async getMentorGroupSessionParticipants(): Promise<ApiResponse> {
        try {
            const { data } = await api.get<ApiResponse>(
                `${SessionService.GROUP_SESSIONS_ENDPOINT}/mentor/participants`
            );
            console.log("✅ [GET_MENTOR_GROUP_PARTICIPANTS] Fetched:", data);
            return data;
        } catch (error: any) {
            console.error("❌ [GET_MENTOR_GROUP_PARTICIPANTS] Failed", error?.response?.data || error?.message);
            throw new Error(error?.response?.data?.message || "Failed to fetch group session bookings.");
        }
    }

    // ── START a group session (mentor only) ─────────────────
    static async startGroupSession(sessionId: string): Promise<ApiResponse> {
        try {
            const { data } = await api.post<ApiResponse>(
                `${SessionService.GROUP_SESSIONS_ENDPOINT}/${sessionId}/start`
            );
            return data;
        } catch (error: any) {
            console.error("❌ [START_GROUP_SESSION] Failed", error?.response?.data || error?.message);
            throw new Error(error?.response?.data?.message || "Failed to start group session.");
        }
    }

    // ── COMPLETE a group session (mentor only) ──────────────
    static async completeGroupSession(
        sessionId: string,
        payload: { actualDuration?: number; attendees?: string[]; wasSuccessful?: boolean } = {}
    ): Promise<ApiResponse> {
        try {
            const { data } = await api.post<ApiResponse>(
                `${SessionService.GROUP_SESSIONS_ENDPOINT}/${sessionId}/complete`,
                payload
            );
            return data;
        } catch (error: any) {
            console.error("❌ [COMPLETE_GROUP_SESSION] Failed", error?.response?.data || error?.message);
            throw new Error(error?.response?.data?.message || "Failed to complete group session.");
        }
    }

    // ── CANCEL a group session (mentor only) ────────────────
    static async cancelGroupSession(sessionId: string, reason: string): Promise<ApiResponse> {
        try {
            const { data } = await api.post<ApiResponse>(
                `${SessionService.GROUP_SESSIONS_ENDPOINT}/${sessionId}/cancel`,
                { reason }
            );
            return data;
        } catch (error: any) {
            console.error("❌ [CANCEL_GROUP_SESSION] Failed", error?.response?.data || error?.message);
            throw new Error(error?.response?.data?.message || "Failed to cancel group session.");
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // GROUP SESSIONS — join-request flow (mentee side + mentor decisions)
    // ✅ NEW: these five were missing on the client entirely. The backend
    // (group.service.ts / group.controller.ts) already implements the
    // whole pending→accept/reject flow — BookingsPage.tsx was already
    // calling `getMentorGroupJoinRequests`, `acceptGroupJoinRequest`, and
    // `rejectGroupJoinRequest` on this class, so without these the mentor's
    // Pending tab actions were throwing "SessionService.xxx is not a
    // function" at runtime. `joinGroupSession` / `getMyGroupJoinRequestStatus`
    // are the mentee-side counterparts needed for the "Join Group" button.
    // ══════════════════════════════════════════════════════════════════

    // ── MENTEE: send a request to join a group session (PENDING) ───────
    // Maps to POST /group-sessions/:id/join (backend also aliases /request).
    // Does NOT confirm a seat — mentor must accept first.
    static async joinGroupSession(sessionId: string, transactionId?: string): Promise<ApiResponse> {
        try {
            const { data } = await api.post<ApiResponse>(
                `${SessionService.GROUP_SESSIONS_ENDPOINT}/${sessionId}/join`,
                transactionId ? { transactionId } : {}
            );
            return data;
        } catch (error: any) {
            console.error("❌ [JOIN_GROUP_SESSION] Failed", error?.response?.data || error?.message);
            if (error?.response?.status === 400) throw new Error(error.response.data?.message || "Unable to send join request.");
            if (error?.response?.status === 404) throw new Error("Session not found.");
            throw new Error(error?.response?.data?.message || "Failed to send join request.");
        }
    }

    // ── MENTEE: get my own join-request status for a session ───────────
    // Maps to GET /group-sessions/:id/request. Backend 404s when the
    // mentee has never requested to join — that's a normal "not requested
    // yet" state, not an error, so it resolves to null instead of throwing.
    static async getMyGroupJoinRequestStatus(sessionId: string): Promise<GroupJoinRequestStatus | null> {
        try {
            const { data } = await api.get<ApiResponse>(
                `${SessionService.GROUP_SESSIONS_ENDPOINT}/${sessionId}/request`
            );
            return data?.data ?? null;
        } catch (error: any) {
            if (error?.response?.status === 404) return null;
            console.error("❌ [GET_MY_GROUP_JOIN_REQUEST_STATUS] Failed", error?.response?.data || error?.message);
            throw new Error(error?.response?.data?.message || "Failed to fetch join request status.");
        }
    }

    // ── MENTOR: all PENDING join requests across my group sessions ─────
    // Maps to GET /group-sessions/mentor/join-requests. Powers the
    // Pending tab / Pending stat card in BookingsPage.tsx.
    static async getMentorGroupJoinRequests(): Promise<ApiResponse> {
        try {
            const { data } = await api.get<ApiResponse>(
                `${SessionService.GROUP_SESSIONS_ENDPOINT}/mentor/join-requests`
            );
            console.log("✅ [GET_MENTOR_GROUP_JOIN_REQUESTS] Fetched:", data);
            return data;
        } catch (error: any) {
            console.error("❌ [GET_MENTOR_GROUP_JOIN_REQUESTS] Failed", error?.response?.data || error?.message);
            throw new Error(error?.response?.data?.message || "Failed to fetch group join requests.");
        }
    }

    // ── MENTOR: accept a pending join request → mentee becomes participant ──
    // Maps to PATCH /group-sessions/:id/requests/:menteeId/accept.
    static async acceptGroupJoinRequest(sessionId: string, menteeId: string): Promise<ApiResponse> {
        try {
            const { data } = await api.patch<ApiResponse>(
                `${SessionService.GROUP_SESSIONS_ENDPOINT}/${sessionId}/requests/${menteeId}/accept`
            );
            return data;
        } catch (error: any) {
            console.error("❌ [ACCEPT_GROUP_JOIN_REQUEST] Failed", error?.response?.data || error?.message);
            throw new Error(error?.response?.data?.message || "Failed to accept join request.");
        }
    }

    // ── MENTOR: reject a pending join request ───────────────────────────
    // Maps to PATCH /group-sessions/:id/requests/:menteeId/reject.
    static async rejectGroupJoinRequest(sessionId: string, menteeId: string): Promise<ApiResponse> {
        try {
            const { data } = await api.patch<ApiResponse>(
                `${SessionService.GROUP_SESSIONS_ENDPOINT}/${sessionId}/requests/${menteeId}/reject`
            );
            return data;
        } catch (error: any) {
            console.error("❌ [REJECT_GROUP_JOIN_REQUEST] Failed", error?.response?.data || error?.message);
            throw new Error(error?.response?.data?.message || "Failed to reject join request.");
        }
    }
}

export default SessionService;