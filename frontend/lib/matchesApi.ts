/** Données statiques des matchs CM 2026 au Maroc */

export type Match = {
  id: string;
  equipe1: string;
  equipe2: string;
  drapeau1: string;
  drapeau2: string;
  date: string;       // ISO
  heure: string;      // "18:00"
  stade: string;
  ville: string;
  phase: "Groupes" | "Huitièmes" | "Quarts" | "Demi-finales" | "Finale";
  groupe?: string;
};

export type MatchPhase = Match["phase"];

// Matchs de la Coupe du Monde 2026 — stades au Maroc
export const MATCHES_MAROC: Match[] = [
  {
    id: "m1",
    equipe1: "Maroc",
    equipe2: "Argentine",
    drapeau1: "🇲🇦",
    drapeau2: "🇦🇷",
    date: "2026-06-11",
    heure: "21:00",
    stade: "Grand Stade de Casablanca",
    ville: "Casablanca",
    phase: "Groupes",
    groupe: "A",
  },
  {
    id: "m2",
    equipe1: "France",
    equipe2: "Espagne",
    drapeau1: "🇫🇷",
    drapeau2: "🇪🇸",
    date: "2026-06-13",
    heure: "18:00",
    stade: "Stade de Rabat",
    ville: "Rabat",
    phase: "Groupes",
    groupe: "B",
  },
  {
    id: "m3",
    equipe1: "Brésil",
    equipe2: "Portugal",
    drapeau1: "🇧🇷",
    drapeau2: "🇵🇹",
    date: "2026-06-15",
    heure: "21:00",
    stade: "Stade de Fès",
    ville: "Fès",
    phase: "Groupes",
    groupe: "C",
  },
  {
    id: "m4",
    equipe1: "Allemagne",
    equipe2: "Angleterre",
    drapeau1: "🇩🇪",
    drapeau2: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    date: "2026-06-17",
    heure: "18:00",
    stade: "Stade de Marrakech",
    ville: "Marrakech",
    phase: "Groupes",
    groupe: "D",
  },
  {
    id: "m5",
    equipe1: "Maroc",
    equipe2: "Brésil",
    drapeau1: "🇲🇦",
    drapeau2: "🇧🇷",
    date: "2026-06-19",
    heure: "21:00",
    stade: "Grand Stade de Casablanca",
    ville: "Casablanca",
    phase: "Groupes",
    groupe: "A",
  },
  {
    id: "m6",
    equipe1: "France",
    equipe2: "Allemagne",
    drapeau1: "🇫🇷",
    drapeau2: "🇩🇪",
    date: "2026-06-21",
    heure: "21:00",
    stade: "Stade de Tanger",
    ville: "Tanger",
    phase: "Groupes",
    groupe: "B",
  },
  {
    id: "m7",
    equipe1: "TBD",
    equipe2: "TBD",
    drapeau1: "🏳",
    drapeau2: "🏳",
    date: "2026-07-04",
    heure: "21:00",
    stade: "Grand Stade de Casablanca",
    ville: "Casablanca",
    phase: "Huitièmes",
  },
  {
    id: "m8",
    equipe1: "TBD",
    equipe2: "TBD",
    drapeau1: "🏳",
    drapeau2: "🏳",
    date: "2026-07-08",
    heure: "18:00",
    stade: "Stade de Rabat",
    ville: "Rabat",
    phase: "Quarts",
  },
  {
    id: "m9",
    equipe1: "TBD",
    equipe2: "TBD",
    drapeau1: "🏳",
    drapeau2: "🏳",
    date: "2026-07-14",
    heure: "21:00",
    stade: "Grand Stade de Casablanca",
    ville: "Casablanca",
    phase: "Demi-finales",
  },
  {
    id: "m10",
    equipe1: "TBD",
    equipe2: "TBD",
    drapeau1: "🏳",
    drapeau2: "🏳",
    date: "2026-07-19",
    heure: "21:00",
    stade: "Grand Stade de Casablanca",
    ville: "Casablanca",
    phase: "Finale",
  },
];

/** Retourne les matchs par ville */
export function getMatchesByVille(ville: string): Match[] {
  return MATCHES_MAROC.filter(
    (m) => m.ville.toLowerCase() === ville.toLowerCase()
  );
}

/** Retourne les matchs à venir (date >= aujourd'hui) */
export function getUpcomingMatches(): Match[] {
  const today = new Date().toISOString().slice(0, 10);
  return MATCHES_MAROC.filter((m) => m.date >= today);
}

/** Retourne les matchs passés */
export function getPastMatches(): Match[] {
  const today = new Date().toISOString().slice(0, 10);
  return MATCHES_MAROC.filter((m) => m.date < today);
}

/** Contexte avant-match : retourne le prochain match dans les 48h */
export function getNextMatch(): Match | null {
  const now      = new Date();
  const in48h    = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const upcoming = MATCHES_MAROC.filter((m) => {
    const d = new Date(`${m.date}T${m.heure}:00`);
    return d >= now && d <= in48h;
  });
  return upcoming.length > 0 ? upcoming[0] : null;
}

/** Contexte après-match : retourne le dernier match terminé il y a < 6h */
export function getLastFinishedMatch(): Match | null {
  const now   = new Date();
  const ago6h = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  const past  = MATCHES_MAROC.filter((m) => {
    const d = new Date(`${m.date}T${m.heure}:00`);
    return d < now && d >= ago6h;
  });
  return past.length > 0 ? past[past.length - 1] : null;
}

export function formatMatchDate(dateStr: string): string {
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}
