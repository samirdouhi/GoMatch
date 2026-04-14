"use client";

import { useMapEvents } from "react-leaflet";

type MapClickToSetStartPointProps = {
  enabled?: boolean;
  onSelectStartPoint: (position: [number, number]) => void;
};

export default function MapClickToSetStartPoint({
  enabled = true,
  onSelectStartPoint,
}: MapClickToSetStartPointProps) {
  useMapEvents({
    click(event) {
      if (!enabled) return;

      const { lat, lng } = event.latlng;
      onSelectStartPoint([lat, lng]);
    },
  });

  return null;
}