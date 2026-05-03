'use client'

import React, { useState } from 'react'
import { Clock, MapPin, Navigation, RotateCcw, Info, ChevronDown, ChevronUp, Map, AlertTriangle } from 'lucide-react'
import type { DayPlan, PlanStep, MatchContext } from './types'

interface DayPlanTimelineProps {
  plan: DayPlan
  matchContext?: MatchContext | null
  onViewOnMap?: (step: PlanStep) => void
  onReplace?: (step: PlanStep) => void
  onViewFullMap?: () => void
}

const ICONS: Record<string, string> = {
  cafe: '☕', coffee: '☕',
  restaurant: '🍽️', food: '🍽️',
  hotel: '🏨', riad: '🏨',
  activity: '🎭', culture: '🏛️', cultural: '🏛️', museum: '🏛️',
  fanzone: '⚽', fan_zone: '⚽',
  match: '🏟️',
  nightlife: '🍺',
  souk: '🛍️',
  transport: '🚗', walk: '🚶',
}

const DOT_COLOR: Record<string, string> = {
  cafe: 'bg-amber-500 border-amber-500',
  restaurant: 'bg-orange-500 border-orange-500',
  food: 'bg-orange-500 border-orange-500',
  hotel: 'bg-blue-500 border-blue-500',
  activity: 'bg-purple-500 border-purple-500',
  culture: 'bg-purple-500 border-purple-500',
  cultural: 'bg-purple-500 border-purple-500',
  fanzone: 'bg-green-500 border-green-500',
  fan_zone: 'bg-green-500 border-green-500',
  match: 'bg-yellow-500 border-yellow-500',
  nightlife: 'bg-violet-500 border-violet-500',
}

const SOURCE_BADGE: Record<string, { label: string; cls: string }> = {
  business:  { label: 'Commerce',   cls: 'bg-yellow-500/15 text-yellow-400' },
  discovery: { label: 'Découverte', cls: 'bg-blue-500/15 text-blue-400' },
  event:     { label: 'Événement',  cls: 'bg-green-500/15 text-green-400' },
  match:     { label: 'Match',      cls: 'bg-yellow-500/15 text-yellow-300' },
}

const SECTION_LABELS: Record<string, string> = {
  morning: '🌅 Matin',
  lunch: '☀️ Midi',
  afternoon: '🌤️ Après-midi',
  pre_match: '⚽ Avant le match',
  match: '🏟️ Match',
  post_match: '🎉 Après le match',
  evening: '🌙 Soirée',
}

function getSection(time: string) {
  const h = parseInt(time.split(':')[0] ?? '12', 10)
  if (h < 11) return 'morning'
  if (h < 14) return 'lunch'
  if (h < 17) return 'afternoon'
  if (h < 20) return 'pre_match'
  return 'evening'
}

