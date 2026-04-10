"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import {
  Clock,
  Coffee,
  Utensils,
  ShoppingBag,
  Music,
  MapPin,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type PlanKey = "30" | "60" | "night";

export function MatchPlansSection() {
  const [selected, setSelected] = useState<PlanKey>("30");

  const plans = useMemo(
    () => ({
      "30": {
        title: "30 minutes",
        subtitle: "Rapide & efficace",
        icon: Coffee,
        items: [
          "Café proche du stade",
          "Snack local",
          "Souvenirs express",
        ],
        tip: "Parfait si tu es pressé avant ou après le match.",
      },
      "60": {
        title: "1 heure",
        subtitle: "Découvrir sans stress",
        icon: Utensils,
        items: [
          "Restaurant recommandé",
          "Balade culturelle courte",
          "Pause détente",
        ],
        tip: "Le bon équilibre entre match et découverte locale.",
      },
      night: {
        title: "Soirée complète",
        subtitle: "Vivre l’expérience locale",
        icon: Music,
        items: [
          "Dîner typique marocain",
          "Ambiance & fan zones",
          "Artisanat et marchés",
        ],
        tip: "L’expérience complète autour du stade.",
      },
    }),
    []
  );

  const current = plans[selected];
  const Icon = current.icon;

  return (
    <section
      id="match-plans"
      className="relative overflow-hidden py-20 sm:py-28 bg-[#0A0A0A]"
    >
      {/* --- BACKGROUND ANIMÉ (FILET NÉON MULTICOLORE) --- */}
      <div className="absolute inset-0 z-0">
        {/* Grille de base */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, #333 1px, transparent 1px),
              linear-gradient(to bottom, #333 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
        
        {/* Filets de néon animés (Orange, Rouge, Vert) */}
        <motion.div 
          animate={{ 
            opacity: [0.1, 0.3, 0.1],
            background: [
              "radial-gradient(circle at 20% 30%, rgba(249, 115, 22, 0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 70%, rgba(239, 68, 68, 0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.15) 0%, transparent 50%)"
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0"
        />

        {/* Effet de balayage néon sur la grille */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(250,204,21,0.05)_50%,transparent_100%)] w-full h-[200%] animate-[scan_10s_linear_infinite]" />
      </div>

      <div className="container relative z-10 mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-yellow-500 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            Avant & Après match • Rabat
          </div>

          <h2 className="mt-8 text-4xl font-black italic text-white sm:text-5xl lg:text-6xl uppercase leading-tight">
            Des plans simples <br className="hidden sm:block" />
            autour du <span className="text-yellow-400 text-glow-yellow">stade</span>
          </h2>

          <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Choisis ton temps disponible et découvre quoi faire avant ou après le
            match, sans perdre de temps.
          </p>
        </motion.div>

        {/* Main card */}
        <div className="mx-auto mt-16 max-w-5xl">
          <div className="rounded-[2.5rem] border border-white/10 bg-[#0F0F0F]/80 p-6 backdrop-blur-2xl shadow-2xl sm:p-10 relative overflow-hidden">
            {/* Déco néon sur le bord de la carte */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-right from-transparent via-yellow-400/50 to-transparent" />

            {/* Tabs */}
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-gray-400">
                <Clock className="h-5 w-5 text-yellow-400" />
                Ton temps disponible
              </div>

              <div className="flex w-full gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5 sm:w-auto">
                {[
                  { key: "30", label: "30 min" },
                  { key: "60", label: "1h" },
                  { key: "night", label: "Soirée" },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setSelected(t.key as PlanKey)}
                    className={`h-11 flex-1 rounded-xl px-6 text-xs font-bold uppercase tracking-wide transition-all sm:flex-none ${
                      selected === t.key
                        ? "bg-yellow-400 text-black shadow-[0_0_20px_rgba(250,204,21,0.3)]"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Area */}
            <div className="mt-10 grid gap-6 lg:grid-cols-2 lg:gap-8">
              {/* Left Column: Plan Details */}
              <div className="rounded-[2rem] border border-white/5 bg-white/5 p-6 sm:p-8">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400/10 border border-yellow-400/20">
                    <Icon className="h-7 w-7 text-yellow-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-black italic text-white uppercase italic">
                      {current.title}
                    </div>
                    <div className="text-sm font-medium text-yellow-400/80 uppercase tracking-tighter">
                      {current.subtitle}
                    </div>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.ul
                    key={selected}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.3 }}
                    className="mt-8 space-y-4 text-base text-gray-300"
                  >
                    {current.items.map((item) => (
                      <li key={item} className="flex items-center gap-4 group">
                        <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                        <span className="group-hover:text-white transition-colors font-medium">{item}</span>
                      </li>
                    ))}
                  </motion.ul>
                </AnimatePresence>

                <div className="mt-8 rounded-2xl border border-yellow-400/10 bg-yellow-400/5 p-5">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-yellow-400">
                    <MapPin className="h-4 w-4" />
                    Astuce Pro
                  </div>
                  <div className="mt-3 text-sm leading-relaxed text-gray-400 italic">
                    {current.tip}
                  </div>
                </div>
              </div>

              {/* Right column: Categories Grid */}
              <div className="rounded-[2rem] border border-white/5 bg-[#080808] p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">
                    Exploration Locale
                  </div>
                  <p className="mt-3 text-sm text-gray-400 font-medium">
                    Plongez dans l&apos;effervescence de Rabat : cafés, artisans et traditions à deux pas du stade.
                  </p>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    {[
                      { icon: Coffee, label: "Cafés", color: "text-orange-400" },
                      { icon: ShoppingBag, label: "Artisans", color: "text-green-400" },
                      { icon: Utensils, label: "Restaurants", color: "text-red-400" },
                      { icon: Music, label: "Ambiance", color: "text-yellow-400" },
                    ].map((c) => (
                      <div
                        key={c.label}
                        className="group flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-4 transition-all hover:bg-white/[0.08] hover:border-white/10"
                      >
                        <c.icon className={`h-5 w-5 ${c.color}`} />
                        <span className="text-sm font-bold text-white uppercase tracking-tight">
                          {c.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-10">
                  <Button
                    className="h-14 w-full rounded-xl bg-red-600 px-10 text-white font-black uppercase italic tracking-widest hover:bg-red-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red-600/20"
                    onClick={() =>
                      document.getElementById("comment-ca-marche")?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    Découvrir l&apos;itinéraire <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="mt-8 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-white/30"
          >
            Rabat Experience • 2030 Edition • Smart Planning
          </motion.div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes scan {
          from { transform: translateY(-50%); }
          to { transform: translateY(50%); }
        }
        .text-glow-yellow {
          text-shadow: 0 0 20px rgba(250, 204, 21, 0.4);
        }
      `}</style>
    </section>
  );
}