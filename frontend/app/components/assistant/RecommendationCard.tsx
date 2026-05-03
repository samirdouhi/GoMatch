'use client'

import { Star, Clock, Map, Plus, ArrowRight } from 'lucide-react'
import type { RecommendationItem } from './types'

interface RecommendationCardProps {
  item: RecommendationItem
  onAddToPlan?: (item: RecommendationItem) => void
  onViewOnMap?: (item: RecommendationItem) => void
  onViewDetails?: (item: RecommendationItem) => void
}

const TYPE_ICONS: Record<string, string> = {
  cafe: '☕', coffee: '☕',
  restaurant: '🍽️', food: '🍽️',
  hotel: '🏨', riad: '🏨',
  activity: '🎭',
  cultural: '🏛️', culture: '🏛️', museum: '🏛️',
  fanzone: '⚽', fan_zone: '⚽',
  nightlife: '🍺', bar: '🍺',
  souk: '🛍️',
}

function fmtDist(km?: number) {
  if (km == null) return null
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`
}

function fmtTime(min?: number) {
  if (min == null) return null
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)}h${min % 60 > 0 ? String(min % 60).padStart(2, '0') : ''}`
}

export function RecommendationCard({ item, onAddToPlan, onViewOnMap, onViewDetails }: RecommendationCardProps) {
  const icon = TYPE_ICONS[item.type?.toLowerCase?.()] ?? '📍'
  const isBusiness = item.source === 'business'
  const dist = fmtDist(item.distanceKm)
  const travel = fmtTime(item.estimatedTravelMinutes)

  return (
    <div
      className="group bg-zinc-900/70 border border-zinc-800 rounded-2xl overflow-hidden transition-all duration-200 hover:border-zinc-600 hover:shadow-xl hover:shadow-black/50 flex flex-col"
      style={{ backdropFilter: 'blur(8px)' }}
    >
      {/* ── Image ── */}
      <div
        className="relative flex-shrink-0 overflow-hidden cursor-pointer"
        style={{ height: 168 }}
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
          <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-5xl opacity-20">{icon}</div>
        )}
        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/95 via-transparent to-transparent" />

        {/* Open/Closed badge */}
        {item.isOpen != null && (
          <div className="absolute top-3 left-3">
            <span
              className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                item.isOpen ? 'bg-green-500/90 text-white' : 'bg-zinc-900/85 text-zinc-400'
              }`}
            >
              {item.isOpen ? '● Ouvert' : '● Fermé'}
            </span>
          </div>
        )}

        {/* Distance pill */}
        {dist && (
          <div className="absolute bottom-3 right-3">
            <span
              className="text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', color: '#e4e4e7' }}
            >
              {dist}
            </span>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="px-4 pt-3.5 pb-3 flex flex-col gap-2 flex-1">

        {/* Name row */}
        <div
          className="flex items-start gap-2 cursor-pointer"
          onClick={() => onViewDetails?.(item)}
        >
          <span className="text-base flex-shrink-0 mt-0.5 leading-none">{icon}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-[14px] leading-snug">{item.name}</h3>
            {item.category && (
              <p className="text-[11px] text-zinc-500 capitalize mt-0.5">{item.category}</p>
            )}
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-400 transition-colors flex-shrink-0 mt-1" />
        </div>

        {/* Rating — business only */}
        {isBusiness && (
          <div className="flex items-center gap-1.5">
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
                  <span className="text-[10px] text-zinc-500">· {item.nombreAvis} avis</span>
                )}
              </>
            ) : (
              <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                <Star className="w-3 h-3" /> Nouveau
              </span>
            )}
          </div>
        )}

        {/* Travel time */}
        {travel && (
          <div className="flex items-center gap-1 text-[11px] text-zinc-500">
            <Clock className="w-3 h-3" />
            {travel} à pied
          </div>
        )}

        {/* Reason */}
        {item.reason && (
          <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2 italic">{item.reason}</p>
        )}

        {/* ── Action bar ── */}
        <div className="mt-auto flex items-center gap-2 pt-0.5">
          <button
            onClick={() => onViewDetails?.(item)}
            className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{
              background: 'rgba(255,189,19,0.09)',
              border: '1px solid rgba(255,189,19,0.22)',
              color: '#f5d563',
            }}
          >
            Voir les détails
          </button>
          <button
            onClick={() => onViewOnMap?.(item)}
            title="Voir sur la carte"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-400 transition-colors active:scale-95 flex-shrink-0"
          >
            <Map className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onAddToPlan?.(item)}
            title="Ajouter au programme"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-400 transition-colors active:scale-95 flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
