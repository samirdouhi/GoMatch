export type CountryCode =
  | "US" | "MX" | "CA"
  | "AR" | "BR" | "UY" | "CO" | "EC" | "PY"
  | "GB" | "FR" | "HR" | "PT" | "NO" | "DE" | "NL" | "BE" | "ES" | "AT" | "CH" | "TR" | "SE" | "CZ" | "BA"
  | "MA" | "EG" | "TN" | "DZ" | "GH" | "CV" | "ZA" | "SN" | "CI" | "CD"
  | "JP" | "KR" | "IR" | "SA" | "AU" | "QA" | "IQ" | "JO" | "UZ"
  | "PA" | "HT" | "CW"
  | "NZ";

export type WorldCupTeam = {
  id: string;
  label: string;
  code: CountryCode;
  aliases?: string[];
};

export const WORLD_CUP_2026_TEAMS: WorldCupTeam[] = [
  { id: "united-states", label: "États-Unis", code: "US", aliases: ["United States", "USA", "Etats-Unis"] },
  { id: "mexico", label: "Mexique", code: "MX", aliases: ["Mexico"] },
  { id: "canada", label: "Canada", code: "CA" },

  { id: "argentina", label: "Argentine", code: "AR", aliases: ["Argentina"] },
  { id: "brazil", label: "Brésil", code: "BR", aliases: ["Brazil", "Bresil"] },
  { id: "uruguay", label: "Uruguay", code: "UY" },
  { id: "colombia", label: "Colombie", code: "CO", aliases: ["Colombia"] },
  { id: "ecuador", label: "Équateur", code: "EC", aliases: ["Ecuador", "Equateur"] },
  { id: "paraguay", label: "Paraguay", code: "PY" },

  { id: "england", label: "Angleterre", code: "GB", aliases: ["England"] },
  { id: "france", label: "France", code: "FR" },
  { id: "croatia", label: "Croatie", code: "HR", aliases: ["Croatia"] },
  { id: "portugal", label: "Portugal", code: "PT" },
  { id: "norway", label: "Norvège", code: "NO", aliases: ["Norway", "Norvege"] },
  { id: "germany", label: "Allemagne", code: "DE", aliases: ["Germany"] },
  { id: "netherlands", label: "Pays-Bas", code: "NL", aliases: ["Netherlands", "Pays Bas"] },
  { id: "belgium", label: "Belgique", code: "BE", aliases: ["Belgium"] },
  { id: "spain", label: "Espagne", code: "ES", aliases: ["Spain"] },
  { id: "scotland", label: "Écosse", code: "GB", aliases: ["Scotland", "Ecosse"] },
  { id: "austria", label: "Autriche", code: "AT", aliases: ["Austria"] },
  { id: "switzerland", label: "Suisse", code: "CH", aliases: ["Switzerland"] },
  { id: "turkey", label: "Turquie", code: "TR", aliases: ["Turkey"] },
  { id: "sweden", label: "Suède", code: "SE", aliases: ["Sweden", "Suede"] },
  { id: "czech-republic", label: "République tchèque", code: "CZ", aliases: ["Czech Republic", "Republique tcheque"] },
  { id: "bosnia", label: "Bosnie-Herzégovine", code: "BA", aliases: ["Bosnia and Herzegovina", "Bosnie Herzegovine"] },

  { id: "morocco", label: "Maroc", code: "MA", aliases: ["Morocco"] },
  { id: "egypt", label: "Égypte", code: "EG", aliases: ["Egypt", "Egypte"] },
  { id: "tunisia", label: "Tunisie", code: "TN", aliases: ["Tunisia"] },
  { id: "algeria", label: "Algérie", code: "DZ", aliases: ["Algeria", "Algerie"] },
  { id: "ghana", label: "Ghana", code: "GH" },
  { id: "cape-verde", label: "Cap-Vert", code: "CV", aliases: ["Cape Verde", "Cap Vert"] },
  { id: "south-africa", label: "Afrique du Sud", code: "ZA", aliases: ["South Africa"] },
  { id: "senegal", label: "Sénégal", code: "SN", aliases: ["Senegal"] },
  { id: "ivory-coast", label: "Côte d’Ivoire", code: "CI", aliases: ["Ivory Coast", "Cote d'Ivoire"] },
  { id: "dr-congo", label: "RD Congo", code: "CD", aliases: ["DR Congo"] },

  { id: "japan", label: "Japon", code: "JP", aliases: ["Japan"] },
  { id: "south-korea", label: "Corée du Sud", code: "KR", aliases: ["South Korea", "Coree du Sud"] },
  { id: "iran", label: "Iran", code: "IR" },
  { id: "saudi-arabia", label: "Arabie saoudite", code: "SA", aliases: ["Saudi Arabia"] },
  { id: "australia", label: "Australie", code: "AU", aliases: ["Australia"] },
  { id: "qatar", label: "Qatar", code: "QA" },
  { id: "iraq", label: "Irak", code: "IQ", aliases: ["Iraq"] },
  { id: "jordan", label: "Jordanie", code: "JO", aliases: ["Jordan"] },
  { id: "uzbekistan", label: "Ouzbékistan", code: "UZ", aliases: ["Uzbekistan"] },

  { id: "panama", label: "Panama", code: "PA" },
  { id: "haiti", label: "Haïti", code: "HT", aliases: ["Haiti"] },
  { id: "curacao", label: "Curaçao", code: "CW", aliases: ["Curacao"] },

  { id: "new-zealand", label: "Nouvelle-Zélande", code: "NZ", aliases: ["New Zealand", "Nouvelle Zelande"] },
];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "'")
    .replace(/-/g, " ")
    .trim()
    .toLowerCase();
}

export function findWorldCupTeam(input: string): WorldCupTeam | null {
  const needle = normalize(input);

  for (const team of WORLD_CUP_2026_TEAMS) {
    if (normalize(team.label) === needle) return team;
    if (normalize(team.id) === needle) return team;
    if (team.aliases?.some((a) => normalize(a) === needle)) return team;
  }

  return null;
}