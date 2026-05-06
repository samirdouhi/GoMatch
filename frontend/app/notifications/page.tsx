'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Bell, CheckCheck, Trash2, Zap, MapPin, Brain, Tag,
  ArrowLeft, Settings2, ToggleLeft, ToggleRight, Moon, Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useNotifications } from '@/hooks/useNotifications';
import type { GoMatchNotification, NotificationType, UserNotifPreference } from '@/lib/notificationApi';
import { getPreferences, savePreferences } from '@/lib/notificationApi';

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<NotificationType, {
  Icon: React.FC<{ size?: number; color?: string }>;
  label: string;
  accentColor: string;
  bgColor: string;
  borderColor: string;
}> = {
  sport:      { Icon: Zap,    label: 'Match',            accentColor: '#facc15', bgColor: 'rgba(250,204,21,0.10)',  borderColor: 'rgba(250,204,21,0.20)' },
  contextual: { Icon: MapPin, label: 'À proximité',      accentColor: '#4ade80', bgColor: 'rgba(74,222,128,0.08)',  borderColor: 'rgba(74,222,128,0.20)' },
  ai:         { Icon: Brain,  label: 'GoMatch IA',       accentColor: '#818cf8', bgColor: 'rgba(129,140,248,0.08)', borderColor: 'rgba(129,140,248,0.20)' },
  sponsored:  { Icon: Tag,    label: 'Offre sponsorisée',accentColor: '#fb923c', bgColor: 'rgba(251,146,60,0.08)',  borderColor: 'rgba(251,146,60,0.20)' },
};

type FilterType = 'all' | NotificationType;
type TabType = 'notifications' | 'preferences';

const FILTER_TABS: { value: FilterType; label: string }[] = [
  { value: 'all',        label: 'Toutes' },
  { value: 'sport',      label: 'Match' },
  { value: 'contextual', label: 'Proximité' },
  { value: 'ai',         label: 'IA' },
  { value: 'sponsored',  label: 'Offres' },
];

function fmtDate(iso: string): string {
  // Ensure the date is parsed as UTC (server stores UTC, may omit 'Z' suffix)
  const normalized = iso.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(iso) ? iso : iso + 'Z';
  const d = new Date(normalized);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString())
    return `Aujourd'hui ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  if (d.toDateString() === yesterday.toDateString())
    return `Hier ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
}

// ─── Notification Card ─────────────────────────────────────────────────────────

