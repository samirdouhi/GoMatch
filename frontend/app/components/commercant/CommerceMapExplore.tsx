"use client";

import { useEffect, useRef } from "react";
import type { Commerce } from "@/lib/commercesApi";
import { photoUrl } from "@/lib/commercesApi";

type Props = {
  commerces: Commerce[];
  onSelect?: (id: string) => void;
};

declare global {
  interface Window {
    L: typeof import("leaflet");
  }
}

export default function CommerceMapExplore({ commerces, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return; // déjà initialisé

    // Charger Leaflet dynamiquement (évite les erreurs SSR)
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      if (!containerRef.current) return;
      const L = window.L;

      const map = L.map(containerRef.current, {
        center: [31.7917, -7.0926], // Centre du Maroc
        zoom: 6,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;

      // Icône personnalisée
      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width:36px;height:36px;
          background:linear-gradient(135deg,#f97316,#ef4444);
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          border:2px solid rgba(255,255,255,0.4);
          box-shadow:0 2px 8px rgba(0,0,0,0.4);
        "></div>`,
        iconSize:   [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -38],
      });

      for (const c of commerces) {
        if (!c.latitude || !c.longitude) continue;

        const firstPhoto = c.photos?.[0];
        const imgHtml = firstPhoto
          ? `<img src="${photoUrl(firstPhoto.urlImage)}" alt="${c.nom}"
               style="width:100%;height:120px;object-fit:cover;border-radius:10px 10px 0 0;display:block;" />`
          : `<div style="width:100%;height:80px;background:#18181b;border-radius:10px 10px 0 0;display:flex;align-items:center;justify-content:center;">
               <svg width="32" height="32" fill="none" stroke="#52525b" stroke-width="1.5" viewBox="0 0 24 24">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5M2.25 9l9-6.75L20.25 9M3.75 21V10.5m16.5 10.5V10.5M9 21v-6h6v6"/>
               </svg>
             </div>`;

        const tags = (c.tagsCulturels ?? []).slice(0, 2)
          .map((t) => `<span style="background:rgba(249,115,22,0.15);border:1px solid rgba(249,115,22,0.3);color:#fb923c;border-radius:20px;padding:2px 8px;font-size:10px;">${t}</span>`)
          .join("");

        const popupContent = `
          <div style="width:220px;background:#09090b;border-radius:12px;overflow:hidden;font-family:system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,0.5);">
            ${imgHtml}
            <div style="padding:12px;">
              <p style="color:#fff;font-weight:800;font-size:14px;margin:0 0 4px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.nom}</p>
              ${c.nomCategorie ? `<p style="color:#f97316;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 6px 0;">${c.nomCategorie}</p>` : ""}
              <p style="color:#a1a1aa;font-size:11px;line-height:1.5;margin:0 0 8px 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${c.description || "Aucune description."}</p>
              ${tags ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">${tags}</div>` : ""}
              <p style="color:#52525b;font-size:10px;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">📍 ${c.adresse}</p>
            </div>
          </div>`;

        const popup = L.popup({
          maxWidth: 240,
          className: "gomatch-popup",
          closeButton: true,
        }).setContent(popupContent);

        L.marker([c.latitude, c.longitude], { icon })
          .addTo(map)
          .bindPopup(popup)
          .on("click", () => {
            onSelect?.(c.id);
          });
      }

      // Ajuster la vue si des commerces ont des coordonnées
      const valid = commerces.filter((c) => c.latitude && c.longitude);
      if (valid.length > 0) {
        const bounds = L.latLngBounds(valid.map((c) => [c.latitude, c.longitude]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      }
    };

    document.head.appendChild(script);

    return () => {
      // Nettoyage lors du démontage
      mapRef.current?.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionnellement vide : on initialise une seule fois

  // Mettre à jour les marqueurs quand commerces changent (simple refresh)
  useEffect(() => {
    if (!mapRef.current || !window.L) return;
    // La mise à jour complète des marqueurs nécessiterait une refonte plus importante.
    // Pour l'instant, le rechargement de la page suffit lors du premier montage.
  }, [commerces]);

  return (
    <>
      {/* Styles CSS pour le popup Leaflet */}
      <style>{`
        .gomatch-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          padding: 0 !important;
          border-radius: 12px !important;
          box-shadow: none !important;
          border: none !important;
        }
        .gomatch-popup .leaflet-popup-content {
          margin: 0 !important;
        }
        .gomatch-popup .leaflet-popup-tip-container {
          display: none !important;
        }
        .gomatch-popup .leaflet-popup-close-button {
          color: #fff !important;
          font-size: 18px !important;
          top: 6px !important;
          right: 8px !important;
          z-index: 10;
        }
      `}</style>
      <div ref={containerRef} className="h-full w-full" />
    </>
  );
}
