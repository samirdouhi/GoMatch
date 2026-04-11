"use client";
 
import { useMemo, useState } from "react";
import {
  Calendar, MapPin, Clock, Trophy, Flag,
  ChevronRight, Info, Store,
} from "lucide-react";
import Link from "next/link";
import {
  MATCHES_MAROC,
  getUpcomingMatches,
  getPastMatches,
  getNextMatch,
  getLastFinishedMatch,
  formatMatchDate,
  type Match,
  type MatchPhase,
} from "@/lib/matchesApi";
 
// ── Helpers ───────────────────────────────────────────────────────────────────
 
const PHASE_ORDER: MatchPhase[] = ["Groupes", "Huitièmes", "Quarts", "Demi-finales", "Finale"];
 
const PHASE_COLORS: Record<MatchPhase, string> = {
  Groupes:       "border-blue-500/30  bg-blue-500/10  text-blue-300",
  "Huitièmes":   "border-amber-500/30 bg-amber-500/10 text-amber-300",
  Quarts:        "border-purple-500/30 bg-purple-500/10 text-purple-300",
  "Demi-finales":"border-orange-500/30 bg-orange-500/10 text-orange-300",
  Finale:        "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
};
 
type TabKey = "tous" | "a-venir" | "passes";
 
function MatchCard({ match, isNext, isLast }: { match: Match; isNext?: boolean; isLast?: boolean }) {
  const now   = new Date();
  const mDate = new Date(`${match.date}T${match.heure}:00`);
  const isPast = mDate < now;
 
  return (
    <div className={`relative overflow-hidden rounded-3xl border p-5 transition ${
      isNext
        ? "border-orange-500/40 bg-gradient-to-br from-orange-500/10 to-transparent shadow-[0_0_40px_rgba(249,115,22,0.08)]"
        : isLast
        ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/8 to-transparent"
        : "border-white/[0.07] bg-white/[0.03] hover:border-white/[0.12]"
    }`}>
      {isNext && (
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-orange-500/10 blur-2xl pointer-events-none" />
      )}
 
      {/* Phase + context badge */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${PHASE_COLORS[match.phase]}`}>
          {match.phase}{match.groupe ? ` · Groupe ${match.groupe}` : ""}
        </span>
        {isNext && (
          <span className="rounded-full border border-orange-500/40 bg-orange-500/15 px-3 py-1 text-xs font-black text-orange-300">
            Prochain match
          </span>
        )}
        {isLast && (
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-300">
            Match terminé
          </span>
        )}
        {isPast && !isLast && (
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-zinc-500">
            Terminé
          </span>
        )}
      </div>
 
      {/* Teams */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 text-center">
          <span className="block text-4xl">{match.drapeau1}</span>
          <p className="mt-2 text-sm font-black text-white">{match.equipe1}</p>
        </div>
        <div className="flex flex-col items-center">
          <span className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-base font-black text-zinc-400">VS</span>
          <p className="mt-2 text-xs font-semibold text-orange-400">{match.heure}</p>
        </div>
        <div className="flex-1 text-center">
          <span className="block text-4xl">{match.drapeau2}</span>
          <p className="mt-2 text-sm font-black text-white">{match.equipe2}</p>
        </div>
      </div>
 
      {/* Meta */}
      <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-white/[0.06] pt-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          {formatMatchDate(match.date)}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />{match.stade}, {match.ville}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />{match.heure}
        </span>
      </div>
 
      {/* CTA: explore nearby commerces */}
      <Link
        href={`/explore?ville=${encodeURIComponent(match.ville)}`}
        className="mt-4 flex items-center gap-2 text-xs font-semibold text-orange-400 transition hover:text-orange-300"
      >
        <Store className="h-3.5 w-3.5" />
        Voir les commerces à {match.ville}
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
 
// ── Page ──────────────────────────────────────────────────────────────────────
 
export default function MatchesPage() {
  const [tab,         setTab]         = useState<TabKey>("a-venir");
  const [villeFilter, setVilleFilter] = useState<string>("all");
  const [phaseFilter, setPhaseFilter] = useState<string>("all");
 
  const nextMatch = useMemo(() => getNextMatch(),        []);
  const lastMatch = useMemo(() => getLastFinishedMatch(),[]);
 
  const villes = useMemo(() => Array.from(new Set(MATCHES_MAROC.map(m => m.ville))).sort(), []);
 
  const displayedMatches = useMemo(() => {
    const base = tab === "a-venir" ? getUpcomingMatches() : tab === "passes" ? getPastMatches() : MATCHES_MAROC;
    return base
      .filter(m => villeFilter === "all" || m.ville === villeFilter)
      .filter(m => phaseFilter === "all" || m.phase === phaseFilter);
  }, [tab, villeFilter, phaseFilter]);
 
  return (
    <div className="min-h-screen bg-[#04060b] text-white">
      {/* Hero */}
      <div className="border-b border-white/[0.07] bg-gradient-to-b from-yellow-500/5 to-transparent px-6 py-10 lg:px-8">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="h-6 w-6 text-yellow-400" />
          <h1 className="text-3xl font-black lg:text-4xl">Coupe du Monde 2026</h1>
        </div>
        <p className="text-sm text-zinc-500">Matchs au Maroc · Calendrier officiel</p>
 
        {/* Context banners */}
        {nextMatch && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-orange-500/30 bg-orange-500/10 px-5 py-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
            <div>
              <p className="text-sm font-bold text-orange-300">Match dans moins de 48h !</p>
              <p className="mt-0.5 text-xs text-orange-400/70">
                {nextMatch.equipe1} {nextMatch.drapeau1} vs {nextMatch.drapeau2} {nextMatch.equipe2} — {nextMatch.stade}, {formatMatchDate(nextMatch.date)} à {nextMatch.heure}
              </p>
            </div>
          </div>
        )}
        {lastMatch && !nextMatch && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4">
            <Flag className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <div>
              <p className="text-sm font-bold text-emerald-300">Match récemment terminé</p>
              <p className="mt-0.5 text-xs text-emerald-400/70">
                {lastMatch.equipe1} {lastMatch.drapeau1} vs {lastMatch.drapeau2} {lastMatch.equipe2} — {lastMatch.stade}
              </p>
            </div>
          </div>
        )}
      </div>
 
      {/* Controls */}
      <div className="flex flex-col gap-4 border-b border-white/[0.07] px-6 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        {/* Tabs */}
        <div className="flex gap-1 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-1">
          {([
            { key: "a-venir", label: "À venir" },
            { key: "passes",  label: "Passés"  },
            { key: "tous",    label: "Tous"    },
          ] as { key: TabKey; label: string }[]).map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                tab === t.key ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
 
        {/* Ville + phase filters */}
        <div className="flex flex-wrap gap-2">
          <select
            value={villeFilter}
            onChange={e => setVilleFilter(e.target.value)}
            className="rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300 focus:border-yellow-500/40 focus:outline-none"
          >
            <option value="all">Toutes les villes</option>
            {villes.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select
            value={phaseFilter}
            onChange={e => setPhaseFilter(e.target.value)}
            className="rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300 focus:border-yellow-500/40 focus:outline-none"
          >
            <option value="all">Toutes les phases</option>
            {PHASE_ORDER.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>
 
      {/* Grid */}
      <div className="px-6 py-8 lg:px-8">
        <p className="mb-5 text-xs font-semibold text-zinc-500">
          {displayedMatches.length} match{displayedMatches.length > 1 ? "s" : ""}
        </p>
 
        {displayedMatches.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/[0.07] py-20 text-center">
            <Trophy className="mx-auto h-12 w-12 text-zinc-700" />
            <p className="mt-4 text-sm font-semibold text-zinc-500">Aucun match dans ce filtre.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {displayedMatches.map(m => (
              <MatchCard
                key={m.id}
                match={m}
                isNext={nextMatch?.id === m.id}
                isLast={lastMatch?.id === m.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}