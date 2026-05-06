"use client";

import { useEffect, useState } from "react";
import {
  MapPin,
  Tag,
  Star,
  Clock,
  Navigation,
  Plus,
  X,
  LocateFixed,
  ImageIcon,
  MessageSquare,
} from "lucide-react";
import type { MapItem, MapItemType } from "./types";
import type { RouteMode } from "@/lib/routeApi";
import { getAvis, type Avis } from "@/lib/commercesApi";

type MapSidePanelProps = {
  item: MapItem | null;
  onClose: () => void;
  onFocusItem?: (item: MapItem) => void;
  onRouteItem?: (item: MapItem) => void;
  onAddToTrip?: (item: MapItem) => void;
  routeMode?: RouteMode;
  onChangeRouteMode?: (mode: RouteMode) => void;
};

const JOURS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

const getTypeLabel = (type: MapItemType) => {
  const labelMap: Record<MapItemType, string> = {
    stadium: "Stade",
    fanzone: "Fan zone",
    restaurant: "Restaurant",
    activity: "Activité",
    hotel: "Hôtel",
    culture: "Culturel",
  };

  return labelMap[type];
};

const getTypeColor = (type: MapItemType) => {
  const colorMap: Record<MapItemType, string> = {
    stadium: "bg-red-500",
    fanzone: "bg-amber-500",
    restaurant: "bg-emerald-500",
    activity: "bg-blue-500",
    hotel: "bg-violet-500",
    culture: "bg-purple-400",
  };

  return colorMap[type];
};

function getRating(item: MapItem): number | null {
  if (item.source !== "business") return null;
  if (typeof item.noteGlobale === "number") return item.noteGlobale;
  if (typeof item.note === "number") return item.note;
  return null;
}

