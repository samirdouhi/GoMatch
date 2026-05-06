export type MapItemType =
  | "stadium"
  | "fanzone"
  | "restaurant"
  | "activity"
  | "hotel"
  | "culture";

export type MapItem = {
  id: string;
  name: string;
  type: MapItemType;
  position: [number, number];

  source?: "business" | "discovery" | "event" | "culture";

  description?: string;
  imageUrl?: string;
  adresse?: string;
  nomCategorie?: string;
  tagsCulturels?: string[];

  note?: number | null;
  noteGlobale?: number | null;
  nombreAvis?: number | null;

  horaires?: {
    id: string;
    jourSemaine: number;
    heureOuverture?: string | null;
    heureFermeture?: string | null;
    estFerme?: boolean;
  }[];

  avis?: {
    id: string;
    note: number;
    commentaire: string | null;
    utilisateurEmail: string | null;
    dateCreation?: string;
  }[];

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
  "culture",
];