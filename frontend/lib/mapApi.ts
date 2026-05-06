import type { MapItem, MapItemType } from "../app/components/map/types";

const GATEWAY_BASE_URL =
  process.env.NEXT_PUBLIC_GATEWAY_BASE_URL ?? "http://localhost:5266";

const EVENT_MATCHES_ENDPOINT = `${GATEWAY_BASE_URL}/event-matches/matches/world-cup`;
const BUSINESSES_ENDPOINT = `${GATEWAY_BASE_URL}/business/api/commerces`;
const DISCOVERY_ENDPOINT = `${GATEWAY_BASE_URL}/decouverte/api/places`;
const CULTURE_ENDPOINT = `${GATEWAY_BASE_URL}/culture/api/contenus-culturels`;

type ApiHoraire = {
  id: string;
  jourSemaine: number;
  heureOuverture?: string | null;
  heureFermeture?: string | null;
  estFerme?: boolean;
};

type ApiAvis = {
  id: string;
  note: number;
  commentaire: string | null;
  utilisateurEmail: string | null;
  dateCreation?: string;
};

type EventMatchFanZoneApiItem = {
  name?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
};

type EventMatchApiItem = {
  id?: string | number;
  matchId?: string | number;
  homeTeam?: string;
  awayTeam?: string;
  homeTeamName?: string;
  awayTeamName?: string;
  city?: string;
  stadiumName?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  isExperienceMatch?: boolean;
  fanZones?: EventMatchFanZoneApiItem[];
};

type BusinessApiPhoto = {
  id?: string;
  ordre?: number;
  dateAjout?: string;
  urlImage?: string;
};

type BusinessApiItem = {
  id?: string;
  nom?: string;
  name?: string;
  description?: string;
  adresse?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;

  categorieNom?: string;
  categoryName?: string;
  categorieName?: string;
  nomCategorie?: string;
  categorie?: { nom?: string; name?: string };
  category?: string | { nom?: string; name?: string };

  culturalTags?: string[];
  tagsCulturels?: string[];
  tags?: Array<{ nom?: string; name?: string }>;

  photos?: BusinessApiPhoto[];
  businessType?: "Hotel" | "Restaurant" | "Activity" | string;

  note?: number | null;
  noteGlobale?: number | null;
  moyenneAvis?: number | null;
  moyenneNote?: number | null;
  rating?: number | null;

  nombreAvis?: number | null;
  nbAvis?: number | null;
  avisCount?: number | null;
  totalAvis?: number | null;

  horaires?: ApiHoraire[];
  horairesCommerces?: ApiHoraire[];
  horairesCommerce?: ApiHoraire[];

  avis?: ApiAvis[];
  avisClients?: ApiAvis[];
  reviews?: ApiAvis[];
};

type DiscoveryApiItem = {
  id?: string;
  nom?: string;
  description?: string;
  type?: string;
  adresse?: string;
  latitude?: number | null;
  longitude?: number | null;
  ville?: string;
  tags?: string[];
  prixMoyen?: number | null;
  images?: string[];
  estOuvert?: boolean | null;
  horairesOuverture?: string | null;
  popularite?: number | null;
};

export type RichMapItem = MapItem;

type CultureApiItem = {
  id?: string | number;
  titre?: string;
  description?: string;
  lieu?: string;
  latitude?: number | null;
  longitude?: number | null;
  statut?: string;
  nomCategorie?: string;
  tagsCulturels?: string[];
  medias?: Array<{ type?: string; url?: string }>;
};

function isValidCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function safeString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function safeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeText(value: unknown): string {
  return (
    safeString(value)
      ?.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim() ?? ""
  );
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureUniqueIds(items: RichMapItem[]): RichMapItem[] {
  const seen = new Map<string, number>();

  return items.map((item) => {
    const count = seen.get(item.id) ?? 0;
    seen.set(item.id, count + 1);

    if (count === 0) return item;

    return {
      ...item,
      id: `${item.id}-${count + 1}`,
    };
  });
}

function getBusinessRating(business: BusinessApiItem): number | null {
  return (
    safeNumber(business.noteGlobale) ??
    safeNumber(business.note) ??
    safeNumber(business.moyenneAvis) ??
    safeNumber(business.moyenneNote) ??
    safeNumber(business.rating) ??
    null
  );
}

function getBusinessAvis(business: BusinessApiItem): ApiAvis[] {
  const rawAvis = business.avis ?? business.avisClients ?? business.reviews ?? [];

  if (!Array.isArray(rawAvis)) return [];

  return rawAvis
    .map((avis, index) => {
      const note = safeNumber(avis.note);
      if (note === null) return null;

      return {
        id: safeString(avis.id) ?? `avis-${index}`,
        note,
        commentaire: safeString(avis.commentaire) ?? null,
        utilisateurEmail: safeString(avis.utilisateurEmail) ?? null,
        dateCreation: safeString(avis.dateCreation),
      };
    })
    .filter((avis) => avis !== null) as ApiAvis[];
}

function getBusinessReviewCount(business: BusinessApiItem): number {
  const explicitCount =
    safeNumber(business.nombreAvis) ??
    safeNumber(business.nbAvis) ??
    safeNumber(business.avisCount) ??
    safeNumber(business.totalAvis);

  if (explicitCount !== null) return explicitCount;

  return getBusinessAvis(business).length;
}

function getBusinessHoraires(business: BusinessApiItem): ApiHoraire[] {
  const horaires =
    business.horaires ??
    business.horairesCommerces ??
    business.horairesCommerce ??
    [];

  if (!Array.isArray(horaires)) return [];

  return horaires
    .map((h, index) => {
      const jour = safeNumber(h.jourSemaine);
      if (jour === null) return null;

      return {
        id: safeString(h.id) ?? `horaire-${index}`,
        jourSemaine: jour,
        heureOuverture: safeString(h.heureOuverture) ?? null,
        heureFermeture: safeString(h.heureFermeture) ?? null,
        estFerme: Boolean(h.estFerme),
      };
    })
    .filter((h) => h !== null) as ApiHoraire[];
}

function extractBusinessCategory(business: BusinessApiItem): string | undefined {
  return (
    safeString(business.nomCategorie) ||
    safeString(business.categorieNom) ||
    safeString(business.categoryName) ||
    safeString(business.categorieName) ||
    safeString(business.categorie?.nom) ||
    safeString(business.categorie?.name) ||
    safeString(
      typeof business.category === "string" ? business.category : undefined
    ) ||
    safeString(
      typeof business.category === "object" ? business.category?.nom : undefined
    ) ||
    safeString(
      typeof business.category === "object"
        ? business.category?.name
        : undefined
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
  const normalized = normalizeText(businessType);

  if (!normalized) return undefined;
  if (normalized === "hotel") return "hotel";
  if (normalized === "restaurant") return "restaurant";
  if (normalized === "activity") return "activity";

  return undefined;
}

function includesAny(source: string, values: string[]): boolean {
  return values.some((value) => source.includes(value));
}

function tagsIncludeAny(tags: string[], values: string[]): boolean {
  return tags.some((tag) => includesAny(tag, values));
}

function mapCategoryToType(
  category?: string,
  tags: string[] = [],
  name?: string,
  businessType?: BusinessApiItem["businessType"]
): MapItemType {
  const directType = mapBusinessTypeToMapType(businessType);
  if (directType) return directType;

  const normalizedCategory = normalizeText(category);
  const normalizedName = normalizeText(name);
  const normalizedTags = tags.map((tag) => normalizeText(tag));

  const restaurantKeywords = [
    "restauration",
    "restaurant",
    "cafe",
    "salon de the",
    "street food",
    "food",
    "snack",
    "fast food",
    "bistro",
    "brasserie",
    "grill",
    "pizzeria",
    "pizza",
    "burger",
    "gastronomie",
  ];

  const hotelKeywords = [
    "hebergement",
    "hotel",
    "riad",
    "auberge",
    "maison d hotes",
    "maison hotes",
    "resort",
  ];

  const activityKeywords = [
    "loisirs",
    "loisir",
    "tourisme",
    "touristique",
    "activite",
    "artisanat",
    "beaute",
    "bien etre",
    "mode",
    "habillement",
    "services",
    "souvenirs",
    "cadeaux",
    "epicerie",
    "produits locaux",
    "culturel",
    "patrimoine",
  ];

  if (
    includesAny(normalizedCategory, restaurantKeywords) ||
    includesAny(normalizedName, restaurantKeywords) ||
    tagsIncludeAny(normalizedTags, restaurantKeywords)
  ) {
    return "restaurant";
  }

  if (
    includesAny(normalizedCategory, hotelKeywords) ||
    includesAny(normalizedName, hotelKeywords) ||
    tagsIncludeAny(normalizedTags, hotelKeywords)
  ) {
    return "hotel";
  }

  if (
    includesAny(normalizedCategory, activityKeywords) ||
    includesAny(normalizedName, activityKeywords) ||
    tagsIncludeAny(normalizedTags, activityKeywords)
  ) {
    return "activity";
  }

  return "activity";
}

function mapDiscoveryTypeToMapType(discoveryType?: string): MapItemType {
  const normalized = normalizeText(discoveryType);

  if (normalized === "hotel") return "hotel";
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
    safeString(match.homeTeamName) || safeString(match.homeTeam) || "teamA",
    safeString(match.awayTeamName) || safeString(match.awayTeam) || "teamB",
    safeString(match.city) ?? "unknown-city",
    safeString(match.stadiumName) ?? "unknown-stadium",
    String(matchIndex),
  ];

  return slugify(parts.join("-"));
}

function mapMatchToMapItems(
  match: EventMatchApiItem,
  matchIndex: number
): RichMapItem[] {
  const results: RichMapItem[] = [];

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
    source: "event",
    name:
      safeString(match.stadiumName) ||
      `${safeString(match.homeTeamName) || safeString(match.homeTeam) || "Équipe A"} vs ${
        safeString(match.awayTeamName) ||
        safeString(match.awayTeam) ||
        "Équipe B"
      }`,
    type: "stadium",
    position: [stadiumLatitude, stadiumLongitude],
    description:
      safeString(match.address) ||
      safeString(match.city) ||
      "Stade lié à un match d’expérience",
    adresse: safeString(match.address) || safeString(match.city),
    nomCategorie: "Stade",
    tagsCulturels: [],
    note: null,
    noteGlobale: null,
    nombreAvis: null,
    horaires: [],
    avis: [],
    prixMoyen: null,
    popularite: null,
    estOuvert: null,
    horairesOuverture: null,
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
      source: "event",
      name: zoneName,
      type: "fanzone",
      position: [fanZoneLatitude, fanZoneLongitude],
      description:
        safeString(fanZone.address) ||
        `Fan zone liée au match à ${safeString(match.city) ?? "la ville hôte"}`,
      adresse: safeString(fanZone.address) || safeString(match.city),
      nomCategorie: "Fan zone",
      tagsCulturels: [],
      note: null,
      noteGlobale: null,
      nombreAvis: null,
      horaires: [],
      avis: [],
      prixMoyen: null,
      popularite: null,
      estOuvert: null,
      horairesOuverture: null,
    });
  });

  return results;
}

