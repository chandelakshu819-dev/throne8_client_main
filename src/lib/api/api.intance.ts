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

// Backend route se match hona chahiye (auth.routes.ts check karo)
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
  "/auth/logout",
  "/auth/forgot",
  "/auth/reset",
  "/auth/verify",
  "/auth/otp",
];

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
// Identical concurrent GET requests (same url + params) ek hi promise share karte hain.
// Sirf GET wrap hota hai; mutations hamesha fresh jaate hain.

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

// ==================== RESPONSE INTERCEPTOR ====================
// No request interceptor anymore: the access token is an httpOnly cookie that the
// browser attaches by itself. JavaScript never sees or sends a token.

type QueueItem = {
  resolve: () => void;
  reject: (error: unknown) => void;
};

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
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

/**
 * Actual refresh call. The backend reads the refresh cookie and rotates both cookies.
 * Runs inside a cross-tab lock (see refreshSession).
 */
const performRefresh = async (): Promise<void> => {
  const lastRefresh = Number(localStorage.getItem(LAST_REFRESH_KEY) || 0);
  if (Date.now() - lastRefresh < RECENT_REFRESH_MS) {
    return; // another tab just refreshed — cookies are already fresh
  }

  // One-time migration: a session created before cookie auth only has its refresh token
  // in localStorage. The backend accepts it in the body and answers with cookies.
  const legacyRefreshToken = TokenStorage.getLegacyRefreshToken();

  await axios.post(
    `${API_BASE_URL}${REFRESH_PATH}`,
    legacyRefreshToken ? { refreshToken: legacyRefreshToken } : {},
    {
      withCredentials: true,
      headers: { "Content-Type": "application/json", ...CSRF_HEADERS },
    }
  );

  TokenStorage.purgeLegacyTokens();
  TokenStorage.markSessionActive();
  localStorage.setItem(LAST_REFRESH_KEY, String(Date.now()));
};

/**
 * Refresh the cookie session (de-duplicated across tabs with a Web Lock).
 * Exported so the socket client can renew the session before reconnecting.
 */
export const refreshSession = async (): Promise<void> => {
  if (typeof navigator !== "undefined" && navigator.locks) {
    await navigator.locks.request(REFRESH_LOCK_NAME, () => performRefresh());
  } else {
    await performRefresh();
  }
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

    // Login/register/refresh jaise endpoints, ya visitor jiska session hi nahi hai:
    // refresh ya redirect nahi, seedha error caller ko do.
    if (
      !TokenStorage.isAuthenticated() ||
      isNoRefreshRequest(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<void>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => api(originalRequest));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await refreshSession();
      processQueue(null);
      return api(originalRequest);
    } catch (refreshError: any) {
      processQueue(refreshError);

      // Sirf tab logout jab refresh token definitively invalid ho.
      // Network error ya 5xx par user ko logout mat karo.
      const status = axios.isAxiosError(refreshError)
        ? refreshError.response?.status
        : undefined;
      const definitelyInvalid =
        status === 400 || status === 401 || status === 403;

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
