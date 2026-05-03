'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp } from 'lucide-react'

interface AssistantInputProps {
  onSend: (message: string) => void
  isLoading: boolean
  placeholder?: string
  quickReplies?: string[]
}

export function AssistantInput({ onSend, isLoading, placeholder, quickReplies }: AssistantInputProps) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!ref.current) return
    ref.current.style.height = 'auto'
    ref.current.style.height = Math.min(ref.current.scrollHeight, 100) + 'px'
  }, [value])

  function submit() {
    const t = value.trim()
    if (!t || isLoading) return
    onSend(t)
    setValue('')
    if (ref.current) ref.current.style.height = 'auto'
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
  }

  const canSend = !!value.trim() && !isLoading

  return (
    <div
      className="flex-shrink-0 px-4 pb-4 pt-2"
      style={{ background: 'rgba(6,6,10,0.97)', backdropFilter: 'blur(20px)' }}
    >
      {/* Quick replies */}
      <AnimatePresence>
        {quickReplies && quickReplies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-1.5 mb-2.5 overflow-hidden"
          >
            {quickReplies.map((r, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => onSend(r)}
                disabled={isLoading}
                className="text-[11px] font-medium px-3 py-1.5 rounded-xl border transition-all disabled:opacity-40"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#71717a' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(250,204,21,0.35)'; e.currentTarget.style.color = '#facc15'; e.currentTarget.style.background = 'rgba(250,204,21,0.06)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#71717a'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
              >
                {r}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input row */}
      <div
        className="flex items-end gap-2.5 px-3.5 py-2.5 rounded-2xl transition-all duration-200"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: focused ? '1px solid rgba(250,204,21,0.4)' : '1px solid rgba(255,255,255,0.08)',
          boxShadow: focused ? '0 0 0 3px rgba(250,204,21,0.07), 0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.2)',
        }}
      >
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={isLoading}
          placeholder={placeholder ?? 'Café, restaurant, fan zone, programme…'}
          rows={1}
          className="flex-1 bg-transparent text-[14px] text-white placeholder-zinc-600 resize-none focus:outline-none leading-relaxed disabled:opacity-50"
          style={{ minHeight: '22px', maxHeight: '100px', scrollbarWidth: 'none' }}
        />
        <motion.button
          onClick={submit}
          disabled={!canSend}
          whileTap={canSend ? { scale: 0.85 } : {}}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200"
          style={{
            background: canSend ? 'linear-gradient(135deg, #facc15, #fb923c)' : 'rgba(255,255,255,0.05)',
            color: canSend ? '#000' : '#3f3f46',
            boxShadow: canSend ? '0 4px 16px rgba(250,204,21,0.35)' : 'none',
          }}
        >
          {isLoading
            ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin opacity-60" />
            : <ArrowUp className="w-4 h-4" />}
        </motion.button>
      </div>
    </div>
  )
}
