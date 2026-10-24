// src/lib/api/auth.service.ts

import axios from 'axios';
import TokenStorage from '@/lib/store/token.storage';
import config from '@/config/env.config';
import api from './api.intance';

// ==================== TYPES ====================

interface LoginCredentials {
    email: string;
    password: string;
    rememberMe?: boolean;
}

interface LoginResponse {
    status: string;
    statusCode: number;
    message: string;
    data: {
        user: {
            userId: string;
            email: string;
            role: string;
        };
        tokens?: {
            accessToken?: string;
            refreshToken?: string;
            expiresIn?: string | number;
        };
    };
    timestamp: string;
}

interface ApiError {
    status: string;
    statusCode: number;
    message: string;
    errors?: Array<{ field: string; message: string }>;
    fieldErrors?: Array<{ field: string; message: string }>;
}

interface RegistrationApiError extends Omit<ApiError, 'errors'> {
    errors?: string[];
}

export interface RegistrationFailure {
    message: string;
    statusCode?: number;
    fieldErrors?: Array<{ field: string; message: string }>;
    errors?: string[];
}

interface Mentor {
    id: string;
    name: string;
    role: string;
    company: string;
    expertise: string;
    rating: number;
    sessions: number;
    img: string;
    bio?: string;
    hourlyRate?: number;
    yearsExperience?: number;
    isAvailable?: boolean;
}

interface GetAllMentorsResponse {
    mentors: Mentor[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ==================== HELPERS ====================

/**
 * Login / register / Google ke baad session store karo.
 * Server body mein tokens bheje to token mode (localStorage + proactive refresh),
 * warna sirf user data (cookie mode).
 */
const persistSession = (payload: any): void => {
    const user = payload?.user;
    if (!user) return;

    const tokens = payload?.tokens;
    if (tokens?.accessToken && tokens?.refreshToken) {
        TokenStorage.setAuthData(
            {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                expiresIn: tokens.expiresIn ?? 900,
            },
            user
        );
    } else {
        TokenStorage.setAuthData(user);
    }
};

// ==================== AUTH SERVICE ====================

class AuthService {
    /**
     * Google ID token verify
     */
    static async googleVerify(idToken: string): Promise<any> {
        try {
            const { data } = await api.post('/auth/google/verify', { idToken });

            if (!data.data?.isNewUser && data.data?.user) {
                persistSession(data.data);
            }

            return data;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;
                if (apiError?.message) throw new Error(apiError.message);
            }
            throw new Error(error?.message || 'Google authentication failed');
        }
    }

    /**
     * Google registration
     */
    static async googleRegister(registrationData: any): Promise<any> {
        try {
            const { data } = await api.post('/auth/google/register', registrationData);

            if (data.data?.user) {
                persistSession(data.data);
            }

            return data;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;
                if (error.response?.status === 400) {
                    const errors = Array.isArray(apiError?.errors)
                        ? apiError.errors
                            .map((e: any) => (typeof e === 'string' ? e : e.message))
                            .filter(Boolean)
                            .join(', ')
                        : '';
                    if (errors) throw new Error(errors);
                }
                if (apiError?.message) throw new Error(apiError.message);
            }
            throw new Error(error?.message || 'Google registration failed');
        }
    }

