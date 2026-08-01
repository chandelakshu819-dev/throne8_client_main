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
        tokens: {
            accessToken: string;
            refreshToken: string;
            expiresIn: string;
        };
    };
    timestamp: string;
}

interface ApiError {
    status: string;
    statusCode: number;
    message: string;
    errors?: Array<{ field: string; message: string }>;
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

// ==================== REQUEST INTERCEPTOR ====================
// Automatically attach Bearer token to all requests
api.interceptors.request.use(
    (config) => {
        const accessToken = TokenStorage.getAccessToken();

        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
            console.log('🔑 [API] Access token attached to request');
        } else {
            console.log('ℹ️ [API] No access token available');
        }

        return config;
    },
    (error) => {
        console.error('❌ [API] Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// ==================== RESPONSE INTERCEPTOR ====================
// Handle token refresh automatically on 401 errors
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null, token: string | null = null) => {
    failedQueue.forEach(promise => {
        if (error) {
            promise.reject(error);
        } else {
            promise.resolve(token);
        }
    });

    failedQueue = [];
};

api.interceptors.response.use(
    (response) => {
        // Success response - just return it
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest: any = error.config;

        // Handle 401 Unauthorized - Token expired
        if (error.response?.status === 401 && !originalRequest._retry) {

            // If already refreshing, queue this request
            if (isRefreshing) {
                console.log('🔄 [API] Token refresh in progress, queuing request...');

                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(token => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch(err => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = TokenStorage.getRefreshToken();

            if (!refreshToken) {
                console.error('❌ [API] No refresh token available, redirecting to login');
                TokenStorage.clearAuthData();

                // Redirect to login
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }

                return Promise.reject(error);
            }

            try {
                console.log('🔄 [API] Attempting to refresh access token...');

                // Call refresh token endpoint
                const { data } = await axios.post(
                    `${API_BASE_URL}${config?.NEXT_PUBLIC_REFRESH_TOKEN_ENDPOINT || process.env.NEXT_PUBLIC_REFRESH_TOKEN_ENDPOINT}`,
                    { refreshToken }
                );

                const newAccessToken = data.data.tokens.accessToken;
                const newRefreshToken = data.data.tokens.refreshToken;
                const expiresIn = data.data.tokens.expiresIn;

                // Update tokens in storage
                TokenStorage.setAuthData(
                    {
                        accessToken: newAccessToken,
                        refreshToken: newRefreshToken,
                        expiresIn: expiresIn
                    },
                    data.data.user
                );

                // Update default header
                api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

                // Process queued requests
                processQueue(null, newAccessToken);

                console.log('✅ [API] Access token refreshed successfully');

                // Retry original request
                return api(originalRequest);

            } catch (refreshError) {
                console.error('❌ [API] Token refresh failed:', refreshError);

                // Clear auth data and redirect to login
                processQueue(refreshError, null);
                TokenStorage.clearAuthData();

                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }

                return Promise.reject(refreshError);

            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

// ==================== AUTH SERVICE CLASS ====================
class AuthService {
    static post<T>(arg0: string, input: CreateSessionInput): { data: any; } | PromiseLike<{ data: any; }> {
        throw new Error("Method not implemented.");
    }
    static get<T>(arg0: string, p0: { params: SessionFilters; }): { data: any; } | PromiseLike<{ data: any; }> {
        throw new Error("Method not implemented.");
    }
    /**
     * 📝 Register API Call
    */
    static async register(registrationData: any): Promise<any> {
        try {
            console.log('📝 [REGISTER] Initiating registration...', {
                email: registrationData.email,
                userType: registrationData.userType,
            });

            const { data } = await api.post(
                `${config.NEXT_PUBLIC_REGISTER_ENDPOINT || process.env.NEXT_PUBLIC_REGISTER_ENDPOINT}`,
                registrationData
            );

            console.log('✅ [REGISTER] Registration successful', {
                userId: data.data?.user?.userId,
                email: data.data?.user?.email,
            });

            // 💾 Store tokens (same as login)
            TokenStorage.setAuthData(
                data.data.tokens,
                data.data.user
            );

            console.log('✅ [REGISTER] Auth data stored in localStorage');

            return data;

        } catch (error: any) {
            console.error('❌ [REGISTER] Registration failed', error);

            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;

                if (error.code === 'ERR_NETWORK') {
                    throw new Error('Unable to connect to server. Please check your internet connection.');
                }

                if (apiError?.message) {
                    throw new Error(apiError.message);
                }

                if (error.response?.status === 409) {
                    throw new Error('User already exists with this email.');
                }

                if (error.response?.status === 400) {
                    const errors = apiError?.errors?.map(e => e.message).join(', ');
                    throw new Error(errors || 'Validation failed. Please check your inputs.');
                }
            }

            throw new Error('An unexpected error occurred. Please try again.');
        }
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

            // 💾 Store tokens and user data in localStorage
            TokenStorage.setAuthData(
                data.data.tokens,
                data.data.user
            );

            console.log('✅ [LOGIN] Auth data stored in localStorage');

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
            console.log('👤 [GET_PROFILE_BYiD] Fetching user profile data...');

            const { data } = await api.get(`${config.NEXT_PUBLIC_GET_USER_ENDPOINT || process.env.NEXT_PUBLIC_GET_USER_ENDPOINT}/${userId}`);

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
            // Clear all auth data from localStorage
            TokenStorage.clearAuthData();
            console.log('✅ [LOGOUT] Auth data cleared from localStorage');

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

////////////////////////////////
/////////////////////////////////////////
//Changed Modified code Pasted
/**
 * Ensures we have a valid access token before opening the socket.
 * Refreshes it if expired, using the same endpoint/logic as the axios interceptor.
 */

export const ensureFreshAccessToken = async (): Promise<string | null> => {
    if (!TokenStorage.isTokenExpired()) {
        return TokenStorage.getAccessToken();
    }

    const refreshToken = TokenStorage.getRefreshToken();
    if (!refreshToken) {
        console.warn('⚠️ [SOCKET AUTH] No refresh token available');
        return null;
    }

    try {
        console.log('🔄 [SOCKET AUTH] Access token expired, refreshing before connecting...');
        const { data } = await axios.post(
            `${API_BASE_URL}${config?.NEXT_PUBLIC_REFRESH_TOKEN_ENDPOINT || process.env.NEXT_PUBLIC_REFRESH_TOKEN_ENDPOINT}`,
            { refreshToken }
        );

        const newAccessToken = data.data.tokens.accessToken;
        TokenStorage.setAuthData(data.data.tokens, data.data.user);

        console.log('✅ [SOCKET AUTH] Token refreshed successfully');
        return newAccessToken;
    } catch (err) {
        console.error('❌ [SOCKET AUTH] Failed to refresh token:', err);
        return null;
    }
};









export default AuthService;
export { api };
export type { LoginCredentials, LoginResponse, ApiError, GetAllMentorsResponse };