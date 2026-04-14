"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";

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
  const autoFitEnabled = navigationMode !== "live";

  return (
    <div
      style={{ height, width: "100%" }}
      className="overflow-hidden rounded-2xl border border-white/10 shadow-lg"
    >
      <MapContainer
        center={initialCenter}
        zoom={zoom}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
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
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          iconCreateFunction={createClusterCustomIcon}
        >
          {filteredItems.map((item) => {
            const isSelected = selectedItem?.id === item.id;

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

                <Popup>
                  <div className="min-w-[240px] space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {item.name}
                      </h3>
                      <p className="text-xs font-medium uppercase tracking-wide text-orange-500">
                        {getTypeLabel(item.type)}
                      </p>
                    </div>

                    {item.description ? (
                      <p className="text-sm leading-6 text-slate-600">
                        {item.description}
                      </p>
                    ) : null}

                    <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                      Lat: {item.position[0].toFixed(4)} | Lng:{" "}
                      {item.position[1].toFixed(4)}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}