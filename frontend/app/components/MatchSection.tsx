"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useInView,
  type Variants,
} from "framer-motion";
import {
  Calendar,
  MapPin,
  Clock,
  Ticket,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Star,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Match = {
  id: string;
  title: string;
  dateLabel: string;
  isoDate: string;
  time: string;
  venue: string;
  tag: string;
};

function daysUntilFromNow(targetISO: string, nowMs: number) {
  const targetMs = new Date(targetISO).getTime();
  const diffMs = targetMs - nowMs;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

// Icônes de fond flottantes avec animation néon
const FloatingIcon = ({ children, x, y, delay, color }: { children: React.ReactNode; x: string; y: string; delay: number; color: string }) => {
  return (
    <motion.div
      className={`absolute opacity-10 text-${color}-500`}
      style={{ left: x, top: y }}
      animate={{
        opacity: [0.05, 0.15, 0.05], // Effet de clignotement néon
        scale: [1, 1.1, 1],
        y: [0, -15, 0], // Flottaison lente
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
        delay: delay,
      }}
    >
      {children}
    </motion.div>
  );
};

export function MatchSection() {
  const matches: Match[] = useMemo(
    () => [
      {
        id: "rabat-01",
        title: "Maroc vs TBD",
        dateLabel: "12 juin 2030",
        isoDate: "2030-06-12T20:00:00+01:00",
        time: "20:00",
        venue: "Stade de Rabat",
        tag: "Ouverture",
      },
      {
        id: "rabat-02",
        title: "TBD vs TBD",
        dateLabel: "16 juin 2030",
        isoDate: "2030-06-16T18:00:00+01:00",
        time: "18:00",
        venue: "Stade de Rabat",
        tag: "Groupes",
      },
      {
        id: "rabat-03",
        title: "TBD vs TBD",
        dateLabel: "20 juin 2030",
        isoDate: "2030-06-20T21:00:00+01:00",
        time: "21:00",
        venue: "Stade de Rabat",
        tag: "Groupes",
      },
    ],
    []
  );

  const [index, setIndex] = useState(0);
  const current = matches[index];

  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const jMinus = useMemo(
    () => daysUntilFromNow(current.isoDate, nowMs),
    [current.isoDate, nowMs]
  );

  const jText =
    jMinus > 0 ? `J-${jMinus}` : jMinus === 0 ? "Aujourd’hui" : "Terminé";

  const prev = () => setIndex((i) => (i - 1 + matches.length) % matches.length);
  const next = () => setIndex((i) => (i + 1) % matches.length);

  const revealRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(revealRef, { amount: 0.25, once: true });

  const wrap: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.08 },
    },
  };

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 18, filter: "blur(8px)" },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.65, ease: "easeOut" },
    },
  };

  const fadeRight: Variants = {
    hidden: { opacity: 0, x: 22, filter: "blur(8px)" },
    show: {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      transition: { duration: 0.65, ease: "easeOut" },
    },
  };

  return (
    <section
      id="matches"
      className="relative min-h-[100svh] overflow-hidden bg-[#0A0A0A]" // Fond uni noir
    >
      {/* --- Éléments de fond (Néon & Icônes) --- */}
      <div className="absolute inset-0 z-0">
        {/* Lignes de grille discrètes (inchangées) */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:60px_60px]" />
        
        {/* Halo néon central (inchangé) */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.06)_0%,transparent_70%)]" />

        {/* Icônes flottantes avec animation néon (Nouveaux éléments) */}
        <FloatingIcon x="10%" y="20%" delay={0} color="yellow">
          <Trophy size={60} strokeWidth={1} />
        </FloatingIcon>
        <FloatingIcon x="85%" y="15%" delay={1} color="red">
          <Star size={50} strokeWidth={1} />
        </FloatingIcon>
        <FloatingIcon x="5%" y="70%" delay={2} color="red">
          <Zap size={55} strokeWidth={1} /> {/* Utilisation de Zap pour simuler un ballon/vitesse */}
        </FloatingIcon>
        <FloatingIcon x="90%" y="75%" delay={3} color="yellow">
          <Trophy size={45} strokeWidth={1} />
        </FloatingIcon>
        <FloatingIcon x="50%" y="85%" delay={1.5} color="yellow">
          <Star size={40} strokeWidth={1} />
        </FloatingIcon>
      </div>
      {/* --- Fin des éléments de fond --- */}

      <div className="relative z-10 container mx-auto px-6 py-16 sm:py-24">
        <div ref={revealRef}>
          <motion.div
            variants={wrap}
            initial="hidden"
            animate={inView ? "show" : "hidden"}
            className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16"
          >
            {/* LEFT SIDE (Inchangé) */}
            <motion.div variants={fadeUp} className="max-w-2xl">
              <motion.div
                variants={fadeUp}
                className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-yellow-500"
              >
                <Ticket className="h-3.5 w-3.5" />
                Rabat • Coupe du Monde 2030
              </motion.div>

              <motion.h2
                variants={fadeUp}
                className="mt-6 text-5xl font-black italic leading-tight text-white sm:text-6xl lg:text-7xl uppercase"
              >
                Matchs à <span className="text-yellow-400">Rabat</span>
              </motion.h2>

              <motion.p
                variants={fadeUp}
                className="mt-6 max-w-xl text-lg leading-relaxed text-gray-300"
              >
                Suivez les matchs à Rabat, puis découvrez quoi faire avant /
                après le match autour du stade : cafés, restaurants, artisans et
                expériences locales.
              </motion.p>

              {/* Countdown pill - Style Glassmorphism (Inchangé) */}
              <motion.div
                variants={fadeUp}
                className="mt-8 inline-flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
              >
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-tighter text-gray-400">Prochain match</span>
                  <span className="text-lg font-bold text-yellow-400">{jText}</span>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">{current.dateLabel}</span>
                  <span className="text-xs text-gray-400">{current.time}</span>
                </div>
              </motion.div>

              {/* Actions - Couleurs GOMATCH (Inchangé) */}
              <motion.div
                variants={fadeUp}
                className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
              >
                <Button
                  className="h-14 w-full rounded-xl bg-yellow-400 px-8 text-black font-bold hover:bg-yellow-500 transition-transform active:scale-95 sm:w-auto uppercase"
                  onClick={() => document.getElementById("comment-ca-marche")?.scrollIntoView({ behavior: "smooth" })}
                >
                  Planifier ma journée <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                <Button
                  variant="outline"
                  className="h-14 w-full rounded-xl border-white/20 bg-white/5 px-8 text-white font-bold hover:bg-white/10 backdrop-blur-sm sm:w-auto uppercase"
                  onClick={() => document.getElementById("comment-ca-marche")?.scrollIntoView({ behavior: "smooth" })}
                >
                  Comment ça marche ?
                </Button>
              </motion.div>
            </motion.div>

            {/* RIGHT SIDE (Card Match - Inchangé) */}
            <motion.div variants={fadeRight} className="w-full">
              <motion.div
                className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-1 backdrop-blur-2xl shadow-2xl"
              >
                <div className="rounded-[2.3rem] bg-[#0F0F0F]/90 p-6 sm:p-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Calendrier Rabat</h3>
                    <div className="flex gap-2">
                      <button onClick={prev} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors">
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <button onClick={next} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors">
                        <ChevronRight className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-8 min-h-[220px]">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={current.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="inline-block rounded-lg bg-red-500/20 px-3 py-1 text-xs font-bold text-red-500 uppercase tracking-wider">
                          {current.tag}
                        </div>
                        
                        <div className="mt-4 text-3xl font-black text-white sm:text-4xl uppercase italic">
                          {current.title}
                        </div>

                        <div className="mt-8 space-y-4">
                          <div className="flex items-center gap-4 text-gray-300">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
                              <Calendar className="h-5 w-5 text-yellow-400" />
                            </div>
                            <span className="font-medium">{current.dateLabel}</span>
                          </div>
                          <div className="flex items-center gap-4 text-gray-300">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
                              <Clock className="h-5 w-5 text-yellow-400" />
                            </div>
                            <span className="font-medium">{current.time}</span>
                          </div>
                          <div className="flex items-center gap-4 text-gray-300">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
                              <MapPin className="h-5 w-5 text-yellow-400" />
                            </div>
                            <span className="font-medium">{current.venue}</span>
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <div className="mt-10 flex flex-col gap-3">
                    <Button className="w-full bg-red-500 font-bold text-white hover:bg-red-600 rounded-xl h-12 uppercase tracking-wide">
                      Avant / Après match
                    </Button>
                  </div>

                  <div className="mt-8 flex justify-center gap-2">
                    {matches.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          i === index ? "w-8 bg-yellow-400" : "w-2 bg-white/20"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}



