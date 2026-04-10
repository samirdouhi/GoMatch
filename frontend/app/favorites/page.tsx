"use client";

import { useEffect, useState, useCallback } from "react";
import { Heart, Building2, MapPin, Tag, Trash2, RefreshCw } from "lucide-react";
import { getFavoriteIds, removeFavorite } from "@/lib/favoritesStore";
import { getCommerceById, type Commerce } from "@/lib/commercesApi";

// ── Card ──────────────────────────────────────────────────────────────────────

function FavoriteCard({
  commerce,
  onRemove,
}: {
  commerce: Commerce;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="group relative flex flex-col rounded-3xl border border-white/[0.07] bg-white/[0.03] p-5 transition hover:border-white/[0.12] hover:bg-white/[0.05]">
      {/* Remove button */}
      <button
        type="button"
        onClick={() => onRemove(commerce.id)}
        aria-label="Retirer des favoris"
        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-black/40 transition hover:border-red-500/40 hover:bg-red-500/10"
      >
        <Trash2 className="h-4 w-4 text-zinc-500 group-hover:text-red-400 transition" />
      </button>

      {/* Icon + name */}
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 pr-10">
          <h3 className="font-bold text-white truncate">{commerce.nom}</h3>
          <p className="mt-0.5 text-xs text-zinc-500 flex items-center gap-1 truncate">
            <Tag className="h-3 w-3 shrink-0" />{commerce.nomCategorie ?? "—"}
          </p>
          <p className="mt-0.5 text-xs text-zinc-600 flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3 shrink-0" />{commerce.adresse}
          </p>
        </div>
      </div>

      {/* Description */}
      <p className="mt-4 text-xs leading-5 text-zinc-400 line-clamp-3">{commerce.description}</p>

      {/* Tags */}
      {commerce.tagsCulturels.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {commerce.tagsCulturels.slice(0, 4).map(t => (
            <span key={t} className="rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-[10px] font-medium text-orange-300">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FavoritesPage() {
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [errors,    setErrors]    = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setErrors([]);
    const ids = getFavoriteIds();

    if (ids.length === 0) {
      setCommerces([]);
      setLoading(false);
      return;
    }

    const results = await Promise.allSettled(ids.map(id => getCommerceById(id)));
    const loaded: Commerce[] = [];
    const errs: string[]     = [];

    results.forEach((r, i) => {
      if (r.status === "fulfilled" && r.value) {
        loaded.push(r.value);
      } else if (r.status === "rejected") {
        errs.push(`Commerce ${ids[i]}: ${r.reason instanceof Error ? r.reason.message : "erreur"}`);
      }
      // null (404) → silently skip (commerce deleted)
    });

    setCommerces(loaded);
    setErrors(errs);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  function handleRemove(id: string) {
    removeFavorite(id);
    setCommerces(prev => prev.filter(c => c.id !== id));
  }

  return (
    <div className="min-h-screen bg-[#04060b] text-white">
      {/* Hero */}
      <div className="border-b border-white/[0.07] bg-gradient-to-b from-red-500/5 to-transparent px-6 py-10 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Heart className="h-6 w-6 fill-red-400 text-red-400" />
              <h1 className="text-3xl font-black lg:text-4xl">Mes favoris</h1>
            </div>
            <p className="text-sm text-zinc-500">
              {loading ? "Chargement…" : `${commerces.length} commerce${commerces.length > 1 ? "s" : ""} enregistré${commerces.length > 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </button>
        </div>
      </div>

      <div className="px-6 py-8 lg:px-8">
        {/* Errors */}
        {errors.length > 0 && (
          <div className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-300 space-y-1">
            {errors.map((e, i) => <p key={i}>{e}</p>)}
          </div>
        )}

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[1,2,3].map(i => <div key={i} className="h-52 animate-pulse rounded-3xl bg-white/[0.04]" />)}
          </div>
        ) : commerces.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/[0.07] py-20 text-center">
            <Heart className="mx-auto h-12 w-12 text-zinc-700" />
            <p className="mt-4 font-semibold text-zinc-500">Vous n'avez pas encore de favoris.</p>
            <p className="mt-1 text-sm text-zinc-600">Explorez les commerces et cliquez sur le cœur pour les enregistrer.</p>
            <a href="/explore" className="mt-5 inline-block rounded-2xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-500">
              Explorer les commerces
            </a>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {commerces.map(c => (
              <FavoriteCard key={c.id} commerce={c} onRemove={handleRemove} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
