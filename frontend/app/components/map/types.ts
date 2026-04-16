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

  source?: "business" | "discovery" | "event";

  description?: string;
  imageUrl?: string;
  adresse?: string;
  nomCategorie?: string;
  tagsCulturels?: string[];

  note?: number | null;
  prixMoyen?: number | null;
  estOuvert?: boolean | null;
  horairesOuverture?: string | null;
  popularite?: number | null;
};

export const ALL_MAP_TYPES: MapItemType[] = [
  "stadium",
  "fanzone",
  "restaurant",
  "activity",
  "hotel",
];