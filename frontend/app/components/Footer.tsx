"use client";

import Link from "next/link";
import { MapPin, Mail, Phone, ArrowRight, Store, Sparkles, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";


function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-black text-white">
      {/* Background Glows - Harmonisation Ambre/Rouge */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-amber-600/10 blur-[100px]" />
        <div className="absolute -bottom-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-red-600/5 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.7),rgba(0,0,0,1))]" />
      </div>

      <div className="container relative mx-auto px-4 pt-14 sm:pt-16">
        {/* CTA block - Style Glassmorphism Ambre */}
        <div className="rounded-[2rem] border border-amber-500/10 bg-gradient-to-br from-amber-500/[0.07] to-red-600/[0.03] p-6 backdrop-blur-md sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
                <Store className="h-4 w-4" />
                Partenaires Locaux
              </div>
              <h3 className="mt-4 text-xl font-bold tracking-tight text-white sm:text-2xl">
                Valorisez votre établissement pour <span className="text-amber-500">2030</span>.
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400 sm:text-base">
                Rejoignez la plateforme de référence pour les supporters. Soyez visible auprès des milliers de visiteurs qui exploreront le Maroc.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                className="h-12 rounded-2xl bg-amber-500 px-8 font-bold text-black hover:bg-amber-400"
                onClick={() => scrollToId("devenir-partenaire")}
              >
                Inscrire mon commerce <ArrowRight className="ml-2 h-4 w-4 stroke-[3px]" />
              </Button>

              <Button
                variant="outline"
                className="h-12 rounded-2xl border-white/10 bg-white/5 px-8 text-white hover:bg-white/10"
                onClick={() => scrollToId("match-plans")}
              >
                Explorer le guide
              </Button>
            </div>
          </div>
        </div>

        {/* Main footer grid */}
        <div className="mt-16 grid gap-10 border-t border-white/5 pt-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20">
                <Sparkles className="h-5 w-5 text-amber-500" />
              </div>
              <div className="text-xl font-black tracking-tighter">GOMATCH</div>
            </div>
            <p className="text-sm leading-relaxed text-zinc-500">
              Votre compagnon digital pour une expérience authentique durant la Coupe du Monde 2030 au Maroc.
            </p>

            <div className="space-y-3 pt-2 text-sm text-zinc-400">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-amber-500/70" />
                <span>Rabat • Casa • Marrakech • Tanger</span>
              </div>
              <div className="flex items-center gap-3 group">
                <Mail className="h-4 w-4 text-amber-500/70" />
                <a className="transition-colors hover:text-amber-500" href="mailto:contact@gomatch.ma">
                  contact@gomatch.ma
                </a>
              </div>
              {/* ✅ Utilisation de l'icône Phone ici */}
              <div className="flex items-center gap-3 group">
                <Phone className="h-4 w-4 text-amber-500/70" />
                <a className="transition-colors hover:text-amber-500" href="tel:+212600000000">
                  +212 6 00 00 00 00
                </a>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-amber-500/80">Navigation</div>
            <ul className="mt-4 space-y-3 text-sm text-zinc-500">
              <li>
                <button
                  className="flex items-center gap-2 transition-colors hover:text-white"
                  onClick={() => scrollToId("matches")}
                >
                  <Calendar className="h-4 w-4 text-zinc-600" />
                  Matchs à Rabat
                </button>
              </li>
              <li>
                <button
                  className="flex items-center gap-2 transition-colors hover:text-white"
                  onClick={() => scrollToId("match-plans")}
                >
                  <Clock className="h-4 w-4 text-zinc-600" />
                  Itinéraires Supporters
                </button>
              </li>
              <li>
                <button className="hover:text-white transition-colors" onClick={() => scrollToId("comment-ca-marche")}>
                  Concept GoMatch
                </button>
              </li>
            </ul>
          </div>

          {/* Explorer */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-amber-500/80">Découvrir</div>
            <ul className="mt-4 space-y-3 text-sm text-zinc-500">
              <li>
                <Link className="hover:text-white transition-colors" href="/events">Calendrier Événements</Link>
              </li>
              <li>
                <Link className="hover:text-white transition-colors" href="/businesses">Artisans & Coopératives</Link>
              </li>
              <li>
                <Link className="hover:text-white transition-colors" href="/culture">Patrimoine Marocain</Link>
              </li>
              <li>
                <Link className="hover:text-white transition-colors" href="/map">Carte interactive</Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-amber-500/80">Légal</div>
            <ul className="mt-4 space-y-3 text-sm text-zinc-500">
              <li>
                <Link className="hover:text-white transition-colors" href="/privacy">Confidentialité</Link>
              </li>
              <li>
                <Link className="hover:text-white transition-colors" href="/terms">CGU</Link>
              </li>
              <li>
                <Link className="hover:text-white transition-colors" href="/contact">Support Client</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/5 py-8 text-[11px] font-medium uppercase tracking-wider text-zinc-600 sm:flex-row">
          <div>© {year} GoMatch. Valorisons l&apos;artisanat marocain.</div>
          <div className="flex items-center gap-3">
            <span className="text-zinc-700 italic">Vision Mondiale</span>
            <span className="h-px w-8 bg-zinc-800" />
            <span className="rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1 text-amber-500/80 backdrop-blur-sm">
              MAROC 2030
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
