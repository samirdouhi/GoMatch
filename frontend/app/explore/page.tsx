"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useMemo } from "react";
import { MapPin, Tag, Search, Heart, Building2, Filter, X, Map, LayoutGrid } from "lucide-react";
import { getAllCommerces, photoUrl, type Commerce } from "@/lib/commercesApi";
import { toggleFavorite, isFavorite } from "@/lib/favoritesStore";

// Import dynamique pour éviter les erreurs SSR avec Leaflet
const CommerceMapExplore = dynamic(
  () => import("../components/commercant/CommerceMapExplore"),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse rounded-3xl bg-white/[0.04]" /> }
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatutBadgeSmall({ statut }: { statut: string }) {
  if (statut !== "Approuve") return null;
  return (
    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
      Validé
    </span>
  );
}

function CommerceCard({ commerce }: { commerce: Commerce }) {
  const [fav, setFav] = useState(() => isFavorite(commerce.id));

  function handleFav(e: React.MouseEvent) {
    e.preventDefault();
    const next = toggleFavorite(commerce.id);
    setFav(next);
  }

  const firstPhoto = commerce.photos?.[0];

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.03] transition hover:border-white/[0.14] hover:bg-white/[0.05]">
      {/* Photo principale */}
      {firstPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl(firstPhoto.urlImage)}
          alt={commerce.nom}
          className="h-40 w-full object-cover transition group-hover:scale-105"
        />
      ) : (
        <div className="flex h-40 w-full items-center justify-center bg-zinc-900/50">
          <Building2 className="h-10 w-10 text-zinc-700" />
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        {/* Fav button */}
        <button
          type="button"
          onClick={handleFav}
          aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-black/40 transition hover:border-red-500/40 hover:bg-red-500/10"
        >
          <Heart className={`h-4 w-4 transition ${fav ? "fill-red-400 text-red-400" : "text-zinc-500 group-hover:text-zinc-300"}`} />
        </button>

        {/* Nom + statut */}
        <div className="flex flex-wrap items-center gap-2 pr-10">
          <h3 className="font-bold text-white truncate">{commerce.nom}</h3>
          <StatutBadgeSmall statut={commerce.statut} />
        </div>

        <p className="mt-0.5 text-xs text-zinc-500 flex items-center gap-1 truncate">
          <Tag className="h-3 w-3 shrink-0" />{commerce.nomCategorie ?? "Catégorie non définie"}
        </p>
        <p className="mt-0.5 text-xs text-zinc-600 flex items-center gap-1 truncate">
          <MapPin className="h-3 w-3 shrink-0" />{commerce.adresse}
        </p>

        {/* Description */}
        <p className="mt-3 text-xs leading-5 text-zinc-400 line-clamp-2 flex-1">{commerce.description}</p>

        {/* Tags */}
        {commerce.tagsCulturels.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {commerce.tagsCulturels.slice(0, 3).map(t => (
              <span key={t} className="rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-[10px] font-medium text-orange-300">{t}</span>
            ))}
            {commerce.tagsCulturels.length > 3 && (
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-zinc-500">+{commerce.tagsCulturels.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ExplorePage() {
  const [commerces,  setCommerces]  = useState<Commerce[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [search,     setSearch]     = useState("");
  const [catFilter,  setCatFilter]  = useState<string>("all");
  const [tagFilter,  setTagFilter]  = useState<string>("all");
  const [viewMode,   setViewMode]   = useState<"grid" | "map">("grid");

  useEffect(() => {
    async function load() {
      try {
        const data = await getAllCommerces();
        setCommerces(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erreur de chargement.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const categories = useMemo(() => {
    const set = new Set(commerces.map(c => c.nomCategorie).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [commerces]);

  const allTags = useMemo(() => {
    const set = new Set(commerces.flatMap(c => c.tagsCulturels));
    return Array.from(set).sort();
  }, [commerces]);

  const filtered = useMemo(() => {
    return commerces.filter(c => {
      const q = search.toLowerCase();
      const matchSearch = !q || c.nom.toLowerCase().includes(q) || c.adresse.toLowerCase().includes(q) || (c.description ?? "").toLowerCase().includes(q);
      const matchCat    = catFilter === "all" || c.nomCategorie === catFilter;
      const matchTag    = tagFilter === "all" || c.tagsCulturels.includes(tagFilter);
      return matchSearch && matchCat && matchTag;
    });
  }, [commerces, search, catFilter, tagFilter]);

  const hasFilters = search || catFilter !== "all" || tagFilter !== "all";

  function clearFilters() {
    setSearch("");
    setCatFilter("all");
    setTagFilter("all");
  }

  return (
    <div className="min-h-screen bg-[#04060b] text-white">
      {/* Hero + filtres */}
      <div className="border-b border-white/[0.07] bg-gradient-to-b from-orange-500/5 to-transparent px-4 py-8 lg:px-8">
        <h1 className="text-3xl font-black lg:text-4xl">Explorer les commerces</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Découvrez les commerces locaux validés autour des sites de la Coupe du Monde 2026.
        </p>

        {/* Barre de recherche + toggle vue */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un commerce, une adresse…"
              className="w-full rounded-2xl border border-white/[0.07] bg-white/[0.04] py-3 pl-11 pr-4 text-sm text-white placeholder:text-zinc-600 focus:border-orange-500/40 focus:outline-none focus:ring-1 focus:ring-orange-500/20"
            />
          </div>

          {/* Toggle grille / carte */}
          <div className="flex items-center rounded-2xl border border-white/[0.07] bg-white/[0.03] p-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                viewMode === "grid"
                  ? "bg-orange-500 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              Grille
            </button>
            <button
              type="button"
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                viewMode === "map"
                  ? "bg-orange-500 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Map className="h-4 w-4" />
              Carte
            </button>
          </div>
        </div>

        {/* Filtres (masqués en vue carte pour simplifier) */}
        {viewMode === "grid" && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-zinc-600" />
              <span className="text-xs font-semibold text-zinc-500">Filtres :</span>
            </div>

            <select
              value={catFilter}
              onChange={e => setCatFilter(e.target.value)}
              className="rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300 focus:border-orange-500/40 focus:outline-none"
            >
              <option value="all">Toutes catégories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {allTags.length > 0 && (
              <select
                value={tagFilter}
                onChange={e => setTagFilter(e.target.value)}
                className="rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300 focus:border-orange-500/40 focus:outline-none"
              >
                <option value="all">Tous les tags</option>
                {allTags.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            )}

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-400 transition hover:text-white"
              >
                <X className="h-3.5 w-3.5" />Effacer
              </button>
            )}
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="px-4 py-6 lg:px-8">
        {/* Compteur (grille seulement) */}
        {viewMode === "grid" && (
          <p className="mb-5 text-xs font-semibold text-zinc-500">
            {loading
              ? "Chargement…"
              : `${filtered.length} commerce${filtered.length > 1 ? "s" : ""} trouvé${filtered.length > 1 ? "s" : ""}`}
          </p>
        )}

        {loading ? (
          viewMode === "grid" ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-64 animate-pulse rounded-3xl bg-white/[0.04]" />
              ))}
            </div>
          ) : (
            <div className="h-[70vh] animate-pulse rounded-3xl bg-white/[0.04]" />
          )
        ) : error ? (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">{error}</div>
        ) : viewMode === "map" ? (
          /* ── Vue carte ── */
          <div className="overflow-hidden rounded-3xl border border-white/[0.07]" style={{ height: "70vh" }}>
            <CommerceMapExplore commerces={filtered.length > 0 ? filtered : commerces} />
          </div>
        ) : (
          /* ── Vue grille ── */
          filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/[0.07] py-20 text-center">
              <Building2 className="mx-auto h-12 w-12 text-zinc-700" />
              <p className="mt-4 font-semibold text-zinc-500">Aucun commerce trouvé</p>
              {hasFilters && (
                <button type="button" onClick={clearFilters} className="mt-3 text-sm text-orange-400 hover:underline">
                  Effacer les filtres
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map(c => <CommerceCard key={c.id} commerce={c} />)}
            </div>
          )
        )}
      </div>
    </div>
  );
}
