import { authFetch } from "./authApi";

export type NotificationType = 'sport' | 'contextual' | 'ai' | 'sponsored';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface GoMatchNotification {
  id: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  actionUrl?: string;
  imageUrl?: string;
  meta?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export interface Promotion {
  id: string;
  businessId: string;
  businessName: string;
  title: string;
  description: string;
  imageUrl?: string;
  radiusKm: number;
  priority: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
  impressionCount: number;
  clickCount: number;
}

export interface CreatePromotionDto {
  title: string;
  description: string;
  imageUrl?: string;
  radiusKm: number;
  budget: number;
  startDate: string;
  endDate: string;
}

export interface UserNotifPreference {
  sportEnabled: boolean;
  contextualEnabled: boolean;
  aiEnabled: boolean;
  sponsoredEnabled: boolean;
  maxPerDay: number;
  quietHoursEnabled: boolean;
  quietHoursStart: number;
  quietHoursEnd: number;
}

const BASE = '/notifications/api';

function notifFetch(path: string, init?: RequestInit) {
  return authFetch(`${BASE}${path}`, init);
}

export async function getNotifications(): Promise<GoMatchNotification[]> {
  const res = await notifFetch('/notifications');
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

export async function markAsRead(id: string): Promise<void> {
  const res = await notifFetch(`/notifications/${id}/read`, { method: 'PUT' });
  if (!res.ok) throw new Error('Failed to mark notification as read');
}

export async function markAllRead(): Promise<void> {
  const res = await notifFetch('/notifications/read-all', { method: 'PUT' });
  if (!res.ok) throw new Error('Failed to mark all as read');
}

export async function deleteNotification(id: string): Promise<void> {
  const res = await notifFetch(`/notifications/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete notification');
}

export async function getPreferences(): Promise<UserNotifPreference> {
  const res = await notifFetch('/notifications/preferences');
  if (!res.ok) throw new Error('Failed to fetch preferences');
  return res.json();
}

export async function savePreferences(prefs: Partial<UserNotifPreference>): Promise<void> {
  const res = await notifFetch('/notifications/preferences', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prefs),
  });
  if (!res.ok) throw new Error('Failed to save preferences');
}

export async function getPromotions(): Promise<Promotion[]> {
  const res = await notifFetch('/promotions');
  if (!res.ok) throw new Error('Failed to fetch promotions');
  return res.json();
}

export async function createPromotion(dto: CreatePromotionDto): Promise<Promotion> {
  const res = await notifFetch('/promotions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error('Failed to create promotion');
  return res.json();
}

export async function trackPromotionClick(promotionId: string): Promise<void> {
  await notifFetch(`/promotions/${promotionId}/click`, { method: 'POST' }).catch(() => {});
}

export interface GenerateRequest {
  lat?: number;
  lng?: number;
  matchId?: string;
}

export async function generateNotifications(req?: GenerateRequest): Promise<GoMatchNotification[]> {
  const res = await notifFetch('/notifications/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req ?? {}),
  });
  if (!res.ok) return [];
  return res.json();
}

export async function updatePromotion(id: string, dto: CreatePromotionDto): Promise<Promotion> {
  const res = await notifFetch(`/promotions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error('Failed to update promotion');
  return res.json();
}

export async function togglePromotion(id: string): Promise<{ isActive: boolean }> {
  const res = await notifFetch(`/promotions/${id}/toggle`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to toggle promotion');
  return res.json();
}

export async function deletePromotion(id: string): Promise<void> {
  const res = await notifFetch(`/promotions/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete promotion');
}

export interface PromotionStats {
  impressions: number;
  clicks: number;
  ctr: number;
  budgetSpent: number;
  budgetRemaining: number;
  budgetPercent: number;
}

export async function getPromotionStats(id: string): Promise<PromotionStats> {
  const res = await notifFetch(`/promotions/${id}/stats`);
  if (!res.ok) throw new Error('Failed to fetch promotion stats');
  return res.json();
}
