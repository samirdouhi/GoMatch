"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

type MapFollowUserProps = {
  position: [number, number] | null;
  enabled?: boolean;
  zoom?: number;
};

export default function MapFollowUser({
  position,
  enabled = false,
  zoom = 16,
}: MapFollowUserProps) {
  const map = useMap();

  useEffect(() => {
    if (!enabled || !position) return;

    map.setView(position, Math.max(map.getZoom(), zoom), {
      animate: true,
    });
  }, [map, position, enabled, zoom]);

  return null;
}