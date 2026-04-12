export type MapItemType =
  | "stadium"
  | "fanzone"
  | "restaurant"
  | "activity"
  | "hotel";

export type MapItem = {
  id: string;
  name: string;
  type: MapItemType;
  position: [number, number];
  description?: string;
};

export const ALL_MAP_TYPES: MapItemType[] = [
  "stadium",
  "fanzone",
  "restaurant",
  "activity",
  "hotel",
];