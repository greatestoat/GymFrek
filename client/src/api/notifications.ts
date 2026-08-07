import api from './axios';
import type { AppNotification } from '../types';

export async function listNotifications() {
  const { data } = await api.get<{ notifications: AppNotification[] }>('/notifications');
  return data.notifications;
}

export async function getUnreadNotificationCount() {
  const { data } = await api.get<{ count: number }>('/notifications/unread-count');
  return data.count;
}

export async function markNotificationRead(id: string) {
  const { data } = await api.patch<{ notification: AppNotification }>(`/notifications/${id}/read`);
  return data.notification;
}

export async function markAllNotificationsRead() {
  await api.patch('/notifications/read-all');
}