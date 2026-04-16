"use client";

import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L, { type Map as LeafletMap } from "leaflet";

import type { MapItem, MapItemType } from "./types";
import MapAutoFit from "./MapAutoFit";
import MapFocusOnSelection from "./MapFocusOnSelection";
import MapRouteLayer from "./MapRouteLayer";
import MapStartPointMarker from "./MapStartPointMarker";
import MapClickToSetStartPoint from "./MapClickToSetStartPoint";
import MapUserLiveMarker from "./MapUserLiveMarker";

type ExperienceMapProps = {
  center?: [number, number];
  zoom?: number;
  height?: string;
  visibleTypes?: MapItemType[];
  items?: MapItem[];
  selectedItem?: MapItem | null;
  onSelectItem?: (item: MapItem) => void;
  focusKey?: number;
  routeSegments?: [number, number][][];
  routeDistanceLabel?: string;
  routeDurationLabel?: string;
  startPoint?: [number, number] | null;
  liveUserPosition?: [number, number] | null;
  liveUserAccuracy?: number | null;
  navigationMode?: "live" | "manual";
  onSelectStartPoint?: (position: [number, number]) => void;
};

type ClusterChildMarkerLike = {
  options: {
    title?: string;
  };
};

type ClusterLike = {
  getAllChildMarkers: () => ClusterChildMarkerLike[];
};

type MapItemExtended = MapItem & {
  image?: string;
  imageUrl?: string;
  photo?: string;
  photoUrl?: string;
  adresse?: string;
  address?: string;
  nomCategorie?: string;
  category?: string;
  tags?: string[];
  tagsCulturels?: string[];
  note?: number | null;
  prixMoyen?: number | null;
  estOuvert?: boolean | null;
  horairesOuverture?: string | null;
  popularite?: number | null;
};

function safeInvalidateMap(map: LeafletMap) {
  try {
    const container = map.getContainer?.();
    if (!container || !container.isConnected) return;
    map.invalidateSize(false);
  } catch {
    // ignore silently when map is already unmounted/destroyed
  }
}

function MapInvalidateSize({
  deps = [],
}: {
  deps?: Array<unknown>;
}) {
  const map = useMap();
  const timeoutRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const invalidate = () => {
      if (cancelled) return;

      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }

      rafRef.current = window.requestAnimationFrame(() => {
        timeoutRef.current = window.setTimeout(() => {
          if (cancelled) return;
          safeInvalidateMap(map);
        }, 120);
      });
    };

    invalidate();

    const onResize = () => invalidate();
    window.addEventListener("resize", onResize);

    let observer: ResizeObserver | null = null;
    const container = map.getContainer?.()?.parentElement;

    if (container && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => invalidate());
      observer.observe(container);
    }

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      observer?.disconnect();

      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [map, ...deps]);

  return null;
}

function MapOpenSelectedPopup({
  selectedItem,
  focusKey,
}: {
  selectedItem: MapItem | null;
  focusKey?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!selectedItem) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 12;
    let timeoutId: number | null = null;

    const tryOpenPopup = () => {
      if (cancelled) return;
      attempts += 1;

      let opened = false;

      map.eachLayer((layer) => {
        if (opened) return;

        if (layer instanceof L.Marker) {
          const latLng = layer.getLatLng();

          const sameLat =
            Math.abs(latLng.lat - selectedItem.position[0]) < 0.000001;
          const sameLng =
            Math.abs(latLng.lng - selectedItem.position[1]) < 0.000001;

          if (sameLat && sameLng) {
            try {
              layer.openPopup();
              opened = true;
            } catch {
              // ignore
            }
          }
        }
      });

      if (!opened && attempts < maxAttempts) {
        timeoutId = window.setTimeout(tryOpenPopup, 120);
      }
    };

    timeoutId = window.setTimeout(tryOpenPopup, 180);

    return () => {
      cancelled = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [map, selectedItem?.id, focusKey, selectedItem]);

  return null;
}

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
    stadium: "#ef4444",
    fanzone: "#f59e0b",
    restaurant: "#10b981",
    activity: "#3b82f6",
    hotel: "#8b5cf6",
  };

  return colorMap[type];
};

const getMarkerConfig = (type: MapItemType) => {
  const config: Record<
    MapItemType,
    { bg: string; icon: string; border: string }
  > = {
    stadium: {
      bg: "#ef4444",
      border: "#ffffff",
      icon: `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 10s3-2 10-2 10 2 10 2" />
          <path d="M4 12v5" />
          <path d="M20 12v5" />
          <path d="M6 9V6" />
          <path d="M18 9V6" />
          <path d="M8 17h8" />
        </svg>
      `,
    },
    fanzone: {
      bg: "#f59e0b",
      border: "#ffffff",
      icon: `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 21V5" />
          <path d="M4 5c5-3 7 3 12 0v8c-5 3-7-3-12 0" />
        </svg>
      `,
    },
    restaurant: {
      bg: "#10b981",
      border: "#ffffff",
      icon: `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 3v8" />
          <path d="M7 3v8" />
          <path d="M5.5 11v10" />
          <path d="M14 3v7a4 4 0 0 0 4 4v7" />
          <path d="M14 7h4" />
        </svg>
      `,
    },
    activity: {
      bg: "#3b82f6",
      border: "#ffffff",
      icon: `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7z" />
        </svg>
      `,
    },
    hotel: {
      bg: "#8b5cf6",
      border: "#ffffff",
      icon: `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 20V8" />
          <path d="M3 12h18" />
          <path d="M7 12V9a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3" />
          <path d="M21 20V12" />
        </svg>
      `,
    },
  };

  return config[type];
};

