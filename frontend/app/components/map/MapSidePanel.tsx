"use client";

import type { MapItem, MapItemType } from "./types";
import type { RouteMode } from "@/lib/routeApi";

type MapSidePanelProps = {
  item: MapItem | null;
  onClose: () => void;
  onFocusItem?: (item: MapItem) => void;
  onRouteItem?: (item: MapItem) => void;
  onAddToTrip?: (item: MapItem) => void;
  routeMode?: RouteMode;
  onChangeRouteMode?: (mode: RouteMode) => void;
};

const getTypeLabel = (type: MapItemType) => {
  const labelMap: Record<MapItemType, string> = {
    stadium: "Stade",
    fanzone: "Fan zone",
    restaurant: "Restaurant",
    activity: "Activité",
    hotel: "Hôtel",
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
  };

  return colorMap[type];
};

function formatPrice(value?: number | null): string {
  if (value === null || value === undefined) {
    return "Prix non renseigné";
  }

  if (value === 0) {
    return "Gratuit";
  }

  return `${value} MAD`;
}

function getOpenStatusLabel(
  estOuvert?: boolean | null,
  horairesOuverture?: string | null
): string {
  if (horairesOuverture && horairesOuverture.trim().length > 0) {
    return horairesOuverture;
  }

  if (estOuvert === true) {
    return "Ouvert";
  }

  if (estOuvert === false) {
    return "Fermé";
  }

  return "Horaires non renseignés";
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
  if (!item) {
    return (
      <aside className="h-full rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
        <div className="flex h-full min-h-[650px] items-center justify-center text-center text-slate-400">
          <div>
            <p className="text-base font-medium text-slate-200">
              Aucun lieu sélectionné
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Clique sur un marqueur sur la carte pour voir ses détails ici.
            </p>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="h-full rounded-2xl border border-white/10 bg-slate-900/80 p-5 backdrop-blur">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span
              className={`inline-flex h-3 w-3 rounded-full ${getTypeColor(
                item.type
              )}`}
            />
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              {item.nomCategorie || getTypeLabel(item.type)}
            </span>
          </div>

          <h2 className="text-xl font-bold text-white">{item.name}</h2>

          {item.adresse ? (
            <p className="mt-2 text-sm text-slate-400">{item.adresse}</p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10"
        >
          Fermer
        </button>
      </div>

      {item.imageUrl ? (
        <div className="mb-5 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-52 w-full object-cover"
          />
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onFocusItem?.(item)}
          className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-400"
        >
          Voir sur la carte
        </button>

        <button
          type="button"
          onClick={() => onRouteItem?.(item)}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
        >
          Itinéraire
        </button>

        <button
          type="button"
          onClick={() => onAddToTrip?.(item)}
          className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/20"
        >
          Ajouter au parcours
        </button>
      </div>

      <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Mode d’itinéraire
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onChangeRouteMode?.("driving")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              routeMode === "driving"
                ? "bg-orange-500 text-white"
                : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            }`}
          >
            Voiture
          </button>

          <button
            type="button"
            onClick={() => onChangeRouteMode?.("walking")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              routeMode === "walking"
                ? "bg-orange-500 text-white"
                : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            }`}
          >
            Marche
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Description
          </p>
          <p className="text-sm leading-6 text-slate-200">
            {item.description || "Aucune description disponible."}
          </p>
        </div>

        {item.source === "discovery" ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Prix estimé
                </p>
                <p className="text-sm font-medium text-slate-200">
                  {formatPrice(item.prixMoyen)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Popularité
                </p>
                <p className="text-sm font-medium text-slate-200">
                  {item.popularite !== null && item.popularite !== undefined
                    ? `${item.popularite}/100`
                    : "Non renseignée"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Horaires
              </p>
              <p className="text-sm text-slate-200">
                {getOpenStatusLabel(item.estOuvert, item.horairesOuverture)}
              </p>
            </div>
          </>
        ) : null}

        {item.tagsCulturels && item.tagsCulturels.length > 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Tags
            </p>

            <div className="flex flex-wrap gap-2">
              {item.tagsCulturels.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Localisation
          </p>
          <div className="space-y-2 text-sm text-slate-200">
            <p>
              <span className="text-slate-400">Latitude :</span>{" "}
              {item.position[0].toFixed(6)}
            </p>
            <p>
              <span className="text-slate-400">Longitude :</span>{" "}
              {item.position[1].toFixed(6)}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Prochaine étape
          </p>
          <p className="text-sm text-slate-300">
            Ensuite, on pourra ajouter un itinéraire multi-étapes :
            stade → fan zone → restaurant → hôtel → lieu touristique.
          </p>
        </div>
      </div>
    </aside>
  );
}