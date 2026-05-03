'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { GoMatchNotification } from '@/lib/notificationApi';
import {
  getNotifications,
  generateNotifications,
  markAsRead as apiMarkAsRead,
  markAllRead as apiMarkAllRead,
  deleteNotification as apiDelete,
} from '@/lib/notificationApi';

const POLL_INTERVAL_MS = 60_000;
const CACHE_KEY = 'gomatch_notifications_cache';
const CACHE_TTL_MS = 55_000;
const GENERATED_KEY = 'gomatch_notif_generated_at';
const GENERATE_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours

function readCache(): GoMatchNotification[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return data as GoMatchNotification[];
  } catch {
    return null;
  }
}

function writeCache(data: GoMatchNotification[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

function shouldGenerate(): boolean {
  if (typeof window === 'undefined') return false;
  const raw = localStorage.getItem(GENERATED_KEY);
  if (!raw) return true;
  return Date.now() - Number(raw) > GENERATE_COOLDOWN_MS;
}

function markGenerated() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GENERATED_KEY, String(Date.now()));
}

export interface UseNotificationsReturn {
  notifications: GoMatchNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotif: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

// Optional: inject toast show function so the hook can fire toasts
// without importing ToastContext (avoids circular deps).
let _toastShow: ((n: GoMatchNotification) => void) | null = null;

export function registerToastCallback(fn: (n: GoMatchNotification) => void) {
  _toastShow = fn;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<GoMatchNotification[]>(() => readCache() ?? []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const knownIdsRef = useRef<Set<string>>(new Set());

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('gomatch_access_token');
    if (!token) return;

    try {
      const data = await getNotifications();
      if (!mountedRef.current) return;

      // Detect new notifications and fire toasts
      if (_toastShow && knownIdsRef.current.size > 0) {
        for (const n of data) {
          if (!knownIdsRef.current.has(n.id) && !n.isRead) {
            _toastShow(n);
          }
        }
      }
      knownIdsRef.current = new Set(data.map((n) => n.id));

      setNotifications(data);
      writeCache(data);
      setError(null);
    } catch {
      if (mountedRef.current) setError('offline');
    }
  }, []);

  // Trigger smart generation once per 6-hour window (with user's location if available)
  const triggerGeneration = useCallback(async () => {
    if (!shouldGenerate()) return;
    markGenerated();

    let lat: number | undefined;
    let lng: number | undefined;

    if ('geolocation' in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        // Location denied or unavailable — generate without location
      }
    }

    try {
      const generated = await generateNotifications({ lat, lng });
      if (!mountedRef.current || generated.length === 0) return;

      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const newOnes = generated.filter((n) => !existingIds.has(n.id));
        if (newOnes.length === 0) return prev;
        const merged = [...newOnes, ...prev];
        writeCache(merged);
        // Toast the first new notification
        if (_toastShow && newOnes[0]) _toastShow(newOnes[0]);
        return merged;
      });
    } catch {
      // Silent — generation failure doesn't break the app
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('gomatch_access_token');
    if (!token) return;

    setIsLoading(true);
    fetchNotifications().finally(() => {
      if (mountedRef.current) setIsLoading(false);
    });

    // Trigger generation after initial fetch
    triggerGeneration();

    intervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchNotifications, triggerGeneration]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
    );
    try { await apiMarkAsRead(id); } catch {}
  }, []);

  const markAllRead = useCallback(async () => {
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: now })));
    try { await apiMarkAllRead(); } catch {}
  }, []);

  const deleteNotif = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try { await apiDelete(id); } catch {}
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllRead,
    deleteNotif,
    refresh: fetchNotifications,
  };
}
