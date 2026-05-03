'use client'

import type { MatchContext } from './types'

interface EmptyStateProps {
  matchContext: MatchContext | null
  onQuickStart: (prompt: string) => void
}

const SUGGESTIONS = [
  { icon: '⚽', title: 'Programme avant match', desc: 'Planifier votre journée', prompt: 'Programme complet avant le match' },
  { icon: '☕', title: 'Café calme', desc: 'Pause tranquille', prompt: 'Meilleur café calme proche de moi' },
  { icon: '🍽️', title: 'Restaurant local', desc: 'Cuisine marocaine', prompt: 'Restaurant marocain traditionnel proche' },
  { icon: '🏛️', title: 'Activité culturelle', desc: 'Découvrir la ville', prompt: 'Activité culturelle à découvrir' },
  { icon: '🍺', title: 'Fan zone', desc: 'Sans ticket', prompt: 'Fan zone la plus proche pour regarder le match' },
  { icon: '🏨', title: 'Riad authentique', desc: 'Hébergement local', prompt: 'Riad authentique pour cette nuit' },
]

export function EmptyState({ matchContext, onQuickStart }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center select-none">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black mb-5"
        style={{ background: 'rgba(255,189,19,0.12)', color: '#ffbd13' }}
      >
        G
      </div>

      <h2 className="text-lg font-bold text-white mb-2">Bonjour, je suis GoMatch</h2>

      {matchContext ? (
        <p className="text-zinc-400 text-sm mb-1 max-w-xs">
          Match sélectionné :{' '}
          <span className="text-white font-semibold">
            {matchContext.homeTeam} vs {matchContext.awayTeam}
          </span>
          . Je peux vous préparer un programme complet.
        </p>
      ) : (
        <p className="text-zinc-400 text-sm mb-1 max-w-xs">
          Votre assistant pour la Coupe du Monde 2030 au Maroc.
        </p>
      )}

      <p className="text-zinc-600 text-xs mb-7 max-w-[260px]">
        Demandez un café, un restaurant, une activité, ou laissez-moi planifier votre journée.
      </p>

      <div className="grid grid-cols-2 gap-2.5 w-full max-w-sm">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.prompt}
            onClick={() => onQuickStart(s.prompt)}
            className="text-left p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-600 hover:bg-zinc-800/80 transition-all group"
          >
            <div className="text-lg mb-1">{s.icon}</div>
            <div className="text-xs font-semibold text-white group-hover:text-yellow-400 transition-colors leading-snug">
              {s.title}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">{s.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
