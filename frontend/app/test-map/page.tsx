"use client";

import { useEffect, useMemo, useState } from "react";
import ExperienceMapClient from "../components/map/ExperienceMapClient";
import MapLegend from "../components/map/MapLegend";
import MapFilters from "../components/map/MapFilters";
import MapSidePanel from "../components/map/MapSidePanel";
import TripPlannerPanel from "../components/map/TripPlannerPanel";
import type { MapItem, MapItemType } from "../components/map/types";
import { ALL_MAP_TYPES } from "../components/map/types";
import { fetchMapItems } from "@/lib/mapApi";
import {
  fetchRouteBetweenPoints,
  fetchRouteThroughStops,
  formatDistance,
  formatDuration,
  type RouteMode,
} from "@/lib/routeApi";

const RABAT_FALLBACK_POINT: [number, number] = [34.020882, -6.84165];

type OpenSection = "" | "position" | "filters" | "planner" | "details";
type NavigationMode = "live" | "manual";

export default function TestMapPage() {
  const [selectedTypes, setSelectedTypes] =
    useState<MapItemType[]>(ALL_MAP_TYPES);
  const [items, setItems] = useState<MapItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MapItem | null>(null);
  const [focusKey, setFocusKey] = useState(0);

  const [tripStops, setTripStops] = useState<MapItem[]>([]);

  const [liveUserPosition, setLiveUserPosition] = useState<
    [number, number] | null
  >(null);

  const [manualStartPoint, setManualStartPoint] = useState<
    [number, number] | null
  >(null);

  const [startPointSource, setStartPointSource] = useState<
    "user" | "fallback" | "manual"
  >("fallback");

  const [navigationMode, setNavigationMode] =
    useState<NavigationMode>("live");

  const [routeMode, setRouteMode] = useState<RouteMode>("driving");
  const [routeSegments, setRouteSegments] = useState<[number, number][][]>([]);
  const [routeDistanceLabel, setRouteDistanceLabel] = useState("");
  const [routeDurationLabel, setRouteDurationLabel] = useState("");
  const [routeLoading, setRouteLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [geoStatus, setGeoStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [geoErrorMessage, setGeoErrorMessage] = useState<string | null>(null);
  const [geoAccuracy, setGeoAccuracy] = useState<number | null>(null);

  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [openSection, setOpenSection] = useState<OpenSection>("filters");

  const routeStartPoint = useMemo<[number, number] | null>(() => {
    if (navigationMode === "manual" && manualStartPoint) {
      return manualStartPoint;
    }

    if (liveUserPosition) {
      return liveUserPosition;
    }

    return null;
  }, [navigationMode, manualStartPoint, liveUserPosition]);

  const visibleItems = useMemo(() => {
    return items.filter((item) => selectedTypes.includes(item.type));
  }, [items, selectedTypes]);

  const toggleType = (type: MapItemType) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((item) => item !== type)
        : [...prev, type]
    );
  };

  const clearRoute = () => {
    setRouteSegments([]);
    setRouteDistanceLabel("");
    setRouteDurationLabel("");
  };

  const toggleSection = (sectionId: OpenSection) => {
    setOpenSection((prev) => (prev === sectionId ? "" : sectionId));
  };

  const calculateRouteToItem = async (
    start: [number, number],
    item: MapItem,
    mode: RouteMode
  ) => {
    setRouteLoading(true);
    clearRoute();

    try {
      const route = await fetchRouteBetweenPoints(start, item.position, mode);
      setRouteSegments([route.coordinates]);
      setRouteDistanceLabel(formatDistance(route.distanceMeters));
      setRouteDurationLabel(formatDuration(route.durationSeconds));
    } finally {
      setRouteLoading(false);
    }
  };

  const calculateTripRoute = async () => {
    if (tripStops.length === 0 || !routeStartPoint) return;

    setRouteLoading(true);
    clearRoute();

    try {
      const stopsPositions = tripStops.map((stop) => stop.position);
      const result = await fetchRouteThroughStops(
        routeStartPoint,
        stopsPositions,
        routeMode
      );
      setRouteSegments(result.segments.map((segment) => segment.coordinates));
      setRouteDistanceLabel(formatDistance(result.totalDistanceMeters));
      setRouteDurationLabel(formatDuration(result.totalDurationSeconds));
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Impossible de calculer le parcours."
      );
    } finally {
      setRouteLoading(false);
    }
  };

  const handleSelectItem = (item: MapItem) => {
    setSelectedItem(item);
    setFocusKey((prev) => prev + 1);
    setOpenSection("details");
  };

  const handleFocusItem = (item: MapItem) => {
    setSelectedItem(item);
    setFocusKey((prev) => prev + 1);
    setOpenSection("details");
  };

  const handleAddToTrip = (item: MapItem) => {
    setTripStops((prev) => {
      if (prev.some((stop) => stop.id === item.id)) return prev;
      return [...prev, item];
    });
    setOpenSection("planner");
  };

  const handleRemoveStop = (id: string) => {
    setTripStops((prev) => prev.filter((stop) => stop.id !== id));
  };

  const handleClearStops = () => {
    setTripStops([]);
  };

  const handleRouteItem = async (item: MapItem) => {
    if (!routeStartPoint) {
      alert("Position réelle non disponible pour calculer l’itinéraire.");
      return;
    }

    try {
      setSelectedItem(item);
      setFocusKey((prev) => prev + 1);
      setOpenSection("details");
      await calculateRouteToItem(routeStartPoint, item, routeMode);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Impossible de calculer l’itinéraire."
      );
    }
  };

  const handleSelectStartPoint = async (position: [number, number]) => {
    setNavigationMode("manual");
    setManualStartPoint(position);
    setStartPointSource("manual");

    if (tripStops.length > 0) {
      await calculateTripRoute();
      return;
    }

    if (selectedItem) {
      try {
        await calculateRouteToItem(position, selectedItem, routeMode);
      } catch (err) {
        alert(
          err instanceof Error
            ? err.message
            : "Impossible de recalculer l’itinéraire."
        );
      }
    } else {
      clearRoute();
    }
  };

  const handleResumeLivePosition = () => {
    setNavigationMode("live");
    setManualStartPoint(null);
    setGeoStatus("loading");
    setGeoErrorMessage(null);
  };

  const handleChangeRouteMode = async (mode: RouteMode) => {
    setRouteMode(mode);

    if (!routeStartPoint) return;

    if (tripStops.length > 0) {
      setTimeout(() => void calculateTripRoute(), 0);
      return;
    }

    if (selectedItem) {
      try {
        await calculateRouteToItem(routeStartPoint, selectedItem, mode);
      } catch (err) {
        alert(
          err instanceof Error
            ? `Impossible de recalculer l’itinéraire : ${err.message}`
            : "Impossible de recalculer l’itinéraire."
        );
      }
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadMapData() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchMapItems();
        if (!cancelled) setItems(data);
      } catch {
        if (!cancelled) setError("Erreur de chargement des données.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadMapData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      setGeoErrorMessage(
        "La géolocalisation n'est pas supportée par ce navigateur."
      );
      setStartPointSource("fallback");
      return;
    }

    setGeoStatus("loading");
    setGeoErrorMessage(null);

    const onSuccess = (pos: GeolocationPosition) => {
      const latitude = pos.coords.latitude;
      const longitude = pos.coords.longitude;
      const accuracy = pos.coords.accuracy;

      console.log("GPS SUCCESS", {
        lat: latitude,
        lng: longitude,
        accuracy,
      });

      setLiveUserPosition([latitude, longitude]);
      setGeoAccuracy(accuracy);
      setGeoStatus("success");
      setGeoErrorMessage(null);

      if (navigationMode === "live") {
        setStartPointSource("user");
      }
    };

    const onError = (geoError: GeolocationPositionError) => {
      console.log("GPS ERROR", {
        code: geoError.code,
        message: geoError.message,
      });

      let message = "Impossible de récupérer votre position réelle.";

      if (geoError.code === geoError.PERMISSION_DENIED) {
        message = "Permission de localisation refusée.";
      } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
        message = "Position indisponible pour le moment.";
      } else if (geoError.code === geoError.TIMEOUT) {
        message = "Temps d'attente dépassé pour la géolocalisation.";
      }

      setGeoStatus("error");
      setGeoErrorMessage(message);
      setGeoAccuracy(null);

      if (!liveUserPosition && navigationMode !== "manual") {
        setStartPointSource("fallback");
      }
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });

    const watchId = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0,
    });

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [navigationMode, liveUserPosition]);

  useEffect(() => {
    if (
      selectedItem &&
      !visibleItems.some((item) => item.id === selectedItem.id)
    ) {
      setSelectedItem(null);
      clearRoute();
      if (openSection === "details") {
        setOpenSection("");
      }
    }
  }, [visibleItems, selectedItem, openSection]);

  useEffect(() => {
    if (!routeStartPoint) return;
    if (navigationMode !== "live") return;
    if (!selectedItem && tripStops.length === 0) return;

    if (tripStops.length > 0) {
      void calculateTripRoute();
      return;
    }

    if (selectedItem) {
      void calculateRouteToItem(routeStartPoint, selectedItem, routeMode);
    }
  }, [liveUserPosition]);

  useEffect(() => {
    const resizeTimeout = setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 350);

    return () => clearTimeout(resizeTimeout);
  }, [isMapExpanded]);

  return (
    <main className="relative flex h-screen w-screen overflow-hidden bg-[#050505] font-sans text-white">
      <style jsx global>{`
        html,
        body {
          overflow: hidden;
        }

        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .dark-theme-enforcer [class*="bg-slate-800"],
        .dark-theme-enforcer [class*="bg-slate-900"],
        .dark-theme-enforcer [class*="bg-blue-900"],
        .dark-theme-enforcer [class*="bg-indigo-900"] {
          background-color: rgba(255, 255, 255, 0.03) !important;
          border-color: rgba(255, 255, 255, 0.05) !important;
        }

        .leaflet-container {
          width: 100% !important;
          height: 100% !important;
          background: #1a1a1a !important;
        }

        .leaflet-control-zoom {
          position: absolute !important;
          top: auto !important;
          left: auto !important;
          bottom: 24px !important;
          right: 24px !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important;
          border-radius: 8px !important;
          overflow: hidden !important;
        }

        .leaflet-control-zoom a {
          background-color: rgba(0, 0, 0, 0.7) !important;
          color: white !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          transition: background-color 0.2s !important;
        }

        .leaflet-control-zoom a:hover {
          background-color: #ff8a00 !important;
          color: black !important;
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute left-[-120px] top-20 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 overflow-hidden">
        <aside
          className={`no-scrollbar dark-theme-enforcer flex h-full shrink-0 flex-col overflow-y-auto border-white/5 bg-black/60 backdrop-blur-3xl shadow-[20px_0_50px_rgba(0,0,0,0.8)] transition-all duration-300 ease-in-out ${
            isMapExpanded
              ? "absolute -translate-x-full opacity-0 lg:relative lg:w-0 lg:min-w-0 lg:translate-x-0"
              : "absolute inset-y-0 left-0 z-40 w-full max-w-[430px] border-r lg:relative lg:w-[420px]"
          }`}
        >
          <div className="space-y-6 p-5 pb-24 lg:p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-[0.9]">
                  Explorer <br />
                  <span className="bg-gradient-to-r from-[#FF8A00] to-[#FFD700] bg-clip-text text-transparent">
                    Le Maroc
                  </span>
                </h2>
                <div className="mt-2 h-1 w-12 rounded-full bg-gradient-to-r from-[#FF8A00] to-transparent" />
              </div>

              <button
                onClick={() => setIsMapExpanded(true)}
                className="rounded-full bg-white/10 p-2 text-white lg:hidden"
                aria-label="Fermer le panneau"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
<div className="rounded-xl border border-white/5 bg-white/[0.02] p-2 text-center">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/40">
                  Spots
                </p>
                <p className="mt-1 text-sm font-black text-white">
                  {visibleItems.length}
                </p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2 text-center">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/40">
                  Mode
                </p>
                <p className="mt-1 pt-1 text-[11px] font-black text-white">
                  {routeMode === "driving" ? "Auto" : "Pied"}
                </p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2 text-center">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/40">
                  Étapes
                </p>
                <p className="mt-1 text-sm font-black text-white">
                  {tripStops.length}
                </p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2 text-center">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/40">
                  Tracé
                </p>
                <p className="mt-1 pt-1 text-[10px] font-bold text-[#FF8A00]">
                  {routeSegments.length > 0 ? "Actif" : "Aucun"}
                </p>
              </div>
            </div>

            {loading && (
              <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3 text-center text-xs font-bold uppercase text-[#FFD700]">
                Chargement des données...
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-xs font-bold text-red-300">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <div className="border-b border-white/10 py-2">
                <button
                  onClick={() => toggleSection("position")}
                  className="flex w-full items-center justify-between py-2 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-colors hover:text-[#FF8A00]"
                >
                  <span>1. Position & Trajet Actif</span>
                  <span className="text-lg leading-none">
                    {openSection === "position" ? "−" : "+"}
                  </span>
                </button>

                {openSection === "position" && (
                  <div className="mt-3 space-y-3 pb-3">
                    <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] p-4">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40">
                          Point de départ actif
                        </p>
                        <p className="mt-1 text-sm font-bold text-white">
                          {routeStartPoint
                            ? `${routeStartPoint[0].toFixed(4)}, ${routeStartPoint[1].toFixed(4)}`
                            : "Position réelle non disponible"}
                        </p>
                      </div>
                      <span className="rounded-full bg-white/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-white/60">
                        {startPointSource === "user"
                          ? "GPS"
                          : startPointSource === "manual"
                          ? "Manuel"
                          : "Défaut"}
                      </span>
                    </div>

                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40">
                        État de localisation
                      </p>

                      {geoStatus === "loading" && (
                        <p className="mt-2 text-sm font-medium text-[#FFD700]">
                          Localisation en cours...
                        </p>
                      )}

                      {geoStatus === "success" && (
                        <p className="mt-2 text-sm font-medium text-emerald-300">
                          Position réelle détectée avec succès.
                        </p>
                      )}

                      {geoStatus === "error" && (
                        <p className="mt-2 text-sm font-medium text-red-300">
                          {geoErrorMessage}
                        </p>
                      )}

                      {geoStatus === "idle" && (
                        <p className="mt-2 text-sm font-medium text-white/50">
                          En attente de la géolocalisation.
                        </p>
                      )}

                      {geoStatus === "success" && geoAccuracy !== null && (
                        <p className="mt-2 text-xs text-white/55">
                          Précision estimée : ± {Math.round(geoAccuracy)} m
                        </p>
                      )}

                      <p className="mt-2 text-xs text-white/55">
                        Mode actuel :{" "}
                        {navigationMode === "live"
                          ? "suivi GPS en direct"
                          : "point manuel"}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleResumeLivePosition}
                        className="flex-1 rounded-xl border border-[#3b82f6]/20 bg-[#3b82f6]/10 px-4 py-2 text-sm font-bold text-sky-300 transition hover:bg-[#3b82f6]/20"
                      >
                        Suivre ma position
                      </button>

                      <button
                        type="button"
                        onClick={() => setNavigationMode("manual")}
                        className="flex-1 rounded-xl border border-[#FF8A00]/20 bg-[#FF8A00]/10 px-4 py-2 text-sm font-bold text-[#FFD700] transition hover:bg-[#FF8A00]/20"
                      >
                        Mode manuel
                      </button>
                    </div>

                    {(routeSegments.length > 0 || routeDistanceLabel) && (
                      <div className="rounded-xl border border-[#FF8A00]/20 bg-[#FF8A00]/5 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF8A00]">
                            Trajet en cours
                          </p>
                          <button
                            onClick={clearRoute}
                            className="text-[9px] font-bold uppercase tracking-widest text-red-400 hover:text-red-300"
                          >
                            Effacer
                          </button>
                        </div>
                        <div className="flex items-end gap-3">
                          <span className="text-2xl font-black italic text-white">
                            {routeDistanceLabel}
                          </span>
                          <span className="mb-1 text-xs font-bold uppercase text-white/60">
                            {routeDurationLabel}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="border-b border-white/10 py-2">
                <button
                  onClick={() => toggleSection("filters")}
                  className="flex w-full items-center justify-between py-2 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-colors hover:text-[#FF8A00]"
                >
                  <span>2. Filtres & Légende</span>
                  <span className="text-lg leading-none">
                    {openSection === "filters" ? "−" : "+"}
                  </span>
                </button>

                {openSection === "filters" && (
                  <div className="mt-3 space-y-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4 pb-3">
                    <MapFilters
                      selectedTypes={selectedTypes}
                      onToggle={toggleType}
                    />
                    <div className="border-t border-white/5 pt-3">
                      <MapLegend />
                    </div>
                  </div>
                )}
              </div>

              <div className="border-b border-white/10 py-2">
                <button
                  onClick={() => toggleSection("planner")}
                  className="flex w-full items-center justify-between py-2 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-colors hover:text-[#FF8A00]"
                >
                  <span>3. Planification de Parcours</span>
                  <span className="text-lg leading-none">
                    {openSection === "planner" ? "−" : "+"}
                  </span>
                </button>

                {openSection === "planner" && (
                  <div className="mt-3 rounded-2xl border border-white/5 bg-white/[0.03] p-2 pb-3">
                    <TripPlannerPanel
                      stops={tripStops}
                      onRemoveStop={handleRemoveStop}
                      onClearStops={handleClearStops}
                      onCalculateTrip={calculateTripRoute}
                      isCalculating={routeLoading}
                    />
                  </div>
                )}
              </div>

              {selectedItem && (
                <div className="border-b border-white/10 py-2">
                  <button
                    onClick={() => toggleSection("details")}
                    className="flex w-full items-center justify-between py-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#FFD700] transition-colors"
                  >
                    <span>4. Spot Sélectionné</span>
                    <span className="text-lg leading-none">
                      {openSection === "details" ? "−" : "+"}
                    </span>
                  </button>

                  {openSection === "details" && (
                    <div className="mt-3 pb-3">
                      <MapSidePanel
                        item={selectedItem}
                        onClose={() => setSelectedItem(null)}
                        onFocusItem={handleFocusItem}
                        onRouteItem={handleRouteItem}
                        onAddToTrip={handleAddToTrip}
                        routeMode={routeMode}
                        onChangeRouteMode={handleChangeRouteMode}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>

        <section className="relative z-0 flex min-w-0 min-h-0 flex-1 flex-col bg-[#1a1a1a]">
          <div className="relative h-full w-full flex-1">
            <ExperienceMapClient
              center={
                liveUserPosition ?? manualStartPoint ?? RABAT_FALLBACK_POINT
              }
              zoom={14}
              height="100%"
              visibleTypes={selectedTypes}
              items={visibleItems}
              selectedItem={selectedItem}
              onSelectItem={handleSelectItem}
              focusKey={focusKey}
              routeSegments={routeSegments}
              routeDistanceLabel={routeDistanceLabel}
              routeDurationLabel={routeDurationLabel}
              startPoint={routeStartPoint}
              liveUserPosition={liveUserPosition}
              liveUserAccuracy={geoAccuracy}
              navigationMode={navigationMode}
              onSelectStartPoint={handleSelectStartPoint}
            />
          </div>

          <button
            onClick={() => setIsMapExpanded((prev) => !prev)}
            className="absolute left-4 top-4 z-[400] flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/80 text-white shadow-xl backdrop-blur-md transition-transform hover:scale-105"
            title={isMapExpanded ? "Afficher le menu" : "Agrandir la carte"}
          >
            {isMapExpanded ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            )}
          </button>
        </section>
      </div>
    </main>
  );
}