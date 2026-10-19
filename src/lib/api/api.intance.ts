// src/lib/api/api.instance.ts
import config from "@/config/env.config";
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import TokenStorage from "@/lib/store/token.storage";

const API_BASE_URL =
  config.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

// Backend route se match hona chahiye (auth.routes.ts)
const REFRESH_PATH = "/auth/refresh-token";
const REFRESH_LOCK_NAME = "throne8_token_refresh";

// Shared between tabs: if another tab refreshed a moment ago, the browser's cookie jar
// already holds the fresh cookies, so this tab must NOT refresh again (replaying a rotated
// refresh token makes the backend treat it as token theft).
const LAST_REFRESH_KEY = "throne8_last_refresh";
const RECENT_REFRESH_MS = 10_000;

// CSRF protection: the backend only honours auth cookies on POST/PUT/PATCH/DELETE
// when this header is present (a cross-site page cannot add it).
const CSRF_HEADERS = { "X-Requested-With": "XMLHttpRequest" };

// In endpoints par 401 ka matlab "credentials galat" hai, "token expire" nahi.
// Inke liye refresh ya redirect nahi hona chahiye.
const NO_REFRESH_PATHS = [
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/auth/forgot",
    "/auth/reset",
    "/auth/verify",
    "/auth/otp",
    "/verify",
    "/verify/email",
];

// Request side: sirf ye endpoints bina token ke chalte hain.
const AUTH_FREE_PATHS = [
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/auth/forgot",
    "/auth/reset",
];

const matchesAny = (url: string | undefined, paths: string[]): boolean =>
    !!url && paths.some((p) => url.includes(p));

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout:
    config.NEXT_PUBLIC_API_TIMEOUT ||
    Number(process.env.NEXT_PUBLIC_API_TIMEOUT),
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...CSRF_HEADERS,
  },
  // 🍪 auth lives in httpOnly cookies — the browser must send/accept them
  withCredentials: true,
});

// ==================== GET REQUEST DEDUPLICATION ====================
// Same url + params wali concurrent GET requests ek hi promise share karti hain.

const pendingGetRequests = new Map<string, Promise<any>>();

function buildRequestKey(
  url: string,
  requestConfig?: AxiosRequestConfig
): string {
  const paramsKey = requestConfig?.params
    ? JSON.stringify(requestConfig.params)
    : "";
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
    (reqConfig) => {
        const token = TokenStorage.getAccessToken();
        if (token) {
            reqConfig.headers.Authorization = `Bearer ${token}`;
        }
        return reqConfig;
    },
    (error) => Promise.reject(error)
);

// ==================== RESPONSE INTERCEPTOR ====================

type QueueItem = {
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
};

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve(token as string);
    });
    failedQueue = [];
};

const isNoRefreshRequest = (url?: string): boolean =>
    !!url && NO_REFRESH_PATHS.some((p) => url.includes(p));

const forceLogout = () => {
    TokenStorage.clearAuthData();
    if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/login")
    ) {
        window.location.href = "/login";
    }
};

// ==================== TOKEN REFRESH (single shared call) ====================

let refreshPromise: Promise<string> | null = null;

/**
 * Actual refresh call. Lock ke andar chalta hai, to dusre tab ne agar
 * pehle hi refresh kar liya hai to uska naya token reuse hota hai
 * (warna same refresh token do baar use hoga aur backend usse "reuse" samjhega).
 */
const performRefresh = async (failedToken: string | null): Promise<string> => {
    const current = TokenStorage.getAccessToken();
    if (
        current &&
        failedToken &&
        current !== failedToken &&
        !TokenStorage.isTokenExpired()
    ) {
        return current;
    }

    const refreshToken = TokenStorage.getRefreshToken();
    if (!refreshToken) {
        throw new Error("NO_REFRESH_TOKEN");
    }

    const response = await axios.post(
        `${API_BASE_URL}${REFRESH_PATH}`,
        { refreshToken },
        { headers: { "Content-Type": "application/json" } }
    );

    const {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn,
    } = response.data.data.tokens;

    TokenStorage.updateAccessToken(accessToken, expiresIn);
    TokenStorage.updateRefreshToken(newRefreshToken);

    return accessToken;
};

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config as
      (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

        // Login/register/refresh jaise endpoints, ya wo request jisme token tha hi nahi:
        // refresh ya redirect nahi, seedha error caller ko do.
        const hadAuthHeader = !!originalRequest.headers?.Authorization;
        if (!hadAuthHeader || isNoRefreshRequest(originalRequest.url)) {
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise<string>((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const failedToken = String(originalRequest.headers.Authorization).replace(
            /^Bearer\s+/i,
            ""
        );

        try {
            const newToken =
                typeof navigator !== "undefined" && navigator.locks
                    ? await navigator.locks.request(REFRESH_LOCK_NAME, () =>
                        performRefresh(failedToken)
                    )
                    : await performRefresh(failedToken);

            processQueue(null, newToken);

            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
        } catch (refreshError: any) {
            processQueue(refreshError, null);

            // Sirf tab logout jab refresh token definitively invalid ho.
            // Network error ya 5xx par user ko logout mat karo.
            const status = axios.isAxiosError(refreshError)
                ? refreshError.response?.status
                : undefined;
            const definitelyInvalid =
                refreshError?.message === "NO_REFRESH_TOKEN" ||
                status === 400 ||
                status === 401 ||
                status === 403;

            if (definitelyInvalid) {
                forceLogout();
            }

            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api;
