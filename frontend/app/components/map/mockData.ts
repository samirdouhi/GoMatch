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

export const mapItems: MapItem[] = [
  {
    id: "1",
    name: "Stade Prince Moulay Abdellah",
    type: "stadium",
    position: [33.9397, -6.873],
    description: "Stade principal pour les matchs",
  },
  {
    id: "2",
    name: "Fan Zone Agdal",
    type: "fanzone",
    position: [34.0008, -6.8498],
    description: "Zone supporters avec animations",
  },
  {
    id: "3",
    name: "Café Maure",
    type: "restaurant",
    position: [34.0266, -6.8367],
    description: "Café traditionnel avec vue",
  },
  {
    id: "4",
    name: "Kasbah des Oudayas",
    type: "activity",
    position: [34.0269, -6.8361],
    description: "Site touristique incontournable",
  },
  {
    id: "5",
    name: "Hotel Sofitel Rabat",
    type: "hotel",
    position: [34.0151, -6.8323],
    description: "Hôtel haut de gamme",
  },
];