function StarsDisplay({ note }: { note: number | null }) {
  const rounded = note === null ? 0 : Math.round(note);

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-4 w-4 ${
            s <= rounded
              ? "fill-[#ffbd13] text-[#ffbd13]"
              : "text-white/15"
          }`}
        />
      ))}
    </div>
  );
}

function getOpenStatusLabel(
  estOuvert?: boolean | null,
  horairesOuverture?: string | null
): string {
  if (horairesOuverture && horairesOuverture.trim().length > 0) {
    return horairesOuverture;
  }

  if (estOuvert === true) return "Ouvert";
  if (estOuvert === false) return "Fermé";

  return "Horaires non renseignés";
}

function formatPrice(value?: number | null): string {
  if (value === null || value === undefined) return "Prix non renseigné";
  if (value === 0) return "Gratuit";
  return `${value} MAD`;
}

function getCommerceIdFromMapItem(item: MapItem): string {
  return item.id.replace(/^business-/, "");
}

export default function MapSidePanel({
  item,
  onClose,
  onFocusItem,
  onRouteItem,
  onAddToTrip,
  routeMode = "driving",
  onChangeRouteMode,
}: MapSidePanelProps) {
  const [loadedAvis, setLoadedAvis] = useState<Avis[]>([]);
  const [loadingAvis, setLoadingAvis] = useState(false);

  const isBusiness = item?.source === "business";

  useEffect(() => {
    let mounted = true;

    async function loadAvis() {
      if (!item || item.source !== "business") {
        setLoadedAvis([]);
        return;
      }

      const commerceId = getCommerceIdFromMapItem(item);

      setLoadingAvis(true);

      try {
        const data = await getAvis(commerceId);
        if (mounted) setLoadedAvis(data);
      } catch {
        if (mounted) setLoadedAvis([]);
      } finally {
        if (mounted) setLoadingAvis(false);
      }
    }

    void loadAvis();

    return () => {
      mounted = false;
    };
  }, [item?.id, item?.source]);

  if (!item) {
    return (
      <aside className="h-full rounded-2xl border border-white/10 bg-[#090b10] p-5">
        <div className="flex h-full min-h-[650px] items-center justify-center text-center">
          <div>
            <MapPin className="mx-auto mb-4 h-10 w-10 text-white/15" />
            <p className="text-base font-black text-white">
              Aucun lieu sélectionné
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Clique sur un marqueur pour afficher les détails.
            </p>
          </div>
        </div>
      </aside>
    );
  }

  const rating = getRating(item);
  const avisList = isBusiness
    ? loadedAvis.length > 0
      ? loadedAvis
      : item.avis ?? []
    : [];

  const avisCount = isBusiness ? item.nombreAvis ?? avisList.length : null;
  const category = item.nomCategorie || getTypeLabel(item.type);

  return (
    <aside className="h-full rounded-2xl border border-white/10 bg-[#07080d] text-white shadow-2xl">
      <div className="max-h-full overflow-y-auto p-5">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2">
              <span
                className={`inline-flex h-2.5 w-2.5 rounded-full ${getTypeColor(
                  item.type
                )}`}
              />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#ffbd13]">
                {category}
              </span>
            </div>

            <h2 className="text-2xl font-black leading-tight text-white">
              {item.name}
            </h2>

            {isBusiness && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-[#ffbd13]/20 bg-[#ffbd13]/10 px-3 py-1.5">
                  <StarsDisplay note={rating} />
                  <span className="text-xs font-black text-[#ffbd13]">
                    {rating !== null ? `${rating.toFixed(1)}/5` : "N/A"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-white/55">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {avisCount} avis
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="h-48 w-full object-cover"
            />
          ) : (
            <div className="flex h-40 flex-col items-center justify-center gap-2">
              <ImageIcon className="h-9 w-9 text-white/15" />
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/25">
                Aucune photo disponible
              </p>
            </div>
          )}
        </div>

        <div
          className={`mb-5 grid gap-3 ${
            isBusiness ? "grid-cols-3" : "grid-cols-1"
          }`}
        >
          <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/25">
              Catégorie
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-black text-[#ffbd13]">
              <Tag className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{category}</span>
            </div>
          </div>

          {isBusiness && (
            <>
              <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-3">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/25">
                  Note
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 fill-[#ffbd13] text-[#ffbd13]" />
                  <span className="text-xs font-black text-white">
                    {rating !== null ? `${rating.toFixed(1)}/5` : "Nouveau"}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-3">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/25">
                  Avis
                </p>
                <p className="mt-2 text-xs font-black text-white">
                  {avisCount} avis
                </p>
              </div>
            </>
          )}
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onFocusItem?.(item)}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#ffbd13] px-4 py-3 text-xs font-black uppercase tracking-widest text-black transition hover:bg-white active:scale-[0.98]"
          >
            <LocateFixed className="h-4 w-4" />
            Voir sur carte
          </button>

          <button
            type="button"
            onClick={() => onRouteItem?.(item)}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-black uppercase tracking-widest text-white/70 transition hover:bg-white/10 hover:text-white active:scale-[0.98]"
          >
            <Navigation className="h-4 w-4" />
            Itinéraire
          </button>

          <button
            type="button"
            onClick={() => onAddToTrip?.(item)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs font-black uppercase tracking-widest text-emerald-300 transition hover:bg-emerald-500/20 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Ajouter au parcours
          </button>
        </div>

        <div className="mb-5 rounded-2xl border border-white/8 bg-white/[0.035] p-4">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#ffbd13]">
            Mode d’itinéraire
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onChangeRouteMode?.("driving")}
              className={`rounded-xl px-4 py-2.5 text-sm font-black transition ${
                routeMode === "driving"
                  ? "bg-[#ffbd13] text-black"
                  : "border border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/10 hover:text-white"
              }`}
            >
              Voiture
            </button>

            <button
              type="button"
              onClick={() => onChangeRouteMode?.("walking")}
              className={`rounded-xl px-4 py-2.5 text-sm font-black transition ${
                routeMode === "walking"
                  ? "bg-[#ffbd13] text-black"
                  : "border border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/10 hover:text-white"
              }`}
            >
              Marche
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
            <h3 className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#ffbd13]">
              À propos
            </h3>

            <p className="whitespace-pre-line text-sm leading-7 text-zinc-300">
              {item.description || "Aucune description disponible."}
            </p>

            {item.tagsCulturels && item.tagsCulturels.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {item.tagsCulturels.map((tag) => (
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

          {item.adresse && (
            <section className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
              <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/30">
                <MapPin className="h-4 w-4 text-[#ffbd13]" />
                Adresse
              </div>

              <p className="text-sm leading-6 text-zinc-300">{item.adresse}</p>
            </section>
          )}

          {isBusiness ? (
            <>
              <section className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
                <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/30">
                  <Clock className="h-4 w-4 text-[#ffbd13]" />
                  Horaires
                </div>

                {item.horaires && item.horaires.length > 0 ? (
                  <div className="space-y-2">
                    {item.horaires
                      .slice()
                      .sort((a, b) => a.jourSemaine - b.jourSemaine)
                      .map((h) => (
                        <div
                          key={h.id ?? h.jourSemaine}
                          className="flex items-center justify-between rounded-xl bg-black/25 px-3 py-2 text-xs"
                        >
                          <span className="font-black text-zinc-300">
                            {JOURS[h.jourSemaine] ?? `Jour ${h.jourSemaine}`}
                          </span>

                          {h.estFerme ? (
                            <span className="font-black text-red-400">
                              Fermé
                            </span>
                          ) : (
                            <span className="font-black text-white/65">
                              {h.heureOuverture} - {h.heureFermeture}
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-300">
                    Horaires non renseignés
                  </p>
                )}
              </section>

              <section className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.22em] text-[#ffbd13]">
                      Avis clients
                    </h3>
                    <p className="mt-1 text-xs text-white/35">
                      {loadingAvis
                        ? "Chargement..."
                        : `${avisList.length} avis affiché${
                            avisList.length > 1 ? "s" : ""
                          }`}
                    </p>
                  </div>
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
                ) : avisList.length > 0 ? (
                  <div className="space-y-3">
                    {avisList.slice(0, 4).map((avis) => (
                      <article
                        key={avis.id}
                        className="rounded-2xl border border-white/7 bg-black/25 p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-black text-zinc-300">
                              {avis.utilisateurEmail?.split("@")[0] ??
                                "Anonyme"}
                            </p>

                            {avis.dateCreation && (
                              <p className="mt-0.5 text-[10px] text-zinc-600">
                                {new Date(
                                  avis.dateCreation
                                ).toLocaleDateString("fr-FR")}
                              </p>
                            )}
                          </div>

                          <div className="flex shrink-0 items-center gap-1 rounded-lg border border-[#ffbd13]/20 bg-[#ffbd13]/10 px-2 py-1">
                            <Star className="h-3 w-3 fill-[#ffbd13] text-[#ffbd13]" />
                            <span className="text-xs font-black text-[#ffbd13]">
                              {avis.note}
                            </span>
                          </div>
                        </div>

                        {avis.commentaire && (
                          <p className="mt-3 border-l-2 border-[#ffbd13]/25 pl-3 text-xs leading-6 text-zinc-400">
                            “{avis.commentaire}”
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 py-6 text-center">
                    <MessageSquare className="mx-auto mb-2 h-5 w-5 text-white/15" />
                    <p className="text-sm font-bold text-zinc-500">
                      Aucun avis pour l’instant
                    </p>
                  </div>
                )}
              </section>
            </>
          ) : (
            <section className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
              <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/30">
                <Clock className="h-4 w-4 text-[#ffbd13]" />
                Informations pratiques
              </div>
              <p className="text-sm text-zinc-300">
                {getOpenStatusLabel(item.estOuvert, item.horairesOuverture)}
              </p>
            </section>
          )}

          {item.source === "discovery" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/30">
                  Prix estimé
                </p>
                <p className="text-sm font-black text-white">
                  {formatPrice(item.prixMoyen)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/30">
                  Popularité
                </p>
                <p className="text-sm font-black text-white">
                  {item.popularite !== null && item.popularite !== undefined
                    ? `${item.popularite}/100`
                    : "Non renseignée"}
                </p>
              </div>
            </div>
          )}

          <section className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/30">
              Localisation
            </p>

            <div className="space-y-1 text-sm text-zinc-300">
              <p>
                <span className="text-zinc-500">Latitude :</span>{" "}
                {item.position[0].toFixed(6)}
              </p>
              <p>
                <span className="text-zinc-500">Longitude :</span>{" "}
                {item.position[1].toFixed(6)}
              </p>
            </div>
          </section>
        </div>
      </div>
    </aside>
  );
}