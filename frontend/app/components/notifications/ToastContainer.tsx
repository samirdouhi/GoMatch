'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Zap, MapPin, Brain, Tag, ExternalLink, Bell } from 'lucide-react';
import Link from 'next/link';
import type { GoMatchNotification, NotificationType } from '@/lib/notificationApi';
import { registerToastCallback } from '@/hooks/useNotifications';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ToastData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  duration?: number;
}

interface ToastContextValue {
  show: (toast: Omit<ToastData, 'id'>) => void;
  dismiss: (id: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue>({ show: () => {}, dismiss: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<NotificationType, {
  Icon: React.FC<{ size?: number; color?: string }>;
  label: string;
  accent: string;
  glow: string;
  bg: string;
  border: string;
  gradient: string;
}> = {
  sport: {
    Icon: Zap,
    label: 'Match',
    accent: '#facc15',
    glow: 'rgba(250,204,21,0.35)',
    bg: 'rgba(250,204,21,0.10)',
    border: 'rgba(250,204,21,0.22)',
    gradient: 'linear-gradient(135deg, rgba(250,204,21,0.06) 0%, transparent 60%)',
  },
  contextual: {
    Icon: MapPin,
    label: 'À proximité',
    accent: '#4ade80',
    glow: 'rgba(74,222,128,0.30)',
    bg: 'rgba(74,222,128,0.08)',
    border: 'rgba(74,222,128,0.20)',
    gradient: 'linear-gradient(135deg, rgba(74,222,128,0.06) 0%, transparent 60%)',
  },
  ai: {
    Icon: Brain,
    label: 'GoMatch IA',
    accent: '#818cf8',
    glow: 'rgba(129,140,248,0.35)',
    bg: 'rgba(129,140,248,0.08)',
    border: 'rgba(129,140,248,0.22)',
    gradient: 'linear-gradient(135deg, rgba(129,140,248,0.06) 0%, transparent 60%)',
  },
  sponsored: {
    Icon: Tag,
    label: 'Offre',
    accent: '#fb923c',
    glow: 'rgba(251,146,60,0.32)',
    bg: 'rgba(251,146,60,0.08)',
    border: 'rgba(251,146,60,0.20)',
    gradient: 'linear-gradient(135deg, rgba(251,146,60,0.06) 0%, transparent 60%)',
  },
};

function uid() {
  return Math.random().toString(36).slice(2);
}

// ─── Single Toast Item ─────────────────────────────────────────────────────────

function ToastItem({ toast, onDismiss }: { toast: ToastData; onDismiss: (id: string) => void }) {
  const cfg = TYPE_CONFIG[toast.type];
  const { Icon } = cfg;
  const DURATION = toast.duration ?? 6000;

  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), DURATION);
    return () => clearTimeout(t);
  }, [toast.id, DURATION, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.90, filter: 'blur(6px)' }}
      animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: 60, scale: 0.94, filter: 'blur(4px)' }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className="relative w-[360px] rounded-2xl overflow-hidden select-none"
      style={{
        background: `rgba(12,12,14,0.97)`,
        border: `1px solid ${cfg.border}`,
        backdropFilter: 'blur(28px)',
        boxShadow: `0 24px 70px rgba(0,0,0,0.65), 0 0 0 1px ${cfg.border}, inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      {/* Left accent stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl"
        style={{
          background: `linear-gradient(to bottom, ${cfg.accent}, ${cfg.accent}55)`,
          boxShadow: `2px 0 12px ${cfg.glow}`,
        }}
      />

      {/* Top glow line */}
      <div
        className="absolute top-0 left-4 right-4 h-px"
        style={{ background: `linear-gradient(to right, transparent, ${cfg.accent}50, transparent)` }}
      />

      {/* Radial gradient wash */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: cfg.gradient }}
      />

      {/* Body */}
      <div className="relative flex items-start gap-3.5 pl-6 pr-4 pt-4 pb-3.5">
        {/* Icon */}
        <div
          className="relative w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{
            background: cfg.bg,
            boxShadow: `0 0 22px ${cfg.glow}`,
          }}
        >
          <Icon size={19} color={cfg.accent} />
          {/* Inner glow */}
          <div
            className="absolute inset-0 rounded-2xl"
            style={{ boxShadow: `inset 0 1px 0 ${cfg.accent}22` }}
          />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 pt-0.5">
          {/* Pill label */}
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.18em] px-2 py-0.5 rounded-full"
              style={{ background: cfg.bg, color: cfg.accent, border: `1px solid ${cfg.border}` }}
            >
              <Icon size={8} color={cfg.accent} />
              {cfg.label}
            </span>
            <div className="flex items-center gap-1">
              <Bell size={8} className="text-zinc-600" />
              <span className="text-[9px] text-zinc-600 font-medium">GoMatch</span>
            </div>
          </div>

          <p className="text-[13px] font-bold text-white leading-snug tracking-tight">{toast.title}</p>
          <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed line-clamp-2">{toast.message}</p>

          {toast.actionUrl && (
            <Link
              href={toast.actionUrl}
              onClick={() => onDismiss(toast.id)}
              className="inline-flex items-center gap-1.5 mt-2.5 text-[11px] font-bold px-3 py-1.5 rounded-xl transition-opacity hover:opacity-80"
              style={{ background: cfg.bg, color: cfg.accent, border: `1px solid ${cfg.border}` }}
            >
              {toast.actionLabel ?? 'Voir'} <ExternalLink size={10} />
            </Link>
          )}
        </div>

        {/* Close */}
        <button
          onClick={() => onDismiss(toast.id)}
          className="flex-shrink-0 w-7 h-7 rounded-xl flex items-center justify-center text-zinc-600 hover:text-zinc-200 hover:bg-white/8 transition-all"
          aria-label="Fermer"
        >
          <X size={13} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-[2px] bg-white/[0.04]">
        <motion.div
          className="h-full"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: DURATION / 1000, ease: 'linear' }}
          style={{
            background: `linear-gradient(to right, ${cfg.accent}60, ${cfg.accent})`,
            boxShadow: `0 0 6px ${cfg.glow}`,
          }}
        />
      </div>
    </motion.div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = uid();
    setToasts((prev) => [...prev, { ...toast, id }].slice(-4));
  }, []);

  useEffect(() => {
    registerToastCallback((n: GoMatchNotification) => {
      show({
        type: n.type,
        title: n.title,
        message: n.message,
        actionUrl: n.actionUrl,
        actionLabel: 'Voir',
        duration: 6000,
      });
    });
  }, [show]);

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}

      <div className="fixed top-6 right-6 z-[9999] pointer-events-none">
        <div className="pointer-events-auto flex flex-col gap-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {toasts.map((t) => (
              <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </ToastContext.Provider>
  );
}
