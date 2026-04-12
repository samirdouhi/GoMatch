"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import type { MapItem } from "./types";

type MapAutoFitProps = {
  items: MapItem[];
  defaultCenter: [number, number];
  defaultZoom: number;
};

export default function MapAutoFit({
  items,
  defaultCenter,
  defaultZoom,
}: MapAutoFitProps) {
  const map = useMap();

  useEffect(() => {
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
  }, [items, map, defaultCenter, defaultZoom]);

  return null;
}