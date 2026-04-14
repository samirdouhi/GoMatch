"use client";

import { Circle, Marker, Popup } from "react-leaflet";
import L from "leaflet";

type MapUserLiveMarkerProps = {
  position: [number, number];
  accuracyMeters?: number | null;
};

const liveUserIcon = L.divIcon({
  className: "gomatch-live-user-marker",
  html: `
    <div style="
      width: 20px;
      height: 20px;
      border-radius: 9999px;
      background: #3b82f6;
      border: 4px solid white;
      box-shadow: 0 8px 18px rgba(0,0,0,0.35);
      position: relative;
    ">
      <div style="
        position: absolute;
        inset: -8px;
        border-radius: 9999px;
        border: 2px solid rgba(59,130,246,0.35);
      "></div>
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
});

export default function MapUserLiveMarker({
  position,
  accuracyMeters,
}: MapUserLiveMarkerProps) {
  return (
    <>
      {accuracyMeters && accuracyMeters > 0 ? (
        <Circle
          center={position}
          radius={accuracyMeters}
          pathOptions={{
            color: "#3b82f6",
            weight: 1,
            fillColor: "#3b82f6",
            fillOpacity: 0.12,
          }}
        />
      ) : null}

      <Marker position={position} icon={liveUserIcon}>
        <Popup>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">
              Votre position réelle
            </p>
            <p className="text-xs text-slate-600">
              GPS temps réel
              {accuracyMeters
                ? ` • précision estimée ± ${Math.round(accuracyMeters)} m`
                : ""}
            </p>
          </div>
        </Popup>
      </Marker>
    </>
  );
}