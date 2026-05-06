"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getMyCommerces,
  type Commerce,
} from "@/lib/commercesApi";
import {
  Store, Plus, Pencil, Clock, CheckCircle2, AlertTriangle, XCircle,
  MapPin, ArrowRight, Power,
} from "lucide-react";

function StatutBadge({ statut, estActif }: { statut: string; estActif: boolean }) {
  if (statut === "Approuve" && !estActif) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-600/30 bg-zinc-800/50 px-3 py-1 text-xs font-semibold text-zinc-400">
        <Power className="h-3 w-3" />Désactivé
      </span>
    );
  }
  const map = {
    Approuve:  { icon: CheckCircle2,  label: "Validé",     cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" },
    EnAttente: { icon: AlertTriangle, label: "En attente", cls: "border-amber-500/30 bg-amber-500/10 text-amber-300" },
    Rejete:    { icon: XCircle,       label: "Rejeté",     cls: "border-red-500/30 bg-red-500/10 text-red-300" },
  };
  const cfg = map[statut as keyof typeof map] ?? map.EnAttente;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${cfg.cls}`}>
      <Icon className="h-3 w-3" />{cfg.label}
    </span>
  );
}

function CommerceCard({ commerce }: { commerce: Commerce }) {
  const joursOuverts = commerce.horaires.filter((h) => !h.estFerme).length;

  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6 transition-colors hover:border-orange-500/20">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-500/15">
            <Store className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h3 className="font-bold leading-tight text-white">{commerce.nom}</h3>
            <p className="mt-0.5 text-xs text-zinc-500">{commerce.nomCategorie ?? "Sans catégorie"}</p>
          </div>
        </div>
        <StatutBadge statut={commerce.statut} estActif={commerce.estActif} />
      </div>

      {/* Adresse */}
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <MapPin className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{commerce.adresse}</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/[0.05] bg-black/20 p-3 text-center">
          <p className="text-base font-black text-amber-400">
            {commerce.noteGlobale != null ? commerce.noteGlobale.toFixed(1) : "—"}
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-600">Note</p>
        </div>
        <div className="rounded-2xl border border-white/[0.05] bg-black/20 p-3 text-center">
          <p className="text-base font-black text-orange-400">{commerce.nombreAvis}</p>
          <p className="mt-0.5 text-[10px] text-zinc-600">Avis</p>
        </div>
        <div className="rounded-2xl border border-white/[0.05] bg-black/20 p-3 text-center">
          <p className="text-base font-black text-emerald-400">{joursOuverts}/7</p>
          <p className="mt-0.5 text-[10px] text-zinc-600">Jours ouverts</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link
          href={`/commercant/${commerce.id}`}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-2.5 text-sm font-semibold text-orange-300 transition hover:bg-orange-500/20"
        >
          <ArrowRight className="h-4 w-4" />Gérer
        </Link>
        <Link
          href={`/commercant/edit/${commerce.id}`}
          title="Modifier"
          className="flex items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.04] px-3 py-2.5 text-zinc-300 transition hover:bg-white/[0.07]"
        >
          <Pencil className="h-4 w-4" />
        </Link>
        <Link
          href={`/commercant/horaires/${commerce.id}`}
          title="Gérer les horaires"
          className="flex items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.04] px-3 py-2.5 text-zinc-300 transition hover:bg-white/[0.07]"
        >
          <Clock className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export default function CommercantPage() {
  const router = useRouter();
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const data = await getMyCommerces();
        if (!mounted) return;
        setCommerces(data);
      } catch (err: unknown) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Erreur chargement.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-3xl bg-white/[0.04]" />
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

  return (
    <div className="space-y-6 text-white">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Store className="h-6 w-6 text-orange-400" />
          <div>
            <h1 className="text-2xl font-black">Mes commerces</h1>
            <p className="text-sm text-zinc-500">
              {commerces.length === 0
                ? "Aucun commerce enregistré"
                : `${commerces.length} commerce${commerces.length > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push("/commercant/create-commerce")}
          className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-400"
        >
          <Plus className="h-4 w-4" />Nouveau commerce
        </button>
      </div>

      {/* Contenu */}
      {commerces.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/[0.07] py-24 text-center">
          <Store className="mx-auto h-16 w-16 text-zinc-700" />
          <h2 className="mt-5 text-xl font-bold text-white">Aucun commerce</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Créez votre premier commerce pour commencer
          </p>
          <button
            type="button"
            onClick={() => router.push("/commercant/create-commerce")}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 text-sm font-black text-white transition hover:bg-orange-400"
          >
            <Plus className="h-4 w-4" />Créer mon commerce
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {commerces.map((c) => (
            <CommerceCard key={c.id} commerce={c} />
          ))}
        </div>
      )}
    </div>
  );
}
