// lib/api/availability.service.ts
import config from "@/config/env.config";
import api from "./api.intance";

interface AvailabilityResponse {
    status: string;
    statusCode: number;
    message: string;
    data: any;
    timestamp: string;
}

interface CreateAvailabilityInput {
    mentorId: string;
    date: string; // "YYYY-MM-DD"
    slots: Array<{ startTime: string; endTime: string }>;
    timezone: string;
    isRecurring?: boolean;
}

interface BulkCreateAvailabilityInput {
    mentorId: string;
    dateRange: { startDate: string; endDate: string };
    slotConfig: {
        startTime: string;
        endTime: string;
        slotDuration: number;
        bufferBetween?: number;
    };
    daysOfWeek?: string[];
    timezone: string;
}

class AvailabilityService {

    // ── SINGLE DATE CREATE ────────────────────────────────────
    static async createAvailability(input: CreateAvailabilityInput): Promise<AvailabilityResponse> {
        try {
            console.log("📅 [CREATE_AVAILABILITY] Creating availability...", {
                mentorId: input.mentorId,
                date: input.date,
                slotsCount: input.slots.length,
            });

            const { data } = await api.post<AvailabilityResponse>(
                `${config.NEXT_PUBLIC_AVAILABILITY_CREATE_ENDPOINT || process.env.NEXT_PUBLIC_AVAILABILITY_CREATE_ENDPOINT}`,
                input
            );

            console.log("✅ [CREATE_AVAILABILITY] Created successfully", {
                availabilityId: data.data?.availabilityId,
            });

            return data;
        } catch (error: any) {
            console.error("❌ [CREATE_AVAILABILITY] Failed", {
                error: error?.response?.data || error?.message,
                status: error?.response?.status,
            });

            if (error?.response?.data?.message) throw new Error(error.response.data.message);
            if (error?.response?.status === 409) throw new Error("Availability already exists for this date.");
            if (error?.response?.status === 400) throw new Error("Invalid data. Please check slot timings.");
            if (error?.response?.status === 404) throw new Error("Mentor not found.");
            if (error?.code === "ERR_NETWORK") throw new Error("Unable to connect to server.");

            throw new Error("Failed to create availability. Please try again.");
        }
    }

    // ── BULK CREATE ───────────────────────────────────────────
    static async bulkCreateAvailability(input: BulkCreateAvailabilityInput): Promise<AvailabilityResponse> {
        try {
            console.log("📦 [BULK_AVAILABILITY] Bulk creating availability...", {
                mentorId: input.mentorId,
                dateRange: input.dateRange,
                daysOfWeek: input.daysOfWeek,
                slotDuration: input.slotConfig.slotDuration,
            });

            const { data } = await api.post<AvailabilityResponse>(
                `${config.NEXT_PUBLIC_AVAILABILITY_BULK_ENDPOINT || process.env.NEXT_PUBLIC_AVAILABILITY_BULK_ENDPOINT}`,
                input
            );

            console.log("✅ [BULK_AVAILABILITY] Bulk create complete", {
                created: data.data?.created,
                failed: data.data?.failed,
            });

            return data;
        } catch (error: any) {
            console.error("❌ [BULK_AVAILABILITY] Failed", {
                error: error?.response?.data || error?.message,
                status: error?.response?.status,
            });

            if (error?.response?.data?.message) throw new Error(error.response.data.message);
            if (error?.response?.status === 400) throw new Error("Invalid date range or slot configuration.");
            if (error?.response?.status === 404) throw new Error("Mentor not found.");
            if (error?.code === "ERR_NETWORK") throw new Error("Unable to connect to server.");

            throw new Error("Failed to bulk create availability. Please try again.");
        }
    }

    static async getAllAvailabilityFromDB(filters: { page?: number; limit?: number } = {}): Promise<AvailabilityResponse> {
        try {
            const { data } = await api.get<AvailabilityResponse>(
                `${config.NEXT_PUBLIC_AVAILABILITY_GET_ALL_DB_ENDPOINT || process.env.NEXT_PUBLIC_AVAILABILITY_GET_ALL_DB_ENDPOINT}`,
                { params: filters }
            );
            console.log("✅ [GET_ALL_AVAILABILITY_DB] Fetched:", data, "records");
            return data;
        } catch (error: any) {
            throw new Error(error?.response?.data?.message || "Failed to fetch availability.");
        }
    }