function StepCard({
  step,
  isLast,
  onViewOnMap,
  onReplace,
}: {
  step: PlanStep
  isLast: boolean
  onViewOnMap?: (s: PlanStep) => void
  onReplace?: (s: PlanStep) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const icon = ICONS[step.type?.toLowerCase?.()] ?? '📍'
  const dotCls = DOT_COLOR[step.type?.toLowerCase?.()] ?? 'bg-zinc-500 border-zinc-500'
  const isMatch = step.type === 'match'
  const sb = step.source ? SOURCE_BADGE[step.source] : null

  return (
    <div className="flex gap-3">
      {/* Dot + line */}
      <div className="flex flex-col items-center flex-shrink-0 w-6">
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] flex-shrink-0 ${dotCls}`}>
          {icon}
        </div>
        {!isLast && <div className="w-px flex-1 mt-1 mb-0.5 bg-zinc-800 min-h-[20px]" />}
      </div>

      {/* Card */}
      <div className={`flex-1 mb-4 ${isLast ? 'mb-2' : ''}`}>
        <div
          className={`rounded-xl border overflow-hidden transition-all ${
            isMatch
              ? 'bg-gradient-to-br from-yellow-950/40 to-zinc-900 border-yellow-500/30'
              : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="p-3">
            {/* Time row */}
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                  {step.startTime}
                </span>
                <span className="text-zinc-600 text-xs">→</span>
                <span className="text-[10px] font-mono text-zinc-500">{step.endTime}</span>
              </div>
              <div className="flex items-center gap-2">
                {sb && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${sb.cls}`}>
                    {sb.label}
                  </span>
                )}
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Title */}
            <p className={`font-semibold text-sm leading-snug ${isMatch ? 'text-yellow-400' : 'text-white'}`}>
              {step.title}
            </p>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-zinc-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {step.durationMinutes} min
              </span>
              {step.address && (
                <span className="flex items-center gap-1 truncate max-w-[180px]">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  {step.address}
                </span>
              )}
              {step.travelMinutes && step.travelMinutes > 0 ? (
                <span className="flex items-center gap-1 text-blue-400">
                  <Navigation className="w-3 h-3" />
                  {step.travelMinutes} min trajet
                </span>
              ) : null}
            </div>
          </div>

          {/* Expanded */}
          {expanded && (
            <div className="px-3 pb-3 pt-2 border-t border-zinc-800/60 space-y-2">
              {step.description && (
                <p className="text-xs text-zinc-300">{step.description}</p>
              )}
              {step.reason && (
                <div className="flex items-start gap-1.5 text-[11px] text-zinc-400 bg-zinc-800/50 rounded-lg p-2 border-l-2 border-yellow-500/35">
                  <Info className="w-3 h-3 flex-shrink-0 mt-0.5 text-yellow-500/60" />
                  <span className="italic">{step.reason}</span>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => onViewOnMap?.(step)}
                  className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
                >
                  <Map className="w-3 h-3" />
                  Carte
                </button>
                {!isMatch && (
                  <button
                    onClick={() => onReplace?.(step)}
                    className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Remplacer
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function DayPlanTimeline({ plan, matchContext, onViewOnMap, onReplace, onViewFullMap }: DayPlanTimelineProps) {
  // Group steps by time section
  const grouped: { section: string; steps: PlanStep[] }[] = []
  for (const step of plan.steps) {
    const sec = step.type === 'match' ? 'match' : getSection(step.startTime)
    const last = grouped[grouped.length - 1]
    if (last && last.section === sec) {
      last.steps.push(step)
    } else {
      grouped.push({ section: sec, steps: [step] })
    }
  }

  const modeColor = {
    before_match: { bg: 'rgba(34,197,94,0.1)', text: '#4ade80' },
    after_match:  { bg: 'rgba(167,139,250,0.1)', text: '#c4b5fd' },
    day_plan:     { bg: 'rgba(59,130,246,0.1)', text: '#60a5fa' },
    general:      { bg: 'rgba(113,113,122,0.1)', text: '#a1a1aa' },
  }[plan.mode]

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm leading-snug">{plan.title}</h3>
            <p className="text-xs text-zinc-400 mt-0.5">{plan.summary}</p>
          </div>
          <span
            className="text-[10px] font-medium px-2.5 py-1 rounded-full flex-shrink-0"
            style={{ background: modeColor.bg, color: modeColor.text }}
          >
            {plan.mode === 'before_match' ? 'Avant match' : plan.mode === 'after_match' ? 'Après match' : 'Journée'}
          </span>
        </div>

        {/* Match reference — uses matchContext ONLY, never substitutes */}
        {matchContext && (
          <div className="flex items-center gap-2 text-xs bg-zinc-800 rounded-xl px-3 py-2">
            <span>⚽</span>
            <span className="font-medium text-white">
              {matchContext.homeTeam} vs {matchContext.awayTeam}
            </span>
            <span className="text-zinc-600">·</span>
            <span className="text-zinc-400 truncate">{matchContext.stadium}</span>
            <span className="text-zinc-600">·</span>
            <span className="text-zinc-400 flex-shrink-0">{matchContext.kickoffTime}</span>
          </div>
        )}

        {/* Safety warning */}
        {plan.safety?.warningMessage && (
          <div className="flex items-start gap-2 text-xs bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-2 text-orange-300">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{plan.safety.warningMessage}</span>
          </div>
        )}
        {plan.safety?.latestDepartureToStadium && (
          <div className="text-xs text-zinc-500 flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            Départ stade au plus tard : <span className="text-zinc-300 font-medium">{plan.safety.latestDepartureToStadium}</span>
          </div>
        )}

        {/* View on map */}
        {onViewFullMap && (
          <button
            onClick={onViewFullMap}
            className="w-full flex items-center justify-center gap-2 text-xs py-2.5 rounded-xl font-medium transition-colors"
            style={{ background: 'rgba(255,189,19,0.08)', color: '#ffbd13', border: '1px solid rgba(255,189,19,0.2)' }}
          >
            <Map className="w-3.5 h-3.5" />
            Afficher le programme sur la carte
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        {grouped.map((group, idx) => (
          <div key={`${group.section}-${idx}`}>
            {/* Section header */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest whitespace-nowrap">
                {SECTION_LABELS[group.section] ?? group.section}
              </span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            {group.steps.map((step, i) => {
              const isLastInGroup = i === group.steps.length - 1
              const isLastOverall =
                group === grouped[grouped.length - 1] && isLastInGroup
              return (
                <StepCard
                  key={`${group.section}-${i}`}
                  step={step}
                  isLast={isLastOverall}
                  onViewOnMap={onViewOnMap}
                  onReplace={onReplace}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
