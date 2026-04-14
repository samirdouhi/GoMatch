"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getMyCommerce,
  getHoraires,
  createHoraire,
  updateHoraire,
  deleteHoraire,
  type HoraireCommerce,
} from "@/lib/commercesApi";
import { Clock, Save, Trash2, Plus, CheckCircle2, AlertCircle } from "lucide-react";

const JOURS: { label: string; value: number }[] = [
  { label: "Lundi",    value: 1 },
  { label: "Mardi",    value: 2 },
  { label: "Mercredi", value: 3 },
  { label: "Jeudi",    value: 4 },
  { label: "Vendredi", value: 5 },
  { label: "Samedi",   value: 6 },
  { label: "Dimanche", value: 0 },
];

type RowState = {
  horaireId: string | null;   // null = pas encore créé
  estFerme: boolean;
  heureOuverture: string;     // "HH:mm"
  heureFermeture: string;
  dirty: boolean;
  saving: boolean;
  saved: boolean;
};

function toTimeSpan(hhmm: string): string {
  return hhmm.length === 5 ? `${hhmm}:00` : hhmm;
}

function fromTimeSpan(ts: string): string {
  return ts ? ts.slice(0, 5) : "09:00";
}

export default function HorairesPage() {
  const router = useRouter();
  const [commerceId, setCommerceId] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<number, RowState>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalMsg, setGlobalMsg] = useState<string | null>(null);

  // ── Chargement ───────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const commerce = await getMyCommerce();
        if (!mounted) return;
        if (!commerce) { router.replace("/commercant/create-commerce"); return; }

        setCommerceId(commerce.id);

        const horaires = await getHoraires(commerce.id);
        if (!mounted) return;

        // Initialiser les lignes avec les valeurs existantes ou des defaults
        const initial: Record<number, RowState> = {};
        for (const jour of JOURS) {
          const existing = horaires.find((h) => h.jourSemaine === jour.value);
          initial[jour.value] = {
            horaireId:     existing?.id ?? null,
            estFerme:      existing?.estFerme ?? false,
            heureOuverture: existing ? fromTimeSpan(existing.heureOuverture) : "09:00",
            heureFermeture: existing ? fromTimeSpan(existing.heureFermeture) : "18:00",
            dirty:  false,
            saving: false,
            saved:  false,
          };
        }
        setRows(initial);
      } catch (err: unknown) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Erreur chargement.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => { mounted = false; };
  }, [router]);

  // ── Mise à jour d'une ligne ───────────────────────────────────────────────────
  function updateRow(jourValue: number, patch: Partial<RowState>) {
    setRows((prev) => ({
      ...prev,
      [jourValue]: { ...prev[jourValue], ...patch, dirty: true, saved: false },
    }));
  }

  // ── Sauvegarde d'une ligne ────────────────────────────────────────────────────
  async function saveRow(jourValue: number) {
    if (!commerceId) return;
    const row = rows[jourValue];
    if (!row) return;

    setRows((prev) => ({ ...prev, [jourValue]: { ...prev[jourValue], saving: true } }));

    try {
      const dto = {
        jourSemaine:    jourValue,
        heureOuverture: toTimeSpan(row.heureOuverture),
        heureFermeture: toTimeSpan(row.heureFermeture),
        estFerme:       row.estFerme,
      };

      let saved: HoraireCommerce;
      if (row.horaireId) {
        saved = await updateHoraire(commerceId, row.horaireId, dto);
      } else {
        saved = await createHoraire(commerceId, dto);
      }

      setRows((prev) => ({
        ...prev,
        [jourValue]: {
          ...prev[jourValue],
          horaireId: saved.id,
          dirty:  false,
          saving: false,
          saved:  true,
        },
      }));
    } catch (err: unknown) {
      setRows((prev) => ({ ...prev, [jourValue]: { ...prev[jourValue], saving: false } }));
      setGlobalMsg(err instanceof Error ? err.message : "Erreur sauvegarde.");
    }
  }

  // ── Suppression d'une ligne ───────────────────────────────────────────────────
  async function deleteRow(jourValue: number) {
    if (!commerceId) return;
    const row = rows[jourValue];
    if (!row?.horaireId) return;

    setRows((prev) => ({ ...prev, [jourValue]: { ...prev[jourValue], saving: true } }));
    try {
      await deleteHoraire(commerceId, row.horaireId);
      setRows((prev) => ({
        ...prev,
        [jourValue]: {
          ...prev[jourValue],
          horaireId:     null,
          estFerme:      false,
          heureOuverture: "09:00",
          heureFermeture: "18:00",
          dirty:  false,
          saving: false,
          saved:  false,
        },
      }));
    } catch (err: unknown) {
      setRows((prev) => ({ ...prev, [jourValue]: { ...prev[jourValue], saving: false } }));
      setGlobalMsg(err instanceof Error ? err.message : "Erreur suppression.");
    }
  }

  // ── Tout sauvegarder ─────────────────────────────────────────────────────────
  async function saveAll() {
    for (const jour of JOURS) {
      const row = rows[jour.value];
      if (row?.dirty) await saveRow(jour.value);
    }
    setGlobalMsg("Tous les horaires ont été sauvegardés.");
    setTimeout(() => setGlobalMsg(null), 3000);
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-3xl bg-white/[0.04]" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
        {error}
      </div>
    );
  }

  const hasDirty = Object.values(rows).some((r) => r.dirty);

  return (
    <div className="space-y-6 text-white">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-400" />
            <h1 className="text-2xl font-black">Horaires d'ouverture</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Configurez vos heures d'ouverture jour par jour. Les modifications sont visibles par les touristes.
          </p>
        </div>

        <button
          type="button"
          onClick={saveAll}
          disabled={!hasDirty}
          className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Save className="h-4 w-4" />
          Tout sauvegarder
        </button>
      </div>

      {/* Message global */}
      {globalMsg && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {globalMsg}
        </div>
      )}

      {/* Lignes */}
      <div className="overflow-hidden rounded-3xl border border-white/[0.07]">
        <div className="divide-y divide-white/[0.05]">
          {JOURS.map((jour) => {
            const row = rows[jour.value];
            if (!row) return null;

            return (
              <div
                key={jour.value}
                className="flex flex-col gap-4 bg-white/[0.02] px-5 py-4 sm:flex-row sm:items-center"
              >
                {/* Jour */}
                <div className="w-28 shrink-0">
                  <p className="font-bold text-white">{jour.label}</p>
                  {row.horaireId && !row.dirty && (
                    <p className="text-[10px] text-zinc-600">enregistré</p>
                  )}
                  {row.dirty && (
                    <p className="text-[10px] text-amber-500">modifié</p>
                  )}
                  {row.saved && (
                    <p className="text-[10px] text-emerald-500">sauvegardé</p>
                  )}
                </div>

                {/* Toggle ouvert/fermé */}
                <button
                  type="button"
                  onClick={() => updateRow(jour.value, { estFerme: !row.estFerme })}
                  className={`flex h-8 items-center gap-2 rounded-xl px-3 text-xs font-bold transition ${
                    row.estFerme
                      ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/30"
                      : "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
                  }`}
                >
                  {row.estFerme ? "Fermé" : "Ouvert"}
                </button>

                {/* Heures */}
                <div
                  className={`flex flex-1 items-center gap-3 transition-opacity ${
                    row.estFerme ? "pointer-events-none opacity-30" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-zinc-500">De</label>
                    <input
                      type="time"
                      value={row.heureOuverture}
                      onChange={(e) => updateRow(jour.value, { heureOuverture: e.target.value })}
                      className="rounded-xl border border-white/[0.07] bg-black/30 px-3 py-2 text-sm text-white focus:border-orange-500/40 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-zinc-500">À</label>
                    <input
                      type="time"
                      value={row.heureFermeture}
                      onChange={(e) => updateRow(jour.value, { heureFermeture: e.target.value })}
                      className="rounded-xl border border-white/[0.07] bg-black/30 px-3 py-2 text-sm text-white focus:border-orange-500/40 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => saveRow(jour.value)}
                    disabled={!row.dirty || row.saving}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-500/30 bg-orange-500/10 text-orange-400 transition hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-30"
                    title="Sauvegarder ce jour"
                  >
                    {row.saving ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </button>

                  {row.horaireId && (
                    <button
                      type="button"
                      onClick={() => deleteRow(jour.value)}
                      disabled={row.saving}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 transition hover:bg-red-500/20 disabled:opacity-30"
                      title="Supprimer cet horaire"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Légende */}
      <p className="text-xs text-zinc-600">
        Cliquez sur <strong className="text-zinc-400">Ouvert / Fermé</strong> pour basculer le statut du jour.
        Sauvegardez chaque ligne individuellement ou utilisez <strong className="text-zinc-400">Tout sauvegarder</strong> pour appliquer toutes les modifications en attente.
      </p>
    </div>
  );
}
