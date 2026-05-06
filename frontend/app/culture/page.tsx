"use client";

import { useEffect, useState, useMemo } from "react";
import {
  getAllContenus, getCategories, getTags,
  type ContenuCulturel, type CategorieCulturelle, type TagCulturel,
} from "@/lib/cultureApi";
import {
  Landmark, Search, MapPin, Calendar, Tag, X,
  BookOpen, Image as ImageIcon, Globe,
} from "lucide-react";

// ── Utilitaires ───────────────────────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(d);
}

function firstImage(contenu: ContenuCulturel): string | null {
  const img = contenu.medias
    .filter((m) => m.type === "Image")
    .sort((a, b) => a.ordre - b.ordre)[0];
  return img?.url ?? null;
}

const LANGUE_LABELS: Record<string, string> = {
  fr: "Français", ar: "Arabe", en: "English", es: "Español",
};

// ── Composants ────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-3xl border border-white/[0.06] bg-white/[0.03] overflow-hidden">
      <div className="h-48 bg-white/[0.06]" />
      <div className="p-5 space-y-3">
        <div className="h-3 w-1/3 rounded-full bg-white/[0.08]" />
        <div className="h-5 w-3/4 rounded-full bg-white/[0.08]" />
        <div className="h-3 w-full rounded-full bg-white/[0.06]" />
        <div className="h-3 w-2/3 rounded-full bg-white/[0.06]" />
      </div>
    </div>
  );
}

