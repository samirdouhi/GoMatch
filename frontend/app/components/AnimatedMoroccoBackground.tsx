// src/components/AnimatedMoroccoBackground.tsx
"use client";

import { motion } from "framer-motion";

export default function AnimatedMoroccoBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-neutral-950 to-rose-900 opacity-95" />
      <motion.div
        className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl"
        animate={{ x: [0, 30, -20, 0], y: [0, 20, -10, 0], scale: [1, 1.15, 0.95, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-24 -right-24 h-96 w-96 rounded-full bg-rose-500/20 blur-3xl"
        animate={{ x: [0, -25, 15, 0], y: [0, 25, -15, 0], scale: [1, 1.1, 0.98, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-28 left-1/3 h-[28rem] w-[28rem] rounded-full bg-white/10 blur-3xl"
        animate={{ y: [0, -30, 20, 0], scale: [1, 1.08, 0.98, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.10),transparent_55%)]" />
    </div>
  );
}