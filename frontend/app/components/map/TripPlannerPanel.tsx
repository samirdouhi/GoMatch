"use client";

import type { MapItem, MapItemType } from "./types";

type TripPlannerPanelProps = {
  stops: MapItem[];
  onRemoveStop: (id: string) => void;
  onClearStops: () => void;
  onCalculateTrip: () => void;
  isCalculating?: boolean;
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

const getTypeDotClass = (type: MapItemType) => {
  const colorMap: Record<MapItemType, string> = {
    stadium: "bg-red-500",
    fanzone: "bg-amber-500",
    restaurant: "bg-emerald-500",
    activity: "bg-blue-500",
    hotel: "bg-violet-500",
  };

  return colorMap[type];
};

export default function TripPlannerPanel({
  stops,
  onRemoveStop,
  onClearStops,
  onCalculateTrip,
  isCalculating = false,
}: TripPlannerPanelProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 backdrop-blur">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">Parcours manuel</h3>
            <p className="mt-1 text-sm text-slate-400">
              Construis une journée étape par étape.
            </p>
          </div>

          <button
            type="button"
            onClick={onClearStops}
            disabled={stops.length === 0}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Vider
          </button>
        </div>

        {stops.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
            Aucun arrêt pour le moment. Sélectionne un lieu puis clique sur
            <span className="mx-1 font-medium text-slate-200">Ajouter au parcours</span>.
          </div>
        ) : (
          <div className="space-y-3">
            {stops.map((stop, index) => (
              <div
                key={stop.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full border border-white/10 bg-white/10 px-2 text-xs font-semibold text-white">
                        {index + 1}
                      </span>

                      <span
                        className={`inline-flex h-2.5 w-2.5 rounded-full ${getTypeDotClass(
                          stop.type
                        )}`}
                      />

                      <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                        {getTypeLabel(stop.type)}
                      </span>
                    </div>

                    <p className="truncate text-sm font-semibold text-white">
                      {stop.name}
                    </p>

                    {stop.description ? (
                      <p className="mt-2 line-clamp-2 text-sm text-slate-400">
                        {stop.description}
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveStop(stop.id)}
                    className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200 transition hover:bg-red-500/20"
                  >
                    Retirer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 backdrop-blur">
        <h3 className="text-lg font-semibold text-white">Calculer le parcours</h3>
        <p className="mt-1 text-sm text-slate-400">
          Trace l’itinéraire total depuis le point de départ à travers tous les arrêts dans l’ordre choisi.
        </p>

        <button
          type="button"
          onClick={onCalculateTrip}
          disabled={stops.length === 0 || isCalculating}
          className="mt-4 w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCalculating ? "Calcul en cours..." : "Calculer le parcours"}
        </button>
      </div>
    </div>
  );
}