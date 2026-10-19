// src/lib/api/api.intance.ts
import config from "@/config/env.config";
import axios, {
    AxiosError,
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

// Refresh call in statuses par retry hoti hai (logout nahi hota)
const RETRYABLE_REFRESH_STATUSES = [409, 429, 500, 502, 503, 504];
const REFRESH_MAX_ATTEMPTS = 3;

// Response side: in par 401 ka matlab "credentials / OTP galat" hai,
// isliye refresh + retry nahi hota.
const NO_RETRY_PATHS = [
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

type RetriableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

interface ApiErrorBody {
    message?: string;
}

interface RefreshResponse {
    data?: {
        tokens?: {
            accessToken?: string;
            refreshToken?: string;
            expiresIn?: string | number;
        };
    };
}

const matchesAny = (url: string | undefined, paths: string[]): boolean =>
    !!url && paths.some((p) => url.includes(p));

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout:
        config.NEXT_PUBLIC_API_TIMEOUT ||
        Number(process.env.NEXT_PUBLIC_API_TIMEOUT) ||
        30000,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
    withCredentials: true,
});

// ==================== GET REQUEST DEDUPLICATION ====================
// Same url + params wali concurrent GET requests ek hi promise share karti hain.

const pendingGetRequests = new Map<string, Promise<unknown>>();

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

// ==================== LOGOUT ====================

let loggingOut = false;

const forceLogout = (reason: string) => {
    if (loggingOut) return;
    loggingOut = true;

    TokenStorage.clearAuthData(reason);

    if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/login")
    ) {
        window.location.href = "/login";
    } else {
        loggingOut = false;
    }
};

// ==================== TOKEN REFRESH (single shared call) ====================

let refreshPromise: Promise<string> | null = null;

/**
 * Refresh endpoint call. 409 / 429 / 5xx / network error par retry hota hai
 * (response kho gaya ho to retry server ke grace window mein aati hai).
 */
const callRefreshEndpoint = async (refreshToken: string) => {
    let lastError: unknown;

    for (let attempt = 1; attempt <= REFRESH_MAX_ATTEMPTS; attempt++) {
        try {
            return await axios.post<RefreshResponse>(
                `${API_BASE_URL}${REFRESH_PATH}`,
                { refreshToken },
                {
                    headers: { "Content-Type": "application/json" },
                    timeout: 15000,
                }
            );
        } catch (err: unknown) {
            lastError = err;

            const status = axios.isAxiosError(err)
                ? err.response?.status
                : undefined;
            const retryable =
                status === undefined || RETRYABLE_REFRESH_STATUSES.includes(status);

            if (!retryable || attempt === REFRESH_MAX_ATTEMPTS) {
                throw err;
            }

            await sleep(400 * attempt * attempt);
        }
    }

    throw lastError;
};

/**
 * Asli refresh call. Lock ke andar chalta hai, to doosre tab ne agar abhi
 * refresh kar liya hai to uska naya token reuse hota hai (warna same refresh
 * token do baar use hoga aur backend "reuse" samajh ke session kill kar sakta hai).
 */
const performRefresh = async (failedToken: string | null): Promise<string> => {
    const current = TokenStorage.getAccessToken();
    if (
        current &&
        !TokenStorage.isTokenExpired() &&
        (!failedToken || current !== failedToken)
    ) {
        return current;
    }

    const refreshToken = TokenStorage.getRefreshToken();
    if (!refreshToken) {
        throw new Error("NO_REFRESH_TOKEN");
    }

    const response = await callRefreshEndpoint(refreshToken);

    const tokens = response.data?.data?.tokens;
    if (!tokens?.accessToken) {
        throw new Error("INVALID_REFRESH_RESPONSE");
    }

    TokenStorage.updateAccessToken(tokens.accessToken, tokens.expiresIn ?? 900);
    if (tokens.refreshToken) {
        TokenStorage.updateRefreshToken(tokens.refreshToken);
    }

    return tokens.accessToken;
};

const refreshAccessToken = (failedToken: string | null): Promise<string> => {
    if (refreshPromise) return refreshPromise;

    const run = () => performRefresh(failedToken);
    const pending: Promise<string> =
        typeof navigator !== "undefined" && navigator.locks
            ? (navigator.locks.request(REFRESH_LOCK_NAME, run) as Promise<string>)
            : run();

    refreshPromise = pending.finally(() => {
        refreshPromise = null;
    });

    return refreshPromise;
};

