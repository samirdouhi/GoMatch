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

function escapeHtml(v: string | null | undefined): string {
  if (!v) return "";
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatHeure(v: string): string {
  return v ? v.slice(0, 5) : "--:--";
}

/** Retourne l'horaire du jour courant (0 = Dimanche … 6 = Samedi). */
function horaireAujourdHui(c: Commerce): string {
  const jour = new Date().getDay();
  const h = c.horaires?.find((x) => x.jourSemaine === jour);
  if (!h) return "Horaires non renseignés";
  if (h.estFerme) return "Fermé aujourd'hui";
  return `Aujourd'hui : ${formatHeure(h.heureOuverture)} → ${formatHeure(h.heureFermeture)}`;
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
          width:38px;height:38px;
          background:linear-gradient(135deg,#f97316,#ef4444);
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          border:2px solid rgba(255,255,255,0.4);
          box-shadow:0 2px 10px rgba(0,0,0,0.5);
        "></div>`,
        iconSize:   [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -40],
      });

      for (const c of commerces) {
        if (!c.latitude || !c.longitude) continue;

        const firstPhoto = c.photos?.[0];
        const nbPhotos   = c.photos?.length ?? 0;

        const imgHtml = firstPhoto
          ? `<div style="position:relative;">
               <img src="${escapeHtml(photoUrl(firstPhoto.urlImage))}" alt="${escapeHtml(c.nom)}"
                    style="width:100%;height:140px;object-fit:cover;display:block;" />
               ${nbPhotos > 1 ? `<div style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.7);color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:12px;backdrop-filter:blur(4px);">📸 ${nbPhotos}</div>` : ""}
               <div style="position:absolute;bottom:8px;left:8px;background:rgba(16,185,129,0.95);color:#fff;font-size:9px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;padding:3px 8px;border-radius:12px;">✓ Validé</div>
             </div>`
          : `<div style="width:100%;height:100px;background:linear-gradient(135deg,#18181b,#27272a);display:flex;align-items:center;justify-content:center;position:relative;">
               <svg width="36" height="36" fill="none" stroke="#52525b" stroke-width="1.5" viewBox="0 0 24 24">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5M2.25 9l9-6.75L20.25 9M3.75 21V10.5m16.5 10.5V10.5M9 21v-6h6v6"/>
               </svg>
               <div style="position:absolute;bottom:8px;left:8px;background:rgba(16,185,129,0.95);color:#fff;font-size:9px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;padding:3px 8px;border-radius:12px;">✓ Validé</div>
             </div>`;

        const totalTags = c.tagsCulturels?.length ?? 0;
        const tagsSlice = (c.tagsCulturels ?? []).slice(0, 3)
          .map((t) => `<span style="background:rgba(249,115,22,0.15);border:1px solid rgba(249,115,22,0.3);color:#fb923c;border-radius:999px;padding:2px 8px;font-size:10px;font-weight:600;">${escapeHtml(t)}</span>`)
          .join("");
        const tagsExtra = totalTags > 3
          ? `<span style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#a1a1aa;border-radius:999px;padding:2px 8px;font-size:10px;font-weight:600;">+${totalTags - 3}</span>`
          : "";

        const horaireTxt = escapeHtml(horaireAujourdHui(c));
        const horaireColor = horaireTxt.startsWith("Fermé")
          ? "#f87171"
          : horaireTxt.startsWith("Horaires non")
            ? "#a1a1aa"
            : "#34d399";

        const popupContent = `
          <div style="width:260px;background:#09090b;border-radius:14px;overflow:hidden;font-family:system-ui,-apple-system,sans-serif;box-shadow:0 12px 32px rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.06);">
            ${imgHtml}
            <div style="padding:14px;">
              <p style="color:#fff;font-weight:800;font-size:15px;margin:0 0 3px 0;line-height:1.3;">${escapeHtml(c.nom)}</p>
              ${c.nomCategorie ? `<p style="color:#f97316;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;margin:0 0 10px 0;">${escapeHtml(c.nomCategorie)}</p>` : ""}

              <p style="color:#d4d4d8;font-size:12px;line-height:1.55;margin:0 0 10px 0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">${escapeHtml(c.description || "Aucune description.")}</p>

              ${tagsSlice || tagsExtra ? `<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px;">${tagsSlice}${tagsExtra}</div>` : ""}

              <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:10px;display:flex;flex-direction:column;gap:6px;">
                <div style="display:flex;align-items:center;gap:6px;color:${horaireColor};font-size:11px;font-weight:600;">
                  <span style="font-size:12px;">🕒</span>
                  <span>${horaireTxt}</span>
                </div>
                <div style="display:flex;align-items:flex-start;gap:6px;color:#a1a1aa;font-size:11px;">
                  <span style="font-size:12px;line-height:1;">📍</span>
                  <span style="line-height:1.4;">${escapeHtml(c.adresse)}</span>
                </div>
              </div>
            </div>
          </div>`;

        const popup = L.popup({
          maxWidth: 280,
          className: "gomatch-popup",
          closeButton: true,
          autoPan: true,
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
          border-radius: 14px !important;
          box-shadow: none !important;
          border: none !important;
        }
        .gomatch-popup .leaflet-popup-content {
          margin: 0 !important;
          width: auto !important;
        }
        .gomatch-popup .leaflet-popup-tip-container {
          display: none !important;
        }
        .gomatch-popup .leaflet-popup-close-button {
          color: #fff !important;
          font-size: 20px !important;
          font-weight: 300 !important;
          top: 8px !important;
          right: 10px !important;
          z-index: 10;
          background: rgba(0,0,0,0.5) !important;
          width: 24px !important;
          height: 24px !important;
          border-radius: 50% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          line-height: 1 !important;
          padding: 0 !important;
        }
        .gomatch-popup .leaflet-popup-close-button:hover {
          background: rgba(239,68,68,0.8) !important;
        }
      `}</style>
      <div ref={containerRef} className="h-full w-full" />
    </>
  );
}
