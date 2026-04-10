"use client";

import React from "react";

export function ThemeSurface({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-white text-slate-900 selection:bg-amber-500/30 selection:text-amber-950 dark:bg-[#020202] dark:text-zinc-100 dark:selection:text-amber-200">
      {/* BACKGROUND GLOBAL */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          contain: "paint",
        }}
      >
        {/* LIGHT MODE */}
        <div
          className="absolute inset-0 dark:hidden"
          style={{
            backgroundImage: `
              radial-gradient(900px 700px at 15% 10%, rgba(239,68,68,0.08), transparent 60%),
              radial-gradient(900px 700px at 90% 85%, rgba(22,163,74,0.06), transparent 60%),
              linear-gradient(to bottom, rgba(255,255,255,1), rgba(255,255,255,1))
            `,
          }}
        />

        {/* DARK MODE */}
        <div
          className="absolute inset-0 hidden dark:block"
          style={{
            backgroundImage: `
              radial-gradient(900px 700px at 15% 10%, rgba(245,158,11,0.12), transparent 60%),
              radial-gradient(900px 700px at 90% 85%, rgba(185,28,28,0.10), transparent 60%),
              radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.55) 100%)
            `,
          }}
        />

        {/* GRILLE LIGHT */}
        <div
          className="absolute inset-0 opacity-[0.025] dark:hidden"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(239,68,68,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(22,163,74,0.18) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        {/* GRILLE DARK */}
        <div
          className="absolute inset-0 hidden opacity-[0.05] dark:block"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(245,158,11,0.55) 1px, transparent 1px), linear-gradient(to bottom, rgba(245,158,11,0.55) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        {/* HALO LIGHT */}
        <div
          className="absolute inset-0 dark:hidden"
          style={{
            background:
              "radial-gradient(circle at center, transparent 0%, rgba(255,255,255,0.08) 100%)",
          }}
        />

        {/* HALO DARK */}
        <div
          className="absolute inset-0 hidden dark:block"
          style={{
            background:
              "radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.22) 100%)",
          }}
        />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 flex min-h-screen flex-col">{children}</div>
    </div>
  );
}