"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Globe, Handshake, MapPinned, Cpu, Shield,
  ArrowRight, Sparkles, Award, Trophy, Users, Calendar,
} from "lucide-react";

/* ─── Animated Morocco/Football Background ─── */
function WowBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cpolygon points='40,4 47.6,24.3 69.5,24.3 52.6,39.2 58.8,59.7 40,46.8 21.2,59.7 27.4,39.2 10.5,24.3 32.4,24.3' fill='none' stroke='%23facc15' stroke-width='0.8'/%3E%3C/svg%3E")`,
          backgroundSize: "80px 80px",
        }}
      />
      <div className="absolute -top-32 left-[5%] h-[500px] w-[500px] rounded-full bg-[#c1121f]/10 blur-[130px]" />
      <div className="absolute bottom-0 right-[5%] h-[500px] w-[500px] rounded-full bg-[#006233]/10 blur-[130px]" />
      <div className="absolute top-[40%] left-[45%] h-48 w-[40%] rounded-full bg-[#facc15]/5 blur-[80px]" />
      <motion.div
        className="absolute bottom-0 left-[8%] w-1 h-[80%] origin-bottom"
        style={{ background: "linear-gradient(to top, rgba(250,204,21,0.2), transparent)", filter: "blur(14px)", transform: "rotate(-10deg)" }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 right-[8%] w-1 h-[80%] origin-bottom"
        style={{ background: "linear-gradient(to top, rgba(250,204,21,0.2), transparent)", filter: "blur(14px)", transform: "rotate(10deg)" }}
        animate={{ opacity: [1, 0.6, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      {[
        { x: "4%",  y: "8%",  sz: 44, delay: 0,   r: 20 },
        { x: "92%", y: "12%", sz: 30, delay: 1.5,  r: -25 },
        { x: "8%",  y: "75%", sz: 28, delay: 2.8,  r: 35 },
        { x: "88%", y: "70%", sz: 36, delay: 0.8,  r: -50 },
        { x: "50%", y: "90%", sz: 24, delay: 2,    r: 15 },
        { x: "28%", y: "3%",  sz: 20, delay: 1,    r: -40 },
      ].map((h, i) => (
        <motion.div key={i} className="absolute text-white/[0.06]" style={{ left: h.x, top: h.y }}
          animate={{ y: [0, -14, 0], rotate: [h.r, h.r + 180, h.r + 360], opacity: [0.04, 0.09, 0.04] }}
          transition={{ duration: 9 + i * 1.4, repeat: Infinity, delay: h.delay, ease: "easeInOut" }}>
          <svg width={h.sz} height={h.sz} viewBox="0 0 40 40" fill="none">
            <polygon points="20,1 36,11 36,29 20,39 4,29 4,11" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.25" />
          </svg>
        </motion.div>
      ))}
      <motion.div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-[#facc15]/10 to-transparent"
        animate={{ top: ["0%", "100%"] }} transition={{ duration: 14, repeat: Infinity, ease: "linear" }} />
      {/* Football stadium silhouette (bottom) */}
      <div className="absolute bottom-0 inset-x-0 h-32 opacity-[0.04]"
        style={{ background: "linear-gradient(to top, rgba(250,204,21,0.3), transparent)" }} />
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

const STATS = [
  { icon: Users,    value: "32",    unit: "équipes",           label: "Nations en compétition",       color: "text-[#facc15]"  },
  { icon: MapPinned, value: "6",   unit: "stades",             label: "Stades marocains FIFA",         color: "text-red-400"    },
  { icon: Calendar, value: "48",   unit: "jours",              label: "De fête footballistique",       color: "text-emerald-400"},
  { icon: Globe,    value: "5B",   unit: "téléspectateurs",    label: "Audience mondiale estimée",     color: "text-blue-400"   },
];

const PILLARS = [
  { icon: Cpu,      title: "Algorithmes",  desc: "Moteur de recommandation basé sur le timing des matchs et la distance." },
  { icon: Shield,   title: "Confiance",    desc: "Architecture micro-services sécurisée pour toutes vos données." },
  { icon: Globe,    title: "Impact",       desc: "Valeur réinjectée directement dans l'économie de proximité locale." },
];

export default function AProposPage() {
  return (
    <main className="relative min-h-screen overflow-hidden py-16 lg:py-24">
      <WowBackground />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6">

        {/* ─── Hero ─── */}
        <header className="flex flex-col gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3">
            <div className="h-px w-10 bg-[#facc15]/60" />
            <Sparkles className="h-4 w-4 text-[#facc15] animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#facc15]">Vision Globale 2030</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-none text-white">
            L&apos;Héritage Marocain
            <br />
            <span className="bg-gradient-to-r from-[#facc15] via-[#ef4444] to-[#facc15] bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient_5s_linear_infinite]">
              Propulsé par 2030
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="max-w-2xl text-lg text-white/50 leading-relaxed">
            Bien plus qu&apos;une application — une passerelle intelligente entre les supporters du monde entier
            et l&apos;âme artisanale du Maroc. Nous redéfinissons l&apos;accueil à travers la technologie.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-3">
            <Link href="/aide"
              className="group flex items-center gap-2.5 rounded-xl bg-[#facc15] px-6 py-3 text-[11px] font-black uppercase tracking-widest text-black hover:scale-105 transition-all shadow-lg shadow-[#facc15]/25">
              Centre d&apos;aide <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/contact"
              className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-[11px] font-black uppercase tracking-widest text-white/70 hover:border-[#facc15]/30 hover:text-[#facc15] transition-all">
              Nous écrire
            </Link>
          </motion.div>
        </header>

        {/* ─── Stats row ─── */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, staggerChildren: 0.1 }}
          className="mt-20 grid grid-cols-2 gap-4 md:grid-cols-4"
        >
          {STATS.map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="group relative rounded-3xl border border-white/6 bg-white/[0.03] p-6 backdrop-blur-sm overflow-hidden hover:border-white/12 transition-all">
              <s.icon className={`h-5 w-5 ${s.color} mb-4 group-hover:scale-110 transition-transform`} />
              <div className={`text-3xl md:text-4xl font-black ${s.color} tracking-tighter`}>{s.value}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-white/60 mt-0.5">{s.unit}</div>
              <div className="text-xs text-white/30 mt-2 leading-snug">{s.label}</div>
            </motion.div>
          ))}
        </motion.section>

        {/* ─── Mission & Deployment ─── */}
        <section className="mt-8 grid gap-5 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="group relative rounded-[2rem] border border-[#facc15]/12 bg-black/30 p-8 backdrop-blur-xl overflow-hidden hover:border-[#facc15]/25 transition-all">
            <div className="absolute top-0 right-0 p-8 opacity-8 group-hover:opacity-15 transition-opacity">
              <Handshake size={80} className="text-[#facc15]" />
            </div>
            <div className="flex items-center gap-3 text-[#facc15] mb-6">
              <Award className="h-5 w-5" />
              <h2 className="text-lg font-black uppercase tracking-tighter">Notre Mission</h2>
            </div>
            <ul className="space-y-4">
              {[
                "Mettre en lumière les artisans et coopératives locales",
                "Optimiser le flux des supporters via l'IA contextuelle",
                "Préserver et digitaliser le patrimoine culturel marocain",
              ].map((item, i) => (
                <li key={i} className="flex gap-3 text-white/60 text-sm leading-relaxed">
                  <span className="text-[#facc15] font-black mt-0.5">▸</span>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="rounded-[2rem] border border-white/6 bg-white/[0.03] p-8 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-6">
              <MapPinned className="h-5 w-5 text-[#facc15]" />
              <h2 className="text-lg font-black uppercase tracking-tighter text-white">Déploiement Piloté</h2>
            </div>
            <p className="text-white/45 text-sm leading-relaxed">
              Le déploiement débute par <span className="text-white font-bold italic">Rabat</span>, centre
              névralgique de 2030, avant une expansion vers les 6 villes hôtes marocaines : Casablanca,
              Marrakech, Agadir, Fès et Tanger.
            </p>
            {/* Cities progress */}
            <div className="mt-7 space-y-3">
              {[
                { city: "Rabat",       pct: 100, color: "bg-[#facc15]" },
                { city: "Casablanca",  pct: 65,  color: "bg-[#facc15]/70" },
                { city: "Marrakech",   pct: 40,  color: "bg-[#facc15]/50" },
                { city: "Agadir",      pct: 20,  color: "bg-[#facc15]/30" },
              ].map(({ city, pct, color }) => (
                <div key={city}>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">
                    <span>{city}</span><span>{pct}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/5">
                    <motion.div className={`h-full rounded-full ${color}`}
                      initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }}
                      transition={{ duration: 0.8, ease: "easeOut" }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#facc15] animate-pulse" />
              <span className="text-[10px] font-bold text-[#facc15] uppercase tracking-widest">Phase 01 : Rabat Active</span>
            </div>
          </motion.div>
        </section>

        {/* ─── Tech Pillars ─── */}
        <section className="mt-6 grid gap-5 md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="group rounded-3xl border border-white/6 bg-white/[0.03] p-6 hover:border-[#facc15]/25 transition-all">
              <p.icon className="h-6 w-6 text-[#facc15] mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-black text-white uppercase tracking-tighter mb-2">{p.title}</h3>
              <p className="text-white/35 text-xs leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </section>

        {/* ─── CTA Banner ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="mt-12 rounded-[2rem] border border-[#facc15]/15 bg-gradient-to-r from-[#facc15]/8 via-[#facc15]/5 to-transparent p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-[#facc15]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#facc15]">Maroc 2030</span>
            </div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
              Prêt pour l&apos;expérience ?
            </h3>
            <p className="text-white/40 text-sm mt-1">Explorez les villes hôtes, les stades et les expériences uniques.</p>
          </div>
          <Link href="/experience"
            className="shrink-0 group flex items-center gap-2.5 rounded-xl bg-[#facc15] px-7 py-3.5 text-[11px] font-black uppercase tracking-widest text-black hover:scale-105 transition-all shadow-lg shadow-[#facc15]/30">
            Découvrir 2030 <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

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
