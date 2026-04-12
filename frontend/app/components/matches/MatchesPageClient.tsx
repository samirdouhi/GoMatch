"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { Match, MatchPhase } from "@/lib/matchesApi";
import { formatMatchDate } from "@/lib/matchesApi";
import {
  CalendarDays,
  ChevronDown,
  Clock3,
  MapPin,
  Search,
  X,
  ArrowRight,
} from "lucide-react";

type Props = {
  initialMatches: Match[];
};

type CustomSelectOption = {
  label: string;
  value: string;
};

type CustomSelectProps = {
  label: string;
  value: string;
  options: CustomSelectOption[];
  onChange: (value: string) => void;
};

const phaseOptions: Array<MatchPhase | "Toutes"> = [
  "Toutes",
  "Groupes",
  "Huitièmes",
  "Quarts",
  "Demi-finales",
  "Finale",
  "Autre",
];

const statusOptions = [
  "Tous",
  "TIMED",
  "SCHEDULED",
  "IN_PLAY",
  "PAUSED",
  "FINISHED",
];

function getUniqueCities(matches: Match[]) {
  return Array.from(new Set(matches.map((m) => m.ville).filter(Boolean))).sort(
    (a, b) => a.localeCompare(b)
  );
}

function getUniqueTeams(matches: Match[]) {
  return Array.from(
    new Set(matches.flatMap((m) => [m.equipe1, m.equipe2]).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
}

function getStatusBadgeClasses(status: string) {
  switch (status.toUpperCase()) {
    case "FINISHED":
      return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20";
    case "IN_PLAY":
    case "PAUSED":
      return "bg-red-500/15 text-red-300 border border-red-500/20";
    case "TIMED":
    case "SCHEDULED":
      return "bg-blue-500/15 text-blue-300 border border-blue-500/20";
    default:
      return "bg-zinc-700/50 text-zinc-200 border border-zinc-600";
  }
}

const FLAG_CODE_MAP: Record<string, string> = {
  ENG: "gb-eng",
  SCO: "gb-sct",
  WAL: "gb-wls",
  NIR: "gb-nir",
};

function getFlagUrl(code: string): string {
  if (!code || code === "TBD" || code.length < 2) return "";
  const mapped = FLAG_CODE_MAP[code.toUpperCase()] ?? code.toLowerCase().slice(0, 2);
  return `https://flagcdn.com/w80/${mapped}.png`;
}

function TeamBadge({
  crest,
  flag,
  code,
  team,
}: {
  crest: string;
  flag: string;
  code: string;
  team: string;
}) {
  const imgSrc = crest || getFlagUrl(code);

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 shadow-inner ring-1 ring-zinc-800 overflow-hidden">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={team}
            width={72}
            height={54}
            className="object-contain"
            unoptimized
          />
        ) : (
          <span className="text-lg font-black text-zinc-200">{code}</span>
        )}
      </div>

      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
          Équipe
        </p>
        <p className="truncate text-xl font-black text-white">{team}</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[28px] border border-zinc-800 bg-zinc-950/70 p-10 text-center shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur">
      <h3 className="text-lg font-semibold text-white">Aucun match trouvé</h3>
      <p className="mt-2 text-sm text-zinc-400">
        Essaie de modifier les filtres pour afficher plus de résultats.
      </p>
    </div>
  );
}

