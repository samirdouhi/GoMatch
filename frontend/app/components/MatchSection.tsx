"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, useInView, type Variants } from "framer-motion";
import {
  Calendar, MapPin, Clock, Ticket, ArrowRight,
  ChevronLeft, ChevronRight, Trophy, Star, Zap,
} from "lucide-react";
import { type Match, getUpcomingMatches, getFlagUrl } from "@/lib/matchesApi";

/* ─── Fallback: 3 important WC 2030 matches at Moroccan venues ─── */
const FALLBACK_MATCHES: Match[] = [
  {
    id: "wc2030-ma-es",
    equipe1: "Maroc", equipe2: "Espagne",
    drapeau1: "🇲🇦", drapeau2: "🇪🇸",
    crestEquipe1: "", crestEquipe2: "",
    codeEquipe1: "MA", codeEquipe2: "ES",
    date: "2030-06-12", heure: "20:00",
    stade: "Grand Stade de Rabat", ville: "Rabat",
    phase: "Groupes", groupe: "A", status: "SCHEDULED",
    competitionCode: "WC", competitionName: "FIFA World Cup 2030",
  },
  {
    id: "wc2030-fr-br",
    equipe1: "France", equipe2: "Brésil",
    drapeau1: "🇫🇷", drapeau2: "🇧🇷",
    crestEquipe1: "", crestEquipe2: "",
    codeEquipe1: "FR", codeEquipe2: "BR",
    date: "2030-06-16", heure: "18:00",
    stade: "Grand Stade de Casablanca", ville: "Casablanca",
    phase: "Groupes", groupe: "B", status: "SCHEDULED",
    competitionCode: "WC", competitionName: "FIFA World Cup 2030",
  },
  {
    id: "wc2030-ar-pt",
    equipe1: "Argentine", equipe2: "Portugal",
    drapeau1: "🇦🇷", drapeau2: "🇵🇹",
    crestEquipe1: "", crestEquipe2: "",
    codeEquipe1: "AR", codeEquipe2: "PT",
    date: "2030-06-20", heure: "21:00",
    stade: "Stade de Marrakech", ville: "Marrakech",
    phase: "Groupes", groupe: "C", status: "SCHEDULED",
    competitionCode: "WC", competitionName: "FIFA World Cup 2030",
  },
];

function daysUntil(dateStr: string, heureStr: string, nowMs: number) {
  const d = new Date(`${dateStr}T${heureStr}:00`);
  return Math.ceil((d.getTime() - nowMs) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(dateStr));
}

const FloatingIcon = ({ children, x, y, delay, color }: { children: React.ReactNode; x: string; y: string; delay: number; color: string }) => (
  <motion.div className={`absolute opacity-10 text-${color}-500`} style={{ left: x, top: y }}
    animate={{ opacity: [0.05, 0.15, 0.05], scale: [1, 1.1, 1], y: [0, -15, 0] }}
    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay }}>
    {children}
  </motion.div>
);

