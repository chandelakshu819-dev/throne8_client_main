// lib/api/auth.service.ts

import axios, { AxiosInstance, AxiosError } from 'axios';
import TokenStorage from '@/lib/store/token.storage';
import { CreateSessionInput, SessionFilters } from './session.service';
import config from '@/config/env.config';
import api from "./api.intance";
import { RegistrationData } from '@/features/auth/interface';

const API_BASE_URL = config.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

// ==================== TYPES ====================
interface UserProfileResponse {
    status: string;
    statusCode: number;
    message: string;
    data: {
        userId: string;
        email: string;
        username: string | null;
        role: string;
        status: string;
        emailVerified: boolean;
        phoneVerified: boolean;
        phone: string;
        twoFactorEnabled: boolean;
        preferences: {
            notifications: {
                email: boolean;
                push: boolean;
                sms: boolean;
            };
            language: string;
            timezone: string;
            theme: string;
        };
        metadata: {
            totalLogins: number;
            lastLoginAt: string;
            lastLoginIp: string;
            lastActiveAt: string;
        };
        createdAt: string;
        updatedAt: string;
    };
    timestamp: string;
}

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
        // Raw JWTs are no longer needed (httpOnly cookies carry the session) and the backend
        // may omit them — only the expiry metadata is guaranteed.
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

// SAHI (array hona chahiye + pagination)
interface Mentor {
    id: string;
    name: string;
    role: string;           // ya designation/companyRole
    company: string;
    expertise: string;      // ya string[]
    rating: number;
    sessions: number;
    img: string;
    // agar backend se aa raha hai to yeh bhi add kar
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

// (Note: Axios request & response interceptors are globally handled in api.intance.ts)

// ==================== AUTH SERVICE CLASS ====================
class AuthService {
    static post<T>(arg0: string, input: CreateSessionInput): { data: any; } | PromiseLike<{ data: any; }> {
        throw new Error("Method not implemented.");
    }
    static get<T>(arg0: string, p0: { params: SessionFilters; }): { data: any; } | PromiseLike<{ data: any; }> {
        throw new Error("Method not implemented.");
    }

    /**
     * 🔐 Google Native Token Verification API Call 
     */
    static async googleVerify(idToken: string): Promise<any> {
        try {
            console.log('🔐 [GOOGLE VERIFY] Verifying token with backend...');
            const { data } = await api.post('/auth/google/verify', { idToken });

            // 🍪 Backend already set the session cookies — remember the user for the UI
            if (!data.data?.isNewUser && data.data?.user) {
                TokenStorage.setAuthData(data.data.user);
            }

            console.log('✅ [GOOGLE VERIFY] Successful', {
                userId: data.data?.user?.userId,
                isNewUser: data.data?.isNewUser,
            });

            return data;
        } catch (error: any) {
            console.error('❌ [GOOGLE VERIFY] Failed:', error);
            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;
                if (apiError?.message) throw new Error(apiError.message);
            }
            throw new Error(error?.message || 'Google authentication failed');
        }
    }