function extractPrimaryPhotoUrl(business: BusinessApiItem): string | undefined {
  if (!Array.isArray(business.photos) || business.photos.length === 0) {
    return undefined;
  }

  const sortedPhotos = [...business.photos].sort((a, b) => {
    const ordreA =
      typeof a.ordre === "number" ? a.ordre : Number.MAX_SAFE_INTEGER;
    const ordreB =
      typeof b.ordre === "number" ? b.ordre : Number.MAX_SAFE_INTEGER;

    if (ordreA !== ordreB) return ordreA - ordreB;

    const dateA = a.dateAjout
      ? new Date(a.dateAjout).getTime()
      : Number.MAX_SAFE_INTEGER;
    const dateB = b.dateAjout
      ? new Date(b.dateAjout).getTime()
      : Number.MAX_SAFE_INTEGER;

    return dateA - dateB;
  });

  const firstPhoto = sortedPhotos[0];
  const relativeUrl = safeString(firstPhoto?.urlImage);

  if (!relativeUrl) return undefined;

  if (relativeUrl.startsWith("http://") || relativeUrl.startsWith("https://")) {
    return relativeUrl;
  }

  return `${GATEWAY_BASE_URL}/business${relativeUrl}`;
}

function mapBusinessToMapItem(business: BusinessApiItem): RichMapItem | null {
  if (
    !isValidCoordinate(business.latitude) ||
    !isValidCoordinate(business.longitude)
  ) {
    return null;
  }

  const category = extractBusinessCategory(business);
  const tags = extractBusinessTags(business);

  const name =
    safeString(business.nom) || safeString(business.name) || "Commerce local";

  const type = mapCategoryToType(category, tags, name, business.businessType);

  const rating = getBusinessRating(business);
  const horaires = getBusinessHoraires(business);
  const avis = getBusinessAvis(business);
  const reviewCount = getBusinessReviewCount(business);

  return {
    id: `business-${safeString(business.id) ?? crypto.randomUUID()}`,
    source: "business",
    name,
    type,
    position: [business.latitude, business.longitude],
    description: safeString(business.description) || "Commerce partenaire GoMatch",
    adresse: safeString(business.adresse) || safeString(business.address),
    nomCategorie: category ?? "Commerce local",
    tagsCulturels: tags,
    imageUrl: extractPrimaryPhotoUrl(business),
    note: rating,
    noteGlobale: rating,
    nombreAvis: reviewCount,
    horaires,
    avis,
    prixMoyen: null,
    popularite: null,
    estOuvert: null,
    horairesOuverture: null,
  };
}

