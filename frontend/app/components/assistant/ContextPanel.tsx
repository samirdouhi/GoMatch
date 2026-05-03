'use client'

import { MapPin, Clock, Ticket } from 'lucide-react'
import type { MatchContext, UserContext, Mode, Budget } from './types'

interface ContextPanelProps {
  matchContext: MatchContext | null
  userContext: UserContext
  onUserContextChange: (patch: Partial<UserContext>) => void
  onModeChange: (mode: Mode) => void
  className?: string
}

const MODES: { value: Mode; label: string; icon: string; activeCls: string }[] = [
  { value: 'before_match', label: 'Avant match',     icon: '⚽', activeCls: 'border-green-500/50 bg-green-500/10 text-green-400' },
  { value: 'after_match',  label: 'Après match',     icon: '🎉', activeCls: 'border-violet-500/50 bg-violet-500/10 text-violet-400' },
  { value: 'day_plan',     label: 'Journée',         icon: '☀️', activeCls: 'border-blue-500/50 bg-blue-500/10 text-blue-400' },
  { value: 'general',      label: 'Général',         icon: '💬', activeCls: 'border-zinc-600 bg-zinc-800 text-zinc-300' },
]

const BUDGETS: { value: Budget; label: string; icon: string }[] = [
  { value: 'low',    label: 'Éco',     icon: '💰' },
  { value: 'medium', label: 'Modéré',  icon: '💳' },
  { value: 'high',   label: 'Premium', icon: '💎' },
]

const TIMES = [60, 120, 180, 240, 360, 480]

export function ContextPanel({ matchContext, userContext, onUserContextChange, onModeChange, className = '' }: ContextPanelProps) {
  return (
    <aside className={`flex flex-col gap-3 overflow-y-auto ${className}`}>

      {/* Mode */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">Mode</p>
        <div className="grid grid-cols-2 gap-1.5">
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => onModeChange(m.value)}
              className={`text-xs font-medium px-2 py-2 rounded-xl border transition-all text-left ${
                userContext.mode === m.value
                  ? m.activeCls
                  : 'border-zinc-800 bg-zinc-800/40 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-400'
              }`}
            >
              <span className="mr-1.5">{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>
      </section>

      {/* Match */}
      {matchContext ? (
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Match sélectionné</p>
            <span className="w-2 h-2 rounded-full bg-green-500" />
          </div>

          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="text-center flex-1">
              <div className="text-lg mb-0.5">🇲🇦</div>
              <div className="text-xs font-semibold text-white leading-snug">{matchContext.homeTeam}</div>
            </div>
            <div className="text-zinc-600 font-bold">vs</div>
            <div className="text-center flex-1">
              <div className="text-lg mb-0.5">⚽</div>
              <div className="text-xs font-semibold text-white leading-snug">{matchContext.awayTeam}</div>
            </div>
          </div>

          <div className="space-y-1.5 text-[11px] text-zinc-400 border-t border-zinc-800 pt-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3 text-zinc-600 flex-shrink-0" />
              <span className="truncate">{matchContext.stadium}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-zinc-600 flex-shrink-0" />
              <span>{matchContext.kickoffDate} · {matchContext.kickoffTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3 text-zinc-600 flex-shrink-0" />
              <span>{matchContext.city}</span>
            </div>
          </div>

          {/* Ticket toggle */}
          <div className="flex items-center justify-between mt-3 bg-zinc-800 rounded-xl px-3 py-2">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Ticket className="w-3.5 h-3.5" />
              Billet
            </div>
            <button
              onClick={() => onUserContextChange({ hasTicket: !userContext.hasTicket })}
              className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                userContext.hasTicket
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-zinc-700 text-zinc-400 border border-zinc-600 hover:bg-zinc-600'
              }`}
            >
              {userContext.hasTicket ? 'Oui ✓' : 'Non'}
            </button>
          </div>
        </section>
      ) : (
        <section className="bg-zinc-900 border border-zinc-800 border-dashed rounded-2xl p-4 text-center">
          <div className="text-2xl mb-2">⚽</div>
          <p className="text-xs text-zinc-500">Aucun match sélectionné</p>
          <p className="text-[10px] text-zinc-600 mt-1">Sélectionnez un match pour des recommandations personnalisées</p>
        </section>
      )}

      {/* Location */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2.5">Position</p>
        {userContext.latitude && userContext.longitude ? (
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 animate-pulse" />
            <span>Détectée</span>
            <span className="ml-auto font-mono text-[10px] text-zinc-600">
              {userContext.latitude.toFixed(3)}, {userContext.longitude.toFixed(3)}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <div className="w-2 h-2 rounded-full bg-zinc-700 flex-shrink-0" />
            <span>Non détectée</span>
          </div>
        )}
      </section>

      {/* Budget */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2.5">Budget</p>
        <div className="flex gap-1.5">
          {BUDGETS.map((b) => (
            <button
              key={b.value}
              onClick={() => onUserContextChange({ budget: b.value })}
              className={`flex-1 text-center py-2 rounded-xl border transition-all ${
                userContext.budget === b.value
                  ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400'
                  : 'border-zinc-800 bg-zinc-800/40 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-400'
              }`}
            >
              <div className="text-base">{b.icon}</div>
              <div className="text-[9px] mt-0.5">{b.label}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Time available */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2.5">Temps disponible</p>
        <div className="grid grid-cols-3 gap-1.5">
          {TIMES.map((min) => (
            <button
              key={min}
              onClick={() => onUserContextChange({ availableMinutes: min })}
              className={`text-xs py-1.5 rounded-xl border transition-all ${
                userContext.availableMinutes === min
                  ? 'border-blue-500/40 bg-blue-500/10 text-blue-400'
                  : 'border-zinc-800 bg-zinc-800/40 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-400'
              }`}
            >
              {min < 60 ? `${min}m` : `${min / 60}h`}
            </button>
          ))}
        </div>
      </section>
    </aside>
  )
}
