'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Zap } from 'lucide-react'
import type { MatchContext } from './types'

const ACTIONS = [
  { icon: '🍽️', label: 'Restaurant', sub: 'Cuisine locale', prompt: 'Restaurant marocain traditionnel proche de moi', color: '#f97316' },
  { icon: '☕', label: 'Café', sub: 'Calme & terrasse', prompt: 'Meilleur café calme proche de moi', color: '#f59e0b' },
  { icon: '🏨', label: 'Hôtel / Riad', sub: 'Hébergement', prompt: 'Riad ou hôtel proche pour cette nuit', color: '#3b82f6' },
  { icon: '🎭', label: 'Activité', sub: 'Culture & sorties', prompt: 'Activité ou sortie culturelle à faire maintenant', color: '#a855f7' },
  { icon: '⚽', label: 'Fan Zone', sub: 'Sans ticket', prompt: 'Fan zone pour regarder le match sans ticket', color: '#22c55e' },
  { icon: '🗓️', label: 'Programme', sub: 'Journée complète', prompt: 'Crée-moi un programme complet pour la journée du match', color: '#facc15' },
]

export function WelcomeScreen({ matchContext, onSelect }: {
  matchContext: MatchContext | null
  onSelect: (message: string) => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-10 gap-8">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="text-center"
      >
        <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6">
          <div className="absolute inset-0 rounded-3xl opacity-30 blur-2xl" style={{ background: 'radial-gradient(circle, #facc15, #fb923c)' }} />
          <div
            className="relative w-full h-full rounded-3xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(250,204,21,0.14), rgba(251,146,60,0.07))',
              border: '1px solid rgba(250,204,21,0.22)',
              boxShadow: '0 0 40px rgba(250,204,21,0.1), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            <Sparkles className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <h1 className="text-[2.8rem] font-black leading-none tracking-tight mb-3">
          <span className="text-white">GoMatch</span>{' '}
          <span style={{ background: 'linear-gradient(135deg, #facc15 0%, #fb923c 60%, #f97316 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Assistant
          </span>
        </h1>

        <div className="flex items-center justify-center gap-2">
          <Zap className="w-3 h-3 text-yellow-500/70" />
          <p className="text-[13px] text-zinc-500 font-medium tracking-wide">Guide IA · Coupe du Monde 2026 · Maroc</p>
          <Zap className="w-3 h-3 text-yellow-500/70" />
        </div>
      </motion.div>

      {/* ── Match context pill ────────────────────────────────────────────── */}
      {matchContext && (
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.12, duration: 0.4 }}
          className="flex items-center gap-3 px-5 py-3.5 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(250,204,21,0.07), rgba(250,204,21,0.02))',
            border: '1px solid rgba(250,204,21,0.18)',
            boxShadow: '0 0 30px rgba(250,204,21,0.04)',
          }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: 'rgba(250,204,21,0.1)' }}>⚽</div>
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-white leading-tight">
              {matchContext.homeTeam} <span className="text-zinc-500 font-normal">vs</span> {matchContext.awayTeam}
            </p>
            <p className="text-[11px] text-zinc-500 truncate mt-0.5">
              {matchContext.stadium}{matchContext.kickoffTime ? ` · ${matchContext.kickoffTime}` : ''}{matchContext.city ? ` · ${matchContext.city}` : ''}
            </p>
          </div>
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
        </motion.div>
      )}

      {/* ── Action grid ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.45 }}
        className="grid grid-cols-3 gap-2.5 w-full max-w-sm"
      >
        {ACTIONS.map((action, i) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 + i * 0.05 }}
            whileHover={{ y: -4, scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(action.prompt)}
            className="group relative flex flex-col items-center gap-2.5 py-5 px-2 rounded-2xl text-center overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
            onMouseEnter={(e) => {
              const el = e.currentTarget
              el.style.borderColor = `${action.color}35`
              el.style.background = 'rgba(255,255,255,0.04)'
              el.style.boxShadow = `0 8px 30px ${action.color}12, inset 0 1px 0 ${action.color}15`
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              el.style.borderColor = 'rgba(255,255,255,0.07)'
              el.style.background = 'rgba(255,255,255,0.025)'
              el.style.boxShadow = 'none'
            }}
          >
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-8 opacity-0 group-hover:opacity-100 transition-opacity blur-2xl rounded-full pointer-events-none"
              style={{ background: action.color }}
            />
            <span className="text-[28px] leading-none relative z-10">{action.icon}</span>
            <div className="relative z-10">
              <p className="text-[12px] font-bold text-zinc-200 leading-tight">{action.label}</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">{action.sub}</p>
            </div>
          </motion.button>
        ))}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="text-[12px] text-zinc-700 text-center"
      >
        Ou tapez votre demande dans la zone de texte ci-dessous
      </motion.p>
    </div>
  )
}