/**
 * Sirf tab logout jab server ne refresh token definitely reject kiya ho
 * (400 / 401) ya refresh token hai hi nahi.
 * Network error, timeout, 403, 409, 429 ya 5xx par user ko logout NAHI karte.
 */
const handleRefreshFailure = (refreshError: unknown) => {
    if (axios.isAxiosError(refreshError)) {
        const status = refreshError.response?.status;
        if (status === 400 || status === 401) {
            const body = refreshError.response?.data as ApiErrorBody | undefined;
            forceLogout(
                `refresh_rejected status=${status} message=${body?.message ?? "n/a"}`
            );
        }
        return;
    }

    if (
        refreshError instanceof Error &&
        refreshError.message === "NO_REFRESH_TOKEN"
    ) {
        forceLogout("no_refresh_token");
    }
};

// ==================== REQUEST INTERCEPTOR ====================

api.interceptors.request.use(
    async (reqConfig) => {
        // Access token gayab ya expire ho aur refresh token ho, to request
        // bhejne se pehle hi naya token le lo (401 ka wait nahi).
        if (
            !matchesAny(reqConfig.url, AUTH_FREE_PATHS) &&
            TokenStorage.getRefreshToken() &&
            (!TokenStorage.getAccessToken() || TokenStorage.isTokenExpired())
        ) {
            try {
                await refreshAccessToken(null);
            } catch (refreshError: unknown) {
                handleRefreshFailure(refreshError);
            }
        }

        const token = TokenStorage.getAccessToken();
        if (token) {
            reqConfig.headers.Authorization = `Bearer ${token}`;
        }
        return reqConfig;
    },
    (error) => Promise.reject(error)
);

// ==================== RESPONSE INTERCEPTOR ====================

api.interceptors.response.use(
    (response) => response,

    async (error: AxiosError) => {
        const originalRequest = error.config as RetriableRequest | undefined;

        if (
            !originalRequest ||
            error.response?.status !== 401 ||
            originalRequest._retry
        ) {
            return Promise.reject(error);
        }

        if (matchesAny(originalRequest.url, NO_RETRY_PATHS)) {
            return Promise.reject(error);
        }

        const failedHeader = originalRequest.headers?.Authorization;
        const failedToken = failedHeader
            ? String(failedHeader).replace(/^Bearer\s+/i, "")
            : null;

        // Refresh token hi nahi hai: session recover nahi ho sakta
        if (!TokenStorage.getRefreshToken()) {
            if (failedToken) forceLogout("no_refresh_token_on_401");
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            const newToken = await refreshAccessToken(failedToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
        } catch (refreshError: unknown) {
            handleRefreshFailure(refreshError);
            // Original error wapas do, taaki caller ko asli request ka 401 dikhe
            return Promise.reject(error);
        }
    }
);

/**
 * Socket jaise non-axios callers ke liye: valid access token do,
 * zarurat ho to usi shared refresh se (alag raw refresh kabhi mat karo).
 */
export const getFreshAccessToken = async (): Promise<string | null> => {
    if (!TokenStorage.getRefreshToken()) {
        return TokenStorage.getAccessToken();
    }
    if (TokenStorage.getAccessToken() && !TokenStorage.isTokenExpired()) {
        return TokenStorage.getAccessToken();
    }
    try {
        return await refreshAccessToken(null);
    } catch (refreshError: unknown) {
        handleRefreshFailure(refreshError);
        return null;
    }
};

/**
 * Forced refresh (socket.client.ts jaise callers ke liye, jab server ne token reject kiya).
 * Same shared single-flight + lock use karta hai. Naya access token ya null return karta hai.
 */
export const refreshSession = async (): Promise<string | null> => {
    if (!TokenStorage.getRefreshToken()) {
        return TokenStorage.getAccessToken();
    }
    try {
        // failedToken = current token, taaki performRefresh "abhi bhi valid hai" samajh ke skip na kare
        return await refreshAccessToken(TokenStorage.getAccessToken());
    } catch (refreshError: unknown) {
        handleRefreshFailure(refreshError);
        return null;
    }
};

export default api;