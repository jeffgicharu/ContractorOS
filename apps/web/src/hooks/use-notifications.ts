'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api-client';
import type { Notification } from '@contractor-os/shared';

interface NotificationsMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  unreadCount: number;
}

const POLL_INTERVAL = 30_000;

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data, meta } = await api.get<Notification[]>('/notifications', {
        page: 1,
        pageSize: 10,
      }) as { data: Notification[]; meta: NotificationsMeta };
      setNotifications(data);
      setUnreadCount(meta.unreadCount);
    } catch {
      // Silently fail on poll errors
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markRead = useCallback(async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Silently fail
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })),
      );
      setUnreadCount(0);
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
    intervalRef.current = setInterval(() => void fetchNotifications(), POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markRead,
    markAllRead,
    refresh: fetchNotifications,
  };
}
