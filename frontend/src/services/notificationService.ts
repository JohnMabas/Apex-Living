import type { Notification, NotificationListResult, NotificationCategory, PaginationMeta } from "@/types";
import { apiFetch } from "./apiClient";

function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const q = search.toString();
  return q ? `?${q}` : "";
}

type ListResponse = {
  status: "success";
  data: { notifications: Notification[] };
  meta: PaginationMeta;
  unreadCount?: number;
};

export async function getNotifications(params: {
  category?: NotificationCategory | "";
  page?: number;
  limit?: number;
} = {}): Promise<NotificationListResult> {
  const query = buildQuery({ category: params.category, page: params.page, limit: params.limit });
  const response = await apiFetch<ListResponse>(`/notifications${query}`);
  return {
    notifications: response.data.notifications,
    meta: response.meta,
    unreadCount: response.unreadCount,
  };
}

export async function getUnreadNotificationCount(): Promise<number> {
  const response = await apiFetch<{ data: { unreadCount: number } }>(
    "/notifications/unread-count",
  );
  return response.data.unreadCount;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await apiFetch(`/notifications/${encodeURIComponent(id)}/read`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await apiFetch(`/notifications/read-all`, { method: "PATCH" });
}
