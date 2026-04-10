"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Globe, 
  Handshake, 
  MapPinned, 
  Cpu, 
  Shield, 
  ArrowRight, 
  Sparkles,
  Award
} from "lucide-react";

// Variants pour l'animation de la liste
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
};

export default function AProposPage() {
  return (
    <main className="relative min-h-full py-12 lg:py-20 overflow-hidden">
      
      <div className="mx-auto w-full max-w-6xl px-6 relative z-10">
        {/* HEADER SECTION */}
        <header className="flex flex-col gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 text-amber-500"
          >
            <div className="h-[1px] w-12 bg-amber-500/50" />
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Vision Globale</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black tracking-tighter leading-none"
          >
            L&apos;Héritage Marocain <br />
            <span className="text-amber-500 italic">Propulsé par 2030</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-zinc-400 max-w-2xl text-lg leading-relaxed"
          >
            Bien plus qu&apos;une application, une passerelle intelligente entre les supporters du monde entier 
            et l&apos;âme artisanale du Maroc. Nous redéfinissons l&apos;accueil à travers la technologie.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-4"
          >
            <Link
              href="/aide"
              className="group flex items-center gap-3 rounded-xl bg-amber-500 px-6 py-3 text-sm font-black text-black hover:scale-105 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]"
            >
              CENTRE D&apos;AIDE <ArrowRight className="h-4 w-4 stroke-[3px] transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/contact"
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition-all"
            >
              NOUS ÉCRIRE
            </Link>
          </motion.div>
        </header>

        {/* MISSION & PÉRIMÈTRE GRID */}
        <motion.section 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-20 grid gap-6 md:grid-cols-2"
        >
          <motion.div 
            variants={itemVariants}
            className="group relative rounded-[2rem] border border-amber-500/10 bg-black/40 p-8 backdrop-blur-xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Handshake size={80} className="text-amber-500" />
            </div>
            
            <div className="flex items-center gap-3 text-amber-500 mb-6">
              <Award className="h-6 w-6" />
              <h2 className="text-xl font-black uppercase tracking-tighter">Notre Mission</h2>
            </div>

            <ul className="space-y-4">
              {[
                "Mettre en lumière les artisans et coopératives locales",
                "Optimiser le flux des supporters via l'IA contextuelle",
                "Préserver et digitaliser le patrimoine culturel"
              ].map((item, i) => (
                <li key={i} className="flex gap-3 text-zinc-300 text-sm leading-relaxed">
                  <span className="text-amber-500 font-bold">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="rounded-[2rem] border border-white/5 bg-white/5 p-8 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 text-white mb-6">
              <MapPinned className="h-6 w-6 text-amber-500" />
              <h2 className="text-xl font-black uppercase tracking-tighter">Déploiement Piloté</h2>
            </div>

            <p className="text-zinc-400 text-sm leading-relaxed">
              Le déploiement débute par la capitale, <span className="text-white font-bold italic">Rabat</span>, 
              centre névralgique de 2030, avant une expansion algorithmique vers les 12 régions du Royaume.
            </p>
            
            <div className="mt-8 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Phase 01 : Rabat en cours</span>
            </div>
          </motion.div>
        </motion.section>

        {/* TECH PILLARS */}
        <motion.section 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-6 grid gap-6 md:grid-cols-3"
        >
          {[
            { icon: Cpu, title: "Algorithmes", desc: "Moteur de recommandation basé sur le timing des matchs." },
            { icon: Shield, title: "Confiance", desc: "Architecture micro-services sécurisée pour les données utilisateurs." },
            { icon: Globe, title: "Impact", desc: "Réinjection directe de la valeur dans l'économie de proximité." }
          ].map((pillar, i) => (
            <motion.div 
              key={i}
              variants={itemVariants}
              className="group rounded-3xl border border-white/5 bg-white/5 p-6 hover:border-amber-500/30 transition-all"
            >
              <pillar.icon className="h-6 w-6 text-amber-500 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-black text-white uppercase tracking-tighter mb-2">{pillar.title}</h3>
              <p className="text-zinc-500 text-xs leading-relaxed">{pillar.desc}</p>
            </motion.div>
          ))}
        </motion.section>

       
      </div>
    </main>
  );
}