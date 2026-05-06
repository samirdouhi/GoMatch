"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MapPin,
  Tag,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  User,
  Mail,
  Calendar,
  Filter,
} from "lucide-react";
import {
  getAllCommercesAdmin,
  validateCommerce,
  rejectCommerce,
  desactiverCommerce,
  reactiverCommerce,
  photoUrl,
  type Commerce,
} from "@/lib/commercesApi";
import { PowerOff, Power } from "lucide-react";

const JOURS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
function formatHeure(v: string) { return v ? v.slice(0, 5) : "--:--"; }

type TabKey = "tous" | "EnAttente" | "Approuve" | "Rejete";

const TABS: { key: TabKey; label: string; color: string }[] = [
  { key: "tous", label: "Tous", color: "text-zinc-300" },
  { key: "EnAttente", label: "En attente", color: "text-amber-400" },
  { key: "Approuve", label: "Approuvés", color: "text-emerald-400" },
  { key: "Rejete", label: "Rejetés", color: "text-red-400" },
];

function StatutBadge({ statut }: { statut: string }) {
  const MAP: Record<
    string,
    { icon: React.ElementType; label: string; cls: string }
  > = {
    EnAttente: {
      icon: AlertTriangle,
      label: "En attente",
      cls: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    },
    Approuve: {
      icon: CheckCircle2,
      label: "Approuvé",
      cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    },
    Rejete: {
      icon: XCircle,
      label: "Rejeté",
      cls: "border-red-500/30 bg-red-500/10 text-red-300",
    },
  };

  const cfg = MAP[statut] ?? MAP["EnAttente"];
  const Icon = cfg.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${cfg.cls}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {cfg.label}
    </span>
  );
}