    /**
     * Pre-registration email OTP bhejo
     */
    static async sendRegistrationOtp(payload: { email: string; firstName?: string }): Promise<any> {
        try {
            const body: { email: string; firstName?: string } = {
                email: payload.email.trim().toLowerCase(),
            };
            if (payload.firstName?.trim()) {
                body.firstName = payload.firstName.trim();
            }

            const endpoint =
                config.NEXT_PUBLIC_REGISTER_SEND_OTP_ENDPOINT ||
                process.env.NEXT_PUBLIC_REGISTER_SEND_OTP_ENDPOINT ||
                '/auth/register/send-otp';

            const { data } = await api.post(endpoint, body);
            return data;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                if (error.code === 'ERR_NETWORK') {
                    throw new Error('Unable to connect to server. Please check your internet connection.');
                }
                if (error.response?.status === 409) {
                    throw new Error('An account with this email already exists. Please log in.');
                }
                if (error.response?.status === 429) {
                    throw new Error('Too many OTP requests. Please wait 15 minutes.');
                }
                const apiError = error.response?.data as any;
                if (apiError?.message) {
                    if (apiError.message.toLowerCase().includes('email service not configured')) {
                        throw new Error('Email service is not configured on the server. Please configure SMTP / email provider credentials in your backend environment.');
                    }
                    throw new Error(apiError.message);
                }
            }
            throw new Error(error?.message || 'Failed to send verification code. Please try again.');
        }
    }

    /**
     * Pre-registration email OTP dobara bhejo
     */
    static async resendRegistrationOtp(payload: { email: string; firstName?: string }): Promise<any> {
        try {
            const body: { email: string; firstName?: string } = {
                email: payload.email.trim().toLowerCase(),
            };
            if (payload.firstName?.trim()) {
                body.firstName = payload.firstName.trim();
            }

            const endpoint =
                config.NEXT_PUBLIC_REGISTER_RESEND_OTP_ENDPOINT ||
                process.env.NEXT_PUBLIC_REGISTER_RESEND_OTP_ENDPOINT ||
                '/auth/register/resend-otp';

            const { data } = await api.post(endpoint, body);
            return data;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                if (error.code === 'ERR_NETWORK') {
                    throw new Error('Unable to connect to server. Please check your internet connection.');
                }
                if (error.response?.status === 429) {
                    throw new Error('Too many OTP requests. Please wait 15 minutes.');
                }
                const apiError = error.response?.data as any;
                if (apiError?.message) {
                    if (apiError.message.toLowerCase().includes('email service not configured')) {
                        throw new Error('Email service is not configured on the server. Please configure SMTP / email provider credentials in your backend environment.');
                    }
                    throw new Error(apiError.message);
                }
            }
            throw new Error(error?.message || 'Failed to resend verification code. Please try again.');
        }
    }

    /**
     * Pre-registration email OTP verify
     */
    static async verifyRegistrationOtp(payload: { email: string; otp: string }): Promise<any> {
        try {
            const endpoint =
                config.NEXT_PUBLIC_REGISTER_VERIFY_OTP_ENDPOINT ||
                process.env.NEXT_PUBLIC_REGISTER_VERIFY_OTP_ENDPOINT ||
                '/auth/register/verify-otp';

            const { data } = await api.post(endpoint, {
                email: payload.email.trim().toLowerCase(),
                otp: payload.otp.trim(),
            });

            return data;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                if (error.code === 'ERR_NETWORK') {
                    throw new Error('Unable to connect to server. Please check your internet connection.');
                }
                if (error.response?.status === 400) {
                    const msg = (error.response?.data as any)?.message;
                    throw new Error(msg || 'Invalid or expired OTP. Please try again.');
                }
                if (error.response?.status === 429) {
                    throw new Error('Too many attempts. Please wait a few minutes before trying again.');
                }
                const apiError = error.response?.data as any;
                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
            }
            throw new Error(error?.message || 'OTP verification failed. Please try again.');
        }
    }

    /**
     * Register. Fail hone par structured RegistrationFailure throw hota hai.
     */
    static async register(registrationData: any): Promise<any> {
        try {
            const { data } = await api.post(
                `${config.NEXT_PUBLIC_REGISTER_ENDPOINT || process.env.NEXT_PUBLIC_REGISTER_ENDPOINT || '/auth/register'}`,
                registrationData
            );

            persistSession(data.data);

            return data;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as RegistrationApiError;
                throw {
                    message:
                        apiError?.message ||
                        (error.code === 'ERR_NETWORK'
                            ? 'Unable to connect. Check your connection and retry.'
                            : 'Registration failed. Please retry.'),
                    statusCode: error.response?.status,
                    fieldErrors: apiError?.fieldErrors,
                    errors: apiError?.errors,
                } satisfies RegistrationFailure;
            }

            throw {
                message: 'An unexpected error occurred. Please retry.',
            } satisfies RegistrationFailure;
        }
    }

    static async checkRegistrationAvailability(
        field: 'email' | 'phone',
        value: string,
        signal: AbortSignal
    ): Promise<boolean> {
        const { data } = await api.post<{ available: boolean }>(
            '/auth/availability',
            { field, value },
            { signal }
        );
        return data.available;
    }

    /**
     * Login
     */
    static async login(credentials: LoginCredentials): Promise<LoginResponse> {
        try {
            const { data } = await api.post<LoginResponse>(
                `${config.NEXT_PUBLIC_LOGIN_ENDPOINT || process.env.NEXT_PUBLIC_LOGIN_ENDPOINT}`,
                credentials
            );

            persistSession(data.data);

            return data;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.code === 'ERR_NETWORK') {
                    throw new Error('Unable to connect to server. Please check your internet connection.');
                }
                if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                    throw new Error('Request timed out. Please try again.');
                }
                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
                if (error.response?.status === 429) {
                    throw new Error('Too many requests. Please wait a moment and try again.');
                }
                if (error.response?.status === 503) {
                    throw new Error('Service temporarily unavailable. Please try again later.');
                }
            }

            throw new Error('An unexpected error occurred. Please try again.');
        }
    }

    /**
     * Current user ka profile
     */
    static async getUserProfile(): Promise<any> {
        try {
            const { data } = await api.get(
                `${config.NEXT_PUBLIC_PROFILE_ENDPOINT || process.env.NEXT_PUBLIC_PROFILE_ENDPOINT}`
            );
            return data;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.code === 'ERR_NETWORK') {
                    throw new Error('Unable to connect to server. Please check your internet connection.');
                }
                if (error.response?.status === 401) {
                    throw new Error('Authentication required. Please login again.');
                }
                if (error.response?.status === 404) {
                    throw new Error('User profile not found.');
                }
                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
            }

            throw new Error('Failed to fetch user profile. Please try again.');
        }
    }

    /**
     * Kisi bhi user ka profile (userId se)
     */
    static async getUserProfileById(userId: string): Promise<any> {
        try {
            const endpoint = config.NEXT_PUBLIC_GET_USER_ENDPOINT || '/auth/get-user';
            const { data } = await api.get(`${endpoint}/${userId}`);
            return data;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.code === 'ERR_NETWORK') {
                    throw new Error('Unable to connect to server. Please check your internet connection.');
                }
                if (error.response?.status === 401) {
                    throw new Error('Authentication required. Please login again.');
                }
                if (error.response?.status === 404) {
                    throw new Error('User profile not found.');
                }
                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
            }

            throw new Error('Failed to fetch user profile. Please try again.');
        }
    }

    static async getUsersBulk(userIds: string[]): Promise<any> {
        try {
            const { data } = await api.post(
                `${config.NEXT_PUBLIC_GET_USERS_BULK_ENDPOINT || process.env.NEXT_PUBLIC_GET_USERS_BULK_ENDPOINT}`,
                { userIds }
            );
            return data;
        } catch {
            throw new Error('Failed to fetch users. Please try again.');
        }
    }

    /**
     * Saare users (search)
     */
    static async getAllUsers(params?: {
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<any> {
        try {
            const { data } = await api.get(
                `${config.NEXT_PUBLIC_USERS_ENDPOINT || process.env.NEXT_PUBLIC_USERS_ENDPOINT}`,
                { params }
            );
            return data;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.response?.status === 401) {
                    throw new Error('Authentication required. Please login again.');
                }
                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
            }

            throw new Error('Failed to fetch users. Please try again.');
        }
    }

    /**
     * Profile update
     */
    static async updateUserProfile(updates: {
        email?: string;
        password?: string;
        phoneNumber?: string;
        firstName?: string;
        lastName?: string;
        location?: string;
        currentPosition?: string;
        company?: string;
        education?: string;
        pronouns?: string;
        onboarding?: any;
        preferences?: any;
    }): Promise<any> {
        try {
            const { data } = await api.put(
                `${config.NEXT_PUBLIC_UPDATE_PROFILE_ENDPOINT || process.env.NEXT_PUBLIC_UPDATE_PROFILE_ENDPOINT}`,
                updates
            );
            return data;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.code === 'ERR_NETWORK') {
                    throw new Error('Unable to connect to server. Please check your internet connection.');
                }
                if (error.response?.status === 400) {
                    const errors = apiError?.errors?.map((e) => e.message).join(', ');
                    throw new Error(errors || apiError?.message || 'Validation failed');
                }
                if (error.response?.status === 401) {
                    throw new Error('Session expired. Please login again.');
                }
                if (apiError?.message) {
                    throw new Error(apiError.message);
                }
            }

            throw new Error('Failed to update profile. Please try again.');
        }
    }

    /**
     * Logout (sirf user ke Sign Out par)
     */
    static async logout(): Promise<void> {
        try {
            await api.post(
                `${config?.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL}${config?.NEXT_PUBLIC_LOGOUT_ENDPOINT || process.env.NEXT_PUBLIC_LOGOUT_ENDPOINT}`
            );
        } catch {
            // API fail ho tab bhi local cleanup hoga
        } finally {
            TokenStorage.clearAuthData('user_logout');

            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }
    }

    static isAuthenticated(): boolean {
        return TokenStorage.isAuthenticated();
    }

    static getCurrentUser() {
        return TokenStorage.getUserData();
    }

    static getAuthSummary() {
        return TokenStorage.getAuthSummary();
    }
}

export default AuthService;
export { api };
export type { LoginCredentials, LoginResponse, ApiError, GetAllMentorsResponse };