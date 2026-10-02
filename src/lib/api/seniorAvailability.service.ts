import api from "./api.intance";

interface SeniorAvailabilityResponse {
    status: string;
    statusCode: number;
    message: string;
    data: any;
}

interface SeniorTimeRange {
  startTime: string;
  endTime: string;
}

interface SeniorDaySchedule {
  day: string;
  enabled: boolean;
  timeRanges: SeniorTimeRange[];
}

interface SeniorDateOverride {
  date: string;
  enabled: boolean;
  timeRanges: SeniorTimeRange[];
}

interface SeniorBlockedTime {
  _id?: string;
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
}

export interface SeniorAvailabilityConfig {
  timezone: string;
  weeklySchedule: SeniorDaySchedule[];
  slotInterval: number;
  breakDuration: number;
  dateOverrides?: SeniorDateOverride[];
  blockedTimes?: SeniorBlockedTime[];
}

class SeniorAvailabilityService {

    // ── GET CONFIGURATION ──────────────────────────────────────
    static async getConfig(): Promise<SeniorAvailabilityConfig | null> {
        try {
            console.log("📋 [SENIOR_AVAILABILITY] Fetching config...");
            const { data } = await api.get<SeniorAvailabilityResponse>('/mentorship/senior-availability/config');
            return data.data;
        } catch (error: any) {
            if (error?.response?.status === 404) return null;
            throw new Error(error?.response?.data?.message || "Failed to fetch senior availability config.");
        }
    }

    // ── UPDATE CONFIGURATION ───────────────────────────────────
    static async updateConfig(updates: Partial<SeniorAvailabilityConfig>): Promise<SeniorAvailabilityResponse> {
        try {
            console.log("✏️ [SENIOR_AVAILABILITY] Updating config...", updates);
            const { data } = await api.put<SeniorAvailabilityResponse>('/mentorship/senior-availability/config', updates);
            return data;
        } catch (error: any) {
            throw new Error(error?.response?.data?.message || "Failed to update senior availability config.");
        }
    }

    // ── GET AVAILABLE SLOTS ───────────────────────────────────
    static async getAvailableSlots(mentorId: string, date: string, duration: number = 60): Promise<Array<{startTime: string, endTime: string}>> {
        try {
            console.log("🕰️ [SENIOR_AVAILABILITY] Fetching dynamic slots...", { mentorId, date, duration });
            const { data } = await api.get<SeniorAvailabilityResponse>(
                `/mentorship/senior-availability/slots?mentorId=${mentorId}&date=${date}&duration=${duration}`
            );
            return data.data || [];
        } catch (error: any) {
            throw new Error(error?.response?.data?.message || "Failed to fetch available slots.");
        }
    }

    // ── ADD BLOCKED TIME ───────────────────────────────────────
    static async addBlockedTime(date: string, startTime: string, endTime: string, reason?: string): Promise<SeniorAvailabilityResponse> {
        try {
            console.log("🚫 [SENIOR_AVAILABILITY] Adding blocked time...", { date, startTime, endTime });
            const { data } = await api.post<SeniorAvailabilityResponse>(
                '/mentorship/senior-availability/blocked', 
                { date, startTime, endTime, reason }
            );
            return data;
        } catch (error: any) {
            throw new Error(error?.response?.data?.message || "Failed to add blocked time.");
        }
    }

    // ── REMOVE BLOCKED TIME ────────────────────────────────────
    static async removeBlockedTime(blockedTimeId: string): Promise<SeniorAvailabilityResponse> {
        try {
            console.log("✅ [SENIOR_AVAILABILITY] Removing blocked time...", { blockedTimeId });
            const { data } = await api.delete<SeniorAvailabilityResponse>(
                `/mentorship/senior-availability/blocked/${blockedTimeId}`
            );
            return data;
        } catch (error: any) {
            throw new Error(error?.response?.data?.message || "Failed to remove blocked time.");
        }
    }
}

export default SeniorAvailabilityService;
