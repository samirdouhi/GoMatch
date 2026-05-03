"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  BarChart3, RefreshCw, Building2, Users, CheckCircle2,
  AlertTriangle, XCircle, TrendingUp, Filter,
} from "lucide-react";
import { getAllCommercesAdmin, type Commerce } from "@/lib/commercesApi";
import { getUsersAdmin, type AdminUserItem } from "@/lib/adminApi";

function monthKey(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "?";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  if (key === "?") return key;
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1);
  return new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" }).format(d);
}

function buildTimeline(commerces: Commerce[], users: AdminUserItem[]) {
  const keys = new Set<string>();
  commerces.forEach((c) => keys.add(monthKey(c.dateCreation)));
  users.forEach((u) => keys.add(monthKey(u.createdAt)));

  return [...keys]
    .filter((k) => k !== "?")
    .sort()
    .map((k) => ({
      mois: monthLabel(k),
      Commerces: commerces.filter((c) => monthKey(c.dateCreation) === k).length,
      Utilisateurs: users.filter((u) => monthKey(u.createdAt) === k).length,
    }));
}

const TOOLTIP_STYLE = {
  backgroundColor: "#0d0f14",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  color: "#e4e4e7",
  fontSize: 12,
};

const STATUS_COLORS: Record<string, string> = {
  EnAttente: "#f59e0b",
  Approuve:  "#10b981",
  Rejete:    "#ef4444",
};

const TYPE_COLORS: Record<string, string> = {
  Touriste:   "#3b82f6",
  Commercant: "#f97316",
  Admin:      "#a78bfa",
  Aucun:      "#52525b",
};

function KpiCard({ icon: Icon, label, value, cls }: {
  icon: React.ElementType; label: string; value: number; cls: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
      <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${cls}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{label}</p>
    </div>
  );
}

export default function AdminStatistiquesPage() {
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [users,     setUsers]     = useState<AdminUserItem[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, u] = await Promise.all([getAllCommercesAdmin(), getUsersAdmin()]);
      setCommerces(c);
      setUsers(u);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const statusData = [
    { name: "En attente", count: commerces.filter((c) => c.statut === "EnAttente").length, fill: STATUS_COLORS.EnAttente },
    { name: "Approuvés",  count: commerces.filter((c) => c.statut === "Approuve").length,  fill: STATUS_COLORS.Approuve  },
    { name: "Rejetés",    count: commerces.filter((c) => c.statut === "Rejete").length,    fill: STATUS_COLORS.Rejete    },
  ];

  const typeData = (["Touriste", "Commercant", "Admin", "Aucun"] as const).map((t) => ({
    name:  t === "Aucun" ? "Sans profil" : t === "Commercant" ? "Commerçant" : t,
    value: users.filter((u) => u.profileType === t).length,
    fill:  TYPE_COLORS[t],
  })).filter((d) => d.value > 0);

  const timeline = buildTimeline(commerces, users);

  if (loading) {
    return (
      <div className="space-y-6 text-white">
        <div className="h-24 animate-pulse rounded-3xl bg-white/[0.04]" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[1,2,3,4].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/[0.04]" />)}
        </div>
        <div className="h-72 animate-pulse rounded-3xl bg-white/[0.04]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">
      {/* Header */}
      <div className="rounded-3xl border border-white/[0.07] bg-gradient-to-br from-white/[0.04] to-transparent p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-amber-400">
              <Filter className="h-3 w-3" />
              Administration
            </div>
            <h1 className="text-2xl font-black">Statistiques de la plateforme</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Vue d'ensemble des inscriptions et de l'activité commerciale.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 self-start rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard icon={Building2}   label="Total commerces"   value={commerces.length}                                          cls="bg-amber-500/15 text-amber-400" />
        <KpiCard icon={CheckCircle2} label="Commerces approuvés" value={commerces.filter((c) => c.statut === "Approuve").length} cls="bg-emerald-500/15 text-emerald-400" />
        <KpiCard icon={AlertTriangle} label="En attente"       value={commerces.filter((c) => c.statut === "EnAttente").length} cls="bg-yellow-500/15 text-yellow-400" />
        <KpiCard icon={Users}        label="Utilisateurs"      value={users.length}                                             cls="bg-blue-500/15 text-blue-400" />
      </div>

      {/* Timeline chart */}
      {timeline.length > 0 && (
        <div className="rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6">
          <div className="mb-5 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-400" />
            <h2 className="font-bold">Inscriptions par mois</h2>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={timeline} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCommerces" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="mois" tick={{ fill: "#52525b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#52525b", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: "rgba(255,255,255,0.05)" }} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Area type="monotone" dataKey="Utilisateurs" stroke="#3b82f6" strokeWidth={2} fill="url(#gradUsers)" dot={false} />
              <Area type="monotone" dataKey="Commerces"    stroke="#f59e0b" strokeWidth={2} fill="url(#gradCommerces)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Commerce by status bar chart */}
        <div className="rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6">
          <div className="mb-5 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-amber-400" />
            <h2 className="font-bold">Commerces par statut</h2>
          </div>
          {commerces.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-zinc-600">
              Aucune donnée disponible
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} name="Commerces">
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* User type pie chart */}
        <div className="rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6">
          <div className="mb-5 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-400" />
            <h2 className="font-bold">Répartition des utilisateurs</h2>
          </div>
          {typeData.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-zinc-600">
              Aucune donnée disponible
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {typeData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend
                  formatter={(value: string) => <span style={{ color: "#a1a1aa", fontSize: 12 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Rejected reasons (only if > 0) */}
      {commerces.filter((c) => c.statut === "Rejete").length > 0 && (
        <div className="rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6">
          <div className="mb-5 flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-400" />
            <h2 className="font-bold">Commerces rejetés récents</h2>
          </div>
          <div className="space-y-3">
            {commerces
              .filter((c) => c.statut === "Rejete")
              .slice(0, 5)
              .map((c) => (
                <div key={c.id} className="flex items-start gap-3 rounded-2xl border border-red-500/10 bg-red-500/5 px-4 py-3">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <div>
                    <p className="text-sm font-semibold text-white">{c.nom}</p>
                    {c.raisonRejet && (
                      <p className="mt-0.5 text-xs text-red-300/70">{c.raisonRejet}</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-5 py-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-zinc-600" />
          <p className="text-xs text-zinc-600">
            Données calculées en temps réel depuis les services Business et Profile.
          </p>
        </div>
      </div>
    </div>
  );
}
