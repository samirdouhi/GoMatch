import type { MapItem, MapItemType } from "../app/components/map/types";

const GATEWAY_BASE_URL =
  process.env.NEXT_PUBLIC_GATEWAY_BASE_URL ?? "http://localhost:5266";

const EVENT_MATCHES_ENDPOINT =
  `${GATEWAY_BASE_URL}/event-matches/matches/world-cup`;

const BUSINESSES_ENDPOINT =
  `${GATEWAY_BASE_URL}/business/api/commerces`;

type EventMatchFanZoneApiItem = {
  name?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
};

type EventMatchApiItem = {
  id?: string | number;
  matchId?: string | number;
  competitionCode?: string;
  competitionName?: string;
  homeTeam?: string;
  awayTeam?: string;
  homeTeamName?: string;
  awayTeamName?: string;
  utcDate?: string;
  status?: string;
  stage?: string;
  matchdayLabel?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  venue?: string;
  city?: string;
  stadiumName?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  isOfficialLocation?: boolean;
  locationSource?: string;
  isExperienceMatch?: boolean;
  fanZones?: EventMatchFanZoneApiItem[];
};

type BusinessApiItem = {
  id?: string;
  nom?: string;
  name?: string;
  description?: string;
  latitude?: number;
  longitude?: number;

  categorieNom?: string;
  categoryName?: string;
  categorie?: {
    nom?: string;
    name?: string;
  };

  culturalTags?: string[];
  tagsCulturels?: string[];
  tags?: Array<{
    nom?: string;
    name?: string;
  }>;

  category?: string | { nom?: string; name?: string };
  categorieName?: string;
  businessType?: "Hotel" | "Restaurant" | "Activity";
};

function isValidCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function safeString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureUniqueIds(items: MapItem[]): MapItem[] {
  const seen = new Map<string, number>();

  return items.map((item) => {
    const count = seen.get(item.id) ?? 0;
    seen.set(item.id, count + 1);

    if (count === 0) {
      return item;
    }

    return {
      ...item,
      id: `${item.id}-${count + 1}`,
    };
  });
}

function extractBusinessCategory(business: BusinessApiItem): string | undefined {
  return (
    safeString(business.categorieNom) ||
    safeString(business.categoryName) ||
    safeString(business.categorie?.nom) ||
    safeString(business.categorie?.name) ||
    safeString(business.categorieName) ||
    safeString(typeof business.category === "string" ? business.category : undefined) ||
    safeString(
      typeof business.category === "object" ? business.category?.nom : undefined
    ) ||
    safeString(
      typeof business.category === "object" ? business.category?.name : undefined
    )
  );
}

function extractBusinessTags(business: BusinessApiItem): string[] {
  const fromStringArrays = [
    ...(Array.isArray(business.culturalTags) ? business.culturalTags : []),
    ...(Array.isArray(business.tagsCulturels) ? business.tagsCulturels : []),
  ]
    .map((tag) => safeString(tag))
    .filter((tag): tag is string => Boolean(tag));

  const fromObjectArray = (Array.isArray(business.tags) ? business.tags : [])
    .map((tag) => safeString(tag.nom) || safeString(tag.name))
    .filter((tag): tag is string => Boolean(tag));

  return [...new Set([...fromStringArrays, ...fromObjectArray])];
}

function mapBusinessTypeToMapType(
  businessType?: BusinessApiItem["businessType"]
): MapItemType | undefined {
  if (!businessType) return undefined;

  switch (businessType) {
    case "Hotel":
      return "hotel";
    case "Restaurant":
      return "restaurant";
    case "Activity":
      return "activity";
    default:
      return undefined;
  }
}

function mapCategoryToType(
  category?: string,
  tags: string[] = [],
  name?: string,
  businessType?: BusinessApiItem["businessType"]
): MapItemType {
  const directType = mapBusinessTypeToMapType(businessType);
  if (directType) return directType;

  const normalizedCategory = category?.trim().toLowerCase() ?? "";
  const normalizedName = name?.trim().toLowerCase() ?? "";
  const normalizedTags = tags.map((tag) => tag.trim().toLowerCase());

  if (
    normalizedCategory.includes("restauration") ||
    normalizedCategory.includes("restaurant") ||
    normalizedCategory.includes("café") ||
    normalizedCategory.includes("cafe") ||
    normalizedCategory.includes("salon de thé") ||
    normalizedCategory.includes("salon de the")
  ) {
    return "restaurant";
  }

  if (
    normalizedCategory.includes("hébergement") ||
    normalizedCategory.includes("hebergement")
  ) {
    return "hotel";
  }

  if (
    normalizedName.includes("hotel") ||
    normalizedName.includes("hôtel")
  ) {
    return "hotel";
  }

  if (
    normalizedTags.includes("luxe") &&
    normalizedTags.includes("touristique")
  ) {
    return "hotel";
  }

  if (
    normalizedCategory.includes("loisirs") ||
    normalizedCategory.includes("loisir") ||
    normalizedCategory.includes("tourisme") ||
    normalizedCategory.includes("artisanat") ||
    normalizedCategory.includes("beauté") ||
    normalizedCategory.includes("beaute") ||
    normalizedCategory.includes("mode") ||
    normalizedCategory.includes("habillement") ||
    normalizedCategory.includes("services") ||
    normalizedCategory.includes("souvenirs") ||
    normalizedCategory.includes("cadeaux") ||
    normalizedCategory.includes("épicerie") ||
    normalizedCategory.includes("epicerie") ||
    normalizedCategory.includes("produits locaux")
  ) {
    return "activity";
  }

  return "activity";
}