function CustomSelect({ label, value, options, onChange }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find((option) => option.value === value) ?? options[0];

  return (
    <div ref={wrapperRef} className="relative">
      <label className="mb-2 block text-sm font-medium text-zinc-300">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-2xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-left text-sm text-white transition hover:border-amber-400"
      >
        <span>{selected?.label}</span>
        <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-zinc-700 bg-zinc-950 p-2 shadow-2xl">
          {options.map((option) => {
            const isActive = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`mb-1 flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition last:mb-0 ${
                  isActive
                    ? "bg-amber-500/15 text-amber-300"
                    : "text-zinc-200 hover:bg-zinc-800"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MatchCalendarCard({ match }: { match: Match }) {
  return (
    <article className="overflow-hidden rounded-[30px] border border-zinc-800 bg-[linear-gradient(180deg,#09090b_0%,#070709_100%)] shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
      <div className="border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
              Calendrier {match.ville}
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${getStatusBadgeClasses(
              match.status
            )}`}
          >
            {match.status}
          </span>
        </div>
      </div>

      <div className="p-6 md:p-7">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <TeamBadge
            crest={match.crestEquipe1}
            flag={match.drapeau1}
            code={match.codeEquipe1}
            team={match.equipe1}
          />

          <div className="flex justify-center">
            <div className="rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-bold text-zinc-300">
              VS
            </div>
          </div>

          <div className="flex justify-start lg:justify-end">
            <TeamBadge
              crest={match.crestEquipe2}
              flag={match.drapeau2}
              code={match.codeEquipe2}
              team={match.equipe2}
            />
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-4 rounded-2xl bg-zinc-900/90 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-950">
              <CalendarDays className="h-5 w-5 text-amber-400" />
            </div>
            <span className="font-medium text-zinc-100">
              {formatMatchDate(match.date)}
            </span>
          </div>

          <div className="flex items-center gap-4 rounded-2xl bg-zinc-900/90 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-950">
              <Clock3 className="h-5 w-5 text-amber-400" />
            </div>
            <span className="font-medium text-zinc-100">{match.heure}</span>
          </div>

          <div className="flex items-center gap-4 rounded-2xl bg-zinc-900/90 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-950">
              <MapPin className="h-5 w-5 text-amber-400" />
            </div>
            <span className="font-medium text-zinc-100">
              {match.stade} · {match.ville}
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-4 text-sm font-black text-black transition hover:bg-amber-300">
            Planifier ma journée
            <ArrowRight className="h-4 w-4" />
          </button>

          <button className="rounded-2xl bg-red-500 px-5 py-4 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-red-400">
            Avant / Après match
          </button>
        </div>
      </div>
    </article>
  );
}

export default function MatchesPageClient({ initialMatches }: Props) {
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("Toutes");
  const [selectedPhase, setSelectedPhase] = useState<MatchPhase | "Toutes">("Toutes");
  const [selectedStatus, setSelectedStatus] = useState("Tous");
  const [selectedTeam, setSelectedTeam] = useState("Toutes");

  const cities = useMemo(() => getUniqueCities(initialMatches), [initialMatches]);
  const teams = useMemo(() => getUniqueTeams(initialMatches), [initialMatches]);

  const citySelectOptions = useMemo<CustomSelectOption[]>(
    () => [
      { label: "Toutes", value: "Toutes" },
      ...cities.map((city) => ({ label: city, value: city })),
    ],
    [cities]
  );

  const phaseSelectOptions = useMemo<CustomSelectOption[]>(
    () => phaseOptions.map((phase) => ({ label: phase, value: phase })),
    []
  );

  const statusSelectOptions = useMemo<CustomSelectOption[]>(
    () => statusOptions.map((status) => ({ label: status, value: status })),
    []
  );

  const teamSelectOptions = useMemo<CustomSelectOption[]>(
    () => [
      { label: "Toutes", value: "Toutes" },
      ...teams.map((team) => ({ label: team, value: team })),
    ],
    [teams]
  );

  const filteredMatches = useMemo(() => {
    const q = search.trim().toLowerCase();

    return initialMatches.filter((match) => {
      const matchesSearch =
        !q ||
        match.equipe1.toLowerCase().includes(q) ||
        match.equipe2.toLowerCase().includes(q) ||
        match.ville.toLowerCase().includes(q) ||
        match.stade.toLowerCase().includes(q) ||
        match.phase.toLowerCase().includes(q);

      const matchesCity =
        selectedCity === "Toutes" || match.ville === selectedCity;

      const matchesPhase =
        selectedPhase === "Toutes" || match.phase === selectedPhase;

      const matchesStatus =
        selectedStatus === "Tous" ||
        match.status.toUpperCase() === selectedStatus.toUpperCase();

      const matchesTeam =
        selectedTeam === "Toutes" ||
        match.equipe1 === selectedTeam ||
        match.equipe2 === selectedTeam;

      return matchesSearch && matchesCity && matchesPhase && matchesStatus && matchesTeam;
    });
  }, [initialMatches, search, selectedCity, selectedPhase, selectedStatus, selectedTeam]);

  return (
    <main className="min-h-screen bg-[#050608] px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="mb-8">
          <div className="mb-3 inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
            Coupe du Monde 2026
          </div>

          <h1 className="max-w-4xl text-4xl font-black uppercase tracking-tight text-white md:text-6xl">
            Matchs et <span className="text-amber-400">calendrier</span>
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-8 text-zinc-400">
            Consulte les rencontres, filtre par ville, phase, statut ou équipe,
            puis prépare ton expérience autour du match.
          </p>
        </section>

        <section className="mb-8 rounded-[28px] border border-zinc-800 bg-zinc-950/70 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur md:p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="xl:col-span-2">
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Rechercher
              </label>

              <div className="flex items-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-900/80 px-4 py-3">
                <Search className="h-4 w-4 text-zinc-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Équipe, ville, stade, phase..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="rounded-full p-1 hover:bg-zinc-800"
                  >
                    <X className="h-4 w-4 text-zinc-500" />
                  </button>
                )}
              </div>
            </div>

            <CustomSelect
              label="Ville"
              value={selectedCity}
              options={citySelectOptions}
              onChange={setSelectedCity}
            />

            <CustomSelect
              label="Phase"
              value={selectedPhase}
              options={phaseSelectOptions}
              onChange={(value) => setSelectedPhase(value as MatchPhase | "Toutes")}
            />

            <CustomSelect
              label="Statut"
              value={selectedStatus}
              options={statusSelectOptions}
              onChange={setSelectedStatus}
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="xl:col-span-2">
              <CustomSelect
                label="Équipe"
                value={selectedTeam}
                options={teamSelectOptions}
                onChange={setSelectedTeam}
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedCity("Toutes");
                  setSelectedPhase("Toutes");
                  setSelectedStatus("Tous");
                  setSelectedTeam("Toutes");
                }}
                className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-bold text-black transition hover:bg-zinc-200"
              >
                Réinitialiser les filtres
              </button>
            </div>

            <div className="md:col-span-2 xl:col-span-2">
              <div className="flex h-full items-end">
                <div className="w-full rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                  <span className="font-semibold">{filteredMatches.length}</span>{" "}
                  match(s) affiché(s)
                </div>
              </div>
            </div>
          </div>
        </section>

        {filteredMatches.length === 0 ? (
          <EmptyState />
        ) : (
          <section className="grid gap-6">
            {filteredMatches.map((match) => (
              <MatchCalendarCard key={match.id} match={match} />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
