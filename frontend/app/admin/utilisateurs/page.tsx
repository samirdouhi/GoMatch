"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Users,
  Search,
  RefreshCw,
  UserCheck,
  UserX,
  ShieldCheck,
  Store,
  Globe,
  User2,
  Filter,
  Calendar,
} from "lucide-react";
import { getUsersAdmin, toggleUserActive, type AdminUserItem } from "@/lib/adminApi";

type TabKey = "tous" | "Touriste" | "Commercant" | "Admin" | "Aucun";

const TABS: { key: TabKey; label: string }[] = [
  { key: "tous",       label: "Tous" },
  { key: "Touriste",   label: "Touristes" },
  { key: "Commercant", label: "Commerçants" },
  { key: "Admin",      label: "Admins" },
  { key: "Aucun",      label: "Sans profil" },
];

const TYPE_ICON: Record<string, React.ElementType> = {
  Admin:      ShieldCheck,
  Commercant: Store,
  Touriste:   Globe,
  Aucun:      User2,
};

const TYPE_CLS: Record<string, string> = {
  Admin:      "border-amber-500/30 bg-amber-500/10 text-amber-300",
  Commercant: "border-orange-500/30 bg-orange-500/10 text-orange-300",
  Touriste:   "border-blue-500/30 bg-blue-500/10 text-blue-300",
  Aucun:      "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
};

function ProfileTypeBadge({ type }: { type: string }) {
  const Icon = TYPE_ICON[type] ?? User2;
  const cls  = TYPE_CLS[type]  ?? TYPE_CLS["Aucun"];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${cls}`}>
      <Icon className="h-3 w-3" />
      {type}
    </span>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(d);
}

function UserRow({
  user,
  onToggle,
  toggling,
}: {
  user: AdminUserItem;
  onToggle: (id: string) => void;
  toggling: string | null;
}) {
  const isToggling = toggling === user.userId;
  const name = [user.prenom, user.nom].filter(Boolean).join(" ") || "—";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-5 py-4 sm:flex-row sm:items-center sm:justify-between transition hover:border-white/[0.12]">
      <div className="flex items-center gap-4 min-w-0">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-black ${
          user.isActive ? "bg-emerald-500/15 text-emerald-300" : "bg-zinc-800 text-zinc-500"
        }`}>
          {(user.prenom?.[0] ?? user.nom?.[0] ?? "?").toUpperCase()}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-white truncate">{name}</span>
            <ProfileTypeBadge type={user.profileType} />
            {!user.isActive && (
              <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-red-400">
                Désactivé
              </span>
            )}
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500">
            <Calendar className="h-3 w-3" />
            Inscrit le {formatDate(user.createdAt)}
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-zinc-700 truncate">{user.userId}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onToggle(user.userId)}
        disabled={isToggling}
        className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition disabled:opacity-50 ${
          user.isActive
            ? "border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
            : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
        }`}
      >
        {isToggling ? (
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        ) : user.isActive ? (
          <UserX className="h-3.5 w-3.5" />
        ) : (
          <UserCheck className="h-3.5 w-3.5" />
        )}
        {isToggling ? "..." : user.isActive ? "Désactiver" : "Activer"}
      </button>
    </div>
  );
}

export default function AdminUtilisateursPage() {
  const [users,    setUsers]    = useState<AdminUserItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [tab,      setTab]      = useState<TabKey>("tous");
  const [search,   setSearch]   = useState("");
  const [toggling, setToggling] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUsersAdmin();
      setUsers(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  }

  async function handleToggle(userId: string) {
    setToggling(userId);
    try {
      await toggleUserActive(userId);
      setUsers((prev) =>
        prev.map((u) => u.userId === userId ? { ...u, isActive: !u.isActive } : u)
      );
      showToast("Statut de l'utilisateur mis à jour.");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erreur toggle.");
    } finally {
      setToggling(null);
    }
  }

  const counts = {
    tous:       users.length,
    Touriste:   users.filter((u) => u.profileType === "Touriste").length,
    Commercant: users.filter((u) => u.profileType === "Commercant").length,
    Admin:      users.filter((u) => u.profileType === "Admin").length,
    Aucun:      users.filter((u) => u.profileType === "Aucun").length,
  };

  const filtered = users.filter((u) => {
    const matchTab = tab === "tous" || u.profileType === tab;
    const q = search.toLowerCase();
    const name = `${u.prenom ?? ""} ${u.nom ?? ""}`.toLowerCase();
    const matchSearch = !q || name.includes(q) || u.userId.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const activeCount   = users.filter((u) => u.isActive).length;
  const inactiveCount = users.length - activeCount;

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
            <h1 className="text-2xl font-black">Gestion des utilisateurs</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Consultez et gérez les comptes utilisateurs de la plateforme.
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

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total",       value: users.length,   icon: Users,     cls: "bg-blue-500/15 text-blue-400" },
          { label: "Actifs",      value: activeCount,    icon: UserCheck, cls: "bg-emerald-500/15 text-emerald-400" },
          { label: "Désactivés",  value: inactiveCount,  icon: UserX,     cls: "bg-red-500/15 text-red-400" },
          { label: "Commerçants", value: counts.Commercant, icon: Store,  cls: "bg-orange-500/15 text-orange-400" },
        ].map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
            <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${cls}`}>
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-black text-white">{value}</p>
            <p className="mt-1 text-xs text-zinc-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                tab === t.key
                  ? "bg-white/10 text-white shadow"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t.label}
              <span className="rounded-full border border-white/10 px-1.5 py-0.5 text-[10px] font-black text-zinc-600">
                {counts[t.key]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un utilisateur..."
            className="w-full rounded-2xl border border-white/[0.07] bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500/40 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
          />
        </div>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {toastMsg}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/[0.04]" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/[0.07] py-16 text-center">
          <Users className="mx-auto h-10 w-10 text-zinc-700" />
          <p className="mt-4 text-sm font-semibold text-zinc-500">
            {search ? "Aucun résultat pour cette recherche." : "Aucun utilisateur dans cette catégorie."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((u) => (
            <UserRow key={u.userId} user={u} onToggle={handleToggle} toggling={toggling} />
          ))}
        </div>
      )}
    </div>
  );
}
