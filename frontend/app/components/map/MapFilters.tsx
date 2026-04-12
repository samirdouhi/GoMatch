"use client";

import type { MapItemType } from "./types";

type MapFiltersProps = {
  selectedTypes: MapItemType[];
  onToggle: (type: MapItemType) => void;
};

const filterItems: { key: MapItemType; label: string }[] = [
  { key: "stadium", label: "Stades" },
  { key: "fanzone", label: "Fan zones" },
  { key: "restaurant", label: "Restaurants" },
  { key: "activity", label: "Activités" },
  { key: "hotel", label: "Hôtels" },
];

export default function MapFilters({
  selectedTypes,
  onToggle,
}: MapFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {filterItems.map((item) => {
        const active = selectedTypes.includes(item.key);

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onToggle(item.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              active
                ? "bg-orange-500 text-white shadow-md"
                : "bg-white/10 text-slate-300 hover:bg-white/15"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}