const getIcon = (type: MapItemType, isSelected = false) => {
  const config = getMarkerConfig(type);

  return L.divIcon({
    className: "gomatch-marker-wrapper",
    html: `
      <div style="
        width: ${isSelected ? "46px" : "38px"};
        height: ${isSelected ? "46px" : "38px"};
        border-radius: 9999px 9999px 9999px 0;
        background: ${config.bg};
        border: 3px solid ${config.border};
        transform: rotate(-45deg);
        box-shadow: ${
          isSelected
            ? "0 0 0 6px rgba(255,255,255,0.18), 0 14px 28px rgba(0,0,0,0.35)"
            : "0 10px 18px rgba(0,0,0,0.30)"
        };
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      ">
        <div style="
          transform: rotate(45deg);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ${config.icon}
        </div>
      </div>
    `,
    iconSize: isSelected ? [46, 46] : [38, 38],
    iconAnchor: isSelected ? [23, 46] : [19, 38],
    popupAnchor: [0, -34],
    tooltipAnchor: [0, -30],
  });
};

const createClusterCustomIcon = (cluster: ClusterLike) => {
  const childMarkers = cluster.getAllChildMarkers();

  const counts: Record<MapItemType, number> = {
    stadium: 0,
    fanzone: 0,
    restaurant: 0,
    activity: 0,
    hotel: 0,
  };

  childMarkers.forEach((marker: ClusterChildMarkerLike) => {
    const type = marker.options.title as MapItemType | undefined;
    if (type && counts[type] !== undefined) {
      counts[type] += 1;
    }
  });

  let dominantType: MapItemType = "activity";
  let maxCount = -1;

  (Object.keys(counts) as MapItemType[]).forEach((type) => {
    if (counts[type] > maxCount) {
      maxCount = counts[type];
      dominantType = type;
    }
  });

  const bg = getTypeColor(dominantType);
  const count = childMarkers.length;

  return L.divIcon({
    html: `
      <div style="
        width: 46px;
        height: 46px;
        border-radius: 9999px;
        background: ${bg};
        border: 4px solid rgba(255,255,255,0.95);
        box-shadow: 0 10px 24px rgba(0,0,0,0.28);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
        font-weight: 700;
      ">
        ${count}
      </div>
    `,
    className: "custom-cluster-icon",
    iconSize: [46, 46],
    iconAnchor: [23, 23],
  });
};

