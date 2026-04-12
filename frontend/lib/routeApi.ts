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
    `https://router.project-osrm.org/route/v1/${profile}/` +
    `${startLngLat};${endLngLat}?overview=full&geometries=geojson`;

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Erreur OSRM (${profile}) : HTTP ${response.status}`);
  }

  const data = (await response.json()) as OsrmRouteResponse;

  if (data.code !== "Ok" || !Array.isArray(data.routes) || data.routes.length === 0) {
    throw new Error(`Aucun itinéraire trouvé pour le profil ${profile}.`);
  }

  const bestRoute = data.routes[0];

  const coordinates: [number, number][] = bestRoute.geometry.coordinates.map(
    ([lng, lat]) => [lat, lng]
  );

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