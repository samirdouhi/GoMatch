"use client";

import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

type MapStartPointMarkerProps = {
  position: [number, number];
};

const startPointIcon = L.divIcon({
  className: "gomatch-start-marker",
  html: `
    <div style="
      width: 22px;
      height: 22px;
      border-radius: 9999px;
      background: #f97316;
      border: 4px solid white;
      box-shadow: 0 8px 18px rgba(0,0,0,0.30);
    "></div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -10],
});

export default function MapStartPointMarker({
  position,
}: MapStartPointMarkerProps) {
  return (
    <Marker position={position} icon={startPointIcon}>
      <Popup>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-900">
            Point de départ manuel
          </p>
          <p className="text-xs text-slate-600">
            Ce point remplace temporairement le GPS pour le calcul
            d’itinéraire.
          </p>
        </div>
      </Popup>
    </Marker>
  );
}