function NotifCard({ notif, onRead, onDelete }: {
  notif: GoMatchNotification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const cfg = TYPE_CONFIG[notif.type];
  const { Icon } = cfg;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className="relative group rounded-2xl border p-4 transition-all cursor-pointer"
      style={{
        background: notif.isRead ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${notif.isRead ? 'rgba(255,255,255,0.06)' : cfg.borderColor}`,
        opacity: notif.isRead ? 0.7 : 1,
      }}
      onClick={() => !notif.isRead && onRead(notif.id)}
    >
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.bgColor }}>
          <Icon size={18} color={cfg.accentColor} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: cfg.accentColor }}>
                  {cfg.label}
                </span>
                {!notif.isRead && <span className="w-1.5 h-1.5 rounded-full bg-[#facc15]" />}
              </div>
              <h3 className={`text-sm font-bold leading-snug mb-1 ${notif.isRead ? 'text-zinc-300' : 'text-white'}`}>
                {notif.title}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{notif.message}</p>
              <p className="text-[11px] text-zinc-600 mt-2">{fmtDate(notif.createdAt)}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-xl text-zinc-600 hover:text-zinc-300 hover:bg-white/5 flex-shrink-0"
            >
              <Trash2 size={14} />
            </button>
          </div>
          {notif.actionUrl && (
            <Link
              href={notif.actionUrl}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 mt-2 text-xs font-semibold"
              style={{ color: cfg.accentColor }}
            >
              Voir →
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Preferences Panel ─────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className="flex-shrink-0">
      {value
        ? <ToggleRight size={28} className="text-[#facc15]" />
        : <ToggleLeft size={28} className="text-zinc-600" />}
    </button>
  );
}

function PreferencesPanel() {
  const [prefs, setPrefs] = useState<UserNotifPreference | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getPreferences().then(setPrefs).catch(() => {});
  }, []);

  const update = useCallback((patch: Partial<UserNotifPreference>) => {
    setPrefs((prev) => prev ? { ...prev, ...patch } : prev);
    setSaved(false);
  }, []);

  const handleSave = async () => {
    if (!prefs) return;
    setSaving(true);
    try {
      await savePreferences(prefs);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  if (!prefs) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-2xl bg-zinc-900 animate-pulse" />
        ))}
      </div>
    );
  }

  const typeRows: { key: keyof UserNotifPreference; label: string; desc: string; color: string }[] = [
    { key: 'sportEnabled',      label: 'Notifications Match',      desc: 'Alertes avant les matchs de vos équipes suivies', color: '#facc15' },
    { key: 'contextualEnabled', label: 'Proximité & restaurants',  desc: 'Commerces et activités autour de vous',          color: '#4ade80' },
    { key: 'aiEnabled',         label: 'Recommandations IA',       desc: 'Suggestions personnalisées par GoMatch',         color: '#818cf8' },
    { key: 'sponsoredEnabled',  label: 'Offres sponsorisées',      desc: 'Promotions des partenaires GoMatch',             color: '#fb923c' },
  ];

  return (
    <div className="space-y-6">
      {/* Type toggles */}
      <div className="rounded-2xl border border-zinc-800 overflow-hidden">
        {typeRows.map((row, i) => (
          <div
            key={row.key}
            className={`flex items-center justify-between px-5 py-4 ${i < typeRows.length - 1 ? 'border-b border-zinc-800/60' : ''}`}
          >
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-sm font-bold text-white">{row.label}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{row.desc}</p>
            </div>
            <Toggle
              value={prefs[row.key] as boolean}
              onChange={(v) => update({ [row.key]: v })}
            />
          </div>
        ))}
      </div>

      {/* Max per day */}
      <div className="rounded-2xl border border-zinc-800 px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-zinc-400" />
            <p className="text-sm font-bold text-white">Maximum par jour</p>
          </div>
          <span className="text-lg font-black text-[#facc15]">{prefs.maxPerDay}</span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          value={prefs.maxPerDay}
          onChange={(e) => update({ maxPerDay: Number(e.target.value) })}
          className="w-full accent-[#facc15]"
        />
        <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
          <span>1 (minimal)</span>
          <span>10 (maximum)</span>
        </div>
      </div>

      {/* Quiet hours */}
      <div className="rounded-2xl border border-zinc-800 px-5 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon size={16} className="text-zinc-400" />
            <p className="text-sm font-bold text-white">Heures silencieuses</p>
          </div>
          <Toggle value={prefs.quietHoursEnabled} onChange={(v) => update({ quietHoursEnabled: v })} />
        </div>
        {prefs.quietHoursEnabled && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-zinc-500 block mb-1.5 flex items-center gap-1">
                <Clock size={11} /> Début
              </label>
              <select
                value={prefs.quietHoursStart}
                onChange={(e) => update({ quietHoursStart: Number(e.target.value) })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-zinc-500 block mb-1.5 flex items-center gap-1">
                <Clock size={11} /> Fin
              </label>
              <select
                value={prefs.quietHoursEnd}
                onChange={(e) => update({ quietHoursEnd: Number(e.target.value) })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-3.5 rounded-2xl text-sm font-black transition-all ${
          saved
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-[#facc15] text-black hover:bg-[#fbbf24] shadow-lg shadow-[#facc15]/20'
        }`}
      >
        {saving ? 'Enregistrement…' : saved ? 'Préférences sauvegardées ✓' : 'Enregistrer les préférences'}
      </button>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [activeTab, setActiveTab] = useState<TabType>('notifications');
  const { notifications, unreadCount, isLoading, markAsRead, markAllRead, deleteNotif } = useNotifications();

  const filtered = activeFilter === 'all'
    ? notifications
    : notifications.filter((n) => n.type === activeFilter);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/"
            className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-black text-white">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-zinc-500 mt-0.5">
                {unreadCount} non lu{unreadCount > 1 ? 'es' : 'e'}
              </p>
            )}
          </div>
          {activeTab === 'notifications' && unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors px-3 py-2 rounded-xl border border-zinc-800 hover:border-zinc-600"
            >
              <CheckCheck size={14} /> Tout lire
            </button>
          )}
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'notifications'
                ? 'bg-[#facc15] text-black'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Bell size={14} /> Notifications
            {unreadCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'notifications' ? 'bg-black/20 text-black' : 'bg-zinc-800 text-zinc-400'
              }`}>
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'preferences'
                ? 'bg-[#facc15] text-black'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Settings2 size={14} /> Préférences
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'preferences' ? (
            <motion.div key="prefs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <PreferencesPanel />
            </motion.div>
          ) : (
            <motion.div key="notifs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              {/* Filter tabs */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {FILTER_TABS.map((tab) => {
                  const count = tab.value === 'all'
                    ? notifications.length
                    : notifications.filter((n) => n.type === tab.value).length;
                  const isActive = activeFilter === tab.value;
                  return (
                    <button
                      key={tab.value}
                      onClick={() => setActiveFilter(tab.value)}
                      className={`flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-zinc-800 text-white border border-zinc-600'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white'
                      }`}
                    >
                      {tab.label}
                      {count > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-zinc-800 text-zinc-400">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* List */}
              {isLoading && notifications.length === 0 ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 rounded-2xl bg-zinc-900 animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-24 text-center"
                >
                  <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                    <Bell size={24} className="text-zinc-600" />
                  </div>
                  <p className="text-base font-bold text-zinc-400 mb-1">
                    {activeFilter === 'all'
                      ? 'Aucune notification'
                      : `Aucune notification "${FILTER_TABS.find(t => t.value === activeFilter)?.label}"`}
                  </p>
                  <p className="text-sm text-zinc-600">Les nouvelles notifications apparaîtront ici</p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {filtered.map((notif) => (
                      <NotifCard
                        key={notif.id}
                        notif={notif}
                        onRead={markAsRead}
                        onDelete={deleteNotif}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
