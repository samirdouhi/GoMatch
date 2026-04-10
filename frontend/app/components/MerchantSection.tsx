"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Globe,
  MapPin,
  Megaphone,
  ShieldCheck,
  Store,
  Users,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  {
    icon: Users,
    title: "Audience Mondiale",
    desc: "Touchez des milliers de supporters et touristes lors de la Coupe du Monde 2030.",
  },
  {
    icon: MapPin,
    title: "Géo-visibilité",
    desc: "Votre commerce est mis en avant sur la carte selon la position des fans.",
  },
  {
    icon: Megaphone,
    title: "Marketing Local",
    desc: "Publiez vos menus du jour et horaires spéciaux en temps réel.",
  },
  {
    icon: BarChart3,
    title: "Insights Précis",
    desc: "Suivez vos statistiques de visites et clics via un tableau de bord intuitif.",
  },
];

const steps = [
  {
    title: "Configurez votre profil",
    desc: "Photos, horaires et localisation précise de votre établissement.",
  },
  {
    title: "Choisissez votre visibilité",
    desc: "Démarrez gratuitement ou boostez votre portée avec nos options premium.",
  },
  {
    title: "Accueillez le monde",
    desc: "Recevez des clients qualifiés selon leurs envies et leur trajet.",
  },
];

const faqs = [
  {
    q: "Est-ce gratuit de rejoindre GoMatch ?",
    a: "L'inscription de base est gratuite pour soutenir les artisans locaux. Des options de mise en avant sont disponibles.",
  },
  {
    q: "Quels commerces sont éligibles ?",
    a: "Restaurants, coopératives d'artisans, cafés et toute expérience valorisant la culture marocaine.",
  },
];

export function MerchantSection() {
  return (
    <section
      id="devenir-partenaire"
      className="relative overflow-hidden bg-black py-20 lg:py-32"
    >
      {/* Background avec effets de flou directionnels */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-[-10%] h-[600px] w-[600px] rounded-full bg-amber-600/10 blur-[120px]" />
        <div className="absolute bottom-1/4 right-[-10%] h-[600px] w-[600px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute inset-0 bg-black/40 backdrop-opacity-50" />
      </div>

      <div className="container relative mx-auto px-6">
        <div className="grid items-start gap-16 lg:grid-cols-2 lg:gap-24">
          
          {/* Texte de présentation (Gauche) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:sticky lg:top-32"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">
              <Store className="h-3.5 w-3.5" />
              Partenaires Professionnels
            </div>

            <h2 className="mt-8 text-4xl font-black tracking-tighter text-white sm:text-5xl lg:text-6xl uppercase italic leading-[0.9]">
              Digitalisez votre <br />
              <span className="text-amber-500 not-italic">Savoir-faire</span>
            </h2>

            <p className="mt-8 text-lg leading-relaxed text-zinc-400 font-medium max-w-lg">
              GoMatch connecte l&apos;artisanat et la gastronomie du Maroc aux flux de supporters internationaux. Valorisez votre patrimoine en 2030.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button className="h-14 rounded-2xl bg-amber-500 px-8 text-xs font-black uppercase tracking-widest text-black hover:scale-105 transition-all shadow-xl shadow-amber-500/20">
               <ArrowRight className="ml-2 h-4 w-4" />
                 <Link href="/ajouter-commerce">Inscrire mon commerce</Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-14 rounded-2xl border-white/10 bg-white/5 px-8 text-xs font-black uppercase tracking-widest text-white hover:bg-white/10 backdrop-blur-md"
              >
                <Link href="/businesses">Consulter l&apos;annuaire</Link>
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              <span className="flex items-center gap-2 text-emerald-500">
                <ShieldCheck className="h-4 w-4" /> Vérification 24h
              </span>
              <span className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-amber-500" /> Support Dédié
              </span>
            </div>
          </motion.div>

          {/* Cartes d'engagement (Droite) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            {/* Grille des avantages */}
            <div className="rounded-[2.5rem] border border-white/5 bg-white/5 p-8 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Pourquoi nous choisir ?</h3>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/40 border border-white/10 text-emerald-400">
                  <Globe className="h-5 w-5 animate-pulse" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {benefits.map((b, i) => {
                  const Icon = b.icon;
                  return (
                    <motion.div
                      key={i}
                      whileHover={{ y: -5 }}
                      className="rounded-2xl border border-white/5 bg-black/40 p-5 group transition-colors hover:border-amber-500/20"
                    >
                      <Icon className="h-5 w-5 text-amber-500 mb-4" />
                      <div className="font-black text-white uppercase tracking-tighter italic text-sm">
                        {b.title}
                      </div>
                      <div className="mt-2 text-[11px] text-zinc-500 leading-relaxed font-medium">{b.desc}</div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Processus d'inscription */}
            <div className="rounded-[2.5rem] border border-white/5 bg-black/40 p-8">
              <h3 className="text-sm font-black text-white uppercase tracking-widest italic mb-6">Parcours Partenaire</h3>
              <div className="space-y-6">
                {steps.map((s, i) => (
                  <div key={i} className="flex gap-5 relative">
                    <div className="flex-none h-8 w-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[10px] font-black text-amber-500">
                      0{i + 1}
                    </div>
                    <div>
                      <div className="font-black text-white uppercase tracking-tight text-xs mb-1">
                        {s.title}
                      </div>
                      <div className="text-xs text-zinc-500 font-medium leading-normal">{s.desc}</div>
                    </div>
                    {i < steps.length - 1 && (
                       <div className="absolute left-4 top-10 w-[1px] h-4 bg-white/10" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ simplifiée */}
            <div className="rounded-[2.5rem] border border-white/5 bg-white/5 p-8">
              <h3 className="text-sm font-black text-white uppercase tracking-widest italic mb-4">Questions fréquentes</h3>
              <div className="space-y-3">
                {faqs.map((f, i) => (
                  <details
                    key={i}
                    className="group rounded-xl border border-white/5 bg-black/20 p-4 transition-all hover:bg-black/40"
                  >
                    <summary className="cursor-pointer list-none text-[11px] font-black uppercase tracking-tight text-zinc-400 flex justify-between items-center group-open:text-amber-500">
                      {f.q}
                      <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
                    </summary>
                    <p className="mt-3 text-[11px] text-zinc-500 leading-relaxed font-medium pt-3 border-t border-white/5 italic">
                      {f.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
