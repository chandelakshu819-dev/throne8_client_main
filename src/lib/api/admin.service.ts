import axios from 'axios';
import api from "./api.intance";

export interface AdminPaginatedResponse<T = any> {
    status: string;
    message: string;
    data: T;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

interface AdminApiResponse<T = any> {
    status: string;
    message: string;
    data: T;
}

// Mounted as: /api/v1/mentorship + /admin (see routes/index.ts → '/mentorship' → Mentorship/routers/index.ts → '/admin' → admin.routes.ts)
const BASE = '/mentorship/admin';

class AdminService {

    static async getDashboardStats(): Promise<AdminApiResponse<any>> {
        try {
            const { data } = await api.get<AdminApiResponse<any>>(`${BASE}/dashboard`);
            return data;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data;
                if (error.response?.status === 403) throw new Error('Admin access required.');
                if (apiError?.message) throw new Error(apiError.message);
            }
            throw new Error('Failed to fetch dashboard stats.');
        }
    }

    static async getAllMentors(params: {
        page?: number;
        limit?: number;
        status?: string;
        search?: string;
    } = {}): Promise<AdminPaginatedResponse<any[]>> {
        try {
            const { data } = await api.get<AdminPaginatedResponse<any[]>>(`${BASE}/mentors`, { params });
            return data;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data;
                if (error.response?.status === 403) throw new Error('Admin access required.');
                if (apiError?.message) throw new Error(apiError.message);
            }
            throw new Error('Failed to fetch mentors.');
        }
    }

    static async getPendingMentors(params: {
        page?: number;
        limit?: number;
    } = {}): Promise<AdminPaginatedResponse<any[]>> {
        try {
            const { data } = await api.get<AdminPaginatedResponse<any[]>>(`${BASE}/mentors/pending`, { params });
            return data;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data;
                if (error.response?.status === 403) throw new Error('Admin access required.');
                if (apiError?.message) throw new Error(apiError.message);
            }
            throw new Error('Failed to fetch pending mentors.');
        }
    }

    // status: whatever the mentor status enum allows (e.g. 'active', 'suspended', 'rejected')
    static async updateMentorStatus(mentorId: string, status: string, reason?: string): Promise<AdminApiResponse<any>> {
        try {
            const { data } = await api.post<AdminApiResponse<any>>(`${BASE}/mentors/${mentorId}/status`, { status, reason });
            return data;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data;
                if (error.response?.status === 403) throw new Error('Admin access required.');
                if (apiError?.message) throw new Error(apiError.message);
            }
            throw new Error('Failed to update mentor status.');
        }
    }

    static async getAllSessions(params: {
        page?: number;
        limit?: number;
        status?: string;
        sessionType?: string;
    } = {}): Promise<AdminPaginatedResponse<any[]>> {
        try {
            const { data } = await api.get<AdminPaginatedResponse<any[]>>(`${BASE}/sessions`, { params });
            return data;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data;
                if (error.response?.status === 403) throw new Error('Admin access required.');
                if (apiError?.message) throw new Error(apiError.message);
            }
            throw new Error('Failed to fetch sessions.');
        }
    }

    static async getAllReviews(params: {
        page?: number;
        limit?: number;
        reported?: boolean;
        rating?: number;
    } = {}): Promise<AdminPaginatedResponse<any[]>> {
        try {
            const { data } = await api.get<AdminPaginatedResponse<any[]>>(`${BASE}/reviews`, { params });
            return data;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data;
                if (error.response?.status === 403) throw new Error('Admin access required.');
                if (apiError?.message) throw new Error(apiError.message);
            }
            throw new Error('Failed to fetch reviews.');
        }
    }

    static async getReportedReviews(params: {
        page?: number;
        limit?: number;
    } = {}): Promise<AdminPaginatedResponse<any[]>> {
        try {
            const { data } = await api.get<AdminPaginatedResponse<any[]>>(`${BASE}/reviews/reported`, { params });
            return data;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data;
                if (error.response?.status === 403) throw new Error('Admin access required.');
                if (apiError?.message) throw new Error(apiError.message);
            }
            throw new Error('Failed to fetch reported reviews.');
        }
    }

    static async moderateReview(reviewId: string, action: 'approve' | 'hide' | 'delete', reason?: string): Promise<AdminApiResponse<any>> {
        try {
            const { data } = await api.post<AdminApiResponse<any>>(`${BASE}/reviews/${reviewId}/moderate`, { action, reason });
            return data;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data;
                if (error.response?.status === 403) throw new Error('Admin access required.');
                if (apiError?.message) throw new Error(apiError.message);
            }
            throw new Error('Failed to moderate review.');
        }
    }

    static async getPaymentLogs(params: {
        page?: number;
        limit?: number;
        status?: string;
    } = {}): Promise<AdminPaginatedResponse<any[]>> {
        try {
            const { data } = await api.get<AdminPaginatedResponse<any[]>>(`${BASE}/payments`, { params });
            return data;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data;
                if (error.response?.status === 403) throw new Error('Admin access required.');
                if (apiError?.message) throw new Error(apiError.message);
            }
            throw new Error('Failed to fetch payment logs.');
        }
    }
}

export default AdminService;