function RejectModal({
  commerce,
  onClose,
  onConfirm,
  loading,
}: {
  commerce: Commerce;
  onClose: () => void;
  onConfirm: (raison: string) => void;
  loading: boolean;
}) {
  const [raison, setRaison] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-red-500/20 bg-[#0d0f14] p-6 shadow-2xl">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15">
            <XCircle className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-bold text-white">Rejeter le commerce</h3>
            <p className="mt-0.5 text-xs text-zinc-500">{commerce.nom}</p>
          </div>
        </div>

        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
          Raison du rejet <span className="text-red-400">*</span>
        </label>

        <textarea
          value={raison}
          onChange={(e) => setRaison(e.target.value)}
          rows={4}
          maxLength={500}
          placeholder="Expliquez pourquoi la demande est refusée."
          className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/30"
        />

        <p className="mt-1 text-[11px] text-zinc-600">
          {raison.length}/500 caractères
        </p>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-white/10 disabled:opacity-50"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={() => onConfirm(raison.trim())}
            disabled={loading || raison.trim().length === 0}
            className="flex-1 rounded-2xl bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-40"
          >
            {loading ? "Rejet en cours…" : "Confirmer le rejet"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CommerceCard({
  commerce,
  onValidate,
  onReject,
  onToggleActif,
  actionLoading,
}: {
  commerce: Commerce;
  onValidate: (id: string) => void;
  onReject: (c: Commerce) => void;
  onToggleActif: (c: Commerce) => void;
  actionLoading: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLoading = actionLoading === commerce.id;

  function formatDate(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;

    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.03] transition hover:border-white/[0.12]">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
            <Building2 className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={`font-bold ${commerce.estActif === false ? "text-zinc-500 line-through" : "text-white"}`}>
                {commerce.nom}
              </h3>
              <StatutBadge statut={commerce.statut} />
              {commerce.estActif === false && (
                <span className="inline-flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-400">
                  <PowerOff className="h-2.5 w-2.5" />
                  Désactivé
                </span>
              )}
            </div>

            <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
              <Tag className="h-3 w-3" />
              {commerce.nomCategorie ?? "Catégorie non définie"}
            </p>

            <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-600">
              <MapPin className="h-3 w-3" />
              {commerce.adresse}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-white/10"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                Réduire
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                Détails
              </>
            )}
          </button>

          {commerce.statut === "EnAttente" && (
            <>
              <button
                type="button"
                onClick={() => onValidate(commerce.id)}
                disabled={isLoading}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {isLoading ? "..." : "Approuver"}
              </button>

              <button
                type="button"
                onClick={() => onReject(commerce)}
                disabled={isLoading}
                className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                <XCircle className="h-3.5 w-3.5" />
                Rejeter
              </button>
            </>
          )}

          {commerce.statut === "Approuve" && (
            <button
              type="button"
              onClick={() => onToggleActif(commerce)}
              disabled={isLoading}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white transition disabled:opacity-50 ${
                commerce.estActif
                  ? "bg-orange-600 hover:bg-orange-500"
                  : "bg-emerald-700 hover:bg-emerald-600"
              }`}
            >
              {commerce.estActif ? (
                <><PowerOff className="h-3.5 w-3.5" />{isLoading ? "..." : "Désactiver"}</>
              ) : (
                <><Power className="h-3.5 w-3.5" />{isLoading ? "..." : "Réactiver"}</>
              )}
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/[0.06] bg-black/20 px-5 py-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
                <User className="h-3 w-3" />
                Propriétaire ID
              </p>
              <p className="break-all font-mono text-xs text-zinc-300">
                {commerce.proprietaireUtilisateurId}
              </p>
            </div>

            <div className="space-y-1">
              <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
                <Mail className="h-3 w-3" />
                Email propriétaire
              </p>
              <p className="text-xs text-zinc-300">
                {commerce.proprietaireEmail || (
                  <span className="italic text-zinc-600">Non disponible</span>
                )}
              </p>
            </div>

            <div className="space-y-1">
              <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
                <Calendar className="h-3 w-3" />
                Date de création
              </p>
              <p className="text-xs text-zinc-300">
                {formatDate(commerce.dateCreation)}
              </p>
            </div>

            <div className="space-y-1 sm:col-span-2 lg:col-span-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
                Description
              </p>
              <p className="whitespace-pre-line text-xs leading-5 text-zinc-400">
                {commerce.description}
              </p>
            </div>

            {commerce.statut === "Rejete" && commerce.raisonRejet && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 sm:col-span-2 lg:col-span-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red-500/70">
                  Raison du rejet
                </p>
                <p className="mt-1 text-xs text-red-300">
                  {commerce.raisonRejet}
                </p>
              </div>
            )}
          </div>

          {/* Photos */}
          {commerce.photos && commerce.photos.length > 0 && (
            <div className="mt-5">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
                Photos ({commerce.photos.length})
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {commerce.photos.map((photo) => (
                  <div key={photo.id} className="relative aspect-square overflow-hidden rounded-xl bg-zinc-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoUrl(photo.urlImage)}
                      alt={photo.nomFichier}
                      className="h-full w-full object-cover"
                    />
                    {photo.ordre === 0 && (
                      <span className="absolute bottom-1 left-1 rounded-md bg-orange-500/80 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        Principale
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Horaires */}
          {commerce.horaires && commerce.horaires.length > 0 && (
            <div className="mt-5">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
                Horaires d'ouverture
              </p>
              <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
                <div className="divide-y divide-white/[0.04]">
                  {[...commerce.horaires]
                    .sort((a, b) => a.jourSemaine - b.jourSemaine)
                    .map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center justify-between px-4 py-2.5 text-xs"
                      >
                        <span className="font-medium text-zinc-300">
                          {JOURS[h.jourSemaine] ?? `Jour ${h.jourSemaine}`}
                        </span>
                        <span className={`font-semibold ${h.estFerme ? "text-red-400" : "text-emerald-300"}`}>
                          {h.estFerme
                            ? "Fermé"
                            : `${formatHeure(h.heureOuverture)} → ${formatHeure(h.heureFermeture)}`}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminCommercesPage() {
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("EnAttente");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Commerce | null>(null);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [toggleActifLoading, setToggleActifLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getAllCommercesAdmin();
      setCommerces(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts: Record<TabKey, number> = {
    tous: commerces.length,
    EnAttente: commerces.filter((c) => c.statut === "EnAttente").length,
    Approuve: commerces.filter((c) => c.statut === "Approuve").length,
    Rejete: commerces.filter((c) => c.statut === "Rejete").length,
  };

  const filtered = commerces.filter((c) => {
    const matchTab = tab === "tous" || c.statut === tab;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      c.nom.toLowerCase().includes(q) ||
      c.adresse.toLowerCase().includes(q) ||
      (c.nomCategorie ?? "").toLowerCase().includes(q);

    return matchTab && matchSearch;
  });

  async function handleValidate(id: string) {
    setActionError(null);
    setSuccessMessage(null);
    setActionLoading(id);

    try {
      const updated = await validateCommerce(id);
      setCommerces((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setSuccessMessage(
        "Commerce approuvé avec succès. Un email de notification a été envoyé au commerçant."
      );
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Erreur validation.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleToggleActif(commerce: Commerce) {
    setActionError(null);
    setSuccessMessage(null);
    setToggleActifLoading(commerce.id);

    try {
      const updated = commerce.estActif
        ? await desactiverCommerce(commerce.id)
        : await reactiverCommerce(commerce.id);
      setCommerces((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setSuccessMessage(
        commerce.estActif
          ? "Commerce désactivé. Il n'apparaît plus sur les pages touristes."
          : "Commerce réactivé. Il est de nouveau visible."
      );
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Erreur lors de l'opération.");
    } finally {
      setToggleActifLoading(null);
    }
  }

  async function handleRejectConfirm(raison: string) {
    if (!rejectTarget) return;

    setRejectLoading(true);
    setActionError(null);
    setSuccessMessage(null);

    try {
      const updated = await rejectCommerce(rejectTarget.id, raison);
      setCommerces((prev) =>
        prev.map((c) => (c.id === rejectTarget.id ? updated : c))
      );
      setRejectTarget(null);
      setSuccessMessage(
        "Commerce rejeté avec succès. Un email de notification a été envoyé au commerçant."
      );
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Erreur rejet.");
    } finally {
      setRejectLoading(false);
    }
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-3xl border border-white/[0.07] bg-gradient-to-br from-white/[0.04] to-transparent p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-amber-400">
              <Filter className="h-3 w-3" />
              Administration
            </div>
            <h1 className="text-2xl font-black">Gestion des commerces</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Examinez, approuvez ou rejetez les demandes d’ajout de commerce.
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                tab === t.key
                  ? "bg-white/10 text-white shadow"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t.label}
              <span
                className={`rounded-full border border-white/10 px-1.5 py-0.5 text-[10px] font-black ${
                  tab === t.key ? t.color : "text-zinc-600"
                }`}
              >
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
            placeholder="Rechercher un commerce..."
            className="w-full rounded-2xl border border-white/[0.07] bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500/40 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
          />
        </div>
      </div>

      {actionError && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {actionError}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {successMessage}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-3xl bg-white/[0.04]"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/[0.07] py-16 text-center">
          <Building2 className="mx-auto h-10 w-10 text-zinc-700" />
          <p className="mt-4 text-sm font-semibold text-zinc-500">
            {search
              ? "Aucun résultat pour cette recherche."
              : "Aucun commerce dans cette catégorie."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((c) => (
            <CommerceCard
              key={c.id}
              commerce={c}
              onValidate={handleValidate}
              onReject={setRejectTarget}
              onToggleActif={handleToggleActif}
              actionLoading={toggleActifLoading === c.id ? c.id : actionLoading}
            />
          ))}
        </div>
      )}

      {rejectTarget && (
        <RejectModal
          commerce={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleRejectConfirm}
          loading={rejectLoading}
        />
      )}
    </div>
  );
}