"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle, MapPin, ShieldCheck, Ticket,
  Mail, ChevronRight, MessageSquare, Search, X,
} from "lucide-react";

/* ─── Animated Morocco/Football Background ─── */
function WowBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* Zellige star tiling */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cpolygon points='40,4 47.6,24.3 69.5,24.3 52.6,39.2 58.8,59.7 40,46.8 21.2,59.7 27.4,39.2 10.5,24.3 32.4,24.3' fill='none' stroke='%23facc15' stroke-width='0.8'/%3E%3C/svg%3E")`,
          backgroundSize: "80px 80px",
        }}
      />
      {/* Morocco flag color glows */}
      <div className="absolute -top-32 -left-16 h-[480px] w-[480px] rounded-full bg-[#c1121f]/12 blur-[130px]" />
      <div className="absolute -bottom-32 -right-16 h-[480px] w-[480px] rounded-full bg-[#006233]/12 blur-[130px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-[55%] rounded-full bg-[#facc15]/5 blur-[80px]" />
      {/* Stadium floodlights */}
      <motion.div
        className="absolute bottom-0 left-[10%] w-1 h-[75%] origin-bottom"
        style={{ background: "linear-gradient(to top, rgba(250,204,21,0.22), transparent)", filter: "blur(14px)", transform: "rotate(-10deg)" }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 right-[10%] w-1 h-[75%] origin-bottom"
        style={{ background: "linear-gradient(to top, rgba(250,204,21,0.22), transparent)", filter: "blur(14px)", transform: "rotate(10deg)" }}
        animate={{ opacity: [1, 0.6, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Floating football hexagons */}
      {[
        { x: "6%",  y: "10%", sz: 42, delay: 0,   r: 15 },
        { x: "90%", y: "16%", sz: 32, delay: 1.8,  r: -20 },
        { x: "12%", y: "70%", sz: 26, delay: 3,    r: 40 },
        { x: "85%", y: "65%", sz: 38, delay: 0.7,  r: -55 },
        { x: "50%", y: "88%", sz: 30, delay: 2.2,  r: 10 },
        { x: "32%", y: "4%",  sz: 22, delay: 1.2,  r: -30 },
      ].map((h, i) => (
        <motion.div key={i} className="absolute text-white/[0.06]" style={{ left: h.x, top: h.y }}
          animate={{ y: [0, -16, 0], rotate: [h.r, h.r + 180, h.r + 360], opacity: [0.04, 0.09, 0.04] }}
          transition={{ duration: 8 + i * 1.5, repeat: Infinity, delay: h.delay, ease: "easeInOut" }}>
          <svg width={h.sz} height={h.sz} viewBox="0 0 40 40" fill="none">
            <polygon points="20,1 36,11 36,29 20,39 4,29 4,11" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.25" />
          </svg>
        </motion.div>
      ))}
      {/* Scan line */}
      <motion.div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-[#facc15]/12 to-transparent"
        animate={{ top: ["0%", "100%"] }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }} />
      {/* Morocco crescent watermark */}
      <div className="absolute top-6 right-6 opacity-[0.06]">
        <svg width="70" height="70" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="38" stroke="#c1121f" strokeWidth="3" />
          <circle cx="62" cy="50" r="28" fill="#030305" />
          <polygon points="75,22 78.5,31.5 88,32 81,38.5 83.5,48 75,43 66.5,48 69,38.5 62,32 71.5,31.5" fill="#facc15" />
        </svg>
      </div>
    </div>
  );
}

const faqs = [
  { q: "Comment l'app choisit les commerces recommandés ?", a: "Notre algorithme 2030 analyse votre géolocalisation en temps réel, le flux des supporters et vos préférences culturelles pour prioriser les artisans et coopératives locales." },
  { q: "Je suis commerçant : comment apparaître dans l'application ?", a: "Accédez à l'espace 'Partenaires', complétez votre profil numérique et soumettez votre certification artisanale pour validation par nos services." },
  { q: "Mes données sont-elles protégées ?", a: "Toutes les transactions et données de profil sont chiffrées de bout en bout via notre architecture micro-services sécurisée." },
  { q: "Que faire si je ne vois pas ma ville ?", a: "Nous déployons actuellement le réseau sur les villes hôtes. Rabat est notre zone pilote, Casablanca et Marrakech suivront selon le calendrier officiel." },
  { q: "Comment fonctionne le mode 'Avant/Après match' ?", a: "L'assistant IA détecte le timing de votre match et propose automatiquement des lieux proches du stade adaptés à votre créneau disponible — café, restaurant, artisanat." },
];

export default function AidePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const filteredFaqs = useMemo(() =>
    faqs.filter(f =>
      f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(searchQuery.toLowerCase())
    ), [searchQuery]);

  return (
    <main className="relative min-h-screen overflow-hidden py-16 lg:py-24">
      <WowBackground />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6">

        {/* ─── Hero ─── */}
        <header className="flex flex-col gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3">
            <div className="h-px w-10 bg-[#facc15]/60" />
            <HelpCircle className="h-4 w-4 text-[#facc15] animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#facc15]">Centre d&apos;aide GoMatch</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-none text-white">
            Besoin d&apos;une{" "}
            <span className="bg-gradient-to-r from-[#facc15] via-[#f97316] to-[#facc15] bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient_4s_linear_infinite]">
              Assistance ?
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
            className="max-w-2xl text-lg text-white/50 leading-relaxed">
            Notre équipe et notre IA sont là pour vous accompagner dans l&apos;expérience Maroc 2030.
          </motion.p>

          {/* Search */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="relative max-w-lg mt-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="text"
              placeholder="Rechercher dans l'aide..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#facc15]/40 focus:ring-1 focus:ring-[#facc15]/15 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-lg transition-colors">
                <X className="h-3 w-3 text-white/40" />
              </button>
            )}
          </motion.div>

          {/* CTAs */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
            className="flex flex-wrap gap-3 mt-1">
            <Link href="/contact"
              className="flex items-center gap-2.5 rounded-xl bg-[#facc15] px-6 py-3 text-[11px] font-black uppercase tracking-widest text-black hover:scale-105 transition-all shadow-lg shadow-[#facc15]/25">
              <Mail className="h-3.5 w-3.5" /> Contacter le support
            </Link>
            <Link href="/a-propos"
              className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-[11px] font-black uppercase tracking-widest text-white/70 hover:border-[#facc15]/30 hover:text-[#facc15] transition-all">
              Vision 2030 →
            </Link>
          </motion.div>
        </header>

        {/* ─── Quick nav cards ─── */}
        <section className="mt-16 grid gap-5 md:grid-cols-3">
          {[
            { icon: MapPin,      title: "Découvrir",  text: "Explorez les trésors cachés du Maroc via la carte interactive.",          href: "/explore",   color: "text-[#facc15]", glow: "hover:border-[#facc15]/30 hover:bg-[#facc15]/5" },
            { icon: Ticket,      title: "Mode Match",  text: "Synchronisez votre agenda supporter avec les commerces locaux.",          href: "/matches",   color: "text-red-400",    glow: "hover:border-red-500/30 hover:bg-red-500/5" },
            { icon: ShieldCheck, title: "Sécurité",    text: "Protocoles de protection des données et guide de bonne conduite.",        href: "/a-propos",  color: "text-emerald-400", glow: "hover:border-emerald-500/30 hover:bg-emerald-500/5" },
          ].map((card, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i + 0.4 }}>
              <Link href={card.href}
                className={`group flex flex-col gap-5 rounded-3xl border border-white/8 bg-white/[0.03] p-7 backdrop-blur-sm transition-all ${card.glow}`}>
                <card.icon className={`h-7 w-7 ${card.color} transition-transform group-hover:scale-110`} />
                <div>
                  <h2 className="text-base font-black text-white uppercase tracking-tighter mb-2">{card.title}</h2>
                  <p className="text-white/40 text-sm leading-relaxed">{card.text}</p>
                </div>
                <ChevronRight className={`h-4 w-4 ${card.color} self-end opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1`} />
              </Link>
            </motion.div>
          ))}
        </section>

        {/* ─── FAQ ─── */}
        <section className="mt-20">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/8 to-transparent" />
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[#facc15]" />
              <h2 className="text-xl font-black uppercase tracking-tighter text-[#facc15] italic">FAQ</h2>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/8 to-transparent" />
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((item) => (
                  <motion.div key={item.q} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} layout>
                    <FaqItem question={item.q} answer={item.a} />
                  </motion.div>
                ))
              ) : (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-center text-white/30 py-12 italic text-sm">
                  Aucun résultat pour &ldquo;{searchQuery}&rdquo;
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ─── Footer ─── */}
        <footer className="mt-20 text-center">
          <p className="text-[10px] font-bold text-white/15 uppercase tracking-[0.5em]">
            GoMatch 2030 — Votre guide de confiance pour une expérience authentique au Maroc
          </p>
        </footer>
      </div>

      <style jsx global>{`
        @keyframes gradient {
          0%   { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </main>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-2xl border transition-all duration-400 ${open ? "border-[#facc15]/40 bg-[#facc15]/[0.04] shadow-[0_0_30px_rgba(250,204,21,0.08)]" : "border-white/6 bg-white/[0.02]"}`}>
      <button onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-5 text-left">
        <span className={`text-sm font-bold tracking-tight ${open ? "text-[#facc15]" : "text-white/75"}`}>
          {question}
        </span>
        <ChevronRight className={`h-4 w-4 shrink-0 transition-transform duration-300 ${open ? "rotate-90 text-[#facc15]" : "text-white/25"}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: "easeInOut" }} className="overflow-hidden">
            <div className="p-5 pt-0 text-sm text-white/45 leading-relaxed border-t border-white/5">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
