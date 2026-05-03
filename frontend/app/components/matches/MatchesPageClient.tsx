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
  SlidersHorizontal,
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

function getStatusConfig(status: string) {
  switch (status.toUpperCase()) {
    case "FINISHED":
      return { label: "Terminé", classes: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20" };
    case "IN_PLAY":
      return { label: "En cours", classes: "bg-red-500/10 text-red-400 ring-1 ring-red-500/20 animate-pulse" };
    case "PAUSED":
      return { label: "Pause", classes: "bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20" };
    case "TIMED":
    case "SCHEDULED":
      return { label: "Programmé", classes: "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20" };
    default:
      return { label: status, classes: "bg-zinc-800 text-zinc-400 ring-1 ring-zinc-700" };
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
  code,
  team,
}: {
  crest: string;
  code: string;
  team: string;
}) {
  const imgSrc = crest || getFlagUrl(code);

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3">
      <div className="flex h-14 w-14 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-zinc-800/80 ring-1 ring-white/5 overflow-hidden shadow-lg">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={team}
            width={64}
            height={48}
            className="object-contain p-1"
            unoptimized
          />
        ) : (
          <span className="text-lg font-black text-zinc-300">{code}</span>
        )}
      </div>
      <p className="max-w-[88px] truncate text-center text-xs font-bold text-white sm:max-w-[140px] sm:text-sm">
        {team}
      </p>
    </div>
  );
}

function MetaPill({
  icon: Icon,
  text,
}: {
  icon: React.ElementType;
  text: string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-zinc-800/60 px-3 py-1.5 ring-1 ring-white/5">
      <Icon className="h-3.5 w-3.5 shrink-0 text-amber-400" />
      <span className="text-xs font-medium text-zinc-300">{text}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-white/5 bg-zinc-900/50 p-10 text-center backdrop-blur-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800">
        <Search className="h-6 w-6 text-zinc-500" />
      </div>
      <h3 className="text-base font-semibold text-white">Aucun match trouvé</h3>
      <p className="mt-1 text-sm text-zinc-500">
        Modifie les filtres pour afficher plus de résultats.
      </p>
    </div>
  );
}

