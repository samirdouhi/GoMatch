"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HelpCircle, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  Ticket, 
  Mail, 
  ChevronRight,
  MessageSquare,
  Search,
  X
} from "lucide-react";

const faqs = [
  {
    q: "Comment l’app choisit les commerces recommandés ?",
    a: "Notre algorithme 2030 analyse votre géolocalisation en temps réel, le flux des supporters et vos préférences culturelles pour prioriser les artisans et coopératives locales.",
  },
  {
    q: "Je suis commerçant : comment apparaître dans l’application ?",
    a: "Accédez à l'espace 'Partenaires', complétez votre profil numérique et soumettez votre certification artisanale pour validation par nos services.",
  },
  {
    q: "Mes données sont-elles protégées ?",
    a: "Toutes les transactions et données de profil sont chiffrées de bout en bout via notre architecture micro-services sécurisée.",
  },
  {
    q: "Que faire si je ne vois pas ma ville ?",
    a: "Nous déployons actuellement le réseau sur les villes hôtes. Rabat est notre zone pilote, Casablanca et Marrakech suivront selon le calendrier officiel.",
  },
];

export default function AidePage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Filtrage dynamique des FAQs
  const filteredFaqs = useMemo(() => {
    return faqs.filter(
      (faq) => 
        faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
        faq.a.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <main className="relative min-h-full py-12 lg:py-20 overflow-hidden">
      <div className="mx-auto w-full max-w-6xl px-6 relative z-10">
        
        {/* HEADER : STYLE COCKPIT */}
        <header className="flex flex-col gap-6">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 text-amber-500"
          >
            <HelpCircle className="h-5 w-5 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Support Système</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl md:text-6xl font-black tracking-tighter text-white"
          >
            Besoin d&apos;une <span className="text-amber-500 italic">Assistance ?</span>
          </motion.h1>

          {/* BARRE DE RECHERCHE NÉON */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative max-w-md mt-4"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input 
              type="text"
              placeholder="Rechercher une solution..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-md transition-colors"
              >
                <X className="h-3 w-3 text-zinc-400" />
              </button>
            )}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-4 mt-2"
          >
            <Link
              href="/contact"
              className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-6 py-3 text-sm font-bold text-white hover:bg-amber-500 hover:text-black transition-all duration-300"
            >
              <Mail className="h-4 w-4" />
              CONTACTER LE SUPPORT
            </Link>
            <Link
              href="/a-propos"
              className="flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 text-sm font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all"
            >
              <Sparkles className="h-4 w-4" />
              VOIR LA VISION 2030
            </Link>
          </motion.div>
        </header>

        {/* CARTES DE NAVIGATION RAPIDE */}
        <section className="mt-16 grid gap-6 md:grid-cols-3">
          {[
            { icon: MapPin, title: "Découvrir", text: "Explorez les trésors cachés du Maroc authentique via notre carte interactive." },
            { icon: Ticket, title: "Mode Match", text: "Synchronisez votre agenda de supporter avec les commerces locaux." },
            { icon: ShieldCheck, title: "Sécurité", text: "Protocoles de protection des données et guide de bonne conduite." }
          ].map((card, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="group rounded-[2rem] border border-white/5 bg-white/5 p-8 backdrop-blur-xl hover:border-amber-500/30 transition-all"
            >
              <card.icon className="h-8 w-8 text-amber-500 mb-6 group-hover:scale-110 transition-transform" />
              <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-3">{card.title}</h2>
              <p className="text-zinc-500 text-sm leading-relaxed">{card.text}</p>
            </motion.div>
          ))}
        </section>

        {/* FAQ SECTION */}
        <section className="mt-20">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="flex items-center gap-2 text-white/90">
              <MessageSquare className="h-5 w-5 text-amber-500" />
              <h2 className="text-2xl font-black uppercase tracking-tighter italic text-amber-500">F.A.Q</h2>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((item) => (
                  <motion.div
                    key={item.q}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    layout
                  >
                    <FaqItem question={item.q} answer={item.a} />
                  </motion.div>
                ))
              ) : (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-zinc-500 py-10 italic"
                >
                  Aucun résultat ne correspond à votre recherche...
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </section>

        <footer className="mt-20 text-center opacity-40">
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.5em]">
            GoMatch 2030 - Votre guide de confiance pour une expérience authentique au Maroc
          </p>
        </footer>
      </div>
    </main>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className={`rounded-2xl border transition-all duration-500 ${
        isOpen ? "border-amber-500/50 bg-amber-500/5 shadow-[0_0_30px_rgba(245,158,11,0.1)]" : "border-white/5 bg-black/20"
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-5 text-left transition-all"
      >
        <span className={`text-sm font-bold tracking-tight ${isOpen ? "text-amber-500" : "text-white/80"}`}>
          {question}
        </span>
        <ChevronRight className={`h-5 w-5 transition-transform duration-300 ${isOpen ? "rotate-90 text-amber-500" : "text-zinc-600"}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-5 pt-0 text-sm text-zinc-400 leading-relaxed border-t border-white/5">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}