export function MatchSection() {
  const [matches, setMatches] = useState<Match[]>(FALLBACK_MATCHES);
  const [index, setIndex]     = useState(0);
  const [nowMs, setNowMs]     = useState(() => Date.now());

  useEffect(() => {
    getUpcomingMatches()
      .then(data => { if (data.length > 0) setMatches(data.slice(0, 3)); })
      .catch(() => {});
    const tick = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(tick);
  }, []);

  const current = matches[index] ?? FALLBACK_MATCHES[0];
  const jMinus  = daysUntil(current.date, current.heure, nowMs);
  const jText   = jMinus > 0 ? `J-${jMinus}` : jMinus === 0 ? "Aujourd'hui" : "Terminé";

  const prev = () => setIndex(i => (i - 1 + matches.length) % matches.length);
  const next = () => setIndex(i => (i + 1) % matches.length);

  const revealRef = useRef<HTMLDivElement | null>(null);
  const inView    = useInView(revealRef, { amount: 0.25, once: true });

  const wrap: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.08 } },
  };
  const fadeUp: Variants   = { hidden: { opacity: 0, y: 18, filter: "blur(8px)" },   show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.65, ease: "easeOut" } } };
  const fadeRight: Variants = { hidden: { opacity: 0, x: 22, filter: "blur(8px)" }, show: { opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0.65, ease: "easeOut" } } };

  return (
    <section id="matches" className="relative min-h-[100svh] overflow-hidden bg-[#0A0A0A]">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:60px_60px]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.06)_0%,transparent_70%)]" />
        <FloatingIcon x="10%" y="20%" delay={0} color="yellow"><Trophy size={60} strokeWidth={1} /></FloatingIcon>
        <FloatingIcon x="85%" y="15%" delay={1} color="red"><Star size={50} strokeWidth={1} /></FloatingIcon>
        <FloatingIcon x="5%"  y="70%" delay={2} color="red"><Zap size={55} strokeWidth={1} /></FloatingIcon>
        <FloatingIcon x="90%" y="75%" delay={3} color="yellow"><Trophy size={45} strokeWidth={1} /></FloatingIcon>
        <FloatingIcon x="50%" y="85%" delay={1.5} color="yellow"><Star size={40} strokeWidth={1} /></FloatingIcon>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-16 sm:py-24">
        <div ref={revealRef}>
          <motion.div variants={wrap} initial="hidden" animate={inView ? "show" : "hidden"}
            className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">

            {/* LEFT */}
            <motion.div variants={fadeUp} className="max-w-2xl">
              <motion.div variants={fadeUp}
                className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-yellow-500">
                <Ticket className="h-3.5 w-3.5" /> Maroc • Coupe du Monde 2030
              </motion.div>

              <motion.h2 variants={fadeUp}
                className="mt-6 text-5xl font-black italic leading-tight text-white sm:text-6xl lg:text-7xl uppercase">
                Matchs au <span className="text-yellow-400">Maroc</span>
              </motion.h2>

              <motion.p variants={fadeUp} className="mt-6 max-w-xl text-lg leading-relaxed text-gray-300">
                Suivez les matchs dans les stades marocains, puis découvrez quoi faire avant / après :
                cafés, restaurants, artisans et expériences locales.
              </motion.p>

              <motion.div variants={fadeUp}
                className="mt-8 inline-flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-tighter text-gray-400">Prochain match</span>
                  <span className="text-lg font-bold text-yellow-400">{jText}</span>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">{formatDate(current.date)}</span>
                  <span className="text-xs text-gray-400">{current.heure}</span>
                </div>
              </motion.div>

              <motion.div variants={fadeUp} className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link href="/assistant"
                  className="h-14 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-8 text-black font-bold hover:bg-yellow-500 transition-transform active:scale-95 uppercase">
                  Planifier ma journée <ArrowRight className="h-5 w-5" />
                </Link>
                <button
                  className="h-14 w-full sm:w-auto rounded-xl border border-white/20 bg-white/5 px-8 text-white font-bold hover:bg-white/10 backdrop-blur-sm uppercase"
                  onClick={() => document.getElementById("comment-ca-marche")?.scrollIntoView({ behavior: "smooth" })}>
                  Comment ça marche ?
                </button>
              </motion.div>
            </motion.div>

            {/* RIGHT — Match card */}
            <motion.div variants={fadeRight} className="w-full">
              <motion.div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-1 backdrop-blur-2xl shadow-2xl">
                <div className="rounded-[2.3rem] bg-[#0F0F0F]/90 p-6 sm:p-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">
                      FIFA World Cup 2030
                    </h3>
                    <div className="flex gap-2">
                      <button onClick={prev} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors">
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <button onClick={next} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors">
                        <ChevronRight className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-8 min-h-[240px]">
                    <AnimatePresence mode="wait">
                      <motion.div key={current.id}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}>

                        {/* Phase badge */}
                        <div className="inline-block rounded-lg bg-red-500/20 px-3 py-1 text-xs font-bold text-red-400 uppercase tracking-wider">
                          {current.phase}{current.groupe ? ` · Groupe ${current.groupe}` : ""}
                        </div>

                        {/* Teams VS */}
                        <div className="mt-6 flex items-center justify-between gap-3">
                          <TeamFlag code={current.codeEquipe1} emoji={current.drapeau1} name={current.equipe1} />
                          <div className="flex flex-col items-center gap-1 shrink-0">
                            <span className="text-xl font-black text-white/20 uppercase italic">vs</span>
                          </div>
                          <TeamFlag code={current.codeEquipe2} emoji={current.drapeau2} name={current.equipe2} />
                        </div>

                        {/* Match details */}
                        <div className="mt-7 space-y-3">
                          <div className="flex items-center gap-4 text-gray-300">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 shrink-0">
                              <Calendar className="h-4 w-4 text-yellow-400" />
                            </div>
                            <span className="font-medium text-sm">{formatDate(current.date)}</span>
                          </div>
                          <div className="flex items-center gap-4 text-gray-300">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 shrink-0">
                              <Clock className="h-4 w-4 text-yellow-400" />
                            </div>
                            <span className="font-medium text-sm">{current.heure}</span>
                          </div>
                          <div className="flex items-center gap-4 text-gray-300">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 shrink-0">
                              <MapPin className="h-4 w-4 text-yellow-400" />
                            </div>
                            <span className="font-medium text-sm">{current.stade} · {current.ville}</span>
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <div className="mt-8">
                    <Link href="/assistant"
                      className="flex items-center justify-center gap-2 w-full bg-red-500 font-bold text-white hover:bg-red-600 rounded-xl h-12 uppercase tracking-wide text-sm transition-colors">
                      Avant / Après match <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                  {/* Dots */}
                  <div className="mt-6 flex justify-center gap-2">
                    {matches.map((_, i) => (
                      <button key={i} onClick={() => setIndex(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? "w-8 bg-yellow-400" : "w-2 bg-white/20"}`} />
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

function TeamFlag({ code, emoji, name }: { code: string; emoji: string; name: string }) {
  const flagUrl = getFlagUrl(code);
  return (
    <div className="flex flex-col items-center gap-2 flex-1">
      {flagUrl ? (
        <div className="relative w-16 h-11 rounded-md overflow-hidden shadow-lg ring-1 ring-white/15">
          <Image src={flagUrl} alt={name} fill sizes="64px" className="object-cover" unoptimized={false} />
        </div>
      ) : (
        <span className="text-4xl leading-none">{emoji}</span>
      )}
      <span className="text-[11px] font-black text-white uppercase tracking-tight text-center leading-tight">
        {name}
      </span>
    </div>
  );
}
