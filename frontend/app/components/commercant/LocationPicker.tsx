"use client";

import dynamic from "next/dynamic";
import type { LocationData } from "./LocationPickerMap";

// Load Leaflet only client-side (Leaflet requires window)
const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col gap-3">
      <div className="h-12 animate-pulse rounded-2xl bg-white/[0.04]" />
      <div className="h-[340px] animate-pulse rounded-2xl bg-white/[0.04]" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-14 animate-pulse rounded-xl bg-white/[0.04]" />
        <div className="h-14 animate-pulse rounded-xl bg-white/[0.04]" />
      </div>
    </div>
  ),
});

export type { LocationData };

type Props = {
  value: LocationData | null;
  onChange: (data: LocationData) => void;
};

export default function LocationPicker({ value, onChange }: Props) {
  return <LocationPickerMap value={value} onChange={onChange} />;
}