    /**
     * 🔐 Google Native Register API Call
     */
    static async googleRegister(registrationData: any): Promise<any> {
        try {
            console.log('🔐 [GOOGLE REGISTER] Registering Google user with backend...', registrationData);
            const { data } = await api.post('/auth/google/register', registrationData);

            if (data.data?.user) {
                TokenStorage.setAuthData(data.data.user);
            }

            console.log('✅ [GOOGLE REGISTER] Successful', {
                userId: data.data?.user?.userId,
            });

            return data;
        } catch (error: any) {
            console.error('❌ [GOOGLE REGISTER] Failed:', error);
            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;
                if (error.response?.status === 400) {
                    const errors = Array.isArray(apiError?.errors)
                        ? apiError.errors.map((e: any) => typeof e === 'string' ? e : e.message).filter(Boolean).join(', ')
                        : '';
                    if (errors) throw new Error(errors);
                }
                if (apiError?.message) throw new Error(apiError.message);
            }
            throw new Error(error?.message || 'Google registration failed');
        }
    }


    /**
     * 📧 Send Pre-registration Email OTP
     * Endpoint: POST /api/v1/auth/register/send-otp
     * Body: { email: string, firstName?: string }
     */
    static async sendRegistrationOtp(payload: { email: string; firstName?: string }): Promise<any> {
        try {
            const normalizedEmail = payload.email.trim().toLowerCase();
            const body: { email: string; firstName?: string } = { email: normalizedEmail };
            if (payload.firstName?.trim()) {
                body.firstName = payload.firstName.trim();
            }

            console.log('📧 [SEND_REG_OTP] Sending pre-registration OTP to:', normalizedEmail);

            const endpoint =
                config.NEXT_PUBLIC_REGISTER_SEND_OTP_ENDPOINT ||
                process.env.NEXT_PUBLIC_REGISTER_SEND_OTP_ENDPOINT ||
                '/auth/register/send-otp';

            const { data } = await api.post(endpoint, body);
            console.log('✅ [SEND_REG_OTP] OTP sent successfully:', data);
            return data;
        } catch (error: any) {
            console.error('❌ [SEND_REG_OTP] Failed to send registration OTP:', error);
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
     * 🔄 Resend Pre-registration Email OTP
     * Endpoint: POST /api/v1/auth/register/resend-otp
     * Body: { email: string, firstName?: string }
     */
    static async resendRegistrationOtp(payload: { email: string; firstName?: string }): Promise<any> {
        try {
            const normalizedEmail = payload.email.trim().toLowerCase();
            const body: { email: string; firstName?: string } = { email: normalizedEmail };
            if (payload.firstName?.trim()) {
                body.firstName = payload.firstName.trim();
            }

            console.log('🔄 [RESEND_REG_OTP] Resending pre-registration OTP to:', normalizedEmail);

            const endpoint =
                config.NEXT_PUBLIC_REGISTER_RESEND_OTP_ENDPOINT ||
                process.env.NEXT_PUBLIC_REGISTER_RESEND_OTP_ENDPOINT ||
                '/auth/register/resend-otp';

            const { data } = await api.post(endpoint, body);
            console.log('✅ [RESEND_REG_OTP] OTP resent successfully:', data);
            return data;
        } catch (error: any) {
            console.error('❌ [RESEND_REG_OTP] Failed to resend registration OTP:', error);
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
     * ✅ Verify Pre-registration Email OTP
     * Endpoint: POST /api/v1/auth/register/verify-otp
     * Body: { email: string, otp: string }
     * Returns: { status: 'success', data: { email: string, verificationToken: string, expiresIn: number } }
     */
    static async verifyRegistrationOtp(payload: { email: string; otp: string }): Promise<any> {
        try {
            const normalizedEmail = payload.email.trim().toLowerCase();
            const normalizedOtp = payload.otp.trim();

            console.log('✅ [VERIFY_REG_OTP] Verifying pre-registration OTP for:', normalizedEmail);

            const endpoint =
                config.NEXT_PUBLIC_REGISTER_VERIFY_OTP_ENDPOINT ||
                process.env.NEXT_PUBLIC_REGISTER_VERIFY_OTP_ENDPOINT ||
                '/auth/register/verify-otp';

            const { data } = await api.post(endpoint, {
                email: normalizedEmail,
                otp: normalizedOtp,
            });

            console.log('✅ [VERIFY_REG_OTP] OTP verified successfully:', {
                status: data?.status,
                hasToken: Boolean(data?.data?.verificationToken || data?.verificationToken),
            });

            return data;
        } catch (error: any) {
            console.error('❌ [VERIFY_REG_OTP] Failed to verify registration OTP:', error);
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
     * 📝 Register API Call
     * Throws a structured RegistrationFailure ({ message, statusCode, fieldErrors, errors })
     * so the signup page can map server errors onto form fields.
    */
    static async register(registrationData: any): Promise<any> {
        try {
            console.log('📝 [REGISTER] Initiating registration...', { email: registrationData.email, userType: registrationData.userType });

            const { data } = await api.post(
                `${config.NEXT_PUBLIC_REGISTER_ENDPOINT || process.env.NEXT_PUBLIC_REGISTER_ENDPOINT || '/auth/register'}`,
                registrationData
            );

            console.log('✅ [REGISTER] Registration successful', {
                userId: data.data?.user?.userId,
                email: data.data?.user?.email,
            });

            // 🍪 Session cookies were set by the backend — remember the user for the UI
            TokenStorage.setAuthData(data.data.user);

            console.log('✅ [REGISTER] Session started');

            return data;

        } catch (error: any) {
            console.error('❌ [REGISTER] Registration failed:', {
                status: error?.response?.status,
                message: error?.message,
            });

            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as RegistrationApiError;
                throw {
                    message: apiError?.message ||
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
     * 🔐 Login API Call
     */
    static async login(credentials: LoginCredentials): Promise<LoginResponse> {
        try {
            console.log('🔐 [LOGIN] Initiating login request...', {
                email: credentials.email,
                rememberMe: credentials.rememberMe,
            });

            const { data } = await api.post<LoginResponse>(`${config.NEXT_PUBLIC_LOGIN_ENDPOINT || process.env.NEXT_PUBLIC_LOGIN_ENDPOINT}`, credentials);

            console.log('✅ [LOGIN] Welcome To Throne8', {
                userId: data.data?.user?.userId,
                email: data.data?.user?.email,
                role: data.data?.user?.role,
            });

            // 🍪 Session cookies were set by the backend — remember the user for the UI
            TokenStorage.setAuthData(data.data.user);

            console.log('✅ [LOGIN] Session started');

            return data;

        } catch (error: any) {
            console.error('❌ [LOGIN] Login failed', error);

            // Enhanced error handling
            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                // Check for specific error types
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
     * 👤 Get User Profile Data
    */
    static async getUserProfile(): Promise<any> {
        try {
            console.log('👤 [GET_PROFILE] Fetching user profile data...');

            const { data } = await api.get(`${config.NEXT_PUBLIC_PROFILE_ENDPOINT || process.env.NEXT_PUBLIC_PROFILE_ENDPOINT}`);

            console.log('✅ [GET_PROFILE] Profile fetched successfully', {
                userId: data.data?.userId,
                email: data.data?.email,
                role: data.data?.role,
            });

            return data;

        } catch (error: any) {
            console.error('❌ [GET_PROFILE] Failed to fetch profile', error);

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
     * 👤 Get User Profile Data
    */
    static async getUserProfileById(userId: string): Promise<any> {
        try {
            console.log('👤 [GET_PROFILE_BYiD] Fetching user profile data for userId:', userId);
            const endpoint = config.NEXT_PUBLIC_GET_USER_ENDPOINT || '/auth/get-user';
            const { data } = await api.get(`${endpoint}/${userId}`);
            console.log('✅ [GET_PROFILE_BYiD] Profile fetched successfully', data);
            return data;

        } catch (error: any) {
            console.error('❌ [GET_PROFILE] Failed to fetch profile', error);

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
            console.log('👥 [GET_USERS_BULK] Fetching users in bulk...', { count: userIds.length });
            const { data } = await api.post(
                `${config.NEXT_PUBLIC_GET_USERS_BULK_ENDPOINT || process.env.NEXT_PUBLIC_GET_USERS_BULK_ENDPOINT}`,
                { userIds }
            );
            console.log('✅ [GET_USERS_BULK] Users fetched successfully', {
                requested: userIds.length, found: data.data?.users?.length,
            });
            return data;
        } catch (error: any) {
            console.error('❌ [GET_USERS_BULK] Failed to fetch users', error);
            throw new Error('Failed to fetch users. Please try again.');
        }
    }
    /**
     * 👥 Get All Users (for search)
     */
    static async getAllUsers(params?: {
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<any> {
        try {
            console.log('👥 [GET_ALL_USERS] Fetching users...', params);

            const { data } = await api.get(`${config.NEXT_PUBLIC_USERS_ENDPOINT || process.env.NEXT_PUBLIC_USERS_ENDPOINT}`, { params });

            console.log('✅ [GET_ALL_USERS] Users fetched:', data.data.pagination.totalUsers, data.data.users);
            return data;

        } catch (error: any) {
            console.error('❌ [GET_ALL_USERS] Failed to fetch users', error);

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
    * 📝 Update User Profile
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
            console.log('📝 [UPDATE_PROFILE] Updating profile...', {
                fields: Object.keys(updates),
            });

            const { data } = await api.put(`${config.NEXT_PUBLIC_UPDATE_PROFILE_ENDPOINT || process.env.NEXT_PUBLIC_UPDATE_PROFILE_ENDPOINT}`, updates);

            console.log('✅ [UPDATE_PROFILE] Profile updated successfully', {
                userId: data.data?.userId,
                updatedFields: data.data?.updatedFields,
            });

            return data;

        } catch (error: any) {
            console.error('❌ [UPDATE_PROFILE] Update failed', error);

            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.code === 'ERR_NETWORK') {
                    throw new Error('Unable to connect to server. Please check your internet connection.');
                }

                if (error.response?.status === 400) {
                    const errors = apiError?.errors?.map(e => e.message).join(', ');
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
     * 🚪 Logout
     */
    static async logout(): Promise<void> {
        try {
            console.log('🚪 [LOGOUT] Calling logout API...');

            await api.post(`${config?.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL}${config?.NEXT_PUBLIC_LOGOUT_ENDPOINT || process.env.NEXT_PUBLIC_LOGOUT_ENDPOINT}`);

            console.log('✅ [LOGOUT] Logout API call successful and User logged out on server');

        } catch (error) {
            console.error('❌ [LOGOUT] Logout API error:', error);
            // Continue with local cleanup even if API fails
        } finally {
            // Backend clears the httpOnly cookies; clear the local user data + flag here
            TokenStorage.clearAuthData();
            console.log('✅ [LOGOUT] Local session data cleared');

            // Redirect to login page
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }
    }

    /**
     * ✅ Check if user is authenticated
     */
    static isAuthenticated(): boolean {
        return TokenStorage.isAuthenticated();
    }

    /**
     * 👤 Get current user data
     */
    static getCurrentUser() {
        return TokenStorage.getUserData();
    }

    /**
     * 📊 Get auth summary (for debugging)
     */
    static getAuthSummary() {
        return TokenStorage.getAuthSummary();
    }


}

export default AuthService;
export { api };
export type { LoginCredentials, LoginResponse, ApiError, GetAllMentorsResponse };