    // ── GET MENTOR AVAILABILITY ───────────────────────────────
    static async getMentorAvailability(
        mentorId: string,
        filters?: { startDate?: string; endDate?: string; status?: 'available' | 'booked' | 'blocked' }
    ): Promise<AvailabilityResponse> {
        try {
            console.log("📋 [GET_AVAILABILITY] Fetching mentor availability...", { mentorId, filters });

            const { data } = await api.get<AvailabilityResponse>(
                `${config.NEXT_PUBLIC_AVAILABILITY_MENTOR_ENDPOINT || process.env.NEXT_PUBLIC_AVAILABILITY_MENTOR_ENDPOINT}/${mentorId}`,
                { params: filters }
            );

            console.log("✅ [GET_AVAILABILITY] Fetched", data, { count: data.data?.count });
            return data;
        } catch (error: any) {
            console.error("❌ [GET_AVAILABILITY] Failed", error?.response?.data || error?.message);
            if (error?.response?.status === 404) throw new Error("Mentor not found.");
            if (error?.response?.data?.message) throw new Error(error.response.data.message);
            if (error?.code === "ERR_NETWORK") throw new Error("Unable to connect to server.");
            throw new Error("Failed to fetch availability.");
        }
    }

    // ── GET AVAILABILITY STATS ────────────────────────────────
    static async getAvailabilityStats(mentorId: string): Promise<AvailabilityResponse> {
        try {
            console.log("📊 [AVAILABILITY_STATS] Fetching stats...", { mentorId });

            const { data } = await api.get<AvailabilityResponse>(
                `${config.NEXT_PUBLIC_AVAILABILITY_STATS_ENDPOINT || process.env.NEXT_PUBLIC_AVAILABILITY_STATS_ENDPOINT}/${mentorId}`
            );

            console.log("✅ [AVAILABILITY_STATS] Stats fetched", data.data);
            return data;
        } catch (error: any) {
            console.error("❌ [AVAILABILITY_STATS] Failed", error?.response?.data || error?.message);
            if (error?.response?.data?.message) throw new Error(error.response.data.message);
            if (error?.code === "ERR_NETWORK") throw new Error("Unable to connect to server.");
            throw new Error("Failed to fetch availability stats.");
        }
    }

    // ── UPDATE AVAILABILITY ───────────────────────────────────
    static async updateAvailability(
        availabilityId: string,
        updates: { slots?: Array<{ startTime: string; endTime: string }>; timezone?: string }
    ): Promise<AvailabilityResponse> {
        try {
            console.log("✏️ [UPDATE_AVAILABILITY] Updating...", { availabilityId });

            const { data } = await api.patch<AvailabilityResponse>(
                `${config.NEXT_PUBLIC_AVAILABILITY_UPDATE_ENDPOINT || process.env.NEXT_PUBLIC_AVAILABILITY_UPDATE_ENDPOINT}/${availabilityId}`,
                updates
            );

            console.log("✅ [UPDATE_AVAILABILITY] Updated successfully");
            return data;
        } catch (error: any) {
            console.error("❌ [UPDATE_AVAILABILITY] Failed", error?.response?.data || error?.message);
            if (error?.response?.status === 404) throw new Error("Availability not found.");
            if (error?.response?.data?.message) throw new Error(error.response.data.message);
            throw new Error("Failed to update availability.");
        }
    }

    // ── BLOCK DATE ─────────────────────────────────────────────
    static async blockDate(availabilityId: string, reason?: string): Promise<AvailabilityResponse> {
        try {
            console.log("🚫 [BLOCK_DATE] Blocking...", { availabilityId, reason });

            const { data } = await api.patch<AvailabilityResponse>(
                `${config.NEXT_PUBLIC_AVAILABILITY_BLOCK_ENDPOINT || process.env.NEXT_PUBLIC_AVAILABILITY_BLOCK_ENDPOINT}/${availabilityId}`,
                { reason }
            );

            console.log("✅ [BLOCK_DATE] Blocked successfully");
            return data;
        } catch (error: any) {
            console.error("❌ [BLOCK_DATE] Failed", error?.response?.data || error?.message);
            if (error?.response?.status === 404) throw new Error("Availability not found.");
            if (error?.response?.data?.message) throw new Error(error.response.data.message);
            throw new Error("Failed to block date.");
        }
    }

