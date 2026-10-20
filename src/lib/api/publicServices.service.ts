import api from "./api.intance";

interface ApiResponse {
    status?: string;
    success?: boolean;
    message: string;
    data: any;
}

class PublicServicesService {
    // Marketplace listing of 1-to-1 services (any logged-in user).
    // Backend: GET /mentorship/sessions/public
    static async getPublicServices(
        params: { page?: number; limit?: number } = {}
    ): Promise<ApiResponse> {
        try {
            const { data } = await api.get<ApiResponse>(
                "/mentorship/sessions/public",
                { params }
            );
            return data;
        } catch (error: any) {
            console.error(
                "[GET_PUBLIC_SERVICES] Failed",
                error?.response?.status,
                error?.response?.data || error?.message
            );
            throw new Error(error?.response?.data?.message || "Failed to fetch services.");
        }
    }
}

export default PublicServicesService;