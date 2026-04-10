"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Clock,
  HelpCircle,
  MapPin,
  Navigation,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: Ticket,
    title: "Choisissez votre match / ville",
    desc: "Sélectionnez la ville, le stade ou la fan zone. Vous pouvez aussi activer votre position.",
  },
  {
    icon: Sparkles,
    title: "Recevez des idées adaptées",
    desc: "Restaurants, cafés, artisans et expériences culturelles selon vos préférences et votre temps.",
  },
  {
    icon: MapPin,
    title: "Explorez sur la carte",
    desc: "Visualisez les lieux autour de vous, comparez la distance et repérez les meilleures options.",
  },
  {
    icon: Navigation,
    title: "Suivez l’itinéraire simple",
    desc: "Obtenez un trajet rapide pour arriver à temps : avant match, après match, ou le lendemain.",
  },
];

const features = [
  { icon: Store, title: "Adresses locales", desc: "Des lieux authentiques pour manger, acheter et découvrir." },
  { icon: ShieldCheck, title: "Commerces vérifiés", desc: "Sélectionnés pour la qualité, l’accueil et la fiabilité." },
  { icon: Clock, title: "Gagnez du temps", desc: "Suggestions rapides selon votre planning du jour." },
  { icon: Star, title: "Meilleures expériences", desc: "Enregistrez vos favoris et retrouvez-les facilement." },
];

const faqs = [
  {
    q: "Est-ce que ça marche sans compte ?",
    a: "Oui. Vous pouvez explorer et consulter. Le compte sert surtout à enregistrer vos favoris et préférences.",
  },
  {
    q: "Comment sont choisis les commerces ?",
    a: "Nous mettons en avant des commerces locaux avec un contrôle de base et un suivi des retours utilisateurs.",
  },
  {
    q: "Je suis pressé(e), je veux une idée rapide.",
    a: "Choisissez un temps (30 min / 1h / soirée) : on propose des options proches et faciles d’accès.",
  },
  {
    q: "Puis-je filtrer par type (café, artisan, culture) ?",
    a: "Oui. Vous pouvez filtrer par catégories et affiner avec vos préférences.",
  },
];

export function CommentCaMarcheSection() {
  return (
    <section
      id="comment-ca-marche"
      className="relative overflow-hidden bg-black py-14 sm:py-24"
    >
      {/* Background futuriste avec les couleurs Ambre/Emeraude du projet */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-44 left-1/4 h-[600px] w-[600px] rounded-full bg-amber-600/10 blur-[120px]" />
        <div className="absolute -bottom-44 right-[-5%] h-[600px] w-[600px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:60px_60px]" />
      </div>

      <div className="container relative mx-auto px-6">
        {/* Header style "Cockpit" */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">
            <HelpCircle className="h-3.5 w-3.5" />
            Guide Utilisateur • Système GoMatch
          </div>

          <h2 className="mt-8 text-4xl font-black tracking-tighter text-white sm:text-5xl lg:text-7xl uppercase italic">
            Comment ça <span className="text-amber-500 not-italic">marche ?</span>
          </h2>

          <p className="mt-6 text-base leading-relaxed text-zinc-400 sm:text-xl font-medium">
            Trouvez des adresses proches, gagnez du temps et vivez une expérience
            locale authentique au cœur du <span className="text-white italic">Maroc 2030</span>.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button className="h-14 w-full rounded-2xl bg-amber-500 px-8 text-sm font-black uppercase tracking-widest text-black hover:scale-105 transition-transform sm:w-auto">
              Commencer <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-14 w-full rounded-2xl border-white/10 bg-white/5 px-8 text-sm font-black uppercase tracking-widest text-white hover:bg-white/10 sm:w-auto shadow-xl backdrop-blur-md"
            >
              <Link href="/businesses">Voir les lieux</Link>
            </Button>
          </div>
        </motion.div>

        {/* Steps : Cartes avec effet de verre */}
        <div className="mx-auto mt-20 max-w-6xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="group relative rounded-[2.5rem] border border-white/5 bg-white/5 p-7 backdrop-blur-xl hover:border-amber-500/30 transition-all shadow-2xl"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Étape 0{idx + 1}</span>
                  </div>

                  <h3 className="text-lg font-black text-white uppercase tracking-tighter italic leading-none">
                    {s.title}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-zinc-500 font-medium">
                    {s.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Features : Section émeraude pour le contraste */}
        <div className="mx-auto mt-16 max-w-6xl">
          <div className="rounded-[3rem] border border-white/5 bg-white/5 p-8 sm:p-12 backdrop-blur-2xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic sm:text-3xl">
                  Ce que vous <span className="text-emerald-400">gagnez</span>
                </h3>
                <p className="mt-2 text-sm text-zinc-500 font-bold uppercase tracking-widest">
                  Optimisé pour les supporters de Maroc 2030
                </p>
              </div>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f, idx) => {
                const Icon = f.icon;
                return (
                  <div
                    key={idx}
                    className="rounded-3xl border border-white/5 bg-black/40 p-6 hover:bg-black/60 transition-colors"
                  >
                    <Icon className="h-6 w-6 text-emerald-400 mb-4" />
                    <div className="font-black text-white uppercase tracking-tighter italic">
                      {f.title}
                    </div>
                    <div className="mt-2 text-xs text-zinc-500 leading-relaxed font-medium">{f.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* FAQ stylisée comme le reste du site */}
        <div className="mx-auto mt-16 max-w-4xl">
          <div className="rounded-[3rem] border border-white/5 bg-black/20 p-8 backdrop-blur-md">
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic text-center mb-10">F.A.Q</h3>
            <div className="space-y-4">
              {faqs.map((item, idx) => (
                <details
                  key={idx}
                  className="group rounded-2xl border border-white/5 bg-white/5 p-5 transition-all hover:bg-white/[0.07] open:border-amber-500/30 open:bg-amber-500/[0.03]"
                >
                  <summary className="cursor-pointer list-none font-bold text-sm uppercase tracking-tight text-zinc-300 flex justify-between items-center group-open:text-amber-500 transition-colors">
                    {item.q}
                    <div className="h-6 w-6 rounded-lg bg-white/5 flex items-center justify-center text-xs transition-transform group-open:rotate-45">
                      +
                    </div>
                  </summary>
                  <p className="mt-4 text-sm leading-relaxed text-zinc-500 font-medium border-t border-white/5 pt-4">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>

        {/* Final CTA Holographique */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="mx-auto mt-20 max-w-6xl"
        >
          <div className="relative rounded-[3rem] overflow-hidden border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-emerald-500/5 p-10 sm:p-16 text-center shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50" />
            
            <h4 className="text-3xl font-black text-white uppercase tracking-tighter italic sm:text-5xl">
              Prêt à vivre <span className="text-amber-500">l&apos;immersion ?</span>
            </h4>
            <p className="mt-6 text-zinc-400 font-medium max-w-xl mx-auto text-lg">
              Lancez la carte et trouvez une adresse authentique en moins d’une minute.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row justify-center">
              <Button className="h-14 rounded-2xl bg-amber-500 px-10 text-xs font-black uppercase tracking-widest text-black hover:scale-105 transition-all">
                Explorer maintenant <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-14 rounded-2xl border-white/10 bg-black/20 px-10 text-xs font-black uppercase tracking-widest text-white hover:bg-white/5"
              >
                <Link href="/assistant">Suggestions IA</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