    // ── UNBLOCK DATE ───────────────────────────────────────────
    static async unblockDate(availabilityId: string): Promise<AvailabilityResponse> {
        try {
            console.log("✅ [UNBLOCK_DATE] Unblocking...", { availabilityId });

            const { data } = await api.patch<AvailabilityResponse>(
                `${config.NEXT_PUBLIC_AVAILABILITY_UNBLOCK_ENDPOINT || process.env.NEXT_PUBLIC_AVAILABILITY_UNBLOCK_ENDPOINT}/${availabilityId}`,
                {}
            );

            console.log("✅ [UNBLOCK_DATE] Unblocked successfully");
            return data;
        } catch (error: any) {
            console.error("❌ [UNBLOCK_DATE] Failed", error?.response?.data || error?.message);
            if (error?.response?.status === 404) throw new Error("Availability not found.");
            if (error?.response?.data?.message) throw new Error(error.response.data.message);
            throw new Error("Failed to unblock date.");
        }
    }

        // ── BLOCK DATE (direct, no existing record required) ──────
        static async blockDateByDate(mentorId: string, date: string, reason?: string, timezone?: string): Promise<AvailabilityResponse> {
            try {
                console.log("🚫 [BLOCK_DATE_BY_DATE] Blocking date...", { mentorId, date, reason });
                const { data } = await api.post<AvailabilityResponse>(
                    `/mentorship/availability/block-date`,
                    { mentorId, date, reason, timezone }
                );
                console.log("✅ [BLOCK_DATE_BY_DATE] Blocked successfully");
                return data;
            } catch (error: any) {
                console.error("❌ [BLOCK_DATE_BY_DATE] Failed", error?.response?.data || error?.message);
                if (error?.response?.data?.message) throw new Error(error.response.data.message);
                throw new Error("Failed to block date.");
            }
        }
    
        // ── UNBLOCK DATE (direct, by mentorId + date) ──────────────
        static async unblockDateByDate(mentorId: string, date: string): Promise<AvailabilityResponse> {
            try {
                console.log("✅ [UNBLOCK_DATE_BY_DATE] Unblocking date...", { mentorId, date });
                const { data } = await api.post<AvailabilityResponse>(
                    `/mentorship/availability/unblock-date`,
                    { mentorId, date }
                );
                console.log("✅ [UNBLOCK_DATE_BY_DATE] Unblocked successfully");
                return data;
            } catch (error: any) {
                console.error("❌ [UNBLOCK_DATE_BY_DATE] Failed", error?.response?.data || error?.message);
                if (error?.response?.data?.message) throw new Error(error.response.data.message);
                throw new Error("Failed to unblock date.");
            }
        }
    
        // ── DELETE AVAILABILITY ───────────────────────────────────
        static async deleteAvailability(availabilityId: string): Promise<AvailabilityResponse> {
        try {
            console.log("🗑️ [DELETE_AVAILABILITY] Deleting...", { availabilityId });

            const { data } = await api.delete<AvailabilityResponse>(
                `${config.NEXT_PUBLIC_AVAILABILITY_DELETE_ENDPOINT || process.env.NEXT_PUBLIC_AVAILABILITY_DELETE_ENDPOINT}/${availabilityId}`
            );

            console.log("✅ [DELETE_AVAILABILITY] Deleted successfully");
            return data;
        } catch (error: any) {
            console.error("❌ [DELETE_AVAILABILITY] Failed", error?.response?.data || error?.message);
            if (error?.response?.status === 400) throw new Error("Cannot delete: booked slots exist.");
            if (error?.response?.status === 404) throw new Error("Availability not found.");
            if (error?.response?.data?.message) throw new Error(error.response.data.message);
            throw new Error("Failed to delete availability.");
        }
    }
}

export default AvailabilityService;