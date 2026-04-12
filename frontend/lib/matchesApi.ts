export type MatchPhase =
  | "Groupes"
  | "Huitièmes"
  | "Quarts"
  | "Demi-finales"
  | "Finale"
  | "Autre";

export type FanZone = {
  name: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

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

  // Nouveautés backend
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  fanZones?: FanZone[];
  isOfficialLocation?: boolean;
  locationSource?: "api" | "gomatch_override";
  isExperienceMatch?: boolean;
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

  // Nouveautés backend
  city?: string | null;
  stadiumName?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  fanZones?: FanZone[];
  isOfficialLocation?: boolean;
  locationSource?: "api" | "gomatch_override";
  isExperienceMatch?: boolean;
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
    .replace(/['’.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getFlagEmojiFromCode(code: string): string {
  const normalized = code.trim().toUpperCase();

  if (!/^[A-Z]{2}$/.test(normalized)) return "🏳️";

  const codePoints = [...normalized].map(
    (char) => 127397 + char.charCodeAt(0)
  );

  return String.fromCodePoint(...codePoints);
}

function getTeamVisual(teamName: string): { flag: string; code: string } {
  const normalized = normalizeTeamName(teamName);

  const TEAM_ALIASES: Record<string, string> = {
    // UEFA
    france: "FR",
    spain: "ES",
    espagne: "ES",
    germany: "DE",
    allemagne: "DE",
    portugal: "PT",
    italy: "IT",
    italie: "IT",
    netherlands: "NL",
    holland: "NL",
    "pays bas": "NL",
    "pays-bas": "NL",
    belgium: "BE",
    belgique: "BE",
    croatia: "HR",
    croatie: "HR",
    switzerland: "CH",
    suisse: "CH",
    poland: "PL",
    pologne: "PL",
    serbia: "RS",
    serbie: "RS",
    denmark: "DK",
    danemark: "DK",
    sweden: "SE",
    suede: "SE",
    norway: "NO",
    norvege: "NO",
    austria: "AT",
    autriche: "AT",
    ukraine: "UA",
    czechia: "CZ",
    "czech republic": "CZ",
    "republique tcheque": "CZ",
    "république tchèque": "CZ",
    slovakia: "SK",
    slovaquie: "SK",
    slovenia: "SI",
    slovenie: "SI",
    romania: "RO",
    roumanie: "RO",
    hungary: "HU",
    hongrie: "HU",
    turkey: "TR",
    turkiye: "TR",
    turquie: "TR",
    greece: "GR",
    grece: "GR",
    "grèce": "GR",
    finland: "FI",
    finlande: "FI",
    ireland: "IE",
    irlande: "IE",
    iceland: "IS",
    islande: "IS",
    bosnia: "BA",
    "bosnia herzegovina": "BA",
    "bosnie herzegovine": "BA",
    "bosnie herzégovine": "BA",
    montenegro: "ME",
    montenegrofr: "ME",
    albania: "AL",
    albanie: "AL",
    georgia: "GE",
    georgie: "GE",

    // UK variants
    england: "GB",
    angleterre: "GB",
    scotland: "GB",
    ecosse: "GB",
    "écosse": "GB",
    wales: "GB",
    "pays de galles": "GB",
    "paysdegalles": "GB",
    "northern ireland": "GB",
    "irlande du nord": "GB",

    // CONMEBOL
    argentina: "AR",
    argentine: "AR",
    brazil: "BR",
    brasil: "BR",
    bresil: "BR",
    "brésil": "BR",
    uruguay: "UY",
    paraguay: "PY",
    chile: "CL",
    bolivia: "BO",
    peru: "PE",
    perou: "PE",
    pérou: "PE",
    colombia: "CO",
    colombie: "CO",
    ecuador: "EC",
    equateur: "EC",
    équateur: "EC",
    venezuela: "VE",

    // CONCACAF
    usa: "US",
    us: "US",
    "united states": "US",
    "etats unis": "US",
    "états unis": "US",
    mexico: "MX",
    mexique: "MX",
    canada: "CA",
    "costa rica": "CR",
    "costa-rica": "CR",
    panama: "PA",
    jamaica: "JM",
    haiti: "HT",
    haïti: "HT",
    honduras: "HN",
    guatemala: "GT",
    "trinidad and tobago": "TT",
    "trinidad tobago": "TT",
    "trinite et tobago": "TT",
    "trinité et tobago": "TT",
    curacao: "CW",
    curaçao: "CW",
    "el salvador": "SV",
    nicaragua: "NI",
    cuba: "CU",

    // CAF
    morocco: "MA",
    maroc: "MA",
    algeria: "DZ",
    algerie: "DZ",
    algérie: "DZ",
    tunisia: "TN",
    tunisie: "TN",
    egypt: "EG",
    egypte: "EG",
    égypte: "EG",
    senegal: "SN",
    sénégal: "SN",
    nigeria: "NG",
    cameroon: "CM",
    cameroun: "CM",
    ghana: "GH",
    "south africa": "ZA",
    "afrique du sud": "ZA",
    "ivory coast": "CI",
    "cote d ivoire": "CI",
    "côte d ivoire": "CI",
    "cote divoire": "CI",
    "côte divoire": "CI",
    mali: "ML",
    "burkina faso": "BF",
    "dr congo": "CD",
    "rd congo": "CD",
    "democratic republic of the congo": "CD",
    "republique democratique du congo": "CD",
    "république démocratique du congo": "CD",
    congo: "CG",
    guinea: "GN",
    guinee: "GN",
    guinée: "GN",
    angola: "AO",
    zambia: "ZM",
    uganda: "UG",
    benin: "BJ",
    bénin: "BJ",
    gabon: "GA",
    mauritania: "MR",
    mauritanie: "MR",
    "cape verde": "CV",
    "cap vert": "CV",
    libya: "LY",
    libye: "LY",
    kenya: "KE",
    tanzania: "TZ",
    tanzanie: "TZ",
    mozambique: "MZ",
    namibia: "NA",
    zimbabwe: "ZW",
    botswana: "BW",
    rwanda: "RW",
    burundi: "BI",
    togo: "TG",
    sudan: "SD",
    soudan: "SD",

    // AFC
    japan: "JP",
    japon: "JP",
    "south korea": "KR",
    korea: "KR",
    "coree du sud": "KR",
    "corée du sud": "KR",
    "north korea": "KP",
    "coree du nord": "KP",
    "corée du nord": "KP",
    australia: "AU",
    australie: "AU",
    iran: "IR",
    iraq: "IQ",
    irak: "IQ",
    "saudi arabia": "SA",
    "arabie saoudite": "SA",
    qatar: "QA",
    "united arab emirates": "AE",
    "emirats arabes unis": "AE",
    "émirats arabes unis": "AE",
    jordan: "JO",
    jordanie: "JO",
    oman: "OM",
    bahrain: "BH",
    bahrein: "BH",
    bahreïn: "BH",
    uzbekistan: "UZ",
    tajikistan: "TJ",
    kyrgyzstan: "KG",
    kirghizistan: "KG",
    china: "CN",
    chine: "CN",
    india: "IN",
    inde: "IN",
    thailand: "TH",
    thailande: "TH",
    thaïlande: "TH",
    vietnam: "VN",
    indonesia: "ID",
    malaysia: "MY",
    palestine: "PS",
    lebanon: "LB",
    liban: "LB",
    syria: "SY",
    syrie: "SY",
    yemen: "YE",
    yemenfr: "YE",
    kuwait: "KW",
    "hong kong": "HK",

    // OFC
    "new zealand": "NZ",
    "nouvelle zelande": "NZ",
    "nouvelle zélande": "NZ",
    fiji: "FJ",
    tahiti: "PF",
    "solomon islands": "SB",
    "iles salomon": "SB",
    "îles salomon": "SB",
    vanuatu: "VU",
    samoa: "WS",

    // Alias fréquents
    "united states of america": "US",
    "republic of korea": "KR",
    "korea republic": "KR",
  };

  const isoCode = TEAM_ALIASES[normalized];

  if (isoCode) {
    return {
      flag: getFlagEmojiFromCode(isoCode),
      code: isoCode,
    };
  }

  const fallbackCode = teamName
    .trim()
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .replace(/[^A-Za-z]/g, "")
    .slice(0, 3)
    .toUpperCase();

  if (fallbackCode.length >= 2) {
    return { flag: "🏳️", code: fallbackCode };
  }

  return { flag: "🏳️", code: "TBD" };
}

function splitUtcDate(utcDate: string): { date: string; heure: string } {
  const d = new Date(utcDate);
  if (Number.isNaN(d.getTime())) return { date: "", heure: "" };

  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  const hours = `${d.getHours()}`.padStart(2, "0");
  const minutes = `${d.getMinutes()}`.padStart(2, "0");

  return { date: `${year}-${month}-${day}`, heure: `${hours}:${minutes}` };
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

    // priorité aux nouveaux champs backend
    stade: match.stadiumName?.trim() || mapVenueToStade(match.venue || ""),
    ville: match.city?.trim() || mapVenueToVille(match.venue || ""),

    phase: mapStageToPhase(match.stage),
    groupe: extractGroup(match.stage),
    status: match.status,
    competitionCode: match.competitionCode,
    competitionName: match.competitionName,

    address: match.address ?? "",
    latitude: match.latitude ?? null,
    longitude: match.longitude ?? null,
    fanZones: match.fanZones ?? [],
    isOfficialLocation: match.isOfficialLocation ?? false,
    locationSource: match.locationSource ?? "api",
    isExperienceMatch: match.isExperienceMatch ?? false,
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
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
    `${API_BASE_URL}/event-matches/matches/world-cup/status/${encodeURIComponent(status)}`
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
  return matches.filter((m) => m.ville.toLowerCase() === ville.toLowerCase());
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

export function getFlagUrl(countryCode?: string): string {
  const code = (countryCode ?? "").trim().toUpperCase();

  if (!/^[A-Z]{2}$/.test(code)) return "";

  return `https://flagcdn.com/w80/${code.toLowerCase()}.png`;
}