function buildMatchBaseId(match: EventMatchApiItem, matchIndex: number): string {
  if (match.matchId !== undefined && match.matchId !== null) {
    return String(match.matchId);
  }

  if (match.id !== undefined && match.id !== null) {
    return String(match.id);
  }

  const parts = [
    safeString(match.homeTeamName) ||
      safeString(match.homeTeam) ||
      "teamA",
    safeString(match.awayTeamName) ||
      safeString(match.awayTeam) ||
      "teamB",
    safeString(match.city) ?? "unknown-city",
    safeString(match.stadiumName) ?? "unknown-stadium",
    String(matchIndex),
  ];

  return slugify(parts.join("-"));
}

function mapMatchToMapItems(
  match: EventMatchApiItem,
  matchIndex: number
): MapItem[] {
  const results: MapItem[] = [];

  if (
    !isValidCoordinate(match.latitude) ||
    !isValidCoordinate(match.longitude) ||
    !match.isExperienceMatch
  ) {
    return results;
  }

  const stadiumLatitude = match.latitude;
  const stadiumLongitude = match.longitude;
  const baseId = buildMatchBaseId(match, matchIndex);

  results.push({
    id: `stadium-${baseId}`,
    name:
      safeString(match.stadiumName) ||
      `${safeString(match.homeTeamName) || safeString(match.homeTeam) || "Équipe A"} vs ${
        safeString(match.awayTeamName) || safeString(match.awayTeam) || "Équipe B"
      }`,
    type: "stadium",
    position: [stadiumLatitude, stadiumLongitude],
    description:
      safeString(match.address) ||
      safeString(match.city) ||
      "Stade lié à un match d’expérience",
  });

  const fanZones = Array.isArray(match.fanZones) ? match.fanZones : [];
  const offsetRadius = 0.008;

  fanZones.forEach((fanZone, index) => {
    const zoneName = safeString(fanZone?.name);
    if (!zoneName) return;

    const angle = (index / Math.max(fanZones.length, 1)) * 2 * Math.PI;

    const fanZoneLatitude = isValidCoordinate(fanZone.latitude)
      ? fanZone.latitude
      : stadiumLatitude + Math.sin(angle) * offsetRadius;

    const fanZoneLongitude = isValidCoordinate(fanZone.longitude)
      ? fanZone.longitude
      : stadiumLongitude + Math.cos(angle) * offsetRadius;

    results.push({
      id: `fanzone-${baseId}-${index}`,
      name: zoneName,
      type: "fanzone",
      position: [fanZoneLatitude, fanZoneLongitude],
      description:
        safeString(fanZone.address) ||
        `Fan zone liée au match à ${safeString(match.city) ?? "la ville hôte"}`,
    });
  });

  return results;
}

function mapBusinessToMapItem(business: BusinessApiItem): MapItem | null {
  if (
    !isValidCoordinate(business.latitude) ||
    !isValidCoordinate(business.longitude)
  ) {
    return null;
  }

  const latitude = business.latitude;
  const longitude = business.longitude;

  const category = extractBusinessCategory(business);
  const tags = extractBusinessTags(business);
  const name =
    safeString(business.nom) ||
    safeString(business.name) ||
    "Commerce local";

  const normalizedName = name.toLowerCase();

  let type = mapCategoryToType(
    category,
    tags,
    name,
    business.businessType
  );

  if (
    normalizedName.includes("hotel") ||
    normalizedName.includes("hôtel")
  ) {
    type = "hotel";
  }

  const descriptionParts: string[] = [];

  if (category) {
    descriptionParts.push(category);
  }

  if (tags.length > 0) {
    descriptionParts.push(`Tags : ${tags.join(", ")}`);
  }

  const businessDescription = safeString(business.description);
  if (businessDescription) {
    descriptionParts.push(businessDescription);
  }

  return {
    id: `business-${safeString(business.id) ?? crypto.randomUUID()}`,
    name,
    type,
    position: [latitude, longitude],
    description:
      descriptionParts.join(" • ") || "Commerce partenaire GoMatch",
  };
}

function spreadOverlappingItems(items: MapItem[]): MapItem[] {
  const groups = new Map<string, MapItem[]>();

  for (const item of items) {
    const key = `${item.position[0].toFixed(6)}:${item.position[1].toFixed(6)}`;
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }

  const result: MapItem[] = [];

  for (const [, group] of groups) {
    if (group.length === 1) {
      result.push(group[0]);
      continue;
    }

    const [baseLat, baseLng] = group[0].position;
    const radius = 0.006;

    group.forEach((item, index) => {
      const angle = (index / group.length) * 2 * Math.PI;

      const adjustedLat = baseLat + Math.sin(angle) * radius;
      const adjustedLng = baseLng + Math.cos(angle) * radius;

      result.push({
        ...item,
        position: [adjustedLat, adjustedLng],
      });
    });
  }

  return result;
}

async function readJsonOrThrow<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} sur ${url}`);
  }

  return (await response.json()) as T;
}

export async function fetchMapItems(): Promise<MapItem[]> {
  const [matchesData, businessesData] = await Promise.all([
    readJsonOrThrow<EventMatchApiItem[]>(EVENT_MATCHES_ENDPOINT),
    readJsonOrThrow<BusinessApiItem[]>(BUSINESSES_ENDPOINT),
  ]);

  const matchItems = matchesData.flatMap((match, index) =>
    mapMatchToMapItems(match, index)
  );

  const businessItems = businessesData
    .map(mapBusinessToMapItem)
    .filter((item): item is MapItem => item !== null);

  const allItems = [...matchItems, ...businessItems];
  const spreadItems = spreadOverlappingItems(allItems);

  return ensureUniqueIds(spreadItems);
}