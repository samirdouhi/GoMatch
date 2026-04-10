"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  getPendingCommercants,
  getCommercantDetail,
  type AdminCommercantItem,
  type AdminCommercantDetail,
} from "@/lib/adminProfileApi";
import {
  Store,

  MapPin,
  Phone,
  Mail,
  Briefcase,
  CalendarDays,
  ChevronRight,
  Search,
  ShieldCheck,
} from "lucide-react";

type PendingCommercantRow = {
  id: string;
  userId: string;
  status: string;
  reviewedAt: string | null;
  rejectionReason: string;
  detail: AdminCommercantDetail | null;
};

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("fr-FR");
}

function formatSimple(value?: string | null) {
  return value && value.trim() ? value : "-";
}

function getInitials(prenom?: string, nom?: string) {
  const a = prenom?.trim()?.charAt(0)?.toUpperCase() || "";
  const b = nom?.trim()?.charAt(0)?.toUpperCase() || "";
  return `${a}${b}` || "GM";
}

function getStatusClasses(status?: string) {
  const normalized = (status || "").toLowerCase();

  if (normalized === "approved") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  }

  if (normalized === "rejected") {
    return "border-red-500/20 bg-red-500/10 text-red-300";
  }

  if (normalized === "pending") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-300";
  }

  return "border-white/10 bg-white/[0.04] text-zinc-300";
}

export default function AdminCommercantsPage() {
  const [rows, setRows] = useState<PendingCommercantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const pendingItems = await getPendingCommercants();

        const enrichedRows = await Promise.all(
          pendingItems.map(async (item: AdminCommercantItem) => {
            try {
              const detail = await getCommercantDetail(item.id);

              return {
                id: item.id,
                userId: item.userId,
                status: item.status,
                reviewedAt: item.reviewedAt,
                rejectionReason: item.rejectionReason,
                detail,
              } satisfies PendingCommercantRow;
            } catch {
              return {
                id: item.id,
                userId: item.userId,
                status: item.status,
                reviewedAt: item.reviewedAt,
                rejectionReason: item.rejectionReason,
                detail: null,
              } satisfies PendingCommercantRow;
            }
          })
        );

        if (!mounted) return;
        setRows(enrichedRows);
      } catch (err) {
        if (!mounted) return;
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de charger les demandes commerçants."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((row) => {
      const fullName =
        `${row.detail?.userProfile?.prenom ?? ""} ${row.detail?.userProfile?.nom ?? ""}`.toLowerCase();
      const ville = (row.detail?.ville ?? "").toLowerCase();
      const activite = (row.detail?.typeActivite ?? "").toLowerCase();
      const emailPro = (row.detail?.emailProfessionnel ?? "").toLowerCase();
      const telephone = (row.detail?.telephone ?? "").toLowerCase();
      const responsable = (row.detail?.nomResponsable ?? "").toLowerCase();
      const userId = row.userId.toLowerCase();

      return (
        fullName.includes(term) ||
        ville.includes(term) ||
        activite.includes(term) ||
        emailPro.includes(term) ||
        telephone.includes(term) ||
        responsable.includes(term) ||
        userId.includes(term)
      );
    });
  }, [rows, search]);

  return (
    <div className="space-y-8 text-white">
      <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 lg:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-2">
              <ShieldCheck className="h-4 w-4 text-amber-400" />
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-amber-400">
                Admin
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-black uppercase italic tracking-tight">
              Demandes commerçants
            </h1>

            <p className="mt-3 max-w-2xl text-sm text-zinc-400">
              Liste des profils commerçants en attente de validation avec les
              informations utiles pour l’analyse rapide du dossier.
            </p>
          </div>

          <div className="w-full xl:max-w-md">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <Search className="h-4 w-4 text-zinc-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom, ville, activité, email..."
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
              />
            </div>
          </div>
        </div>
      </section>

      {loading && (
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 text-zinc-300">
          Chargement des demandes commerçants...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-[28px] border border-red-500/20 bg-red-500/10 p-6 text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && filteredRows.length === 0 && (
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-8 text-center">
          <p className="text-lg font-semibold text-white">
            Aucune demande trouvée
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            Il n’y a actuellement aucune demande en attente correspondant à la
            recherche.
          </p>
        </div>
      )}

      {!loading && !error && filteredRows.length > 0 && (
        <div className="grid gap-6">
          {filteredRows.map((row) => {
            const detail = row.detail;
            const prenom = detail?.userProfile?.prenom ?? "";
            const nom = detail?.userProfile?.nom ?? "";
            const fullName = `${prenom} ${nom}`.trim() || "Utilisateur inconnu";

            return (
              <article
                key={row.id}
                className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 transition hover:border-amber-500/20 hover:bg-white/[0.04]"
              >
                <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex min-w-0 flex-1 gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/20 text-lg font-black text-white">
                      {getInitials(prenom, nom)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-black tracking-tight text-white">
                          {fullName}
                        </h2>

                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${getStatusClasses(
                            row.status
                          )}`}
                        >
                          {formatSimple(row.status)}
                        </span>
                      </div>

                      <p className="mt-2 break-all text-sm text-zinc-500">
                        UserId : {row.userId}
                      </p>

                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
                          <Store className="h-4 w-4 text-amber-400" />
                          <span>{formatSimple(detail?.nomResponsable)}</span>
                        </div>

                        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
                          <MapPin className="h-4 w-4 text-amber-400" />
                          <span>{formatSimple(detail?.ville)}</span>
                        </div>

                        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
                          <Briefcase className="h-4 w-4 text-amber-400" />
                          <span>{formatSimple(detail?.typeActivite)}</span>
                        </div>

                        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
                          <Phone className="h-4 w-4 text-amber-400" />
                          <span>{formatSimple(detail?.telephone)}</span>
                        </div>

                        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300 md:col-span-2 xl:col-span-1">
                          <Mail className="h-4 w-4 text-amber-400" />
                          <span className="truncate">
                            {formatSimple(detail?.emailProfessionnel)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
                          <CalendarDays className="h-4 w-4 text-amber-400" />
                          <span>{formatDateTime(detail?.submittedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-3 xl:w-[220px]">
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                        Review date
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {formatDateTime(row.reviewedAt)}
                      </p>
                    </div>

                    <Link
                      href={`/admin/commercants/${row.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 px-5 py-3 text-sm font-black uppercase tracking-[0.15em] text-black transition hover:opacity-90"
                    >
                      Voir détail
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}