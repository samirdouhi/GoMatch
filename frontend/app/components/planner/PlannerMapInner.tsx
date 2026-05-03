"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import type { PlanStep } from "@/lib/recoApi";

const TYPE_COLORS: Record<string, string> = {
  cafe: "#FACC15",
  food: "#F97316",
  culture: "#8B5CF6",
  shopping: "#EC4899",
  fan_zone: "#22D3EE",
  match: "#EF4444",
  transport: "#6B7280",
  artisan: "#10B981",
  sunset: "#F59E0B",
  breakfast: "#FB923C",
};

function getColor(type: string): string {
  return TYPE_COLORS[type] ?? "#3B82F6";
}

function createNumberedIcon(num: number, color: string, isActive: boolean): L.DivIcon {
  const size = isActive ? 40 : 32;
  const shadow = isActive
    ? `0 0 0 5px ${color}33, 0 8px 24px rgba(0,0,0,0.5)`
    : "0 4px 14px rgba(0,0,0,0.45)";
  const textColor = color === "#FACC15" || color === "#10B981" || color === "#22D3EE" || color === "#F59E0B" ? "#000" : "#fff";
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;
      border-radius:50% 50% 50% 0;
      background:${color};
      border:3px solid rgba(255,255,255,${isActive ? "1" : "0.9"});
      transform:rotate(-45deg);
      box-shadow:${shadow};
      display:flex;align-items:center;justify-content:center;
      transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1);
    "><span style="
      transform:rotate(45deg);
      font-size:${isActive ? "14px" : "11px"};
      font-weight:900;
      color:${textColor};
      line-height:1;
      font-family:system-ui,sans-serif;
    ">${num}</span></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size - 4],
  });
}

