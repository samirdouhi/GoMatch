"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function FloatingAssistantButton() {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-6 right-6 z-[60]"
    >
      <Link
        href="/assistant"
        aria-label="Ouvrir l’assistant"
        className="
          group relative
          flex h-16 w-16 items-center justify-center
          rounded-2xl border border-amber-500/30
          bg-black/80 backdrop-blur-xl
          transition-all duration-300
          hover:border-amber-400
          hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]
        "
      >
        {/* Effet de Halo Pulsant en arrière-plan */}
        <span className="absolute inset-0 -z-10 animate-ping rounded-2xl bg-amber-500/20 duration-[2000ms]" />
        
        {/* Lueur interne style Néon */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

        <Sparkles 
          className="h-7 w-7 text-amber-500 transition-all duration-300 
                     group-hover:scale-110 group-hover:text-amber-400 
                     group-hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" 
        />

        {/* Bordure brillante subtile */}
        <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 group-hover:ring-amber-500/50" />
      </Link>

      {/* Tooltip futuriste (Optionnel) */}
      <div className="absolute bottom-full right-0 mb-4 scale-0 opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100">
        <div className="rounded-lg border border-white/10 bg-black/90 px-3 py-1.5 text-xs font-bold tracking-widest text-amber-500 backdrop-blur-md">
          IA ASSISTANT
        </div>
      </div>
    </motion.div>
  );
}
