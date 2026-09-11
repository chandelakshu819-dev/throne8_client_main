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

class SessionService {

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

            const { data } = await api.get<ApiResponse>(
                `${config.NEXT_PUBLIC_SESSIONS_GET_ALL_ENDPOINT || process.env.NEXT_PUBLIC_SESSIONS_GET_ALL_ENDPOINT}`,
                { params: filters }
            );

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

    static async startSession(sessionId: string): Promise<ApiResponse> {
        try {
            const { data } = await api.post<ApiResponse>(
                `${config.NEXT_PUBLIC_SESSIONS_ENDPOINT || process.env.NEXT_PUBLIC_SESSIONS_ENDPOINT}/${sessionId}/start`
            );
            return data;
        } catch (error: any) {
            throw new Error(error?.response?.data?.message || "Failed to start session.");
        }
    }

    static async completeSession(sessionId: string, payload: { actualDuration?: number, wasSuccessful?: boolean, followUpRequired?: boolean, followUpNotes?: string }): Promise<ApiResponse> {
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
}

export default SessionService;