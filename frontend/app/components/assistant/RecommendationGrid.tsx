'use client'

import { Sparkles, List, SlidersHorizontal } from 'lucide-react'
import { RecommendationCard } from './RecommendationCard'
import type { RecommendationItem } from './types'

interface RecommendationGridProps {
  primary: RecommendationItem[]
  alternatives: RecommendationItem[]
  activeFilter?: string | null     // resolved_type from backend
  activeIntent?: string | null     // intent for label
  onAddToPlan?: (item: RecommendationItem) => void
  onViewOnMap?: (item: RecommendationItem) => void
  onViewDetails?: (item: RecommendationItem) => void
  onQuickFilter?: (filter: string) => void
}

const QUICK_FILTERS = [
  'Plus proche',
  'Moins cher',
  'Ouvert maintenant',
  'Avec bonne note',
  'Proche du stade',
  'Transformer en parcours',
]

const TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  cafe:       { label: 'Cafés',       icon: '☕', color: 'text-amber-400 bg-amber-500/10 border-amber-500/25' },
  restaurant: { label: 'Restaurants', icon: '🍽️', color: 'text-orange-400 bg-orange-500/10 border-orange-500/25' },
  hotel:      { label: 'Hôtels',      icon: '🏨', color: 'text-blue-400 bg-blue-500/10 border-blue-500/25' },
  activity:   { label: 'Activités',   icon: '🎭', color: 'text-purple-400 bg-purple-500/10 border-purple-500/25' },
  cultural:   { label: 'Culture',     icon: '🏛️', color: 'text-violet-400 bg-violet-500/10 border-violet-500/25' },
  fanzone:    { label: 'Fan zones',   icon: '⚽', color: 'text-green-400 bg-green-500/10 border-green-500/25' },
  nightlife:  { label: 'Soirée',      icon: '🍺', color: 'text-pink-400 bg-pink-500/10 border-pink-500/25' },
  souk:       { label: 'Souks',       icon: '🛍️', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25' },
}

export function RecommendationGrid({
  primary,
  alternatives,
  activeFilter,
  onAddToPlan,
  onViewOnMap,
  onViewDetails,
  onQuickFilter,
}: RecommendationGridProps) {
  if (primary.length === 0 && alternatives.length === 0) return null

  const filterMeta = activeFilter ? TYPE_LABELS[activeFilter] : null
  const totalCount = primary.length + alternatives.length

  return (
    <div className="space-y-5">
      {/* Active filter badge */}
      {filterMeta && (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium w-fit ${filterMeta.color}`}>
          <SlidersHorizontal className="w-3 h-3 opacity-70" />
          <span>{filterMeta.icon} {filterMeta.label}</span>
          <span className="opacity-60">· {totalCount} résultat{totalCount > 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Primary */}
      {primary.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <h3 className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
              Meilleures options
            </h3>
            <span className="ml-auto text-[10px] text-zinc-600">
              {primary.length} résultat{primary.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {primary.map((item) => (
              <RecommendationCard
                key={item.id}
                item={item}
                onAddToPlan={onAddToPlan}
                onViewOnMap={onViewOnMap}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>
        </div>
      )}

      {/* Quick refinement filters */}
      {onQuickFilter && primary.length > 0 && (
        <div>
          <p className="text-[10px] text-zinc-600 mb-2 uppercase tracking-wider">Affiner</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => onQuickFilter(f)}
                className="text-[11px] px-2.5 py-1 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Alternatives */}
      {alternatives.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <List className="w-3.5 h-3.5 text-zinc-500" />
            <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Alternatives
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {alternatives.map((item) => (
              <RecommendationCard
                key={item.id}
                item={item}
                onAddToPlan={onAddToPlan}
                onViewOnMap={onViewOnMap}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
