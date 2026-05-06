'use client'

import { Star, Clock, Map, Plus, ArrowRight, MapPin, Sparkles, Route } from 'lucide-react'
import type { RecommendationItem } from './types'

interface RecommendationCardProps {
  item: RecommendationItem
  onAddToPlan?: (item: RecommendationItem) => void
  onViewOnMap?: (item: RecommendationItem) => void
  onViewDetails?: (item: RecommendationItem) => void
  onGetRoute?: (item: RecommendationItem) => void
}

const TYPE_ICONS: Record<string, string> = {
  cafe: '☕', coffee: '☕',
  restaurant: '🍽️', food: '🍽️',
  hotel: '🏨', riad: '🏨',
  activity: '🎭',
  cultural: '🏛️', culture: '🏛️', museum: '🏛️',
  fanzone: '⚽', fan_zone: '⚽', stade: '🏟️', stadium: '🏟️',
  nightlife: '🌙', bar: '🍺',
  souk: '🛍️', artisanat: '🛍️',
  place: '📍', discovery: '🔭',
}

const SOURCE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  business:  { label: 'Commerce',   color: '#facc15', bg: 'rgba(250,204,21,0.10)' },
  discovery: { label: 'Découverte', color: '#60a5fa', bg: 'rgba(96,165,250,0.10)' },
  culture:   { label: 'Culturel',   color: '#a78bfa', bg: 'rgba(167,139,250,0.10)' },
  fanzone:   { label: 'Fan Zone',   color: '#4ade80', bg: 'rgba(74,222,128,0.10)' },
  stadium:   { label: 'Stade',      color: '#fb923c', bg: 'rgba(251,146,60,0.10)' },
}

function fmtDist(km?: number) {
  if (km == null) return null
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}

function fmtTime(min?: number) {
  if (min == null) return null
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)}h${min % 60 > 0 ? String(min % 60).padStart(2, '0') : ''}`
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const color = pct >= 80 ? '#4ade80' : pct >= 60 ? '#facc15' : '#fb923c'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-[10px] font-bold tabular-nums" style={{ color }}>{pct}%</span>
    </div>
  )
}

export function RecommendationCard({ item, onAddToPlan, onViewOnMap, onViewDetails, onGetRoute }: RecommendationCardProps) {
  const icon = TYPE_ICONS[item.type?.toLowerCase?.()] ?? TYPE_ICONS[item.source?.toLowerCase?.()] ?? '📍'
  const isBusiness = item.source === 'business'
  const isCulture = item.source === 'culture'
  const dist = fmtDist(item.distanceKm)
  const travel = fmtTime(item.estimatedTravelMinutes)
  const srcCfg = SOURCE_CONFIG[item.source] ?? SOURCE_CONFIG['discovery']

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 transition-all duration-300 hover:border-zinc-600 hover:shadow-2xl hover:shadow-black/60"
      style={{ backdropFilter: 'blur(8px)' }}
    >
      {/* ── Image / Banner ── */}
      <div
        className="relative flex-shrink-0 cursor-pointer overflow-hidden bg-zinc-800"
        style={{ height: 156 }}
        onClick={() => onViewDetails?.(item)}
      >
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl opacity-15">{icon}</div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/30 to-transparent" />

        {/* Source badge */}
        <div className="absolute top-2.5 left-2.5">
          <span
            className="text-[10px] font-bold px-2 py-1 rounded-full"
            style={{ background: srcCfg.bg, color: srcCfg.color, border: `1px solid ${srcCfg.color}30` }}
          >
            {srcCfg.label}
          </span>
        </div>

        {/* Open/Closed badge */}
        {item.isOpen != null && (
          <div className="absolute top-2.5 right-2.5">
            <span
              className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                item.isOpen ? 'bg-green-500/90 text-white' : 'bg-black/70 text-zinc-400'
              }`}
            >
              {item.isOpen ? '● Ouvert' : '● Fermé'}
            </span>
          </div>
        )}

        {/* Distance */}
        {dist && (
          <div className="absolute bottom-2.5 right-2.5">
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-black/70 text-zinc-300 backdrop-blur-sm">
              <MapPin className="w-2.5 h-2.5" />
              {dist}
            </span>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col gap-2.5 px-4 pt-3 pb-3.5 flex-1">

        {/* Name + icon */}
        <div
          className="flex items-start gap-2 cursor-pointer"
          onClick={() => onViewDetails?.(item)}
        >
          <span className="text-lg flex-shrink-0 mt-0.5 leading-none">{icon}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-sm leading-snug line-clamp-2 group-hover:text-[#ffbd13] transition-colors">
              {item.name}
            </h3>
            {item.category && (
              <p className="text-[11px] text-zinc-500 capitalize mt-0.5">{item.category}</p>
            )}
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-400 transition-colors flex-shrink-0 mt-1" />
        </div>

        {/* Rating — business only */}
        {isBusiness && (
          <div className="flex items-center gap-2">
            {item.noteGlobale && item.noteGlobale > 0 ? (
              <>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3 h-3 ${s <= Math.round(item.noteGlobale!) ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-800'}`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-white">{item.noteGlobale.toFixed(1)}</span>
                {item.nombreAvis != null && item.nombreAvis > 0 && (
                  <span className="text-[10px] text-zinc-500">({item.nombreAvis} avis)</span>
                )}
              </>
            ) : (
              <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                <Star className="w-3 h-3" /> Nouveau
              </span>
            )}
          </div>
        )}

        {/* Score de pertinence */}
        {item.scoreTotal > 0 && (
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-zinc-600 mb-1">Pertinence</p>
            <ScoreBar score={Math.min(item.scoreTotal, 100) / 100} />
          </div>
        )}

        {/* Travel time */}
        {travel && (
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <Clock className="w-3 h-3 text-blue-400" />
            <span>{travel} de trajet</span>
          </div>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 4).map((tag, i) => (
              <span
                key={i}
                className="text-[9px] px-2 py-0.5 rounded-full font-medium border border-zinc-700 text-zinc-400 bg-zinc-800/60"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Reason — why recommended */}
        {item.reason && (
          <div className="flex items-start gap-1.5 bg-zinc-800/50 rounded-xl px-3 py-2 border-l-2 border-[#ffbd13]/30">
            <Sparkles className="w-3 h-3 flex-shrink-0 mt-0.5 text-[#ffbd13]/60" />
            <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2 italic">{item.reason}</p>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="mt-auto flex items-center gap-2 pt-1">
          <button
            onClick={() => onViewDetails?.(item)}
            className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold text-[#f5d563] transition-all hover:opacity-90 active:scale-95"
            style={{
              background: 'rgba(255,189,19,0.09)',
              border: '1px solid rgba(255,189,19,0.22)',
            }}
          >
            Voir détails
          </button>
          <button
            onClick={() => onViewOnMap?.(item)}
            title="Voir sur la carte"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-400 hover:text-blue-400 transition-all active:scale-95 flex-shrink-0"
          >
            <Map className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onAddToPlan?.(item)}
            title="Ajouter au programme"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-400 hover:text-green-400 transition-all active:scale-95 flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onGetRoute?.(item)}
            title="Itinéraire"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-400 hover:text-orange-400 transition-all active:scale-95 flex-shrink-0"
          >
            <Route className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