function getDiscoveryFallbackImage(type?: string): string {
  const normalized = normalizeText(type);

  switch (normalized) {
    case "hotel":
      return "/images/hotel.png";
    case "nightlife":
      return "/images/nightlife.png";
    case "museum":
      return "/images/types/museum.jpg";
    case "attraction":
      return "/images/types/attraction.jpg";
    case "viewpoint":
      return "/images/types/viewpoint.jpg";
    case "activity":
      return "/images/types/activity.jpg";
    default:
      return "/images/types/default.jpg";
  }
}

function buildDiscoveryTags(item: DiscoveryApiItem): string[] {
  const tags = Array.isArray(item.tags)
    ? item.tags
        .map((tag) => safeString(tag))
        .filter((tag): tag is string => Boolean(tag))
    : [];

  const type = safeString(item.type);

  if (type && !tags.includes(type)) {
    tags.unshift(type);
  }

  return [...new Set(tags)];
}

function getDiscoveryCategoryLabel(type?: string): string {
  const normalized = normalizeText(type);

  switch (normalized) {
    case "hotel":
      return "Hôtel";
    case "nightlife":
      return "Nightlife";
    case "museum":
      return "Musée";
    case "attraction":
      return "Attraction";
    case "viewpoint":
      return "Viewpoint";
    case "activity":
      return "Activité";
    default:
      return "Lieu touristique";
  }
}

function extractDiscoveryImageUrl(item: DiscoveryApiItem): string | undefined {
  if (!Array.isArray(item.images) || item.images.length === 0) {
    return undefined;
  }

  const firstImage = safeString(item.images[0]);
  if (!firstImage) return undefined;

  if (firstImage.startsWith("http://") || firstImage.startsWith("https://")) {
    return firstImage;
  }

  return firstImage;
}

function mapDiscoveryToMapItem(item: DiscoveryApiItem): RichMapItem | null {
  if (!isValidCoordinate(item.latitude) || !isValidCoordinate(item.longitude)) {
    return null;
  }

  const name = safeString(item.nom) || "Lieu touristique";
  const discoveryType = safeString(item.type) || "activity";
  const mapType = mapDiscoveryTypeToMapType(discoveryType);
  const imageUrl =
    extractDiscoveryImageUrl(item) || getDiscoveryFallbackImage(discoveryType);
  const tags = buildDiscoveryTags(item);

  return {
    id: `discovery-${safeString(item.id) ?? crypto.randomUUID()}`,
    source: "discovery",
    name,
    type: mapType,
    position: [item.latitude, item.longitude],
    description: safeString(item.description) || "Lieu touristique à Rabat.",
    adresse: safeString(item.adresse) || safeString(item.ville) || "Rabat",
    nomCategorie: getDiscoveryCategoryLabel(discoveryType),
    tagsCulturels: tags,
    imageUrl,

    note: null,
    noteGlobale: null,
    nombreAvis: null,
    horaires: [],
    avis: [],

    prixMoyen: item.prixMoyen ?? null,
    estOuvert: item.estOuvert ?? null,
    horairesOuverture: safeString(item.horairesOuverture) ?? null,
    popularite: item.popularite ?? null,
  };
}

