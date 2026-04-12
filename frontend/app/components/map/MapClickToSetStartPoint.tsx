"use client";

import { useMapEvents } from "react-leaflet";

type MapClickToSetStartPointProps = {
  onSelectStartPoint: (position: [number, number]) => void;
};

export default function MapClickToSetStartPoint({
  onSelectStartPoint,
}: MapClickToSetStartPointProps) {
  useMapEvents({
    click(event) {
      const { lat, lng } = event.latlng;
      onSelectStartPoint([lat, lng]);
    },
  });

  return null;
}