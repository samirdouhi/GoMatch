"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import type { MapItem } from "./types";

type MapFocusOnSelectionProps = {
  item: MapItem | null;
  focusZoom?: number;
  focusKey?: number;
};

export default function MapFocusOnSelection({
  item,
  focusZoom = 15,
  focusKey = 0,
}: MapFocusOnSelectionProps) {
  const map = useMap();

  useEffect(() => {
    if (!item) return;

    const run = () => {
      map.invalidateSize(false);

      const nextZoom = Math.max(map.getZoom(), focusZoom);

      map.flyTo(item.position, nextZoom, {
        animate: true,
        duration: 0.8,
      });
    };

    const raf = requestAnimationFrame(() => {
      setTimeout(run, 100);
    });

    return () => cancelAnimationFrame(raf);
  }, [item, map, focusZoom, focusKey]);

  return null;
}