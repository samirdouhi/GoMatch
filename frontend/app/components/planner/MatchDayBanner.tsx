"use client";

import { useEffect, useState } from "react";

type MatchContext = {
  matchId: string;
  equipe1: string;
  equipe2: string;
  stade: string;
  ville: string;
  kickoff: string;  // "HH:MM"
  date: string;     // "YYYY-MM-DD"
  lat?: number | null;
  lng?: number | null;
};

type SafetyInfo = {
  latestDepartureToStadium?: string | null;
};

type Props = {
  context: MatchContext;
  safety?: SafetyInfo | null;
};

function parseKickoff(date: string, time: string): Date | null {
  try {
    const [h, m] = time.split(":").map(Number);
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    return d;
  } catch {
    return null;
  }
}

function parseDeparture(date: string, timeStr?: string | null): Date | null {
  if (!timeStr) return null;
  return parseKickoff(date, timeStr);
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${sec.toString().padStart(2, "0")}s`;
  return `${sec}s`;
}

export default function MatchDayBanner({ context, safety }: Props) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const kickoff = parseKickoff(context.date, context.kickoff);
  const departure = parseDeparture(context.date, safety?.latestDepartureToStadium);

  const msToKickoff = kickoff ? kickoff.getTime() - now : null;
  const msToDeparture = departure ? departure.getTime() - now : null;

  const isMatchLive = msToKickoff !== null && msToKickoff < 0 && msToKickoff > -110 * 60 * 1000;
  const isMatchOver = msToKickoff !== null && msToKickoff < -110 * 60 * 1000;
  const isDepartureUrgent = msToDeparture !== null && msToDeparture > 0 && msToDeparture < 30 * 60 * 1000;
  const isDeparturePassed = msToDeparture !== null && msToDeparture <= 0;

  if (isMatchOver) return null;

  return (
    <div className="shrink-0 relative overflow-hidden bg-[#0a0a14] border-b border-[#FACC15]/20">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#FACC15]/5 via-transparent to-[#EF4444]/5 pointer-events-none" />

      <div className="relative flex items-center gap-3 px-4 py-2.5">
        {/* Match Day badge */}
        <div className="shrink-0 flex items-center gap-1.5 rounded-lg bg-[#FACC15] px-2 py-1">
          <span className="text-[9px] font-black text-black uppercase tracking-widest">
            {isMatchLive ? "⚽ EN DIRECT" : "⚽ MATCH DAY"}
          </span>
        </div>

        {/* Teams */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-sm font-black text-white truncate">
            {context.equipe1}
          </span>
          <span className="text-[#FACC15] font-black text-xs shrink-0">vs</span>
          <span className="text-sm font-black text-white truncate">
            {context.equipe2}
          </span>
          {context.ville && (
            <span className="hidden sm:block text-[10px] text-white/30 font-bold shrink-0">
              · {context.stade || context.ville}
            </span>
          )}
        </div>

        {/* Countdown / Status */}
        <div className="shrink-0 flex items-center gap-3">
          {isMatchLive ? (
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#EF4444] animate-pulse" />
              <span className="text-[11px] font-black text-[#EF4444]">EN COURS</span>
            </div>
          ) : msToKickoff !== null && msToKickoff > 0 ? (
            <div className="text-right">
              <div className="text-[9px] text-white/30 uppercase tracking-widest">Coup d&apos;envoi dans</div>
              <div className="text-sm font-black text-[#FACC15] tabular-nums">
                {formatCountdown(msToKickoff)}
              </div>
            </div>
          ) : null}
        </div>

        {/* Departure alert */}
        {isDepartureUrgent && !isDeparturePassed && msToDeparture !== null && (
          <div className="shrink-0 flex items-center gap-1.5 rounded-lg border border-[#F97316]/30 bg-[#F97316]/10 px-2.5 py-1.5 animate-pulse">
            <span className="text-[10px]">⚠️</span>
            <span className="text-[10px] font-black text-[#F97316]">
              Départ dans {formatCountdown(msToDeparture)}
            </span>
          </div>
        )}

        {isDeparturePassed && msToDeparture !== null && msToKickoff !== null && msToKickoff > 0 && (
          <div className="shrink-0 flex items-center gap-1.5 rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 px-2.5 py-1.5">
            <span className="text-[10px]">🚨</span>
            <span className="text-[10px] font-black text-[#EF4444]">
              Partez maintenant !
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
