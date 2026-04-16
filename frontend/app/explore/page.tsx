"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Tag,
  Search,
  Heart,
  Building2,
  Filter,
  X,
  ChevronDown,
  Check,
  Trophy,
  Navigation,
  Store,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getAllCommerces, photoUrl, type Commerce } from "@/lib/commercesApi";
import { toggleFavorite, isFavorite } from "@/lib/favoritesStore";

type SelectOption = {
  value: string;
  label: string;
};

// --- COMPOSANTS INTERNES ---

function StatutBadgeSmall({ statut }: { statut: string }) {
  if (statut !== "Approuve") return null;

  return (
    <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.2)]">
      <div className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
      Validé
    </span>
  );
}

function CommerceCard({ commerce }: { commerce: Commerce }) {
  const [fav, setFav] = useState(() => isFavorite(commerce.id));
  const router = useRouter();

  function handleFav(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleFavorite(commerce.id);
    setFav(next);
  }

  function handleVoirSurCarte() {
    const params = new URLSearchParams({
      id: commerce.id,
      lat: String(commerce.latitude),
      lng: String(commerce.longitude),
      nom: commerce.nom,
    });

    router.push(`/test-map?${params.toString()}`);
  }

  const firstPhoto = commerce.photos?.[0];

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-white/5 bg-[#0f1115] transition-all duration-300 hover:border-[#ffbd13]/40 hover:shadow-[0_0_30px_rgba(255,189,19,0.05)]">
      <div className="relative h-44 w-full overflow-hidden">
        {firstPhoto ? (
          <img
            src={photoUrl(firstPhoto.urlImage)}
            alt={commerce.nom}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-900">
            <Building2 className="h-10 w-10 text-zinc-700" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] via-transparent to-transparent" />

        <button
          type="button"
          onClick={handleFav}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/60 backdrop-blur-md transition-all hover:bg-red-500/20 active:scale-90"
          aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              fav ? "fill-red-500 text-red-500" : "text-white"
            }`}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="truncate text-xl font-bold text-white transition-colors group-hover:text-[#ffbd13]">
            {commerce.nom}
          </h3>
          <StatutBadgeSmall statut={commerce.statut} />
        </div>

        <div className="mb-4 space-y-1.5">
          <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.1em] text-[#ffbd13]">
            <Tag className="h-3 w-3" />
            {commerce.nomCategorie ?? "Général"}
          </p>

          <p className="flex items-start gap-2 text-xs text-zinc-500">
            <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
            <span className="line-clamp-1">{commerce.adresse}</span>
          </p>
        </div>

        <p className="mb-4 line-clamp-2 flex-1 text-sm leading-relaxed text-zinc-400">
          {commerce.description}
        </p>

        {commerce.tagsCulturels && commerce.tagsCulturels.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {commerce.tagsCulturels.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-orange-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={handleVoirSurCarte}
          className="w-full rounded-2xl bg-[#ffbd13] py-3.5 text-sm font-black uppercase tracking-widest text-black transition-all hover:bg-white hover:shadow-[0_0_15px_rgba(255,189,19,0.4)] active:scale-[0.98]"
        >
          Voir sur carte
        </button>
      </div>
    </div>
  );
}

function CustomSelect({
  value,
  options,
  onChange,
  placeholder = "Sélectionner",
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedLabel =
    options.find((o) => o.value === value)?.label ?? placeholder;

  return (
    <div ref={ref} className="relative min-w-[200px]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-[11px] font-black uppercase tracking-widest transition-all ${
          open
            ? "border-[#ffbd13] bg-[#1a1d23] text-white"
            : "border-white/5 bg-[#16191d] text-zinc-400 hover:border-white/20"
        }`}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-300 ${
            open ? "rotate-180 text-[#ffbd13]" : ""
          }`}
        />
      </button>

      {open && (
        <div className="animate-in fade-in slide-in-from-top-2 absolute left-0 top-[calc(100%+8px)] z-50 w-full overflow-hidden rounded-xl border border-white/10 bg-[#16191d] shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
          <div className="scrollbar-thin max-h-60 overflow-y-auto">
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-4 py-3 text-left text-[10px] font-bold uppercase tracking-tighter transition-colors ${
                  o.value === value
                    ? "bg-[#ffbd13] text-black"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {o.label}
                {o.value === value && <Check className="h-3 w-3" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- PAGE PRINCIPALE ---

export default function ExplorePage() {
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 6;

  useEffect(() => {
    let mounted = true;

    getAllCommerces()
      .then((data) => {
        if (mounted) setCommerces(data);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const categories = useMemo<string[]>(() => {
    return Array.from(
      new Set(
        commerces
          .map((c) => c.nomCategorie)
          .filter((c): c is string => Boolean(c && c.trim()))
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [commerces]);

  const allTags = useMemo<string[]>(() => {
    return Array.from(
      new Set(commerces.flatMap((c) => c.tagsCulturels ?? []))
    ).sort((a, b) => a.localeCompare(b));
  }, [commerces]);

  const filtered = useMemo(() => {
    return commerces.filter((c) => {
      const q = search.toLowerCase().trim();

      const matchSearch =
        !q ||
        c.nom.toLowerCase().includes(q) ||
        c.adresse.toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q);

      const matchCat = catFilter === "all" || c.nomCategorie === catFilter;

      const matchTag =
        tagFilter === "all" || (c.tagsCulturels ?? []).includes(tagFilter);

      return matchSearch && matchCat && matchTag;
    });
  }, [commerces, search, catFilter, tagFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, catFilter, tagFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const categoryOptions = useMemo<SelectOption[]>(
    () => [
      { value: "all", label: "TOUTES CATÉGORIES" },
      ...categories.map((c) => ({
        value: c,
        label: c.toUpperCase(),
      })),
    ],
    [categories]
  );

  const tagOptions = useMemo<SelectOption[]>(
    () => [
      { value: "all", label: "TOUS LES TAGS" },
      ...allTags.map((t) => ({
        value: t,
        label: t.toUpperCase(),
      })),
    ],
    [allTags]
  );

  const hasFilters =
    search.trim() !== "" || catFilter !== "all" || tagFilter !== "all";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] text-white selection:bg-[#ffbd13]/30">
      <div className="pointer-events-none fixed inset-0 z-0">
        <Trophy className="absolute left-[5%] top-[15%] h-64 w-64 -rotate-12 text-[#ffbd13] opacity-[0.06] blur-[2px] drop-shadow-[0_0_40px_rgba(255,189,19,0.8)]" />
        <Navigation className="absolute bottom-[20%] right-[8%] h-72 w-72 rotate-12 text-[#ffbd13] opacity-[0.04] blur-[1px] drop-shadow-[0_0_30px_rgba(255,189,19,0.5)]" />
        <Store className="absolute right-[12%] top-[45%] h-48 w-48 -rotate-6 text-[#ffbd13] opacity-[0.05] drop-shadow-[0_0_30px_rgba(255,189,19,0.6)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-16 lg:px-12">
        <header className="mb-16">
          <h1 className="text-5xl font-black uppercase italic tracking-tighter lg:text-7xl">
            Explorer les{" "}
            <span className="text-[#ffbd13] drop-shadow-[0_0_15px_rgba(255,189,19,0.6)]">
              Commerces
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-sm font-bold uppercase tracking-widest text-zinc-500">
            Découvrez les pépites locales validées autour des sites de la Coupe
            du Monde 2026.
          </p>
        </header>

        <div className="mb-16 space-y-8">
          <div className="group relative max-w-4xl">
            <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-600 transition-colors group-focus-within:text-[#ffbd13]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="RECHERCHER UN COMMERCE, UNE SPÉCIALITÉ..."
              className="w-full rounded-2xl border border-white/5 bg-[#0f1115] py-5 pl-14 pr-6 text-xs font-black uppercase tracking-widest placeholder:text-zinc-700 shadow-2xl transition-all focus:border-[#ffbd13]/50 focus:outline-none focus:ring-1 focus:ring-[#ffbd13]/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#ffbd13] drop-shadow-[0_0_5px_rgba(255,189,19,0.4)]">
              <Filter className="h-4 w-4" />
              Filtres :
            </div>

            <CustomSelect
              value={catFilter}
              onChange={setCatFilter}
              options={categoryOptions}
            />

            <CustomSelect
              value={tagFilter}
              onChange={setTagFilter}
              options={tagOptions}
            />

            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCatFilter("all");
                  setTagFilter("all");
                }}
                className="flex items-center gap-2 px-4 text-[10px] font-black uppercase tracking-widest text-red-500 transition-colors hover:text-white"
              >
                <X className="h-3 w-3" />
                Effacer
              </button>
            )}
          </div>
        </div>

        <div>
          <div className="mb-8 flex items-center justify-between border-b border-white/5 pb-4">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#ffbd13] drop-shadow-[0_0_5px_rgba(255,189,19,0.3)]">
              {loading ? "Chargement..." : `${filtered.length} Établissements trouvés`}
            </p>
          </div>

          {loading ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-96 animate-pulse rounded-[2rem] bg-zinc-900/50"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[3rem] border border-dashed border-white/10 bg-[#0f1115]/50 py-32 text-center backdrop-blur-sm">
              <Search className="mb-6 h-12 w-12 text-zinc-800" />
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                Aucun résultat
              </h3>
              <p className="mt-2 text-zinc-500">
                Essayez de modifier vos filtres ou votre recherche.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedItems.map((c) => (
                  <CommerceCard key={c.id} commerce={c} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-20 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/5 bg-[#0f1115] text-zinc-400 transition-all hover:border-[#ffbd13] hover:text-[#ffbd13] disabled:pointer-events-none disabled:opacity-20"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <div className="flex items-center gap-2 px-4">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          type="button"
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`h-12 w-12 rounded-xl text-xs font-black transition-all ${
                            currentPage === page
                              ? "scale-110 bg-[#ffbd13] text-black shadow-[0_0_15px_rgba(255,189,19,0.3)]"
                              : "border border-white/5 bg-[#0f1115] text-zinc-500 hover:border-white/20 hover:text-white"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/5 bg-[#0f1115] text-zinc-400 transition-all hover:border-[#ffbd13] hover:text-[#ffbd13] disabled:pointer-events-none disabled:opacity-20"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #3f3f46;
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #ffbd13;
        }
      `}</style>
    </div>
  );
}