// src/features/mentorship/services/sessionJoin.service.ts
import SessionService from "@/lib/api/session.service";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export interface JoinMentorshipSessionOptions {
  sessionId: string;
  bookingId?: string;
  router: AppRouterInstance;
  onStart?: () => void;
  onSuccess?: (session: any) => void;
  onError?: (err: Error) => void;
}

export interface NavigateToUpcomingSessionsOptions {
  userId: string;
  sessionId?: string;
  bookingId?: string;
  router: AppRouterInstance;
}

/**
 * Shared session join executor across the mentorship application.
 * Verifies the session against real backend data and navigates to the active session room.
 */
export async function joinMentorshipSession({
  sessionId,
  bookingId,
  router,
  onStart,
  onSuccess,
  onError,
}: JoinMentorshipSessionOptions): Promise<void> {
  if (!sessionId) {
    const err = new Error("Session ID is required to join.");
    onError?.(err);
    throw err;
  }

  try {
    onStart?.();
    const { session, roomUrl } = await SessionService.joinSession(sessionId, bookingId);
    onSuccess?.(session);
    router.push(roomUrl);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unable to join session. Please try again.";
    const errorObj = err instanceof Error ? err : new Error(errorMessage);
    onError?.(errorObj);
    throw errorObj;
  }
}

/**
 * Shared helper to navigate to the User Dashboard Upcoming Sessions view,
 * preserving sessionId and bookingId query parameters.
 */
export function navigateToUpcomingSessions({
  userId,
  sessionId,
  bookingId,
  router,
}: NavigateToUpcomingSessionsOptions): void {
  if (!userId) return;

  const queryParams = new URLSearchParams();
  if (sessionId) {
    queryParams.set("sessionId", sessionId);
  }
  if (bookingId) {
    queryParams.set("bookingId", bookingId);
  }

  const queryStr = queryParams.toString();
  const targetUrl = `/mentorship/user-dashboard/${encodeURIComponent(userId)}/upcoming-sessions${
    queryStr ? `?${queryStr}` : ""
  }`;

  router.push(targetUrl);
}
