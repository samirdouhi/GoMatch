'use client'

import { X, MapPin, Clock, Star, Plus, Map, ExternalLink } from 'lucide-react'
import type { RecommendationItem } from './types'

interface DetailDrawerProps {
  item: RecommendationItem
  onClose: () => void
  onAddToPlan?: (item: RecommendationItem) => void
  onViewOnMap?: (item: RecommendationItem) => void
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

const TYPE_LABELS: Record<string, string> = {
  cafe: 'Café', coffee: 'Café',
  restaurant: 'Restaurant', food: 'Restaurant',
  hotel: 'Hôtel', riad: 'Riad',
  activity: 'Activité',
  cultural: 'Culture', museum: 'Musée',
  fanzone: 'Fan Zone',
  nightlife: 'Soirée', bar: 'Bar',
  souk: 'Souk',
}

function fmtDist(km?: number) {
  if (km == null) return null
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}

function fmtTime(min?: number) {
  if (min == null) return null
  if (min < 60) return `${min} min`
  return `${Math.floor(min / 60)}h${min % 60 > 0 ? String(min % 60).padStart(2, '0') : ''}`
}

export function DetailDrawer({ item, onClose, onAddToPlan, onViewOnMap }: DetailDrawerProps) {
  const icon = TYPE_ICONS[item.type?.toLowerCase?.()] ?? '📍'
  const typeLabel = TYPE_LABELS[item.type?.toLowerCase?.()] ?? (item.category ?? item.type ?? 'Lieu')
  const isBusiness = item.source === 'business'
  const hasRating = isBusiness && item.noteGlobale != null && item.noteGlobale > 0
  const dist = fmtDist(item.distanceKm)
  const travel = fmtTime(item.estimatedTravelMinutes)

  return (
    <>
      {/* Backdrop — above TopBar (z-[110]) */}
      <div
        className="fixed inset-0 bg-black/70 z-[120]"
        style={{ backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Slide-in drawer — above backdrop */}
      <div
        className="fixed right-0 top-0 h-full z-[130] flex flex-col border-l border-zinc-800 shadow-2xl overflow-hidden"
        style={{ width: 440, maxWidth: '100vw', background: '#0a0a0b' }}
      >
        {/* ── Hero image ── */}
        <div className="relative h-52 bg-zinc-900 flex-shrink-0 overflow-hidden">
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl opacity-15">{icon}</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/30 to-transparent" />

          {/* Close */}
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
          >
            <X className="w-4 h-4 text-white" />
          </button>

          {/* Open / closed badge */}
          {item.isOpen != null && (
            <div className="absolute top-4 left-4">
              <span
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                  item.isOpen
                    ? 'bg-green-500/90 text-white'
                    : 'bg-zinc-900/85 text-zinc-400'
                }`}
              >
                {item.isOpen ? '● Ouvert' : '● Fermé'}
              </span>
            </div>
          )}
        </div>

        {/* ── Scrollable body ── */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 transparent' }}
        >
          <div className="px-5 pt-5 pb-4 space-y-5">

            {/* Title block */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base leading-none">{icon}</span>
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">{typeLabel}</span>
              </div>
              <h2 className="text-[22px] font-black text-white leading-tight">{item.name}</h2>
            </div>

            {/* Rating — business only */}
            {hasRating && (
              <div className="flex items-center gap-3 py-3.5 border-y border-zinc-800/70">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${s <= Math.round(item.noteGlobale!) ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-800'}`}
                    />
                  ))}
                </div>
                <span className="text-lg font-bold text-white">{item.noteGlobale!.toFixed(1)}</span>
                {item.nombreAvis != null && item.nombreAvis > 0 && (
                  <span className="text-sm text-zinc-500">{item.nombreAvis} avis</span>
                )}
              </div>
            )}

            {/* Distance + address row */}
            {(dist || item.address) && (
              <div className="space-y-2.5">
                {dist && (
                  <div className="flex items-center gap-3 text-sm text-zinc-400">
                    <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                    </div>
                    <span>
                      {dist}
                      {travel && <span className="text-zinc-600"> · {travel} à pied</span>}
                    </span>
                  </div>
                )}
                {item.address && (
                  <div className="flex items-start gap-3 text-sm">
                    <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
                    </div>
                    <span className="text-zinc-300 leading-relaxed">{item.address}</span>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {item.description && (
              <div>
                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">À propos</p>
                <p className="text-sm text-zinc-300 leading-relaxed">{item.description}</p>
              </div>
            )}

            {/* Tags */}
            {item.tags?.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Caractéristiques</p>
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 capitalize"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reason — why GoMatch recommends this */}
            {item.reason && (
              <div
                className="rounded-2xl p-4"
                style={{ background: 'rgba(255,189,19,0.04)', border: '1px solid rgba(255,189,19,0.15)' }}
              >
                <p className="text-[10px] font-bold text-yellow-500/50 uppercase tracking-wider mb-1.5">
                  Pourquoi ce lieu ?
                </p>
                <p className="text-sm text-zinc-300 leading-relaxed italic">{item.reason}</p>
              </div>
            )}

            {/* Call to action */}
            {item.callToAction && (
              <p className="text-sm font-medium text-zinc-400 leading-relaxed">{item.callToAction}</p>
            )}

          </div>
        </div>

        {/* ── Action bar ── */}
        <div className="flex-shrink-0 px-4 py-4 border-t border-zinc-800 flex gap-3">
          <button
            onClick={() => onAddToPlan?.(item)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold transition-all active:scale-95"
            style={{
              background: 'rgba(255,189,19,0.12)',
              color: '#ffbd13',
              border: '1px solid rgba(255,189,19,0.25)',
            }}
          >
            <Plus className="w-4 h-4" />
            Ajouter au parcours
          </button>
          <button
            onClick={() => onViewOnMap?.(item)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold bg-zinc-900 border border-zinc-700 text-zinc-300 transition-all hover:bg-zinc-800 active:scale-95"
          >
            <Map className="w-4 h-4" />
            Voir sur la carte
          </button>
        </div>
      </div>
    </>
  )
}
