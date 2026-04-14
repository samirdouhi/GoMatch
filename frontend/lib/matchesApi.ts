export type MatchPhase =
  | "Groupes"
  | "Huitièmes"
  | "Quarts"
  | "Demi-finales"
  | "Finale"
  | "Autre";

export type Match = {
  id: string;
  equipe1: string;
  equipe2: string;
  drapeau1: string;
  drapeau2: string;
  crestEquipe1: string;
  crestEquipe2: string;
  codeEquipe1: string;
  codeEquipe2: string;
  date: string;
  heure: string;
  stade: string;
  ville: string;
  phase: MatchPhase;
  groupe?: string;
  status: string;
  competitionCode: string;
  competitionName: string;
};

type EventMatchApiResponse = {
  id: number;
  competitionCode: string;
  competitionName: string;
  homeTeam: string;
  awayTeam: string;
  homeCrest: string;
  awayCrest: string;
  utcDate: string;
  status: string;
  stage: string;
  matchdayLabel: string;
  homeScore: number | null;
  awayScore: number | null;
  venue: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_GATEWAY_BASE_URL ?? "http://localhost:5266";

function mapStageToPhase(stage: string): MatchPhase {
  const normalized = stage.trim().toLowerCase();

  if (normalized.includes("group")) return "Groupes";
  if (
    normalized.includes("last 16") ||
    normalized.includes("round of 16") ||
    normalized.includes("round-of-16")
  ) {
    return "Huitièmes";
  }
  if (normalized.includes("quarter")) return "Quarts";
  if (normalized.includes("semi")) return "Demi-finales";
  if (normalized === "final" || normalized.includes(" final")) return "Finale";

  return "Autre";
}

function extractGroup(stage: string): string | undefined {
  const match = stage.match(/group\s+([a-z])/i);
  return match ? match[1].toUpperCase() : undefined;
}

function normalizeTeamName(teamName: string): string {
  return teamName
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ");
}

function getTeamVisual(teamName: string): {
  flag: string;
  code: string;
} {
  const normalized = normalizeTeamName(teamName);

  const map: Record<string, { flag: string; code: string }> = {
    // Afrique du Nord / Moyen-Orient
    morocco: { flag: "🇲🇦", code: "MA" },
    maroc: { flag: "🇲🇦", code: "MA" },
    egypt: { flag: "🇪🇬", code: "EG" },
    egypte: { flag: "🇪🇬", code: "EG" },
    algeria: { flag: "🇩🇿", code: "DZ" },
    algerie: { flag: "🇩🇿", code: "DZ" },
    tunisia: { flag: "🇹🇳", code: "TN" },
    tunisie: { flag: "🇹🇳", code: "TN" },
    "saudi arabia": { flag: "🇸🇦", code: "SA" },
    "arabie saoudite": { flag: "🇸🇦", code: "SA" },
    iraq: { flag: "🇮🇶", code: "IQ" },
    irak: { flag: "🇮🇶", code: "IQ" },
    jordan: { flag: "🇯🇴", code: "JO" },
    jordanie: { flag: "🇯🇴", code: "JO" },
    qatar: { flag: "🇶🇦", code: "QA" },
    bahrain: { flag: "🇧🇭", code: "BH" },
    bahrein: { flag: "🇧🇭", code: "BH" },
    oman: { flag: "🇴🇲", code: "OM" },
    "united arab emirates": { flag: "🇦🇪", code: "AE" },
    "emirats arabes unis": { flag: "🇦🇪", code: "AE" },
    iran: { flag: "🇮🇷", code: "IR" },
    palestine: { flag: "🇵🇸", code: "PS" },

    // Afrique subsaharienne
    senegal: { flag: "🇸🇳", code: "SN" },
    nigeria: { flag: "🇳🇬", code: "NG" },
    "south africa": { flag: "🇿🇦", code: "ZA" },
    "afrique du sud": { flag: "🇿🇦", code: "ZA" },
    cameroon: { flag: "🇨🇲", code: "CM" },
    cameroun: { flag: "🇨🇲", code: "CM" },
    ghana: { flag: "🇬🇭", code: "GH" },
    "ivory coast": { flag: "🇨🇮", code: "CI" },
    "cote d'ivoire": { flag: "🇨🇮", code: "CI" },
    "côte d'ivoire": { flag: "🇨🇮", code: "CI" },
    mali: { flag: "🇲🇱", code: "ML" },
    "dr congo": { flag: "🇨🇩", code: "CD" },
    "congo dr": { flag: "🇨🇩", code: "CD" },
    "democratic republic of congo": { flag: "🇨🇩", code: "CD" },
    tanzania: { flag: "🇹🇿", code: "TZ" },
    tanzanie: { flag: "🇹🇿", code: "TZ" },
    comoros: { flag: "🇰🇲", code: "KM" },
    comores: { flag: "🇰🇲", code: "KM" },
    "cape verde": { flag: "🇨🇻", code: "CV" },
    "cap-vert": { flag: "🇨🇻", code: "CV" },
    zambia: { flag: "🇿🇲", code: "ZM" },
    zambie: { flag: "🇿🇲", code: "ZM" },
    zimbabwe: { flag: "🇿🇼", code: "ZW" },
    kenya: { flag: "🇰🇪", code: "KE" },
    uganda: { flag: "🇺🇬", code: "UG" },
    ouganda: { flag: "🇺🇬", code: "UG" },
    angola: { flag: "🇦🇴", code: "AO" },
    mozambique: { flag: "🇲🇿", code: "MZ" },

    // Europe de l'Ouest
    france: { flag: "🇫🇷", code: "FR" },
    spain: { flag: "🇪🇸", code: "ES" },
    espagne: { flag: "🇪🇸", code: "ES" },
    portugal: { flag: "🇵🇹", code: "PT" },
    germany: { flag: "🇩🇪", code: "DE" },
    allemagne: { flag: "🇩🇪", code: "DE" },
    england: { flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", code: "ENG" },
    angleterre: { flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", code: "ENG" },
    scotland: { flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", code: "SCO" },
    ecosse: { flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", code: "SCO" },
    wales: { flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", code: "WAL" },
    pays: { flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", code: "WAL" },
    "northern ireland": { flag: "🇬🇧", code: "NIR" },
    "irlande du nord": { flag: "🇬🇧", code: "NIR" },
    italy: { flag: "🇮🇹", code: "IT" },
    italie: { flag: "🇮🇹", code: "IT" },
    netherlands: { flag: "🇳🇱", code: "NL" },
    "pays-bas": { flag: "🇳🇱", code: "NL" },
    belgium: { flag: "🇧🇪", code: "BE" },
    belgique: { flag: "🇧🇪", code: "BE" },
    switzerland: { flag: "🇨🇭", code: "CH" },
    suisse: { flag: "🇨🇭", code: "CH" },
    austria: { flag: "🇦🇹", code: "AT" },
    autriche: { flag: "🇦🇹", code: "AT" },
    sweden: { flag: "🇸🇪", code: "SE" },
    suede: { flag: "🇸🇪", code: "SE" },
    denmark: { flag: "🇩🇰", code: "DK" },
    danemark: { flag: "🇩🇰", code: "DK" },
    norway: { flag: "🇳🇴", code: "NO" },
    norvege: { flag: "🇳🇴", code: "NO" },
    finland: { flag: "🇫🇮", code: "FI" },
    finlande: { flag: "🇫🇮", code: "FI" },
    ireland: { flag: "🇮🇪", code: "IE" },
    irlande: { flag: "🇮🇪", code: "IE" },
    greece: { flag: "🇬🇷", code: "GR" },
    grece: { flag: "🇬🇷", code: "GR" },
    turkey: { flag: "🇹🇷", code: "TR" },
    turquie: { flag: "🇹🇷", code: "TR" },

    // Europe de l'Est / Balkans
    croatia: { flag: "🇭🇷", code: "HR" },
    croatie: { flag: "🇭🇷", code: "HR" },
    serbia: { flag: "🇷🇸", code: "RS" },
    serbie: { flag: "🇷🇸", code: "RS" },
    poland: { flag: "🇵🇱", code: "PL" },
    pologne: { flag: "🇵🇱", code: "PL" },
    ukraine: { flag: "🇺🇦", code: "UA" },
    hungary: { flag: "🇭🇺", code: "HU" },
    hongrie: { flag: "🇭🇺", code: "HU" },
    romania: { flag: "🇷🇴", code: "RO" },
    roumanie: { flag: "🇷🇴", code: "RO" },
    czechia: { flag: "🇨🇿", code: "CZ" },
    "czech republic": { flag: "🇨🇿", code: "CZ" },
    "republique tcheque": { flag: "🇨🇿", code: "CZ" },
    slovakia: { flag: "🇸🇰", code: "SK" },
    slovaquie: { flag: "🇸🇰", code: "SK" },
    slovenia: { flag: "🇸🇮", code: "SI" },
    slovenie: { flag: "🇸🇮", code: "SI" },
    albania: { flag: "🇦🇱", code: "AL" },
    albanie: { flag: "🇦🇱", code: "AL" },
    "bosnia-herzegovina": { flag: "🇧🇦", code: "BA" },
    "bosnia and herzegovina": { flag: "🇧🇦", code: "BA" },
    "bosnie-herzegovine": { flag: "🇧🇦", code: "BA" },
    russia: { flag: "🇷🇺", code: "RU" },
    russie: { flag: "🇷🇺", code: "RU" },
    bulgaria: { flag: "🇧🇬", code: "BG" },
    bulgarie: { flag: "🇧🇬", code: "BG" },
    "north macedonia": { flag: "🇲🇰", code: "MK" },
    "macedoine du nord": { flag: "🇲🇰", code: "MK" },
    montenegro: { flag: "🇲🇪", code: "ME" },
    montenégro: { flag: "🇲🇪", code: "ME" },
    georgia: { flag: "🇬🇪", code: "GE" },
    georgie: { flag: "🇬🇪", code: "GE" },
    azerbaijan: { flag: "🇦🇿", code: "AZ" },
    azerbaidjan: { flag: "🇦🇿", code: "AZ" },

    // Asie / Océanie
    japan: { flag: "🇯🇵", code: "JP" },
    japon: { flag: "🇯🇵", code: "JP" },
    "south korea": { flag: "🇰🇷", code: "KR" },
    "coree du sud": { flag: "🇰🇷", code: "KR" },
    "corée du sud": { flag: "🇰🇷", code: "KR" },
    australia: { flag: "🇦🇺", code: "AU" },
    australie: { flag: "🇦🇺", code: "AU" },
    china: { flag: "🇨🇳", code: "CN" },
    chine: { flag: "🇨🇳", code: "CN" },
    indonesia: { flag: "🇮🇩", code: "ID" },
    indonesie: { flag: "🇮🇩", code: "ID" },
    uzbekistan: { flag: "🇺🇿", code: "UZ" },
    ouzbekistan: { flag: "🇺🇿", code: "UZ" },
    thailand: { flag: "🇹🇭", code: "TH" },
    thailande: { flag: "🇹🇭", code: "TH" },
    "new zealand": { flag: "🇳🇿", code: "NZ" },
    "nouvelle-zelande": { flag: "🇳🇿", code: "NZ" },

    // Amérique du Nord / Centrale / Caraïbes
    usa: { flag: "🇺🇸", code: "US" },
    "united states": { flag: "🇺🇸", code: "US" },
    canada: { flag: "🇨🇦", code: "CA" },
    mexico: { flag: "🇲🇽", code: "MX" },
    mexique: { flag: "🇲🇽", code: "MX" },
    "costa rica": { flag: "🇨🇷", code: "CR" },
    honduras: { flag: "🇭🇳", code: "HN" },
    panama: { flag: "🇵🇦", code: "PA" },
    "el salvador": { flag: "🇸🇻", code: "SV" },
    jamaica: { flag: "🇯🇲", code: "JM" },
    jamaique: { flag: "🇯🇲", code: "JM" },
    haiti: { flag: "🇭🇹", code: "HT" },
    "trinidad and tobago": { flag: "🇹🇹", code: "TT" },
    "trinite-et-tobago": { flag: "🇹🇹", code: "TT" },
    cuba: { flag: "🇨🇺", code: "CU" },
    guatemala: { flag: "🇬🇹", code: "GT" },
    nicaragua: { flag: "🇳🇮", code: "NI" },

    // Amérique du Sud
    brazil: { flag: "🇧🇷", code: "BR" },
    bresil: { flag: "🇧🇷", code: "BR" },
    argentina: { flag: "🇦🇷", code: "AR" },
    argentine: { flag: "🇦🇷", code: "AR" },
    uruguay: { flag: "🇺🇾", code: "UY" },
    colombia: { flag: "🇨🇴", code: "CO" },
    colombie: { flag: "🇨🇴", code: "CO" },
    ecuador: { flag: "🇪🇨", code: "EC" },
    equateur: { flag: "🇪🇨", code: "EC" },
    paraguay: { flag: "🇵🇾", code: "PY" },
    chile: { flag: "🇨🇱", code: "CL" },
    chili: { flag: "🇨🇱", code: "CL" },
    peru: { flag: "🇵🇪", code: "PE" },
    perou: { flag: "🇵🇪", code: "PE" },
    venezuela: { flag: "🇻🇪", code: "VE" },
    bolivia: { flag: "🇧🇴", code: "BO" },
  };

  if (map[normalized]) {
    return map[normalized];
  }

  // Fallback : produit au moins 2 caractères pour que getFlagUrl puisse fonctionner
  const parts = teamName.trim().split(/\s+/);
  const fallbackCode =
    parts.length === 1
      ? parts[0].slice(0, 2).toUpperCase()
      : parts.map((p) => p[0]).join("").slice(0, 3).toUpperCase();

  return {
    flag: "🏳️",
    code: fallbackCode || "TBD",
  };
}

function splitUtcDate(utcDate: string): { date: string; heure: string } {
  const d = new Date(utcDate);

  if (Number.isNaN(d.getTime())) {
    return { date: "", heure: "" };
  }

  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  const hours = `${d.getHours()}`.padStart(2, "0");
  const minutes = `${d.getMinutes()}`.padStart(2, "0");

  return {
    date: `${year}-${month}-${day}`,
    heure: `${hours}:${minutes}`,
  };
}

function mapVenueToVille(venue: string): string {
  const normalized = venue.trim().toLowerCase();

  if (!normalized) return "Ville non renseignée";

  if (normalized.includes("casablanca")) return "Casablanca";
  if (normalized.includes("rabat")) return "Rabat";
  if (normalized.includes("fès") || normalized.includes("fes")) return "Fès";
  if (normalized.includes("marrakech")) return "Marrakech";
  if (normalized.includes("tanger")) return "Tanger";
  if (normalized.includes("agadir")) return "Agadir";
  if (normalized === "world") return "Non renseignée";

  return venue;
}

function mapVenueToStade(venue: string): string {
  const normalized = venue.trim().toLowerCase();

  if (!normalized) return "Stade non renseigné";
  if (normalized === "world") return "Stade non renseigné";

  return venue;
}

function mapApiMatchToFront(match: EventMatchApiResponse): Match {
  const { date, heure } = splitUtcDate(match.utcDate);

  const team1 = getTeamVisual(match.homeTeam);
  const team2 = getTeamVisual(match.awayTeam);

  return {
    id: String(match.id),
    equipe1: match.homeTeam,
    equipe2: match.awayTeam,
    drapeau1: team1.flag,
    drapeau2: team2.flag,
    crestEquipe1: match.homeCrest ?? "",
    crestEquipe2: match.awayCrest ?? "",
    codeEquipe1: team1.code,
    codeEquipe2: team2.code,
    date,
    heure,
    stade: mapVenueToStade(match.venue || ""),
    ville: mapVenueToVille(match.venue || ""),
    phase: mapStageToPhase(match.stage),
    groupe: extractGroup(match.stage),
    status: match.status,
    competitionCode: match.competitionCode,
    competitionName: match.competitionName,
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Erreur API ${response.status}: ${body}`);
  }

  return response.json() as Promise<T>;
}

export async function getAllMatches(): Promise<Match[]> {
  const data = await fetchJson<EventMatchApiResponse[]>(
    `${API_BASE_URL}/event-matches/matches/world-cup`
  );

  return data.map(mapApiMatchToFront);
}

export async function getMatchesByStatus(status: string): Promise<Match[]> {
  const data = await fetchJson<EventMatchApiResponse[]>(
    `${API_BASE_URL}/event-matches/matches/world-cup/status/${encodeURIComponent(
      status
    )}`
  );

  return data.map(mapApiMatchToFront);
}

export async function getUpcomingMatches(): Promise<Match[]> {
  const data = await fetchJson<EventMatchApiResponse[]>(
    `${API_BASE_URL}/event-matches/matches/world-cup/upcoming`
  );

  return data.map(mapApiMatchToFront);
}

export async function getTodayMatches(): Promise<Match[]> {
  const data = await fetchJson<EventMatchApiResponse[]>(
    `${API_BASE_URL}/event-matches/matches/world-cup/today`
  );

  return data.map(mapApiMatchToFront);
}

export async function getMatchesByVille(ville: string): Promise<Match[]> {
  const matches = await getAllMatches();

  return matches.filter(
    (m) => m.ville.toLowerCase() === ville.toLowerCase()
  );
}

export async function getPastMatches(): Promise<Match[]> {
  const allMatches = await getAllMatches();
  const today = new Date().toISOString().slice(0, 10);

  return allMatches.filter((m) => m.date < today);
}

export async function getNextMatch(): Promise<Match | null> {
  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const matches = await getUpcomingMatches();

  const upcoming = matches.filter((m) => {
    if (!m.date || !m.heure) return false;

    const d = new Date(`${m.date}T${m.heure}:00`);
    return d >= now && d <= in48h;
  });

  return upcoming.length > 0 ? upcoming[0] : null;
}

export async function getLastFinishedMatch(): Promise<Match | null> {
  const now = new Date();
  const ago6h = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  const matches = await getMatchesByStatus("FINISHED");

  const recent = matches.filter((m) => {
    if (!m.date || !m.heure) return false;

    const d = new Date(`${m.date}T${m.heure}:00`);
    return d < now && d >= ago6h;
  });

  return recent.length > 0 ? recent[recent.length - 1] : null;
}

export function formatMatchDate(dateStr: string): string {
  const d = new Date(dateStr);

  if (Number.isNaN(d.getTime())) return dateStr;

  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);

  if (Number.isNaN(d.getTime())) return dateStr;

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}