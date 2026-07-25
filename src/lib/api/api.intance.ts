// src/lib/api/api.instance.ts
import config from "@/config/env.config";
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import TokenStorage from "@/lib/store/token.storage";

// ✅ FIX (v2): Previous approach captured `axios.defaults.adapter` and called
// it directly as a function. In current axios versions this is NOT a plain
// function — it's an array (['xhr','http','fetch']) resolved internally via
// adapters.getAdapter(). Calling it directly threw:
//   "TypeError: defaultAdapter is not a function"
// ...which broke EVERY request including login.
//
// New approach: dedupe at the `api.get` method level instead of the adapter
// level. Same effect (identical in-flight GET requests share one promise),
// but doesn't touch axios internals at all — so it's safe across versions.

const api: AxiosInstance = axios.create({
    baseURL: config.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL,
    timeout: config.NEXT_PUBLIC_API_TIMEOUT || Number(process.env.NEXT_PUBLIC_API_TIMEOUT),
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true,
});

// ==================== GET REQUEST DEDUPLICATION ====================
// Same problem as before: multiple hooks (useConnectionsData, useAboutData,
// useEducation, etc.) firing identical GET requests when several components
// mount together (profile page, dashboard). We dedupe by wrapping `api.get`
// so identical concurrent calls (same url + params) share one network
// request/promise instead of firing duplicates.
//
// Only GET is wrapped — mutations (POST/PUT/PATCH/DELETE) always fire fresh.

const pendingGetRequests = new Map<string, Promise<any>>();

function buildRequestKey(url: string, requestConfig?: AxiosRequestConfig): string {
    const paramsKey = requestConfig?.params
        ? JSON.stringify(requestConfig.params)
        : '';
    return `GET:${url}:${paramsKey}`;
}

const originalGet = api.get.bind(api);

api.get = ((url: string, requestConfig?: AxiosRequestConfig) => {
    const key = buildRequestKey(url, requestConfig);

    const existing = pendingGetRequests.get(key);
    if (existing) {
        return existing;
    }

    const requestPromise = originalGet(url, requestConfig).finally(() => {
        pendingGetRequests.delete(key);
    });

    pendingGetRequests.set(key, requestPromise);
    return requestPromise;
}) as typeof api.get;

// ==================== REQUEST INTERCEPTOR ====================
api.interceptors.request.use(
    (config) => {
        const token = TokenStorage.getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ==================== RESPONSE INTERCEPTOR ====================
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve(token!);
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,

    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {

            if (isRefreshing) {
                return new Promise<string>((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                }).catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = TokenStorage.getRefreshToken();

            if (!refreshToken) {
                isRefreshing = false;
                TokenStorage.clearAuthData();
                window.location.href = '/login';
                return Promise.reject(error);
            }

            try {
                const baseURL = config.NEXT_PUBLIC_API_BASE_URL ||
                    process.env.NEXT_PUBLIC_API_BASE_URL;

                const refreshResponse = await axios.post(
                    `${baseURL}/auth/refresh-token`,
                    { refreshToken },
                    { headers: { 'Content-Type': 'application/json' } }
                );

                const { accessToken, refreshToken: newRefreshToken, expiresIn } =
                    refreshResponse.data.data.tokens;

                TokenStorage.updateAccessToken(accessToken, expiresIn);
                TokenStorage.updateRefreshToken(newRefreshToken);

                processQueue(null, accessToken);

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);

            } catch (refreshError) {
                processQueue(refreshError, null);
                TokenStorage.clearAuthData();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;