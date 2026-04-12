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

    map.flyTo(item.position, Math.max(map.getZoom(), focusZoom), {
      animate: true,
      duration: 0.8,
    });
  }, [item, map, focusZoom, focusKey]);

  return null;
}