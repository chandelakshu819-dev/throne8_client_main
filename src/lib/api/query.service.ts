import axios from 'axios';
import api from "./api.intance";

export interface QueryPricing {
    amount: number;
    currency?: string;
    transactionId?: string;
    paidAt?: string;
}

export interface SubmitQueryInput {
    mentorId: string;
    question: string;
    context?: string;
    attachments?: string[];
    category?: string;
    priority?: 'normal' | 'high';
    pricing: QueryPricing;
}

export interface QueryItem {
    queryId: string;
    mentorId: string;
    menteeId: string;
    question: string;
    context?: string;
    answer?: string;
    answeredAt?: string;
    status: 'pending' | 'answered' | 'expired';
    priority: 'normal' | 'high';
    category?: string;
    pricing: QueryPricing;
    followUp?: {
        question: string;
        answer?: string;
        askedAt: string;
        answeredAt?: string;
    };
    feedback?: {
        rating: number;
        comment?: string;
        submittedAt: string;
    };
    createdAt: string;
    mentor?: {
        firstName?: string;
        lastName?: string;
        profilePhotoId?: string | null;
    };
}

interface ApiResponse<T = any> {
    status: string;
    message: string;
    data: T;
}

interface PaginatedResponse<T = any> extends ApiResponse<T> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// ✅ FIX: every call below was missing the `/mentorship` prefix that the
// backend's Mentorship module routes are actually mounted under
// (see routes/index.ts — router.use('/queries', queryRoutes) is itself
// nested inside the Mentorship router). That's why POST /api/v1/queries/submit
// was 404ing — the real path is /api/v1/mentorship/queries/submit.
const BASE = '/mentorship/queries';

class QueryService {

    static async submitQuery(payload: SubmitQueryInput): Promise<ApiResponse<QueryItem>> {
        try {
            const { data } = await api.post<ApiResponse<QueryItem>>(`${BASE}/submit`, payload);
            return data;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data;
                if (error.response?.status === 400) {
                    const errors = apiError?.errors?.map((e: any) => e.message).join(', ');
                    throw new Error(errors || apiError?.message || 'Invalid query data.');
                }
                if (error.response?.status === 401) throw new Error('Session expired. Please login again.');
                if (apiError?.message) throw new Error(apiError.message);
            }
            throw new Error('Failed to submit query. Please try again.');
        }
    }

    static async getAllQueries(params: {
        page?: number;
        limit?: number;
        status?: string;
        role?: 'mentor' | 'mentee';
    } = {}): Promise<PaginatedResponse<QueryItem[]>> {
        try {
            const { data } = await api.get<PaginatedResponse<QueryItem[]>>(`${BASE}`, { params });
            return data;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data;
                if (error.response?.status === 401) throw new Error('Session expired. Please login again.');
                if (apiError?.message) throw new Error(apiError.message);
            }
            throw new Error('Failed to fetch queries. Please try again.');
        }
    }

    static async getQueryById(id: string): Promise<ApiResponse<QueryItem>> {
        try {
            const { data } = await api.get<ApiResponse<QueryItem>>(`${BASE}/${id}`);
            return data;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data;
                if (apiError?.message) throw new Error(apiError.message);
            }
            throw new Error('Failed to fetch query. Please try again.');
        }
    }

    static async getPendingQueries(): Promise<ApiResponse<QueryItem[]>> {
        try {
            const { data } = await api.get<ApiResponse<QueryItem[]>>(`${BASE}/pending`);
            return data;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data;
                if (apiError?.message) throw new Error(apiError.message);
            }
            throw new Error('Failed to fetch pending queries.');
        }
    }

    static async answerQuery(id: string, answer: string): Promise<ApiResponse<QueryItem>> {
        try {
            const { data } = await api.post<ApiResponse<QueryItem>>(`${BASE}/${id}/answer`, { answer });
            return data;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data;
                if (apiError?.message) throw new Error(apiError.message);
            }
            throw new Error('Failed to answer query.');
        }
    }

    static async submitFollowUp(id: string, question: string): Promise<ApiResponse<QueryItem>> {
        try {
            const { data } = await api.post<ApiResponse<QueryItem>>(`${BASE}/${id}/follow-up`, { question });
            return data;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data;
                if (error.response?.status === 400) throw new Error(apiError?.message || 'Follow-up already submitted or query not answered yet.');
                if (apiError?.message) throw new Error(apiError.message);
            }
            throw new Error('Failed to submit follow-up.');
        }
    }

    static async answerFollowUp(id: string, answer: string): Promise<ApiResponse<QueryItem>> {
        try {
            const { data } = await api.post<ApiResponse<QueryItem>>(`${BASE}/${id}/follow-up/answer`, { answer });
            return data;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data;
                if (apiError?.message) throw new Error(apiError.message);
            }
            throw new Error('Failed to answer follow-up.');
        }
    }

    static async addFeedback(id: string, rating: number, comment?: string): Promise<ApiResponse<QueryItem>> {
        try {
            const { data } = await api.post<ApiResponse<QueryItem>>(`${BASE}/${id}/feedback`, { rating, comment });
            return data;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data;
                if (error.response?.status === 400) throw new Error(apiError?.message || 'Feedback already submitted.');
                if (apiError?.message) throw new Error(apiError.message);
            }
            throw new Error('Failed to submit feedback.');
        }
    }

    static async getQueryStats(role: 'mentor' | 'mentee' = 'mentee'): Promise<ApiResponse<any>> {
        try {
            const { data } = await api.get<ApiResponse<any>>(`${BASE}/stats`, { params: { role } });
            return data;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data;
                if (apiError?.message) throw new Error(apiError.message);
            }
            throw new Error('Failed to fetch query stats.');
        }
    }
}

export default QueryService;