const createUserIcon = () => L.divIcon({
  className: "",
  html: `<div style="position:relative;width:22px;height:22px;">
    <div style="
      position:absolute;inset:0;
      border-radius:50%;
      background:#3B82F6;
      border:3px solid white;
      box-shadow:0 2px 12px rgba(59,130,246,0.5);
      z-index:2;
    "></div>
    <div style="
      position:absolute;
      width:44px;height:44px;
      top:-11px;left:-11px;
      border-radius:50%;
      background:rgba(59,130,246,0.2);
      animation:pulse-ring 2s ease-in-out infinite;
      z-index:1;
    "></div>
  </div>
  <style>
    @keyframes pulse-ring{0%{transform:scale(0.6);opacity:0.8}70%{transform:scale(1.2);opacity:0}100%{transform:scale(1.2);opacity:0}}
  </style>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function AutoFit({ coords, userPos }: { coords: [number, number][]; userPos?: [number, number] | null }) {
  const map = useMap();
  const prevKey = useRef("");
  useEffect(() => {
    const key = JSON.stringify(coords);
    if (key === prevKey.current) return;
    prevKey.current = key;
    if (coords.length === 0) {
      if (userPos) map.setView(userPos, 14);
      return;
    }
    const all: [number, number][] = [...coords];
    if (userPos) all.push(userPos);
    if (all.length === 1) { map.setView(all[0], 15); return; }
    const bounds = L.latLngBounds(all);
    map.fitBounds(bounds, { padding: [52, 52], maxZoom: 16, animate: true, duration: 1.0 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, JSON.stringify(coords), userPos?.[0], userPos?.[1]]);
  return null;
}

function AnimatedPolyline({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  const layerRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (positions.length < 2) return;
    if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; }

    // Draw the dashed base line immediately
    const base = L.polyline(positions, {
      color: "rgba(250,204,21,0.25)",
      weight: 2,
      dashArray: "6 5",
    }).addTo(map);

    // Animate the solid overlay segment by segment
    let i = 0;
    const solid = L.polyline([], {
      color: "#FACC15",
      weight: 2.5,
      opacity: 0.85,
    }).addTo(map);

    const timer = setInterval(() => {
      if (i >= positions.length - 1) { clearInterval(timer); return; }
      solid.addLatLng(positions[i]);
      if (i === 0) solid.addLatLng(positions[1]);
      i++;
    }, 80);

    layerRef.current = base;
    return () => {
      clearInterval(timer);
      try { map.removeLayer(base); map.removeLayer(solid); } catch { /* ok */ }
      layerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, JSON.stringify(positions)]);

  return null;
}

type Props = {
  steps: PlanStep[];
  route: [number, number][];
  activeStep?: number | null;
  onStepClick?: (idx: number) => void;
  userPosition?: [number, number] | null;
};

export default function PlannerMapInner({ steps, route, activeStep, onStepClick, userPosition }: Props) {
  const validSteps = steps.filter((s) => s.latitude != null && s.longitude != null);
  const coords: [number, number][] = validSteps.map((s) => [s.latitude!, s.longitude!]);
  const polyline: [number, number][] = route.length > 1 ? route : (coords.length > 1 ? coords : []);
  const center: [number, number] = userPosition ?? (coords.length > 0 ? coords[0] : [34.0209, -6.8416]);

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom
      zoomControl={false}
      style={{ height: "100%", width: "100%", background: "#0b1120" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      <AutoFit coords={coords} userPos={userPosition} />

      {polyline.length > 1 && <AnimatedPolyline positions={polyline} />}

      {/* User position */}
      {userPosition && (
        <>
          <Circle
            center={userPosition}
            radius={150}
            pathOptions={{ color: "#3B82F6", fillColor: "#3B82F6", fillOpacity: 0.08, weight: 1, opacity: 0.3 }}
          />
          <Marker position={userPosition} icon={createUserIcon()} zIndexOffset={2000}>
            <Popup className="planner-popup" maxWidth={160}>
              <div className="planner-popup-inner">
                <div className="planner-popup-title" style={{ fontSize: "12px" }}>📍 Votre position</div>
              </div>
            </Popup>
          </Marker>
        </>
      )}

      {validSteps.map((step, idx) => {
        const color = getColor(step.type);
        const isActive = activeStep === idx;
        return (
          <Marker
            key={`${idx}-${isActive}`}
            position={[step.latitude!, step.longitude!]}
            icon={createNumberedIcon(idx + 1, color, isActive)}
            zIndexOffset={isActive ? 1000 : 0}
            eventHandlers={{ click: () => onStepClick?.(idx) }}
          >
            <Popup className="planner-popup" maxWidth={240} minWidth={200} autoPan keepInView>
              <div className="planner-popup-inner">
                <div className="planner-popup-time">{step.startTime} – {step.endTime}</div>
                <div className="planner-popup-title">{step.title}</div>
                {step.description && <div className="planner-popup-desc">{step.description}</div>}
                {step.reason && <div className="planner-popup-reason">{step.reason}</div>}
                {step.address && <div className="planner-popup-addr">📍 {step.address}</div>}
                <div className="planner-popup-dur">⏱ {step.estimatedDurationMinutes} min</div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      <style jsx global>{`
        .planner-popup .leaflet-popup-content-wrapper {
          background: #0f172a;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 14px;
          box-shadow: 0 16px 40px rgba(0,0,0,0.6);
          padding: 0;
        }
        .planner-popup .leaflet-popup-content { margin: 0; }
        .planner-popup .leaflet-popup-tip { background: #0f172a; }
        .planner-popup .leaflet-popup-close-button { color: rgba(255,255,255,0.4); font-size:16px; top:8px; right:10px; }
        .planner-popup-inner { padding: 14px 16px; }
        .planner-popup-time { font-size:10px; font-weight:800; color:#FACC15; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:6px; }
        .planner-popup-title { font-size:13px; font-weight:900; color:#fff; line-height:1.3; margin-bottom:6px; }
        .planner-popup-desc { font-size:11px; color:rgba(255,255,255,0.55); line-height:1.5; margin-bottom:5px; }
        .planner-popup-reason { font-size:10px; color:rgba(255,255,255,0.35); font-style:italic; margin-bottom:5px; }
        .planner-popup-addr { font-size:10px; color:rgba(255,255,255,0.4); margin-bottom:5px; }
        .planner-popup-dur { font-size:10px; color:rgba(250,204,21,0.7); font-weight:700; }
      `}</style>
    </MapContainer>
  );
}
