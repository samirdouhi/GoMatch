"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import type { MapItem } from "./types";

type MapAutoFitProps = {
  items: MapItem[];
  defaultCenter: [number, number];
  defaultZoom: number;
  enabled?: boolean;
};

export default function MapAutoFit({
  items,
  defaultCenter,
  defaultZoom,
  enabled = true,
}: MapAutoFitProps) {
  const map = useMap();
  const hasAppliedInitially = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    if (hasAppliedInitially.current) return;
    hasAppliedInitially.current = true;

    if (!items || items.length === 0) {
      map.setView(defaultCenter, defaultZoom);
      return;
    }

    if (items.length === 1) {
      map.setView(items[0].position, 15, {
        animate: true,
      });
      return;
    }

    const bounds = L.latLngBounds(items.map((item) => item.position));
    map.fitBounds(bounds, {
      padding: [50, 50],
      animate: true,
    });
  }, [items, map, defaultCenter, defaultZoom, enabled]);

  return null;
}