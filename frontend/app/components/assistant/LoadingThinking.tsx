'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export function LoadingThinking() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3"
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{
          background: 'linear-gradient(135deg, rgba(250,204,21,0.2), rgba(251,146,60,0.1))',
          border: '1px solid rgba(250,204,21,0.2)',
          boxShadow: '0 0 16px rgba(250,204,21,0.1)',
        }}
      >
        <Sparkles className="w-4 h-4 text-yellow-400" />
      </div>

      {/* Bubble */}
      <div
        className="px-5 py-4 rounded-2xl rounded-tl-sm max-w-xs"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderLeft: '2px solid rgba(250,204,21,0.3)',
        }}
      >
        {/* Dots */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-1.5">
            {[0, 160, 320].map((delay) => (
              <motion.div
                key={delay}
                className="w-2 h-2 rounded-full"
                style={{ background: '#facc15' }}
                animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: delay / 1000, ease: 'easeInOut' }}
              />
            ))}
          </div>
          <span className="text-[11px] text-zinc-500 font-medium">GoMatch analyse votre demande…</span>
        </div>

        {/* Skeleton */}
        <div className="space-y-2">
          {[48, 36, 24].map((w, i) => (
            <motion.div
              key={w}
              className="h-2 rounded-full"
              style={{ width: `${w * 2.5}px`, background: 'rgba(255,255,255,0.06)' }}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
