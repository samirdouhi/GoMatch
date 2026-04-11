"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Building2, MapPin, Tag, Trash2, RefreshCw } from "lucide-react";
import { getFavoriteIds, removeFavorite } from "@/lib/favoritesStore";
import { getCommerceById, type Commerce } from "@/lib/commercesApi";

function FavoriteCard({
  commerce,
  onRemove,
}: {
  commerce: Commerce;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="group relative flex flex-col rounded-3xl border border-white/[0.07] bg-white/[0.03] p-5 transition hover:border-white/[0.12] hover:bg-white/[0.05]">
      <button
        type="button"
        onClick={() => onRemove(commerce.id)}
        aria-label="Retirer des favoris"
        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-black/40 transition hover:border-red-500/40 hover:bg-red-500/10"
      >
        <Trash2 className="h-4 w-4 text-zinc-500 transition group-hover:text-red-400" />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
          <Building2 className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1 pr-10">
          <h3 className="truncate font-bold text-white">{commerce.nom}</h3>

          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-zinc-500">
            <Tag className="h-3 w-3 shrink-0" />
            {commerce.nomCategorie ?? "—"}
          </p>

          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-zinc-600">
            <MapPin className="h-3 w-3 shrink-0" />
            {commerce.adresse}
          </p>
        </div>
      </div>

      <p className="mt-4 line-clamp-3 text-xs leading-5 text-zinc-400">{commerce.description}</p>

      {commerce.tagsCulturels.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {commerce.tagsCulturels.slice(0, 4).map((t) => (
            <span
              key={t}
              className="rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-[10px] font-medium text-orange-300"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

async function fetchFavoritesData(): Promise<{
  loaded: Commerce[];
  errors: string[];
}> {
  const ids = getFavoriteIds();

  if (ids.length === 0) {
    return { loaded: [], errors: [] };
  }

  const results = await Promise.allSettled(ids.map((id) => getCommerceById(id)));
  const loaded: Commerce[] = [];
  const errors: string[] = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled" && result.value) {
      loaded.push(result.value);
      return;
    }

    if (result.status === "rejected") {
      errors.push(
        `Commerce ${ids[index]} : ${
          result.reason instanceof Error ? result.reason.message : "erreur"
        }`
      );
    }
  });

  return { loaded, errors };
}

export default function FavoritesPage() {
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialFavorites() {
      const result = await fetchFavoritesData();

      if (cancelled) return;

      setCommerces(result.loaded);
      setErrors(result.errors);
      setLoading(false);
    }

    void loadInitialFavorites();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleReload() {
    setLoading(true);
    setErrors([]);

    const result = await fetchFavoritesData();

    setCommerces(result.loaded);
    setErrors(result.errors);
    setLoading(false);
  }

  function handleRemove(id: string) {
    removeFavorite(id);
    setCommerces((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="min-h-screen bg-[#04060b] text-white">
      <div className="border-b border-white/[0.07] bg-gradient-to-b from-red-500/5 to-transparent px-6 py-10 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Heart className="h-6 w-6 fill-red-400 text-red-400" />
              <h1 className="text-3xl font-black lg:text-4xl">Mes favoris</h1>
            </div>

            <p className="text-sm text-zinc-500">
              {loading
                ? "Chargement…"
                : `${commerces.length} commerce${commerces.length > 1 ? "s" : ""} enregistré${
                    commerces.length > 1 ? "s" : ""
                  }`}
            </p>
          </div>

          <button
            type="button"
            onClick={handleReload}
            disabled={loading}
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </button>
        </div>
      </div>

      <div className="px-6 py-8 lg:px-8">
        {errors.length > 0 && (
          <div className="mb-5 space-y-1 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
            {errors.map((e, i) => (
              <p key={i}>{e}</p>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-52 animate-pulse rounded-3xl bg-white/[0.04]" />
            ))}
          </div>
        ) : commerces.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/[0.07] py-20 text-center">
            <Heart className="mx-auto h-12 w-12 text-zinc-700" />
            <p className="mt-4 font-semibold text-zinc-500">Vous avez pas encore de favoris.</p>
            <p className="mt-1 text-sm text-zinc-600">
              Explorez les commerces et cliquez sur le cœur pour les enregistrer.
            </p>

            <Link
              href="/explore"
              className="mt-5 inline-block rounded-2xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-500"
            >
              Explorer les commerces
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {commerces.map((c) => (
              <FavoriteCard key={c.id} commerce={c} onRemove={handleRemove} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}