function ContenuCard({
  contenu,
  onClick,
}: {
  contenu: ContenuCulturel;
  onClick: () => void;
}) {
  const img  = firstImage(contenu);
  const date = formatDate(contenu.datePublication ?? contenu.dateCreation);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left rounded-3xl border border-white/[0.07] bg-white/[0.03] overflow-hidden hover:border-[#facc15]/30 hover:bg-white/[0.05] transition-all duration-300"
    >
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-[#facc15]/10 to-amber-900/20 overflow-hidden">
        {img ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={img}
            alt={contenu.titre}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Landmark className="h-16 w-16 text-[#facc15]/20" />
          </div>
        )}
        {/* Category badge */}
        {contenu.nomCategorie && (
          <span className="absolute top-3 left-3 rounded-full border border-[#facc15]/30 bg-black/70 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#facc15] backdrop-blur">
            {contenu.nomCategorie}
          </span>
        )}
        {/* Language badge */}
        <span className="absolute top-3 right-3 rounded-full border border-white/10 bg-black/70 px-2.5 py-1 text-[10px] font-semibold text-zinc-400 backdrop-blur">
          {LANGUE_LABELS[contenu.langueOriginale] ?? contenu.langueOriginale.toUpperCase()}
        </span>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        <h3 className="font-bold text-white leading-snug line-clamp-2 group-hover:text-[#facc15] transition-colors">
          {contenu.titre}
        </h3>

        {contenu.resume && (
          <p className="text-sm text-zinc-500 leading-relaxed line-clamp-2">{contenu.resume}</p>
        )}

        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-600">
          {contenu.lieu && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-[#facc15]/60" />{contenu.lieu}
            </span>
          )}
          {date && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />{date}
            </span>
          )}
        </div>

        {contenu.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {contenu.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/[0.07] bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-semibold text-zinc-500"
              >
                {tag}
              </span>
            ))}
            {contenu.tags.length > 3 && (
              <span className="rounded-full border border-white/[0.07] bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-semibold text-zinc-600">
                +{contenu.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

function DetailDrawer({
  contenu,
  onClose,
}: {
  contenu: ContenuCulturel;
  onClose: () => void;
}) {
  const img  = firstImage(contenu);
  const date = formatDate(contenu.datePublication ?? contenu.dateCreation);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-white/[0.07] bg-[#09090b] shadow-2xl">
        {/* Image header */}
        <div className="relative h-56 sm:h-72 bg-gradient-to-br from-[#facc15]/10 to-amber-900/20 overflow-hidden rounded-t-3xl sm:rounded-t-3xl shrink-0">
          {img ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={img} alt={contenu.titre} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full flex items-center justify-center">
              <Landmark className="h-24 w-24 text-[#facc15]/15" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent" />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3">
            {contenu.nomCategorie && (
              <span className="rounded-full border border-[#facc15]/30 bg-[#facc15]/10 px-3 py-1 text-xs font-bold text-[#facc15]">
                {contenu.nomCategorie}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-zinc-500">
              <Globe className="h-3.5 w-3.5" />{LANGUE_LABELS[contenu.langueOriginale] ?? contenu.langueOriginale}
            </span>
            {date && (
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <Calendar className="h-3.5 w-3.5" />{date}
              </span>
            )}
            {contenu.lieu && (
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <MapPin className="h-3.5 w-3.5 text-[#facc15]/60" />{contenu.lieu}
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-black text-white leading-tight">{contenu.titre}</h2>

          {/* Summary */}
          {contenu.resume && (
            <p className="text-base text-zinc-400 leading-relaxed border-l-2 border-[#facc15]/40 pl-4">
              {contenu.resume}
            </p>
          )}

          {/* Body */}
          <div className="prose prose-invert prose-sm max-w-none text-zinc-300 leading-7 whitespace-pre-line">
            {contenu.corps}
          </div>

          {/* Tags */}
          {contenu.tags.length > 0 && (
            <div className="pt-2">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-600">
                <Tag className="h-3 w-3" />Tags
              </p>
              <div className="flex flex-wrap gap-2">
                {contenu.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-[#facc15]/20 bg-[#facc15]/5 px-3 py-1 text-xs font-semibold text-[#facc15]/70">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Traductions */}
          {contenu.traductions.length > 0 && (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-600">
                Traductions disponibles
              </p>
              <div className="flex flex-wrap gap-2">
                {contenu.traductions.map((t) => (
                  <span key={t.id} className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs font-semibold text-zinc-400">
                    {LANGUE_LABELS[t.langue] ?? t.langue}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Autres médias */}
          {contenu.medias.filter((m) => m.type !== "Image" || contenu.medias.indexOf(m) > 0).length > 0 && (
            <div className="pt-1">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-600">
                <ImageIcon className="h-3 w-3" />Médias
              </p>
              <div className="grid grid-cols-3 gap-2">
                {contenu.medias.slice(1).filter((m) => m.type === "Image").map((m) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img key={m.id} src={m.url} alt={m.legende ?? ""} className="h-24 w-full rounded-xl object-cover" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function CulturePage() {
  const [contenus,    setContenus]    = useState<ContenuCulturel[]>([]);
  const [categories,  setCategories]  = useState<CategorieCulturelle[]>([]);
  const [tags,        setTags]        = useState<TagCulturel[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  const [search,      setSearch]      = useState("");
  const [catFilter,   setCatFilter]   = useState<string | null>(null);
  const [tagFilter,   setTagFilter]   = useState<string | null>(null);
  const [selected,    setSelected]    = useState<ContenuCulturel | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const [c, cats, t] = await Promise.all([
          getAllContenus(),
          getCategories(),
          getTags(),
        ]);
        if (!mounted) return;
        setContenus(c);
        setCategories(cats);
        setTags(t);
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

  const filtered = useMemo(() => {
    let result = contenus;
    if (catFilter)  result = result.filter((c) => c.categorieId === catFilter);
    if (tagFilter)  result = result.filter((c) => c.tags.some((t) => t.toLowerCase() === tagFilter?.toLowerCase()));
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.titre.toLowerCase().includes(q) ||
          (c.resume ?? "").toLowerCase().includes(q) ||
          (c.lieu ?? "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [contenus, catFilter, tagFilter, search]);

  const activeFilters = [catFilter, tagFilter, search.trim()].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#04060b] text-white">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden border-b border-white/[0.06] bg-gradient-to-b from-[#facc15]/5 to-transparent">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(250,204,21,0.12),transparent)]" />
        <div className="relative mx-auto max-w-6xl px-6 py-20 text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[#facc15]/30 bg-[#facc15]/10 px-5 py-2">
            <Landmark className="h-4 w-4 text-[#facc15]" />
            <span className="text-xs font-black uppercase tracking-[0.25em] text-[#facc15]">Culture & Patrimoine</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl lg:text-6xl">
            Découvrez le
            <span className="block bg-gradient-to-r from-[#facc15] via-amber-400 to-[#facc15] bg-clip-text text-transparent">
              Maroc Authentique
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-zinc-400 md:text-lg">
            Traditions, arts, histoire et saveurs — plongez dans la richesse culturelle des villes hôtes de la Coupe du Monde 2026.
          </p>

          {/* Barre de recherche */}
          <div className="mx-auto mt-8 flex max-w-xl items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 backdrop-blur">
            <Search className="h-5 w-5 shrink-0 text-zinc-500" />
            <input
              type="text"
              placeholder="Rechercher un article, un lieu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 focus:outline-none"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="text-zinc-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">

        {/* ── Filtres catégories ── */}
        {categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCatFilter(null)}
              className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                catFilter === null
                  ? "border-[#facc15]/50 bg-[#facc15]/15 text-[#facc15]"
                  : "border-white/[0.08] bg-white/[0.03] text-zinc-500 hover:border-white/20 hover:text-zinc-300"
              }`}
            >
              Tout
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCatFilter(catFilter === cat.id ? null : cat.id)}
                className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                  catFilter === cat.id
                    ? "border-[#facc15]/50 bg-[#facc15]/15 text-[#facc15]"
                    : "border-white/[0.08] bg-white/[0.03] text-zinc-500 hover:border-white/20 hover:text-zinc-300"
                }`}
              >
                {cat.icone && <span className="mr-1">{cat.icone}</span>}
                {cat.nom}
              </button>
            ))}
          </div>
        )}

        {/* ── Filtres tags ── */}
        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Tag className="h-3.5 w-3.5 text-zinc-600" />
            {tags.slice(0, 12).map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => setTagFilter(tagFilter === tag.nom ? null : tag.nom)}
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                  tagFilter === tag.nom
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                    : "border-white/[0.06] bg-white/[0.02] text-zinc-600 hover:border-white/15 hover:text-zinc-400"
                }`}
              >
                {tag.nom}
              </button>
            ))}
          </div>
        )}

        {/* ── Résumé filtres actifs ── */}
        {activeFilters > 0 && (
          <div className="flex items-center gap-3 text-sm text-zinc-500">
            <span>{filtered.length} résultat{filtered.length !== 1 ? "s" : ""}</span>
            <button
              type="button"
              onClick={() => { setSearch(""); setCatFilter(null); setTagFilter(null); }}
              className="flex items-center gap-1 text-[#facc15]/70 hover:text-[#facc15] transition"
            >
              <X className="h-3.5 w-3.5" />Réinitialiser les filtres
            </button>
          </div>
        )}

        {/* ── Grille de contenus ── */}
        {error ? (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center text-red-300">
            <p className="font-semibold">Impossible de charger les contenus culturels</p>
            <p className="mt-1 text-sm text-red-400/70">{error}</p>
          </div>
        ) : loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/[0.06] py-24 text-center">
            <BookOpen className="mx-auto h-16 w-16 text-zinc-800" />
            <h3 className="mt-5 text-lg font-bold text-white">
              {activeFilters > 0 ? "Aucun résultat" : "Aucun contenu publié"}
            </h3>
            <p className="mt-2 text-sm text-zinc-600">
              {activeFilters > 0
                ? "Essayez d'autres filtres ou termes de recherche."
                : "Du contenu culturel sera bientôt disponible."}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <ContenuCard key={c.id} contenu={c} onClick={() => setSelected(c)} />
            ))}
          </div>
        )}
      </div>

      {/* ── Drawer détail ── */}
      {selected && (
        <DetailDrawer contenu={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
