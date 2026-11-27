/**
 * ====================================
 * STUDY GROUP - NOTIFICATION API SERVICE
 * ====================================
 * Talks to the StudyGroup backend's own notification system
 * (separate from mentorship notifications).
 */

import api from "./api.intance";
import axios from "axios";
import config from "@/config/env.config";

export interface StudyNotification {
  notificationId: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  priority: "low" | "medium" | "high" | "urgent";
  data?: Record<string, any>;
  metadata?: { groupId?: string | null };
  createdAt: string;
}

export interface StudyNotificationList {
  notifications: StudyNotification[];
  unreadCount: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Base URL: NEXT_PUBLIC_STUDY_GROUP_NOTIFICATIONS_ENDPOINT if set, otherwise derived
 * from NEXT_PUBLIC_STUDY_GROUP_ENDPOINT (".../groups" -> ".../notifications").
 */
const baseUrl = (): string => {
  const explicit =
    config.NEXT_PUBLIC_STUDY_GROUP_NOTIFICATIONS_ENDPOINT ||
    process.env.NEXT_PUBLIC_STUDY_GROUP_NOTIFICATIONS_ENDPOINT;
  if (explicit) return explicit.replace(/\/+$/, "");
  const groups = (
    config.NEXT_PUBLIC_STUDY_GROUP_ENDPOINT ||
    process.env.NEXT_PUBLIC_STUDY_GROUP_ENDPOINT ||
    ""
  ).replace(/\/+$/, "");
  return groups.replace(/\/groups$/, "") + "/notifications";
};

const fail = (error: unknown, fallback: string): never => {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.message;
    if (msg) throw new Error(msg);
  }
  throw new Error(fallback);
};

export class StudyGroupNotificationService {
  static async getAll(
    params?: {
      page?: number;
      limit?: number;
      isRead?: boolean;
    },
    options?: { signal?: AbortSignal }
  ): Promise<StudyNotificationList> {
    try {
      const { data } = await api.get(`${baseUrl()}/all`, {
        params,
        signal: options?.signal,
      });
      return data.data;
    } catch (e) {
      if (axios.isCancel(e)) throw e;
      return fail(e, "Failed to load notifications");
    }
  }

  /** Cheap call used by the sidebar badge. */
  static async getUnreadCount(): Promise<number> {
    try {
      const { data } = await api.get(`${baseUrl()}/unread`, { params: { limit: 1 } });
      return data.data?.unreadCount ?? 0;
    } catch (e) {
      return fail(e, "Failed to load unread count");
    }
  }

  static async markAsRead(notificationId: string): Promise<void> {
    try {
      await api.patch(`${baseUrl()}/${notificationId}/read`);
    } catch (e) {
      fail(e, "Failed to mark notification as read");
    }
  }

  static async markAllAsRead(): Promise<void> {
    try {
      await api.patch(`${baseUrl()}/mark-all-read`);
    } catch (e) {
      fail(e, "Failed to mark all as read");
    }
  }

  static async remove(notificationId: string): Promise<void> {
    try {
      await api.delete(`${baseUrl()}/${notificationId}`);
    } catch (e) {
      fail(e, "Failed to delete notification");
    }
  }
}

export default StudyGroupNotificationService;