function formatPrice(value?: number | null): string {
  if (value === null || value === undefined) return "Prix non renseigné";
  if (value === 0) return "Gratuit";
  return `${value} MAD`;
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

function PopupCommerceCard({ item }: { item: MapItemExtended }) {
  const image =
    item.imageUrl || item.image || item.photoUrl || item.photo || null;

  const address = item.adresse || item.address || null;
  const category =
    item.nomCategorie || item.category || getTypeLabel(item.type);
  const tags = item.tagsCulturels || item.tags || [];

  return (
    <div className="flex h-[420px] w-[310px] flex-col overflow-hidden rounded-[20px] bg-[#0b1220] text-white shadow-[0_18px_40px_rgba(0,0,0,0.38)]">
      <div className="h-1/2 w-full shrink-0">
        {image ? (
          <img
            src={image}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-white/5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white/50"
              >
                <path d="M3 21h18" />
                <path d="M5 21V7l8-4 6 4v14" />
                <path d="M9 9h.01" />
                <path d="M9 12h.01" />
                <path d="M9 15h.01" />
                <path d="M13 9h.01" />
                <path d="M13 12h.01" />
                <path d="M13 15h.01" />
              </svg>
            </div>
          </div>
        )}
      </div>

      <div className="flex h-1/2 flex-col gap-2 overflow-hidden p-3">
        <div className="min-h-0">
          <h3 className="line-clamp-1 text-[17px] font-extrabold leading-tight text-white">
            {item.name}
          </h3>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400">
            {category}
          </p>
        </div>

        {item.description ? (
          <p className="line-clamp-2 text-[12px] leading-5 text-white/75">
            {item.description}
          </p>
        ) : null}

        {address ? (
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <p className="line-clamp-2 text-[11px] leading-4 text-white/70">
              {address}
            </p>
          </div>
        ) : null}

        {item.source === "discovery" ? (
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-2">
              <p className="text-[9px] uppercase tracking-[0.14em] text-white/45">
                Prix
              </p>
              <p className="mt-1 line-clamp-1 text-[10px] font-semibold text-white/90">
                {formatPrice(item.prixMoyen)}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-2">
              <p className="text-[9px] uppercase tracking-[0.14em] text-white/45">
                Pop.
              </p>
              <p className="mt-1 line-clamp-1 text-[10px] font-semibold text-white/90">
                {item.popularite !== null && item.popularite !== undefined
                  ? `${item.popularite}/100`
                  : "N/A"}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-2">
              <p className="text-[9px] uppercase tracking-[0.14em] text-white/45">
                Hor.
              </p>
              <p className="mt-1 line-clamp-1 text-[10px] font-semibold text-white/90">
                {getOpenStatusLabel(item.estOuvert, item.horairesOuverture)}
              </p>
            </div>
          </div>
        ) : null}

        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-orange-500/25 bg-orange-500/10 px-2 py-0.5 text-[9px] font-semibold text-orange-300"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-auto border-t border-white/8 pt-2 text-[10px] text-white/45">
          Lat: {item.position[0].toFixed(4)} | Lng: {item.position[1].toFixed(4)}
        </div>
      </div>
    </div>
  );
}

export default function ExperienceMap({
  center = [34.020882, -6.84165],
  zoom = 13,
  height = "500px",
  visibleTypes = ["stadium", "fanzone", "restaurant", "activity", "hotel"],
  items = [],
  selectedItem = null,
  onSelectItem,
  focusKey = 0,
  routeSegments = [],
  routeDistanceLabel,
  routeDurationLabel,
  startPoint = null,
  liveUserPosition = null,
  liveUserAccuracy = null,
  navigationMode = "live",
  onSelectStartPoint,
}: ExperienceMapProps) {
  const filteredItems = items.filter((item) =>
    visibleTypes.includes(item.type)
  );

  const initialCenter = liveUserPosition ?? startPoint ?? center;
  const autoFitEnabled =
    navigationMode !== "live" && !selectedItem && filteredItems.length > 0;

  return (
    <div
      style={{ height, width: "100%" }}
      className="overflow-hidden rounded-none border-0 shadow-lg lg:rounded-2xl lg:border lg:border-white/10"
    >
      <MapContainer
        center={initialCenter}
        zoom={zoom}
        scrollWheelZoom
        preferCanvas
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <MapInvalidateSize
          deps={[
            height,
            zoom,
            selectedItem?.id,
            filteredItems.length,
            navigationMode,
            !!liveUserPosition,
            !!startPoint,
            focusKey,
          ]}
        />

        <MapAutoFit
          items={filteredItems}
          defaultCenter={initialCenter}
          defaultZoom={zoom}
          enabled={autoFitEnabled}
        />

        <MapFocusOnSelection
          item={selectedItem}
          focusZoom={15}
          focusKey={focusKey}
        />

        <MapOpenSelectedPopup
          selectedItem={selectedItem}
          focusKey={focusKey}
        />

        {onSelectStartPoint ? (
          <MapClickToSetStartPoint
            enabled={navigationMode === "manual"}
            onSelectStartPoint={onSelectStartPoint}
          />
        ) : null}

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {liveUserPosition ? (
          <MapUserLiveMarker
            position={liveUserPosition}
            accuracyMeters={liveUserAccuracy}
          />
        ) : null}

        {navigationMode === "manual" && startPoint ? (
          <MapStartPointMarker position={startPoint} />
        ) : null}

        <MapRouteLayer
          segments={routeSegments}
          distanceLabel={routeDistanceLabel}
          durationLabel={routeDurationLabel}
        />

        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50}
          spiderfyOnMaxZoom
          showCoverageOnHover={false}
          iconCreateFunction={createClusterCustomIcon}
        >
          {filteredItems.map((item) => {
            const isSelected = selectedItem?.id === item.id;
            const extendedItem = item as MapItemExtended;

            return (
              <Marker
                key={item.id}
                position={item.position}
                icon={getIcon(item.type, isSelected)}
                title={item.type}
                eventHandlers={{
                  click: () => {
                    onSelectItem?.(item);
                  },
                }}
              >
                <Tooltip direction="top" offset={[0, -24]} opacity={1}>
                  <span className="text-xs font-medium">{item.name}</span>
                </Tooltip>

              <Popup
  className="gomatch-popup-card"
  maxWidth={320}
  minWidth={310}
  autoPan
  keepInView
  autoPanPaddingTopLeft={[20, 20]}
  autoPanPaddingBottomRight={[20, 100]}
>
  <PopupCommerceCard item={extendedItem} />
</Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>

      <style jsx global>{`
        .gomatch-popup-card .leaflet-popup-content-wrapper {
          background: transparent;
          box-shadow: none;
          padding: 0;
          border-radius: 20px;
        }

        .gomatch-popup-card .leaflet-popup-content {
          margin: 0;
          width: auto !important;
        }

        .gomatch-popup-card .leaflet-popup-tip {
          background: #0b1220;
        }

        .gomatch-popup-card .leaflet-popup-close-button {
          color: white;
          font-size: 18px;
          right: 10px;
          top: 8px;
        }

        @media (max-width: 1023px) {
          .gomatch-popup-card .leaflet-popup-content-wrapper {
            border-radius: 16px;
          }
        }
      `}</style>
    </div>
  );
}