function mapCultureToMapItem(item: CultureApiItem): RichMapItem | null {
  if (!isValidCoordinate(item.latitude) || !isValidCoordinate(item.longitude)) {
    return null;
  }

  const name = safeString(item.titre) || "Site culturel";
  const tags: string[] = Array.isArray(item.tagsCulturels)
    ? item.tagsCulturels.filter((t): t is string => typeof t === "string" && t.length > 0)
    : [];

  const imageMedia = Array.isArray(item.medias)
    ? item.medias.find((m) => m.type === "Image" && m.url)
    : undefined;
  const imageUrl = imageMedia?.url
    ? imageMedia.url.startsWith("http")
      ? imageMedia.url
      : `${GATEWAY_BASE_URL}/culture${imageMedia.url}`
    : undefined;

  return {
    id: `culture-${safeString(String(item.id)) ?? crypto.randomUUID()}`,
    source: "culture",
    name,
    type: "culture",
    position: [item.latitude as number, item.longitude as number],
    description: safeString(item.description) || "Site culturel et patrimonial.",
    adresse: safeString(item.lieu),
    nomCategorie: safeString(item.nomCategorie) || "Culturel",
    tagsCulturels: tags,
    imageUrl,
    note: null,
    noteGlobale: null,
    nombreAvis: null,
    horaires: [],
    avis: [],
    prixMoyen: null,
    popularite: null,
    estOuvert: null,
    horairesOuverture: null,
  };
}

function spreadOverlappingItems(items: RichMapItem[]): RichMapItem[] {
  const groups = new Map<string, RichMapItem[]>();

  for (const item of items) {
    const key = `${item.position[0].toFixed(6)}:${item.position[1].toFixed(6)}`;
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }

  const result: RichMapItem[] = [];

  for (const [, group] of groups) {
    if (group.length === 1) {
      result.push(group[0]);
      continue;
    }

    const [baseLat, baseLng] = group[0].position;
    const radius = 0.0006;

    group.forEach((item, index) => {
      const angle = (index / group.length) * 2 * Math.PI;

      result.push({
        ...item,
        position: [
          baseLat + Math.sin(angle) * radius,
          baseLng + Math.cos(angle) * radius,
        ],
      });
    });
  }

  return result;
}

async function readJsonSafe<T>(url: string): Promise<T[]> {
  try {
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      console.warn(`fetchMapItems: HTTP ${response.status} pour ${url}`);
      return [];
    }

    const data = await response.json();

    if (Array.isArray(data)) return data as T[];
    if (Array.isArray(data?.items)) return data.items as T[];
    if (Array.isArray(data?.data)) return data.data as T[];
    if (Array.isArray(data?.result)) return data.result as T[];

    return [];
  } catch (err) {
    console.warn(`fetchMapItems: erreur réseau pour ${url}`, err);
    return [];
  }
}

export async function fetchMapItems(): Promise<RichMapItem[]> {
  const [matchesData, businessesData, discoveryData, cultureData] = await Promise.all([
    readJsonSafe<EventMatchApiItem>(EVENT_MATCHES_ENDPOINT),
    readJsonSafe<BusinessApiItem>(BUSINESSES_ENDPOINT),
    readJsonSafe<DiscoveryApiItem>(DISCOVERY_ENDPOINT),
    readJsonSafe<CultureApiItem>(`${CULTURE_ENDPOINT}?statut=Publié`),
  ]);

  const matchItems = matchesData.flatMap((match, index) =>
    mapMatchToMapItems(match, index)
  );

  const businessItems = businessesData
    .map(mapBusinessToMapItem)
    .filter((item): item is RichMapItem => item !== null);

  const discoveryItems = discoveryData
    .map(mapDiscoveryToMapItem)
    .filter((item): item is RichMapItem => item !== null);

  const cultureItems = cultureData
    .filter((item) => item.statut === "Publié" || !item.statut)
    .map(mapCultureToMapItem)
    .filter((item): item is RichMapItem => item !== null);

  return ensureUniqueIds(
    spreadOverlappingItems([...matchItems, ...businessItems, ...discoveryItems, ...cultureItems])
  );
}