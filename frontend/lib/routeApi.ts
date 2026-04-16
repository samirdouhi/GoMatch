export type RouteMode = "driving" | "walking";

export type RouteInfo = {
  coordinates: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
};

export type MultiRouteInfo = {
  segments: RouteInfo[];
  totalDistanceMeters: number;
  totalDurationSeconds: number;
};

type OsrmRouteGeometry = {
  coordinates: [number, number][];
};

type OsrmRoute = {
  distance: number;
  duration: number;
  geometry: OsrmRouteGeometry;
};

type OsrmRouteResponse = {
  code: string;
  routes: OsrmRoute[];
};

const WALKING_SPEED_M_PER_SEC = 1.4;
const ROUTING_BASE_URL =
  process.env.NEXT_PUBLIC_ROUTING_BASE_URL ??
  "https://router.project-osrm.org";
const FETCH_TIMEOUT_MS = 12000;

function isValidCoordinatePair(
  value: [number, number] | null | undefined
): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  );
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchRouteBetweenPoints(
  start: [number, number],
  end: [number, number],
  mode: RouteMode = "driving"
): Promise<RouteInfo> {
  if (!isValidCoordinatePair(start) || !isValidCoordinatePair(end)) {
    throw new Error("Coordonnées de départ ou d’arrivée invalides.");
  }

  const startLngLat = `${start[1]},${start[0]}`;
  const endLngLat = `${end[1]},${end[0]}`;
  const profile = mode === "walking" ? "foot" : "driving";

  const url =
    `${ROUTING_BASE_URL}/route/v1/${profile}/` +
    `${startLngLat};${endLngLat}?overview=full&geometries=geojson`;

  let response: Response;

  try {
    response = await fetchWithTimeout(
      url,
      {
        method: "GET",
        cache: "no-store",
      },
      FETCH_TIMEOUT_MS
    );
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Le service d’itinéraire met trop de temps à répondre.");
    }

    throw new Error(
      "Impossible de contacter le service d’itinéraire pour le moment."
    );
  }

  if (!response.ok) {
    throw new Error(`Erreur OSRM (${profile}) : HTTP ${response.status}`);
  }

  let data: OsrmRouteResponse;
  try {
    data = (await response.json()) as OsrmRouteResponse;
  } catch {
    throw new Error("Réponse itinéraire invalide.");
  }

  if (
    data.code !== "Ok" ||
    !Array.isArray(data.routes) ||
    data.routes.length === 0
  ) {
    throw new Error(`Aucun itinéraire trouvé pour le profil ${profile}.`);
  }

  const bestRoute = data.routes[0];

  if (
    !bestRoute.geometry ||
    !Array.isArray(bestRoute.geometry.coordinates) ||
    bestRoute.geometry.coordinates.length === 0
  ) {
    throw new Error("Itinéraire vide renvoyé par le service.");
  }

  const coordinates: [number, number][] = bestRoute.geometry.coordinates
    .filter(
      (coord): coord is [number, number] =>
        Array.isArray(coord) &&
        coord.length === 2 &&
        Number.isFinite(coord[0]) &&
        Number.isFinite(coord[1])
    )
    .map(([lng, lat]) => [lat, lng]);

  if (coordinates.length === 0) {
    throw new Error("Coordonnées d’itinéraire invalides.");
  }

  const durationSeconds =
    mode === "walking"
      ? bestRoute.distance / WALKING_SPEED_M_PER_SEC
      : bestRoute.duration;

  return {
    coordinates,
    distanceMeters: bestRoute.distance,
    durationSeconds,
  };
}

export async function fetchRouteThroughStops(
  start: [number, number],
  stops: [number, number][],
  mode: RouteMode = "driving"
): Promise<MultiRouteInfo> {
  if (!isValidCoordinatePair(start)) {
    throw new Error("Point de départ invalide.");
  }

  if (!Array.isArray(stops) || stops.length === 0) {
    throw new Error("Aucun arrêt à calculer.");
  }

  const validStops = stops.filter(isValidCoordinatePair);

  if (validStops.length === 0) {
    throw new Error("Aucun arrêt valide.");
  }

  const segments: RouteInfo[] = [];
  let totalDistanceMeters = 0;
  let totalDurationSeconds = 0;

  let currentStart = start;

  for (const stop of validStops) {
    const segment = await fetchRouteBetweenPoints(currentStart, stop, mode);
    segments.push(segment);
    totalDistanceMeters += segment.distanceMeters;
    totalDurationSeconds += segment.durationSeconds;
    currentStart = stop;
  }

  return {
    segments,
    totalDistanceMeters,
    totalDurationSeconds,
  };
}

export function formatDistance(distanceMeters: number): string {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m`;
  }

  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

export function formatDuration(durationSeconds: number): string {
  const totalMinutes = Math.round(durationSeconds / 60);

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${minutes} min`;
}