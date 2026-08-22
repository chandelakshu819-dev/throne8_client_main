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

    // ── GET ALL SESSIONS FROM DB ───────────────────────────────
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