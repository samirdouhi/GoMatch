'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Bell, X, CheckCheck, ChevronRight, Zap, MapPin, Brain, Tag } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useNotifications } from '@/hooks/useNotifications';
import type { GoMatchNotification, NotificationType } from '@/lib/notificationApi';

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<NotificationType, {
  Icon: React.FC<{ size?: number; color?: string }>;
  label: string;
  accentColor: string;
  bgColor: string;
}> = {
  sport:      { Icon: Zap,    label: 'Match',      accentColor: '#facc15', bgColor: 'rgba(250,204,21,0.12)' },
  contextual: { Icon: MapPin, label: 'Proche',     accentColor: '#4ade80', bgColor: 'rgba(74,222,128,0.10)' },
  ai:         { Icon: Brain,  label: 'GoMatch IA', accentColor: '#818cf8', bgColor: 'rgba(129,140,248,0.10)' },
  sponsored:  { Icon: Tag,    label: 'Offre',      accentColor: '#fb923c', bgColor: 'rgba(251,146,60,0.10)' },
};

function fmtRelTime(iso: string): string {
  const diffSec = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diffSec < 60)    return 'À l\'instant';
  if (diffSec < 3600)  return `${Math.floor(diffSec / 60)} min`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`;
  return `${Math.floor(diffSec / 86400)}j`;
}

// ─── Single notification row inside dropdown ────────────────────────────────────

function NotifRow({
  notif,
  onRead,
  onDelete,
}: {
  notif: GoMatchNotification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const cfg = TYPE_CONFIG[notif.type];
  const { Icon } = cfg;

  return (
    <div
      className="group relative flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03] cursor-pointer"
      onClick={() => !notif.isRead && onRead(notif.id)}
    >
      {/* Type icon */}
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: cfg.bgColor }}
      >
        <Icon size={13} color={cfg.accentColor} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0 pr-4">
        <p className={`text-xs font-semibold leading-snug ${notif.isRead ? 'text-zinc-400' : 'text-white'}`}>
          {notif.title}
        </p>
        <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed line-clamp-2">{notif.message}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span
            className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
            style={{ background: cfg.bgColor, color: cfg.accentColor }}
          >
            {cfg.label}
          </span>
          <span className="text-[10px] text-zinc-600">{fmtRelTime(notif.createdAt)}</span>
        </div>
      </div>

      {/* Unread dot */}
      {!notif.isRead && (
        <span className="absolute right-4 top-4 w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
      )}

      {/* Delete — shown on hover */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}
        className="absolute right-3 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/5"
        aria-label="Supprimer"
      >
        <X size={11} />
      </button>
    </div>
  );
}

// ─── Bell Component ────────────────────────────────────────────────────────────

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllRead, deleteNotif } = useNotifications();

  const recent = notifications.slice(0, 7);

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className={`relative p-2.5 rounded-xl border transition-all ${
          open
            ? 'border-red-500/60 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
            : unreadCount > 0
              ? 'border-red-500/30 bg-black/5 hover:border-red-500/50 dark:border-white/5 dark:bg-white/5'
              : 'border-black/10 bg-black/5 hover:border-white/20 dark:border-white/5 dark:bg-white/5'
        }`}
      >
        <Bell
          size={20}
          className={
            open
              ? 'text-red-400'
              : unreadCount > 0
                ? 'text-red-400 animate-[wiggle_0.6s_ease-in-out]'
                : 'text-slate-500 dark:text-white/40'
          }
        />
        {/* Unread badge — red with pulse ring */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[9px] font-black bg-red-500 text-white rounded-full shadow-lg"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-60" />
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full w-80 rounded-2xl border border-white/8 overflow-hidden shadow-2xl z-[200]"
            style={{ background: 'rgba(10,10,11,0.98)', backdropFilter: 'blur(24px)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-[#facc15]">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-1.5 text-zinc-500 font-normal normal-case tracking-normal">
                    {unreadCount} non lu{unreadCount > 1 ? 'es' : 'e'}
                  </span>
                )}
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-white transition-colors"
                >
                  <CheckCheck size={12} /> Tout lire
                </button>
              )}
            </div>

            {/* List */}
            <div
              className="max-h-[360px] overflow-y-auto divide-y divide-white/[0.04]"
              style={{ scrollbarWidth: 'none' }}
            >
              {recent.length === 0 ? (
                <div className="py-12 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                    <Bell size={20} className="text-zinc-600" />
                  </div>
                  <p className="text-xs text-zinc-500">Aucune notification</p>
                </div>
              ) : (
                recent.map((n) => (
                  <NotifRow
                    key={n.id}
                    notif={n}
                    onRead={markAsRead}
                    onDelete={deleteNotif}
                  />
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/[0.05] px-4 py-2.5">
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-white transition-colors"
              >
                Voir l'historique complet <ChevronRight size={12} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
