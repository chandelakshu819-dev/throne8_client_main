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

            return data;
        } catch (error: any) {
            console.error("[CREATE_SESSION] Failed", error?.response?.data || error?.message);
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
            return data;
        } catch (error: any) {
            console.error("[GET_MENTOR_SESSIONS] Failed", error?.response?.data || error?.message);
            throw new Error(error?.response?.data?.message || "Failed to fetch mentor sessions.");
        }
    }

    // ── GET MENTOR ANALYTICS ───────────────────────────────
    static async getMentorAnalytics(mentorId: string): Promise<AnalyticsResponse> {
        try {
            const { data } = await api.get<AnalyticsResponse>(
                `/mentorship/analytics/mentor/${mentorId}/stats`
            );
            return data;
        } catch (error: any) {
            console.error("[GET_MENTOR_ANALYTICS] Failed", error?.response?.data || error?.message);
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
            console.error("[BOOK_SESSION] Failed", error?.response?.data || error?.message);
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
            return data;
        } catch (error: any) {
            console.error("[GET_ALL_SESSIONS_DB] Failed", error?.response?.data || error?.message);
            throw new Error(error?.response?.data?.message || "Failed to fetch all sessions.");
        }
    }

    // ── GET UPCOMING SESSIONS (mentor/user-scoped, real mentee data) ───
    // Backend derives the user from the auth token — no userId param
    // needed here, just role.
    static async getUpcomingSessions(params: { role?: "mentor" | "mentee"; limit?: number } = {}): Promise<ApiResponse> {
        try {
            const endpoint = config.NEXT_PUBLIC_SESSIONS_UPCOMING_ENDPOINT
                || `${config.NEXT_PUBLIC_SESSIONS_ENDPOINT || process.env.NEXT_PUBLIC_SESSIONS_ENDPOINT}/upcoming`;

            const { data } = await api.get<ApiResponse>(endpoint, { params });
            return data;
        } catch (error: any) {
            console.error("[GET_UPCOMING_SESSIONS] Failed", error?.response?.data || error?.message);
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
            return data;
        } catch (error: any) {
            console.error("[GET_PAST_SESSIONS] Failed", error?.response?.data || error?.message);
            if (error?.response?.status === 401) throw new Error("Please login again.");
            if (error?.code === "ERR_NETWORK") throw new Error("Unable to connect to server.");
            throw new Error(error?.response?.data?.message || "Failed to fetch past sessions.");
        }
    }

    // ── GET SESSION BY ID ──────────────────────────────────
    static async getSessionById(sessionId: string): Promise<ApiResponse> {
        try {
            const { data } = await api.get<ApiResponse>(
                `${config.NEXT_PUBLIC_SESSIONS_ENDPOINT || process.env.NEXT_PUBLIC_SESSIONS_ENDPOINT}/${sessionId}`
            );
            return data;
        } catch (error: any) {
            console.error("[GET_SESSION] Failed", error?.response?.data || error?.message);
            if (error?.response?.status === 404) throw new Error("Session not found.");
            if (error?.response?.status === 403) throw new Error("Not authorized to view this session.");
            if (error?.code === "ERR_NETWORK") throw new Error("Unable to connect to server.");
            throw new Error(error?.response?.data?.message || "Failed to fetch session.");
        }
    }

    // ── JOIN SESSION ───────────────────────────────────────
    // Validates the session against backend data and returns session info with real room URL
    static async joinSession(sessionId: string, _bookingId?: string): Promise<{ session: any; roomUrl: string }> {
        try {
            const res = await SessionService.getSessionById(sessionId);
            const session = res?.data ?? res;
            const roomUrl = `/mentorship/session-room/${encodeURIComponent(sessionId)}`;
            return { session, roomUrl };
        } catch (error: any) {
            console.error("[JOIN_SESSION] Failed", error?.response?.data || error?.message);
            throw error;
        }
    }

    // ── GET ALL SESSIONS ───────────────────────────────────
    static async getAllSessions(filters: SessionFilters = {}): Promise<ApiResponse> {
        try {
            const endpoint = config.NEXT_PUBLIC_SESSIONS_GET_ALL_ENDPOINT
                || `${config.NEXT_PUBLIC_SESSIONS_ENDPOINT || process.env.NEXT_PUBLIC_SESSIONS_ENDPOINT}/get-all`;

            const { data } = await api.get<ApiResponse>(endpoint, { params: filters });
            return data;
        } catch (error: any) {
            console.error("[GET_ALL_SESSIONS] Failed", error?.response?.data || error?.message);
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
            console.error("[DELETE_SESSION] Failed", error?.response?.data || error?.message);
            throw new Error(error?.response?.data?.message || "Failed to delete session.");
        }
    }

    static async updateSession(sessionId: string, payload: Record<string, any>): Promise<ApiResponse> {
        try {
            // Always send multipart/form-data (even without a new image).
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
            console.error("[UPDATE_SESSION] Failed", error?.response?.data || error?.message);
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
    // Fetches real booking data (mentee name, price, payment status,
    // completedAt) to build the receipt shown/downloaded from BookingsPage.
    static async getSessionReceipt(sessionId: string, bookingId?: string): Promise<ApiResponse> {
        try {
            const { data } = await api.get<ApiResponse>(
                `${config.NEXT_PUBLIC_SESSIONS_ENDPOINT || process.env.NEXT_PUBLIC_SESSIONS_ENDPOINT}/${sessionId}/receipt`,
                { params: bookingId ? { bookingId } : {} }
            );
            return data;
        } catch (error: any) {
            console.error("[GET_SESSION_RECEIPT] Failed", error?.response?.data || error?.message);
            if (error?.response?.status === 404) throw new Error("Session not found.");
            if (error?.response?.status === 400) throw new Error(error?.response?.data?.message || "Receipt not available.");
            throw new Error(error?.response?.data?.message || "Failed to fetch receipt.");
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // GROUP SESSIONS — mentor Booking dashboard integration
    // ══════════════════════════════════════════════════════════════════

    // ── GET all group-session participants for the logged-in mentor ────
    // Backend already shapes each row like a 1:1 booking row
    // (bookingId, sessionId, menteeId, menteeName, menteeProfilePhoto,
    // serviceName, scheduledAt, status, isGroupSession: true) so
    // BookingsPage.tsx can flatten/merge it directly with 1:1 bookings.
    static async getMentorGroupSessionParticipants(): Promise<ApiResponse> {
        try {
            const { data } = await api.get<ApiResponse>(
                `${SessionService.GROUP_SESSIONS_ENDPOINT}/mentor/participants`
            );
            return data;
        } catch (error: any) {
            console.error("[GET_MENTOR_GROUP_PARTICIPANTS] Failed", error?.response?.data || error?.message);
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
            console.error("[START_GROUP_SESSION] Failed", error?.response?.data || error?.message);
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
            console.error("[COMPLETE_GROUP_SESSION] Failed", error?.response?.data || error?.message);
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
            console.error("[CANCEL_GROUP_SESSION] Failed", error?.response?.data || error?.message);
            throw new Error(error?.response?.data?.message || "Failed to cancel group session.");
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // GROUP SESSIONS — join-request flow (mentee side + mentor decisions)
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
            console.error("[JOIN_GROUP_SESSION] Failed", error?.response?.data || error?.message);
            if (error?.response?.status === 400) throw new Error(error.response.data?.message || "Unable to send join request.");
            if (error?.response?.status === 404) throw new Error("Session not found.");
            throw new Error(error?.response?.data?.message || "Failed to send join request.");
        }
    }

    // ── Get the logged-in user's own group sessions (mentor OR mentee) ──
    // Maps to GET /group-sessions/my-sessions?role=mentee. For a mentee this
    // returns full GroupSession docs they've requested/joined — used by
    // UserDashboardMyBookingsPage.tsx to merge group sessions into the
    // combined bookings view alongside 1:1 sessions.
    static async getMyGroupSessions(role: "mentor" | "mentee" = "mentee"): Promise<ApiResponse> {
        try {
            const { data } = await api.get<ApiResponse>(
                `${SessionService.GROUP_SESSIONS_ENDPOINT}/my-sessions`,
                { params: { role } }
            );
            return data;
        } catch (error: any) {
            console.error("[GET_MY_GROUP_SESSIONS] Failed", error?.response?.data || error?.message);
            throw new Error(error?.response?.data?.message || "Failed to fetch your group sessions.");
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
            console.error("[GET_MY_GROUP_JOIN_REQUEST_STATUS] Failed", error?.response?.data || error?.message);
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
            return data;
        } catch (error: any) {
            console.error("[GET_MENTOR_GROUP_JOIN_REQUESTS] Failed", error?.response?.data || error?.message);
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
            console.error("[ACCEPT_GROUP_JOIN_REQUEST] Failed", error?.response?.data || error?.message);
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
            console.error("[REJECT_GROUP_JOIN_REQUEST] Failed", error?.response?.data || error?.message);
            throw new Error(error?.response?.data?.message || "Failed to reject join request.");
        }
    }
}

export default SessionService;