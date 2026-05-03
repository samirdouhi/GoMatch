"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  Send,
  RefreshCw,
  Globe,
  Store,
  Users,
  Clock,
} from "lucide-react";
import {
  getBroadcastsAdmin,
  sendBroadcast,
  type AdminBroadcast,
} from "@/lib/adminApi";

const TARGET_OPTIONS = [
  { value: "All",        label: "Tous les utilisateurs", icon: Globe,  cls: "border-blue-500/30 bg-blue-500/10 text-blue-300" },
  { value: "Touriste",   label: "Touristes seulement",   icon: Users,  cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" },
  { value: "Commercant", label: "Commerçants seulement", icon: Store,  cls: "border-orange-500/30 bg-orange-500/10 text-orange-300" },
];

const TARGET_LABEL: Record<string, string> = {
  All:        "Tous",
  Touriste:   "Touristes",
  Commercant: "Commerçants",
};

const TARGET_CLS: Record<string, string> = {
  All:        "border-blue-500/30 bg-blue-500/10 text-blue-300",
  Touriste:   "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  Commercant: "border-orange-500/30 bg-orange-500/10 text-orange-300",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function BroadcastCard({ broadcast }: { broadcast: AdminBroadcast }) {
  const cls = TARGET_CLS[broadcast.targetRole] ?? TARGET_CLS["All"];
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-5 py-4 transition hover:border-white/[0.12]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-white">{broadcast.title}</h3>
            <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>
              {TARGET_LABEL[broadcast.targetRole] ?? broadcast.targetRole}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">{broadcast.message}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 text-xs text-zinc-600 sm:pl-6">
          <Clock className="h-3 w-3" />
          {formatDate(broadcast.sentAt)}
        </div>
      </div>
    </div>
  );
}

export default function AdminNotificationsPage() {
  const [broadcasts, setBroadcasts] = useState<AdminBroadcast[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError]   = useState<string | null>(null);

  const [title,      setTitle]      = useState("");
  const [message,    setMessage]    = useState("");
  const [targetRole, setTargetRole] = useState("All");
  const [sending,    setSending]    = useState(false);
  const [sendError,  setSendError]  = useState<string | null>(null);
  const [sendOk,     setSendOk]     = useState(false);

  const loadBroadcasts = useCallback(async () => {
    setLoadingList(true);
    setListError(null);
    try {
      const data = await getBroadcastsAdmin();
      setBroadcasts(data);
    } catch (err: unknown) {
      setListError(err instanceof Error ? err.message : "Erreur de chargement.");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => { void loadBroadcasts(); }, [loadBroadcasts]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    setSendError(null);
    setSendOk(false);
    try {
      await sendBroadcast(title.trim(), message.trim(), targetRole);
      setTitle("");
      setMessage("");
      setTargetRole("All");
      setSendOk(true);
      setTimeout(() => setSendOk(false), 4000);
      void loadBroadcasts();
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : "Erreur envoi.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-8 text-white">
      {/* Header */}
      <div className="rounded-3xl border border-white/[0.07] bg-gradient-to-br from-white/[0.04] to-transparent p-6">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-amber-400">
          <Bell className="h-3 w-3" />
          Administration
        </div>
        <h1 className="text-2xl font-black">Centre de notifications</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Envoyez des messages broadcast aux utilisateurs de la plateforme.
        </p>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr_1.2fr]">
        {/* Send form */}
        <div className="rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6">
          <div className="mb-6 flex items-center gap-2">
            <Send className="h-5 w-5 text-amber-400" />
            <h2 className="font-bold">Envoyer une notification</h2>
          </div>

          <form onSubmit={handleSend} className="space-y-5">
            {/* Target */}
            <div>
              <label className="mb-3 block text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                Destinataires
              </label>
              <div className="space-y-2">
                {TARGET_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const selected = targetRole === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTargetRole(opt.value)}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                        selected
                          ? opt.cls
                          : "border-white/[0.07] bg-white/[0.02] text-zinc-400 hover:border-white/[0.12] hover:text-zinc-300"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {opt.label}
                      {selected && (
                        <span className="ml-auto h-2 w-2 rounded-full bg-current" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                Titre <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder="Ex : Nouvelle fonctionnalité disponible"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
              />
            </div>

            {/* Message */}
            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                Message <span className="text-red-400">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                maxLength={1000}
                placeholder="Rédigez votre message ici…"
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
              />
              <p className="mt-1 text-right text-[11px] text-zinc-600">
                {message.length}/1000
              </p>
            </div>

            {sendError && (
              <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {sendError}
              </p>
            )}

            {sendOk && (
              <p className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                Notification envoyée avec succès.
              </p>
            )}

            <button
              type="submit"
              disabled={sending || !title.trim() || !message.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 py-3 text-sm font-bold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {sending ? "Envoi en cours…" : "Envoyer la notification"}
            </button>
          </form>
        </div>

        {/* History */}
        <div className="rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-400" />
              <h2 className="font-bold">Historique des envois</h2>
            </div>
            <button
              type="button"
              onClick={loadBroadcasts}
              disabled={loadingList}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-400 transition hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${loadingList ? "animate-spin" : ""}`} />
              Actualiser
            </button>
          </div>

          {loadingList ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/[0.04]" />
              ))}
            </div>
          ) : listError ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {listError}
            </div>
          ) : broadcasts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/[0.07] py-14 text-center">
              <Bell className="mx-auto h-10 w-10 text-zinc-700" />
              <p className="mt-4 text-sm font-semibold text-zinc-500">
                Aucune notification envoyée pour l'instant.
              </p>
            </div>
          ) : (
            <div className="max-h-[600px] space-y-3 overflow-y-auto pr-1">
              {broadcasts.map((b) => (
                <BroadcastCard key={b.id} broadcast={b} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