function CustomSelect({ label, value, options, onChange }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find((o) => o.value === value) ?? options[0];

  return (
    <div ref={wrapperRef} className="relative">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl border border-white/8 bg-zinc-800/60 px-3.5 py-2.5 text-left text-sm text-white transition-colors hover:border-amber-500/40 hover:bg-zinc-800"
      >
        <span className="font-medium">{selected?.label}</span>
        <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1.5 max-h-60 w-full overflow-auto rounded-xl border border-white/8 bg-zinc-900 p-1.5 shadow-2xl shadow-black/50">
          {options.map((option) => {
            const isActive = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => { onChange(option.value); setOpen(false); }}
                className={`mb-0.5 flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors last:mb-0 ${
                  isActive
                    ? "bg-amber-500/15 font-semibold text-amber-400"
                    : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
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
  const status = getStatusConfig(match.status);

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/50 backdrop-blur-sm transition-all duration-300 hover:border-amber-500/15 hover:bg-zinc-900/80 hover:shadow-xl hover:shadow-black/30">
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="font-semibold uppercase tracking-wider text-zinc-400">{match.phase}</span>
          <span>·</span>
          <span>{match.ville}</span>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.classes}`}>
          {status.label}
        </span>
      </div>

      <div className="h-px bg-white/4" />

      {/* Teams */}
      <div className="px-4 py-6 sm:px-8 sm:py-8">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-8">
          <div className="flex justify-center">
            <TeamBadge
              crest={match.crestEquipe1}
              code={match.codeEquipe1}
              team={match.equipe1}
            />
          </div>

          {/* VS */}
          <div className="flex flex-col items-center gap-1">
            <div className="relative flex h-10 w-10 items-center justify-center sm:h-12 sm:w-12">
              <div className="absolute inset-0 rounded-full bg-amber-500/5 ring-1 ring-amber-500/15" />
              <span className="relative text-xs font-black tracking-widest text-zinc-400 sm:text-sm">VS</span>
            </div>
          </div>

          <div className="flex justify-center">
            <TeamBadge
              crest={match.crestEquipe2}
              code={match.codeEquipe2}
              team={match.equipe2}
            />
          </div>
        </div>

        {/* Meta pills */}
        <div className="mt-5 flex flex-wrap gap-2">
          <MetaPill icon={CalendarDays} text={formatMatchDate(match.date)} />
          <MetaPill icon={Clock3} text={match.heure} />
          <MetaPill icon={MapPin} text={match.stade} />
        </div>

        {/* CTA */}
        <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 text-sm font-bold text-black transition-all duration-200 hover:bg-amber-300 active:scale-[0.98]">
          Planifier ma journée
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

export default function MatchesPageClient({ initialMatches }: Props) {
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState("Toutes");
  const [selectedPhase, setSelectedPhase] = useState<MatchPhase | "Toutes">("Toutes");
  const [selectedStatus, setSelectedStatus] = useState("Tous");
  const [selectedTeam, setSelectedTeam] = useState("Toutes");

  const cities = useMemo(() => getUniqueCities(initialMatches), [initialMatches]);
  const teams = useMemo(() => getUniqueTeams(initialMatches), [initialMatches]);

  const citySelectOptions = useMemo<CustomSelectOption[]>(
    () => [{ label: "Toutes les villes", value: "Toutes" }, ...cities.map((c) => ({ label: c, value: c }))],
    [cities]
  );
  const phaseSelectOptions = useMemo<CustomSelectOption[]>(
    () => phaseOptions.map((p) => ({ label: p, value: p })),
    []
  );
  const statusSelectOptions = useMemo<CustomSelectOption[]>(
    () => statusOptions.map((s) => ({ label: s, value: s })),
    []
  );
  const teamSelectOptions = useMemo<CustomSelectOption[]>(
    () => [{ label: "Toutes les équipes", value: "Toutes" }, ...teams.map((t) => ({ label: t, value: t }))],
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
      const matchesCity = selectedCity === "Toutes" || match.ville === selectedCity;
      const matchesPhase = selectedPhase === "Toutes" || match.phase === selectedPhase;
      const matchesStatus =
        selectedStatus === "Tous" || match.status.toUpperCase() === selectedStatus.toUpperCase();
      const matchesTeam =
        selectedTeam === "Toutes" || match.equipe1 === selectedTeam || match.equipe2 === selectedTeam;
      return matchesSearch && matchesCity && matchesPhase && matchesStatus && matchesTeam;
    });
  }, [initialMatches, search, selectedCity, selectedPhase, selectedStatus, selectedTeam]);

  const hasActiveFilters =
    selectedCity !== "Toutes" ||
    selectedPhase !== "Toutes" ||
    selectedStatus !== "Tous" ||
    selectedTeam !== "Toutes" ||
    search !== "";

  function resetFilters() {
    setSearch("");
    setSelectedCity("Toutes");
    setSelectedPhase("Toutes");
    setSelectedStatus("Tous");
    setSelectedTeam("Toutes");
  }

  return (
    <main className="min-h-screen bg-[#050608] px-4 py-6 text-white sm:py-10 md:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Hero header */}
        <section className="mb-8 sm:mb-10">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/8 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Coupe du Monde 2026
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-5xl md:text-6xl">
            Matchs &amp; <span className="text-amber-400">calendrier</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-500 sm:text-base">
            Retrouve tous les matchs, filtre par ville, phase ou équipe, et prépare ta journée.
          </p>
        </section>

        {/* Filter bar */}
        <section className="relative z-10 mb-6 sm:mb-8">
          {/* Search + toggle */}
          <div className="flex gap-2 sm:gap-3">
            <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-white/8 bg-zinc-900/70 px-4 py-2.5 backdrop-blur-sm focus-within:border-amber-500/40">
              <Search className="h-4 w-4 shrink-0 text-zinc-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Équipe, ville, stade, phase…"
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} className="rounded-full p-0.5 hover:bg-zinc-700">
                  <X className="h-3.5 w-3.5 text-zinc-500" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-colors sm:px-4 ${
                filtersOpen || hasActiveFilters
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                  : "border-white/8 bg-zinc-900/70 text-zinc-400 hover:border-white/15 hover:text-white"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filtres</span>
              {hasActiveFilters && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-black">
                  {[selectedCity !== "Toutes", selectedPhase !== "Toutes", selectedStatus !== "Tous", selectedTeam !== "Toutes"].filter(Boolean).length || ""}
                </span>
              )}
            </button>
          </div>

          {/* Expandable filters */}
          {filtersOpen && (
            <div className="mt-3 rounded-xl border border-white/5 bg-zinc-900/70 p-4 backdrop-blur-sm sm:p-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <CustomSelect label="Ville" value={selectedCity} options={citySelectOptions} onChange={setSelectedCity} />
                <CustomSelect
                  label="Phase"
                  value={selectedPhase}
                  options={phaseSelectOptions}
                  onChange={(v) => setSelectedPhase(v as MatchPhase | "Toutes")}
                />
                <CustomSelect label="Statut" value={selectedStatus} options={statusSelectOptions} onChange={setSelectedStatus} />
                <CustomSelect label="Équipe" value={selectedTeam} options={teamSelectOptions} onChange={setSelectedTeam} />
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-3 text-xs font-semibold text-zinc-500 underline underline-offset-2 hover:text-white"
                >
                  Réinitialiser tous les filtres
                </button>
              )}
            </div>
          )}

          {/* Result count */}
          <p className="mt-3 text-xs text-zinc-600">
            <span className="font-semibold text-zinc-400">{filteredMatches.length}</span> match{filteredMatches.length !== 1 ? "s" : ""} affiché{filteredMatches.length !== 1 ? "s" : ""}
          </p>
        </section>

        {/* Cards */}
        {filteredMatches.length === 0 ? (
          <EmptyState />
        ) : (
          <section className="grid gap-4 sm:gap-5 lg:grid-cols-2">
            {filteredMatches.map((match) => (
              <MatchCalendarCard key={match.id} match={match} />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
