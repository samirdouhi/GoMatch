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
  Star,
  MessageSquare,
  Clock,
  Send,
  ChevronUp,
} from "lucide-react";
import {
  getAllCommerces,
  getAvis,
  posterAvis,
  photoUrl,
  type Commerce,
  type Avis,
  type HoraireCommerce,
} from "@/lib/commercesApi";
import { toggleFavorite, isFavorite } from "@/lib/favoritesStore";

type SelectOption = { value: string; label: string };
type SortOption = "rating" | "name" | "newest";

const JOURS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

const SORT_LABELS: Record<SortOption, string> = {
  rating: "MIEUX NOTÉS",
  name: "NOM A→Z",
  newest: "PLUS RÉCENTS",
};

function getStoredToken(): string {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("gomatch_access_token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("jwt") ||
    localStorage.getItem("access_token") ||
    ""
  );
}

function StarsDisplay({ note, size = 14 }: { note: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          style={{ width: size, height: size }}
          className={
            s <= Math.round(note)
              ? "fill-[#ffbd13] text-[#ffbd13]"
              : "text-white/15"
          }
        />
      ))}
    </div>
  );
}

function StarPicker({
  value,
  hover,
  onChange,
  onHover,
}: {
  value: number;
  hover: number;
  onChange: (v: number) => void;
  onHover: (v: number) => void;
}) {
  const active = hover || value;

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => onHover(s)}
          onMouseLeave={() => onHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              s <= active
                ? "fill-[#ffbd13] text-[#ffbd13]"
                : "text-white/20"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function StatutBadgeSmall({ statut }: { statut: string }) {
  if (statut !== "Approuve") return null;

  return (
    <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
      <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
      Validé
    </span>
  );
}

function CommerceDetailModal({
  commerce,
  onClose,
}: {
  commerce: Commerce;
  onClose: () => void;
}) {
  const router = useRouter();
  const [avis, setAvis] = useState<Avis[]>([]);
  const [loadingAvis, setLoadingAvis] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [myNote, setMyNote] = useState(0);
  const [hoverNote, setHoverNote] = useState(0);
  const [commentaire, setCommentaire] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const isLoggedIn = !!getStoredToken();
  const photos = commerce.photos ?? [];

  useEffect(() => {
    let mounted = true;

    getAvis(commerce.id)
      .then((data) => {
        if (mounted) setAvis(data);
      })
      .catch(() => {
        if (mounted) setAvis([]);
      })
      .finally(() => {
        if (mounted) setLoadingAvis(false);
      });

    return () => {
      mounted = false;
    };
  }, [commerce.id]);

  async function handleSubmit() {
    if (!myNote) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const newAvis = await posterAvis(
        commerce.id,
        myNote,
        commentaire.trim() || undefined
      );

      setAvis((prev) => [newAvis, ...prev]);
      setSubmitSuccess(true);
      setMyNote(0);
      setCommentaire("");

      window.setTimeout(() => setSubmitSuccess(false), 2500);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Erreur lors de la soumission."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleVoirCarte() {
    const params = new URLSearchParams({
      id: commerce.id,
      lat: String(commerce.latitude),
      lng: String(commerce.longitude),
      nom: commerce.nom,
    });

    router.push(`/test-map?${params.toString()}`);
    onClose();
  }

  const noteLocale =
    avis.length > 0
      ? Math.round(
          (avis.reduce((sum, item) => sum + item.note, 0) / avis.length) * 10
        ) / 10
      : commerce.noteGlobale ?? null;

  const nbAvis = avis.length || commerce.nombreAvis || 0;

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/80 px-4 pb-8 pt-28 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#07080d] shadow-[0_30px_120px_rgba(0,0,0,0.9)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/75 text-white/60 backdrop-blur-md transition hover:border-white/25 hover:bg-white/10 hover:text-white"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>

        <section className="relative h-44 overflow-hidden bg-zinc-950 sm:h-52">
          {photos.length > 0 ? (
            <>
              <img
                src={photoUrl(photos[activePhoto].urlImage)}
                alt={`${commerce.nom} photo`}
                className="h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#07080d] via-[#07080d]/55 to-black/20" />

              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActivePhoto(
                        (current) =>
                          (current - 1 + photos.length) % photos.length
                      )
                    }
                    className="absolute left-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white/70 backdrop-blur-md hover:bg-white/15"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setActivePhoto((current) => (current + 1) % photos.length)
                    }
                    className="absolute right-14 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white/70 backdrop-blur-md hover:bg-white/15"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  <div className="absolute bottom-3 right-3 rounded-full border border-white/10 bg-black/55 px-2.5 py-1 text-[10px] font-black text-white/60 backdrop-blur-md">
                    {activePhoto + 1} / {photos.length}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 bg-[#0c0d13]">
              <Building2 className="h-10 w-10 text-zinc-700" />
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-700">
                Aucune photo disponible
              </p>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#ffbd13]/25 bg-[#ffbd13]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#ffbd13]">
                {commerce.nomCategorie ?? "Général"}
              </span>
              <StatutBadgeSmall statut={commerce.statut} />
            </div>

            <h2 className="text-2xl font-black leading-tight text-white sm:text-3xl">
              {commerce.nom}
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              {noteLocale !== null ? (
                <div className="flex items-center gap-2 rounded-full border border-[#ffbd13]/25 bg-black/55 px-3 py-1.5 backdrop-blur-md">
                  <StarsDisplay note={noteLocale} size={12} />
                  <span className="text-xs font-black text-[#ffbd13]">
                    {noteLocale}
                  </span>
                  <span className="text-[11px] text-white/40">
                    {nbAvis} avis
                  </span>
                </div>
              ) : (
                <div className="rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-xs font-bold text-white/35 backdrop-blur-md">
                  Pas encore noté
                </div>
              )}

              {commerce.adresse && (
                <div className="flex min-w-0 items-center gap-1.5 text-xs text-white/55">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-[#ffbd13]" />
                  <span className="max-w-[460px] truncate">
                    {commerce.adresse}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto border-b border-white/6 bg-[#07080d] px-5 py-3">
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setActivePhoto(index)}
                className={`h-11 w-18 shrink-0 overflow-hidden rounded-xl transition ${
                  index === activePhoto
                    ? "scale-[1.03] ring-2 ring-[#ffbd13]"
                    : "opacity-40 ring-1 ring-white/10 hover:opacity-75"
                }`}
              >
                <img
                  src={photoUrl(photo.urlImage)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-4 p-5 lg:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/25">
                  Catégorie
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs font-black text-[#ffbd13]">
                  <Tag className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {commerce.nomCategorie ?? "Général"}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/25">
                  Photos
                </p>
                <p className="mt-2 text-xs font-black text-white">
                  {photos.length} photo{photos.length > 1 ? "s" : ""}
                </p>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/25">
                  Note
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Star className="h-4 w-4 fill-[#ffbd13] text-[#ffbd13]" />
                  <span className="text-xs font-black text-white">
                    {noteLocale !== null ? `${noteLocale}/5` : "Nouveau"}
                  </span>
                </div>
              </div>
            </div>

            <section className="rounded-2xl border border-white/8 bg-white/[0.035] p-5">
              <h3 className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#ffbd13]">
                À propos du commerce
              </h3>
              <p className="text-sm leading-7 text-zinc-300">
                {commerce.description || "Aucune description disponible."}
              </p>

              {(commerce.tagsCulturels ?? []).length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {(commerce.tagsCulturels ?? []).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#ffbd13]/20 bg-[#ffbd13]/10 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[#ffbd13]/85"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </section>

            {commerce.adresse && (
              <section className="rounded-2xl border border-white/8 bg-white/[0.035] p-5">
                <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/30">
                  <MapPin className="h-4 w-4 text-[#ffbd13]" />
                  Adresse
                </div>
                <p className="text-sm leading-6 text-zinc-300">
                  {commerce.adresse}
                </p>
              </section>
            )}

            <section className="rounded-2xl border border-white/8 bg-white/[0.035] p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.22em] text-[#ffbd13]">
                    Avis clients
                  </h3>
                  <p className="mt-1 text-xs text-white/35">
                    {loadingAvis
                      ? "Chargement..."
                      : `${avis.length} avis affiché${
                          avis.length > 1 ? "s" : ""
                        }`}
                  </p>
                </div>

                {noteLocale !== null && (
                  <div className="rounded-2xl border border-[#ffbd13]/20 bg-[#ffbd13]/10 px-4 py-2 text-right">
                    <p className="text-xl font-black leading-none text-[#ffbd13]">
                      {noteLocale}
                    </p>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/35">
                      / 5
                    </p>
                  </div>
                )}
              </div>

              {loadingAvis ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-20 animate-pulse rounded-2xl bg-white/[0.04]"
                    />
                  ))}
                </div>
              ) : avis.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 py-8 text-center">
                  <MessageSquare className="mx-auto mb-3 h-6 w-6 text-white/15" />
                  <p className="text-sm font-bold text-zinc-500">
                    Aucun avis pour l&apos;instant
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {avis.slice(0, 4).map((a) => (
                    <article
                      key={a.id}
                      className="rounded-2xl border border-white/7 bg-black/20 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#ffbd13]/15 bg-[#ffbd13]/10 text-sm font-black text-[#ffbd13]">
                            {(a.utilisateurEmail || "?")[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-black text-zinc-300">
                              {a.utilisateurEmail?.split("@")[0] ?? "Anonyme"}
                            </p>
                            <p className="mt-0.5 text-[10px] text-zinc-600">
                              {new Date(a.dateCreation).toLocaleDateString(
                                "fr-FR",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1 rounded-lg border border-[#ffbd13]/20 bg-[#ffbd13]/10 px-2 py-1">
                          <Star className="h-3 w-3 fill-[#ffbd13] text-[#ffbd13]" />
                          <span className="text-xs font-black text-[#ffbd13]">
                            {a.note}
                          </span>
                        </div>
                      </div>

                      {a.commentaire && (
                        <p className="mt-3 border-l-2 border-[#ffbd13]/25 pl-3 text-xs leading-6 text-zinc-400">
                          “{a.commentaire}”
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-4">
            <div className="space-y-3 rounded-2xl border border-white/10 bg-[#0d0f15]/95 p-4 shadow-2xl backdrop-blur-xl">
              <button
                type="button"
                onClick={handleVoirCarte}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ffbd13] px-4 py-3 text-sm font-black text-black transition hover:bg-white active:scale-[0.98]"
              >
                <Navigation className="h-4 w-4" />
                Voir sur la carte
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-white/60 transition hover:bg-white/10 hover:text-white active:scale-[0.98]"
              >
                <X className="h-4 w-4" />
                Fermer
              </button>
            </div>

            {(commerce.horaires ?? []).length > 0 && (
              <section className="rounded-2xl border border-white/8 bg-white/[0.035] p-5">
                <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/30">
                  <Clock className="h-4 w-4 text-[#ffbd13]" />
                  Horaires
                </div>

                <div className="space-y-1.5">
                  {commerce.horaires
                    .slice()
                    .sort((a, b) => a.jourSemaine - b.jourSemaine)
                    .map((h: HoraireCommerce) => {
                      const jsDay = new Date().getDay();
                      const normalized =
                        h.jourSemaine === 6 ? 0 : h.jourSemaine + 1;
                      const isToday = jsDay === normalized;

                      return (
                        <div
                          key={h.id}
                          className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-xs ${
                            isToday
                              ? "border border-[#ffbd13]/20 bg-[#ffbd13]/10"
                              : "bg-black/20"
                          }`}
                        >
                          <span
                            className={`font-black ${
                              isToday ? "text-[#ffbd13]" : "text-zinc-400"
                            }`}
                          >
                            {JOURS[h.jourSemaine] ?? `Jour ${h.jourSemaine}`}
                          </span>

                          {h.estFerme ? (
                            <span className="font-black text-red-400/75">
                              Fermé
                            </span>
                          ) : (
                            <span
                              className={`font-black ${
                                isToday ? "text-white" : "text-zinc-500"
                              }`}
                            >
                              {h.heureOuverture} – {h.heureFermeture}
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-[#ffbd13]/15 bg-gradient-to-br from-[#ffbd13]/10 to-white/[0.02] p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#ffbd13]/20 bg-[#ffbd13]/15">
                  <Star className="h-4 w-4 fill-[#ffbd13] text-[#ffbd13]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    Noter ce commerce
                  </h3>
                  <p className="text-xs text-white/35">
                    Aidez les autres visiteurs.
                  </p>
                </div>
              </div>

              {!isLoggedIn ? (
                <div className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-center text-xs text-zinc-500">
                  Connectez-vous pour laisser un avis.
                </div>
              ) : submitSuccess ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-400">
                  <Check className="h-4 w-4" />
                  Merci pour votre avis !
                </div>
              ) : (
                <div className="space-y-3">
                  <StarPicker
                    value={myNote}
                    hover={hoverNote}
                    onChange={setMyNote}
                    onHover={setHoverNote}
                  />

                  <textarea
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    placeholder="Votre avis (optionnel)..."
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-white/8 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-[#ffbd13]/45 focus:ring-1 focus:ring-[#ffbd13]/20"
                  />

                  {submitError && (
                    <p className="text-xs text-red-400">{submitError}</p>
                  )}

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!myNote || submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ffbd13] px-4 py-3 text-sm font-black text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35 active:scale-[0.98]"
                  >
                    <Send className="h-4 w-4" />
                    {submitting ? "Publication..." : "Publier"}
                  </button>
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function CommerceCard({
  commerce,
  onDetails,
}: {
  commerce: Commerce;
  onDetails: (c: Commerce) => void;
}) {
  const [fav, setFav] = useState(() => isFavorite(commerce.id));

  function handleFav(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    setFav(toggleFavorite(commerce.id));
  }

  const firstPhoto = commerce.photos?.[0];
  const note = commerce.noteGlobale;
  const nbAvis = commerce.nombreAvis;

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

        {note !== null && note !== undefined && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-xl border border-[#ffbd13]/30 bg-black/70 px-2.5 py-1 backdrop-blur-sm">
            <Star className="h-3 w-3 fill-[#ffbd13] text-[#ffbd13]" />
            <span className="text-[11px] font-black text-[#ffbd13]">
              {note}
            </span>
            <span className="text-[10px] text-white/30">({nbAvis})</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleFav}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/60 backdrop-blur-md transition-all hover:bg-red-500/20 active:scale-90"
        >
          <Heart
            className={`h-4 w-4 ${
              fav ? "fill-red-500 text-red-500" : "text-white"
            }`}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="truncate text-xl font-bold text-white group-hover:text-[#ffbd13]">
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

        <button
          type="button"
          onClick={() => onDetails(commerce)}
          className="w-full rounded-2xl bg-[#ffbd13] py-3 text-xs font-black uppercase tracking-widest text-black transition hover:bg-white active:scale-[0.98]"
        >
          Voir détails
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
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedLabel =
    options.find((o) => o.value === value)?.label ?? placeholder;

  return (
    <div ref={ref} className="relative min-w-[200px]">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-[11px] font-black uppercase tracking-widest transition-all ${
          open
            ? "border-[#ffbd13] bg-[#1a1d23] text-white"
            : "border-white/5 bg-[#16191d] text-zinc-400 hover:border-white/20"
        }`}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            open ? "rotate-180 text-[#ffbd13]" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-full overflow-hidden rounded-xl border border-white/10 bg-[#16191d] shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
          <div className="max-h-60 overflow-y-auto">
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

export default function ExplorePage() {
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCommerce, setSelectedCommerce] = useState<Commerce | null>(
    null
  );
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortRef = useRef<HTMLDivElement | null>(null);

  const itemsPerPage = 6;

  useEffect(() => {
    let mounted = true;

    async function fetchCommerces() {
      try {
        const data = await getAllCommerces();

        if (mounted) {
          setCommerces(data);
          setLoadError(null);
        }
      } catch (err) {
        if (mounted) {
          setLoadError(
            err instanceof Error
              ? err.message
              : "Erreur de connexion au serveur."
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchCommerces();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function resetPage() {
    setCurrentPage(1);
  }

  function handleSearch(value: string) {
    setSearch(value);
    resetPage();
  }

  function handleCategory(value: string) {
    setCatFilter(value);
    resetPage();
  }

  function handleTag(value: string) {
    setTagFilter(value);
    resetPage();
  }

  function handleSort(value: SortOption) {
    setSortBy(value);
    setShowSortMenu(false);
    resetPage();
  }

  async function handleRetry() {
    setLoading(true);

    try {
      const data = await getAllCommerces();
      setCommerces(data);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Erreur serveur.");
    } finally {
      setLoading(false);
    }
  }

  const categories = useMemo<string[]>(
    () =>
      Array.from(
        new Set(
          commerces
            .map((c) => c.nomCategorie)
            .filter((c): c is string => Boolean(c?.trim()))
        )
      ).sort((a, b) => a.localeCompare(b)),
    [commerces]
  );

  const allTags = useMemo<string[]>(
    () =>
      Array.from(new Set(commerces.flatMap((c) => c.tagsCulturels ?? []))).sort(
        (a, b) => a.localeCompare(b)
      ),
    [commerces]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    const result = commerces.filter((c) => {
      const adresse = c.adresse ?? "";
      const description = c.description ?? "";

      const matchSearch =
        !q ||
        c.nom.toLowerCase().includes(q) ||
        adresse.toLowerCase().includes(q) ||
        description.toLowerCase().includes(q);

      const matchCat = catFilter === "all" || c.nomCategorie === catFilter;
      const matchTag =
        tagFilter === "all" || (c.tagsCulturels ?? []).includes(tagFilter);

      return matchSearch && matchCat && matchTag;
    });

    if (sortBy === "rating") {
      return [...result].sort((a, b) => {
        const na = a.noteGlobale ?? -1;
        const nb = b.noteGlobale ?? -1;
        return nb - na;
      });
    }

    if (sortBy === "name") {
      return [...result].sort((a, b) => a.nom.localeCompare(b.nom));
    }

    return [...result].sort(
      (a, b) =>
        new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()
    );
  }, [commerces, search, catFilter, tagFilter, sortBy]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const paginatedItems = useMemo(() => {
    const safePage = Math.min(currentPage, Math.max(totalPages, 1));
    const start = (safePage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, totalPages]);

  const categoryOptions = useMemo<SelectOption[]>(
    () => [
      { value: "all", label: "TOUTES CATÉGORIES" },
      ...categories.map((c) => ({ value: c, label: c.toUpperCase() })),
    ],
    [categories]
  );

  const tagOptions = useMemo<SelectOption[]>(
    () => [
      { value: "all", label: "TOUS LES TAGS" },
      ...allTags.map((t) => ({ value: t, label: t.toUpperCase() })),
    ],
    [allTags]
  );

  const hasFilters =
    search.trim() !== "" || catFilter !== "all" || tagFilter !== "all";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] text-white selection:bg-[#ffbd13]/30">
      <div className="pointer-events-none fixed inset-0 z-0">
        <Trophy className="absolute left-[5%] top-[15%] h-64 w-64 -rotate-12 text-[#ffbd13] opacity-[0.06] blur-[2px]" />
        <Navigation className="absolute bottom-[20%] right-[8%] h-72 w-72 rotate-12 text-[#ffbd13] opacity-[0.04] blur-[1px]" />
        <Store className="absolute right-[12%] top-[45%] h-48 w-48 -rotate-6 text-[#ffbd13] opacity-[0.05]" />
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
            du Monde 2030.
          </p>
        </header>

        <div className="mb-16 space-y-8">
          <div className="group relative max-w-4xl">
            <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#ffbd13]" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="RECHERCHER UN COMMERCE, UNE SPÉCIALITÉ..."
              className="w-full rounded-2xl border border-white/5 bg-[#0f1115] py-5 pl-14 pr-6 text-xs font-black uppercase tracking-widest placeholder:text-zinc-700 shadow-2xl transition-all focus:border-[#ffbd13]/50 focus:outline-none focus:ring-1 focus:ring-[#ffbd13]/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#ffbd13]">
              <Filter className="h-4 w-4" />
              Filtres :
            </div>

            <CustomSelect
              value={catFilter}
              onChange={handleCategory}
              options={categoryOptions}
            />

            <CustomSelect
              value={tagFilter}
              onChange={handleTag}
              options={tagOptions}
            />

            <div ref={sortRef} className="relative">
              <button
                type="button"
                onClick={() => setShowSortMenu((p) => !p)}
                className="flex items-center gap-2 rounded-xl border border-white/5 bg-[#16191d] px-4 py-3 text-[11px] font-black uppercase tracking-widest text-zinc-400 transition hover:border-white/20"
              >
                <ChevronUp className="h-3 w-3" />
                {SORT_LABELS[sortBy]}
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${
                    showSortMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showSortMenu && (
                <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-44 overflow-hidden rounded-xl border border-white/10 bg-[#16191d] shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSort(key)}
                      className={`flex w-full items-center justify-between px-4 py-3 text-left text-[10px] font-bold uppercase tracking-tighter transition-colors ${
                        sortBy === key
                          ? "bg-[#ffbd13] text-black"
                          : "text-zinc-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {SORT_LABELS[key]}
                      {sortBy === key && <Check className="h-3 w-3" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCatFilter("all");
                  setTagFilter("all");
                  resetPage();
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
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#ffbd13]">
              {loading
                ? "Chargement..."
                : `${filtered.length} Établissements trouvés`}
            </p>

            {!loading && sortBy === "rating" && (
              <p className="text-[10px] uppercase tracking-widest text-zinc-600">
                Triés par meilleure note
              </p>
            )}
          </div>

          {loadError ? (
            <div className="flex flex-col items-center justify-center rounded-[3rem] border border-dashed border-red-500/20 bg-red-500/5 py-20 text-center">
              <div className="mb-4 text-4xl">⚠️</div>
              <h3 className="text-xl font-black uppercase italic tracking-tighter text-red-400">
                Impossible de charger les commerces
              </h3>
              <p className="mt-2 max-w-md text-sm text-zinc-500">
                {loadError}
              </p>
              <button
                type="button"
                onClick={handleRetry}
                className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-2.5 text-sm font-bold text-red-400 transition hover:bg-red-500/20"
              >
                Réessayer
              </button>
            </div>
          ) : loading ? (
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
                  <CommerceCard
                    key={c.id}
                    commerce={c}
                    onDetails={setSelectedCommerce}
                  />
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

      {selectedCommerce && (
        <CommerceDetailModal
          commerce={selectedCommerce}
          onClose={() => setSelectedCommerce(null)}
        />
      )}
    </div>
  );
}