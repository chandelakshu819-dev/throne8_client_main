import api from "./api.intance";

class SeniorSessionService {
    /**
     * Create a new Senior Mentor 1-to-1 or Group service.
     * Expects a FormData object containing the session details.
     * If an image is selected, it should be appended to the 'thumbnailImage' field.
     */
    static async createSession(formData: FormData): Promise<any> {
        try {
            console.log("📅 [CREATE_SENIOR_SESSION] Creating...");
            
            const { data } = await api.post(
                '/mentorship/senior-sessions',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    transformRequest: [(data) => data]
                }
            );
            
            console.log("✅ [CREATE_SENIOR_SESSION] Created successfully");
            return data;
        } catch (error: any) {
            console.error("❌ [CREATE_SENIOR_SESSION] Failed", error?.response?.data || error?.message);
            if (error?.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error("Failed to create senior mentor service. Please try again.");
        }
    }

    /**
     * Get all sessions owned by the authenticated Senior Mentor
     */
    static async getMySessions(): Promise<any[]> {
        try {
            console.log("📅 [GET_MY_SESSIONS] Fetching...");
            const { data } = await api.get('/mentorship/senior-sessions/my');
            return data.data || [];
        } catch (error: any) {
            console.error("❌ [GET_MY_SESSIONS] Failed", error);
            throw new Error(error?.response?.data?.message || "Failed to fetch senior sessions.");
        }
    }

    /**
     * Get all active 1-to-1 senior sessions for discovery
     */
    static async getAllDiscoverySessions(): Promise<any> {
        try {
            console.log("📋 [GET_DISCOVERY_SESSIONS] Fetching...");
            const { data } = await api.get('/mentorship/senior-sessions');
            return data;
        } catch (error: any) {
            console.error("❌ [GET_DISCOVERY_SESSIONS] Failed", error);
            throw new Error(error?.response?.data?.message || "Failed to fetch senior sessions.");
        }
    }

    /**
     * Get a specific senior session by ID
     */
    static async getSessionById(sessionId: string): Promise<any> {
        try {
            const { data } = await api.get(`/mentorship/senior-sessions/${sessionId}`);
            return data;
        } catch (error: any) {
            console.error("❌ [GET_SESSION_BY_ID] Failed", error);
            throw new Error(error?.response?.data?.message || "Failed to fetch senior session.");
        }
    }

    /**
     * Book a senior session
     */
    static async bookSession(sessionId: string, payload: any): Promise<any> {
        try {
            console.log(`📅 [BOOK_SENIOR_SESSION] Booking ${sessionId}...`);
            const { data } = await api.post(`/mentorship/senior-sessions/${sessionId}/book`, payload);
            console.log("✅ [BOOK_SENIOR_SESSION] Booked successfully");
            return data;
        } catch (error: any) {
            console.error("❌ [BOOK_SENIOR_SESSION] Failed", error?.response?.data || error?.message);
            throw new Error(error?.response?.data?.message || "Failed to book senior mentor session. Please try again.");
        }
    }

    /**
     * Update an existing Senior Mentor session.
     * Expects a FormData object so the thumbnail can be optionally updated.
     */
    static async updateSession(sessionId: string, formData: FormData): Promise<any> {
        try {
            console.log(`📅 [UPDATE_SENIOR_SESSION] Updating ${sessionId}...`);
            
            const { data } = await api.put(
                `/mentorship/senior-sessions/${sessionId}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    transformRequest: [(data) => data]
                }
            );
            
            console.log("✅ [UPDATE_SENIOR_SESSION] Updated successfully");
            return data;
        } catch (error: any) {
            console.error("❌ [UPDATE_SENIOR_SESSION] Failed", error?.response?.data || error?.message);
            if (error?.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error("Failed to update senior mentor service. Please try again.");
        }
    }

    /**
     * Delete an existing Senior Mentor session.
     */
    static async deleteSession(sessionId: string): Promise<any> {
        try {
            console.log(`📅 [DELETE_SENIOR_SESSION] Deleting ${sessionId}...`);
            const { data } = await api.delete(`/mentorship/senior-sessions/${sessionId}`);
            console.log("✅ [DELETE_SENIOR_SESSION] Deleted successfully");
            return data;
        } catch (error: any) {
            console.error("❌ [DELETE_SENIOR_SESSION] Failed", error?.response?.data || error?.message);
            if (error?.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error("Failed to delete senior mentor service. Please try again.");
        }
    }
}

export default SeniorSessionService;
