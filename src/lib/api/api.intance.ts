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

// Backend cookieAuth.middleware.ts: POST/PUT/PATCH/DELETE par cookies tabhi
// maani jaati hain jab ye header ho (CSRF protection).
const CSRF_HEADER_NAME = "X-Requested-With";
const CSRF_HEADER_VALUE = "XMLHttpRequest";

// Backend route se match hona chahiye (auth.routes.ts)
const REFRESH_PATH = "/auth/refresh-token";
const REFRESH_LOCK_NAME = "throne8_token_refresh";

// Refresh call in statuses par retry hoti hai. 429 JAAN-BOOJH KE NAHI hai:
// rate limiter ko retry se aur peeche mat dhakelo.
const RETRYABLE_REFRESH_STATUSES = [409, 500, 502, 503, 504];
const REFRESH_MAX_ATTEMPTS = 2;

// Refresh storm protection
const REFRESH_COOLDOWN_MS = 60_000; // 429 / circuit breaker
const REFRESH_SOFT_COOLDOWN_MS = 15_000; // network / 5xx / invalid response
const REFRESH_WINDOW_MS = 60_000;
const MAX_REFRESHES_PER_WINDOW = 4;

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

class RefreshCooldownError extends Error {
    constructor() {
        super("REFRESH_COOLDOWN");
        this.name = "RefreshCooldownError";
    }
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
        [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE,
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

    // Debug: console me dikhega ki logout kisne trigger kiya
    console.warn(`[api] forceLogout triggered: ${reason}`);

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

// ==================== REFRESH STORM PROTECTION ====================

let refreshBlockedUntil = 0;
let recentRefreshStarts: number[] = [];

const blockRefresh = (ms: number) => {
    refreshBlockedUntil = Math.max(refreshBlockedUntil, Date.now() + ms);
};

const onRefreshError = (err: unknown) => {
    if (axios.isAxiosError(err)) {
        const status = err.response?.status;

        if (status === 429) {
            const retryAfterSec = Number(err.response?.headers?.["retry-after"]);
            const retryAfterMs = Number.isFinite(retryAfterSec)
                ? retryAfterSec * 1000
                : 0;
            blockRefresh(Math.max(REFRESH_COOLDOWN_MS, retryAfterMs));
            return;
        }

        // 400 / 401: chhota cooldown, taaki refresh baar-baar na chale
        if (status === 400 || status === 401) {
            blockRefresh(5_000);
            return;
        }
    }

    // Network error, 5xx, invalid response
    blockRefresh(REFRESH_SOFT_COOLDOWN_MS);
};

// ==================== TOKEN REFRESH (single shared call) ====================

let refreshPromise: Promise<string | null> | null = null;

/**
 * Refresh endpoint call. 409 / 5xx / network error par chhota retry hota hai.
 * 429 par retry NAHI hota.
 *
 * Token mode  : refreshToken body me jata hai.
 * Cookie mode : refreshToken null hota hai; httpOnly refresh cookie
 *               withCredentials se khud jaati hai.
 */
const callRefreshEndpoint = async (refreshToken: string | null) => {
    let lastError: unknown;

    for (let attempt = 1; attempt <= REFRESH_MAX_ATTEMPTS; attempt++) {
        try {
            return await axios.post<RefreshResponse>(
                `${API_BASE_URL}${REFRESH_PATH}`,
                refreshToken ? { refreshToken } : {},
                {
                    headers: {
                        "Content-Type": "application/json",
                        [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE,
                    },
                    withCredentials: true,
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

            await sleep(500 * attempt);
        }
    }

    throw lastError;
};

/**
 * Asli refresh call (lock ke andar).
 * Return: naya access token (token mode) ya null (cookie mode).
 */
const performRefresh = async (
    failedToken: string | null
): Promise<string | null> => {
    const current = TokenStorage.getAccessToken();
    if (
        current &&
        !TokenStorage.isTokenExpired() &&
        (!failedToken || current !== failedToken)
    ) {
        return current;
    }

    const refreshToken = TokenStorage.getRefreshToken();
    const response = await callRefreshEndpoint(refreshToken);

    // Cookie mode: server naye httpOnly cookies set kar deta hai.
    if (!refreshToken) {
        return null;
    }

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

const refreshAccessToken = (
    failedToken: string | null
): Promise<string | null> => {
    if (refreshPromise) return refreshPromise;

    const now = Date.now();

    // Cooldown active: server ko dobara mat chhedo
    if (now < refreshBlockedUntil) {
        return Promise.reject(new RefreshCooldownError());
    }

    // Circuit breaker: refresh "successful" ho raha ho par session phir bhi na bane
    recentRefreshStarts = recentRefreshStarts.filter(
        (t) => now - t < REFRESH_WINDOW_MS
    );
    if (recentRefreshStarts.length >= MAX_REFRESHES_PER_WINDOW) {
        console.error(
            "[api] Too many refreshes in a short time, pausing refresh for 60s"
        );
        blockRefresh(REFRESH_COOLDOWN_MS);
        return Promise.reject(new RefreshCooldownError());
    }
    recentRefreshStarts.push(now);

    const run = () => performRefresh(failedToken);
    const pending: Promise<string | null> =
        typeof navigator !== "undefined" && navigator.locks
            ? (navigator.locks.request(REFRESH_LOCK_NAME, run) as Promise<
                  string | null
              >)
            : run();

    refreshPromise = pending
        .then(
            (value) => value,
            (err: unknown) => {
                onRefreshError(err);
                throw err;
            }
        )
        .finally(() => {
            refreshPromise = null;
        });

    return refreshPromise;
};

/**
 * Sirf tab logout jab server ne session definitely reject kiya ho:
 *  - 401: server ne refresh reject kiya
 *  - 400: SIRF jab humne refresh token bheja ho (token mode). Bina refresh token
 *         ke aaya 400 matlab "request me token hi nahi tha" (cookie blocked /
 *         cookie mode), ye session reject hona nahi hai, isliye logout nahi.
 * Network error, timeout, 429, 5xx, cooldown par bhi logout NAHI.
 */
const handleRefreshFailure = (refreshError: unknown) => {
    if (!axios.isAxiosError(refreshError)) return;

    const status = refreshError.response?.status;
    const body = refreshError.response?.data as ApiErrorBody | undefined;
    const hadRefreshToken = !!TokenStorage.getRefreshToken();

    const rejected = status === 401 || (status === 400 && hadRefreshToken);

    if (rejected) {
        forceLogout(
            `refresh_rejected status=${status} message=${body?.message ?? "n/a"}`
        );
    } else if (status === 400) {
        console.warn(
            "[api] refresh-token 400 without a stored refresh token, logout skipped"
        );
    }
};

// ==================== REQUEST INTERCEPTOR ====================

api.interceptors.request.use(
    async (reqConfig) => {
        if (!reqConfig.headers.has(CSRF_HEADER_NAME)) {
            reqConfig.headers.set(CSRF_HEADER_NAME, CSRF_HEADER_VALUE);
        }

        // Token mode: access token gayab/expire ho to request se pehle hi refresh.
        // (Cookie mode me JS ko expiry pata nahi, wahan 401 par refresh hota hai.)
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

        // Koi session hi nahi (anonymous visitor): refresh try karne ka koi matlab nahi
        if (!TokenStorage.isAuthenticated() && !TokenStorage.getRefreshToken()) {
            return Promise.reject(error);
        }

        const failedHeader = originalRequest.headers?.Authorization;
        const failedToken = failedHeader
            ? String(failedHeader).replace(/^Bearer\s+/i, "")
            : null;

        originalRequest._retry = true;

        try {
            const newToken = await refreshAccessToken(failedToken);
            if (newToken) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return api(originalRequest);
        } catch (refreshError: unknown) {
            handleRefreshFailure(refreshError);
            // Original error wapas do, taaki caller ko asli request ka 401 dikhe
            return Promise.reject(error);
        }
    }
);

/**
 * Non-axios callers ke liye: valid access token do (token mode).
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
 * Forced session renewal (token + cookie dono mode).
 * true = session renew ho gaya, false = fail ya cooldown active.
 */
export const renewSession = async (): Promise<boolean> => {
    try {
        await refreshAccessToken(TokenStorage.getAccessToken());
        return true;
    } catch (refreshError: unknown) {
        handleRefreshFailure(refreshError);
        return false;
    }
};

/** Cooldown chal raha hai ya nahi (socket jaise callers ke liye). */
export const isRefreshCoolingDown = (): boolean =>
    Date.now() < refreshBlockedUntil;

/**
 * Backward compatible: naya access token (token mode) ya null.
 */
export const refreshSession = async (): Promise<string | null> => {
    const ok = await renewSession();
    return ok ? TokenStorage.getAccessToken() : null;
};

export default api;